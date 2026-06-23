import { http, unwrapData, type ApiResponse } from '@/services/http';
import type { AlertItem, MetricItem, OverviewStatItem, RankingItem } from '@/types/dashboard';
import type { KnowledgeDomainItem } from '@/services/mock/dashboard.mock';

interface DashboardOverviewPayload {
  overview?: OverviewStatItem[];
  overview_stats?: OverviewStatItem[];
  metrics?: MetricItem[];
  metric_cards?: MetricItem[];
  top_metrics?: OverviewStatItem[];
  core_metrics?: MetricItem[];
  top_stats?: Record<string, { value?: unknown; unit?: string; label?: string }>;
  [key: string]: unknown;
}

interface DashboardTrendPayload {
  labels?: string[];
  data?: number[];
  dates?: string[];
  values?: number[];
  trend_labels?: string[];
  trend_data?: number[];
  items?: Array<{ date?: string; label?: string; value?: number; count?: number }>;
  trends?: Array<{ date?: string; label?: string; value?: number; count?: number }>;
  [key: string]: unknown;
}

interface DashboardWarningsPayload {
  warnings?: Array<{
    title?: string;
    region?: string;
    location?: string;
    level?: string;
    level_text?: string;
    time_ago?: string;
    time?: string;
  }>;
  data?: DashboardWarningsPayload['warnings'];
  [key: string]: unknown;
}

interface KnowledgeDistributionPayload {
  total?: number;
  update_time?: string;
  distribution?: Array<{
    name?: string;
    count?: number;
    percentage?: number;
  }>;
}

interface QaRankingPayload {
  ranking?: Array<{
    variety?: string;
    name?: string;
    qa_count?: number;
    value?: number;
    growth_rate?: string;
    trend?: string;
  }>;
}

function formatValue(value: unknown) {
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string') return value;
  return '0';
}

function normalizeOverviewItem(item: Record<string, unknown>): OverviewStatItem {
  return {
    label: String(item.label || item.title || item.name || ''),
    value: formatValue(item.value || item.count || item.total),
    suffix: typeof item.suffix === 'string' ? item.suffix : undefined,
  };
}

function normalizeMetricItem(item: Record<string, unknown>, index: number): MetricItem {
  const colors = ['#1f8bff', '#8f5cff', '#36a3ff', '#28d881'];
  return {
    title: String(item.title || item.label || item.name || ''),
    value: formatValue(item.value || item.count || item.total),
    trend: String(item.growth || item.rate || item.change || item.trend || '+0%'),
    color: String(item.color || colors[index % colors.length]),
    sparkline: Array.isArray(item.sparkline) ? item.sparkline.map(Number) : [10, 14, 12, 18, 16, 22, 20],
  };
}

export async function getDashboardOverview() {
  const data = unwrapData(await http.get<ApiResponse<DashboardOverviewPayload>>('/dashboard/overview'));
  const overviewSource = data.overview || data.overview_stats || data.top_metrics || [];
  const topStats = data.top_stats
    ? Object.values(data.top_stats).map((item) => ({
        label: item.label || '',
        value: item.value,
        suffix: item.unit,
      }))
    : [];
  const metricSource = data.metrics || data.metric_cards || data.core_metrics || [];

  return {
    overview: topStats.length > 0
      ? topStats.map((item) => normalizeOverviewItem(item)).filter((item) => item.label)
      : Array.isArray(overviewSource)
      ? overviewSource.map((item) => normalizeOverviewItem(item as unknown as Record<string, unknown>)).filter((item) => item.label)
      : [],
    metrics: Array.isArray(metricSource)
      ? metricSource.map((item, index) => normalizeMetricItem(item as unknown as Record<string, unknown>, index)).filter((item) => item.title)
      : [],
  };
}

export async function getDashboardTrends(days: number) {
  const data = unwrapData(await http.get<ApiResponse<DashboardTrendPayload>>('/dashboard/trends', { params: { days } }));
  const labels = data.labels || data.dates || data.trend_labels;
  const values = data.data || data.values || data.trend_data;

  if (Array.isArray(labels) && Array.isArray(values)) {
    return {
      labels: labels.map(String),
      data: values.map(Number),
    };
  }

  const trendItems = data.trends || data.items;
  if (Array.isArray(trendItems)) {
    return {
      labels: trendItems.map((item) => String(item.date || item.label || '')),
      data: trendItems.map((item) => Number(item.value || item.count || 0)),
    };
  }

  return { labels: [], data: [] };
}

export async function getDashboardWarnings(limit = 5): Promise<AlertItem[]> {
  const data = unwrapData(await http.get<ApiResponse<DashboardWarningsPayload>>('/dashboard/warnings', { params: { limit } }));
  const warnings = data.warnings || data.data || [];

  return warnings
    .map((item): AlertItem => {
      const level: AlertItem['level'] =
        item.level === 'red' || item.level === 'orange' || item.level_text === '紧急' || item.level_text === '严重'
          ? '高风险'
          : '中风险';

      return {
        title: item.title || '',
        location: item.region || item.location || '',
        level,
        time: item.time_ago || item.time || '',
      };
    })
    .filter((item) => item.title);
}

export async function getKnowledgeDistribution() {
  const data = unwrapData(await http.get<ApiResponse<KnowledgeDistributionPayload>>('/dashboard/knowledge-distribution'));

  return {
    total: data.total || 0,
    updateTime: data.update_time || '',
    items: (data.distribution || [])
      .map((item): KnowledgeDomainItem => ({
        name: item.name || '',
        value: Number(item.percentage ?? item.count ?? 0),
      }))
      .filter((item) => item.name),
  };
}

export async function getQaRanking(days = 30, limit = 5): Promise<RankingItem[]> {
  const data = unwrapData(await http.get<ApiResponse<QaRankingPayload>>('/dashboard/qa-ranking', { params: { days, limit } }));

  return (data.ranking || [])
    .map((item): RankingItem => ({
      name: item.variety || item.name || '',
      value: Number(item.qa_count ?? item.value ?? 0),
      trend: item.growth_rate || item.trend || '+0%',
    }))
    .filter((item) => item.name);
}
