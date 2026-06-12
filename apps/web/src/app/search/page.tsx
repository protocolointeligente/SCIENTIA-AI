import { AppShell } from '@/components/layout/app-shell';
import { SearchResults } from './search-results';

export default function SearchPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pesquisa</h1>
          <p className="text-sm text-muted-foreground">
            Busca multi-fonte (OpenAlex, Crossref, Semantic Scholar, PubMed, arXiv).
          </p>
        </div>

        <SearchResults />
      </div>
    </AppShell>
  );
}
