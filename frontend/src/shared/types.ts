export interface ModuleInfo { number: number; slug: string; name: string; icon: string; description: string; indicators_count?: number }

export interface SiteData {
  settings: Record<string, string> & { official_links: { label: string; url: string }[]; social_links: { label: string; url: string }[]; logo_url: string | null };
  demo_mode: boolean;
  modules: ModuleInfo[];
  pages: { slug: string; title: string }[];
}

export interface Kpi { period: string; period_id: number; value: number | null; suppressed: boolean; derived: boolean; is_demo?: boolean }

export interface Highlight { label: string; icon: string; value: number | null; period: string | null; source: string | null; indicator_code: string | null; link: string | null; is_demo: boolean }

export interface CatSummary {
  slug: string; name: string; status: string; municipality: string; department: string; department_code: string;
  latitude: number | null; longitude: number | null; is_demo: boolean;
  summary: { students: Kpi | null; teachers: Kpi | null; municipalities: number | null; programs: number | null };
}

export interface NewsCard { slug: string; title: string; summary: string | null; date: string | null; category: string | null; image_url: string | null; cat: string | null; is_demo: boolean }
export interface EventCard { slug: string; title: string; summary: string | null; starts_at: string; ends_at: string | null; location: string | null; category: string | null; cat: string | null; is_demo: boolean }

export interface HomeData {
  highlights: Highlight[];
  slides: { title: string; subtitle: string | null; image_url: string | null; link_url: string | null; is_demo: boolean }[];
  news: NewsCard[];
  events: EventCard[];
  team: { id: number; name: string; description: string | null; email: string | null; phone: string | null; link: string | null }[];
  cats: CatSummary[];
}

export interface IndicatorMeta {
  code: string; name: string; description: string | null; information_required: string; unit: string; value_type: string; periodicity: string;
  chart_type: string; group_by: string | null; allowed_dimensions: string[]; widget: string | null; publication_level: string; publication_authorized: boolean;
  methodology: string | null; methodology_status: string; source: string; sources: { code: string; name: string; validated: boolean }[];
  responsible: string | null; observations: string | null; suggested_visualization: string; classifier: string | null; last_published_at?: string | null;
}

export interface IndicatorRow { period: string; program: string | null; cat: string | null; department: string | null; municipality: string | null; level: string | null; area: string | null; category: string | null; value: number | null; suppressed: boolean; note: string | null }

export interface IndicatorData {
  kpi: Kpi | null;
  trend: { period: string; value: number | null; suppressed: boolean; derived: boolean }[];
  breakdown: { key: number; label: string; value: number | null; suppressed: boolean; department_code: string | null }[];
  series_by_group: Record<string, number | string | null>[];
  rows: IndicatorRow[];
  row_count: number;
  periods: { id: number; code: string; year: number }[];
  selected_period: string | null;
  ignored_filters: string[];
  last_published_at: string | null;
  is_demo: boolean;
}

export interface FilterOptions {
  periods: { id: number; code: string; year: number; term: number | null; type: string }[];
  years: number[];
  programs: { id: number; name: string; level_id: number; slug: string }[];
  cats: { id: number; name: string; slug: string; department_id: number }[];
  departments: { id: number; code: string; name: string }[];
  levels: { id: number; code: string; name: string; cycle: string }[];
  areas: { id: number; code: string; name: string }[];
}

export interface Paginated<T> { data: T[]; current_page: number; last_page: number; total: number; per_page: number }
