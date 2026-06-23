/**
 * 登录页面组件
 *
 * 采用左右两栏布局：左侧为品牌介绍区，展示平台名称和定位；
 * 右侧为登录表单卡片，支持账号密码登录和"记住登录"功能。
 * 登录成功后自动跳转到来源页面或默认跳转到数据总览。
 *
 * @module features/auth
 */

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCaptcha } from '@/services/auth.service';
import { reportApiError } from '@/services/http';
import { useAuthStore } from '@/stores/auth.store';
import './index.less';

const defaultLoginForm = {
  username: 'admin',
  password: 'admin123',
  captcha_code: '',
  remember: true,
};

/** 登录表单字段类型 */
interface LoginForm {
  /** 用户账号名 */
  username: string;
  /** 登录密码 */
  password: string;
  captcha_code: string;
  /** 是否记住登录状态 */
  remember?: boolean;
}

/**
 * 登录页面
 *
 * 提供品牌展示和用户登录入口。登录使用 mock 账号系统，
 * 成功后将 token 和用户信息写入 localStorage 并通过 Zustand 管理全局状态。
 * 登录后重定向到用户访问前的目标页面，无目标则默认进入数据总览。
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const refreshCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const captcha = await getCaptcha();
      setCaptchaId(captcha.captcha_id);
      setCaptchaImage(
        captcha.captcha_image.startsWith('data:')
          ? captcha.captcha_image
          : `data:image/png;base64,${captcha.captcha_image}`,
      );
    } catch (error) {
      reportApiError(error, '验证码获取失败');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  /**
   * 表单提交回调
   * 执行登录操作并跳转到来源页面或默认首页
   */
  const onFinish = async (values: LoginForm) => {
    try {
      await login({
        username: values.username,
        password: values.password,
        captcha_id: captchaId,
        captcha_code: values.captcha_code,
      });
      const from = (location.state as { from?: string } | null)?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      reportApiError(error, '登录失败');
      refreshCaptcha();
    }
  };

  return (
    <div className="login-page">
      {/* 左侧品牌介绍区：登录页背景文案、主标题和说明文字在这里调整。 */}
      <section className="login-hero">
        <div className="brand large">
          <div className="brand-mark">Y</div>
          <div>
            <Typography.Title level={1}>Yago Intellect</Typography.Title>
            <Typography.Text>RAG + 知识库管理系统</Typography.Text>
          </div>
        </div>
        <Typography.Title>亚热带果蔬研究与生产服务平台</Typography.Title>
        <Typography.Paragraph>
          连接知识库、专家经验、病害视觉识别、基因数据和温室传感器，让农业问答有来源，让生产决策有依据。
        </Typography.Paragraph>
      </section>
      {/* 右侧登录表单卡片：账号、密码、记住登录和提交按钮样式对应 auth/index.less。 */}
      <Card className="login-card glow-card">
        <Typography.Title level={3}>账号登录</Typography.Title>
        <Typography.Text>使用后端账号登录进入系统</Typography.Text>
        <Form<LoginForm>
          layout="vertical"
          initialValues={defaultLoginForm}
          onFinish={onFinish}
          className="login-form"
        >
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input size="large" prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="captcha_code" label="验证码" rules={[{ required: true, message: '请输入验证码' }]}>
            <Space.Compact block>
              <Input size="large" placeholder="请输入验证码" />
              <Button size="large" loading={captchaLoading} onClick={refreshCaptcha}>
                {captchaImage ? <img src={captchaImage} alt="验证码" style={{ height: 28 }} /> : '刷新'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住登录状态</Checkbox>
          </Form.Item>
          <Button type="primary" size="large" htmlType="submit" loading={loading} block>
            登录进入平台
          </Button>
        </Form>
      </Card>
    </div>
  );
}
