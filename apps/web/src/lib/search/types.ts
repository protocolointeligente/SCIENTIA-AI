export type SearchSource =
  | 'openalex'
  | 'crossref'
  | 'semantic_scholar'
  | 'pubmed'
  | 'arxiv';

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  openAccess?: boolean;
  author?: string;
  journal?: string;
}

export interface SearchInput {
  query: string;
  sources?: SearchSource[];
  filters?: SearchFilters;
  page?: number;
  pageSize?: number;
}

export interface UnifiedPaper {
  id: string;
  source: SearchSource;
  externalId?: string;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  year?: number;
  publishedAt?: string;
  citations?: number;
  keywords?: string[];
  openAccess?: boolean;
  pdfUrl?: string;
  landingUrl?: string;
  relevanceScore?: number;
}

export type SourceStatus = 'ok' | 'error' | 'timeout' | 'skipped';

export interface SearchResponse {
  items: UnifiedPaper[];
  total: number;
  sourcesStatus: Record<SearchSource, SourceStatus>;
}
