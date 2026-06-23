import { CloseOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { formatAttachmentSize } from '@/services/chatAttachments';
import type { ChatAttachment } from '@/types/chat';

interface AttachmentListProps {
  attachments?: ChatAttachment[];
  onRemove?: (id: string) => void;
  compact?: boolean;
  inline?: boolean;
  floating?: boolean;
}

export function AttachmentList({ attachments, onRemove, compact, inline, floating }: AttachmentListProps) {
  if (!attachments?.length) return null;

  const className = [
    'chat-attachment-list',
    compact ? 'compact' : '',
    inline ? 'inline' : '',
    floating ? 'floating' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      {attachments.map((attachment) => (
        <span key={attachment.id} className="chat-attachment-item">
          <PaperClipOutlined />
          <span className="chat-attachment-name" title={attachment.name}>{attachment.name}</span>
          <small>{formatAttachmentSize(attachment.size)}</small>
          {onRemove && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => onRemove(attachment.id)}
            />
          )}
        </span>
      ))}
    </div>
  );
}
