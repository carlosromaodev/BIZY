import {
  AlertCircle,
  Download,
  MessageCircle,
  RefreshCcw,
  Search,
  Tags,
  UserRoundPlus,
  Users,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { requisitarApi } from "../api";
import { clientesParaCsv, montarClientesCrm, type ClienteCrm, type EstadoClienteCrm } from "../crm";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection } from "../componentes/CrmInterno21st";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Component as AnimatedTabs, TabsList, TabsTrigger } from "@/components/ui/animated-tabs";
import type { Peca, Reserva, RespostaConversas } from "../tipos";
import { formatarDataHoraCurta, formatarKwanza } from "../utilidades";

const filtrosCliente: Array<"todos" | EstadoClienteCrm> = ["todos", "Pendente", "VIP", "Recorrente", "Novo"];

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
  const [clientes, setClientes] = useState<ClienteCrm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof filtrosCliente)[number]>("todos");

  async function carregar() {
    setCarregando(true);
    try {
      const [respostaConversas, reservas, pecas] = await Promise.all([
        requisitarApi<RespostaConversas>("/atendimento/conversas"),
        requisitarApi<Reserva[]>("/reservas"),
        requisitarApi<Peca[]>("/pecas")
      ]);

      setClientes(montarClientesCrm({
        conversas: respostaConversas.conversas,
        reservas,
        pecas
      }));
      setMensagem("");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (filtro !== "todos" && cliente.estado !== filtro) return false;
      if (!termo) return true;
      return (
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.telefone.includes(termo) ||
        cliente.telefoneFormatado.toLowerCase().includes(termo) ||
        cliente.tags.some((tag) => tag.toLowerCase().includes(termo))
      );
    });
  }, [busca, clientes, filtro]);

  const compradores = clientes.filter((cliente) => cliente.pedidosPagos > 0).length;
  const pendentes = clientes.filter((cliente) => cliente.pedidosPendentes > 0 || cliente.mensagensFalhadas > 0).length;
  const valorPago = clientes.reduce((total, cliente) => total + cliente.valorPago, 0);

  function exportarClientes() {
    baixarArquivo("clientes-bizy.csv", clientesParaCsv(clientesFiltrados));
    setMensagem(`${clientesFiltrados.length} clientes exportados.`);
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="CRM de loja" titulo="Clientes">
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
          { icone: <Users />, titulo: "Clientes", valor: clientes.length, detalhe: "com histórico identificado", tom: "principal" },
          { icone: <WalletCards />, titulo: "Compradores", valor: compradores, detalhe: "com pagamento confirmado", tom: "sucesso" },
          { icone: <AlertCircle />, titulo: "Pendências", valor: pendentes, detalhe: "pagamento ou envio falhado", tom: pendentes ? "atencao" : "neutro" },
          { icone: <UserRoundPlus />, titulo: "Receita paga", valor: formatarKwanza(valorPago), detalhe: "valor confirmado no CRM" }
        ]}
      />

      <CrmSection
        icon={<Users size={20} />}
        title="Base de clientes"
        description="Consulta operacional para vendas, cobrança e relacionamento."
      >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                aria-label="Buscar clientes"
                className="pl-9"
                style={{ paddingLeft: "2.25rem" }}
                placeholder="Buscar cliente, telefone ou etiqueta..."
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </div>
            <AnimatedTabs value={filtro} onValueChange={(valor) => setFiltro(valor as typeof filtro)}>
              <TabsList className="grid-cols-5">
                {filtrosCliente.map((item) => (
                  <TabsTrigger key={item} value={item} className="px-2">
                    {item === "todos" ? "Todos" : item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </AnimatedTabs>
          </div>

          <CrmList className="crm21-clientes-list crm-commerce-list" aria-busy={carregando}>
            {clientesFiltrados.length ? (
              clientesFiltrados.map((cliente) => (
                <CrmListItem
                  key={cliente.telefone}
                  media={(
                    <Avatar className="h-8 w-8 border-0">
                      <AvatarFallback>{cliente.nome.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  title={cliente.nome}
                  description={cliente.telefoneFormatado}
                  tone={cliente.estado === "Pendente" ? "atencao" : cliente.estado === "VIP" || cliente.estado === "Recorrente" ? "sucesso" : "principal"}
                  meta={cliente.ultimaInteracao ? formatarDataHoraCurta(cliente.ultimaInteracao) : "Sem atividade"}
                  badges={(
                    <>
                      <Badge className="w-fit" variant={obterVarianteCliente(cliente.estado)}>{cliente.estado}</Badge>
                      {cliente.tags.length ? (
                        cliente.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)
                      ) : (
                        <Badge variant="outline"><Tags size={13} /> Sem etiqueta</Badge>
                      )}
                    </>
                  )}
                  actions={(
                    <Button asChild variant="outline" size="lg">
                      <Link to="/app/conversas">
                        <MessageCircle size={16} />
                        Atender
                      </Link>
                    </Button>
                  )}
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <CrmMetricMini label="pedidos" value={cliente.pedidos} />
                    <CrmMetricMini label="pagos" value={cliente.pedidosPagos} tone={cliente.pedidosPagos ? "sucesso" : "neutro"} />
                    <CrmMetricMini label="valor pago" value={formatarKwanza(cliente.valorPago)} tone={cliente.valorPago ? "sucesso" : "neutro"} />
                  </div>
                </CrmListItem>
              ))
            ) : (
              <EstadoVazio
                icone={<Users />}
                titulo={carregando ? "A carregar clientes" : "Sem clientes neste filtro"}
                detalhe={carregando ? "A consolidar conversas e pedidos." : "Ajuste a busca ou aguarde novas interações."}
              />
            )}
          </CrmList>
      </CrmSection>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function obterVarianteCliente(estado: EstadoClienteCrm): "success" | "warning" | "info" | "secondary" {
  if (estado === "VIP" || estado === "Recorrente") return "success";
  if (estado === "Pendente") return "warning";
  if (estado === "Novo") return "info";
  return "secondary";
}
