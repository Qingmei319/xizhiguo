/**
 * @file 应用全局 Provider 配置
 * @description 顶层 Provider 组件，为整个应用提供：
 *   1. Ant Design ConfigProvider —— 暗色主题算法 + 中文国际化 (zhCN)
 *   2. 主题色配置 —— 主色 #1f8bff、成功 #28d881、警告 #f7b84b、错误 #ff5b6e
 *   3. Layout / Card 组件背景色定制 —— 深色半透明卡片和侧边栏/头部
 *   4. Ant Design App 组件 —— 提供 message / notification / modal 的全局方法
 *   所有子组件通过 {children} 嵌入此 Provider 体系。
 */
import type { PropsWithChildren } from 'react';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

/**
 * AppProviders —— 顶层 Provider 组合组件
 * @param children - 子组件树（路由、页面等）
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={zhCN}  // 中文国际化
      theme={{
        algorithm: theme.darkAlgorithm,  // 暗色主题算法
        token: {
          colorPrimary: '#1f8bff',   // 主色（蓝色）
          colorSuccess: '#28d881',   // 成功色（绿色）
          colorWarning: '#f7b84b',   // 警告色（金色）
          colorError: '#ff5b6e',     // 错误色（红色）
          borderRadius: 8,           // 全局圆角
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',  // 字体栈
        },
        components: {
          Layout: {
            bodyBg: '#06111f',       // 内容区背景
            siderBg: '#06101d',      // 侧边栏背景
            headerBg: '#07111f',     // 顶部栏背景
          },
          Card: {
            colorBgContainer: 'rgba(9, 29, 52, 0.78)',  // 卡片背景（深色半透明）
          },
        },
      }}
    >
      {/* AntApp 提供 message / notification / modal 全局方法 */}
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
