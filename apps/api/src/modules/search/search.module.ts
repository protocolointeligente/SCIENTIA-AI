import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { OpenAlexClient } from './services/openalex.client';
import { CrossrefProvider } from './providers/crossref.provider';
import { SemanticScholarProvider } from './providers/semantic-scholar.provider';
import { PubMedProvider } from './providers/pubmed.provider';
import { ArxivProvider } from './providers/arxiv.provider';
import { DedupeService } from './services/dedupe.service';
import { RankingService } from './services/ranking.service';

@Module({
  controllers: [SearchController],
  providers: [
    SearchService,
    OpenAlexClient,
    CrossrefProvider,
    SemanticScholarProvider,
    PubMedProvider,
    ArxivProvider,
    DedupeService,
    RankingService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
