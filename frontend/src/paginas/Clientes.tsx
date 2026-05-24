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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <>
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

      <Card>
        <CardContent className="grid gap-4 p-4">
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
            <div className="flex flex-wrap gap-2" aria-label="Filtrar clientes">
              {filtrosCliente.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={filtro === item ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltro(item)}
                >
                  {item === "todos" ? "Todos" : item}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid crm-commerce-list gap-3" aria-busy={carregando}>
            {clientesFiltrados.length ? (
              clientesFiltrados.map((cliente) => (
                <Card key={cliente.telefone} className="bg-muted/20">
                  <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.8fr_1fr_1fr_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{cliente.nome.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <strong className="block truncate">{cliente.nome}</strong>
                      <span className="block truncate text-sm text-muted-foreground">{cliente.telefoneFormatado}</span>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Badge className="w-fit" variant={obterVarianteCliente(cliente.estado)}>{cliente.estado}</Badge>
                    <small className="text-muted-foreground">{cliente.ultimaInteracao ? formatarDataHoraCurta(cliente.ultimaInteracao) : "Sem atividade"}</small>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span><strong>{cliente.pedidos}</strong> pedidos</span>
                    <span><strong>{cliente.pedidosPagos}</strong> pagos</span>
                    <span><strong>{formatarKwanza(cliente.valorPago)}</strong></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cliente.tags.length ? (
                      cliente.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)
                    ) : (
                      <Badge variant="outline"><Tags size={13} /> Sem etiqueta</Badge>
                    )}
                  </div>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/app/conversas">
                      <MessageCircle size={16} />
                      Atender
                    </Link>
                  </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EstadoVazio
                icone={<Users />}
                titulo={carregando ? "A carregar clientes" : "Sem clientes neste filtro"}
                detalhe={carregando ? "A consolidar conversas e pedidos." : "Ajuste a busca ou aguarde novas interações."}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function obterVarianteCliente(estado: EstadoClienteCrm): "success" | "warning" | "info" | "secondary" {
  if (estado === "VIP" || estado === "Recorrente") return "success";
  if (estado === "Pendente") return "warning";
  if (estado === "Novo") return "info";
  return "secondary";
}
