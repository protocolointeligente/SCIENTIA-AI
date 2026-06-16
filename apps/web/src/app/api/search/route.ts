import { NextRequest, NextResponse } from 'next/server';
import { aggregateSearch } from '@/lib/search/aggregator';
import type { SearchInput, SearchSource } from '@/lib/search/types';

export const runtime = 'nodejs'; // needs fetch + AbortSignal.timeout
export const maxDuration = 30;   // Vercel function timeout (seconds)

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    query,
    sources,
    filters,
    page = 1,
    pageSize = 20,
  } = body as Record<string, unknown>;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'query must be a string with at least 2 characters' },
      { status: 422 },
    );
  }

  const input: SearchInput = {
    query: query.trim(),
    sources: Array.isArray(sources) ? (sources as SearchSource[]) : undefined,
    filters: typeof filters === 'object' && filters !== null
      ? (filters as SearchInput['filters'])
      : undefined,
    page: typeof page === 'number' ? page : 1,
    pageSize: typeof pageSize === 'number' ? Math.min(pageSize, 50) : 20,
  };

  try {
    const result = await aggregateSearch(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[POST /api/search]', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
