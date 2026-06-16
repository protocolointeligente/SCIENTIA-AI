import type { SearchInput, UnifiedPaper } from '../types';

/** Extract text content between XML tags (handles multiline, first match) */
function xmlTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].trim() : '';
}

/** Extract all matches of a repeated tag */
function xmlTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

/** Extract attribute value from a self-closing or opening tag */
function xmlAttr(tag: string, attr: string): string {
  const m = tag.match(new RegExp(`${attr}="([^"]*)"`));
  return m ? m[1] : '';
}

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  published: string;
  authors: string[];
  doi?: string;
  pdfUrl?: string;
  landingUrl?: string;
}

function parseAtomEntries(xml: string): ArxivEntry[] {
  const entriesRaw = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];

  return entriesRaw.map((entry) => {
    const id = xmlTag(entry, 'id');
    const arxivId = id.split('/abs/').pop()?.split('v')[0] ?? id.split('/').pop() ?? '';

    // Links: look for pdf link and alternate
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

    // Authors
    const authorBlocks = entry.match(/<author>[\s\S]*?<\/author>/gi) ?? [];
    const authors = authorBlocks.map((a) => xmlTag(a, 'name')).filter(Boolean);

    // DOI from arxiv:doi tag
    const doiRaw = xmlTag(entry, 'arxiv:doi');

    return {
      id: `arxiv:${arxivId}`,
      title: xmlTag(entry, 'title').replace(/\s+/g, ' '),
      summary: xmlTag(entry, 'summary').replace(/\s+/g, ' '),
      published: xmlTag(entry, 'published'),
      authors,
      doi: doiRaw || undefined,
      pdfUrl: pdfUrl || `https://arxiv.org/pdf/${arxivId}`,
      landingUrl: landingUrl || `https://arxiv.org/abs/${arxivId}`,
    };
  });
}

export async function searchArxiv(input: SearchInput): Promise<UnifiedPaper[]> {
  const start = ((input.page ?? 1) - 1) * (input.pageSize ?? 20);
  const maxResults = input.pageSize ?? 20;

  // arXiv rate limit: 1 req/3s, single connection
  // Terms joined with AND for better relevance
  const q = encodeURIComponent(`all:${input.query}`);
  const url =
    `https://export.arxiv.org/api/query` +
    `?search_query=${q}` +
    `&start=${start}` +
    `&max_results=${maxResults}` +
    `&sortBy=relevance&sortOrder=descending`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ScientiaAI/1.0 (contact@scientia.ai)' },
    signal: AbortSignal.timeout(25_000), // arXiv can be slow
  });
  if (!res.ok) throw new Error(`arXiv ${res.status}`);

  const xml = await res.text();
  const entries = parseAtomEntries(xml);

  const f = input.filters;

  return entries
    .filter((e) => {
      if (!e.title) return false;
      const year = e.published ? Number(e.published.slice(0, 4)) : undefined;
      if (f?.yearFrom && year && year < f.yearFrom) return false;
      if (f?.yearTo && year && year > f.yearTo) return false;
      return true;
    })
    .map((e): UnifiedPaper => {
      const year = e.published ? Number(e.published.slice(0, 4)) : undefined;
      const arxivId = e.id.replace('arxiv:', '');

      return {
        id: e.id,
        source: 'arxiv',
        arxivId,
        doi: e.doi,
        title: e.title,
        abstract: e.summary || undefined,
        authors: e.authors,
        year,
        publishedAt: e.published || undefined,
        openAccess: true, // arXiv is always OA
        pdfUrl: e.pdfUrl,
        landingUrl: e.landingUrl,
      };
    });
}
