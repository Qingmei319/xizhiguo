/**
 * @file 基因智查（Gene）Mock 数据
 * @description 提供基因查询页的全部模拟数据，包括：
 *   - GeneResultItem：基因查询结果字段的数据结构
 *   - defaultGeneQuery：默认查询语句
 *   - genePrompts：欢迎态快捷提示词卡片列表
 *   - geneMockResult：MiCHS 基因的模拟查询结果
 */
import type { PromptCard } from '@/types/chat';

/** 基因查询结果项 —— 每行字段的数据结构，支持可选标签组 */
export interface GeneResultItem {
  /** 字段名称，如 '基因名称'、'物种' */
  label: string;
  /** 字段值 */
  value: string;
  /** 可选标签列表，用于文献引用等场景 */
  tags?: Array<{
    /** 标签文字 */
    label: string;
    /** 标签颜色 */
    color: string;
  }>;
}

/** 默认查询语句 —— 进入基因页时自动填入的初始问题 */
export const defaultGeneQuery = '描述芒果 MiCHS 基因功能';

/** 基因页快捷提示词 —— 四枚胶囊按钮的内容与配色 */
export const genePrompts: PromptCard[] = [
  {
    title: '描述芒果 MiCHS 基因功能',
    description: '解析基因功能、表达模式及生物学意义',
    prompt: '描述芒果 MiCHS 基因功能',
    color: '#1f8bff',  // 蓝色光晕
  },
  {
    title: '推荐细胞代谢相关基因',
    description: '推荐关键基因并说明潜在功能',
    prompt: '推荐参与细胞代谢过程的关键基因',
    color: '#28d881',  // 绿色光晕
  },
  {
    title: '荔枝 LcMYB1 基因功能',
    description: '查询荔枝基因信息及果实发育作用',
    prompt: '荔枝 LcMYB1 基因在果实发育中有什么作用？',
    color: '#8f5cff',  // 紫色光晕
  },
  {
    title: '推荐抗旱相关基因',
    description: '检索抗旱候选基因和功能注释',
    prompt: '推荐植物抗旱相关候选基因',
    color: '#f7b84b',  // 金色光晕
  },
];

/** MiCHS 基因模拟查询结果 —— 基因名称、物种、功能注释、表达部位、关联通路、文献引用 */
export const geneMockResult: GeneResultItem[] = [
  { label: '基因名称', value: 'MiCHS' },
  { label: '物种', value: '芒果 Mangifera indica' },
  { label: '功能注释', value: '参与类黄酮与花青素合成通路，可能影响果皮着色与抗逆反应。' },
  { label: '表达部位', value: '果皮、嫩叶、花序' },
  { label: '关联通路', value: 'Phenylpropanoid biosynthesis' },
  {
    label: '文献引用',
    value: '',
    tags: [
      { label: 'Plant Physiology', color: 'blue' },
      { label: 'Genome Biology', color: 'green' },
    ],
  },
];
