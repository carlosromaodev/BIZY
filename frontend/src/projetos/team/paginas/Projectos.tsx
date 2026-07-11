import {
  AlertTriangle,
  BookOpenCheck,
  BriefcaseBusiness,
  GitPullRequestArrow,
  Kanban,
  Package,
  Plus,
  Radio,
  RefreshCcw,
  ShoppingBag,
  UsersRound,
  Wallet,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
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

interface ProjectoPortfolio {
  id: string;
  nome: string;
  objetivo: string | null;
  estado: string;
  prioridade: string;
  nivelRisco: string;
  gestorId: string | null;
  orcamento: number | null;
  roiEsperado: number | null;
  capacidadeConsumida: number;
  progressoPercentual: number;
  bloqueios: number;
  dataFim: string | null;
  stakeholders: string[];
  criteriosSucesso: string[];
}

interface PortfolioResposta {
  itens: ProjectoPortfolio[];
  metricas: { total: number; activos: number; emRisco: number; capacidadeConsumida: number; roiEsperado: number };
  referenciaGovernanca: string;
}

interface MembroProjectoOpcao {
  id: string;
  usuario: { nome: string };
}

export function PaginaProjectos() {
  const [vista, setVista] = useState<"PORTFOLIO" | "WAR_ROOM">("PORTFOLIO");
  return (
    <>
      <div className="team-pgwrap" style={{ paddingBottom: 0 }}>
        <div className="inline-flex rounded-md border bg-background p-1" aria-label="Vista de projectos">
          <button type="button" className={`team-btn ${vista === "PORTFOLIO" ? "team-btn-primary" : ""}`} onClick={() => setVista("PORTFOLIO")}>
            <BriefcaseBusiness size={16} /> Portfólio
          </button>
          <button type="button" className={`team-btn ${vista === "WAR_ROOM" ? "team-btn-primary" : ""}`} onClick={() => setVista("WAR_ROOM")}>
            <Radio size={16} /> War Room
          </button>
        </div>
      </div>
      {vista === "PORTFOLIO" ? <PortfolioProjectos /> : <WarRoomProjectos />}
    </>
  );
}

function PortfolioProjectos() {
  const [portfolio, setPortfolio] = useState<PortfolioResposta | null>(null);
  const [membros, setMembros] = useState<MembroProjectoOpcao[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [acao, setAcao] = useState("");
  const [novo, setNovo] = useState({ nome: "", objetivo: "", gestorId: "", prioridade: "MEDIA", nivelRisco: "BAIXO", dataFim: "" });
  const [governanca, setGovernanca] = useState({ tipo: "RISCO", titulo: "", severidade: "MEDIO", plano: "", motivo: "", impacto: "", licao: "" });

  const seleccionado = portfolio?.itens.find((item) => item.id === seleccionadoId) ?? null;

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const [dados, equipa] = await Promise.all([
        requisitarApi<PortfolioResposta>("/projectos/portfolio?limite=200"),
        requisitarApi<{ membros: MembroProjectoOpcao[] }>("/equipa/membros?limite=200")
      ]);
      setPortfolio(dados);
      setMembros(equipa.membros);
      setSeleccionadoId((actual) => actual || dados.itens[0]?.id || "");
      setNovo((actual) => ({ ...actual, gestorId: actual.gestorId || equipa.membros[0]?.id || "" }));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o portfólio.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function executar(nome: string, trabalho: () => Promise<unknown>) {
    setAcao(nome);
    setErro("");
    try {
      await trabalho();
      await carregar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível concluir a acção.");
    } finally {
      setAcao("");
    }
  }

  function criarProjecto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!novo.nome.trim() || !novo.gestorId) return;
    void executar("criar", () => requisitarApi("/projectos", {
      method: "POST",
      body: JSON.stringify({
        nome: novo.nome.trim(),
        objetivo: novo.objetivo.trim() || undefined,
        gestorId: novo.gestorId,
        prioridade: novo.prioridade,
        nivelRisco: novo.nivelRisco,
        dataFim: novo.dataFim ? new Date(`${novo.dataFim}T23:59:59`).toISOString() : undefined,
        criteriosSucesso: novo.objetivo.trim() ? [novo.objetivo.trim()] : []
      })
    }));
  }

  function registarRisco(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado || !governanca.titulo.trim() || !governanca.plano.trim() || !novo.gestorId) return;
    void executar("risco", () => requisitarApi(`/projectos/${seleccionado.id}/riscos`, {
      method: "POST",
      body: JSON.stringify({ tipo: governanca.tipo, titulo: governanca.titulo, severidade: governanca.severidade, ownerId: novo.gestorId, planoMitigacao: governanca.plano })
    }));
  }

  function registarMudanca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado || !governanca.motivo.trim() || !governanca.impacto.trim() || !novo.gestorId) return;
    void executar("mudanca", () => requisitarApi(`/projectos/${seleccionado.id}/mudancas`, {
      method: "POST",
      body: JSON.stringify({ motivo: governanca.motivo, impacto: governanca.impacto, aprovadoPorId: novo.gestorId, alteracoes: { prioridade: governanca.severidade === "CRITICO" ? "CRITICA" : "ALTA", nivelRisco: governanca.severidade } })
    }));
  }

  function registarLicao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!seleccionado || !governanca.licao.trim() || !novo.gestorId) return;
    void executar("licao", () => requisitarApi(`/projectos/${seleccionado.id}/licoes`, {
      method: "POST",
      body: JSON.stringify({ contexto: "PROJECTO", resultado: governanca.licao, causa: governanca.motivo || "Análise da equipa", melhoria: governanca.impacto || "Aplicar no próximo ciclo", ownerId: novo.gestorId })
    }));
  }

  return (
    <CrmPageMotion>
      <div className="team-pgwrap">
        <CabecalhoPagina rotulo="Projectos" titulo="Portfólio operacional">
          <button type="button" className="team-btn" onClick={() => void carregar()} disabled={carregando} title="Actualizar portfólio"><RefreshCcw size={16} /></button>
        </CabecalhoPagina>
        {erro && <div className="cd-tudo-ok" style={{ borderColor: "var(--destructive)", marginBottom: "1rem" }}><AlertTriangle size={18} /><span>{erro}</span></div>}
        <div className="team-kstrip" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          <MiniKpi rotulo="Activos" valor={portfolio?.metricas.activos ?? 0} />
          <MiniKpi rotulo="Em risco" valor={portfolio?.metricas.emRisco ?? 0} />
          <MiniKpi rotulo="Capacidade" valor={portfolio?.metricas.capacidadeConsumida ?? 0} />
          <MiniKpi rotulo="ROI esperado" valor={portfolio?.metricas.roiEsperado ?? 0} />
        </div>

        <div className="cd-grid-dupla" style={{ marginTop: "1rem", alignItems: "start" }}>
          <section className="cd-pedidos-recentes">
            <div className="cd-secao-head"><span className="cd-secao-titulo">Portfólio</span><span className="team-bdg" data-tone="blue">{portfolio?.metricas.total ?? 0}</span></div>
            <div className="cd-pedidos-lista">
              {(portfolio?.itens ?? []).map((projecto) => (
                <button key={projecto.id} type="button" className="cd-pedido" onClick={() => setSeleccionadoId(projecto.id)} style={{ width: "100%", textAlign: "left", borderColor: projecto.id === seleccionadoId ? "var(--em)" : undefined }}>
                  <div><strong>{projecto.nome}</strong><span>{projecto.prioridade} · {projecto.progressoPercentual}% · {projecto.estado}</span></div>
                  <div className="cd-pedido-meta"><span>{projecto.nivelRisco}</span><span>{projecto.bloqueios} bloqueios</span></div>
                </button>
              ))}
              {!carregando && !(portfolio?.itens.length) && <div className="cd-vazio"><Kanban size={22} /><span>Nenhum projecto no portfólio.</span></div>}
            </div>
          </section>

          <form className="cd-pedidos-recentes" onSubmit={criarProjecto}>
            <div className="cd-secao-head"><span className="cd-secao-titulo">Novo charter</span><Plus size={16} /></div>
            <label className="team-field"><span>Nome</span><input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required /></label>
            <label className="team-field"><span>Objectivo</span><textarea value={novo.objetivo} onChange={(e) => setNovo({ ...novo, objetivo: e.target.value })} /></label>
            <label className="team-field"><span>Owner</span><select value={novo.gestorId} onChange={(e) => setNovo({ ...novo, gestorId: e.target.value })}>{membros.map((membro) => <option key={membro.id} value={membro.id}>{membro.usuario.nome}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2"><label className="team-field"><span>Prioridade</span><select value={novo.prioridade} onChange={(e) => setNovo({ ...novo, prioridade: e.target.value })}><option>BAIXA</option><option>MEDIA</option><option>ALTA</option><option>CRITICA</option></select></label><label className="team-field"><span>Risco</span><select value={novo.nivelRisco} onChange={(e) => setNovo({ ...novo, nivelRisco: e.target.value })}><option>BAIXO</option><option>MEDIO</option><option>ALTO</option><option>CRITICO</option></select></label></div>
            <label className="team-field"><span>Prazo</span><input type="date" value={novo.dataFim} onChange={(e) => setNovo({ ...novo, dataFim: e.target.value })} /></label>
            <button className="team-btn team-btn-primary" type="submit" disabled={Boolean(acao) || !novo.gestorId}><Plus size={16} /> Criar projecto</button>
          </form>
        </div>

        {seleccionado && <section className="cd-pedidos-recentes" style={{ marginTop: "1rem" }}>
          <div className="cd-secao-head"><span className="cd-secao-titulo">Governança · {seleccionado.nome}</span><span className="team-bdg" data-tone={seleccionado.nivelRisco === "CRITICO" ? "amber" : "blue"}>{seleccionado.nivelRisco}</span></div>
          <p className="text-sm text-muted-foreground">{seleccionado.objetivo || "Defina o objectivo na próxima mudança controlada."}</p>
          <div className="grid gap-3 lg:grid-cols-3" style={{ marginTop: "1rem" }}>
            <form onSubmit={registarRisco} className="space-y-2"><strong className="flex items-center gap-2 text-sm"><AlertTriangle size={15} /> Risco ou issue</strong><input className="w-full" placeholder="Título" value={governanca.titulo} onChange={(e) => setGovernanca({ ...governanca, titulo: e.target.value })} /><textarea className="w-full" placeholder="Plano de mitigação" value={governanca.plano} onChange={(e) => setGovernanca({ ...governanca, plano: e.target.value })} /><button className="team-btn" type="submit" disabled={Boolean(acao)}>Registar</button></form>
            <form onSubmit={registarMudanca} className="space-y-2"><strong className="flex items-center gap-2 text-sm"><GitPullRequestArrow size={15} /> Mudança controlada</strong><input className="w-full" placeholder="Motivo" value={governanca.motivo} onChange={(e) => setGovernanca({ ...governanca, motivo: e.target.value })} /><textarea className="w-full" placeholder="Impacto" value={governanca.impacto} onChange={(e) => setGovernanca({ ...governanca, impacto: e.target.value })} /><button className="team-btn" type="submit" disabled={Boolean(acao)}>Submeter</button></form>
            <form onSubmit={registarLicao} className="space-y-2"><strong className="flex items-center gap-2 text-sm"><BookOpenCheck size={15} /> Lição aprendida</strong><textarea className="w-full" placeholder="Resultado e aprendizagem" value={governanca.licao} onChange={(e) => setGovernanca({ ...governanca, licao: e.target.value })} /><button className="team-btn" type="submit" disabled={Boolean(acao)}>Guardar lição</button></form>
          </div>
        </section>}
        <p className="mt-3 text-xs text-muted-foreground">{portfolio?.referenciaGovernanca}</p>
      </div>
    </CrmPageMotion>
  );
}

function WarRoomProjectos() {
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
