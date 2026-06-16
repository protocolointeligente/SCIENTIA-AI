'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleResultCard, ArticleResult } from '@/components/search/article-result-card';

/* ── OpenAlex direct integration (no backend needed) ── */

interface OAWork {
  id: string;
  title: string;
  publication_year: number | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  primary_location?: {
    source?: { display_name?: string };
    landing_page_url?: string;
  } | null;
  open_access?: { oa_url?: string | null } | null;
  authorships?: { author?: { display_name?: string } }[];
}

interface OAResponse {
  results: OAWork[];
  meta: { count: number };
}

/** Reconstruct abstract from OpenAlex inverted index */
function reconstructAbstract(inv: Record<string, number[]> | null): string | null {
  if (!inv) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }
  return words.filter(Boolean).join(' ');
}

function toArticle(w: OAWork): ArticleResult {
  const openUrl =
    w.open_access?.oa_url ||
    w.primary_location?.landing_page_url ||
    null;

  return {
    id: w.id,
    title: w.title ?? '(sem título)',
    authors: (w.authorships ?? [])
      .slice(0, 6)
      .map((a) => a.author?.display_name ?? '')
      .filter(Boolean),
    publicationYear: w.publication_year,
    venue: w.primary_location?.source?.display_name ?? null,
    citationCount: w.cited_by_count ?? 0,
    abstractText: reconstructAbstract(w.abstract_inverted_index),
    openAccessUrl: openUrl,
  };
}

async function searchOpenAlex(q: string): Promise<ArticleResult[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', q);
  url.searchParams.set('per-page', '20');
  url.searchParams.set('select', [
    'id', 'title', 'publication_year', 'cited_by_count',
    'abstract_inverted_index', 'primary_location',
    'open_access', 'authorships',
  ].join(','));
  url.searchParams.set('mailto', 'contact@scientia.ai'); // polite pool

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const json: OAResponse = await res.json();
  return json.results.map(toArticle);
}

/* ── Component ── */

export function SearchResults() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const { data, isFetching, error } = useQuery({
    queryKey: ['search-openalex', submittedQuery],
    queryFn: () => searchOpenAlex(submittedQuery!),
    enabled: !!submittedQuery,
    staleTime: 1000 * 60 * 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) setSubmittedQuery(q);
  };

  return (
    <div className="space-y-6">
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
        <Button type="submit" disabled={!query.trim() || isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
        </Button>
      </form>

      {/* Loading */}
      {isFetching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Buscando artigos no OpenAlex…
        </div>
      )}

      {/* Error */}
      {error && !isFetching && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Não foi possível buscar resultados. Verifique sua conexão e tente novamente.
        </div>
      )}

      {/* Empty */}
      {!isFetching && data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum resultado encontrado para &ldquo;{submittedQuery}&rdquo;.
        </p>
      )}

      {/* Results header */}
      {data && data.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {data.length} resultados para{' '}
          <span className="font-medium text-foreground">&ldquo;{submittedQuery}&rdquo;</span>
          {' '}— via{' '}
          <a
            href="https://openalex.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            OpenAlex
          </a>
        </p>
      )}

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((article) => (
          <ArticleResultCard key={article.id} article={article} />
        ))}
      </div>

      {/* Initial prompt */}
      {!submittedQuery && !isFetching && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <SearchIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Pesquise artigos científicos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite um tema, pergunta de pesquisa ou termos técnicos acima.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              'resistance training fat loss',
              'protein intake hypertrophy',
              'intermittent fasting body composition',
              'HIIT cardiovascular health',
            ].map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); setSubmittedQuery(s); }}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
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
