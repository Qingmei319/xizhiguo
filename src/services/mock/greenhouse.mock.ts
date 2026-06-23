/**
 * @file 智慧温室（Greenhouse）Mock 数据
 * @description 提供温室监控页的全部模拟数据，包括：
 *   - GreenhouseIconType：传感器图标类型枚举
 *   - GreenhouseFloatingSensor / GreenhouseWeatherPanel / GreenhouseTrendSeries：数据结构定义
 *   - greenhouseMetrics：16 条传感器指标数据
 *   - deviceStatus：4 台设备运行状态
 *   - greenhouseFloatingSensors：6 个浮动传感器标签数据
 *   - greenhouseWeatherPanel：气象面板数据
 *   - greenhouseTrendLabels / greenhouseTrendSeries：环境趋势折线图数据
 *
 * 注：c 对象集中管理所有中文标签的 unicode 编码，避免源码中出现乱码。
 */
import type { DeviceStatus, SensorMetric } from '@/types/greenhouse';

/** 浮动传感器图标类型 —— 对应不同传感器类别的图标样式 */
export type GreenhouseIconType = 'light' | 'weather' | 'pressure' | 'humidity' | 'co2';

/** 浮动传感器标签 —— 3D 温室模型上叠加的悬浮指标卡 */
export interface GreenhouseFloatingSensor {
  /** 传感器名称，如 '光合有效辐射' */
  label: string;
  /** 当前数值 */
  value: string;
  /** 数值单位 */
  unit: string;
  /** CSS 定位类名，如 'sensor-left-top' */
  className: string;
  /** 图标类型 */
  icon: GreenhouseIconType;
}

/** 气象面板数据 —— 3D 温室右侧的天气信息卡片 */
export interface GreenhouseWeatherPanel {
  /** 当前时间 */
  time: string;
  /** 日期文本 */
  date: string;
  /** 农历日期 */
  lunar: string;
  /** 当前作物 */
  crop: string;
  /** 当前节气 */
  solarTerm: string;
  /** 室外温度 */
  outdoorTemp: string;
  /** 风力描述 */
  wind: string;
  /** 气象站坐标和地点描述 */
  location: string;
}

/** 环境趋势折线序列 —— 24 小时温湿度变化趋势 */
export interface GreenhouseTrendSeries {
  /** 序列名称，如 '温度' */
  name: string;
  /** 7 个时间点的数值 */
  data: number[];
  /** 线条颜色 */
  color: string;
  /** 面积填充颜色 */
  areaColor: string;
}

/** 中文字典 —— 集中管理所有标签的 unicode 编码，确保源码可读 */
const c = {
  soilTemp1: '土温1',
  soilTemp2: '土温2',
  soilTemp3: '土温3',
  soilTemp4: '土温4',
  soilHumidity1: '土湿1',
  soilHumidity2: '土湿2',
  soilHumidity3: '土湿3',
  soilHumidity4: '土湿4',
  co2: 'CO₂浓度',
  par: '光合有效辐射',
  radiation: '总辐射',
  airTemp: '空气温度',
  airHumidity: '空气湿度',
  pressure: '大气压',
  light: '光照强度',
  windSpeed: '风速',
  windDirection: '风向',
  southWind: '南风',
  fan: '风机',
  pump: '水泵',
  shade: '遮阳帘',
  spray: '喷淋系统',
  running: '运行中',
  online: '在线',
  offline: '离线',
  date: '2026年6月12日 星期五',
  lunar: '农历五月廿八',
  crop: '芒种',
  solarTerm: '二十四节气',
  location: '气象坐标：108.30, 22.86 [南宁 西乡塘]',
  temp: '温度',
  humidity: '湿度',
} as const;

