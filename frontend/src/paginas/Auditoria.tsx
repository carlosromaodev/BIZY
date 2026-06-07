import {
  Clock,
  FileText,
  RefreshCcw,
  Search,
  Shield,
  User,
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
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import type { EventoAuditoria, RespostaEventosAuditoria } from "../tipos";

function corTipoEvento(tipo: string): "green" | "amber" | "blue" | "rose" | "violet" | "mute" {
  if (tipo.includes("CRIAR") || tipo.includes("CREATE")) return "green";
  if (tipo.includes("ATUALIZAR") || tipo.includes("UPDATE")) return "blue";
  if (tipo.includes("ELIMINAR") || tipo.includes("DELETE")) return "rose";
  if (tipo.includes("LOGIN") || tipo.includes("AUTH")) return "violet";
  if (tipo.includes("PAGAMENTO") || tipo.includes("PAYMENT")) return "amber";
  return "mute";
}

export function PaginaAuditoria() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const r = await requisitarApi<RespostaEventosAuditoria>("/auditoria/eventos");
      setEventos(r.eventos);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return eventos;
    const q = busca.toLowerCase();
    return eventos.filter((e) =>
      e.descricao.toLowerCase().includes(q) ||
      e.tipo.toLowerCase().includes(q) ||
      e.acao.toLowerCase().includes(q) ||
      (e.autorNome ?? "").toLowerCase().includes(q)
    );
  }, [eventos, busca]);

  const autoresUnicos = new Set(eventos.map((e) => e.autorId).filter(Boolean)).size;
  const hoje = eventos.filter((e) => {
    const d = new Date(e.criadoEm);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Sistema · ${eventos.length} evento${eventos.length !== 1 ? "s" : ""}`}
        titulo="Registo de auditoria"
        tamanhoTitulo="sm"
      >
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Shield} rotulo="Total eventos" valor={eventos.length} delta={`${hoje} hoje`} deltaPositivo />
        <KpiCard icone={Clock} cor="blue" rotulo="Hoje" valor={hoje} />
        <KpiCard icone={User} cor="violet" rotulo="Utilizadores" valor={autoresUnicos} />
        <KpiCard icone={FileText} cor="amber" rotulo="Tipos" valor={new Set(eventos.map((e) => e.tipo)).size} />
      </KpiGrid>

      <div style={{ maxWidth: 400, marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }} />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar eventos..."
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <TableCard>
        <Table>
          <TableHead>
            <Th>Autor</Th>
            <Th>Tipo</Th>
            <Th>Ação</Th>
            <Th>Descrição</Th>
            <Th>Entidade</Th>
            <Th>IP</Th>
            <Th>Data</Th>
          </TableHead>
          <tbody>
            {filtrados.length > 0 ? filtrados.map((e) => (
              <tr key={e.id}>
                <Td>
                  {e.autorNome ? (
                    <div className="bz-cli">
                      <AvatarBizy iniciais={obterIniciais(e.autorNome)} cor={obterCorAvatar(e.autorNome)} tamanho={28} />
                      <span className="bz-cli-name" style={{ fontSize: 12.5 }}>{e.autorNome}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Sistema</span>
                  )}
                </Td>
                <Td>
                  <StatusBadge cor={corTipoEvento(e.tipo)}>
                    {e.tipo}
                  </StatusBadge>
                </Td>
                <Td><span style={{ fontSize: 12.5 }}>{e.acao}</span></Td>
                <Td>
                  <div style={{ maxWidth: 280, fontSize: 12.5, color: "var(--ink-2)" }} className="truncate">{e.descricao}</div>
                </Td>
                <Td>
                  {e.entidadeTipo ? (
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{e.entidadeTipo} #{(e.entidadeId ?? "").slice(0, 8)}</span>
                  ) : "—"}
                </Td>
                <Td><span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "monospace" }}>{e.ip ?? "—"}</span></Td>
                <Td>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {new Date(e.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="bz-feed-empty">
                  {carregando ? "A carregar eventos..." : "Sem eventos de auditoria registados."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>
    </CrmPageMotion>
  );
}
