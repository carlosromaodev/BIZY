import {
  AlertTriangle,
  Ban,
  Bell,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Eye,
  GitBranch,
  HeartHandshake,
  Image,
  Instagram,
  KeyRound,
  LogOut,
  MessageCircle,
  Play,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  User,
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
  InstanciaInstagram,
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
          <TabsTrigger value="instagram"><Instagram size={16} /> Instagram</TabsTrigger>
          <TabsTrigger value="automacoes"><SlidersHorizontal size={16} /> Automações</TabsTrigger>
          <TabsTrigger value="n8n"><GitBranch size={16} /> n8n</TabsTrigger>
          <TabsTrigger value="configuracoes"><Settings size={16} /> Config.</TabsTrigger>
        </TabsList>
        <TabsContents>
          <TabsContent value="whatsapp"><ConteudoWhatsApp /></TabsContent>
          <TabsContent value="instagram"><ConteudoInstagram /></TabsContent>
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

/* ── Instagram Tab ──────────────────────────────────────── */

const STATUS_INSTAGRAM_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  CONECTADA: { label: "Conectada", variant: "success" },
  CRIADA: { label: "Criada", variant: "secondary" },
  AGUARDANDO_2FA: { label: "Aguardando 2FA", variant: "warning" },
  CHALLENGE: { label: "Challenge", variant: "warning" },
  SESSAO_EXPIRADA: { label: "Sessão expirada", variant: "destructive" },
  ERRO: { label: "Erro", variant: "destructive" },
};

