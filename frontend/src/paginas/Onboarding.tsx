import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  Building2,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Store,
  UsersRound,
  Video,
  type LucideIcon
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  guardarUsuario,
  obterUsuario,
  requisitarApi,
  type NegocioSessao,
  type UsuarioSessao
} from "../api";
import { LogoBizy } from "../marca/bizy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TipoContextoContaBizy =
  | "COMPRADOR"
  | "AFILIADO"
  | "CRIADOR"
  | "SELLER"
  | "PRODUTOR_LEARNING"
  | "MEMBRO_NEGOCIO";

type FuncaoConta =
  | "comprador"
  | "seller"
  | "creator"
  | "afiliado"
  | "produtor"
  | "membro";

type PassoOnboarding = "perfil" | "negocio" | "pronto";

interface EstadoOnboarding {
  usuario: UsuarioSessao;
  conta: {
    id: string;
    nome: string | null;
    telefone: string | null;
    email: string | null;
    status: string;
  };
  negocio: NegocioSessao | null;
  contextos: Array<{
    id: string;
    tipo: TipoContextoContaBizy;
    negocioId: string | null;
    estado: string;
  }>;
  tiposContexto: TipoContextoContaBizy[];
  perfilConfigurado: boolean;
  perfilAcademico: boolean;
  servicos: {
    team: boolean;
    market: boolean;
    creator: boolean;
    learning: boolean;
  };
  destinoRecomendado: string;
  pendencias: string[];
  completo: boolean;
}

interface DefinicaoFuncao {
  id: FuncaoConta;
  titulo: string;
  descricao: string;
  etiqueta: string;
  icone: LucideIcon;
  contextos: TipoContextoContaBizy[];
  requerNegocio?: boolean;
}

const FUNCOES_CONTA: DefinicaoFuncao[] = [
  {
    id: "comprador",
    titulo: "Comprar no Market",
    descricao: "Favoritos, endereços, encomendas, avaliações e protecção do comprador.",
    etiqueta: "Market",
    icone: ShoppingBag,
    contextos: ["COMPRADOR"]
  },
  {
    id: "seller",
    titulo: "Vender e gerir uma loja",
    descricao: "Bizy Studio, catálogo, pedidos, clientes, pagamentos e operação no Team.",
    etiqueta: "Team + Market",
    icone: Store,
    contextos: ["SELLER", "MEMBRO_NEGOCIO"],
    requerNegocio: true
  },
  {
    id: "creator",
    titulo: "Criar conteúdo comercial",
    descricao: "Conteúdo comprável, campanhas, links, missões e desempenho de creator.",
    etiqueta: "Creator",
    icone: Video,
    contextos: ["CRIADOR"]
  },
  {
    id: "afiliado",
    titulo: "Promover como afiliado",
    descricao: "Oportunidades, Smart Links, comissões, retenções e pagamentos auditáveis.",
    etiqueta: "Creator commerce",
    icone: BadgeDollarSign,
    contextos: ["AFILIADO"]
  },
  {
    id: "produtor",
    titulo: "Publicar no Learning",
    descricao: "Cursos, mentorias, cohorts, avaliações, certificados e comunidades.",
    etiqueta: "Learning + Team",
    icone: BookOpenCheck,
    contextos: ["PRODUTOR_LEARNING", "MEMBRO_NEGOCIO"],
    requerNegocio: true
  },
  {
    id: "membro",
    titulo: "Trabalhar numa equipa",
    descricao: "Acede aos negócios onde foste convidado, respeitando funções e permissões.",
    etiqueta: "Team",
    icone: UsersRound,
    contextos: ["MEMBRO_NEGOCIO"]
  }
];

const CANAIS_DISPONIVEIS = ["whatsapp", "instagram", "tiktok", "facebook"];
const PAGAMENTOS_DISPONIVEIS = ["transferencia", "multicaixa", "referencia", "dinheiro"];
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function contextosDasFuncoes(funcoes: FuncaoConta[]): TipoContextoContaBizy[] {
  const contextos = funcoes.flatMap((funcao) =>
    FUNCOES_CONTA.find((item) => item.id === funcao)?.contextos ?? []
  );
  return Array.from(new Set(contextos));
}

