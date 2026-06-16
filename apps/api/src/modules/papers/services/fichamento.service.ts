import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateFichamentoDto, FichamentoLanguage } from '../dto/create-fichamento.dto';

export interface FichamentoResult {
  paperId: string;
  paperTitle: string;
  language: string;
  sections: {
    objetivo: string;
    metodologia: string;
    resultados: string;
    conclusoes: string;
    limitacoes: string;
    relevancia: string;
    citacaoAbnt: string;
  };
  evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' | 'CONFLICTING';
  keywords: string[];
  generatedAt: string;
  modelUsed: string;
}

const SYSTEM_PROMPT_PT = `Você é um assistente especializado em análise de artigos científicos.
Dado o título e resumo de um artigo, gere um fichamento científico estruturado e rigoroso em JSON.
Seja preciso, objetivo e baseie-se apenas nas informações fornecidas. Não invente dados.`;

const SYSTEM_PROMPT_EN = `You are an assistant specialized in analyzing scientific papers.
Given a paper's title and abstract, generate a structured scientific summary in JSON.
Be precise, objective, and base your analysis only on the provided information. Do not invent data.`;

function buildUserPrompt(
  title: string,
  abstract: string | null,
  language: FichamentoLanguage,
  authors: string,
  year: number | null,
  venue: string | null,
): string {
  const isPortuguese = language === FichamentoLanguage.PT;
  const noAbstract = isPortuguese ? 'Resumo não disponível.' : 'Abstract not available.';

  return `${isPortuguese ? 'Título' : 'Title'}: ${title}
${isPortuguese ? 'Autores' : 'Authors'}: ${authors || 'N/D'}
${isPortuguese ? 'Ano' : 'Year'}: ${year ?? 'N/D'}
${isPortuguese ? 'Periódico' : 'Journal'}: ${venue ?? 'N/D'}
${isPortuguese ? 'Resumo' : 'Abstract'}: ${abstract ?? noAbstract}

${isPortuguese
    ? `Gere um fichamento científico em JSON com a seguinte estrutura exata:
{
  "objetivo": "objetivo principal da pesquisa em 2-3 frases",
  "metodologia": "abordagem metodológica utilizada",
  "resultados": "principais resultados encontrados",
  "conclusoes": "conclusões dos autores",
  "limitacoes": "limitações identificadas (ou 'Não mencionado' se ausente)",
  "relevancia": "relevância e contribuição para a área",
  "citacaoAbnt": "citação completa no formato ABNT",
  "evidenceStrength": "STRONG | MODERATE | WEAK | INSUFFICIENT",
  "keywords": ["palavra1", "palavra2", "palavra3"]
}`
    : `Generate a scientific summary in JSON with this exact structure:
{
  "objetivo": "main research objective in 2-3 sentences",
  "metodologia": "methodological approach used",
  "resultados": "main results found",
  "conclusoes": "authors conclusions",
  "limitacoes": "identified limitations (or 'Not mentioned' if absent)",
  "relevancia": "relevance and contribution to the field",
  "citacaoAbnt": "full citation in ABNT format",
  "evidenceStrength": "STRONG | MODERATE | WEAK | INSUFFICIENT",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`}`;
}

@Injectable()
export class FichamentoService {
  private readonly logger = new Logger(FichamentoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generate(dto: CreateFichamentoDto, workspaceId: string, userId: string): Promise<FichamentoResult> {
    // 1. Load paper
    const paper = await this.prisma.paper.findUnique({
      where: { id: dto.paperId },
      include: {
        authors: { include: { author: true }, orderBy: { position: 'asc' } },
      },
    });

    if (!paper) {
      throw new NotFoundException(`Paper ${dto.paperId} not found`);
    }

    if (!paper.title) {
      throw new BadRequestException('Paper has no title — cannot generate fichamento');
    }

    const language = dto.language ?? FichamentoLanguage.PT;
    const authors = paper.authors.map((pa) => pa.author.fullName).join('; ');
    const isPortuguese = language === FichamentoLanguage.PT;

    // 2. Try providers in order: OpenAI → Anthropic
    const openAiKey = this.config.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');

    if (!openAiKey && !anthropicKey) {
      throw new BadRequestException('No AI provider configured (OPENAI_API_KEY or ANTHROPIC_API_KEY required)');
    }

    const userPrompt = buildUserPrompt(
      paper.title,
      paper.abstractText,
      language,
      authors,
      paper.publicationYear,
      paper.venue,
    );

    let rawJson: string;
    let modelUsed: string;

    if (openAiKey) {
      ({ rawJson, modelUsed } = await this.callOpenAI(
        openAiKey,
        isPortuguese ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT_EN,
        userPrompt,
        dto.customPrompt,
      ));
    } else {
      ({ rawJson, modelUsed } = await this.callAnthropic(
        anthropicKey!,
        isPortuguese ? SYSTEM_PROMPT_PT : SYSTEM_PROMPT_EN,
        userPrompt,
        dto.customPrompt,
      ));
    }

    // 3. Parse AI response
    const parsed = this.parseAiResponse(rawJson);

    // 4. Persist as ScientificSheet (upsert with JSON fields)
    await this.persistFichamento(paper.id, workspaceId, parsed, modelUsed);

    return {
      paperId: paper.id,
      paperTitle: paper.title,
      language,
      sections: {
        objetivo: parsed.objetivo,
        metodologia: parsed.metodologia,
        resultados: parsed.resultados,
        conclusoes: parsed.conclusoes,
        limitacoes: parsed.limitacoes,
        relevancia: parsed.relevancia,
        citacaoAbnt: parsed.citacaoAbnt,
      },
      evidenceStrength: parsed.evidenceStrength,
      keywords: parsed.keywords,
      generatedAt: new Date().toISOString(),
      modelUsed,
    };
  }

  private async callOpenAI(
    apiKey: string,
    system: string,
    user: string,
    customPrompt?: string,
  ): Promise<{ rawJson: string; modelUsed: string }> {
    const model = 'gpt-4o-mini';
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: customPrompt ? `${user}\n\nInstruções adicionais: ${customPrompt}` : user },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, response_format: { type: 'json_object' }, temperature: 0.3, max_tokens: 2000 }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new BadRequestException(`OpenAI error: ${err}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return { rawJson: data.choices[0]?.message?.content ?? '{}', modelUsed: model };
  }

  private async callAnthropic(
    apiKey: string,
    system: string,
    user: string,
    customPrompt?: string,
  ): Promise<{ rawJson: string; modelUsed: string }> {
    const model = 'claude-3-5-haiku-20241022';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        system,
        messages: [{ role: 'user', content: customPrompt ? `${user}\n\nInstruções adicionais: ${customPrompt}` : user }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new BadRequestException(`Anthropic error: ${err}`);
    }

    const data = await response.json() as { content: { type: string; text: string }[] };
    const text = data.content.find((b) => b.type === 'text')?.text ?? '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return { rawJson: jsonMatch?.[0] ?? '{}', modelUsed: model };
  }

  private parseAiResponse(rawJson: string): {
    objetivo: string;
    metodologia: string;
    resultados: string;
    conclusoes: string;
    limitacoes: string;
    relevancia: string;
    citacaoAbnt: string;
    evidenceStrength: 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' | 'CONFLICTING';
    keywords: string[];
  } {
    try {
      const obj = JSON.parse(rawJson) as Record<string, unknown>;
      const validStrengths = ['STRONG', 'MODERATE', 'WEAK', 'INSUFFICIENT', 'CONFLICTING'];
      const strength =
        typeof obj.evidenceStrength === 'string' && validStrengths.includes(obj.evidenceStrength)
          ? (obj.evidenceStrength as 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT' | 'CONFLICTING')
          : 'MODERATE';

      return {
        objetivo: String(obj.objetivo ?? 'Não informado'),
        metodologia: String(obj.metodologia ?? 'Não informado'),
        resultados: String(obj.resultados ?? 'Não informado'),
        conclusoes: String(obj.conclusoes ?? 'Não informado'),
        limitacoes: String(obj.limitacoes ?? 'Não mencionado'),
        relevancia: String(obj.relevancia ?? 'Não informado'),
        citacaoAbnt: String(obj.citacaoAbnt ?? ''),
        evidenceStrength: strength,
        keywords: Array.isArray(obj.keywords) ? (obj.keywords as string[]).slice(0, 10) : [],
      };
    } catch {
      this.logger.error('Failed to parse AI JSON response');
      throw new BadRequestException('AI returned invalid JSON — please retry');
    }
  }

  private async persistFichamento(
    paperId: string,
    workspaceId: string,
    parsed: ReturnType<FichamentoService['parseAiResponse']>,
    modelUsed: string,
  ) {
    // ScientificSheet stores sections as JSON fields directly
    const sections = {
      objetivo: parsed.objetivo,
      metodologia: parsed.metodologia,
      resultados: parsed.resultados,
      conclusoes: parsed.conclusoes,
      limitacoes: parsed.limitacoes,
      relevancia: parsed.relevancia,
      citacaoAbnt: parsed.citacaoAbnt,
      evidenceStrength: parsed.evidenceStrength,
      keywords: parsed.keywords,
      modelUsed,
    };

    await this.prisma.scientificSheet.upsert({
      where: { workspaceId_paperId: { workspaceId, paperId } },
      create: {
        paperId,
        workspaceId,
        objective: sections as any,
        methodology: { text: parsed.metodologia } as any,
        results: { text: parsed.resultados } as any,
        limitations: { text: parsed.limitacoes } as any,
        relevance: { text: parsed.relevancia, citacao: parsed.citacaoAbnt, keywords: parsed.keywords, evidenceStrength: parsed.evidenceStrength, modelUsed } as any,
        confidenceScore: parsed.evidenceStrength === 'STRONG' ? 0.9 : parsed.evidenceStrength === 'MODERATE' ? 0.7 : 0.5,
      },
      update: {
        objective: sections as any,
        methodology: { text: parsed.metodologia } as any,
        results: { text: parsed.resultados } as any,
        limitations: { text: parsed.limitacoes } as any,
        relevance: { text: parsed.relevancia, citacao: parsed.citacaoAbnt, keywords: parsed.keywords, evidenceStrength: parsed.evidenceStrength, modelUsed } as any,
        confidenceScore: parsed.evidenceStrength === 'STRONG' ? 0.9 : parsed.evidenceStrength === 'MODERATE' ? 0.7 : 0.5,
        updatedAt: new Date(),
      },
    });
  }
}
