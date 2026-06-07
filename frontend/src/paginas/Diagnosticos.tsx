import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RefreshCcw,
  Send,
  XCircle,
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
  FilterChips,
  BotaoBizy,
} from "../componentes/BizyDesignSystem";
import { Input } from "@/components/ui/input";
import type {
  DiagnosticoSmsOverview,
  MensagemSms,
  RespostaDiagnosticoSms,
} from "../tipos";

const FILTROS_ESTADO = [
  { id: "TODOS" as const, rotulo: "Todos" },
  { id: "ENVIADO" as const, rotulo: "Enviados" },
  { id: "ENTREGUE" as const, rotulo: "Entregues" },
  { id: "FALHADO" as const, rotulo: "Falhados" },
  { id: "PENDENTE" as const, rotulo: "Pendentes" },
];

export function PaginaDiagnosticos() {
  const [overview, setOverview] = useState<DiagnosticoSmsOverview | null>(null);
  const [mensagens, setMensagens] = useState<MensagemSms[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("TODOS");
  const [testNum, setTestNum] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const r = await requisitarApi<RespostaDiagnosticoSms>("/diagnosticos/sms/overview");
      setOverview(r.overview);
      setMensagens(r.mensagens);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregar(); }, []);

  async function testarSms() {
    if (!testNum.trim() || !testMsg.trim()) return;
    setEnviando(true);
    try {
      await requisitarApi("/sms/testar", { method: "POST", body: { para: testNum, corpo: testMsg } });
      setTestNum(""); setTestMsg("");
      await carregar();
    } catch { /* silencioso */ }
    finally { setEnviando(false); }
  }

  const filtrados = useMemo(() => {
    if (filtro === "TODOS") return mensagens;
    return mensagens.filter((m) => m.estado === filtro);
  }, [mensagens, filtro]);

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow={`Diagnósticos · SMS`}
        titulo="Diagnósticos SMS"
        tamanhoTitulo="sm"
      >
        <button type="button" className="bz-iconbtn" onClick={() => void carregar()} disabled={carregando} title="Atualizar">
          <RefreshCcw size={16} />
        </button>
      </PageHead>

      <KpiGrid>
        <KpiCard hero icone={Send} rotulo="Total enviados" valor={overview?.totalEnviados ?? 0} delta={`${overview?.taxaEntrega ?? 0}% entrega`} deltaPositivo={(overview?.taxaEntrega ?? 0) >= 90} />
        <KpiCard icone={CheckCircle2} cor="green" rotulo="Entregues" valor={overview?.totalEntregues ?? 0} />
        <KpiCard icone={XCircle} cor="rose" rotulo="Falhados" valor={overview?.totalFalhados ?? 0} />
        <KpiCard icone={MessageSquare} cor="blue" rotulo="Remetentes" valor={overview?.remetentes?.length ?? 0} />
      </KpiGrid>

      {/* ── Teste SMS ── */}
      <div className="bz-panel" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Send size={18} style={{ color: "var(--blue)" }} />
          <strong style={{ fontSize: 14 }}>Enviar SMS de teste</strong>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Input value={testNum} onChange={(e) => setTestNum(e.target.value)} placeholder="Número (ex: +244 9XX XXX XXX)" />
          <Input value={testMsg} onChange={(e) => setTestMsg(e.target.value)} placeholder="Mensagem de teste" />
          <BotaoBizy icone={Send} onClick={() => void testarSms()}>
            {enviando ? "Enviando..." : "Enviar"}
          </BotaoBizy>
        </div>
      </div>

      {/* ── Remetentes ── */}
      {overview?.remetentes && overview.remetentes.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 28, marginBottom: 12, color: "var(--ink)" }}>Remetentes configurados</h3>
          <div className="bz-rec-cards">
            {overview.remetentes.map((r) => (
              <div key={r.numero} className="bz-rec-c" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.nome}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>{r.numero}</div>
                <StatusBadge cor={r.estado === "ATIVO" ? "green" : "mute"}>
                  {r.estado}
                </StatusBadge>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Mensagens ── */}
      <FilterChips
        opcoes={FILTROS_ESTADO.map((f) => ({ id: f.id, rotulo: f.rotulo }))}
        activo={filtro}
        onChange={setFiltro}
      />

      <TableCard>
        <Table>
          <TableHead>
            <Th>De</Th>
            <Th>Para</Th>
            <Th>Mensagem</Th>
            <Th>Estado</Th>
            <Th>Data</Th>
          </TableHead>
          <tbody>
            {filtrados.length > 0 ? filtrados.map((m) => (
              <tr key={m.id}>
                <Td><span style={{ fontSize: 12.5 }}>{m.de}</span></Td>
                <Td><span style={{ fontSize: 12.5 }}>{m.para}</span></Td>
                <Td>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)" }} className="truncate">{m.corpo}</div>
                </Td>
                <Td>
                  <StatusBadge cor={m.estado === "ENTREGUE" ? "green" : m.estado === "ENVIADO" ? "blue" : m.estado === "FALHADO" ? "rose" : "amber"}>
                    {m.estado === "ENTREGUE" ? "Entregue" : m.estado === "ENVIADO" ? "Enviado" : m.estado === "FALHADO" ? "Falhado" : "Pendente"}
                  </StatusBadge>
                </Td>
                <Td>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {new Date(m.criadoEm).toLocaleDateString("pt-AO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="bz-feed-empty">
                  {carregando ? "A carregar mensagens..." : "Sem mensagens SMS registadas."}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableCard>
    </CrmPageMotion>
  );
}
