import {
  AlertTriangle,
  Ban,
  Blocks,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Instagram,
  KeyRound,
  Lock,
  LogOut,
  MessageCircle,
  QrCode,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Wifi,
  Workflow
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { criarFonteEventosAutenticada, requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { ConfirmarAcao } from "../componentes/ConfirmarAcao";
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

/* ── Aba activa ────────────────────────────────────────── */

type Aba = "whatsapp" | "instagram" | "automacoes" | "n8n" | "modulos" | "configuracoes";

const ABAS: { id: Aba; rotulo: string; icone: ReactNode }[] = [
  { id: "whatsapp", rotulo: "WhatsApp", icone: <Smartphone size={15} /> },
  { id: "instagram", rotulo: "Instagram", icone: <Instagram size={15} /> },
  { id: "automacoes", rotulo: "Automações", icone: <Settings size={15} /> },
  { id: "n8n", rotulo: "n8n", icone: <GitBranch size={15} /> },
  { id: "modulos", rotulo: "Módulos", icone: <Blocks size={15} /> },
  { id: "configuracoes", rotulo: "Configurações", icone: <Settings size={15} /> },
];

export function PaginaAdministracao() {
  const [resumoAutomacoes, setResumoAutomacoes] = useState<ResumoAutomacoes | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [aba, setAba] = useState<Aba>("whatsapp");

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
    <div className="adm-page">
      {/* Header */}
      <header className="adm-header">
        <h1 className="adm-title">Administração</h1>
        <button className="adm-refresh" onClick={() => void carregarAutomacoes()} type="button" title="Atualizar">
          <RefreshCcw size={15} />
        </button>
      </header>

      {/* Tab bar */}
      <nav className="adm-tabs" role="tablist">
        {ABAS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={aba === t.id}
            className={`adm-tab ${aba === t.id ? "adm-tab--active" : ""}`}
            onClick={() => setAba(t.id)}
            type="button"
          >
            {t.icone}
            <span>{t.rotulo}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="adm-content">
        {aba === "whatsapp" && <ConteudoWhatsApp />}
        {aba === "instagram" && <ConteudoInstagram />}
        {aba === "automacoes" && <ConteudoAutomacoes resumo={resumoAutomacoes} />}
        {aba === "n8n" && <ConteudoN8n resumo={resumoAutomacoes} />}
        {aba === "modulos" && <ConteudoModulos />}
        {aba === "configuracoes" && <ConteudoConfiguracoes resumo={resumoAutomacoes} />}
      </div>

      {mensagem && <p className="adm-toast" aria-live="polite">{mensagem}</p>}
    </div>
  );
}

/* ── WhatsApp ──────────────────────────────────────────── */

function ConteudoWhatsApp() {
  const [resumo, setResumo] = useState<ResumoEvolution | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({ nome: "emeu-vendas", etiqueta: "Linha de vendas", telefone: "244923456789", padrao: true });

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
    await executar(() => requisitarApi("/evolution/instancias", { method: "POST", body: form }), "Instância criada.");
  }

  const conectadas = resumo?.instancias.filter((i) => ["open", "connected", "online"].includes(i.status.toLowerCase())).length ?? 0;

  return (
    <div className="adm-section-grid">
      {/* Status bar */}
      <div className="adm-status-bar">
        <StatusPill icone={<Wifi size={13} />} rotulo="Evolution" valor={resumo?.integracao.configurada ? "Configurada" : "Pendente"} ok={resumo?.integracao.configurada} />
        <StatusPill icone={<Smartphone size={13} />} rotulo="Instâncias" valor={String(resumo?.instancias.length ?? 0)} />
        <StatusPill icone={<CheckCircle2 size={13} />} rotulo="Conectadas" valor={String(conectadas)} ok={conectadas > 0} />
      </div>

      {resumo?.integracao.managerUrl && (
        <a href={resumo.integracao.managerUrl} target="_blank" rel="noreferrer" className="adm-link-externo">
          <QrCode size={14} /> Evolution Manager <ExternalLink size={12} />
        </a>
      )}

      <div className="adm-two-col">
        {/* Formulário */}
        <div className="adm-card">
          <div className="adm-card-head">
            <Smartphone size={15} />
            <span>Criar instância</span>
          </div>
          <form onSubmit={criarInstancia} className="adm-card-body">
            <Campo id="adm-nomeInst" label="Nome técnico" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <Campo id="adm-etiqInst" label="Etiqueta" value={form.etiqueta} onChange={(v) => setForm({ ...form, etiqueta: v })} />
            <Campo id="adm-telInst" label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} inputMode="tel" />
            <label className="adm-check">
              <Checkbox checked={form.padrao} onCheckedChange={(c) => setForm({ ...form, padrao: c === true })} />
              Tornar linha padrão
            </label>
            <Button size="lg" disabled={carregando} className="w-full">Criar instância</Button>
          </form>
        </div>

        {/* Lista */}
        <div className="adm-card">
          <div className="adm-card-head">
            <QrCode size={15} />
            <span>QR Code e estado</span>
          </div>
          <div className="adm-card-list">
            {resumo?.instancias.length ? (
              resumo.instancias.map((inst) => <InstanciaCard key={inst.id} instancia={inst} carregando={carregando} onExecutar={executar} />)
            ) : (
              <div className="adm-empty"><Smartphone size={20} /><span>Sem instâncias</span></div>
            )}
          </div>
        </div>
      </div>

      {mensagem && <p className="adm-toast" aria-live="polite">{mensagem}</p>}
    </div>
  );
}

