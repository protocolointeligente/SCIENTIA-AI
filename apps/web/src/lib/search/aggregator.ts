import type { SearchInput, SearchResponse, SearchSource, SourceStatus, UnifiedPaper } from './types';
import { searchOpenAlex } from './providers/openalex';
import { searchCrossref } from './providers/crossref';
import { searchSemanticScholar } from './providers/semantic-scholar';
import { searchPubMed } from './providers/pubmed';
import { searchArxiv } from './providers/arxiv';
import { deduplicatePapers } from './dedupe';
import { rankPapers } from './ranking';

const PROVIDERS: Record<SearchSource, (input: SearchInput) => Promise<UnifiedPaper[]>> = {
  openalex: searchOpenAlex,
  crossref: searchCrossref,
  semantic_scholar: searchSemanticScholar,
  pubmed: searchPubMed,
  arxiv: searchArxiv,
};

const DEFAULT_SOURCES: SearchSource[] = [
  'openalex',
  'crossref',
  'semantic_scholar',
  'pubmed',
  'arxiv',
];

/** Run all providers concurrently, tolerating individual failures. */
export async function aggregateSearch(input: SearchInput): Promise<SearchResponse> {
  const sources = (input.sources?.length ? input.sources : DEFAULT_SOURCES);

  const statuses: Record<SearchSource, SourceStatus> = {
    openalex: 'skipped',
    crossref: 'skipped',
    semantic_scholar: 'skipped',
    pubmed: 'skipped',
    arxiv: 'skipped',
  };

  const tasks = sources.map(async (source): Promise<UnifiedPaper[]> => {
    try {
      const results = await PROVIDERS[source](input);
      statuses[source] = 'ok';
      return results;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      statuses[source] = msg.toLowerCase().includes('timeout') ? 'timeout' : 'error';
      console.error(`[search:${source}]`, msg);
      return [];
    }
  });

  // Run all in parallel (concurrency: all at once — each provider has its own timeout)
  const settled = await Promise.all(tasks);

  const merged = settled.flat();
  const deduped = deduplicatePapers(merged);
  const ranked = rankPapers(deduped, input.query);

  return {
    items: ranked,
    total: ranked.length,
    sourcesStatus: statuses,
  };
}
