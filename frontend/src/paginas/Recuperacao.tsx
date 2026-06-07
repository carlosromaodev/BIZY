import {
  AlertTriangle,
  Clock,
  Phone,
  RefreshCcw,
  Send,
  ShoppingCart,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  PageHead,
  BotaoBizy,
  IconChip,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  StatusBadge,
  TableCard,
  Table,
  TableHead,
  Th,
  Td,
  Money,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import type {
  OportunidadeRecuperacao,
  RespostaOportunidadesRecuperacao,
  RespostaTarefasOperacionais,
  TarefaOperacional
} from "../tipos";
import { formatarKwanza } from "../utilidades";

type SegmentoId = "expiradas" | "atraso" | "abandonados" | "inativos";

interface Segmento {
  id: SegmentoId;
  rotulo: string;
  icone: typeof Clock;
  cor: CorSemantica;
  valor: string;
  detalhe: string;
}

export function PaginaRecuperacao() {
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [oportunidades, setOportunidades] = useState<OportunidadeRecuperacao[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [segmentoActivo, setSegmentoActivo] = useState<SegmentoId>("expiradas");

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaTarefas, respostaOportunidades] = await Promise.allSettled([
        requisitarApi<RespostaTarefasOperacionais>("/tarefas?limite=20"),
        requisitarApi<RespostaOportunidadesRecuperacao>("/recuperacao/oportunidades?limite=20")
      ]);

      setTarefas(respostaTarefas.status === "fulfilled" ? respostaTarefas.value.tarefas ?? [] : []);
      setOportunidades(respostaOportunidades.status === "fulfilled" ? respostaOportunidades.value.oportunidades ?? [] : []);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar recuperação.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const tarefasAbertas = tarefas.filter((t) => t.estado === "ABERTA" || t.estado === "EM_ANDAMENTO");
  const oportunidadesAbertas = oportunidades.filter((o) => o.estado === "ABERTA" || o.estado === "EM_ATENDIMENTO");

  /* ── Segmentar oportunidades por tipo ── */
  const expiradas = oportunidadesAbertas.filter((o) => o.gatilho.toLowerCase().includes("expir"));
  const atraso = oportunidadesAbertas.filter((o) => o.gatilho.toLowerCase().includes("pagamento") || o.gatilho.toLowerCase().includes("atraso"));
  const abandonados = oportunidadesAbertas.filter((o) => o.gatilho.toLowerCase().includes("carrinho") || o.gatilho.toLowerCase().includes("abandon"));
  const inativos = oportunidadesAbertas.filter((o) =>
    !expiradas.includes(o) && !atraso.includes(o) && !abandonados.includes(o)
  );

  const valorExpiradas = expiradas.reduce((t, o) => t + (o.valorEstimadoEmKwanza ?? 0), 0);
  const valorAtraso = atraso.reduce((t, o) => t + (o.valorEstimadoEmKwanza ?? 0), 0);
  const valorAbandonados = abandonados.reduce((t, o) => t + (o.valorEstimadoEmKwanza ?? 0), 0);

  const segmentos: Segmento[] = [
    { id: "expiradas", rotulo: "Reservas expiradas", icone: Clock, cor: "amber", valor: valorExpiradas > 0 ? formatarKwanza(valorExpiradas) : String(expiradas.length), detalhe: `${expiradas.length} reservas · maior risco` },
    { id: "atraso", rotulo: "Pagamentos em atraso", icone: AlertTriangle, cor: "rose", valor: valorAtraso > 0 ? formatarKwanza(valorAtraso) : String(atraso.length), detalhe: `${atraso.length} pedido${atraso.length !== 1 ? "s" : ""}` },
    { id: "abandonados", rotulo: "Carrinhos abandonados", icone: ShoppingCart, cor: "blue", valor: valorAbandonados > 0 ? formatarKwanza(valorAbandonados) : String(abandonados.length), detalhe: `${abandonados.length} na Loja Digital` },
    { id: "inativos", rotulo: "Clientes inativos", icone: Users, cor: "violet", valor: String(inativos.length + tarefasAbertas.length), detalhe: "sem compra há 30+ dias" },
  ];

  const itensDoSegmento = (): OportunidadeRecuperacao[] => {
    switch (segmentoActivo) {
      case "expiradas": return expiradas;
      case "atraso": return atraso;
      case "abandonados": return abandonados;
      case "inativos": return inativos;
    }
  };

  function obterAgingLabel(o: OportunidadeRecuperacao): { texto: string; classe: string } {
    const criado = new Date(o.criadaEm);
    const agora = new Date();
    const diffMs = agora.getTime() - criado.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias >= 2) return { texto: `há ${diffDias} dias`, classe: "hot" };
    if (diffHoras >= 12) return { texto: `há ${diffDias || 1} dia`, classe: "warm" };
    return { texto: `há ${diffHoras}h`, classe: "warm" };
  }

  function obterSugestao(o: OportunidadeRecuperacao): string {
    if (o.motivo.toLowerCase().includes("expir")) return "Reativar reserva + desconto";
    if (o.motivo.toLowerCase().includes("pagamento")) return "Ligar + confirmar morada";
    if (o.motivo.toLowerCase().includes("carrinho")) return "Lembrete com link de pagamento";
    return "Follow-up personalizado";
  }

  async function assumirOportunidade(oportunidade: OportunidadeRecuperacao) {
    setMensagem("A assumir oportunidade...");
    try {
      await requisitarApi(`/recuperacao/oportunidades/${oportunidade.id}`, {
        method: "PATCH",
        body: { estado: "EM_ATENDIMENTO", observacao: [oportunidade.observacao, "Assumida no painel de recuperação."].filter(Boolean).join("\n") }
      });
      await carregar();
      setMensagem("Oportunidade colocada em atendimento.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível assumir a oportunidade.");
    }
  }

  const itensTabela = itensDoSegmento();

  return (
    <CrmPageMotion>
      <PageHead eyebrow="Vendas a um passo de se perderem" titulo="Recuperação" tamanhoTitulo="sm">
        <BotaoBizy icone={Send} onClick={() => void 0}>Lembrete em massa</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      {/* ── Segment cards ── */}
      <div className="bz-rec-cards">
        {segmentos.map((seg) => (
          <button
            key={seg.id}
            type="button"
            className={`bz-rec-c${segmentoActivo === seg.id ? " sel" : ""}`}
            onClick={() => setSegmentoActivo(seg.id)}
          >
            <div className="bz-rec-l">
              <IconChip icone={seg.icone} cor={seg.cor} tamanho={32} />
              {seg.rotulo}
            </div>
            <div className="bz-rec-v bz-tnum">{seg.valor}</div>
            <div className="bz-rec-s">{seg.detalhe}</div>
          </button>
        ))}
      </div>

      {/* ── Recovery table ── */}
      <TableCard>
        <Table>
          <TableHead>
            <Th>Cliente</Th>
            <Th>Motivo</Th>
            <Th right>Valor</Th>
            <Th>Há quanto</Th>
            <Th>Sugestão</Th>
            <Th right>Ação</Th>
          </TableHead>
          <tbody>
            {itensTabela.length > 0 ? itensTabela.map((o) => {
              const nome = (o.contexto?.clienteNome as string) || o.clienteTelefone || "Cliente";
              const username = o.clienteTelefone ? `@${o.clienteTelefone}` : "";
              const aging = obterAgingLabel(o);
              const corBadge = segmentoActivo === "expiradas" ? "amber"
                : segmentoActivo === "atraso" ? "rose"
                : segmentoActivo === "abandonados" ? "blue"
                : "violet";

              return (
                <tr key={o.id}>
                  <Td>
                    <div className="bz-cli">
                      <AvatarBizy iniciais={obterIniciais(nome)} cor={obterCorAvatar(nome)} tamanho={34} />
                      <div>
                        <div className="bz-cli-name">{nome}</div>
                        {username && <div className="bz-cli-at">{username}</div>}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge cor={corBadge as CorSemantica}>{o.motivo}</StatusBadge>
                  </Td>
                  <Td right>
                    {o.valorEstimadoEmKwanza ? <Money valor={o.valorEstimadoEmKwanza} /> : "—"}
                  </Td>
                  <Td>
                    <span className={`bz-aging ${aging.classe}`}>{aging.texto}</span>
                  </Td>
                  <Td>
                    <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{obterSugestao(o)}</span>
                  </Td>
                  <Td right>
                    {segmentoActivo === "atraso" ? (
                      <button type="button" className="bz-recover-btn ghost" onClick={() => void assumirOportunidade(o)}>
                        <Phone size={13} />Ligar
                      </button>
                    ) : (
                      <button type="button" className="bz-recover-btn" onClick={() => void assumirOportunidade(o)}>
                        <Send size={13} />Lembrete
                      </button>
                    )}
                  </Td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="bz-feed-empty">
                  {carregando ? "A carregar..." : "Sem oportunidades neste segmento."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>

      {mensagem && <footer className="bz-panel" style={{ padding: "12px 18px", fontSize: 13.5, color: "var(--ink-2)" }} aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}
