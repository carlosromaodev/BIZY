import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bell,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Link2,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings2,
  StickyNote,
  UserRound,
  X,
  Zap
} from "lucide-react";
import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { criarFonteEventosAutenticada, requisitarApi } from "../api";
import { EstadoVazio } from "../componentes/Shell";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion } from "../componentes/CrmInterno21st";
import { AvatarBizy, obterCorAvatar, obterIniciais, StatusBadge, type CorSemantica } from "../componentes/BizyDesignSystem";
import { BarraAcoesInteligente, type TipoAcaoInteligente } from "../componentes/atendimento/BarraAcoesInteligente";
import { RespostasRapidasPainel } from "../componentes/atendimento/RespostasRapidasPainel";
import { CriarLembretePainel } from "../componentes/atendimento/CriarLembretePainel";
import { ResumoClienteCartao } from "../componentes/atendimento/ResumoClienteCartao";
import { AcoesRapidasMobile } from "../componentes/atendimento/AcoesRapidasMobile";
import { useTeclasAtalho } from "../componentes/atendimento/useTeclasAtalho";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type {
  Cliente360,
  Conversa,
  Lembrete,
  Mensagem,
  Peca,
  ProximaAcaoAtendimento,
  Reserva,
  RespostaClientes360,
  RespostaConversas,
  RespostaLembretes,
  RespostaProximasAcoesAtendimento,
  RespostaRapida,
  RespostaRespostasRapidas
} from "../tipos";
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

type FiltroRapido = "todas" | "abertas" | "aguardando" | "resolvidas";
type FiltroCanal = "todos" | "whatsapp" | "instagram" | "tiktok" | "sms" | "outro";

const FILTROS_RAPIDOS: Array<{ valor: FiltroRapido; rotulo: string }> = [
  { valor: "todas",     rotulo: "Todas" },
  { valor: "abertas",   rotulo: "Abertas" },
  { valor: "aguardando", rotulo: "Aguardando" },
  { valor: "resolvidas", rotulo: "Resolvidas" },
];

const NOME_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  tiktok: "TikTok",
  tiktok_live: "TikTok Live",
  sms: "SMS",
  loja_digital: "Loja digital",
  manual: "Manual",
};

