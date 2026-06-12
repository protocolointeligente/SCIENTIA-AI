# Camada de IA — Orquestração, RAG, Evidências, Bibliometria e Grafo

## 1. Orquestração de IA

`AiOrchestratorService` centraliza chamadas a modelos via `MODEL_REGISTRY` (catálogo de modelos disponíveis por provedor) e `ROUTING_TABLE` (mapeamento tarefa → modelo primário + cadeia de fallback). Toda execução gera:

- `ModelRun` — registro de execução (modelo usado, tokens, custo, latência, status)
- `PromptLog` — prompt completo enviado (para auditoria/reprodutibilidade)
- `ModelRunAudit` — avaliação pós-hoc de fidelidade (FAITHFUL/UNFAITHFUL/PARTIAL)

## 2. RAG Científico

- **Chunking estrutural-semântico**: `PaperChunk` segmentado por seção (ABSTRACT, INTRODUCTION, METHODS, RESULTS, DISCUSSION, CONCLUSION, TABLE, FIGURE, OTHER)
- **Recuperação híbrida**: pgvector (similaridade semântica) + Elasticsearch BM25 (léxico) combinados via Reciprocal Rank Fusion, seguido de reranking
- **Grounding**: respostas geradas referenciam trechos via marcadores `[Sn]`, persistidos como `GroundingRef` ligando `Message`/`ScientificSheet` a `PaperChunk`

## 3. Prevenção de Alucinação

- Padrão `FieldResult<T>` com 3 estados: `ANSWERED`, `INSUFFICIENT_EVIDENCE`, `CONFLICTING_EVIDENCE`
- `confidenceScore` calculado a partir de sinais objetivos (cobertura de chunks recuperados, concordância entre fontes, qualidade do estudo)
- Auditoria de fidelidade via `ModelRunAudit`, comparando saída gerada contra os trechos de origem

## 4. Motor de Evidências

`EvidenceQuestion` → `EvidenceAnswer` agregando `StudyEvidenceAssessment` por estudo. `evidenceStrength` (STRONG/MODERATE/WEAK) computado a partir de:
- Tipo de desenho de estudo (RCT > coorte > caso-controle > observacional)
- Tamanho amostral
- Risco de viés

Exemplo de fluxo: pergunta "Treinamento de força reduz gordura abdominal em mulheres?" → busca de estudos relevantes → avaliação individual por estudo → síntese com `FieldResult<EvidenceAnswer>` e grounding.

## 5. Fichamento Científico

`ScientificSheet` gerada via `AiOrchestratorService` (tarefa `SCIENTIFIC_SHEET`), com seções estruturadas (objetivo, metodologia, resultados, limitações, relevância), cada campo como `FieldResult<T>` com grounding.

## 6. Revisão Sistemática Assistida

`SystematicReview` → `ReviewStage` (triagem, elegibilidade, inclusão) → `ReviewItem` + `ReviewItemDecision`, com `PrismaFlow` para diagrama PRISMA automático.

## 7. Bibliometria

- Índices: H-index, G-index, M-index (`AuthorMetrics`)
- Redes: coautoria (`CoauthorshipEdge`), cocitação (`CocitationEdge`), acoplamento bibliográfico (`BibliographicCouplingEdge`) — construídas com `graphology`
- Centralidade: degree, betweenness, eigenvector, PageRank
- Clusterização: HDBSCAN + UMAP, rotulagem via c-TF-IDF

## 8. Grafo de Conhecimento

`KnowledgeGraphNode` (tipos: PAPER, AUTHOR, CONCEPT, INSTITUTION, JOURNAL) e `KnowledgeGraphEdge` (CITES, AUTHORED_BY, HAS_CONCEPT, AFFILIATED_WITH, PUBLISHED_IN, SIMILAR_TO). Layout via ForceAtlas2, com expansão de ego-network e agregação em super-nós para grafos densos.

## 9. Mapeamento 3D

`Map3DProjection` armazena projeções UMAP 3D dos embeddings de papers, com modos de eixo: Semântico, Temporal, Impacto, Confiança. Renderizado no frontend via react-three-fiber + drei (InstancedMesh para performance com milhares de pontos).

## 10. Avaliação e Qualidade

Cada saída de IA é auditável: `PromptLog` (entrada) + `ModelRun` (execução) + `ModelRunAudit` (avaliação de fidelidade) + `GroundingRef` (evidência de origem). Isso permite reprocessamento, comparação entre modelos e detecção de regressões de qualidade.

Detalhamento completo (incluindo pseudocódigo e exemplos): ver histórico de design (deep-dive de IA/Evidências/Bibliometria/Grafo, partes 1-4).
