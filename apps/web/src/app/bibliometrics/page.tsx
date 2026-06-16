'use client';

import { BarChart3, TrendingUp, Users, Network, BookOpen, Award } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

const TOP_AUTHORS = [
  { name: 'Silva, R.M.', papers: 18, citations: 342, hIndex: 9 },
  { name: 'Johnson, T.K.', papers: 14, citations: 289, hIndex: 11 },
  { name: 'Costa, A.B.', papers: 12, citations: 198, hIndex: 7 },
  { name: 'Oliveira, F.S.', papers: 9, citations: 156, hIndex: 6 },
  { name: 'Lima, P.C.', papers: 8, citations: 134, hIndex: 5 },
];

const TOP_JOURNALS = [
  { name: 'Journal of Strength & Conditioning', papers: 34, if: 4.2 },
  { name: 'European Journal of Sport Science', papers: 28, if: 3.8 },
  { name: 'Medicine & Science in Sports', papers: 22, if: 5.1 },
  { name: 'Sports Medicine', papers: 17, if: 11.3 },
  { name: 'Nutrients', papers: 15, if: 5.9 },
];

const KEYWORDS = [
  { word: 'resistance training', count: 87, size: 'text-2xl' },
  { word: 'fat loss', count: 64, size: 'text-xl' },
  { word: 'muscle hypertrophy', count: 58, size: 'text-xl' },
  { word: 'protein intake', count: 51, size: 'text-lg' },
  { word: 'body composition', count: 47, size: 'text-lg' },
  { word: 'exercise', count: 43, size: 'text-base' },
  { word: 'meta-analysis', count: 38, size: 'text-base' },
  { word: 'RCT', count: 29, size: 'text-sm' },
  { word: 'women', count: 26, size: 'text-sm' },
  { word: 'caloric deficit', count: 21, size: 'text-sm' },
  { word: 'HIIT', count: 18, size: 'text-xs' },
  { word: 'nutrition', count: 17, size: 'text-xs' },
];

const COLORS = [
  'text-violet-400', 'text-blue-400', 'text-green-400', 'text-amber-400',
  'text-pink-400', 'text-cyan-400', 'text-orange-400', 'text-teal-400',
];

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: typeof BarChart3; sub?: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function BibliometricsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bibliometria</h1>
          <p className="text-sm text-muted-foreground">
            Índices de impacto, redes de coautoria/cocitação e clusterização temática.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Papers analisados" value="128" icon={BookOpen} sub="+12 esta semana" />
          <StatCard label="Citações totais" value="1.4k" icon={TrendingUp} sub="Média 10.9/paper" />
          <StatCard label="Autores únicos" value="312" icon={Users} sub="48 recorrentes" />
          <StatCard label="Periódicos" value="67" icon={Award} sub="18 Q1 / 24 Q2" />
        </div>

        {/* Two columns */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top authors */}
          <div className="rounded-xl border border-border p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              <h2 className="font-medium">Top autores</h2>
            </div>
            <div className="space-y-3">
              {TOP_AUTHORS.map((a, i) => (
                <div key={a.name} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{a.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground shrink-0">h-index: {a.hIndex}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-violet-500"
                        style={{ width: `${(a.papers / TOP_AUTHORS[0].papers) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.papers} papers</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top journals */}
          <div className="rounded-xl border border-border p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <h2 className="font-medium">Top periódicos</h2>
            </div>
            <div className="space-y-3">
              {TOP_JOURNALS.map((j, i) => (
                <div key={j.name} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{j.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground shrink-0">IF {j.if}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${(j.papers / TOP_JOURNALS[0].papers) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{j.papers} papers</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyword cloud */}
        <div className="rounded-xl border border-border p-5">
          <div className="mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-green-400" />
            <h2 className="font-medium">Nuvem de palavras-chave</h2>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-center py-4">
            {KEYWORDS.map((kw, i) => (
              <span
                key={kw.word}
                className={`${kw.size} ${COLORS[i % COLORS.length]} font-medium cursor-default hover:opacity-80 transition-opacity`}
                title={`${kw.count} ocorrências`}
              >
                {kw.word}
              </span>
            ))}
          </div>
        </div>

        {/* Network placeholder */}
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Network className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">Rede de coautoria</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Busque artigos para gerar a rede de coautoria interativa.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
