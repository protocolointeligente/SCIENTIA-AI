import type { SearchInput, UnifiedPaper } from '../types';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

function ncbiParams(extra: Record<string, string | number | undefined>) {
  const p: Record<string, string> = {
    tool: process.env.NCBI_TOOL ?? 'scientia_ai',
    email: process.env.NCBI_EMAIL ?? 'contact@scientia.ai',
  };
  const key = process.env.NCBI_API_KEY;
  if (key) p['api_key'] = key;
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined) p[k] = String(v);
  }
  return new URLSearchParams(p).toString();
}

export async function searchPubMed(input: SearchInput): Promise<UnifiedPaper[]> {
  const f = input.filters;

  // Build query with date range if needed
  let term = input.query;
  if (f?.yearFrom || f?.yearTo) {
    const from = f?.yearFrom ?? 1900;
    const to = f?.yearTo ?? new Date().getFullYear();
    term += ` AND ${from}:${to}[pdat]`;
  }
  if (f?.author) term += ` AND ${f.author}[author]`;
  if (f?.journal) term += ` AND "${f.journal}"[journal]`;
  if (f?.openAccess) term += ' AND free full text[filter]';

  // Step 1: ESearch
  const searchUrl = `${BASE}/esearch.fcgi?${ncbiParams({
    db: 'pubmed',
    term,
    retmode: 'json',
    retmax: input.pageSize ?? 20,
    retstart: ((input.page ?? 1) - 1) * (input.pageSize ?? 20),
  })}`;

  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(20_000) });
  if (!searchRes.ok) throw new Error(`PubMed ESearch ${searchRes.status}`);

  const searchData = (await searchRes.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const ids = searchData.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  // Step 2: ESummary
  const summaryUrl = `${BASE}/esummary.fcgi?${ncbiParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
    version: '2.0',
  })}`;

  const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(20_000) });
  if (!summaryRes.ok) throw new Error(`PubMed ESummary ${summaryRes.status}`);

  const summaryData = (await summaryRes.json()) as {
    result?: Record<string, {
      title?: string;
      authors?: { name?: string }[];
      fulljournalname?: string;
      source?: string;
      pubdate?: string;
      articleids?: { idtype: string; value: string }[];
      pmcrefcount?: number;
    }>;
  };

  const result = summaryData.result ?? {};

  return ids
    .filter((id) => result[id])
    .map((id): UnifiedPaper => {
      const item = result[id];
      const doi = item.articleids?.find((x) => x.idtype === 'doi')?.value;
      const year = item.pubdate
        ? Number(String(item.pubdate).slice(0, 4)) || undefined
        : undefined;

      return {
        id: `pubmed:${id}`,
        source: 'pubmed',
        pmid: id,
        doi: doi || undefined,
        title: item.title ?? 'Untitled',
        authors: (item.authors ?? []).map((a) => a.name ?? '').filter(Boolean),
        journal: item.fulljournalname || item.source || undefined,
        year,
        citations: item.pmcrefcount ?? 0,
        openAccess: false,
        landingUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });
}
