import { ExternalLink, Quote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ArticleResult {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  venue: string | null;
  citationCount: number;
  abstractText: string | null;
  openAccessUrl: string | null;
}

export function ArticleResultCard({ article }: { article: ArticleResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {article.authors.slice(0, 4).join(', ')}
          {article.authors.length > 4 ? ' et al.' : ''}
          {article.publicationYear ? ` · ${article.publicationYear}` : ''}
          {article.venue ? ` · ${article.venue}` : ''}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {article.abstractText && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{article.abstractText}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Quote className="h-3 w-3" />
            {article.citationCount} citações
          </Badge>
          {article.openAccessUrl && (
            <Badge variant="outline">Acesso aberto</Badge>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm">Gerar ficha</Button>
          <Button size="sm" variant="outline">
            Adicionar à coleção
          </Button>
          {article.openAccessUrl && (
            <Button size="sm" variant="ghost" asChild>
              <a href={article.openAccessUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Abrir
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
