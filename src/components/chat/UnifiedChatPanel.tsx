/**
 * @file UnifiedChatPanel.tsx
 * @description 统一聊天面板组件 —— 平台内所有业务场景（知识库、基因、病害、温室等）
 *   的 AI 对话共用同一面板结构。面板分为左侧边栏（标题 + 推荐提示词 + 最近会话列表）
 *   与右侧主区域（对话头部信息 + 消息流 + 输入框）。会话数据通过 localStorage 持久化，
 *   并按 source（业务来源）分类存储，切换页面时可自动恢复对应历史。
 *
 * 核心能力：
 *   - 多会话管理：创建、切换、清空当前会话，侧边栏最多显示 6 条最近记录
 *   - 模拟 RAG 回复：用户发送消息后，通过 setTimeout + buildMockReply 生成占位回复，
 *     后续将替换为真实 SSE 流式接口
 *   - 初始提示词：支持从 URL 参数或 props 传入 initialPrompt，首次加载自动触发对话
 *   - 回答结构化展示：AI 回复可包含 sections 字段，按标题分段渲染
 *   - 复制最近回答：一键复制助手最新回复到剪贴板
 */

import { CopyOutlined, DeleteOutlined, PlusOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Input, Space, Tag, Tooltip, Typography, message as antdMessage } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SafeRichText } from '@/components/chat/SafeRichText';
// 聊天历史服务：会话创建 / 持久化 / 模拟回复生成
import {
  buildMockReply,
  buildUserMessage,
  chatSourceMap,
  createChatSession,
  createInitialSourceSession,
  createSessionTitle,
  defaultSourcePrompts,
  formatSessionTime,
  getSourceSessions,
  getStoredChatSessions,
  persistChatSessions,
} from '@/services/chatHistory';
// 认证状态：获取当前登录用户信息
import { useAuthStore } from '@/stores/auth.store';
import type { ChatMessage, ChatSession, ChatSource } from '@/types/chat';
import aiLogo from '@/assets/logo.png';
import './UnifiedChatPanel.less';

/** 组件 Props 定义 */
interface UnifiedChatPanelProps {
  /** 对话来源场景，如 'knowledge' | 'gene' | 'disease' | 'greenhouse' 等 */
  source: ChatSource;
  /** 侧边栏标题（默认取 chatSourceMap[source].label + 'AI 对话'） */
  title?: string;
  /** 侧边栏副标题描述文字 */
  subtitle?: string;
  /** 外层额外 CSS 类名 */
  className?: string;
  /** 推荐提示词列表（默认取 defaultSourcePrompts[source]） */
  prompts?: string[];
  /** 初始提问内容，传入后组件首次渲染自动发送该问题 */
  initialPrompt?: string;
}

/**
 * copyText —— 将指定消息内容复制到剪贴板
 * @param message - 目标 ChatMessage，缺省或剪贴板不可用时静默返回
 */
function copyText(message?: ChatMessage) {
  if (!message || !navigator.clipboard) return;
  navigator.clipboard
    .writeText(message.content)
    .then(() => antdMessage.success('回答已复制'))
    .catch(() => antdMessage.warning('复制失败，请手动选择文本'));
}

/**
 * mergeSourceSessions —— 将当前 source 的会话列表合并写入 localStorage
 *   同时保留其他 source 的历史会话不受影响，并派发 'chat-history-updated' 事件
 *   通知其他组件（如 ChatHistoryPage）刷新数据。
 * @param source   - 当前业务来源标识
 * @param sessions - 当前 source 的最新会话列表
 */
function mergeSourceSessions(source: ChatSource, sessions: ChatSession[]) {
  // 取出非当前 source 的历史会话
  const otherSessions = getStoredChatSessions().filter((session) => session.source !== source);
  // 合并后整体写入，触发全局事件
  persistChatSessions([...sessions.map((session) => ({ ...session, source })), ...otherSessions]);
  window.dispatchEvent(new Event('chat-history-updated'));
}