function funcoesDosContextos(contextos: TipoContextoContaBizy[]): FuncaoConta[] {
  const tipos = new Set(contextos);
  const funcoes: FuncaoConta[] = [];
  if (tipos.has("COMPRADOR")) funcoes.push("comprador");
  if (tipos.has("SELLER")) funcoes.push("seller");
  if (tipos.has("CRIADOR")) funcoes.push("creator");
  if (tipos.has("AFILIADO")) funcoes.push("afiliado");
  if (tipos.has("PRODUTOR_LEARNING")) funcoes.push("produtor");
  if (
    tipos.has("MEMBRO_NEGOCIO") &&
    !tipos.has("SELLER") &&
    !tipos.has("PRODUTOR_LEARNING")
  ) {
    funcoes.push("membro");
  }
  return funcoes;
}

function requerNegocio(funcoes: FuncaoConta[]): boolean {
  return funcoes.some((funcao) =>
    FUNCOES_CONTA.find((item) => item.id === funcao)?.requerNegocio === true
  );
}

function resolverDestino(contextos: TipoContextoContaBizy[], perfilAcademico: boolean): string {
  const tipos = new Set(contextos);
  if (tipos.has("PRODUTOR_LEARNING")) return "/app/learning/produtor";
  if (tipos.has("SELLER") || tipos.has("MEMBRO_NEGOCIO")) return "/app";
  if (tipos.has("CRIADOR") || tipos.has("AFILIADO")) return "/creator";
  if (perfilAcademico) return "/learning";
  return "/conta";
}

function criarEstadoTeste(usuario: UsuarioSessao): EstadoOnboarding {
  return {
    usuario,
    conta: {
      id: "conta-teste-bizy",
      nome: usuario.nome,
      telefone: usuario.telefone,
      email: usuario.email ?? null,
      status: "ATIVA"
    },
    negocio: null,
    contextos: [],
    tiposContexto: [],
    perfilConfigurado: false,
    perfilAcademico: false,
    servicos: { team: false, market: false, creator: false, learning: false },
    destinoRecomendado: "/conta",
    pendencias: ["CONFIGURAR_PERFIL"],
    completo: false
  };
}

