import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  GitBranch,
  HeartHandshake,
  KeyRound,
  MessageCircle,
  Play,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  Users,
  Wifi,
  Workflow,
  Zap
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { criarFonteEventosAutenticada, requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { ConfirmarAcao } from "../componentes/ConfirmarAcao";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  Component as AnimatedTabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger
} from "@/components/ui/animated-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type {
  AgenteAutomacao,
  ConfiguracaoOperacional,
  InstanciaEvolution,
  ResumoAutomacoes,
  ResumoEvolution,
  WorkflowN8n
} from "../tipos";
import { traduzirEstadoIntegracao } from "../utilidades";

const iconesAgente: Record<string, ReactNode> = {
  "parser-reservas": <ReceiptText size={18} />,
  "expiracao-fila": <Bell size={18} />,
  "whatsapp-reservas": <MessageCircle size={18} />,
  "atendimento-ia": <SlidersHorizontal size={18} />,
  comprovativos: <Users size={18} />,
  "pos-venda": <HeartHandshake size={18} />
};

export function PaginaAdministracao() {
  const [resumoAutomacoes, setResumoAutomacoes] = useState<ResumoAutomacoes | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function carregarAutomacoes() {
    try {
      setResumoAutomacoes(await requisitarApi<ResumoAutomacoes>("/automacoes/status"));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar automações.");
    }
  }

  useEffect(() => {
    void carregarAutomacoes();
    const eventos = criarFonteEventosAutenticada();
    const atualizar = () => void carregarAutomacoes();
    ["COMMENT_PARSED", "RESERVATION_CREATED", "RESERVATION_EXPIRING", "PAYMENT_CONFIRMED"].forEach((evento) =>
      eventos.addEventListener(evento, atualizar)
    );
    return () => eventos.close();
  }, []);

  return (
    <CrmPageMotion>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="dash-titulo">Administração</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Sistema · WhatsApp, automações, n8n e configurações</p>
        </div>
        <Button variant="outline" size="lg" onClick={() => void carregarAutomacoes()}>
          <RefreshCcw size={16} />
          Atualizar
        </Button>
      </div>

      <AnimatedTabs defaultValue="whatsapp">
        <TabsList style={{ gridTemplateColumns: "repeat(auto-fit, minmax(5rem, 1fr))" }}>
          <TabsTrigger value="whatsapp"><Smartphone size={16} /> WhatsApp</TabsTrigger>
          <TabsTrigger value="automacoes"><SlidersHorizontal size={16} /> Automações</TabsTrigger>
          <TabsTrigger value="n8n"><GitBranch size={16} /> n8n</TabsTrigger>
          <TabsTrigger value="configuracoes"><Settings size={16} /> Config.</TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value="whatsapp"><ConteudoWhatsApp /></TabsContent>
          <TabsContent value="automacoes"><ConteudoAutomacoes resumo={resumoAutomacoes} /></TabsContent>
          <TabsContent value="n8n"><ConteudoN8n resumo={resumoAutomacoes} /></TabsContent>
          <TabsContent value="configuracoes"><ConteudoConfiguracoes resumo={resumoAutomacoes} /></TabsContent>
        </TabsContents>
      </AnimatedTabs>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

/* ── WhatsApp Tab ────────────────────────────────────────── */

function ConteudoWhatsApp() {
  const [resumo, setResumo] = useState<ResumoEvolution | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    nome: "emeu-vendas",
    etiqueta: "Linha de vendas",
    telefone: "244923456789",
    padrao: true
  });

  async function carregar() {
    setResumo(await requisitarApi<ResumoEvolution>("/evolution/resumo"));
  }

  useEffect(() => {
    void carregar().catch((e) => setMensagem(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A comunicar com a Evolution...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Falha.");
    } finally {
      setCarregando(false);
    }
  }

  async function criarInstancia(e: FormEvent) {
    e.preventDefault();
    await executar(
      () => requisitarApi("/evolution/instancias", { method: "POST", body: form }),
      "Instância criada."
    );
  }

  const conectadas = resumo?.instancias.filter((i) => ["open", "connected", "online"].includes(i.status.toLowerCase())).length ?? 0;

  return (
    <div className="grid gap-4">
      {/* KPI strip */}
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Evolution API", valor: resumo?.integracao.configurada ? "Configurada" : "Pendente", icone: <Wifi size={18} />, cor: resumo?.integracao.configurada ? "var(--success)" : "var(--warning)" },
          { rotulo: "Instâncias", valor: String(resumo?.instancias.length ?? 0), icone: <Smartphone size={18} />, cor: "var(--primary)" },
          { rotulo: "Conectadas", valor: String(conectadas), icone: <CheckCircle2 size={18} />, cor: "var(--success)" },
          { rotulo: "Linha padrão", valor: resumo?.instanciaPadraoId ? "Definida" : "Nenhuma", icone: <QrCode size={18} />, cor: resumo?.instanciaPadraoId ? "var(--success)" : "var(--warning)" },
        ] as const).map((kpi, i) => (
          <motion.div key={kpi.rotulo} className="dash-kpi-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 * i }}>
            <div className="dash-kpi-icon" style={{ background: `color-mix(in srgb, ${kpi.cor} 10%, transparent)`, color: kpi.cor }}>{kpi.icone}</div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{kpi.rotulo}</span>
              <strong className="dash-kpi-value">{kpi.valor}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {resumo?.integracao.managerUrl && (
        <Button asChild variant="outline" size="lg" className="w-fit">
          <a href={resumo.integracao.managerUrl} target="_blank" rel="noreferrer">
            <QrCode size={16} />
            Evolution Manager
          </a>
        </Button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Create instance */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <Smartphone size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Criar instância</span>
          </div>
          <form onSubmit={criarInstancia} className="grid gap-4 p-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="adm-nomeInst">Nome técnico</label>
              <Input id="adm-nomeInst" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="adm-etiqInst">Etiqueta</label>
              <Input id="adm-etiqInst" value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="adm-telInst">Telefone</label>
              <Input id="adm-telInst" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.padrao} onCheckedChange={(checked) => setForm({ ...form, padrao: checked === true })} />
              Tornar linha padrão
            </label>
            <Button size="lg" disabled={carregando}>
              <Wifi size={16} />
              Criar instância
            </Button>
          </form>
        </div>

        {/* Instances list */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <QrCode size={16} className="text-muted-foreground" />
            <span className="dash-section-title">QR Code e estado</span>
          </div>
          <div className="divide-y divide-border/50">
            {resumo?.instancias.length ? (
              resumo.instancias.map((inst) => (
                <InstanciaCard key={inst.id} instancia={inst} carregando={carregando} onExecutar={executar} />
              ))
            ) : (
              <div className="p-6">
                <EstadoVazio icone={<Smartphone />} titulo="Sem instâncias" detalhe="Crie uma linha para gerar o QR Code." />
              </div>
            )}
          </div>
        </div>
      </div>

      {mensagem && <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</p>}
    </div>
  );
}

/* ── Automações Tab ──────────────────────────────────────── */

function ConteudoAutomacoes({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const agentes = resumo?.agentes ?? [];
  const ativos = agentes.filter((a) => a.estado === "ATIVA").length;
  const pendentes = agentes.filter((a) => a.estado === "PENDENTE").length;

  return (
    <div className="grid gap-4">
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Agentes ativos", valor: String(ativos), icone: <SlidersHorizontal size={18} />, cor: "var(--success)" },
          { rotulo: "Pendências", valor: String(pendentes), icone: <Clock size={18} />, cor: pendentes ? "var(--warning)" : "var(--muted-foreground)" },
          { rotulo: "Comentários", valor: String(resumo?.metricas.comentarios ?? 0), icone: <Zap size={18} />, cor: "var(--primary)" },
          { rotulo: "Reservas", valor: String(resumo?.metricas.reservas ?? 0), icone: <ReceiptText size={18} />, cor: "var(--info)" },
        ] as const).map((kpi, i) => (
          <motion.div key={kpi.rotulo} className="dash-kpi-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 * i }}>
            <div className="dash-kpi-icon" style={{ background: `color-mix(in srgb, ${kpi.cor} 10%, transparent)`, color: kpi.cor }}>{kpi.icone}</div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{kpi.rotulo}</span>
              <strong className="dash-kpi-value">{kpi.valor}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {agentes.length ? (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {agentes.map((agente) => <AgenteCard key={agente.id} agente={agente} />)}
        </div>
      ) : (
        <EstadoVazio icone={<SlidersHorizontal />} titulo="Sem leitura operacional" detalhe="O backend ainda não retornou os agentes." />
      )}
    </div>
  );
}

/* ── n8n Tab ─────────────────────────────────────────────── */

function ConteudoN8n({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const workflows = resumo?.workflows ?? [];
  const prontos = workflows.filter((w) => w.estado === "PRONTO_PARA_IMPORTAR").length;
  const eventosCobertos = new Set(workflows.flatMap((w) => w.eventos)).size;
  const endpointsCobertos = new Set(workflows.flatMap((w) => w.endpointsBackend)).size;
  const n8nUrl = import.meta.env.VITE_N8N_URL ?? (import.meta.env.DEV ? "http://localhost:5678" : "");

  return (
    <div className="grid gap-4">
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Workflows prontos", valor: `${prontos}/${workflows.length}`, icone: <GitBranch size={18} />, cor: prontos === workflows.length && workflows.length ? "var(--success)" : "var(--warning)" },
          { rotulo: "Eventos cobertos", valor: String(eventosCobertos), icone: <Play size={18} />, cor: "var(--primary)" },
          { rotulo: "Endpoints", valor: String(endpointsCobertos), icone: <KeyRound size={18} />, cor: "var(--info)" },
          { rotulo: "Guardrails", valor: "Ativos", icone: <ShieldCheck size={18} />, cor: "var(--success)" },
        ] as const).map((kpi, i) => (
          <motion.div key={kpi.rotulo} className="dash-kpi-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 * i }}>
            <div className="dash-kpi-icon" style={{ background: `color-mix(in srgb, ${kpi.cor} 10%, transparent)`, color: kpi.cor }}>{kpi.icone}</div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{kpi.rotulo}</span>
              <strong className="dash-kpi-value">{kpi.valor}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      {n8nUrl && (
        <Button asChild size="lg" className="w-fit">
          <a href={n8nUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} />
            Abrir n8n
          </a>
        </Button>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workflows */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <GitBranch size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Workflows importáveis</span>
          </div>
          {workflows.length ? (
            <div className="divide-y divide-border/50">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center gap-4 px-4 py-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    workflow.estado === "PRONTO_PARA_IMPORTAR" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {workflow.estado === "PRONTO_PARA_IMPORTAR" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{workflow.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{workflow.arquivo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:block text-xs tabular-nums text-muted-foreground">{workflow.endpointsBackend.length} ep</span>
                    <Badge variant={workflow.estado === "PRONTO_PARA_IMPORTAR" ? "success" : "warning"} className="text-[0.6rem]">
                      {workflow.estado === "PRONTO_PARA_IMPORTAR" ? "Pronto" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EstadoVazio icone={<GitBranch />} titulo="Sem workflows" detalhe="O backend ainda não retornou o contrato n8n." />
            </div>
          )}
        </div>

        {/* Contract */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <KeyRound size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Contrato de automação</span>
          </div>
          <div className="grid gap-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Webhook backend</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {resumo?.configuracoes.find((c) => c.nome === "Webhook de eventos")?.valor ?? "—"}
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Endpoints n8n</span>
              <strong className="tabular-nums">{endpointsCobertos}</strong>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Arquivos</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">n8n/workflows</code>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-4">
            {Array.from(new Set(workflows.flatMap((w) => w.guardrails))).map((guardrail) => (
              <Badge key={guardrail} variant="secondary" className="text-[0.6rem]">
                <ShieldCheck size={12} />
                {guardrail}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Configurações Tab ───────────────────────────────────── */

function ConteudoConfiguracoes({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const configuracoes = resumo?.configuracoes ?? [];
  const porGrupo = useMemo(() => agruparPorGrupo(configuracoes), [configuracoes]);
  const integracoesConfiguradas = resumo?.integracoes.filter((i) => i.estado === "CONFIGURADA").length ?? 0;
  const pendencias = [
    ...(resumo?.configuracoes.filter((c) => c.estado === "PENDENTE") ?? []),
    ...(resumo?.integracoes.filter((i) => i.estado === "PENDENTE") ?? [])
  ].length;

  return (
    <div className="grid gap-4">
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Parâmetros", valor: String(configuracoes.length), icone: <Settings size={18} />, cor: "var(--primary)" },
          { rotulo: "Integrações", valor: String(integracoesConfiguradas), icone: <Store size={18} />, cor: "var(--success)" },
          { rotulo: "Pendências", valor: String(pendencias), icone: <Shield size={18} />, cor: pendencias ? "var(--warning)" : "var(--muted-foreground)" },
          { rotulo: "Verificadas", valor: String(resumo?.integracoes.length ?? 0), icone: <CheckCircle2 size={18} />, cor: "var(--info)" },
        ] as const).map((kpi, i) => (
          <motion.div key={kpi.rotulo} className="dash-kpi-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 * i }}>
            <div className="dash-kpi-icon" style={{ background: `color-mix(in srgb, ${kpi.cor} 10%, transparent)`, color: kpi.cor }}>{kpi.icone}</div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{kpi.rotulo}</span>
              <strong className="dash-kpi-value">{kpi.valor}</strong>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(porGrupo).map(([grupo, itens]) => (
          <div key={grupo} className="dash-section-card">
            <div className="dash-section-header">
              <Settings size={16} className="text-muted-foreground" />
              <span className="dash-section-title">{grupo}</span>
            </div>
            <div className="divide-y divide-border/50">
              {itens.map((item) => (
                <div key={`${item.grupo}-${item.nome}`} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detalhe}</p>
                  </div>
                  <code className="hidden sm:block rounded bg-muted px-2 py-0.5 text-[0.65rem]">{item.valor}</code>
                  <Badge variant={item.estado === "ATIVA" ? "success" : item.estado === "PENDENTE" ? "warning" : "secondary"} className="text-[0.6rem]">
                    {item.estado === "ATIVA" ? "Ativa" : item.estado === "PENDENTE" ? "Pendente" : "Off"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="dash-section-card">
          <div className="dash-section-header">
            <Workflow size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Integrações</span>
          </div>
          {resumo?.integracoes.length ? (
            <div className="divide-y divide-border/50">
              {resumo.integracoes.map((integracao) => (
                <div key={integracao.nome} className="flex items-center gap-3 px-4 py-2.5">
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    integracao.estado === "CONFIGURADA" ? "bg-success/10 text-success" :
                    integracao.estado === "PENDENTE" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <Workflow size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{integracao.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{integracao.detalhe}</p>
                  </div>
                  <Badge variant={integracao.estado === "CONFIGURADA" ? "success" : integracao.estado === "PENDENTE" ? "warning" : "secondary"} className="text-[0.6rem]">
                    {traduzirEstadoIntegracao(integracao.estado)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EstadoVazio icone={<Workflow />} titulo="Sem integrações" detalhe="O backend ainda não retornou status." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function AgenteCard({ agente }: { agente: AgenteAutomacao }) {
  const ativo = agente.estado === "ATIVA";

  return (
    <div className={`dash-section-card ${ativo ? "ring-1 ring-success/20" : ""}`}>
      <div className="grid gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ativo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {iconesAgente[agente.id] ?? <SlidersHorizontal size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{agente.nome}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{agente.descricao}</p>
          </div>
          <Badge variant={ativo ? "success" : agente.estado === "PENDENTE" ? "warning" : "secondary"} className="text-[0.6rem] shrink-0">
            {agente.estado === "ATIVA" ? "Ativo" : agente.estado === "PENDENTE" ? "Pendente" : "Off"}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div><span className="block text-muted-foreground">Gatilho</span><strong className="truncate block">{agente.gatilho}</strong></div>
          <div><span className="block text-muted-foreground">Canal</span><strong className="truncate block">{agente.canal}</strong></div>
          <div><span className="block text-muted-foreground">Origem</span><strong className="truncate block">{agente.origem}</strong></div>
        </div>
      </div>
    </div>
  );
}

function InstanciaCard({
  instancia,
  carregando,
  onExecutar
}: {
  instancia: InstanciaEvolution;
  carregando: boolean;
  onExecutar: (acao: () => Promise<unknown>, sucesso: string) => Promise<void>;
}) {
  const [confirmarRemover, setConfirmarRemover] = useState(false);

  return (
    <div className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm">{instancia.etiqueta || instancia.nome}</strong>
          <span className="block truncate text-xs text-muted-foreground">{instancia.nome} · {instancia.telefone || "sem telefone"}</span>
        </div>
        <Badge variant={["open", "connected", "online"].includes(instancia.status.toLowerCase()) ? "success" : instancia.status.toLowerCase().includes("error") ? "destructive" : "warning"} className="text-[0.6rem]">
          {instancia.status}
        </Badge>
      </div>

      {instancia.qrCode || instancia.pairingCode ? (
        <div className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[120px_1fr]">
          {instancia.qrCode && <img src={instancia.qrCode} alt={`QR Code ${instancia.nome}`} className="aspect-square w-full rounded-lg border object-contain" />}
          <div className="grid content-start gap-2">
            <strong className="text-sm">Escaneie no WhatsApp</strong>
            <span className="text-xs text-muted-foreground">Dispositivos conectados &gt; Conectar</span>
            {instancia.pairingCode && <code className="w-fit rounded bg-muted px-2 py-1 text-xs">{instancia.pairingCode}</code>}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center gap-2 rounded-lg border border-dashed bg-background p-4 text-center text-xs text-muted-foreground">
          <QrCode size={18} />
          <span>Sem QR disponível. Clique em conectar.</span>
        </div>
      )}

      {instancia.ultimoErro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{instancia.ultimoErro}</p>}

      <div className="flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/conectar`, { method: "POST" }), "Pedido de conexão enviado.")}>
          <QrCode size={14} /> Conectar
        </Button>
        <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/estado`, { method: "POST" }), "Estado atualizado.")}>
          <RefreshCcw size={14} /> Estado
        </Button>
        {!instancia.padrao && (
          <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/padrao`, { method: "POST" }), "Linha padrão atualizada.")}>
            <CheckCircle2 size={14} /> Padrão
          </Button>
        )}
        <Button variant="destructive" size="sm" disabled={carregando} onClick={() => setConfirmarRemover(true)}>
          <Ban size={14} /> Remover
        </Button>
      </div>

      <ConfirmarAcao
        aberto={confirmarRemover}
        titulo="Remover instância"
        descricao={`Remover a instância ${instancia.etiqueta || instancia.nome}? Esta acção desconecta a linha WhatsApp.`}
        textoBotao="Remover"
        variante="destructive"
        onConfirmar={() => {
          setConfirmarRemover(false);
          void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}`, { method: "DELETE" }), "Instância removida.");
        }}
        onCancelar={() => setConfirmarRemover(false)}
      />
    </div>
  );
}

function agruparPorGrupo(configuracoes: ConfiguracaoOperacional[]) {
  return configuracoes.reduce<Record<string, ConfiguracaoOperacional[]>>((grupos, item) => {
    grupos[item.grupo] = [...(grupos[item.grupo] ?? []), item];
    return grupos;
  }, {});
}
