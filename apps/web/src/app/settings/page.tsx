'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Users, CreditCard, Key, Building2, Bell,
  Check, Eye, EyeOff, ExternalLink, ChevronRight, Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TABS = [
  { id: 'workspace', label: 'Workspace', Icon: Building2 },
  { id: 'members', label: 'Membros', Icon: Users },
  { id: 'billing', label: 'Plano & Billing', Icon: CreditCard },
  { id: 'api', label: 'Chaves de API', Icon: Key },
  { id: 'notifications', label: 'Notificações', Icon: Bell },
];

const MEMBERS = [
  { name: 'Ricardo Pace', email: 'ricardo.pace.jr@gmail.com', role: 'Superadmin', avatar: 'RP' },
  { name: 'Ana Silva', email: 'ana.silva@pesquisa.br', role: 'Researcher', avatar: 'AS' },
  { name: 'Carlos Mendes', email: 'carlos@lab.edu', role: 'Viewer', avatar: 'CM' },
];

const ROLES = ['Superadmin', 'Admin', 'Researcher', 'Viewer'];

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function ApiKeyField({ label, desc, storageKey, placeholder, docsUrl }: {
  label: string; desc: string; storageKey: string; placeholder: string; docsUrl: string;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) ?? '';
    setValue(stored);
  }, [storageKey]);

  const save = () => {
    localStorage.setItem(storageKey, value.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Obter chave grátis
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm font-mono outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button size="sm" onClick={save} variant={saved ? 'default' : 'outline'} className="gap-1 min-w-20">
          {saved ? <><Check className="h-3.5 w-3.5" /> Salvo</> : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('workspace');
  const [workspaceName, setWorkspaceName] = useState('Meu Workspace');
  const [wsSaved, setWsSaved] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Researcher');
  const [members, setMembers] = useState(MEMBERS);
  const [notifs, setNotifs] = useState({ email: true, weekly: true, mentions: true, updates: false });

  const saveWorkspace = () => {
    setWsSaved(true);
    setTimeout(() => setWsSaved(false), 2000);
  };

  const invite = () => {
    if (!inviteEmail.trim()) return;
    setMembers((m) => [...m, {
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: inviteEmail.slice(0, 2).toUpperCase(),
    }]);
    setInviteEmail('');
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">Workspace, membros, plano, chaves de API e notificações.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto pb-px">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Workspace */}
        {tab === 'workspace' && (
          <div className="space-y-6">
            <Section title="Informações do workspace">
              <div className="px-4 py-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome do workspace</label>
                  <input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                  />
                </div>
                <Button size="sm" onClick={saveWorkspace} className="gap-1">
                  {wsSaved ? <><Check className="h-3.5 w-3.5" /> Salvo</> : 'Salvar alterações'}
                </Button>
              </div>
              <Row label="ID do workspace" desc="Identificador único, não pode ser alterado">
                <code className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">ws_scientia_main</code>
              </Row>
              <Row label="Região" desc="Servidores e armazenamento de dados">
                <Badge variant="outline" className="text-xs">sa-east-1 (São Paulo)</Badge>
              </Row>
            </Section>

            <Section title="Zona de perigo" desc="Ações irreversíveis">
              <Row label="Excluir workspace" desc="Remove todos os dados permanentemente">
                <Button size="sm" variant="destructive" className="text-xs">Excluir workspace</Button>
              </Row>
            </Section>
          </div>
        )}

        {/* Members */}
        {tab === 'members' && (
          <div className="space-y-6">
            <Section title="Convidar membro">
              <div className="px-4 py-4 flex gap-2">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && invite()}
                  placeholder="email@dominio.com"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <Button size="sm" onClick={invite} disabled={!inviteEmail.trim()}>Convidar</Button>
              </div>
            </Section>

            <Section title={`Membros (${members.length})`}>
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {m.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{m.role}</Badge>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* Billing */}
        {tab === 'billing' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Plano Researcher+</p>
                  <Badge className="text-xs">Ativo</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">240 créditos de IA · 5 revisões ativas · 10.000 papers</p>
                <p className="text-xs text-muted-foreground mt-1">Próxima cobrança: R$ 49,00 em 16/07/2026</p>
              </div>
            </div>

            <Section title="Uso do mês">
              {[
                { label: 'Créditos de IA', used: 760, total: 1000 },
                { label: 'Papers salvos', used: 128, total: 10000 },
                { label: 'Revisões ativas', used: 2, total: 5 },
              ].map((item) => (
                <div key={item.label} className="px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.used} / {item.total}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${(item.used / item.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Section>

            <Section title="Planos disponíveis">
              {[
                { name: 'Starter', price: 'Grátis', features: '100 créditos · 1 revisão · 1.000 papers' },
                { name: 'Researcher+', price: 'R$ 49/mês', features: '1.000 créditos · 5 revisões · 10.000 papers', current: true },
                { name: 'Team', price: 'R$ 149/mês', features: '5.000 créditos · ilimitadas · membros ilimitados' },
              ].map((plan) => (
                <div key={plan.name} className={`flex items-center justify-between px-4 py-3 ${plan.current ? 'bg-primary/5' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{plan.name}</p>
                      {plan.current && <Badge className="text-xs">Atual</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.features}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{plan.price}</span>
                    {!plan.current && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* API Keys */}
        {tab === 'api' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300 space-y-1">
              <p className="font-medium flex items-center gap-1.5"><Key className="h-4 w-4" /> Chaves de API</p>
              <p className="text-xs text-amber-400/80">
                As chaves são salvas localmente no seu navegador (localStorage) e enviadas apenas nas suas requisições.
                Nunca são compartilhadas ou armazenadas em nossos servidores.
              </p>
            </div>

            <Section title="Assistente de IA" desc="Usado no chat do Assistente para respostas baseadas na sua biblioteca">
              <ApiKeyField
                label="Google Gemini (Grátis)"
                desc="gemini-1.5-flash — 1.500 req/dia gratuitamente, sem cartão de crédito"
                storageKey="scientia_gemini_key"
                placeholder="AIzaSy..."
                docsUrl="https://aistudio.google.com/app/apikey"
              />
            </Section>

            <Section title="Bases científicas (opcionais)" desc="Aumentam limites de requisição e acesso a dados extras">
              <ApiKeyField
                label="Semantic Scholar"
                desc="Aumenta de 1 req/s para 100 req/s"
                storageKey="scientia_s2_key"
                placeholder="sua-chave-s2"
                docsUrl="https://www.semanticscholar.org/product/api"
              />
              <ApiKeyField
                label="NCBI / PubMed"
                desc="Aumenta de 3 req/s para 10 req/s"
                storageKey="scientia_ncbi_key"
                placeholder="sua-chave-ncbi"
                docsUrl="https://www.ncbi.nlm.nih.gov/account/"
              />
              <ApiKeyField
                label="OpenAlex"
                desc="Acesso polite pool com e-mail cadastrado"
                storageKey="scientia_openalex_email"
                placeholder="seu@email.com"
                docsUrl="https://docs.openalex.org/how-to-use-the-api/api-overview"
              />
            </Section>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <Section title="Preferências de notificação">
            {(Object.entries({
              email: 'Notificações por e-mail',
              weekly: 'Resumo semanal de atividades',
              mentions: 'Menções em revisões colaborativas',
              updates: 'Novidades e atualizações da plataforma',
            }) as [keyof typeof notifs, string][]).map(([key, label]) => (
              <Row key={key} label={label}>
                <button
                  onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${notifs[key] ? 'bg-primary' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${notifs[key] ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </Row>
            ))}
          </Section>
        )}
      </div>
    </AppShell>
  );
}
