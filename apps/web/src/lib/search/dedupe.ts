import type { UnifiedPaper } from './types';

/** Normalize title for fuzzy matching */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Priority order: prefer richer data sources */
const SOURCE_PRIORITY: Record<string, number> = {
  semantic_scholar: 1, // best for abstract + citations
  openalex: 2,         // best for OA URL + keywords
  crossref: 3,         // best for DOI canonical
  pubmed: 4,
  arxiv: 5,
};

function priority(p: UnifiedPaper): number {
  return SOURCE_PRIORITY[p.source] ?? 99;
}

/** Merge two papers: keep best fields from each */
function merge(base: UnifiedPaper, incoming: UnifiedPaper): UnifiedPaper {
  const pref = priority(base) <= priority(incoming) ? base : incoming;
  const other = pref === base ? incoming : base;

  return {
    ...pref,
    // Fill missing fields from the other source
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
    // Keep the higher relevance score
    relevanceScore:
      pref.relevanceScore !== undefined || other.relevanceScore !== undefined
        ? Math.max(pref.relevanceScore ?? 0, other.relevanceScore ?? 0)
        : undefined,
  };
}

export function deduplicatePapers(papers: UnifiedPaper[]): UnifiedPaper[] {
  // Map: canonical key -> best paper
  const byDoi = new Map<string, UnifiedPaper>();
  const byPmid = new Map<string, UnifiedPaper>();
  const byArxiv = new Map<string, UnifiedPaper>();
  const byTitle = new Map<string, UnifiedPaper>();
  const seen = new Set<string>(); // track which paper ids are aliases

  const canonical = new Map<string, UnifiedPaper>(); // id -> canonical paper

  for (const paper of papers) {
    let existing: UnifiedPaper | undefined;

    // Check by DOI
    if (paper.doi) {
      existing = byDoi.get(paper.doi.toLowerCase());
    }
    // Check by PMID
    if (!existing && paper.pmid) {
      existing = byPmid.get(paper.pmid);
    }
    // Check by arXiv ID
    if (!existing && paper.arxivId) {
      existing = byArxiv.get(paper.arxivId);
    }
    // Check by normalized title + year + first author
    if (!existing && paper.title) {
      const key = `${normalizeTitle(paper.title)}:${paper.year ?? ''}:${paper.authors[0]?.toLowerCase().slice(0, 10) ?? ''}`;
      existing = byTitle.get(key);
    }

    if (existing) {
      // Merge into canonical
      const merged = merge(existing, paper);
      canonical.set(existing.id, merged);
      seen.add(paper.id);

      // Update lookup maps to point to merged
      if (merged.doi) byDoi.set(merged.doi.toLowerCase(), merged);
      if (merged.pmid) byPmid.set(merged.pmid, merged);
      if (merged.arxivId) byArxiv.set(merged.arxivId, merged);
      if (merged.title) {
        const key = `${normalizeTitle(merged.title)}:${merged.year ?? ''}:${merged.authors[0]?.toLowerCase().slice(0, 10) ?? ''}`;
        byTitle.set(key, merged);
      }
    } else {
      // New unique paper
      canonical.set(paper.id, paper);
      if (paper.doi) byDoi.set(paper.doi.toLowerCase(), paper);
      if (paper.pmid) byPmid.set(paper.pmid, paper);
      if (paper.arxivId) byArxiv.set(paper.arxivId, paper);
      if (paper.title) {
        const key = `${normalizeTitle(paper.title)}:${paper.year ?? ''}:${paper.authors[0]?.toLowerCase().slice(0, 10) ?? ''}`;
        byTitle.set(key, paper);
      }
    }
  }

  return Array.from(canonical.values()).filter((p) => !seen.has(p.id));
}
