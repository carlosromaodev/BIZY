import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Phone,
  ShieldCheck
} from "lucide-react";
import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthPage, AuthSeparator, GoogleIcon } from "@/components/ui/auth-page";
import { Badge } from "@/components/ui/badge";
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

const CLASSE_CAMPO_PUBLICO = "bizy-flow-input";
const CLASSE_BOTAO_CONTORNO_PUBLICO = "bizy-btn bizy-btn-outline";

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

export function PaginaLogin() {
  const navigate = useNavigate();
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

  const apiBase = obterBaseApiUrl();
  const rotuloIdentificador = tipoIdentificador === "username" && providerEstudantil === "uor"
    ? "Nome de utilizador"
    : "Número de estudante";
  const estaCriandoConta = fluxoIdentidade === "criar";
  const tituloPagina = estaCriandoConta ? "Criar conta Bizy" : "Entrar no Bizy";
  const descricaoPagina = estaCriandoConta
    ? "Abre o teu espaço operacional para vender por live, WhatsApp e catálogo."
    : "Acede ao teu painel para continuar atendimentos, reservas e pagamentos.";
  const tituloFormulario = estaCriandoConta ? "Criar conta operacional" : "Entrar na conta";
  const descricaoFormulario = estaCriandoConta
    ? "Vamos validar o teu contacto e preparar o cadastro do negócio em seguida."
    : "Usa o mesmo canal que já está ligado ao teu perfil Bizy.";
  const rotuloGmail = estaCriandoConta ? "Criar conta com Gmail" : "Entrar com Gmail";
  const rotuloTelefone = estaCriandoConta ? "Criar conta com telefone" : "Enviar código";
  const rotuloEstudantil = estaCriandoConta ? "Criar perfil com login estudantil" : "Entrar com login estudantil";
  const destinoAposAutenticacao = estaCriandoConta ? "/onboarding" : "/app";

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = parametros.get("bizy_token");
    const usuario = parseUsuarioHash(parametros.get("bizy_usuario"));
    const sessaoPorCookie = parametros.get("bizy_auth") === "cookie";
    const erro = parametros.get("bizy_erro");
    const destinoSolicitado = new URLSearchParams(window.location.search).get("pos_auth");
    const destinoHash = destinoSolicitado === "/app" ? "/app" : "/onboarding";
    let cancelado = false;

    if (sessaoPorCookie) {
      setCarregando(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      void requisitarApi<{ usuario: UsuarioSessao }>("/auth/sessao")
        .then((resposta) => {
          if (cancelado) return;
          guardarSessao(null, resposta.usuario);
          navigate(destinoHash, { replace: true });
        })
        .catch((falha) => {
          if (cancelado) return;
          setMensagem(falha instanceof Error ? falha.message : "Sessão Gmail inválida ou expirada.");
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
      setMensagem(erro);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    if (obterToken() || obterUsuario()) navigate("/app", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const intervalo = window.setInterval(() => {
      setSegundosRestantes((valor) => Math.max(valor - 1, 0));
    }, 1000);
    return () => window.clearInterval(intervalo);
  }, [segundosRestantes]);

  function alterarFluxoIdentidade(valor: FluxoIdentidade) {
    if (valor === fluxoIdentidade) return;
    setFluxoIdentidade(valor);
    setEtapaTelefone("telefone");
    setCodigo("");
    setCodigoDev(null);
    setSegundosRestantes(0);
    setMensagem("");
  }

  async function enviarCodigo() {
    const telefoneNormalizado = normalizarTelefoneFormulario(telefone);
    if (!telefoneNormalizado) {
      setMensagem("Informe um número móvel angolano válido, como 923456789.");
      return;
    }
    if (estaCriandoConta && nome.trim().length < 2) {
      setMensagem("Informe o teu nome para criarmos a conta operacional.");
      return;
    }

    setCarregando(true);
    setMensagem(estaCriandoConta ? "A criar acesso e enviar código..." : "A enviar código de acesso...");

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
      setMensagem(
        estaCriandoConta
          ? `Código enviado. Confirma para ativar a conta. Expira em ${resposta.minutosExpiracao} minutos.`
          : `Código enviado. Expira em ${resposta.minutosExpiracao} minutos.`
      );
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível enviar o código.");
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarCodigo(evento: FormEvent) {
    evento.preventDefault();
    await enviarCodigo();
  }

  async function confirmarCodigo(evento: FormEvent) {
    evento.preventDefault();
    const telefoneNormalizado = normalizarTelefoneFormulario(telefone);
    if (!telefoneNormalizado) {
      setMensagem("Telefone inválido. Volte e informe o número novamente.");
      return;
    }

    setCarregando(true);
    setMensagem("A validar código...");

    try {
      const resposta = await requisitarApi<{
        token: string;
        usuario: UsuarioSessao;
      }>("/auth/telefone/confirmar-codigo", {
        method: "POST",
        body: { telefone: telefoneNormalizado, codigo }
      }, false);

      guardarSessao(resposta.token, resposta.usuario);
      navigate(destinoAposAutenticacao, { replace: true });
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Código inválido.");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarEstudante(evento: FormEvent) {
    evento.preventDefault();
    const identificadorNormalizado =
      tipoIdentificador === "username" && providerEstudantil === "uor"
        ? identificador.trim()
        : identificador.replace(/\D/g, "");

    if (!identificadorNormalizado) {
      setMensagem("Informe o número de estudante ou nome de utilizador.");
      return;
    }

    setCarregando(true);
    setMensagem(estaCriandoConta ? "A criar perfil com a conta académica..." : "A validar a conta académica pelo UOR Connect...");

    try {
      const resposta = await requisitarApi<{
        token: string;
        usuario: UsuarioSessao;
      }>("/auth/estudantil/login", {
        method: "POST",
        body: {
          provider: providerEstudantil,
          identificador: identificadorNormalizado,
          tipoIdentificador: providerEstudantil === "isptec" ? "studentNumber" : tipoIdentificador,
          palavraPasse
        }
      }, false);

      guardarSessao(resposta.token, resposta.usuario);
      navigate(destinoAposAutenticacao, { replace: true });
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível validar o login estudantil.");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGmail() {
    setCarregando(true);
    setMensagem(estaCriandoConta ? "A preparar criação de conta com Gmail..." : "A verificar configuração do Gmail...");

    try {
      const status = await requisitarApi<{ configurado: boolean; mensagem: string }>("/auth/google/status", {}, false);
      if (!status.configurado) {
        setMensagem(status.mensagem);
        return;
      }

      const redirectGoogle = `/login?pos_auth=${encodeURIComponent(destinoAposAutenticacao)}`;
      window.location.href = `${apiBase}/auth/google/iniciar?redirect=${encodeURIComponent(redirectGoogle)}`;
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível iniciar login com Gmail.");
    } finally {
      setCarregando(false);
    }
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
    navigate("/onboarding", { replace: true });
  }

  return (
    <AuthPage
      brand={<LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />}
      title={tituloPagina}
      description={descricaoPagina}
      visualImage="/bizy-live-commerce-hero.png"
      visualImageAlt="Vendedora em live commerce apresentando roupa no estúdio da loja"
      homeAction={(
        <Button asChild variant="ghost" className="bizy-auth-home-link">
          <Link to="/" style={{ color: "inherit" }}>
            <ArrowLeft />
            Home
          </Link>
        </Button>
      )}
    >
      <div className="bizy-auth-card">
        <div className="bizy-segment" aria-label="Modo de acesso Bizy">
          {([
            ["criar", "Criar conta"],
            ["entrar", "Entrar"]
          ] as const).map(([valor, rotulo]) => (
            <Button
              key={valor}
              type="button"
              variant="ghost"
              className={cn(
                "bizy-segment-option",
                fluxoIdentidade === valor ? "is-active" : ""
              )}
              onClick={() => alterarFluxoIdentidade(valor)}
              aria-pressed={fluxoIdentidade === valor}
            >
              {rotulo}
            </Button>
          ))}
        </div>

        <div className="bizy-auth-card-head">
          <Badge className="bizy-soft-badge" variant="outline">
            Acesso seguro
          </Badge>
          <div>
            <div>
              <h2>{tituloFormulario}</h2>
              <p>
                {descricaoFormulario}
              </p>
            </div>
            <ShieldCheck size={24} />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="bizy-oauth-button"
          onClick={() => void entrarComGmail()}
          disabled={carregando}
        >
          <span className="inline-flex items-center gap-2">
            <GoogleIcon className="size-4" />
            {rotuloGmail}
          </span>
          {carregando ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
        </Button>

        <AuthSeparator label="OU COM" />

        <AnimatedTabs value={modo} onValueChange={(valor) => setModo(valor as ModoLogin)} className="gap-3">
          <TabsList
            className="bizy-method-toggle"
            style={{
              "--animated-tabs-active-bg": "#ffffff",
              "--animated-tabs-active-ring": "rgb(14 140 104 / 0.12)"
            } as CSSProperties}
          >
            <TabsTrigger value="telefone" className="bizy-method-trigger">
              <Phone />
              Telefone
            </TabsTrigger>
            <TabsTrigger value="estudante" className="bizy-method-trigger">
              <GraduationCap />
              Estudante
            </TabsTrigger>
          </TabsList>

          <TabsContents className="bizy-tabs-content">
            <TabsContent value="telefone" className="mt-0">
              {etapaTelefone === "telefone" ? (
                <form onSubmit={solicitarCodigo} className="grid gap-4">
                  {estaCriandoConta ? (
                    <div className="grid gap-2">
                      <Label htmlFor="nomeLogin">Nome do vendedor</Label>
                      <Input id="nomeLogin" className={CLASSE_CAMPO_PUBLICO} value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label htmlFor="telefoneLogin">Telefone</Label>
                    <Input
                      className={CLASSE_CAMPO_PUBLICO}
                      id="telefoneLogin"
                      inputMode="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="923456789"
                    />
                  </div>
                  <Button className="bizy-btn bizy-btn-primary w-full" size="lg" disabled={carregando}>
                    {carregando ? <Loader2 className="animate-spin" /> : <KeyRound />}
                    {carregando ? "A enviar..." : rotuloTelefone}
                  </Button>
                </form>
              ) : (
                <form onSubmit={confirmarCodigo} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="codigoLogin">Código</Label>
                    <Input
                      className={CLASSE_CAMPO_PUBLICO}
                      id="codigoLogin"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="000000"
                    />
                  </div>
                  {codigoDev ? (
                    <div className="bizy-inline-note">
                      Código em modo dev: <strong>{codigoDev}</strong>
                    </div>
                  ) : null}
                  {segundosRestantes > 0 && (
                    <div className="bizy-inline-note">
                      Reenvio disponível em {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, "0")}
                    </div>
                  )}
                  <Button className="bizy-btn bizy-btn-primary w-full" size="lg" disabled={carregando || codigo.trim().length < 4}>
                    {carregando ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    {carregando ? "A validar..." : "Validar e continuar"}
                  </Button>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" className={CLASSE_BOTAO_CONTORNO_PUBLICO} onClick={() => void enviarCodigo()} disabled={carregando || segundosRestantes > 0}>
                      Reenviar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={CLASSE_BOTAO_CONTORNO_PUBLICO}
                      onClick={() => {
                        setEtapaTelefone("telefone");
                        setCodigo("");
                        setCodigoDev(null);
                        setSegundosRestantes(0);
                      }}
                    >
                      Alterar telefone
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="estudante" className="mt-0">
              <form onSubmit={entrarEstudante} className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {(["uor", "isptec"] as const).map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="ghost"
                      className={cn(
                        "bizy-choice-button",
                        providerEstudantil === provider ? "is-active" : ""
                      )}
                      onClick={() => {
                        setProviderEstudantil(provider);
                        setTipoIdentificador("studentNumber");
                        setIdentificador("");
                      }}
                      aria-pressed={providerEstudantil === provider}
                    >
                      {provider === "uor" ? "UOR" : "ISPTEC"}
                    </Button>
                  ))}
                </div>

                {providerEstudantil === "uor" ? (
                  <div className="bizy-segment">
                    {([
                      ["studentNumber", "Número"],
                      ["username", "Username"]
                    ] as const).map(([valor, rotulo]) => (
                      <Button
                        key={valor}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "bizy-segment-option",
                          tipoIdentificador === valor ? "is-active" : ""
                        )}
                        onClick={() => {
                          setTipoIdentificador(valor);
                          setIdentificador("");
                        }}
                        aria-pressed={tipoIdentificador === valor}
                      >
                        {rotulo}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="identificadorEstudante">{rotuloIdentificador}</Label>
                  <Input
                    className={CLASSE_CAMPO_PUBLICO}
                    id="identificadorEstudante"
                    autoComplete="username"
                    inputMode={tipoIdentificador === "username" && providerEstudantil === "uor" ? "text" : "numeric"}
                    value={identificador}
                    onChange={(e) =>
                      setIdentificador(
                        tipoIdentificador === "username" && providerEstudantil === "uor"
                          ? e.target.value.slice(0, 40)
                          : e.target.value.replace(/\D/g, "").slice(0, 12)
                      )
                    }
                    placeholder={tipoIdentificador === "username" ? "ex: carlosromaodev" : "ex: 20243454"}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="palavraPasseEstudante">Palavra-passe académica</Label>
                  <div className="relative">
                    <Input
                      id="palavraPasseEstudante"
                      type={mostrarPasse ? "text" : "password"}
                      autoComplete="current-password"
                      value={palavraPasse}
                      onChange={(e) => setPalavraPasse(e.target.value)}
                      className={cn(CLASSE_CAMPO_PUBLICO, "pr-11")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-lg text-[var(--bizy-ink-3)] transition-colors hover:bg-[var(--bizy-cream)] hover:text-[var(--bizy-ink)]"
                      onClick={() => setMostrarPasse((valor) => !valor)}
                      aria-label={mostrarPasse ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    >
                      {mostrarPasse ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <Button className="bizy-btn bizy-btn-primary w-full" size="lg" disabled={carregando || !identificador || !palavraPasse}>
                  {carregando ? <Loader2 className="animate-spin" /> : <GraduationCap />}
                  {carregando ? "A validar..." : rotuloEstudantil}
                </Button>
              </form>
            </TabsContent>
          </TabsContents>
        </AnimatedTabs>

        <button type="button" className="bizy-testmode" onClick={entrarModoTeste}>
          <span><Bolt size={15} /></span>
          <b>Só queres espreitar?</b>
          <small>Entrar em modo teste sem SMS nem Gmail.</small>
          <strong>Entrar</strong>
        </button>

        <div className="bizy-trust-row">
          <span><ShieldCheck size={13} />Dados encriptados</span>
          <span><KeyRound size={13} />Pronto em 2 min</span>
        </div>

        {mensagem ? (
          <Alert className="bizy-auth-alert">
            <AlertDescription className="text-sm leading-6">{mensagem}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </AuthPage>
  );
}
