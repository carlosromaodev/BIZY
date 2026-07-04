import {
  AlertTriangle,
  Kanban,
  Package,
  Radio,
  RefreshCcw,
  ShoppingBag,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi } from "../../../api";
import { CrmPageMotion } from "../../../componentes/CrmInterno21st";
import { CabecalhoPagina } from "../../../componentes/Shell";
import { formatarKwanza } from "../../../utilidades";

interface ProjetoComercial {
  id: string;
  nome: string;
  tipo: string;
  estado: string;
  dataInicio: string | null;
  dataFim: string | null;
  _count?: {
    poolStock: number;
    equipaProjeto: number;
    filas: number;
  };
}

interface WarRoom {
  projetoComercialId: string;
  nome: string;
  tipo: string;
  estado: string;
  ativoAgora: boolean;
  periodo: { de: string; ate: string };
  placar: {
    vendasFechadas: number;
    receitaFechada: number;
    reservasConfirmadas: number;
    stockConsumido: number;
  };
  vendas: {
    pedidosTotais: number;
    receitaTotal: number;
    pedidosPagos: number;
    receitaPaga: number;
  };
  stock: {
    reservado: number;
    vendido: number;
    disponivel: number;
    pausados: number;
    taxaConsumo: number;
  };
  fila: {
    total: number;
    pendentes: number;
    atribuidos: number;
    concluidos: number;
  };
  equipa: {
    total: number;
    porPapel: Record<string, number>;
  };
  atualizadoEm: string;
}

