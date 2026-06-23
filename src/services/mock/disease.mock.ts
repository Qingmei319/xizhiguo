/**
 * @file 果蔬品种图鉴（Disease / Atlas）Mock 数据
 * @description 提供品种展示页的全部模拟数据，包括：
 *   - ProduceCategory：品类枚举（水果 | 蔬菜）
 *   - ProduceItem / ProduceRankItem：品种卡片和排行项的数据结构
 *   - produceItems：10 个品种的完整属性（名称、产地、评分、标签等）
 *   - produceRanks：前 5 名品种的热度排行
 *   - selectedProduceCompare：默认对比组（前 3 个品种）
 */

/** 品类枚举 —— 筛选按钮的选项值 */
export type ProduceCategory = '水果' | '蔬菜';

/** 品种卡片数据结构 —— 图鉴页中每张品种卡片的完整属性 */
export interface ProduceItem {
  /** 品种唯一 ID */
  id: number;
  /** 品种名称 */
  name: string;
  /** 品类分类（水果/蔬菜） */
  category: ProduceCategory;
  /** 产地描述，如 '云南 · 红河' */
  origin: string;
  /** 品种图片 URL */
  image: string;
  /** 标签文字，如 '热门'、'高产' */
  tag: string;
  /** 标签风格，决定标签颜色和视觉样式 */
  tagTone: 'hot' | 'new' | 'premium' | 'resistant' | 'yield';
  /** 糖度/甜度值 */
  sweetness: string;
  /** 抗病性评级 */
  resistance: string;
  /** 生长周期 */
  cycle: string;
  /** 亩产量 */
  yield: string;
  /** 综合评分（0~100） */
  score: number;
  /** 是否收藏 */
  favorite: boolean;
}

/** 品种排行数据结构 —— 热度排行榜中每行的属性 */
export interface ProduceRankItem {
  /** 品种 ID */
  id: number;
  /** 品种名称 */
  name: string;
  /** 品种图片 URL */
  image: string;
  /** 热度值，如 '96.2万' */
  heat: string;
  /** 热度趋势百分比（正数为上升，负数为下降） */
  trend: number;
}

/** 10 个品种的完整数据 —— 图鉴页网格中的品种卡片列表 */
export const produceItems: ProduceItem[] = [
  {
    id: 1,
    name: '阳光玫瑰葡萄',
    category: '水果',
    origin: '云南 · 红河',
    image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=720&q=85',
    tag: '热门',
    tagTone: 'hot',
    sweetness: '18.5°',
    resistance: '强',
    cycle: '8月上旬',
    yield: '2500kg',
    score: 96,
    favorite: true,
  },
  {
    id: 2,
    name: '赣南脐橙',
    category: '水果',
    origin: '江西 · 赣州',
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=720&q=85',
    tag: '高产',
    tagTone: 'yield',
    sweetness: '16.8°',
    resistance: '中',
    cycle: '11月中旬',
    yield: '3500kg',
    score: 94,
    favorite: true,
  },
  {
    id: 3,
    name: '金都一号火龙果',
    category: '水果',
    origin: '广西 · 南宁',
    image: 'https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=720&q=85',
    tag: '热门',
    tagTone: 'hot',
    sweetness: '17.2°',
    resistance: '强',
    cycle: '6-11月',
    yield: '3000kg',
    score: 92,
    favorite: true,
  },
  {
    id: 4,
    name: '樱桃番茄',
    category: '蔬菜',
    origin: '山东 · 寿光',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=720&q=85',
    tag: '精品',
    tagTone: 'premium',
    sweetness: '9.8°',
    resistance: '强',
    cycle: '90天',
    yield: '4500kg',
    score: 90,
    favorite: false,
  },
  {
    id: 5,
    name: '螺丝椒',
    category: '蔬菜',
    origin: '山东 · 潍坊',
    image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=720&q=85',
    tag: '抗病',
    tagTone: 'resistant',
    sweetness: '中辣',
    resistance: '强',
    cycle: '100天',
    yield: '4000kg',
    score: 88,
    favorite: false,
  },
  {
    id: 6,
    name: '妃子笑荔枝',
    category: '水果',
    origin: '广东 · 茂名',
    image: 'https://images.unsplash.com/photo-1629828874514-d5523dd213fd?auto=format&fit=crop&w=720&q=85',
    tag: '热门',
    tagTone: 'hot',
    sweetness: '18.0°',
    resistance: '中',
    cycle: '5月下旬',
    yield: '2000kg',
    score: 87,
    favorite: true,
  },
  {
    id: 7,
    name: '蓝丰蓝莓',
    category: '水果',
    origin: '云南 · 曲靖',
    image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=720&q=85',
    tag: '新品',
    tagTone: 'new',
    sweetness: '14.6°',
    resistance: '强',
    cycle: '4-6月',
    yield: '1500kg',
    score: 86,
    favorite: false,
  },
  {
    id: 8,
    name: '津优35黄瓜',
    category: '蔬菜',
    origin: '天津 · 西青',
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=720&q=85',
    tag: '高产',
    tagTone: 'yield',
    sweetness: '3.2°',
    resistance: '强',
    cycle: '60天',
    yield: '5000kg',
    score: 85,
    favorite: false,
  },
  {
    id: 9,
    name: '红颜草莓',
    category: '水果',
    origin: '江苏 · 常州',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=720&q=85',
    tag: '热门',
    tagTone: 'hot',
    sweetness: '13.5°',
    resistance: '中',
    cycle: '12-次年5月',
    yield: '1800kg',
    score: 84,
    favorite: true,
  },
  {
    id: 10,
    name: '京绿甘蓝',
    category: '蔬菜',
    origin: '北京 · 通州',
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=720&q=85',
    tag: '抗病',
    tagTone: 'resistant',
    sweetness: '4.1°',
    resistance: '强',
    cycle: '80天',
    yield: '6000kg',
    score: 83,
    favorite: false,
  },
];

/** 品种热度排行前 5 名 —— 从 produceItems 中截取并计算热度值 */
export const produceRanks: ProduceRankItem[] = produceItems.slice(0, 5).map((item, index) => ({
  id: item.id,
  name: item.name,
  image: item.image,
  heat: `${(98.6 - index * 2.4).toFixed(1)}万`,
  trend: [12, 8, 15, 6, -3][index],
}));

/** 默认对比组 —— 品种详情弹窗中的对比选项，取前 3 个品种 */
export const selectedProduceCompare = produceItems.slice(0, 3);
