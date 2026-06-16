'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Sparkles, ClipboardList, BookOpen, BarChart3,
  FileText, BookMarked, Loader2, Check, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Copy, Download, Star, FlaskConical,
  Eye, Users, Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getReview,
  upsertReview,
  type ReviewProject,
  type ImportedStudy,
  type StudyExtraction,
  type AIProcessing,
  type ReviewDraft,
  type ExtractionMatrix,
} from '@/lib/review/types';
import { scoreBadge } from '@/lib/search/quality-score';

// ── Tab types ────────────────────────────────────────────────
type Tab = 'studies' | 'screening' | 'extraction' | 'synthesis' | 'article' | 'references';

const TABS_MANUAL: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'studies',    label: 'Estudos',     Icon: BookOpen },
  { id: 'screening',  label: 'Triagem',     Icon: Filter },
  { id: 'extraction', label: 'Extração',    Icon: BarChart3 },
  { id: 'synthesis',  label: 'Síntese',     Icon: ClipboardList },
  { id: 'article',    label: 'Redação',     Icon: FileText },
];

const TABS_AUTO: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'studies',    label: 'Estudos',              Icon: BookOpen },
  { id: 'extraction', label: 'Fichas & Extração',    Icon: BarChart3 },
  { id: 'synthesis',  label: 'Síntese',              Icon: Sparkles },
  { id: 'article',    label: 'Artigo gerado',        Icon: FileText },
  { id: 'references', label: 'Referências',          Icon: BookMarked },
];

// ── Helpers ──────────────────────────────────────────────────
function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const map = {
    high:   { label: 'Alta confiança',   cls: 'text-green-400 border-green-500/30 bg-green-500/5' },
    medium: { label: 'Média confiança',  cls: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
    low:    { label: 'Baixa confiança',  cls: 'text-red-400 border-red-500/30 bg-red-500/5' },
  };
  const m = map[level];
  return <Badge variant="outline" className={`text-xs ${m.cls}`}>{m.label}</Badge>;
}

// ── Sub-component: Studies list ──────────────────────────────
function StudiesTab({ review }: { review: ReviewProject }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {review.studies.length} estudo{review.studies.length !== 1 ? 's' : ''} importado{review.studies.length !== 1 ? 's' : ''}
          {review.searchQuery && (
            <> · busca: <span className="text-foreground">&ldquo;{review.searchQuery}&rdquo;</span></>
          )}
        </p>
      </div>
      {review.studies.map((s) => (
        <StudyCard key={s.id} study={s} />
      ))}
    </div>
  );
}

function StudyCard({ study }: { study: ImportedStudy }) {
  const [expanded, setExpanded] = useState(false);
  const badge = scoreBadge(study.scores.final);

  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug">{study.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {study.authors.slice(0, 3).join(', ')}{study.authors.length > 3 ? ' et al.' : ''}
            {study.year ? ` · ${study.year}` : ''}
            {study.journal ? ` · ${study.journal}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.color}`}>
            <Star className="h-2.5 w-2.5 inline mr-0.5" />
            {study.scores.final}
          </span>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <FlaskConical className="h-2.5 w-2.5" />
            {study.studyType}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">Nível {study.evidenceLevel}</Badge>
        {study.citations !== undefined && (
          <Badge variant="outline" className="text-xs">{study.citations} citações</Badge>
        )}
        {study.openAccess && (
          <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">Acesso aberto</Badge>
        )}
        {study.doi && (
          <a href={`https://doi.org/${study.doi}`} target="_blank" rel="noreferrer"
            className="text-xs text-primary hover:underline">DOI →</a>
        )}
      </div>

      {study.abstract && (
        <>
          <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {study.abstract}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? <><ChevronUp className="h-3 w-3" />Recolher</> : <><ChevronDown className="h-3 w-3" />Ver abstract completo</>}
          </button>
        </>
      )}
    </div>
  );
}

