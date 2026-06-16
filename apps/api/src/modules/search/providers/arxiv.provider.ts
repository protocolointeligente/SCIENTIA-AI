import { Injectable, Logger } from '@nestjs/common';
import type { SearchInput, UnifiedPaper } from '../types/unified-paper';

function xmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

function xmlAttr(tag: string, attr: string): string {
  const m = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : '';
}

@Injectable()
export class ArxivProvider {
  private readonly logger = new Logger(ArxivProvider.name);

  async search(input: SearchInput): Promise<UnifiedPaper[]> {
    const start = ((input.page ?? 1) - 1) * (input.pageSize ?? 20);
    const maxResults = input.pageSize ?? 20;
    const q = encodeURIComponent(`all:${input.query}`);

    const url =
      `https://export.arxiv.org/api/query` +
      `?search_query=${q}` +
      `&start=${start}&max_results=${maxResults}` +
      `&sortBy=relevance&sortOrder=descending`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ScientiaAI/1.0 (mailto:contact@scientia.ai)' },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`arXiv ${res.status}`);

    const xml = await res.text();
    const entriesRaw = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
    const f = input.filters;

    return entriesRaw
      .map((entry): UnifiedPaper | null => {
        const id = xmlTag(entry, 'id');
        const arxivId = id.split('/abs/').pop()?.split('v')[0] ?? id.split('/').pop() ?? '';
        const published = xmlTag(entry, 'published');
        const year = published ? Number(published.slice(0, 4)) : undefined;

        if (f?.yearFrom && year && year < f.yearFrom) return null;
        if (f?.yearTo && year && year > f.yearTo) return null;

        const linkTags = entry.match(/<link[^/]*(\/?>)/gi) ?? [];
        let pdfUrl: string | undefined;
        let landingUrl: string | undefined;
        for (const link of linkTags) {
          const title = xmlAttr(link, 'title');
          const rel = xmlAttr(link, 'rel');
          const href = xmlAttr(link, 'href');
          if (title === 'pdf') pdfUrl = href;
          if (rel === 'alternate') landingUrl = href;
        }

        const authorBlocks = entry.match(/<author>[\s\S]*?<\/author>/gi) ?? [];
        const authors = authorBlocks.map((a) => xmlTag(a, 'name')).filter(Boolean);
        const doi = xmlTag(entry, 'arxiv:doi') || undefined;
        const title = xmlTag(entry, 'title').replace(/\s+/g, ' ');

        if (!title) return null;

        return {
          id: `arxiv:${arxivId}`,
          source: 'arxiv',
          arxivId,
          doi,
          title,
          abstract: xmlTag(entry, 'summary').replace(/\s+/g, ' ') || undefined,
          authors,
          year,
          publishedAt: published || undefined,
          openAccess: true,
          pdfUrl: pdfUrl ?? `https://arxiv.org/pdf/${arxivId}`,
          landingUrl: landingUrl ?? `https://arxiv.org/abs/${arxivId}`,
        };
      })
      .filter((p): p is UnifiedPaper => p !== null);
  }
}
