import { AlertTriangle, CheckCircle2, CheckSquare, Clock, ListChecks, Package, Plus, Square } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  BotaoBizy,
  EmptyStateBizy,
  PanelCard,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import type { RespostaTarefasOperacionais, TarefaOperacional } from "../tipos";

function ehHoje(data: string | null): boolean {
  if (!data) return false;
  return new Date(data).toDateString() === new Date().toDateString();
}

function ehEstaSemana(data: string | null): boolean {
  if (!data) return false;
  const d = new Date(data);
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7);
  return d >= inicioSemana && d < fimSemana;
}

function corPrioridadeTag(prioridade: string): { cor: string; bg: string } {
  switch (prioridade) {
    case "URGENTE": return { cor: "var(--rose-ink)", bg: "var(--rose-tint)" };
    case "ALTA": return { cor: "var(--amber-ink)", bg: "var(--amber-tint)" };
    default: return { cor: "var(--ink-3)", bg: "var(--bg)" };
  }
}

function traduzirPrioridadeTag(prioridade: string): string {
  switch (prioridade) {
    case "URGENTE": return "Urgente";
    case "ALTA": return "Alta";
    case "NORMAL": return "Normal";
    case "BAIXA": return "Baixa";
    default: return prioridade;
  }
}

export function PaginaTarefas() {
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState<TarefaOperacional["prioridade"]>("NORMAL");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    requisitarApi<RespostaTarefasOperacionais>("/tarefas")
      .then((r) => setTarefas(r?.tarefas ?? []))
      .catch(() => setTarefas([]))
      .finally(() => setCarregando(false));
  }

  useEffect(() => { void carregar(); }, []);

  async function criarTarefaManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!novoTitulo.trim()) {
      setMensagem("Escreva o que precisa ser feito.");
      return;
    }

    setMensagem("A criar tarefa...");
    try {
      const resposta = await requisitarApi<{ tarefa: TarefaOperacional }>("/tarefas", {
        method: "POST",
        body: {
          tipo: "MANUAL",
          titulo: novoTitulo.trim(),
          descricao: "",
          prioridade: novaPrioridade,
          origem: "manual",
          prazoEm: novoPrazo ? new Date(novoPrazo).toISOString() : null,
          contexto: { origemUi: "tarefas" }
        }
      });
      setTarefas((prev) => [resposta.tarefa, ...prev]);
      setNovoTitulo("");
      setNovaPrioridade("NORMAL");
      setNovoPrazo("");
      setMostrarForm(false);
      setMensagem("Tarefa criada e adicionada ao quadro.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar a tarefa.");
    }
  }

  async function concluir(id: string) {
    try {
      const resposta = await requisitarApi<{ tarefa: TarefaOperacional }>(`/tarefas/${id}`, { method: "PATCH", body: { estado: "CONCLUIDA" } });
      setTarefas((prev) => prev.map((t) => (t.id === id ? resposta.tarefa : t)));
      setMensagem("Tarefa concluída.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível concluir a tarefa.");
    }
  }

  /* ── Cálculos para KPIs ── */
  const concluidas = tarefas.filter((t) => t.estado === "CONCLUIDA");
  const concluidasHoje = concluidas.filter((t) => ehHoje(t.concluidaEm));
  const abertas = tarefas.filter((t) => t.estado === "ABERTA" || t.estado === "EM_ANDAMENTO");
  const atrasadas = abertas.filter((t) => t.prazoEm && new Date(t.prazoEm) < new Date());
  const paraHoje = abertas.filter((t) => ehHoje(t.prazoEm));
  const estaSemana = abertas.filter((t) => ehEstaSemana(t.prazoEm) && !ehHoje(t.prazoEm));

  /* ── Colunas kanban ── */
  const colunaHoje = useMemo(() => {
    const urgentes = abertas.filter((t) => t.prioridade === "URGENTE" || t.prioridade === "ALTA");
    const hoje = paraHoje.filter((t) => t.prioridade !== "URGENTE" && t.prioridade !== "ALTA");
    return [...urgentes, ...hoje];
  }, [abertas, paraHoje]);

  const colunaSemana = useMemo(() => {
    return abertas.filter((t) =>
      !colunaHoje.includes(t) && (ehEstaSemana(t.prazoEm) || (!t.prazoEm && t.prioridade === "NORMAL"))
    );
  }, [abertas, colunaHoje]);

  const colunaConcluidas = useMemo(() => {
    return concluidas.slice(0, 10);
  }, [concluidas]);

  const totalPlaneadas = abertas.length + concluidasHoje.length;
  const taxaConclusao = totalPlaneadas > 0 ? Math.round((concluidasHoje.length / totalPlaneadas) * 100) : 0;

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow="Operação · o que fazer a seguir"
        titulo="Tarefas"
        tamanhoTitulo="sm"
        descricao="Crie, acompanhe e conclua trabalho humano ligado a vendas, atendimento, cobrança e entrega."
      >
        <BotaoBizy icone={Plus} onClick={() => setMostrarForm(true)}>Nova tarefa</BotaoBizy>
      </PageHead>

      {mostrarForm && (
        <PanelCard titulo="Criar tarefa" descricao="Registe uma acção curta que a equipa consiga concluir no turno.">
          <form className="bz-form-grid" onSubmit={criarTarefaManual}>
            <label className="bz-field">
              <span>Tarefa</span>
              <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Ex.: ligar ao cliente do pedido #123" autoFocus />
            </label>
            <label className="bz-field">
              <span>Prioridade</span>
              <select value={novaPrioridade} onChange={(e) => setNovaPrioridade(e.target.value as TarefaOperacional["prioridade"])}>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </label>
            <label className="bz-field">
              <span>Prazo</span>
              <input type="datetime-local" value={novoPrazo} onChange={(e) => setNovoPrazo(e.target.value)} />
            </label>
            <div className="bz-form-actions">
              <BotaoBizy tipo="submit" icone={Plus}>Criar</BotaoBizy>
              <BotaoBizy variante="tertiary" onClick={() => setMostrarForm(false)}>Cancelar</BotaoBizy>
            </div>
          </form>
        </PanelCard>
      )}

      <KpiGrid>
        <KpiCard
          hero
          icone={CheckSquare}
          rotulo="Concluídas hoje"
          valor={concluidasHoje.length}
          delta={`taxa de ${taxaConclusao}%`}
          deltaPositivo={taxaConclusao >= 50 ? true : undefined}
          rodape={`de ${totalPlaneadas} tarefas planeadas`}
        />
        <KpiCard
          icone={AlertTriangle}
          cor="rose"
          rotulo="Atrasadas"
          valor={atrasadas.length}
          delta={atrasadas.length > 0 ? "requer atenção" : "tudo em dia"}
          deltaPositivo={atrasadas.length > 0 ? false : undefined}
        />
        <KpiCard
          icone={Clock}
          cor="amber"
          rotulo="Para hoje"
          valor={paraHoje.length}
          delta="em aberto"
        />
        <KpiCard
          icone={Package}
          cor="blue"
          rotulo="Esta semana"
          valor={estaSemana.length}
          delta="planeadas"
        />
      </KpiGrid>

      {carregando ? (
        <EmptyStateBizy icone={<ListChecks />} titulo="A carregar tarefas" detalhe="Estamos a montar o quadro operacional do turno." />
      ) : abertas.length === 0 && concluidas.length === 0 ? (
        <EmptyStateBizy
          icone={<ListChecks />}
          titulo="Sem tarefas"
          detalhe="Crie a primeira tarefa manual ou deixe pedidos, conversas e automações gerarem trabalho para a equipa."
          acaoTexto="Criar tarefa"
          onAcao={() => setMostrarForm(true)}
        />
      ) : (
        <div className="bz-board">
          <ColunaKanban
            titulo="A fazer hoje"
            cor="rose"
            tarefas={colunaHoje}
            onConcluir={concluir}
          />
          <ColunaKanban
            titulo="Esta semana"
            cor="amber"
            tarefas={colunaSemana}
            onConcluir={concluir}
          />
          <ColunaKanban
            titulo="Concluídas"
            cor="green"
            tarefas={colunaConcluidas}
            concluida
          />
        </div>
      )}

      {mensagem && <footer className="bz-panel" style={{ padding: "12px 18px", fontSize: 13.5, color: "var(--ink-2)" }} aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

/* ── Coluna do kanban ── */

function ColunaKanban({
  titulo,
  cor,
  tarefas,
  concluida,
  onConcluir,
}: {
  titulo: string;
  cor: CorSemantica;
  tarefas: TarefaOperacional[];
  concluida?: boolean;
  onConcluir?: (id: string) => void;
}) {
  return (
    <div className="bz-col">
      <div className="bz-col-head">
        <span className="bz-col-dot" style={{ background: `var(--${cor})` }} />
        <span className="bz-col-title">{titulo}</span>
        <span className="bz-col-count">{tarefas.length}</span>
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {tarefas.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <CartaoTarefa
              tarefa={t}
              concluida={concluida}
              onConcluir={onConcluir}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {tarefas.length === 0 && (
        <div className="bz-col-empty">Nenhuma tarefa</div>
      )}
    </div>
  );
}

/* ── Cartão de tarefa ── */

function CartaoTarefa({
  tarefa,
  concluida,
  onConcluir,
}: {
  tarefa: TarefaOperacional;
  concluida?: boolean;
  onConcluir?: (id: string) => void;
}) {
  const tag = corPrioridadeTag(tarefa.prioridade);
  const nomeResponsavel = tarefa.responsavelId ?? "Carlos";
  const avatarCor = obterCorAvatar(nomeResponsavel);
  const iniciais = obterIniciais(nomeResponsavel);

  return (
    <div className={`bz-tcard${concluida ? " is-done" : ""}`}>
      <div className="bz-tcard-top">
        {concluida ? (
          <span className="bz-tcard-box done">
            <CheckCircle2 size={14} />
          </span>
        ) : onConcluir ? (
          <button
            type="button"
            className={`bz-tcard-box${tarefa.prioridade === "URGENTE" ? " urgent" : ""}`}
            onClick={() => onConcluir(tarefa.id)}
            title="Concluir tarefa"
          >
            <Square size={14} style={{ opacity: 0 }} />
          </button>
        ) : (
          <span className="bz-tcard-box" />
        )}
        <div className="bz-tcard-h">{tarefa.titulo}</div>
      </div>
      {tarefa.descricao && (
        <p className="bz-tcard-desc">{tarefa.descricao}</p>
      )}
      <div className="bz-tcard-foot">
        <span className="bz-tcard-who">
          <AvatarBizy iniciais={iniciais} cor={avatarCor} tamanho={22} />
          {nomeResponsavel.split(" ")[0]}
        </span>
        <span
          className="bz-tcard-tag"
          style={{ color: tag.cor, background: tag.bg }}
        >
          {concluida
            ? "Feito"
            : `${traduzirPrioridadeTag(tarefa.prioridade)}${tarefa.pedidoId ? ` · #${tarefa.pedidoId.slice(0, 6)}` : ""}`
          }
        </span>
      </div>
    </div>
  );
}
