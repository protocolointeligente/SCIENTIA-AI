import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
        SCIENTIA AI
      </span>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
        A plataforma de pesquisa científica com IA auditável
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Fichamento automático, motor de evidências, revisão sistemática assistida, bibliometria e
        grafo de conhecimento — com proveniência rastreável em cada resposta de IA.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">Entrar no workspace</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/search">Explorar pesquisa</Link>
        </Button>
      </div>
    </main>
  );
}
