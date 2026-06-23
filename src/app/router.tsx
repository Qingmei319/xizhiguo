/**
 * @file 应用路由配置
 * @description 基于 React Router v6 的 createBrowserRouter 定义全部路由结构：
 *   - /login         → 登录页（独立布局，不走 MainLayout）
 *   - /              → 已登录业务页（AuthGuard + MainLayout 包裹）
 *     - /dashboard     → 数据总览页（默认首页，根路径重定向到此）
 *     - /workspace     → 工作台页
 *     - /chat          → 亚果蔬 AI 助手对话页
 *     - /gene           → 基因智查页
 *     - /disease        → 果蔬品种图鉴页
 *     - /greenhouse     → 智慧温室监控页
 *     - /chat-history   → 对话记录页
 *   - *              → 404 页面（兜底路由）
 */
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const WorkspacePage = lazy(() =>
  import('@/features/workspace/WorkspacePage').then((module) => ({ default: module.WorkspacePage })),
);
const ChatPage = lazy(() => import('@/features/chat/ChatPage').then((module) => ({ default: module.ChatPage })));
const GenePage = lazy(() => import('@/features/gene/GenePage').then((module) => ({ default: module.GenePage })));
const DiseasePage = lazy(() => import('@/features/disease/DiseasePage').then((module) => ({ default: module.DiseasePage })));
const GreenhousePage = lazy(() =>
  import('@/features/greenhouse/GreenhousePage').then((module) => ({ default: module.GreenhousePage })),
);
const ChatHistoryPage = lazy(() =>
  import('@/features/history/ChatHistoryPage').then((module) => ({ default: module.ChatHistoryPage })),
);
const NotFoundPage = lazy(() => import('@/features/common/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const AdminLayout = lazy(() => import('@/features/admin/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminUsersPage = lazy(() =>
  import('@/features/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })),
);
const AdminLogsPage = lazy(() =>
  import('@/features/admin/AdminLogsPage').then((module) => ({ default: module.AdminLogsPage })),
);
const AdminKnowledgePage = lazy(() =>
  import('@/features/admin/AdminKnowledgePage').then((module) => ({ default: module.AdminKnowledgePage })),
);

export const router = createBrowserRouter([
  // 登录页不走主布局，方便单独调整登录背景和表单样式。
  {
    path: '/login',
    element: <LoginPage />,
  },
  // 登录后的业务页面统一包在 MainLayout 中，侧边栏和顶部栏都在这里生效。
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      // 根路径重定向到数据总览页
      { index: true, element: <Navigate to="/dashboard" replace /> },
      // 数据总览页
      { path: 'dashboard', element: <DashboardPage /> },
      // 工作台页
      { path: 'workspace', element: <WorkspacePage /> },
      // 亚果蔬 AI 助手对话页
      { path: 'chat', element: <ChatPage /> },
      // 基因智查页
      { path: 'gene', element: <GenePage /> },
      // 果蔬品种图鉴页
      { path: 'disease', element: <DiseasePage /> },
      // 智慧温室监控页
      { path: 'greenhouse', element: <GreenhousePage /> },
      // 对话记录页
      { path: 'chat-history', element: <ChatHistoryPage /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/users" replace /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'logs', element: <AdminLogsPage /> },
      { path: 'knowledge', element: <AdminKnowledgePage /> },
    ],
  },
  // 兜底 404 页面，新增路由时记得加在上面的 children 中。
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