export function PaginaProjectos() {
  const [projectos, setProjectos] = useState<ProjetoComercial[]>([]);
  const [projectoId, setProjectoId] = useState("");
  const [warRoom, setWarRoom] = useState<WarRoom | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [erro, setErro] = useState("");

  const projectoSelecionado = useMemo(
    () => projectos.find((projecto) => projecto.id === projectoId) ?? null,
    [projectoId, projectos]
  );

  async function carregarProjectos() {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await requisitarApi<ProjetoComercial[]>("/projectos/comerciais");
      setProjectos(resposta);
      setProjectoId((actual) => actual || resposta[0]?.id || "");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar os projectos.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarWarRoom(id = projectoId) {
    if (!id) {
      setWarRoom(null);
      return;
    }

    setActualizando(true);
    setErro("");
    try {
      const resposta = await requisitarApi<WarRoom>(`/projectos/comerciais/${id}/war-room`);
      setWarRoom(resposta);
    } catch (err) {
      setWarRoom(null);
      setErro(err instanceof Error ? err.message : "Não foi possível abrir o War Room.");
    } finally {
      setActualizando(false);
    }
  }

  useEffect(() => {
    void carregarProjectos();
  }, []);

  useEffect(() => {
    if (projectoId) void carregarWarRoom(projectoId);
  }, [projectoId]);

  if (carregando) {
    return (
      <CrmPageMotion>
        <div className="team-pgwrap">
          <CabecalhoPagina rotulo="Projectos" titulo="War Room" />
          <div className="cd-vazio" style={{ marginTop: "2rem" }}>
            <Radio size={24} />
            <span>A carregar projectos...</span>
          </div>
        </div>
      </CrmPageMotion>
    );
  }

  return (
    <CrmPageMotion>
      <div className="team-pgwrap">
        <CabecalhoPagina rotulo="Projectos" titulo="War Room">
          {
            <button
              type="button"
              className="team-btn team-btn-primary"
              onClick={() => carregarWarRoom()}
              disabled={!projectoId || actualizando}
              title="Actualizar War Room"
            >
              <RefreshCcw size={16} />
              Actualizar
            </button>
          }
        </CabecalhoPagina>

        {erro && (
          <div className="cd-tudo-ok" style={{ borderColor: "var(--destructive)", marginBottom: "1rem" }}>
            <AlertTriangle size={18} />
            <span>{erro}</span>
          </div>
        )}

        {projectos.length === 0 ? (
          <div className="cd-vazio" style={{ marginTop: "2rem" }}>
            <Kanban size={24} />
            <span>Nenhum projecto comercial disponível.</span>
          </div>
        ) : (
          <>
            <section className="cd-pedidos-recentes" style={{ marginBottom: "1rem" }}>
              <div className="cd-secao-head">
                <span className="cd-secao-titulo">Projectos comerciais</span>
                <span className="team-bdg" data-tone="blue">{projectos.length}</span>
              </div>
              <div className="cd-pedidos-lista">
                {projectos.map((projecto) => (
                  <button
                    key={projecto.id}
                    type="button"
                    className="cd-pedido"
                    onClick={() => setProjectoId(projecto.id)}
                    style={{
                      borderColor: projecto.id === projectoId ? "var(--em)" : undefined,
                      textAlign: "left",
                      width: "100%"
                    }}
                  >
                    <div>
                      <strong>{projecto.nome}</strong>
                      <span>{projecto.tipo} · {projecto.estado}</span>
                    </div>
                    <div className="cd-pedido-meta">
                      <span>{projecto._count?.equipaProjeto ?? 0} equipa</span>
                      <span>{projecto._count?.filas ?? 0} fila</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {projectoSelecionado && (
              <div className="cd-accoes-titulo" style={{ marginBottom: "0.75rem" }}>
                <span>{projectoSelecionado.nome}</span>
                <span className="team-bdg" data-tone={warRoom?.ativoAgora ? "green" : "amber"}>
                  {warRoom?.ativoAgora ? "Activo" : projectoSelecionado.estado}
                </span>
              </div>
            )}

            {warRoom && (
              <>
                <div className="team-kstrip" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                  <div className="team-kcard">
                    <div className="team-kcard-label"><ShoppingBag size={14} /> Vendas fechadas</div>
                    <div className="team-kcard-value">{warRoom.placar.vendasFechadas}</div>
                    <div className="team-kcard-delta">{formatarKwanza(warRoom.placar.receitaFechada)}</div>
                  </div>
                  <div className="team-kcard">
                    <div className="team-kcard-label"><Wallet size={14} /> Receita total</div>
                    <div className="team-kcard-value">{formatarKwanza(warRoom.vendas.receitaTotal)}</div>
                    <div className="team-kcard-delta">{warRoom.vendas.pedidosTotais} pedidos</div>
                  </div>
                  <div className="team-kcard">
                    <div className="team-kcard-label"><Package size={14} /> Stock consumido</div>
                    <div className="team-kcard-value">{warRoom.stock.taxaConsumo}%</div>
                    <div className="team-kcard-delta">{warRoom.stock.vendido}/{warRoom.stock.reservado} unidades</div>
                  </div>
                  <div className="team-kcard">
                    <div className="team-kcard-label"><Radio size={14} /> Reservas</div>
                    <div className="team-kcard-value">{warRoom.placar.reservasConfirmadas}</div>
                    <div className="team-kcard-delta">Actualizado {new Date(warRoom.atualizadoEm).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>

                <div className="cd-grid-dupla" style={{ marginTop: "1rem" }}>
                  <section className="cd-pedidos-recentes">
                    <div className="cd-secao-head">
                      <span className="cd-secao-titulo">Fila do projecto</span>
                      <span className="team-bdg" data-tone="blue">{warRoom.fila.total}</span>
                    </div>
                    <div className="team-kstrip" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                      <MiniKpi rotulo="Pendentes" valor={warRoom.fila.pendentes} />
                      <MiniKpi rotulo="Atribuídos" valor={warRoom.fila.atribuidos} />
                      <MiniKpi rotulo="Concluídos" valor={warRoom.fila.concluidos} />
                    </div>
                  </section>

                  <section className="cd-pedidos-recentes">
                    <div className="cd-secao-head">
                      <span className="cd-secao-titulo">Equipa alocada</span>
                      <span className="team-bdg" data-tone="green"><UsersRound size={13} /> {warRoom.equipa.total}</span>
                    </div>
                    <div className="cd-pedidos-lista">
                      {Object.entries(warRoom.equipa.porPapel).map(([papel, total]) => (
                        <div key={papel} className="cd-pedido">
                          <div>
                            <strong>{papel.replace(/_/g, " ")}</strong>
                            <span>{total} membro(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="cd-pedidos-recentes" style={{ marginTop: "1rem" }}>
                  <div className="cd-secao-head">
                    <span className="cd-secao-titulo">Pool de stock</span>
                    <span className="team-bdg" data-tone={warRoom.stock.disponivel > 0 ? "green" : "amber"}>
                      {warRoom.stock.disponivel} disponível
                    </span>
                  </div>
                  <div className="team-kstrip" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                    <MiniKpi rotulo="Reservado" valor={warRoom.stock.reservado} />
                    <MiniKpi rotulo="Vendido" valor={warRoom.stock.vendido} />
                    <MiniKpi rotulo="Disponível" valor={warRoom.stock.disponivel} />
                    <MiniKpi rotulo="Pausados" valor={warRoom.stock.pausados} />
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </CrmPageMotion>
  );
}

function MiniKpi({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="team-kcard">
      <div className="team-kcard-label">{rotulo}</div>
      <div className="team-kcard-value">{valor}</div>
    </div>
  );
}
