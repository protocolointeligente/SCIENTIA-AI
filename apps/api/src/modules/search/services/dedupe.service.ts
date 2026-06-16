import { Injectable } from '@nestjs/common';
import type { UnifiedPaper } from '../types/unified-paper';

const SOURCE_PRIORITY: Record<string, number> = {
  semantic_scholar: 1,
  openalex: 2,
  crossref: 3,
  pubmed: 4,
  arxiv: 5,
};

function normTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function mergeTwo(base: UnifiedPaper, incoming: UnifiedPaper): UnifiedPaper {
  const pref =
    (SOURCE_PRIORITY[base.source] ?? 99) <= (SOURCE_PRIORITY[incoming.source] ?? 99)
      ? base
      : incoming;
  const other = pref === base ? incoming : base;

  return {
    ...pref,
    doi: pref.doi ?? other.doi,
    pmid: pref.pmid ?? other.pmid,
    arxivId: pref.arxivId ?? other.arxivId,
    abstract: pref.abstract ?? other.abstract,
    pdfUrl: pref.pdfUrl ?? other.pdfUrl,
    landingUrl: pref.landingUrl ?? other.landingUrl,
    citations: Math.max(pref.citations ?? 0, other.citations ?? 0) || undefined,
    keywords:
      (pref.keywords?.length ?? 0) >= (other.keywords?.length ?? 0)
        ? pref.keywords
        : other.keywords,
    openAccess: pref.openAccess || other.openAccess,
    relevanceScore:
      pref.relevanceScore !== undefined || other.relevanceScore !== undefined
        ? Math.max(pref.relevanceScore ?? 0, other.relevanceScore ?? 0)
        : undefined,
  };
}

@Injectable()
export class DedupeService {
  merge(papers: UnifiedPaper[]): UnifiedPaper[] {
    const byDoi = new Map<string, UnifiedPaper>();
    const byPmid = new Map<string, UnifiedPaper>();
    const byArxiv = new Map<string, UnifiedPaper>();
    const byTitle = new Map<string, UnifiedPaper>();
    const canonical = new Map<string, UnifiedPaper>();
    const aliased = new Set<string>();

    const register = (paper: UnifiedPaper) => {
      if (paper.doi) byDoi.set(paper.doi.toLowerCase(), paper);
      if (paper.pmid) byPmid.set(paper.pmid, paper);
      if (paper.arxivId) byArxiv.set(paper.arxivId, paper);
      if (paper.title) {
        const key = `${normTitle(paper.title)}:${paper.year ?? ''}:${paper.authors[0]?.slice(0, 10).toLowerCase() ?? ''}`;
        byTitle.set(key, paper);
      }
      canonical.set(paper.id, paper);
    };

    for (const paper of papers) {
      let existing: UnifiedPaper | undefined;

      if (paper.doi) existing = byDoi.get(paper.doi.toLowerCase());
      if (!existing && paper.pmid) existing = byPmid.get(paper.pmid);
      if (!existing && paper.arxivId) existing = byArxiv.get(paper.arxivId);
      if (!existing && paper.title) {
        const key = `${normTitle(paper.title)}:${paper.year ?? ''}:${paper.authors[0]?.slice(0, 10).toLowerCase() ?? ''}`;
        existing = byTitle.get(key);
      }

      if (existing) {
        const merged = mergeTwo(existing, paper);
        canonical.set(existing.id, merged);
        aliased.add(paper.id);
        register(merged);
      } else {
        register(paper);
      }
    }

    return Array.from(canonical.values()).filter((p) => !aliased.has(p.id));
  }
}
