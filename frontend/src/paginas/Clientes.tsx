import {
  AlertCircle,
  Download,
  MessageCircle,
  Network,
  RefreshCcw,
  Search,
  ShieldCheck,
  Tags,
  UserRoundCheck,
  Users,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmFilterDock, CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection, CrmStatusBadge } from "../componentes/CrmInterno21st";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Component as AnimatedTabs, TabsList, TabsTrigger } from "@/components/ui/animated-tabs";
import type {
  Cliente360,
  EstadoRelacionamentoCliente,
  RespostaClientes360,
  RespostaSegmentosClientes360,
  SegmentoCliente360
} from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";

const filtrosCliente: Array<"todos" | EstadoRelacionamentoCliente> = [
  "todos",
  "LEAD",
  "ATIVO",
  "VIP",
  "INADIMPLENTE",
  "SEM_CONSENTIMENTO",
  "SEM_WHATSAPP",
  "PRIORIDADE_ALTA",
  "INATIVO"
];

function baixarArquivo(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8") {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

export function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente360[]>([]);
  const [segmentos, setSegmentos] = useState<SegmentoCliente360[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof filtrosCliente)[number]>("todos");

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaClientes, respostaSegmentos] = await Promise.allSettled([
        requisitarApi<RespostaClientes360>("/clientes?limite=500"),
        requisitarApi<RespostaSegmentosClientes360>("/clientes/segmentos")
      ]);

      if (respostaClientes.status === "fulfilled") {
        setClientes(respostaClientes.value.clientes ?? []);
      } else {
        throw respostaClientes.reason;
      }

      setSegmentos(respostaSegmentos.status === "fulfilled" ? respostaSegmentos.value.segmentos ?? [] : []);
      setMensagem("");
    } catch (erro) {
      setClientes([]);
      setSegmentos([]);
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar clientes 360.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (filtro !== "todos" && cliente.estadoRelacionamento !== filtro) return false;
      if (!termo) return true;
      return (
        (cliente.nome ?? "").toLowerCase().includes(termo) ||
        (cliente.username ?? "").toLowerCase().includes(termo) ||
        (cliente.telefone ?? "").includes(termo) ||
        (cliente.email ?? "").toLowerCase().includes(termo) ||
        cliente.tags.some((tag) => tag.toLowerCase().includes(termo))
      );
    });
  }, [busca, clientes, filtro]);

  const compradores = clientes.filter((cliente) => cliente.metricas.reservasPagas > 0).length;
  const pendentes = clientes.filter((cliente) => cliente.metricas.reservasAtivas > 0 || cliente.estadoRelacionamento === "INADIMPLENTE").length;
  const valorPago = clientes.reduce((total, cliente) => total + cliente.metricas.totalCompradoEmKwanza, 0);
  const comConsentimento = clientes.filter((cliente) => cliente.consentimentoDados || cliente.consentimentoMarketing).length;

  function exportarClientes() {
    baixarArquivo("clientes-360-bizy.csv", clientesParaCsv(clientesFiltrados));
    setMensagem(`${clientesFiltrados.length} clientes 360 exportados.`);
  }

  async function criarAcaoRapida(cliente: Cliente360, tipo: "COBRANCA" | "RECOMPRA" | "CONSENTIMENTO") {
    setMensagem("A criar tarefa operacional...");
    try {
      await requisitarApi(`/clientes/${cliente.id}/acoes`, {
        method: "POST",
        body: {
          tipo,
          titulo: tipo === "COBRANCA" ? "Cobrar pagamento pendente" : tipo === "RECOMPRA" ? "Ativar recompra" : "Atualizar consentimento",
          observacao: "Criado no CRM de clientes.",
          prioridade: tipo === "COBRANCA" ? "ALTA" : "NORMAL",
          contexto: {
            origem: "clientes-360",
            telefone: cliente.telefone,
            estadoRelacionamento: cliente.estadoRelacionamento
          }
        }
      });
      setMensagem("Tarefa criada e disponível em Operação CRM+.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar a tarefa.");
    }
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="CRM de loja" titulo="Clientes 360">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar
        </Button>
        <Button size="lg" onClick={exportarClientes} disabled={!clientesFiltrados.length}>
          <Download size={18} />
          Exportar
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo dos clientes"
        itens={[
          { icone: <Users />, titulo: "Clientes", valor: clientes.length, detalhe: "perfis 360 no backend", tom: "principal" },
          { icone: <WalletCards />, titulo: "Compradores", valor: compradores, detalhe: "com compra confirmada", tom: "sucesso" },
          { icone: <AlertCircle />, titulo: "Pendências", valor: pendentes, detalhe: "pagamento, reserva ou follow-up", tom: pendentes ? "atencao" : "neutro" },
          { icone: <ShieldCheck />, titulo: "Consentimento", valor: comConsentimento, detalhe: "marketing ou dados ativo", tom: "info" },
          { icone: <UserRoundCheck />, titulo: "Receita", valor: formatarKwanza(valorPago), detalhe: "histórico consolidado" }
        ]}
      />

      <CrmSection
        icon={<Users size={20} />}
        title="Base 360"
        description="Dados reais do módulo /clientes: perfil, consentimento, tags, métricas, histórico de compras e ações rápidas."
      >
        <CrmFilterDock className="lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              aria-label="Buscar clientes"
              className="market-input pl-9"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar cliente, telefone, email, username ou tag..."
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </div>
          <AnimatedTabs value={filtro} onValueChange={(valor) => setFiltro(valor as typeof filtro)} className="min-w-0">
            <TabsList className="flex max-w-full overflow-x-auto">
              {filtrosCliente.map((item) => (
                <TabsTrigger key={item} value={item} className="shrink-0 px-3">
                  {item === "todos" ? "Todos" : traduzirEstadoCliente(item)}
                </TabsTrigger>
              ))}
            </TabsList>
          </AnimatedTabs>
        </CrmFilterDock>

        <CrmList className="crm21-clientes-list crm-commerce-list" aria-busy={carregando}>
          {clientesFiltrados.length ? (
            clientesFiltrados.map((cliente) => (
              <CrmListItem
                key={cliente.id}
                media={(
                  <Avatar className="h-9 w-9 border-0">
                    {cliente.avatarUrl && <AvatarImage src={cliente.avatarUrl} alt={cliente.nome ?? cliente.username ?? "Cliente"} />}
                    <AvatarFallback>{(cliente.nome ?? cliente.username ?? cliente.telefone ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                title={cliente.nome || cliente.username || cliente.telefone || "Cliente sem nome"}
                description={cliente.telefone || cliente.email || cliente.origem || "Sem contacto principal"}
                tone={tomEstadoCliente(cliente.estadoRelacionamento)}
                meta={cliente.metricas.ultimaInteracaoEm ? formatarDataHoraCurta(cliente.metricas.ultimaInteracaoEm) : "Sem atividade"}
                badges={(
                  <>
                    <CrmStatusBadge tone={tomEstadoCliente(cliente.estadoRelacionamento)}>{traduzirEstadoCliente(cliente.estadoRelacionamento)}</CrmStatusBadge>
                    <Badge variant={cliente.consentimentoMarketing ? "success" : "outline"}>Marketing {cliente.consentimentoMarketing ? "ok" : "sem opt-in"}</Badge>
                    <Badge variant={cliente.consentimentoDados ? "info" : "outline"}>Dados {cliente.consentimentoDados ? "ok" : "pendente"}</Badge>
                    {cliente.tags.length ? cliente.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <Badge variant="outline"><Tags size={13} /> Sem tags</Badge>}
                  </>
                )}
                actions={(
                  <>
                    <Button variant="outline" size="lg" onClick={() => void criarAcaoRapida(cliente, cliente.metricas.reservasAtivas ? "COBRANCA" : "RECOMPRA")}>
                      <UserRoundCheck size={16} />
                      Criar ação
                    </Button>
                    <Button asChild size="lg">
                      <Link to="/app/conversas">
                        <MessageCircle size={16} />
                        Atender
                      </Link>
                    </Button>
                  </>
                )}
              >
                <div className="grid gap-2 sm:grid-cols-4">
                  <CrmMetricMini label="pedidos" value={cliente.metricas.totalReservas} />
                  <CrmMetricMini label="pagos" value={cliente.metricas.reservasPagas} tone={cliente.metricas.reservasPagas ? "sucesso" : "neutro"} />
                  <CrmMetricMini label="mensagens" value={cliente.metricas.totalMensagens} tone={cliente.metricas.totalMensagens ? "info" : "neutro"} />
                  <CrmMetricMini label="comprado" value={formatarKwanza(cliente.metricas.totalCompradoEmKwanza)} tone={cliente.metricas.totalCompradoEmKwanza ? "sucesso" : "neutro"} />
                </div>
              </CrmListItem>
            ))
          ) : (
            <EstadoVazio
              icone={<Users />}
              titulo={carregando ? "A carregar clientes 360" : "Sem clientes neste filtro"}
              detalhe={carregando ? "A consultar o CRM, conversas, reservas e métricas." : "Ajuste a busca ou aguarde novas interações nos canais."}
            />
          )}
        </CrmList>
      </CrmSection>

      <CrmSection
        icon={<Network size={20} />}
        title="Segmentos automáticos"
        description="O backend já organiza grupos comerciais para campanha, recuperação, recompra, VIP e partilha responsável entre negócios."
      >
        <CrmList columns="three">
          {segmentos.length ? segmentos.map((segmento) => (
            <CrmListItem
              key={segmento.id}
              media={<Network size={18} />}
              title={segmento.titulo}
              description={segmento.criterio}
              tone={segmento.total ? "principal" : "neutro"}
              meta={`${segmento.total} clientes`}
            >
              <div className="grid gap-2">
                {segmento.clientes.slice(0, 3).map((cliente) => (
                  <div key={cliente.id} className="market-chip-row flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="truncate">{cliente.nome || cliente.telefone || cliente.email || "Cliente"}</span>
                    <strong>{formatarKwanza(cliente.totalCompradoEmKwanza)}</strong>
                  </div>
                ))}
              </div>
            </CrmListItem>
          )) : (
            <EstadoVazio icone={<Network />} titulo="Sem segmentos calculados" detalhe="Quando houver clientes, o CRM cria grupos para campanha, recuperação e recompra." />
          )}
        </CrmList>
      </CrmSection>

      {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function clientesParaCsv(clientes: Cliente360[]): string {
  const linhas = [
    ["nome", "telefone", "email", "username", "estado", "tags", "comprado_kz", "pedidos", "mensagens", "consentimento_marketing", "consentimento_dados"],
    ...clientes.map((cliente) => [
      cliente.nome ?? "",
      cliente.telefone ?? "",
      cliente.email ?? "",
      cliente.username ?? "",
      cliente.estadoRelacionamento,
      cliente.tags.join("|"),
      String(cliente.metricas.totalCompradoEmKwanza),
      String(cliente.metricas.totalReservas),
      String(cliente.metricas.totalMensagens),
      cliente.consentimentoMarketing ? "sim" : "nao",
      cliente.consentimentoDados ? "sim" : "nao"
    ])
  ];

  return `${linhas.map((linha) => linha.map((valor) => `"${valor.replace(/"/g, '""')}"`).join(",")).join("\n")}\n`;
}

function traduzirEstadoCliente(estado: EstadoRelacionamentoCliente): string {
  const mapa: Record<EstadoRelacionamentoCliente, string> = {
    ATIVO: "Ativo",
    LEAD: "Lead",
    VIP: "VIP",
    INATIVO: "Inativo",
    BLOQUEADO: "Bloqueado",
    SEM_WHATSAPP: "Sem WhatsApp",
    SEM_CONSENTIMENTO: "Sem consent.",
    INADIMPLENTE: "Inadimplente",
    PRIORIDADE_ALTA: "Prioridade"
  };
  return mapa[estado];
}

function tomEstadoCliente(estado: EstadoRelacionamentoCliente): "neutro" | "principal" | "sucesso" | "atencao" | "perigo" | "info" {
  if (estado === "VIP" || estado === "ATIVO") return "sucesso";
  if (estado === "LEAD" || estado === "PRIORIDADE_ALTA") return "principal";
  if (estado === "INADIMPLENTE" || estado === "SEM_CONSENTIMENTO") return "atencao";
  if (estado === "BLOQUEADO") return "perigo";
  if (estado === "SEM_WHATSAPP") return "info";
  return "neutro";
}
