'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleResultCard, ArticleResult } from '@/components/search/article-result-card';
import { apiFetch } from '@/lib/api';

interface PaperResponse {
  id: string;
  title: string;
  abstractText: string | null;
  publicationYear: number | null;
  venue: string | null;
  citationCount: number;
  openAccessUrl: string | null;
  authors?: { author: { fullName: string } }[];
}

function toArticle(paper: PaperResponse): ArticleResult {
  return {
    id: paper.id,
    title: paper.title,
    authors: (paper.authors ?? []).map((a) => a.author.fullName),
    publicationYear: paper.publicationYear,
    venue: paper.venue,
    citationCount: paper.citationCount,
    abstractText: paper.abstractText,
    openAccessUrl: paper.openAccessUrl,
  };
}

export function SearchResults() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  const { data, isFetching, error } = useQuery({
    queryKey: ['search', submittedQuery],
    queryFn: () =>
      apiFetch<PaperResponse[]>(`/search/papers?q=${encodeURIComponent(submittedQuery ?? '')}`),
    enabled: !!submittedQuery,
  });

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: treinamento de força e gordura abdominal em mulheres"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button type="submit" disabled={!query.trim() || isFetching}>
          Buscar
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive">
          Não foi possível buscar resultados. Verifique se a API está em execução.
        </p>
      )}

      {isFetching && <p className="text-sm text-muted-foreground">Buscando artigos...</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((paper) => <ArticleResultCard key={paper.id} article={toArticle(paper)} />)}
      </div>
    </div>
  );
}
