/**
 * @file 数据总览（Dashboard）Mock 数据
 * @description 提供数据大屏所需的全部模拟数据，包括：
 *   - KnowledgeDomainItem / ServiceCoverageItem：知识领域饼图和服务覆盖热力图数据结构
 *   - dashboardOverview：顶部概览统计卡片数据（今日问答、在线专家、覆盖产区、预警响应率）
 *   - dashboardMetrics：四个核心指标卡数据（实时问答、活跃专家、知识库文档、助农覆盖农户）
 *   - alertList：病虫害预警列表
 *   - rankingList：品种热度排行数据
 *   - trendData / trendLabels：问答趋势折线图数据
 *   - knowledgeDomainData：知识领域分布饼图数据
 *   - serviceCoverageList：五省服务覆盖热力图数据
 */
import type { AlertItem, MetricItem, OverviewStatItem, RankingItem } from '@/types/dashboard';

/** 知识领域分布项 —— 饼图每段的数据结构 */
export interface KnowledgeDomainItem {
  /** 领域名称，如 '果蔬育种' */
  name: string;
  /** 占比百分比 */
  value: number;
}

/** 服务覆盖项 —— 热力图中每个省份的数据结构 */
export interface ServiceCoverageItem {
  /** 省份名称 */
  region: string;
  /** 服务覆盖率百分比 */
  percent: number;
  /** 覆盖农户数 */
  households: number;
  /** 热度指数（0~100） */
  heat: number;
  /** 热力图 X 坐标（百分比） */
  x: number;
  /** 热力图 Y 坐标（百分比） */
  y: number;
  /** 覆盖城市数 */
  cities: number;
}

/** 顶部概览统计 —— 四枚统计卡片数据 */
export const dashboardOverview: OverviewStatItem[] = [
  { label: '今日新增问答', value: '8,765', suffix: '次' },
  { label: '在线专家', value: '326', suffix: '人' },
  { label: '覆盖产区', value: '42', suffix: '个' },
  { label: '预警响应率', value: '96.8', suffix: '%' },
];

/** 四枚核心指标卡 —— 含数值、趋势、颜色和迷你折线图数据 */
export const dashboardMetrics: MetricItem[] = [
  { title: '实时问答总量', value: '128,560', trend: '+12.5%', color: '#1f8bff', sparkline: [12, 16, 14, 22, 19, 25, 31, 28, 36, 42] },
  { title: '活跃专家智库', value: '1,248', trend: '+8.3%', color: '#8f5cff', sparkline: [8, 12, 11, 16, 15, 21, 20, 26, 24, 29] },
  { title: '知识库文档', value: '45,782', trend: '+5.7%', color: '#36a3ff', sparkline: [18, 19, 17, 23, 22, 28, 24, 31, 30, 35] },
  { title: '助农覆盖农户', value: '2,356,789', trend: '+9.1%', color: '#28d881', sparkline: [10, 14, 18, 16, 23, 22, 30, 27, 34, 40] },
];

/** 病虫害预警列表 —— 五条不同等级的实时预警 */
export const alertList: AlertItem[] = [
  { title: '草地贪夜蛾暴发预警', location: '广东省 湛江市 廉江市', level: '高风险', time: '5 分钟前' },
  { title: '柑橘黄龙病扩散预警', location: '广西壮族自治区 南宁市 武鸣区', level: '中风险', time: '12 分钟前' },
  { title: '番茄晚疫病暴发预警', location: '云南省 红河州 建水县', level: '高风险', time: '18 分钟前' },
  { title: '香蕉枯萎病预警', location: '福建省 漳州市 东山县', level: '中风险', time: '25 分钟前' },
  { title: '荔枝霜疫霉病区域预警', location: '海南省 海口市 琼山区', level: '中风险', time: '32 分钟前' },
];

/** 品种热度排行 —— 前五名品种的问答量与趋势 */
export const rankingList: RankingItem[] = [
  { name: '阳光玫瑰葡萄', value: 8765, trend: '+12.5%' },
  { name: '赣南脐橙', value: 7542, trend: '+8.3%' },
  { name: '金都一号火龙果', value: 6231, trend: '-3.2%' },
  { name: '台农芒果', value: 5978, trend: '+15.6%' },
  { name: '中蕉9号马铃薯', value: 4862, trend: '+6.7%' },
];

/** 问答趋势折线图数据 —— 14 天的问答量序列，起伏更明显 */
export const trendData = [3900, 7200, 4100, 9100, 5300, 8700, 6900, 10800, 5100, 9600, 7200, 11400, 8500, 12800];

/** 问答趋势 X 轴标签 —— 对应 trendData 的日期 */
export const trendLabels = ['5/06', '5/07', '5/08', '5/09', '5/10', '5/11', '5/12', '5/13', '5/14', '5/15', '5/16', '5/17', '5/18', '5/19'];

/** 趋势时间范围选项 —— 图表顶部筛选按钮 */
export const trendRangeOptions = ['7天', '30天', '90天'];

/** 知识领域分布饼图数据 —— 四个领域及占比 */
export const knowledgeDomainData: KnowledgeDomainItem[] = [
  { value: 28.7, name: '果蔬育种' },
  { value: 23.1, name: '基因测序' },
  { value: 26.3, name: '病害防治' },
  { value: 21.9, name: '栽培技术' },
];

/** 五省服务覆盖热力图数据 —— 含覆盖率、农户数、城市数和坐标 */
export const serviceCoverageList: ServiceCoverageItem[] = [
  { region: '广东省', percent: 93, households: 485672, heat: 92, x: 73, y: 66, cities: 21 },
  { region: '广西壮族自治区', percent: 88, households: 382451, heat: 88, x: 61, y: 72, cities: 14 },
  { region: '云南省', percent: 85, households: 298765, heat: 85, x: 47, y: 66, cities: 16 },
  { region: '福建省', percent: 82, households: 215982, heat: 82, x: 79, y: 55, cities: 9 },
  { region: '海南省', percent: 80, households: 198654, heat: 80, x: 67, y: 84, cities: 6 },
];
