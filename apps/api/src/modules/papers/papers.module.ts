import { Module } from '@nestjs/common';
import { PapersController } from './controllers/papers.controller';
import { FichamentoService } from './services/fichamento.service';

/**
 * PapersModule — paper catalog, fichamento (scientific sheet) generation.
 * AI providers tried in order: OpenAI (gpt-4o-mini) → Anthropic (claude-3-5-haiku).
 */
@Module({
  controllers: [PapersController],
  providers: [FichamentoService],
  exports: [FichamentoService],
})
export class PapersModule {}
