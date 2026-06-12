import { AppShell } from '@/components/layout/app-shell';

export default function BibliometricsPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Bibliometria</h1>
        <p className="text-sm text-muted-foreground">
          Índices de impacto, redes de coautoria/cocitação e clusterização temática.
        </p>
      </div>
    </AppShell>
  );
}
