/**
 * 工作台页面（Workspace）
 *
 * AI 对话的核心入口页面，提供两种视图状态：
 * 1. 欢迎态 — 展示粒子流背景、中央发光图标、欢迎语和四个快捷操作卡片
 * 2. 对话态 — 发送消息后切换为聊天记录区域 + 底部输入栏
 *
 * 支持 URL 参数 `sessionId` 恢复历史对话会话。
 * 对话数据自动持久化到 localStorage，并同步到对话记录页面。
 *
 * @module features/workspace
 */

import {
  ArrowRightOutlined,
  BarChartOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  StarFilled,
  StockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Input, Typography } from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AttachmentList } from '@/components/chat/AttachmentList';
import { SafeRichText } from '@/components/chat/SafeRichText';
import { ParticleFlowBackground } from '@/components/common/ParticleFlowBackground';
import { createChatAttachments } from '@/services/chatAttachments';
import {
  buildUserMessage,
  createChatSession,
  createSessionTitle,
  getStoredChatSessions,
  upsertChatSession,
} from '@/services/chatHistory';
import { streamChatAnswer } from '@/services/chat.service';
import { reportApiError } from '@/services/http';
import { workspaceCards, workspaceMockProfile, type WorkspaceActionIcon } from '@/services/mock/workspace.mock';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatAttachment, ChatMessage, ChatSession } from '@/types/chat';
import aiLogo from '@/assets/logo.png';
import './index.less';

/** 快捷操作卡片的图标映射表 */
const workspaceIconMap: Record<WorkspaceActionIcon, ReactNode> = {
  market: <BarChartOutlined />,
  trend: <StockOutlined />,
  brainstorm: <BulbOutlined />,
  security: <SafetyCertificateOutlined />,
};

/**
 * 工作台页面
 *
 * 核心状态变量：
 * - messages: 当前对话的消息列表
 * - isAnswering: 是否正在等待 AI 回复（用于禁用输入和显示加载态）
 * - isChatting: 是否已进入对话态（有消息即视为对话中）
 * - sessionRef: 持久化的会话引用，用于跨渲染周期保持会话 ID
 */