export function PaginaConversas() {
  const [searchParams] = useSearchParams();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("todos");
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>("todos");
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("todas");
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [buscaContexto, setBuscaContexto] = useState("");
  const [contextoAberto, setContextoAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [textoResposta, setTextoResposta] = useState("");
  const [notaInterna, setNotaInterna] = useState("");
  const mensagensRef = useRef<HTMLDivElement | null>(null);
  const mensagensRefDesktop = useRef<HTMLDivElement | null>(null);
  const [formCrm, setFormCrm] = useState({
    estadoCrm: "NOVA" as Conversa["estadoCrm"],
    prioridade: "NORMAL" as Conversa["prioridade"],
    responsavelId: "",
    politicaAutomacao: "AUTOMATICO" as Conversa["politicaAutomacao"]
  });
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [respostasRapidas, setRespostasRapidas] = useState<RespostaRapida[]>([]);
  const [clientes, setClientes] = useState<Cliente360[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [proximasAcoes, setProximasAcoes] = useState<ProximaAcaoAtendimento[]>([]);
  const [respostasRapidasAbertas, setRespostasRapidasAbertas] = useState(false);
  const [criarLembreteAberto, setCriarLembreteAberto] = useState(false);
  const [drawerMobileAberto, setDrawerMobileAberto] = useState(false);
  const [gestaoMobileAberta, setGestaoMobileAberta] = useState(false);
  const [notaMobileAberta, setNotaMobileAberta] = useState(false);
  const [abaThread, setAbaThread] = useState<"conversa" | "notas" | "atividade">("conversa");
  const enviarRef = useRef<(() => void) | null>(null);
  const contextoUrlAplicadoRef = useRef<string | null>(null);
  const clienteIdUrl = searchParams.get("clienteId");
  const telefoneUrl = searchParams.get("telefone");
  const conversaIdUrl = searchParams.get("conversaId");

  const carregar = useCallback(async () => {
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
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar conversas.");
    }
  }, []);

  const carregarDadosApoio = useCallback(async () => {
    const [rr, cl, lb] = await Promise.allSettled([
      requisitarApi<RespostaRespostasRapidas>("/respostas-rapidas?limite=100"),
      requisitarApi<RespostaClientes360>("/clientes?limite=500"),
      requisitarApi<RespostaLembretes>("/lembretes?limite=100")
    ]);
    if (rr.status === "fulfilled") setRespostasRapidas(rr.value.respostas ?? []);
    if (cl.status === "fulfilled") setClientes(cl.value.clientes ?? []);
    if (lb.status === "fulfilled") setLembretes(lb.value.lembretes ?? []);
  }, []);

  useEffect(() => {
    void Promise.all([carregar(), carregarDadosApoio()]).finally(() => setCarregandoInicial(false));
    const eventos = criarFonteEventosAutenticada();
    let debounceAtualizacao: number | null = null;
    let intervaloFallback: number | null = null;
    const pararFallback = () => {
      if (intervaloFallback === null) return;
      window.clearInterval(intervaloFallback);
      intervaloFallback = null;
    };
    const atualizar = () => {
      if (debounceAtualizacao !== null) window.clearTimeout(debounceAtualizacao);
      debounceAtualizacao = window.setTimeout(() => {
        void carregar();
      }, 140);
    };
    const iniciarFallback = () => {
      if (intervaloFallback !== null) return;
      setMensagem("Ligação em tempo real instável. A atualizar atendimento automaticamente.");
      intervaloFallback = window.setInterval(() => {
        void carregar();
      }, 5_000);
    };
    eventos.onopen = () => {
      pararFallback();
    };
    eventos.onerror = () => {
      iniciarFallback();
      atualizar();
    };
    [
      "COMMENT_RECEIVED",
      "COMMENT_PARSED",
      "RESERVATION_CREATED",
      "PAYMENT_CONFIRMED",
      "RESERVATION_EXPIRED",
      "WHATSAPP_MESSAGE_RECEIVED",
      "WHATSAPP_MESSAGE_SENT",
      "WHATSAPP_MESSAGE_FAILED",
      "WHATSAPP_MESSAGE_STATUS",
      "INSTAGRAM_DM_RECEIVED",
      "INSTAGRAM_DM_SENT"
    ].forEach((evento) => eventos.addEventListener(evento, atualizar));
    return () => {
      eventos.close();
      if (debounceAtualizacao !== null) window.clearTimeout(debounceAtualizacao);
      pararFallback();
    };
  }, [carregar, carregarDadosApoio]);

  useEffect(() => {
    if (!clienteIdUrl && !telefoneUrl && !conversaIdUrl) return;
    if (!conversas.length) return;

    const contextoUrlKey = `${clienteIdUrl ?? ""}|${telefoneUrl ?? ""}|${conversaIdUrl ?? ""}`;
    if (contextoUrlAplicadoRef.current === contextoUrlKey) return;

    const telefoneCliente =
      telefoneUrl ??
      clientes.find((cliente) => cliente.id === clienteIdUrl)?.telefone ??
      null;
    const telefoneNormalizado = normalizarTelefoneLocal(telefoneCliente);
    const conversaEncontrada =
      conversas.find((conversa) => conversaIdUrl && (conversa.id === conversaIdUrl || conversa.conversaCrmId === conversaIdUrl)) ??
      conversas.find((conversa) => telefoneNormalizado && normalizarTelefoneLocal(conversa.telefone) === telefoneNormalizado);

    if (conversaEncontrada) {
      abrirConversa(conversaEncontrada.id);
      setBusca("");
      contextoUrlAplicadoRef.current = contextoUrlKey;
      return;
    }

    if (telefoneCliente) {
      setBusca(telefoneCliente);
      contextoUrlAplicadoRef.current = contextoUrlKey;
    }
  }, [clienteIdUrl, clientes, conversaIdUrl, conversas, telefoneUrl]);

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

    const porResponsavel = filtroResponsavel === "todos"
      ? porBusca
      : filtroResponsavel === "sem-responsavel"
        ? porBusca.filter((conversa) => !conversa.responsavelId)
        : porBusca.filter((conversa) => conversa.responsavelId === filtroResponsavel);

    if (filtroCanal === "todos") return porResponsavel;
    if (filtroCanal === "outro") return porResponsavel.filter((c) => c.origemPrincipal && !["whatsapp", "instagram", "tiktok", "sms"].includes(c.origemPrincipal));
    return porResponsavel.filter((c) => c.origemPrincipal === filtroCanal);
  }, [busca, conversas, filtroResponsavel, filtroCanal]);

  const conversasDesktop = useMemo(() => {
    switch (filtroRapido) {
      case "abertas":   return conversasFiltradas.filter((c) => ["NOVA", "ABERTA"].includes(c.estadoCrm));
      case "aguardando": return conversasFiltradas.filter((c) => c.estadoCrm.startsWith("AGUARDANDO_"));
      case "resolvidas": return conversasFiltradas.filter((c) => ["RESOLVIDA", "ENCERRADA"].includes(c.estadoCrm));
      default:           return conversasFiltradas;
    }
  }, [conversasFiltradas, filtroRapido]);

  const contagensFiltros = useMemo(() => ({
    todas:     conversasFiltradas.length,
    abertas:   conversasFiltradas.filter((c) => ["NOVA", "ABERTA"].includes(c.estadoCrm)).length,
    aguardando: conversasFiltradas.filter((c) => c.estadoCrm.startsWith("AGUARDANDO_")).length,
    resolvidas: conversasFiltradas.filter((c) => ["RESOLVIDA", "ENCERRADA"].includes(c.estadoCrm)).length,
  }), [conversasFiltradas]);

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
    setGestaoMobileAberta(false);
    setNotaMobileAberta(false);
    setAbaThread("conversa");
  }, [conversaAtual?.id]);

  useEffect(() => {
    let cancelado = false;
    setProximasAcoes([]);

    if (!conversaAtual?.conversaCrmId) return () => {
      cancelado = true;
    };

    requisitarApi<RespostaProximasAcoesAtendimento>(`/atendimento/conversas/${conversaAtual.conversaCrmId}/proximas-acoes`)
      .then((resposta) => {
        if (!cancelado) setProximasAcoes(resposta.acoes ?? []);
      })
      .catch(() => {
        if (!cancelado) setProximasAcoes([]);
      });

    return () => {
      cancelado = true;
    };
  }, [
    conversaAtual?.conversaCrmId,
    conversaAtual?.estadoCrm,
    conversaAtual?.mensagens.length,
    conversaAtual?.prioridade,
    conversaAtual?.reservaAtual?.id
  ]);

  const chatImersivo = Boolean(chatAberto && conversaAtual);

  // Scroll to bottom — both mobile and desktop refs
  useEffect(() => {
    if (!conversaAtual) return;

    const frame = window.requestAnimationFrame(() => {
      if (mensagensRef.current) {
        mensagensRef.current.scrollTo({ top: mensagensRef.current.scrollHeight, behavior: "auto" });
      }
      if (mensagensRefDesktop.current) {
        mensagensRefDesktop.current.scrollTo({ top: mensagensRefDesktop.current.scrollHeight, behavior: "auto" });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [conversaAtual?.id, conversaAtual?.mensagens.length, chatAberto]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!chatImersivo) {
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
  }, [chatImersivo]);

  function abrirConversa(id: string) {
    setConversaSelecionada(id);
    setChatAberto(true);
  }

  function voltarParaLista() {
    setChatAberto(false);
  }

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault();
    const texto = textoResposta.trim();
    if (!conversaAtual || !texto) return;

    await enviarTextoAtendimento(texto);
    setTextoResposta("");
  }

  async function enviarMensagemRapida(texto: string) {
    if (!conversaAtual || !texto.trim()) return;

    await enviarTextoAtendimento(texto);
  }

  async function enviarTextoAtendimento(
    texto: string,
    contextoAcao?: { entidadeTipo?: string; entidadeId?: string }
  ) {
    if (!conversaAtual || !texto.trim()) return;

    await executar(
      () => conversaAtual.conversaCrmId
        ? requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}/mensagens`, {
            method: "POST",
            body: {
              tipo: "TEXTO",
              mensagem: texto.trim(),
              entidadeTipo: contextoAcao?.entidadeTipo ?? null,
              entidadeId: contextoAcao?.entidadeId ?? null,
              contexto: {
                origemInterface: "atendimento",
                clienteTelefone: conversaAtual.telefone
              }
            }
          })
        : requisitarApi("/whatsapp/mensagens", {
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

    await enviarTextoAtendimento(mensagemFalhada.conteudo);
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

  async function criarPedidoPorPeca(peca: Peca) {
    if (!conversaAtual?.conversaCrmId) return;

    await executar(
      () =>
        requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}/pedidos`, {
          method: "POST",
          body: {
            itens: [{ codigoPeca: peca.codigo, quantidade: 1 }],
            origem: "conversa",
            canal: "whatsapp",
            observacao: `Pedido criado pelo atendimento a partir do produto #${peca.codigo}.`
          }
        }),
      "Pedido criado e ligado à conversa."
    );
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

  const clienteAtual = useMemo(() => {
    if (!conversaAtual) return null;
    const tel = normalizarTelefoneLocal(conversaAtual.telefone);
    return clientes.find((c) => normalizarTelefoneLocal(c.telefone) === tel) ?? null;
  }, [conversaAtual, clientes]);

  const pecaRelacionadaObj = useMemo(() => {
    const codigo = conversaAtual?.reservaAtual?.codigoPeca ?? conversaAtual?.pecaRelacionada;
    if (!codigo) return null;
    return pecas.find((p) => p.codigo.toLowerCase() === codigo.toLowerCase()) ?? null;
  }, [conversaAtual, pecas]);

  // Ctrl+Enter send ref
  enviarRef.current = useCallback(() => {
    if (textoResposta.trim() && conversaAtual) {
      void enviarMensagemRapida(textoResposta.trim());
      setTextoResposta("");
    }
  }, [textoResposta, conversaAtual]);

  const atalhos = useMemo(() => {
    const mapa = new Map<string, () => void>();
    mapa.set("escape", () => {
      if (respostasRapidasAbertas) { setRespostasRapidasAbertas(false); return; }
      if (contextoAberto) { setContextoAberto(false); return; }
      if (chatAberto) voltarParaLista();
    });
    return mapa;
  }, [respostasRapidasAbertas, contextoAberto, chatAberto]);

  useTeclasAtalho(atalhos);

  function lidarComTeclaComposer(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      enviarRef.current?.();
    }
  }

  function lidarComAcaoInteligente(
    tipo: TipoAcaoInteligente,
    dados?: string,
    contextoAcao?: { entidadeTipo?: string; entidadeId?: string }
  ) {
    if (!conversaAtual) return;
    switch (tipo) {
      case "confirmar-pagamento":
        if (conversaAtual.reservaAtual) {
          void executar(
            () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/confirmar-pagamento`, { method: "POST", body: {} }),
            "Pagamento confirmado."
          );
        }
        break;
      case "assumir-atendimento":
        if (conversaAtual.conversaCrmId) {
          void executar(
            () => requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}`, {
              method: "PATCH",
              body: { estado: "ABERTA", prioridade: formCrm.prioridade, responsavelId: formCrm.responsavelId.trim() || null }
            }),
            "Atendimento assumido."
          );
        }
        break;
      case "produto-esgotado":
      case "enviar-info-produto":
      case "pedir-comprovativo":
      case "enviar-dados-pagamento":
      case "pedir-endereco":
      case "confirmar-entrega":
        if (dados) setTextoResposta(dados);
        break;
      case "criar-pedido":
        if (pecaRelacionadaObj && pecaRelacionadaObj.estado === "DISPONIVEL") {
          void criarPedidoPorPeca(pecaRelacionadaObj);
        } else {
          setContextoAberto(true);
          setBuscaContexto(conversaAtual.pecaRelacionada ?? conversaAtual.reservaAtual?.codigoPeca ?? "");
        }
        break;
      case "agendar-followup":
        setCriarLembreteAberto(true);
        break;
      case "reserva-expira":
        break;
    }
  }

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  // ─── Painel de propriedades (reutilizado no mobile e desktop) ────────────
  const painelPropriedades = conversaAtual ? (
    <div className="atendimento-props-corpo">
      {/* ── Cliente ── */}
      {clienteAtual && (
        <ResumoClienteCartao cliente={clienteAtual} />
      )}

      {/* ── Lembrete rápido ── */}
      <div className="atendimento-props-section">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => setCriarLembreteAberto(true)}
        >
          <Bell className="size-3.5" />
          Agendar lembrete
        </Button>
      </div>

      {/* ── Estado do atendimento ── */}
      <SecaoPropriedade titulo="Estado do atendimento" icone={<Settings2 size={13} />} inicialmenteAberta>
        <form className="grid gap-3" onSubmit={(e) => void guardarGestaoCrm(e)}>
          <label className="grid gap-1">
            <span className="atendimento-props-label">Estado</span>
            <Select
              value={formCrm.estadoCrm}
              onValueChange={(v) => setFormCrm((a) => ({ ...a, estadoCrm: v as Conversa["estadoCrm"] }))}
              disabled={carregando || !conversaAtual.conversaCrmId}
            >
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {estadosCrm.map((e) => (
                  <SelectItem key={e} value={e}>{traduzirEstadoCrm(e)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1">
              <span className="atendimento-props-label">Prioridade</span>
              <Select
                value={formCrm.prioridade}
                onValueChange={(v) => setFormCrm((a) => ({ ...a, prioridade: v as Conversa["prioridade"] }))}
                disabled={carregando || !conversaAtual.conversaCrmId}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {prioridadesCrm.map((p) => (
                    <SelectItem key={p} value={p}>{traduzirPrioridade(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1">
              <span className="atendimento-props-label">Automação</span>
              <Select
                value={formCrm.politicaAutomacao}
                onValueChange={(v) => setFormCrm((a) => ({ ...a, politicaAutomacao: v as Conversa["politicaAutomacao"] }))}
                disabled={carregando || !conversaAtual.conversaCrmId}
              >
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {politicasAutomacao.map((p) => (
                    <SelectItem key={p} value={p}>{traduzirPoliticaAutomacao(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="atendimento-props-label">Responsável</span>
            <Input
              className="h-8 text-sm"
              value={formCrm.responsavelId}
              onChange={(e) => setFormCrm((a) => ({ ...a, responsavelId: e.target.value }))}
              placeholder="Nome ou ID"
              disabled={carregando || !conversaAtual.conversaCrmId}
            />
          </label>
          <Button variant="outline" size="sm" disabled={carregando || !conversaAtual.conversaCrmId} className="w-full">
            <Save className="size-3.5 mr-1.5" />
            Guardar alterações
          </Button>
        </form>
      </SecaoPropriedade>

      {/* ── Reserva vinculada ── */}
      {conversaAtual.reservaAtual && (
        <SecaoPropriedade titulo="Reserva vinculada" icone={<ClipboardList size={13} />} inicialmenteAberta>
          <div className="grid gap-2.5 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="size-3.5 shrink-0" />
              <span>{conversaAtual.reservaAtual.estado} · pgto {conversaAtual.reservaAtual.estadoPagamento}</span>
            </div>
            <Button
              variant="success"
              size="sm"
              disabled={carregando || conversaAtual.reservaAtual.estado === "PAID"}
              onClick={() =>
                void executar(
                  () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/confirmar-pagamento`, { method: "POST", body: {} }),
                  "Pagamento confirmado."
                )
              }
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              Confirmar pagamento
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={carregando || ["CANCELLED", "EXPIRED", "PAID"].includes(conversaAtual.reservaAtual.estado)}
              onClick={() =>
                void executar(
                  () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/cancelar`, { method: "POST", body: { motivo: "Cancelada pelo vendedor." } }),
                  "Reserva cancelada."
                )
              }
            >
              <Ban className="size-3.5 mr-1.5" />
              Cancelar reserva
            </Button>
          </div>
        </SecaoPropriedade>
      )}

      {/* ── Notas internas ── */}
      <SecaoPropriedade titulo="Nota interna" icone={<StickyNote size={13} />}>
        <form className="grid gap-2" onSubmit={(e) => void guardarNotaInterna(e)}>
          <Textarea
            placeholder="Nota para a equipa..."
            value={notaInterna}
            onChange={(e) => setNotaInterna(e.target.value)}
            disabled={carregando || !conversaAtual.conversaCrmId}
            rows={2}
            className="text-sm"
          />
          <Button variant="outline" size="sm" disabled={carregando || !notaInterna.trim() || !conversaAtual.conversaCrmId} className="w-full">
            <StickyNote className="size-3.5 mr-1.5" />
            Adicionar nota
          </Button>
        </form>
      </SecaoPropriedade>

      {/* ── Tags ── */}
      {conversaAtual.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {conversaAtual.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag.replace("politica:", "auto:")}</Badge>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <CrmPageMotion className={chatImersivo ? "chat-imersivo-ativo" : undefined}>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — slide animation (< lg)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <AnimatePresence mode="wait">
          {chatImersivo && conversaAtual ? (
            <motion.div
              key="chat-view"
              className="chat-social-view grid min-h-0"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="market-panel chat-social-panel flex flex-col overflow-hidden">
                {/* Mobile chat header */}
                <div className="chat-social-header flex min-h-15 items-center gap-2.5 border-b bg-card px-3 py-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    onClick={voltarParaLista}
                    className="shrink-0 -ml-0.5 h-11 w-11"
                  >
                    <ArrowLeft className="size-5" />
                  </Button>
                  <Avatar className="h-9 w-9 shrink-0">
                    {conversaAtual.avatarUrlCliente && <AvatarImage src={conversaAtual.avatarUrlCliente} alt="" />}
                    <AvatarFallback className="text-sm">{conversaAtual.nomeCliente[0]?.toUpperCase() ?? "C"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[0.9375rem] leading-tight">{conversaAtual.nomeCliente}</strong>
                    <span className="block truncate text-xs text-muted-foreground">{conversaAtual.telefone}{conversaAtual.pecaRelacionada ? ` · ${conversaAtual.pecaRelacionada}` : ""}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant={obterVarianteEstadoCrm(conversaAtual.estadoCrm)} className="hidden sm:flex">{traduzirEstadoCrm(conversaAtual.estadoCrm)}</Badge>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon-lg" title="Gestão do atendimento">
                          <Settings2 className="size-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="overflow-y-auto sm:max-w-md">
                        <SheetHeader>
                          <SheetTitle>Gestão do atendimento</SheetTitle>
                          <SheetDescription>{conversaAtual.nomeCliente} · {traduzirEstadoCrm(conversaAtual.estadoCrm)}</SheetDescription>
                        </SheetHeader>
                        <div className="px-1 pt-4">
                          {painelPropriedades}
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button asChild variant="ghost" size="icon-lg">
                      <a title="Ligar" href={`tel:${conversaAtual.telefone}`}>
                        <Phone className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div ref={mensagensRef} className="market-chat-surface chat-commerce-messages flex-1 grid auto-rows-max content-start min-h-0 gap-2 overflow-y-auto bg-muted/20 px-3 py-4">
                  {conversaAtual.mensagens.length === 0 ? (
                    <div className="flex h-full min-h-32 items-center justify-center">
                      <span className="text-xs text-muted-foreground">Sem mensagens ainda</span>
                    </div>
                  ) : conversaAtual.mensagens.map((item) => (
                    <MensagemLinha
                      key={item.id}
                      mensagem={item}
                      carregando={carregando}
                      onReenviar={(m) => void reenviarMensagem(m)}
                      onUsarSugestao={(m) => setTextoResposta(m.conteudo)}
                    />
                  ))}
                </div>

                {/* Smart actions bar */}
                <BarraAcoesInteligente
                  conversaAtual={conversaAtual}
                  pecas={pecas}
                  reservas={reservas}
                  acoesServidor={proximasAcoes}
                  onAccao={lidarComAcaoInteligente}
                />

                {/* Composer */}
                <form className="chat-commerce-composer chat-social-composer grid gap-2 border-t bg-card p-3" onSubmit={(e) => void enviarMensagem(e)}>
                  {respostasRapidasAbertas && (
                    <RespostasRapidasPainel
                      respostas={respostasRapidas}
                      conversaAtual={conversaAtual}
                      pecaRelacionada={pecaRelacionadaObj}
                      aberto={respostasRapidasAbertas}
                      onFechar={() => setRespostasRapidasAbertas(false)}
                      onUsarTexto={(texto) => { setTextoResposta(texto); setRespostasRapidasAbertas(false); }}
                      onEnviarTexto={(texto) => { void enviarMensagemRapida(texto); setRespostasRapidasAbertas(false); }}
                    />
                  )}
                  {contextoAberto && (
                    <PainelContextoComercial
                      contexto={contextoComercial}
                      pecas={pecas}
                      buscaContexto={buscaContexto}
                      onBuscarContexto={setBuscaContexto}
                      onCriarPedido={criarPedidoPorPeca}
                      onUsarTexto={(texto) => setTextoResposta(texto)}
                      onEnviarTexto={(texto) => void enviarMensagemRapida(texto)}
                    />
                  )}
                  <div className="chat-commerce-row grid items-end gap-2">
                    <Button type="button" variant="outline" size="icon-lg" className="atendimento-fab-mobile" onClick={() => setDrawerMobileAberto(true)} disabled={carregando}>
                      <Plus className="size-4" />
                    </Button>
                    <Textarea
                      aria-label="Responder pelo WhatsApp"
                      className="chat-commerce-textarea min-h-11 max-h-32 resize-none"
                      placeholder="Responder..."
                      value={textoResposta}
                      onChange={(e) => setTextoResposta(e.target.value)}
                      onKeyDown={lidarComTeclaComposer}
                      disabled={carregando}
                      rows={1}
                    />
                    <Button type="button" variant={respostasRapidasAbertas ? "secondary" : "outline"} size="icon-lg" onClick={() => setRespostasRapidasAbertas((a) => !a)} disabled={carregando} title="Respostas rápidas">
                      <Zap className="size-4" />
                    </Button>
                    <Button type="button" variant={contextoAberto ? "secondary" : "outline"} size="icon-lg" onClick={() => setContextoAberto((a) => !a)} disabled={carregando} title="Consultar produtos">
                      <Package className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon-lg" onClick={() => void guardarSugestaoResposta()} disabled={carregando || !textoResposta.trim() || !conversaAtual.conversaCrmId} title="Guardar rascunho">
                      <StickyNote className="size-4" />
                    </Button>
                    <Button size="icon-lg" disabled={carregando || !textoResposta.trim()}>
                      <Send className="size-4" />
                    </Button>
                  </div>
                </form>
              </Card>
              {/* Drawer acoes rapidas mobile */}
              <AcoesRapidasMobile
                conversaAtual={conversaAtual}
                aberto={drawerMobileAberto}
                onFechar={() => setDrawerMobileAberto(false)}
                onAbrirRespostasRapidas={() => setRespostasRapidasAbertas(true)}
                onAbrirLembrete={() => setCriarLembreteAberto(true)}
                onAbrirContexto={() => setContextoAberto((a) => !a)}
                onAbrirGestao={() => setGestaoMobileAberta(true)}
                onAbrirNota={() => setNotaMobileAberta(true)}
                onConfirmarPagamento={() => {
                  if (conversaAtual.reservaAtual) {
                    void executar(
                      () => requisitarApi(`/reservas/${conversaAtual.reservaAtual?.id}/confirmar-pagamento`, { method: "POST", body: {} }),
                      "Pagamento confirmado."
                    );
                  }
                }}
              />

              <Sheet open={gestaoMobileAberta} onOpenChange={setGestaoMobileAberta}>
                <SheetContent side="bottom" className="max-h-[86dvh] overflow-y-auto rounded-t-2xl pb-8">
                  <SheetHeader className="text-left pb-3">
                    <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>Gestão do atendimento</SheetTitle>
                    <SheetDescription>{conversaAtual.nomeCliente} · {traduzirEstadoCrm(conversaAtual.estadoCrm)}</SheetDescription>
                  </SheetHeader>
                  <div className="px-1 pt-2">
                    {painelPropriedades}
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={notaMobileAberta} onOpenChange={setNotaMobileAberta}>
                <SheetContent side="bottom" className="rounded-t-2xl pb-8">
                  <SheetHeader className="text-left pb-3">
                    <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>Nota interna rápida</SheetTitle>
                    <SheetDescription>{conversaAtual.nomeCliente} · visível apenas para a equipa</SheetDescription>
                  </SheetHeader>
                  <form className="grid gap-3" onSubmit={(e) => void guardarNotaInterna(e)}>
                    <Textarea
                      aria-label="Nota interna rápida"
                      placeholder="Ex: Cliente pediu entrega depois das 18h"
                      value={notaInterna}
                      onChange={(e) => setNotaInterna(e.target.value)}
                      rows={4}
                    />
                    <Button type="submit" disabled={carregando || !notaInterna.trim() || !conversaAtual.conversaCrmId}>
                      <Save className="size-4" />
                      Guardar nota
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>

              {/* Criar lembrete dialog */}
              <CriarLembretePainel
                conversaAtual={conversaAtual}
                aberto={criarLembreteAberto}
                onFechar={() => setCriarLembreteAberto(false)}
                onCriado={() => void carregarDadosApoio()}
              />

              {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">{mensagem}</footer>}
            </motion.div>
          ) : (
            <motion.div
              key="list-view"
              className="chat-social-list-view grid gap-4"
              initial={{ opacity: 0, x: "-30%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-30%" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-rotulo text-xs font-semibold uppercase tracking-widest text-muted-foreground">Atendimento</p>
                  <h1 className="app-titulo font-heading text-2xl font-semibold">Conversas</h1>
                </div>
                <Button variant="outline" size="icon-lg" onClick={() => void carregar()}>
                  <RefreshCcw className="size-4" />
                </Button>
              </div>

              <div className="grid gap-2.5">
                <CampoBusca placeholder="Buscar cliente, telefone ou peça..." value={busca} onChange={setBusca} />
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
                    <SelectTrigger className="flex-1 max-w-xs">
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os responsáveis</SelectItem>
                      <SelectItem value="sem-responsavel">Sem responsável</SelectItem>
                      {responsaveis.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 shrink-0 text-muted-foreground" />
                  <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal(v as FiltroCanal)}>
                    <SelectTrigger className="flex-1 max-w-xs">
                      <SelectValue placeholder="Canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os canais</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="outro">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
                {conversasFiltradas.length ? (
                  conversasFiltradas.map((conversa, idx) => (
                    <button
                      type="button"
                      key={conversa.id}
                      className={`atendimento-item w-full text-left outline-none transition-colors active:bg-(--color-surface-warm) focus-visible:bg-(--color-surface-warm) ${idx > 0 ? "border-t border-border/40" : ""}`}
                      onClick={() => abrirConversa(conversa.id)}
                    >
                      <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            {conversa.avatarUrlCliente && <AvatarImage src={conversa.avatarUrlCliente} alt="" />}
                            <AvatarFallback className="text-sm font-semibold">{conversa.nomeCliente[0]?.toUpperCase() ?? "C"}</AvatarFallback>
                          </Avatar>
                          {conversa.mensagensNaoLidas > 0 && (
                            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-foreground">
                              {conversa.mensagensNaoLidas}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className={`truncate text-sm ${conversa.mensagensNaoLidas > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                              {conversa.nomeCliente}
                            </span>
                            <span className="shrink-0 text-[0.7rem] tabular-nums text-muted-foreground">{formatarHora(conversa.ultimaAtualizacao)}</span>
                          </div>
                          <p className={`atendimento-item-message mt-0.5 text-xs ${conversa.mensagensNaoLidas > 0 ? "font-medium text-foreground/80" : "text-muted-foreground"}`}>
                            {conversa.ultimaMensagem || "Sem mensagens"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {conversa.origemPrincipal && (
                              <Badge variant="outline" className="h-4 gap-0.5 px-1.5 text-[0.6rem]">
                                <IconeOrigem origem={conversa.origemPrincipal} />
                                {NOME_CANAL[conversa.origemPrincipal] ?? conversa.origemPrincipal}
                              </Badge>
                            )}
                            <Badge variant={obterVarianteEstadoCrm(conversa.estadoCrm)} className="h-4 px-1.5 text-[0.6rem]">{traduzirEstadoCrm(conversa.estadoCrm)}</Badge>
                            {["ALTA", "URGENTE"].includes(conversa.prioridade) && (
                              <Badge variant={obterVariantePrioridade(conversa.prioridade)} className="h-4 px-1.5 text-[0.6rem]">{traduzirPrioridade(conversa.prioridade)}</Badge>
                            )}
                            {conversa.pecaRelacionada && <Badge variant="outline" className="h-4 px-1.5 text-[0.6rem]">{conversa.pecaRelacionada}</Badge>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4">
                    <EstadoVazio icone={<MessageCircle />} titulo="Sem conversas" detalhe="Comentários com telefone e reservas aparecem aqui." />
                  </div>
                )}
              </div>
              {mensagem && <footer className="market-feedback rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" role="status" aria-live="polite" aria-atomic="true">{mensagem}</footer>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP — Inbox v2 (≥ lg)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:grid gap-5">
        <div className="crm-v3-pghead">
          <div>
            <h1>Atendimento</h1>
            <div className="crm-v3-sub">
              {contagensFiltros.abertas} conversa{contagensFiltros.abertas === 1 ? "" : "s"} aberta{contagensFiltros.abertas === 1 ? "" : "s"} · {conversasFiltradas.length} total
            </div>
          </div>
          <div className="crm-v3-pghead-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="crm-v3-bdg" data-tone="green">
              <span className="crm-v3-bdg-dot" />
              WhatsApp ligado
            </span>
            <Button variant="outline" size="sm" onClick={() => void carregar()} style={{ gap: 6 }}>
              <RefreshCcw className="size-3.5" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="bz-inbox">

        {/* ── Coluna 1: Lista de conversas ──────────────────────────── */}
        <div className="bz-conv-col">
          {/* Tabs */}
          <div className="bz-conv-tabs">
            {FILTROS_RAPIDOS.map((f) => (
              <button
                key={f.valor}
                type="button"
                className={`bz-conv-tab${filtroRapido === f.valor ? " active" : ""}`}
                onClick={() => setFiltroRapido(f.valor)}
              >
                {f.rotulo}
                {contagensFiltros[f.valor] > 0 && <span className="c">{contagensFiltros[f.valor]}</span>}
              </button>
            ))}
          </div>

          {/* Search + Channel filter */}
          <div className="bz-conv-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          {filtroCanal !== "todos" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px 8px", fontSize: 12, color: "var(--ink-3)" }}>
              <IconeOrigem origem={filtroCanal} />
              <span>{NOME_CANAL[filtroCanal] ?? filtroCanal}</span>
              <button type="button" onClick={() => setFiltroCanal("todos")} style={{ marginLeft: "auto", cursor: "pointer", opacity: 0.6 }}>
                <X size={12} />
              </button>
            </div>
          )}

          {/* Conversation list */}
          <div className="bz-conv-list">
            {conversasDesktop.length ? (
              conversasDesktop.map((conversa) => (
                <button
                  key={conversa.id}
                  type="button"
                  className={`bz-conv${conversaSelecionada === conversa.id ? " sel" : ""}`}
                  onClick={() => abrirConversa(conversa.id)}
                >
                  <div className="av">
                    <AvatarBizy
                      iniciais={obterIniciais(conversa.nomeCliente)}
                      cor={obterCorAvatar(conversa.nomeCliente)}
                      tamanho={38}
                      src={conversa.avatarUrlCliente}
                      alt={conversa.nomeCliente}
                    />
                    {conversa.mensagensNaoLidas > 0 && <span className="bn">{conversa.mensagensNaoLidas}</span>}
                  </div>
                  <div className="bd">
                    <div className="top">
                      <span className="nm">{conversa.nomeCliente}</span>
                      <span className="tm">{formatarHora(conversa.ultimaAtualizacao)}</span>
                    </div>
                    <div className="msg">{conversa.ultimaMensagem || "Sem mensagens"}</div>
                    <div className="meta">
                      {conversa.origemPrincipal && (
                        <span className="tagm" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <IconeOrigem origem={conversa.origemPrincipal} />
                          {NOME_CANAL[conversa.origemPrincipal] ?? conversa.origemPrincipal}
                        </span>
                      )}
                      <span className={`tagm ${corEstadoCrmTag(conversa.estadoCrm)}`}>{traduzirEstadoCrm(conversa.estadoCrm)}</span>
                      {["ALTA", "URGENTE"].includes(conversa.prioridade) && (
                        <span className="tagm b-rose">{traduzirPrioridade(conversa.prioridade)}</span>
                      )}
                      {conversa.pecaRelacionada && <span className="tagm prod">{conversa.pecaRelacionada}</span>}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                Nenhuma conversa neste filtro.
              </div>
            )}
          </div>
        </div>

        {/* ── Coluna 2: Thread + Propriedades ────────────────────────── */}
        {conversaAtual ? (
          <div className="bz-thread">
            {/* Thread header — KirriDesk style */}
            <div className="bz-thread-head">
              <AvatarBizy
                iniciais={obterIniciais(conversaAtual.nomeCliente)}
                cor={obterCorAvatar(conversaAtual.nomeCliente)}
                tamanho={38}
                src={conversaAtual.avatarUrlCliente}
                alt={conversaAtual.nomeCliente}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{conversaAtual.nomeCliente}</div>
                <div className="sub">
                  <StatusBadge cor={corEstadoCrmSemantica(conversaAtual.estadoCrm)}>{traduzirEstadoCrm(conversaAtual.estadoCrm)}</StatusBadge>
                  {conversaAtual.origemPrincipal && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><IconeOrigem origem={conversaAtual.origemPrincipal} /> {NOME_CANAL[conversaAtual.origemPrincipal] ?? conversaAtual.origemPrincipal}</span>
                  )}
                  <span>{conversaAtual.telefone}</span>
                  {conversaAtual.pecaRelacionada && <span>{conversaAtual.pecaRelacionada}</span>}
                </div>
              </div>
              <div className="right">
                <a href={`tel:${conversaAtual.telefone}`} className="bz-iconbtn" title="Ligar"><Phone size={15} /></a>
                <button type="button" className="bz-iconbtn" onClick={() => setCriarLembreteAberto(true)} title="Agendar lembrete"><Bell size={15} /></button>
                <button
                  type="button"
                  className="bz-iconbtn"
                  title="Encerrar atendimento"
                  disabled={carregando || !conversaAtual.conversaCrmId || conversaAtual.estadoCrm === "ENCERRADA"}
                  onClick={() =>
                    void executar(
                      () => requisitarApi(`/atendimento/conversas/${conversaAtual.conversaCrmId}`, {
                        method: "PATCH",
                        body: { estado: "ENCERRADA", prioridade: formCrm.prioridade, responsavelId: formCrm.responsavelId.trim() || null }
                      }),
                      "Atendimento encerrado."
                    )
                  }
                >
                  <CheckCircle2 size={15} />
                </button>
              </div>
            </div>

            {/* Thread tabs — Conversa | Notas | Atividade */}
            <div className="bz-thread-tabs">
              <button type="button" className={`bz-thread-tab${abaThread === "conversa" ? " active" : ""}`} onClick={() => setAbaThread("conversa")}>
                <MessageSquare size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                Conversa
              </button>
              <button type="button" className={`bz-thread-tab${abaThread === "notas" ? " active" : ""}`} onClick={() => setAbaThread("notas")}>
                <StickyNote size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                Notas
              </button>
              <button type="button" className={`bz-thread-tab${abaThread === "atividade" ? " active" : ""}`} onClick={() => setAbaThread("atividade")}>
                <Activity size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                Atividade
              </button>
            </div>

            {/* Context card (related order) */}
            {pecaRelacionadaObj && abaThread === "conversa" && (
              <div className="bz-ctx">
                <span className="ph">
                  <Package size={16} style={{ color: "var(--green-ink)" }} />
                </span>
                <div>
                  <div className="nm">
                    {conversaAtual.reservaAtual ? `Pedido #${conversaAtual.reservaAtual.codigoPeca} · ` : ""}
                    {pecaRelacionadaObj.nome}
                  </div>
                  <div className="meta">
                    {conversaAtual.reservaAtual
                      ? `${traduzirEstadoReserva(conversaAtual.reservaAtual.estado)} · pgto ${traduzirEstadoPagamentoCurto(conversaAtual.reservaAtual.estadoPagamento)}`
                      : `Stock: ${pecaRelacionadaObj.quantidade} · ${pecaRelacionadaObj.estado.toLowerCase()}`
                    }
                  </div>
                </div>
                <span className="price bz-tnum">{formatarKwanza(pecaRelacionadaObj.precoEmKwanza)}</span>
              </div>
            )}

            {/* Body: tab content + props */}
            <div className="bz-inbox-corpo">
              <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

                {/* ── Tab: Conversa ── */}
                {abaThread === "conversa" && (
                  <>
                    <div ref={mensagensRefDesktop} className="bz-thread-body">
                      {conversaAtual.mensagens.length === 0 ? (
                        <div className="bz-thread-vazio">Sem mensagens ainda</div>
                      ) : (
                        <>
                          <div className="bz-daysep">Hoje</div>
                          {conversaAtual.mensagens.map((item) => (
                            <MensagemBizy
                              key={item.id}
                              mensagem={item}
                              nomeCliente={conversaAtual.nomeCliente}
                              avatarCliente={conversaAtual.avatarUrlCliente}
                              carregando={carregando}
                              onReenviar={(m) => void reenviarMensagem(m)}
                              onUsarSugestao={(m) => setTextoResposta(m.conteudo)}
                            />
                          ))}
                        </>
                      )}
                    </div>

                    <BarraAcoesInteligente
                      conversaAtual={conversaAtual}
                      pecas={pecas}
                      reservas={reservas}
                      acoesServidor={proximasAcoes}
                      onAccao={lidarComAcaoInteligente}
                    />

                    {respostasRapidasAbertas && (
                      <RespostasRapidasPainel
                        respostas={respostasRapidas}
                        conversaAtual={conversaAtual}
                        pecaRelacionada={pecaRelacionadaObj}
                        aberto={respostasRapidasAbertas}
                        onFechar={() => setRespostasRapidasAbertas(false)}
                        onUsarTexto={(texto) => { setTextoResposta(texto); setRespostasRapidasAbertas(false); }}
                        onEnviarTexto={(texto) => { void enviarMensagemRapida(texto); setRespostasRapidasAbertas(false); }}
                      />
                    )}
                    {contextoAberto && (
                      <PainelContextoComercial
                        contexto={contextoComercial}
                        pecas={pecas}
                        buscaContexto={buscaContexto}
                        onBuscarContexto={setBuscaContexto}
                        onCriarPedido={criarPedidoPorPeca}
                        onUsarTexto={(texto) => setTextoResposta(texto)}
                        onEnviarTexto={(texto) => void enviarMensagemRapida(texto)}
                      />
                    )}

                    {/* Composer — KirriDesk style with channel badge */}
                    <form className="bz-composer" onSubmit={(e) => void enviarMensagem(e)}>
                      {conversaAtual.origemPrincipal && (
                        <span className="bz-composer-channel">
                          <IconeOrigem origem={conversaAtual.origemPrincipal} />
                          {NOME_CANAL[conversaAtual.origemPrincipal] ?? conversaAtual.origemPrincipal}
                        </span>
                      )}
                      <button type="button" className="bz-iconbtn" onClick={() => setRespostasRapidasAbertas((a) => !a)} disabled={carregando} title="Respostas rápidas">
                        <Zap size={15} />
                      </button>
                      <button type="button" className="bz-iconbtn" onClick={() => setContextoAberto((a) => !a)} disabled={carregando} title="Consultar produtos">
                        <Package size={15} />
                      </button>
                      <textarea
                        className="inp"
                        aria-label="Responder"
                        placeholder="Escreve uma mensagem…"
                        value={textoResposta}
                        onChange={(e) => setTextoResposta(e.target.value)}
                        onKeyDown={lidarComTeclaComposer}
                        disabled={carregando}
                        rows={1}
                      />
                      <button type="submit" className="send" disabled={carregando || !textoResposta.trim()} title="Enviar">
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                )}

                {/* ── Tab: Notas ── */}
                {abaThread === "notas" && (
                  <div className="bz-tab-content">
                    <form className="grid gap-3" onSubmit={(e) => void guardarNotaInterna(e)}>
                      <Textarea
                        placeholder="Adicionar nota interna para a equipa..."
                        value={notaInterna}
                        onChange={(e) => setNotaInterna(e.target.value)}
                        disabled={carregando || !conversaAtual.conversaCrmId}
                        rows={3}
                        className="text-sm"
                        style={{ borderRadius: 8 }}
                      />
                      <Button variant="outline" size="sm" disabled={carregando || !notaInterna.trim() || !conversaAtual.conversaCrmId} className="w-fit">
                        <StickyNote className="size-3.5 mr-1.5" />
                        Guardar nota
                      </Button>
                    </form>
                    {conversaAtual.mensagens
                      .filter((m) => m.origem === "nota_interna")
                      .map((nota) => (
                        <div key={nota.id} className="bz-note-card">
                          <div className="bz-note-card-head">
                            <span className="bz-note-card-author">Nota interna</span>
                            <span className="bz-note-card-time">{formatarHora(nota.enviadaEm)}</span>
                          </div>
                          <div className="bz-note-card-text">{nota.conteudo}</div>
                        </div>
                      ))
                    }
                    {conversaAtual.mensagens.filter((m) => m.origem === "nota_interna").length === 0 && (
                      <div style={{ textAlign: "center", padding: 32, color: "var(--ink-3)", fontSize: 13 }}>
                        Nenhuma nota interna ainda.
                      </div>
                    )}
                  </div>
                )}

                {/* ── Tab: Atividade ── */}
                {abaThread === "atividade" && (
                  <div className="bz-tab-content">
                    {conversaAtual.mensagens
                      .filter((m) => m.remetente === "sistema")
                      .map((evento) => (
                        <div key={evento.id} className="bz-activity-entry">
                          <span className={`bz-activity-dot ${corAtividadeDot(evento)}`} />
                          <div>
                            <div className="bz-activity-text">{evento.conteudo}</div>
                            <div className="bz-activity-time">{formatarHora(evento.enviadaEm)}</div>
                          </div>
                        </div>
                      ))
                    }
                    {conversaAtual.mensagens.filter((m) => m.remetente === "sistema").length === 0 && (
                      <div style={{ textAlign: "center", padding: 32, color: "var(--ink-3)", fontSize: 13 }}>
                        Sem atividade registada.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Properties panel — KirriDesk Agent Card style */}
              <div className="bz-inbox-props">
                {/* Agent Assigned card */}
                <div className="bz-agent-card">
                  <div className="bz-agent-card-title">Agente responsável</div>
                  <div className="bz-agent-card-row">
                    <div className="bz-agent-card-avatar">
                      {(formCrm.responsavelId || "A")[0].toUpperCase()}
                    </div>
                    <div className="bz-agent-card-info">
                      <div className="bz-agent-card-name">{formCrm.responsavelId || "Sem responsável"}</div>
                      <div className="bz-agent-card-role">{traduzirEstadoCrm(conversaAtual.estadoCrm)}</div>
                    </div>
                  </div>
                </div>

                {/* Quick action icons */}
                <div className="bz-props-actions">
                  <a href={`tel:${conversaAtual.telefone}`} className="bz-props-action-btn" title="Ligar"><Phone size={14} /></a>
                  <button type="button" className="bz-props-action-btn" onClick={() => setCriarLembreteAberto(true)} title="Lembrete"><Clock size={14} /></button>
                  <button type="button" className="bz-props-action-btn" onClick={() => setAbaThread("notas")} title="Nota"><StickyNote size={14} /></button>
                  <button type="button" className="bz-props-action-btn" title="Criar pedido" disabled={carregando || !conversaAtual.conversaCrmId || !pecaRelacionadaObj || pecaRelacionadaObj.estado !== "DISPONIVEL"} onClick={() => pecaRelacionadaObj && void criarPedidoPorPeca(pecaRelacionadaObj)}><ClipboardList size={14} /></button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <button type="button" className="bz-props-action-btn" title="Gestão completa"><Settings2 size={14} /></button>
                    </SheetTrigger>
                    <SheetContent className="overflow-y-auto sm:max-w-md">
                      <SheetHeader>
                        <SheetTitle>Gestão do atendimento</SheetTitle>
                        <SheetDescription>{conversaAtual.nomeCliente} · {traduzirEstadoCrm(conversaAtual.estadoCrm)}</SheetDescription>
                      </SheetHeader>
                      <div className="px-1 pt-4">{painelPropriedades}</div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Scrollable details */}
                <div className="overflow-y-auto flex-1 p-4 scrollbar-thin">
                  {painelPropriedades}
                </div>
              </div>
            </div>

            {/* Criar lembrete dialog (desktop) */}
            <CriarLembretePainel
              conversaAtual={conversaAtual}
              aberto={criarLembreteAberto}
              onFechar={() => setCriarLembreteAberto(false)}
              onCriado={() => void carregarDadosApoio()}
            />
          </div>
        ) : (
          <div className="bz-thread-vazio">
            <div style={{ textAlign: "center" }}>
              <MessageCircle size={36} style={{ color: "var(--ink-3)", marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Seleciona uma conversa</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4, maxWidth: 240, margin: "4px auto 0" }}>Escolhe uma conversa à esquerda para começar o atendimento.</div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Feedback toast */}
      {mensagem && (
        <div className="fixed bottom-4 right-4 z-50 hidden lg:flex items-center gap-3 bz-panel px-4 py-3 text-sm shadow-lg" style={{ fontSize: 13, color: "var(--ink-2)" }} aria-live="polite">
          {mensagem}
          <button type="button" onClick={() => setMensagem("")} className="bz-iconbtn" style={{ marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

    </CrmPageMotion>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function SecaoPropriedade({
  titulo,
  icone,
  inicialmenteAberta = false,
  children
}: {
  titulo: string;
  icone: ReactNode;
  inicialmenteAberta?: boolean;
  children: ReactNode;
}) {
  const [aberta, setAberta] = useState(inicialmenteAberta);

  return (
    <div className="atendimento-props-section">
      <button
        type="button"
        className="atendimento-props-section-header"
        onClick={() => setAberta((a) => !a)}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {icone}
          {titulo}
        </span>
        <ChevronDown
          size={13}
          className="text-muted-foreground transition-transform"
          style={{ transform: aberta ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PainelContextoComercial({
  contexto,
  pecas,
  buscaContexto,
  onBuscarContexto,
  onCriarPedido,
  onUsarTexto,
  onEnviarTexto
}: {
  contexto: ContextoComercialDados;
  pecas: Peca[];
  buscaContexto: string;
  onBuscarContexto: (valor: string) => void;
  onCriarPedido?: (peca: Peca) => void;
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
          <Link2 className="size-3.5" />
          Banco ligado
        </Badge>
      </div>

      <CampoBusca placeholder="Buscar produto, pedido ou cliente..." value={buscaContexto} onChange={onBuscarContexto} />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-2">
          <RotuloComIcone icone={<Package className="size-4" />}>Produtos</RotuloComIcone>
          {contexto.pecaRelacionada && (
            <ContextoPeca peca={contexto.pecaRelacionada} destaque="Relacionado à conversa" onCriarPedido={onCriarPedido} onUsar={onUsarTexto} onEnviar={onEnviarTexto} />
          )}
          {contexto.pecasFiltradas
            .filter((peca) => peca.codigo !== contexto.pecaRelacionada?.codigo)
            .slice(0, contexto.pecaRelacionada ? 3 : 4)
            .map((peca) => (
              <ContextoPeca key={peca.codigo} peca={peca} onCriarPedido={onCriarPedido} onUsar={onUsarTexto} onEnviar={onEnviarTexto} />
            ))}
          {!contexto.pecaRelacionada && contexto.pecasFiltradas.length === 0 && (
            <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}
        </div>

        <div className="grid gap-2">
          <RotuloComIcone icone={<ClipboardList className="size-4" />}>Pedidos</RotuloComIcone>
          {contexto.reservasFiltradas.map((reserva) => (
            <ContextoReserva
              key={reserva.id}
              reserva={reserva}
              peca={pecas.find((p) => p.codigo === reserva.codigoPeca) ?? null}
              onUsar={onUsarTexto}
              onEnviar={onEnviarTexto}
            />
          ))}
          {contexto.reservasFiltradas.length === 0 && (
            <p className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RotuloComIcone({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="inline-flex min-h-6 items-center gap-2 text-sm font-semibold leading-none">
      <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">{icone}</span>
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
  const canalComReenvio = mensagem.origem === "whatsapp" || mensagem.origem === "instagram" || mensagem.origem === "sms";
  const permiteReenvio = canalComReenvio && mensagem.remetente !== "cliente" && mensagem.status === "FAILED";
  const erroTecnicoEvolution = permiteReenvio && mensagem.origem === "whatsapp" && ehErroTecnicoEvolution(mensagem.erro);
  const permiteUsarSugestao = mensagem.origem === "ia_sugestao" && mensagem.status === "QUEUED";
  const enviadaPelaLoja = mensagem.remetente !== "cliente";
  const mensagemFalhou = enviadaPelaLoja && mensagem.status === "FAILED";
  const classeBalao = enviadaPelaLoja
    ? mensagemFalhou
      ? "max-w-[85%] rounded-2xl rounded-br-sm border border-destructive/30 bg-destructive/5 p-3 text-foreground shadow-xs"
      : "max-w-[85%] rounded-2xl rounded-br-sm bg-primary p-3 text-primary-foreground"
    : "max-w-[85%] rounded-2xl rounded-bl-sm border bg-background p-3";

  return (
    <div className={enviadaPelaLoja ? "flex justify-end" : "flex justify-start"}>
      <div className={`atendimento-message-bubble ${classeBalao}`}>
        {mensagem.remetente !== "cliente" && (
          <span className={mensagemFalhou ? "mb-1 block text-xs font-semibold text-destructive" : "mb-1 block text-xs font-semibold opacity-80"}>
            {traduzirRemetenteMensagem(mensagem)}
          </span>
        )}
        <p className="atendimento-message-text whitespace-pre-wrap text-sm leading-6">{mensagem.conteudo}</p>
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
              <a href="/app/administracao" title="Ver conexão WhatsApp">
                <AlertTriangle className="size-3.5 mr-1.5" />
                Ver conexão
              </a>
            </Button>
          </div>
        ) : permiteReenvio && onReenviar ? (
          <div className="mt-2">
            <Button type="button" variant="outline" size="sm" disabled={carregando} onClick={() => onReenviar(mensagem)}>
              <RefreshCcw className="size-3.5 mr-1.5" />
              Reenviar
            </Button>
          </div>
        ) : permiteUsarSugestao && onUsarSugestao ? (
          <div className="mt-2">
            <Button type="button" variant="outline" size="sm" disabled={carregando} onClick={() => onUsarSugestao(mensagem)}>
              <CheckCircle2 className="size-3.5 mr-1.5" />
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
        <Search className="size-4 shrink-0" />
      </span>
      <Input
        aria-label={ariaLabel ?? placeholder}
        className="market-input h-9"
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
  onCriarPedido,
  onUsar,
  onEnviar
}: {
  peca: Peca;
  destaque?: string;
  onCriarPedido?: (peca: Peca) => void;
  onUsar: (texto: string) => void;
  onEnviar: (texto: string) => void;
}) {
  const texto = montarMensagemPeca(peca);

  return (
    <CrmListItem
      media={<Package className="size-4" />}
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
          <StickyNote className="size-3.5 mr-1" />
          Usar
        </Button>
        <Button type="button" size="sm" onClick={() => onEnviar(texto)}>
          <Send className="size-3.5 mr-1" />
          Enviar
        </Button>
        {onCriarPedido && peca.estado === "DISPONIVEL" && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onCriarPedido(peca)}>
            <ClipboardList className="size-3.5 mr-1" />
            Criar pedido
          </Button>
        )}
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
      media={<ClipboardList className="size-4" />}
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
          <StickyNote className="size-3.5 mr-1" />
          Usar
        </Button>
        <Button type="button" size="sm" onClick={() => onEnviar(texto)}>
          <Send className="size-3.5 mr-1" />
          Enviar
        </Button>
      </div>
    </CrmListItem>
  );
}

// ─── Utility functions ────────────────────────────────────────────────────────

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

  if (peca) partes.push(`Valor: ${formatarKwanza(peca.precoEmKwanza)}.`);
  if (reserva.expiraEm) partes.push(`Tempo restante: ${formatarTempoRestante(reserva.expiraEm)}.`);

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
    origemPrincipal: conversa.origemPrincipal ?? null,
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

function IconeOrigem({ origem }: { origem: string }) {
  if (origem === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.34 6.34 0 0 0 9.37 22a6.33 6.33 0 0 0 6.33-6.33V9.18a8.16 8.16 0 0 0 3.89.98V6.69Z" />
      </svg>
    );
  }
  if (origem === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5 text-green-600">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    );
  }
  if (origem === "instagram") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5 text-pink-500">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  if (origem === "sms") {
    return <Phone className="size-2.5 text-amber-500" />;
  }
  if (origem === "loja_digital") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-2.5 text-emerald-600">
        <path d="M4 7h16l-1.5 9H5.5L4 7zm0 0L3 4H1m15 14a2 2 0 11-4 0 2 2 0 014 0zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" stroke="currentColor" fill="none" />
      </svg>
    );
  }
  return <MessageCircle className="size-2.5" />;
}

function formatarHora(data: string) {
  return new Date(data).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" });
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
  const origensComStatus = ["whatsapp", "instagram", "sms", "ia_sugestao"];
  if (!origensComStatus.includes(mensagem.origem ?? "") || mensagem.remetente === "cliente") return null;
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

function corEstadoCrmTag(estado: Conversa["estadoCrm"]): string {
  if (estado === "RESOLVIDA" || estado === "ENCERRADA") return "b-green";
  if (estado === "AGUARDANDO_CLIENTE" || estado === "AGUARDANDO_PAGAMENTO") return "b-amber";
  if (estado === "AGUARDANDO_HUMANO") return "b-rose";
  if (estado === "NOVA" || estado === "ABERTA") return "b-blue";
  return "b-mute";
}

function corEstadoCrmSemantica(estado: Conversa["estadoCrm"]): CorSemantica {
  if (estado === "RESOLVIDA" || estado === "ENCERRADA") return "green";
  if (estado === "AGUARDANDO_CLIENTE" || estado === "AGUARDANDO_PAGAMENTO") return "amber";
  if (estado === "AGUARDANDO_HUMANO") return "rose";
  if (estado === "NOVA" || estado === "ABERTA") return "blue";
  return "mute";
}

function MensagemBizy({
  mensagem,
  nomeCliente,
  avatarCliente,
  carregando,
  onReenviar,
  onUsarSugestao
}: {
  mensagem: Mensagem;
  nomeCliente?: string;
  avatarCliente?: string | null;
  carregando: boolean;
  onReenviar?: (mensagem: Mensagem) => void;
  onUsarSugestao?: (mensagem: Mensagem) => void;
}) {
  const enviadaPelaLoja = mensagem.remetente !== "cliente";
  const ehSistema = mensagem.remetente === "sistema";
  const falhou = enviadaPelaLoja && mensagem.status === "FAILED";
  const permiteReenvio = falhou && (mensagem.origem === "whatsapp" || mensagem.origem === "instagram" || mensagem.origem === "sms");
  const permiteUsarSugestao = mensagem.origem === "ia_sugestao" && mensagem.status === "QUEUED";
  const classeBolha = ehSistema
    ? "bz-msg msg-system"
    : falhou
      ? "bz-msg msg-fail"
      : enviadaPelaLoja
        ? "bz-msg msg-out"
        : "bz-msg msg-in";

  // System messages render inline without avatar
  if (ehSistema) {
    return (
      <div className={classeBolha}>
        <span className="bz-msg-text">{mensagem.conteudo}</span>
        <div className="bz-msg-meta" style={{ justifyContent: "center" }}>
          <span className="tm">{formatarHora(mensagem.enviadaEm)}</span>
        </div>
      </div>
    );
  }

  const inicial = enviadaPelaLoja
    ? "A"
    : (nomeCliente?.[0] ?? "C").toUpperCase();

  return (
    <div className={`bz-msg-row${enviadaPelaLoja ? " out" : ""}`}>
      <div className={`bz-msg-avatar ${enviadaPelaLoja ? "agent" : "client"}`}>
        {!enviadaPelaLoja && avatarCliente ? (
          <img src={avatarCliente} alt="" />
        ) : (
          inicial
        )}
      </div>
      <div className="bz-msg-body">
        <div className={classeBolha}>
          {enviadaPelaLoja && (
            <span className="sender-label">{traduzirRemetenteMensagem(mensagem)}</span>
          )}
          <span className="bz-msg-text">{mensagem.conteudo}</span>
          <div className="bz-msg-meta">
            <span className="tm">{formatarHora(mensagem.enviadaEm)}</span>
            {mensagem.origem && NOME_CANAL[mensagem.origem] && (
              <span className="bz-msg-channel">
                <IconeOrigem origem={mensagem.origem} />
                Via {NOME_CANAL[mensagem.origem]}
              </span>
            )}
          </div>
          {mensagem.erro && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--rose-ink)", background: "var(--rose-tint)", padding: "4px 8px", borderRadius: 6 }}>
              {mensagem.erro}
            </div>
          )}
          {permiteReenvio && onReenviar && (
            <button type="button" className="bz-iconbtn" style={{ marginTop: 6 }} disabled={carregando} onClick={() => onReenviar(mensagem)} title="Reenviar">
              <RefreshCcw size={12} />
            </button>
          )}
          {permiteUsarSugestao && onUsarSugestao && (
            <button type="button" className="bz-iconbtn" style={{ marginTop: 6 }} disabled={carregando} onClick={() => onUsarSugestao(mensagem)} title="Usar sugestão">
              <CheckCircle2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function corAtividadeDot(mensagem: Mensagem): string {
  const texto = mensagem.conteudo.toLowerCase();
  if (texto.includes("pagamento") || texto.includes("confirmad")) return "green";
  if (texto.includes("aguardando") || texto.includes("expirar")) return "amber";
  if (texto.includes("criado") || texto.includes("aberto")) return "blue";
  return "mute";
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
