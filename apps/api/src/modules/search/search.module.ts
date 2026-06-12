import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { OpenAlexClient } from './services/openalex.client';

@Module({
  controllers: [SearchController],
  providers: [SearchService, OpenAlexClient],
  exports: [SearchService],
})
export class SearchModule {}
