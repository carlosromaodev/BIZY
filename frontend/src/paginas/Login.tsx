import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Landmark,
  Loader2,
  Phone,
  ShieldCheck,
  ShoppingBag,
  UsersRound
} from "lucide-react";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  guardarSessao,
  obterBaseApiUrl,
  obterToken,
  obterUsuario,
  requisitarApi,
  type UsuarioSessao
} from "../api";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy, NOME_PRODUTO } from "../marca/bizy";
import { ROTAS_LOJAS } from "../lojas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Component as AnimatedTabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger
} from "@/components/ui/animated-tabs";
import { cn } from "@/lib/utils";

type ModoLogin = "telefone" | "estudante";
type FluxoIdentidade = "criar" | "entrar";
type ProviderEstudantil = "uor" | "isptec";
type TipoIdentificador = "studentNumber" | "username";
type TomMensagem = "info" | "sucesso" | "erro";

interface DisponibilidadeAutenticacao {
  versao: number;
  metodos: {
    telefone: { disponivel: boolean; canal: "SMS" };
    google: { disponivel: boolean };
    estudante: {
      disponivel: boolean;
      configurado?: boolean;
      estado?: "DISPONIVEL" | "NAO_CONFIGURADO";
      modo?: "DIRETO" | "UOR_CONNECT" | "DESENVOLVIMENTO" | "INDISPONIVEL";
      providers: ProviderEstudantil[];
      instituicoes?: Array<{
        provider: ProviderEstudantil;
        nome: string;
        identificadores: TipoIdentificador[];
      }>;
      mensagem?: string;
    };
  };
  modoTeste: boolean;
}

const CLASSE_CAMPO = "bizy-flow-input";
const INSTITUICOES: Record<ProviderEstudantil, {
  sigla: string;
  nome: string;
  portal: string;
  descricao: string;
  exemplo: string;
}> = {
  uor: {
    sigla: "UOR",
    nome: "Universidade Óscar Ribas",
    portal: "Secretaria UOR",
    descricao: "Usa as mesmas credenciais da Secretaria Académica.",
    exemplo: "20243454"
  },
  isptec: {
    sigla: "ISPTEC",
    nome: "Instituto Superior Politécnico de Tecnologias e Ciências",
    portal: "Portal Académico ISPTEC",
    descricao: "Validação directa no portal académico do ISPTEC.",
    exemplo: "20200227"
  }
};

function normalizarTelefoneFormulario(valor: string): string | null {
  const digitos = valor.replace(/\D/g, "");
  const semIndicativo = digitos.startsWith("00244")
    ? digitos.slice(5)
    : digitos.startsWith("244")
      ? digitos.slice(3)
      : digitos;
  return /^(91|92|93|94|95|99)\d{7}$/.test(semIndicativo) ? semIndicativo : null;
}

function parseUsuarioHash(valor: string | null): UsuarioSessao | null {
  if (!valor) return null;
  try {
    return JSON.parse(valor) as UsuarioSessao;
  } catch {
    return null;
  }
}

