import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Eye,
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
import { requisitarApi } from "../../../api";
import { CrmPageMotion } from "../../../componentes/CrmInterno21st";
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
} from "../../../componentes/BizyDesignSystem";
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
  ModoSombraEquipa,
  PerfilOperacional360Equipa,
  RespostaCapacidadeEquipa,
  RespostaOffboardingEquipa,
  FormularioCaptacao,
  RespostaFormularios,
} from "../../../tipos";

type TabEquipa = "membros" | "convites" | "actividade" | "desempenho";
type DepartamentoEquipa = { id: string; nome: string };
type CategoriaSkill = PerfilOperacional360Equipa["skills"][number]["categoria"];

export function PaginaEquipa() {
  const [tabActiva, setTabActiva] = useState<TabEquipa>("membros");
  const [membros, setMembros] = useState<MembroNegocio[]>([]);
  const [papeis, setPapeis] = useState<PapelNegocio[]>([]);
  const [convites, setConvites] = useState<ConviteEquipa[]>([]);
  const [feed, setFeed] = useState<ActividadeFeed[]>([]);
  const [desempenho, setDesempenho] = useState<RespostaDesempenho | null>(null);
  const [formularios, setFormularios] = useState<FormularioCaptacao[]>([]);
  const [modoSombra, setModoSombra] = useState<ModoSombraEquipa | null>(null);
  const [capacidade, setCapacidade] = useState<RespostaCapacidadeEquipa | null>(null);
  const [perfil360, setPerfil360] = useState<PerfilOperacional360Equipa | null>(null);
  const [departamentos, setDepartamentos] = useState<DepartamentoEquipa[]>([]);
  const [modoSombraCarregando, setModoSombraCarregando] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  // form convite
  const [novoNome, setNovoNome] = useState("");
  const [novoContacto, setNovoContacto] = useState("");
  const [novoPapel, setNovoPapel] = useState("VENDEDOR");
  const [cargoPerfil, setCargoPerfil] = useState("");
  const [departamentoPerfil, setDepartamentoPerfil] = useState("");
  const [novaSkill, setNovaSkill] = useState("");
  const [categoriaSkill, setCategoriaSkill] = useState<CategoriaSkill>("ATENDIMENTO");
  const [nivelSkill, setNivelSkill] = useState(3);
  const [objetivoDesenvolvimento, setObjetivoDesenvolvimento] = useState("");
  const [acaoDesenvolvimento, setAcaoDesenvolvimento] = useState("");
  const [prazoDesenvolvimento, setPrazoDesenvolvimento] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [rm, rp, rc, rf, rd, rfm, rcap, rdep] = await Promise.allSettled([
        requisitarApi<RespostaMembros>("/negocio/membros"),
        requisitarApi<RespostaPapeis>("/negocio/papeis"),
        requisitarApi<RespostaConvites>("/equipa/convites"),
        requisitarApi<RespostaFeed>("/equipa/feed"),
        requisitarApi<RespostaDesempenho>("/equipa/desempenho"),
        requisitarApi<RespostaFormularios>("/formularios?limite=5"),
        requisitarApi<RespostaCapacidadeEquipa>("/equipa/capacidade"),
        requisitarApi<DepartamentoEquipa[]>("/projectos/departamentos"),
      ]);
      setMembros(rm.status === "fulfilled" ? rm.value.membros : []);
      setPapeis(rp.status === "fulfilled" ? rp.value.papeis : []);
      setConvites(rc.status === "fulfilled" ? rc.value.convites : []);
      setFeed(rf.status === "fulfilled" ? rf.value.actividades : []);
      setDesempenho(rd.status === "fulfilled" ? rd.value : null);
      setFormularios(rfm.status === "fulfilled" ? rfm.value.formularios : []);
      setCapacidade(rcap.status === "fulfilled" ? rcap.value : null);
      setDepartamentos(rdep.status === "fulfilled" ? rdep.value : []);
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
      await requisitarApi<RespostaOffboardingEquipa>(`/equipa/membros/${id}/offboarding`, {
        method: "POST",
        body: { motivo: "Offboarding iniciado pela gestão da equipa." }
      });
      await carregar();
    } catch { /* silencioso */ }
  }

  async function abrirPerfil360(id: string) {
    try {
      const resposta = await requisitarApi<PerfilOperacional360Equipa>(`/equipa/membros/${id}/360`);
      setPerfil360(resposta);
      setCargoPerfil(resposta.membro.cargo ?? "");
      setDepartamentoPerfil(resposta.membro.departamento?.id ?? "");
    } catch { /* silencioso */ }
  }

  async function guardarPerfilOperacional() {
    if (!perfil360) return;
    try {
      await requisitarApi(`/equipa/membros/${perfil360.membro.id}/perfil-operacional`, {
        method: "PATCH",
        body: { cargo: cargoPerfil.trim() || null, departamentoId: departamentoPerfil || null }
      });
      await abrirPerfil360(perfil360.membro.id);
    } catch { /* silencioso */ }
  }

  async function adicionarSkill() {
    if (!perfil360 || !novaSkill.trim()) return;
    try {
      await requisitarApi(`/equipa/membros/${perfil360.membro.id}/skills`, {
        method: "PUT",
        body: {
          skills: [
            ...perfil360.skills.map(({ id, nome, categoria, nivel, estado, evidencias }) => ({ id, nome, categoria, nivel, estado, evidencias })),
            { nome: novaSkill.trim(), categoria: categoriaSkill, nivel: nivelSkill, estado: "DECLARADA" }
          ]
        }
      });
      setNovaSkill("");
      await abrirPerfil360(perfil360.membro.id);
    } catch { /* silencioso */ }
  }

  async function criarDesenvolvimento() {
    if (!perfil360 || !objetivoDesenvolvimento.trim() || !acaoDesenvolvimento.trim() || !prazoDesenvolvimento) return;
    try {
      await requisitarApi(`/equipa/membros/${perfil360.membro.id}/desenvolvimento`, {
        method: "POST",
        body: {
          objetivo: objetivoDesenvolvimento.trim(),
          acao: acaoDesenvolvimento.trim(),
          prazoEm: new Date(`${prazoDesenvolvimento}T12:00:00`).toISOString()
        }
      });
      setObjetivoDesenvolvimento("");
      setAcaoDesenvolvimento("");
      setPrazoDesenvolvimento("");
      await abrirPerfil360(perfil360.membro.id);
    } catch { /* silencioso */ }
  }

  async function abrirModoSombra(id: string) {
    setModoSombraCarregando(id);
    try {
      const resposta = await requisitarApi<ModoSombraEquipa>(`/equipa/membros/${id}/modo-sombra`);
      setModoSombra(resposta);
    } catch { /* silencioso */ }
    finally { setModoSombraCarregando(null); }
  }

  const ativos = membros.filter((m) => m.estado === "ATIVO").length;
  const convitesPendentes = convites.filter((c) => c.estado === "PENDENTE" || c.estado === "REENVIO").length;
  const membrosSobrecarregados = capacidade?.resumo.sobrecarregados ?? 0;
  const membrosIndisponiveis = capacidade?.resumo.indisponiveis ?? 0;
  const alertasSla = (capacidade?.resumo.tarefasAtrasadas ?? 0) + (capacidade?.resumo.conversasForaSla ?? 0);
  const formularioLead = formularios.find((form) => form.tagAutomatica === "lead-formulario") ?? formularios[0] ?? null;

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
        <KpiCard icone={Shield} cor={membrosSobrecarregados + membrosIndisponiveis > 0 ? "rose" : "violet"} rotulo="Capacidade" valor={capacidade?.resumo.disponiveis ?? 0} delta={`${membrosSobrecarregados} sobrecarregados · ${membrosIndisponiveis} indisponíveis`} />
      </KpiGrid>

      {capacidade && (
        <PanelCard titulo="Capacidade operacional" descricao="Distribuição atual de carga por membro ativo.">
          <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="bz-eq-perm">{capacidade.resumo.presentes} presentes</span>
            <span className="bz-eq-perm">{alertasSla} alertas SLA</span>
            <span className="bz-eq-perm">{capacidade.resumo.tarefasAtrasadas} tarefas atrasadas</span>
            <span className="bz-eq-perm">{capacidade.resumo.conversasForaSla} conversas fora SLA</span>
          </div>
          <div className="bz-rec-cards">
            {capacidade.membros.slice(0, 6).map((item) => (
              <div key={item.membroId} className="bz-rec-c">
                <div className="bz-eq-role-head">
                  <Activity size={16} className={item.estado === "SOBRECARREGADO" || item.estado === "INDISPONIVEL" ? "bz-icon-rose" : "bz-icon-green"} />
                  <strong className="bz-eq-role-name">{item.nome}</strong>
                </div>
                <div className="bz-eq-role-desc">{item.papel} · {item.estado.toLowerCase()}</div>
                <div className="bz-eq-role-desc">
                  {item.presencaAtiva ? "Presente" : item.emTurno ? "Em turno sem check-in" : "Fora de turno"}
                </div>
                {item.ausenciaAtiva && (
                  <div className="bz-eq-role-desc">Ausência: {item.ausenciaAtiva.motivo}</div>
                )}
                <div className="text-xl font-semibold tabular-nums">{item.capacidadePercentual}%</div>
                <div className="bz-eq-perms">
                  <span className="bz-eq-perm">{item.carga.tarefas} tarefas</span>
                  <span className="bz-eq-perm">{item.carga.conversas} conversas</span>
                  <span className="bz-eq-perm">{item.carga.pedidos} pedidos</span>
                  {item.sla.tarefasAtrasadas > 0 && <span className="bz-eq-perm">{item.sla.tarefasAtrasadas} atrasadas</span>}
                  {item.sla.conversasForaSla > 0 && <span className="bz-eq-perm">{item.sla.conversasForaSla} fora SLA</span>}
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      )}

      {formularioLead && (
        <PanelCard
          titulo="Formulário de captação"
          descricao="Link público e respostas do lead que entram no Team."
          linkTexto="Abrir formulários"
          linkRota="/app/formularios"
          acaoTexto="Copiar link"
          acaoIcone={Copy}
          onAcao={() => { void navigator.clipboard.writeText(formularioLead.linkPublico).catch(() => undefined); }}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge cor={formularioLead.ativo ? "green" : "amber"}>
                  {formularioLead.ativo ? "Activo" : "Inactivo"}
                </StatusBadge>
                {formularioLead.tagAutomatica && (
                  <StatusBadge cor="blue">#{formularioLead.tagAutomatica}</StatusBadge>
                )}
              </div>
              <p className="bz-eq-role-desc">
                {formularioLead.descricao ?? "Formulário simples para captar contactos e transformar respostas em leads do Team."}
              </p>
              <div className="form-link-bar">
                <span className="form-link-url">{formularioLead.linkPublico}</span>
                <button
                  type="button"
                  className="bz-iconbtn"
                  title="Copiar link público"
                  onClick={() => { void navigator.clipboard.writeText(formularioLead.linkPublico).catch(() => undefined); }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Respostas</div>
                <div className="text-xl font-semibold tabular-nums">{formularioLead.totalSubmissoes}</div>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Campos</div>
                <div className="text-xl font-semibold tabular-nums">{formularioLead.campos.length}</div>
              </div>
              <div>
                <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">Criado</div>
                <div className="text-sm font-medium">
                  {new Date(formularioLead.criadoEm).toLocaleDateString("pt-AO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
              </div>
            </div>
          </div>
        </PanelCard>
      )}

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
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="bz-iconbtn"
                          title="Modo sombra"
                          onClick={() => void abrirModoSombra(m.id)}
                          disabled={modoSombraCarregando === m.id}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="bz-iconbtn"
                          title="Perfil 360"
                          onClick={() => void abrirPerfil360(m.id)}
                        >
                          <Activity size={14} />
                        </button>
                        {m.estado === "ATIVO" && !m.papel.includes("DONO") && (
                          <button type="button" className="bz-iconbtn" title="Offboarding seguro" onClick={() => void desativarMembro(m.id)}>
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
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

          {modoSombra && (
            <PanelCard
              titulo={`Modo sombra · ${modoSombra.membro.nome}`}
              descricao={`${modoSombra.membro.papel} · ${modoSombra.contexto}`}
              acaoTexto="Fechar"
              acaoIcone={XCircle}
              onAcao={() => setModoSombra(null)}
            >
              <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input value={cargoPerfil} onChange={(evento) => setCargoPerfil(evento.target.value)} placeholder="Cargo operacional" aria-label="Cargo operacional" />
                <select className="bz-toolbar-select-input" value={departamentoPerfil} onChange={(evento) => setDepartamentoPerfil(evento.target.value)} aria-label="Departamento">
                  <option value="">Sem departamento</option>
                  {departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nome}</option>)}
                </select>
                <BotaoBizy icone={CheckCircle2} onClick={() => void guardarPerfilOperacional()}>Guardar perfil</BotaoBizy>
              </div>
              <KpiGrid>
                <KpiCard icone={Shield} rotulo="Módulos visíveis" valor={modoSombra.modulos.modulosVisiveis.length} />
                <KpiCard icone={Eye} cor="blue" rotulo="Widgets visíveis" valor={Object.keys(modoSombra.widgets.widgets).length} />
                <KpiCard icone={CheckCircle2} cor="green" rotulo="Checklist concluído" valor={modoSombra.checklist.filter((item) => item.concluido).length} delta={`de ${modoSombra.checklist.length}`} />
              </KpiGrid>
              <div className="bz-rec-cards">
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Módulos</strong>
                  <div className="bz-eq-perms">
                    {modoSombra.modulos.modulosVisiveis.map((modulo) => (
                      <span key={modulo} className="bz-eq-perm">{modulo}</span>
                    ))}
                  </div>
                </div>
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Widgets</strong>
                  <div className="bz-eq-perms">
                    {Object.entries(modoSombra.widgets.widgets).map(([widget, valor]) => (
                      <span key={widget} className="bz-eq-perm">{widget}: {valor}</span>
                    ))}
                  </div>
                </div>
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Ocultos</strong>
                  <div className="bz-eq-perms">
                    {[...modoSombra.modulos.modulosOcultos, ...(modoSombra.widgets.progressiveDisclosure?.widgetsOcultadosPorPapel ?? [])].map((item) => (
                      <span key={item} className="bz-eq-perm">{item}</span>
                    ))}
                    {modoSombra.modulos.modulosOcultos.length === 0 && (modoSombra.widgets.progressiveDisclosure?.widgetsOcultadosPorPapel.length ?? 0) === 0 && (
                      <span className="bz-eq-perm">Nenhum</span>
                    )}
                  </div>
                </div>
              </div>
            </PanelCard>
          )}

          {perfil360 && (
            <PanelCard
              titulo={`Perfil 360 · ${perfil360.membro.nome}`}
              descricao={`${perfil360.membro.papel} · ${perfil360.membro.status}`}
              acaoTexto="Fechar"
              acaoIcone={XCircle}
              onAcao={() => setPerfil360(null)}
            >
              <KpiGrid>
                <KpiCard icone={Target} rotulo="Tarefas" valor={perfil360.cargaOperacional.tarefasAbertas} />
                <KpiCard icone={MessageSquare} cor="blue" rotulo="Conversas" valor={perfil360.cargaOperacional.conversasAbertas} />
                <KpiCard icone={TrendingUp} cor="green" rotulo="Pedidos" valor={perfil360.cargaOperacional.pedidosAbertos} />
                <KpiCard icone={CheckCircle2} cor="violet" rotulo="Onboarding" valor={`${perfil360.onboarding.percentagem}%`} />
              </KpiGrid>
              <div className="bz-rec-cards">
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Skills verificáveis</strong>
                  <div className="bz-eq-perms">
                    {perfil360.skills.map((skill) => (
                      <span key={skill.id} className="bz-eq-perm">{skill.nome} · N{skill.nivel} · {skill.estado.toLowerCase()}</span>
                    ))}
                    {perfil360.skills.length === 0 && <span className="bz-eq-role-desc">Sem skills registadas.</span>}
                  </div>
                </div>
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Carga</strong>
                  <div className="bz-eq-perms">
                    <span className="bz-eq-perm">{perfil360.cargaOperacional.projectosActivos} projetos</span>
                    <span className="bz-eq-perm">{perfil360.cargaOperacional.tarefasAbertas} tarefas</span>
                    <span className="bz-eq-perm">{perfil360.cargaOperacional.conversasAbertas} conversas</span>
                  </div>
                </div>
                <div className="bz-rec-c">
                  <strong className="bz-eq-role-name">Risco de acesso</strong>
                  <div className="bz-eq-role-desc">
                    {perfil360.indicadores.requerRevisaoAcesso ? "Requer revisão de permissões." : "Sem revisão pendente."}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_100px_auto]">
                <Input value={novaSkill} onChange={(evento) => setNovaSkill(evento.target.value)} placeholder="Nova skill" aria-label="Nova skill" />
                <select className="bz-toolbar-select-input" value={categoriaSkill} onChange={(evento) => setCategoriaSkill(evento.target.value as CategoriaSkill)} aria-label="Categoria da skill">
                  {(["ATENDIMENTO", "VENDAS", "LOGISTICA", "FINANCAS", "LIVE", "MODERACAO", "LEARNING", "MARKET", "SUPORTE"] as CategoriaSkill[]).map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
                </select>
                <select className="bz-toolbar-select-input" value={nivelSkill} onChange={(evento) => setNivelSkill(Number(evento.target.value))} aria-label="Nível da skill">
                  {[1, 2, 3, 4, 5].map((nivel) => <option key={nivel} value={nivel}>Nível {nivel}</option>)}
                </select>
                <BotaoBizy icone={Plus} onClick={() => void adicionarSkill()}>Adicionar</BotaoBizy>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <strong className="bz-eq-role-name">Plano de desenvolvimento</strong>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto]">
                  <Input value={objetivoDesenvolvimento} onChange={(evento) => setObjetivoDesenvolvimento(evento.target.value)} placeholder="Objetivo" aria-label="Objetivo de desenvolvimento" />
                  <Input value={acaoDesenvolvimento} onChange={(evento) => setAcaoDesenvolvimento(evento.target.value)} placeholder="Ação prática" aria-label="Ação de desenvolvimento" />
                  <Input type="date" value={prazoDesenvolvimento} onChange={(evento) => setPrazoDesenvolvimento(evento.target.value)} aria-label="Prazo de desenvolvimento" />
                  <BotaoBizy icone={Target} onClick={() => void criarDesenvolvimento()}>Criar plano</BotaoBizy>
                </div>
                <div className="mt-3 bz-eq-perms">
                  {perfil360.desenvolvimento.map((item) => (
                    <span key={item.id} className="bz-eq-perm">{item.objetivo} · {item.estado.toLowerCase()} · {new Date(item.prazoEm).toLocaleDateString("pt-AO")}</span>
                  ))}
                  {perfil360.desenvolvimento.length === 0 && <span className="bz-eq-role-desc">Sem plano ativo.</span>}
                </div>
              </div>
            </PanelCard>
          )}

          {/* Papéis */}
          {papeis.length > 0 && (
            <PanelCard titulo="Papéis e permissões">
              <div className="bz-rec-cards">
                {papeis.map((p, indicePapel) => (
                  <div key={p.id || `${p.nome}-${indicePapel}`} className="bz-rec-c">
                    <div className="bz-eq-role-head">
                      <Shield size={16} className="bz-icon-violet" />
                      <strong className="bz-eq-role-name">{p.nome}</strong>
                    </div>
                    {p.descricao && <div className="bz-eq-role-desc">{p.descricao}</div>}
                    <div className="bz-eq-perms">
                      {p.permissoes.slice(0, 6).map((perm, indicePermissao) => (
                        <span key={`${perm}-${indicePermissao}`} className="bz-eq-perm">{perm}</span>
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
