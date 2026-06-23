/**
 * @file PageHeader.tsx
 * @description 通用页面标题行组件。在多个页面顶部复用，
 *              展示页面标题、描述文字和右侧操作按钮（如筛选、导出等）。
 */
import type { ReactNode } from 'react';
import { Typography } from 'antd';

/** 页面标题行组件的 Props 定义 */
interface PageHeaderProps {
  /** 页面标题，如"温室监控" */
  title: string;
  /** 标题下方的说明文字，可选 */
  description?: string;
  /** 右侧操作区域，如筛选按钮、导出按钮等，可选 */
  extra?: ReactNode;
}

/**
 * 页面标题行组件
 *
 * 左侧标题 + 描述，右侧 extra 操作区。
 * 样式由 components.less 的 .page-header 控制。
 *
 * @param props - 包含 title、description 和 extra
 */
export function PageHeader({ title, description, extra }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        {/* 描述文字：仅在有 description 时渲染 */}
        {description && <Typography.Paragraph>{description}</Typography.Paragraph>}
      </div>
      {/* 右侧操作区 */}
      {extra}
    </div>
  );
}
