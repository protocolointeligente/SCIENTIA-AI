import { AppShell } from '@/components/layout/app-shell';

export default function GraphPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Grafo de conhecimento</h1>
        <p className="text-sm text-muted-foreground">
          Exploração de papers, autores, conceitos, instituições e periódicos como um grafo navegável.
        </p>
      </div>
    </AppShell>
  );
}
