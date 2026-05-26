import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Globe2,
  MousePointerClick,
  PackageSearch,
  RefreshCcw,
  Send,
  ShoppingCart,
  Store,
  Truck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { obterBaseApiUrl, requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { CrmList, CrmListItem, CrmMetricMini, CrmPageMotion, CrmSection } from "../componentes/CrmInterno21st";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ResumoTrackingComercial } from "../tipos";
import { formatarKwanza } from "../utilidades";

interface PublicacaoLoja {
  slug?: string;
  descricaoPublica?: string | null;
  publicada?: boolean;
}

export function PaginaLojaPublica() {
  const [tracking, setTracking] = useState<ResumoTrackingComercial | null>(null);
  const [slug, setSlug] = useState(() => localStorage.getItem("bizy_loja_slug") ?? "");
  const [descricao, setDescricao] = useState(() => localStorage.getItem("bizy_loja_descricao") ?? "");
  const [publicada, setPublicada] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const resposta = await requisitarApi<ResumoTrackingComercial>("/loja-publica/tracking/resumo");
      setTracking(resposta);
      setMensagem("");
    } catch (erro) {
      setTracking(null);
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar tracking da loja.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const slugNormalizado = useMemo(() => normalizarSlug(slug), [slug]);
  const urlPublica = slugNormalizado ? `${obterBaseApiUrl()}/publico/lojas/${slugNormalizado}` : "";
  const funil = tracking?.funil;

  async function publicar() {
    if (!slugNormalizado) {
      setMensagem("Informe um slug para publicar a loja.");
      return;
    }

    setMensagem("A publicar loja...");
    try {
      const resposta = await requisitarApi<PublicacaoLoja>("/loja-publica/configuracao", {
        method: "PUT",
        body: {
          slug: slugNormalizado,
          descricaoPublica: descricao.trim() || null,
          publicada
        }
      });
      localStorage.setItem("bizy_loja_slug", resposta.slug ?? slugNormalizado);
      localStorage.setItem("bizy_loja_descricao", resposta.descricaoPublica ?? descricao);
      setSlug(resposta.slug ?? slugNormalizado);
      setMensagem(publicada ? "Loja publicada e pronta para receber tracking." : "Loja guardada como rascunho.");
      await carregar();
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível publicar a loja.");
    }
  }

  async function copiarLink() {
    if (!urlPublica) return;
    await navigator.clipboard.writeText(urlPublica);
    setMensagem("Link público copiado.");
  }

  return (
    <CrmPageMotion>
      <CabecalhoPagina rotulo="Social commerce" titulo="Loja pública">
        <Button variant="outline" size="lg" onClick={() => void carregar()} disabled={carregando}>
          <RefreshCcw size={18} />
          Atualizar tracking
        </Button>
        <Button size="lg" onClick={() => void publicar()}>
          <Globe2 size={18} />
          Publicar loja
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo da loja pública"
        itens={[
          { icone: <Store />, titulo: "Eventos", valor: tracking?.totalEventos ?? 0, detalhe: "visitas, cliques e checkout", tom: (tracking?.totalEventos ?? 0) ? "principal" : "neutro" },
          { icone: <MousePointerClick />, titulo: "WhatsApp", valor: funil?.cliquesWhatsApp ?? 0, detalhe: "cliques para compra", tom: (funil?.cliquesWhatsApp ?? 0) ? "sucesso" : "neutro" },
          { icone: <ShoppingCart />, titulo: "Pedidos", valor: funil?.pedidosCriados ?? 0, detalhe: "originados no site", tom: (funil?.pedidosCriados ?? 0) ? "sucesso" : "neutro" },
          { icone: <CheckCircle2 />, titulo: "Receita", valor: formatarKwanza(funil?.receitaAtribuidaEmKwanza ?? 0), detalhe: "atribuída ao tracking", tom: (funil?.receitaAtribuidaEmKwanza ?? 0) ? "sucesso" : "neutro" }
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <CrmSection
          icon={<Globe2 size={20} />}
          title="Publicação"
          description="Transforma o catálogo do backend numa loja online com checkout pelo site, compra pelo WhatsApp, cálculo de entrega e tracking por link."
        >
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-semibold">
              Slug da loja
              <Input
                value={slug}
                onChange={(evento) => setSlug(evento.target.value)}
                placeholder="exemplo: bizy-luanda"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Descrição pública
              <Textarea
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
                placeholder="Descreve a tua loja, entregas, formas de pagamento e diferenciais."
                rows={5}
              />
            </label>
            <label className="flex items-center gap-3 rounded-lg border bg-background/60 p-3 text-sm">
              <Checkbox checked={publicada} onCheckedChange={(valor) => setPublicada(valor === true)} />
              <span>
                <strong className="block">Publicar loja agora</strong>
                <small className="text-muted-foreground">Se desmarcar, a configuração fica guardada como rascunho operacional.</small>
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => void publicar()}>
                <Globe2 size={16} />
                Guardar publicação
              </Button>
              <Button variant="outline" size="lg" onClick={() => void copiarLink()} disabled={!urlPublica}>
                <Copy size={16} />
                Copiar link
              </Button>
              {urlPublica && (
                <Button asChild variant="outline" size="lg">
                  <a href={urlPublica} target="_blank" rel="noreferrer">
                    <ArrowUpRight size={16} />
                    Abrir
                  </a>
                </Button>
              )}
            </div>
            {urlPublica && <p className="break-all rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">{urlPublica}</p>}
          </div>
        </CrmSection>

        <CrmSection
          icon={<PackageSearch size={20} />}
          title="Funil do site"
          description="Mostra se a loja está a gerar atenção, intenção, checkout, pedido e pagamento confirmado."
        >
          {tracking ? (
            <CrmList columns="two">
              <CrmListItem media={<Store size={18} />} title="Visitas" description="Entradas na loja pública." tone="principal" meta={funil?.visitas ?? 0} />
              <CrmListItem media={<PackageSearch size={18} />} title="Produto visto" description="Visualizações de páginas de produto." tone="info" meta={funil?.produtosVistos ?? 0} />
              <CrmListItem media={<Send size={18} />} title="WhatsApp" description="Cliques para comprar ou tirar dúvida." tone="sucesso" meta={funil?.cliquesWhatsApp ?? 0} />
              <CrmListItem media={<ShoppingCart size={18} />} title="Checkout" description="Checkouts iniciados no site." tone="atencao" meta={funil?.checkoutsIniciados ?? 0} />
              <CrmListItem media={<CheckCircle2 size={18} />} title="Pagamento" description="Pagamentos confirmados." tone="sucesso" meta={funil?.pagamentosConfirmados ?? 0} />
              <CrmListItem media={<Truck size={18} />} title="Entregues" description="Compras entregues." tone="sucesso" meta={funil?.comprasEntregues ?? 0} />
            </CrmList>
          ) : (
            <EstadoVazio icone={<Store />} titulo={carregando ? "A carregar tracking" : "Sem tracking"} detalhe="Publique a loja e partilhe links para começar a medir o funil." />
          )}
        </CrmSection>
      </div>

      <CrmSection
        icon={<ActivityIcon />}
        title="Origem dos resultados"
        description="Ajuda a entender quais canais, campanhas e links estão a trazer clientes reais."
      >
        <CrmList columns="three">
          {tracking && Object.entries(tracking.porCanal).length ? Object.entries(tracking.porCanal).map(([canal, total]) => (
            <CrmListItem key={canal} media={<Send size={18} />} title={canal} description="Eventos por canal." tone="principal" meta={total} />
          )) : (
            <EstadoVazio icone={<MousePointerClick />} titulo="Sem origem registada" detalhe="Os eventos públicos guardam canal, origem e UTM sem dados pessoais sensíveis." />
          )}
        </CrmList>
      </CrmSection>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </CrmPageMotion>
  );
}

function normalizarSlug(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ActivityIcon() {
  return <Badge variant="success">UTM</Badge>;
}
