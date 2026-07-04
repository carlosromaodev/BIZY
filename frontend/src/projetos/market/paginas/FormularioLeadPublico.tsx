import { CheckCircle2, Loader2, Mail, Phone, Send, Store, User } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvisoPrivacidade } from "../../../componentes/BizyDesignSystem";
import { obterLojaPublica, submeterFormularioLeadLojaPublica, ROTAS_LOJAS } from "../api";
import type { LojaPublica, PayloadFormularioLeadLojaPublica } from "../api/tiposLojas";
import { LogoBizy } from "../../../marca/bizy";

export function PaginaFormularioLeadPublico() {
  const { slug = "" } = useParams();
  const [loja, setLoja] = useState<LojaPublica | null>(null);
  const [carregandoLoja, setCarregandoLoja] = useState(true);
  const [erroLoja, setErroLoja] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [produtoInteresse, setProdutoInteresse] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [consentimentoDados, setConsentimentoDados] = useState(false);
  const [consentimentoMarketing, setConsentimentoMarketing] = useState(false);

  useEffect(() => {
    if (!slug) {
      setErroLoja("Link do formulário inválido.");
      setCarregandoLoja(false);
      return;
    }

    let ativo = true;
    async function carregarLoja() {
      setCarregandoLoja(true);
      try {
        const resposta = await obterLojaPublica(slug);
        if (!ativo) return;
        setLoja(resposta.loja);
      } catch {
        if (!ativo) return;
        setErroLoja("Não foi possível carregar o formulário desta loja.");
      } finally {
        if (ativo) setCarregandoLoja(false);
      }
    }

    void carregarLoja();
    return () => {
      ativo = false;
    };
  }, [slug]);

  const titulo = useMemo(() => loja?.nomeComercial ?? "Formulário de contacto", [loja]);

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!slug || !consentimentoDados || enviando) return;

    setErroEnvio(null);
    setEnviando(true);
    try {
      const payload: PayloadFormularioLeadLojaPublica = {
        nome,
        telefone,
        email: email.trim() || null,
        produtoInteresse: produtoInteresse.trim() || null,
        mensagem: mensagem.trim() || null,
        consentimentoDados,
        consentimentoMarketing,
        origem: "formulario_publico",
        canal: "web"
      };

      await submeterFormularioLeadLojaPublica(slug, payload);
      setEnviado(true);
    } catch (erro) {
      setErroEnvio(erro instanceof Error ? erro.message : "Não foi possível enviar o formulário.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoLoja) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar formulário...
          </div>
        </div>
      </main>
    );
  }

  if (erroLoja || !slug) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoBizy className="h-7 w-auto" />
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bizy</span>
            </div>
            <h1 className="mt-6 text-2xl font-semibold">{erroLoja ?? "Link inválido"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirma se o link foi copiado completo ou volta à loja pública.
            </p>
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link to={ROTAS_LOJAS.market}>Abrir Market</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <LogoBizy className="h-7 w-auto" />
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bizy Team</span>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-semibold">Lead recebido</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  A tua mensagem entrou no Bizy e a equipa pode seguir o contacto agora.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to={ROTAS_LOJAS.loja(slug)}>Voltar à loja</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8 md:py-12">
        <div className="w-full rounded-lg border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoBizy className="h-7 w-auto" />
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">Formulário público</p>
                <h1 className="text-2xl font-semibold">{titulo}</h1>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={ROTAS_LOJAS.loja(slug)}>
                <Store className="mr-2 h-4 w-4" />
                Abrir loja
              </Link>
            </Button>
          </div>

          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Deixa os teus dados e o Bizy encaminha este lead para a equipa certa com a tag automática da origem.
          </p>

          {erroEnvio && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {erroEnvio}
            </div>
          )}

          <form className="mt-6 grid gap-4" onSubmit={(evento) => void submeter(evento)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    className="pl-9"
                    placeholder="Nome completo"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(evento) => setTelefone(evento.target.value)}
                    className="pl-9"
                    placeholder="923 000 000"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
                    className="pl-9"
                    placeholder="cliente@exemplo.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="produto">Produto de interesse</Label>
                <Input
                  id="produto"
                  value={produtoInteresse}
                  onChange={(evento) => setProdutoInteresse(evento.target.value)}
                  placeholder="Ex: Vestido azul"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={mensagem}
                onChange={(evento) => setMensagem(evento.target.value)}
                placeholder="Descreve o que precisas ou a dúvida que tens."
                rows={4}
              />
            </div>

            <div className="grid gap-3 rounded-lg border p-4">
              <label htmlFor="consentimento-dados" className="flex items-start gap-3 text-sm">
                <Checkbox
                  id="consentimento-dados"
                  checked={consentimentoDados}
                  onCheckedChange={(valor) => setConsentimentoDados(valor === true)}
                  className="mt-0.5"
                />
                <span>Autorizo o tratamento destes dados para contacto sobre este pedido.</span>
              </label>
              <label htmlFor="consentimento-marketing" className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  id="consentimento-marketing"
                  checked={consentimentoMarketing}
                  onCheckedChange={(valor) => setConsentimentoMarketing(valor === true)}
                  className="mt-0.5"
                />
                <span>Posso receber comunicações comerciais relacionadas com esta loja.</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!consentimentoDados || enviando}>
                {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar lead
              </Button>
              <Button asChild variant="outline">
                <Link to={ROTAS_LOJAS.loja(slug)}>Cancelar</Link>
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <AvisoPrivacidade />
          </div>
        </div>
      </div>
    </main>
  );
}
