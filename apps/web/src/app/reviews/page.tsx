'use client';

import { useState } from 'react';
import { Plus, ClipboardList, CheckCircle2, Clock, Circle, ChevronRight, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const REVIEWS = [
  {
    id: '1',
    title: 'Efeitos do treinamento resistido no emagrecimento feminino',
    status: 'em_andamento',
    protocol: 'PRISMA',
    papers: { total: 342, screened: 198, included: 47 },
    collaborators: 3,
    updatedAt: '2026-06-14',
  },
  {
    id: '2',
    title: 'Suplementação proteica e hipertrofia muscular: meta-análise',
    status: 'triagem',
    protocol: 'PRISMA',
    papers: { total: 189, screened: 89, included: 0 },
    collaborators: 1,
    updatedAt: '2026-06-10',
  },
  {
    id: '3',
    title: 'Jejum intermitente e composição corporal',
    status: 'concluida',
    protocol: 'PRISMA',
    papers: { total: 267, screened: 267, included: 38 },
    collaborators: 2,
    updatedAt: '2026-05-28',
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; Icon: typeof Circle }> = {
  triagem: { label: 'Triagem', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', Icon: Clock },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', Icon: Circle },
  concluida: { label: 'Concluída', color: 'bg-green-500/20 text-green-400 border-green-500/30', Icon: CheckCircle2 },
};

function ProgressBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function ReviewsPage() {
  const [creating, setCreating] = useState(false);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Revisões sistemáticas</h1>
            <p className="text-sm text-muted-foreground">
              Triagem PRISMA assistida por IA, com fluxo de identificação, elegibilidade e inclusão.
            </p>
          </div>
          <Button size="sm" className="gap-1" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nova revisão
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Revisões ativas', value: 2, color: 'text-blue-400' },
            { label: 'Papers triados', value: '554', color: 'text-amber-400' },
            { label: 'Incluídos', value: 85, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Review list */}
        <div className="space-y-3">
          {REVIEWS.map((review) => {
            const status = STATUS_MAP[review.status];
            const { Icon } = status;

            return (
              <div
                key={review.id}
                className="group cursor-pointer rounded-xl border border-border p-5 hover:border-primary/40 hover:bg-accent/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`border text-xs ${status.color}`}>
                        <Icon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{review.protocol}</Badge>
                    </div>
                    <h3 className="mt-2 font-medium leading-snug">{review.title}</h3>

                    <div className="mt-4 grid gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Identificados: <span className="text-foreground font-medium">{review.papers.total}</span></span>
                        <span>Triados: <span className="text-amber-400 font-medium">{review.papers.screened}</span></span>
                        <span>Incluídos: <span className="text-green-400 font-medium">{review.papers.included}</span></span>
                      </div>
                      <ProgressBar value={review.papers.screened} max={review.papers.total} color="bg-amber-500" />
                      <ProgressBar value={review.papers.included} max={review.papers.total} color="bg-green-500" />
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {review.collaborators} colaborador{review.collaborators !== 1 ? 'es' : ''}
                      </span>
                      <span>Atualizado em {review.updatedAt}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

        {creating && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-primary/60" />
            <p className="font-medium">Criar nova revisão sistemática</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a Pesquisa para identificar artigos e adicione-os a uma revisão.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
