import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Link2,
  MessageCircle,
  Phone,
  Package,
  RefreshCcw,
  Save,
  Search,
  Send,
  StickyNote,
  UserRound
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { obterUrlEventos, requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion } from "../componentes/CrmInterno21st";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import type { Conversa, Mensagem, Peca, Reserva, RespostaConversas } from "../tipos";
import {
  formatarKwanza,
  formatarTempoRestante,
  traduzirEstadoPagamentoCurto,
  traduzirEstadoReserva
} from "../utilidades";

const estadosCrm = [
  "NOVA",
  "ABERTA",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_PAGAMENTO",
  "AGUARDANDO_HUMANO",
  "RESOLVIDA",
  "ENCERRADA"
] as const;
const prioridadesCrm = ["BAIXA", "NORMAL", "ALTA", "URGENTE"] as const;
const politicasAutomacao = ["AUTOMATICO", "SUGERIR_RESPOSTA", "EXIGIR_HUMANO", "BLOQUEAR_IA"] as const;

type MensagemParcial = Partial<Mensagem> & {
  criadoEm?: string;
  direcao?: string;
  estadoEnvio?: Mensagem["status"];
  texto?: string;
};

type ConversaParcial = Partial<Conversa> & {
  mensagens?: MensagemParcial[];
  telefoneCliente?: string;
};

type ContextoComercialDados = {
  pecaRelacionada: Peca | null;
  reservasCliente: Reserva[];
  pecasFiltradas: Peca[];
  reservasFiltradas: Reserva[];
};

