/**
 * @file 聊天对话相关类型定义
 * @description 定义 RAG 对话系统的核心数据结构，包括消息、会话、引用来源、快捷提示卡片等，
 *              用于 AI 对话页（工作台、亚果蔬小助手、基因智查）的数据建模。
 */

/** 引用来源：RAG 检索返回的文档片段，附带相关性评分 */
export interface Citation {
  /** 引用唯一标识 */
  id: string;
  /** 来源文档标题 */
  title: string;
  /** 所属知识库名称 */
  source: string;
  /** 与问题的相关性评分（0~1） */
  score: number;
  /** 文档中的匹配片段文本 */
  snippet: string;
}

/** 聊天消息：一条用户提问或 AI 回答 */
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string;
  /** 消息角色：用户提问或 AI 回答 */
  role: 'user' | 'assistant';
  /** 消息正文内容 */
  content: string;
  /** AI 思考链路（仅助手消息有）：展示推理过程 */
  thoughts?: string[];
  /** 结构化回答分段（仅助手消息有）：结论、建议、注意事项等 */
  sections?: ChatSection[];
  /** RAG 检索引用来源列表（仅助手消息有） */
  citations?: Citation[];
  /** 是否处于加载/生成中状态 */
  loading?: boolean;
  /** 用户随消息附带的本地附件信息 */
  attachments?: ChatAttachment[];
}

/** 聊天附件：当前前端仅保存可持久化的文件元信息 */
export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

/** 快捷提示卡片：对话页 landing 区域的入口按钮数据 */
export interface PromptCard {
  /** 卡片标题 */
  title: string;
  /** 卡片描述副标题 */
  description: string;
  /** 点击后发送给 AI 的提问内容 */
  prompt: string;
  /** 卡片左侧色块颜色 */
  color: string;
}

/** 结构化回答分段：如"结论"、"操作建议"、"注意事项" */
export interface ChatSection {
  /** 分段标题 */
  title: string;
  /** 分段正文 */
  content: string;
}

/** 对话会话：一组连续的聊天消息，归属某个业务来源 */
export interface ChatSession {
  /** 会话唯一标识 */
  id: string;
  /** 会话标题（默认取首条提问截断生成） */
  title: string;
  /** 会话来源模块 */
  source?: ChatSource;
  /** 会话中的消息列表 */
  messages: ChatMessage[];
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 最近更新时间戳（毫秒） */
  updatedAt: number;
}

/** 对话来源枚举：工作台、亚果蔬小助手、基因智查 */
export type ChatSource = 'workspace' | 'fruit_assistant' | 'gene_inspection';

/** 对话来源元信息：标签、路由、主题色等展示属性 */
export interface ChatSourceMeta {
  /** 来源枚举键 */
  key: ChatSource;
  /** 来源中文名称（如"亚果蔬小助手"） */
  label: string;
  /** 对应页面路由路径 */
  route: string;
  /** 来源主题色 */
  color: string;
}
