/**
 * @file GenePage.tsx
 * @description 基因智查页面 —— 提供基因功能查询、表达谱分析、代谢通路关联和表型验证建议的 AI 对话界面。
 *   欢迎态展示品牌卡片和四个快捷研究入口，对话态显示结构化基因分析回复。
 * @module features/gene
 */
import {
  ArrowRightOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  PaperClipOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Input, Typography } from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AttachmentList } from '@/components/chat/AttachmentList';
import { SafeRichText } from '@/components/chat/SafeRichText';
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
import { genePrompts } from '@/services/mock/gene.mock';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatAttachment, ChatMessage, ChatSession, PromptCard } from '@/types/chat';
import aiLogo from '@/assets/logo.png';
import './index.less';

/** 快捷操作卡片的图标映射表 */
const geneIconMap = [<FileSearchOutlined />, <ExperimentOutlined />, <DatabaseOutlined />, <ClusterOutlined />];

/**
 * 基因智查主页面
 *
 * 核心功能：
 * - 欢迎态：展示基因智查品牌卡片和四个快捷研究入口（文件检索、实验设计、数据库查询、聚类分析）
 * - 对话态：实时消息流，提供基因功能解读、通路关联和验证建议
 * - 多会话管理：支持从 URL 参数恢复历史基因查询会话
 *
 * 对话数据通过 localStorage 自动持久化，切换页面不会丢失。
 *
 * @component
 */
