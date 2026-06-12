import { AppShell } from '@/components/layout/app-shell';

export default function ReviewsPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Revisões sistemáticas</h1>
        <p className="text-sm text-muted-foreground">
          Triagem PRISMA assistida por IA, com fluxo de identificação, elegibilidade e inclusão.
        </p>
      </div>
    </AppShell>
  );
}
