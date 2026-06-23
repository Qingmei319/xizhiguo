/**
 * @file MetricCard.tsx
 * @description 通用指标卡片组件。在数据总览页和温室监控页中复用，
 *              展示指标标题、数值、单位、趋势、图标以及迷你迷你折线图（sparkline）。
 */
import type { CSSProperties, ReactNode } from 'react';
import { Card, Typography } from 'antd';

/** 指标卡片组件的 Props 定义 */
interface MetricCardProps {
  /** 指标名称，如"实时问答总量" */
  title: string;
  /** 指标数值，如"128,560" */
  value: string;
  /** 数值单位，如"次"、"人"，可选 */
  unit?: string;
  /** 今日趋势文字，如"+12.5%"，可选 */
  trend?: string;
  /** 指标图标 ReactNode，可选 */
  icon?: ReactNode;
  /** 指标主题色，用于图标、sparkline 和发光效果，默认 '#1f8bff' */
  color?: string;
  /** 迷你折线图数据点数组，可选，传入后自动渲染 SVG sparkline */
  sparkline?: number[];
}

/**
 * 指标卡片组件
 *
 * 将数值、趋势、图标和 sparkline 组织在一个发光卡片中：
 * - 左侧：带主题色的指标图标
 * - 中间：标题 → 数值（含单位） → 趋势
 * - 右下角：SVG 迷你折线图（sparkline）
 *
 * @param props - 指标卡片属性
 */
export function MetricCard({ title, value, unit, trend, icon, color = '#1f8bff', sparkline = [] }: MetricCardProps) {
  // 计算 sparkline 数据的最大值，用于归一化 Y 轴坐标
  const maxValue = Math.max(...sparkline, 1);
  // 将 sparkline 数据映射为 SVG polyline 的 points 字符串
  const points = sparkline
    .map((item, index) => {
      // X: 横向均匀分布（0~100）
      const x = sparkline.length <= 1 ? 0 : (index / (sparkline.length - 1)) * 100;
      // Y: 纵向按比例映射，翻转坐标（SVG Y 轴向下，数据值向上）
      const y = 42 - (item / maxValue) * 34;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card className="glow-card metric-card" style={{ '--metric-color': color } as CSSProperties}>
      {/* 指标图标：统一深色背景 + 彩色图标 */}
      <div className="metric-icon" style={{ '--metric-icon-color': color } as CSSProperties}>
        {icon}
      </div>
      <div className="metric-copy">
        <Typography.Text>{title}</Typography.Text>
        {/* 指标数值：大号粗体数字 + 可选单位 */}
        <div className="metric-value">
          {value}
          {unit && <span>{unit}</span>}
        </div>
        {/* 今日趋势标签：如 "+12.5%" */}
        {trend && <div className="metric-trend">今日 {trend}</div>}
      </div>
      {/* SVG 迷你折线图（sparkline）：仅在有数据点时渲染 */}
      {points && (
        <svg className="metric-sparkline" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
          {/* 折线下方填充区域：低透明度主题色 */}
          <polyline
            points={`0,44 ${points} 100,44`}
            fill={color}
            opacity="0.16"
            stroke="none"
          />
          {/* 折线本身：实线，带圆角端点 */}
          <polyline points={points} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </svg>
      )}
    </Card>
  );
}
