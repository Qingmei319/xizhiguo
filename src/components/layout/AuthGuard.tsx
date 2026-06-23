/**
 * @file AuthGuard.tsx
 * @description 路鉴权守卫组件。包裹在需要登录才能访问的路由外层，
 *              若用户未登录则自动重定向到 /login 页面，并记录来源路径以便登录后回跳。
 */
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

/**
 * 鉴权守卫组件
 *
 * 检查当前用户是否持有有效 token：
 * - 有 token → 正常渲染子组件（即业务页面）
 * - 无 token → 重定向到登录页，并通过 state.from 记录用户原本想去的路径，
 *              登录成功后可据此回跳。
 *
 * @param children - 需要鉴权的子路由组件
 */
export function AuthGuard({ children }: PropsWithChildren) {
  // 从 Zustand 全局状态中读取当前登录 token
  const token = useAuthStore((state) => state.token);
  const restoreUser = useAuthStore((state) => state.restoreUser);
  // 记录用户当前访问的路径，用于登录后回跳
  const location = useLocation();

  useEffect(() => {
    if (token) restoreUser();
  }, [restoreUser, token]);

  // 未登录：重定向到 /login，携带来源路径信息
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // 已登录：直接渲染子组件
  return children;
}
