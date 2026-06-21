import {
  ArrowRight,
  CheckCircle2,
  FileText,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { CrmPainelOperacional } from "../componentes/CrmPainelOperacional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {
  Cotacao,
  EstadoCotacao,
  RespostaCotacoes
} from "../tipos";
import { formatarDataHoraCurta, formatarKwanza, pluralizar } from "../utilidades";

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springLinha = { type: "spring" as const, stiffness: 400, damping: 26 };

const estadosFiltro: Array<EstadoCotacao | "todas"> = ["todas", "ABERTA", "ACEITE", "EXPIRADA", "RECUSADA"];

function traduzirEstado(estado: EstadoCotacao): string {
  const traducoes: Record<EstadoCotacao, string> = {
    ABERTA: "Aberta",
    ACEITE: "Aceite",
    EXPIRADA: "Expirada",
    RECUSADA: "Recusada"
  };
  return traducoes[estado];
}

function varianteEstado(estado: EstadoCotacao): "success" | "warning" | "destructive" | "secondary" {
  if (estado === "ACEITE") return "success";
  if (estado === "ABERTA") return "warning";
  if (estado === "EXPIRADA" || estado === "RECUSADA") return "destructive";
  return "secondary";
}

export function PaginaCotacoes() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<EstadoCotacao | "todas">("todas");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaCotacoes>("/cotacoes?limite=200");
      setCotacoes(resposta.cotacoes ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar cotações.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  async function converterEmPedido(cotacao: Cotacao) {
    setCarregando(true);
    try {
      await requisitarApi(`/cotacoes/${cotacao.id}/converter`, { method: "POST" });
      await carregar();
      setMensagem("Cotação convertida em pedido.");
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao converter cotação.");
    } finally {
      setCarregando(false);
    }
  }

  const abertas = cotacoes.filter((c) => c.estado === "ABERTA");
  const aceites = cotacoes.filter((c) => c.estado === "ACEITE");
  const valorAberto = abertas.reduce((t, c) => t + c.totalEmKwanza, 0);
  const valorAceite = aceites.reduce((t, c) => t + c.totalEmKwanza, 0);
  const agoraMs = Date.now();
  const em48hMs = 48 * 60 * 60 * 1000;
  const aExpirar = abertas.filter((c) => {
    const validade = new Date(c.validadeEm).getTime();
    return validade >= agoraMs && validade - agoraMs <= em48hMs;
  });
  const aceitesSemPedido = aceites.filter((c) => !c.pedidoConvertidoId);
  const maiorAberta = [...abertas].sort((a, b) => b.totalEmKwanza - a.totalEmKwanza)[0];
  const descontoTotal = cotacoes.reduce((t, c) => t + c.descontoEmKwanza, 0);
  const taxaAceitacao = cotacoes.length ? Math.round((aceites.length / cotacoes.length) * 100) : 0;
  const cotacaoPrioritaria = aceitesSemPedido[0] ?? aExpirar[0] ?? maiorAberta;
  const proximaAcao = aceitesSemPedido[0]
    ? {
        titulo: `Converter cotacao #${aceitesSemPedido[0].numero}`,
        detalhe: `${aceitesSemPedido[0].clienteNome ?? "Cliente"} aceitou ${formatarKwanza(aceitesSemPedido[0].totalEmKwanza)}. Converter em pedido.`,
        destino: "/app/cotacoes",
        icone: <CheckCircle2 size={16} />,
        prioridade: "alta",
        rotuloAcao: "Converter"
      } as const
    : cotacaoPrioritaria
      ? {
          titulo: `Reaquecer cotacao #${cotacaoPrioritaria.numero}`,
          detalhe: `${cotacaoPrioritaria.clienteNome ?? "Cliente sem nome"} · ${formatarKwanza(cotacaoPrioritaria.totalEmKwanza)} em aberto. Confirmar validade ou alternativa.`,
          destino: cotacaoPrioritaria.clienteId ? `/app/clientes?clienteId=${encodeURIComponent(cotacaoPrioritaria.clienteId)}` : "/app/conversas",
          icone: <Send size={16} />,
          prioridade: aExpirar.includes(cotacaoPrioritaria) ? "alta" : "media",
          rotuloAcao: cotacaoPrioritaria.clienteId ? "Ver cliente" : "Atender"
        } as const
      : {
          titulo: "Criar cotacao de produto",
          detalhe: "Escolha produtos com stock e validade clara.",
          destino: "/app/catalogo",
          icone: <FileText size={16} />,
          prioridade: "media",
          rotuloAcao: "Ver produtos"
        } as const;
  const atalhoAtivo = cotacaoPrioritaria ? `cotacao #${cotacaoPrioritaria.numero} -> follow-up` : "nova cotacao por produto";

  const cotacoesFiltradas = useMemo(() => cotacoes.filter((c) => {
    if (filtro !== "todas" && c.estado !== filtro) return false;
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      String(c.numero).includes(termo) ||
      c.clienteNome?.toLowerCase().includes(termo) ||
      c.clienteTelefone?.includes(termo) ||
      c.itens.some((i) => i.nomeProduto.toLowerCase().includes(termo))
    );
  }), [cotacoes, busca, filtro]);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="crm-titulo">Cotações</h1>
            <p className="crm-subtitulo">{abertas.length} {pluralizar(abertas.length, "aberta", "abertas")} · {formatarKwanza(valorAberto)} pendente</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* ── Inline Summary Bar ── */}
        <motion.div className="flex gap-6 text-sm pb-4 mb-4 border-b border-border/40" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springEntrada}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "#F59E0B" }}>{abertas.length}</span>
            <span className="text-muted-foreground text-xs">{pluralizar(abertas.length, "aberta", "abertas")}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}>{aceites.length}</span>
            <span className="text-muted-foreground text-xs">{pluralizar(aceites.length, "aceite", "aceites")}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}>{formatarKwanza(valorAceite)}</span>
            <span className="text-muted-foreground text-xs">receita</span>
          </div>
        </motion.div>

        <CrmPainelOperacional
          modulo="Cotações"
          titulo="Cotações em decisão"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "A expirar", valor: String(aExpirar.length), detalhe: "proximas 48h", tom: aExpirar.length ? "perigo" : "sucesso" },
            { rotulo: "Aceites sem pedido", valor: String(aceitesSemPedido.length), detalhe: "converter agora", tom: aceitesSemPedido.length ? "atencao" : "sucesso" },
            { rotulo: "Aceitacao", valor: `${taxaAceitacao}%`, detalhe: "cotacoes aceites", tom: taxaAceitacao >= 35 ? "sucesso" : "info" },
            { rotulo: "Desconto", valor: formatarKwanza(descontoTotal), detalhe: "margem consumida", tom: descontoTotal ? "atencao" : "neutro" }
          ]}
          atributos={[
            { rotulo: "Em foco", valor: cotacaoPrioritaria ? `#${cotacaoPrioritaria.numero}` : "nenhuma", detalhe: cotacaoPrioritaria?.clienteNome ?? "sem proposta aberta", tom: cotacaoPrioritaria ? "info" : "neutro" },
            { rotulo: "Produto", valor: cotacaoPrioritaria?.itens[0]?.nomeProduto ?? "sem produto", detalhe: "item principal", tom: cotacaoPrioritaria ? "sucesso" : "neutro" },
            { rotulo: "Margem", valor: descontoTotal ? "vigiar" : "estavel", detalhe: "desconto acumulado", tom: descontoTotal ? "atencao" : "sucesso" }
          ]}
          acoes={[
            { titulo: "Enviar WhatsApp", detalhe: "Enviar proposta pelo atendimento", destino: "/app/conversas", icone: <Send size={14} />, rotuloAcao: "WhatsApp" },
            { titulo: "Ver fluxo", detalhe: "Propostas abertas alimentam negócios", destino: "/app/pipeline", icone: <ArrowRight size={14} />, rotuloAcao: "Fluxo" },
            { titulo: "Rever margem", detalhe: "Comparar desconto e valor", destino: "/app/relatorios", icone: <ShieldCheck size={14} />, rotuloAcao: "Margem" }
          ]}
        />

        {/* ── Search & Filter ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              aria-label="Buscar cotações"
              className="pl-9"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar por cliente, produto ou número..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
            <SelectTrigger aria-label="Filtrar por estado" className="sm:w-48">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              {estadosFiltro.map((e) => (
                <SelectItem key={e} value={e}>{e === "todas" ? "Todas" : traduzirEstado(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Table ── */}
        {cotacoesFiltradas.length ? (
          <div className="ops-tabela">
            <div className="ops-tabela-cabecalho cotacoes-cols">
              <span>Cotação</span>
              <span>Cliente</span>
              <span className="hidden sm:block">Estado</span>
              <span className="text-right">Total</span>
              <span className="hidden lg:block">Validade</span>
              <span className="text-right">Acções</span>
            </div>
            <AnimatePresence mode="popLayout">
            {cotacoesFiltradas.map((cotacao, i) => (
              <motion.div
                key={cotacao.id}
                className="ops-tabela-linha cotacoes-cols"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ ...springLinha, delay: i * 0.02 }}
                whileHover={{ backgroundColor: "var(--color-surface-muted)" }}
              >
                <span className="font-mono text-xs font-semibold text-primary">#{cotacao.numero}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{cotacao.clienteNome ?? "Sem cliente"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cotacao.itens.length} {cotacao.itens.length === 1 ? "item" : "itens"}
                  </p>
                  <div className="crm-plus-mini-row">
                    <span>{cotacao.itens[0]?.nomeProduto ?? "Sem produto"}</span>
                    <span>{new Date(cotacao.validadeEm).getTime() < Date.now() ? "Validade vencida" : "Validade ativa"}</span>
                  </div>
                </div>
                <span className="hidden sm:block">
                  <Badge variant={varianteEstado(cotacao.estado)} className="text-[0.6rem]">
                    {traduzirEstado(cotacao.estado)}
                  </Badge>
                </span>
                <span className="text-right text-sm font-semibold tabular-nums">{formatarKwanza(cotacao.totalEmKwanza)}</span>
                <span className="hidden lg:block text-xs text-muted-foreground">
                  {formatarDataHoraCurta(cotacao.validadeEm)}
                </span>
                <div className="flex items-center justify-end gap-1">
                  {cotacao.estado === "ACEITE" && !cotacao.pedidoConvertidoId && (
                    <Button
                      variant="success"
                      size="icon-sm"
                      title="Converter em pedido"
                      onClick={() => void converterEmPedido(cotacao)}
                      disabled={carregando}
                    >
                      <CheckCircle2 size={14} />
                    </Button>
                  )}
                  {cotacao.estado === "ABERTA" && (
                    <Button
                      variant="outline"
                      size="icon-sm"
                      title="Enviar por WhatsApp"
                      onClick={() => void requisitarApi(`/cotacoes/${cotacao.id}/enviar`, { method: "POST" }).then(() => setMensagem("Cotação enviada."))}
                      disabled={carregando}
                    >
                      <Send size={14} />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        ) : (
          <EstadoVazio icone={<FileText />} titulo="Sem cotações" detalhe="Crie cotações para enviar propostas de preço aos clientes antes de fechar pedido." />
        )}

        <AnimatePresence>
          {mensagem && (
            <motion.footer
              className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {mensagem}
            </motion.footer>
          )}
        </AnimatePresence>
      </div>
    </CrmPageMotion>
  );
}