function destinoInternoSeguro(valor: string | null): string | null {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return null;
  try {
    const url = new URL(valor, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12.479 14.265v-3.279h11.049c.108.571.164 1.247.164 1.979 0 2.46-.672 5.502-2.84 7.669C18.744 22.829 16.051 24 12.483 24 5.869 24 .308 18.613.308 12S5.869 0 12.483 0c3.659 0 6.265 1.436 8.223 3.307L18.392 5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65 3.279 3.873 7.171 3.873 12s3.777 8.721 8.606 8.721c3.132 0 4.916-1.258 6.059-2.401.927-.927 1.537-2.251 1.777-4.059l-7.836.004z" />
  </svg>
);

export function PaginaLogin() {
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [fluxoIdentidade, setFluxoIdentidade] = useState<FluxoIdentidade>("criar");
  const [modo, setModo] = useState<ModoLogin>("telefone");
  const [telefone, setTelefone] = useState(import.meta.env.DEV ? "923456789" : "");
  const [nome, setNome] = useState(import.meta.env.DEV ? `Vendedor ${NOME_PRODUTO}` : "");
  const [codigo, setCodigo] = useState("");
  const [codigoDev, setCodigoDev] = useState<string | null>(null);
  const [etapaTelefone, setEtapaTelefone] = useState<"telefone" | "codigo">("telefone");
  const [providerEstudantil, setProviderEstudantil] = useState<ProviderEstudantil>("uor");
  const [tipoIdentificador, setTipoIdentificador] = useState<TipoIdentificador>("studentNumber");
  const [identificador, setIdentificador] = useState("");
  const [palavraPasse, setPalavraPasse] = useState("");
  const [mostrarPasse, setMostrarPasse] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [tomMensagem, setTomMensagem] = useState<TomMensagem>("info");
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeAutenticacao | null>(null);
  const [carregandoDisponibilidade, setCarregandoDisponibilidade] = useState(true);
  const [tentativaDisponibilidade, setTentativaDisponibilidade] = useState(0);

  const apiBase = obterBaseApiUrl();
  const parametrosEntrada = new URLSearchParams(window.location.search);
  const superficie = parametrosEntrada.get("surface");
  const returnTo = destinoInternoSeguro(parametrosEntrada.get("returnTo") ?? parametrosEntrada.get("pos_auth"));
  const entradaPessoal =
    superficie === "market" ||
    superficie === "creator" ||
    Boolean(returnTo?.startsWith("/conta") || returnTo?.startsWith("/creator") || returnTo?.startsWith("/checkout"));
  const estaCriandoConta = fluxoIdentidade === "criar";
  const destinoAposAutenticacao = returnTo ?? (entradaPessoal ? "/conta" : estaCriandoConta ? "/onboarding" : "/app");
  const tituloFormulario = entradaPessoal
    ? "Acede à tua Conta Bizy"
    : estaCriandoConta
      ? "Cria a tua Conta Bizy"
      : "Bem-vindo de volta";
  const descricaoFormulario = entradaPessoal
    ? "Uma identidade segura para compras, creators e serviços Bizy."
    : estaCriandoConta
      ? "A mesma conta liga Team, Market e Learning sem palavras-passe."
      : "Continua para o teu espaço de trabalho e para os serviços ligados à tua conta.";
  const providersEstudantis = disponibilidade?.metodos.estudante.providers.length
    ? disponibilidade.metodos.estudante.providers
    : (["uor", "isptec"] as ProviderEstudantil[]);
  const telefoneDisponivel = disponibilidade?.metodos.telefone.disponivel === true;
  const googleDisponivel = disponibilidade?.metodos.google.disponivel === true;
  const estudanteDisponivel =
    disponibilidade?.metodos.estudante.disponivel === true &&
    providersEstudantis.length > 0;
  const mensagemEstudante =
    disponibilidade?.metodos.estudante.mensagem ??
    "O acesso académico continua disponível no Bizy, mas o provider institucional não respondeu.";
  const algumMetodoDisponivel = telefoneDisponivel || estudanteDisponivel || googleDisponivel;
  const mostrarModoTeste =
    import.meta.env.DEV &&
    disponibilidade?.modoTeste === true;
  const rotuloIdentificador =
    tipoIdentificador === "username" && providerEstudantil === "uor"
      ? "Nome de utilizador"
      : "Número de estudante";
  const rotuloGmail = estaCriandoConta ? "Continuar com Gmail" : "Entrar com Gmail";
  const instituicaoActiva = INSTITUICOES[providerEstudantil];
  const rotuloEstudantil = `${estaCriandoConta ? "Criar conta com" : "Entrar com"} ${instituicaoActiva.sigla}`;
  const modoAcademico = disponibilidade?.metodos.estudante.modo;

  function mostrarMensagem(texto: string, tom: TomMensagem = "info") {
    setMensagem(texto);
    setTomMensagem(tom);
  }

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = parametros.get("bizy_token");
    const usuario = parseUsuarioHash(parametros.get("bizy_usuario"));
    const sessaoPorCookie = parametros.get("bizy_auth") === "cookie";
    const erro = parametros.get("bizy_erro");
    const parametrosUrl = new URLSearchParams(window.location.search);
    const destinoHash =
      destinoInternoSeguro(parametrosUrl.get("returnTo") ?? parametrosUrl.get("pos_auth")) ??
      (parametrosUrl.get("surface") === "market" || parametrosUrl.get("surface") === "creator"
        ? "/conta"
        : "/app");
    let cancelado = false;

    if (sessaoPorCookie) {
      setCarregando(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      void requisitarApi<{ usuario: UsuarioSessao }>("/auth/sessao")
        .then((resposta) => {
          if (!cancelado) {
            guardarSessao(null, resposta.usuario);
            navigate(destinoHash, { replace: true });
          }
        })
        .catch((falha) => {
          if (!cancelado) mostrarMensagem(
            falha instanceof Error ? falha.message : "Sessão Gmail inválida ou expirada.",
            "erro"
          );
        })
        .finally(() => {
          if (!cancelado) setCarregando(false);
        });
      return () => {
        cancelado = true;
      };
    }

    if (token && usuario) {
      guardarSessao(token, usuario);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      navigate(destinoHash, { replace: true });
      return;
    }

    if (erro) {
      mostrarMensagem(erro, "erro");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    if (obterToken() || obterUsuario()) navigate(destinoHash, { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelado = false;
    setCarregandoDisponibilidade(true);

    void requisitarApi<DisponibilidadeAutenticacao>("/auth/disponibilidade", {}, false)
      .then((resposta) => {
        if (cancelado) return;
        setDisponibilidade(resposta);
        if (!resposta.metodos.telefone.disponivel && resposta.metodos.estudante.disponivel) {
          setModo("estudante");
        }
        const primeiroProvider = resposta.metodos.estudante.providers[0];
        if (primeiroProvider) {
          setProviderEstudantil((providerActual) =>
            resposta.metodos.estudante.providers.includes(providerActual)
              ? providerActual
              : primeiroProvider
          );
        }
      })
      .catch((erro) => {
        if (cancelado) return;
        setDisponibilidade(null);
        mostrarMensagem(
          erro instanceof Error ? erro.message : "Não foi possível confirmar os métodos de acesso.",
          "erro"
        );
      })
      .finally(() => {
        if (!cancelado) setCarregandoDisponibilidade(false);
      });

    return () => {
      cancelado = true;
    };
  }, [tentativaDisponibilidade]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const id = window.setInterval(
      () => setSegundosRestantes((valor) => Math.max(valor - 1, 0)),
      1000
    );
    return () => window.clearInterval(id);
  }, [segundosRestantes]);

  function alterarFluxo(valor: FluxoIdentidade) {
    if (valor === fluxoIdentidade) return;
    setFluxoIdentidade(valor);
    setEtapaTelefone("telefone");
    setCodigo("");
    setCodigoDev(null);
    setSegundosRestantes(0);
    setMensagem("");
  }

  async function enviarCodigo() {
    if (!telefoneDisponivel) {
      mostrarMensagem("O acesso por SMS está temporariamente indisponível.", "erro");
      return;
    }

    const telefoneNormalizado = normalizarTelefoneFormulario(telefone);
    if (!telefoneNormalizado) {
      mostrarMensagem("Informe um número móvel angolano válido, como 923456789.", "erro");
      return;
    }
    if (estaCriandoConta && nome.trim().length < 2) {
      mostrarMensagem("Informe o teu nome para criarmos a conta.", "erro");
      return;
    }

    setCarregando(true);
    mostrarMensagem("A enviar o código de acesso...");
    try {
      const resposta = await requisitarApi<{
        sucesso: boolean;
        codigoDev?: string;
        codigoFinal: string;
        minutosExpiracao: number;
      }>("/auth/telefone/solicitar-codigo", {
        method: "POST",
        body: {
          telefone: telefoneNormalizado,
          ...(estaCriandoConta ? { nome: nome.trim() } : {})
        }
      }, false);

      setTelefone(telefoneNormalizado);
      setEtapaTelefone("codigo");
      setCodigo("");
      setCodigoDev(resposta.codigoDev ?? null);
      setSegundosRestantes(resposta.minutosExpiracao * 60);
      mostrarMensagem(`Código enviado. Expira em ${resposta.minutosExpiracao} minutos.`, "sucesso");
    } catch (erro) {
      mostrarMensagem(
        erro instanceof Error ? erro.message : "Não foi possível enviar o código.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    const telefoneNormalizado = normalizarTelefoneFormulario(telefone);
    if (!telefoneNormalizado) {
      mostrarMensagem("Telefone inválido.", "erro");
      return;
    }

    setCarregando(true);
    mostrarMensagem("A validar o código...");
    try {
      const resposta = await requisitarApi<{ token: string; usuario: UsuarioSessao }>(
        "/auth/telefone/confirmar-codigo",
        {
          method: "POST",
          body: { telefone: telefoneNormalizado, codigo }
        },
        false
      );
      guardarSessao(resposta.token, resposta.usuario);
      navigate(destinoAposAutenticacao, { replace: true });
    } catch (erro) {
      mostrarMensagem(erro instanceof Error ? erro.message : "Código inválido.", "erro");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarEstudante(evento: FormEvent) {
    evento.preventDefault();
    if (!estudanteDisponivel) {
      mostrarMensagem("O acesso estudantil está temporariamente indisponível.", "erro");
      return;
    }

    const id =
      tipoIdentificador === "username" && providerEstudantil === "uor"
        ? identificador.trim()
        : identificador.replace(/\D/g, "");
    if (!id) {
      mostrarMensagem("Informe o número de estudante ou nome de utilizador.", "erro");
      return;
    }

    setCarregando(true);
    mostrarMensagem("A validar a conta académica...");
    try {
      const resposta = await requisitarApi<{ token: string; usuario: UsuarioSessao }>(
        "/auth/estudantil/login",
        {
          method: "POST",
          body: {
            provider: providerEstudantil,
            identificador: id,
            tipoIdentificador:
              providerEstudantil === "isptec" ? "studentNumber" : tipoIdentificador,
            palavraPasse
          }
        },
        false
      );
      guardarSessao(resposta.token, resposta.usuario);
      navigate(destinoAposAutenticacao, { replace: true });
    } catch (erro) {
      mostrarMensagem(
        erro instanceof Error ? erro.message : "Não foi possível validar o login estudantil.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  function entrarComGmail() {
    if (!googleDisponivel) {
      mostrarMensagem("O acesso com Gmail está temporariamente indisponível.", "erro");
      return;
    }

    setCarregando(true);
    mostrarMensagem("A abrir o acesso seguro do Google...");
    window.location.href = `${apiBase}/auth/google/iniciar?redirect=${encodeURIComponent(
      `/login?pos_auth=${encodeURIComponent(destinoAposAutenticacao)}`
    )}`;
  }

  function entrarModoTeste() {
    guardarSessao(null, {
      id: "usuario-teste-bizy",
      nome: nome.trim() || `Vendedor ${NOME_PRODUTO}`,
      telefone: normalizarTelefoneFormulario(telefone) ?? "923456789",
      email: "teste@bizy.local",
      papel: "ADMIN",
      origemCadastro: "Modo teste",
      perfilCompletoEm: null
    });
    navigate(destinoAposAutenticacao, { replace: true });
  }

  const formularioTelefone = (
    <div className="bizy-auth-phone-flow">
      {!telefoneDisponivel && !carregandoDisponibilidade ? (
        <div className="bizy-auth-method-status" role="status">
          <Phone size={18} />
          <div>
            <strong>Acesso por SMS indisponível</strong>
            <p>O serviço de mensagens não está pronto neste momento. Podes usar outro método ou tentar novamente.</p>
          </div>
        </div>
      ) : null}

      <ol className="bizy-auth-steps" aria-label="Etapas do acesso por SMS">
        <li className={etapaTelefone === "telefone" ? "is-active" : "is-complete"}>
          <span>1</span>
          Contacto
        </li>
        <li className={etapaTelefone === "codigo" ? "is-active" : ""}>
          <span>2</span>
          Código
        </li>
      </ol>

      <AnimatePresence mode="wait">
        {etapaTelefone === "telefone" ? (
          <motion.form
            key="telefone"
            onSubmit={(evento: FormEvent) => {
              evento.preventDefault();
              void enviarCodigo();
            }}
            className="bizy-auth-fields"
            initial={reduzirMovimento ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            {estaCriandoConta && (
              <div className="bizy-auth-field">
                <Label htmlFor="nomeLogin">Nome</Label>
                <Input
                  id="nomeLogin"
                  name="name"
                  autoComplete="name"
                  className={CLASSE_CAMPO}
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                  placeholder="O teu nome"
                />
              </div>
            )}

            <div className="bizy-auth-field">
              <Label htmlFor="telefoneLogin">Telefone</Label>
              <div className="bizy-auth-tel-wrap">
                <span className="bizy-auth-tel-prefix" aria-hidden="true">+244</span>
                <Input
                  className={cn(CLASSE_CAMPO, "bizy-auth-tel-input")}
                  id="telefoneLogin"
                  name="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  value={telefone}
                  onChange={(evento) => setTelefone(evento.target.value)}
                  placeholder="923 456 789"
                />
              </div>
            </div>

            <Button
              className="bizy-btn bizy-btn-primary bizy-auth-submit"
              size="lg"
              disabled={carregando || !telefoneDisponivel}
            >
              {carregando ? <Loader2 className="animate-spin" size={16} /> : <Phone size={16} />}
              {carregando ? "A enviar..." : "Continuar por SMS"}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="codigo"
            onSubmit={confirmarCodigo}
            className="bizy-auth-fields"
            initial={reduzirMovimento ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            <div className="bizy-auth-code-context">
              <span>Código enviado para</span>
              <strong>+244 {telefone}</strong>
            </div>
            <div className="bizy-auth-field">
              <Label htmlFor="codigoLogin">Código de verificação</Label>
              <Input
                className={cn(CLASSE_CAMPO, "bizy-auth-code-input")}
                id="codigoLogin"
                name="one-time-code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
              />
            </div>
            {codigoDev && (
              <div className="bizy-inline-note">
                Código de desenvolvimento: <strong>{codigoDev}</strong>
              </div>
            )}
            {segundosRestantes > 0 && (
              <div className="bizy-auth-countdown">
                Expira em {Math.floor(segundosRestantes / 60)}:
                {String(segundosRestantes % 60).padStart(2, "0")}
              </div>
            )}
            <Button
              className="bizy-btn bizy-btn-primary bizy-auth-submit"
              size="lg"
              disabled={carregando || codigo.trim().length !== 6}
            >
              {carregando ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              {carregando ? "A validar..." : "Validar e continuar"}
            </Button>
            <div className="bizy-auth-secondary-actions">
              <button
                type="button"
                className="bizy-auth-link-btn"
                onClick={() => void enviarCodigo()}
                disabled={carregando || segundosRestantes > 0}
              >
                Reenviar código
              </button>
              <span className="bizy-auth-dot" />
              <button
                type="button"
                className="bizy-auth-link-btn"
                onClick={() => {
                  setEtapaTelefone("telefone");
                  setCodigo("");
                  setCodigoDev(null);
                  setSegundosRestantes(0);
                }}
              >
                Alterar telefone
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );

  const formularioEstudantil = (
    <form
      onSubmit={entrarEstudante}
      className="bizy-auth-fields bizy-academic-form"
      data-provider={providerEstudantil}
    >
      {!estudanteDisponivel && !carregandoDisponibilidade ? (
        <div className="bizy-auth-method-status" role="status">
          <GraduationCap size={18} />
          <div>
            <strong>Acesso académico indisponível</strong>
            <p>{mensagemEstudante}</p>
          </div>
          <button
            type="button"
            onClick={() => setTentativaDisponibilidade((valor) => valor + 1)}
          >
            Verificar novamente
          </button>
        </div>
      ) : null}

      <div className="bizy-academic-intro">
        <span className="bizy-academic-seal" aria-hidden="true">{instituicaoActiva.sigla.slice(0, 1)}</span>
        <div>
          <span>Acesso institucional</span>
          <strong>{instituicaoActiva.nome}</strong>
          <p>{instituicaoActiva.descricao}</p>
        </div>
        {estudanteDisponivel ? (
          <span className="bizy-academic-live">
            <BadgeCheck size={15} />
            {modoAcademico === "DIRETO" ? "Ligação directa" : "Ligação verificada"}
          </span>
        ) : null}
      </div>

      {providersEstudantis.length > 1 ? (
        <div className="bizy-academic-providers" aria-label="Instituição académica">
          {providersEstudantis.map((provider) => {
            const instituicao = INSTITUICOES[provider];
            const activo = providerEstudantil === provider;
            return (
              <button
                key={provider}
                type="button"
                className={cn("bizy-academic-provider", activo ? "is-active" : "")}
                data-provider={provider}
                onClick={() => {
                  setProviderEstudantil(provider);
                  setTipoIdentificador("studentNumber");
                  setIdentificador("");
                  setPalavraPasse("");
                  setMensagem("");
                }}
                aria-pressed={activo}
              >
                <span aria-hidden="true">{instituicao.sigla.slice(0, 1)}</span>
                <span>
                  <strong>{instituicao.sigla}</strong>
                  <small>{instituicao.portal}</small>
                </span>
                {activo ? <BadgeCheck size={17} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {providerEstudantil === "uor" && (
        <div className="bizy-academic-identifier" aria-label="Tipo de identificação">
          {([
            ["studentNumber", "Número de estudante"],
            ["username", "Nome de utilizador"]
          ] as const).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              className={tipoIdentificador === valor ? "is-active" : ""}
              onClick={() => {
                setTipoIdentificador(valor);
                setIdentificador("");
                setMensagem("");
              }}
              aria-pressed={tipoIdentificador === valor}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}

      <div className="bizy-academic-fields">
        <div className="bizy-auth-field">
          <Label htmlFor="idEstudante">{rotuloIdentificador}</Label>
          <Input
            className={CLASSE_CAMPO}
            id="idEstudante"
            autoComplete="username"
            inputMode={
              tipoIdentificador === "username" && providerEstudantil === "uor"
                ? "text"
                : "numeric"
            }
            value={identificador}
            disabled={!estudanteDisponivel}
            onChange={(evento) =>
              setIdentificador(
                tipoIdentificador === "username" && providerEstudantil === "uor"
                  ? evento.target.value.slice(0, 40)
                  : evento.target.value.replace(/\D/g, "").slice(0, 12)
              )
            }
            placeholder={tipoIdentificador === "username" ? "nome.utilizador" : instituicaoActiva.exemplo}
          />
        </div>

        <div className="bizy-auth-field">
          <Label htmlFor="passeEstudante">Palavra-passe institucional</Label>
          <div className="relative">
            <Input
              id="passeEstudante"
              type={mostrarPasse ? "text" : "password"}
              autoComplete="current-password"
              value={palavraPasse}
              disabled={!estudanteDisponivel}
              onChange={(evento) => setPalavraPasse(evento.target.value)}
              className={cn(CLASSE_CAMPO, "pr-11")}
              placeholder="A mesma usada no portal académico"
            />
            <button
              type="button"
              className="bizy-auth-eye-toggle"
              onClick={() => setMostrarPasse((valor) => !valor)}
              aria-label={mostrarPasse ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
              disabled={!estudanteDisponivel}
            >
              {mostrarPasse ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <Button
        className="bizy-btn bizy-btn-primary bizy-auth-submit"
        size="lg"
        disabled={carregando || !estudanteDisponivel || !identificador || !palavraPasse}
      >
        {carregando ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />}
        {carregando ? "A validar..." : rotuloEstudantil}
      </Button>
      <p className="bizy-academic-privacy">
        O Bizy valida a sessão no portal institucional. A palavra-passe não é guardada.
      </p>
    </form>
  );

  return (
    <main
      className="bizy-public bizy-auth bizy-auth-v3"
      data-method={modo}
      data-provider={providerEstudantil}
    >
      <aside className="bizy-auth-v3-visual">
        <header className="bizy-auth-v3-visual-header">
          <Link to="/" aria-label="Página inicial do Bizy">
            <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />
          </Link>
          <span>Conta universal</span>
        </header>
        <figure className="bizy-auth-v3-media">
          <img
            src="/bizy-login-team.webp"
            alt="Equipa Bizy a gerir comércio e conteúdos digitais"
            width={1672}
            height={941}
            decoding="async"
          />
        </figure>
        <div className="bizy-auth-v3-story">
          <span>Uma identidade para o ecossistema</span>
          <h1>Entra uma vez. Faz tudo no Bizy.</h1>
          <p>
            Compra no Market, gere o teu negócio no Team e desenvolve competências no Learning.
          </p>
          <div className="bizy-auth-v3-services" aria-label="Serviços ligados à Conta Bizy">
            <div><UsersRound size={18} /><span><strong>Team</strong><small>Operação e equipa</small></span></div>
            <div><ShoppingBag size={18} /><span><strong>Market</strong><small>Comprar e vender</small></span></div>
            <div><BookOpen size={18} /><span><strong>Learning</strong><small>Estudar e publicar</small></span></div>
          </div>
        </div>
        <footer className="bizy-auth-v3-visual-footer">
          <ShieldCheck size={16} />
          <span>Sessões revogáveis e dados protegidos</span>
        </footer>
      </aside>

      <section className="bizy-auth-v3-access">
        <header className="bizy-auth-v3-nav">
          <Link className="bizy-auth-v3-mobile-logo" to="/" aria-label="Página inicial do Bizy">
            <LogoBizy />
          </Link>
          <nav aria-label="Serviços Bizy">
            <a href={ROTAS_LOJAS.market}>Market</a>
            <Link to="/learning">Learning</Link>
          </nav>
          <Link className="bizy-auth-v3-back" to="/">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Link>
        </header>

        <div className="bizy-auth-v3-shell">
          <figure className="bizy-auth-v3-mobile-media">
            <img
              src="/bizy-login-team.webp"
              alt="Equipa Bizy em operação"
              width={1672}
              height={941}
              decoding="async"
            />
          </figure>
          <div className="bizy-auth-heading">
            <span className="bizy-auth-eyebrow">
              {modo === "estudante" ? "Acesso académico" : "Conta Bizy"}
            </span>
            <h2 id="titulo-login">{tituloFormulario}</h2>
            <p>{descricaoFormulario}</p>
          </div>

          <AnimatedTabs
            value={fluxoIdentidade}
            onValueChange={(valor) => alterarFluxo(valor as FluxoIdentidade)}
            className="bizy-auth-flow-tabs"
          >
            <TabsList
              className="bizy-auth-flow-list"
              style={{
                "--animated-tabs-active-bg": "#ffffff",
                "--animated-tabs-active-ring": "rgba(18, 32, 25, 0.12)"
              } as CSSProperties}
            >
              <TabsTrigger value="criar" className="bizy-auth-flow-trigger">Criar conta</TabsTrigger>
              <TabsTrigger value="entrar" className="bizy-auth-flow-trigger">Entrar</TabsTrigger>
            </TabsList>
            <TabsContents className="bizy-auth-flow-content-hidden">
              <TabsContent value="criar"><span /></TabsContent>
              <TabsContent value="entrar"><span /></TabsContent>
            </TabsContents>
          </AnimatedTabs>

          <div className="bizy-auth-form-content">
            {googleDisponivel ? (
              <>
                <button
                  type="button"
                  className="bizy-gmail-btn"
                  onClick={entrarComGmail}
                  disabled={carregando}
                >
                  <GoogleIcon className="bizy-gmail-icon" />
                  <span>{rotuloGmail}</span>
                  <ArrowRight size={15} className="bizy-gmail-arrow" />
                </button>
                <div className="bizy-auth-divider"><span>ou continua com</span></div>
              </>
            ) : null}

            <AnimatedTabs
              value={modo}
              onValueChange={(valor) => setModo(valor as ModoLogin)}
              className="bizy-auth-method-tabs"
            >
              <TabsList
                className="bizy-auth-method-list"
                style={{
                  "--animated-tabs-active-bg": "#ffffff",
                  "--animated-tabs-active-ring": "rgba(18, 32, 25, 0.14)"
                } as CSSProperties}
              >
                <TabsTrigger value="telefone" className="bizy-auth-method-trigger">
                  <Phone size={17} />
                  <span><strong>Telefone</strong><small>Código por SMS</small></span>
                </TabsTrigger>
                <TabsTrigger value="estudante" className="bizy-auth-method-trigger">
                  <GraduationCap size={17} />
                  <span><strong>Estudante</strong><small>Conta institucional</small></span>
                </TabsTrigger>
              </TabsList>
              <TabsContents className="bizy-auth-method-content">
                <TabsContent value="telefone" className="mt-0">{formularioTelefone}</TabsContent>
                <TabsContent value="estudante" className="mt-0">{formularioEstudantil}</TabsContent>
              </TabsContents>
            </AnimatedTabs>

            {carregandoDisponibilidade && !disponibilidade ? (
              <div className="bizy-auth-loading-methods" role="status">
                <Loader2 className="animate-spin" size={16} />
                A confirmar os métodos disponíveis
              </div>
            ) : null}

            {mensagem ? (
              <Alert
                className="bizy-auth-alert"
                data-tom={tomMensagem}
                role={tomMensagem === "erro" ? "alert" : "status"}
                aria-live="polite"
              >
                <AlertDescription className="text-sm leading-6">{mensagem}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <footer className="bizy-auth-card-footer">
            {mostrarModoTeste ? (
              <button type="button" className="bizy-testmode-link" onClick={entrarModoTeste}>
                Entrar em ambiente de desenvolvimento
              </button>
            ) : null}
            <div className="bizy-trust-row">
              <span><ShieldCheck size={13} />Sessão protegida</span>
              <span><KeyRound size={13} />Código de uso único</span>
            </div>
          </footer>

          {!algumMetodoDisponivel && !carregandoDisponibilidade ? (
            <p className="bizy-auth-service-note">
              Os métodos permanecem visíveis e reflectem o estado real comunicado pelo backend.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
