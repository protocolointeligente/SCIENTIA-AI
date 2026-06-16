/**
 * POST /api/review-ai
 *
 * Receives selected studies + review metadata.
 * Uses Gemini 1.5 Flash to:
 *   1. Extract structured info from each study (abstract-based)
 *   2. Build extraction matrix
 *   3. Generate synthesis paragraph
 *   4. Generate full review article draft
 *
 * Returns: { extractions, matrix, synthesis, draft }
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ImportedStudy,
  StudyExtraction,
  ExtractionMatrix,
  MatrixRow,
  ReviewDraft,
} from '@/lib/review/types';

export const runtime   = 'nodejs';
export const maxDuration = 60;

// ── Gemini helper ────────────────────────────────────────────
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
    signal: AbortSignal.timeout(50_000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }
  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Extract JSON block from Gemini text ─────────────────────
function extractJSON<T>(text: string): T | null {
  // Try to find ```json ... ``` or just { ... }
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  // Find first { and last }
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ── Per-study extraction prompt ──────────────────────────────
function buildExtractionPrompt(study: ImportedStudy): string {
  const hasAbstract = !!study.abstract && study.abstract.length > 50;
  return `Você é um pesquisador especialista em revisões sistemáticas.
Analise o estudo científico abaixo e extraia as informações estruturadas.

TÍTULO: ${study.title}
AUTORES: ${study.authors.join(', ')}
PERIÓDICO: ${study.journal ?? 'Não informado'} (${study.year ?? 'Ano não informado'})
DOI: ${study.doi ?? 'Não informado'}
TIPO DE ESTUDO DETECTADO: ${study.studyType}
CITAÇÕES: ${study.citations ?? 0}

${hasAbstract ? `RESUMO/ABSTRACT:\n${study.abstract}` : 'RESUMO: Não disponível'}

INSTRUÇÕES:
- Extraia informações APENAS do que está acima. NÃO invente dados.
- Se a informação não estiver disponível, use "Não informado no abstract".
- dataSource: use "abstract" se há resumo detalhado, "metadata_only" se não há.
- confidenceLevel: "high" se abstract completo e detalhado, "medium" se resumido, "low" se só metadados.

Retorne APENAS um JSON válido neste formato:
{
  "introduction": "contexto e justificativa do estudo",
  "objectives": "objetivo(s) do estudo",
  "methodology": "tipo de estudo, participantes, intervenção, comparação, desfechos",
  "results": "principais achados quantitativos e qualitativos",
  "conclusion": "conclusão dos autores",
  "sample": "tamanho amostral e características dos participantes",
  "instruments": "instrumentos, escalas, equipamentos utilizados",
  "limitations": "limitações reconhecidas",
  "evidenceLevel": "nível de evidência (I a V ou Oxford/GRADE)",
  "gaps": "lacunas identificadas / sugestões de pesquisa futura",
  "practicalApplicability": "aplicabilidade clínica ou prática",
  "studyType": "tipo do estudo confirmado",
  "confidenceLevel": "high|medium|low",
  "dataSource": "abstract|metadata_only"
}`;
}

// ── Synthesis + Article prompt ───────────────────────────────
function buildSynthesisPrompt(
  extractions: StudyExtraction[],
  question: string,
  type: string,
  framework: string,
): string {
  const studyList = extractions
    .map(
      (e, i) => `
ESTUDO ${i + 1}: ${e.title}
  Autores: ${e.authors.slice(0, 3).join(', ')}${e.authors.length > 3 ? ' et al.' : ''} (${e.year ?? '?'})
  Tipo: ${e.studyType}
  Objetivos: ${e.objectives}
  Metodologia: ${e.methodology}
  Resultados: ${e.results}
  Conclusão: ${e.conclusion}
  Amostra: ${e.sample}
  Limitações: ${e.limitations}
  Nível de evidência: ${e.evidenceLevel}
  Confiança da extração: ${e.confidenceLevel} (fonte: ${e.dataSource})`,
    )
    .join('\n');

  return `Você é um pesquisador sênior especializado em revisões sistemáticas da literatura.

PERGUNTA NORTEADORA: ${question}
TIPO DE REVISÃO: ${type}
FRAMEWORK: ${framework}
TOTAL DE ESTUDOS: ${extractions.length}

ESTUDOS INCLUÍDOS:
${studyList}

INSTRUÇÕES:
1. Baseie-se EXCLUSIVAMENTE nos estudos acima.
2. NÃO invente dados, referências ou achados não mencionados.
3. Quando a extração for de metadata_only ou confidenceLevel=low, mencione que a síntese é baseada em metadados.
4. Indique de quais estudos (Estudo N) vieram os principais achados.
5. Gere texto em português brasileiro, acadêmico, coeso.
6. O artigo deve ser um rascunho editável — marque claramente [RASCUNHO IA].

Retorne APENAS um JSON válido neste formato:
{
  "synthesis": "Parágrafo de síntese agregada dos principais achados (500-800 palavras)...",
  "draft": {
    "title": "Título do artigo de revisão",
    "abstract": "Resumo estruturado (Objetivo, Método, Resultados, Conclusão) 250 palavras",
    "introduction": "Introdução contextualizando o tema, justificativa e objetivo da revisão (400-600 palavras)",
    "method": "Método: tipo de revisão, bases consultadas, descritores, critérios de elegibilidade, framework utilizado",
    "selectionCriteria": "Critérios de inclusão e exclusão detalhados",
    "studyCharacterization": "Caracterização dos estudos incluídos: tipos, anos, periódicos, amostras",
    "results": "Resultados principais organizados por subtemas, com referência aos estudos (Estudo N)",
    "discussion": "Discussão dos achados, convergências, divergências, limitações desta revisão",
    "conclusion": "Conclusão respondendo à pergunta norteadora e implicações práticas",
    "references": "Lista de referências no formato ABNT dos estudos incluídos"
  },
  "matrix": {
    "headers": ["Autor/Ano", "Tipo de estudo", "Amostra", "Intervenção/Exposição", "Desfechos", "Principais resultados", "Nível evidência"],
    "rows": [
      {
        "studyId": "id do estudo",
        "authorYear": "Autor et al. (Ano)",
        "studyType": "tipo",
        "sample": "n= ...",
        "intervention": "...",
        "outcomes": "...",
        "evidenceLevel": "...",
        "mainResult": "..."
      }
    ]
  }
}`;
}

// ── POST handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      studies: ImportedStudy[];
      question: string;
      type: string;
      framework: string;
      title: string;
      apiKey?: string;
    };

    const { studies, question, type, framework, title, apiKey } = body;

    const key = process.env.GEMINI_API_KEY ?? apiKey ?? '';
    if (!key) {
      return NextResponse.json(
        { error: 'no_key', message: 'Configure a chave do Gemini nas Configurações → Chaves de API.' },
        { status: 200 },
      );
    }

    if (!studies?.length) {
      return NextResponse.json({ error: 'no_studies' }, { status: 400 });
    }

    // Limit to 12 studies per call to stay within token limits
    const toProcess = studies.slice(0, 12);

    // ── Step 1: Extract each study ──────────────────────────
    const extractions: StudyExtraction[] = [];

    for (const study of toProcess) {
      try {
        const prompt = buildExtractionPrompt(study);
        const text   = await callGemini(prompt, key);
        const parsed = extractJSON<Omit<StudyExtraction, 'studyId' | 'title' | 'authors' | 'journal' | 'year' | 'extractedAt'>>(text);

        if (parsed) {
          extractions.push({
            studyId:    study.id,
            title:      study.title,
            authors:    study.authors,
            journal:    study.journal,
            year:       study.year,
            extractedAt: new Date().toISOString(),
            introduction:          parsed.introduction          ?? 'Não disponível',
            objectives:            parsed.objectives            ?? 'Não disponível',
            methodology:           parsed.methodology           ?? 'Não disponível',
            results:               parsed.results               ?? 'Não disponível',
            conclusion:            parsed.conclusion            ?? 'Não disponível',
            sample:                parsed.sample                ?? 'Não informado no abstract',
            instruments:           parsed.instruments           ?? 'Não informado no abstract',
            limitations:           parsed.limitations           ?? 'Não informado no abstract',
            evidenceLevel:         parsed.evidenceLevel         ?? study.evidenceLevel,
            gaps:                  parsed.gaps                  ?? 'Não informado no abstract',
            practicalApplicability: parsed.practicalApplicability ?? 'Não informado no abstract',
            studyType:             parsed.studyType             ?? study.studyType,
            confidenceLevel:       parsed.confidenceLevel       ?? 'low',
            dataSource:            parsed.dataSource            ?? (study.abstract ? 'abstract' : 'metadata_only'),
          });
        } else {
          // Fallback extraction from metadata only
          extractions.push({
            studyId:    study.id,
            title:      study.title,
            authors:    study.authors,
            journal:    study.journal,
            year:       study.year,
            extractedAt: new Date().toISOString(),
            introduction:          'Extração automática não disponível.',
            objectives:            'Ver abstract original.',
            methodology:           study.studyType,
            results:               study.abstract ?? 'Não disponível',
            conclusion:            'Ver abstract original.',
            sample:                'Não informado',
            instruments:           'Não informado',
            limitations:           'Não informado',
            evidenceLevel:         study.evidenceLevel,
            gaps:                  'Não informado',
            practicalApplicability: 'Não informado',
            studyType:             study.studyType,
            confidenceLevel:       'low',
            dataSource:            study.abstract ? 'abstract' : 'metadata_only',
          });
        }
      } catch (err) {
        // Don't fail the whole batch — add partial extraction
        extractions.push({
          studyId:    study.id,
          title:      study.title,
          authors:    study.authors,
          journal:    study.journal,
          year:       study.year,
          extractedAt: new Date().toISOString(),
          introduction:          'Erro na extração automática.',
          objectives:            study.abstract ?? 'Não disponível',
          methodology:           study.studyType,
          results:               'Não disponível',
          conclusion:            'Não disponível',
          sample:                'Não informado',
          instruments:           'Não informado',
          limitations:           'Não informado',
          evidenceLevel:         study.evidenceLevel,
          gaps:                  'Não informado',
          practicalApplicability: 'Não informado',
          studyType:             study.studyType,
          confidenceLevel:       'low',
          dataSource:            'metadata_only',
        });
        console.error('Extraction error for', study.id, err);
      }
    }

    // ── Step 2: Synthesis + Article + Matrix ────────────────
    let synthesis = 'Síntese não disponível.';
    let draft: ReviewDraft | undefined;
    let matrix: ExtractionMatrix | undefined;

    try {
      const synthPrompt = buildSynthesisPrompt(extractions, question, type, framework);
      const synthText   = await callGemini(synthPrompt, key);
      const synthParsed = extractJSON<{
        synthesis: string;
        draft: Omit<ReviewDraft, 'generatedAt' | 'studyCount' | 'confidenceNote'>;
        matrix: { headers: string[]; rows: MatrixRow[] };
      }>(synthText);

      if (synthParsed) {
        synthesis = synthParsed.synthesis;

        draft = {
          ...synthParsed.draft,
          generatedAt: new Date().toISOString(),
          studyCount:  extractions.length,
          confidenceNote: `Este rascunho foi gerado automaticamente por IA com base em ${extractions.length} estudo(s). ` +
            `${extractions.filter((e) => e.dataSource === 'abstract').length} estudos com abstract disponível; ` +
            `${extractions.filter((e) => e.confidenceLevel === 'low').length} com baixa confiança (apenas metadados). ` +
            `Revise criticamente antes de usar.`,
        };

        // Build matrix
        const matrixRows: MatrixRow[] = (synthParsed.matrix?.rows ?? []).map((r, i) => {
          const ex = extractions[i];
          return {
            studyId:       r.studyId ?? ex?.studyId ?? String(i),
            authorYear:    r.authorYear ?? `${ex?.authors[0] ?? 'Autor'} (${ex?.year ?? '?'})`,
            studyType:     r.studyType ?? ex?.studyType ?? '?',
            sample:        r.sample ?? ex?.sample ?? '?',
            intervention:  r.intervention ?? '?',
            outcomes:      r.outcomes ?? '?',
            evidenceLevel: r.evidenceLevel ?? ex?.evidenceLevel ?? '?',
            mainResult:    r.mainResult ?? ex?.results?.slice(0, 120) ?? '?',
          };
        });

        // Fill missing rows from extractions
        if (matrixRows.length < extractions.length) {
          extractions.forEach((ex, i) => {
            if (!matrixRows.find((r) => r.studyId === ex.studyId)) {
              matrixRows.push({
                studyId:       ex.studyId,
                authorYear:    `${ex.authors[0] ?? 'Autor'} et al. (${ex.year ?? '?'})`,
                studyType:     ex.studyType,
                sample:        ex.sample,
                intervention:  ex.methodology.slice(0, 80),
                outcomes:      ex.results.slice(0, 80),
                evidenceLevel: ex.evidenceLevel,
                mainResult:    ex.conclusion.slice(0, 120),
              });
            }
          });
        }

        matrix = {
          headers: synthParsed.matrix?.headers ?? [
            'Autor/Ano', 'Tipo', 'Amostra', 'Intervenção', 'Desfechos', 'Resultado Principal', 'Evidência',
          ],
          rows: matrixRows,
        };
      }
    } catch (err) {
      console.error('Synthesis error:', err);
      synthesis = 'Erro ao gerar síntese. Verifique a chave de API e tente novamente.';
    }

    // Build fallback draft if synthesis failed
    if (!draft) {
      draft = {
        title,
        abstract: `Revisão sobre: ${question}. Baseada em ${extractions.length} estudos.`,
        introduction: `Esta ${type} tem como objetivo responder à seguinte pergunta: ${question}.`,
        method: `Tipo: ${type}. Framework: ${framework}. Estudos analisados: ${extractions.length}.`,
        selectionCriteria: 'Critérios de inclusão: estudos identificados na busca. Critérios de exclusão: não aplicável nesta versão.',
        studyCharacterization: `Total de ${extractions.length} estudo(s) incluídos.`,
        results: extractions.map((e) => `• ${e.title}: ${e.results}`).join('\n\n'),
        discussion: 'Discussão pendente de elaboração manual.',
        conclusion: `Com base nos ${extractions.length} estudos analisados, não foi possível gerar conclusão automatizada nesta versão.`,
        references: extractions
          .map((e) => `${e.authors.join('; ')} (${e.year}). ${e.title}. ${e.journal ?? ''}. ${e.studyId}`)
          .join('\n'),
        generatedAt: new Date().toISOString(),
        studyCount: extractions.length,
        confidenceNote: 'Rascunho parcial — síntese automática não disponível. Elabore manualmente.',
      };
    }

    // Build fallback matrix if missing
    if (!matrix) {
      matrix = {
        headers: ['Autor/Ano', 'Tipo', 'Amostra', 'Metodologia', 'Resultado', 'Evidência'],
        rows: extractions.map((e) => ({
          studyId:       e.studyId,
          authorYear:    `${e.authors[0] ?? '?'} (${e.year ?? '?'})`,
          studyType:     e.studyType,
          sample:        e.sample,
          intervention:  e.methodology.slice(0, 100),
          outcomes:      e.results.slice(0, 100),
          evidenceLevel: e.evidenceLevel,
          mainResult:    e.conclusion.slice(0, 100),
        })),
      };
    }

    return NextResponse.json({
      extractions,
      matrix,
      synthesis,
      draft,
      processedAt: new Date().toISOString(),
      studyCount: extractions.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
