'use client';

import { useState } from 'react';
import {
  Search,
  Library,
  ClipboardList,
  BarChart3,
  Boxes,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
  Play,
  Lightbulb,
  Target,
  Zap,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ─── Checklist de primeiros passos ─────────────────────────── */
const CHECKLIST = [
  { id: 'search', label: 'Faça sua primeira busca científica', done: false },
  { id: 'save', label: 'Salve um artigo na sua biblioteca', done: false },
  { id: 'collection', label: 'Crie uma coleção temática', done: false },
  { id: 'review', label: 'Inicie uma revisão sistemática', done: false },
  { id: 'assistant', label: 'Converse com o assistente de IA', done: false },
  { id: 'graph', label: 'Explore o grafo de conhecimento', done: false },
];

/* ─── Módulos / Funções da plataforma ─────────────────────────── */
const MODULES = [
  {
    id: 'search',
    icon: Search,
    color: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    dot: 'bg-violet-500',
    title: 'Pesquisa científica',
    route: '/search',
    badge: 'Principal',
    tagline: 'Encontre artigos em bases abertas com IA',
    objective:
      'Buscar artigos científicos em tempo real nas bases OpenAlex, PubMed e Semantic Scholar usando linguagem natural ou termos técnicos. A IA reformula sua query para maximizar a relevância.',
    steps: [
      'Digite termos ou uma pergunta de pesquisa no campo de busca',
      'Ajuste os filtros: idioma, ano, tipo de estudo, área do conhecimento',
      'Clique em um resultado para ler o resumo completo e acessar o PDF',
      'Salve diretamente na biblioteca com um clique em "Salvar artigo"',
    ],
    tips: [
      'Use aspas para busca exata: "resistance training"',
      'Combine termos com AND/OR para refinar: protein AND hypertrophy',
      'Filtre por revisões sistemáticas para evidências de maior qualidade',
    ],
  },
  {
    id: 'library',
    icon: Library,
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
    title: 'Biblioteca pessoal',
    route: '/library',
    badge: 'Organização',
    tagline: 'Gerencie e organize seus artigos salvos',
    objective:
      'Centralizar todos os artigos salvos em coleções temáticas com notas, destaques e tags. Sua biblioteca é sincronizada em todos os dispositivos e pode ser compartilhada com colaboradores.',
    steps: [
      'Navegue pelas coleções na parte superior ou filtre por tags',
      'Clique em um artigo para abrir o painel lateral com o resumo',
      'Adicione notas e destaques diretamente no leitor de PDF',
      'Use a estrela ★ para marcar os artigos mais importantes',
    ],
    tips: [
      'Crie coleções por tema, projeto ou revisão sistemática',
      'Use a busca interna para encontrar artigos pelo título ou autor',
      'Exporte as referências em BibTeX, APA ou ABNT para o Word',
    ],
  },
  {
    id: 'reviews',
    icon: ClipboardList,
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    title: 'Revisões sistemáticas',
    route: '/reviews',
    badge: 'PRISMA',
    tagline: 'Conduza revisões assistidas por IA com protocolo PRISMA',
    objective:
      'Guiar o pesquisador pelo fluxo completo de uma revisão sistemática: definição da pergunta PICO, busca, triagem por título/resumo, avaliação de elegibilidade e extração de dados — tudo documentado e auditável.',
    steps: [
      'Clique em "Nova revisão" e defina a pergunta de pesquisa (PICO)',
      'Configure os critérios de inclusão e exclusão',
      'Importe artigos da Pesquisa — a IA faz triagem inicial automática',
      'Revise as sugestões da IA, aceite ou rejeite cada artigo',
      'Gere o diagrama PRISMA e exporte o relatório final',
    ],
    tips: [
      'A IA pré-triagem por título/resumo economiza até 60% do tempo',
      'Convide colaboradores para triagem em paralelo e resolver conflitos',
      'O log de decisões garante rastreabilidade para publicação',
    ],
  },
  {
    id: 'bibliometrics',
    icon: BarChart3,
    color: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot: 'bg-green-500',
    title: 'Bibliometria',
    route: '/bibliometrics',
    badge: 'Análise',
    tagline: 'Análise de impacto, autores e tendências',
    objective:
      'Visualizar métricas quantitativas da literatura: índices H, fator de impacto dos periódicos, nuvem de palavras-chave, evolução temporal das publicações e redes de coautoria — tudo baseado na sua biblioteca.',
    steps: [
      'Acesse após salvar artigos na sua biblioteca',
      'Explore os KPIs no topo: papers, citações, autores e periódicos',
      'Veja o ranking de autores por h-index e periódicos por fator de impacto',
      'Clique em uma keyword na nuvem para filtrar artigos relacionados',
    ],
    tips: [
      'Exporte gráficos como PNG para usar em apresentações',
      'A rede de coautoria mostra os pesquisadores mais conectados ao tema',
      'Compare períodos temporais para identificar tendências emergentes',
    ],
  },
  {
    id: 'graph',
    icon: Boxes,
    color: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    dot: 'bg-pink-500',
    title: 'Grafo de conhecimento',
    route: '/graph',
    badge: 'Visual',
    tagline: 'Explore conexões entre papers, autores e conceitos',
    objective:
      'Visualizar a literatura como uma rede interativa onde nós representam papers, autores, conceitos e periódicos, e as arestas mostram citações, coautorias e cocitações. Revela lacunas de pesquisa e clusters temáticos.',
    steps: [
      'Busque um tema — o grafo se expande automaticamente',
      'Clique em um nó para ver detalhes e artigos relacionados',
      'Use os filtros de tipo (paper / autor / conceito / periódico)',
      'Zoom com a roda do mouse; arraste para navegar',
    ],
    tips: [
      'Nós maiores = mais conexões (mais citado ou com mais coautores)',
      'Clusters de cores diferentes representam sub-temas',
      'Use para descobrir artigos pivô que conectam áreas distintas',
    ],
  },
  {
    id: 'assistant',
    icon: Sparkles,
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-500',
    title: 'Assistente científico',
    route: '/assistant',
    badge: 'IA',
    tagline: 'Pergunte sobre seus artigos com respostas rastreáveis',
    objective:
      'Conversar com um assistente de IA que tem acesso à sua biblioteca e responde perguntas científicas com citações rastreáveis. Compara estudos, identifica contradições, resume evidências e ajuda na escrita acadêmica.',
    steps: [
      'Faça uma pergunta em linguagem natural no campo de chat',
      'O assistente busca nos seus artigos salvos antes de responder',
      'Cada afirmação vem com a referência do artigo fonte',
      'Peça um resumo, comparação ou análise crítica de qualquer tema',
    ],
    tips: [
      '"Quais são os estudos com maior nível de evidência sobre X?"',
      '"Compare os resultados dos estudos de Silva et al. e Johnson et al."',
      '"Me ajude a escrever a seção de metodologia desta revisão"',
    ],
  },
];

/* ─── FAQ ─────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: 'Os dados são públicos ou privados?',
    a: 'Sua biblioteca, notas e revisões são 100% privados e vinculados ao seu workspace. As buscas utilizam APIs públicas abertas (OpenAlex, PubMed).',
  },
  {
    q: 'O assistente tem acesso à internet?',
    a: 'O assistente usa principalmente sua biblioteca local. Para buscas de artigos recentes, ele consulta as APIs científicas abertas configuradas no workspace.',
  },
  {
    q: 'Posso trabalhar em equipe?',
    a: 'Sim. Convide colaboradores nas Configurações do workspace. Você controla permissões de leitura, edição e administração para cada membro.',
  },
  {
    q: 'Quais bases de dados são suportadas?',
    a: 'OpenAlex (200M+ papers), PubMed/MEDLINE, Semantic Scholar e arXiv. Suporte a Scopus e Web of Science está em desenvolvimento.',
  },
  {
    q: 'Como exportar minha bibliografia?',
    a: 'Na Biblioteca, selecione os artigos e clique em Exportar. Formatos disponíveis: BibTeX, RIS, APA, ABNT e CSV.',
  },
];

/* ─── Componente principal ─────────────────────────────────────── */
export default function GuidePage() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [checklist, setChecklist] = useState(CHECKLIST.map((c) => ({ ...c })));
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const doneCount = checklist.filter((c) => c.done).length;
  const progress = Math.round((doneCount / checklist.length) * 100);

  const selected = MODULES.find((m) => m.id === activeModule);

  return (
    <AppShell>
      <div className="space-y-8 pb-12">

        {/* ── Hero ── */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 p-8">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-violet-400" />
                <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">Guia da plataforma</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Bem-vindo ao SCIENTIA AI
              </h1>
              <p className="mt-2 text-muted-foreground max-w-xl">
                Uma plataforma de pesquisa científica potencializada por IA. Busque, organize, analise e colabore em revisões sistemáticas com evidências rastreáveis.
              </p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Badge className="gap-1 bg-violet-500/20 text-violet-300 border-violet-500/30">
                  <Star className="h-3 w-3" /> 200M+ artigos indexados
                </Badge>
                <Badge className="gap-1 bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Users className="h-3 w-3" /> Colaboração em equipe
                </Badge>
                <Badge className="gap-1 bg-green-500/20 text-green-300 border-green-500/30">
                  <TrendingUp className="h-3 w-3" /> Protocolo PRISMA
                </Badge>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-violet-500/30 bg-violet-500/10">
                <span className="text-2xl font-bold text-violet-400">{progress}%</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{doneCount}/{checklist.length} tarefas</p>
            </div>
          </div>
        </div>

        {/* ── Checklist de início rápido ── */}
        <div className="rounded-xl border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-400" />
            <h2 className="font-semibold">Primeiros passos</h2>
            <span className="ml-auto text-xs text-muted-foreground">{doneCount} de {checklist.length} concluídos</span>
          </div>
          {/* progress bar */}
          <div className="mb-5 h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                  item.done
                    ? 'border-green-500/30 bg-green-500/10 text-muted-foreground line-through'
                    : 'border-border hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Módulos ── */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h2 className="font-semibold">Funções da plataforma</h2>
            <span className="ml-2 text-xs text-muted-foreground">Clique em qualquer módulo para ver o guia detalhado</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModule(isActive ? null : mod.id)}
                  className={`group relative rounded-xl border p-5 text-left transition-all ${
                    isActive
                      ? 'border-primary/50 bg-accent/40 shadow-lg shadow-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${mod.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">{mod.badge}</Badge>
                  </div>
                  <h3 className="mt-3 font-medium">{mod.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{mod.tagline}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {isActive ? 'Fechar guia' : 'Ver guia detalhado'}
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Detalhe do módulo selecionado ── */}
        {selected && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${selected.color}`}>
                  <selected.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selected.title}</h3>
                  <p className="text-xs text-muted-foreground">{selected.tagline}</p>
                </div>
              </div>
              <Button size="sm" className="gap-1 shrink-0" asChild>
                <a href={selected.route}>
                  <Play className="h-3.5 w-3.5" />
                  Abrir módulo
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>

            {/* Objetivo */}
            <div className="rounded-lg bg-white/5 border border-border p-4">
              <p className="text-sm font-medium mb-1 text-muted-foreground uppercase tracking-wider text-xs">Objetivo</p>
              <p className="text-sm leading-relaxed">{selected.objective}</p>
            </div>

            {/* Passo a passo */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Play className="h-3.5 w-3.5 text-primary" />
                Como usar — passo a passo
              </p>
              <ol className="space-y-2">
                {selected.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Dicas */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                Dicas de uso
              </p>
              <ul className="space-y-2">
                {selected.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            Perguntas frequentes
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-accent/30 transition-colors"
                >
                  {item.q}
                  <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border bg-white/3 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA final ── */}
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-6 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-violet-400" />
          <h3 className="font-semibold text-lg">Pronto para começar?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Faça sua primeira busca científica e explore os resultados.
          </p>
          <Button className="mt-4 gap-2" asChild>
            <a href="/search">
              <Search className="h-4 w-4" />
              Ir para Pesquisa
            </a>
          </Button>
        </div>

      </div>
    </AppShell>
  );
}
