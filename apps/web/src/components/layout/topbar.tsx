'use client';

import { Search, Sparkles, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { useActiveWorkspace } from '@/lib/workspace-context';

export function Topbar() {
  const router = useRouter();
  const { session, workspace } = useActiveWorkspace();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  const userEmail = session?.user?.email ?? null;
  const userName =
    session?.user?.user_metadata?.full_name ??
    session?.user?.user_metadata?.name ??
    userEmail?.split('@')[0] ??
    null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span>Buscar artigos, autores, conceitos... (⌘K)</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          240 créditos de IA
        </Badge>

        {workspace && (
          <Badge variant="outline" className="text-xs">
            {workspace.name}
          </Badge>
        )}

        {session ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="max-w-[140px] truncate text-muted-foreground">
                {userName ?? userEmail}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => router.push('/sign-in')}>
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
}
