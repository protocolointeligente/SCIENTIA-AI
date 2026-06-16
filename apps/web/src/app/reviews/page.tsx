'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, ClipboardList, CheckCircle2, Clock, Circle, ChevronRight,
  Users, X, ArrowLeft, FileText, Filter, Check, Download, Mail,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadReviews, type ReviewProject } from '@/lib/review/types';

const PROTOCOLS = ['PRISMA', 'PROSPERO', 'Cochrane', 'MOOSE'];
const STORAGE_KEY = 'scientia_reviews';

const INIT_REVIEWS = [
  {
    id: '1',
    title: 'Efeitos do treinamento resistido no emagrecimento feminino',
    status: 'em_andamento',
    protocol: 'PRISMA',
    question: 'O treinamento resistido reduz a gordura corporal em mulheres adultas?',
    papers: { total: 342, screened: 198, included: 47 },
    collaborators: ['ana.silva@pesquisa.br'],
    updatedAt: '2026-06-14',
  },
  {
    id: '2',
    title: 'Suplementação proteica e hipertrofia muscular: meta-análise',
    status: 'triagem',
    protocol: 'PRISMA',
    question: 'A suplementação proteica melhora a hipertrofia muscular em treinos de força?',
    papers: { total: 189, screened: 89, included: 0 },
    collaborators: [],
    updatedAt: '2026-06-10',
  },
  {
    id: '3',
    title: 'Jejum intermitente e composição corporal',
    status: 'concluida',
    protocol: 'PRISMA',
    question: 'O jejum intermitente altera a composição corporal comparado à restrição calórica?',
    papers: { total: 267, screened: 267, included: 38 },
    collaborators: ['carlos@lab.edu'],
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

type Review = typeof INIT_REVIEWS[0];

// ── Export PRISMA report as .txt download ──────────────────────────────────
function exportPrisma(review: Review) {
  const eligibility = Math.round(review.papers.screened * 0.6);
  const lines = [
    `RELATÓRIO PRISMA — ${review.title}`,
    '='.repeat(60),
    '',
    `Protocolo: ${review.protocol}`,
    `Status: ${STATUS_MAP[review.status]?.label ?? review.status}`,
    `Data: ${review.updatedAt}`,
    '',
    'PERGUNTA DE PESQUISA',
    '-'.repeat(40),
    review.question,
    '',
    'FUNIL PRISMA',
    '-'.repeat(40),
    `1. Identificação  : ${review.papers.total} registros encontrados nas bases`,
    `2. Triagem        : ${review.papers.screened} títulos e resumos avaliados`,
    `3. Elegibilidade  : ${eligibility} textos completos avaliados`,
    `4. Inclusão       : ${review.papers.included} estudos incluídos`,
    '',
    'MÉTRICAS',
    '-'.repeat(40),
    `Triagem concluída : ${review.papers.total > 0 ? Math.round((review.papers.screened / review.papers.total) * 100) : 0}%`,
    `Taxa de inclusão  : ${review.papers.total > 0 ? Math.round((review.papers.included / review.papers.total) * 100) : 0}%`,
    `Colaboradores     : ${review.collaborators.length}`,
    review.collaborators.length > 0 ? `  ${review.collaborators.join(', ')}` : '',
    '',
    '—',
    'Gerado por SCIENTIA AI — scientia-ai.vercel.app',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PRISMA_${review.title.slice(0, 30).replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Invite modal ───────────────────────────────────────────────────────────
function InviteModal({ review, onClose, onInvite }: {
  review: Review;
  onClose: () => void;
  onInvite: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!email.trim() || !email.includes('@')) return;
    onInvite(email.trim());
    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Convidar colaborador
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Revisão: <span className="text-foreground font-medium">{review.title}</span>
        </p>

        {review.collaborators.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Colaboradores atuais</p>
            {review.collaborators.map((c) => (
              <div key={c} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {c[0].toUpperCase()}
                </div>
                {c}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">E-mail do colaborador</label>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="pesquisador@exemplo.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={send} disabled={!email.trim() || sent} className="gap-1 flex-1">
            {sent ? (
              <><Check className="h-3.5 w-3.5" /> Convite enviado!</>
            ) : (
              <><Mail className="h-3.5 w-3.5" /> Enviar convite</>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

// ── Review detail ──────────────────────────────────────────────────────────
function ReviewDetail({ review, onBack, onUpdateReview }: {
  review: Review;
  onBack: () => void;
  onUpdateReview: (updated: Review) => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const status = STATUS_MAP[review.status];
  const { Icon } = status;
  const screened_pct = review.papers.total > 0 ? Math.round((review.papers.screened / review.papers.total) * 100) : 0;
  const included_pct = review.papers.total > 0 ? Math.round((review.papers.included / review.papers.total) * 100) : 0;

  const PRISMA_STAGES = [
    { label: 'Identificação', desc: 'Registros encontrados nas bases', count: review.papers.total, color: 'bg-violet-500' },
    { label: 'Triagem', desc: 'Títulos e resumos avaliados', count: review.papers.screened, color: 'bg-amber-500' },
    { label: 'Elegibilidade', desc: 'Textos completos avaliados', count: Math.round(review.papers.screened * 0.6), color: 'bg-blue-500' },
    { label: 'Inclusão', desc: 'Estudos incluídos', count: review.papers.included, color: 'bg-green-500' },
  ];

  const handleExport = () => {
    exportPrisma(review);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleInvite = (email: string) => {
    const updated = {
      ...review,
      collaborators: [...review.collaborators, email],
    };
    onUpdateReview(updated);
  };

  return (
    <>
      {showInvite && (
        <InviteModal
          review={review}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="mt-1 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`border text-xs ${status.color}`}>
                <Icon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-xs">{review.protocol}</Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug">{review.title}</h1>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pergunta de pesquisa</p>
          <p className="text-sm">{review.question}</p>
        </div>

        {/* PRISMA funnel */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Funil PRISMA
          </h2>
          <div className="space-y-2">
            {PRISMA_STAGES.map((stage, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.desc}</p>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stage.count}</span>
                </div>
                <ProgressBar value={stage.count} max={review.papers.total || 1} color={stage.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Progress summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Triagem concluída', value: `${screened_pct}%`, color: 'text-amber-400' },
            { label: 'Taxa de inclusão', value: `${included_pct}%`, color: 'text-green-400' },
            { label: 'Colaboradores', value: review.collaborators.length, color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Collaborators list */}
        {review.collaborators.length > 0 && (
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Colaboradores</p>
            {review.collaborators.map((c) => (
              <div key={c} className="flex items-center gap-2 text-sm">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                  {c[0].toUpperCase()}
                </div>
                {c}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={handleExport} className="gap-1" variant={exportDone ? 'default' : 'default'}>
            {exportDone ? (
              <><Check className="h-3.5 w-3.5" /> Exportado!</>
            ) : (
              <><Download className="h-3.5 w-3.5" /> Exportar relatório PRISMA</>
            )}
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowInvite(true)}>
            <Users className="h-3.5 w-3.5" />
            Convidar colaborador
            {review.collaborators.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{review.collaborators.length}</Badge>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [v2Reviews, setV2Reviews] = useState<ReviewProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newProtocol, setNewProtocol] = useState('PRISMA');
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReviews(JSON.parse(stored) as Review[]);
      } else {
        setReviews(INIT_REVIEWS);
      }
    } catch {
      setReviews(INIT_REVIEWS);
    }
    // Also load v2 reviews (created from search flow)
    setV2Reviews(loadReviews());
    setHydrated(true);
  }, []);

  // Persist whenever reviews change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }, [reviews, hydrated]);

  // Keep selected in sync if reviews update
  useEffect(() => {
    if (selected) {
      const updated = reviews.find((r) => r.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [reviews]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateReview = (updated: Review) => {
    setReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  };

  const createReview = () => {
    if (!newTitle.trim()) return;
    const id = Date.now().toString();
    const newReview: Review = {
      id,
      title: newTitle.trim(),
      status: 'triagem',
      protocol: newProtocol,
      question: newQuestion.trim() || 'Pergunta de pesquisa a definir',
      papers: { total: 0, screened: 0, included: 0 },
      collaborators: [],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setReviews((prev) => [newReview, ...prev]);
    setSaved(true);
    setTimeout(() => {
      setShowNew(false);
      setNewTitle('');
      setNewQuestion('');
      setNewProtocol('PRISMA');
      setSaved(false);
    }, 900);
  };

  if (!hydrated) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          Carregando revisões…
        </div>
      </AppShell>
    );
  }

  if (selected) {
    return (
      <AppShell>
        <ReviewDetail
          review={selected}
          onBack={() => setSelected(null)}
          onUpdateReview={updateReview}
        />
      </AppShell>
    );
  }

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
          <Button size="sm" className="gap-1" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            Nova revisão
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Revisões ativas',
              value: reviews.filter((r) => r.status !== 'concluida').length + v2Reviews.filter((r) => r.status !== 'concluida').length,
              color: 'text-blue-400'
            },
            {
              label: 'Estudos importados',
              value: reviews.reduce((a, r) => a + r.papers.screened, 0) + v2Reviews.reduce((a, r) => a + r.studies.length, 0),
              color: 'text-amber-400'
            },
            {
              label: 'Incluídos',
              value: reviews.reduce((a, r) => a + r.papers.included, 0) + v2Reviews.reduce((a, r) => a + r.papers.included, 0),
              color: 'text-green-400'
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* New review form */}
        {showNew && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Nova revisão sistemática
              </p>
              <button onClick={() => setShowNew(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Título *</label>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Efeito do exercício aeróbico na pressão arterial..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Pergunta de pesquisa (PICO)</label>
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ex: O exercício aeróbico reduz a pressão arterial em adultos hipertensos?"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Protocolo</label>
                <div className="flex gap-2 flex-wrap">
                  {PROTOCOLS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewProtocol(p)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        newProtocol === p ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={createReview} disabled={!newTitle.trim() || saved} className="gap-1">
                {saved ? <><Check className="h-3.5 w-3.5" /> Criado!</> : 'Criar revisão'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* V2 reviews (from search import flow) */}
        {v2Reviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Revisões científicas ({v2Reviews.length})
            </h2>
            {v2Reviews.map((r) => {
              const status = STATUS_MAP[r.status] ?? STATUS_MAP['triagem'];
              const { Icon } = status;
              return (
                <button
                  key={r.id}
                  onClick={() => router.push(`/reviews/${r.id}`)}
                  className="group w-full cursor-pointer rounded-xl border border-border p-5 text-left hover:border-primary/40 hover:bg-accent/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`border text-xs ${status.color}`}>
                          <Icon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{r.framework}</Badge>
                        <Badge variant="outline" className={`text-xs ${r.mode === 'auto' ? 'text-violet-400 border-violet-500/30 bg-violet-500/5' : ''}`}>
                          {r.mode === 'auto' ? '✦ IA automática' : 'Manual'}
                        </Badge>
                      </div>
                      <h3 className="mt-2 font-medium leading-snug">{r.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{r.question}</p>
                      <div className="mt-3 grid gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Estudos: <span className="text-foreground font-medium">{r.studies.length}</span></span>
                          <span>Triados: <span className="text-amber-400 font-medium">{r.papers.screened}</span></span>
                          <span>Incluídos: <span className="text-green-400 font-medium">{r.papers.included}</span></span>
                        </div>
                        <ProgressBar value={r.papers.screened} max={r.studies.length || 1} color="bg-amber-500" />
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Atualizado em {r.updatedAt}</span>
                        {r.aiProcessing.status === 'done' && (
                          <span className="text-green-400">✓ IA concluída</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Legacy review list */}
        <div className="space-y-3">
          {v2Reviews.length === 0 && reviews.length === 0 && (
            <div className="rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
              Nenhuma revisão criada ainda. Clique em <strong>Nova revisão</strong> para começar.
            </div>
          )}
          {v2Reviews.length > 0 && reviews.length > 0 && (
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Revisões manuais (legado)
            </h2>
          )}
          {reviews.map((review) => {
            const status = STATUS_MAP[review.status];
            const { Icon } = status;
            return (
              <button
                key={review.id}
                onClick={() => setSelected(review)}
                className="group w-full cursor-pointer rounded-xl border border-border p-5 text-left hover:border-primary/40 hover:bg-accent/20 transition-all"
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
                      <ProgressBar value={review.papers.screened} max={review.papers.total || 1} color="bg-amber-500" />
                      <ProgressBar value={review.papers.included} max={review.papers.total || 1} color="bg-green-500" />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {review.collaborators.length} colaborador{review.collaborators.length !== 1 ? 'es' : ''}
                      </span>
                      <span>Atualizado em {review.updatedAt}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
