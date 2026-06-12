# Design System — Frontend (Next.js)

## Stack

Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, next-themes (dark mode padrão), TanStack Query + TanStack Table, @dnd-kit, react-three-fiber + drei, Plotly, D3 (grafo de força), react-pdf, react-markdown, cmdk (command palette).

## Tokens de Design

- **Cores base**: paleta neutra escura (slate/zinc) + accent primário "scientia" (azul-violeta), com variantes semânticas (success/warning/danger/info) e cores de evidência (`evidence-strong`, `evidence-moderate`, `evidence-weak`, `evidence-insufficient`, `evidence-conflicting`).
- **Tipografia**: fonte sans (Inter/Geist) para UI, fonte serif opcional para conteúdo de leitura longa (fichas/artigos).
- **Espaçamento**: escala baseada em 4px; raios de borda padrão `rounded-lg`/`rounded-xl`.
- **Motion**: transições padrão 150-250ms `ease-out`, com Framer Motion para entrada de painéis, modais e cards de resultado.

## App Shell

```
AppShell
├── Sidebar (navegação principal: Dashboard, Pesquisa, Biblioteca, Revisões, Bibliometria, Grafo, Assistente, Configurações)
├── Topbar (busca global, seletor de workspace, créditos de IA, avatar/menu)
├── Main (conteúdo da rota)
└── BottomNav (mobile)
```

## Componentes-chave (especificados no deep-dive de frontend)

- `KpiCard` — métricas de dashboard (papers salvos, revisões ativas, créditos restantes)
- `ArticleResultCard` — card de resultado de busca (título, autores, ano, venue, métricas, badges de evidência/acesso aberto)
- `EvidenceBadge` — indicador visual de força de evidência (STRONG/MODERATE/WEAK/INSUFFICIENT/CONFLICTING)
- `FieldResultBlock` — renderiza `FieldResult<T>` com estado ANSWERED/INSUFFICIENT_EVIDENCE/CONFLICTING_EVIDENCE e `confidenceScore`
- `GroundingPopover` — exibe trechos `[Sn]` referenciados por respostas de IA
- `KnowledgeGraphCanvas` — grafo D3 force-directed (2D) com expansão de ego-network
- `Map3DCanvas` — projeção UMAP 3D via react-three-fiber/drei, com troca de eixo (Semântico/Temporal/Impacto/Confiança)
- `CommandPalette` — busca global via `cmdk`

## Tema

Dark mode como padrão (`next-themes`), com variante light. Tokens expostos via CSS variables em `globals.css` e mapeados no `tailwind.config.ts`.
