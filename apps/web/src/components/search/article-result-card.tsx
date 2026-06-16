'use client';

import { useState } from 'react';
import { ExternalLink, Quote, X, Check, BookMarked, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ArticleResult {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  venue: string | null;
  citationCount: number;
  abstractText: string | null;
  openAccessUrl: string | null;
}

const COLLECTIONS = [
  { id: '1', name: 'Treinamento de Força', color: 'bg-violet-500' },
  { id: '2', name: 'Nutrição Esportiva', color: 'bg-blue-500' },
  { id: '3', name: 'Emagrecimento', color: 'bg-green-500' },
  { id: '4', name: 'Saúde Mental', color: 'bg-amber-500' },
];

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ArticleResultCard({ article }: { article: ArticleResult }) {
  const [fichaOpen, setFichaOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [fichaFields, setFichaFields] = useState({
    objetivo: '',
    metodo: '',
    resultados: '',
    conclusao: '',
    notas: '',
  });
  const [fichaSaved, setFichaSaved] = useState(false);
  const [savedCollection, setSavedCollection] = useState<string | null>(null);

  const saveFicha = () => {
    setFichaSaved(true);
    setTimeout(() => { setFichaOpen(false); setFichaSaved(false); }, 1200);
  };

  const saveCollection = (name: string) => {
    setSavedCollection(name);
    setTimeout(() => { setColOpen(false); }, 1000);
  };

  return (
    <>
      {/* Card */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
        <div>
          <h3 className="text-sm font-semibold leading-snug">{article.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {article.authors.slice(0, 3).join(', ')}
            {article.authors.length > 3 ? ' et al.' : ''}
            {article.publicationYear ? ` · ${article.publicationYear}` : ''}
            {article.venue ? ` · ${article.venue}` : ''}
          </p>
        </div>
        {article.abstractText && (
          <p className="line-clamp-3 text-xs text-muted-foreground leading-relaxed">{article.abstractText}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Quote className="h-3 w-3" />
            {article.citationCount} citações
          </Badge>
          {article.openAccessUrl && (
            <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">Acesso aberto</Badge>
          )}
          {savedCollection && (
            <Badge variant="outline" className="text-xs text-violet-400 border-violet-500/30 gap-1">
              <Check className="h-2.5 w-2.5" /> {savedCollection}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 pt-0.5">
          <Button size="sm" className="h-7 text-xs px-3" onClick={() => setFichaOpen(true)}>
            <BookMarked className="h-3 w-3 mr-1" />
            Gerar ficha
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => setColOpen(true)}>
            <FolderOpen className="h-3 w-3 mr-1" />
            {savedCollection ? 'Mover coleção' : 'Adicionar à coleção'}
          </Button>
          {article.openAccessUrl && (
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2 ml-auto" asChild>
              <a href={article.openAccessUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Modal: Gerar ficha */}
      <Modal open={fichaOpen} onClose={() => setFichaOpen(false)} title="Gerar ficha de leitura">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-accent/30 p-3">
            <p className="text-xs font-medium leading-snug">{article.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {article.authors[0]}{article.authors.length > 1 ? ' et al.' : ''} · {article.publicationYear}
            </p>
          </div>
          {[
            { key: 'objetivo', label: 'Objetivo do estudo', placeholder: 'O que os autores investigaram?' },
            { key: 'metodo', label: 'Método', placeholder: 'Tipo de estudo, amostra, intervenção...' },
            { key: 'resultados', label: 'Resultados principais', placeholder: 'Principais achados...' },
            { key: 'conclusao', label: 'Conclusão', placeholder: 'O que concluíram?' },
            { key: 'notas', label: 'Notas pessoais', placeholder: 'Suas anotações...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
              <textarea
                rows={2}
                value={fichaFields[key as keyof typeof fichaFields]}
                onChange={(e) => setFichaFields((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={saveFicha} disabled={fichaSaved} className="flex-1">
              {fichaSaved ? <><Check className="h-3.5 w-3.5 mr-1" /> Salvo!</> : 'Salvar ficha'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFichaOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Adicionar à coleção */}
      <Modal open={colOpen} onClose={() => setColOpen(false)} title="Adicionar à coleção">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">Escolha uma coleção para salvar este artigo:</p>
          {COLLECTIONS.map((col) => (
            <button
              key={col.id}
              onClick={() => saveCollection(col.name)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary/50 hover:bg-accent ${
                savedCollection === col.name ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${col.color}`}>
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">{col.name}</span>
              {savedCollection === col.name && <Check className="ml-auto h-4 w-4 text-primary" />}
            </button>
          ))}
          <button
            onClick={() => saveCollection('Nova coleção')}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all"
          >
            + Criar nova coleção
          </button>
        </div>
      </Modal>
    </>
  );
}
