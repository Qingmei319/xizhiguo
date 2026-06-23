import type { ChatAttachment } from '@/types/chat';

export function createChatAttachments(files: FileList | File[]) {
  return Array.from(files).map((file) => ({
    id: `att_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
  }));
}

export function formatAttachmentSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
