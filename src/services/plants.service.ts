import { http, unwrapData, unwrapPage, type ApiResponse, type PaginatedApiResponse } from '@/services/http';

export interface PlantCategory {
  id: number;
  name: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  plant_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Plant {
  id: number;
  category_id: number | null;
  category_name: string | null;
  name: string;
  scientific_name: string | null;
  cover_image: string | null;
  images: string[];
  growth_location: string | null;
  growth_cycle: string | null;
  planting_season: string | null;
  harvest_season: string | null;
  suitable_temperature: string | null;
  soil_requirement: string | null;
  water_requirement: string | null;
  light_requirement: string | null;
  description: string | null;
  attributes: Record<string, unknown>;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export async function getPlantCategories() {
  return unwrapData(await http.get<ApiResponse<PlantCategory[]>>('/plants/categories', { params: { active_only: true } }));
}

export async function getPlants(params: { category_id?: number; keyword?: string; page?: number; page_size?: number } = {}) {
  const response = unwrapPage<Plant>(
    await http.get<PaginatedApiResponse<Plant>>('/plants', {
      params: {
        active_only: true,
        page: 1,
        page_size: 100,
        ...params,
      },
    }),
  );
  return response.data;
}
