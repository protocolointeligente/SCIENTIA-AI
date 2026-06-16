'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Library,
  ClipboardList,
  Network,
  Boxes,
  Sparkles,
  Settings,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Pesquisa', icon: Search },
  { href: '/library', label: 'Biblioteca', icon: Library },
  { href: '/reviews', label: 'Revisões', icon: ClipboardList },
  { href: '/bibliometrics', label: 'Bibliometria', icon: Network },
  { href: '/graph', label: 'Grafo', icon: Boxes },
  { href: '/assistant', label: 'Assistente', icon: Sparkles },
  { href: '/guide', label: 'Guia de uso', icon: BookOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
      <div className="px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">SCIENTIA AI</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
