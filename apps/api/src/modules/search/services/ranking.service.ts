import { Injectable } from '@nestjs/common';
import type { UnifiedPaper } from '../types/unified-paper';

@Injectable()
export class RankingService {
  private score(paper: UnifiedPaper): number {
    const rel = Math.min((paper.relevanceScore ?? 0) / 100, 1);
    const logCit = Math.log10((paper.citations ?? 0) + 1) / 5;
    const oa = paper.openAccess ? 0.10 : 0;
    const abs = paper.abstract ? 0.10 : 0;
    const doi = paper.doi ? 0.10 : 0;
    const recency = paper.year && paper.year >= 2020 ? 0.05 : 0;
    return rel * 0.45 + logCit * 0.20 + oa + abs + doi + recency;
  }

  sort(papers: UnifiedPaper[], _query?: string): UnifiedPaper[] {
    return [...papers].sort((a, b) => this.score(b) - this.score(a));
  }
}