/* ── Instagram ─────────────────────────────────────────── */

const STATUS_IG: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  CONECTADA: { label: "Conectada", variant: "success" },
  CRIADA: { label: "Criada", variant: "secondary" },
  AGUARDANDO_2FA: { label: "2FA", variant: "warning" },
  CHALLENGE: { label: "Challenge", variant: "warning" },
  SESSAO_EXPIRADA: { label: "Expirada", variant: "destructive" },
  ERRO: { label: "Erro", variant: "destructive" },
};

function ConteudoInstagram() {
  const [instancias, setInstancias] = useState<InstanciaInstagram[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [etapa2fa, setEtapa2fa] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [sucessoForm, setSucessoForm] = useState("");
  const [erroLista, setErroLista] = useState("");
  const [form, setForm] = useState({ instancia: "instagram-principal", username: "", password: "", verificationCode: "" });

  async function carregar() {
    try {
      const dados = await requisitarApi<{ instancias: InstanciaInstagram[] }>("/instagram/instancias");
      setInstancias(dados.instancias ?? []);
      setErroLista("");
    } catch (e) {
      setErroLista(e instanceof Error ? e.message : "Erro ao carregar Instagram.");
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function fazerLogin(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErroForm("");
    setSucessoForm("");
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
      setSucessoForm("Conectado com sucesso!");
      setEtapa2fa(false);
      setForm((f) => ({ ...f, password: "", verificationCode: "" }));
      await carregar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no login.";
      if (msg.includes("2FA") || msg.includes("dois fatores") || msg.includes("verification_code")) {
        setEtapa2fa(true);
        setErroForm("Código 2FA necessário. Insira o código do authenticator.");
      } else if (msg.includes("Cooldown") || msg.includes("Aguarde")) {
        setErroForm(msg);
      } else {
        setErroForm(msg);
      }
    } finally {
      setCarregando(false);
    }
  }

  async function desconectar(id: string) {
    setCarregando(true);
    setErroLista("");
    try {
      await requisitarApi(`/instagram/instancias/${id}/desconectar`, { method: "POST" });
      await carregar();
    } catch (e) {
      setErroLista(e instanceof Error ? e.message : "Erro ao desconectar.");
    } finally {
      setCarregando(false);
    }
  }

  const conectadas = instancias.filter((i) => (i.statusBridge ?? i.status) === "CONECTADA").length;

  return (
    <div className="adm-section-grid">
      <div className="adm-status-bar">
        <StatusPill icone={<Instagram size={13} />} rotulo="Bridge" valor={conectadas > 0 ? "Activo" : "Pendente"} ok={conectadas > 0} />
        <StatusPill icone={<CheckCircle2 size={13} />} rotulo="Conectadas" valor={String(conectadas)} ok={conectadas > 0} />
        <StatusPill icone={<MessageCircle size={13} />} rotulo="DM Polling" valor={conectadas > 0 ? "Activo" : "Inactivo"} ok={conectadas > 0} />
      </div>

      <div className="adm-two-col">
        {/* Login */}
        <div className="adm-card">
          <div className="adm-card-head">
            <Instagram size={15} />
            <span>Conectar conta</span>
          </div>
          <form onSubmit={fazerLogin} className="adm-card-body">
            <Campo id="ig-inst" label="Identificador da instância" value={form.instancia} onChange={(v) => setForm({ ...form, instancia: v })} />
            <Campo id="ig-user" label="Utilizador Instagram" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="nome_de_utilizador" />
            <Campo id="ig-pass" label="Palavra-passe" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
            {etapa2fa && (
              <Campo id="ig-2fa" label="Código 2FA" value={form.verificationCode} onChange={(v) => setForm({ ...form, verificationCode: v })} inputMode="numeric" placeholder="123456" />
            )}
            <Button size="lg" disabled={carregando || !form.username || !form.password} className="w-full">
              {carregando ? "A conectar..." : etapa2fa ? "Verificar 2FA" : "Conectar"}
            </Button>
            {erroForm && <p className="adm-form-erro" role="alert">{erroForm}</p>}
            {sucessoForm && <p className="adm-form-sucesso" role="status">{sucessoForm}</p>}
            <p className="adm-form-nota">
              Credenciais utilizadas apenas para autenticação via API privada. Não são armazenadas no servidor.
            </p>
          </form>
        </div>

        {/* Lista */}
        <div className="adm-card">
          <div className="adm-card-head">
            <CheckCircle2 size={15} />
            <span>Contas conectadas</span>
            <button className="adm-card-action" onClick={() => void carregar()} type="button"><RefreshCcw size={13} /></button>
          </div>
          <div className="adm-card-list">
            {instancias.length ? instancias.map((inst) => (
              <IgCard key={inst.id} instancia={inst} carregando={carregando} onDesconectar={desconectar} />
            )) : (
              <div className="adm-empty"><Instagram size={20} /><span>Sem contas conectadas</span></div>
            )}
          </div>
          {erroLista && <p className="adm-form-erro" style={{ margin: "0.75rem 1rem" }}>{erroLista}</p>}
        </div>
      </div>

      <div className="adm-aviso">
        <AlertTriangle size={13} />
        Fase de testes — API privada do Instagram (instagrapi). Para produção, migrar para Graph API.
      </div>
    </div>
  );
}

/* ── Automações ────────────────────────────────────────── */

function ConteudoAutomacoes({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const agentes = resumo?.agentes ?? [];
  const ativos = agentes.filter((a) => a.estado === "ATIVA").length;

  return (
    <div className="adm-section-grid">
      <div className="adm-status-bar">
        <StatusPill icone={<CheckCircle2 size={13} />} rotulo="Activos" valor={`${ativos}/${agentes.length}`} ok={ativos > 0} />
        <StatusPill icone={<Clock size={13} />} rotulo="Comentários" valor={String(resumo?.metricas.comentarios ?? 0)} />
        <StatusPill icone={<KeyRound size={13} />} rotulo="Reservas" valor={String(resumo?.metricas.reservas ?? 0)} />
      </div>

      {agentes.length ? (
        <div className="adm-agentes-grid">
          {agentes.map((a) => {
            const ativo = a.estado === "ATIVA";
            return (
              <div key={a.id} className={`adm-agente ${ativo ? "adm-agente--on" : ""}`}>
                <div className="adm-agente-top">
                  <span className={`adm-agente-dot ${ativo ? "adm-agente-dot--on" : ""}`} />
                  <strong>{a.nome}</strong>
                </div>
                <p className="adm-agente-desc">{a.descricao}</p>
                <div className="adm-agente-meta">
                  <span>{a.gatilho}</span>
                  <span>{a.canal}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="adm-card"><div className="adm-empty"><Settings size={20} /><span>Sem leitura operacional</span></div></div>
      )}
    </div>
  );
}

/* ── n8n ───────────────────────────────────────────────── */

function ConteudoN8n({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const workflows = resumo?.workflows ?? [];
  const prontos = workflows.filter((w) => w.estado === "PRONTO_PARA_IMPORTAR").length;
  const n8nUrl = import.meta.env.VITE_N8N_URL ?? (import.meta.env.DEV ? "http://localhost:5678" : "");

  return (
    <div className="adm-section-grid">
      <div className="adm-status-bar">
        <StatusPill icone={<GitBranch size={13} />} rotulo="Workflows" valor={`${prontos}/${workflows.length}`} ok={prontos === workflows.length && workflows.length > 0} />
        <StatusPill icone={<ShieldCheck size={13} />} rotulo="Guardrails" valor="Activos" ok />
      </div>

      {n8nUrl && (
        <a href={n8nUrl} target="_blank" rel="noreferrer" className="adm-link-externo">
          <GitBranch size={14} /> Abrir n8n <ExternalLink size={12} />
        </a>
      )}

      <div className="adm-card">
        <div className="adm-card-head"><Workflow size={15} /><span>Workflows</span></div>
        <div className="adm-card-list">
          {workflows.length ? workflows.map((w) => (
            <div key={w.id} className="adm-row">
              <span className={`adm-row-dot ${w.estado === "PRONTO_PARA_IMPORTAR" ? "adm-row-dot--ok" : "adm-row-dot--warn"}`} />
              <div className="adm-row-text">
                <strong>{w.nome}</strong>
                <span>{w.arquivo}</span>
              </div>
              <Badge variant={w.estado === "PRONTO_PARA_IMPORTAR" ? "success" : "warning"} className="text-[0.6rem] shrink-0">
                {w.estado === "PRONTO_PARA_IMPORTAR" ? "Pronto" : "Pendente"}
              </Badge>
            </div>
          )) : (
            <div className="adm-empty"><GitBranch size={20} /><span>Sem workflows</span></div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Configurações ─────────────────────────────────────── */

function ConteudoConfiguracoes({ resumo }: { resumo: ResumoAutomacoes | null }) {
  const configuracoes = resumo?.configuracoes ?? [];
  const porGrupo = useMemo(() => agruparPorGrupo(configuracoes), [configuracoes]);

  return (
    <div className="adm-section-grid">
      <div className="adm-two-col">
        {Object.entries(porGrupo).map(([grupo, itens]) => (
          <div key={grupo} className="adm-card">
            <div className="adm-card-head"><Settings size={15} /><span>{grupo}</span></div>
            <div className="adm-card-list">
              {itens.map((item) => (
                <div key={`${item.grupo}-${item.nome}`} className="adm-row">
                  <div className="adm-row-text">
                    <strong>{item.nome}</strong>
                    <span>{item.detalhe}</span>
                  </div>
                  <Badge variant={item.estado === "ATIVA" ? "success" : item.estado === "PENDENTE" ? "warning" : "secondary"} className="text-[0.6rem] shrink-0">
                    {item.estado === "ATIVA" ? "Ativa" : item.estado === "PENDENTE" ? "Pendente" : "Off"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Integrações */}
        <div className="adm-card">
          <div className="adm-card-head"><Workflow size={15} /><span>Integrações</span></div>
          <div className="adm-card-list">
            {resumo?.integracoes?.length ? resumo.integracoes.map((i) => (
              <div key={i.nome} className="adm-row">
                <div className="adm-row-text">
                  <strong>{i.nome}</strong>
                  <span>{i.detalhe}</span>
                </div>
                <Badge variant={i.estado === "CONFIGURADA" ? "success" : i.estado === "PENDENTE" ? "warning" : "secondary"} className="text-[0.6rem] shrink-0">
                  {traduzirEstadoIntegracao(i.estado)}
                </Badge>
              </div>
            )) : (
              <div className="adm-empty"><Workflow size={20} /><span>Sem integrações</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Módulos do negócio ───────────────────────────────── */

interface ModuloNegocio {
  modulo: string;
  nome: string;
  descricao: string;
  categoria: string;
  obrigatorio: boolean;
  ativo: boolean;
}

const ROTULOS_CATEGORIA: Record<string, string> = {
  NUCLEO: "Núcleo",
  VENDA: "Vendas",
  OPERACAO: "Operação",
  CRESCIMENTO: "Crescimento",
  DADOS: "Dados e relatórios",
  AUTOMACAO: "Automação"
};

const ORDEM_CATEGORIAS = ["NUCLEO", "VENDA", "OPERACAO", "CRESCIMENTO", "DADOS", "AUTOMACAO"];

function ConteudoModulos() {
  const [modulos, setModulos] = useState<ModuloNegocio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aToggle, setAToggle] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      const dados = await requisitarApi<{ modulos: ModuloNegocio[] }>("/negocio/modulos");
      setModulos(dados.modulos ?? []);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar módulos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function alternar(modulo: string, ativo: boolean) {
    setAToggle(modulo);
    setMensagem("");
    try {
      const dados = await requisitarApi<{ modulosAtivos: string[] }>(`/negocio/modulos/${modulo}`, {
        method: "PATCH",
        body: { ativo }
      });
      setModulos((prev) => prev.map((m) => ({
        ...m,
        ativo: dados.modulosAtivos.includes(m.modulo)
      })));
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Não foi possível alterar o módulo.");
    } finally {
      setAToggle(null);
    }
  }

  const porCategoria = useMemo(() => {
    const grupos: Record<string, ModuloNegocio[]> = {};
    for (const m of modulos) {
      grupos[m.categoria] = [...(grupos[m.categoria] ?? []), m];
    }
    return ORDEM_CATEGORIAS
      .filter((cat) => grupos[cat]?.length)
      .map((cat) => ({ categoria: cat, rotulo: ROTULOS_CATEGORIA[cat] ?? cat, itens: grupos[cat] }));
  }, [modulos]);

  const ativos = modulos.filter((m) => m.ativo).length;

  if (carregando) {
    return <div className="adm-section-grid"><div className="adm-card"><div className="adm-empty"><Blocks size={20} /><span>A carregar módulos…</span></div></div></div>;
  }

  return (
    <div className="adm-section-grid">
      <div className="adm-status-bar">
        <StatusPill icone={<Blocks size={13} />} rotulo="Módulos" valor={`${ativos}/${modulos.length}`} ok={ativos > 0} />
        <StatusPill icone={<Lock size={13} />} rotulo="Obrigatórios" valor={String(modulos.filter((m) => m.obrigatorio).length)} />
      </div>

      {porCategoria.map(({ categoria, rotulo, itens }) => (
        <div key={categoria} className="adm-card">
          <div className="adm-card-head">
            <Blocks size={15} />
            <span>{rotulo}</span>
          </div>
          <div className="adm-card-list">
            {itens.map((m) => (
              <div key={m.modulo} className="adm-row" style={{ opacity: aToggle === m.modulo ? 0.6 : 1 }}>
                <span className={`adm-row-dot ${m.ativo ? "adm-row-dot--ok" : "adm-row-dot--warn"}`} />
                <div className="adm-row-text">
                  <strong>{m.nome}</strong>
                  <span>{m.descricao}</span>
                </div>
                {m.obrigatorio ? (
                  <Badge variant="secondary" className="text-[0.6rem] shrink-0 gap-1">
                    <Lock size={9} /> Obrigatório
                  </Badge>
                ) : (
                  <button
                    type="button"
                    disabled={aToggle !== null}
                    onClick={() => void alternar(m.modulo, !m.ativo)}
                    className={`adm-modulo-toggle ${m.ativo ? "adm-modulo-toggle--on" : ""}`}
                    title={m.ativo ? "Desactivar módulo" : "Activar módulo"}
                  >
                    <span className="adm-modulo-toggle-dot" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {mensagem && <p className="adm-toast" aria-live="polite">{mensagem}</p>}
    </div>
  );
}

/* ── Sub-componentes reutilizáveis ─────────────────────── */

function StatusPill({ icone, rotulo, valor, ok }: { icone: ReactNode; rotulo: string; valor: string; ok?: boolean | null }) {
  return (
    <div className={`adm-pill ${ok === true ? "adm-pill--ok" : ok === false ? "adm-pill--warn" : ""}`}>
      {icone}
      <span className="adm-pill-label">{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function Campo({ id, label, value, onChange, type, inputMode, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; inputMode?: "tel" | "numeric"; placeholder?: string;
}) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <Input id={id} type={type} inputMode={inputMode} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function IgCard({ instancia, carregando, onDesconectar }: { instancia: InstanciaInstagram; carregando: boolean; onDesconectar: (id: string) => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const statusReal = instancia.statusBridge ?? instancia.status;
  const info = STATUS_IG[statusReal] ?? { label: statusReal, variant: "secondary" as const };
  const ultimaPoll = instancia.ultimaPollEmBridge ?? instancia.ultimaPollEm;

  return (
    <div className="adm-ig-card">
      <div className="adm-ig-top">
        <div><strong>@{instancia.username}</strong><span>{instancia.nome}</span></div>
        <Badge variant={info.variant} className="text-[0.6rem]">{info.label}</Badge>
      </div>
      {ultimaPoll && <span className="adm-ig-poll">Último poll: {new Date(ultimaPoll).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" })}</span>}
      {(instancia.ultimoErroBridge ?? instancia.ultimoErro) && (
        <p className="adm-erro">{instancia.ultimoErroBridge ?? instancia.ultimoErro}</p>
      )}
      <Button variant="destructive" size="sm" disabled={carregando} onClick={() => setConfirmar(true)} className="w-fit">
        <LogOut size={13} /> Desconectar
      </Button>
      <ConfirmarAcao
        aberto={confirmar}
        titulo="Desconectar Instagram"
        descricao={`Desconectar @${instancia.username}?`}
        textoBotao="Desconectar"
        variante="destructive"
        onConfirmar={() => { setConfirmar(false); onDesconectar(instancia.id); }}
        onCancelar={() => setConfirmar(false)}
      />
    </div>
  );
}

function InstanciaCard({ instancia, carregando, onExecutar }: {
  instancia: InstanciaEvolution; carregando: boolean;
  onExecutar: (acao: () => Promise<unknown>, sucesso: string) => Promise<void>;
}) {
  const [confirmarRemover, setConfirmarRemover] = useState(false);
  const conectada = ["open", "connected", "online"].includes(instancia.status.toLowerCase());

  return (
    <div className="adm-wa-card">
      <div className="adm-wa-top">
        <div><strong>{instancia.etiqueta || instancia.nome}</strong><span>{instancia.nome} · {instancia.telefone || "sem telefone"}</span></div>
        <Badge variant={conectada ? "success" : instancia.status.toLowerCase().includes("error") ? "destructive" : "warning"} className="text-[0.6rem]">{instancia.status}</Badge>
      </div>

      {instancia.qrCode || instancia.pairingCode ? (
        <div className="adm-qr-box">
          {instancia.qrCode && <img src={instancia.qrCode} alt="QR Code" className="adm-qr-img" />}
          <div className="adm-qr-info">
            <strong>Escaneie no WhatsApp</strong>
            <span>Dispositivos conectados → Conectar</span>
            {instancia.pairingCode && <code>{instancia.pairingCode}</code>}
          </div>
        </div>
      ) : (
        <div className="adm-qr-vazio"><QrCode size={16} /><span>Sem QR. Clique em conectar.</span></div>
      )}

      {instancia.ultimoErro && <p className="adm-erro">{instancia.ultimoErro}</p>}

      <div className="adm-wa-acoes">
        <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/conectar`, { method: "POST" }), "Conexão enviada.")}>
          <QrCode size={13} /> Conectar
        </Button>
        <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/estado`, { method: "POST" }), "Atualizado.")}>
          <RefreshCcw size={13} /> Estado
        </Button>
        {!instancia.padrao && (
          <Button variant="outline" size="sm" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/padrao`, { method: "POST" }), "Padrão atualizada.")}>
            <CheckCircle2 size={13} /> Padrão
          </Button>
        )}
        <Button variant="destructive" size="sm" disabled={carregando} onClick={() => setConfirmarRemover(true)}>
          <Ban size={13} /> Remover
        </Button>
      </div>

      <ConfirmarAcao
        aberto={confirmarRemover}
        titulo="Remover instância"
        descricao={`Remover ${instancia.etiqueta || instancia.nome}?`}
        textoBotao="Remover"
        variante="destructive"
        onConfirmar={() => { setConfirmarRemover(false); void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}`, { method: "DELETE" }), "Removida."); }}
        onCancelar={() => setConfirmarRemover(false)}
      />
    </div>
  );
}

function agruparPorGrupo(configuracoes: ConfiguracaoOperacional[]) {
  return configuracoes.reduce<Record<string, ConfiguracaoOperacional[]>>((g, item) => {
    g[item.grupo] = [...(g[item.grupo] ?? []), item];
    return g;
  }, {});
}
