import type { UnifiedPaper } from './types';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Composite relevance score for V1.
 * Weights (sum to 1.0):
 *   0.45 – provider relevance score (normalized 0-1)
 *   0.20 – log citation count
 *   0.10 – open access bonus
 *   0.10 – abstract present
 *   0.10 – DOI present (canonical, trustworthy)
 *   0.05 – recency bonus (≥ 2020)
 */
export function scoreP(paper: UnifiedPaper, _query?: string): number {
  const relScore = Math.min((paper.relevanceScore ?? 0) / 100, 1); // OA scores can be >1

  const logCitations = Math.log10((paper.citations ?? 0) + 1) / 5; // log10(100000+1)≈5

  const oaBonus = paper.openAccess ? 0.10 : 0;
  const abstractBonus = paper.abstract ? 0.10 : 0;
  const doiBonus = paper.doi ? 0.10 : 0;
  const recencyBonus = paper.year && paper.year >= 2020 ? 0.05 : 0;

  return (
    relScore * 0.45 +
    logCitations * 0.20 +
    oaBonus +
    abstractBonus +
    doiBonus +
    recencyBonus
  );
}

export function rankPapers(papers: UnifiedPaper[], query?: string): UnifiedPaper[] {
  return [...papers].sort((a, b) => scoreP(b, query) - scoreP(a, query));
}
