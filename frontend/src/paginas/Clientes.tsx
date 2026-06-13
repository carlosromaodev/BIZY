import {
  Bolt,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Eye,
  Heart,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCcw,
  Smartphone,
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  Cliente360,
  EstadoRelacionamentoCliente,
  RespostaClientes360,
} from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  FilterChips,
  TableCard,
  Table,
  TableHead,
  Th,
  Td,
  StatusBadge,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  IconButton,
  BotaoBizy,
  Money,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";

/* ── Constants ──────────────────────────────────────────────────── */

const POR_PAGINA = 20;

type Filtro = "todos" | EstadoRelacionamentoCliente;

const FILTROS_OPCOES: Array<{ id: Filtro; rotulo: string; cor?: string }> = [
  { id: "todos", rotulo: "Todos" },
  { id: "LEAD", rotulo: "Leads", cor: "var(--ink-4)" },
  { id: "ATIVO", rotulo: "Ativos", cor: "var(--green)" },
  { id: "VIP", rotulo: "VIP", cor: "var(--violet)" },
  { id: "INADIMPLENTE", rotulo: "Inadimplentes", cor: "var(--rose)" },
  { id: "PRIORIDADE_ALTA", rotulo: "Prioridade", cor: "var(--amber)" },
  { id: "SEM_WHATSAPP", rotulo: "Sem WA" },
  { id: "SEM_CONSENTIMENTO", rotulo: "Sem opt-in" },
  { id: "INATIVO", rotulo: "Inativos" },
];

const COR_ESTADO: Record<EstadoRelacionamentoCliente, CorSemantica> = {
  VIP: "violet",
  ATIVO: "green",
  LEAD: "blue",
  INADIMPLENTE: "rose",
  BLOQUEADO: "rose",
  SEM_WHATSAPP: "mute",
  SEM_CONSENTIMENTO: "mute",
  INATIVO: "mute",
  PRIORIDADE_ALTA: "amber",
};

const TEXTO_ESTADO: Record<EstadoRelacionamentoCliente, string> = {
  VIP: "VIP",
  ATIVO: "Ativo",
  LEAD: "Lead",
  INADIMPLENTE: "Inadimpl.",
  BLOQUEADO: "Bloqueado",
  SEM_WHATSAPP: "Sem WA",
  SEM_CONSENTIMENTO: "Sem opt-in",
  INATIVO: "Inativo",
  PRIORIDADE_ALTA: "Prioridade",
};

const COR_ORIGEM: Record<string, string> = {
  "tiktok": "var(--ink)",
  "tiktok_live": "var(--ink)",
  "loja_digital": "var(--green)",
  "whatsapp": "var(--blue)",
  "instagram": "#E1306C",
  "sms": "var(--amber)",
  "manual": "var(--ink-3)",
};

const ICONE_ORIGEM: Record<string, ReactNode> = {
  whatsapp: <Smartphone size={12} style={{ color: "var(--blue)" }} />,
  instagram: <Instagram size={12} style={{ color: "#E1306C" }} />,
  sms: <Phone size={12} style={{ color: "var(--amber)" }} />,
};

const NOME_ORIGEM: Record<string, string> = {
  tiktok: "TikTok",
  tiktok_live: "TikTok Live",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  sms: "SMS",
  loja_digital: "Loja digital",
  manual: "Manual",
};

/* ── Helpers ────────────────────────────────────────────────────── */

