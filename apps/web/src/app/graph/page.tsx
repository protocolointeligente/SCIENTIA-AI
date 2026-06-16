'use client';

import { useState } from 'react';
import { Network, ZoomIn, ZoomOut, Maximize2, Search, X } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NODE_TYPES = [
  { id: 'paper', label: 'Papers', count: 128, color: 'bg-violet-500', fill: '#8b5cf6' },
  { id: 'author', label: 'Autores', count: 312, color: 'bg-blue-500', fill: '#3b82f6' },
  { id: 'concept', label: 'Conceitos', count: 87, color: 'bg-green-500', fill: '#10b981' },
  { id: 'journal', label: 'Periódicos', count: 67, color: 'bg-amber-500', fill: '#f59e0b' },
];

const CLUSTERS = [
  { id: '1', label: 'Treinamento de Força', nodes: 48, color: '#8b5cf6' },
  { id: '2', label: 'Nutrição Esportiva', nodes: 31, color: '#3b82f6' },
  { id: '3', label: 'Composição Corporal', nodes: 27, color: '#10b981' },
  { id: '4', label: 'Saúde Mental e Exercício', nodes: 22, color: '#f59e0b' },
];

const NODES = [
  { id: 'c1', x: 400, y: 250, r: 20, type: 'concept', fill: '#8b5cf6', label: 'FORÇA', connected: ['a1', 'a2', 'p1', 'p2', 'c2', 'c3', 'j1'] },
  { id: 'a1', x: 250, y: 150, r: 14, type: 'author', fill: '#3b82f6', label: 'Silva R.', connected: ['c1', 'p1'] },
  { id: 'a2', x: 550, y: 150, r: 14, type: 'author', fill: '#3b82f6', label: 'Johnson T.', connected: ['c1', 'p2'] },
  { id: 'c2', x: 200, y: 330, r: 12, type: 'concept', fill: '#10b981', label: 'Proteína', connected: ['c1', 'a1', 'j2'] },
  { id: 'c3', x: 580, y: 330, r: 12, type: 'concept', fill: '#10b981', label: 'RCT', connected: ['c1', 'a2'] },
  { id: 'j1', x: 400, y: 410, r: 10, type: 'journal', fill: '#f59e0b', label: 'Nutrients', connected: ['c1', 'c2'] },
  { id: 'p1', x: 150, y: 200, r: 10, type: 'paper', fill: '#8b5cf6', label: 'Paper #1', connected: ['a1', 'c1'] },
  { id: 'p2', x: 650, y: 200, r: 10, type: 'paper', fill: '#8b5cf6', label: 'Paper #2', connected: ['a2', 'c1'] },
  { id: 'a3', x: 340, y: 80, r: 11, type: 'author', fill: '#3b82f6', label: 'Costa L.', connected: ['j2', 'c4'] },
  { id: 'c4', x: 480, y: 70, r: 11, type: 'concept', fill: '#10b981', label: 'Jejum', connected: ['a3', 'j2'] },
  { id: 'j2', x: 100, y: 340, r: 10, type: 'journal', fill: '#f59e0b', label: 'EJSS', connected: ['c2', 'a3', 'c4'] },
];

const EDGES = NODES.flatMap((n) =>
  n.connected.flatMap((targetId) => {
    const target = NODES.find((t) => t.id === targetId);
    if (!target || n.id > targetId) return [];
    return [{ from: n, to: target }];
  })
);

type NodeInfo = typeof NODES[0];

