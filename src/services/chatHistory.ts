/**
 * @file 对话历史持久化服务
 * @description 管理多来源（工作台、亚果蔬小助手、基因智查）的聊天会话在 localStorage 中的
 *              存储、读取、归一化、删除和重命名。同时提供会话创建、消息构建和 Mock 回答生成。
 *              支持 unified 与 legacy 两种存储格式兼容迁移。
 */

import { createMockAnswer, initialMessages } from '@/services/mock/chat.mock';
import type { ChatMessage, ChatSession, ChatSource, ChatSourceMeta } from '@/types/chat';

/** 新版统一存储键名 */
const UNIFIED_CHAT_STORAGE_KEY = 'rag_unified_chat_sessions';
/** 旧版存储键名（兼容迁移） */
const LEGACY_CHAT_STORAGE_KEY = 'rag_chat_sessions';
/** 已删除会话 ID 集合的存储键名 */
const DELETED_CHAT_SESSION_IDS_KEY = 'rag_deleted_chat_session_ids';
/** 本地最大会话存储数量限制 */
const MAX_STORED_CHAT_SESSIONS = 80;

/** 对话来源元数据列表：各来源的键、标签、路由和主题色 */
export const chatSources: ChatSourceMeta[] = [
  { key: 'workspace', label: '工作台', route: '/workspace', color: '#1f8bff' },
  { key: 'fruit_assistant', label: '亚果蔬小助手', route: '/chat', color: '#28d881' },
  { key: 'gene_inspection', label: '基因智查', route: '/gene', color: '#8f5cff' },
];

/** 来源键→元数据映射表，方便按 key 快速查找来源信息 */
export const chatSourceMap = chatSources.reduce(
  (map, source) => ({ ...map, [source.key]: source }),
  {} as Record<ChatSource, ChatSourceMeta>,
);

/** 各来源的默认快捷提示词列表，用于对话页 landing 区域 */
export const defaultSourcePrompts: Record<ChatSource, string[]> = {
  workspace: ['帮我汇总今日农业研究重点', '分析广西果蔬市场趋势', '给我生成一份项目推进建议'],
  fruit_assistant: ['芒果花期管理有哪些关键技术？', '广西芒果炭疽病如何综合防治？', '广西果蔬种植补贴政策有哪些？'],
  gene_inspection: ['描述芒果 MiCHS 基因功能', '推荐植物抗旱相关候选基因', '这个基因检测结果有什么风险提示？'],
};

/**
 * 生成会话唯一 ID
 * @param source - 会话来源类型
 * @returns 格式如 `workspace_1718801234567_a3b2c1` 的唯一标识
 */
