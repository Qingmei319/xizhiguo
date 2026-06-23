/**
 * @file 工作台（Workspace）Mock 数据
 * @description 提供工作台页的全部模拟数据，包括：
 *   - WorkspaceActionIcon：快捷入口图标类型枚举
 *   - WorkspaceActionCard：快捷操作卡片的数据结构
 *   - workspaceMockProfile：欢迎态的个人简介（问候语、描述、免责声明）
 *   - workspaceCards：四个快捷操作卡片（市场洞察、行业趋势、头脑风暴、数据安全）
 */

/** 快捷入口图标类型 —— 对应四种业务方向的图标样式 */
export type WorkspaceActionIcon = 'market' | 'trend' | 'brainstorm' | 'security';

/** 快捷操作卡片数据结构 —— 欢迎态中每张入口卡片的属性 */
export interface WorkspaceActionCard {
  /** 卡片标题，如 '市场洞察' */
  title: string;
  /** 卡片描述文字 */
  description: string;
  /** 点击后自动发送的提问内容 */
  prompt: string;
  /** 图标类型 */
  icon: WorkspaceActionIcon;
  /** 卡片主题颜色 */
  color: string;
}

/** 欢迎态个人简介 —— 头部问候语、描述和免责声明 */
export const workspaceMockProfile = {
  /** 问候语（含用户名） */
  greeting: '张农业，您好 👋',
  /** AI 助手定位描述 */
  description: '我是您的农业研究AI助手，深度洞察数据，赋能智慧农业创新',
  /** 免责声明 */
  disclaimer: 'ⓘ Yago Intellect AI 可能生成错误信息，请核实重要内容。',
};

/** 四个快捷操作卡片 —— 欢迎态的四枚入口按钮 */
export const workspaceCards: WorkspaceActionCard[] = [
  {
    title: '市场洞察',
    description: '分析市场需求、消费者行为和竞争态势，把握市场机会',
    prompt: '请做一份广西亚热带果蔬市场洞察，重点分析需求变化、渠道机会和竞争态势。',
    icon: 'market',
    color: '#004baa',   // 左上 — 深蓝色
  },
  {
    title: '行业趋势',
    description: '追踪农业行业动态与技术发展预测未来趋势与机遇',
    prompt: '请分析未来一年智慧农业与果蔬产业的发展趋势，并给出平台建设机会。',
    icon: 'trend',
    color: '#11545b',   // 右上 — 深青色
  },
  {
    title: '头脑风暴',
    description: '激发创新思维，拓展研究方向探索更多可能性',
    prompt: '围绕农业AI研究平台做一次头脑风暴，给出可落地的功能和运营方案。',
    icon: 'brainstorm',
    color: '#23176a',   // 左下 — 深紫色
  },
  {
    title: '数据安全',
    description: '数据隐私保护与合规建议确保研究数据安全可靠',
    prompt: '请给农业研究平台的数据安全方案建议，重点关注权限、脱敏、审计和导出控制。',
    icon: 'security',
    color: '#854f1f',   // 右下 — 棕色
  },
];
