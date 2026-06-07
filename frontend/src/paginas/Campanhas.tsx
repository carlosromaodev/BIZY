import {
  Mail,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Send,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  BotaoBizy,
  FilterChips,
  Money,
} from "../componentes/BizyDesignSystem";
import type {
  Campanha,
  EstadoCampanha,
  RespostaCampanhas,
  WhatsAppTemplate,
  RespostaWhatsAppTemplates,
} from "../tipos";

const FILTROS_ESTADO: Array<{ id: EstadoCampanha | "TODAS"; rotulo: string }> = [
  { id: "TODAS", rotulo: "Todas" },
  { id: "EM_ENVIO", rotulo: "Em envio" },
  { id: "AGENDADA", rotulo: "Agendadas" },
  { id: "CONCLUIDA", rotulo: "Concluídas" },
  { id: "RASCUNHO", rotulo: "Rascunhos" },
  { id: "PAUSADA", rotulo: "Pausadas" },
];

function corEstadoCampanha(estado: EstadoCampanha): "green" | "amber" | "blue" | "rose" | "violet" | "mute" {
  switch (estado) {
    case "EM_ENVIO": return "blue";
    case "AGENDADA": return "amber";
    case "CONCLUIDA": return "green";
    case "RASCUNHO": return "mute";
    case "PAUSADA": return "violet";
    case "CANCELADA": return "rose";
  }
}

function rotuloEstado(estado: EstadoCampanha): string {
  return { RASCUNHO: "Rascunho", AGENDADA: "Agendada", EM_ENVIO: "Em envio", CONCLUIDA: "Concluída", PAUSADA: "Pausada", CANCELADA: "Cancelada" }[estado];
}

