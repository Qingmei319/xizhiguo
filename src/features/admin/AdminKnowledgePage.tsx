import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Upload, message as antdMessage } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAdminStats, type AdminStats } from '@/services/admin.service';
import {
  deleteKnowledgeBase,
  deleteKnowledgeDocument,
  getKnowledgeBasesAdmin,
  getKnowledgeDocuments,
  uploadKnowledgeDocument,
  type KnowledgeBaseItem,
  type KnowledgeDocumentItem,
} from '@/services/knowledge-admin.service';
import { reportApiError } from '@/services/http';
import './index.less';

export function AdminKnowledgePage() {
  const [bases, setBases] = useState<KnowledgeBaseItem[]>([]);
  const [docs, setDocs] = useState<KnowledgeDocumentItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form] = Form.useForm();
  const [basesError, setBasesError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const initRef = useRef(false);

  const refresh = async () => {
    setLoading(true);
    const [basesResult, docsResult, statsResult] = await Promise.allSettled([
      getKnowledgeBasesAdmin(),
      getKnowledgeDocuments(),
      getAdminStats(),
    ]);

    if (basesResult.status === 'fulfilled') {
      setBases(basesResult.value.data);
      setBasesError(null);
    } else {
      setBases([]);
      setBasesError(reportApiError(basesResult.reason, '知识库加载失败'));
    }

    if (docsResult.status === 'fulfilled') {
      setDocs(docsResult.value.data);
      setDocsError(null);
    } else {
      setDocs([]);
      setDocsError(reportApiError(docsResult.reason, '文档列表加载失败'));
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

  const submitUpload = async () => {
    let values: { kb_id: number; title: string; source_type?: string; description?: string; tags?: string };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (!file) {
      antdMessage.warning('请选择文件');
      return;
    }

    try {
      setSubmitting(true);
      await uploadKnowledgeDocument({
        file,
        kb_id: values.kb_id,
        title: values.title,
        source_type: values.source_type,
        description: values.description,
        tags: values.tags,
      });
      antdMessage.success('文档已上传');
      setOpen(false);
      setFile(null);
      form.resetFields();
      refresh();
    } catch (error) {
      reportApiError(error, '上传失败');
    } finally {
      setSubmitting(false);
    }
  };

  const baseColumns = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90 },
      { title: '名称', dataIndex: 'name' },
      { title: '描述', dataIndex: 'description' },
      {
        title: '状态',
        dataIndex: 'is_active',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag>,
      },
      {
        title: '操作',
        width: 120,
        render: (_: unknown, record: KnowledgeBaseItem) => (
          <Button
            danger
            type="link"
            icon={<DeleteOutlined />}
            onClick={async () => {
              try {
                await deleteKnowledgeBase(record.id);
                antdMessage.success('知识库已删除');
                refresh();
              } catch (error) {
                reportApiError(error, '删除知识库失败');
              }
            }}
          >
            删除
          </Button>
        ),
      },
    ],
    [],
  );

  const docColumns = useMemo(
    () => [
      { title: '文档ID', dataIndex: 'id', width: 120 },
      { title: '标题', dataIndex: 'title' },
      { title: '文件名', dataIndex: 'file_name' },
      { title: '切片数', dataIndex: 'chunk_count', width: 100 },
      { title: '状态', dataIndex: 'status', width: 120 },
      {
        title: '操作',
        width: 120,
        render: (_: unknown, record: KnowledgeDocumentItem) => (
          <Button
            danger
            type="link"
            icon={<DeleteOutlined />}
            onClick={async () => {
              try {
                await deleteKnowledgeDocument(record.id);
                antdMessage.success('文档已删除');
                refresh();
              } catch (error) {
                reportApiError(error, '删除文档失败');
              }
            }}
          >
            删除
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="admin-page">
      <Row gutter={16}>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="知识库总数" value={stats?.knowledge_bases.total ?? bases.length} /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="文档总数" value={stats?.documents.total ?? docs.length} /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="已纠错日志" value={stats?.chat_logs.corrected ?? '-'} /></Card></Col>
      </Row>

      {(basesError || docsError || statsError) && <Alert type="warning" showIcon message="部分数据加载失败" description={basesError || docsError || statsError || ''} />}

      <Card className="admin-card admin-block">
        <Space style={{ marginBottom: 16 }} wrap>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setOpen(true)}>
            上传文档
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={baseColumns as never}
          dataSource={bases}
          pagination={false}
          locale={{ emptyText: basesError ? '知识库接口异常，当前仅显示空状态' : '暂无数据' }}
        />
      </Card>

      <Card className="admin-card admin-block">
        <Table
          rowKey="id"
          loading={loading}
          columns={docColumns as never}
          dataSource={docs}
          pagination={false}
          locale={{ emptyText: docsError ? '文档接口异常，当前仅显示空状态' : '暂无数据' }}
        />
      </Card>

      <Modal
        open={open}
        title="上传文档到知识库"
        okText="上传"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submitUpload}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ source_type: 'general' }}>
          <Form.Item name="kb_id" label="知识库" rules={[{ required: true, message: '请选择知识库' }]}>
            <Select options={bases.map((item) => ({ value: item.id, label: item.name }))} />
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="source_type" label="来源类型">
            <Select
              options={[
                { value: 'general', label: 'general' },
                { value: 'literature', label: 'literature' },
                { value: 'policy', label: 'policy' },
                { value: 'structured', label: 'structured' },
                { value: 'external', label: 'external' },
              ]}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="柑橘,施肥" />
          </Form.Item>
          <Form.Item label="文件">
            <Upload
              beforeUpload={(nextFile) => {
                setFile(nextFile);
                return false;
              }}
              maxCount={1}
              fileList={file ? [{ uid: file.name, name: file.name, status: 'done' }] : []}
              onRemove={() => {
                setFile(null);
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
