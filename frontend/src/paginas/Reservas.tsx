import {
  Ban,
  CheckCircle2,
  Clock,
  ReceiptText,
  RefreshCcw,
  Search,
  UserRoundCheck,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { requisitarApi, obterUrlEventos } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { Reserva, Peca } from "../tipos";
import { estadosReservaAtiva } from "../tipos";
import {
  formatarDataHoraCurta,
  formatarKwanza,
  formatarTempoRestante,
  obterPrecoDaPeca,
  traduzirEstadoPagamentoCurto,
  traduzirEstadoReserva
} from "../utilidades";

export function PaginaReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [limitePedidos, setLimitePedidos] = useState(12);

  async function carregar() {
    try {
      const [listaReservas, listaPecas] = await Promise.all([
        requisitarApi<Reserva[]>("/reservas"),
        requisitarApi<Peca[]>("/pecas")
      ]);
      setReservas(listaReservas);
      setPecas(listaPecas);
    } catch {
      setMensagem("Erro ao carregar reservas.");
    }
  }

  useEffect(() => {
    void carregar();
    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregar();
    ["RESERVATION_CREATED", "RESERVATION_EXPIRING", "RESERVATION_WAITLISTED", "PAYMENT_CONFIRMED", "RESERVATION_EXPIRED"].forEach(
      (e) => eventos.addEventListener(e, atualizar)
    );
    return () => eventos.close();
  }, []);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro.");
    } finally {
      setCarregando(false);
    }
  }

  const reservasAtivas = useMemo(() => reservas.filter((r) => estadosReservaAtiva.includes(r.estado)), [reservas]);
  const pagas = reservas.filter((r) => r.estado === "PAID").length;
  const aguardando = reservas.filter((r) => r.estado === "WAITING_PAYMENT").length;
  const resumoPedidos = [
    {
      titulo: "Total",
      valor: reservas.length,
      detalhe: "pedidos criados",
      icone: <ReceiptText />,
      tom: "principal" as const
    },
    {
      titulo: "Ativos",
      valor: reservasAtivas.length,
      detalhe: "pendentes ou reservados",
      icone: <Clock />,
      tom: "atencao" as const
    },
    {
      titulo: "Aguardando",
      valor: aguardando,
      detalhe: "pagamento pendente",
      icone: <WalletCards />,
      tom: "info" as const
    },
    {
      titulo: "Pagas",
      valor: pagas,
      detalhe: "confirmadas",
      icone: <UserRoundCheck />,
      tom: "sucesso" as const
    }
  ];

  const reservasFiltradas = reservas.filter((r) => {
    if (filtro !== "todos" && r.estado !== filtro) return false;
    if (busca) {
      const t = busca.toLowerCase();
      return r.nomeCliente.toLowerCase().includes(t) || r.telefoneCliente.includes(t) || r.codigoPeca.includes(t);
    }
    return true;
  });
  const reservasVisiveis = reservasFiltradas.slice(0, limitePedidos);
  const existemMaisReservas = reservasVisiveis.length < reservasFiltradas.length;

  useEffect(() => {
    setLimitePedidos(12);
  }, [busca, filtro]);

  function reservaQuaseExpirada(reserva: Reserva): boolean {
    if (!reserva.expiraEm || !estadosReservaAtiva.includes(reserva.estado)) return false;
    const minutos = Math.ceil((new Date(reserva.expiraEm).getTime() - Date.now()) / 60_000);
    return minutos > 0 && minutos <= 5;
  }

  return (
    <>
      <CabecalhoPagina rotulo="Gestão de pedidos" titulo="Pedidos" />

      <ResumoIndicadores rotulo="Resumo dos pedidos" itens={resumoPedidos} />

      <Card>
        <CardContent className="grid gap-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input aria-label="Buscar pedidos" className="pl-9" style={{ paddingLeft: "2.25rem" }} placeholder="Buscar por cliente, telefone ou produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger aria-label="Filtrar pedidos por estado">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="RESERVED">Reservada</SelectItem>
                <SelectItem value="WAITING_PAYMENT">Aguardando</SelectItem>
                <SelectItem value="PAID">Paga</SelectItem>
                <SelectItem value="EXPIRED">Expirada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                <SelectItem value="WAITLISTED">Fila</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon-lg" onClick={() => void carregar()} title="Atualizar" aria-label="Atualizar pedidos">
              <RefreshCcw size={18} />
            </Button>
          </div>

          <div className="reservas-commerce-list grid gap-3">
            {reservasVisiveis.length ? (
              reservasVisiveis.map((r) => {
                const preco = obterPrecoDaPeca(pecas, r.codigoPeca);
                const critica = reservaQuaseExpirada(r);

                return (
                  <Card key={r.id} className={critica ? "border-warning/25 bg-warning/5" : "bg-muted/20"}>
                    <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-center">
                    <div className="order-1 grid min-w-0 gap-1">
                      <strong>#{r.codigoPeca}</strong>
                      <span className="text-sm text-muted-foreground">{preco ? formatarKwanza(preco) : "Preço não encontrado"}</span>
                      <Badge className="w-fit" variant={obterVarianteReserva(r.estado)}>{traduzirEstadoReserva(r.estado)}</Badge>
                    </div>
                    <div className="order-3 col-span-2 grid min-w-0 gap-1 lg:order-2 lg:col-span-1">
                      <strong>{r.nomeCliente || r.usernameCliente}</strong>
                      <span className="text-sm text-muted-foreground">{r.telefoneCliente}</span>
                    </div>
                    <div className="order-4 col-span-2 grid grid-cols-2 gap-2 lg:contents">
                      <div className="grid gap-1 rounded-lg border bg-background/70 p-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                        <strong>{traduzirEstadoPagamentoCurto(r.estadoPagamento)}</strong>
                        <span className="text-xs text-muted-foreground lg:text-sm">{formatarDataHoraCurta(r.criadaEm)}</span>
                      </div>
                      <div className="grid gap-1 rounded-lg border bg-background/70 p-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
                        <strong>{formatarTempoRestante(r.expiraEm)}</strong>
                        <span className="text-xs text-muted-foreground lg:text-sm">{r.expiraEm ? formatarDataHoraCurta(r.expiraEm) : "Sem expiração"}</span>
                      </div>
                    </div>
                    <div className="order-2 flex gap-2 lg:order-5 lg:justify-end">
                      <Button
                        variant="success"
                        size="icon-lg"
                        title="Confirmar pagamento"
                        onClick={() => {
                          if (!window.confirm(`Confirmar pagamento da peça #${r.codigoPeca}?`)) return;
                          void executar(() => requisitarApi(`/reservas/${r.id}/confirmar-pagamento`, { method: "POST", body: {} }), "Pagamento confirmado.");
                        }}
                        disabled={carregando || r.estado === "PAID"}
                      >
                        <CheckCircle2 size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-lg"
                        title="Cancelar reserva"
                        onClick={() => {
                          if (!window.confirm(`Cancelar a reserva da peça #${r.codigoPeca}?`)) return;
                          void executar(() => requisitarApi(`/reservas/${r.id}/cancelar`, { method: "POST", body: { motivo: "Cancelada pelo vendedor." } }), "Reserva cancelada.");
                        }}
                        disabled={carregando || ["CANCELLED", "EXPIRED", "PAID"].includes(r.estado)}
                      >
                        <Ban size={18} />
                      </Button>
                    </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EstadoVazio icone={<ReceiptText />} titulo="Sem pedidos" detalhe="Os pedidos aparecem aqui em tempo real." />
            )}
          </div>
          {existemMaisReservas && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setLimitePedidos((limiteAtual) => limiteAtual + 12)}
            >
              Ver mais pedidos
            </Button>
          )}
        </CardContent>
      </Card>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function obterVarianteReserva(estado: Reserva["estado"]): "success" | "warning" | "info" | "destructive" | "secondary" {
  if (estado === "PAID") return "success";
  if (estado === "RESERVED" || estado === "WAITING_PAYMENT" || estado === "PENDING") return "warning";
  if (estado === "WAITLISTED") return "info";
  if (estado === "CANCELLED" || estado === "EXPIRED") return "destructive";
  return "secondary";
}
