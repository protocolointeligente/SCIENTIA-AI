import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OpenAlexClient, NormalizedSearchResult } from './openalex.client';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAlexClient: OpenAlexClient,
  ) {}

  /**
   * Searches OpenAlex, upserts the results into the local catalog
   * (Paper + Author + PaperAuthor), and records the SearchQuery for
   * analytics/history.
   */
  async search(workspaceId: string, query: string, perPage: number) {
    const results = await this.openAlexClient.search(query, perPage);

    const papers = await Promise.all(results.map((result) => this.upsertPaper(result)));

    await this.prisma.searchQuery.create({
      data: {
        workspaceId,
        query,
        providers: ['OPENALEX'],
        resultCount: papers.length,
      },
    });

    return papers;
  }

  private async upsertPaper(result: NormalizedSearchResult) {
    const paper = await this.prisma.paper.upsert({
      where: { externalId: result.externalId },
      create: {
        externalId: result.externalId,
        source: result.source,
        title: result.title,
        abstractText: result.abstractText,
        doi: result.doi ?? undefined,
        publicationYear: result.publicationYear,
        venue: result.venue,
        citationCount: result.citationCount,
        openAccessUrl: result.openAccessUrl,
        status: 'INGESTED',
      },
      update: {
        title: result.title,
        abstractText: result.abstractText,
        citationCount: result.citationCount,
        openAccessUrl: result.openAccessUrl,
      },
    });

    for (const author of result.authors) {
      const authorRecord = await this.prisma.author.upsert({
        where: { id: `${result.externalId}:${author.position}` },
        create: {
          id: `${result.externalId}:${author.position}`,
          fullName: author.fullName,
        },
        update: { fullName: author.fullName },
      });

      await this.prisma.paperAuthor.upsert({
        where: { paperId_authorId: { paperId: paper.id, authorId: authorRecord.id } },
        create: { paperId: paper.id, authorId: authorRecord.id, position: author.position },
        update: {},
      });
    }

    return paper;
  }
}
