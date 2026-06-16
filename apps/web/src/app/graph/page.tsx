'use client';

import { useState } from 'react';
import { Network, Filter, ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NODE_TYPES = [
  { id: 'paper', label: 'Papers', count: 128, color: 'bg-violet-500' },
  { id: 'author', label: 'Autores', count: 312, color: 'bg-blue-500' },
  { id: 'concept', label: 'Conceitos', count: 87, color: 'bg-green-500' },
  { id: 'journal', label: 'Periódicos', count: 67, color: 'bg-amber-500' },
];

const CLUSTERS = [
  { id: '1', label: 'Treinamento de Força', nodes: 48, color: '#8b5cf6' },
  { id: '2', label: 'Nutrição Esportiva', nodes: 31, color: '#3b82f6' },
  { id: '3', label: 'Composição Corporal', nodes: 27, color: '#10b981' },
  { id: '4', label: 'Saúde Mental e Exercício', nodes: 22, color: '#f59e0b' },
];

export default function GraphPage() {
  const [activeTypes, setActiveTypes] = useState<string[]>(['paper', 'author', 'concept']);
  const [searchQ, setSearchQ] = useState('');

  const toggleType = (id: string) => {
    setActiveTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-0">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Grafo de conhecimento</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Papers, autores, conceitos, instituições e periódicos como um grafo navegável.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Node type toggles */}
          <div className="mt-3 flex flex-wrap gap-2">
            {NODE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  activeTypes.includes(type.id)
                    ? 'border-transparent bg-white/10 text-foreground'
                    : 'border-border text-muted-foreground opacity-50'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${type.color}`} />
                {type.label}
                <span className="text-muted-foreground">({type.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Graph canvas area */}
        <div className="relative flex-1 overflow-hidden bg-black/20">
          {/* Simulated graph with SVG */}
          <svg className="h-full w-full" viewBox="0 0 800 500">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#grid)" />

            {/* Simulated edges */}
            {[
              [400, 250, 250, 150], [400, 250, 550, 150], [400, 250, 200, 320],
              [400, 250, 580, 330], [400, 250, 350, 400], [250, 150, 150, 200],
              [550, 150, 650, 200], [200, 320, 150, 200], [580, 330, 650, 200],
            ].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" />
            ))}

            {/* Central node */}
            <circle cx="400" cy="250" r="18" fill="#8b5cf6" fillOpacity="0.9" />
            <text x="400" y="255" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">FORÇA</text>

            {/* Secondary nodes */}
            {[
              { x: 250, y: 150, r: 13, color: '#3b82f6', label: 'Silva R.' },
              { x: 550, y: 150, r: 13, color: '#3b82f6', label: 'Johnson T.' },
              { x: 200, y: 320, r: 11, color: '#10b981', label: 'protein' },
              { x: 580, y: 330, r: 11, color: '#10b981', label: 'RCT' },
              { x: 350, y: 400, r: 10, color: '#f59e0b', label: 'Nutrients' },
              { x: 150, y: 200, r: 9, color: '#8b5cf6', label: 'Paper' },
              { x: 650, y: 200, r: 9, color: '#8b5cf6', label: 'Paper' },
            ].map((n, i) => (
              <g key={i} className="cursor-pointer">
                <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} fillOpacity="0.8" />
                <text x={n.x} y={n.y + n.r + 12} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="8">{n.label}</text>
              </g>
            ))}

            {/* Floating tooltip hint */}
            <text x="400" y="480" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11">
              Busque artigos para expandir o grafo
            </text>
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-background/80 backdrop-blur">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-background/80 backdrop-blur">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Search overlay */}
          <div className="absolute left-4 top-4 w-56">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/90 backdrop-blur px-3 py-2 text-sm">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar no grafo..."
                className="bg-transparent text-xs outline-none placeholder:text-muted-foreground w-full"
              />
            </div>
          </div>
        </div>

        {/* Cluster legend */}
        <div className="shrink-0 border-t border-border px-6 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Network className="h-3.5 w-3.5" />
              Clusters temáticos:
            </span>
            {CLUSTERS.map((c) => (
              <Badge key={c.id} variant="outline" className="gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
                <span className="text-muted-foreground">({c.nodes})</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
