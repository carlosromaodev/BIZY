import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ProgramaLearning } from "../api";
import { obterProdutoLearning, registrarEventoPublicoLearning, type ProdutoLearningPublico, type TipoEventoPublicoLearning } from "../apiPublica";
import { aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import "../learning.css";

const IMAGEM_SEO_LEARNING = "/bizy-live-commerce-hero.png";

export function PaginaProdutoLearning() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [produto, setProduto] = useState<ProdutoLearningPublico | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [evento, setEvento] = useState<TipoEventoPublicoLearning | null>(null);

  useEffect(() => {
    let activo = true;
    let limparSeo = () => {};

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        if (!slug.trim()) throw new Error("Produto Learning inválido.");
        const resposta = await obterProdutoLearning(slug);
        if (activo) {
          setProduto(resposta.produto);
          limparSeo = aplicarSeoMetaTags(montarSeoPublico({
            titulo: resposta.produto.seo.titulo,
            descricao: resposta.produto.seo.descricao,
            canonicalPath: resposta.produto.seo.urlCanonica || `/learning/produtos/${slug}`,
            imagem: IMAGEM_SEO_LEARNING,
            tipo: "product"
          }));
        }
      } catch (falha) {
        if (activo) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o produto Learning.");
      } finally {
        if (activo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      activo = false;
      limparSeo();
    };
  }, [slug]);

  useEffect(() => {
    if (!produto) return;
    void registrarEvento("VISUALIZACAO");
  }, [produto?.programa.slug]);

  const programa = produto?.programa;
  const precoPrincipal = useMemo(() => {
    if (!produto || !programa || !produto.checkout.requerPagamento) return "Gratuito";
    const valor = produto.checkout.valorPromocional && produto.checkout.valorPromocional > 0
      ? produto.checkout.valorPromocional
      : produto.checkout.valor;
    return formatarKwanza(valor, produto.checkout.moeda);
  }, [produto, programa]);

  async function registrarEvento(tipo: TipoEventoPublicoLearning) {
    if (!produto) return;
    try {
      setEvento(tipo);
      await registrarEventoPublicoLearning({
        tipo,
        programaSlug: produto.programa.slug,
        perfilSlug: produto.perfil.origem === "PERFIL" ? produto.perfil.slug : undefined,
        fonte: "produto-learning-publico"
      });
    } catch {
      // Analytics público não deve bloquear descoberta, preview ou CTA do produto.
    } finally {
      setEvento(null);
    }
  }

  async function verPreview() {
    await registrarEvento("PREVIEW");
    document.getElementById("preview-seguro-learning")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function acionarCheckout() {
    await registrarEvento(produto?.checkout.requerPagamento ? "CTA_CHECKOUT" : "CTA_INSCRICAO");
    navigate("/login");
  }

  if (carregando) {
    return (
      <main className="learn-page min-h-[100dvh] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-[70dvh] animate-pulse bg-neutral-200" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse bg-white" />)}
          </div>
        </div>
      </main>
    );
  }

  if (erro || !produto || !programa) {
    return (
      <main className="learn-page min-h-[100dvh] px-5 py-10 sm:px-8">
        <div className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col justify-center">
          <Link to="/learning" className="text-sm font-semibold text-neutral-600">Bizy Learning</Link>
          <div className="mt-4 border border-red-200 bg-red-50 p-5 text-red-700">
            {erro || "Produto Learning não encontrado."}
          </div>
          <Link to="/learning" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-neutral-950">
            Voltar ao Learning
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="learn-page">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/learning" className="learn-brand" style={{ textDecoration: "none" }}>
            <span className="learn-brand-text text-white">bizy<span className="dot">.</span></span>
            <span className="learn-brand-tag">Learning</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to={produto.perfil.urlPublica} className="hidden bg-white/15 px-4 py-2 font-bold text-white sm:inline-flex" style={{ textDecoration: "none" }}>
              Perfil Especialista
            </Link>
            <Link to="/login" className="learn-hero-cta" style={{ margin: 0, padding: "8px 18px", fontSize: "13px" }}>
              Entrar no Team
            </Link>
          </nav>
        </div>
      </header>

      <section className="learn-profile-hero flex min-h-[78dvh] items-end" aria-label={programa.titulo}>
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.48fr)] lg:items-end w-full">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="learn-section-badge" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <GraduationCap size={15} />
                {programa.familiaProduto}
              </span>
              <span className="bg-white/15 px-3 py-1 text-xs font-black text-white uppercase tracking-wide">{programa.formato.toLowerCase()}</span>
              <span className="bg-white/10 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">{programa.tipoAcesso.toLowerCase()}</span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold text-white sm:text-6xl leading-[1.1] tracking-tight">
              {programa.titulo}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {programa.subtitulo || produto.seo.descricao}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void acionarCheckout()}
                disabled={Boolean(evento)}
                className="learn-hero-cta"
                style={{ margin: 0, border: "none", cursor: "pointer" }}
              >
                {produto.checkout.textoBotao}
              </button>
              <button
                type="button"
                onClick={() => void verPreview()}
                disabled={Boolean(evento)}
                className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                Preview seguro
                <PlayCircle size={16} />
              </button>
            </div>
          </div>

          <aside className="learn-stat-card text-left" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.15)", color: "#fff", backdropFilter: "blur(12px)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Oferta digital</span>
            <strong className="mt-2 block text-3xl font-black text-white">{precoPrincipal}</strong>
            {produto.checkout.valorPromocional && produto.checkout.valorPromocional > 0 && produto.checkout.valorPromocional < produto.checkout.valor && (
              <span className="mt-1 block text-xs text-white/50 line-through">antes {formatarKwanza(produto.checkout.valor, produto.checkout.moeda)}</span>
            )}
            <div className="mt-5 grid gap-3 text-sm text-white/80 border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-2"><Clock3 size={15} /> {programa.duracaoMinutos} minutos</span>
              <span className="inline-flex items-center gap-2"><BookOpenCheck size={15} /> {programa.licoes.length} lições</span>
              <span className="inline-flex items-center gap-2"><UsersRound size={15} /> {programa.publico.join(", ")}</span>
              {programa.certificadoConfigurado && <span className="inline-flex items-center gap-2 text-amber-400 font-bold"><BadgeCheck size={15} /> certificado verificável</span>}
            </div>
          </aside>
        </div>
      </section>

      <section className="learn-section">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] items-center">
          <div>
            <span className="learn-section-badge">Sobre o Programa</span>
            <h2 className="learn-section-title">Aprende de forma prática</h2>
            <p className="learn-section-subtitle mt-3">{programa.descricao}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SinalProduto icone={CreditCard} titulo="Checkout digital" texto={produto.checkout.emiteDocumento ? "Compra gera fatura e comprovativo digital automático." : "Inscrição registada com acesso imediato."} />
            <SinalProduto icone={LockKeyhole} titulo="Acesso Protegido" texto="Conteúdo digital seguro e entitlements geridos pelo Team." />
            <SinalProduto icone={MessageCircle} titulo="Canal de Suporte" texto={produto.perfil.politicaSuporte} />
            <SinalProduto icone={ShieldCheck} titulo="Segurança & Termos" texto="Operado sob a governança e garantia da plataforma Bizy." />
          </div>
        </div>
      </section>

      <section id="preview-seguro-learning" className="learn-dark-section">
        <div className="learn-section" style={{ padding: 0 }}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] items-start">
            <div>
              <span className="learn-section-badge">Preview seguro</span>
              <h2 className="learn-section-title">O que vais aprender</h2>
              <p className="learn-section-subtitle text-white/70">
                {produto.preview.resumo || programa.resultadoEsperado}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">{produto.preview.licoesLiberadas} abertas</span>
                <span className="bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">{produto.preview.licoesBloqueadas} protegidas</span>
                {produto.preview.conteudoPremiumProtegido && <span className="bg-white/15 px-3 py-1.5 text-xs font-extrabold text-white">conteúdo premium protegido</span>}
              </div>
            </div>
            <div className="grid gap-3">
              {produto.preview.licoes.map((licao, indice) => (
                <article key={licao.id} className="learn-format-card" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", cursor: "default" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Lição {indice + 1}</span>
                      <h3 className="mt-1 text-sm font-bold text-white">{licao.titulo}</h3>
                      <p className="mt-1 text-xs text-white/60">{licao.tipo.toLowerCase()} · {licao.duracaoMinutos} min</p>
                    </div>
                    <CheckCircle2 size={18} className="text-[#a6e85f]" />
                  </div>
                </article>
              ))}
              {Array.from({ length: produto.preview.licoesBloqueadas }).slice(0, 3).map((_, index) => (
                <article key={index} className="learn-format-card" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)", cursor: "not-allowed" }}>
                  <div className="flex items-center justify-between gap-4 text-sm text-white/50">
                    <span className="font-medium text-xs">Conteúdo premium bloqueado</span>
                    <LockKeyhole size={15} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="learn-section">
        <div className="grid gap-5 sm:grid-cols-3">
          <PoliticaProduto titulo="Política de acesso" texto={produto.checkout.politicaAcesso.suporte} icone={ShieldCheck} />
          <PoliticaProduto titulo="Reembolso" texto={produto.checkout.politicaAcesso.reembolso} icone={CreditCard} />
          <PoliticaProduto titulo="Certificado" texto={produto.checkout.politicaAcesso.certificado} icone={BadgeCheck} />
        </div>
      </section>

      <section className="learn-section" style={{ paddingTop: 0 }}>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="learn-profile-card">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center bg-neutral-100 text-neutral-700">
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Perfil Vendedor</span>
                <h2 className="mt-1 text-xl font-bold text-neutral-900">{produto.perfil.nomePublico}</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{produto.perfil.descricaoPublica}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {produto.perfil.categorias.slice(0, 5).map((categoria) => (
                    <span key={categoria} className="bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600">{categoria}</span>
                  ))}
                </div>
                <Link to={produto.perfil.urlPublica} className="learn-program-cta mt-5" style={{ textDecoration: "none" }}>
                  Ver Canal do Mentor
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>

          <article className="learn-profile-card">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Confiança e Segurança</span>
            <h3 className="text-lg font-bold text-neutral-900 mt-1">Garantias do Aluno</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {produto.sinaisConfianca.map((sinal) => (
                <span key={sinal} className="inline-flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 font-medium">
                  <CheckCircle2 size={16} className="text-green-600" />
                  {sinal}
                </span>
              ))}
              {produto.checkout.permiteComprovativo && (
                <span className="inline-flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700 font-medium">
                  <FileText size={16} className="text-neutral-500" />
                  Comprovativo digital aceite
                </span>
              )}
            </div>
          </article>
        </div>
      </section>

      {produto.relacionados.length > 0 && (
        <section className="learn-section" style={{ borderTop: "1px solid var(--learn-border)" }}>
          <div className="learn-section-head mb-6">
            <span className="learn-section-badge">Relacionados</span>
            <h2 className="learn-section-title">Outros programas recomendados</h2>
          </div>
          <div className="learn-programs-grid">
            {produto.relacionados.map((relacionado) => <ProdutoRelacionado key={relacionado.slug} programa={relacionado} />)}
          </div>
        </section>
      )}

      <section className="learn-dark-section py-8">
        <div className="learn-section py-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="learn-section-badge" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>Bizy Team</span>
            <h2 className="text-xl font-bold text-white mt-2">Pronto para começar a tua evolução?</h2>
          </div>
          <button
            type="button"
            onClick={() => void acionarCheckout()}
            disabled={Boolean(evento)}
            className="learn-hero-cta"
            style={{ margin: 0, border: "none", cursor: "pointer" }}
          >
            {produto.checkout.textoBotao}
          </button>
        </div>
      </section>
    </main>
  );
}