export function WorkspacePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId') || '';
  // 尝试从 URL 参数恢复历史会话
  const restoredSession = requestedSessionId
    ? getStoredChatSessions().find((session) => session.id === requestedSessionId && session.source === 'workspace')
    : null;
  const [messages, setMessages] = useState<ChatMessage[]>(() => restoredSession?.messages || []);
  const [value, setValue] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<ChatSession | null>(restoredSession || null);
  // 有消息时自动切换为对话态
  const isChatting = messages.length > 0;

  // 监听 URL 中的 sessionId 参数，恢复历史会话
  useEffect(() => {
    if (!requestedSessionId) return;
    const session = getStoredChatSessions().find((item) => item.id === requestedSessionId && item.source === 'workspace');
    if (!session) return;

    sessionRef.current = session;
    setMessages(session.messages);
  }, [requestedSessionId]);

  // 消息列表更新后自动滚动到底部
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // 组件卸载时清除定时器，防止内存泄漏
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setPendingAttachments((items) => [...items, ...createChatAttachments(files)]);
    event.target.value = '';
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((items) => items.filter((attachment) => attachment.id !== id));
  };

  /**
   * 发送消息
   * 创建用户消息和加载中的 AI 回复，通过 setTimeout 模拟异步响应，
   * 同时将对话数据持久化到 localStorage
   */
  const sendMessage = async (content = value) => {
    const normalizedContent = content.trim();
    const attachments = pendingAttachments;
    if ((!normalizedContent && attachments.length === 0) || isAnswering) return;

    // 清除之前的定时器
    if (timerRef.current) window.clearTimeout(timerRef.current);

    const userMessage = buildUserMessage(normalizedContent || '已添加附件，请结合附件内容分析。');
    userMessage.attachments = attachments;
    const pendingId = `workspace_pending_${Date.now()}`;
    // 创建加载中的占位消息
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: '正在结合工作台上下文生成回答...',
      loading: true,
    };

    const nextMessages = [...messages, userMessage, pendingMessage];
    const baseSession = sessionRef.current || createChatSession('workspace', createSessionTitle(normalizedContent));
    const pendingSession = {
      ...baseSession,
      title: baseSession.messages.length === 0 ? createSessionTitle(normalizedContent) : baseSession.title,
      messages: nextMessages,
      updatedAt: Date.now(),
    };

    sessionRef.current = pendingSession;
    upsertChatSession(pendingSession);
    setMessages(nextMessages);
    setValue('');
    setPendingAttachments([]);
    setIsAnswering(true);

    try {
      let streamedContent = '';
      await streamChatAnswer({
        question: normalizedContent,
        token,
        endpoint: 'general',
        onDelta: (delta) => {
          streamedContent += delta;
          const streamingMessages = nextMessages.map((item) =>
            item.id === pendingId ? { ...item, content: streamedContent || item.content, loading: true } : item,
          );
          setMessages(streamingMessages);
          upsertChatSession({ ...pendingSession, messages: streamingMessages, updatedAt: Date.now() });
        },
      });

      const completedMessages = nextMessages.map((item) =>
        item.id === pendingId ? { ...item, id: `workspace_answer_${Date.now()}`, content: streamedContent || item.content, loading: false } : item,
      );
      const completedSession = {
        ...pendingSession,
        messages: completedMessages,
        updatedAt: Date.now(),
      };

      sessionRef.current = completedSession;
      upsertChatSession(completedSession);
      setMessages(completedMessages);
      setIsAnswering(false);
      timerRef.current = null;
    } catch (error) {
      reportApiError(error, '工作台对话请求失败');
      const restoredMessages = nextMessages.filter((item) => item.id !== pendingId);
      const restoredSession = { ...pendingSession, messages: restoredMessages, updatedAt: Date.now() };
      sessionRef.current = restoredSession;
      upsertChatSession(restoredSession);
      setMessages(restoredMessages);
      setIsAnswering(false);
    }
  };

  /**
   * 输入框键盘事件处理
   * Enter 发送消息，Shift+Enter 换行
   */
  const onPressEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey) return;
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className={`workspace-page${isChatting ? ' is-chatting' : ''}`}>
      {/* 粒子流背景：全屏动态背景样式在 workspace/index.less 里控制。 */}
      <ParticleFlowBackground />
      <section className="workspace-stage">
        {!isChatting && (
          <>
            {/* 初始欢迎态：中央发光图标、欢迎语和快捷操作卡片。 */}
            <div className="workspace-orb">
              <StarFilled />
            </div>
            <div className="workspace-hero">
              <Typography.Title level={1}>{user?.name || workspaceMockProfile.greeting}，您好 👋</Typography.Title>
              <Typography.Paragraph>{workspaceMockProfile.description}</Typography.Paragraph>
            </div>
            <div className="workspace-card-grid">
              {workspaceCards.map((item) => (
                <Card
                  key={item.title}
                  className="workspace-action-card"
                  hoverable
                  onClick={() => sendMessage(item.prompt)}
                >
                  <div className="workspace-card-icon" style={{ '--workspace-icon-bg': item.color } as React.CSSProperties}>
                    {workspaceIconMap[item.icon]}
                  </div>
                  <div>
                    <Typography.Title level={3}>{item.title}</Typography.Title>
                    <Typography.Paragraph>{item.description}</Typography.Paragraph>
                  </div>
                  <Button
                    shape="circle"
                    icon={<ArrowRightOutlined />}
                    className="workspace-card-arrow"
                    disabled={isAnswering}
                    onClick={(event) => {
                      event.stopPropagation();
                      sendMessage(item.prompt);
                    }}
                  />
                </Card>
              ))}
            </div>
          </>
        )}

        {isChatting && (
          /* 对话态：发出第一条消息后切换到聊天记录区域。 */
          <div className="workspace-conversation">
            <div className="conversation-head">
              <Avatar src={aiLogo} size={46} />
              <div>
                <Typography.Title level={3}>工作台 AI 对话</Typography.Title>
                <Typography.Text>围绕市场、趋势、项目推进和数据安全继续追问。</Typography.Text>
              </div>
            </div>
            <div ref={transcriptRef} className="workspace-transcript">
              {messages.map((message) => (
                <div key={message.id} className={`workspace-message ${message.role}`}>
                  <Avatar
                    className="workspace-message-avatar"
                    src={message.role === 'assistant' ? aiLogo : undefined}
                    icon={message.role === 'user' ? <UserOutlined /> : undefined}
                  >
                    {message.role === 'user' ? user?.name?.slice(0, 1) : null}
                  </Avatar>
                  <div className="workspace-bubble">
                    <Typography.Text className="workspace-message-name">
                      {message.role === 'assistant' ? 'Yago Intellect AI' : user?.name || '我'}
                    </Typography.Text>
                    <SafeRichText content={message.content} />
                    <AttachmentList attachments={message.attachments} compact />
                    {message.sections && !message.loading && (
                      <div className="workspace-answer-sections">
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
          </div>
        )}

        {/* 底部输入栏：加号、文本框、发送按钮都在这里调整。 */}
        <input ref={fileInputRef} type="file" multiple className="chat-file-input" onChange={handleFileChange} />
        <AttachmentList attachments={pendingAttachments} onRemove={removePendingAttachment} floating />
        <div className="workspace-chatbar">
          <div className="workspace-chatbar-row">
            <Button shape="circle" icon={<PlusOutlined />} className="workspace-plus" onClick={openFilePicker} />
            <Input.TextArea
              value={value}
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={isAnswering}
              onChange={(event) => setValue(event.target.value)}
              onPressEnter={onPressEnter}
              placeholder="请输入您的问题..."
            />
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<SendOutlined />}
              disabled={(!value.trim() && pendingAttachments.length === 0) || isAnswering}
              onClick={() => sendMessage()}
              className="workspace-send"
            />
          </div>
        </div>
        <div className="workspace-disclaimer">
          <InfoCircleOutlined />
          <span>{workspaceMockProfile.disclaimer}</span>
        </div>
      </section>
    </div>
  );
}
