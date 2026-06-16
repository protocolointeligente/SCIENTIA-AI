/**
 * quality-score.ts
 * Extended composite ranking for the "melhor avaliados" feature.
 *
 * Weights (sum = 1.0):
 *   semantic relevance     40%
 *   methodological quality 20%
 *   study type             15%
 *   citation impact        10%
 *   recency                10%
 *   metadata completeness   5%
 */

import type { UnifiedPaper } from './types';
import type { QualityScoreBreakdown, StudyType, EvidenceLevel } from '../review/types';

// ── Study-type detection from title + abstract keywords ──────
const STUDY_TYPE_PATTERNS: { type: StudyType; patterns: RegExp[] }[] = [
  {
    type: 'Meta-analysis',
    patterns: [/meta.?analy/i, /meta.?análi/i, /pooled analysis/i],
  },
  {
    type: 'Systematic Review',
    patterns: [/systematic review/i, /revisão sistemática/i, /scoping review/i],
  },
  {
    type: 'RCT',
    patterns: [
      /randomized controlled/i,
      /randomised controlled/i,
      /ensaio cl[íi]nico aleatori/i,
      /\bRCT\b/,
      /clinical trial/i,
    ],
  },
  {
    type: 'Cohort',
    patterns: [/cohort study/i, /estudo de coorte/i, /longitudinal study/i, /prospective study/i],
  },
  {
    type: 'Case-control',
    patterns: [/case.control/i, /caso.controle/i],
  },
  {
    type: 'Cross-sectional',
    patterns: [/cross.sectional/i, /transversal/i, /survey/i],
  },
  {
    type: 'Narrative Review',
    patterns: [/narrative review/i, /revisão narrativa/i, /literature review/i],
  },
  {
    type: 'Preprint',
    patterns: [/preprint/i, /not peer.reviewed/i],
  },
  {
    type: 'Case Study',
    patterns: [/case report/i, /case series/i, /relato de caso/i],
  },
];

export function detectStudyType(paper: UnifiedPaper): StudyType {
  const text = `${paper.title} ${paper.abstract ?? ''}`;
  for (const { type, patterns } of STUDY_TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  // arXiv is usually preprint
  if (paper.source === 'arxiv') return 'Preprint';
  return 'Unknown';
}

// ── Study-type quality weight ────────────────────────────────
const STUDY_TYPE_WEIGHT: Record<StudyType, number> = {
  'Meta-analysis': 1.0,
  'Systematic Review': 0.9,
  RCT: 0.85,
  Cohort: 0.65,
  'Case-control': 0.55,
  'Cross-sectional': 0.45,
  'Narrative Review': 0.35,
  'Case Study': 0.25,
  Preprint: 0.15,
  Unknown: 0.2,
};

// ── Evidence level from study type ──────────────────────────
export function evidenceLevelFromStudyType(type: StudyType): EvidenceLevel {
  const map: Record<StudyType, EvidenceLevel> = {
    'Meta-analysis': 'I',
    'Systematic Review': 'I',
    RCT: 'II',
    Cohort: 'III',
    'Case-control': 'III',
    'Cross-sectional': 'IV',
    'Narrative Review': 'V',
    'Case Study': 'V',
    Preprint: 'V',
    Unknown: 'V',
  };
  return map[type];
}

// ── Methodological quality heuristic ────────────────────────
function methodologicalScore(paper: UnifiedPaper, studyType: StudyType): number {
  let score = STUDY_TYPE_WEIGHT[studyType] * 0.6; // base from study type

  // Bonus: abstract mentions key methodology words
  const abstract = paper.abstract ?? '';
  if (/random|placebo|blind|control group/i.test(abstract)) score += 0.15;
  if (/sample size|n\s*=\s*\d+|participants/i.test(abstract)) score += 0.10;
  if (/95% ci|confidence interval|p\s*[<>=]/i.test(abstract)) score += 0.10;
  if (/limitation|bias|confound/i.test(abstract)) score += 0.05; // transparency

  return Math.min(score, 1);
}

// ── Metadata completeness ────────────────────────────────────
function completenessScore(paper: UnifiedPaper): number {
  let score = 0;
  if (paper.title)    score += 0.2;
  if (paper.abstract) score += 0.3;
  if (paper.doi)      score += 0.2;
  if (paper.authors?.length) score += 0.15;
  if (paper.journal)  score += 0.10;
  if (paper.year)     score += 0.05;
  return Math.min(score, 1);
}

// ── Recency ─────────────────────────────────────────────────
function recencyScore(year?: number): number {
  if (!year) return 0;
  const age = new Date().getFullYear() - year;
  if (age <= 2)  return 1.0;
  if (age <= 5)  return 0.8;
  if (age <= 10) return 0.5;
  if (age <= 20) return 0.25;
  return 0.1;
}

// ── Citation impact (log-normalised) ────────────────────────
function citationScore(citations?: number): number {
  if (!citations || citations === 0) return 0;
  return Math.min(Math.log10(citations + 1) / 5, 1); // log10(100000)=5
}

// ── Semantic relevance (provider score, normalised) ──────────
function semanticScore(paper: UnifiedPaper): number {
  return Math.min((paper.relevanceScore ?? 0) / 100, 1);
}

// ── Main export ──────────────────────────────────────────────
export function computeQualityScore(
  paper: UnifiedPaper,
): QualityScoreBreakdown {
  const studyType = detectStudyType(paper);

  const semantic        = semanticScore(paper);
  const methodological  = methodologicalScore(paper, studyType);
  const studyTypeWeight = STUDY_TYPE_WEIGHT[studyType];
  const impact          = citationScore(paper.citations);
  const recency         = recencyScore(paper.year);
  const completeness    = completenessScore(paper);

  const final = Math.round(
    (semantic       * 0.40 +
     methodological * 0.20 +
     studyTypeWeight* 0.15 +
     impact         * 0.10 +
     recency        * 0.10 +
     completeness   * 0.05) * 100,
  );

  return {
    semantic,
    methodological,
    studyTypeWeight,
    impact,
    recency,
    completeness,
    final,
  };
}

// ── Sort papers by final quality score ──────────────────────
export function rankByQuality(papers: UnifiedPaper[]): UnifiedPaper[] {
  return [...papers].sort(
    (a, b) =>
      computeQualityScore(b).final - computeQualityScore(a).final,
  );
}

// ── Score label helper ───────────────────────────────────────
export function scoreBadge(score: number): {
  label: string;
  color: string;
} {
  if (score >= 75) return { label: 'Excelente', color: 'text-green-400 border-green-500/30 bg-green-500/10' };
  if (score >= 55) return { label: 'Bom',       color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' };
  if (score >= 35) return { label: 'Regular',   color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  return               { label: 'Baixo',     color: 'text-red-400 border-red-500/30 bg-red-500/10' };
}