export function GenePage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId') || '';
  const restoredSession = requestedSessionId
    ? getStoredChatSessions().find((session) => session.id === requestedSessionId && session.source === 'gene_inspection')
    : null;
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => restoredSession?.messages || []);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef<ChatSession | null>(restoredSession || null);
  const isChatting = messages.length > 0;

  useEffect(() => {
    if (!requestedSessionId) return;
    const session = getStoredChatSessions().find((item) => item.id === requestedSessionId && item.source === 'gene_inspection');
    if (!session) return;

    sessionRef.current = session;
    setMessages(session.messages);
  }, [requestedSessionId]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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
   * 发送基因智查消息
   * 创建用户消息和加载中的 AI 回复，通过 setTimeout 模拟异步基因分析响应，
   * 同时将对话数据持久化到 localStorage
   */
  const sendMessage = async (content = query) => {
    const normalizedContent = content.trim();
    const attachments = pendingAttachments;
    if ((!normalizedContent && attachments.length === 0) || isAnswering) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    const userMessage = buildUserMessage(normalizedContent || '已添加附件，请结合附件内容分析。');
    userMessage.attachments = attachments;
    const pendingId = `gene_pending_${Date.now()}`;
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: '正在检索基因注释、表达谱、通路和相关文献...',
      loading: true,
    };

    const nextMessages = [...messages, userMessage, pendingMessage];
    const baseSession = sessionRef.current || createChatSession('gene_inspection', createSessionTitle(normalizedContent));
    const pendingSession = {
      ...baseSession,
      title: baseSession.messages.length === 0 ? createSessionTitle(normalizedContent) : baseSession.title,
      messages: nextMessages,
      updatedAt: Date.now(),
    };

    sessionRef.current = pendingSession;
    upsertChatSession(pendingSession);
    setMessages(nextMessages);
    setQuery('');
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
        item.id === pendingId ? { ...item, id: `gene_answer_${Date.now()}`, content: streamedContent || item.content, loading: false } : item,
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
      reportApiError(error, '基因智查对话请求失败');
      const restoredMessages = nextMessages.filter((item) => item.id !== pendingId);
      const restoredSession = { ...pendingSession, messages: restoredMessages, updatedAt: Date.now() };
      sessionRef.current = restoredSession;
      upsertChatSession(restoredSession);
      setMessages(restoredMessages);
      setIsAnswering(false);
    }
  };

  /**
   * 快捷提示卡片点击处理
   * 直接使用卡片预设的 prompt 发送消息
   */
  const handlePromptClick = (item: PromptCard) => {
    sendMessage(item.prompt);
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
    <div className={`gene-page gene-workspace image-scene lab-scene${isChatting ? ' is-chatting' : ''}`}>
      <main className="gene-workspace-inner">
        {!isChatting && (
          <>
            {/* 初始欢迎卡片：页面主说明、头像标识和白色卡片样式在 gene/index.less 中调整。 */}
            <Card className="welcome-card gene-welcome assistant-welcome">
              <Avatar size={96} className="school-emblem gene-emblem">
                DNA
              </Avatar>
              <div>
                <Typography.Title level={2}>您好，{user?.name || '张农业'}！我是基因智查 AI 助手</Typography.Title>
                <Typography.Paragraph>
                  我可以帮您快速检索基因信息、解读基因功能、分析表达谱、关联代谢通路与表型，并结合最新文献与数据库，为您的研究提供专业支持。
                </Typography.Paragraph>
                <Typography.Text>您可以直接提问，或从下方示例中选择：</Typography.Text>
              </div>
            </Card>

            {/* 快捷问题卡片区：四个入口卡片的布局、图标和 hover 效果。 */}
            <div className="gene-action-grid">
              {genePrompts.map((item, index) => (
                <Card key={item.title} className="gene-action-card" onClick={() => handlePromptClick(item)}>
                  <div className="gene-action-icon" style={{ color: item.color, borderColor: `${item.color}88` }}>
                    {geneIconMap[index]}
                  </div>
                  <div className="gene-action-copy">
                    <Typography.Title level={4}>{item.title}</Typography.Title>
                    <Typography.Paragraph>{item.description}</Typography.Paragraph>
                  </div>
                  <Button
                    shape="circle"
                    icon={<ArrowRightOutlined />}
                    className="gene-action-arrow"
                    disabled={isAnswering}
                    onClick={(event) => {
                      event.stopPropagation();
                      handlePromptClick(item);
                    }}
                  />
                </Card>
              ))}
            </div>
          </>
        )}

        {isChatting && (
          /* 对话态：显示基因智查的消息头和聊天记录。 */
          <div className="gene-conversation">
            <div className="gene-conversation-head">
              <Avatar src={aiLogo} size={46} />
              <div>
                <Typography.Title level={3}>基因智查 AI 对话</Typography.Title>
                <Typography.Text>围绕基因功能、表达谱、代谢通路、表型关联和检测结论持续追问。</Typography.Text>
              </div>
            </div>
            <div ref={transcriptRef} className="gene-transcript">
              {messages.map((message) => (
                <div key={message.id} className={`gene-message ${message.role}`}>
                  <Avatar
                    className="gene-message-avatar"
                    src={message.role === 'assistant' ? aiLogo : undefined}
                    icon={message.role === 'user' ? <UserOutlined /> : undefined}
                  >
                    {message.role === 'user' ? user?.name?.slice(0, 1) : null}
                  </Avatar>
                  <div className="gene-bubble">
                    <Typography.Text className="gene-message-name">
                      {message.role === 'assistant' ? '基因智查 AI' : user?.name || '我'}
                    </Typography.Text>
                    <SafeRichText content={message.content} />
                    <AttachmentList attachments={message.attachments} compact />
                    {message.sections && !message.loading && (
                      <div className="gene-answer-sections">
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

        {/* 底部输入面板：附件按钮、输入框和发送按钮。 */}
        <input ref={fileInputRef} type="file" multiple className="chat-file-input" onChange={handleFileChange} />
        <AttachmentList attachments={pendingAttachments} onRemove={removePendingAttachment} floating />
        <div className="gene-input-panel">
          <div className="gene-input-row">
            <Button shape="circle" size="large" icon={<PaperClipOutlined />} className="gene-attach-btn" onClick={openFilePicker} />
            <Input.TextArea
              value={query}
              autoSize={{ minRows: 1, maxRows: 3 }}
              disabled={isAnswering}
              onChange={(event) => setQuery(event.target.value)}
              onPressEnter={onPressEnter}
              placeholder="向基因智查 AI 提问..."
            />
            <Button
              type="primary"
              shape="circle" 
              size="large"
              icon={<SendOutlined />}
              disabled={(!query.trim() && pendingAttachments.length === 0) || isAnswering}
              className="gene-send-btn"
              onClick={() => sendMessage()}
            />
          </div>
        </div>

        <div className="gene-disclaimer">
          <InfoCircleOutlined />
          <span>分析结果由 AI 生成，请结合专业实验数据参考</span>
        </div>
      </main>
    </div>
  );
}
