import {
  Copy,
  Heart,
  Keyboard,
  MessageSquare,
  RefreshCcw,
  Search,
  Star
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
  CategoriaRespostaRapida,
  RespostaRapida,
  RespostaRespostasRapidas
} from "../tipos";

function traduzirCategoria(cat: CategoriaRespostaRapida): string {
  const traducoes: Record<CategoriaRespostaRapida, string> = {
    SAUDACAO: "Saudação",
    PRECO: "Preço",
    DISPONIBILIDADE: "Disponibilidade",
    PAGAMENTO: "Pagamento",
    ENTREGA: "Entrega",
    POS_VENDA: "Pós-venda",
    OUTRO: "Outro"
  };
  return traducoes[cat];
}

const springEntrada = { type: "spring" as const, stiffness: 300, damping: 24, mass: 0.8 };
const springCartao = { type: "spring" as const, stiffness: 400, damping: 26 };

const corCategoria: Record<CategoriaRespostaRapida, string> = {
  SAUDACAO: "#6366F1",
  PRECO: "#F59E0B",
  DISPONIBILIDADE: "#8B5CF6",
  PAGAMENTO: "#10B981",
  ENTREGA: "#3B82F6",
  POS_VENDA: "#EC4899",
  OUTRO: "#78716C"
};

