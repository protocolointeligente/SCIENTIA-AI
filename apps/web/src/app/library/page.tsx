'use client';

import { useState } from 'react';
import { BookMarked, FolderOpen, Search, Star, Tag, Trash2, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLLECTIONS = [
  { id: '1', name: 'Treinamento de Força', count: 34, color: 'bg-violet-500' },
  { id: '2', name: 'Nutrição Esportiva', count: 18, color: 'bg-blue-500' },
  { id: '3', name: 'Emagrecimento', count: 27, color: 'bg-green-500' },
  { id: '4', name: 'Saúde Mental', count: 12, color: 'bg-amber-500' },
];

const RECENT_PAPERS = [
  {
    id: '1',
    title: 'Effects of resistance training on fat mass reduction in women',
    authors: 'Silva et al.',
    year: 2023,
    collection: 'Treinamento de Força',
    starred: true,
  },
  {
    id: '2',
    title: 'Protein intake and muscle hypertrophy: a meta-analysis',
    authors: 'Johnson et al.',
    year: 2022,
    collection: 'Nutrição Esportiva',
    starred: false,
  },
  {
    id: '3',
    title: 'Intermittent fasting and body composition changes',
    authors: 'Costa & Lima',
    year: 2023,
    collection: 'Emagrecimento',
    starred: true,
  },
  {
    id: '4',
    title: 'Exercise and depression: systematic review',
    authors: 'Oliveira et al.',
    year: 2021,
    collection: 'Saúde Mental',
    starred: false,
  },
];

export default function LibraryPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const filtered = RECENT_PAPERS.filter((p) => {
    if (activeCollection && p.collection !== activeCollection) return false;
    if (searchQ && !p.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
            <p className="text-sm text-muted-foreground">
              Coleções, notas e destaques da sua biblioteca pessoal.
            </p>
          </div>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Nova coleção
          </Button>
        </div>

        {/* Collections */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Coleções
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLLECTIONS.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(activeCollection === col.name ? null : col.name)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent ${
                  activeCollection === col.name ? 'border-primary bg-accent' : 'border-border'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${col.color}`}>
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">{col.name}</div>
                  <div className="text-xs text-muted-foreground">{col.count} artigos</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search inside library */}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar na biblioteca..."
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Papers list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              {activeCollection ?? 'Todos os artigos'} — {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </h2>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <BookMarked className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum artigo encontrado.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use a busca para adicionar artigos à sua biblioteca.
              </p>
            </div>
          ) : (
            filtered.map((paper) => (
              <div
                key={paper.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{paper.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paper.authors} · {paper.year}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {paper.collection}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button className={`p-1.5 rounded-md hover:bg-accent ${paper.starred ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    <Star className="h-4 w-4" fill={paper.starred ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
