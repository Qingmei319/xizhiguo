import { Alert, Button, Card, Col, Input, Modal, Row, Space, Statistic, Table, Tag, message as antdMessage } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { correctAdminLog, getAdminLogs, getAdminStats, type AdminLogItem, type AdminStats } from '@/services/admin.service';
import { reportApiError } from '@/services/http';
import './index.less';

export function AdminLogsPage() {
  const [items, setItems] = useState<AdminLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<AdminLogItem | null>(null);
  const [correction, setCorrection] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const initRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    const [logsResult, statsResult] = await Promise.allSettled([
      getAdminLogs({ page: 1, page_size: 20, keyword: keyword.trim() || undefined }),
      getAdminStats(),
    ]);

    if (logsResult.status === 'fulfilled') {
      setItems(logsResult.value.data);
      setLogsError(null);
    } else {
      setItems([]);
      setLogsError(reportApiError(logsResult.reason, '问答日志加载失败'));
    }

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value);
      setStatsError(null);
    } else {
      setStats(null);
      setStatsError(reportApiError(statsResult.reason, '统计信息加载失败'));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    refresh();
  }, []);

  const columns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 80 },
      { title: '问题', dataIndex: 'question' },
      {
        title: '纠错状态',
        dataIndex: 'is_corrected',
        width: 120,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '已纠错' : '未纠错'}</Tag>,
      },
      { title: '工具', dataIndex: 'tool_used', width: 120, render: (value: string | null) => value || '-' },
      { title: '时间', dataIndex: 'created_at', width: 180, render: (value: string | null) => value || '-' },
      {
        title: '操作',
        width: 120,
        render: (_: unknown, record: AdminLogItem) => (
          <Button
            type="link"
            onClick={() => {
              setEditing(record);
              setCorrection(record.correction || '');
            }}
          >
            纠错
          </Button>
        ),
      },
    ],
    [],
  );

  const submitCorrection = async () => {
    if (!editing) return;
    if (!correction.trim()) {
      antdMessage.warning('请输入纠错内容');
      return;
    }
    try {
      await correctAdminLog(editing.id, correction.trim());
      antdMessage.success('纠错已提交');
      setEditing(null);
      setCorrection('');
      refresh();
    } catch (error) {
      reportApiError(error, '纠错提交失败');
    }
  };

  return (
    <div className="admin-page">
      <Row gutter={16}>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="日志总数" value={stats?.chat_logs.total ?? '-'} /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="已纠错" value={stats?.chat_logs.corrected ?? '-'} /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="知识库总数" value={stats?.knowledge_bases.total ?? '-'} /></Card></Col>
      </Row>

      {(logsError || statsError) && <Alert type="warning" showIcon message="部分数据加载失败" description={logsError || statsError || ''} />}

      <Card className="admin-card admin-block">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="关键词搜索"
          />
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns as never}
          dataSource={items}
          pagination={false}
          locale={{ emptyText: logsError ? '日志接口异常，当前仅显示空状态' : '暂无数据' }}
        />
      </Card>

      <Modal
        open={Boolean(editing)}
        title="纠错问答记录"
        okText="提交"
        cancelText="取消"
        onOk={submitCorrection}
        onCancel={() => setEditing(null)}
      >
        <Input.TextArea rows={6} value={correction} onChange={(e) => setCorrection(e.target.value)} placeholder="请输入纠错内容" />
      </Modal>
    </div>
  );
}
