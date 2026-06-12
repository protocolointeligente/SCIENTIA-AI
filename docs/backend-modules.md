# Módulos do Backend (NestJS)

Cada módulo segue a convenção interna:

```
src/modules/<module>/
├── <module>.module.ts
├── controllers/
├── services/
├── repositories/      (quando aplicável)
├── dto/
├── policies/           (regras de autorização específicas)
└── events/              (handlers de eventos de domínio)
```

## Módulos (21)

| Módulo | Responsabilidade |
|---|---|
| `auth` | Sincronização Clerk, sessão, webhook |
| `users` | Perfil de usuário |
| `organizations` | Organizações (tenant raiz) |
| `workspaces` | Workspaces, membros |
| `permissions` | RBAC (`PERMISSION_MATRIX`, roles customizadas) |
| `search` | Busca multi-fonte (OpenAlex, Crossref, Semantic Scholar, etc.) |
| `papers` | Detalhe de paper, ingestão, ficha científica |
| `reviews` | Revisão sistemática assistida (PRISMA) |
| `evidence` | Motor de evidências |
| `assistant` | Chat científico com RAG |
| `bibliography` | Coleções, notas, biblioteca pessoal |
| `bibliometrics` | Índices, redes, grafo de conhecimento |
| `exports` | Geração de exports (PDF/DOCX/XLSX/CSV/BibTeX/RIS) |
| `integrations` | Clients de fontes acadêmicas e provedores externos |
| `billing` | Planos, assinaturas, créditos, webhooks Stripe/Mercado Pago |
| `notifications` | Notificações in-app/e-mail |
| `analytics` | Dashboards de uso |
| `admin` | Administração institucional |
| `audit` | Log de auditoria |
| `ai` | Orquestrador multi-modelo (`AiOrchestratorService`) |
| `common` | Infraestrutura compartilhada (Prisma, guards, filters, interceptors, health) |

## Roteamento de IA (resumo)

| Tarefa | Modelo primário | Fallback |
|---|---|---|
| `SCIENTIFIC_SHEET` | Claude Sonnet | GPT-4.1 → Gemini Pro |
| `EVIDENCE_CLASSIFICATION` | GPT-4.1 | Claude Sonnet → Gemini Flash |
| `THEORETICAL_FRAMEWORK` | Claude Opus | GPT-4.1 |
| `ASSISTANT_QA` | GPT-4.1 / Claude Sonnet | Gemini Flash |
| `METHODOLOGY_CLASSIFICATION` | GPT-4.1-mini | Gemini Flash |
| `TABLE_EXTRACTION` | Gemini Pro | GPT-4.1 → Claude Sonnet |
| `HYPOTHESIS_GENERATION` | Claude Opus | GPT-4.1 |
| `PAPER_EXPLANATION` | GPT-4.1-mini | Gemini Flash |
| `EMBEDDING` | text-embedding-3-large | Gemini text-embedding-004 |

Detalhes completos do roteamento, prevenção de alucinação e motor de evidências: ver `docs/ai-layer.md`.
