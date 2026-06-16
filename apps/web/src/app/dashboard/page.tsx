import {
  BookMarked,
  ClipboardList,
  Sparkles,
  Network,
  Search,
  Star,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RECENT_ACTIVITY = [
  {
    icon: BookMarked,
    color: 'text-violet-400',
    label: 'Artigo salvo na biblioteca',
    detail: 'Effects of resistance training on fat mass reduction in women',
    time: 'há 2h',
  },
  {
    icon: Search,
    color: 'text-blue-400',
    label: 'Busca realizada',
    detail: '"protein intake muscle hypertrophy meta-analysis"',
    time: 'há 3h',
  },
  {
    icon: ClipboardList,
    color: 'text-amber-400',
    label: 'Revisão atualizada',
    detail: 'Efeitos do treinamento resistido no emagrecimento feminino',
    time: 'ontem',
  },
  {
    icon: Star,
    color: 'text-yellow-400',
    label: 'Artigo destacado',
    detail: 'Intermittent fasting and body composition changes',
    time: 'ontem',
  },
  {
    icon: Sparkles,
    color: 'text-cyan-400',
    label: 'Conversa com assistente',
    detail: 'Quais papers têm maior evidência sobre suplementação proteica?',
    time: 'há 2 dias',
  },
];

const ACTIVE_REVIEWS = [
  {
    title: 'Efeitos do treinamento resistido no emagrecimento feminino',
    status: 'em_andamento',
    progress: 58,
    papers: 47,
    total: 342,
  },
  {
    title: 'Suplementação proteica e hipertrofia muscular: meta-análise',
    status: 'triagem',
    progress: 47,
    papers: 89,
    total: 189,
  },
];

const QUICK_ACTIONS = [
  { href: '/search' as const, icon: Search, label: 'Nova busca', colorText: 'text-violet-400', colorBg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
  { href: '/reviews' as const, icon: ClipboardList, label: 'Nova revisão', colorText: 'text-amber-400', colorBg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
  { href: '/assistant' as const, icon: Sparkles, label: 'Perguntar à IA', colorText: 'text-cyan-400', colorBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20' },
  { href: '/guide' as const, icon: BookOpen, label: 'Guia de uso', colorText: 'text-blue-400', colorBg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu workspace de pesquisa científica.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Papers salvos" value={128} icon={BookMarked} trend={{ value: '+12 esta semana', positive: true }} />
          <KpiCard label="Revisões ativas" value={2} icon={ClipboardList} trend={{ value: '1 concluída' }} />
          <KpiCard label="Créditos de IA" value="240" icon={Sparkles} trend={{ value: 'Plano Researcher+' }} />
          <KpiCard label="Nós no grafo" value="1.4k" icon={Network} trend={{ value: '+87 esta semana', positive: true }} />
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-sm font-medium transition-all ${action.colorBg}`}
              >
                <Icon className={`h-6 w-6 ${action.colorText}`} />
                {action.label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Atividade recente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Atividade recente</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {RECENT_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 ${item.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Revisões em andamento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Revisões em andamento</CardTitle>
              <Link href="/reviews" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {ACTIVE_REVIEWS.map((review, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-medium leading-snug line-clamp-2">{review.title}</p>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${
                        review.status === 'em_andamento'
                          ? 'text-blue-400 border-blue-500/30'
                          : 'text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {review.status === 'em_andamento' ? 'Em andamento' : 'Triagem'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${review.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {review.papers}/{review.total}
                    </span>
                  </div>
                </div>
              ))}

              <Link
                href="/guide"
                className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                Novo na plataforma? Veja o guia de uso
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
