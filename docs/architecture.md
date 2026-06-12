# Arquitetura Geral — SCIENTIA AI

## Visão de Alto Nível

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 15, App Router)                              │
└───────────────────────────┬──────────────────────────────────┘
                              │ HTTPS (REST + SSE)
┌───────────────────────────▼──────────────────────────────────┐
│ NestJS API (modular monolith)                                  │
│ Guards: Clerk → Workspace → Permissions → Throttler             │
│ Interceptors: Audit, Logging, Cache                             │
│                                                                  │
│ [Identity/Tenancy] [Search] [Papers] [Reviews] [Evidence]       │
│ [Assistant] [Bibliography] [Bibliometrics] [Exports]            │
│ [Integrations] [Billing] [Notifications] [Analytics] [Admin]    │
│ [AiModule — orquestrador OpenAI/Anthropic/Gemini]               │
└───┬──────────┬──────────┬──────────┬──────────┬───────────────┘
    │          │          │          │          │
PostgreSQL  Redis      Elastic-   BullMQ     Object Storage
(Prisma,    (cache,    search     (filas)    (S3/R2)
pgvector,   throttle,  (índice
RLS)        sessions)  derivado)
```

## Multi-tenancy

`Organization → Workspace → WorkspaceMember/WorkspaceRole`. Isolamento via Row-Level Security (RLS) no Postgres, com `SET LOCAL app.current_workspace_id` definido pelo `WorkspaceContextGuard` em cada requisição.

## Autenticação & Autorização

- **Clerk** para autenticação (JWT/JWKS), sincronizado com `User` via webhook (`Svix`).
- **RBAC**: `PERMISSION_MATRIX` (OWNER/ADMIN/EDITOR/VIEWER/CUSTOM), aplicado via `@RequirePermission()` + `PermissionsGuard`. Roles `CUSTOM` só podem **restringir**, nunca expandir, as permissões do `baseCode`.

## Filas (BullMQ + Redis)

9 filas: `ingestion`, `documents`, `ai-heavy`, `exports`, `bibliometrics`, `indexing`, `alerts`, `audit`, `notifications`. Configuração padrão: `{ attempts: 3, backoff: exponential 5000ms, removeOnComplete: 1000, removeOnFail: 5000 }`.

## Observabilidade

Pino (logs estruturados + traceId via AsyncLocalStorage), OpenTelemetry (tracing), Prometheus (`@willsoto/nestjs-prometheus`), Terminus (`/health/ready` vs `/health/live`), Sentry (erros 5xx), Bull Board (`/admin/queues`).

## Plano de Implementação por Fases

| Fase | Escopo |
|---|---|
| 0 | Fundação — auth, tenancy, permissions, observabilidade básica |
| 1 | Núcleo de pesquisa — busca multi-fonte, ingestão de papers |
| 2 | IA & fichamento — orquestrador multi-modelo, RAG, fichas científicas |
| 3 | Revisões & evidências — revisão sistemática assistida, motor de evidências |
| 4 | Bibliometria, bibliografia & exportação |
| 5 | Billing completo, notificações, integrações externas |
| 6 | Admin, observabilidade avançada, hardening |
| 7 | Polimento & escala |

Ver detalhamento completo nas demais especificações de domínio (histórico de design do projeto).