export function PaginaOnboarding() {
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [usuarioLocal] = useState(() => obterUsuario());
  const modoTeste = usuarioLocal?.origemCadastro === "Modo teste";
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null);
  const [passo, setPasso] = useState<PassoOnboarding>("perfil");
  const [funcoes, setFuncoes] = useState<FuncaoConta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [negocio, setNegocio] = useState({
    nomeComercial: "",
    segmento: "",
    tipo: "LOJA",
    telefone: usuarioLocal?.telefone ?? "",
    whatsapp: usuarioLocal?.telefone ?? "",
    email: usuarioLocal?.email ?? "",
    provincia: "Luanda",
    municipio: "",
    canaisVenda: ["whatsapp"],
    metodosPagamento: ["transferencia"],
    minutosReservaPadrao: 10
  });

  const contextosSelecionados = useMemo(() => contextosDasFuncoes(funcoes), [funcoes]);
  const precisaNegocio = requerNegocio(funcoes);
  const passos = useMemo(
    () => [
      { id: "perfil" as const, titulo: "Funções" },
      ...(precisaNegocio ? [{ id: "negocio" as const, titulo: "Negócio" }] : []),
      { id: "pronto" as const, titulo: "Conta pronta" }
    ],
    [precisaNegocio]
  );
  const indicePasso = Math.max(0, passos.findIndex((item) => item.id === passo));
  const progresso = `${((indicePasso + 1) / passos.length) * 100}%`;
  const usuario = estado?.usuario ?? usuarioLocal;
  const iniciais = useMemo(
    () =>
      (usuario?.nome ?? "Conta Bizy")
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join(""),
    [usuario?.nome]
  );

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!usuarioLocal) {
        navigate("/login", { replace: true });
        return;
      }

      setCarregando(true);
      setErro("");

      if (modoTeste) {
        const resposta = criarEstadoTeste(usuarioLocal);
        if (!ativo) return;
        setEstado(resposta);
        setFuncoes([]);
        setPasso("perfil");
        setMensagem("Ambiente de desenvolvimento activo.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await requisitarApi<EstadoOnboarding>("/onboarding/estado");
        if (!ativo) return;
        const funcoesExistentes = funcoesDosContextos(resposta.tiposContexto);
        const funcoesIniciais =
          funcoesExistentes.length > 0
            ? funcoesExistentes
            : resposta.perfilAcademico
              ? ["comprador" as const]
              : [];

        setEstado(resposta);
        setFuncoes(funcoesIniciais);
        setNegocio((actual) => ({
          ...actual,
          nomeComercial: resposta.negocio?.nomeComercial ?? actual.nomeComercial,
          segmento: resposta.negocio?.segmento ?? actual.segmento,
          tipo: resposta.negocio?.tipo ?? actual.tipo,
          telefone: resposta.negocio?.telefone ?? actual.telefone,
          whatsapp: resposta.negocio?.whatsapp ?? actual.whatsapp,
          email: resposta.negocio?.email ?? actual.email,
          provincia: resposta.negocio?.provincia ?? actual.provincia,
          municipio: resposta.negocio?.municipio ?? actual.municipio,
          canaisVenda: resposta.negocio?.canaisVenda?.length
            ? resposta.negocio.canaisVenda
            : actual.canaisVenda,
          metodosPagamento: resposta.negocio?.metodosPagamento?.length
            ? resposta.negocio.metodosPagamento
            : actual.metodosPagamento,
          minutosReservaPadrao:
            resposta.negocio?.minutosReservaPadrao ?? actual.minutosReservaPadrao
        }));

        if (!resposta.perfilConfigurado) {
          setPasso("perfil");
        } else if (
          !resposta.negocio &&
          (resposta.tiposContexto.includes("SELLER") ||
            resposta.tiposContexto.includes("PRODUTOR_LEARNING"))
        ) {
          setPasso("negocio");
        } else {
          setPasso("pronto");
        }
      } catch (falha) {
        if (!ativo) return;
        setErro(falha instanceof Error ? falha.message : "Não foi possível carregar a Conta Bizy.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [modoTeste, navigate, usuarioLocal]);

  function alternarFuncao(funcao: FuncaoConta) {
    setFuncoes((actual) =>
      actual.includes(funcao)
        ? actual.filter((item) => item !== funcao)
        : [...actual, funcao]
    );
    setErro("");
  }

  async function guardarPerfil() {
    if (contextosSelecionados.length === 0) {
      setErro("Escolhe pelo menos uma função para continuar.");
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("A configurar os contextos da tua Conta Bizy...");

    try {
      if (modoTeste) {
        const tiposContexto = contextosSelecionados;
        setEstado((actual) =>
          actual
            ? {
                ...actual,
                tiposContexto,
                perfilConfigurado: true,
                destinoRecomendado: resolverDestino(tiposContexto, actual.perfilAcademico)
              }
            : actual
        );
      } else {
        const resposta = await requisitarApi<{
          usuario: UsuarioSessao;
          tiposContexto: TipoContextoContaBizy[];
          destinoRecomendado: string;
        }>("/onboarding/perfil", {
          method: "PUT",
          body: { contextos: contextosSelecionados }
        });
        guardarUsuario(resposta.usuario);
        setEstado((actual) =>
          actual
            ? {
                ...actual,
                usuario: resposta.usuario,
                tiposContexto: resposta.tiposContexto,
                perfilConfigurado: true,
                destinoRecomendado: resposta.destinoRecomendado
              }
            : actual
        );
      }

      if (precisaNegocio && !estado?.negocio) {
        setPasso("negocio");
        setMensagem("Funções guardadas. Falta identificar o negócio que vais operar.");
      } else {
        setPasso("pronto");
        setMensagem("Conta configurada com os serviços escolhidos.");
      }
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível configurar a conta.");
    } finally {
      setSalvando(false);
    }
  }

  async function guardarNegocio(evento: FormEvent) {
    evento.preventDefault();
    if (!negocio.nomeComercial.trim() || !negocio.segmento.trim()) {
      setErro("Preenche o nome comercial e o segmento do negócio.");
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("A guardar o negócio...");

    try {
      let negocioGuardado: NegocioSessao;
      if (modoTeste) {
        negocioGuardado = {
          id: "negocio-teste-bizy",
          nomeComercial: negocio.nomeComercial,
          segmento: negocio.segmento,
          tipo: negocio.tipo,
          telefone: negocio.telefone || null,
          whatsapp: negocio.whatsapp || null,
          email: negocio.email || null,
          provincia: negocio.provincia || null,
          municipio: negocio.municipio || null,
          moeda: "AOA",
          fusoHorario: "Africa/Luanda",
          canaisVenda: negocio.canaisVenda,
          metodosPagamento: negocio.metodosPagamento,
          minutosReservaPadrao: negocio.minutosReservaPadrao,
          usuarioPapel: "DONO"
        };
      } else {
        const resposta = await requisitarApi<{ negocio: NegocioSessao }>("/onboarding/negocio", {
          method: "POST",
          body: negocio
        });
        negocioGuardado = resposta.negocio;
      }

      setEstado((actual) =>
        actual
          ? {
              ...actual,
              negocio: negocioGuardado,
              tiposContexto: Array.from(
                new Set([...actual.tiposContexto, "SELLER", "MEMBRO_NEGOCIO"])
              ),
              destinoRecomendado: contextosSelecionados.includes("PRODUTOR_LEARNING")
                ? "/app/learning/produtor"
                : "/app",
              completo: true
            }
          : actual
      );
      setPasso("pronto");
      setMensagem("Negócio ligado à Conta Bizy. Já podes entrar na operação.");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível guardar o negócio.");
    } finally {
      setSalvando(false);
    }
  }

  function alternarLista(campo: "canaisVenda" | "metodosPagamento", valor: string) {
    setNegocio((actual) => {
      const lista = actual[campo];
      return {
        ...actual,
        [campo]: lista.includes(valor)
          ? lista.filter((item) => item !== valor)
          : [...lista, valor]
      };
    });
  }

  const destinoFinal =
    estado?.destinoRecomendado ??
    resolverDestino(contextosSelecionados, estado?.perfilAcademico === true);

  return (
    <main className="bizy-public bizy-onboarding-v2">
      <header className="bizy-onboarding-v2-nav">
        <Link to="/" aria-label="Página inicial do Bizy"><LogoBizy /></Link>
        <span>Configuração da conta</span>
        <button type="button" onClick={() => navigate(destinoFinal)}>
          Fazer depois
        </button>
      </header>

      <div className="bizy-onboarding-v2-shell">
        <aside className="bizy-onboarding-v2-sidebar">
          <div className="bizy-onboarding-v2-person">
            <span>{iniciais || "BZ"}</span>
            <div>
              <strong>{usuario?.nome ?? "Conta Bizy"}</strong>
              <small>{usuario?.email ?? usuario?.telefone ?? "sessão activa"}</small>
            </div>
          </div>

          {estado?.perfilAcademico ? (
            <div className="bizy-onboarding-v2-academic">
              <GraduationCap size={17} />
              <span>
                <strong>Identidade académica</strong>
                <small>O Learning já faz parte da tua conta.</small>
              </span>
            </div>
          ) : null}

          <div className="bizy-onboarding-v2-progress" aria-label="Progresso da configuração">
            <div><span><i style={{ width: progresso }} /></span><b>{indicePasso + 1}/{passos.length}</b></div>
            <ol>
              {passos.map((item, indice) => {
                const activo = item.id === passo;
                const concluido = indice < indicePasso;
                return (
                  <li key={item.id} className={cn(activo && "is-active", concluido && "is-done")}>
                    <span>{concluido ? <Check size={13} /> : indice + 1}</span>
                    {item.titulo}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="bizy-onboarding-v2-trust">
            <ShieldCheck size={17} />
            <span>
              <strong>Configuração reversível</strong>
              <small>Podes activar outros contextos mais tarde sem criar outra conta.</small>
            </span>
          </div>
        </aside>

        <section className="bizy-onboarding-v2-main">
          {carregando ? (
            <div className="bizy-onboarding-v2-loading" role="status">
              <Loader2 className="animate-spin" size={24} />
              A preparar a Conta Bizy
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {passo === "perfil" ? (
                <motion.div
                  key="perfil"
                  initial={reduzirMovimento ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <CabecalhoPasso
                    etiqueta="Funções da conta"
                    titulo="Como vais usar o Bizy?"
                    descricao="Escolhe uma ou várias funções. A mesma conta pode comprar, vender, criar, promover e ensinar."
                  />

                  <div className="bizy-onboarding-v2-role-grid">
                    {FUNCOES_CONTA.map((item) => {
                      const activo = funcoes.includes(item.id);
                      const Icone = item.icone;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={cn("bizy-onboarding-v2-role", activo && "is-active")}
                          onClick={() => alternarFuncao(item.id)}
                          aria-pressed={activo}
                        >
                          <span className="bizy-onboarding-v2-role-icon"><Icone size={20} /></span>
                          <span className="bizy-onboarding-v2-role-check">
                            {activo ? <Check size={13} /> : null}
                          </span>
                          <small>{item.etiqueta}</small>
                          <strong>{item.titulo}</strong>
                          <p>{item.descricao}</p>
                        </button>
                      );
                    })}
                  </div>

                  <Feedback mensagem={mensagem} erro={erro} />

                  <div className="bizy-onboarding-v2-actions">
                    <Button variant="outline" type="button" onClick={() => navigate("/")} className="bizy-btn">
                      <ArrowLeft size={16} />
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void guardarPerfil()}
                      disabled={salvando || contextosSelecionados.length === 0}
                      className="bizy-btn bizy-btn-primary"
                    >
                      {salvando ? <Loader2 className="animate-spin" size={16} /> : null}
                      Guardar funções
                      {!salvando ? <ArrowRight size={16} /> : null}
                    </Button>
                  </div>
                </motion.div>
              ) : passo === "negocio" ? (
                <motion.form
                  key="negocio"
                  onSubmit={guardarNegocio}
                  initial={reduzirMovimento ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <CabecalhoPasso
                    etiqueta="Contexto operacional"
                    titulo="Identifica o negócio."
                    descricao="Team, Studio e produção Learning precisam de um negócio para isolar equipa, catálogo, dinheiro e permissões."
                  />

                  <div className="bizy-onboarding-v2-form">
                    <section>
                      <div className="bizy-onboarding-v2-section-title">
                        <Building2 size={18} />
                        <div>
                          <strong>Dados principais</strong>
                          <small>Podes completar morada, NIF e políticas depois.</small>
                        </div>
                      </div>
                      <div className="bizy-onboarding-v2-form-grid">
                        <Campo label="Nome comercial" id="nomeComercial">
                          <Input
                            id="nomeComercial"
                            value={negocio.nomeComercial}
                            onChange={(evento) => setNegocio({ ...negocio, nomeComercial: evento.target.value })}
                            required
                          />
                        </Campo>
                        <Campo label="Segmento" id="segmento">
                          <Input
                            id="segmento"
                            value={negocio.segmento}
                            onChange={(evento) => setNegocio({ ...negocio, segmento: evento.target.value })}
                            placeholder="Moda, alimentação, serviços..."
                            required
                          />
                        </Campo>
                        <Campo label="WhatsApp oficial" id="whatsapp">
                          <Input
                            id="whatsapp"
                            value={negocio.whatsapp}
                            onChange={(evento) => setNegocio({ ...negocio, whatsapp: evento.target.value })}
                            inputMode="tel"
                          />
                        </Campo>
                        <Campo label="Email do negócio" id="emailNegocio">
                          <Input
                            id="emailNegocio"
                            type="email"
                            value={negocio.email}
                            onChange={(evento) => setNegocio({ ...negocio, email: evento.target.value })}
                          />
                        </Campo>
                        <Campo label="Província" id="provincia">
                          <Input
                            id="provincia"
                            value={negocio.provincia}
                            onChange={(evento) => setNegocio({ ...negocio, provincia: evento.target.value })}
                          />
                        </Campo>
                        <Campo label="Município" id="municipio">
                          <Input
                            id="municipio"
                            value={negocio.municipio}
                            onChange={(evento) => setNegocio({ ...negocio, municipio: evento.target.value })}
                          />
                        </Campo>
                      </div>
                    </section>

                    <section>
                      <div className="bizy-onboarding-v2-section-title">
                        <Store size={18} />
                        <div>
                          <strong>Operação inicial</strong>
                          <small>Activa apenas o que já usas hoje.</small>
                        </div>
                      </div>
                      <Selecao
                        titulo="Canais de venda"
                        itens={CANAIS_DISPONIVEIS}
                        activos={negocio.canaisVenda}
                        onToggle={(valor) => alternarLista("canaisVenda", valor)}
                      />
                      <Selecao
                        titulo="Métodos de pagamento"
                        itens={PAGAMENTOS_DISPONIVEIS}
                        activos={negocio.metodosPagamento}
                        onToggle={(valor) => alternarLista("metodosPagamento", valor)}
                      />
                    </section>
                  </div>

                  <Feedback mensagem={mensagem} erro={erro} />

                  <div className="bizy-onboarding-v2-actions">
                    <Button variant="outline" type="button" onClick={() => setPasso("perfil")} className="bizy-btn">
                      <ArrowLeft size={16} />
                      Rever funções
                    </Button>
                    <Button
                      type="submit"
                      disabled={salvando || !negocio.nomeComercial.trim() || !negocio.segmento.trim()}
                      className="bizy-btn bizy-btn-primary"
                    >
                      {salvando ? <Loader2 className="animate-spin" size={16} /> : <Building2 size={16} />}
                      Guardar negócio
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="pronto"
                  initial={reduzirMovimento ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <CabecalhoPasso
                    etiqueta="Conta configurada"
                    titulo="A tua Conta Bizy está pronta."
                    descricao="Os serviços abaixo usam a mesma identidade e respeitam os contextos que escolheste."
                  />

                  <div className="bizy-onboarding-v2-success">
                    <span><CheckCircle2 size={24} /></span>
                    <div>
                      <strong>{estado?.negocio?.nomeComercial ?? usuario?.nome ?? "Conta Bizy"}</strong>
                      <p>
                        {estado?.negocio
                          ? `${estado.negocio.segmento} · ${estado.negocio.provincia ?? "Angola"}`
                          : "Perfil pessoal sem negócio obrigatório."}
                      </p>
                    </div>
                  </div>

                  <div className="bizy-onboarding-v2-destinations">
                    {contextosSelecionados.includes("SELLER") ||
                    contextosSelecionados.includes("MEMBRO_NEGOCIO") ? (
                      <Destino
                        icone={UsersRound}
                        titulo="Bizy Team"
                        texto="Operação, equipa, clientes, pedidos e finanças."
                        href="/app"
                      />
                    ) : null}
                    {contextosSelecionados.includes("COMPRADOR") ||
                    contextosSelecionados.includes("SELLER") ? (
                      <Destino
                        icone={ShoppingBag}
                        titulo="Bizy Market"
                        texto="Compra, venda, favoritos e acompanhamento."
                        href="/conta"
                      />
                    ) : null}
                    {contextosSelecionados.includes("CRIADOR") ||
                    contextosSelecionados.includes("AFILIADO") ? (
                      <Destino
                        icone={Video}
                        titulo="Creator"
                        texto="Conteúdo, links, oportunidades e comissões."
                        href="/creator"
                      />
                    ) : null}
                    {estado?.perfilAcademico ||
                    contextosSelecionados.includes("PRODUTOR_LEARNING") ? (
                      <Destino
                        icone={GraduationCap}
                        titulo="Bizy Learning"
                        texto="Aprendizagem, produção e desenvolvimento."
                        href={contextosSelecionados.includes("PRODUTOR_LEARNING") ? "/app/learning/produtor" : "/learning"}
                      />
                    ) : null}
                  </div>

                  <Feedback mensagem={mensagem} erro={erro} />

                  <div className="bizy-onboarding-v2-actions">
                    <Button variant="outline" type="button" onClick={() => setPasso("perfil")} className="bizy-btn">
                      Ajustar funções
                    </Button>
                    {contextosSelecionados.includes("SELLER") ? (
                      <Button variant="outline" type="button" onClick={() => navigate("/app/loja")} className="bizy-btn">
                        <Store size={16} />
                        Abrir Bizy Studio
                      </Button>
                    ) : null}
                    <Button type="button" onClick={() => navigate(destinoFinal)} className="bizy-btn bizy-btn-primary">
                      Continuar
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>
      </div>
    </main>
  );
}

function CabecalhoPasso({
  etiqueta,
  titulo,
  descricao
}: {
  etiqueta: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <header className="bizy-onboarding-v2-heading">
      <span>{etiqueta}</span>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
    </header>
  );
}

function Campo({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="bizy-onboarding-v2-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Selecao({
  titulo,
  itens,
  activos,
  onToggle
}: {
  titulo: string;
  itens: string[];
  activos: string[];
  onToggle: (valor: string) => void;
}) {
  return (
    <div className="bizy-onboarding-v2-choice">
      <Label>{titulo}</Label>
      <div>
        {itens.map((item) => {
          const activo = activos.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={cn(activo && "is-active")}
              onClick={() => onToggle(item)}
              aria-pressed={activo}
            >
              {activo ? <Check size={13} /> : null}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Destino({
  icone: Icone,
  titulo,
  texto,
  href
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  href: string;
}) {
  return (
    <Link to={href} className="bizy-onboarding-v2-destination">
      <span><Icone size={19} /></span>
      <div>
        <strong>{titulo}</strong>
        <p>{texto}</p>
      </div>
      <ArrowRight size={16} />
    </Link>
  );
}

function Feedback({ mensagem, erro }: { mensagem: string; erro: string }) {
  if (!mensagem && !erro) return null;
  return (
    <div
      className="bizy-onboarding-v2-feedback"
      data-tone={erro ? "erro" : "info"}
      role={erro ? "alert" : "status"}
    >
      {erro || mensagem}
    </div>
  );
}