export function PaginaRespostasRapidas() {
  const [respostas, setRespostas] = useState<RespostaRapida[]>([]);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaRespostaRapida | "todas">("todas");

  async function carregar() {
    try {
      const resposta = await requisitarApi<RespostaRespostasRapidas>("/respostas-rapidas?limite=100");
      setRespostas(resposta.respostas ?? []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar respostas rápidas.");
    }
  }

  useEffect(() => {
    void carregar().finally(() => setCarregandoInicial(false));
  }, []);

  async function alternarFavorita(resposta: RespostaRapida) {
    setCarregando(true);
    try {
      await requisitarApi(`/respostas-rapidas/${resposta.id}`, {
        method: "PATCH",
        body: { favorita: !resposta.favorita }
      });
      await carregar();
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro.");
    } finally {
      setCarregando(false);
    }
  }

  const favoritas = respostas.filter((r) => r.favorita);
  const categorias = [...new Set(respostas.map((r) => r.categoria))];
  const comVariaveis = respostas.filter((r) => r.variaveisUsadas.length > 0);
  const categoriasEssenciais: CategoriaRespostaRapida[] = ["SAUDACAO", "PRECO", "DISPONIBILIDADE", "PAGAMENTO", "ENTREGA", "POS_VENDA"];
  const categoriasEmFalta = categoriasEssenciais.filter((categoria) => !categorias.includes(categoria));
  const semVariaveis = respostas.filter((r) => r.variaveisUsadas.length === 0);
  const respostaPrioritaria = respostas.find((r) => r.favorita) ?? respostas[0];
  const cobertura = categoriasEssenciais.length ? Math.round(((categoriasEssenciais.length - categoriasEmFalta.length) / categoriasEssenciais.length) * 100) : 0;
  const proximaAcao = categoriasEmFalta[0]
    ? {
        titulo: `Criar resposta de ${traduzirCategoria(categoriasEmFalta[0])}`,
        detalhe: "Categoria ausente no atendimento. Criar texto padrao.",
        destino: "/app/respostas-rapidas",
        icone: <MessageSquare size={16} />,
        prioridade: "alta",
        rotuloAcao: "Criar"
      } as const
    : respostaPrioritaria
      ? {
          titulo: `Revisar "${respostaPrioritaria.titulo}"`,
          detalhe: respostaPrioritaria.variaveisUsadas.length
            ? "Confirmar se as variaveis continuam corretas."
            : "Adicionar nome, produto ou preco quando fizer sentido.",
          destino: "/app/respostas-rapidas",
          icone: <Keyboard size={16} />,
          prioridade: respostaPrioritaria.variaveisUsadas.length ? "media" : "alta",
          rotuloAcao: "Editar"
        } as const
      : {
          titulo: "Montar biblioteca minima de atendimento",
          detalhe: "Comece por saudacao, preco, disponibilidade, pagamento, entrega e pos-venda.",
          destino: "/app/respostas-rapidas",
          icone: <MessageSquare size={16} />,
          prioridade: "alta",
          rotuloAcao: "Comecar"
        } as const;
  const atalhoAtivo = categoriasEmFalta[0] ? `resposta ${traduzirCategoria(categoriasEmFalta[0])}` : "inserir resposta pronta";

  const respostasFiltradas = useMemo(() => respostas.filter((r) => {
    if (categoriaFiltro !== "todas" && r.categoria !== categoriaFiltro) return false;
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return r.titulo.toLowerCase().includes(termo) || r.texto.toLowerCase().includes(termo);
  }), [respostas, busca, categoriaFiltro]);

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <div className="crm-page">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <div>
            <h1 className="crm-titulo">Respostas Rápidas</h1>
            <p className="crm-subtitulo">{respostas.length} mensagens · {favoritas.length} favoritas · {categorias.length} categorias</p>
          </div>
          <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {/* ── Inline Summary ── */}
        <motion.div className="flex flex-wrap gap-3 pb-4 mb-4 border-b border-border/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 rounded-xl bg-accent border border-primary/10 px-4 py-2 text-sm text-accent-foreground">
            <Keyboard size={14} />
            <span className="font-medium">{respostas.length} prontas</span>
          </div>
          {favoritas.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#FFFBEB] border border-amber-200/60 px-4 py-2 text-sm text-amber-700">
              <Star size={14} />
              <span className="font-medium">{favoritas.length} favorita{favoritas.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {comVariaveis.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF5] border border-emerald-200/60 px-4 py-2 text-sm text-emerald-700">
              <span className="font-medium">{comVariaveis.length} com variáveis</span>
            </div>
          )}
        </motion.div>

        <CrmPainelOperacional
          modulo="Respostas rápidas"
          titulo="Biblioteca de atendimento"
          atalhoAtivo={atalhoAtivo}
          proximaAcao={proximaAcao}
          sinais={[
            { rotulo: "Cobertura", valor: `${cobertura}%`, detalhe: "categorias essenciais", tom: cobertura >= 100 ? "sucesso" : "atencao" },
            { rotulo: "Favoritas", valor: String(favoritas.length), detalhe: "atalhos pessoais", tom: favoritas.length ? "sucesso" : "neutro" },
            { rotulo: "Com variaveis", valor: String(comVariaveis.length), detalhe: "personalizam cliente/produto", tom: comVariaveis.length ? "sucesso" : "atencao" },
            { rotulo: "Sem variaveis", valor: String(semVariaveis.length), detalhe: "podem ficar genericas", tom: semVariaveis.length ? "atencao" : "sucesso" }
          ]}
          atributos={[
            { rotulo: "Proxima lacuna", valor: categoriasEmFalta[0] ? traduzirCategoria(categoriasEmFalta[0]) : "nenhuma", detalhe: "categoria que falta", tom: categoriasEmFalta[0] ? "perigo" : "sucesso" },
            { rotulo: "Modo atendente", valor: "atalho", detalhe: "inserir sem sair da conversa", tom: "info" },
            { rotulo: "Tom comercial", valor: respostaPrioritaria?.categoria ? traduzirCategoria(respostaPrioritaria.categoria) : "base", detalhe: "resposta mais pronta", tom: respostaPrioritaria ? "sucesso" : "neutro" }
          ]}
          acoes={[
            { titulo: "Copiar resposta", detalhe: "Usar a melhor mensagem", destino: "/app/conversas", icone: <Copy size={14} />, rotuloAcao: "Usar" },
            { titulo: "Favoritas", detalhe: "Organizar atalhos pessoais", destino: "/app/respostas-rapidas", icone: <Star size={14} />, rotuloAcao: "Favoritas" },
            { titulo: "Atendimento", detalhe: "Testar em conversa real", destino: "/app/conversas", icone: <MessageSquare size={14} />, rotuloAcao: "Atender" }
          ]}
        />

        {/* ── Search & Category Pills ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              aria-label="Buscar respostas"
              className="pl-9"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar por título ou texto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
          <button
            type="button"
            className={`clientes-filtro-pill ${categoriaFiltro === "todas" ? "clientes-filtro-pill--ativo" : ""}`}
            onClick={() => setCategoriaFiltro("todas")}
          >
            Todas
          </button>
          {(["SAUDACAO", "PRECO", "DISPONIBILIDADE", "PAGAMENTO", "ENTREGA", "POS_VENDA"] as CategoriaRespostaRapida[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`clientes-filtro-pill ${categoriaFiltro === cat ? "clientes-filtro-pill--ativo" : ""}`}
              onClick={() => setCategoriaFiltro(cat)}
            >
              {traduzirCategoria(cat)}
            </button>
          ))}
        </div>

        {/* ── Chat Bubble Cards ── */}
        {respostasFiltradas.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
            {respostasFiltradas.map((r, i) => {
              const cor = corCategoria[r.categoria];
              return (
                <motion.div
                  key={r.id}
                  className="rounded-xl border bg-card overflow-hidden"
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ ...springCartao, delay: i * 0.04 }}
                  whileHover={{ y: -3, boxShadow: "0 12px 30px -8px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{r.titulo}</p>
                        <span
                          className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold"
                          style={{ background: `color-mix(in srgb, ${cor} 10%, transparent)`, color: cor }}
                        >
                          {traduzirCategoria(r.categoria)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                        onClick={() => void alternarFavorita(r)}
                        title={r.favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart size={16} className={r.favorita ? "fill-warning text-warning" : "text-muted-foreground"} />
                      </button>
                    </div>

                    {/* Chat bubble preview */}
                    <div className="rr-bubble">{r.texto}</div>

                    {r.variaveisUsadas.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.variaveisUsadas.map((v) => (
                          <span key={v} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[0.6rem] font-mono text-muted-foreground">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="crm-plus-mini-row mt-3">
                      <span>{r.favorita ? "Atalho pessoal" : "Pode virar favorita"}</span>
                      <span>{r.variaveisUsadas.length ? "personalizada" : "adicionar variaveis"}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <EstadoVazio
            icone={<MessageSquare />}
            titulo="Sem respostas rápidas"
            detalhe="Crie mensagens prontas para saudação, preço, pagamento e entrega que os vendedores usam dezenas de vezes por dia."
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
