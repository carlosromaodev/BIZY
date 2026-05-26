import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LineChart,
  PackageCheck,
  RefreshCcw,
  TrendingUp,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatarDataHoraCurta } from "../utilidades";

interface ClienteRelatorioCrm {
  telefone: string;
  nomeCliente: string;
  reservas: number;
  reservasPagas: number;
  mensagens: number;
  mensagensFalhadas: number;
  statusOportunidade?: string;
}

interface RelatorioCrm {
  liveId: string | null;
  metricas: {
    clientesAtendidos: number;
    conversoes: number;
    mensagensFalhadas: number;
    taxaConversaoClientes: number;
    tempoMedioPrimeiraRespostaSegundos: number | null;
  };
  oportunidadesPerdidas: {
    comentariosComIntencaoSemReserva: number;
    reservasExpiradas: number;
    reservasCanceladas: number;
    mensagensFalhadas: number;
  };
  clientes: ClienteRelatorioCrm[];
}

interface EntregaRelatorio {
  reservaId: string;
  codigoPeca: string;
  nomePeca: string;
  telefoneCliente: string;
  nomeCliente: string;
  estadoEntrega?: string;
  criadaEm?: string;
}

interface RelatorioEntregas {
  entregas: EntregaRelatorio[];
}

function formatarTempoResposta(segundos: number | null): string {
  if (segundos === null || Number.isNaN(segundos)) return "Sem base";
  if (segundos < 60) return `${Math.round(segundos)}s`;
  const minutos = Math.floor(segundos / 60);
  const restantes = Math.round(segundos % 60);
  return restantes ? `${minutos}m ${restantes}s` : `${minutos}m`;
}

export function PaginaRelatorios() {
  const [crm, setCrm] = useState<RelatorioCrm | null>(null);
  const [entregas, setEntregas] = useState<EntregaRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const [relatorioCrm, relatorioEntregas] = await Promise.all([
        requisitarApi<RelatorioCrm>("/relatorios/crm-pos-live"),
        requisitarApi<RelatorioEntregas>("/relatorios/entregas")
      ]);
      setCrm(relatorioCrm);
      setEntregas(relatorioEntregas.entregas);
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const metricas = crm?.metricas;
  const oportunidades = crm?.oportunidadesPerdidas;
  const perdas =
    (oportunidades?.comentariosComIntencaoSemReserva ?? 0) +
    (oportunidades?.reservasExpiradas ?? 0) +
    (oportunidades?.reservasCanceladas ?? 0) +
    (oportunidades?.mensagensFalhadas ?? 0);
  const topClientes = [...(crm?.clientes ?? [])]
    .sort((a, b) => b.reservasPagas - a.reservasPagas || b.reservas - a.reservas)
    .slice(0, 6);

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Resultados comerciais" titulo="Relatórios">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo dos relatórios"
        itens={[
          { icone: <Users />, titulo: "Atendidos", valor: metricas?.clientesAtendidos ?? 0, detalhe: "clientes no CRM da live", tom: "principal" },
          { icone: <CheckCircle2 />, titulo: "Conversões", valor: metricas?.conversoes ?? 0, detalhe: `${metricas?.taxaConversaoClientes ?? 0}% de conversão`, tom: "sucesso" },
          { icone: <AlertCircle />, titulo: "Perdas", valor: perdas, detalhe: "oportunidades não concluídas", tom: perdas ? "atencao" : "neutro" },
          { icone: <Clock3 />, titulo: "Resposta", valor: formatarTempoResposta(metricas?.tempoMedioPrimeiraRespostaSegundos ?? null), detalhe: "tempo médio inicial" }
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <CrmSection
          icon={<TrendingUp size={20} />}
          title="Melhores relações"
          description="Clientes com maior sinal de recompra e histórico de pagamento."
        >
          <CrmList>
            {topClientes.length ? (
              topClientes.map((cliente) => (
                <CrmListItem
                  key={cliente.telefone}
                  media={<Users size={18} />}
                  title={cliente.nomeCliente || "Cliente"}
                  description={cliente.telefone}
                  tone={cliente.mensagensFalhadas ? "perigo" : "sucesso"}
                  badges={(
                    <Badge variant={cliente.mensagensFalhadas ? "destructive" : "success"}>
                      {cliente.mensagensFalhadas ? `${cliente.mensagensFalhadas} falha(s)` : "Em dia"}
                    </Badge>
                  )}
                  meta={`${cliente.reservasPagas}/${cliente.reservas} pagas`}
                />
              ))
            ) : (
              <EstadoVazio icone={<Users />} titulo="Sem clientes no relatório" detalhe="Os dados aparecem depois de atendimento e reservas." />
            )}
          </CrmList>
        </CrmSection>

        <CrmSection
          icon={<PackageCheck size={20} />}
          title="Entregas recentes"
          description="Pagamentos confirmados que precisam de acompanhamento operacional."
        >
          <CrmList>
            {entregas.slice(0, 6).length ? (
              entregas.slice(0, 6).map((entrega) => (
                <CrmListItem
                  key={entrega.reservaId}
                  media={<PackageCheck size={18} />}
                  title={`#${entrega.codigoPeca} ${entrega.nomePeca}`}
                  description={entrega.nomeCliente || entrega.telefoneCliente}
                  tone={entrega.estadoEntrega ? "principal" : "atencao"}
                  meta={entrega.criadaEm ? formatarDataHoraCurta(entrega.criadaEm) : "Sem data"}
                  badges={<Badge variant="outline">{entrega.estadoEntrega ?? "Pendente"}</Badge>}
                />
              ))
            ) : (
              <EstadoVazio icone={<PackageCheck />} titulo="Sem entregas recentes" detalhe="As entregas aparecem após pagamentos confirmados." />
            )}
          </CrmList>
        </CrmSection>
      </section>

      <CrmSection
        icon={<LineChart size={20} />}
        title="Onde a loja perdeu venda"
        description="Pontos do funil que devem virar recuperação automática ou tarefa humana."
      >
        <div className="grid gap-3 md:grid-cols-4">
          <CrmMetricMini label="intenção sem pedido" value={oportunidades?.comentariosComIntencaoSemReserva ?? 0} tone="atencao" />
          <CrmMetricMini label="reservas expiradas" value={oportunidades?.reservasExpiradas ?? 0} tone="perigo" />
          <CrmMetricMini label="reservas canceladas" value={oportunidades?.reservasCanceladas ?? 0} tone="perigo" />
          <CrmMetricMini label="mensagens falhadas" value={oportunidades?.mensagensFalhadas ?? 0} tone="atencao" />
        </div>
      </CrmSection>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}
