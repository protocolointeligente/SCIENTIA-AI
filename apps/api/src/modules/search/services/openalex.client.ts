import { Injectable, Logger } from '@nestjs/common';

export interface NormalizedSearchResult {
  externalId: string;
  source: 'OPENALEX';
  title: string;
  abstractText: string | null;
  doi: string | null;
  publicationYear: number | null;
  venue: string | null;
  citationCount: number;
  openAccessUrl: string | null;
  authors: { fullName: string; position: number }[];
}

interface OpenAlexWork {
  id: string;
  title: string | null;
  doi: string | null;
  publication_year: number | null;
  cited_by_count: number;
  abstract_inverted_index?: Record<string, number[]>;
  primary_location?: { source?: { display_name?: string }; pdf_url?: string | null };
  open_access?: { oa_url?: string | null };
  authorships?: { author: { display_name: string } }[];
}

interface OpenAlexResponse {
  results: OpenAlexWork[];
}

const OPENALEX_API_URL = 'https://api.openalex.org/works';

/**
 * Thin client for the OpenAlex Works API (https://docs.openalex.org/).
 * No API key required; a polite-pool email may be supplied via config.
 */
@Injectable()
export class OpenAlexClient {
  private readonly logger = new Logger(OpenAlexClient.name);

  async search(query: string, perPage: number): Promise<NormalizedSearchResult[]> {
    const url = new URL(OPENALEX_API_URL);
    url.searchParams.set('search', query);
    url.searchParams.set('per_page', String(perPage));

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ScientiaAI/0.1 (mailto:contact@scientia.ai)' },
    });

    if (!response.ok) {
      this.logger.error(`OpenAlex search failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as OpenAlexResponse;
    return data.results.map((work) => this.normalize(work));
  }

  private normalize(work: OpenAlexWork): NormalizedSearchResult {
    return {
      externalId: work.id,
      source: 'OPENALEX',
      title: work.title ?? 'Untitled',
      abstractText: this.reconstructAbstract(work.abstract_inverted_index),
      doi: work.doi,
      publicationYear: work.publication_year,
      venue: work.primary_location?.source?.display_name ?? null,
      citationCount: work.cited_by_count ?? 0,
      openAccessUrl: work.open_access?.oa_url ?? work.primary_location?.pdf_url ?? null,
      authors: (work.authorships ?? []).map((a, index) => ({
        fullName: a.author.display_name,
        position: index,
      })),
    };
  }

  /**
   * OpenAlex returns abstracts as an inverted index (word -> positions)
   * to comply with publisher restrictions. Reconstruct the plain text.
   */
  private reconstructAbstract(invertedIndex?: Record<string, number[]>): string | null {
    if (!invertedIndex) {
      return null;
    }

    const positions: [string, number][] = [];
    for (const [word, indices] of Object.entries(invertedIndex)) {
      for (const index of indices) {
        positions.push([word, index]);
      }
    }

    return positions
      .sort((a, b) => a[1] - b[1])
      .map(([word]) => word)
      .join(' ');
  }
}
