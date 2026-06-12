# SCIENTIA AI

Plataforma premium de pesquisa científica com IA — fichamento automático, revisão sistemática assistida, motor de evidências, bibliometria e grafo de conhecimento, com proveniência auditável em cada output de IA.

## Estrutura do Monorepo

```
scientia-ai/
├── apps/
│   ├── api/          # Backend NestJS (REST API, filas BullMQ, integrações)
│   └── web/          # Frontend Next.js 15 (App Router, Tailwind, shadcn/ui)
├── packages/
│   └── database/      # Schema Prisma compartilhado + client gerado
├── docs/              # Documentação de arquitetura, design system e domínio
└── package.json       # Workspaces npm
```

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query.
- **Backend**: NestJS, PostgreSQL + Prisma + pgvector, Elasticsearch, Redis + BullMQ, Clerk (auth), Stripe + Mercado Pago (billing).
- **IA**: Orquestração multi-modelo (OpenAI, Anthropic, Google) com RAG, grounding e auditoria de fidelidade.

## Primeiros passos

```bash
# instalar dependências de todos os workspaces
npm install

# gerar o Prisma client
npm run db:generate

# subir o backend em modo dev
npm run dev:api

# subir o frontend em modo dev
npm run dev:web
```

Cada app possui seu próprio `.env.example` — copie para `.env` e preencha as credenciais (Clerk, banco de dados, provedores de IA, Stripe/Mercado Pago).

## Documentação

Veja [`docs/`](./docs) para:
- [Arquitetura geral](./docs/architecture.md)
- [Módulos do backend](./docs/backend-modules.md)
- [Design system do frontend](./docs/design-system.md)
- [Modelo de dados](./docs/data-model.md)
- [Camada de IA](./docs/ai-layer.md)

## Status

Projeto em fase de scaffold inicial — estrutura modular, schema de dados completo e primeiras features (auth, workspaces, busca, dashboard) implementadas como base para o desenvolvimento incremental.