export default function GraphPage() {
  const [activeTypes, setActiveTypes] = useState<string[]>(['paper', 'author', 'concept', 'journal']);
  const [searchQ, setSearchQ] = useState('');
  const [selected, setSelected] = useState<NodeInfo | null>(null);
  const [zoom, setZoom] = useState(1);

  const toggleType = (id: string) => {
    setActiveTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const visibleNodes = NODES.filter((n) => {
    if (!activeTypes.includes(n.type)) return false;
    if (searchQ && !n.label.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = EDGES.filter((e) => visibleIds.has(e.from.id) && visibleIds.has(e.to.id));

  const isConnectedToSelected = (n: NodeInfo) =>
    selected ? selected.connected.includes(n.id) || n.id === selected.id : false;

  const connectedInfo = selected
    ? {
        papers: selected.connected.filter((id) => NODES.find((n) => n.id === id)?.type === 'paper').length,
        authors: selected.connected.filter((id) => NODES.find((n) => n.id === id)?.type === 'author').length,
        concepts: selected.connected.filter((id) => NODES.find((n) => n.id === id)?.type === 'concept').length,
      }
    : null;

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col gap-0">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Grafo de conhecimento</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Papers, autores, conceitos e periódicos como um grafo navegável. Clique em um nó para explorar.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
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

        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden bg-black/20">
          <svg
            className="h-full w-full cursor-grab active:cursor-grabbing"
            viewBox={`${(400 - 400 / zoom).toFixed(0)} ${(250 - 250 / zoom).toFixed(0)} ${(800 / zoom).toFixed(0)} ${(500 / zoom).toFixed(0)}`}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#grid)" />

            {/* Edges */}
            {visibleEdges.map((e, i) => {
              const highlighted = selected
                ? (e.from.id === selected.id || e.to.id === selected.id)
                : false;
              return (
                <line
                  key={i}
                  x1={e.from.x} y1={e.from.y}
                  x2={e.to.x} y2={e.to.y}
                  stroke={highlighted ? 'rgba(139,92,246,0.7)' : 'rgba(139,92,246,0.15)'}
                  strokeWidth={highlighted ? 2 : 1.5}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((n) => {
              const isSelected = selected?.id === n.id;
              const isConnected = isConnectedToSelected(n);
              const dimmed = selected && !isSelected && !isConnected;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected?.id === n.id ? null : n)}
                  style={{ opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}
                >
                  {isSelected && (
                    <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={n.fill} strokeWidth="2" strokeOpacity="0.5" />
                  )}
                  <circle
                    cx={n.x} cy={n.y} r={n.r}
                    fill={n.fill}
                    fillOpacity={isSelected ? 1 : isConnected ? 0.9 : 0.75}
                    style={{ transition: 'fill-opacity 0.2s' }}
                  />
                  <text
                    x={n.x} y={n.y + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize={n.r > 14 ? 9 : 7} fontWeight="bold"
                  >
                    {n.label.length > 8 ? n.label.slice(0, 7) + '…' : n.label}
                  </text>
                  <text
                    x={n.x} y={n.y + n.r + 11}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)" fontSize="8"
                  >
                    {n.type}
                  </text>
                </g>
              );
            })}

            {visibleNodes.length === 0 && (
              <text x="400" y="250" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="13">
                Nenhum nó visível com esses filtros
              </text>
            )}
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <Button
              variant="outline" size="sm"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur"
              onClick={() => setZoom((z) => Math.min(z + 0.3, 3))}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="sm"
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur"
              onClick={() => setZoom((z) => Math.max(z - 0.3, 0.5))}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Search */}
          <div className="absolute left-4 top-4 w-56">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/90 backdrop-blur px-3 py-2 text-sm">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar no grafo..."
                className="bg-transparent text-xs outline-none placeholder:text-muted-foreground w-full"
              />
              {searchQ && (
                <button onClick={() => setSearchQ('')}>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Selected node info panel */}
          {selected && (
            <div className="absolute right-4 top-4 w-52 rounded-xl border border-border bg-background/95 backdrop-blur p-4 shadow-lg space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{selected.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{selected.type}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {connectedInfo && (
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground font-medium">Conexões</p>
                  {connectedInfo.papers > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Papers</span><span>{connectedInfo.papers}</span></div>}
                  {connectedInfo.authors > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Autores</span><span>{connectedInfo.authors}</span></div>}
                  {connectedInfo.concepts > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Conceitos</span><span>{connectedInfo.concepts}</span></div>}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{selected.connected.length} conexão{selected.connected.length !== 1 ? 'ões' : ''} no total</p>
            </div>
          )}
        </div>

        {/* Cluster legend */}
        <div className="shrink-0 border-t border-border px-6 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Network className="h-3.5 w-3.5" />
              Clusters temáticos:
            </span>
            {CLUSTERS.map((c) => (
              <Badge key={c.id} variant="outline" className="gap-1.5 text-xs cursor-pointer hover:border-primary/50">
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
