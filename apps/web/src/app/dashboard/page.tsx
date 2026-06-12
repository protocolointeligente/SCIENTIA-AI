import { BookMarked, ClipboardList, Sparkles, Network } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu workspace de pesquisa.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Papers salvos" value={128} icon={BookMarked} trend={{ value: '+12 esta semana', positive: true }} />
          <KpiCard label="Revisões ativas" value={3} icon={ClipboardList} />
          <KpiCard label="Créditos de IA" value="240" icon={Sparkles} trend={{ value: 'Plano Researcher+' }} />
          <KpiCard label="Nós no grafo" value="1.4k" icon={Network} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nenhuma atividade ainda. Comece buscando artigos em{' '}
              <span className="font-medium text-foreground">Pesquisa</span>.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revisões em andamento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Nenhuma revisão sistemática criada ainda.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
