import { Heart, Search, Send, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Conversa, Peca, RespostaRapida, CategoriaRespostaRapida } from "../../tipos";
import { formatarKwanza } from "../../utilidades";

const springPainel = { type: "spring" as const, stiffness: 400, damping: 28 };

const traduzirCategoria: Record<CategoriaRespostaRapida, string> = {
  SAUDACAO: "Saudação",
  PRECO: "Preço",
  DISPONIBILIDADE: "Disponibilidade",
  PAGAMENTO: "Pagamento",
  ENTREGA: "Entrega",
  POS_VENDA: "Pós-venda",
  OUTRO: "Outro"
};

const corCategoria: Record<CategoriaRespostaRapida, string> = {
  SAUDACAO: "#6366F1",
  PRECO: "#F59E0B",
  DISPONIBILIDADE: "#8B5CF6",
  PAGAMENTO: "#10B981",
  ENTREGA: "#3B82F6",
  POS_VENDA: "#EC4899",
  OUTRO: "#78716C"
};

function interpolarVariaveis(
  texto: string,
  conversa: Conversa,
  peca: Peca | null
): { resultado: string; temPendentes: boolean } {
  let resultado = texto;
  let temPendentes = false;

  resultado = resultado.replace(/\{nome\}/gi, conversa.nomeCliente || "{nome}");
  resultado = resultado.replace(/\{telefone\}/gi, conversa.telefone || "{telefone}");

  if (peca) {
    resultado = resultado.replace(/\{produto\}/gi, peca.nome);
    resultado = resultado.replace(/\{preco\}/gi, formatarKwanza(peca.precoEmKwanza));
    resultado = resultado.replace(/\{stock\}/gi, String(peca.quantidade));
    resultado = resultado.replace(/\{codigo\}/gi, peca.codigo);
  }

  if (/\{[a-zA-Z_]+\}/.test(resultado)) {
    temPendentes = true;
  }

  return { resultado, temPendentes };
}

export function RespostasRapidasPainel({
  respostas,
  conversaAtual,
  pecaRelacionada,
  aberto,
  onFechar,
  onUsarTexto,
  onEnviarTexto
}: {
  respostas: RespostaRapida[];
  conversaAtual: Conversa;
  pecaRelacionada: Peca | null;
  aberto: boolean;
  onFechar: () => void;
  onUsarTexto: (texto: string) => void;
  onEnviarTexto: (texto: string) => void;
}) {
  const [busca, setBusca] = useState("");

  const respostasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = termo
      ? respostas.filter((r) => r.titulo.toLowerCase().includes(termo) || r.texto.toLowerCase().includes(termo))
      : respostas;

    return [...lista].sort((a, b) => {
      if (a.favorita && !b.favorita) return -1;
      if (!a.favorita && b.favorita) return 1;
      return 0;
    });
  }, [respostas, busca]);

  const agrupadas = useMemo(() => {
    const grupos = new Map<CategoriaRespostaRapida, RespostaRapida[]>();
    for (const r of respostasFiltradas) {
      const lista = grupos.get(r.categoria) ?? [];
      lista.push(r);
      grupos.set(r.categoria, lista);
    }
    return grupos;
  }, [respostasFiltradas]);

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="atendimento-respostas-painel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={springPainel}
        >
          <div className="atendimento-respostas-inner">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                <Zap size={14} />
                <span>Respostas rápidas</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onFechar}>
                <X size={14} />
              </Button>
            </div>

            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
              <Input
                className="h-8 pl-8 text-xs"
                style={{ paddingLeft: "2rem" }}
                placeholder="Buscar resposta..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="atendimento-respostas-grid">
              {[...agrupadas.entries()].map(([categoria, items]) => (
                <div key={categoria}>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold mb-1.5"
                    style={{ background: `color-mix(in srgb, ${corCategoria[categoria]} 10%, transparent)`, color: corCategoria[categoria] }}
                  >
                    {traduzirCategoria[categoria]}
                  </span>
                  {items.map((r) => {
                    const { resultado, temPendentes } = interpolarVariaveis(r.texto, conversaAtual, pecaRelacionada);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className="atendimento-resposta-item"
                        onClick={() => onUsarTexto(resultado)}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold truncate">{r.titulo}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {r.favorita && <Heart size={10} className="fill-warning text-warning" />}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-5 w-5"
                              onClick={(e) => { e.stopPropagation(); onEnviarTexto(resultado); }}
                              title="Enviar directo"
                            >
                              <Send size={10} />
                            </Button>
                          </div>
                        </div>
                        <p className={`text-[0.7rem] leading-relaxed text-muted-foreground line-clamp-2 ${temPendentes ? "atendimento-resposta-pendente" : ""}`}>
                          {resultado}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
              {respostasFiltradas.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">Nenhuma resposta encontrada.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
