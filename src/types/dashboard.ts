/**
 * @file 数据总览（Dashboard）页面类型定义
 * @description 定义数据大屏所需的指标卡、预警条目、排行数据和概览统计等数据结构。
 */

/** 指标卡数据：实时问答总量、活跃专家数等关键指标 */
export interface MetricItem {
  /** 指标标题（如"实时问答总量"） */
  title: string;
  /** 指标数值（如"128,560"） */
  value: string;
  /** 今日趋势（如"+12.5%"） */
  trend: string;
  /** 指标主题色 */
  color: string;
  /** 迷你折线图数据点 */
  sparkline: number[];
}

/** 病虫害预警条目：高风险或中风险的实时预警信息 */
export interface AlertItem {
  /** 预警标题（如"草地贪夜蛾暴发预警"） */
  title: string;
  /** 预警发生地点 */
  location: string;
  /** 预警风险等级 */
  level: '高风险' | '中风险';
  /** 预警发布时间（如"5 分钟前"） */
  time: string;
}

/** 品种排行数据：各果蔬品种的热度排名 */
export interface RankingItem {
  /** 品种名称 */
  name: string;
  /** 热度数值 */
  value: number;
  /** 趋势百分比（如"+12.5%"） */
  trend: string;
}

/** 概览统计条目：Hero 区域右侧的简要统计数据 */
export interface OverviewStatItem {
  /** 统计项标签（如"今日新增问答"） */
  label: string;
  /** 统计数值（如"8,765"） */
  value: string;
  /** 数值后缀单位（如"次"、"人"、"%"） */
  suffix?: string;
}
