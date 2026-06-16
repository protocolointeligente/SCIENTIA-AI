import type { SearchInput, UnifiedPaper } from '../types';

interface S2Paper {
  paperId: string;
  title?: string;
  abstract?: string;
  year?: number;
  venue?: string;
  citationCount?: number;
  externalIds?: { DOI?: string; PubMed?: string; ArXiv?: string };
  openAccessPdf?: { url?: string } | null;
  url?: string;
  authors?: { name?: string }[];
}

const FIELDS =
  'paperId,title,abstract,year,venue,citationCount,externalIds,openAccessPdf,url,authors';

export async function searchSemanticScholar(input: SearchInput): Promise<UnifiedPaper[]> {
  const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
  url.searchParams.set('query', input.query);
  url.searchParams.set('limit', String(input.pageSize ?? 20));
  url.searchParams.set('offset', String(((input.page ?? 1) - 1) * (input.pageSize ?? 20)));
  url.searchParams.set('fields', FIELDS);

  const f = input.filters;
  if (f?.yearFrom || f?.yearTo) {
    const from = f?.yearFrom ?? 1900;
    const to = f?.yearTo ?? new Date().getFullYear();
    url.searchParams.set('year', `${from}-${to}`);
  }
  if (f?.openAccess) url.searchParams.set('openAccessPdf', '');

  const headers: Record<string, string> = {};
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`SemanticScholar ${res.status}`);

  const data = (await res.json()) as { data?: S2Paper[] };

  return (data.data ?? []).map((p): UnifiedPaper => ({
    id: `semantic_scholar:${p.paperId}`,
    source: 'semantic_scholar',
    externalId: p.paperId,
    doi: p.externalIds?.DOI || undefined,
    pmid: p.externalIds?.PubMed || undefined,
    arxivId: p.externalIds?.ArXiv || undefined,
    title: p.title ?? 'Untitled',
    abstract: p.abstract || undefined,
    authors: (p.authors ?? []).map((a) => a.name ?? '').filter(Boolean),
    journal: p.venue || undefined,
    year: p.year ?? undefined,
    citations: p.citationCount ?? 0,
    openAccess: !!p.openAccessPdf?.url,
    pdfUrl: p.openAccessPdf?.url || undefined,
    landingUrl: p.url || undefined,
  }));
}