/**
 * UnifiedChatPanel —— 统一聊天面板主组件
 *
 * 布局结构：
 *   ┌─────────────────────────────────────────────┐
 *   │  Card.unified-chat-panel                     │
 *   │  ┌──────────┬───────────────────────────┐   │
 *   │  │ 侧边栏    │  主对话区                  │   │
 *   │  │ ·标题     │  ·头部（会话名 + 操作按钮）│   │
 *   │  │ ·提示词   │  ·消息流（用户/AI 气泡）   │   │
 *   │  │ ·会话列表 │  ·输入框 + 发送按钮        │   │
 *   │  └──────────┴───────────────────────────┘   │
 *   └─────────────────────────────────────────────┘
 *
 * 数据流：
 *   sessions → localStorage（持久化）
 *   sendMessage → buildMockReply（模拟 AI 回复，后续替换为 SSE）
 */
export function UnifiedChatPanel({ source, title, subtitle, className, prompts, initialPrompt }: UnifiedChatPanelProps) {
  // 当前 source 的元信息（label、color 等）
  const sourceMeta = chatSourceMap[source];
  // 当前登录用户，用于消息气泡显示用户名
  const user = useAuthStore((state) => state.user);
  // URL 查询参数，支持从外部跳转指定 sessionId
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId') || '';

  // —— 会话列表状态：初始化时从 localStorage 加载，若无历史则创建默认会话
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = getSourceSessions(source);
    return stored.length > 0 ? stored : [createInitialSourceSession(source)];
  });

  // —— 当前激活会话 ID：优先匹配 URL 参数指定的 sessionId，否则取第一条
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const stored = getSourceSessions(source);
    return stored.find((session) => session.id === requestedSessionId)?.id || stored[0]?.id || '';
  });

  // —— 输入框当前文本
  const [value, setValue] = useState('');
  // —— 是否正在等待 AI 回复（防止重复发送）
  const [isAnswering, setIsAnswering] = useState(false);

  // 消息流容器引用，用于自动滚动到底部
  const transcriptRef = useRef<HTMLDivElement>(null);
  // 模拟回复定时器引用，组件卸载或新操作时需清除
  const timerRef = useRef<number | null>(null);
  // initialPrompt 缓存：仅首次渲染时取值，避免后续 re-render 重复触发
  const initialPromptRef = useRef(initialPrompt?.trim() || '');
  // 标记 initialPrompt 是否已发送，确保只执行一次
  const didSendInitialPromptRef = useRef(false);

  // —— 当前激活会话对象（从 sessions 列表中查找）
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [activeSessionId, sessions],
  );
  // —— 当前会话的消息列表
  const messages = activeSession?.messages || [];
  // —— 按更新时间降序排列的会话列表，用于侧边栏"最近对话"展示
  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);
  // —— 最近一条 AI 回复消息，用于"复制最近回答"功能
  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant'),
    [messages],
  );

  // —— 副作用：若 activeSessionId 为空，自动选中第一条会话
  useEffect(() => {
    if (!activeSessionId && sessions[0]) setActiveSessionId(sessions[0].id);
  }, [activeSessionId, sessions]);

  // —— 副作用：URL 参数指定 sessionId 时，将该会话加入列表并激活
  useEffect(() => {
    if (!requestedSessionId) return;
    const requestedSession = getSourceSessions(source).find((session) => session.id === requestedSessionId);
    if (!requestedSession) return;

    // 将请求的会话插入列表头部，避免重复
    setSessions((items) => [
      requestedSession,
      ...items.filter((session) => session.id !== requestedSession.id),
    ]);
    setActiveSessionId(requestedSession.id);
  }, [requestedSessionId, source]);

  // —— 副作用：sessions 变化时自动持久化到 localStorage
  useEffect(() => {
    mergeSourceSessions(source, sessions);
  }, [sessions, source]);

  // —— 副作用：新消息到来时自动滚动到底部
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // —— 副作用：组件卸载时清除定时器，防止内存泄漏
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // —— 副作用：处理 initialPrompt —— 仅在首次渲染且有初始提示词时触发
  //   创建新会话 → 发送用户消息 → 插入 pending 消息 → 900ms 后替换为模拟回复
  useEffect(() => {
    const prompt = initialPromptRef.current;
    if (!prompt || didSendInitialPromptRef.current) return;

    didSendInitialPromptRef.current = true;
    const nextSession = createInitialSourceSession(source);
    const userMessage = buildUserMessage(prompt);
    const pendingId = `m_pending_${Date.now()}`;
    // pending 消息：展示"正在生成回答..."的加载状态
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: '正在结合当前页面上下文生成回答...',
      loading: true,
    };

    // 更新会话列表：新会话 + 用户消息 + pending 消息
    setSessions((items) => [
      {
        ...nextSession,
        title: createSessionTitle(prompt),
        messages: [...nextSession.messages, userMessage, pendingMessage],
        updatedAt: Date.now(),
      },
      ...items,
    ]);
    setActiveSessionId(nextSession.id);
    setValue('');
    setIsAnswering(true);

    // 900ms 后将 pending 替换为模拟回复
    timerRef.current = window.setTimeout(() => {
      const reply = buildMockReply(prompt, source);
      setSessions((items) =>
        items.map((session) =>
          session.id === nextSession.id
            ? {
                ...session,
                messages: session.messages.map((message) => (message.id === pendingId ? reply : message)),
                updatedAt: Date.now(),
              }
            : session,
        ),
      );
      setIsAnswering(false);
      timerRef.current = null;
    }, 900);
  }, [source]);

  /**
   * updateActiveSession —— 更新当前激活会话的消息列表
   * @param updater   - 消息列表变换函数
   * @param nextTitle - 可选的新标题（首条消息发送时自动重命名会话）
   */
  const updateActiveSession = (updater: (items: ChatMessage[]) => ChatMessage[], nextTitle?: string) => {
    if (!activeSession) return;
    setSessions((items) =>
      items.map((session) =>
        session.id === activeSession.id
          ? {
              ...session,
              title: nextTitle || session.title,
              messages: updater(session.messages),
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
  };

  /**
   * startNewConversation —— 创建全新会话并激活
   *   清除当前定时器、重置输入框和回答状态
   */
  const startNewConversation = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const nextSession = createInitialSourceSession(source);
    setSessions((items) => [nextSession, ...items]);
    setActiveSessionId(nextSession.id);
    setValue('');
    setIsAnswering(false);
  };

  /**
   * clearConversation —— 清空当前会话（删除所有消息，创建空白会话替代）
   *   旧会话从列表中移除，新空白会话成为激活项
   */
  const clearConversation = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const nextSession = createChatSession(source);
    setSessions((items) => [nextSession, ...items.filter((session) => session.id !== activeSession?.id)]);
    setActiveSessionId(nextSession.id);
    setValue('');
    setIsAnswering(false);
  };

  /**
   * sendMessage —— 发送用户消息核心流程
   *   1. 内容规范化（trim + 空值/忙碌检查）
   *   2. 构建用户消息 + pending 消息，插入当前会话
   *   3. 900ms 后替换 pending 为模拟回复（后续接入真实 SSE）
   *   4. 首条消息自动重命名会话标题
   * @param content - 发送内容，默认取输入框 value
   */
  const sendMessage = (content = value) => {
    const normalizedContent = content.trim();
    if (!normalizedContent || !activeSession || isAnswering) return;

    // 清除之前的定时器，避免冲突
    if (timerRef.current) window.clearTimeout(timerRef.current);

    const userMessage = buildUserMessage(normalizedContent);
    const pendingId = `m_pending_${Date.now()}`;
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: '正在结合当前页面上下文生成回答...',
      loading: true,
    };
    // 判断是否需要重命名会话标题（默认标题或仅 1 条消息时）
    const shouldRename = activeSession.title === '新的对话' || activeSession.messages.length <= 1;

    // 更新当前会话：追加用户消息 + pending 消息，可能重命名标题
    updateActiveSession(
      (items) => [...items, userMessage, pendingMessage],
      shouldRename ? createSessionTitle(normalizedContent) : undefined,
    );
    setValue('');
    setIsAnswering(true);

    // 定时器模拟 AI 回复延迟
    timerRef.current = window.setTimeout(() => {
      const reply = buildMockReply(normalizedContent, source);
      setSessions((items) =>
        items.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: session.messages.map((message) => (message.id === pendingId ? reply : message)),
                updatedAt: Date.now(),
              }
            : session,
        ),
      );
      setIsAnswering(false);
      timerRef.current = null;
    }, 900);
  };

  /**
   * onPressEnter —— 输入框回车事件处理
   *   Shift+Enter 保留换行，单独 Enter 触发发送
   */
  const onPressEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey) return; // Shift+Enter 允许换行
    event.preventDefault();
    sendMessage();
  };

  // —— JSX 渲染 ——
  return (
    <Card className={`unified-chat-panel ${className || ''}`.trim()}>
      <div className="unified-chat-layout">
        {/* ====== 左侧边栏 ====== */}
        <aside className="unified-chat-sidebar">
          {/* 标题区域：AI Logo + 名称 + 描述 */}
          <div className="unified-chat-title">
            <Avatar src={aiLogo} size={48} />
            <div>
              <Typography.Title level={3}>{title || `${sourceMeta.label} AI 对话`}</Typography.Title>
              <Typography.Text>{subtitle || '围绕当前业务场景持续提问，记录会自动沉淀到对话记录。'}</Typography.Text>
            </div>
          </div>

          {/* 推荐提示词列表：点击即发送对应问题 */}
          <div className="unified-prompt-list">
            {(prompts || defaultSourcePrompts[source]).map((prompt) => (
              <Button key={prompt} disabled={isAnswering} onClick={() => sendMessage(prompt)}>
                {prompt}
              </Button>
            ))}
          </div>

          {/* 最近会话列表：最多展示 6 条，点击切换 */}
          <div className="unified-session-list">
            <div className="unified-section-head">
              <span>最近对话</span>
              {/* 新建对话按钮 */}
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={startNewConversation} />
            </div>
            {sortedSessions.slice(0, 6).map((session) => (
              <button
                key={session.id}
                type="button"
                className={session.id === activeSession?.id ? 'active' : ''}
                onClick={() => !isAnswering && setActiveSessionId(session.id)}
              >
                <strong>{session.title}</strong>
                <span>{formatSessionTime(session.updatedAt)}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ====== 右侧主对话区 ====== */}
        <section className="unified-chat-main">
          {/* 对话头部：会话标题 + 消息统计 + 操作按钮 */}
          <div className="unified-chat-header">
            <div>
              <Typography.Title level={4}>{activeSession?.title || '当前对话'}</Typography.Title>
              <Typography.Text>{messages.length} 条消息 · {sourceMeta.label}</Typography.Text>
            </div>
            <Space>
              {/* 复制最近 AI 回复 */}
              <Tooltip title="复制最近回答">
                <Button shape="circle" icon={<CopyOutlined />} disabled={!lastAssistantMessage} onClick={() => copyText(lastAssistantMessage)} />
              </Tooltip>
              {/* 新建对话 */}
              <Tooltip title="新建对话">
                <Button shape="circle" icon={<PlusOutlined />} onClick={startNewConversation} />
              </Tooltip>
              {/* 清空当前对话（危险操作，红色按钮） */}
              <Tooltip title="清空当前对话">
                <Button shape="circle" danger icon={<DeleteOutlined />} onClick={clearConversation} />
              </Tooltip>
            </Space>
          </div>

          {/* 消息流区域：按时间顺序渲染用户和 AI 的对话气泡 */}
          <div ref={transcriptRef} className="unified-chat-transcript">
            {messages.map((message) => (
              <div key={message.id} className={`unified-message ${message.role}`}>
                {/* 头像：AI 显示 Logo，用户显示姓名首字或 UserOutlined */}
                <Avatar className="unified-avatar" src={message.role === 'assistant' ? aiLogo : undefined} icon={message.role === 'user' ? <UserOutlined /> : undefined}>
                  {message.role === 'user' ? user?.name?.slice(0, 1) : null}
                </Avatar>
                {/* 消息气泡：角色标签 + 内容文本 + 可选结构化分段 */}
                <div className="unified-bubble">
                  <Tag color={message.role === 'assistant' ? 'blue' : 'green'}>
                    {message.role === 'assistant' ? sourceMeta.label : user?.name || '用户'}
                  </Tag>
                  <SafeRichText content={message.content} />
                  {/* 结构化回答段落：AI 回复可包含 sections 字段 */}
                  {message.sections && (
                    <div className="unified-answer-sections">
                      {message.sections.map((section) => (
                        <div key={section.title}>
                          <strong>{section.title}</strong>
                          <p>{section.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 输入区域：多行文本框 + 发送按钮 */}
          <div className="unified-chat-input">
            <Input.TextArea
              value={value}
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isAnswering}
              onChange={(event) => setValue(event.target.value)}
              onPressEnter={onPressEnter}
              placeholder={`向${sourceMeta.label}提问...`}
            />
            {/* 发送按钮：内容为空或正在回答时禁用 */}
            <Button type="primary" shape="circle" size="large" icon={<SendOutlined />} disabled={!value.trim() || isAnswering} onClick={() => sendMessage()} />
          </div>
        </section>
      </div>
    </Card>
  );
}
