'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  CheckSquare,
  ArrowUpDown,
  X,
  Check,
  ClipboardList,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleResultCard, type ArticleResult } from '@/components/search/article-result-card';
import type { SearchResponse, SearchSource, SourceStatus } from '@/lib/search/types';
import {
  computeQualityScore,
  detectStudyType,
  evidenceLevelFromStudyType,
  scoreBadge,
} from '@/lib/search/quality-score';
import type {
  ImportedStudy,
  ReviewProject,
  ReviewType,
  ReviewFramework,
  ReviewMode,
} from '@/lib/review/types';
import {
  loadReviews,
  saveReviews,
  makeEmptyAIProcessing,
} from '@/lib/review/types';

// ── Constants ────────────────────────────────────────────────
const ALL_SOURCES: { id: SearchSource; label: string }[] = [
  { id: 'openalex',        label: 'OpenAlex' },
  { id: 'crossref',        label: 'Crossref' },
  { id: 'semantic_scholar',label: 'Semantic Scholar' },
  { id: 'pubmed',          label: 'PubMed' },
  { id: 'arxiv',           label: 'arXiv' },
];

const STATUS_COLOR: Record<SourceStatus, string> = {
  ok:      'bg-green-500/20 text-green-400 border-green-500/30',
  error:   'bg-red-500/20 text-red-400 border-red-500/30',
  timeout: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  skipped: 'bg-white/5 text-muted-foreground border-border',
};

const SUGGESTIONS = [
  'resistance training fat loss women',
  'protein intake muscle hypertrophy meta-analysis',
  'intermittent fasting body composition',
  'HIIT cardiovascular health',
  'sleep deprivation cognitive performance',
];

const REVIEW_TYPES: ReviewType[] = [
  'RSL', 'RIL', 'Revisão Narrativa', 'Revisão Bibliométrica', 'Scoping Review',
];
const REVIEW_FRAMEWORKS: ReviewFramework[] = [
  'PRISMA 2020', 'PICO', 'PICOS', 'SPIDER',
];

type SortMode = 'quality' | 'citations' | 'year' | 'relevance';

// ── Fetch ────────────────────────────────────────────────────
async function fetchSearch(
  query: string,
  sources: SearchSource[],
  filters: object,
): Promise<SearchResponse> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources, filters, page: 1, pageSize: 30 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<SearchResponse>;
}

// ── Import Wizard Modal ──────────────────────────────────────
interface WizardProps {
  selectedArticles: ArticleResult[];
  searchQuery: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}

