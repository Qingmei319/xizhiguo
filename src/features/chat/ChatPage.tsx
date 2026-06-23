import { CopyOutlined, PaperClipOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Collapse, Input, Select, Space, Spin, Tag, Tooltip, Typography, message as antdMessage } from 'antd';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AttachmentList } from '@/components/chat/AttachmentList';
import { SafeRichText, htmlToPlainText } from '@/components/chat/SafeRichText';
import { createChatAttachments } from '@/services/chatAttachments';
import { chatPrompts, initialMessages } from '@/services/mock/chat.mock';
import { streamChatAnswer } from '@/services/chat.service';
import { createChatSession, createSessionTitle, getSourceSessions, upsertChatSession } from '@/services/chatHistory';
import { getKnowledgeBases, type KnowledgeBase } from '@/services/knowledge.service';
import { reportApiError } from '@/services/http';
import { useAuthStore } from '@/stores/auth.store';
import type { ChatAttachment, ChatMessage, ChatSession, ChatSource } from '@/types/chat';
import aiLogo from '@/assets/logo.png';
import './index.less';

const CHAT_SOURCE: ChatSource = 'fruit_assistant';
const ALL_KNOWLEDGE_BASE_ID = -1;
const THINKING_MESSAGE = '正在思考并检索相关知识...';
const THINKING_STEPS = ['理解问题', '检索知识库', '组织答案'];

function createDefaultSession() {
  return createChatSession(CHAT_SOURCE, '新的对话', initialMessages);
}

function MessageAvatar({ role, userName }: { role: ChatMessage['role']; userName?: string }) {
  if (role === 'assistant') {
    return <Avatar size={42} className="chat-avatar ai-avatar" src={aiLogo} />;
  }

  return (
    <Avatar size={42} className="chat-avatar user-avatar" icon={!userName ? <UserOutlined /> : undefined}>
      {userName?.slice(0, 1)}
    </Avatar>
  );
}

