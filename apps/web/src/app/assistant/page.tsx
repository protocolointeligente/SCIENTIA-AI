'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, Lightbulb, Key, Settings } from 'lucide-react';
import Link from 'next/link';
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
  'Quais papers têm maior nível de evidência sobre suplementação proteica?',
  'Explique o protocolo PRISMA para revisões sistemáticas',
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content:
    'Olá! Sou o assistente científico da SCIENTIA AI. Posso ajudar com perguntas sobre pesquisa científica, metodologia, análise de evidências e muito mais. Como posso ajudar?',
};

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-white/10' : 'bg-primary/20'}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-white/5 border border-border'
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1">
            {msg.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-white/3 px-3 py-1.5 text-xs">
                <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{s.authors} ({s.year}) — {s.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = localStorage.getItem('scientia_gemini_key') ?? '';
    setHasKey(key.length > 10);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = localStorage.getItem('scientia_gemini_key') ?? '';
      const history = messages
        .filter((m) => m.id !== '0') // exclude initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, apiKey }),
      });

      const data = await res.json() as { reply: string; error?: string };

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, reply]);

      // If key worked, mark as having key
      if (!data.error || data.error === '') {
        setHasKey(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Não consegui conectar ao servidor. Verifique sua conexão e tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">Assistente científico</h1>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              {hasKey ? 'Gemini 1.5 Flash' : 'IA'}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Respostas baseadas em evidências científicas e nos artigos da sua biblioteca.
          </p>
        </div>

        {/* No key banner */}
        {!hasKey && (
          <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/5 px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Key className="h-4 w-4 shrink-0" />
              <span>
                Configure sua chave do <strong>Google Gemini</strong> para ativar respostas de IA.{' '}
                <span className="text-amber-300">É gratuita — 1.500 req/dia sem cartão de crédito.</span>
              </span>
            </div>
            <Link href="/settings">
              <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10">
                <Settings className="h-3.5 w-3.5" />
                Configurar
              </Button>
            </Link>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
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

          {/* Suggestions */}
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
              placeholder={hasKey ? 'Pergunte sobre pesquisa científica...' : 'Digite sua pergunta (configure a chave para respostas IA)...'}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
            />
            <Button type="submit" size="sm" disabled={!input.trim() || loading} className="gap-1">
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </form>
          {!hasKey && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Sem chave: respostas simuladas. Com chave Gemini: IA real, gratuita.{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Obter chave gratuita →
              </a>
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
