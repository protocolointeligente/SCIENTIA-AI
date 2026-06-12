import { AppShell } from '@/components/layout/app-shell';

export default function AssistantPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assistente científico</h1>
        <p className="text-sm text-muted-foreground">
          Converse com sua biblioteca — respostas com grounding e citações rastreáveis.
        </p>
      </div>
    </AppShell>
  );
}