/** 16 条传感器指标 —— 四层土温 + 四层土湿 + CO₂ + 光合 + 辐射 + 气温 + 气湿 + 气压 + 光照 + 风速 + 风向 */
export const greenhouseMetrics: SensorMetric[] = [
  { label: c.soilTemp1, value: '24.1', unit: '℃', type: 'temperature' },
  { label: c.soilTemp2, value: '24.5', unit: '℃', type: 'temperature' },
  { label: c.soilTemp3, value: '24.0', unit: '℃', type: 'temperature' },
  { label: c.soilTemp4, value: '23.8', unit: '℃', type: 'temperature' },
  { label: c.soilHumidity1, value: '32.6', unit: '%', type: 'humidity' },
  { label: c.soilHumidity2, value: '31.8', unit: '%', type: 'humidity' },
  { label: c.soilHumidity3, value: '33.4', unit: '%', type: 'humidity' },
  { label: c.soilHumidity4, value: '30.9', unit: '%', type: 'humidity' },
  { label: c.co2, value: '680', unit: 'ppm', type: 'co2' },
  { label: c.par, value: '632', unit: 'μmol/m²/s', type: 'light' },
  { label: c.radiation, value: '824.5', unit: 'W/m²', type: 'light' },
  { label: c.airTemp, value: '28.6', unit: '℃', type: 'temperature' },
  { label: c.airHumidity, value: '65.2', unit: '%RH', type: 'humidity' },
  { label: c.pressure, value: '1008.2', unit: 'hPa', type: 'pressure' },
  { label: c.light, value: '45.6', unit: 'klx', type: 'light' },
  { label: c.windSpeed, value: '1.8', unit: 'm/s', type: 'wind' },
  { label: c.windDirection, value: c.southWind, unit: '', type: 'wind' },
];

/** 4 台设备运行状态 —— 风机、水泵、遮阳帘、喷淋系统 */
export const deviceStatus: DeviceStatus[] = [
  { name: c.fan, status: c.running },
  { name: c.pump, status: c.online },
  { name: c.shade, status: c.online },
  { name: c.spray, status: c.offline },
];

/** 6 个浮动传感器标签 —— 左侧（光合、辐射、CO₂）和右侧（气温、气湿、气压） */
export const greenhouseFloatingSensors: GreenhouseFloatingSensor[] = [
  { label: c.par, value: '632', unit: 'μmol/m²/s', className: 'sensor-left-top', icon: 'light' },
  { label: c.radiation, value: '824.5', unit: 'W/m²', className: 'sensor-left-mid', icon: 'light' },
  { label: c.co2, value: '680', unit: 'ppm', className: 'sensor-left-low', icon: 'co2' },
  { label: c.airTemp, value: '28.6', unit: '℃', className: 'sensor-right-top', icon: 'weather' },
  { label: c.airHumidity, value: '65.2', unit: '%RH', className: 'sensor-right-mid', icon: 'humidity' },
  { label: c.pressure, value: '1008.2', unit: 'hPa', className: 'sensor-right-low', icon: 'pressure' },
];

/** 气象面板数据 —— 右侧天气信息卡片 */
export const greenhouseWeatherPanel: GreenhouseWeatherPanel = {
  time: '15:42:36',
  date: c.date,
  lunar: c.lunar,
  crop: c.crop,
  solarTerm: c.solarTerm,
  outdoorTemp: '32℃',
  wind: '南风3级',
  location: c.location,
};

/** 环境趋势 X 轴标签 —— 24 小时内的 14 个采样时间点 */
export const greenhouseTrendLabels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '24:00'];

/** 环境趋势折线序列 —— 温度和湿度的 24 小时变化曲线，起伏更明显 */
export const greenhouseTrendSeries: GreenhouseTrendSeries[] = [
  {
    name: c.temp,
    data: [22, 20, 18, 23, 27, 31, 29, 33, 28, 25, 26, 24, 22],
    color: '#28d881',            // 绿色线条
    areaColor: 'rgba(40, 216, 129, .13)',  // 绿色面积填充
  },
  {
    name: c.humidity,
    data: [72, 74, 68, 62, 56, 52, 58, 55, 61, 67, 63, 70, 69],
    color: '#1f8bff',            // 蓝色线条
    areaColor: 'rgba(31, 139, 255, .16)',  // 蓝色面积填充
  },
];
