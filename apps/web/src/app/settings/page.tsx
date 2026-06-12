import { AppShell } from '@/components/layout/app-shell';

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Workspace, membros, papéis e permissões, billing e integrações.
        </p>
      </div>
    </AppShell>
  );
}