function SinalProduto({
  icone: Icone,
  titulo,
  texto
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
}) {
  return (
    <article className="bg-white border border-neutral-200 p-5">
      <span className="inline-flex size-10 items-center justify-center bg-neutral-100 text-neutral-700 mb-3">
        <Icone size={18} />
      </span>
      <h3 className="text-sm font-extrabold text-neutral-900">{titulo}</h3>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{texto}</p>
    </article>
  );
}

function PoliticaProduto({
  titulo,
  texto,
  icone: Icone
}: {
  titulo: string;
  texto: string;
  icone: LucideIcon;
}) {
  return (
    <article className="bg-white border border-neutral-200 p-5">
      <span className="inline-flex size-10 items-center justify-center bg-neutral-100 text-neutral-700 mb-3">
        <Icone size={18} />
      </span>
      <h3 className="text-sm font-extrabold text-neutral-900">{titulo}</h3>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{texto}</p>
    </article>
  );
}

function ProdutoRelacionado({ programa }: { programa: ProgramaLearning }) {
  return (
    <article className="learn-profile-card">
      <div className="flex flex-wrap gap-2">
        <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">{programa.categoria}</span>
        <span className="bg-neutral-800 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">{programa.tipoAcesso.toLowerCase()}</span>
      </div>
      <h3 className="mt-4 text-base font-bold text-neutral-900">{programa.titulo}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">{programa.subtitulo}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <CalendarClock size={14} />
          {programa.duracaoMinutos} min
        </span>
        <Link to={`/learning/produtos/${programa.slug}`} className="learn-program-cta" style={{ fontSize: "11px", padding: "4px 10px", textDecoration: "none" }}>
          Ver
          <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}

function formatarKwanza(valor: number, moeda = "AOA"): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: moeda,
    maximumFractionDigits: 0
  }).format(valor || 0);
}
