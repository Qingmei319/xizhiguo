/**
 * @file 温室监控页面类型定义
 * @description 定义温室大棚的传感器指标和设备运行状态数据结构。
 */

/** 传感器指标数据：温湿度、CO₂、光照、气压、风速等 */
export interface SensorMetric {
  /** 指标名称（如"土温1"、"CO₂浓度"） */
  label: string;
  /** 当前读数值（如"24.1"） */
  value: string;
  /** 数值单位（如"℃"、"ppm"、"hPa"） */
  unit: string;
  /** 指标类型，用于匹配图标和主题色 */
  type: 'temperature' | 'humidity' | 'co2' | 'light' | 'pressure' | 'wind';
}

/** 设备运行状态：风机、水泵、遮阳帘、喷淋系统等 */
export interface DeviceStatus {
  /** 设备名称（如"风机"、"水泵"） */
  name: string;
  /** 设备当前状态 */
  status: '在线' | '离线' | '运行中';
}
