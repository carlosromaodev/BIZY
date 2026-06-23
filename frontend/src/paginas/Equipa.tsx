import {
  Activity,
  CheckCircle2,
  Clock,
  Crown,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCcw,
  Send,
  Shield,
  Target,
  Trash2,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  TableCard,
  Table,
  TableHead,
  Th,
  Td,
  StatusBadge,
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  BotaoBizy,
  TabsBizy,
  PanelCard,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import type {
  MembroNegocio,
  PapelNegocio,
  RespostaMembros,
  RespostaPapeis,
  ConviteEquipa,
  RespostaConvites,
  ActividadeFeed,
  RespostaFeed,
  DesempenhoMembro,
  RespostaDesempenho,
} from "../tipos";

type TabEquipa = "membros" | "convites" | "actividade" | "desempenho";

export function PaginaEquipa() {
  const [tabActiva, setTabActiva] = useState<TabEquipa>("membros");
  const [membros, setMembros] = useState<MembroNegocio[]>([]);
  const [papeis, setPapeis] = useState<PapelNegocio[]>([]);
  const [convites, setConvites] = useState<ConviteEquipa[]>([]);
  const [feed, setFeed] = useState<ActividadeFeed[]>([]);
  const [desempenho, setDesempenho] = useState<RespostaDesempenho | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  // form convite
  const [novoNome, setNovoNome] = useState("");
  const [novoContacto, setNovoContacto] = useState("");
  const [novoPapel, setNovoPapel] = useState("VENDEDOR");

  async function carregar() {
    setCarregando(true);
    try {
      const [rm, rp, rc, rf, rd] = await Promise.allSettled([
        requisitarApi<RespostaMembros>("/negocio/membros"),
        requisitarApi<RespostaPapeis>("/negocio/papeis"),
        requisitarApi<RespostaConvites>("/equipa/convites"),
        requisitarApi<RespostaFeed>("/equipa/feed"),
        requisitarApi<RespostaDesempenho>("/equipa/desempenho"),
      ]);
      setMembros(rm.status === "fulfilled" ? rm.value.membros : []);
      setPapeis(rp.status === "fulfilled" ? rp.value.papeis : []);
      setConvites(rc.status === "fulfilled" ? rc.value.convites : []);
      setFeed(rf.status === "fulfilled" ? rf.value.actividades : []);
      setDesempenho(rd.status === "fulfilled" ? rd.value : null);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  async function convidarMembro() {
    if (!novoContacto.trim()) return;
    const ehEmail = novoContacto.includes("@");
    try {
      await requisitarApi("/equipa/convites", {
        method: "POST",
        body: {
          nomeConvidado: novoNome || undefined,
          ...(ehEmail ? { email: novoContacto } : { telefone: novoContacto }),
          papelSugerido: novoPapel,
        },
      });
      setNovoNome(""); setNovoContacto(""); setNovoPapel("VENDEDOR"); setMostrarForm(false);
      await carregar();
    } catch { /* silencioso */ }
  }

  async function reenviarConvite(id: string) {
    try {
      await requisitarApi(`/equipa/convites/${id}/reenviar`, { method: "POST" });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function revogarConvite(id: string) {
    try {
      await requisitarApi(`/equipa/convites/${id}/revogar`, { method: "POST" });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function desativarMembro(id: string) {
    try {
      await requisitarApi(`/equipa/membros/${id}/desativar`, { method: "PATCH" });
      await carregar();
    } catch { /* silencioso */ }
  }

  const ativos = membros.filter((m) => m.estado === "ATIVO").length;
  const convitesPendentes = convites.filter((c) => c.estado === "PENDENTE" || c.estado === "REENVIO").length;

  const tabs = [
    { id: "membros" as const, rotulo: "Membros", contagem: membros.length },
    { id: "desempenho" as const, rotulo: "Desempenho", contagem: desempenho?.ranking.length ?? 0 },
    { id: "convites" as const, rotulo: "Convites", contagem: convitesPendentes },
    { id: "actividade" as const, rotulo: "Actividade", contagem: feed.length },
  ];

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Gestão de equipa · ${membros.length} membro${membros.length !== 1 ? "s" : ""}`}
        titulo="Equipa"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={UserPlus} onClick={() => { setMostrarForm(true); setTabActiva("convites"); }}>Convidar</BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Users} rotulo="Total membros" valor={membros.length} delta={`${ativos} activo${ativos !== 1 ? "s" : ""}`} deltaPositivo />
        <KpiCard icone={Crown} cor="amber" rotulo="Papéis" valor={papeis.length} />
        <KpiCard icone={UserPlus} cor="blue" rotulo="Convites pendentes" valor={convitesPendentes} delta={convitesPendentes > 0 ? "aguardando" : "nenhum"} />
        <KpiCard icone={Shield} cor="violet" rotulo="Permissões" valor={new Set(membros.flatMap((m) => m.permissoes)).size} delta="tipos únicos" />
      </KpiGrid>

      <TabsBizy tabs={tabs} activo={tabActiva} onChange={(id) => setTabActiva(id as TabEquipa)} />

      {/* ── Tab Membros ────────────────────────────────────────── */}
      {tabActiva === "membros" && (
        <>
          <TableCard>
            <Table>
              <TableHead>
                <Th>Membro</Th>
                <Th>Papel</Th>
                <Th>Contacto</Th>
                <Th>Último acesso</Th>
                <Th>Estado</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {membros.length > 0 ? membros.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <div className="bz-cli">
                        <AvatarBizy iniciais={obterIniciais(m.nome)} cor={obterCorAvatar(m.nome)} tamanho={34} />
                        <div>
                          <div className="bz-cli-name">{m.nome}</div>
                          <div className="bz-cli-at">{m.email ?? "—"}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge cor={m.papel.includes("ADMIN") || m.papel.includes("DONO") ? "amber" : "blue"}>
                        {m.papel}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <div className="bz-eq-contact">
                        {m.telefone && <><Phone size={12} />{m.telefone}</>}
                        {m.email && <><Mail size={12} />{m.email}</>}
                        {!m.telefone && !m.email && "—"}
                      </div>
                    </Td>
                    <Td>
                      <span className="bz-eq-meta">
                        {m.ultimoAcesso ? new Date(m.ultimoAcesso).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Nunca"}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge cor={corEstado(m.estado)}>
                        {m.estado === "ATIVO" ? "Ativo" : m.estado === "CONVIDADO" ? "Convidado" : "Inativo"}
                      </StatusBadge>
                    </Td>
                    <Td>
                      {m.estado === "ATIVO" && !m.papel.includes("DONO") && (
                        <button type="button" className="bz-iconbtn" title="Suspender membro" onClick={() => void desativarMembro(m.id)}>
                          <UserMinus size={14} />
                        </button>
                      )}
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar equipa..." : "Sem membros. Convide a sua equipa para colaborar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>

          {/* Papéis */}
          {papeis.length > 0 && (
            <PanelCard titulo="Papéis e permissões">
              <div className="bz-rec-cards">
                {papeis.map((p) => (
                  <div key={p.id} className="bz-rec-c">
                    <div className="bz-eq-role-head">
                      <Shield size={16} className="bz-icon-violet" />
                      <strong className="bz-eq-role-name">{p.nome}</strong>
                    </div>
                    {p.descricao && <div className="bz-eq-role-desc">{p.descricao}</div>}
                    <div className="bz-eq-perms">
                      {p.permissoes.slice(0, 6).map((perm) => (
                        <span key={perm} className="bz-eq-perm">{perm}</span>
                      ))}
                      {p.permissoes.length > 6 && <span className="bz-eq-perm-more">+{p.permissoes.length - 6}</span>}
                    </div>
                    <div className="bz-eq-role-count">{p.totalMembros} membro{p.totalMembros !== 1 ? "s" : ""}</div>
                  </div>
                ))}
              </div>
            </PanelCard>
          )}
        </>
      )}

      {/* ── Tab Convites ───────────────────────────────────────── */}
      {tabActiva === "convites" && (
        <>
          {mostrarForm && (
            <PanelCard titulo="Novo convite">
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome (opcional)" />
                <Input value={novoContacto} onChange={(e) => setNovoContacto(e.target.value)} placeholder="Telefone ou email" />
                <select className="bz-toolbar-select-input" value={novoPapel} onChange={(e) => setNovoPapel(e.target.value)}>
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="ATENDENTE">Atendente</option>
                  <option value="ADMIN">Admin</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="ENTREGADOR">Entregador</option>
                </select>
                <div className="flex gap-2">
                  <BotaoBizy icone={Plus} onClick={() => void convidarMembro()}>Enviar</BotaoBizy>
                  <BotaoBizy variante="ghost" onClick={() => setMostrarForm(false)}>Cancelar</BotaoBizy>
                </div>
              </div>
            </PanelCard>
          )}

          {!mostrarForm && (
            <div className="bz-eq-invite-action">
              <BotaoBizy icone={UserPlus} onClick={() => setMostrarForm(true)}>Novo convite</BotaoBizy>
            </div>
          )}

          <TableCard>
            <Table>
              <TableHead>
                <Th>Convidado</Th>
                <Th>Contacto</Th>
                <Th>Papel</Th>
                <Th>Estado</Th>
                <Th>Expira em</Th>
                <Th>Acções</Th>
              </TableHead>
              <tbody>
                {convites.length > 0 ? convites.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <div className="bz-cli">
                        <AvatarBizy
                          iniciais={obterIniciais(c.nomeConvidado ?? c.email ?? c.telefone ?? "?")}
                          cor={obterCorAvatar(c.nomeConvidado ?? c.email ?? "convite")}
                          tamanho={34}
                        />
                        <div>
                          <div className="bz-cli-name">{c.nomeConvidado ?? "Sem nome"}</div>
                          <div className="bz-cli-at">{new Date(c.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="bz-eq-contact">
                        {c.email && <><Mail size={12} />{c.email}</>}
                        {c.telefone && <><Phone size={12} />{c.telefone}</>}
                      </div>
                    </Td>
                    <Td><StatusBadge cor="blue">{c.papelSugerido}</StatusBadge></Td>
                    <Td>
                      <StatusBadge cor={corEstadoConvite(c.estado)}>
                        {c.estado === "PENDENTE" ? "Pendente" : c.estado === "ACEITE" ? "Aceite" : c.estado === "REENVIO" ? "Reenviado" : "Expirado"}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <span className="bz-eq-meta">
                        {new Date(c.expiraEm) > new Date()
                          ? new Date(c.expiraEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "Expirado"}
                      </span>
                    </Td>
                    <Td>
                      {(c.estado === "PENDENTE" || c.estado === "REENVIO") && (
                        <div className="flex gap-1">
                          <button type="button" className="bz-iconbtn" title="Reenviar" onClick={() => void reenviarConvite(c.id)}>
                            <Send size={14} />
                          </button>
                          <button type="button" className="bz-iconbtn" title="Revogar" onClick={() => void revogarConvite(c.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="bz-feed-empty">
                      {carregando ? "A carregar convites..." : "Sem convites. Convide membros para a equipa."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {/* ── Tab Desempenho ───────────────────────────────────── */}
      {tabActiva === "desempenho" && desempenho && (
        <>
          <KpiGrid>
            <KpiCard hero icone={TrendingUp} rotulo="Receita equipa" valor={formatarKz(desempenho.totais.receitaTotal)} delta={`${desempenho.totais.totalVendas} pedido${desempenho.totais.totalVendas !== 1 ? "s" : ""}`} deltaPositivo />
            <KpiCard icone={MessageSquare} cor="blue" rotulo="Conversas" valor={desempenho.totais.totalConversas} />
            <KpiCard icone={Target} cor="green" rotulo="Tarefas concluídas" valor={desempenho.totais.tarefasConcluidas} delta={`de ${desempenho.totais.totalTarefas}`} deltaPositivo={desempenho.totais.tarefasConcluidas > 0} />
          </KpiGrid>

          <TableCard>
            <Table>
              <TableHead>
                <Th>#</Th>
                <Th>Membro</Th>
                <Th>Vendas</Th>
                <Th>Receita</Th>
                <Th>Conversão</Th>
                <Th>Conversas</Th>
                <Th>Tarefas</Th>
              </TableHead>
              <tbody>
                {desempenho.ranking.length > 0 ? desempenho.ranking.map((m) => (
                  <tr key={m.membroId}>
                    <Td>
                      <span className="bz-eq-rank">{m.posicao === 1 ? "🥇" : m.posicao === 2 ? "🥈" : m.posicao === 3 ? "🥉" : m.posicao}</span>
                    </Td>
                    <Td>
                      <div className="bz-cli">
                        <AvatarBizy iniciais={obterIniciais(m.nome)} cor={obterCorAvatar(m.nome)} tamanho={34} />
                        <div>
                          <div className="bz-cli-name">{m.nome}</div>
                          <div className="bz-cli-at">{m.papel}</div>
                        </div>
                      </div>
                    </Td>
                    <Td><strong>{m.kpis.totalVendas}</strong></Td>
                    <Td>{formatarKz(m.kpis.receitaTotal)}</Td>
                    <Td>
                      <StatusBadge cor={m.kpis.taxaConversao >= 70 ? "green" : m.kpis.taxaConversao >= 40 ? "amber" : "mute"}>
                        {m.kpis.taxaConversao}%
                      </StatusBadge>
                    </Td>
                    <Td>{m.kpis.conversasResolvidas}/{m.kpis.totalConversas}</Td>
                    <Td>{m.kpis.tarefasConcluidas}/{m.kpis.totalTarefas}</Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="bz-feed-empty">
                      Sem dados de desempenho para o período.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {tabActiva === "desempenho" && !desempenho && (
        <PanelCard titulo="Desempenho">
          <div className="bz-feed-empty">
            {carregando ? "A carregar dados de desempenho..." : "Sem dados de desempenho disponíveis."}
          </div>
        </PanelCard>
      )}

      {/* ── Tab Actividade ─────────────────────────────────────── */}
      {tabActiva === "actividade" && (
        <PanelCard titulo="Feed de actividade">
          {feed.length > 0 ? (
            <div className="bz-eq-feed">
              {feed.map((a) => (
                <div key={a.id} className="bz-eq-feed-item">
                  <span className="bz-eq-feed-icon">
                    {iconeActividade(a.tipo)}
                  </span>
                  <div className="bz-eq-feed-body">
                    <span className="bz-eq-feed-resumo">{a.resumo}</span>
                    <span className="bz-eq-feed-data">
                      {new Date(a.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <StatusBadge cor={corTipoActividade(a.tipo)}>
                    {rotuloTipoActividade(a.tipo)}
                  </StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <div className="bz-feed-empty">
              {carregando ? "A carregar actividades..." : "Sem actividades recentes."}
            </div>
          )}
        </PanelCard>
      )}
    </CrmPageMotion>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */

function corEstado(estado: string): CorSemantica {
  if (estado === "ATIVO") return "green";
  if (estado === "CONVIDADO") return "amber";
  return "mute";
}

function corEstadoConvite(estado: string): CorSemantica {
  if (estado === "PENDENTE" || estado === "REENVIO") return "amber";
  if (estado === "ACEITE") return "green";
  return "mute";
}

function corTipoActividade(tipo: string): CorSemantica {
  if (tipo.includes("CONVITE")) return "blue";
  if (tipo.includes("MEMBRO")) return "amber";
  if (tipo.includes("NOTA")) return "violet";
  return "mute";
}

function rotuloTipoActividade(tipo: string): string {
  if (tipo === "CONVITE_CRIADO") return "Convite";
  if (tipo === "CONVITE_ACEITE") return "Aceite";
  if (tipo === "MEMBRO_DESATIVADO") return "Suspenso";
  if (tipo === "NOTA_CRIADA") return "Nota";
  return tipo.split("_").join(" ").toLowerCase();
}

function iconeActividade(tipo: string) {
  if (tipo === "CONVITE_CRIADO") return <UserPlus size={14} />;
  if (tipo === "CONVITE_ACEITE") return <CheckCircle2 size={14} />;
  if (tipo === "MEMBRO_DESATIVADO") return <XCircle size={14} />;
  if (tipo === "NOTA_CRIADA") return <Activity size={14} />;
  return <Clock size={14} />;
}

function formatarKz(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1)}M Kz`;
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(0)}k Kz`;
  return `${valor} Kz`;
}
