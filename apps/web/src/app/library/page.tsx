import { AppShell } from '@/components/layout/app-shell';

export default function LibraryPage() {
  return (
    <AppShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">
          Coleções, notas e destaques da sua biblioteca pessoal.
        </p>
      </div>
    </AppShell>
  );
}
