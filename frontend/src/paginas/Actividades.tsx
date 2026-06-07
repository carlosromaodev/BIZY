import {
  Clock3,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  Users,
  Video
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
import type {
  Actividade,
  RespostaActividades,
  TipoActividade
} from "../tipos";
import { formatarDataHoraCurta } from "../utilidades";

function traduzirTipo(tipo: TipoActividade): string {
  const traducoes: Record<TipoActividade, string> = {
    NOTA: "Nota",
    CHAMADA: "Chamada",
    VISITA: "Visita",
    REUNIAO: "Reunião",
    WHATSAPP: "WhatsApp",
    EMAIL: "Email"
  };
  return traducoes[tipo];
}

function iconeTipo(tipo: TipoActividade, tamanho = 14) {
  if (tipo === "CHAMADA") return <Phone size={tamanho} />;
  if (tipo === "VISITA") return <Users size={tamanho} />;
  if (tipo === "REUNIAO") return <Video size={tamanho} />;
  if (tipo === "WHATSAPP") return <MessageCircle size={tamanho} />;
  if (tipo === "EMAIL") return <Mail size={tamanho} />;
  return <FileText size={tamanho} />;
}

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springTimeline = { type: "spring" as const, stiffness: 400, damping: 26 };

const corTipo: Record<TipoActividade, string> = {
  NOTA: "#78716C",
  CHAMADA: "#6366F1",
  VISITA: "#8B5CF6",
  REUNIAO: "#F59E0B",
  WHATSAPP: "#10B981",
  EMAIL: "#3B82F6"
};

export function PaginaActividades() {
  const [actividades, setActividades] = useState<Actividade[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoActividade | "todos">("todos");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaActividades>("/actividades?limite=100");
      setActividades(resposta.actividades ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar actividades.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  const chamadas = actividades.filter((a) => a.tipo === "CHAMADA");
  const reunioes = actividades.filter((a) => a.tipo === "REUNIAO");
  const futuras = actividades.filter((a) => a.futura);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const actividadesHoje = actividades.filter((a) => {
    const d = new Date(a.dataHora);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === hoje.getTime();
  });
  const semCliente = actividades.filter((a) => !a.clienteNome).length;
  const whatsapp = actividades.filter((a) => a.tipo === "WHATSAPP");
  const actividadePrioritaria = futuras[0] ?? actividadesHoje[0] ?? actividades[0];
  const proximaAcao = actividadePrioritaria
    ? {
        titulo: actividadePrioritaria.futura ? `Preparar ${actividadePrioritaria.titulo}` : `Fechar proximo passo de "${actividadePrioritaria.titulo}"`,
        detalhe: `${traduzirTipo(actividadePrioritaria.tipo)} · ${actividadePrioritaria.clienteNome ?? "Sem cliente"}. Registar resultado ou lembrete.`,
        destino: actividadePrioritaria.clienteId ? `/app/clientes?clienteId=${encodeURIComponent(actividadePrioritaria.clienteId)}` : "/app/agenda",
        icone: iconeTipo(actividadePrioritaria.tipo, 16),
        prioridade: actividadePrioritaria.futura ? "alta" : "media",
        rotuloAcao: actividadePrioritaria.clienteId ? "Ver cliente" : "Agendar"
      } as const
    : {
        titulo: "Criar primeira nota acionavel",
        detalhe: "Registe objeção, promessa, preferencia e proxima ação.",
        destino: "/app/clientes",
        icone: <FileText size={16} />,
        prioridade: "media",
        rotuloAcao: "Clientes"
      } as const;
  const atalhoAtivo = actividadePrioritaria ? `nota ${traduzirTipo(actividadePrioritaria.tipo)} -> agenda` : "nova nota com lembrete";

  const actividadesFiltradas = useMemo(() => actividades.filter((a) => {
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      a.titulo.toLowerCase().includes(termo) ||
      a.clienteNome?.toLowerCase().includes(termo) ||
      a.descricao?.toLowerCase().includes(termo)
    );
  }), [actividades, busca, filtroTipo]);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Editorial Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <h1 className="crm-titulo">Notas</h1>
            <p className="crm-subtitulo">{actividades.length} actividades · {actividadesHoje.length} hoje · {futuras.length} planeadas</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        <motion.div className="flex gap-4 text-xs text-muted-foreground pb-4 mb-4 border-b border-border/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          {actividadesHoje.length > 0 && <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#6366F1]" />{actividadesHoje.length} hoje</span>}
          <span className="flex items-center gap-1"><Phone size={10} />{chamadas.length} chamadas</span>
          <span className="flex items-center gap-1"><Video size={10} />{reunioes.length} reuniões</span>
        </motion.div>

        <CrmPainelOperacional
          modulo="Notas"
          titulo="Histórico acionável"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Hoje", valor: String(actividadesHoje.length), detalhe: "eventos registados", tom: actividadesHoje.length ? "info" : "neutro" },
            { rotulo: "Planeadas", valor: String(futuras.length), detalhe: "aparecem na agenda", tom: futuras.length ? "atencao" : "neutro" },
            { rotulo: "WhatsApp", valor: String(whatsapp.length), detalhe: "historico de atendimento", tom: whatsapp.length ? "sucesso" : "neutro" },
            { rotulo: "Sem cliente", valor: String(semCliente), detalhe: "precisam ligacao 360", tom: semCliente ? "perigo" : "sucesso" }
          ]}
          atributos={[
            { rotulo: "Tipo dominante", valor: chamadas.length >= reunioes.length ? "chamadas" : "reunioes", detalhe: "melhor canal recente", tom: "info" },
            { rotulo: "Nota acionavel", valor: futuras.length ? "sim" : "melhorar", detalhe: "deve gerar agenda", tom: futuras.length ? "sucesso" : "atencao" },
            { rotulo: "Cliente 360", valor: semCliente ? "incompleto" : "ligado", detalhe: "timeline util", tom: semCliente ? "atencao" : "sucesso" }
          ]}
          acoes={[
            { titulo: "Agendar", detalhe: "Converter nota em follow-up", destino: "/app/agenda", icone: <Clock3 size={14} />, rotuloAcao: "Agenda" },
            { titulo: "Atendimento", detalhe: "Continuar conversa", destino: "/app/conversas", icone: <MessageCircle size={14} />, rotuloAcao: "Conversas" },
            { titulo: "Clientes", detalhe: "Abrir timeline 360", destino: "/app/clientes", icone: <Users size={14} />, rotuloAcao: "Clientes" }
          ]}
        />

        {/* ── Search & Type Filter ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              aria-label="Buscar actividades"
              className="pl-9"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar por título, cliente ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
          <button
            type="button"
            className={`clientes-filtro-pill ${filtroTipo === "todos" ? "clientes-filtro-pill--ativo" : ""}`}
            onClick={() => setFiltroTipo("todos")}
          >
            Todos
          </button>
          {(["NOTA", "CHAMADA", "VISITA", "REUNIAO", "WHATSAPP", "EMAIL"] as TipoActividade[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`clientes-filtro-pill ${filtroTipo === t ? "clientes-filtro-pill--ativo" : ""}`}
              onClick={() => setFiltroTipo(t)}
            >
              {traduzirTipo(t)}
            </button>
          ))}
        </div>

        {/* ── Vertical Timeline ── */}
        {actividadesFiltradas.length ? (
          <div className="timeline-list">
            <AnimatePresence mode="popLayout">
            {actividadesFiltradas.map((actividade, i) => {
              const cor = corTipo[actividade.tipo];
              return (
                <motion.div
                  key={actividade.id}
                  className="timeline-node"
                  layout
                  initial={{ opacity: 0, x: -12, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ ...springTimeline, delay: i * 0.03 }}
                  whileHover={{ x: 4, backgroundColor: "var(--color-surface-muted)" }}
                >
                  <div
                    className="timeline-dot"
                    style={{ background: cor, color: "white" }}
                  >
                    {iconeTipo(actividade.tipo, 10)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{actividade.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {actividade.clienteNome ?? "Sem cliente"}
                          {actividade.descricao && <span className="hidden sm:inline"> · {actividade.descricao}</span>}
                        </p>
                        <div className="crm-plus-mini-row mt-2">
                          <span>{actividade.futura ? "proximo passo marcado" : "historico registado"}</span>
                          <span>{actividade.clienteNome ? "cliente 360" : "ligar cliente"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                          style={{ background: `color-mix(in srgb, ${cor} 10%, transparent)`, color: cor }}
                        >
                          {iconeTipo(actividade.tipo, 10)}
                          {traduzirTipo(actividade.tipo)}
                        </span>
                        {actividade.futura && <Badge variant="info" className="text-[0.6rem]">Planeada</Badge>}
                        <span className="text-[0.6875rem] text-muted-foreground whitespace-nowrap tabular-nums">
                          {formatarDataHoraCurta(actividade.dataHora)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <EstadoVazio
            icone={<FileText />}
            titulo="Sem actividades"
            detalhe="Registe notas, chamadas, visitas e reuniões para manter o histórico completo de cada cliente."
          />
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
