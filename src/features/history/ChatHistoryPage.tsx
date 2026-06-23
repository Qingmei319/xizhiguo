/**
 * 对话记录页面（ChatHistory）
 *
 * 统一管理所有 AI 对话会话，支持：
 * 1. 左侧会话列表 — 显示所有会话标题、来源标签和最后更新时间
 * 2. 右侧会话详情 — 展示选中会话的完整消息记录
 * 3. 搜索过滤 — 支持按关键词搜索标题/消息内容
 * 4. 来源筛选 — 支持按对话来源（工作台/亚果蔬助手/基因智查）筛选
 * 5. 会话管理 — 支持重命名和删除会话
 * 6. 继续对话 — 点击"继续对话"跳转到对应模块的对话页面
 *
 * 数据来源：localStorage 中持久化的对话会话
 *
 * @module features/history
 */

import { DeleteOutlined, EditOutlined, MessageOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, List, Modal, Select, Space, Tag, Tooltip, Typography, message as antdMessage } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  chatSourceMap,
  chatSources,
  deleteChatSession,
  formatSessionTime,
  getStoredChatSessions,
  renameChatSession,
} from '@/services/chatHistory';
import { SafeRichText, normalizeChatText } from '@/components/chat/SafeRichText';
import type { ChatSession, ChatSource } from '@/types/chat';
import './index.less';

/** 来源筛选选项列表（全部 + 各模块来源） */
const sourceOptions = [
  { label: '全部来源', value: 'all' },
  ...chatSources.map((source) => ({ label: source.label, value: source.key })),
];

/**
 * 获取会话的最后一条消息预览
 * 用于会话列表的摘要展示
 * @param session 对话会话对象
 * @returns 最后一条非空消息的内容，若无则返回"暂无消息内容"
 */
function getSessionPreview(session: ChatSession) {
  const lastMessage = [...session.messages].reverse().find((message) => message.content?.trim());
  return normalizeChatText(lastMessage?.content || '') || '暂无消息内容';
}

/**
 * 对话记录主页面
 *
 * 核心功能：
 * - 左侧会话列表：显示所有会话标题、来源标签和最后更新时间
 * - 右侧会话详情：展示选中会话的完整消息记录
 * - 搜索过滤：支持按关键词搜索标题/消息内容
 * - 来源筛选：支持按对话来源（工作台/亚果蔬助手/基因智查）筛选
 * - 会话管理：支持重命名和删除会话
 * - 继续对话：点击"继续对话"跳转到对应模块的对话页面
 *
 * 数据来源：localStorage 中持久化的对话会话
 *
 * @component
 */