function createSessionId(source: ChatSource) {
  return `${source}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

/**
 * 从首条提问内容生成会话标题
 * @param content - 用户提问文本
 * @returns 截断至 18 字的标题，空内容时返回"新的对话"
 */
export function createSessionTitle(content: string) {
  const normalized = content.trim();
  return normalized.length > 18 ? `${normalized.slice(0, 18)}...` : normalized || '新的对话';
}

/**
 * 格式化会话时间戳为中文日期时间
 * @param timestamp - 毫秒时间戳
 * @returns 格式如 "06/19 15:42" 的中文时间字符串
 */
export function formatSessionTime(timestamp: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

/**
 * 创建新的聊天会话对象
 * @param source - 会话来源类型
 * @param title - 会话标题，默认"新的对话"
 * @param messages - 初始消息列表，默认空数组
 * @returns 完整的 ChatSession 对象
 */
export function createChatSession(source: ChatSource, title = '新的对话', messages: ChatMessage[] = []): ChatSession {
  const now = Date.now();

  return {
    id: createSessionId(source),
    source,
    title,
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 归一化会话数据：补充缺失字段、校验合法性
 * @param session - 原始会话数据
 * @param fallbackSource - 来源缺失时的回退来源类型
 * @returns 归一化后的 ChatSession，校验失败返回 null
 */
function normalizeSession(session: ChatSession, fallbackSource: ChatSource): ChatSession | null {
  // 校验必要字段是否存在
  if (!session?.id || !Array.isArray(session.messages)) return null;
  // 来源缺失时使用回退值
  const source = session.source || fallbackSource;
  // 来源不在已知列表中，视为非法数据
  if (!chatSourceMap[source]) return null;

  return {
    ...session,
    source,
    title: session.title || '新的对话',
    createdAt: session.createdAt || Date.now(),
    updatedAt: session.updatedAt || session.createdAt || Date.now(),
  };
}

/**
 * 从 localStorage 读取 JSON 格式的会话列表并归一化
 * @param key - localStorage 存储键名
 * @param fallbackSource - 来源回退值
 * @returns 归一化后的合法会话数组
 */
function readJsonSessions(key: string, fallbackSource: ChatSource): ChatSession[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(sessions)) return [];
    // 过滤掉归一化失败的非法会话
    return sessions
      .map((session) => normalizeSession(session, fallbackSource))
      .filter((session): session is ChatSession => Boolean(session));
  } catch {
    // JSON 解析失败，返回空数组
    return [];
  }
}

/** 读取已删除会话 ID 集合（去重后的字符串数组） */
function readDeletedSessionIds() {
  try {
    const raw = localStorage.getItem(DELETED_CHAT_SESSION_IDS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    // 仅保留合法字符串 ID
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 持久化已删除会话 ID 集合（自动去重）
 * @param ids - 要保存的 ID 数组
 */
function persistDeletedSessionIds(ids: string[]) {
  localStorage.setItem(DELETED_CHAT_SESSION_IDS_KEY, JSON.stringify([...new Set(ids)]));
}

/**
 * 从指定存储键中移除某个会话
 * @param key - localStorage 存储键名
 * @param sessionId - 要移除的会话 ID
 */
function removeSessionFromStorage(key: string, sessionId: string) {
  const sessions = readJsonSessions(key, 'fruit_assistant').filter((session) => session.id !== sessionId);
  localStorage.setItem(key, JSON.stringify(sessions));
}

/**
 * 获取所有已存储的聊天会话（合并 unified + legacy，过滤已删除）
 * @returns 按 updatedAt 降序排列的合法会话数组
 */
export function getStoredChatSessions(): ChatSession[] {
  // 读取已删除 ID 黑名单
  const deletedIds = new Set(readDeletedSessionIds());
  // 读取新版统一格式会话
  const unified = readJsonSessions(UNIFIED_CHAT_STORAGE_KEY, 'fruit_assistant');
  // 读取旧版格式会话，排除已在新版中存在的（按 ID 去重）
  const legacy = readJsonSessions(LEGACY_CHAT_STORAGE_KEY, 'fruit_assistant').filter(
    (legacySession) => !unified.some((session) => session.id === legacySession.id),
  );

  // 合并后过滤掉已删除的会话，按最近更新时间降序排列
  return [...unified, ...legacy]
    .filter((session) => !deletedIds.has(session.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 持久化会话列表到 localStorage（限制最大数量，按时间降序排列）
 * @param sessions - 要保存的会话数组
 */
export function persistChatSessions(sessions: ChatSession[]) {
  const storedSessions = [...sessions]
    .map((session) => normalizeSession(session, session.source || 'fruit_assistant'))
    .filter((session): session is ChatSession => Boolean(session))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    // 超过上限时截断，保留最新的会话
    .slice(0, MAX_STORED_CHAT_SESSIONS);

  localStorage.setItem(UNIFIED_CHAT_STORAGE_KEY, JSON.stringify(storedSessions));
}

/**
 * 按来源类型筛选会话
 * @param source - 来源枚举键
 * @returns 仅包含该来源的会话数组
 */
export function getSourceSessions(source: ChatSource) {
  return getStoredChatSessions().filter((session) => session.source === source);
}

/**
 * 新增或更新一条会话（按 ID 判断是新增还是覆盖）
 * @param nextSession - 新会话数据
 * @returns 更新后的完整会话数组
 */
export function upsertChatSession(nextSession: ChatSession) {
  const sessions = getStoredChatSessions();
  const normalized = normalizeSession(nextSession, nextSession.source || 'fruit_assistant');
  if (!normalized) return sessions;

  // 新会话置顶，已有同 ID 的会话被覆盖
  const nextSessions = [normalized, ...sessions.filter((session) => session.id !== normalized.id)];
  // 同时从旧版存储中移除，避免重复
  removeSessionFromStorage(LEGACY_CHAT_STORAGE_KEY, normalized.id);
  persistChatSessions(nextSessions);
  // 通知对话记录页刷新数据
  window.dispatchEvent(new Event('chat-history-updated'));
  return nextSessions;
}

/**
 * 删除一条会话（记录 ID 到黑名单 + 从存储中移除）
 * @param sessionId - 要删除的会话 ID
 * @returns 删除后的完整会话数组
 */
export function deleteChatSession(sessionId: string) {
  persistDeletedSessionIds([...readDeletedSessionIds(), sessionId]);
  removeSessionFromStorage(LEGACY_CHAT_STORAGE_KEY, sessionId);
  const nextSessions = getStoredChatSessions().filter((session) => session.id !== sessionId);
  persistChatSessions(nextSessions);
  window.dispatchEvent(new Event('chat-history-updated'));
  return nextSessions;
}

/**
 * 重命名一条会话标题
 * @param sessionId - 目标会话 ID
 * @param title - 新标题文本
 * @returns 更新后的完整会话数组
 */
export function renameChatSession(sessionId: string, title: string) {
  const sessions = getStoredChatSessions();
  const nextSessions = sessions.map((session) =>
    session.id === sessionId ? { ...session, title, updatedAt: Date.now() } : session,
  );
  // 同步从旧版存储中移除，迁移到新版
  removeSessionFromStorage(LEGACY_CHAT_STORAGE_KEY, sessionId);
  persistChatSessions(nextSessions);
  window.dispatchEvent(new Event('chat-history-updated'));
  return nextSessions;
}

/**
 * 构建用户消息对象
 * @param content - 用户提问文本
 * @returns 完整的 ChatMessage 对象
 */
export function buildUserMessage(content: string): ChatMessage {
  return {
    id: `m_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    role: 'user',
    content,
  };
}

