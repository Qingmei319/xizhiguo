/**
 * 数据总览页面（Dashboard）
 *
 * 平台的核心数据驾驶舱页面，聚合展示问答总量、专家智库、知识库文档、
 * 助农覆盖等关键指标，并提供病虫害预警、服务覆盖热力图、品种排行等可视化图表。
 *
 * 页面结构自上而下分为：
 * 1. Hero 摘要区 — 背景图 + 标题 + 实时状态胶囊 + 概览统计
 * 2. 指标卡片行 — 四个核心 KPI 卡片
 * 3. 中部双栏 — 问答趋势折线图 + 病虫害预警列表
 * 4. 底部三栏 — 知识领域饼图 + 服务覆盖热力图 + 品种贡献排行
 *
 * @module features/dashboard
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import ReactECharts from 'echarts-for-react';
import { AppstoreOutlined, DownOutlined, FileTextOutlined, InfoCircleOutlined, MessageOutlined, RightOutlined, TeamOutlined, WarningFilled } from '@ant-design/icons';
import { Card, List, Modal, Segmented, Select, Space, Tag, Typography } from 'antd';
import { ChartPanel } from '@/components/common/ChartPanel';
import { MetricCard } from '@/components/common/MetricCard';
import {
  alertList,
  dashboardOverview,
  dashboardMetrics,
  knowledgeDomainData,
  rankingList,
  serviceCoverageList,
  trendData,
  trendLabels,
  trendRangeOptions,
} from '@/services/mock/dashboard.mock';
import { getDashboardOverview, getDashboardTrends, getDashboardWarnings, getKnowledgeDistribution, getQaRanking } from '@/services/dashboard.service';
import { reportApiError } from '@/services/http';
import type { AlertItem, MetricItem, OverviewStatItem } from '@/types/dashboard';
import type { KnowledgeDomainItem } from '@/services/mock/dashboard.mock';
import './index.less';

/** 四个指标卡片对应的图标 */
const metricIcons = [<MessageOutlined />, <TeamOutlined />, <FileTextOutlined />, <AppstoreOutlined />];
/** 知识领域饼图的配色方案 */
const pieColors = ['#1f8bff', '#8f5cff', '#28d881', '#ff9f2d'];

/**
 * 数据总览页面
 *
 * 使用 ECharts 渲染趋势折线图和领域饼图，
 * 通过 Ant Design 的 List 组件展示预警列表和品种排行，
 * 所有数据来自 mock 模拟数据。
 */
