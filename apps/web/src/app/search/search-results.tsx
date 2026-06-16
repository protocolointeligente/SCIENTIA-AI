'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search as SearchIcon,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  CheckSquare,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArticleResultCard, ArticleResult } from '@/components/search/article-result-card';
import type { SearchResponse, SearchSource, SourceStatus } from '@/lib/search/types';

const ALL_SOURCES: { id: SearchSource; label: string }[] = [
  { id: 'openalex', label: 'OpenAlex' },
  { id: 'crossref', label: 'Crossref' },
  { id: 'semantic_scholar', label: 'Semantic Scholar' },
  { id: 'pubmed', label: 'PubMed' },
  { id: 'arxiv', label: 'arXiv' },
];

const STATUS_COLOR: Record<SourceStatus, string> = {
  ok: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
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

async function fetchSearch(query: string, sources: SearchSource[], filters: object): Promise<SearchResponse> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sources, filters, page: 1, pageSize: 20 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<SearchResponse>;
}

export function SearchResults() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<SearchSource[]>(
    ALL_SOURCES.map((s) => s.id),
  );
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [openAccess, setOpenAccess] = useState(false);

  const filters = {
    yearFrom: yearFrom ? Number(yearFrom) : undefined,
    yearTo: yearTo ? Number(yearTo) : undefined,
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
    if (q.length >= 2) setSubmitted(q);
  };

  const toggleSource = (id: SearchSource) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const toArticle = (p: SearchResponse['items'][0]): ArticleResult => ({
    id: p.id,
    title: p.title,
    authors: p.authors,
    publicationYear: p.year ?? null,
    venue: p.journal ?? null,
    citationCount: p.citations ?? 0,
    abstractText: p.abstract ?? null,
    openAccessUrl: p.pdfUrl ?? p.landingUrl ?? null,
  });

  return (
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
          {/* Sources */}
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

          {/* Year range + Open Access */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">De</label>
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="2000"
                className="w-20 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary/50"
              />
              <label className="text-xs text-muted-foreground">até</label>
              <input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder="2026"
                className="w-20 rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary/50"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={openAccess}
                onChange={(e) => setOpenAccess(e.target.checked)}
                className="accent-primary"
              />
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
          {/* Header: count + sources status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{data.total}</span> resultados únicos para{' '}
              <span className="font-medium text-foreground">&ldquo;{submitted}&rdquo;</span>
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(data.sourcesStatus).map(([src, status]) => (
                <Badge
                  key={src}
                  variant="outline"
                  className={`text-xs ${STATUS_COLOR[status as SourceStatus]}`}
                >
                  {src === 'semantic_scholar' ? 'S2' : src.replace('_', ' ')}
                  {' '}
                  {status === 'ok' ? '✓' : status === 'error' ? '✗' : status === 'timeout' ? '⏱' : '—'}
                </Badge>
              ))}
            </div>
          </div>

          {data.total === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum resultado encontrado. Tente termos diferentes ou selecione mais fontes.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {data.items.map((paper) => (
              <ArticleResultCard key={paper.id} article={toArticle(paper)} />
            ))}
          </div>
        </>
      )}

      {/* Initial state / suggestions */}
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
                onClick={() => { setQuery(s); setSubmitted(s); }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
