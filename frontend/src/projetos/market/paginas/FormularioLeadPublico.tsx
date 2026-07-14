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
import { CabecalhoMarket, RodapeMarket } from "../componentes/MarketChrome";

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
      <main className="bizy-market-page market-commerce-page market-public-page market-lead-page">
        <CabecalhoMarket />
        <section className="market-route-state" aria-busy="true">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar formulário...
          </div>
        </section>
        <RodapeMarket />
      </main>
    );
  }

  if (erroLoja || !slug) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page market-lead-page">
        <CabecalhoMarket />
        <section className="market-route-state">
          <Store size={32} />
          <h1>{erroLoja ?? "Link inválido"}</h1>
          <p>Confirme se o link foi copiado completo ou volte ao Bizy Market.</p>
          <div>
            <Button asChild variant="outline">
              <Link to={ROTAS_LOJAS.market}>Abrir Market</Link>
            </Button>
          </div>
        </section>
        <RodapeMarket />
      </main>
    );
  }

  if (enviado) {
    return (
      <main className="bizy-market-page market-commerce-page market-public-page market-lead-page">
        <CabecalhoMarket />
        <section className="market-route-state is-success">
          <CheckCircle2 size={36} />
          <h1>Pedido de contacto recebido</h1>
          <p>A mensagem entrou no Bizy Team da loja e já pode ser acompanhada pela equipa.</p>
          <div>
            <Button asChild>
              <Link to={ROTAS_LOJAS.loja(slug)}>Voltar à loja</Link>
            </Button>
          </div>
        </section>
        <RodapeMarket />
      </main>
    );
  }

  return (
    <main className="bizy-market-page market-commerce-page market-public-page market-lead-page">
      <CabecalhoMarket />
      <section className="market-flow-heading">
        <span>Contacto da loja</span>
        <h1>Falar com {titulo}</h1>
        <p>Envie o pedido diretamente para a equipa responsável pelo atendimento.</p>
      </section>

      <section className="market-lead-shell">
        <aside className="market-lead-context">
          <span><Store size={18} /> Loja no Bizy Market</span>
          <h2>{titulo}</h2>
          <p>Os dados são usados apenas para responder a este pedido e manter o atendimento organizado.</p>
          <Link to={ROTAS_LOJAS.loja(slug)}>
            Abrir loja
          </Link>
        </aside>

        <div className="market-lead-form-panel">

          {erroEnvio && (
            <div className="market-lead-error">
              {erroEnvio}
            </div>
          )}

          <form className="market-lead-form" onSubmit={(evento) => void submeter(evento)}>
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

            <div className="market-lead-consent">
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
                Enviar pedido
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
      </section>
      <RodapeMarket />
    </main>
  );
}
