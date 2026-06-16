/**
 * POST /api/review-ai
 *
 * Processes selected studies with Gemini 1.5 Flash:
 *   1. Per-study extraction (works with OR without abstract — infers from title/metadata)
 *   2. Extraction matrix
 *   3. Synthesis paragraph
 *   4. Full review article draft
 *   5. References in chosen format (ABNT | APA | Vancouver)
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ImportedStudy,
  StudyExtraction,
  ExtractionMatrix,
  MatrixRow,
  ReviewDraft,
} from '@/lib/review/types';

export const runtime     = 'nodejs';
export const maxDuration = 120; // 2 min — enough for batch + synthesis

// ── Gemini helper ────────────────────────────────────────────
async function callGemini(
  prompt: string,
  apiKey: string,
  maxTokens = 4096,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(90_000),
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

// ── Robust JSON extractor ────────────────────────────────────
function extractJSON<T>(text: string): T | null {
  // 1. Try fenced ```json block
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = fenced?.[1] ?? text;
  // 2. Find outermost { }
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  raw = raw.slice(start, end + 1);
  // 3. Fix common Gemini JSON issues
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try fixing trailing commas
    try {
      return JSON.parse(raw.replace(/,\s*([\]}])/g, '$1')) as T;
    } catch {
      return null;
    }
  }
}

// ── BATCH extraction prompt (all studies in ONE call) ────────
function buildBatchExtractionPrompt(studies: ImportedStudy[]): string {
  const list = studies.map((s, i) => {
    const hasAbstract = !!s.abstract && s.abstract.trim().length > 40;
    return `--- ESTUDO ${i + 1} ---
Título: ${s.title}
Autores: ${s.authors.slice(0, 5).join('; ')}
Periódico: ${s.journal ?? 'Não informado'}
Ano: ${s.year ?? 'Não informado'}
DOI: ${s.doi ?? 'N/A'}
Tipo de estudo detectado: ${s.studyType}
Nível de evidência: ${s.evidenceLevel}
Citações: ${s.citations ?? 0}
${hasAbstract ? `\nAbstract:\n${s.abstract}` : '\n[Sem abstract disponível — inferir a partir do título, periódico e tipo de estudo]'}`;
  }).join('\n\n');

  return `Você é um especialista em revisões sistemáticas. Analise os estudos abaixo e extraia informações estruturadas de cada um.

REGRAS IMPORTANTES:
- Quando há abstract disponível: extraia diretamente do texto.
- Quando NÃO há abstract: baseie-se no título, periódico, ano, tipo de estudo e conhecimento científico geral do tema — escreva inferências plausíveis e coerentes com a área, marcando confidenceLevel como "low" e dataSource como "metadata_only".
- NUNCA deixe campos em branco ou com "Não disponível". Sempre escreva algo útil.
- Escreva em português brasileiro.
- Seja específico e técnico — não genérico.

${list}

Retorne um JSON com exatamente esta estrutura (array com ${studies.length} elementos):
{
  "extractions": [
    {
      "introduction": "Contexto e justificativa do estudo (2-3 frases específicas)",
      "objectives": "Objetivo principal do estudo (1-2 frases objetivas)",
      "methodology": "Desenho do estudo, população, intervenção/exposição, desfechos principais",
      "results": "Principais achados quantitativos e qualitativos encontrados",
      "conclusion": "Conclusão dos autores sobre o que o estudo demonstrou",
      "sample": "Tamanho amostral (n=?) e características dos participantes",
      "instruments": "Instrumentos, escalas, equipamentos, testes utilizados",
      "limitations": "Limitações apontadas no estudo",
      "evidenceLevel": "Nível de evidência (ex: Nível I — Meta-análise)",
      "gaps": "Lacunas identificadas e sugestões de pesquisa futura",
      "practicalApplicability": "Aplicabilidade clínica ou prática dos resultados",
      "studyType": "Tipo confirmado do estudo",
      "confidenceLevel": "high|medium|low",
      "dataSource": "abstract|metadata_only"
    }
  ]
}`;
}

// ── Synthesis + Full Article prompt ─────────────────────────
function buildSynthesisPrompt(
  extractions: StudyExtraction[],
  question: string,
  type: string,
  framework: string,
  title: string,
  referenceFormat: string,
): string {
  const studyList = extractions.map((e, i) =>
    `ESTUDO ${i + 1}: ${e.title}
  Autores: ${e.authors.slice(0, 3).join(', ')}${e.authors.length > 3 ? ' et al.' : ''} (${e.year ?? '?'})
  Periódico: ${e.journal ?? 'N/A'}
  Tipo: ${e.studyType} | Evidência: ${e.evidenceLevel} | Confiança extração: ${e.confidenceLevel}
  Objetivos: ${e.objectives}
  Metodologia: ${e.methodology}
  Resultados: ${e.results}
  Conclusão: ${e.conclusion}
  Amostra: ${e.sample}
  Limitações: ${e.limitations}
  Lacunas: ${e.gaps}
  Aplicabilidade: ${e.practicalApplicability}`
  ).join('\n\n');

  const refFormatInstructions: Record<string, string> = {
    ABNT: 'ABNT NBR 6023:2018. Exemplo: SOBRENOME, Nome. Título em negrito. Periódico, Cidade, v. X, n. Y, p. Z-Z, Ano.',
    APA:  'APA 7ª edição. Exemplo: Sobrenome, N. A., & Sobrenome, N. B. (Ano). Título do artigo. Nome do Periódico, volume(número), páginas. https://doi.org/xxxxx',
    Vancouver: 'Vancouver. Exemplo: Sobrenome N, Sobrenome N. Título do artigo. Abrev Periódico. Ano;volume(número):páginas.',
  };

  return `Você é um pesquisador sênior especialista em revisões sistemáticas. Com base nos estudos abaixo, produza uma revisão acadêmica completa e de alta qualidade.

DADOS DA REVISÃO:
- Título: ${title}
- Pergunta norteadora (${framework}): ${question}
- Tipo de revisão: ${type}
- Total de estudos: ${extractions.length}

ESTUDOS INCLUÍDOS:
${studyList}

INSTRUÇÕES GERAIS:
1. Baseie-se nos estudos acima — cite cada um como (Estudo N) no texto.
2. Escreva em português brasileiro, linguagem acadêmica formal.
3. Seja EXTENSO e detalhado — mínimo 300 palavras por seção principal.
4. Organize resultados por subtemas/convergências entre os estudos.
5. Aponte divergências e limitações desta revisão.
6. As referências devem usar formato: ${referenceFormat}
   Instrução de formato: ${refFormatInstructions[referenceFormat] ?? refFormatInstructions['ABNT']}

Retorne SOMENTE um JSON válido com esta estrutura:
{
  "synthesis": "Parágrafo de síntese narrativa agregada com 600-1000 palavras, organizando os achados dos estudos por subtemas, apontando convergências, divergências e implicações. Cite (Estudo N) ao referir resultados específicos.",
  "draft": {
    "title": "Título completo e descritivo do artigo de revisão",
    "abstract": "Resumo estruturado com: Objetivo, Método, Resultados, Conclusão. Mínimo 200 palavras. Inclua n de estudos incluídos.",
    "introduction": "Introdução com: (1) contextualização do tema com dados epidemiológicos/prevalência, (2) justificativa da revisão, (3) pergunta norteadora explicitada, (4) objetivo geral. Mínimo 400 palavras.",
    "method": "Seção de método com: tipo de revisão, bases de dados consultadas (declarar que foi utilizado o SCIENTIA AI para busca estruturada), descritores utilizados, período de busca, framework aplicado (${framework}). Mínimo 200 palavras.",
    "selectionCriteria": "Critérios de inclusão e exclusão detalhados: idioma, período, tipo de estudo, população, intervenção, desfechos, formato de publicação.",
    "studyCharacterization": "Caracterização dos ${extractions.length} estudos incluídos: distribuição por tipo de estudo, anos de publicação, periódicos, tamanho amostral total estimado, países, nível de evidência predominante. Use dados reais dos estudos acima.",
    "results": "Resultados organizados em subtemas temáticos (3-4 subtemas). Em cada subtema, sintetize os achados relevantes dos estudos, cite (Estudo N), apresente dados quantitativos quando disponíveis. Mínimo 500 palavras.",
    "discussion": "Discussão com: (1) interpretação dos achados em relação à pergunta norteadora, (2) convergências entre estudos, (3) divergências e possíveis explicações, (4) comparação com literatura prévia (inferida do contexto), (5) implicações práticas e clínicas, (6) limitações desta revisão (ausência de PDF completo, possível viés de seleção, etc.). Mínimo 400 palavras.",
    "conclusion": "Conclusão respondendo diretamente à pergunta '${question}'. Síntese dos principais achados, força da evidência, recomendações práticas e sugestões de pesquisa futura. Mínimo 150 palavras.",
    "references": "Lista completa de referências no formato ${referenceFormat} de todos os ${extractions.length} estudos incluídos. Uma referência por linha."
  },
  "matrix": {
    "headers": ["Autor/Ano", "Tipo de estudo", "Amostra (n)", "Intervenção/Exposição", "Desfechos avaliados", "Principais resultados", "Nível evidência"],
    "rows": [
      {
        "studyId": "id do estudo",
        "authorYear": "Primeiro Autor et al. (Ano)",
        "studyType": "tipo do estudo",
        "sample": "n= número ou descrição",
        "intervention": "intervenção ou exposição principal",
        "outcomes": "desfechos avaliados",
        "evidenceLevel": "Nível X",
        "mainResult": "resultado principal em 1-2 frases"
      }
    ]
  }
}`;
}

// ── Reference format for a single study ─────────────────────
function formatRef(e: StudyExtraction, fmt: string): string {
  const authors = e.authors.length > 0 ? e.authors : ['Autor desconhecido'];
  const year    = e.year ?? 's.d.';
  const title   = e.title;
  const journal = e.journal ?? 'Periódico não informado';

  if (fmt === 'APA') {
    const apa = authors.length > 1
      ? authors.slice(0, 6).join(', ') + (authors.length > 6 ? ', . . .' : '')
      : authors[0];
    return `${apa} (${year}). ${title}. ${journal}.${e.studyId ? ` https://doi.org/${e.studyId}` : ''}`;
  }

  if (fmt === 'Vancouver') {
    const initials = authors.slice(0, 6).map((a) => {
      const parts = a.split(' ');
      return parts[parts.length - 1] + ' ' + parts.slice(0, -1).map((p) => p[0]).join('');
    }).join(', ');
    return `${initials}. ${title}. ${journal}. ${year}.`;
  }

  // ABNT default
  const abnt = authors.slice(0, 3).map((a) => {
    const parts = a.trim().split(' ');
    const last  = parts.pop() ?? '';
    return `${last.toUpperCase()}, ${parts.join(' ')}`;
  }).join('; ') + (authors.length > 3 ? ' et al.' : '');
  return `${abnt}. **${title}**. ${journal}, ${year}.`;
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
      referenceFormat?: string;
    };

    const {
      studies,
      question,
      type,
      framework,
      title,
      apiKey,
      referenceFormat = 'ABNT',
    } = body;

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

    const toProcess = studies.slice(0, 12);

    // ── Step 1: Batch extraction (all studies in one call) ──
    let extractions: StudyExtraction[] = [];

    try {
      const batchPrompt = buildBatchExtractionPrompt(toProcess);
      const batchText   = await callGemini(batchPrompt, key, 4096);
      const batchParsed = extractJSON<{ extractions: Partial<StudyExtraction>[] }>(batchText);

      if (batchParsed?.extractions?.length) {
        extractions = toProcess.map((study, i) => {
          const parsed = batchParsed.extractions[i] ?? {};
          return {
            studyId:    study.id,
            title:      study.title,
            authors:    study.authors,
            journal:    study.journal,
            year:       study.year,
            extractedAt: new Date().toISOString(),
            introduction:           parsed.introduction           || `Estudo sobre ${study.title}, publicado em ${study.journal ?? 'periódico científico'} em ${study.year ?? 'ano não informado'}.`,
            objectives:             parsed.objectives             || `Investigar aspectos relacionados ao tema: ${study.title}.`,
            methodology:            parsed.methodology            || `${study.studyType}. Detalhes metodológicos não disponíveis sem acesso ao texto completo.`,
            results:                parsed.results                || `Resultados não extraíveis sem abstract. Tipo de estudo: ${study.studyType}. ${study.citations ? `Estudo com ${study.citations} citações, indicando relevância na área.` : ''}`,
            conclusion:             parsed.conclusion             || `Consultar texto completo para conclusões detalhadas. Nível de evidência: ${study.evidenceLevel}.`,
            sample:                 parsed.sample                 || 'Não informado no abstract',
            instruments:            parsed.instruments            || 'Não informado no abstract',
            limitations:            parsed.limitations            || 'Não relatadas no abstract disponível',
            evidenceLevel:          parsed.evidenceLevel          || study.evidenceLevel,
            gaps:                   parsed.gaps                   || 'Lacunas não identificáveis sem acesso ao texto completo',
            practicalApplicability: parsed.practicalApplicability || 'A ser avaliada com acesso ao texto completo',
            studyType:              parsed.studyType              || study.studyType,
            confidenceLevel:        (parsed.confidenceLevel as 'high' | 'medium' | 'low') || (study.abstract ? 'medium' : 'low'),
            dataSource:             (parsed.dataSource as 'full_text' | 'abstract' | 'metadata_only') || (study.abstract ? 'abstract' : 'metadata_only'),
          };
        });
      }
    } catch (batchErr) {
      console.error('Batch extraction error:', batchErr);
      // Fall back to per-study individual calls
      for (const study of toProcess) {
        extractions.push({
          studyId:    study.id,
          title:      study.title,
          authors:    study.authors,
          journal:    study.journal,
          year:       study.year,
          extractedAt: new Date().toISOString(),
          introduction:           `Estudo sobre o tema "${study.title}", publicado em ${study.journal ?? 'periódico científico'} em ${study.year}.`,
          objectives:             `Investigar ${study.title.toLowerCase()}.`,
          methodology:            `${study.studyType}. Análise baseada em metadados — sem abstract disponível.`,
          results:                study.abstract ?? `Resultados não disponíveis sem abstract. Estudo com ${study.citations ?? 0} citações.`,
          conclusion:             `Ver texto completo. Nível de evidência: ${study.evidenceLevel}.`,
          sample:                 'Não informado',
          instruments:            'Não informado',
          limitations:            'Não informado sem abstract',
          evidenceLevel:          study.evidenceLevel,
          gaps:                   'A ser identificado com acesso ao texto',
          practicalApplicability: 'A ser avaliada com acesso ao texto',
          studyType:              study.studyType,
          confidenceLevel:        study.abstract ? 'medium' : 'low',
          dataSource:             study.abstract ? 'abstract' : 'metadata_only',
        });
      }
    }

    // Ensure we always have all studies covered
    if (extractions.length < toProcess.length) {
      toProcess.forEach((study) => {
        if (!extractions.find((e) => e.studyId === study.id)) {
          extractions.push({
            studyId:    study.id,
            title:      study.title,
            authors:    study.authors,
            journal:    study.journal,
            year:       study.year,
            extractedAt: new Date().toISOString(),
            introduction:           `Estudo: ${study.title}. Periódico: ${study.journal}.`,
            objectives:             `Investigar ${study.title}.`,
            methodology:            `${study.studyType}.`,
            results:                study.abstract ?? 'Sem abstract disponível.',
            conclusion:             `Nível de evidência: ${study.evidenceLevel}.`,
            sample:                 'Não informado',
            instruments:            'Não informado',
            limitations:            'Não informado',
            evidenceLevel:          study.evidenceLevel,
            gaps:                   'Não informado',
            practicalApplicability: 'Não informado',
            studyType:              study.studyType,
            confidenceLevel:        'low',
            dataSource:             study.abstract ? 'abstract' : 'metadata_only',
          });
        }
      });
    }

    // ── Step 2: Synthesis + Article + Matrix ────────────────
    let synthesis = '';
    let draft: ReviewDraft | undefined;
    let matrix:  ExtractionMatrix | undefined;

    try {
      const synthPrompt = buildSynthesisPrompt(extractions, question, type, framework, title, referenceFormat);
      const synthText   = await callGemini(synthPrompt, key, 8192);
      const synthParsed = extractJSON<{
        synthesis: string;
        draft: Omit<ReviewDraft, 'generatedAt' | 'studyCount' | 'confidenceNote'>;
        matrix: { headers: string[]; rows: MatrixRow[] };
      }>(synthText);

      if (synthParsed) {
        synthesis = synthParsed.synthesis ?? '';

        const lowConfCount = extractions.filter((e) => e.confidenceLevel === 'low').length;
        const highConfCount = extractions.filter((e) => e.confidenceLevel === 'high').length;

        draft = {
          ...synthParsed.draft,
          generatedAt: new Date().toISOString(),
          studyCount:  extractions.length,
          confidenceNote:
            lowConfCount > 0
              ? `Atenção: ${lowConfCount} de ${extractions.length} estudo(s) foram processados apenas com metadados (sem abstract), o que pode limitar a profundidade da extração. ${highConfCount} estudo(s) com alta confiança. Revise criticamente antes de publicar.`
              : `Rascunho gerado com base em ${extractions.length} estudo(s). Revise e complemente antes de publicar.`,
        };

        // Build matrix with fallback per-row
        const matrixRows: MatrixRow[] = (synthParsed.matrix?.rows ?? []).map((r, i) => {
          const ex = extractions[i];
          return {
            studyId:       r.studyId       || ex?.studyId      || String(i),
            authorYear:    r.authorYear    || `${ex?.authors?.[0] ?? 'Autor'} (${ex?.year ?? '?'})`,
            studyType:     r.studyType     || ex?.studyType    || '?',
            sample:        r.sample        || ex?.sample       || 'N/A',
            intervention:  r.intervention  || ex?.methodology?.slice(0, 100) || '?',
            outcomes:      r.outcomes      || ex?.results?.slice(0, 100)     || '?',
            evidenceLevel: r.evidenceLevel || ex?.evidenceLevel || '?',
            mainResult:    r.mainResult    || ex?.conclusion?.slice(0, 150)  || '?',
          };
        });

        // Ensure all extractions are in the matrix
        extractions.forEach((ex) => {
          if (!matrixRows.find((r) => r.studyId === ex.studyId)) {
            matrixRows.push({
              studyId:       ex.studyId,
              authorYear:    `${ex.authors[0] ?? 'Autor'} et al. (${ex.year ?? '?'})`,
              studyType:     ex.studyType,
              sample:        ex.sample,
              intervention:  ex.methodology.slice(0, 100),
              outcomes:      ex.results.slice(0, 100),
              evidenceLevel: ex.evidenceLevel,
              mainResult:    ex.conclusion.slice(0, 150),
            });
          }
        });

        matrix = {
          headers: synthParsed.matrix?.headers ?? [
            'Autor/Ano', 'Tipo', 'Amostra', 'Intervenção', 'Desfechos', 'Resultado Principal', 'Evidência',
          ],
          rows: matrixRows,
        };
      }
    } catch (synthErr) {
      console.error('Synthesis error:', synthErr);
    }

    // ── Fallback draft (if synthesis failed/timed out) ───────
    if (!draft) {
      const refList = extractions.map((e) => formatRef(e, referenceFormat)).join('\n');
      draft = {
        title,
        abstract: `${type} sobre: ${question}. Baseada em ${extractions.length} estudo(s) selecionados por busca estruturada.`,
        introduction: `Esta ${type} tem como objetivo responder à seguinte pergunta norteadora (${framework}): ${question}. O tema abordado possui relevância científica e prática, sendo fundamental a síntese das evidências disponíveis para orientar tomadas de decisão baseadas em evidências.`,
        method: `Tipo de revisão: ${type}. Framework utilizado: ${framework}. Os estudos foram identificados por meio de busca estruturada na plataforma SCIENTIA AI, que integra as bases OpenAlex e Semantic Scholar. Total de ${extractions.length} estudos incluídos após triagem inicial.`,
        selectionCriteria: `Critérios de inclusão: estudos publicados em periódicos científicos identificados por busca temática estruturada, relevantes para a pergunta norteadora. Critérios de exclusão: estudos duplicados, sem relação direta com o tema.`,
        studyCharacterization: `Foram incluídos ${extractions.length} estudo(s). ${extractions.filter((e) => e.studyType === 'Meta-analysis' || e.studyType === 'Systematic Review').length} revisões/meta-análises, ${extractions.filter((e) => e.studyType === 'RCT').length} ensaios clínicos randomizados e ${extractions.filter((e) => !['Meta-analysis','Systematic Review','RCT'].includes(e.studyType)).length} outros delineamentos.`,
        results: extractions.map((e, i) =>
          `**${i + 1}. ${e.title}** (${e.authors[0] ?? ''} et al., ${e.year ?? 's.d.'})\n${e.results}\n*Conclusão: ${e.conclusion}*`
        ).join('\n\n'),
        discussion: `Os ${extractions.length} estudos analisados abordam diferentes aspectos relacionados à pergunta norteadora. Faz-se necessária análise crítica comparativa e complementação manual desta seção com base na leitura integral dos textos.`,
        conclusion: `Com base nos ${extractions.length} estudos analisados, foram identificadas evidências relevantes sobre o tema. Esta revisão contribui para a síntese do conhecimento disponível, porém recomenda-se complementação com leitura integral dos textos incluídos.`,
        references: refList,
        generatedAt: new Date().toISOString(),
        studyCount: extractions.length,
        confidenceNote: 'Rascunho parcial — a síntese automática detalhada não foi gerada. Seccões marcadas para elaboração manual.',
      };
    }

    // ── Fallback matrix ──────────────────────────────────────
    if (!matrix) {
      matrix = {
        headers: ['Autor/Ano', 'Tipo', 'Amostra', 'Metodologia', 'Resultado Principal', 'Evidência'],
        rows: extractions.map((e) => ({
          studyId:       e.studyId,
          authorYear:    `${e.authors[0] ?? '?'} (${e.year ?? '?'})`,
          studyType:     e.studyType,
          sample:        e.sample,
          intervention:  e.methodology.slice(0, 100),
          outcomes:      e.results.slice(0, 100),
          evidenceLevel: e.evidenceLevel,
          mainResult:    e.conclusion.slice(0, 150),
        })),
      };
    }

    // ── Ensure draft references use correct format ────────────
    if (draft && (!draft.references || draft.references.includes('Não informado'))) {
      draft.references = extractions.map((e) => formatRef(e, referenceFormat)).join('\n');
    }

    return NextResponse.json({
      extractions,
      matrix,
      synthesis,
      draft,
      processedAt: new Date().toISOString(),
      studyCount:  extractions.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    console.error('review-ai POST error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
