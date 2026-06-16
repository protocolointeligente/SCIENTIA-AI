// ─────────────────────────────────────────────────────────────
// Review feature — rich types
// Storage: localStorage key  "scientia_reviews_v2"
// ─────────────────────────────────────────────────────────────

export type ReviewMode      = 'manual' | 'auto';
export type ReviewType      = 'RSL' | 'RIL' | 'Revisão Narrativa' | 'Revisão Bibliométrica' | 'Scoping Review';
export type ReviewFramework = 'PRISMA 2020' | 'PICO' | 'PICOS' | 'SPIDER';
export type ReviewStatus    = 'triagem' | 'em_andamento' | 'concluida';

export type StudyType =
  | 'RCT'
  | 'Systematic Review'
  | 'Meta-analysis'
  | 'Cohort'
  | 'Case-control'
  | 'Cross-sectional'
  | 'Case Study'
  | 'Narrative Review'
  | 'Preprint'
  | 'Unknown';

export type EvidenceLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DataSource      = 'full_text' | 'abstract' | 'metadata_only';

// ── Quality score breakdown ──────────────────────────────────
export interface QualityScoreBreakdown {
  /** 0–1  semantic relevance with query (40%) */
  semantic: number;
  /** 0–1  methodological quality estimate (20%) */
  methodological: number;
  /** 0–1  study type weight (15%) */
  studyTypeWeight: number;
  /** 0–1  citation impact, log-normalised (10%) */
  impact: number;
  /** 0–1  recency bonus (10%) */
  recency: number;
  /** 0–1  metadata completeness (5%) */
  completeness: number;
  /** weighted sum → 0–100 */
  final: number;
}

// ── Imported study snapshot (saved with review) ──────────────
export interface ImportedStudy {
  id: string;
  source: string;
  title: string;
  authors: string[];
  abstract?: string;
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  citations?: number;
  openAccess?: boolean;
  pdfUrl?: string;
  landingUrl?: string;
  studyType: StudyType;
  evidenceLevel: EvidenceLevel;
  scores: QualityScoreBreakdown;
  // AI extraction result (filled after AI run)
  extraction?: StudyExtraction;
  extractionStatus: 'pending' | 'processing' | 'done' | 'error';
}

// ── Per-study AI extraction ──────────────────────────────────
export interface StudyExtraction {
  studyId: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  introduction: string;
  objectives: string;
  methodology: string;
  results: string;
  conclusion: string;
  sample: string;
  instruments: string;
  limitations: string;
  evidenceLevel: string;
  gaps: string;
  practicalApplicability: string;
  studyType: string;
  confidenceLevel: ConfidenceLevel;
  dataSource: DataSource;
  extractedAt: string;
}

// ── Extraction matrix (comparative table) ────────────────────
export interface MatrixRow {
  studyId: string;
  authorYear: string;
  studyType: string;
  sample: string;
  intervention: string;
  outcomes: string;
  evidenceLevel: string;
  mainResult: string;
}

export interface ExtractionMatrix {
  headers: string[];
  rows: MatrixRow[];
}

// ── Review article draft ─────────────────────────────────────
export interface ReviewDraft {
  title: string;
  abstract: string;
  introduction: string;
  method: string;
  selectionCriteria: string;
  studyCharacterization: string;
  results: string;
  discussion: string;
  conclusion: string;
  references: string;
  generatedAt: string;
  studyCount: number;
  confidenceNote: string;
}

// ── AI processing state ──────────────────────────────────────
export type AIProcessingStatus = 'idle' | 'processing' | 'done' | 'error';

export interface AIProcessing {
  status: AIProcessingStatus;
  progress: number;          // 0–100
  currentStep: string;
  extractions: StudyExtraction[];
  matrix?: ExtractionMatrix;
  synthesis?: string;
  draft?: ReviewDraft;
  processedAt?: string;
  error?: string;
}

// ── Main ReviewProject ───────────────────────────────────────
export interface ReviewProject {
  id: string;
  title: string;
  question: string;
  type: ReviewType;
  framework: ReviewFramework;
  mode: ReviewMode;
  status: ReviewStatus;
  protocol: string;       // legacy compat — same as framework
  papers: {
    total: number;
    screened: number;
    included: number;
  };
  collaborators: string[];
  updatedAt: string;
  createdAt: string;
  searchQuery?: string;
  studies: ImportedStudy[];
  aiProcessing: AIProcessing;
  // manual-mode notes
  notes?: string;
}

// ── LocalStorage helpers ─────────────────────────────────────
export const REVIEWS_STORAGE_KEY = 'scientia_reviews_v2';

export function loadReviews(): ReviewProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReviewProject[]) : [];
  } catch {
    return [];
  }
}

export function saveReviews(reviews: ReviewProject[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function getReview(id: string): ReviewProject | undefined {
  return loadReviews().find((r) => r.id === id);
}

export function upsertReview(review: ReviewProject): void {
  const all = loadReviews();
  const idx = all.findIndex((r) => r.id === review.id);
  if (idx >= 0) all[idx] = review;
  else all.unshift(review);
  saveReviews(all);
}

export function makeEmptyAIProcessing(): AIProcessing {
  return {
    status: 'idle',
    progress: 0,
    currentStep: '',
    extractions: [],
  };
}
