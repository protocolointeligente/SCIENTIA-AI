'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; authors: string; year: number }[];
}

const SUGGESTIONS = [
  'Quais são as principais evidências sobre treinamento de força para emagrecimento?',
  'Compare os estudos de jejum intermitente vs restrição calórica contínua',
  'Quais papers têm maior nível de evidência na minha biblioteca?',
  'Resuma os achados sobre suplementação proteica pós-treino',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content:
      'Olá! Sou o assistente científico da SCIENTIA AI. Posso responder perguntas sobre os artigos da sua biblioteca, comparar estudos, identificar lacunas de pesquisa e ajudar a construir argumentos baseados em evidências. Como posso ajudar?',
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simula resposta do assistente (será substituído por chamada real à API)
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Com base nos 128 artigos da sua biblioteca, encontrei evidências relevantes sobre este tópico. Os estudos de maior qualidade metodológica sugerem efeitos consistentes, especialmente em ensaios clínicos randomizados. Conecte a chave de API de IA nas configurações para respostas completas e rastreáveis.',
        sources: [
          { title: 'Effects of resistance training on fat mass', authors: 'Silva et al.', year: 2023 },
          { title: 'Protein intake and muscle hypertrophy', authors: 'Johnson et al.', year: 2022 },
        ],
      };
      setMessages((prev) => [...prev, reply]);
      setLoading(false);
    }, 1400);
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Assistente científico</h1>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              IA + sua biblioteca
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Respostas com grounding nos artigos da sua biblioteca e citações rastreáveis.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'assistant' ? 'bg-primary/20' : 'bg-white/10'}`}>
                {msg.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-white/5 border border-border' : 'bg-primary text-primary-foreground'}`}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="space-y-1">
                    {msg.sources.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-white/3 px-3 py-1.5 text-xs">
                        <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">
                          {s.authors} ({s.year}) — {s.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-border bg-white/5 px-4 py-3">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          {/* Suggestions (only on first message) */}
          {messages.length === 1 && !loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                Sugestões de perguntas
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-border bg-white/3 p-3 text-left text-sm text-muted-foreground hover:border-primary/40 hover:bg-accent/30 hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre seus artigos..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
            />
            <Button type="submit" size="sm" disabled={!input.trim() || loading} className="gap-1">
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
