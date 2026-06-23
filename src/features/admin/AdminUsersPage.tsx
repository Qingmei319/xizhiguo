import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Statistic, message as antdMessage } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { createUserApi, type CreateUserPayload } from '@/services/auth.service';
import { reportApiError } from '@/services/http';
import './index.less';

export function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [lastPayload, setLastPayload] = useState<CreateUserPayload | null>(null);

  useEffect(() => {
    form.setFieldsValue({ role: 'user' });
  }, [form]);

  const submit = async () => {
    let values: CreateUserPayload;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    try {
      setSubmitting(true);
      await createUserApi(values);
      setLastPayload(values);
      antdMessage.success('用户创建成功');
      setOpen(false);
      form.resetFields();
      form.setFieldsValue({ role: 'user' });
    } catch (error) {
      reportApiError(error, '创建用户失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <Row gutter={16}>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="当前管理员" value={user?.name || '系统管理员'} /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="接口" value="POST /auth/users" /></Card></Col>
        <Col span={8}><Card className="admin-stat-card"><Statistic title="权限" value="admin" /></Card></Col>
      </Row>

      <Card className="admin-card admin-block">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              新增用户
            </Button>
          </Space>
          <Empty description="当前文档未提供用户列表接口，这里仅保留新增用户入口" />
          {lastPayload && <div className="admin-note">最近一次待创建数据：{JSON.stringify(lastPayload)}</div>}
        </Space>
      </Card>

      <Modal
        open={open}
        title="新增用户"
        okText="提交"
        cancelText="取消"
        confirmLoading={submitting}
        onOk={submit}
        onCancel={() => setOpen(false)}
      >
        <Form form={form} layout="vertical" initialValues={{ role: 'user' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="可选" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select
              options={[
                { value: 'user', label: 'user' },
                { value: 'guest', label: 'guest' },
                { value: 'admin', label: 'admin' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