function baixarArquivo(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8") {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(clientes: Cliente360[]): string {
  const linhas = [
    ["nome", "telefone", "email", "username", "estado", "tags", "comprado_kz", "pedidos", "mensagens", "consent_mkt", "consent_dados"],
    ...clientes.map((c) => [
      c.nome ?? "", c.telefone ?? "", c.email ?? "", c.username ?? "",
      c.estadoRelacionamento, c.tags.join("|"),
      String(c.metricas.totalCompradoEmKwanza), String(c.metricas.totalReservas),
      String(c.metricas.totalMensagens),
      c.consentimentoMarketing ? "sim" : "nao",
      c.consentimentoDados ? "sim" : "nao",
    ]),
  ];
  return linhas.map((l) => l.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
}

function criarUrlConversaCliente(cliente: Cliente360): string {
  const params = new URLSearchParams();
  params.set("clienteId", cliente.id);
  if (cliente.telefone) params.set("telefone", cliente.telefone);
  return `/app/conversas?${params.toString()}`;
}

/* ── Component ──────────────────────────────────────────────────── */

export function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente360[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pagina, setPagina] = useState(1);
  const [clienteDetalhe, setClienteDetalhe] = useState<Cliente360 | null>(null);

  async function carregar() {
    setCarregando(true);
    try {
      const rc = await requisitarApi<RespostaClientes360>("/clientes?limite=500");
      setClientes(rc.clientes ?? []);
      setMensagem("");
    } catch (e) {
      setClientes([]);
      setMensagem(e instanceof Error ? e.message : "Erro ao carregar clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);
  useEffect(() => {
    setPagina(1);
  }, [busca, filtro]);

  /* ── Derived data ──────────────────────────────────────────── */

  const clientesFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return clientes.filter((c) => {
      if (filtro !== "todos" && c.estadoRelacionamento !== filtro) return false;
      if (!t) return true;
      return (
        (c.nome ?? "").toLowerCase().includes(t) ||
        (c.username ?? "").toLowerCase().includes(t) ||
        (c.telefone ?? "").includes(t) ||
        (c.email ?? "").toLowerCase().includes(t) ||
        c.tags.some((tag) => tag.toLowerCase().includes(t))
      );
    });
  }, [busca, clientes, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / POR_PAGINA));
  const clientesPagina = clientesFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const compradores = useMemo(() => clientes.filter((c) => c.metricas.reservasPagas > 0).length, [clientes]);
  const valorTotal = useMemo(() => clientes.reduce((t, c) => t + c.metricas.totalCompradoEmKwanza, 0), [clientes]);
  const comConsent = useMemo(() => clientes.filter((c) => c.consentimentoDados || c.consentimentoMarketing).length, [clientes]);
  const taxaConsent = clientes.length ? Math.round((comConsent / clientes.length) * 100) : 0;
  const ticketMedio = compradores > 0 ? Math.round(valorTotal / compradores) : 0;
  const totalVip = useMemo(() => clientes.filter((c) => c.estadoRelacionamento === "VIP").length, [clientes]);

  const contas = useMemo(() => {
    const m: Record<string, number> = { todos: clientes.length };
    for (const f of FILTROS_OPCOES)
      if (f.id !== "todos") m[f.id] = clientes.filter((c) => c.estadoRelacionamento === f.id).length;
    return m;
  }, [clientes]);

  const filtrosComContagem = FILTROS_OPCOES.map((f) => ({
    ...f,
    contagem: contas[f.id] ?? 0,
  }));

  function exportar() {
    baixarArquivo("clientes-bizy.csv", toCsv(clientesFiltrados));
    setMensagem(`${clientesFiltrados.length} clientes exportados.`);
  }

  async function acaoRapida(cliente: Cliente360, tipo: "COBRANCA" | "RECOMPRA" | "CONSENTIMENTO") {
    setMensagem("A criar tarefa...");
    try {
      await requisitarApi(`/clientes/${cliente.id}/acoes`, {
        method: "POST",
        body: {
          tipo,
          titulo:
            tipo === "COBRANCA"
              ? "Cobrar pagamento pendente"
              : tipo === "RECOMPRA"
                ? "Ativar recompra"
                : "Atualizar consentimento",
          observacao: "Criado no CRM.",
          prioridade: tipo === "COBRANCA" ? "ALTA" : "NORMAL",
          contexto: {
            origem: "clientes-360",
            telefone: cliente.telefone,
            estadoRelacionamento: cliente.estadoRelacionamento,
          },
        },
      });
      setMensagem("Tarefa criada com sucesso.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao criar tarefa.");
    }
  }

  const novosEsteMes = useMemo(() => {
    const agora = new Date();
    return clientes.filter((c) => {
      const d = new Date(c.primeiraInteracaoEm);
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    }).length;
  }, [clientes]);

  const ativos30dias = useMemo(() => {
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return clientes.filter((c) => c.metricas.ultimaInteracaoEm && Number(new Date(c.metricas.ultimaInteracaoEm)) > limite).length;
  }, [clientes]);

  const aRecuperar = useMemo(() => {
    const limite = Date.now() - 60 * 24 * 60 * 60 * 1000;
    return clientes.filter((c) => {
      if (!c.metricas.ultimaInteracaoEm) return false;
      return Number(new Date(c.metricas.ultimaInteracaoEm)) < limite;
    }).length;
  }, [clientes]);

  if (carregando && !clientes.length) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-v3-pgwrap">
        {/* ── Page Head ─────────────────────────────────────── */}
        <div className="crm-v3-pghead">
          <div>
            <h1>Clientes</h1>
            <div className="crm-v3-sub">
              {clientes.length} clientes · {novosEsteMes} novos este mês
            </div>
          </div>
          <div className="crm-v3-pghead-right">
            <button type="button" className="crm-v3-btn crm-v3-btn-ghost" onClick={exportar}>
              Importar contactos
            </button>
            <Link to="/app/clientes" className="crm-v3-btn crm-v3-btn-primary">
              <Plus size={13} />
              Novo cliente
            </Link>
          </div>
        </div>

        {/* ── Segment Filter Tiles ────────────────────────────── */}
        <div className="crm-v3-ftiles" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <button
            type="button"
            className="crm-v3-ftile"
            data-active={filtro === "todos" ? "true" : undefined}
            onClick={() => setFiltro("todos")}
          >
            <span className="crm-v3-ftile-icon" style={{ background: "var(--em-tint)", color: "var(--em)" }}>
              <Users size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Todos</div>
              <div className="crm-v3-ftile-desc">base completa</div>
            </div>
            <span className="crm-v3-ftile-count">{clientes.length}</span>
          </button>
          <button
            type="button"
            className="crm-v3-ftile"
            data-active={filtro === "VIP" ? "true" : undefined}
            onClick={() => setFiltro("VIP")}
          >
            <span className="crm-v3-ftile-icon" style={{ background: "var(--violet-tint)", color: "var(--violet)" }}>
              <CheckCircle2 size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">VIP</div>
              <div className="crm-v3-ftile-desc">+5 compras</div>
            </div>
            <span className="crm-v3-ftile-count">{totalVip}</span>
          </button>
          <button
            type="button"
            className="crm-v3-ftile"
            data-active={filtro === "ATIVO" ? "true" : undefined}
            onClick={() => setFiltro("ATIVO")}
          >
            <span className="crm-v3-ftile-icon" style={{ background: "var(--blue-tint)", color: "var(--blue)" }}>
              <Bolt size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">Ativos 30 dias</div>
              <div className="crm-v3-ftile-desc">compraram há pouco</div>
            </div>
            <span className="crm-v3-ftile-count">{ativos30dias}</span>
          </button>
          <button
            type="button"
            className="crm-v3-ftile"
            data-active={filtro === "INATIVO" ? "true" : undefined}
            onClick={() => setFiltro("INATIVO")}
          >
            <span className="crm-v3-ftile-icon" style={{ background: "var(--amber-tint)", color: "var(--amber)" }}>
              <Clock size={17} />
            </span>
            <div>
              <div className="crm-v3-ftile-title">A recuperar</div>
              <div className="crm-v3-ftile-desc">+60 dias sem comprar</div>
            </div>
            <span className="crm-v3-ftile-count">{aRecuperar}</span>
          </button>
        </div>

      {/* ── Data Table ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${filtro}|${pagina}|${busca}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {clientesPagina.length ? (
            <TableCard>
              <Table>
                <thead>
                  <tr>
                    <Th>Cliente</Th>
                    <Th>Estado</Th>
                    <Th>Contacto</Th>
                    <Th right>Receita</Th>
                    <Th right>Pedidos</Th>
                    <Th>Origem</Th>
                    <Th right>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPagina.map((cliente) => {
                    const nome = cliente.nome || cliente.username || cliente.telefone || "Cliente";
                    return (
                      <tr key={cliente.id}>
                        <Td>
                          <div className="bz-cli">
                            <AvatarBizy
                              iniciais={obterIniciais(nome)}
                              cor={obterCorAvatar(nome)}
                              tamanho={32}
                              src={cliente.avatarUrl}
                              alt={nome}
                            />
                            <div>
                              <div className="bz-cli-name">{nome}</div>
                              <div className="bz-cli-desc">
                                {cliente.username ? `@${cliente.username}` : "—"}
                              </div>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <StatusBadge cor={COR_ESTADO[cliente.estadoRelacionamento]}>
                            {TEXTO_ESTADO[cliente.estadoRelacionamento]}
                          </StatusBadge>
                        </Td>
                        <Td>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>
                              {cliente.telefone ?? "—"}
                            </div>
                            <div className="bz-cli-desc">
                              {cliente.email ?? "—"}
                            </div>
                          </div>
                        </Td>
                        <Td right className="bz-money">
                          {cliente.metricas.totalCompradoEmKwanza ? (
                            <Money valor={cliente.metricas.totalCompradoEmKwanza} />
                          ) : (
                            <span className="bz-money-muted">—</span>
                          )}
                        </Td>
                        <Td right className="bz-tnum">
                          {cliente.metricas.totalReservas || 0}
                        </Td>
                        <Td>
                          {cliente.origem ? (
                            <span className="bz-src" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              {ICONE_ORIGEM[cliente.origem.toLowerCase()] ?? (
                                <span
                                  className="bz-src-led"
                                  style={{ background: COR_ORIGEM[cliente.origem.toLowerCase()] ?? "var(--ink-4)" }}
                                />
                              )}
                              {NOME_ORIGEM[cliente.origem.toLowerCase()] ?? cliente.origem}
                            </span>
                          ) : (
                            <span style={{ fontSize: "12.5px", color: "var(--ink-3)" }}>—</span>
                          )}
                        </Td>
                        <Td right>
                          <div className="bz-acts">
                            <IconButton icone={Eye} titulo="Ver perfil" onClick={() => setClienteDetalhe(cliente)} />
                            {cliente.telefone && (
                              <a href={`tel:${cliente.telefone}`} className="bz-iconbtn" title="Ligar">
                                <Phone size={16} />
                              </a>
                            )}
                            <Link to={criarUrlConversaCliente(cliente)} className="bz-iconbtn" title="Atender">
                              <MessageCircle size={16} />
                            </Link>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableCard>
          ) : (
            <EstadoVazio
              icone={<Users />}
              titulo={carregando ? "A carregar clientes" : "Sem clientes neste filtro"}
              detalhe={carregando ? "A consultar o CRM..." : "Ajuste a busca ou aguarde novas interações."}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div className="bz-pagination">
          <span className="bz-pag-info">
            {Math.min((pagina - 1) * POR_PAGINA + 1, clientesFiltrados.length)}–
            {Math.min(pagina * POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length}
          </span>
          <div className="bz-pag-btns">
            <button
              className="bz-pag-btn"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              ←
            </button>
            <span className="bz-pag-current">{pagina} / {totalPaginas}</span>
            <button
              className="bz-pag-btn"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ── Client Detail Sheet ────────────────────────────────── */}
      <Sheet
        open={clienteDetalhe !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setClienteDetalhe(null);
        }}
      >
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {clienteDetalhe && (
            <>
              <SheetHeader>
                <SheetTitle>Perfil do cliente</SheetTitle>
                <SheetDescription>
                  Dados recolhidos via WhatsApp, Instagram, TikTok, SMS e interações na loja.
                </SheetDescription>
              </SheetHeader>
              <PainelDetalheCliente cliente={clienteDetalhe} onAcao={acaoRapida} />
            </>
          )}
        </SheetContent>
      </Sheet>

      {mensagem && (
        <footer className="bz-footer-msg" aria-live="polite">
          {mensagem}
        </footer>
      )}
      </div>
    </CrmPageMotion>
  );
}

