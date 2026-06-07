import {
  ArrowLeft,
  ArrowRight,
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
import { CLASSE_BOTAO_CONTORNO_ESCURO, CLASSE_CAMPO_ESCURO } from "../componentes/estilosFormularioEscuro";
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

  return (
    <AuthPage
      brand={<LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />}
      title={tituloPagina}
      description={descricaoPagina}
      visualImage="/bizy-live-commerce-hero.png"
      visualImageAlt="Vendedora em live commerce apresentando roupa no estúdio da loja"
      homeAction={(
        <Button asChild variant="ghost" className="w-fit text-white/82 hover:bg-white/10 hover:text-white">
          <Link to="/">
            <ArrowLeft />
            Home
          </Link>
        </Button>
      )}
    >
      <div className="grid gap-5 rounded-[1.75rem] border border-white/12 bg-[#050706]/76 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-black/30 p-1" aria-label="Modo de acesso Bizy">
          {([
            ["criar", "Criar conta"],
            ["entrar", "Entrar"]
          ] as const).map(([valor, rotulo]) => (
            <Button
              key={valor}
              type="button"
              variant="ghost"
              className={cn(
                "h-10 rounded-xl border border-transparent text-sm font-bold transition-all active:border-[#d8ff72]",
                fluxoIdentidade === valor
                  ? "bg-[#d8ff72] text-[#050706] shadow-[0_8px_22px_rgba(216,255,114,0.22)]"
                  : "text-white/66 hover:bg-white/6 hover:text-white"
              )}
              onClick={() => alterarFluxoIdentidade(valor)}
              aria-pressed={fluxoIdentidade === valor}
              style={
                fluxoIdentidade === valor
                  ? { backgroundColor: "#d8ff72", color: "#050706" }
                  : undefined
              }
            >
              {rotulo}
            </Button>
          ))}
        </div>

        <div className="grid gap-2">
          <Badge className="w-fit border border-white/12 bg-[#d8ff72]/12 text-[#d8ff72] hover:bg-[#d8ff72]/12" variant="outline">
            Acesso seguro
          </Badge>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-black !text-white">{tituloFormulario}</h2>
              <p className="mt-1 text-sm leading-6 !text-white/62">
                {descricaoFormulario}
              </p>
            </div>
            <ShieldCheck className="mt-1 text-[#d8ff72]" size={24} />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-12 justify-between rounded-2xl border-white/16 bg-[#d8ff72]/10 px-4 text-[#d8ff72] hover:border-white/28 hover:bg-[#d8ff72]/16 hover:text-[#d8ff72] active:border-[#d8ff72]"
          onClick={() => void entrarComGmail()}
          disabled={carregando}
        >
          <span className="inline-flex items-center gap-2">
            <GoogleIcon className="size-4" />
            {rotuloGmail}
          </span>
          {carregando ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
        </Button>

        <AuthSeparator />

        <AnimatedTabs value={modo} onValueChange={(valor) => setModo(valor as ModoLogin)} className="gap-3">
          <TabsList
            className="grid h-11 w-full grid-cols-2 rounded-2xl border border-white/12 bg-black/24 p-1"
            style={{
              "--animated-tabs-active-bg": "#d8ff72",
              "--animated-tabs-active-ring": "rgb(255 255 255 / 0.12)"
            } as CSSProperties}
          >
            <TabsTrigger value="telefone" className="h-9 rounded-xl text-white/70 data-[state=active]:text-[#050706]">
              <Phone />
              Telefone
            </TabsTrigger>
            <TabsTrigger value="estudante" className="h-9 rounded-xl text-white/70 data-[state=active]:text-[#050706]">
              <GraduationCap />
              Estudante
            </TabsTrigger>
          </TabsList>

          <TabsContents className="border-white/12 bg-black/20">
            <TabsContent value="telefone" className="mt-0">
              {etapaTelefone === "telefone" ? (
                <form onSubmit={solicitarCodigo} className="grid gap-4">
                  {estaCriandoConta ? (
                    <div className="grid gap-2">
                      <Label htmlFor="nomeLogin">Nome do vendedor</Label>
                      <Input id="nomeLogin" className={CLASSE_CAMPO_ESCURO} value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label htmlFor="telefoneLogin">Telefone</Label>
                    <Input
                      className={CLASSE_CAMPO_ESCURO}
                      id="telefoneLogin"
                      inputMode="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="923456789"
                    />
                  </div>
                  <Button className="h-11 rounded-2xl" size="lg" disabled={carregando}>
                    {carregando ? <Loader2 className="animate-spin" /> : <KeyRound />}
                    {carregando ? "A enviar..." : rotuloTelefone}
                  </Button>
                </form>
              ) : (
                <form onSubmit={confirmarCodigo} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="codigoLogin">Código</Label>
                    <Input
                      className={CLASSE_CAMPO_ESCURO}
                      id="codigoLogin"
                      inputMode="numeric"
                      maxLength={6}
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      placeholder="000000"
                    />
                  </div>
                  {codigoDev ? (
                    <div className="rounded-2xl border border-white/12 bg-[#d8ff72]/8 p-3 text-sm text-white/70">
                      Código em modo dev: <strong className="text-[#d8ff72]">{codigoDev}</strong>
                    </div>
                  ) : null}
                  {segundosRestantes > 0 && (
                    <div className="rounded-2xl border border-white/12 bg-black/20 p-3 text-sm text-white/68">
                      Reenvio disponível em {Math.floor(segundosRestantes / 60)}:{String(segundosRestantes % 60).padStart(2, "0")}
                    </div>
                  )}
                  <Button className="h-11 rounded-2xl" size="lg" disabled={carregando || codigo.trim().length < 4}>
                    {carregando ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    {carregando ? "A validar..." : "Validar e continuar"}
                  </Button>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" variant="outline" className={cn(CLASSE_BOTAO_CONTORNO_ESCURO, "h-10 rounded-xl")} onClick={() => void enviarCodigo()} disabled={carregando || segundosRestantes > 0}>
                      Reenviar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(CLASSE_BOTAO_CONTORNO_ESCURO, "h-10 rounded-xl")}
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
                        "h-11 rounded-2xl border px-3 text-sm font-bold transition-all active:border-[#d8ff72]",
                        providerEstudantil === provider
                          ? "shadow-sm"
                          : "border-white/12 bg-black/18 text-white/68 hover:border-white/24 hover:text-white"
                      )}
                      style={
                        providerEstudantil === provider
                          ? { backgroundColor: "#d8ff72", color: "#050706" }
                          : undefined
                      }
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
                  <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-black/20 p-1">
                    {([
                      ["studentNumber", "Número"],
                      ["username", "Username"]
                    ] as const).map(([valor, rotulo]) => (
                      <Button
                        key={valor}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 rounded-xl border border-transparent text-sm font-semibold transition-all active:border-[#d8ff72]",
                          tipoIdentificador === valor ? "bg-[#d8ff72] text-[#050706] shadow-sm" : "text-white/68"
                        )}
                        style={
                          tipoIdentificador === valor
                            ? { backgroundColor: "#d8ff72", color: "#050706" }
                            : undefined
                        }
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
                    className={CLASSE_CAMPO_ESCURO}
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
                      className={cn(CLASSE_CAMPO_ESCURO, "pr-11")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white focus-visible:ring-[#d8ff72]/25"
                      onClick={() => setMostrarPasse((valor) => !valor)}
                      aria-label={mostrarPasse ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    >
                      {mostrarPasse ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>

                <Button className="h-11 rounded-2xl" size="lg" disabled={carregando || !identificador || !palavraPasse}>
                  {carregando ? <Loader2 className="animate-spin" /> : <GraduationCap />}
                  {carregando ? "A validar..." : rotuloEstudantil}
                </Button>
              </form>
            </TabsContent>
          </TabsContents>
        </AnimatedTabs>

        {mensagem ? (
          <Alert className="rounded-2xl border-white/12 bg-[#d8ff72]/10 text-[#d8ff72]">
            <AlertDescription className="text-sm leading-6">{mensagem}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </AuthPage>
  );
}
