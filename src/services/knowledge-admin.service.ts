import { http, unwrapData, unwrapPage, type ApiResponse, type PaginatedApiResponse } from '@/services/http';

export interface KnowledgeBaseItem {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface KnowledgeDocumentItem {
  id: string;
  kb_id: number;
  title: string;
  source_type: string | null;
  description: string | null;
  tags: string[];
  chunk_count: number;
  file_name: string;
  status: string;
  error_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export async function getKnowledgeBasesAdmin(params?: { page?: number; page_size?: number }) {
  return unwrapPage<KnowledgeBaseItem>(
    await http.get<PaginatedApiResponse<KnowledgeBaseItem>>('/knowledge/bases', {
      params: { page: 1, page_size: 100, ...params },
    }),
  );
}

export async function getKnowledgeDocuments(params?: {
  kb_id?: number | null;
  source_type?: string | null;
  page?: number;
  page_size?: number;
}) {
  return unwrapPage<KnowledgeDocumentItem>(
    await http.get<PaginatedApiResponse<KnowledgeDocumentItem>>('/knowledge/documents', { params }),
  );
}

export async function deleteKnowledgeBase(kbId: number) {
  return unwrapData(await http.delete<ApiResponse<unknown>>(`/knowledge/bases/${kbId}`));
}

export async function deleteKnowledgeDocument(docId: string) {
  return unwrapData(await http.delete<ApiResponse<unknown>>(`/knowledge/documents/${docId}`));
}

export async function updateKnowledgeDocument(docId: string, payload: Record<string, unknown>) {
  return unwrapData(await http.put<ApiResponse<unknown>>(`/knowledge/documents/${docId}`, payload));
}

export async function uploadKnowledgeDocument(payload: {
  file: File;
  kb_id: number;
  title: string;
  source_type?: string;
  description?: string;
  tags?: string;
}) {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('kb_id', String(payload.kb_id));
  formData.append('title', payload.title);
  if (payload.source_type) formData.append('source_type', payload.source_type);
  if (payload.description) formData.append('description', payload.description);
  if (payload.tags) formData.append('tags', payload.tags);
  return unwrapData(
    await http.post<ApiResponse<KnowledgeDocumentItem>>('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  );
}
