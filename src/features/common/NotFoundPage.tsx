/**
 * @file NotFoundPage.tsx
 * @description 404 页面 —— 当用户访问不存在的路由时展示此页面。
 *   使用 Ant Design Result 组件呈现 "页面不存在" 提示，
 *   并提供"返回首页"按钮引导用户跳转到数据总览页。
 */

import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

/**
 * NotFoundPage —— 404 未找到页面组件
 *
 * 展示内容：
 *   - 404 状态码图标（Ant Design Result 内置）
 *   - 标题："页面不存在"
 *   - 副标题：提示用户检查地址或返回首页
 *   - 操作按钮：点击跳转到 /dashboard（数据总览页）
 */
export function NotFoundPage() {
  // 路由导航钩子，用于按钮点击后跳转
  const navigate = useNavigate();

  return (
    <Result
      status="404"                          // Ant Design 内置 404 状态图标
      title="页面不存在"                     // 主标题
      subTitle="请检查访问地址，或返回数据总览。" // 副标题提示
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回首页                           // 点击后跳转到数据总览页
        </Button>
      }
    />
  );
}
