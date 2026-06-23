/**
 * @file 应用全局状态管理
 * @description 使用 Zustand 管理侧边栏折叠/展开状态，供 MainLayout 使用。
 */

import { create } from 'zustand';

/** 应用全局状态接口 */
interface AppState {
  /** 侧边栏是否处于折叠状态 */
  collapsed: boolean;
  /** 切换侧边栏折叠/展开 */
  toggleCollapsed: () => void;
}

/**
 * 应用全局状态 Store
 * - collapsed: 侧边栏折叠状态，默认展开（false）
 * - toggleCollapsed: 切换折叠状态
 */
export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
}));
