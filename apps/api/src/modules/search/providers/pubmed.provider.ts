import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SearchInput, UnifiedPaper } from '../types/unified-paper';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

@Injectable()
export class PubMedProvider {
  private readonly logger = new Logger(PubMedProvider.name);

  constructor(private readonly config: ConfigService) {}

  private ncbiParams(extra: Record<string, string | number | undefined>): string {
    const p: Record<string, string> = {
      tool: this.config.get('NCBI_TOOL', 'scientia_ai'),
      email: this.config.get('NCBI_EMAIL', 'contact@scientia.ai'),
    };
    const key = this.config.get<string>('NCBI_API_KEY');
    if (key) p['api_key'] = key;
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) p[k] = String(v);
    }
    return new URLSearchParams(p).toString();
  }

  async search(input: SearchInput): Promise<UnifiedPaper[]> {
    const f = input.filters;

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
    const searchRes = await fetch(
      `${BASE}/esearch.fcgi?${this.ncbiParams({
        db: 'pubmed',
        term,
        retmode: 'json',
        retmax: input.pageSize ?? 20,
        retstart: ((input.page ?? 1) - 1) * (input.pageSize ?? 20),
      })}`,
      { signal: AbortSignal.timeout(20_000) },
    );
    if (!searchRes.ok) throw new Error(`PubMed ESearch ${searchRes.status}`);

    const searchData = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const ids = searchData.esearchresult?.idlist ?? [];
    if (!ids.length) return [];

    // Step 2: ESummary
    const summaryRes = await fetch(
      `${BASE}/esummary.fcgi?${this.ncbiParams({
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'json',
        version: '2.0',
      })}`,
      { signal: AbortSignal.timeout(20_000) },
    );
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
}
