import type { SearchInput, UnifiedPaper } from '../types';

interface OAWork {
  id: string;
  display_name: string | null;
  doi: string | null;
  publication_year: number | null;
  cited_by_count: number;
  relevance_score?: number;
  abstract_inverted_index?: Record<string, number[]> | null;
  primary_location?: { source?: { display_name?: string }; landing_page_url?: string } | null;
  open_access?: { is_oa?: boolean; oa_url?: string | null } | null;
  authorships?: { author?: { display_name?: string } }[];
  keywords?: { display_name?: string }[];
}

function reconstructAbstract(inv?: Record<string, number[]> | null): string | undefined {
  if (!inv) return undefined;
  const arr: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) arr[pos] = word;
  }
  return arr.filter(Boolean).join(' ') || undefined;
}

export async function searchOpenAlex(input: SearchInput): Promise<UnifiedPaper[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', input.query);
  url.searchParams.set('per_page', String(input.pageSize ?? 20));
  url.searchParams.set('page', String(input.page ?? 1));
  url.searchParams.set(
    'select',
    'id,display_name,doi,publication_year,cited_by_count,relevance_score,abstract_inverted_index,primary_location,open_access,authorships,keywords',
  );

  const apiKey = process.env.OPENALEX_API_KEY;
  const email = process.env.OPENALEX_EMAIL ?? 'contact@scientia.ai';
  if (apiKey) url.searchParams.set('api_key', apiKey);

  const filters: string[] = [];
  const f = input.filters;
  if (f?.yearFrom) filters.push(`from_publication_date:${f.yearFrom}-01-01`);
  if (f?.yearTo) filters.push(`to_publication_date:${f.yearTo}-12-31`);
  if (f?.openAccess) filters.push('is_oa:true');
  if (f?.author) filters.push(`author.display_name.search:${f.author}`);
  if (f?.journal) filters.push(`primary_location.source.display_name.search:${f.journal}`);
  if (filters.length) url.searchParams.set('filter', filters.join(','));

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': `ScientiaAI/1.0 (mailto:${email})` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);

  const data = (await res.json()) as { results: OAWork[] };

  return (data.results ?? []).map((w): UnifiedPaper => ({
    id: `openalex:${w.id}`,
    source: 'openalex',
    externalId: w.id,
    doi: w.doi?.replace('https://doi.org/', '') || undefined,
    title: w.display_name ?? 'Untitled',
    abstract: reconstructAbstract(w.abstract_inverted_index),
    authors: (w.authorships ?? [])
      .map((a) => a.author?.display_name ?? '')
      .filter(Boolean),
    journal: w.primary_location?.source?.display_name || undefined,
    year: w.publication_year ?? undefined,
    citations: w.cited_by_count ?? 0,
    keywords: (w.keywords ?? []).map((k) => k.display_name ?? '').filter(Boolean),
    openAccess: w.open_access?.is_oa ?? false,
    pdfUrl: w.open_access?.oa_url ?? undefined,
    landingUrl: w.primary_location?.landing_page_url ?? w.id,
    relevanceScore: w.relevance_score,
  }));
}