/* ── Client Detail Panel ─────────────────────────────────────────── */

function PainelDetalheCliente({
  cliente,
  onAcao,
}: {
  cliente: Cliente360;
  onAcao: (c: Cliente360, tipo: "COBRANCA" | "RECOMPRA" | "CONSENTIMENTO") => void;
}) {
  const nome = cliente.nome || cliente.username || cliente.telefone || "Cliente";

  return (
    <div className="bz-detail-panel">
      {/* Profile header */}
      <div className="bz-detail-header">
        <AvatarBizy
          iniciais={obterIniciais(nome)}
          cor={obterCorAvatar(nome)}
          tamanho={56}
          src={cliente.avatarUrl}
          alt={nome}
        />
        <div>
          <h3 className="bz-detail-name">{nome}</h3>
          {cliente.username && (
            <p className="bz-detail-sub">@{cliente.username}</p>
          )}
          <StatusBadge cor={COR_ESTADO[cliente.estadoRelacionamento]}>
            {TEXTO_ESTADO[cliente.estadoRelacionamento]}
          </StatusBadge>
        </div>
      </div>

      {/* Contact info */}
      <div className="bz-detail-section">
        <h4 className="bz-detail-label">Contacto</h4>
        {cliente.telefone && (
          <div className="bz-detail-row">
            <Phone size={13} />
            <span>{cliente.telefone}</span>
          </div>
        )}
        {cliente.email && (
          <div className="bz-detail-row">
            <Mail size={13} />
            <span>{cliente.email}</span>
          </div>
        )}
        {cliente.username && (
          <div className="bz-detail-row">
            <Instagram size={13} style={{ color: "#E1306C" }} />
            <span>@{cliente.username}</span>
          </div>
        )}
      </div>

      {/* Origin / channels */}
      {cliente.origem && (
        <div className="bz-detail-section">
          <h4 className="bz-detail-label">Canal de origem</h4>
          <div className="bz-detail-row" style={{ gap: 6 }}>
            {ICONE_ORIGEM[cliente.origem.toLowerCase()] ?? <MessageCircle size={13} />}
            <span style={{ fontWeight: 600 }}>{NOME_ORIGEM[cliente.origem.toLowerCase()] ?? cliente.origem}</span>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="bz-detail-section">
        <h4 className="bz-detail-label">Métricas</h4>
        <div className="bz-detail-metrics">
          <div className="bz-detail-metric">
            <span className="bz-detail-metric-label">Receita</span>
            <span className="bz-detail-metric-value">{formatarKwanza(cliente.metricas.totalCompradoEmKwanza)}</span>
          </div>
          <div className="bz-detail-metric">
            <span className="bz-detail-metric-label">Reservas</span>
            <span className="bz-detail-metric-value">{cliente.metricas.reservasPagas}/{cliente.metricas.totalReservas}</span>
          </div>
          <div className="bz-detail-metric">
            <span className="bz-detail-metric-label">Mensagens</span>
            <span className="bz-detail-metric-value">{cliente.metricas.totalMensagens}</span>
          </div>
          <div className="bz-detail-metric">
            <span className="bz-detail-metric-label">Conversas</span>
            <span className="bz-detail-metric-value">{cliente.metricas.conversasAbertas}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {cliente.tags.length > 0 && (
        <div className="bz-detail-section">
          <h4 className="bz-detail-label">Tags</h4>
          <div className="bz-detail-tags">
            {cliente.tags.map((tag) => (
              <StatusBadge key={tag} cor="mute">{tag}</StatusBadge>
            ))}
          </div>
        </div>
      )}

      {/* 360 data */}
      <SecaoDados360 titulo="Dados 360" dados={cliente.perfil360} />
      <SecaoDados360 titulo="Identidades digitais" dados={cliente.identidadesDigitais} />
      <SecaoDados360 titulo="Sinais sociais" dados={cliente.sinaisRelacionamento} />
      <SecaoDados360 titulo="Dados de captura" dados={cliente.dadosCaptura} />

      {/* Timeline */}
      <div className="bz-detail-section">
        <h4 className="bz-detail-label">Histórico</h4>
        <div className="bz-detail-timeline">
          <div className="bz-detail-timeline-row">
            <span>Primeira interação</span>
            <span className="bz-mono">{formatarDataHoraCurta(cliente.primeiraInteracaoEm)}</span>
          </div>
          <div className="bz-detail-timeline-row">
            <span>Última interação</span>
            <span className="bz-mono">
              {cliente.metricas.ultimaInteracaoEm ? formatarDataHoraCurta(cliente.metricas.ultimaInteracaoEm) : "—"}
            </span>
          </div>
          <div className="bz-detail-timeline-row">
            <span>Último enriquecimento</span>
            <span className="bz-mono">
              {cliente.ultimoEnriquecimentoEm ? formatarDataHoraCurta(cliente.ultimoEnriquecimentoEm) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bz-detail-actions">
        <BotaoBizy
          onClick={() => onAcao(cliente, cliente.metricas.reservasAtivas ? "COBRANCA" : "RECOMPRA")}
          className="bz-btn-full"
        >
          {cliente.metricas.reservasAtivas ? "Cobrar" : "Recompra"}
        </BotaoBizy>
        <Link to={criarUrlConversaCliente(cliente)}>
          <BotaoBizy variante="ghost" icone={MessageCircle} className="bz-btn-full">
            Atender
          </BotaoBizy>
        </Link>
      </div>
    </div>
  );
}

function SecaoDados360({ titulo, dados }: { titulo: string; dados?: Record<string, unknown> | null }) {
  if (!temDadosObjeto(dados)) return null;

  return (
    <div className="bz-detail-section">
      <h4 className="bz-detail-label">{titulo}</h4>
      {renderizarObjetoResumo(dados)}
    </div>
  );
}

function temDadosObjeto(dados?: Record<string, unknown> | null): dados is Record<string, unknown> {
  return Boolean(dados && Object.keys(dados).length > 0);
}

function renderizarObjetoResumo(dados: Record<string, unknown>) {
  const entradas = Object.entries(dados).filter(([, valor]) => valor !== null && valor !== undefined && valor !== "");
  if (!entradas.length) return null;

  return (
    <div className="bz-detail-json">
      {entradas.slice(0, 5).map(([chave, valor]) => (
        <div key={chave} className="bz-detail-json-row">
          <span>{formatarChave360(chave)}</span>
          <strong title={formatarValor360(valor)}>{formatarValor360(valor)}</strong>
        </div>
      ))}
      {entradas.length > 5 && (
        <div className="bz-detail-json-more">+{entradas.length - 5} campos guardados</div>
      )}
    </div>
  );
}

function formatarChave360(chave: string): string {
  return chave
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (letra) => letra.toUpperCase());
}

function formatarValor360(valor: unknown): string {
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") return new Intl.NumberFormat("pt-AO").format(valor);
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor)) {
    const simples = valor.filter((item) => ["string", "number", "boolean"].includes(typeof item)).slice(0, 3);
    return simples.length ? simples.map(String).join(", ") : `${valor.length} item${valor.length !== 1 ? "s" : ""}`;
  }
  if (valor && typeof valor === "object") {
    const entradas = Object.entries(valor as Record<string, unknown>)
      .filter(([, item]) => item !== null && item !== undefined && item !== "")
      .slice(0, 3)
      .map(([chave, item]) => `${formatarChave360(chave)}: ${formatarValor360(item)}`);
    return entradas.length ? entradas.join(" · ") : "Guardado";
  }
  return "—";
}
