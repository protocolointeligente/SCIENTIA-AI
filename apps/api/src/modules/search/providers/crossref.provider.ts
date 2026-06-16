import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SearchInput, UnifiedPaper } from '../types/unified-paper';

interface CRItem {
  DOI?: string;
  title?: string[];
  abstract?: string;
  author?: { given?: string; family?: string }[];
  'container-title'?: string[];
  issued?: { 'date-parts'?: number[][] };
  'is-referenced-by-count'?: number;
  URL?: string;
  license?: unknown[];
  link?: { URL?: string; 'content-type'?: string }[];
}

@Injectable()
export class CrossrefProvider {
  private readonly logger = new Logger(CrossrefProvider.name);

  constructor(private readonly config: ConfigService) {}

  async search(input: SearchInput): Promise<UnifiedPaper[]> {
    const mailto = this.config.get('CROSSREF_MAILTO', 'contact@scientia.ai');
    const ua = this.config.get(
      'CROSSREF_USER_AGENT',
      `ScientiaAI/1.0 (mailto:${mailto})`,
    );

    const url = new URL('https://api.crossref.org/v1/works');
    url.searchParams.set('query.bibliographic', input.query);
    url.searchParams.set('rows', String(input.pageSize ?? 20));
    url.searchParams.set(
      'offset',
      String(((input.page ?? 1) - 1) * (input.pageSize ?? 20)),
    );
    url.searchParams.set('sort', 'relevance');

    const f = input.filters;
    const filters: string[] = [];
    if (f?.yearFrom) filters.push(`from-pub-date:${f.yearFrom}`);
    if (f?.yearTo) filters.push(`until-pub-date:${f.yearTo}`);
    if (f?.openAccess) filters.push('has-license:true');
    if (f?.author) url.searchParams.set('query.author', f.author);
    if (f?.journal) url.searchParams.set('query.container-title', f.journal);
    if (filters.length) url.searchParams.set('filter', filters.join(','));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': ua },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Crossref ${res.status}`);

    const data = (await res.json()) as { message?: { items?: CRItem[] } };
    const items = data.message?.items ?? [];

    return items.map((item): UnifiedPaper => {
      const year = item.issued?.['date-parts']?.[0]?.[0] ?? undefined;
      const pdfLink = item.link?.find((l) => l['content-type'] === 'application/pdf');

      return {
        id: `crossref:${item.DOI ?? Math.random()}`,
        source: 'crossref',
        doi: item.DOI || undefined,
        title: item.title?.[0] ?? 'Untitled',
        abstract: item.abstract?.replace(/<[^>]+>/g, '').trim() || undefined,
        authors: (item.author ?? [])
          .map((a) => [a.given, a.family].filter(Boolean).join(' '))
          .filter(Boolean),
        journal: item['container-title']?.[0] || undefined,
        year,
        citations: item['is-referenced-by-count'] ?? 0,
        openAccess: (item.license?.length ?? 0) > 0,
        pdfUrl: pdfLink?.URL || undefined,
        landingUrl: item.URL || undefined,
      };
    });
  }
}
