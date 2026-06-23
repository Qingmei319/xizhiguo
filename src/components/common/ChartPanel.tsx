/**
 * @file ChartPanel.tsx
 * @description 通用图表卡片容器组件。在数据总览页和温室监控页中复用，
 *              提统一定标题行 + 内容区的发光卡片外壳，内部由各页面自行填充 ECharts 图表。
 */
import type { PropsWithChildren } from 'react';
import { Card, Typography } from 'antd';

/** 图表面板组件的 Props 定义 */
interface ChartPanelProps extends PropsWithChildren {
  /** 图表标题，显示在卡片顶部 */
  title: string;
}

/**
 * 图表面板组件
 *
 * 结构简单：glow-card 外壳 + 标题行 + 子内容（通常是 ECharts 图表容器）。
 * 样式由 components.less 的 .chart-panel 控制。
 *
 * @param props - 包含 title（标题）和 children（图表内容）
 */
export function ChartPanel({ title, children }: ChartPanelProps) {
  return (
    <Card className="glow-card chart-panel">
      <Typography.Title level={4}>{title}</Typography.Title>
      {children}
    </Card>
  );
}