function ThinkingBlock({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="thinking-block">
      <Space>
        <Spin size="small" />
        <strong>{THINKING_MESSAGE}</strong>
      </Space>
      <div className="thinking-steps">
        {steps.map((step, index) => (
          <span key={step} className={index < activeStep ? 'done' : index === activeStep ? 'active' : ''}>
            <i>{index + 1}</i>
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function CollapsePanel({ label, children, className }: { label: ReactNode; children: ReactNode; className: string }) {
  return (
    <Collapse
      className={`collapse-panel ${className}`}
      ghost
      defaultActiveKey={[]}
      items={[
        {
          key: 'panel',
          label: <Typography.Text className="collapse-panel-label">{label}</Typography.Text>,
          children,
        },
      ]}
    />
  );
}

function StreamedText({ content, loading }: { content: string; loading?: boolean }) {
  return <SafeRichText content={content} className={`chat-message-content${loading ? ' chat-message-content-streaming' : ''}`} />;
}

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [searchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId') || '';
  const restoredSession = requestedSessionId ? getSourceSessions(CHAT_SOURCE).find((session) => session.id === requestedSessionId) || null : null;

  const [session, setSession] = useState<ChatSession>(() => restoredSession || createDefaultSession());
  const [value, setValue] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<number>(ALL_KNOWLEDGE_BASE_ID);
  const [activeThinkingStep, setActiveThinkingStep] = useState(0);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = session.messages;
  const isAnswering = messages.some((message) => message.loading);
  const showLanding = messages.length <= initialMessages.length;

  const lastAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant' && !message.loading),
    [messages],
  );

  const replaceSessionMessages = (updater: (messages: ChatMessage[]) => ChatMessage[], nextTitle?: string) => {
    setSession((current) => {
      const nextSession = {
        ...current,
        title: nextTitle || current.title,
        messages: updater(current.messages),
        updatedAt: Date.now(),
      };
      upsertChatSession(nextSession);
      return nextSession;
    });
  };

  useEffect(() => {
    if (!requestedSessionId) return;
    const requestedSession = getSourceSessions(CHAT_SOURCE).find((item) => item.id === requestedSessionId);
    if (!requestedSession) return;
    setSession(requestedSession);
  }, [requestedSessionId]);

  useEffect(() => {
    getKnowledgeBases()
      .then((items) => {
        setKnowledgeBases(items);
        setSelectedKnowledgeBaseId(ALL_KNOWLEDGE_BASE_ID);
      })
      .catch((error) => reportApiError(error, '知识库列表获取失败'));
  }, []);

  useEffect(() => {
    if (!isAnswering) {
      setActiveThinkingStep(0);
      return;
    }

    setActiveThinkingStep(0);
    const timer = window.setInterval(() => {
      setActiveThinkingStep((step) => Math.min(step + 1, THINKING_STEPS.length - 1));
    }, 360);

    return () => window.clearInterval(timer);
  }, [isAnswering]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    upsertChatSession(session);
  }, [session]);

  const copyMessage = async (message?: ChatMessage) => {
    if (!message || !navigator.clipboard) return;

    try {
      const text = [
        htmlToPlainText(message.content),
        message.thoughts?.join('\n') || '',
        message.sections?.map((item) => `${item.title}\n${item.content}`).join('\n\n') || '',
      ]
        .filter(Boolean)
        .join('\n\n');
      await navigator.clipboard.writeText(text);
      antdMessage.success('回答已复制');
    } catch {
      antdMessage.warning('复制失败，请手动选择文本');
    }
  };

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

  const sendMessage = async (content = value) => {
    const normalizedContent = content.trim();
    const attachments = pendingAttachments;
    if ((!normalizedContent && attachments.length === 0) || isAnswering) return;

    const pendingId = `m_pending_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: `m_${Date.now()}`,
      role: 'user',
      content: normalizedContent || '已添加附件，请结合附件内容分析。',
      attachments,
    };
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: 'assistant',
      content: THINKING_MESSAGE,
      thoughts: THINKING_STEPS,
      loading: true,
    };
    const shouldRename = session.title === '新的对话' || session.messages.length <= initialMessages.length;

    replaceSessionMessages((items) => [...items, userMessage, pendingMessage], shouldRename ? createSessionTitle(normalizedContent) : undefined);
    setValue('');
    setPendingAttachments([]);

    try {
      let streamedContent = '';
      await streamChatAnswer({
        question: normalizedContent,
        kbId: selectedKnowledgeBaseId === ALL_KNOWLEDGE_BASE_ID ? null : selectedKnowledgeBaseId,
        token,
        endpoint: 'agri',
        onDelta: (delta) => {
          streamedContent += delta;
          replaceSessionMessages((items) =>
            items.map((item) => (item.id === pendingId ? { ...item, content: streamedContent || THINKING_MESSAGE, loading: true } : item)),
          );
        },
        onDone: (meta) => {
          replaceSessionMessages((items) =>
            items.map((item) =>
              item.id === pendingId
                ? {
                    ...item,
                    thoughts: meta.reasoning ? [meta.reasoning] : THINKING_STEPS,
                  }
                : item,
            ),
          );
        },
      });

      replaceSessionMessages((items) =>
        items.map((item) =>
          item.id === pendingId
            ? {
                ...item,
                id: `m_answer_${Date.now()}`,
                content: streamedContent || item.content,
                loading: false,
              }
            : item,
        ),
      );
    } catch (error) {
      reportApiError(error, '对话请求失败');
      replaceSessionMessages((items) => items.filter((item) => item.id !== pendingId));
    }
  };

  const onComposerPressEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.shiftKey) return;
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="chat-page image-scene agri-scene">
      <div className="chat-page-overlay" />
      <Card className={`glow-card chat-window ${showLanding ? 'landing-mode' : 'chatting-mode'}`}>
        <div className="chat-window-header chat-context-header">
          <div className="chat-header-copy">
            <h4>亚果蔬 AI 助手</h4>
            <Typography.Text>{lastAssistantMessage ? '可继续接着上次的问答' : '默认选择所有知识库'}</Typography.Text>
          </div>
          <Select
            value={selectedKnowledgeBaseId}
            options={[
              { label: '所有知识库', value: ALL_KNOWLEDGE_BASE_ID },
              ...knowledgeBases.map((item) => ({ label: item.name, value: item.id })),
            ]}
            onChange={(nextValue) => setSelectedKnowledgeBaseId(nextValue)}
          />
        </div>

        <div ref={transcriptRef} className="chat-transcript-frame">
          <div className="chat-transcript-stack">
            {showLanding ? (
              <div className="chat-landing">
                <div className="chat-landing-card">
                  <Avatar size={120} className="chat-landing-badge" src={aiLogo} />
                  <div className="chat-landing-copy">
                    <Typography.Title level={2}>你好，{user?.name || '用户'}</Typography.Title>
                    <Typography.Paragraph>
                      我可以为你做果蔬知识问答、种植建议、病虫害分析、政策解读和知识库检索，回答会保持流式输出和思考状态。
                    </Typography.Paragraph>
                    <Typography.Text>你可以直接提问，或者先从下方示例开始。</Typography.Text>
                  </div>
                </div>

                <div className="chat-landing-grid">
                  {chatPrompts.slice(0, 3).map((item) => (
                    <Button key={item.title} className="landing-prompt-pill" onClick={() => sendMessage(item.prompt)}>
                      <span className="pill-icon" style={{ background: item.color }}>
                        {item.title.slice(0, 1)}
                      </span>
                      <span className="pill-label">{item.title}</span>
                      <SendOutlined className="pill-arrow" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((chatMessage) => (
                  <div key={chatMessage.id} className={`chat-message ${chatMessage.role}`}>
                    <MessageAvatar role={chatMessage.role} userName={user?.name} />
                    <div className="chat-message-bubble">
                      <div className="chat-message-meta">
                        <Tag color={chatMessage.role === 'assistant' ? 'blue' : 'green'}>
                          {chatMessage.role === 'assistant' ? 'AI 助手' : user?.name || '用户'}
                        </Tag>
                        {chatMessage.role === 'assistant' && !chatMessage.loading && (
                          <Tooltip title="复制回答">
                            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyMessage(chatMessage)} />
                          </Tooltip>
                        )}
                      </div>

                      {chatMessage.loading && <ThinkingBlock steps={chatMessage.thoughts || THINKING_STEPS} activeStep={activeThinkingStep} />}
                      {chatMessage.thoughts && !chatMessage.loading && (
                        <CollapsePanel className="thinking-collapse" label="思考摘要">
                          <div className="thinking-summary">
                            {chatMessage.thoughts.map((thought) => (
                              <p key={thought}>{thought}</p>
                            ))}
                          </div>
                        </CollapsePanel>
                      )}
                      <StreamedText content={chatMessage.content} loading={chatMessage.loading} />
                      <AttachmentList attachments={chatMessage.attachments} compact />
                      {chatMessage.sections && (
                        <div className="answer-section-list">
                          {chatMessage.sections.map((section) => (
                            <div key={section.title} className="answer-section">
                              <strong>{section.title}</strong>
                              <p>{section.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {chatMessage.citations && (
                        <CollapsePanel className="citation-collapse" label={`参考来源 ${chatMessage.citations.length} 条`}>
                          <div className="citation-list">
                            {chatMessage.citations.map((citation) => (
                              <div key={citation.id} className="citation-item">
                                <Space wrap>
                                  <Tag color="processing">{citation.source}</Tag>
                                  <strong>{citation.title}</strong>
                                  <span>相似度 {Math.round(citation.score * 100)}%</span>
                                </Space>
                                <p>{citation.snippet}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsePanel>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <input ref={fileInputRef} type="file" multiple className="chat-file-input" onChange={handleFileChange} />
        <AttachmentList attachments={pendingAttachments} onRemove={removePendingAttachment} floating />
        <div className="chat-input">
          <Tooltip title="添加附件">
            <Button size="large" shape="circle" icon={<PaperClipOutlined />} onClick={openFilePicker} />
          </Tooltip>
          <Input.TextArea
            value={value}
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={isAnswering}
            onChange={(event) => setValue(event.target.value)}
            onPressEnter={onComposerPressEnter}
            placeholder={showLanding ? '请输入你的问题...' : `继续提问，当前会话：${session.title || '亚果蔬 AI 助手'}`}
          />
          <Tooltip title="发送">
            <Button
              type="primary"
              size="large"
              shape="circle"
              icon={<SendOutlined />}
              disabled={(!value.trim() && pendingAttachments.length === 0) || isAnswering}
              onClick={() => sendMessage()}
            />
          </Tooltip>
        </div>
        {showLanding && <div className="chat-landing-disclaimer">AI 生成的内容仅供参考，请结合实际情况审慎判断和使用。</div>}
      </Card>
    </div>
  );
}