export function PaginaConversas() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("todos");
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [buscaContexto, setBuscaContexto] = useState("");
  const [contextoAberto, setContextoAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [textoResposta, setTextoResposta] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const [mobileDetalheAberto, setMobileDetalheAberto] = useState(false);
  const mensagensRef = useRef<HTMLDivElement | null>(null);
  const [formCrm, setFormCrm] = useState({
    estadoCrm: "NOVA" as Conversa["estadoCrm"],
    prioridade: "NORMAL" as Conversa["prioridade"],
    responsavelId: "",
    politicaAutomacao: "AUTOMATICO" as Conversa["politicaAutomacao"]
  });
  const [carregando, setCarregando] = useState(false);

  async function carregar() {
    try {
      const [resposta, listaPecas, listaReservas] = await Promise.all([
        requisitarApi<RespostaConversas>("/atendimento/conversas"),
        requisitarApi<Peca[]>("/pecas"),
        requisitarApi<Reserva[]>("/reservas")
      ]);
      const conversasNormalizadas = (resposta.conversas ?? []).map(normalizarConversaAtendimento);
      setConversas(conversasNormalizadas);
      setPecas(listaPecas);
      setReservas(listaReservas);
      setConversaSelecionada((atual) => atual ?? conversasNormalizadas[0]?.id ?? null);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar conversas.");
    }
  }

  useEffect(() => {
    void carregar();
    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregar();
    [
      "COMMENT_RECEIVED",
      "COMMENT_PARSED",
      "RESERVATION_CREATED",
      "PAYMENT_CONFIRMED",
      "RESERVATION_EXPIRED",
      "WHATSAPP_MESSAGE_RECEIVED",
      "WHATSAPP_MESSAGE_SENT",
      "WHATSAPP_MESSAGE_FAILED",
      "WHATSAPP_MESSAGE_STATUS"
    ].forEach((evento) => eventos.addEventListener(evento, atualizar));
    return () => eventos.close();
  }, []);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A processar...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Operação rejeitada.");
    } finally {
      setCarregando(false);
    }
  }

  const conversaAtual = conversas.find((conversa) => conversa.id === conversaSelecionada) ?? null;
  const responsaveis = useMemo(
    () => [...new Set(conversas.map((conversa) => conversa.responsavelId).filter((item): item is string => Boolean(item)))],
    [conversas]
  );
  const conversasFiltradas = useMemo(() => {
    const porBusca = busca
      ? conversas.filter((conversa) => {
        const termo = busca.toLowerCase();
        return (
          conversa.nomeCliente.toLowerCase().includes(termo) ||
          conversa.telefone.includes(busca) ||
          conversa.pecaRelacionada?.toLowerCase().includes(termo) ||
          conversa.responsavelId?.toLowerCase().includes(termo)
        );
      })
      : conversas;

    if (filtroResponsavel === "todos") return porBusca;
    if (filtroResponsavel === "sem-responsavel") return porBusca.filter((conversa) => !conversa.responsavelId);
    return porBusca.filter((conversa) => conversa.responsavelId === filtroResponsavel);
  }, [busca, conversas, filtroResponsavel]);

  useEffect(() => {
    if (!conversaAtual) return;
    setFormCrm({
      estadoCrm: conversaAtual.estadoCrm ?? "NOVA",
      prioridade: conversaAtual.prioridade ?? "NORMAL",
      responsavelId: conversaAtual.responsavelId ?? "",
      politicaAutomacao: conversaAtual.politicaAutomacao ?? "AUTOMATICO"
    });
    setNotaInterna("");
  }, [
    conversaAtual?.conversaCrmId,
    conversaAtual?.estadoCrm,
    conversaAtual?.politicaAutomacao,
    conversaAtual?.prioridade,
    conversaAtual?.responsavelId
  ]);

  useEffect(() => {
    setBuscaContexto("");
    setContextoAberto(false);
  }, [conversaAtual?.id]);

  const detalheMobileAtivo = Boolean(mobileDetalheAberto && conversaAtual);

  useEffect(() => {
    if (!conversaAtual) return;

    const frame = window.requestAnimationFrame(() => {
      if (!mensagensRef.current) return;

      mensagensRef.current.scrollTo({ top: mensagensRef.current.scrollHeight, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversaAtual?.id, conversaAtual?.mensagens.length, detalheMobileAtivo]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!detalheMobileAtivo) {
      delete document.body.dataset.mobileChatImersivo;
      document.body.classList.remove("mobile-chat-imersivo");
      return;
    }

    document.body.dataset.mobileChatImersivo = "true";
    document.body.classList.add("mobile-chat-imersivo");

    return () => {
      delete document.body.dataset.mobileChatImersivo;
      document.body.classList.remove("mobile-chat-imersivo");
    };
  }, [detalheMobileAtivo]);

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault();
    const texto = textoResposta.trim();
    if (!conversaAtual || !texto) return;

    await executar(
      () => requisitarApi("/whatsapp/mensagens", {
        method: "POST",
        body: {
          telefone: conversaAtual.telefone,
          mensagem: texto
        }
      }),
      "Mensagem enviada para o WhatsApp."
    );
    setTextoResposta("");
  }

  async function enviarMensagemRapida(texto: string) {
    if (!conversaAtual || !texto.trim()) return;

    await executar(
      () => requisitarApi("/whatsapp/mensagens", {
        method: "POST",
        body: {
          telefone: conversaAtual.telefone,
          mensagem: texto.trim()
        }
      }),
      "Mensagem enviada para o WhatsApp."
    );
  }

  async function reenviarMensagem(mensagemFalhada: Mensagem) {
    if (!conversaAtual || !mensagemFalhada.conteudo.trim()) return;

    await executar(
      () =>
        requisitarApi("/whatsapp/mensagens", {
          method: "POST",
          body: {
            telefone: conversaAtual.telefone,
            mensagem: mensagemFalhada.conteudo
          }
        }),
      "Reenvio solicitado pelo WhatsApp."
    );
  }

  async function guardarGestaoCrm(e: FormEvent) {
    e.preventDefault();
    if (!conversaAtual?.conversaCrmId) return;

    await executar(async () => {
      await requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}`, {
        method: "PATCH",
        body: {
          estado: formCrm.estadoCrm,
          prioridade: formCrm.prioridade,
          responsavelId: formCrm.responsavelId.trim() || null
        }
      });

      if (formCrm.politicaAutomacao !== conversaAtual.politicaAutomacao) {
        await requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}/politica`, {
          method: "POST",
          body: { politica: formCrm.politicaAutomacao }
        });
      }
    }, "Conversa atualizada no CRM.");
  }

  async function guardarNotaInterna(e: FormEvent) {
    e.preventDefault();
    const texto = notaInterna.trim();
    if (!conversaAtual?.conversaCrmId || !texto) return;

    await executar(
      () =>
        requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}/notas`, {
          method: "POST",
          body: { texto }
        }),
      "Nota interna guardada."
    );
    setNotaInterna("");
  }

  async function guardarSugestaoResposta() {
    const texto = textoResposta.trim();
    if (!conversaAtual?.conversaCrmId || !texto) return;

    await executar(
      () =>
        requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}/sugestoes`, {
          method: "POST",
          body: {
            texto,
            regra: "sugestao_operador",
            confianca: 1,
            dadosConsultados: {
              conversaCrmId: conversaAtual.conversaCrmId,
              telefone: conversaAtual.telefone
            }
          }
        }),
      "Rascunho guardado para revisão humana."
    );
    setTextoResposta("");
  }

  const contextoComercial = useMemo<ContextoComercialDados>(() => {
    if (!conversaAtual) {
      return {
        pecaRelacionada: null as Peca | null,
        reservasCliente: [] as Reserva[],
        pecasFiltradas: [] as Peca[],
        reservasFiltradas: [] as Reserva[]
      };
    }

    const telefone = normalizarTelefoneLocal(conversaAtual.telefone);
    const codigoRelacionado = conversaAtual.reservaAtual?.codigoPeca ?? conversaAtual.pecaRelacionada ?? "";
    const termo = buscaContexto.trim().toLowerCase();
    const pecaRelacionada = codigoRelacionado
      ? pecas.find((peca) => peca.codigo.toLowerCase() === codigoRelacionado.toLowerCase()) ?? null
      : null;
    const reservasCliente = reservas
      .filter((reserva) => normalizarTelefoneLocal(reserva.telefoneCliente) === telefone)
      .sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());

    const pecasBase = termo
      ? pecas.filter((peca) =>
        peca.codigo.toLowerCase().includes(termo) ||
        peca.nome.toLowerCase().includes(termo) ||
        peca.descricao.toLowerCase().includes(termo)
      )
      : pecas.filter((peca) => peca.estado === "DISPONIVEL" || peca.codigo === codigoRelacionado);

    const reservasBase = termo
      ? reservas.filter((reserva) =>
        reserva.codigoPeca.toLowerCase().includes(termo) ||
        reserva.nomeCliente.toLowerCase().includes(termo) ||
        reserva.telefoneCliente.includes(termo)
      )
      : reservasCliente;

    return {
      pecaRelacionada,
      reservasCliente,
      pecasFiltradas: pecasBase.slice(0, 5),
      reservasFiltradas: reservasBase.slice(0, 5)
    };
  }, [buscaContexto, conversaAtual, pecas, reservas]);

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Atendimento" titulo="Conversas e contexto">
        <Button variant="outline" size="lg" onClick={() => void carregar()}>
          <RefreshCcw data-icon="inline-start" className="size-4" aria-hidden="true" />
          Atualizar
        </Button>
      </CabecalhoPagina>

      <section className="conversas-commerce-layout grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className={`market-panel ${detalheMobileAtivo ? "hidden lg:block" : "block"}`}>
          <CardContent className="grid gap-3 p-4">
            <CampoBusca aria-label="Buscar conversas" placeholder="Buscar cliente, telefone ou peça..." value={busca} onChange={setBusca} />
            <div className="flex items-center gap-2">
              <UserRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                <SelectTrigger aria-label="Filtrar conversas por responsável">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os responsáveis</SelectItem>
                  <SelectItem value="sem-responsavel">Sem responsável</SelectItem>
                  {responsaveis.map((responsavel) => (
                    <SelectItem key={responsavel} value={responsavel}>
                      {responsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CrmList className="max-h-[calc(100dvh-260px)] overflow-y-auto pr-1">
              {conversasFiltradas.length ? (
                conversasFiltradas.map((conversa) => {
                  const ativa = conversaSelecionada === conversa.id;

                  return (
                    <Button
                      type="button"
                      key={conversa.id}
                      variant="ghost"
                      className="h-auto w-full justify-start whitespace-normal p-0 text-left hover:bg-transparent"
                      aria-label={`Abrir conversa com ${conversa.nomeCliente}`}
                      aria-pressed={ativa}
                      onClick={() => {
                        setConversaSelecionada(conversa.id);
                        setMobileDetalheAberto(true);
                      }}
                    >
                      <CrmListItem
                        className={ativa ? "border-primary/35 bg-primary/5" : undefined}
                        media={(
                          <div className="relative">
                          <Avatar className="h-10 w-10">
                            {conversa.avatarUrlCliente && <AvatarImage src={conversa.avatarUrlCliente} alt="" />}
                            <AvatarFallback>{conversa.nomeCliente[0]?.toUpperCase() ?? "C"}</AvatarFallback>
                          </Avatar>
                          {conversa.mensagensNaoLidas > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] text-primary-foreground">
                              {conversa.mensagensNaoLidas}
                            </span>
                          )}
                        </div>
                        )}
                        title={conversa.nomeCliente}
                        description={conversa.ultimaMensagem}
                        meta={formatarHora(conversa.ultimaAtualizacao)}
                        tone={conversa.mensagensNaoLidas > 0 ? "principal" : conversa.estadoCrm === "AGUARDANDO_HUMANO" ? "atencao" : "neutro"}
                        badges={(
                          <>
                            <Badge variant={obterVarianteEstadoConversa(conversa.estado)}>{traduzirEstadoConversa(conversa.estado)}</Badge>
                            <Badge variant={obterVarianteEstadoCrm(conversa.estadoCrm)}>{traduzirEstadoCrm(conversa.estadoCrm)}</Badge>
                            {conversa.responsavelId && <Badge variant="secondary">{conversa.responsavelId}</Badge>}
                            {["ALTA", "URGENTE"].includes(conversa.prioridade) && (
                              <Badge variant={obterVariantePrioridade(conversa.prioridade)}>{traduzirPrioridade(conversa.prioridade)}</Badge>
                            )}
                            {conversa.pecaRelacionada && <Badge variant="outline">{conversa.pecaRelacionada}</Badge>}
                          </>
                        )}
                      />
                    </Button>
                  );
                })
              ) : (
                <EstadoVazio icone={<MessageCircle />} titulo="Sem conversas" detalhe="Comentários com telefone e reservas aparecem aqui." />
              )}
            </CrmList>
          </CardContent>
        </Card>

        <Card className={`market-panel chat-social-panel ${detalheMobileAtivo ? "block" : "hidden lg:block"}`}>
          <CardContent className="chat-social-shell grid min-h-0 gap-3 p-3 lg:p-4">
            {conversaAtual ? (
              <>
                <div className="chat-social-header flex flex-wrap items-center gap-3 border-b pb-3">
                  <Button
                    type="button"
                    className="lg:hidden"
                    variant="outline"
                    size="icon-lg"
                    onClick={() => setMobileDetalheAberto(false)}
                    aria-label="Voltar às conversas"
                    title="Voltar às conversas"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <Avatar className="h-11 w-11">
                    {conversaAtual.avatarUrlCliente && <AvatarImage src={conversaAtual.avatarUrlCliente} alt="" />}
                    <AvatarFallback>{conversaAtual.nomeCliente[0]?.toUpperCase() ?? "C"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate">{conversaAtual.nomeCliente}</strong>
                    <span className="block truncate text-sm text-muted-foreground">{conversaAtual.telefone} · {conversaAtual.pecaRelacionada ?? "sem peça ativa"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={obterVarianteEstadoConversa(conversaAtual.estado)}>{traduzirEstadoConversa(conversaAtual.estado)}</Badge>
                    <Badge variant={obterVarianteEstadoCrm(conversaAtual.estadoCrm)}>{traduzirEstadoCrm(conversaAtual.estadoCrm)}</Badge>
                    <Button asChild variant="outline" size="icon-lg">
                      <a title="Ligar" href={`tel:${conversaAtual.telefone}`}>
                        <Phone className="size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>

              <details className="market-management chat-social-management rounded-lg border bg-muted/20 p-3 lg:p-4">
                <summary className="cursor-pointer">
                  <span>Gestão do atendimento</span>
                  <small className="ml-2 text-muted-foreground">
                    {traduzirEstadoCrm(conversaAtual.estadoCrm)} · {traduzirPrioridade(conversaAtual.prioridade)}
                  </small>
                </summary>

                <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={(e) => void guardarGestaoCrm(e)}>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Estado</span>
                    <Select
                      value={formCrm.estadoCrm}
                      onValueChange={(estado) => setFormCrm((atual) => ({ ...atual, estadoCrm: estado as Conversa["estadoCrm"] }))}
                      disabled={carregando || !conversaAtual.conversaCrmId}
                    >
                      <SelectTrigger aria-label="Alterar estado do atendimento">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosCrm.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {traduzirEstadoCrm(estado)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Prioridade</span>
                    <Select
                      value={formCrm.prioridade}
                      onValueChange={(prioridade) => setFormCrm((atual) => ({ ...atual, prioridade: prioridade as Conversa["prioridade"] }))}
                      disabled={carregando || !conversaAtual.conversaCrmId}
                    >
                      <SelectTrigger aria-label="Alterar prioridade do atendimento">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {prioridadesCrm.map((prioridade) => (
                          <SelectItem key={prioridade} value={prioridade}>
                            {traduzirPrioridade(prioridade)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Responsável</span>
                    <Input
                      aria-label="Responsável pelo atendimento"
                      value={formCrm.responsavelId}
                      onChange={(e) => setFormCrm((atual) => ({ ...atual, responsavelId: e.target.value }))}
                      placeholder="Nome ou ID"
                      disabled={carregando || !conversaAtual.conversaCrmId}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Automação</span>
                    <Select
                      value={formCrm.politicaAutomacao}
                      onValueChange={(politica) =>
                        setFormCrm((atual) => ({
                          ...atual,
                          politicaAutomacao: politica as Conversa["politicaAutomacao"]
                        }))
                      }
                      disabled={carregando || !conversaAtual.conversaCrmId}
                    >
                      <SelectTrigger aria-label="Alterar política de automação">
                        <SelectValue placeholder="Automação" />
                      </SelectTrigger>
                      <SelectContent>
                        {politicasAutomacao.map((politica) => (
                          <SelectItem key={politica} value={politica}>
                            {traduzirPoliticaAutomacao(politica)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <Button className="self-end" variant="outline" size="lg" disabled={carregando || !conversaAtual.conversaCrmId}>
                    <Save data-icon="inline-start" className="size-4" aria-hidden="true" />
                    Guardar
                  </Button>
                </form>

                {conversaAtual.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {conversaAtual.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag.replace("politica:", "auto:")}
                      </Badge>
                    ))}
                  </div>
                )}

                <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(e) => void guardarNotaInterna(e)}>
                  <Textarea
                    aria-label="Nota interna"
                    placeholder="Nota interna para a equipa..."
                    value={notaInterna}
                    onChange={(e) => setNotaInterna(e.target.value)}
                    disabled={carregando || !conversaAtual.conversaCrmId}
                    rows={1}
                  />
                  <Button variant="outline" size="lg" disabled={carregando || !notaInterna.trim() || !conversaAtual.conversaCrmId}>
                    <StickyNote data-icon="inline-start" className="size-4" aria-hidden="true" />
                    Nota
                  </Button>
                </form>

                <div className="mt-3 grid gap-3 rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {conversaAtual.reservaAtual
                        ? `Reserva ${conversaAtual.reservaAtual.estado} · pagamento ${conversaAtual.reservaAtual.estadoPagamento}`
                        : "Sem reserva ativa no backend"}
                    </span>
                  </div>
                  {conversaAtual.reservaAtual && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="success"
                        size="lg"
                        disabled={carregando || conversaAtual.reservaAtual.estado === "PAID"}
                        onClick={() =>
                          void executar(
                            () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/confirmar-pagamento`, { method: "POST", body: {} }),
                            "Pagamento confirmado."
                          )
                        }
                      >
                        <CheckCircle2 data-icon="inline-start" className="size-4" aria-hidden="true" />
                        Confirmar pagamento
                      </Button>
                      <Button
                        variant="destructive"
                        size="lg"
                        disabled={carregando || ["CANCELLED", "EXPIRED", "PAID"].includes(conversaAtual.reservaAtual.estado)}
                        onClick={() =>
                          void executar(
                            () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/cancelar`, { method: "POST", body: { motivo: "Cancelada pelo vendedor." } }),
                            "Reserva cancelada."
                          )
                        }
                      >
                        <Ban data-icon="inline-start" className="size-4" aria-hidden="true" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </details>

              <div ref={mensagensRef} className="market-chat-surface chat-commerce-messages grid auto-rows-max content-start min-h-0 gap-3 overflow-y-auto rounded-lg bg-muted/20 p-3">
                {conversaAtual.mensagens.map((item) => (
                  <MensagemLinha
                    key={item.id}
                    mensagem={item}
                    carregando={carregando}
                    onReenviar={(mensagemFalhada) => void reenviarMensagem(mensagemFalhada)}
                    onUsarSugestao={(mensagemSugestao) => setTextoResposta(mensagemSugestao.conteudo)}
                  />
                ))}
              </div>

              <form className="chat-commerce-composer chat-social-composer grid gap-2 rounded-lg border bg-background p-2 shadow-sm" onSubmit={(e) => void enviarMensagem(e)}>
                {contextoAberto && (
                  <PainelContextoComercial
                    contexto={contextoComercial}
                    pecas={pecas}
                    buscaContexto={buscaContexto}
                    onBuscarContexto={setBuscaContexto}
                    onUsarTexto={(texto) => setTextoResposta(texto)}
                    onEnviarTexto={(texto) => void enviarMensagemRapida(texto)}
                  />
                )}

                <div className="chat-commerce-row grid items-end gap-2">
                  <Textarea
                    aria-label="Responder pelo WhatsApp"
                    className="chat-commerce-textarea min-h-11 max-h-32 resize-none"
                    placeholder="Responder..."
                    value={textoResposta}
                    onChange={(e) => setTextoResposta(e.target.value)}
                    disabled={carregando}
                    rows={1}
                  />
                  <Button
                    type="button"
                    variant={contextoAberto ? "secondary" : "outline"}
                    size="icon-lg"
                    className="chat-commerce-context-button shadow-xs"
                    aria-label="Consultar produtos e pedidos"
                    title="Consultar produtos e pedidos"
                    aria-expanded={contextoAberto}
                    disabled={carregando}
                    onClick={() => setContextoAberto((aberto) => !aberto)}
                  >
                    <Package className="size-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    className="chat-commerce-draft-button"
                    aria-label="Guardar rascunho"
                    title="Guardar rascunho"
                    disabled={carregando || !textoResposta.trim() || !conversaAtual.conversaCrmId}
                    onClick={() => void guardarSugestaoResposta()}
                  >
                    <StickyNote className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon-lg"
                    className="chat-commerce-send-button"
                    aria-label="Enviar mensagem"
                    title="Enviar mensagem"
                    disabled={carregando || !textoResposta.trim()}
                  >
                    <Send className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <EstadoVazio
              icone={<MessageCircle />}
              titulo="Selecione uma conversa"
              detalhe="Escolha uma conversa na lista para ver o contexto."
            />
          )}
          </CardContent>
        </Card>
      </section>

      {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function PainelContextoComercial({
  contexto,
  pecas,
  buscaContexto,
  onBuscarContexto,
  onUsarTexto,
  onEnviarTexto
}: {
  contexto: ContextoComercialDados;
  pecas: Peca[];
  buscaContexto: string;
  onBuscarContexto: (valor: string) => void;
  onUsarTexto: (texto: string) => void;
  onEnviarTexto: (texto: string) => void;
}) {
  return (
    <div className="market-context-panel grid max-h-[38dvh] gap-3 overflow-y-auto rounded-lg border bg-muted/20 p-3 shadow-xs lg:max-h-[50dvh]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Consulta comercial</p>
          <h2 className="text-base font-semibold">Produtos e pedidos</h2>
        </div>
        <Badge className="h-7 gap-1.5 px-2.5" variant="outline">
          <Link2 data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          Banco ligado
        </Badge>
      </div>

      <CampoBusca aria-label="Buscar produtos e pedidos" placeholder="Buscar produto, pedido ou cliente..." value={buscaContexto} onChange={onBuscarContexto} />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-2">
          <RotuloComIcone icone={<Package className="size-4" aria-hidden="true" />}>
            Produtos
          </RotuloComIcone>
          {contexto.pecaRelacionada && (
            <ContextoPeca
              peca={contexto.pecaRelacionada}
              destaque="Relacionado à conversa"
              onUsar={onUsarTexto}
              onEnviar={onEnviarTexto}
            />
          )}
          {contexto.pecasFiltradas
            .filter((peca) => peca.codigo !== contexto.pecaRelacionada?.codigo)
            .slice(0, contexto.pecaRelacionada ? 3 : 4)
            .map((peca) => (
              <ContextoPeca
                key={peca.codigo}
                peca={peca}
                onUsar={onUsarTexto}
                onEnviar={onEnviarTexto}
              />
            ))}
          {!contexto.pecaRelacionada && contexto.pecasFiltradas.length === 0 && (
            <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}
        </div>

        <div className="grid gap-2">
          <RotuloComIcone icone={<ClipboardList className="size-4" aria-hidden="true" />}>
            Pedidos
          </RotuloComIcone>
          {contexto.reservasFiltradas.map((reserva) => (
            <ContextoReserva
              key={reserva.id}
              reserva={reserva}
              peca={pecas.find((peca) => peca.codigo === reserva.codigoPeca) ?? null}
              onUsar={onUsarTexto}
              onEnviar={onEnviarTexto}
            />
          ))}
          {contexto.reservasFiltradas.length === 0 && (
            <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Nenhum pedido encontrado para este contexto.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RotuloComIcone({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="inline-flex min-h-6 items-center gap-2 text-sm font-semibold leading-none">
      <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
        {icone}
      </span>
      <span className="leading-none">{children}</span>
    </div>
  );
}

function MensagemLinha({
  mensagem,
  carregando,
  onReenviar,
  onUsarSugestao
}: {
  mensagem: Mensagem;
  carregando: boolean;
  onReenviar?: (mensagem: Mensagem) => void;
  onUsarSugestao?: (mensagem: Mensagem) => void;
}) {
  const status = traduzirStatusMensagem(mensagem);
  const permiteReenvio = mensagem.origem === "whatsapp" && mensagem.remetente !== "cliente" && mensagem.status === "FAILED";
  const erroTecnicoEvolution = permiteReenvio && ehErroTecnicoEvolution(mensagem.erro);
  const permiteUsarSugestao = mensagem.origem === "ia_sugestao" && mensagem.status === "QUEUED";
  const enviadaPelaLoja = mensagem.remetente !== "cliente";
  const mensagemFalhou = enviadaPelaLoja && mensagem.status === "FAILED";
  const classeBalao = enviadaPelaLoja
    ? mensagemFalhou
      ? "max-w-[85%] rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-foreground shadow-xs"
      : "max-w-[85%] rounded-lg bg-primary p-3 text-primary-foreground"
    : "max-w-[85%] rounded-lg border bg-background p-3";

  return (
    <div className={enviadaPelaLoja ? "flex justify-end" : "flex justify-start"}>
      <div className={classeBalao}>
        {mensagem.remetente !== "cliente" && (
          <span className={mensagemFalhou ? "mb-1 block text-xs font-semibold text-destructive" : "mb-1 block text-xs font-semibold opacity-80"}>
            {traduzirRemetenteMensagem(mensagem)}
          </span>
        )}
        <p className="whitespace-pre-wrap text-sm leading-6">{mensagem.conteudo}</p>
        <span className={mensagemFalhou ? "mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground" : "mt-2 flex flex-wrap items-center gap-2 text-xs opacity-80"}>
          {formatarHora(mensagem.enviadaEm)}
          {status && (
            <Badge
              className={enviadaPelaLoja && !mensagemFalhou ? "chat-message-status-on-primary border-white/20 bg-white/20 text-white ring-1 ring-white/20" : undefined}
              variant={obterVarianteStatusMensagem(mensagem.status)}
            >
              {status}
            </Badge>
          )}
        </span>
        {mensagem.erro && (
          <small className="mt-2 block rounded-md border border-destructive/25 bg-destructive/10 p-2 text-xs font-medium leading-5 text-destructive">
            {mensagem.erro}
          </small>
        )}
        {erroTecnicoEvolution ? (
          <div className="mt-2">
            <Button asChild variant="outline" size="sm">
              <a href="/app/whatsapp" title="Ver conexão WhatsApp">
                <AlertTriangle data-icon="inline-start" className="size-3.5" aria-hidden="true" />
                Ver conexão
              </a>
            </Button>
          </div>
        ) : permiteReenvio && onReenviar ? (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={carregando}
              onClick={() => onReenviar(mensagem)}
              title="Reenviar pelo WhatsApp"
            >
              <RefreshCcw data-icon="inline-start" className="size-3.5" aria-hidden="true" />
              Reenviar
            </Button>
          </div>
        ) : permiteUsarSugestao && onUsarSugestao ? (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={carregando}
              onClick={() => onUsarSugestao(mensagem)}
              title="Usar rascunho como resposta"
            >
              <CheckCircle2 data-icon="inline-start" className="size-3.5" aria-hidden="true" />
              Usar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CampoBusca({
  "aria-label": ariaLabel,
  placeholder,
  value,
  onChange
}: {
  "aria-label"?: string;
  placeholder: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div className="market-search-field relative">
      <span className="pointer-events-none absolute left-3 top-1/2 grid size-4 -translate-y-1/2 place-items-center text-muted-foreground">
        <Search className="size-4 shrink-0" aria-hidden="true" />
      </span>
      <Input
        aria-label={ariaLabel ?? placeholder}
        className="market-input h-11"
        style={{ paddingLeft: "2.25rem" }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ContextoPeca({
  peca,
  destaque,
  onUsar,
  onEnviar
}: {
  peca: Peca;
  destaque?: string;
  onUsar: (texto: string) => void;
  onEnviar: (texto: string) => void;
}) {
  const texto = montarMensagemPeca(peca);

  return (
    <CrmListItem
      media={<Package className="size-4" aria-hidden="true" />}
      title={`#${peca.codigo} · ${peca.nome}`}
      description={peca.descricao || "Produto do catálogo"}
      tone={peca.estado === "DISPONIVEL" ? "sucesso" : "neutro"}
      badges={(
        <>
          <Badge variant={peca.estado === "DISPONIVEL" ? "success" : "secondary"}>{peca.estado.toLowerCase()}</Badge>
          {destaque && <Badge className="w-fit" variant="outline">{destaque}</Badge>}
        </>
      )}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <CrmMetricMini label="preço" value={formatarKwanza(peca.precoEmKwanza)} tone="sucesso" />
        <CrmMetricMini label="stock" value={peca.quantidade} tone={peca.quantidade > 2 ? "principal" : "atencao"} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onUsar(texto)}>
          <StickyNote data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          Usar
        </Button>
        <Button type="button" size="sm" onClick={() => onEnviar(texto)}>
          <Send data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          Enviar
        </Button>
      </div>
    </CrmListItem>
  );
}

function ContextoReserva({
  reserva,
  peca,
  onUsar,
  onEnviar
}: {
  reserva: Reserva;
  peca: Peca | null;
  onUsar: (texto: string) => void;
  onEnviar: (texto: string) => void;
}) {
  const texto = montarMensagemReserva(reserva, peca);

  return (
    <CrmListItem
      media={<ClipboardList className="size-4" aria-hidden="true" />}
      title={`Pedido #${reserva.codigoPeca}`}
      description={`${peca ? peca.nome : "Produto não encontrado"} · ${formatarTempoRestante(reserva.expiraEm)}`}
      tone={reserva.estado === "PAID" ? "sucesso" : reserva.estado === "WAITING_PAYMENT" ? "atencao" : "principal"}
      badges={(
        <>
          <Badge variant={obterVarianteReserva(reserva.estado)}>{traduzirEstadoReserva(reserva.estado)}</Badge>
          <Badge variant="outline">Pagamento: {traduzirEstadoPagamentoCurto(reserva.estadoPagamento)}</Badge>
        </>
      )}
    >
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onUsar(texto)}>
          <StickyNote data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          Usar
        </Button>
        <Button type="button" size="sm" onClick={() => onEnviar(texto)}>
          <Send data-icon="inline-start" className="size-3.5" aria-hidden="true" />
          Enviar
        </Button>
      </div>
    </CrmListItem>
  );
}

function montarMensagemPeca(peca: Peca) {
  return [
    `A peça #${peca.codigo} é ${peca.nome}.`,
    `Preço: ${formatarKwanza(peca.precoEmKwanza)}.`,
    `Stock atual: ${peca.quantidade} unidade(s).`,
    peca.estado === "DISPONIVEL" ? "Está disponível para reserva." : "Neste momento não está disponível para nova reserva."
  ].join(" ");
}

function montarMensagemReserva(reserva: Reserva, peca: Peca | null) {
  const partes = [
    `O teu pedido da peça #${reserva.codigoPeca}${peca ? ` (${peca.nome})` : ""} está ${traduzirEstadoReserva(reserva.estado).toLowerCase()}.`,
    `Pagamento: ${traduzirEstadoPagamentoCurto(reserva.estadoPagamento).toLowerCase()}.`
  ];

  if (peca) {
    partes.push(`Valor: ${formatarKwanza(peca.precoEmKwanza)}.`);
  }

  if (reserva.expiraEm) {
    partes.push(`Tempo restante: ${formatarTempoRestante(reserva.expiraEm)}.`);
  }

  return partes.join(" ");
}

function normalizarConversaAtendimento(conversa: ConversaParcial): Conversa {
  const telefone = conversa.telefone ?? conversa.telefoneCliente ?? "";
  const nomeCliente = conversa.nomeCliente?.trim() || conversa.telefone || "Cliente";
  const agora = new Date().toISOString();

  return {
    id: conversa.id || telefone || `conversa-${agora}`,
    conversaCrmId: conversa.conversaCrmId ?? null,
    telefone,
    nomeCliente,
    userIdCliente: conversa.userIdCliente ?? null,
    avatarUrlCliente: conversa.avatarUrlCliente ?? null,
    ultimaMensagem: conversa.ultimaMensagem ?? conversa.mensagens?.[0]?.conteudo ?? conversa.mensagens?.[0]?.texto ?? "",
    ultimaAtualizacao: conversa.ultimaAtualizacao ?? conversa.mensagens?.[0]?.enviadaEm ?? conversa.mensagens?.[0]?.criadoEm ?? agora,
    mensagensNaoLidas: conversa.mensagensNaoLidas ?? 0,
    estado: conversa.estado ?? "ativo",
    estadoCrm: conversa.estadoCrm ?? "NOVA",
    prioridade: conversa.prioridade ?? "NORMAL",
    responsavelId: conversa.responsavelId ?? null,
    tags: Array.isArray(conversa.tags) ? conversa.tags.filter((tag): tag is string => typeof tag === "string") : [],
    politicaAutomacao: conversa.politicaAutomacao ?? "AUTOMATICO",
    pecaRelacionada: conversa.pecaRelacionada ?? null,
    reservaAtual: conversa.reservaAtual ?? null,
    mensagens: Array.isArray(conversa.mensagens)
      ? conversa.mensagens.map((mensagem, indice) => normalizarMensagemAtendimento(mensagem, indice, agora))
      : []
  };
}

function normalizarMensagemAtendimento(mensagem: MensagemParcial, indice: number, agora: string): Mensagem {
  const remetentePorDirecao: Record<string, Mensagem["remetente"]> = {
    ENVIADA: "agente",
    RECEBIDA: "cliente",
    SISTEMA: "sistema"
  };

  return {
    id: mensagem.id ?? `mensagem-${indice}`,
    remetente: mensagem.remetente ?? remetentePorDirecao[mensagem.direcao ?? ""] ?? "sistema",
    conteudo: mensagem.conteudo ?? mensagem.texto ?? "",
    enviadaEm: mensagem.enviadaEm ?? mensagem.criadoEm ?? agora,
    origem: mensagem.origem,
    reservaId: mensagem.reservaId ?? null,
    tipo: mensagem.tipo,
    status: mensagem.status ?? mensagem.estadoEnvio,
    provider: mensagem.provider ?? null,
    providerMessageId: mensagem.providerMessageId ?? null,
    erro: mensagem.erro ?? null
  };
}

function normalizarTelefoneLocal(telefone?: string | null) {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (digitos.length === 9 && digitos.startsWith("9")) return `244${digitos}`;
  return digitos;
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
}

function traduzirEstadoConversa(estado: Conversa["estado"]) {
  const traducoes: Record<Conversa["estado"], string> = {
    ativo: "Ativo",
    automacao: "Automação",
    encerrado: "Encerrado",
    fila: "Fila",
    historico: "Histórico"
  };
  return traducoes[estado];
}

function traduzirEstadoCrm(estado: Conversa["estadoCrm"]) {
  const traducoes: Record<Conversa["estadoCrm"], string> = {
    NOVA: "Nova",
    ABERTA: "Aberta",
    AGUARDANDO_CLIENTE: "Aguardando cliente",
    AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
    AGUARDANDO_HUMANO: "Aguardando humano",
    RESOLVIDA: "Resolvida",
    ENCERRADA: "Encerrada"
  };
  return traducoes[estado];
}

function traduzirPrioridade(prioridade: Conversa["prioridade"]) {
  const traducoes: Record<Conversa["prioridade"], string> = {
    BAIXA: "Baixa",
    NORMAL: "Normal",
    ALTA: "Alta",
    URGENTE: "Urgente"
  };
  return traducoes[prioridade];
}

function traduzirPoliticaAutomacao(politica: Conversa["politicaAutomacao"]) {
  const traducoes: Record<Conversa["politicaAutomacao"], string> = {
    AUTOMATICO: "Automático",
    SUGERIR_RESPOSTA: "Preparar rascunho",
    EXIGIR_HUMANO: "Operador obrigatório",
    BLOQUEAR_IA: "Bloquear automação"
  };
  return traducoes[politica];
}

function traduzirRemetenteMensagem(mensagem: Mensagem) {
  if (mensagem.origem === "nota_interna") return "Nota interna";
  if (mensagem.origem === "ia_sugestao") return "Rascunho preparado";
  return mensagem.remetente === "sistema" ? "Evento do sistema" : "Agente";
}

function traduzirStatusMensagem(mensagem: Mensagem) {
  if ((mensagem.origem !== "whatsapp" && mensagem.origem !== "ia_sugestao") || mensagem.remetente === "cliente") return null;
  const traducoes: Record<NonNullable<Mensagem["status"]>, string> = {
    RECEIVED: "recebida",
    QUEUED: "pendente",
    SENT: "enviada",
    DELIVERED: "entregue",
    READ: "lida",
    FAILED: "falhou"
  };
  return mensagem.status ? traducoes[mensagem.status] : null;
}

function obterVarianteEstadoConversa(estado: Conversa["estado"]): "success" | "warning" | "info" | "secondary" {
  if (estado === "ativo") return "success";
  if (estado === "fila") return "warning";
  if (estado === "automacao") return "info";
  return "secondary";
}

function obterVarianteEstadoCrm(estado: Conversa["estadoCrm"]): "success" | "warning" | "info" | "secondary" {
  if (estado === "RESOLVIDA" || estado === "ENCERRADA") return "success";
  if (estado === "AGUARDANDO_CLIENTE" || estado === "AGUARDANDO_PAGAMENTO" || estado === "AGUARDANDO_HUMANO") return "warning";
  if (estado === "NOVA" || estado === "ABERTA") return "info";
  return "secondary";
}

function obterVariantePrioridade(prioridade: Conversa["prioridade"]): "warning" | "destructive" | "secondary" {
  if (prioridade === "URGENTE") return "destructive";
  if (prioridade === "ALTA") return "warning";
  return "secondary";
}

function obterVarianteStatusMensagem(status?: Mensagem["status"]): "success" | "warning" | "destructive" | "secondary" | "info" {
  if (status === "FAILED") return "destructive";
  if (status === "DELIVERED" || status === "READ") return "success";
  if (status === "QUEUED") return "warning";
  if (status === "SENT") return "info";
  return "secondary";
}

function obterVarianteReserva(estado: Reserva["estado"]): "success" | "warning" | "info" | "destructive" | "secondary" {
  if (estado === "PAID") return "success";
  if (estado === "RESERVED" || estado === "WAITING_PAYMENT" || estado === "PENDING") return "warning";
  if (estado === "WAITLISTED") return "info";
  if (estado === "CANCELLED" || estado === "EXPIRED") return "destructive";
  return "secondary";
}

function ehErroTecnicoEvolution(erro?: string | null) {
  if (!erro) return false;
  const texto = erro.toLowerCase();
  return [
    "evolution marcou",
    "sessão criptográfica",
    "connection closed",
    "bad mac",
    "no session",
    "instância"
  ].some((indicador) => texto.includes(indicador));
}