/**
 * 构建 Mock AI 回答消息（演示阶段使用，接入真实 API 后替换）
 * @param content - 用户提问文本（用于匹配 Mock 答案）
 * @param source - 会话来源类型（非 fruit_assistant 时会在回答前附加来源标签）
 * @returns 包含思考链路、分段回答和引用来源的完整助手消息
 */
export function buildMockReply(content: string, source: ChatSource): ChatMessage {
  const answer = createMockAnswer(content);
  const sourceLabel = chatSourceMap[source].label;

  return {
    ...answer,
    id: `m_answer_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    // 非亚果蔬小助手的回答前附加来源标签前缀
    content: source === 'fruit_assistant' ? answer.content : `[${sourceLabel}] ${answer.content}`,
  };
}

/**
 * 创建指定来源的初始会话（含欢迎消息）
 * @param source - 来源类型
 * @returns 包含一条欢迎助手消息的初始 ChatSession
 */
export function createInitialSourceSession(source: ChatSource) {
  const sourceLabel = chatSourceMap[source].label;
  // 亚果蔬小助手使用预定义的欢迎消息，其他来源使用通用欢迎语
  const messages =
    source === 'fruit_assistant'
      ? initialMessages
      : [
          {
            id: `m_welcome_${source}`,
            role: 'assistant' as const,
            content: `您好，我是${sourceLabel} AI 助手。可以直接输入问题，我会结合当前业务场景给出建议。`,
          },
        ];

  return createChatSession(source, '新的对话', messages);
}
