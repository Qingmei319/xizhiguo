import type { ChatMessage } from '@/types/chat';

export interface ChatStreamOptions {
  question: string;
  kbId?: number | null;
  token?: string | null;
  endpoint?: 'general' | 'agri' | 'diagnose';
  onDelta: (delta: string) => void;
  onDone?: (meta: ChatStreamDoneMeta) => void;
}

export interface ChatStreamDoneMeta {
  from_knowledge_base?: boolean;
  kb_id?: number;
  reasoning?: string;
}

interface ParsedSseEvent {
  event?: string;
  data: string;
}

function splitSseBuffer(buffer: string, flush = false) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const remainder = flush ? '' : blocks.pop() || '';
  const events: ParsedSseEvent[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line && !line.startsWith(':'));

    if (lines.length === 0) continue;

    const dataLines: string[] = [];
    let eventName: string | undefined;

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex < 0) {
        dataLines.push(line);
        continue;
      }

      const field = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).replace(/^\s/, '');

      if (field === 'event') {
        eventName = value;
        continue;
      }

      if (field === 'data') {
        dataLines.push(value);
      }
    }

    if (dataLines.length > 0) {
      events.push({ event: eventName, data: dataLines.join('\n') });
    }
  }

  return { events, remainder };
}

export async function streamChatAnswer({
  question,
  kbId = null,
  token,
  endpoint = 'agri',
  onDelta,
  onDone,
}: ChatStreamOptions) {
  const response = await fetch(`/api/v1/chat/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question, kb_id: kbId }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`对话接口请求失败：${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  let doneMeta: ChatStreamDoneMeta = {};

  const handleEvent = (rawEvent: ParsedSseEvent) => {
    const text = rawEvent.data.trim();
    if (!text) return;

    if (text === '[DONE]' || rawEvent.event === 'done') {
      onDone?.(doneMeta);
      return;
    }

    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      // 非 JSON 的 SSE 片段，直接按增量文本处理。
      fullText += text;
      onDelta(text);
      return;
    }

    if (payload && typeof payload === 'object') {
      const eventObject = payload as Partial<ChatStreamDoneMeta> & {
        delta?: string;
        content?: string;
        done?: boolean;
        event?: string;
      };

      if (eventObject.done || eventObject.event === 'done') {
        doneMeta = { ...doneMeta, ...eventObject };
        onDone?.(doneMeta);
        return;
      }

      if (typeof eventObject.reasoning === 'string') {
        doneMeta = { ...doneMeta, reasoning: eventObject.reasoning };
      }

      const delta = typeof eventObject.delta === 'string' ? eventObject.delta : typeof eventObject.content === 'string' ? eventObject.content : '';
      if (delta) {
        fullText += delta;
        onDelta(delta);
        return;
      }
    }

    if (typeof payload === 'string') {
      fullText += payload;
      onDelta(payload);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, remainder } = splitSseBuffer(buffer);
    buffer = remainder;

    for (const event of events) {
      handleEvent(event);
    }
  }

  buffer += decoder.decode();
  const tail = splitSseBuffer(buffer, true);
  for (const event of tail.events) {
    handleEvent(event);
  }

  return buildStreamReply(fullText, doneMeta);
}

export function buildStreamReply(content: string, meta: ChatStreamDoneMeta = {}): ChatMessage {
  return {
    id: `m_answer_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    role: 'assistant',
    content: content || '已完成回答。',
    thoughts: meta.reasoning ? [meta.reasoning] : undefined,
  };
}
