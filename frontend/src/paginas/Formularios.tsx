import {
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  RefreshCcw,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { CrmPainelOperacional } from "../componentes/CrmPainelOperacional";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  FormularioCaptacao,
  RespostaFormularios
} from "../tipos";
import { formatarDataHoraCurta, pluralizar } from "../utilidades";

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springCartao = { type: "spring" as const, stiffness: 400, damping: 26 };

export function PaginaFormularios() {
  const [formularios, setFormularios] = useState<FormularioCaptacao[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaFormularios>("/formularios?limite=50");
      setFormularios(resposta.formularios ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar formulários.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  function copiarLink(link: string) {
    void navigator.clipboard.writeText(link).then(() => setMensagem("Link copiado."));
  }

  const activos = formularios.filter((f) => f.ativo);
  const totalLeads = formularios.reduce((t, f) => t + f.totalSubmissoes, 0);
  const inactivos = formularios.filter((f) => !f.ativo);
  const topFormulario = [...formularios].sort((a, b) => b.totalSubmissoes - a.totalSubmissoes)[0];
  const semLeads = formularios.filter((f) => f.ativo && f.totalSubmissoes === 0).length;
  const comTag = formularios.filter((f) => f.tagAutomatica).length;
  const camposMedios = formularios.length ? Math.round(formularios.reduce((t, f) => t + f.campos.length, 0) / formularios.length) : 0;
  const proximaAcao = semLeads > 0
    ? {
        titulo: "Repartilhar formulario sem leads",
        detalhe: "Atualize o link em bio, stories, WhatsApp ou resposta rapida.",
        destino: "/app/formularios",
        icone: <ExternalLink size={16} />,
        prioridade: "alta",
        rotuloAcao: "Abrir link"
      } as const
    : topFormulario
      ? {
          titulo: `Criar sequencia para ${topFormulario.titulo}`,
          detalhe: `${topFormulario.totalSubmissoes} leads entraram. Ligar tag, resposta rapida e follow-up.`,
          destino: "/app/sequencias",
          icone: <Users size={16} />,
          prioridade: "media",
          rotuloAcao: "Sequencia"
      } as const
    : {
          titulo: "Criar formulario de interesse",
          detalhe: "Peça nome, telefone e produto de interesse.",
          destino: "/app/formularios",
          icone: <ClipboardList size={16} />,
          prioridade: "alta",
          rotuloAcao: "Criar"
        } as const;
  const atalhoAtivo = topFormulario ? `form ${topFormulario.titulo} -> leads` : "novo formulario de lead";

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Header with Big Number ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="crm-titulo">Formulários</h1>
            <p className="crm-subtitulo">{activos.length} {pluralizar(activos.length, "activo", "activos")} · {formularios.length} total</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* ── Hero Big Number ── */}
        <motion.div className="crm-command-panel mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springEntrada}>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)", color: "var(--primary)" }}>{totalLeads}</span>
            <span className="text-lg text-muted-foreground">{pluralizar(totalLeads, "lead captado", "leads captados")}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">em {formularios.length} {pluralizar(formularios.length, "formulário", "formulários")} · média de {formularios.length ? Math.round(totalLeads / formularios.length) : 0} por formulário</p>
        </motion.div>

        <CrmPainelOperacional
          modulo="Formulários"
          titulo="Captação com destino"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Leads", valor: String(totalLeads), detalhe: "captados por links", tom: totalLeads ? "sucesso" : "neutro" },
            { rotulo: "Sem leads", valor: String(semLeads), detalhe: "formularios ativos", tom: semLeads ? "perigo" : "sucesso" },
            { rotulo: "Com tag", valor: `${comTag}/${formularios.length || 0}`, detalhe: "origem rastreavel", tom: comTag ? "sucesso" : "atencao" },
            { rotulo: "Campos", valor: String(camposMedios), detalhe: "media por formulario", tom: camposMedios <= 5 ? "sucesso" : "atencao" }
          ]}
          atributos={[
            { rotulo: "Origem", valor: topFormulario?.titulo ?? "nenhuma", detalhe: topFormulario ? `${topFormulario.totalSubmissoes} leads` : "crie o primeiro link", tom: topFormulario ? "info" : "neutro" },
            { rotulo: "Tempo alvo", valor: "15 min", detalhe: "follow-up apos submissao", tom: "sucesso" },
            { rotulo: "Inativos", valor: String(inactivos.length), detalhe: "podem ser reaproveitados", tom: inactivos.length ? "atencao" : "sucesso" }
          ]}
          acoes={[
            { titulo: "Sequenciar leads", detalhe: "Entradas viram automacao", destino: "/app/sequencias", icone: <Users size={14} />, rotuloAcao: "Sequência" },
            { titulo: "Copiar link", detalhe: "Distribuir formulario", destino: "/app/formularios", icone: <Copy size={14} />, rotuloAcao: "Copiar" },
            { titulo: "Ver clientes", detalhe: "Leads criados no CRM", destino: "/app/clientes", icone: <ExternalLink size={14} />, rotuloAcao: "Clientes" }
          ]}
        />

        {/* ── Form Cards ── */}
        {formularios.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
            {formularios.map((form, i) => (
              <motion.div
                key={form.id}
                className="rounded-xl border bg-card overflow-hidden"
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ ...springCartao, delay: i * 0.05 }}
                whileHover={{ y: -3, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{form.titulo}</p>
                      {form.descricao && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{form.descricao}</p>
                      )}
                    </div>
                    <Badge variant={form.ativo ? "success" : "secondary"} className="text-[0.6rem] shrink-0">
                      {form.ativo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users size={12} />
                      <span className="tabular-nums font-semibold" style={{ color: form.totalSubmissoes > 0 ? "var(--foreground)" : undefined }}>{form.totalSubmissoes}</span>
                      <span>leads</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText size={12} />
                      <span>{form.campos.length} campos</span>
                    </div>
                  {form.tagAutomatica && (
                    <Badge variant="secondary" className="text-[0.6rem]">#{form.tagAutomatica}</Badge>
                  )}
                </div>
                <div className="crm-plus-mini-row mb-3">
                  <span>{form.tagAutomatica ? "lead roteado" : "adicionar tag"}</span>
                  <span>{form.totalSubmissoes ? "sequencia indicada" : "repartilhar link"}</span>
                </div>

                {/* Link bar */}
                  <div className="form-link-bar">
                    <span className="form-link-url">{form.linkPublico}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      title="Copiar link"
                      onClick={() => copiarLink(form.linkPublico)}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>

                  <p className="mt-2.5 text-[0.625rem] text-muted-foreground">
                    Criado {formatarDataHoraCurta(form.criadoEm)}
                  </p>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        ) : (
          <EstadoVazio
            icone={<ClipboardList />}
            titulo="Sem formulários"
            detalhe="Crie formulários simples para recolher contactos de clientes interessados. Partilhe o link por WhatsApp, Instagram bio ou site."
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