function ConteudoInstagram() {
  const [instancias, setInstancias] = useState<InstanciaInstagram[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [etapa2fa, setEtapa2fa] = useState(false);
  const [form, setForm] = useState({
    instancia: "instagram-principal",
    username: "",
    password: "",
    verificationCode: ""
  });

  async function carregar() {
    try {
      const dados = await requisitarApi<{ instancias: InstanciaInstagram[] }>("/instagram/instancias");
      setInstancias(dados.instancias ?? []);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar Instagram.");
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function fazerLogin(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setMensagem("A conectar ao Instagram...");

    try {
      await requisitarApi("/instagram/login", {
        method: "POST",
        body: {
          instancia: form.instancia,
          username: form.username,
          password: form.password,
          ...(etapa2fa && form.verificationCode ? { verificationCode: form.verificationCode } : {})
        }
      });
      setMensagem("Login bem-sucedido! A conta está conectada.");
      setEtapa2fa(false);
      setForm((f) => ({ ...f, password: "", verificationCode: "" }));
      await carregar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no login.";
      if (msg.includes("2FA") || msg.includes("dois fatores") || msg.includes("verification_code")) {
        setEtapa2fa(true);
        setMensagem("Autenticação de dois fatores necessária. Insira o código abaixo.");
      } else {
        setMensagem(msg);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function desconectar(id: string) {
    setCarregando(true);
    setMensagem("A desconectar...");
    try {
      await requisitarApi(`/instagram/instancias/${id}/desconectar`, { method: "POST" });
      setMensagem("Instagram desconectado.");
      await carregar();
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao desconectar.");
    } finally {
      setCarregando(false);
    }
  }

  const conectadas = instancias.filter((i) => (i.statusBridge ?? i.status) === "CONECTADA").length;

  return (
    <div className="grid gap-4">
      {/* KPI strip */}
      <div className="dash-kpi-grid">
        {([
          { rotulo: "Instagrapi Bridge", valor: instancias.length > 0 || conectadas > 0 ? "Activo" : "Pendente", icone: <Instagram size={18} />, cor: conectadas > 0 ? "var(--success)" : "var(--warning)" },
          { rotulo: "Instâncias", valor: String(instancias.length), icone: <User size={18} />, cor: "var(--primary)" },
          { rotulo: "Conectadas", valor: String(conectadas), icone: <CheckCircle2 size={18} />, cor: conectadas > 0 ? "var(--success)" : "var(--muted-foreground)" },
          { rotulo: "Polling DMs", valor: conectadas > 0 ? "Activo" : "Inactivo", icone: <MessageCircle size={18} />, cor: conectadas > 0 ? "var(--success)" : "var(--muted-foreground)" },
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
        {/* Login form */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <Instagram size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Conectar conta Instagram</span>
          </div>
          <form onSubmit={fazerLogin} className="grid gap-4 p-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="ig-instancia">Nome da instância</label>
              <Input id="ig-instancia" placeholder="instagram-principal" value={form.instancia} onChange={(e) => setForm({ ...form, instancia: e.target.value })} />
              <p className="text-xs text-muted-foreground">Identificador interno. Exemplo: instagram-vendas</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="ig-username">Username Instagram</label>
              <Input id="ig-username" placeholder="@suaconta" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="ig-password">Password</label>
              <Input id="ig-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            {etapa2fa && (
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="ig-2fa">Código 2FA</label>
                <Input id="ig-2fa" inputMode="numeric" placeholder="123456" value={form.verificationCode} onChange={(e) => setForm({ ...form, verificationCode: e.target.value })} />
                <p className="text-xs text-muted-foreground">Insira o código do autenticador ou SMS.</p>
              </div>
            )}
            <Button size="lg" disabled={carregando || !form.username || !form.password}>
              <Instagram size={16} />
              {etapa2fa ? "Verificar 2FA" : "Conectar Instagram"}
            </Button>
          </form>
        </div>

        {/* Instances list */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <User size={16} className="text-muted-foreground" />
            <span className="dash-section-title">Contas conectadas</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void carregar()}>
              <RefreshCcw size={14} />
            </Button>
          </div>
          <div className="divide-y divide-border/50">
            {instancias.length ? (
              instancias.map((inst) => (
                <InstanciaInstagramCard key={inst.id} instancia={inst} carregando={carregando} onDesconectar={desconectar} />
              ))
            ) : (
              <div className="p-6">
                <EstadoVazio icone={<Instagram />} titulo="Sem contas" detalhe="Conecte uma conta Instagram usando o formulário ao lado." />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="dash-section-card">
        <div className="dash-section-header">
          <ShieldCheck size={16} className="text-muted-foreground" />
          <span className="dash-section-title">Funcionalidades disponíveis</span>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            { icone: <MessageCircle size={16} />, titulo: "Receber DMs", detalhe: "Polling automático de mensagens directas novas" },
            { icone: <Send size={16} />, titulo: "Enviar DMs", detalhe: "Responder mensagens directas (texto e imagens)" },
            { icone: <Eye size={16} />, titulo: "Consultar perfis", detalhe: "Ver informações públicas de qualquer utilizador" },
            { icone: <Camera size={16} />, titulo: "Media recebida", detalhe: "Processar fotos, vídeos e stories partilhados" },
            { icone: <Users size={16} />, titulo: "Multi-conta", detalhe: "Conectar múltiplas contas Instagram em simultâneo" },
            { icone: <Image size={16} />, titulo: "Enviar fotos", detalhe: "Enviar imagens nas mensagens directas" },
          ] as const).map((cap) => (
            <div key={cap.titulo} className="flex items-start gap-3 rounded-lg border bg-background p-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-500/10 text-pink-500">{cap.icone}</div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{cap.titulo}</p>
                <p className="text-xs text-muted-foreground">{cap.detalhe}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            Fase de testes: utiliza a API privada do Instagram (instagrapi). Para produção comercial, migrar para a API oficial do Instagram (Graph API).
          </p>
        </div>
      </div>

      {mensagem && <p className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</p>}
    </div>
  );
}

function InstanciaInstagramCard({
  instancia,
  carregando,
  onDesconectar
}: {
  instancia: InstanciaInstagram;
  carregando: boolean;
  onDesconectar: (id: string) => void;
}) {
  const [confirmarRemover, setConfirmarRemover] = useState(false);
  const statusReal = instancia.statusBridge ?? instancia.status;
  const statusInfo = STATUS_INSTAGRAM_LABELS[statusReal] ?? { label: statusReal, variant: "secondary" as const };
  const ultimaPoll = instancia.ultimaPollEmBridge ?? instancia.ultimaPollEm;

  return (
    <div className="grid gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm">@{instancia.username}</strong>
          <span className="block truncate text-xs text-muted-foreground">{instancia.nome}</span>
        </div>
        <Badge variant={statusInfo.variant} className="text-[0.6rem]">
          {statusInfo.label}
        </Badge>
      </div>

      {ultimaPoll && (
        <p className="text-xs text-muted-foreground">
          Último poll: {new Date(ultimaPoll).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}

      {(instancia.ultimoErroBridge ?? instancia.ultimoErro) && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {instancia.ultimoErroBridge ?? instancia.ultimoErro}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button variant="destructive" size="sm" disabled={carregando} onClick={() => setConfirmarRemover(true)}>
          <LogOut size={14} /> Desconectar
        </Button>
      </div>

      <ConfirmarAcao
        aberto={confirmarRemover}
        titulo="Desconectar Instagram"
        descricao={`Desconectar a conta @${instancia.username}? O polling de DMs será interrompido.`}
        textoBotao="Desconectar"
        variante="destructive"
        onConfirmar={() => {
          setConfirmarRemover(false);
          onDesconectar(instancia.id);
        }}
        onCancelar={() => setConfirmarRemover(false)}
      />
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