export function PaginaCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [filtro, setFiltro] = useState<EstadoCampanha | "TODAS">("TODAS");
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"campanhas" | "templates">("campanhas");

  async function carregar() {
    setCarregando(true);
    try {
      const [rc, rt] = await Promise.allSettled([
        requisitarApi<RespostaCampanhas>("/campanhas"),
        requisitarApi<RespostaWhatsAppTemplates>("/whatsapp/templates"),
      ]);
      setCampanhas(rc.status === "fulfilled" ? rc.value.campanhas : []);
      setTemplates(rt.status === "fulfilled" ? rt.value.templates : []);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  const campanhasFiltradas = useMemo(() => {
    if (filtro === "TODAS") return campanhas;
    return campanhas.filter((c) => c.estado === filtro);
  }, [campanhas, filtro]);

  const totalEnviados = campanhas.reduce((s, c) => s + c.enviados, 0);
  const totalEntregues = campanhas.reduce((s, c) => s + c.entregues, 0);
  const totalRespostas = campanhas.reduce((s, c) => s + c.respostas, 0);
  const taxaEntrega = totalEnviados > 0 ? Math.round((totalEntregues / totalEnviados) * 100) : 0;

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Marketing directo · ${campanhas.length} campanha${campanhas.length !== 1 ? "s" : ""}`}
        titulo="Campanhas"
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={Plus} onClick={() => void requisitarApi("/campanhas", { method: "POST", body: { nome: `Campanha ${Date.now().toString(36)}`, canal: "WHATSAPP" } }).then(() => void carregar())}>
          Nova campanha
        </BotaoBizy>
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Send} rotulo="Total enviadas" valor={totalEnviados} delta={`${campanhas.filter((c) => c.estado === "EM_ENVIO").length} em envio`} deltaPositivo />
        <KpiCard icone={Mail} cor="blue" rotulo="Entregues" valor={totalEntregues} delta={`${taxaEntrega}% taxa`} deltaPositivo={taxaEntrega >= 90} />
        <KpiCard icone={MessageCircle} cor="violet" rotulo="Respostas" valor={totalRespostas} />
        <KpiCard icone={Smartphone} cor="amber" rotulo="Templates" valor={templates.length} delta={`${templates.filter((t) => t.estado === "APROVADO").length} aprovados`} />
      </KpiGrid>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`bz-tab ${abaAtiva === "campanhas" ? "active" : ""}`}
          onClick={() => setAbaAtiva("campanhas")}
          style={abaAtiva === "campanhas" ? { borderBottomColor: "var(--green)" } : undefined}
        >
          Campanhas
        </button>
        <button
          type="button"
          className={`bz-tab ${abaAtiva === "templates" ? "active" : ""}`}
          onClick={() => setAbaAtiva("templates")}
          style={abaAtiva === "templates" ? { borderBottomColor: "var(--green)" } : undefined}
        >
          Templates WhatsApp
        </button>
      </div>

      {abaAtiva === "campanhas" && (
        <>
          <FilterChips
            opcoes={FILTROS_ESTADO.map((f) => ({ id: f.id, rotulo: f.rotulo }))}
            activo={filtro}
            onChange={(id) => setFiltro(id as EstadoCampanha | "TODAS")}
          />

          <TableCard>
            <Table>
              <TableHead>
                <Th>Campanha</Th>
                <Th>Canal</Th>
                <Th right>Enviados</Th>
                <Th right>Entregues</Th>
                <Th right>Respostas</Th>
                <Th>Estado</Th>
                <Th>Ações</Th>
              </TableHead>
              <tbody>
                {campanhasFiltradas.length > 0 ? campanhasFiltradas.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.nome}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                          {new Date(c.criadaEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge cor={c.canal === "WHATSAPP" ? "green" : c.canal === "SMS" ? "blue" : "violet"}>
                        {c.canal === "WHATSAPP" ? "WhatsApp" : c.canal}
                      </StatusBadge>
                    </Td>
                    <Td right><span className="bz-tnum">{c.enviados}</span></Td>
                    <Td right><span className="bz-tnum">{c.entregues}</span></Td>
                    <Td right><span className="bz-tnum">{c.respostas}</span></Td>
                    <Td><StatusBadge cor={corEstadoCampanha(c.estado)}>{rotuloEstado(c.estado)}</StatusBadge></Td>
                    <Td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {c.estado === "RASCUNHO" && (
                          <button type="button" className="bz-iconbtn" title="Confirmar" onClick={() => void requisitarApi(`/campanhas/${c.id}/confirmar`, { method: "POST" }).then(() => void carregar())}>
                            <Play size={14} />
                          </button>
                        )}
                        {c.estado === "EM_ENVIO" && (
                          <button type="button" className="bz-iconbtn" title="Pausar" onClick={() => void requisitarApi(`/campanhas/${c.id}/pausar`, { method: "POST" }).then(() => void carregar())}>
                            <Pause size={14} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="bz-feed-empty">
                      {carregando ? "A carregar campanhas..." : "Sem campanhas. Crie a primeira para disparar mensagens em massa."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      {abaAtiva === "templates" && (
        <TableCard>
          <Table>
            <TableHead>
              <Th>Template</Th>
              <Th>Categoria</Th>
              <Th>Idioma</Th>
              <Th>Estado</Th>
              <Th>Criado</Th>
            </TableHead>
            <tbody>
              {templates.length > 0 ? templates.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.nome}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }} className="truncate">{t.corpo}</div>
                    </div>
                  </Td>
                  <Td><span style={{ fontSize: 12, textTransform: "capitalize" }}>{t.categoria}</span></Td>
                  <Td><span style={{ fontSize: 12 }}>{t.idioma}</span></Td>
                  <Td>
                    <StatusBadge cor={t.estado === "APROVADO" ? "green" : t.estado === "PENDENTE" ? "amber" : t.estado === "REJEITADO" ? "rose" : "mute"}>
                      {t.estado === "APROVADO" ? "Aprovado" : t.estado === "PENDENTE" ? "Pendente" : t.estado === "REJEITADO" ? "Rejeitado" : "Rascunho"}
                    </StatusBadge>
                  </Td>
                  <Td><span style={{ fontSize: 12 }}>{new Date(t.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short" })}</span></Td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="bz-feed-empty">
                    {carregando ? "A carregar templates..." : "Sem templates. Configure mensagens aprovadas pelo WhatsApp Business."}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableCard>
      )}
    </CrmPageMotion>
  );
}
