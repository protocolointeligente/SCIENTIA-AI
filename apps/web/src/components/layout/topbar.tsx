'use client';

import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Topbar() {
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
        <Button variant="outline" size="sm">
          Workspace: Main
        </Button>
      </div>
    </header>
  );
}