export function DashboardPage() {
  const [overviewStats, setOverviewStats] = useState<OverviewStatItem[]>(dashboardOverview);
  const [metricCards, setMetricCards] = useState<MetricItem[]>(dashboardMetrics);
  const [warningItems, setWarningItems] = useState<AlertItem[]>(alertList);
  const [domainItems, setDomainItems] = useState<KnowledgeDomainItem[]>(knowledgeDomainData);
  const [knowledgeTotal, setKnowledgeTotal] = useState(45782);
  const [knowledgeUpdateTime, setKnowledgeUpdateTime] = useState('2025-05-19 10:30');
  const [rankItems, setRankItems] = useState(rankingList);
  const [selectedRankingRange, setSelectedRankingRange] = useState(30);
  const [allRankItems, setAllRankItems] = useState(rankingList);
  const [rankingModalOpen, setRankingModalOpen] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [allWarningItems, setAllWarningItems] = useState<AlertItem[]>([]);
  const [warningsModalOpen, setWarningsModalOpen] = useState(false);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [selectedTrendRange, setSelectedTrendRange] = useState('7天');
  const [chartLabels, setChartLabels] = useState(trendLabels);
  const [chartData, setChartData] = useState(trendData);
  // 计算排行最大值，用于进度条宽度比例计算
  const maxRankValue = Math.max(...rankItems.map((item) => item.value), 1);

  useEffect(() => {
    getDashboardOverview()
      .then((data) => {
        if (data.overview.length > 0) setOverviewStats(data.overview);
        if (data.metrics.length > 0) setMetricCards(data.metrics);
      })
      .catch((error) => reportApiError(error, '数据总览统计获取失败'));

    getDashboardWarnings(5)
      .then((items) => {
        if (items.length > 0) setWarningItems(items);
      })
      .catch((error) => reportApiError(error, '病虫害预警获取失败'));

    getKnowledgeDistribution()
      .then((data) => {
        if (data.items.length > 0) setDomainItems(data.items);
        if (data.total > 0) setKnowledgeTotal(data.total);
        if (data.updateTime) setKnowledgeUpdateTime(data.updateTime);
      })
      .catch((error) => reportApiError(error, '知识库分布获取失败'));

  }, []);

  useEffect(() => {
    getQaRanking(selectedRankingRange, 5)
      .then((items) => {
        if (items.length > 0) setRankItems(items);
      })
      .catch((error) => reportApiError(error, '问答排行获取失败'));
  }, [selectedRankingRange]);

  useEffect(() => {
    const days = Number.parseInt(selectedTrendRange, 10) || 7;
    getDashboardTrends(days)
      .then((data) => {
        if (data.labels.length > 0 && data.data.length > 0) {
          setChartLabels(data.labels);
          setChartData(data.data);
        }
      })
      .catch((error) => reportApiError(error, '问答趋势获取失败'));
  }, [selectedTrendRange]);

  const openWarningsModal = async () => {
    setWarningsModalOpen(true);
    setWarningsLoading(true);
    try {
      const items = await getDashboardWarnings(50);
      setAllWarningItems(items.length > 0 ? items : warningItems);
    } catch (error) {
      reportApiError(error, '全部预警获取失败');
      setAllWarningItems(warningItems);
    } finally {
      setWarningsLoading(false);
    }
  };

  const openRankingModal = async () => {
    setRankingModalOpen(true);
    setRankingLoading(true);
    try {
      const items = await getQaRanking(selectedRankingRange, 20);
      setAllRankItems(items.length > 0 ? items : rankItems);
    } catch (error) {
      reportApiError(error, '全部品种排行获取失败');
      setAllRankItems(rankItems);
    } finally {
      setRankingLoading(false);
    }
  };

  /** ECharts 问答趋势折线图配置 */
  const trendOption = useMemo(() => ({
    backgroundColor: 'transparent',
    color: ['#2d96ff'],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(3, 10, 22, 0.92)',
      borderColor: 'rgba(71, 166, 255, 0.72)',
      textStyle: { color: '#eaf4ff' },
      axisPointer: { lineStyle: { color: 'rgba(71, 166, 255, 0.62)' } },
    },
    grid: { left: 42, right: 18, top: 30, bottom: 34 },
    legend: {
      top: 2,
      left: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#8aa1bb', fontSize: 12 },
      data: ['问答总量'],
    },
    xAxis: {
      type: 'category',
      data: chartLabels,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(93, 170, 255, 0.45)' } },
      axisLabel: { color: '#9db4d0' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9db4d0' },
      splitLine: { lineStyle: { color: 'rgba(128,172,223,.15)', type: 'dashed' } },
    },
    series: [
      {
        name: '问答总量',
        type: 'line',
        smooth: false,
        data: chartData,
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(31, 139, 255, 0.42)' },
              { offset: 1, color: 'rgba(31, 139, 255, 0.02)' },
            ],
          },
        },
        lineStyle: {
          color: '#2d96ff',
          width: 2,
        },
        itemStyle: {
          color: '#2d96ff',
          borderColor: '#2d96ff',
          borderWidth: 2,
        },
      },
    ],
  }), [chartData, chartLabels]);

  /** ECharts 知识领域分布饼图配置 */
  const pieOption = {
    color: pieColors,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(3, 10, 22, 0.92)',
      borderColor: 'rgba(71, 166, 255, 0.72)',
      textStyle: { color: '#eaf4ff' },
    },
    legend: {
      show: false,
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: '#cbd8ea' },
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: 'rgba(2, 8, 18, 0.85)',
          borderWidth: 3,
          shadowBlur: 18,
          shadowColor: 'rgba(31, 139, 255, 0.26)',
        },
        data: domainItems,
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `总计\n${knowledgeTotal.toLocaleString()}`,
          fill: '#f4f8ff',
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 22,
          textAlign: 'center',
        },
      },
    ],
  };

  return (
    <div className="dashboard-page stack">
      {/* 顶部大屏摘要区：背景图、标题文案和右侧统计条在 dashboard/index.less 中调整。 */}
      <section className="dashboard-hero image-scene">
        <div className="hero-copy">
          {/* <Typography.Text className="dashboard-eyebrow">Yago Intellect mock operation center</Typography.Text> */}
          <Typography.Title level={2}>亚热带水果数据总览</Typography.Title>
          <Typography.Paragraph>模拟平台问答、知识库、专家服务、病虫害预警与产区覆盖态势。</Typography.Paragraph>
          <div className="hero-status-line">
            <span>RAG 知识检索在线</span>
            <span>专家响应通道正常</span>
            <span>病虫害预警同步中</span>
          </div>
        </div>
        <div className="overview-strip">
          {overviewStats.map((item) => (
            <div key={item.label} className="overview-stat">
              <span>{item.label}</span>
              <strong>
                {item.value}
                {item.suffix && <small>{item.suffix}</small>}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* 四个核心指标卡片：图标、数值和卡片发光样式由 MetricCard + dashboard 样式控制。 */}
      <div className="grid-4">
        {metricCards.map((item, index) => (
          <MetricCard key={item.title} {...item} icon={metricIcons[index]} />
        ))}
      </div>
      {/* 中部区域：左侧趋势图，右侧病虫害预警列表。 */}
      <div className="dashboard-grid">
        <ChartPanel title="亚热带水果问答趋势">
          <InfoCircleOutlined className="trend-info-icon" />
          <Segmented options={trendRangeOptions} value={selectedTrendRange} onChange={(value) => setSelectedTrendRange(String(value))} className="chart-switch" />
          <ReactECharts option={trendOption} style={{ height: 220 }} />
        </ChartPanel>
        <Card className="glow-card alert-panel">
          <div className="panel-title-row">
            <Typography.Title level={4}>病虫害暴发预警 <span className="alert-live-dot" /> <small>实时更新</small></Typography.Title>
            <Space size={6}>
              <button className="alert-more" type="button" onClick={openWarningsModal}>查看全部 <RightOutlined /></button>
            </Space>
          </div>
          <List
            dataSource={warningItems.slice(0, 5)}
            renderItem={(item) => (
              <List.Item className={`alert-row ${item.level === '高风险' ? 'danger' : 'warning'}`}>
                <List.Item.Meta
                  avatar={<WarningFilled className={item.level === '高风险' ? 'danger-icon' : 'warning-icon'} />}
                  title={
                    <Space>
                      {item.title}
                      <Tag color={item.level === '高风险' ? 'red' : 'orange'}>{item.level}</Tag>
                    </Space>
                  }
                  description={item.location}
                />
                <Typography.Text type="secondary">{item.time}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>
      </div>
      <Modal
        title="病虫害暴发预警"
        open={warningsModalOpen}
        onCancel={() => setWarningsModalOpen(false)}
        footer={null}
        width={760}
      >
        <List
          loading={warningsLoading}
          dataSource={allWarningItems}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<WarningFilled className={item.level === '高风险' ? 'danger-icon' : 'warning-icon'} />}
                title={
                  <Space>
                    {item.title}
                    <Tag color={item.level === '高风险' ? 'red' : 'orange'}>{item.level}</Tag>
                  </Space>
                }
                description={item.location}
              />
              <Typography.Text type="secondary">{item.time}</Typography.Text>
            </List.Item>
          )}
        />
      </Modal>
      {/* 底部区域：知识领域饼图、服务覆盖地图、品种贡献排行。 */}
      <div className="dashboard-bottom-grid">
        <ChartPanel title="知识图谱领域分布">
          <InfoCircleOutlined className="panel-info-icon" />
          <div className="domain-panel">
            <ReactECharts option={pieOption} className="domain-chart" />
            <div className="domain-list">
              {domainItems.map((item, index) => (
                <div key={item.name} className="domain-row">
                  <span style={{ background: pieColors[index] }} />
                  <strong>{item.name}</strong>
                  <em>{item.value}%</em>
                </div>
              ))}
            </div>
            <div className="domain-update">更新时间：{knowledgeUpdateTime} <span>↻</span></div>
          </div>
        </ChartPanel>
        <ChartPanel title="亚热带水果产区服务覆盖">
          <InfoCircleOutlined className="panel-info-icon" />
          <div className="coverage-panel">
            <div className="coverage-map" aria-hidden="true">
              <div className="map-scanline" />
              <div className="map-grid-glow" />
              {serviceCoverageList.map((item) => (
                <span
                  key={item.region}
                  className="heat-point"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    '--heat-size': `${28 + item.heat * 0.26}px`,
                  } as CSSProperties}
                >
                  <i>{item.region.replace('壮族自治区', '')}</i>
                </span>
              ))}
              <div className="heat-legend">
                <span>覆盖强度</span>
                <em>低</em>
                <b />
                <em>高</em>
              </div>
            </div>
            <div className="coverage-list">
              <div className="coverage-list-head">服务覆盖 TOP5 地区</div>
              {serviceCoverageList.map((item, index) => (
                <div key={item.region} className="coverage-row">
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.region}</strong>
                    <small>覆盖农户 {item.households.toLocaleString()}</small>
                  </div>
                  <em>{item.percent.toFixed(1)}%</em>
                </div>
              ))}
            </div>
          </div>
        </ChartPanel>
        <Card className="glow-card ranking-panel">
          <div className="panel-title-row">
            <Typography.Title level={4}>水果品种贡献排行 <InfoCircleOutlined className="inline-info-icon" /></Typography.Title>
            <Select
              size="small"
              value={selectedRankingRange}
              options={[
                { label: '近7天', value: 7 },
                { label: '近30天', value: 30 },
                { label: '近90天', value: 90 },
              ]}
              suffixIcon={<DownOutlined />}
              onChange={setSelectedRankingRange}
              style={{ width: 92 }}
            />
          </div>
          <div className="ranking-head">
            <span>排名</span>
            <span>品种名称</span>
            <span>问答贡献量（次）</span>
            <span>趋势</span>
          </div>
          <List
            dataSource={rankItems}
            renderItem={(item, index) => (
              <List.Item className="rank-row">
                <Tag color={index < 3 ? 'gold' : 'blue'} className="rank-badge">{index + 1}</Tag>
                <div className="rank-main">
                  <span>{item.name}</span>
                  <div className="rank-track">
                    <span style={{ width: `${(item.value / maxRankValue) * 100}%` }} />
                  </div>
                </div>
                <strong className="rank-count">{item.value.toLocaleString()}</strong>
                <Typography.Text className={`rank-trend ${item.trend.startsWith('-') ? 'down' : 'up'}`}>{item.trend}</Typography.Text>
              </List.Item>
            )}
          />
          <button className="ranking-more" type="button" onClick={openRankingModal}>查看全部品种排行 <RightOutlined /></button>
        </Card>
      </div>
      <Modal
        title={`水果品种贡献排行 · 近${selectedRankingRange}天`}
        open={rankingModalOpen}
        onCancel={() => setRankingModalOpen(false)}
        footer={null}
        width={760}
      >
        <List
          loading={rankingLoading}
          dataSource={allRankItems}
          renderItem={(item, index) => (
            <List.Item>
              <Tag color={index < 3 ? 'gold' : 'blue'} className="rank-badge">{index + 1}</Tag>
              <div className="rank-main">
                <span>{item.name}</span>
                <div className="rank-track">
                  <span style={{ width: `${(item.value / Math.max(...allRankItems.map((rank) => rank.value), 1)) * 100}%` }} />
                </div>
              </div>
              <strong className="rank-count">{item.value.toLocaleString()}</strong>
              <Typography.Text className={`rank-trend ${item.trend.startsWith('-') ? 'down' : 'up'}`}>{item.trend}</Typography.Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
