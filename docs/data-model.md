# Modelo de Dados — Prisma Schema

Schema completo em [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma) — ~55 entidades, 34 enums, PostgreSQL + extensões `pgvector` e `pg_trgm`.

## Domínios

| Domínio | Entidades principais |
|---|---|
| **Identidade & Tenancy** | `User`, `Organization`, `Workspace`, `WorkspaceMember`, `WorkspaceRole`, `Invitation` |
| **Catálogo de Papers** | `Paper`, `Author`, `PaperAuthor`, `Institution`, `Journal`, `PaperChunk`, `PaperFile`, `Concept`, `PaperConcept` |
| **Busca & Ingestão** | `SearchQuery`, `IngestionJob`, `ExternalSourceRecord` |
| **Fichamento & IA** | `ScientificSheet`, `ModelRun`, `PromptLog`, `ModelRunAudit`, `GroundingRef` |
| **Assistente / RAG** | `Conversation`, `Message`, `MessageCitation` |
| **Motor de Evidências** | `EvidenceQuestion`, `EvidenceAnswer`, `StudyEvidenceAssessment` |
| **Revisão Sistemática** | `SystematicReview`, `ReviewStage`, `ReviewItem`, `ReviewItemDecision`, `PrismaFlow` |
| **Bibliografia** | `Collection`, `CollectionItem`, `Note`, `Highlight`, `Tag`, `PaperTag` |
| **Bibliometria & Grafo** | `AuthorMetrics`, `CoauthorshipEdge`, `CocitationEdge`, `BibliographicCouplingEdge`, `KnowledgeGraphNode`, `KnowledgeGraphEdge`, `ClusterAssignment`, `Map3DProjection` |
| **Exportação** | `ExportJob`, `ExportTemplate` |
| **Billing & Créditos** | `Plan`, `Subscription`, `Payment`, `CreditWallet`, `CreditTransaction`, `Invoice` |
| **Notificações** | `Notification`, `NotificationPreference` |
| **Analytics** | `UsageEvent`, `UsageSummary` |
| **Admin & Auditoria** | `AuditLog`, `SystemAlert` |

## Convenções

- Todas as entidades multi-tenant possuem `workspaceId` com índice e RLS (`FORCE ROW LEVEL SECURITY`, policy `USING (workspace_id = current_setting('app.current_workspace_id')::uuid)`).
- Campos de IA seguem o padrão de proveniência: toda saída gerada referencia um `ModelRun` (`modelRunId`), que por sua vez referencia um `PromptLog`.
- `PaperChunk.embedding` usa `vector(1536)` com índice HNSW (`m=16, ef_construction=64`).
- Idempotência: `Payment.providerEventId @unique`, `CreditTransaction.idempotencyKey @unique`.

## Ordem de Migração (alto nível)

1. Identidade & Tenancy (User, Organization, Workspace, roles)
2. Catálogo (Author, Institution, Journal, Paper, Concept + relações)
3. Ingestão & busca
4. IA (ModelRun, PromptLog) + Fichamento + RAG (PaperChunk com pgvector)
5. Assistente/Conversas
6. Evidências + Revisão Sistemática
7. Bibliografia (Collection/Note/Tag)
8. Bibliometria & Grafo de Conhecimento
9. Exportação
10. Billing/Créditos, Notificações, Analytics, Auditoria

Detalhamento completo de cada entidade, campos e relações: ver histórico de design (deep-dive de banco de dados, partes 1-3).
