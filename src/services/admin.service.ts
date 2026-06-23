import { http, unwrapData, unwrapPage, type ApiResponse, type PaginatedApiResponse } from '@/services/http';

export interface AdminLogItem {
  id: number;
  conversation_id: string;
  question: string;
  answer: string;
  sources: Array<{ title?: string; source?: string; score?: number; snippet?: string }>;
  tool_used: string | null;
  is_corrected: boolean;
  correction: string | null;
  created_at: string | null;
}

export interface AdminStats {
  knowledge_bases: { total: number };
  documents: { total: number; by_status: Record<string, number> };
  chat_logs: { total: number; corrected: number };
  qdrant: Record<string, unknown>;
}

export async function getAdminLogs(params: { page?: number; page_size?: number; keyword?: string; is_corrected?: boolean | null }) {
  return unwrapPage<AdminLogItem>(
    await http.get<PaginatedApiResponse<AdminLogItem>>('/admin/logs', { params }),
  );
}

export async function correctAdminLog(logId: number, correction: string) {
  return unwrapData(
    await http.post<ApiResponse<unknown>>(`/admin/logs/${logId}/correct`, null, {
      params: { correction },
    }),
  );
}

export async function getAdminStats() {
  return unwrapData(await http.get<ApiResponse<AdminStats>>('/admin/stats'));
}

