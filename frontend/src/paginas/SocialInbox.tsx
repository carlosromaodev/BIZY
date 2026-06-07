import {
  AtSign,
  ExternalLink,
  Filter,
  Inbox,
  MessageSquare,
  RefreshCcw,
  ShoppingBag,
  Star,
  ThumbsUp,
  UserPlus,
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
  AvatarBizy,
  obterCorAvatar,
  obterIniciais,
  FilterChips,
  BotaoBizy,
} from "../componentes/BizyDesignSystem";
import type { SocialInboxItem, RespostaSocialInbox } from "../tipos";

const FILTROS_ESTADO = [
  { id: "TODOS" as const, rotulo: "Todos" },
  { id: "NOVO" as const, rotulo: "Novos" },
  { id: "EM_ATENDIMENTO" as const, rotulo: "Em atendimento" },
  { id: "CONVERTIDO" as const, rotulo: "Convertidos" },
  { id: "IGNORADO" as const, rotulo: "Ignorados" },
];

function corIntencao(intencao: SocialInboxItem["intencao"]): "green" | "amber" | "blue" | "rose" | "mute" {
  switch (intencao) {
    case "COMPRA": return "green";
    case "DUVIDA": return "blue";
    case "RECLAMACAO": return "rose";
    case "ELOGIO": return "amber";
    default: return "mute";
  }
}

function iconeIntencao(intencao: SocialInboxItem["intencao"]) {
  switch (intencao) {
    case "COMPRA": return <ShoppingBag size={12} />;
    case "DUVIDA": return <MessageSquare size={12} />;
    case "RECLAMACAO": return <Filter size={12} />;
    case "ELOGIO": return <ThumbsUp size={12} />;
    default: return <AtSign size={12} />;
  }
}

export function PaginaSocialInbox() {
  const [itens, setItens] = useState<SocialInboxItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  async function carregar() {
    setCarregando(true);
    try {
      const resposta = await requisitarApi<RespostaSocialInbox>("/social/inbox/itens");
      setItens(resposta.itens);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    if (filtroEstado === "TODOS") return itens;
    return itens.filter((i) => i.estado === filtroEstado);
  }, [itens, filtroEstado]);

  const novos = itens.filter((i) => i.estado === "NOVO").length;
  const compras = itens.filter((i) => i.intencao === "COMPRA").length;
  const convertidos = itens.filter((i) => i.estado === "CONVERTIDO").length;
  const canais = new Set(itens.map((i) => i.canal)).size;

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Redes sociais · ${itens.length} interação${itens.length !== 1 ? "ões" : ""}`}
        titulo="Social Inbox"
        tamanhoTitulo="sm"
      >
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Inbox} rotulo="Novos por tratar" valor={novos} delta={novos > 0 ? "requer atenção" : "inbox limpo"} deltaPositivo={novos === 0} />
        <KpiCard icone={ShoppingBag} cor="green" rotulo="Intenção de compra" valor={compras} delta="oportunidades" deltaPositivo />
        <KpiCard icone={UserPlus} cor="blue" rotulo="Convertidos" valor={convertidos} delta="leads capturados" deltaPositivo />
        <KpiCard icone={Star} cor="violet" rotulo="Canais activos" valor={canais} />
      </KpiGrid>

      <FilterChips
        opcoes={FILTROS_ESTADO.map((f) => ({ id: f.id, rotulo: f.rotulo }))}
        activo={filtroEstado}
        onChange={setFiltroEstado}
      />

      <TableCard>
        <Table>
          <TableHead>
            <Th>Autor</Th>
            <Th>Canal</Th>
            <Th>Mensagem</Th>
            <Th>Intenção</Th>
            <Th>Confiança</Th>
            <Th>Estado</Th>
            <Th>Data</Th>
            <Th>Ações</Th>
          </TableHead>
          <tbody>
            {filtrados.length > 0 ? filtrados.map((item) => (
              <tr key={item.id}>
                <Td>
                  <div className="bz-cli">
                    {item.autorAvatarUrl ? (
                      <img src={item.autorAvatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <AvatarBizy iniciais={obterIniciais(item.autorNome ?? item.autorUsername ?? "?")} cor={obterCorAvatar(item.autorNome ?? "")} tamanho={34} />
                    )}
                    <div>
                      <div className="bz-cli-name">{item.autorNome ?? item.autorUsername ?? "Anónimo"}</div>
                      {item.autorUsername && <div className="bz-cli-at">@{item.autorUsername}</div>}
                    </div>
                  </div>
                </Td>
                <Td>
                  <StatusBadge cor={item.canal === "instagram" ? "violet" : item.canal === "tiktok" ? "rose" : "blue"}>
                    {item.canal}
                  </StatusBadge>
                </Td>
                <Td>
                  <div style={{ maxWidth: 260, fontSize: 12.5, color: "var(--ink-2)" }} className="truncate">{item.texto}</div>
                </Td>
                <Td>
                  <StatusBadge cor={corIntencao(item.intencao)}>
                    {iconeIntencao(item.intencao)} {item.intencao === "SEM_INTENCAO" ? "Neutro" : item.intencao.charAt(0) + item.intencao.slice(1).toLowerCase()}
                  </StatusBadge>
                </Td>
                <Td>
                  <div className="bz-minibar-cell">
                    <span className="bz-minibar"><i style={{ width: `${Math.round(item.confianca * 100)}%` }} /></span>
                    <span className="bz-tnum" style={{ fontSize: 11.5 }}>{Math.round(item.confianca * 100)}%</span>
                  </div>
                </Td>
                <Td>
                  <StatusBadge cor={item.estado === "NOVO" ? "amber" : item.estado === "EM_ATENDIMENTO" ? "blue" : item.estado === "CONVERTIDO" ? "green" : "mute"}>
                    {item.estado === "NOVO" ? "Novo" : item.estado === "EM_ATENDIMENTO" ? "Atendendo" : item.estado === "CONVERTIDO" ? "Convertido" : item.estado === "IGNORADO" ? "Ignorado" : "Arquivado"}
                  </StatusBadge>
                </Td>
                <Td>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {new Date(item.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    {item.estado === "NOVO" && (
                      <button
                        type="button"
                        className="bz-iconbtn"
                        title="Capturar como lead"
                        onClick={() => void requisitarApi("/social/inbox/capturar", { method: "POST", body: { itemId: item.id } }).then(() => void carregar())}
                      >
                        <UserPlus size={14} />
                      </button>
                    )}
                    {item.postUrl && (
                      <a href={item.postUrl} target="_blank" rel="noopener noreferrer" className="bz-iconbtn" title="Ver post original">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="bz-feed-empty">
                  {carregando ? "A carregar inbox social..." : "Sem interações. Conecte as redes sociais para capturar leads automaticamente."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>
    </CrmPageMotion>
  );
}
