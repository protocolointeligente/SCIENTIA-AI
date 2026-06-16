'use client';

import { useState } from 'react';
import { BookMarked, FolderOpen, Search, Star, Tag, Trash2, Plus, X, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const COLORS = [
  { id: 'violet', label: 'Roxo', bg: 'bg-violet-500' },
  { id: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { id: 'green', label: 'Verde', bg: 'bg-green-500' },
  { id: 'amber', label: 'Âmbar', bg: 'bg-amber-500' },
  { id: 'red', label: 'Vermelho', bg: 'bg-red-500' },
  { id: 'pink', label: 'Rosa', bg: 'bg-pink-500' },
];

const INIT_COLLECTIONS = [
  { id: '1', name: 'Treinamento de Força', count: 34, color: 'bg-violet-500' },
  { id: '2', name: 'Nutrição Esportiva', count: 18, color: 'bg-blue-500' },
  { id: '3', name: 'Emagrecimento', count: 27, color: 'bg-green-500' },
  { id: '4', name: 'Saúde Mental', count: 12, color: 'bg-amber-500' },
];

const RECENT_PAPERS = [
  { id: '1', title: 'Effects of resistance training on fat mass reduction in women', authors: 'Silva et al.', year: 2023, collection: 'Treinamento de Força', starred: true },
  { id: '2', title: 'Protein intake and muscle hypertrophy: a meta-analysis', authors: 'Johnson et al.', year: 2022, collection: 'Nutrição Esportiva', starred: false },
  { id: '3', title: 'Intermittent fasting and body composition changes', authors: 'Costa & Lima', year: 2023, collection: 'Emagrecimento', starred: true },
  { id: '4', title: 'Exercise and depression: systematic review', authors: 'Oliveira et al.', year: 2021, collection: 'Saúde Mental', starred: false },
];

export default function LibraryPage() {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [collections, setCollections] = useState(INIT_COLLECTIONS);
  const [papers, setPapers] = useState(RECENT_PAPERS);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('bg-violet-500');

  const filtered = papers.filter((p) => {
    if (activeCollection && p.collection !== activeCollection) return false;
    if (searchQ && !p.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const createCollection = () => {
    if (!newName.trim()) return;
    const id = Date.now().toString();
    setCollections((c) => [...c, { id, name: newName.trim(), count: 0, color: newColor }]);
    setNewName('');
    setNewColor('bg-violet-500');
    setShowNew(false);
  };

  const toggleStar = (id: string) => {
    setPapers((prev) => prev.map((p) => p.id === id ? { ...p, starred: !p.starred } : p));
  };

  const removePaper = (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
            <p className="text-sm text-muted-foreground">Coleções, notas e destaques da sua biblioteca pessoal.</p>
          </div>
          <Button size="sm" className="gap-1" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            Nova coleção
          </Button>
        </div>

        {/* Nova coleção inline form */}
        {showNew && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Nova coleção</p>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              placeholder="Nome da coleção..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Cor</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewColor(c.bg)}
                    className={`h-6 w-6 rounded-full ${c.bg} transition-transform ${newColor === c.bg ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createCollection} disabled={!newName.trim()} className="gap-1">
                <Check className="h-3.5 w-3.5" />
                Criar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Collections */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">Coleções</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(activeCollection === col.name ? null : col.name)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent ${
                  activeCollection === col.name ? 'border-primary bg-accent' : 'border-border'
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${col.color}`}>
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

        {/* Search */}
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar na biblioteca..."
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Papers */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {activeCollection ?? 'Todos os artigos'} — {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </h2>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <BookMarked className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum artigo encontrado.</p>
              <p className="mt-1 text-xs text-muted-foreground">Use a busca para adicionar artigos à sua biblioteca.</p>
            </div>
          ) : (
            filtered.map((paper) => (
              <div
                key={paper.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{paper.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{paper.authors} · {paper.year}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Tag className="mr-1 h-3 w-3" />
                    {paper.collection}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleStar(paper.id)}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${paper.starred ? 'text-amber-400' : 'text-muted-foreground'}`}
                  >
                    <Star className="h-4 w-4" fill={paper.starred ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => removePaper(paper.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
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
