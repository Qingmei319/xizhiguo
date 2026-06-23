/**
 * @file MainLayout.tsx
 * @description 应用主布局组件。包含左侧导航侧边栏、顶部标题栏和内容区三部分。
 *              所有已登录的业务页面都挂在这个布局下，通过 <Outlet /> 渲染子路由。
 *              支持侧边栏折叠/展开，并根据当前路由自动切换内容区的铺满模式。
 */
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd';
import {
  AppstoreOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  SettingOutlined,
  CrownOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useAppStore } from '@/stores/app.store';
import brandLogo from '@/assets/mango-transparent.png';
import userAvatar from '@/assets/nv-sidebar-glow.png';

const { Header, Sider, Content } = Layout;

/** 侧边栏菜单配置：key 对应路由路径，新增页面入口时同步补 key、icon 和 label。 */
const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据总览' },
  { key: '/workspace', icon: <AppstoreOutlined />, label: '工作台' },
  { key: '/chat', icon: <MessageOutlined />, label: '水果小助手' },
  { key: '/gene', icon: <ExperimentOutlined />, label: '基因智查' },
  { key: '/disease', icon: <ShoppingOutlined />, label: '品种展示' },
  { key: '/greenhouse', icon: <HomeOutlined />, label: '温室监控' },
  { key: '/chat-history', icon: <HistoryOutlined />, label: '对话记录' },
];

/** 顶部面包屑标题映射：key 要和 menuItems 的路由保持一致。 */
const routeTitles: Record<string, string> = {
  '/dashboard': '数据总览',
  '/workspace': '工作台',
  '/chat': '亚果蔬小助手',
  '/gene': '基因智查',
  '/disease': '果蔬展示',
  '/greenhouse': '温室监控',
  '/chat-history': '对话记录',
};

/**
 * 应用主布局组件
 *
 * 核心职责：
 * 1. 渲染侧边栏（品牌 logo + 菜单 + 底部用户图）
 * 2. 渲染顶部栏（折叠按钮 + 面包屑 + 用户下拉菜单）
 * 3. 渲染内容区（<Outlet />），并根据当前路由动态切换内容区样式：
 *    - chat 页面 → chat-content（去掉 padding，背景透明）
 *    - workspace/gene 页面 → flush-content（铺满无 padding）
 *    - 其他页面 → 普通 app-content（带 padding + 滚动）
 */
export function MainLayout() {
  const navigate = useNavigate();
  // 当前路由路径，用于确定选中菜单项和内容区样式
  const location = useLocation();
  // 全局状态：当前登录用户信息和登出方法
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  // 全局状态：侧边栏折叠状态和切换方法
  const collapsed = useAppStore((state) => state.collapsed);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);
  const isAdmin = user?.role === 'admin';

  // 计算当前选中的菜单 key：优先精确匹配，其次前缀匹配（处理子路由）
  const selectedKey = useMemo(() => {
    return (
      [...menuItems]
        .sort((a, b) => b.key.length - a.key.length)
        .find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key || '/dashboard'
    );
  }, [location.pathname]);

  // 这些页面需要铺满内容区，追加特殊 class 交给 layout.less 控制
  const isChat = selectedKey === '/chat';
  const isFlushContent = selectedKey === '/workspace' || selectedKey === '/gene';
  // 顶部面包屑文案：固定格式 "首页 / 页面名"
  const breadcrumb = `首页 / ${routeTitles[selectedKey]}`;

  /** 退出登录：清除 token 和用户信息，跳转到登录页 */
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout className={`app-shell${isChat ? ' chat-shell' : ''}`}>
      {/* 左侧导航栏：品牌 logo、页面菜单、底部用户视觉图 */}
      <Sider width={240} collapsedWidth={80} collapsed={collapsed} className="app-sider">
        <div className="brand">
          <div className="brand-mark">
            <img src={brandLogo} alt="Yago Intellect" />
          </div>
          {/* 折叠态下隐藏品牌文字，只保留 logo */}
          {!collapsed && (
            <div>
              <Typography.Title level={4}>西智果</Typography.Title>
              <Typography.Text>农业AI研究平台</Typography.Text>
            </div>
          )}
        </div>
        {/* 侧边栏菜单：选中态由 selectedKeys 控制，点击通过 navigate 跳转 */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="side-menu"
        />
        {/* 底部用户视觉区：主要展示透明人物图，折叠态下隐藏文字 */}
        <div className="user-card">
          <img src={userAvatar} alt={user?.name || 'User'} />
          {!collapsed && (
            <div className="user-meta">
              <strong>{user?.name}</strong>
              <span>{user?.organization}</span>
              <span className="online-dot">在线 · {user?.roleName}</span>
            </div>
          )}
        </div>
      </Sider>
      <Layout>
        {/* 顶部栏：折叠按钮、面包屑和右上角用户下拉菜单 */}
        <Header className="app-header">
          <Space className="header-left" size={18}>
            {/* 侧边栏折叠/展开按钮：图标根据折叠状态切换 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              className="sider-toggle"
              onClick={toggleCollapsed}
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            />
            <Typography.Text className="breadcrumb">{breadcrumb}</Typography.Text>
          </Space>
          {/* 右上角用户下拉菜单：包含系统设置和退出登录 */}
          <Dropdown
          menu={{
            items: [
              ...(isAdmin
                ? [{ key: 'admin', icon: <CrownOutlined />, label: '管理后台', onClick: () => navigate('/admin') }]
                : []),
              { key: 'setting', icon: <SettingOutlined />, label: '系统设置' },
              { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
            ],
          }}
          >
            <Space className="header-user">
              <Avatar icon={<UserOutlined />} />
              <span>
                {user?.name}
                <small>在线</small>
              </span>
            </Space>
          </Dropdown>
        </Header>
        {/* 页面内容区：不同页面通过 chat-content / flush-content 切换铺满方式 */}
        <Content className={`app-content${isChat ? ' chat-content' : ''}${isFlushContent ? ' flush-content' : ''}`}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
