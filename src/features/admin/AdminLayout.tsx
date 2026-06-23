import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, Layout, Menu, Space, Tag, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import './index.less';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/admin/logs', icon: <FileSearchOutlined />, label: '问答日志' },
  { key: '/admin/knowledge', icon: <DatabaseOutlined />, label: '知识库管理' },
];

const routeTitles: Record<string, string> = {
  '/admin/users': '用户管理',
  '/admin/logs': '问答日志',
  '/admin/knowledge': '知识库管理',
};

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const logout = useAuthStore((state) => state.logout);
  const collapsed = useAppStore((state) => state.collapsed);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);

  const selectedKey = useMemo(() => {
    return (
      [...menuItems]
        .sort((a, b) => b.key.length - a.key.length)
        .find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key || '/admin/users'
    );
  }, [location.pathname]);

  if (!loading && user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout className="app-shell admin-shell">
      <Sider width={240} collapsedWidth={80} collapsed={collapsed} className="admin-sider">
        <div className="admin-brand">
          <div className="admin-brand-mark">YI</div>
          {!collapsed && (
            <div>
              <Typography.Title level={4}>Yago Intellect</Typography.Title>
              <Typography.Text>管理后台</Typography.Text>
            </div>
          )}
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} onClick={({ key }) => navigate(key)} className="admin-menu" />
        <div className="admin-sider-foot">
          {!collapsed && (
            <>
              <span>独立后台入口</span>
              <small>用户管理 · 问答日志 · 知识库管理</small>
            </>
          )}
        </div>
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Space className="admin-header-left" size={16}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              className="admin-icon-btn"
              onClick={toggleCollapsed}
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            />
            <Typography.Text className="admin-breadcrumb">管理后台 / {routeTitles[selectedKey]}</Typography.Text>
          </Space>
          <Space size={12}>
            <Button size="small" type="text" icon={<ArrowLeftOutlined />} className="admin-back-btn" onClick={() => navigate('/dashboard')}>
              返回前台
            </Button>
            <Dropdown
              menu={{
                items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }],
              }}
            >
              <Space className="admin-user">
                <Avatar icon={<UserOutlined />} />
                <span>
                  {user?.name || '系统管理员'}
                  <small>
                    管理员 <Tag color="blue">ADMIN</Tag>
                  </small>
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