// ── Sub-component: Extraction tab ────────────────────────────
function ExtractionTab({ review }: { review: ReviewProject }) {
  const { aiProcessing } = review;
  const extractions = aiProcessing.extractions ?? [];

  if (aiProcessing.status === 'idle' || extractions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Nenhuma extração disponível.</p>
        {review.mode === 'manual' && (
          <p className="mt-1 text-xs text-muted-foreground">No modo manual, preencha as fichas de cada estudo individualmente.</p>
        )}
        {review.mode === 'auto' && (
          <p className="mt-1 text-xs text-muted-foreground">Inicie o processamento automático na aba de síntese.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matrix table */}
      {aiProcessing.matrix && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Matriz de extração comparativa
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  {aiProcessing.matrix.headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aiProcessing.matrix.rows.map((row, i) => (
                  <tr key={row.studyId ?? i} className="hover:bg-white/3">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{row.authorYear}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.studyType}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate">{row.sample}</td>
                    <td className="px-3 py-2 max-w-[140px]">{row.intervention}</td>
                    <td className="px-3 py-2 max-w-[140px]">{row.outcomes}</td>
                    <td className="px-3 py-2 max-w-[160px]">{row.mainResult}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="text-xs">{row.evidenceLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Individual extractions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Fichas estruturadas por estudo</h3>
        {extractions.map((ex) => (
          <ExtractionCard key={ex.studyId} extraction={ex} />
        ))}
      </div>
    </div>
  );
}

function ExtractionCard({ extraction: ex }: { extraction: StudyExtraction }) {
  const [expanded, setExpanded] = useState(false);

  const FIELDS = [
    { label: 'Introdução / Contexto',    value: ex.introduction },
    { label: 'Objetivos',                value: ex.objectives },
    { label: 'Metodologia',              value: ex.methodology },
    { label: 'Resultados',               value: ex.results },
    { label: 'Conclusão',                value: ex.conclusion },
    { label: 'Amostra',                  value: ex.sample },
    { label: 'Instrumentos',             value: ex.instruments },
    { label: 'Limitações',               value: ex.limitations },
    { label: 'Lacunas / Pesq. futura',   value: ex.gaps },
    { label: 'Aplicabilidade prática',   value: ex.practicalApplicability },
  ];

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/20 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{ex.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ex.authors.slice(0, 2).join(', ')}{ex.authors.length > 2 ? ' et al.' : ''} ({ex.year ?? '?'})
            {ex.journal ? ` · ${ex.journal}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge level={ex.confidenceLevel} />
          <Badge variant="outline" className="text-xs">{ex.studyType}</Badge>
          <Badge variant="outline" className="text-xs">Nível {ex.evidenceLevel}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {ex.dataSource === 'metadata_only' && (
            <div className="px-4 py-2 bg-amber-500/5 text-xs text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              Extração baseada apenas em metadados (abstract não disponível)
            </div>
          )}
          {FIELDS.map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[180px_1fr] gap-3 px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground pt-0.5">{label}</span>
              <span className="text-xs text-foreground leading-relaxed">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reference format picker ──────────────────────────────────
const REF_FORMATS = ['ABNT', 'APA', 'Vancouver'] as const;
type RefFormat = typeof REF_FORMATS[number];

function RefFormatPicker({
  value,
  onChange,
}: {
  value: RefFormat;
  onChange: (v: RefFormat) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Formato de referências:</span>
      <div className="flex rounded-lg border border-border overflow-hidden">
        {REF_FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              value === f
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Sub-component: Synthesis tab ─────────────────────────────
function SynthesisTab({
  review,
  onStartAI,
  processing,
  referenceFormat,
  onChangeFormat,
}: {
  review: ReviewProject;
  onStartAI: (fmt: RefFormat) => void;
  processing: boolean;
  referenceFormat: RefFormat;
  onChangeFormat: (v: RefFormat) => void;
}) {
  const { aiProcessing } = review;

  if (review.mode === 'manual') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Escreva a síntese da revisão manualmente:</p>
        <textarea
          defaultValue={review.notes ?? ''}
          rows={20}
          placeholder="Descreva os principais achados, convergências, divergências e síntese temática..."
          className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 font-mono"
        />
      </div>
    );
  }

  // Auto mode
  if (aiProcessing.status === 'idle') {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
        <Sparkles className="mx-auto mb-3 h-12 w-12 text-primary/60" />
        <h3 className="font-semibold">Revisão automática com IA</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          A IA vai processar {review.studies.length} estudo{review.studies.length !== 1 ? 's' : ''}, extrair estrutura de cada um,
          gerar a matriz comparativa, síntese e rascunho completo do artigo.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          {['Fichas por estudo', 'Matriz comparativa', 'Síntese agregada', 'Artigo completo'].map((f) => (
            <span key={f} className="rounded-full border border-border px-3 py-1">{f}</span>
          ))}
        </div>
        {/* Reference format picker */}
        <div className="mt-5 flex justify-center">
          <RefFormatPicker value={referenceFormat} onChange={onChangeFormat} />
        </div>
        <Button className="mt-4 gap-2" onClick={() => onStartAI(referenceFormat)} disabled={processing}>
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Iniciando…</>
          ) : (
            <><Sparkles className="h-4 w-4" />Iniciar processamento com IA</>
          )}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Requer chave Gemini configurada · ~1-3 min para processar
        </p>
      </div>
    );
  }

  if (aiProcessing.status === 'processing') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <div>
            <p className="font-medium">Processando com IA…</p>
            <p className="text-sm text-muted-foreground mt-1">{aiProcessing.currentStep}</p>
          </div>
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${aiProcessing.progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground text-right">{aiProcessing.progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (aiProcessing.status === 'error') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="font-medium">Erro no processamento</p>
        </div>
        <p className="text-sm text-muted-foreground">{aiProcessing.error}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <RefFormatPicker value={referenceFormat} onChange={onChangeFormat} />
          <Button variant="outline" className="gap-2" onClick={() => onStartAI(referenceFormat)} disabled={processing}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Done
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Síntese gerada por IA
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <RefFormatPicker value={referenceFormat} onChange={onChangeFormat} />
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => copyText(aiProcessing.synthesis ?? '')}>
            <Copy className="h-3 w-3" />Copiar
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onStartAI(referenceFormat)} disabled={processing}>
            <RefreshCw className="h-3 w-3" />Regenerar
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background/50 p-5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiProcessing.synthesis}</p>
      </div>

      {aiProcessing.draft?.confidenceNote && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {aiProcessing.draft.confidenceNote}
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Article tab ───────────────────────────────
function ArticleTab({
  review,
  onStartAI,
  processing,
  referenceFormat,
  onChangeFormat,
}: {
  review: ReviewProject;
  onStartAI: (fmt: RefFormat) => void;
  processing: boolean;
  referenceFormat: RefFormat;
  onChangeFormat: (v: RefFormat) => void;
}) {
  const { aiProcessing } = review;
  const draft = aiProcessing.draft;

  if (review.mode === 'manual') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Escreva o artigo manualmente:</p>
        {['Título', 'Resumo', 'Introdução', 'Método', 'Resultados', 'Discussão', 'Conclusão'].map((section) => (
          <div key={section}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{section}</label>
            <textarea rows={section === 'Título' ? 2 : 6} placeholder={`${section}...`}
              className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/50" />
          </div>
        ))}
      </div>
    );
  }

  if (!draft || aiProcessing.status === 'idle') {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">O artigo será gerado após o processamento com IA.</p>
        {aiProcessing.status !== 'processing' && (
          <Button className="mt-4 gap-2" onClick={() => onStartAI(referenceFormat)} disabled={processing}>
            <Sparkles className="h-4 w-4" />Iniciar IA
          </Button>
        )}
      </div>
    );
  }

  if (aiProcessing.status === 'processing') {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Gerando artigo…</p>
        </div>
      </div>
    );
  }

  const sections: { key: keyof ReviewDraft; label: string }[] = [
    { key: 'title',                 label: 'Título' },
    { key: 'abstract',              label: 'Resumo' },
    { key: 'introduction',          label: 'Introdução' },
    { key: 'method',                label: 'Método' },
    { key: 'selectionCriteria',     label: 'Critérios de Seleção' },
    { key: 'studyCharacterization', label: 'Caracterização dos Estudos' },
    { key: 'results',               label: 'Resultados' },
    { key: 'discussion',            label: 'Discussão' },
    { key: 'conclusion',            label: 'Conclusão' },
  ];

  const fullText = sections.map(({ key, label }) =>
    `## ${label}\n\n${draft[key] ?? ''}`
  ).join('\n\n---\n\n');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            [RASCUNHO IA]
          </Badge>
          <span className="text-xs text-muted-foreground">
            Gerado em {new Date(draft.generatedAt).toLocaleString('pt-BR')} · {draft.studyCount} estudos
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => copyText(fullText)}>
            <Copy className="h-3 w-3" />Copiar tudo
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => downloadText(fullText, `revisao_${review.id}.md`)}>
            <Download className="h-3 w-3" />Download .md
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onStartAI(referenceFormat)} disabled={processing}>
            <RefreshCw className="h-3 w-3" />Regenerar
          </Button>
        </div>
      </div>

      {draft.confidenceNote && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {draft.confidenceNote}
        </div>
      )}

      <div className="space-y-4">
        {sections.map(({ key, label }) => (
          <ArticleSection
            key={key}
            label={label}
            value={draft[key] as string ?? ''}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleSection({ label, value }: { label: string; value: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-white/3 px-4 py-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h4>
        <button
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {editing ? <><Check className="h-3 w-3" />Salvo</> : <><Eye className="h-3 w-3" />Editar</>}
        </button>
      </div>
      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.max(4, text.split('\n').length)}
          className="w-full resize-y bg-background px-4 py-3 text-sm outline-none focus:bg-accent/10"
        />
      ) : (
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text || <span className="text-muted-foreground">—</span>}</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: References tab ────────────────────────────
function ReferencesTab({ review }: { review: ReviewProject }) {
  const refs = review.aiProcessing.draft?.references ?? '';
  if (!refs) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <BookMarked className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Referências disponíveis após processamento com IA.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Referências ({review.studies.length} estudos)</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => copyText(refs)}>
          <Copy className="h-3 w-3" />Copiar
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-background/50 p-5">
        <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono">{refs}</p>
      </div>
    </div>
  );
}

// ── Sub-component: Screening tab (manual mode) ───────────────
function ScreeningTab({ review }: { review: ReviewProject }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Avalie cada estudo e decida se inclui ou exclui da revisão.
      </p>
      {review.studies.map((s) => (
        <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border p-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{s.title}</p>
            <p className="text-xs text-muted-foreground">
              {s.authors[0]}{s.authors.length > 1 ? ' et al.' : ''} · {s.year}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" className="h-7 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10">
              ✓ Incluir
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10">
              ✗ Excluir
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router  = useRouter();

  const [review, setReview]       = useState<ReviewProject | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('studies');
  const [processing, setProcessing] = useState(false);
  const [notFound, setNotFound]     = useState(false);
  const [referenceFormat, setReferenceFormat] = useState<'ABNT' | 'APA' | 'Vancouver'>('ABNT');

  // Load review from localStorage
  useEffect(() => {
    const r = getReview(id);
    if (r) {
      setReview(r);
      // If auto mode and idle, default to synthesis tab with prompt
      if (r.mode === 'auto') setActiveTab('synthesis');
    } else {
      setNotFound(true);
    }
  }, [id]);

  const refreshReview = useCallback(() => {
    const r = getReview(id);
    if (r) setReview(r);
  }, [id]);

  // ── AI processing ──────────────────────────────────────────
  const startAI = useCallback(async (fmt: 'ABNT' | 'APA' | 'Vancouver' = referenceFormat) => {
    if (!review) return;
    setProcessing(true);

    // Update state: processing started
    const updated: ReviewProject = {
      ...review,
      aiProcessing: {
        ...review.aiProcessing,
        status: 'processing',
        progress: 5,
        currentStep: 'Iniciando extração dos estudos…',
        extractions: [],
      },
    };
    upsertReview(updated);
    setReview(updated);

    try {
      const apiKey = (typeof window !== 'undefined'
        ? localStorage.getItem('scientia_gemini_key')
        : '') ?? '';

      // Simulate progress updates during long call
      const steps = [
        { pct: 15, msg: `Extraindo dados dos ${review.studies.length} estudos…` },
        { pct: 45, msg: 'Analisando metodologia e resultados…' },
        { pct: 70, msg: 'Gerando matriz de extração…' },
        { pct: 85, msg: 'Redigindo síntese e artigo…' },
      ];
      let stepIdx = 0;
      const timer = setInterval(() => {
        if (stepIdx < steps.length) {
          const s = steps[stepIdx++];
          setReview((prev) => {
            if (!prev) return prev;
            const r = {
              ...prev,
              aiProcessing: { ...prev.aiProcessing, progress: s.pct, currentStep: s.msg },
            };
            upsertReview(r);
            return r;
          });
        }
      }, 8000);

      const res = await fetch('/api/review-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studies:  review.studies,
          question: review.question,
          type:     review.type,
          framework: review.framework,
          title:    review.title,
          apiKey,
          referenceFormat: fmt ?? referenceFormat,
        }),
      });

      clearInterval(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json() as {
        extractions: import('@/lib/review/types').StudyExtraction[];
        matrix:      import('@/lib/review/types').ExtractionMatrix;
        synthesis:   string;
        draft:       ReviewDraft;
        error?:      string;
      };

      if (data.error) throw new Error(data.error);

      const done: ReviewProject = {
        ...review,
        status: 'em_andamento',
        papers: {
          ...review.papers,
          screened: data.extractions.length,
          included: data.extractions.length,
        },
        aiProcessing: {
          status:      'done',
          progress:    100,
          currentStep: 'Concluído',
          extractions: data.extractions,
          matrix:      data.matrix,
          synthesis:   data.synthesis,
          draft:       data.draft,
          processedAt: data.draft?.generatedAt ?? new Date().toISOString(),
        },
        updatedAt: new Date().toISOString().split('T')[0],
      };

      upsertReview(done);
      setReview(done);
      setActiveTab('extraction');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setReview((prev) => {
        if (!prev) return prev;
        const r = {
          ...prev,
          aiProcessing: {
            ...prev.aiProcessing,
            status: 'error' as const,
            progress: 0,
            currentStep: '',
            error: msg,
          },
        };
        upsertReview(r);
        return r;
      });
    } finally {
      setProcessing(false);
    }
  }, [review, referenceFormat]);

  // ─────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Revisão não encontrada.</p>
          <Button variant="outline" onClick={() => router.push('/reviews')}>
            ← Voltar às revisões
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!review) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const tabs = review.mode === 'auto' ? TABS_AUTO : TABS_MANUAL;
  const aiDone = review.aiProcessing.status === 'done';

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push('/reviews')}
            className="mt-1 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  review.mode === 'auto'
                    ? 'border-violet-500/30 text-violet-400 bg-violet-500/5 text-xs gap-1'
                    : 'border-blue-500/30 text-blue-400 bg-blue-500/5 text-xs gap-1'
                }
              >
                {review.mode === 'auto'
                  ? <><Sparkles className="h-3 w-3" />Automático com IA</>
                  : <><ClipboardList className="h-3 w-3" />Manual</>}
              </Badge>
              <Badge variant="outline" className="text-xs">{review.type}</Badge>
              <Badge variant="outline" className="text-xs">{review.framework}</Badge>
              {aiDone && (
                <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                  <Check className="h-3 w-3 mr-1" />IA concluída
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug">{review.title}</h1>
            <div className="mt-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground max-w-2xl">
              <span className="text-xs font-medium text-foreground">Pergunta: </span>
              {review.question}
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Estudos importados', value: review.studies.length, color: 'text-blue-400' },
            { label: 'Triados',            value: review.papers.screened, color: 'text-amber-400' },
            { label: 'Incluídos',          value: review.papers.included, color: 'text-green-400' },
            {
              label: 'Score médio',
              value: review.studies.length > 0
                ? Math.round(review.studies.reduce((s, st) => s + st.scores.final, 0) / review.studies.length)
                : '—',
              color: 'text-violet-400',
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border overflow-x-auto">
          {tabs.map(({ id: tabId, label, Icon }) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === 'studies'    && <StudiesTab review={review} />}
          {activeTab === 'screening'  && review.mode === 'manual' && <ScreeningTab review={review} />}
          {activeTab === 'extraction' && <ExtractionTab review={review} />}
          {activeTab === 'synthesis'  && (
            <SynthesisTab
              review={review}
              onStartAI={startAI}
              processing={processing}
              referenceFormat={referenceFormat}
              onChangeFormat={setReferenceFormat}
            />
          )}
          {activeTab === 'article'    && (
            <ArticleTab
              review={review}
              onStartAI={startAI}
              processing={processing}
              referenceFormat={referenceFormat}
              onChangeFormat={setReferenceFormat}
            />
          )}
          {activeTab === 'references' && <ReferencesTab review={review} />}
        </div>
      </div>
    </AppShell>
  );
}