function ImportWizard({ selectedArticles, searchQuery, onClose, onCreated }: WizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<ReviewType>('RSL');
  const [framework, setFramework] = useState<ReviewFramework>('PRISMA 2020');
  const [mode, setMode] = useState<ReviewMode>('manual');
  const [creating, setCreating] = useState(false);

  const create = () => {
    if (!title.trim() || !question.trim()) return;
    setCreating(true);

    const studies: ImportedStudy[] = selectedArticles.map((a) => {
      const studyType = a.studyType ?? 'Unknown';
      const evLevel   = evidenceLevelFromStudyType(studyType);
      const scores    = a.scores ?? computeQualityScore({
        id: a.id,
        source: 'openalex',
        title: a.title,
        authors: a.authors,
        abstract: a.abstractText ?? undefined,
        journal: a.venue ?? undefined,
        year: a.publicationYear ?? undefined,
        doi: a.doi,
        citations: a.citationCount,
        openAccess: !!a.openAccessUrl,
        pdfUrl: a.openAccessUrl ?? undefined,
        relevanceScore: 50,
      });

      return {
        id: a.id,
        source: 'search',
        title: a.title,
        authors: a.authors,
        abstract: a.abstractText ?? undefined,
        journal: a.venue ?? undefined,
        year: a.publicationYear ?? undefined,
        doi: a.doi,
        citations: a.citationCount,
        openAccess: !!a.openAccessUrl,
        pdfUrl: a.openAccessUrl ?? undefined,
        studyType,
        evidenceLevel: evLevel,
        scores,
        extractionStatus: 'pending',
      };
    });

    const now = new Date().toISOString();
    const review: ReviewProject = {
      id: Date.now().toString(),
      title: title.trim(),
      question: question.trim(),
      type,
      framework,
      mode,
      status: 'triagem',
      protocol: framework,
      papers: { total: studies.length, screened: 0, included: 0 },
      collaborators: [],
      updatedAt: now.split('T')[0],
      createdAt: now,
      searchQuery,
      studies,
      aiProcessing: makeEmptyAIProcessing(),
    };

    const all = loadReviews();
    all.unshift(review);
    saveReviews(all);

    setTimeout(() => {
      setCreating(false);
      onCreated(review.id);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Importar para revisão
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedArticles.length} estudo{selectedArticles.length !== 1 ? 's' : ''} selecionado{selectedArticles.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 1 && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Título da revisão *</label>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Efeitos do treinamento de força no emagrecimento feminino"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pergunta de pesquisa *</label>
                  <textarea
                    rows={2}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ex: O treinamento resistido reduz a gordura corporal em mulheres adultas com sobrepeso?"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo de revisão</label>
                    <div className="flex flex-col gap-1.5">
                      {REVIEW_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={`rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition-all ${
                            type === t
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Framework</label>
                    <div className="flex flex-col gap-1.5">
                      {REVIEW_FRAMEWORKS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFramework(f)}
                          className={`rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition-all ${
                            framework === f
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!title.trim() || !question.trim()}
              >
                Próximo: escolher modo →
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">Como deseja conduzir a revisão?</p>

              <div className="grid gap-3">
                {/* Manual */}
                <button
                  onClick={() => setMode('manual')}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    mode === 'manual'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                      <ClipboardList className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Modo manual</p>
                        {mode === 'manual' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Você conduz a triagem, extração e redação. Área de trabalho organizada por abas.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Auto */}
                <button
                  onClick={() => setMode('auto')}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    mode === 'auto'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Automático com IA</p>
                        <Badge variant="secondary" className="text-xs">Gemini</Badge>
                        {mode === 'auto' && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        A IA processa cada estudo, gera fichas estruturadas, matriz comparativa e rascunho completo do artigo.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {['Fichas por estudo', 'Matriz de extração', 'Síntese', 'Artigo gerado'].map((f) => (
                          <span key={f} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-xs text-violet-400">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Studies preview */}
              <div className="rounded-lg border border-border bg-background/50 p-3 space-y-1.5 max-h-36 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">Estudos que serão importados</p>
                {selectedArticles.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="truncate text-muted-foreground">{a.title}</span>
                    {a.scores && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs border ${scoreBadge(a.scores.final).color}`}>
                        {a.scores.final}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                  ← Voltar
                </Button>
                <Button className="flex-1 gap-2" onClick={create} disabled={creating}>
                  {creating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Criando…</>
                  ) : (
                    <><Check className="h-4 w-4" /> Criar revisão{mode === 'auto' ? ' e iniciar IA' : ''}</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export function SearchResults() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(
    ALL_SOURCES.map((s) => s.id),
  );
  const [yearFrom, setYearFrom]   = useState('');
  const [yearTo, setYearTo]       = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [sortMode, setSortMode]   = useState<SortMode>('quality');
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filters = {
    yearFrom:   yearFrom  ? Number(yearFrom)  : undefined,
    yearTo:     yearTo    ? Number(yearTo)    : undefined,
    openAccess: openAccess || undefined,
  };

  const { data, isFetching, error } = useQuery({
    queryKey: ['search', submitted, selectedSources, filters],
    queryFn: () => fetchSearch(submitted!, selectedSources, filters),
    enabled: !!submitted,
    staleTime: 1000 * 60 * 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) {
      setSubmitted(q);
      setSelected(new Set());
    }
  };

  const toggleSource = (id: SearchSource) =>
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () =>
    setSelected(new Set(articles.map((a) => a.id)));

  const clearSelection = () => setSelected(new Set());

  // Build ArticleResult list with scores
  const toArticle = (p: SearchResponse['items'][0]): ArticleResult => {
    const studyType = detectStudyType(p);
    const scores    = computeQualityScore(p);
    return {
      id: p.id,
      title: p.title,
      authors: p.authors,
      publicationYear: p.year ?? null,
      venue:  p.journal ?? null,
      citationCount: p.citations ?? 0,
      abstractText:  p.abstract ?? null,
      openAccessUrl: p.pdfUrl ?? p.landingUrl ?? null,
      doi:      p.doi,
      scores,
      studyType,
    };
  };

  const rawArticles: ArticleResult[] = (data?.items ?? []).map(toArticle);

  // Sort
  const articles = [...rawArticles].sort((a, b) => {
    if (sortMode === 'quality')    return (b.scores?.final ?? 0) - (a.scores?.final ?? 0);
    if (sortMode === 'citations')  return b.citationCount - a.citationCount;
    if (sortMode === 'year')       return (b.publicationYear ?? 0) - (a.publicationYear ?? 0);
    return 0; // relevance = API order
  });

  const selectedArticles = articles.filter((a) => selected.has(a.id));

  const SORT_LABELS: Record<SortMode, string> = {
    quality:   'Melhor avaliados',
    citations: 'Mais citados',
    year:      'Mais recentes',
    relevance: 'Relevância',
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search bar */}
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-primary/50 transition-colors">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: treinamento de força e gordura abdominal em mulheres"
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            className={showFilters ? 'border-primary/50 text-primary' : ''}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button type="submit" disabled={query.trim().length < 2 || isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>

        {/* Filters panel */}
        {showFilters && (
          <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bases de dados</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SOURCES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSource(s.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      selectedSources.includes(s.id)
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border text-muted-foreground opacity-60'
                    }`}
                  >
                    <CheckSquare className="h-3 w-3" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">De</label>
                <input type="number" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="2000"
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary/50" />
                <label className="text-xs text-muted-foreground">até</label>
                <input type="number" value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="2026"
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary/50" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={openAccess} onChange={(e) => setOpenAccess(e.target.checked)} className="accent-primary" />
                <span className="text-xs">Apenas acesso aberto</span>
              </label>
            </div>
          </div>
        )}

        {/* Loading */}
        {isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando {selectedSources.length} base{selectedSources.length !== 1 ? 's' : ''} em paralelo…
          </div>
        )}

        {/* Error */}
        {error && !isFetching && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error ? error.message : 'Não foi possível buscar. Tente novamente.'}
          </div>
        )}

        {/* Results */}
        {data && !isFetching && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{data.total}</span> resultados ·{' '}
                  <span className="font-medium text-foreground">&ldquo;{submitted}&rdquo;</span>
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(data.sourcesStatus).map(([src, status]) => (
                    <Badge key={src} variant="outline" className={`text-xs ${STATUS_COLOR[status as SourceStatus]}`}>
                      {src === 'semantic_scholar' ? 'S2' : src.replace('_', ' ')}{' '}
                      {status === 'ok' ? '✓' : status === 'error' ? '✗' : status === 'timeout' ? '⏱' : '—'}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sort + Select all */}
              <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    <Star className="h-3 w-3 text-amber-400" />
                    {SORT_LABELS[sortMode]}
                    {showSortMenu ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-border bg-background shadow-xl overflow-hidden">
                      {(Object.entries(SORT_LABELS) as [SortMode, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setSortMode(key); setShowSortMenu(false); }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors ${
                            sortMode === key ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {sortMode === key && <Check className="h-3 w-3 text-primary" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={selected.size === articles.length ? clearSelection : selectAll}
                >
                  {selected.size === articles.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
            </div>

            {data.total === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum resultado. Tente termos diferentes ou selecione mais fontes.
              </p>
            )}

            <div className="grid gap-4 lg:grid-cols-2 pb-20">
              {articles.map((article) => (
                <ArticleResultCard
                  key={article.id}
                  article={article}
                  selectable
                  selected={selected.has(article.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </>
        )}

        {/* Initial state */}
        {!submitted && !isFetching && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <SearchIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Pesquise em 5 bases científicas simultaneamente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              OpenAlex · Crossref · Semantic Scholar · PubMed · arXiv
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); setSubmitted(s); setSelected(new Set()); }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky selection bar ──────────────────────────────── */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3 md:left-64">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {selected.size}
              </div>
              <span className="text-sm font-medium">
                estudo{selected.size !== 1 ? 's' : ''} selecionado{selected.size !== 1 ? 's' : ''}
              </span>
              {/* Mini score summary */}
              {selectedArticles.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  · score médio:{' '}
                  <span className="font-medium text-foreground">
                    {Math.round(
                      selectedArticles.reduce((sum, a) => sum + (a.scores?.final ?? 0), 0) /
                      selectedArticles.length,
                    )}
                  </span>
                </span>
              )}
            </div>
            <button
              onClick={clearSelection}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar
            </button>
            <Button
              size="sm"
              className="gap-2 bg-primary"
              onClick={() => setShowWizard(true)}
            >
              <ClipboardList className="h-4 w-4" />
              Importar para revisão
            </Button>
          </div>
        </div>
      )}

      {/* Import Wizard */}
      {showWizard && (
        <ImportWizard
          selectedArticles={selectedArticles}
          searchQuery={submitted ?? ''}
          onClose={() => setShowWizard(false)}
          onCreated={(id) => {
            setShowWizard(false);
            router.push(`/reviews/${id}`);
          }}
        />
      )}
    </>
  );
}
