import { http, unwrapPage, type PaginatedApiResponse } from '@/services/http';

export interface KnowledgeBase {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string | null;
}

export async function getKnowledgeBases() {
  const response = unwrapPage<KnowledgeBase>(await http.get<PaginatedApiResponse<KnowledgeBase>>('/knowledge/bases', { params: { page: 1, page_size: 100 } }));
  return response.data;
}
