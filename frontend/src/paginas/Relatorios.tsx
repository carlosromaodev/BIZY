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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <>
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
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Clientes</p>
              <h2 className="text-lg font-semibold">Melhores relações</h2>
            </div>
            <TrendingUp size={20} />
          </CardHeader>
          <CardContent className="grid gap-3">
            {topClientes.length ? (
              topClientes.map((cliente) => (
                <Card key={cliente.telefone} className="bg-muted/20">
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate">{cliente.nomeCliente || "Cliente"}</strong>
                    <span className="block text-sm text-muted-foreground">{cliente.telefone}</span>
                  </div>
                  <div className="text-sm">
                    <strong>{cliente.reservasPagas}/{cliente.reservas}</strong>
                    <span className="ml-1 text-muted-foreground">pagas</span>
                  </div>
                  <Badge variant={cliente.mensagensFalhadas ? "destructive" : "success"}>
                    {cliente.mensagensFalhadas ? `${cliente.mensagensFalhadas} falha(s)` : "Em dia"}
                  </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EstadoVazio icone={<Users />} titulo="Sem clientes no relatório" detalhe="Os dados aparecem depois de atendimento e reservas." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Operação</p>
              <h2 className="text-lg font-semibold">Entregas recentes</h2>
            </div>
            <PackageCheck size={20} />
          </CardHeader>
          <CardContent className="grid gap-3">
            {entregas.slice(0, 6).length ? (
              entregas.slice(0, 6).map((entrega) => (
                <Card key={entrega.reservaId} className="bg-muted/20">
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <strong className="block truncate">#{entrega.codigoPeca} {entrega.nomePeca}</strong>
                    <span className="block text-sm text-muted-foreground">{entrega.nomeCliente || entrega.telefoneCliente}</span>
                  </div>
                  <div className="text-sm sm:text-right">
                    <strong className="block">{entrega.estadoEntrega ?? "Pendente"}</strong>
                    <span className="text-muted-foreground">{entrega.criadaEm ? formatarDataHoraCurta(entrega.criadaEm) : "Sem data"}</span>
                  </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EstadoVazio icone={<PackageCheck />} titulo="Sem entregas recentes" detalhe="As entregas aparecem após pagamentos confirmados." />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Oportunidades</p>
            <h2 className="text-lg font-semibold">Onde a loja perdeu venda</h2>
          </div>
          <LineChart size={20} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <span className="rounded-lg border bg-muted/20 p-3"><strong className="block text-2xl">{oportunidades?.comentariosComIntencaoSemReserva ?? 0}</strong> intenção sem pedido</span>
          <span className="rounded-lg border bg-muted/20 p-3"><strong className="block text-2xl">{oportunidades?.reservasExpiradas ?? 0}</strong> reservas expiradas</span>
          <span className="rounded-lg border bg-muted/20 p-3"><strong className="block text-2xl">{oportunidades?.reservasCanceladas ?? 0}</strong> reservas canceladas</span>
          <span className="rounded-lg border bg-muted/20 p-3"><strong className="block text-2xl">{oportunidades?.mensagensFalhadas ?? 0}</strong> mensagens falhadas</span>
        </CardContent>
      </Card>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}
