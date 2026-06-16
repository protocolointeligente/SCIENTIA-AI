'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, FileText, BarChart3, Brain, BookOpen, Network,
  Check, X, ChevronRight, Star, Users, Building2, GraduationCap,
  Shield, Zap, Globe, Lock, ArrowRight, Menu
} from 'lucide-react';

// ─── Navigation ───────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SCIENTIA AI</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          {['Funcionalidades', 'Comparação', 'Preços', 'Contato'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace('ç', 'c').replace('ã', 'a')}`}
              className="text-sm text-slate-400 transition-colors hover:text-white">
              {item}
            </a>
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Link href="/sign-in">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Link href="/sign-up">Começar grátis</Link>
          </Button>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-[#0a0a0f] px-6 py-4 md:hidden">
          {['Funcionalidades', 'Comparação', 'Preços', 'Contato'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="block py-2 text-slate-400 hover:text-white">
              {item}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/sign-in">Entrar</Link></Button>
            <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700"><Link href="/sign-up">Começar grátis</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0f] pt-32 pb-24">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-violet-900/20 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-indigo-900/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <Badge className="mb-6 border-violet-500/30 bg-violet-900/30 text-violet-300">
          ✦ Inteligência Artificial para Pesquisa Científica
        </Badge>
        <h1 className="mx-auto mb-6 max-w-4xl text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Pesquise, analise e publique{' '}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            10x mais rápido
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">
          A única plataforma que combina busca semântica, fichamento automático com IA,
          motor de evidências, revisão sistemática e bibliometria — com rastreabilidade
          completa de cada resposta gerada.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-14 bg-violet-600 px-8 text-base hover:bg-violet-700">
            <Link href="/sign-up">
              Começar grátis por 14 dias <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg"
            className="h-14 border-white/20 px-8 text-base text-white hover:bg-white/5">
            <Link href="#funcionalidades">Ver funcionalidades</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-slate-500">Sem cartão de crédito · Cancele quando quiser</p>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/10 pt-16">
          {[
            { value: '2.7M+', label: 'Artigos indexados' },
            { value: '98%', label: 'Precisão do fichamento' },
            { value: '<3s', label: 'Tempo de análise por paper' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-white md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Search,
    color: 'text-violet-400',
    bg: 'bg-violet-900/30',
    title: 'Busca Semântica Avançada',
    desc: 'Encontre artigos por significado, não apenas palavras-chave. Nossa IA entende contexto, sinônimos e relações entre conceitos. Integração com OpenAlex, PubMed e arXiv.',
    items: ['Busca em linguagem natural', 'Filtros por métricas de impacto', 'Alertas automáticos de novos papers'],
  },
  {
    icon: FileText,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
    title: 'Fichamento Automático com IA',
    desc: 'Gere fichamentos estruturados em segundos. A IA extrai objetivo, metodologia, resultados, conclusões e limitações de qualquer artigo — em português ou inglês.',
    items: ['9 seções padronizadas', 'Citação ABNT automática', 'Exportação para Word/PDF'],
  },
  {
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
    title: 'Motor de Evidências',
    desc: 'Avalie a força de evidência de cada paper com base em metodologia, amostragem e nível de certeza. Classifique entre STRONG, MODERATE, WEAK e INSUFFICIENT automaticamente.',
    items: ['Score de qualidade metodológica', 'Detecção de limitações', 'Comparação entre estudos'],
  },
  {
    icon: BookOpen,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30',
    title: 'Revisão Sistemática',
    desc: 'Conduza revisões sistemáticas e meta-análises com suporte da IA. Gerencie critérios de inclusão/exclusão, rastreie decisões e exporte relatórios PRISMA.',
    items: ['Fluxo PRISMA automatizado', 'Gestão de critérios de seleção', 'Relatório final exportável'],
  },
  {
    icon: BarChart3,
    color: 'text-rose-400',
    bg: 'bg-rose-900/30',
    title: 'Bibliometria & Analytics',
    desc: 'Analise tendências de publicação, redes de coautoria e evolução de campos científicos. Visualize dados com gráficos interativos e dashboards customizáveis.',
    items: ['Análise de citações e h-index', 'Redes de colaboração', 'Tendências por área e período'],
  },
  {
    icon: Network,
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/30',
    title: 'Grafo de Conhecimento',
    desc: 'Visualize as conexões entre papers, autores, conceitos e instituições em um grafo interativo. Descubra lacunas na literatura e oportunidades de pesquisa.',
    items: ['Grafo interativo navegável', 'Clustering por conceito', 'Identificação de lacunas'],
  },
  {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-900/30',
    title: 'Assistente IA com RAG',
    desc: 'Converse com sua biblioteca de papers. O assistente responde perguntas citando as fontes exatas, com rastreabilidade completa para cada trecho gerado.',
    items: ['Respostas com citações rastreáveis', 'Contexto da sua biblioteca', 'Histórico de conversas'],
  },
  {
    icon: Users,
    color: 'text-indigo-400',
    bg: 'bg-indigo-900/30',
    title: 'Colaboração em Equipe',
    desc: 'Workspace colaborativo com controle de acesso por função. Gerencie grupos de pesquisa, compartilhe anotações e acompanhe o progresso coletivo.',
    items: ['Permissões por papel (Owner, Admin, Editor, Viewer)', 'Comentários e anotações compartilhadas', 'Histórico de auditoria completo'],
  },
];

function Features() {
  return (
    <section id="funcionalidades" className="bg-[#0d0d14] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="mb-4 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Funcionalidades
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Tudo que sua pesquisa precisa, em um só lugar
          </h2>
          <p className="text-slate-400">
            Ferramentas de IA de ponta combinadas em uma plataforma coesa, desenhada para
            pesquisadores que exigem rigor e velocidade.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/2 p-6 transition-all hover:border-white/10 hover:bg-white/5">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                  <Icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                <ul className="space-y-1">
                  {f.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Platform Screens ──────────────────────────────────────────────────────────
const SCREENS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Visão geral da sua pesquisa',
    desc: 'Acompanhe o progresso de todas as suas revisões, papers recentes, atividade da equipe e métricas de produtividade em um painel unificado.',
    color: 'from-violet-600 to-indigo-600',
    features: ['Resumo de projetos ativos', 'Papers adicionados recentemente', 'Tarefas pendentes', 'Atividade da equipe'],
  },
  {
    id: 'busca',
    label: 'Busca',
    title: 'Busca semântica em milhões de papers',
    desc: 'Digite sua pergunta de pesquisa em linguagem natural e obtenha os artigos mais relevantes ordenados por relevância semântica e qualidade de evidência.',
    color: 'from-blue-600 to-cyan-600',
    features: ['Busca em linguagem natural', 'Filtros avançados (ano, área, acesso)', 'Preview de abstract com highlights', 'Salvar em biblioteca com 1 clique'],
  },
  {
    id: 'fichamento',
    label: 'Fichamento IA',
    title: 'Fichamento estruturado em segundos',
    desc: 'Selecione qualquer paper e receba um fichamento completo com 9 seções padronizadas, citação ABNT, score de evidência e palavras-chave extraídas automaticamente.',
    color: 'from-emerald-600 to-teal-600',
    features: ['9 seções: objetivo, metodologia, resultados...', 'Citação ABNT gerada automaticamente', 'Score de força de evidência', 'Exportar para Word/PDF/BibTeX'],
  },
  {
    id: 'revisao',
    label: 'Revisão Sistemática',
    title: 'Revisões sistemáticas com fluxo PRISMA',
    desc: 'Gerencie todo o processo de revisão sistemática: definição de protocolo, busca nas bases, triagem, extração de dados e síntese — com IA em cada etapa.',
    color: 'from-amber-600 to-orange-600',
    features: ['Protocolo PRISMA automatizado', 'Triagem duplo-cego assistida', 'Extração de dados padronizada', 'Relatório final exportável'],
  },
  {
    id: 'bibliometria',
    label: 'Bibliometria',
    title: 'Análise bibliométrica avançada',
    desc: 'Visualize tendências de publicação, autores mais influentes, redes de coautoria e evolução de temas ao longo do tempo com gráficos interativos.',
    color: 'from-rose-600 to-pink-600',
    features: ['Gráficos de tendências temporais', 'Redes de coautoria interativas', 'Análise de impacto por periódico', 'Exportar dados brutos'],
  },
  {
    id: 'assistente',
    label: 'Assistente IA',
    title: 'Converse com sua biblioteca',
    desc: 'Faça perguntas sobre sua coleção de papers e obtenha respostas precisas com citações rastreáveis. O assistente sabe exatamente quais fontes embasam cada resposta.',
    color: 'from-purple-600 to-violet-600',
    features: ['Respostas com fontes citadas', 'Modo de pesquisa vs modo de escrita', 'Histórico de conversas', 'Citações inline rastreáveis'],
  },
];

function PlatformScreens() {
  const [active, setActive] = useState(0);
  const screen = SCREENS[active]!;

  return (
    <section id="plataforma" className="bg-[#0a0a0f] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="mb-4 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Conheça por dentro
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Uma plataforma construída para pesquisadores sérios
          </h2>
          <p className="text-slate-400">
            Cada módulo foi projetado com feedback de pesquisadores, professores e equipes de P&D.
          </p>
        </div>

        {/* Tab list */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {SCREENS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                i === active
                  ? 'bg-violet-600 text-white'
                  : 'border border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Screen preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/5 bg-[#111118] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <div className="mx-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">
              app.scientia.ai/{screen.id}
            </div>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: mock UI */}
            <div className={`bg-gradient-to-br ${screen.color} p-8 flex items-center justify-center min-h-64`}>
              <div className="text-center text-white">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="text-2xl font-bold">{screen.label}</div>
                <div className="mt-2 text-sm text-white/70">Módulo SCIENTIA AI</div>
                {/* Mock bars */}
                <div className="mt-6 space-y-2">
                  {[85, 92, 67, 78].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-white/30 flex-1">
                        <div className="h-full rounded-full bg-white/80" style={{ width: `${w}%` }} />
                      </div>
                      <span className="text-xs text-white/60">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: description */}
            <div className="p-8 flex flex-col justify-center">
              <h3 className="mb-3 text-2xl font-bold text-white">{screen.title}</h3>
              <p className="mb-6 text-slate-400 leading-relaxed">{screen.desc}</p>
              <ul className="space-y-3">
                {screen.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-900/50">
                      <Check className="h-3 w-3 text-violet-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-fit bg-violet-600 hover:bg-violet-700">
                <Link href="/sign-up">
                  Experimentar gratuitamente <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ───────────────────────────────────────────────────────────────
const COMPARISON_FEATURES = [
  'Busca semântica em linguagem natural',
  'Fichamento automático com IA',
  'Motor de força de evidência',
  'Revisão sistemática (PRISMA)',
  'Bibliometria interativa',
  'Grafo de conhecimento',
  'Assistente IA com fontes rastreáveis',
  'Colaboração em equipe',
  'Exportação ABNT/APA/Vancouver',
  'Suporte em português',
  'API disponível',
  'Controle de acesso por função',
];

const TOOLS = [
  { name: 'SCIENTIA AI', highlight: true, features: [true, true, true, true, true, true, true, true, true, true, true, true] },
  { name: 'Mendeley', highlight: false, features: [false, false, false, false, true, false, false, true, true, false, false, false] },
  { name: 'Zotero', highlight: false, features: [false, false, false, false, false, false, false, true, true, false, true, false] },
  { name: 'ResearchRabbit', highlight: false, features: [true, false, false, false, true, true, false, false, false, false, false, false] },
  { name: 'Elicit', highlight: false, features: [true, true, false, true, false, false, false, false, false, false, false, false] },
];

function Comparison() {
  return (
    <section id="comparacao" className="bg-[#0d0d14] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="mb-4 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Comparação
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Por que SCIENTIA AI é diferente
          </h2>
          <p className="text-slate-400">
            Enquanto outras ferramentas cobrem partes do processo, SCIENTIA AI é a única plataforma
            end-to-end para pesquisa científica com IA.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="pb-4 text-left text-sm font-medium text-slate-500 pr-6">Recurso</th>
                {TOOLS.map(tool => (
                  <th key={tool.name} className={`pb-4 text-center text-sm font-semibold px-3 ${
                    tool.highlight ? 'text-violet-400' : 'text-slate-400'
                  }`}>
                    {tool.highlight && (
                      <span className="mb-1 block rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                        ⭐ Melhor escolha
                      </span>
                    )}
                    {tool.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature, fi) => (
                <tr key={feature}
                  className={`border-t ${fi % 2 === 0 ? 'border-white/5' : 'border-white/3 bg-white/1'}`}>
                  <td className="py-3 pr-6 text-sm text-slate-300">{feature}</td>
                  {TOOLS.map(tool => (
                    <td key={tool.name} className="py-3 text-center px-3">
                      {tool.features[fi] ? (
                        <Check className={`mx-auto h-5 w-5 ${tool.highlight ? 'text-violet-400' : 'text-emerald-500'}`} />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-slate-700" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'Pesquisadores e Pós-graduandos',
    desc: 'Reduza o tempo de revisão de literatura de semanas para horas. Foque na análise, não no trabalho repetitivo.',
    benefits: [
      'Fichamento automático de dezenas de papers por dia',
      'Organização da biblioteca pessoal com tags e projetos',
      'Exportação direta para dissertações e teses',
      'Assistente IA para responder dúvidas bibliográficas',
    ],
  },
  {
    icon: Building2,
    title: 'Institutos e Grupos de P&D',
    desc: 'Escale a capacidade de pesquisa do seu grupo sem aumentar a equipe. Colaboração em tempo real com rastreabilidade.',
    benefits: [
      'Workspace compartilhado para toda a equipe',
      'Controle de acesso granular por projeto',
      'Dashboard de produtividade da equipe',
      'API para integração com sistemas existentes',
    ],
  },
  {
    icon: Zap,
    title: 'Empresas de Inovação',
    desc: 'Transforme inteligência científica em vantagem competitiva. Monitoramento contínuo de avanços na sua área.',
    benefits: [
      'Alertas de novos papers relevantes',
      'Análise de tendências e oportunidades',
      'Relatórios executivos automáticos',
      'Integração com ferramentas de P&D existentes',
    ],
  },
];

function Benefits() {
  return (
    <section id="beneficios" className="bg-[#0a0a0f] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="mb-4 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Para quem é
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Desenhado para quem faz pesquisa de verdade
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {AUDIENCES.map(a => {
            const Icon = a.icon;
            return (
              <div key={a.title}
                className="rounded-2xl border border-white/10 bg-white/2 p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-900/40">
                  <Icon className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{a.title}</h3>
                <p className="mb-6 text-slate-400">{a.desc}</p>
                <ul className="space-y-3">
                  {a.benefits.map(b => (
                    <li key={b} className="flex items-start gap-3 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 49',
    period: '/mês',
    desc: 'Para pesquisadores individuais iniciando',
    highlight: false,
    cta: 'Começar grátis',
    features: [
      '1 workspace',
      '500 fichamentos/mês',
      'Busca semântica',
      'Assistente IA (50 msgs/mês)',
      'Exportação ABNT',
      'Suporte por e-mail',
    ],
    notIncluded: ['Revisão sistemática', 'Bibliometria avançada', 'API', 'Membros da equipe'],
  },
  {
    name: 'Researcher',
    price: 'R$ 149',
    period: '/mês',
    desc: 'Para pesquisadores sérios e pós-graduandos',
    highlight: true,
    badge: 'Mais popular',
    cta: 'Começar grátis',
    features: [
      '3 workspaces',
      'Fichamentos ilimitados',
      'Busca semântica avançada',
      'Assistente IA ilimitado',
      'Revisão sistemática (PRISMA)',
      'Bibliometria básica',
      'Grafo de conhecimento',
      'Motor de evidências',
      'Exportação (ABNT, APA, Vancouver)',
      'Suporte prioritário',
    ],
    notIncluded: ['API', 'Membros da equipe (até 2)'],
  },
  {
    name: 'Team',
    price: 'R$ 399',
    period: '/mês',
    desc: 'Para grupos de pesquisa e laboratórios',
    highlight: false,
    cta: 'Falar com vendas',
    features: [
      'Workspaces ilimitados',
      'Fichamentos ilimitados',
      'Todos os recursos do Researcher',
      'Até 10 membros da equipe',
      'Controle de acesso por função',
      'Dashboard de equipe',
      'API completa',
      'Bibliometria avançada',
      'Relatórios executivos',
      'Suporte dedicado (WhatsApp)',
      'Integração com sistemas externos',
      'SLA de 99.9%',
    ],
    notIncluded: [],
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    desc: 'Para institutos, empresas e universidades',
    highlight: false,
    cta: 'Falar com especialista',
    features: [
      'Tudo do plano Team',
      'Membros ilimitados',
      'Deploy on-premise ou cloud dedicada',
      'SSO / SAML / LDAP',
      'Contratos e NDA',
      'Treinamento personalizado',
      'Customer Success dedicado',
      'SLA customizado',
      'White-label disponível',
    ],
    notIncluded: [],
  },
];

function Pricing() {
  return (
    <section id="precos" className="bg-[#0d0d14] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge className="mb-4 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Preços
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Planos para cada etapa da jornada
          </h2>
          <p className="text-slate-400">
            Comece grátis por 14 dias. Sem cartão de crédito. Cancele a qualquer momento.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map(plan => (
            <div key={plan.name}
              className={`relative rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-violet-500/50 bg-gradient-to-b from-violet-900/30 to-transparent'
                  : 'border-white/10 bg-white/2'
              }`}>
              {plan.highlight && plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-lg font-bold ${plan.highlight ? 'text-violet-300' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="mb-1 text-slate-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{plan.desc}</p>
              </div>

              <Button asChild
                className={`mb-6 w-full ${
                  plan.highlight
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'border border-white/20 bg-transparent text-white hover:bg-white/5'
                }`}
                variant={plan.highlight ? 'default' : 'outline'}>
                <Link href={plan.cta.includes('vendas') || plan.cta.includes('especialista')
                  ? '#contato' : '/sign-up'}>
                  {plan.cta}
                </Link>
              </Button>

              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Todos os planos incluem 14 dias de trial grátis. Preços em BRL. Pagamento mensal ou anual (economize 20%).
        </p>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Dra. Ana Paula Ferreira',
    role: 'Professora • USP',
    text: 'Reduz o tempo de revisão de literatura pela metade. Meus alunos de mestrado conseguem produzir muito mais com a mesma energia.',
    stars: 5,
  },
  {
    name: 'Carlos Henrique Lima',
    role: 'Pesquisador de P&D • Embrapa',
    text: 'O motor de evidências mudou como avaliamos estudos. Antes levávamos dias para classificar metodologicamente. Agora é automático.',
    stars: 5,
  },
  {
    name: 'Isabela Monteiro',
    role: 'Doutoranda • UNICAMP',
    text: 'O assistente IA cita exatamente de quais papers cada informação vem. Isso é fundamental para minha tese. Ferramenta indispensável.',
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section className="bg-[#0a0a0f] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-xl text-center">
          <h2 className="text-3xl font-bold text-white">O que dizem os pesquisadores</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/2 p-6">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-4 text-slate-300 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div>
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-sm text-slate-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section id="contato" className="bg-[#0d0d14] py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-900/20 to-transparent p-12">
          <Badge className="mb-6 border-violet-500/30 bg-violet-900/30 text-violet-300">
            Pronto para começar?
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-white">
            Transforme sua pesquisa hoje mesmo
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            Junte-se a centenas de pesquisadores que já economizam horas toda semana
            com a SCIENTIA AI. Comece grátis, sem compromisso.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 bg-violet-600 px-10 text-base hover:bg-violet-700">
              <Link href="/sign-up">
                Começar 14 dias grátis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg"
              className="h-14 border-white/20 px-8 text-base text-white hover:bg-white/5">
              <a href="mailto:contato@scientia.ai">Falar com especialista</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0f] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">SCIENTIA AI</span>
            </div>
            <p className="text-sm text-slate-500">
              A plataforma premium de pesquisa científica com inteligência artificial auditável.
            </p>
          </div>
          {[
            { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Changelog', 'Roadmap'] },
            { title: 'Empresa', links: ['Sobre', 'Blog', 'Carreiras', 'Imprensa'] },
            { title: 'Suporte', links: ['Documentação', 'Status', 'Contato', 'Privacidade'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold text-white">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© 2026 SCIENTIA AI. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Lock className="h-4 w-4 text-slate-600" />
            <Globe className="h-4 w-4 text-slate-600" />
            <Shield className="h-4 w-4 text-slate-600" />
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Nav />
      <Hero />
      <Features />
      <PlatformScreens />
      <Comparison />
      <Benefits />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
