import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OpenAlexClient } from './openalex.client';
import { CrossrefProvider } from '../providers/crossref.provider';
import { SemanticScholarProvider } from '../providers/semantic-scholar.provider';
import { PubMedProvider } from '../providers/pubmed.provider';
import { ArxivProvider } from '../providers/arxiv.provider';
import { DedupeService } from './dedupe.service';
import { RankingService } from './ranking.service';
import type {
  SearchInput,
  SearchResponse,
  SearchSource,
  SourceStatus,
  UnifiedPaper,
} from '../types/unified-paper';

const DEFAULT_SOURCES: SearchSource[] = [
  'openalex',
  'crossref',
  'semantic_scholar',
  'pubmed',
  'arxiv',
];

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAlex: OpenAlexClient,
    private readonly crossref: CrossrefProvider,
    private readonly semanticScholar: SemanticScholarProvider,
    private readonly pubmed: PubMedProvider,
    private readonly arxiv: ArxivProvider,
    private readonly dedupe: DedupeService,
    private readonly ranking: RankingService,
  ) {}

  async search(workspaceId: string, input: SearchInput): Promise<SearchResponse> {
    const sources = input.sources?.length ? input.sources : DEFAULT_SOURCES;

    const statuses: Record<SearchSource, SourceStatus> = {
      openalex: 'skipped',
      crossref: 'skipped',
      semantic_scholar: 'skipped',
      pubmed: 'skipped',
      arxiv: 'skipped',
    };

    const providerMap: Record<SearchSource, () => Promise<UnifiedPaper[]>> = {
      openalex: async () => {
        const r = await this.openAlex.search(input.query, input.pageSize ?? 20);
        // Convert legacy NormalizedSearchResult to UnifiedPaper
        return r.map((p) => ({
          id: `openalex:${p.externalId}`,
          source: 'openalex' as const,
          externalId: p.externalId,
          doi: p.doi ?? undefined,
          title: p.title,
          abstract: p.abstractText ?? undefined,
          authors: p.authors.map((a) => a.fullName),
          journal: p.venue ?? undefined,
          year: p.publicationYear ?? undefined,
          citations: p.citationCount,
          openAccess: !!p.openAccessUrl,
          pdfUrl: p.openAccessUrl ?? undefined,
          landingUrl: p.externalId,
        }));
      },
      crossref: () => this.crossref.search(input),
      semantic_scholar: () => this.semanticScholar.search(input),
      pubmed: () => this.pubmed.search(input),
      arxiv: () => this.arxiv.search(input),
    };

    const tasks = sources.map(async (source): Promise<UnifiedPaper[]> => {
      try {
        const results = await providerMap[source]();
        statuses[source] = 'ok';
        return results;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        statuses[source] = msg.toLowerCase().includes('timeout') ? 'timeout' : 'error';
        this.logger.warn(`Provider ${source} failed: ${msg}`);
        return [];
      }
    });

    const settled = await Promise.all(tasks);
    const merged = settled.flat();
    const deduped = this.dedupe.merge(merged);
    const ranked = this.ranking.sort(deduped, input.query);

    // Record search query for analytics (fire-and-forget)
    this.prisma.searchQuery
      .create({
        data: {
          workspaceId,
          query: input.query,
          providers: sources.map((s) => s.toUpperCase()),
          resultCount: ranked.length,
        },
      })
      .catch((e) => this.logger.warn('Failed to record SearchQuery: ' + e.message));

    // Upsert top results into local catalog (first 20 only to keep it fast)
    for (const paper of ranked.slice(0, 20)) {
      this.upsertPaper(paper).catch((e) =>
        this.logger.warn(`Failed to upsert paper ${paper.id}: ${e.message}`),
      );
    }

    return { items: ranked, total: ranked.length, sourcesStatus: statuses };
  }

  private async upsertPaper(p: UnifiedPaper) {
    const externalId = p.externalId ?? p.id;
    const source = p.source.toUpperCase();

    const paper = await this.prisma.paper.upsert({
      where: { externalId },
      create: {
        externalId,
        source,
        title: p.title,
        abstractText: p.abstract ?? null,
        doi: p.doi ?? null,
        publicationYear: p.year ?? null,
        venue: p.journal ?? null,
        citationCount: p.citations ?? 0,
        openAccessUrl: p.pdfUrl ?? p.landingUrl ?? null,
        status: 'INGESTED',
      },
      update: {
        title: p.title,
        abstractText: p.abstract ?? null,
        citationCount: p.citations ?? 0,
        openAccessUrl: p.pdfUrl ?? p.landingUrl ?? null,
      },
    });

    for (const [i, name] of p.authors.entries()) {
      const authorId = `${externalId}:${i}`;
      const author = await this.prisma.author.upsert({
        where: { id: authorId },
        create: { id: authorId, fullName: name },
        update: { fullName: name },
      });
      await this.prisma.paperAuthor.upsert({
        where: { paperId_authorId: { paperId: paper.id, authorId: author.id } },
        create: { paperId: paper.id, authorId: author.id, position: i },
        update: {},
      });
    }
  }
}