export function ChatHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>(() => getStoredChatSessions());
  const [activeId, setActiveId] = useState(() => getStoredChatSessions()[0]?.id || '');
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState<ChatSource | 'all'>('all');
  const [renamingSession, setRenamingSession] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState('');

  /** 刷新会话列表（从 localStorage 重新读取） */
  const refreshSessions = () => {
    const nextSessions = getStoredChatSessions();
    setSessions(nextSessions);
    setActiveId((current) => (nextSessions.some((session) => session.id === current) ? current : nextSessions[0]?.id || ''));
  };

  useEffect(() => {
    window.addEventListener('chat-history-updated', refreshSessions);
    return () => window.removeEventListener('chat-history-updated', refreshSessions);
  }, []);

  /** 根据关键词和来源筛选会话列表 */
  const filteredSessions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchedSource = source === 'all' || session.source === source;
      const searchable = normalizeChatText(
        `${session.title} ${session.messages.map((message) => message.content).join(' ')}`,
      ).toLowerCase();
      const matchedKeyword = !normalizedKeyword || searchable.includes(normalizedKeyword);
      return matchedSource && matchedKeyword;
    });
  }, [keyword, sessions, source]);

  const activeSession = useMemo(
    () => filteredSessions.find((session) => session.id === activeId) || filteredSessions[0],
    [activeId, filteredSessions],
  );

  /**
   * 删除会话
   * 从 localStorage 中移除该会话，并刷新会话列表
   */
  const handleDelete = (session: ChatSession) => {
    deleteChatSession(session.id);
    antdMessage.success('对话记录已删除');
    refreshSessions();
  };

  const openRenameModal = (session: ChatSession) => {
    setRenamingSession(session);
    setRenameValue(session.title);
  };

  const handleRename = () => {
    const nextTitle = renameValue.trim();
    if (!renamingSession) return;
    if (!nextTitle) {
      antdMessage.warning('请输入对话名称');
      return;
    }

    renameChatSession(renamingSession.id, nextTitle);
    antdMessage.success('对话已重命名');
    setRenamingSession(null);
    setRenameValue('');
    refreshSessions();
  };

  const continueConversation = (session: ChatSession) => {
    const sourceMeta = chatSourceMap[session.source || 'fruit_assistant'];
    navigate(`${sourceMeta.route}?sessionId=${encodeURIComponent(session.id)}`);
  };

  return (
    <div className="chat-history-page">
      {/* 顶部工具栏：页面标题、搜索框、来源筛选和刷新按钮。 */}
      <div className="history-toolbar">
        <div>
          <Typography.Title level={2}>对话记录</Typography.Title>
          <Typography.Text>统一查看工作台、亚果蔬小助手和基因智检产生的 AI 对话。</Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题或消息"
          />
          <Select value={source} options={sourceOptions} onChange={setSource} />
          <Button icon={<ReloadOutlined />} onClick={refreshSessions}>刷新</Button>
        </Space>
      </div>

      {/* 两栏布局：左侧会话列表，右侧选中会话详情。 */}
      <div className="history-layout">
        <Card className="history-list-card">
          <List
            dataSource={filteredSessions}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无对话记录" /> }}
            renderItem={(session) => {
              const sourceMeta = chatSourceMap[session.source || 'fruit_assistant'];
              return (
                <List.Item
                  className={session.id === activeSession?.id ? 'active' : ''}
                  actions={[
                    <Tooltip key="rename" title="重命名">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openRenameModal(session);
                        }}
                      />
                    </Tooltip>,
                    <Tooltip key="delete" title="删除">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(session);
                        }}
                      />
                    </Tooltip>,
                  ]}
                  onClick={() => setActiveId(session.id)}
                >
                  <List.Item.Meta
                    avatar={<span className="source-mark" style={{ background: sourceMeta.color }}><MessageOutlined /></span>}
                    title={
                      <Space size={8} wrap>
                        <span>{session.title}</span>
                        <Tag color="processing">{sourceMeta.label}</Tag>
                      </Space>
                    }
                    description={
                      <>
                        <span>{formatSessionTime(session.updatedAt)} · {session.messages.length} 条消息</span>
                        <p>{getSessionPreview(session)}</p>
                      </>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>

        <Card className="history-detail-card">
          {activeSession ? (
            <>
              <div className="history-detail-head">
                <div>
                  <Typography.Title level={3}>{activeSession.title}</Typography.Title>
                  <Space wrap>
                    <Tag color="blue">{chatSourceMap[activeSession.source || 'fruit_assistant'].label}</Tag>
                    <Typography.Text>{formatSessionTime(activeSession.updatedAt)}</Typography.Text>
                  </Space>
                </div>
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openRenameModal(activeSession)}>重命名</Button>
                  <Button type="primary" onClick={() => continueConversation(activeSession)}>继续对话</Button>
                </Space>
              </div>
              <div className="history-message-list">
                {activeSession.messages.map((message) => (
                  <div key={message.id} className={`history-message ${message.role}`}>
                    <Tag color={message.role === 'assistant' ? 'blue' : 'green'}>{message.role === 'assistant' ? 'AI' : '用户'}</Tag>
                    <SafeRichText content={message.content} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty description="选择一条对话查看详情" />
          )}
        </Card>
      </div>

      {/* 重命名弹窗：修改对话标题时显示。 */}
      <Modal
        title="重命名对话"
        open={Boolean(renamingSession)}
        okText="保存"
        cancelText="取消"
        onOk={handleRename}
        onCancel={() => setRenamingSession(null)}
      >
        <Input
          autoFocus
          maxLength={30}
          showCount
          value={renameValue}
          onChange={(event) => setRenameValue(event.target.value)}
          onPressEnter={handleRename}
          placeholder="请输入新的对话名称"
        />
      </Modal>
    </div>
  );
}
