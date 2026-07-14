import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  CreditCard,
  FileText,
  GraduationCap,
  Heart,
  Layers3,
  LockKeyhole,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquareText,
  Package,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  UserCheck,
  UserPlus,
  UsersRound,
  WifiOff,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import "../learning.css";
import { CrmPageMotion } from "../../../componentes/CrmInterno21st";
import {
  BotaoBizy,
  KpiCard,
  KpiGrid,
  PageHead,
  PanelCard,
  PillBizy,
  StatusBadge
} from "../../../componentes/BizyDesignSystem";
import {
  alterarPublicacaoLearning,
  abrirCohortLearningTeam,
  ajustarCompraLearningTeam,
  atribuirProgramaLearningTeam,
  checkoutLearning,
  concluirLicaoLearning,
  criarComunidadeLearningTeam,
  criarAvaliacaoLearningTeam,
  criarProdutoLearningTeam,
  decidirModeracaoLearning,
  denunciarConteudoLearning,
  emitirCertificadoLearning,
  enviarMensagemChatLearning,
  exportarAvaliacaoLearning,
  inscreverProgramaLearning,
  listarChatInternoLearning,
  listarAvaliacoesLearningTeam,
  obterPerfilLearning,
  obterHomeLearning,
  obterResumoLearningTeam,
  publicarPostComunidadeLearning,
  registrarPresencaCohortLearning,
  revogarEntitlementLearning,
  type AcessoComunidadeLearning,
  type AvaliacaoLearning,
  type AcaoModeracaoLearning,
  type CasoModeracaoLearning,
  type CertificadoLearning,
  type ChatInternoLearning,
  type CompraLearning,
  type ContextoChatLearning,
  type CriarProgramaLearningInput,
  type EntitlementLearning,
  type EstadoAtribuicaoLearning,
  type EstadoCasoModeracaoLearning,
  type EstadoCohortLearning,
  type EstadoComunidadeLearning,
  type FormatoProgramaLearning,
  type HomeLearningResposta,
  type MotivoModeracaoLearning,
  type NivelLearning,
  type PerfilLearningPublico,
  type ProgramaLearning,
  type ResumoLearningTeamResposta,
  type SeveridadeModeracaoLearning,
  type TipoAcessoLearning,
  type TipoAlvoModeracaoLearning,
  type TipoMensagemChatLearning,
  type TipoPostComunidadeLearning
} from "../api";
import { aplicarSeoMetaTags, montarSeoPublico } from "../../../utilidades";
import { LogoBizy } from "../../../marca/bizy";
import {
  AtalhosLearningTeam,
  NavegacaoLearningTeam,
  resolverAreaLearningTeam
} from "../team/LearningTeamNavigation";

const PERFIS_PADRAO = ["DONO", "ADMIN", "GESTOR", "VENDEDOR", "ATENDENTE", "FINANCEIRO", "AFILIADO", "CRIADOR"];
const CATEGORIAS_PADRAO = ["Team", "Market", "Atendimento", "Financas", "Afiliados", "Criadores"];
const IMAGEM_SEO_LEARNING = "/bizy-live-commerce-hero.png";

export function PaginaLearning() {
  const [dados, setDados] = useState<HomeLearningResposta | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formato, setFormato] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [lowData, setLowData] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("bizy_learning_low_data") === "1");

  useEffect(() => {
    return aplicarSeoMetaTags(montarSeoPublico({
      titulo: "Bizy Learning | Cursos, mentorias e produtos digitais",
      descricao: "Descubra cursos, mentorias, comunidades e produtos digitais ligados ao ecossistema Bizy.",
      canonicalPath: "/learning",
      imagem: IMAGEM_SEO_LEARNING
    }));
  }, []);

  useEffect(() => {
    let activo = true;
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const resposta = await obterHomeLearning();
        if (activo) setDados(resposta);
      } catch (falha) {
        if (activo) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o Bizy Learning.");
      } finally {
        if (activo) setCarregando(false);
      }
    }
    void carregar();
    return () => {
      activo = false;
    };
  }, []);

  const programas = dados?.programas ?? [];
  const perfisPublicos = dados?.perfisPublicos ?? [];
  const categorias = dados?.categorias?.length ? dados.categorias : CATEGORIAS_PADRAO;
  const familias = dados?.familias?.length ? dados.familias : [
    "Cursos estruturados",
    "Microlearning",
    "Lives e workshops",
    "Mentorias e coaching",
    "Certificações e recertificações",
    "Comunidades e memberships"
  ];
  
  const filtrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return programas.filter((programa) => {
      const combinaCategoria = !categoria || programa.categoria === categoria;
      const combinaFormato = !formato || programa.formato === formato;
      const combinaTexto =
        !texto ||
        [programa.titulo, programa.subtitulo, programa.descricao, programa.resultadoEsperado, programa.categoria, programa.formato]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      return combinaCategoria && combinaFormato && combinaTexto;
    });
  }, [busca, categoria, formato, programas]);

  const categoriasComProgramas = useMemo(() => {
    return categorias.map((cat) => {
      const itens = programas.filter((p) => p.categoria === cat);
      return { nome: cat, itens };
    }).filter((c) => c.itens.length > 0);
  }, [categorias, programas]);

  const programasDestaque = useMemo(() => {
    const comDestaque = programas.filter((p) => p.destaque);
    return comDestaque.length ? comDestaque.slice(0, 4) : programas.slice(0, 4);
  }, [programas]);

  const isHome = !categoria && !formato && !busca;

  return (
    <main className={`learn-page ${lowData ? "learn-low-data" : ""}`}>
      <CabecalhoLearningComercial
        busca={busca}
        categoriaSelecionada={categoria}
        formatoSelecionado={formato}
        categorias={categorias}
        onBusca={setBusca}
        onCategoria={(cat) => { setCategoria(cat); setFormato(""); }}
        onFormato={(fmt) => { setFormato(fmt); setCategoria(""); }}
        onLimpar={() => { setBusca(""); setCategoria(""); setFormato(""); }}
        lowData={lowData}
        onLowData={() => {
          const proximo = !lowData;
          setLowData(proximo);
          window.localStorage.setItem("bizy_learning_low_data", proximo ? "1" : "0");
        }}
      />

      {!isHome ? (
        <section className="learn-cat-head" style={{ padding: "40px 24px 20px", background: "var(--learn-surface)", borderBottom: "1px solid var(--learn-border)" }}>
          <span style={{ fontSize: "12px", color: "var(--learn-ink-3)", textTransform: "uppercase", fontWeight: 600 }}>
            Explorar / <b>{categoria || (formato === "CURSO" ? "Cursos" : formato === "MENTORIA" ? "Mentorias" : formato === "COHORT" ? "Turmas ao Vivo" : formato)}</b>
          </span>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px", color: "var(--learn-ink)" }}>
            {categoria || (formato === "CURSO" ? "Cursos Práticos" : formato === "MENTORIA" ? "Mentorias Individuais" : formato === "COHORT" ? "Turmas ao Vivo" : formato)}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--learn-ink-2)", marginTop: "4px" }}>
            {carregando ? "A carregar resultados..." : `${filtrados.length} programa(s) encontrado(s)`}
          </p>
        </section>
      ) : (
        <>
          <section className="learn-hero">
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.h1
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Leva o teu conhecimento ao{" "}
                <span className="highlight">próximo nível</span>
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.5 }}
              >
                Aprende com especialistas que aplicam o conhecimento no mundo real. Cursos, mentorias e cohorts práticos para acelerar a tua evolução.
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.24, duration: 0.5 }}
              >
                <a href="#programas-learning" className="learn-hero-cta">
                  Explorar programas
                  <ArrowRight size={15} />
                </a>
              </motion.div>
            </div>
          </section>

          <div className="learn-stats-row">
            <div className="learn-stat-card">
              <div className="learn-stat-value">{programas.length}</div>
              <div className="learn-stat-label">Programas</div>
            </div>
            <div className="learn-stat-card" onClick={() => setFormato("MENTORIA")} style={{ cursor: "pointer" }}>
              <div className="learn-stat-value">{perfisPublicos.length}</div>
              <div className="learn-stat-label">Especialistas</div>
            </div>
            <div className="learn-stat-card">
              <div className="learn-stat-value">
                {dados?.metricas.minutos ? `${Math.round(dados.metricas.minutos / 60)}h` : "480h"}
              </div>
              <div className="learn-stat-label">Horas de conteúdo</div>
            </div>
          </div>

          <SecaoConfiancaLearning />

          {/* Como funciona */}
          <section className="learn-section">
            <div className="learn-section-head text-center">
              <span className="learn-section-badge">Jornada</span>
              <h2 className="learn-section-title">Como funciona a tua evolução</h2>
              <p className="learn-section-subtitle mx-auto">
                Formatos didáticos dinâmicos concebidos para o teu desenvolvimento real e prático.
              </p>
            </div>
            
            <div className="learn-formats-grid">
              <motion.div whileHover={{ y: -2 }} className="learn-format-card" onClick={() => setFormato("CURSO")} style={{ cursor: "pointer" }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-neutral-100 text-neutral-700">
                  <BookOpenCheck size={18} />
                </div>
                <h3 className="learn-format-name">Cursos Práticos</h3>
                <p className="learn-format-desc">Aprende ao teu próprio ritmo com lições estruturadas e metas de progresso.</p>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="learn-format-card" onClick={() => setFormato("MENTORIA")} style={{ cursor: "pointer" }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-neutral-100 text-neutral-700">
                  <UsersRound size={18} />
                </div>
                <h3 className="learn-format-name">Mentorias</h3>
                <p className="learn-format-desc">Sessões diretas com especialistas para acelerar o teu negócio ou carreira.</p>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="learn-format-card" onClick={() => setFormato("COHORT")} style={{ cursor: "pointer" }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-neutral-100 text-neutral-700">
                  <GraduationCap size={18} />
                </div>
                <h3 className="learn-format-name">Turmas ao Vivo</h3>
                <p className="learn-format-desc">Aprende em comunidade com encontros interativos e projectos práticos.</p>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="learn-format-card" onClick={() => setFormato("COMUNIDADE")} style={{ cursor: "pointer" }}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center bg-neutral-100 text-neutral-700">
                  <MessageCircle size={18} />
                </div>
                <h3 className="learn-format-name">Comunidades</h3>
                <p className="learn-format-desc">Espaços exclusivos para networking e discussões sobre o teu mercado.</p>
              </motion.div>
            </div>
          </section>

          {/* Programas em Destaque */}
          {programasDestaque.length > 0 && (
            <section className="learn-section" style={{ borderTop: "1px solid var(--learn-border)" }}>
              <div className="learn-section-head">
                <span className="learn-section-badge">Recomendados</span>
                <h2 className="learn-section-title">Programas em Destaque</h2>
                <p className="learn-section-subtitle">
                  Uma seleção especial dos melhores programas e cohorts ativos no ecossistema Bizy.
                </p>
              </div>
              <div className="learn-programs-grid">
                {programasDestaque.map((programa) => (
                  <ProgramaLearningPublico key={programa.slug} programa={programa} />
                ))}
              </div>
            </section>
          )}

          {/* Shelves por Categoria */}
          {categoriasComProgramas.map(({ nome, itens }) => (
            <section key={nome} className="learn-section" style={{ borderTop: "1px solid var(--learn-border)" }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                <div>
                  <span className="learn-section-badge">Categoria / {nome}</span>
                  <h2 className="learn-section-title">
                    {nome === "Team" ? "Colaboração & Gestão de Equipa" :
                     nome === "Market" ? "Vendas & E-commerce" :
                     nome === "Atendimento" ? "Suporte & Atendimento ao Cliente" :
                     nome === "Financas" ? "Gestão Financeira & Faturação" :
                     nome === "Afiliados" ? "Marketing & Programas de Afiliados" :
                     nome === "Criadores" ? "Criação de Conteúdo & Infoprodutos" : nome}
                  </h2>
                </div>
                <button
                  type="button"
                  className="learn-pill"
                  onClick={() => { setCategoria(nome); setFormato(""); }}
                  style={{ alignSelf: "flex-start", height: "32px", padding: "0 14px", border: "1px solid var(--learn-border)" }}
                >
                  Explorar tudo em {nome}
                </button>
              </div>
              <div className="learn-programs-grid">
                {itens.slice(0, 4).map((programa) => (
                  <ProgramaLearningPublico key={programa.slug} programa={programa} />
                ))}
              </div>
            </section>
          ))}

          {/* Mentores/Criadores */}
          {perfisPublicos.length > 0 && (
            <section className="learn-section" style={{ borderTop: "1px solid var(--learn-border)" }}>
              <div className="learn-section-head">
                <span className="learn-section-badge">Criadores</span>
                <h2 className="learn-section-title">Aprende com especialistas líderes</h2>
                <p className="learn-section-subtitle">
                  Canais dedicados de mentores, escolas e negócios digitais que utilizam o ecossistema Bizy.
                </p>
              </div>
              <div className="learn-programs-grid">
                {perfisPublicos.slice(0, 6).map((perfil) => (
                  <PerfilLearningPublicoCard key={perfil.slug} perfil={perfil} />
                ))}
              </div>
            </section>
          )}

          {/* Formatos de Aprendizagem */}
          <section className="learn-dark-section">
            <div className="learn-section" style={{ padding: 0 }}>
              <div className="learn-section-head">
                <span className="learn-section-badge">Formatos de Aprendizagem</span>
                <h2 className="learn-section-title">Formatos criados para a tua rotina</h2>
                <p className="learn-section-subtitle text-white/70">
                  Escolhe o método que melhor se adapta aos teus objetivos do dia-a-dia.
                </p>
              </div>
              <div className="learn-formats-grid mt-8">
                {familias.map((familia, indice) => (
                  <FamiliaLearningPublica
                    key={familia}
                    familia={familia}
                    indice={indice}
                    totalProdutos={programas.filter((programa) => programa.familiaProduto === familia).length}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Vitrine Geral / Exploração Ativa */}
      <section id="programas-learning" className="learn-section" style={{ borderTop: isHome ? "1px solid var(--learn-border)" : "none" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <span className="learn-section-badge">Catálogo</span>
            <h2 className="learn-section-title">Todos os programas disponíveis</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="learn-search" style={{ maxWidth: "260px" }}>
              <Search className="learn-search-icon size-4" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar programa..."
                style={{ height: "38px" }}
              />
            </label>
            <select
              value={categoria}
              onChange={(evento) => { setCategoria(evento.target.value); setFormato(""); }}
              className="learn-pill"
              style={{ height: "38px", padding: "0 16px" }}
            >
              <option value="">Todas categorias</option>
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {erro && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
        {carregando && (
          <div className="learn-programs-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="learn-skeleton h-72" />
            ))}
          </div>
        )}
        {!carregando && !erro && (
          <>
            {filtrados.length > 0 ? (
              <div className="learn-programs-grid">
                {filtrados.map((programa) => (
                  <ProgramaLearningPublico key={programa.slug} programa={programa} />
                ))}
              </div>
            ) : (
              <div className="learn-empty">
                <h3>Nenhum programa encontrado</h3>
                <p>Experimenta ajustar a tua pesquisa ou limpar os filtros activos.</p>
                <button
                  onClick={() => { setBusca(""); setCategoria(""); setFormato(""); }}
                  className="learn-empty-btn"
                >
                  Ver todos os programas
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function PaginaPerfilLearning() {
  const { slug = "" } = useParams();
  const [perfil, setPerfil] = useState<PerfilLearningPublico | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let activo = true;
    let limparSeo = () => {};
    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        if (!slug.trim()) throw new Error("Perfil Learning inválido.");
        const resposta = await obterPerfilLearning(slug);
        if (activo) {
          setPerfil(resposta.perfil);
          limparSeo = aplicarSeoMetaTags(montarSeoPublico({
            titulo: `${resposta.perfil.nomePublico} | Bizy Learning`,
            descricao: resposta.perfil.descricaoPublica || "Produtos digitais, mentorias e comunidades no Bizy Learning.",
            canonicalPath: resposta.perfil.urlPublica || `/learning/${slug}`,
            imagem: IMAGEM_SEO_LEARNING
          }));
        }
      } catch (falha) {
        if (activo) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o perfil Learning.");
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

  const programas = perfil?.programas ?? [];
  const categorias = perfil?.categorias ?? [];
  const canaisSuporte = perfil?.canaisSuporte ?? [];

  return (
    <main className="learn-page">
      <CabecalhoLearningComercial
        busca=""
        categoriaSelecionada=""
        formatoSelecionado=""
        categorias={categorias}
        onBusca={() => {}}
        onCategoria={() => {}}
        onFormato={() => {}}
        onLimpar={() => {}}
      />

      <section className="learn-profile-hero">
        <div className="relative z-10 mx-auto max-w-7xl grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.55fr)] lg:items-end">
          <div className="max-w-3xl">
            <span className="learn-section-badge" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <BriefcaseBusiness size={14} />
              Especialista
            </span>
            <h1 className="mt-5 text-4xl font-bold text-white sm:text-5xl leading-tight">
              {carregando ? "A carregar perfil..." : perfil?.nomePublico ?? "Perfil Learning"}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
              {perfil?.descricaoPublica ?? "Produtos digitais, comunidades, mentorias e certificações no ecossistema Bizy."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {categorias.slice(0, 8).map((categoria) => (
                <span key={categoria} className="bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                  {categoria}
                </span>
              ))}
              {perfil?.localizacao && (
                <span className="bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  {perfil.localizacao}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-lg lg:ml-auto w-full">
            <div className="learn-stat-card" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.1)", color: "#fff" }}>
              <strong className="block text-2xl font-bold text-white">{perfil?.metricas.programas ?? 0}</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-normal text-white/70">Programas</span>
            </div>
            <div className="learn-stat-card" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.1)", color: "#fff" }}>
              <strong className="block text-2xl font-bold text-white">{perfil?.metricas.pagos ?? 0}</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-normal text-white/70">Premium</span>
            </div>
            <div className="learn-stat-card" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.1)", color: "#fff" }}>
              <strong className="block text-2xl font-bold text-white">{perfil?.metricas.comunidades ?? 0}</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-normal text-white/70">Grupos</span>
            </div>
            <div className="learn-stat-card" style={{ background: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.1)", color: "#fff" }}>
              <strong className="block text-2xl font-bold text-white">{perfil?.metricas.minutos ? `${Math.round(perfil.metricas.minutos / 60)}h` : "0h"}</strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-normal text-white/70">Aulas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apoio e Aprendizado */}
      <section className="learn-section">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] items-center">
          <div>
            <span className="learn-section-badge">Metodologia</span>
            <h2 className="learn-section-title">Apoio em toda a jornada</h2>
            <p className="learn-section-subtitle">
              {perfil?.politicaSuporte ?? "Estudo estruturado com acompanhamento ativo. Os nossos programas incluem canais de suporte dedicados para retirar dúvidas e acelerar o teu desenvolvimento."}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <SinalLearning icone={CreditCard} titulo="Compra Segura" texto="Pagamento prático com ativação imediata dos programas." />
            <SinalLearning icone={LockKeyhole} titulo="Acesso Direto" texto="Conteúdos, cohorts e fóruns sem burocracia ou demoras." />
            <SinalLearning icone={BadgeCheck} titulo="Metas Práticas" texto="Mede o teu progresso através das lições e checklists." />
          </div>
        </div>
      </section>

      {/* Canais */}
      <section className="learn-section" style={{ paddingTop: 0 }}>
        <div className="bg-white border border-neutral-200 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-normal">Canais de Ajuda</span>
              <h3 className="text-lg font-bold text-neutral-900 mt-1">Esclarece as tuas dúvidas diretamente com o mentor</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {(canaisSuporte.length ? canaisSuporte : ["Plataforma", "Comunidade", "E-mail"]).map((canal) => (
                <span key={canal} className="inline-flex items-center gap-1.5 bg-neutral-50 text-neutral-700 px-4 py-2 text-xs font-bold border border-neutral-200">
                  <MessageCircle size={14} />
                  {canal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vitrine do Perfil */}
      <section id="programas-perfil-learning" className="learn-section" style={{ borderTop: "1px solid var(--learn-border)" }}>
        <div className="learn-section-head mb-8">
          <span className="learn-section-badge">Catálogo</span>
          <h2 className="learn-section-title">Programas publicados pelo especialista</h2>
        </div>

        {erro && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
        {carregando && (
          <div className="learn-programs-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="learn-skeleton h-72" />
            ))}
          </div>
        )}
        {!carregando && !erro && (
          <>
            {programas.length > 0 ? (
              <div className="learn-programs-grid">
                {programas.map((programa) => (
                  <ProgramaLearningPublico key={programa.slug} programa={programa} />
                ))}
              </div>
            ) : (
              <div className="learn-empty">
                <span className="learn-empty-icon"></span>
                <h3>Nenhum programa publicado</h3>
                <p>Este especialista ainda não publicou programas para inscrições públicas. Volta em breve!</p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function PaginaLearningTeam() {
  const location = useLocation();
  const area = resolverAreaLearningTeam(location.pathname);
  const [dados, setDados] = useState<ResumoLearningTeamResposta | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [acao, setAcao] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "Team",
    ownerPerfil: "DONO",
    perfisAlvo: "DONO,ADMIN,GESTOR",
    formato: "TRILHO" as FormatoProgramaLearning,
    nivel: "INICIAL" as NivelLearning,
    tipoAcesso: "GRATUITO" as TipoAcessoLearning,
    valor: "",
    cupoes: "",
    resultadoEsperado: "",
    licaoTitulo: ""
  });
  const [chat, setChat] = useState<ChatInternoLearning | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoLearning[]>([]);
  const [avaliacaoForm, setAvaliacaoForm] = useState({
    programaSlug: "",
    titulo: "",
    pergunta: "",
    alternativaCorreta: "",
    alternativaIncorreta: "",
    pontuacaoMinima: "70",
    tentativasMaximas: "3"
  });
  const [hashExportacaoAvaliacao, setHashExportacaoAvaliacao] = useState("");
  const [chatForm, setChatForm] = useState({
    programaSlug: "",
    tipo: "MENSAGEM" as TipoMensagemChatLearning,
    contexto: "PROGRAMA" as ContextoChatLearning,
    conteudo: ""
  });
  const [atribuicaoForm, setAtribuicaoForm] = useState({
    programaSlug: "",
    usuarioId: "",
    perfilAlvo: "GESTOR",
    obrigatoria: true,
    prazoAte: "",
    mensagem: ""
  });
  const [cohortForm, setCohortForm] = useState({
    programaSlug: "",
    titulo: "",
    inicioEm: "",
    fimEm: "",
    vagas: "20",
    salaUrl: "",
    replayUrl: "",
    replayDisponivel: false,
    regrasEntrada: "",
    mensagem: ""
  });
  const [presencaForm, setPresencaForm] = useState({
    cohortId: "",
    usuarioId: "",
    presente: true,
    notas: ""
  });
  const [comunidadeForm, setComunidadeForm] = useState({
    programaSlug: "",
    titulo: "",
    acesso: "ENTITLEMENT" as AcessoComunidadeLearning,
    topicos: "perguntas, materiais, desafios",
    regras: "",
    moderadores: "ADMIN,GESTOR"
  });
  const [postComunidadeForm, setPostComunidadeForm] = useState({
    comunidadeId: "",
    tipo: "ANUNCIO" as TipoPostComunidadeLearning,
    titulo: "",
    conteudo: "",
    fixado: true
  });
  const [moderacaoForm, setModeracaoForm] = useState({
    alvoTipo: "COMUNIDADE" as TipoAlvoModeracaoLearning,
    alvoId: "",
    motivo: "CONTEUDO_SENSIVEL" as MotivoModeracaoLearning,
    severidade: "MEDIA" as SeveridadeModeracaoLearning,
    descricao: ""
  });
  const [decisaoModeracaoForm, setDecisaoModeracaoForm] = useState({
    casoId: "",
    acao: "COLOCAR_EM_REVISAO" as AcaoModeracaoLearning,
    decisao: "",
    ocultoPublicamente: false
  });

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const [resumo, respostaAvaliacoes] = await Promise.all([
        obterResumoLearningTeam(),
        listarAvaliacoesLearningTeam()
      ]);
      setDados(resumo);
      setChat(resumo.chat);
      setAvaliacoes(respostaAvaliacoes.avaliacoes);
      setAvaliacaoForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
      }));
      setChatForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
      }));
      setAtribuicaoForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
      }));
      setCohortForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
      }));
      setPresencaForm((actual) => ({
        ...actual,
        cohortId: actual.cohortId || resumo.cohorts[0]?.id || ""
      }));
      setComunidadeForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
      }));
      setPostComunidadeForm((actual) => ({
        ...actual,
        comunidadeId: actual.comunidadeId || resumo.comunidades[0]?.id || ""
      }));
      setModeracaoForm((actual) => ({
        ...actual,
        alvoId: actual.alvoId || resumo.comunidades[0]?.id || resumo.programas[0]?.slug || ""
      }));
      setDecisaoModeracaoForm((actual) => ({
        ...actual,
        casoId: actual.casoId || resumo.moderacao[0]?.id || ""
      }));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o Bizy Learning.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function criarPrograma(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.titulo.trim()) return;
    setCriando(true);
    setErro("");
    try {
      const payload: CriarProgramaLearningInput = {
        titulo: form.titulo,
        categoria: form.categoria,
        ownerPerfil: form.ownerPerfil,
        perfisAlvo: form.perfisAlvo.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
        formato: form.formato,
        nivel: form.nivel,
        tipoAcesso: form.tipoAcesso,
        oferta: {
          modelo: form.tipoAcesso === "PAGO" ? "PAGAMENTO_UNICO" : "GRATUITO",
          moeda: "AOA",
          valor: form.tipoAcesso === "PAGO" ? Number(form.valor || 0) : 0,
          cupoes: form.cupoes.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
          permiteComprovativo: form.tipoAcesso === "PAGO",
          emiteDocumento: form.tipoAcesso === "PAGO"
        },
        estado: "RASCUNHO",
        visibilidade: "TEAM",
        resultadoEsperado: form.resultadoEsperado || undefined,
        licoes: [{ titulo: form.licaoTitulo || "Primeira accao pratica", tipo: "CHECKLIST", duracaoMinutos: 8 }]
      };
      await criarProdutoLearningTeam(payload);
      setForm((actual) => ({ ...actual, titulo: "", valor: "", cupoes: "", resultadoEsperado: "", licaoTitulo: "" }));
      await carregar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível criar o programa.");
    } finally {
      setCriando(false);
    }
  }

  async function criarAvaliacao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!avaliacaoForm.programaSlug || !avaliacaoForm.titulo.trim() || !avaliacaoForm.pergunta.trim() || !avaliacaoForm.alternativaCorreta.trim() || !avaliacaoForm.alternativaIncorreta.trim()) return;
    await executarAcao(`avaliacao-${avaliacaoForm.programaSlug}`, async () => {
      await criarAvaliacaoLearningTeam(avaliacaoForm.programaSlug, {
        titulo: avaliacaoForm.titulo.trim(),
        pontuacaoMinima: Number(avaliacaoForm.pontuacaoMinima),
        tentativasMaximas: Number(avaliacaoForm.tentativasMaximas),
        feedback: "APOS_ENVIO",
        perguntas: [{
          tipo: "MULTIPLA_ESCOLHA",
          enunciado: avaliacaoForm.pergunta.trim(),
          alternativas: [
            { texto: avaliacaoForm.alternativaCorreta.trim(), correta: true, feedback: "Resposta correta." },
            { texto: avaliacaoForm.alternativaIncorreta.trim(), correta: false, feedback: "Revê o conteúdo antes de tentar novamente." }
          ]
        }]
      });
      setAvaliacaoForm((actual) => ({ ...actual, titulo: "", pergunta: "", alternativaCorreta: "", alternativaIncorreta: "" }));
    });
  }

  async function exportarAvaliacao(avaliacao: AvaliacaoLearning) {
    await executarAcao(`exportar-avaliacao-${avaliacao.id}`, async () => {
      const exportacao = await exportarAvaliacaoLearning(avaliacao.id);
      setHashExportacaoAvaliacao(exportacao.auditoria.hash);
    });
  }

  async function publicar(programa: ProgramaLearning) {
    await executarAcao(`publicar-${programa.slug}`, async () => {
      await alterarPublicacaoLearning(programa.slug, {
        estado: programa.estado === "PUBLICADO" ? "RASCUNHO" : "PUBLICADO",
        visibilidade: programa.visibilidade === "PUBLICO" ? "TEAM" : "PUBLICO",
        destaque: programa.estado !== "PUBLICADO" ? programa.destaque : false
      });
    });
  }

  async function destacar(programa: ProgramaLearning) {
    await executarAcao(`destacar-${programa.slug}`, async () => {
      await alterarPublicacaoLearning(programa.slug, {
        estado: "PUBLICADO",
        visibilidade: "PUBLICO",
        destaque: !programa.destaque
      });
    });
  }

  async function inscrever(programa: ProgramaLearning) {
    await executarAcao(`inscrever-${programa.slug}`, async () => {
      await inscreverProgramaLearning(programa.slug);
    });
  }

  async function concluirProxima(programa: ProgramaLearning) {
    const concluidas = new Set(programa.progresso?.licoesConcluidas ?? []);
    const proxima = programa.licoes.find((licao) => !concluidas.has(licao.id)) ?? programa.licoes[0];
    if (!proxima) return;
    await executarAcao(`concluir-${proxima.id}`, async () => {
      await concluirLicaoLearning(proxima.id);
    });
  }

  async function comprar(programa: ProgramaLearning) {
    await executarAcao(`comprar-${programa.slug}`, async () => {
      await checkoutLearning({
        programaSlug: programa.slug,
        compradorNome: "Comprador Team",
        metodoPagamento: programa.tipoAcesso === "PAGO" ? "Pagamento manual" : "Gratuito",
        referenciaPagamento: `TEAM-${programa.slug}-${Date.now()}`,
        confirmarPagamento: true
      });
    });
  }

  async function ajustarCompra(compra: CompraLearning, estado: "CANCELADO" | "REEMBOLSADO") {
    await executarAcao(`ajustar-compra-${compra.id}-${estado}`, async () => {
      await ajustarCompraLearningTeam(compra.id, {
        estado,
        motivo: estado === "REEMBOLSADO"
          ? "Reembolso registado pelo Team Learning."
          : "Cancelamento registado pelo Team Learning.",
        revogarAcesso: true
      });
    });
  }

  async function revogarAcesso(entitlement: EntitlementLearning) {
    await executarAcao(`revogar-entitlement-${entitlement.id}`, async () => {
      await revogarEntitlementLearning(entitlement.id, "Acesso revogado manualmente pelo Team Learning.");
    });
  }

  async function emitirCertificado(programa: ProgramaLearning) {
    await executarAcao(`certificado-${programa.slug}`, async () => {
      await emitirCertificadoLearning(programa.slug);
    });
  }

  async function enviarMensagemChat(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const programaSlug = chatForm.programaSlug || programas[0]?.slug;
    if (!programaSlug || !chatForm.conteudo.trim()) return;
    await executarAcao(`chat-${programaSlug}`, async () => {
      await enviarMensagemChatLearning({
        programaSlug,
        tipo: chatForm.tipo,
        contexto: chatForm.contexto,
        conteudo: chatForm.conteudo
      });
      setChat(await listarChatInternoLearning());
      setChatForm((actual) => ({ ...actual, conteudo: "" }));
    });
  }

  async function atribuirPrograma(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const programaSlug = atribuicaoForm.programaSlug || programas[0]?.slug;
    const usuarioId = atribuicaoForm.usuarioId.trim();
    const perfilAlvo = atribuicaoForm.perfilAlvo.trim().toUpperCase();
    if (!programaSlug || (!usuarioId && !perfilAlvo)) return;

    await executarAcao(`atribuir-${programaSlug}`, async () => {
      await atribuirProgramaLearningTeam(programaSlug, {
        usuarioId: usuarioId || undefined,
        perfilAlvo: usuarioId ? undefined : perfilAlvo,
        obrigatoria: atribuicaoForm.obrigatoria,
        prazoAte: dataLocalParaIso(atribuicaoForm.prazoAte),
        mensagem: atribuicaoForm.mensagem.trim() || undefined
      });
      setAtribuicaoForm((actual) => ({ ...actual, usuarioId: "", mensagem: "" }));
    });
  }

  async function abrirCohort(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const programaSlug = cohortForm.programaSlug || programas[0]?.slug;
    if (!programaSlug) return;

    await executarAcao(`cohort-${programaSlug}`, async () => {
      const resposta = await abrirCohortLearningTeam(programaSlug, {
        titulo: cohortForm.titulo.trim() || undefined,
        inicioEm: dataHoraLocalParaIso(cohortForm.inicioEm),
        fimEm: dataHoraLocalParaIso(cohortForm.fimEm),
        vagas: cohortForm.vagas ? Number(cohortForm.vagas) : null,
        salaUrl: cohortForm.salaUrl.trim() || null,
        replayUrl: cohortForm.replayUrl.trim() || null,
        replayDisponivel: cohortForm.replayDisponivel || Boolean(cohortForm.replayUrl.trim()),
        regrasEntrada: cohortForm.regrasEntrada.trim() || undefined,
        mensagem: cohortForm.mensagem.trim() || undefined
      });
      setPresencaForm((actual) => ({ ...actual, cohortId: resposta.cohort.id || actual.cohortId }));
      setCohortForm((actual) => ({ ...actual, titulo: "", inicioEm: "", fimEm: "", salaUrl: "", replayUrl: "", mensagem: "" }));
    });
  }

  async function registrarPresenca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const cohortId = presencaForm.cohortId || dados?.cohorts[0]?.id;
    if (!cohortId) return;

    await executarAcao(`presenca-${cohortId}`, async () => {
      await registrarPresencaCohortLearning(cohortId, {
        usuarioId: presencaForm.usuarioId.trim() || undefined,
        presente: presencaForm.presente,
        notas: presencaForm.notas.trim() || undefined
      });
      setPresencaForm((actual) => ({ ...actual, usuarioId: "", notas: "" }));
    });
  }

  async function criarComunidade(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const programaSlug = comunidadeForm.programaSlug || programas[0]?.slug;
    if (!programaSlug) return;

    await executarAcao(`comunidade-${programaSlug}`, async () => {
      const resposta = await criarComunidadeLearningTeam(programaSlug, {
        titulo: comunidadeForm.titulo.trim() || undefined,
        acesso: comunidadeForm.acesso,
        topicos: comunidadeForm.topicos.split(",").map((item) => item.trim()).filter(Boolean),
        regras: comunidadeForm.regras.trim() || undefined,
        moderadores: comunidadeForm.moderadores.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean)
      });
      setPostComunidadeForm((actual) => ({ ...actual, comunidadeId: resposta.comunidade.id || actual.comunidadeId }));
      setComunidadeForm((actual) => ({ ...actual, titulo: "", regras: "" }));
    });
  }

  async function publicarPostComunidade(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const comunidadeId = postComunidadeForm.comunidadeId || dados?.comunidades[0]?.id;
    if (!comunidadeId || !postComunidadeForm.conteudo.trim()) return;

    await executarAcao(`post-comunidade-${comunidadeId}`, async () => {
      await publicarPostComunidadeLearning(comunidadeId, {
        tipo: postComunidadeForm.tipo,
        titulo: postComunidadeForm.titulo.trim() || undefined,
        conteudo: postComunidadeForm.conteudo,
        fixado: postComunidadeForm.fixado
      });
      setPostComunidadeForm((actual) => ({ ...actual, titulo: "", conteudo: "" }));
    });
  }

  async function denunciarConteudo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!moderacaoForm.alvoId || !moderacaoForm.descricao.trim()) return;

    await executarAcao(`denuncia-${moderacaoForm.alvoId}`, async () => {
      await denunciarConteudoLearning({
        alvoTipo: moderacaoForm.alvoTipo,
        alvoId: moderacaoForm.alvoId,
        motivo: moderacaoForm.motivo,
        severidade: moderacaoForm.severidade,
        descricao: moderacaoForm.descricao.trim()
      });
      setModeracaoForm((actual) => ({ ...actual, descricao: "" }));
    });
  }

  async function decidirModeracao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!decisaoModeracaoForm.casoId) return;

    await executarAcao(`moderacao-${decisaoModeracaoForm.casoId}`, async () => {
      await decidirModeracaoLearning(decisaoModeracaoForm.casoId, {
        acao: decisaoModeracaoForm.acao,
        decisao: decisaoModeracaoForm.decisao.trim() || undefined,
        ocultoPublicamente: decisaoModeracaoForm.ocultoPublicamente
      });
      setDecisaoModeracaoForm((actual) => ({ ...actual, decisao: "" }));
    });
  }

  async function decidirModeracaoRapida(caso: CasoModeracaoLearning, acaoModeracao: AcaoModeracaoLearning) {
    await executarAcao(`moderacao-${caso.id}-${acaoModeracao}`, async () => {
      await decidirModeracaoLearning(caso.id, { acao: acaoModeracao });
    });
  }

  async function executarAcao(chave: string, fn: () => Promise<void>) {
    setAcao(chave);
    setErro("");
    try {
      await fn();
      await carregar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Ação não concluída.");
    } finally {
      setAcao(null);
    }
  }

  const metricas = dados?.metricas;
  const programas = dados?.programas ?? [];
  const postsModeraveis = (dados?.comunidades ?? []).flatMap((comunidade) =>
    comunidade.postsRecentes.map((post) => ({
      id: post.id,
      titulo: `${post.titulo || post.tipo.toLowerCase()} · ${comunidade.titulo}`
    }))
  );
  const opcoesModeracao = opcoesAlvoModeracao(moderacaoForm.alvoTipo, programas, dados?.comunidades ?? [], postsModeraveis, dados?.certificados ?? []);
  const contextoArea = {
    "visao-geral": ["Learning", "Estado operacional e acessos rápidos do Learning."],
    programas: ["Programas", "Criação, publicação e gestão do catálogo formativo."],
    conteudos: ["Conteúdos", "Lições, progresso e estrutura dos programas."],
    pessoas: ["Pessoas", "Atribuições, formação obrigatória e prazos."],
    avaliacoes: ["Avaliações", "Perguntas, tentativas, pontuação e exportação."],
    certificados: ["Certificados", "Credenciais emitidas, validade e verificação."],
    turmas: ["Turmas", "Cohorts, sessões ao vivo, presenças e replays."],
    comunidade: ["Comunidade", "Espaços, publicações e memberships."],
    biblioteca: ["Biblioteca", "Materiais e programas de consulta ou download."],
    relatorios: ["Relatórios", "Indicadores de adoção, receita e conclusão."],
    chat: ["Chat", "Alinhamento interno por programa, turma ou comunidade."],
    compras: ["Compras e acessos", "Pagamentos, documentos e entitlements Learning."],
    configuracoes: ["Configurações", "Governança, moderação e regras operacionais."]
  }[area];
  const programasDaArea = area === "biblioteca"
    ? programas.filter((programa) => ["DOWNLOAD", "BUNDLE", "MICROLEARNING"].includes(programa.formato))
    : programas;

  return (
    <CrmPageMotion className="learning-team-page">
      <PageHead
        eyebrow="Bizy Learning · administração Team"
        titulo={contextoArea[0]}
        descricao={contextoArea[1]}
        tamanhoTitulo="sm"
      >
        <BotaoBizy icone={RefreshCcw} variante="secondary" onClick={() => void carregar()} disabled={carregando}>
          Atualizar
        </BotaoBizy>
        <Link to="/learning" className="bz-btn bz-btn-tertiary">
          Home pública
          <ArrowRight size={16} />
        </Link>
      </PageHead>

      <NavegacaoLearningTeam />

      {erro && (
        <div className="learning-team-feedback is-error" role="alert">
          <span>{erro}</span>
          <BotaoBizy variante="secondary" icone={RefreshCcw} onClick={() => void carregar()}>Tentar novamente</BotaoBizy>
        </div>
      )}

      {area === "visao-geral" && (
        <>
          <KpiGrid>
            <KpiCard hero icone={GraduationCap} rotulo="Programas" valor={metricas?.programas ?? "-"} delta={`${metricas?.publicados ?? 0} publicados`} deltaPositivo />
            <KpiCard icone={UsersRound} cor="blue" rotulo="Inscrições" valor={metricas?.inscritos ?? "-"} />
            <KpiCard icone={CheckCircle2} cor="green" rotulo="Concluídos" valor={metricas?.concluidos ?? "-"} />
            <KpiCard icone={LockKeyhole} cor="blue" rotulo="Acessos ativos" valor={metricas?.entitlementsAtivos ?? "-"} />
            <KpiCard icone={AlertTriangle} cor="amber" rotulo="Atribuições atrasadas" valor={metricas?.atribuicoesAtrasadas ?? "-"} />
            <KpiCard icone={ShieldCheck} cor={(metricas?.casosModeracaoAbertos ?? 0) > 0 ? "rose" : "green"} rotulo="Casos de moderação" valor={metricas?.casosModeracaoAbertos ?? "-"} />
          </KpiGrid>
          <AtalhosLearningTeam />
        </>
      )}

      {area === "relatorios" && (
        <KpiGrid>
          <KpiCard hero icone={GraduationCap} rotulo="Programas" valor={metricas?.programas ?? "-"} delta={`${metricas?.publicados ?? 0} publicados`} deltaPositivo />
          <KpiCard icone={CreditCard} cor="green" rotulo="Receita Learning" valor={formatarKwanzaCompacto(metricas?.receitaLearning ?? 0)} delta={`${metricas?.comprasConfirmadas ?? 0} compras`} deltaPositivo />
          <KpiCard icone={Compass} cor="blue" rotulo="Visualizações públicas" valor={metricas?.visualizacoesPublicas ?? "-"} />
          <KpiCard icone={PlayCircle} cor="green" rotulo="Pré-visualizações" valor={metricas?.previewsPublicos ?? "-"} />
          <KpiCard icone={ArrowRight} cor="amber" rotulo="Conversões" valor={(metricas?.ctasCheckoutLearning ?? 0) + (metricas?.ctasInscricaoLearning ?? 0)} />
          <KpiCard icone={BadgeCheck} cor="green" rotulo="Certificados" valor={metricas?.certificados ?? "-"} />
          <KpiCard icone={UserPlus} cor="blue" rotulo="Atribuições ativas" valor={metricas?.atribuicoesAtivas ?? "-"} />
          <KpiCard icone={UsersRound} cor="blue" rotulo="Turmas ativas" valor={metricas?.cohortsAtivos ?? "-"} />
          <KpiCard icone={MessageSquareText} cor="blue" rotulo="Comunidades" valor={metricas?.comunidadesAtivas ?? "-"} />
          <KpiCard icone={Layers3} cor="amber" rotulo="Rascunhos" valor={metricas?.rascunhos ?? "-"} />
          <KpiCard icone={UsersRound} cor="blue" rotulo="Inscrições" valor={metricas?.inscritos ?? "-"} />
          <KpiCard icone={CheckCircle2} cor="green" rotulo="Concluídos" valor={metricas?.concluidos ?? "-"} />
        </KpiGrid>
      )}

      {area === "avaliacoes" && <PanelCard
        titulo="Avaliações"
        descricao="Banco nativo de perguntas, tentativas, pontuação e exportação interoperável."
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)]">
          <div className="grid content-start gap-3">
            {avaliacoes.map((avaliacao) => (
              <div key={avaliacao.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-b-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge cor="blue">{avaliacao.perguntas.length} pergunta(s)</StatusBadge>
                    <PillBizy>{avaliacao.pontuacaoMinima}% para aprovação</PillBizy>
                    <PillBizy>{avaliacao.tentativasMaximas} tentativa(s)</PillBizy>
                  </div>
                  <strong className="mt-2 block text-sm">{avaliacao.titulo}</strong>
                  <span className="text-xs text-muted-foreground">{programas.find((programa) => programa.slug === avaliacao.programaSlug)?.titulo ?? avaliacao.programaSlug}</span>
                </div>
                <BotaoBizy icone={FileText} variante="secondary" onClick={() => void exportarAvaliacao(avaliacao)} disabled={Boolean(acao)}>
                  Exportar
                </BotaoBizy>
              </div>
            ))}
            {!avaliacoes.length && <p className="text-sm text-muted-foreground">Nenhuma avaliação criada.</p>}
            {hashExportacaoAvaliacao && <p className="break-all text-xs text-muted-foreground">Última exportação verificada: {hashExportacaoAvaliacao}</p>}
          </div>

          <form onSubmit={(evento) => void criarAvaliacao(evento)} className="grid gap-3 border-l-0 xl:border-l xl:pl-5">
            <strong className="text-sm">Nova avaliação objetiva</strong>
            <select
              value={avaliacaoForm.programaSlug}
              onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, programaSlug: evento.target.value }))}
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Programa da avaliação"
            >
              {programas.map((programa) => <option key={programa.slug} value={programa.slug}>{programa.titulo}</option>)}
            </select>
            <input value={avaliacaoForm.titulo} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, titulo: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="Título da avaliação" />
            <input value={avaliacaoForm.pergunta} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, pergunta: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="Pergunta" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={avaliacaoForm.alternativaCorreta} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, alternativaCorreta: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="Alternativa correta" />
              <input value={avaliacaoForm.alternativaIncorreta} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, alternativaIncorreta: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" placeholder="Alternativa incorreta" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" min="0" max="100" value={avaliacaoForm.pontuacaoMinima} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, pontuacaoMinima: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="Pontuação mínima" />
              <input type="number" min="1" max="20" value={avaliacaoForm.tentativasMaximas} onChange={(evento) => setAvaliacaoForm((actual) => ({ ...actual, tentativasMaximas: evento.target.value }))} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="Tentativas máximas" />
            </div>
            <BotaoBizy icone={Plus} tipo="submit" disabled={Boolean(acao) || carregando}>Criar avaliação</BotaoBizy>
          </form>
        </div>
      </PanelCard>}

      {area === "chat" && <PanelCard
        titulo="Chat interno do Learning"
        descricao="Alinha decisões, tarefas, suporte e mentoria por produto digital sem misturar com WhatsApp ou atendimento externo."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)]">
          <div className="grid gap-3">
            {(chat?.threads ?? []).slice(0, 6).map((thread) => (
              <article key={thread.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge cor={thread.estado === "ABERTO" ? "green" : "mute"}>
                        {thread.estado === "ABERTO" ? "ativo" : "sem mensagens"}
                      </StatusBadge>
                      <PillBizy>{thread.totalMensagens} mensagem(ns)</PillBizy>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{thread.programaTitulo}</h3>
                  </div>
                  <MessageCircle size={18} className="text-muted-foreground" />
                </div>
                <div className="mt-3 grid gap-2">
                  {thread.mensagens.slice(-3).map((mensagem) => (
                    <div key={mensagem.id} className="rounded-md bg-muted/60 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>{mensagem.autorNome}</strong>
                        <span className="text-xs text-muted-foreground">{mensagem.tipo.toLowerCase()} · {formatarDataCurta(mensagem.criadoEm)}</span>
                      </div>
                      <p className="mt-1 leading-6 text-muted-foreground">{mensagem.conteudo}</p>
                    </div>
                  ))}
                  {!thread.mensagens.length && <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">Sem alinhamentos internos neste programa.</p>}
                </div>
              </article>
            ))}
            {!(chat?.threads ?? []).length && <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">Nenhuma thread Learning disponível.</p>}
          </div>

          <form onSubmit={(evento) => void enviarMensagemChat(evento)} className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Send size={16} />
              Nova mensagem interna
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Programa</span>
                <select
                  value={chatForm.programaSlug}
                  onChange={(evento) => setChatForm((actual) => ({ ...actual, programaSlug: evento.target.value }))}
                  disabled={Boolean(acao) || carregando}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {programas.map((programa) => <option key={programa.slug} value={programa.slug}>{programa.titulo}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                  <select
                    value={chatForm.tipo}
                    onChange={(evento) => setChatForm((actual) => ({ ...actual, tipo: evento.target.value as TipoMensagemChatLearning }))}
                    disabled={Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="MENSAGEM">Mensagem</option>
                    <option value="DECISAO">Decisão</option>
                    <option value="TAREFA">Tarefa</option>
                    <option value="SUPORTE">Suporte</option>
                    <option value="ANUNCIO">Anúncio</option>
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Contexto</span>
                  <select
                    value={chatForm.contexto}
                    onChange={(evento) => setChatForm((actual) => ({ ...actual, contexto: evento.target.value as ContextoChatLearning }))}
                    disabled={Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="PROGRAMA">Programa</option>
                    <option value="COHORT">Cohort</option>
                    <option value="COMUNIDADE">Comunidade</option>
                    <option value="SUPORTE">Suporte</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Mensagem</span>
                <textarea
                  value={chatForm.conteudo}
                  onChange={(evento) => setChatForm((actual) => ({ ...actual, conteudo: evento.target.value }))}
                  disabled={Boolean(acao)}
                  rows={4}
                  className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Ex.: Decidido abrir cohort piloto com 20 vagas e suporte financeiro antes da publicação."
                />
              </label>
              <BotaoBizy tipo="submit" icone={Send} disabled={Boolean(acao) || !chatForm.conteudo.trim() || !chatForm.programaSlug}>
                Enviar ao Team
              </BotaoBizy>
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-2">{chat?.metricas.mensagens ?? 0} msgs</span>
                <span className="rounded-md bg-muted px-2 py-2">{chat?.metricas.decisoes ?? 0} decisões</span>
                <span className="rounded-md bg-muted px-2 py-2">{chat?.metricas.tarefas ?? 0} tarefas</span>
                <span className="rounded-md bg-muted px-2 py-2">{chat?.metricas.suporte ?? 0} suporte</span>
              </div>
            </div>
          </form>
        </div>
      </PanelCard>}

      {area === "pessoas" && <PanelCard
        titulo="Atribuições e formação obrigatória"
        descricao="Transforma produto Learning em obrigação operacional do Team, com prazo, alvo e entitlement quando houver membro definido."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.5fr)_minmax(0,1fr)]">
          <form onSubmit={(evento) => void atribuirPrograma(evento)} className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserPlus size={16} />
              Atribuir formação
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Programa</span>
                <select
                  value={atribuicaoForm.programaSlug}
                  onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, programaSlug: evento.target.value }))}
                  disabled={!dados?.podeAdministrar || Boolean(acao) || carregando}
                  className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  {programas.map((programa) => <option key={programa.slug} value={programa.slug}>{programa.titulo}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Membro</span>
                  <input
                    value={atribuicaoForm.usuarioId}
                    onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, usuarioId: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="ID do membro"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Perfil se não houver membro</span>
                  <select
                    value={atribuicaoForm.perfilAlvo}
                    onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, perfilAlvo: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao) || Boolean(atribuicaoForm.usuarioId.trim())}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                  >
                    {PERFIS_PADRAO.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Prazo</span>
                  <input
                    type="date"
                    value={atribuicaoForm.prazoAte}
                    onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, prazoAte: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={atribuicaoForm.obrigatoria}
                    onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, obrigatoria: evento.target.checked }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="size-4"
                  />
                  Obrigatória
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Mensagem</span>
                <textarea
                  value={atribuicaoForm.mensagem}
                  onChange={(evento) => setAtribuicaoForm((actual) => ({ ...actual, mensagem: evento.target.value }))}
                  disabled={!dados?.podeAdministrar || Boolean(acao)}
                  rows={3}
                  className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Ex.: concluir antes de assumir vendas do Market."
                />
              </label>
              <BotaoBizy
                tipo="submit"
                icone={UserPlus}
                disabled={!dados?.podeAdministrar || Boolean(acao) || !atribuicaoForm.programaSlug || (!atribuicaoForm.usuarioId.trim() && !atribuicaoForm.perfilAlvo.trim())}
              >
                Atribuir no Team
              </BotaoBizy>
            </div>
          </form>

          <div className="grid gap-3">
            {(dados?.atribuicoes ?? []).slice(0, 8).map((atribuicao) => (
              <article key={atribuicao.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge cor={corAtribuicao(atribuicao.estado)}>{atribuicao.estado.toLowerCase()}</StatusBadge>
                      {atribuicao.obrigatoria && <StatusBadge cor="amber">obrigatória</StatusBadge>}
                      {atribuicao.entitlementId && <StatusBadge cor="blue">acesso liberado</StatusBadge>}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{atribuicao.programaTitulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Alvo {atribuicao.usuarioId ? `membro ${atribuicao.usuarioId}` : `perfil ${atribuicao.perfilAlvo ?? "Team"}`}
                      {atribuicao.prazoAte ? ` · prazo ${formatarDataCurta(atribuicao.prazoAte)}` : " · sem prazo"}
                    </p>
                  </div>
                  <CalendarClock size={18} className="text-muted-foreground" />
                </div>
                {atribuicao.mensagem && <p className="mt-3 rounded-md bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{atribuicao.mensagem}</p>}
              </article>
            ))}
            {!(dados?.atribuicoes ?? []).length && (
              <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                Sem formações atribuídas. Use este painel para transformar cursos, cohorts ou certificações em trabalho acompanhado pelo Team.
              </p>
            )}
          </div>
        </div>
      </PanelCard>}

      {area === "turmas" && <PanelCard
        titulo="Cohorts, lives e presenças"
        descricao="Abre turmas operacionais com vagas, sala, replay e presença ligada a acesso Learning."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.55fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <form onSubmit={(evento) => void abrirCohort(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock size={16} />
                Abrir cohort
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Programa</span>
                  <select
                    value={cohortForm.programaSlug}
                    onChange={(evento) => setCohortForm((actual) => ({ ...actual, programaSlug: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao) || carregando}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {programas.map((programa) => <option key={programa.slug} value={programa.slug}>{programa.titulo}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Título da turma</span>
                  <input
                    value={cohortForm.titulo}
                    onChange={(evento) => setCohortForm((actual) => ({ ...actual, titulo: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: Turma live de sábado"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Início</span>
                    <input
                      type="datetime-local"
                      value={cohortForm.inicioEm}
                      onChange={(evento) => setCohortForm((actual) => ({ ...actual, inicioEm: evento.target.value }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Fim</span>
                    <input
                      type="datetime-local"
                      value={cohortForm.fimEm}
                      onChange={(evento) => setCohortForm((actual) => ({ ...actual, fimEm: evento.target.value }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Vagas</span>
                    <input
                      value={cohortForm.vagas}
                      onChange={(evento) => setCohortForm((actual) => ({ ...actual, vagas: evento.target.value.replace(/\D/g, "") }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      inputMode="numeric"
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Sala</span>
                    <input
                      value={cohortForm.salaUrl}
                      onChange={(evento) => setCohortForm((actual) => ({ ...actual, salaUrl: evento.target.value }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                      placeholder="https://..."
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Replay</span>
                  <input
                    value={cohortForm.replayUrl}
                    onChange={(evento) => setCohortForm((actual) => ({ ...actual, replayUrl: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="https://..."
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Regras de entrada</span>
                  <textarea
                    value={cohortForm.regrasEntrada}
                    onChange={(evento) => setCohortForm((actual) => ({ ...actual, regrasEntrada: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    rows={3}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: compra confirmada ou atribuição Team."
                  />
                </label>
                <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={cohortForm.replayDisponivel}
                    onChange={(evento) => setCohortForm((actual) => ({ ...actual, replayDisponivel: evento.target.checked }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="size-4"
                  />
                  Replay disponível
                </label>
                <BotaoBizy tipo="submit" icone={CalendarClock} disabled={!dados?.podeAdministrar || Boolean(acao) || !cohortForm.programaSlug}>
                  Abrir turma
                </BotaoBizy>
              </div>
            </form>

            <form onSubmit={(evento) => void registrarPresenca(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserCheck size={16} />
                Registar presença
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Cohort</span>
                  <select
                    value={presencaForm.cohortId}
                    onChange={(evento) => setPresencaForm((actual) => ({ ...actual, cohortId: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao) || !(dados?.cohorts ?? []).length}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {(dados?.cohorts ?? []).map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.titulo}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Membro</span>
                  <input
                    value={presencaForm.usuarioId}
                    onChange={(evento) => setPresencaForm((actual) => ({ ...actual, usuarioId: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="ID do membro"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Notas</span>
                  <textarea
                    value={presencaForm.notas}
                    onChange={(evento) => setPresencaForm((actual) => ({ ...actual, notas: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    rows={3}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: participou e pediu apoio no módulo financeiro."
                  />
                </label>
                <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={presencaForm.presente}
                    onChange={(evento) => setPresencaForm((actual) => ({ ...actual, presente: evento.target.checked }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="size-4"
                  />
                  Presente
                </label>
                <BotaoBizy tipo="submit" icone={UserCheck} disabled={!dados?.podeAdministrar || Boolean(acao) || !presencaForm.cohortId}>
                  Guardar presença
                </BotaoBizy>
              </div>
            </form>
          </div>

          <div className="grid gap-3">
            {(dados?.cohorts ?? []).slice(0, 8).map((cohort) => (
              <article key={cohort.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge cor={corCohort(cohort.estado)}>{cohort.estado.toLowerCase()}</StatusBadge>
                      {cohort.replayDisponivel && <StatusBadge cor="green">replay</StatusBadge>}
                      {cohort.salaUrl && <StatusBadge cor="blue">sala</StatusBadge>}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{cohort.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{cohort.programaTitulo}</p>
                  </div>
                  <UsersRound size={18} className="text-muted-foreground" />
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span className="rounded-md bg-muted px-2 py-2">{cohort.inscritos}/{cohort.vagas ?? "sem limite"} inscritos</span>
                  <span className="rounded-md bg-muted px-2 py-2">{cohort.presencas} presenças</span>
                  <span className="rounded-md bg-muted px-2 py-2">{cohort.inicioEm ? formatarDataCurta(cohort.inicioEm) : "sem data"}</span>
                </div>
                <p className="mt-3 rounded-md bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{cohort.regrasEntrada}</p>
                {cohort.mensagem && <p className="mt-2 text-sm leading-6 text-muted-foreground">{cohort.mensagem}</p>}
              </article>
            ))}
            {!(dados?.cohorts ?? []).length && (
              <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                Sem cohorts abertas. Abra turmas para lives, workshops, mentorias ou certificações com vagas e presença rastreáveis.
              </p>
            )}
          </div>
        </div>
      </PanelCard>}

      {area === "comunidade" && <PanelCard
        titulo="Comunidades e memberships"
        descricao="Cria espaços de discussão, anúncios e materiais ligados a programas, cohorts ou memberships sem misturar com atendimento externo."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.55fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <form onSubmit={(evento) => void criarComunidade(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquareText size={16} />
                Criar comunidade
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Programa</span>
                  <select
                    value={comunidadeForm.programaSlug}
                    onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, programaSlug: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao) || carregando}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {programas.map((programa) => <option key={programa.slug} value={programa.slug}>{programa.titulo}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Nome</span>
                  <input
                    value={comunidadeForm.titulo}
                    onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, titulo: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: Comunidade Fornecedores Market"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Acesso</span>
                    <select
                      value={comunidadeForm.acesso}
                      onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, acesso: evento.target.value as AcessoComunidadeLearning }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="ABERTO">Aberto</option>
                      <option value="ENTITLEMENT">Entitlement</option>
                      <option value="MEMBERSHIP">Membership</option>
                      <option value="CONVITE">Convite</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Moderadores</span>
                    <input
                      value={comunidadeForm.moderadores}
                      onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, moderadores: evento.target.value }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                      placeholder="ADMIN,GESTOR"
                    />
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Tópicos</span>
                  <input
                    value={comunidadeForm.topicos}
                    onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, topicos: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="perguntas, materiais, desafios"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Regras</span>
                  <textarea
                    value={comunidadeForm.regras}
                    onChange={(evento) => setComunidadeForm((actual) => ({ ...actual, regras: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    rows={3}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: materiais premium exigem acesso activo; dúvidas públicas recebem moderação."
                  />
                </label>
                <BotaoBizy tipo="submit" icone={MessageSquareText} disabled={!dados?.podeAdministrar || Boolean(acao) || !comunidadeForm.programaSlug}>
                  Criar comunidade
                </BotaoBizy>
              </div>
            </form>

            <form onSubmit={(evento) => void publicarPostComunidade(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Megaphone size={16} />
                Publicar tópico
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Comunidade</span>
                  <select
                    value={postComunidadeForm.comunidadeId}
                    onChange={(evento) => setPostComunidadeForm((actual) => ({ ...actual, comunidadeId: evento.target.value }))}
                    disabled={Boolean(acao) || !(dados?.comunidades ?? []).length}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {(dados?.comunidades ?? []).map((comunidade) => <option key={comunidade.id} value={comunidade.id}>{comunidade.titulo}</option>)}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Tipo</span>
                    <select
                      value={postComunidadeForm.tipo}
                      onChange={(evento) => setPostComunidadeForm((actual) => ({ ...actual, tipo: evento.target.value as TipoPostComunidadeLearning }))}
                      disabled={Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="ANUNCIO">Anúncio</option>
                      <option value="PERGUNTA">Pergunta</option>
                      <option value="RESPOSTA">Resposta</option>
                      <option value="MATERIAL">Material</option>
                      <option value="DESAFIO">Desafio</option>
                    </select>
                  </label>
                  <label className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm sm:self-end">
                    <input
                      type="checkbox"
                      checked={postComunidadeForm.fixado}
                      onChange={(evento) => setPostComunidadeForm((actual) => ({ ...actual, fixado: evento.target.checked }))}
                      disabled={Boolean(acao)}
                      className="size-4"
                    />
                    Fixar
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Título</span>
                  <input
                    value={postComunidadeForm.titulo}
                    onChange={(evento) => setPostComunidadeForm((actual) => ({ ...actual, titulo: evento.target.value }))}
                    disabled={Boolean(acao)}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    placeholder="Ex.: Materiais da live de sábado"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Conteúdo</span>
                  <textarea
                    value={postComunidadeForm.conteudo}
                    onChange={(evento) => setPostComunidadeForm((actual) => ({ ...actual, conteudo: evento.target.value }))}
                    disabled={Boolean(acao)}
                    rows={4}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Escreva o anúncio, pergunta, material ou desafio para a comunidade."
                  />
                </label>
                <BotaoBizy tipo="submit" icone={Megaphone} disabled={Boolean(acao) || !postComunidadeForm.comunidadeId || !postComunidadeForm.conteudo.trim()}>
                  Publicar
                </BotaoBizy>
              </div>
            </form>
          </div>

          <div className="grid gap-3">
            {(dados?.comunidades ?? []).slice(0, 8).map((comunidade) => (
              <article key={comunidade.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge cor={corComunidade(comunidade.estado)}>{comunidade.estado.toLowerCase()}</StatusBadge>
                      <StatusBadge cor={comunidade.acesso === "ABERTO" ? "green" : "blue"}>{comunidade.acesso.toLowerCase()}</StatusBadge>
                      {comunidade.posts > 0 && <StatusBadge cor="amber">{comunidade.posts} post(s)</StatusBadge>}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{comunidade.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{comunidade.programaTitulo}</p>
                  </div>
                  <MessageSquareText size={18} className="text-muted-foreground" />
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span className="rounded-md bg-muted px-2 py-2">{comunidade.membros} membros</span>
                  <span className="rounded-md bg-muted px-2 py-2">{comunidade.anuncios} anúncios</span>
                  <span className="rounded-md bg-muted px-2 py-2">{comunidade.perguntas} perguntas</span>
                  <span className="rounded-md bg-muted px-2 py-2">{comunidade.ultimaAtividade ? formatarDataCurta(comunidade.ultimaAtividade) : "sem atividade"}</span>
                </div>
                <p className="mt-3 rounded-md bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{comunidade.regras}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {comunidade.topicos.map((topico) => <span key={topico} className="rounded-full bg-muted px-2.5 py-1">{topico}</span>)}
                </div>
                {comunidade.postsRecentes.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {comunidade.postsRecentes.slice(0, 2).map((post) => (
                      <div key={post.id} className="rounded-md border bg-background p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong>{post.titulo || post.tipo.toLowerCase()}</strong>
                          <span className="text-xs text-muted-foreground">{post.autorNome} · {formatarDataCurta(post.criadoEm)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-muted-foreground">{post.conteudo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {!(dados?.comunidades ?? []).length && (
              <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                Sem comunidades activas. Crie espaços para memberships, cohorts, perguntas e materiais pós-live.
              </p>
            )}
          </div>
        </div>
      </PanelCard>}

      {area === "configuracoes" && <PanelCard
        titulo="Governança e moderação Learning"
        descricao="Regista denúncias, revisão humana, ocultação temporária e decisão auditável para produtos, comunidades, posts, mentores e certificados."
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.58fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <form onSubmit={(evento) => void denunciarConteudo(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={16} />
                Abrir denúncia
              </div>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Alvo</span>
                    <select
                      value={moderacaoForm.alvoTipo}
                      onChange={(evento) => {
                        const alvoTipo = evento.target.value as TipoAlvoModeracaoLearning;
                        const primeiraOpcao = opcoesAlvoModeracao(alvoTipo, programas, dados?.comunidades ?? [], postsModeraveis, dados?.certificados ?? [])[0]?.id || "";
                        setModeracaoForm((actual) => ({ ...actual, alvoTipo, alvoId: primeiraOpcao }));
                      }}
                      disabled={Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="PROGRAMA">Programa</option>
                      <option value="COMUNIDADE">Comunidade</option>
                      <option value="POST">Post</option>
                      <option value="PERFIL">Perfil</option>
                      <option value="MENTOR">Mentor</option>
                      <option value="CERTIFICADO">Certificado</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Item</span>
                    {opcoesModeracao.length > 0 ? (
                      <select
                        value={moderacaoForm.alvoId}
                        onChange={(evento) => setModeracaoForm((actual) => ({ ...actual, alvoId: evento.target.value }))}
                        disabled={Boolean(acao)}
                        className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                      >
                        {opcoesModeracao.map((opcao) => <option key={opcao.id} value={opcao.id}>{opcao.titulo}</option>)}
                      </select>
                    ) : (
                      <input
                        value={moderacaoForm.alvoId}
                        onChange={(evento) => setModeracaoForm((actual) => ({ ...actual, alvoId: evento.target.value }))}
                        disabled={Boolean(acao)}
                        className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                        placeholder="ID do alvo"
                      />
                    )}
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Motivo</span>
                    <select
                      value={moderacaoForm.motivo}
                      onChange={(evento) => setModeracaoForm((actual) => ({ ...actual, motivo: evento.target.value as MotivoModeracaoLearning }))}
                      disabled={Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="CONTEUDO_SENSIVEL">Conteúdo sensível</option>
                      <option value="SPAM">Spam</option>
                      <option value="DIREITOS_AUTORAIS">Direitos autorais</option>
                      <option value="FRAUDE">Fraude</option>
                      <option value="ASSEDIO">Assédio</option>
                      <option value="INFORMACAO_ERRADA">Informação errada</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Severidade</span>
                    <select
                      value={moderacaoForm.severidade}
                      onChange={(evento) => setModeracaoForm((actual) => ({ ...actual, severidade: evento.target.value as SeveridadeModeracaoLearning }))}
                      disabled={Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Descrição</span>
                  <textarea
                    value={moderacaoForm.descricao}
                    onChange={(evento) => setModeracaoForm((actual) => ({ ...actual, descricao: evento.target.value }))}
                    disabled={Boolean(acao)}
                    rows={4}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Explique o problema, impacto e contexto para revisão humana."
                  />
                </label>
                <BotaoBizy tipo="submit" icone={AlertTriangle} disabled={Boolean(acao) || !moderacaoForm.alvoId || !moderacaoForm.descricao.trim()}>
                  Registar denúncia
                </BotaoBizy>
              </div>
            </form>

            <form onSubmit={(evento) => void decidirModeracao(evento)} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck size={16} />
                Decisão de moderação
              </div>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Caso</span>
                  <select
                    value={decisaoModeracaoForm.casoId}
                    onChange={(evento) => setDecisaoModeracaoForm((actual) => ({ ...actual, casoId: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao) || !(dados?.moderacao ?? []).length}
                    className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {(dados?.moderacao ?? []).map((caso) => <option key={caso.id} value={caso.id}>{caso.tituloAlvo}</option>)}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Ação</span>
                    <select
                      value={decisaoModeracaoForm.acao}
                      onChange={(evento) => setDecisaoModeracaoForm((actual) => ({ ...actual, acao: evento.target.value as AcaoModeracaoLearning }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="COLOCAR_EM_REVISAO">Colocar em revisão</option>
                      <option value="OCULTAR_TEMPORARIAMENTE">Ocultar temporariamente</option>
                      <option value="RESOLVER">Resolver</option>
                      <option value="REJEITAR">Rejeitar</option>
                      <option value="REABRIR">Reabrir</option>
                    </select>
                  </label>
                  <label className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm sm:self-end">
                    <input
                      type="checkbox"
                      checked={decisaoModeracaoForm.ocultoPublicamente}
                      onChange={(evento) => setDecisaoModeracaoForm((actual) => ({ ...actual, ocultoPublicamente: evento.target.checked }))}
                      disabled={!dados?.podeAdministrar || Boolean(acao)}
                      className="size-4"
                    />
                    Ocultar no público
                  </label>
                </div>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Decisão</span>
                  <textarea
                    value={decisaoModeracaoForm.decisao}
                    onChange={(evento) => setDecisaoModeracaoForm((actual) => ({ ...actual, decisao: evento.target.value }))}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                    rows={3}
                    className="resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="Registe a decisão, evidência ou próxima ação."
                  />
                </label>
                <BotaoBizy tipo="submit" icone={ShieldCheck} disabled={!dados?.podeAdministrar || Boolean(acao) || !decisaoModeracaoForm.casoId}>
                  Registar decisão
                </BotaoBizy>
              </div>
            </form>
          </div>

          <div className="grid gap-3">
            {(dados?.moderacao ?? []).slice(0, 10).map((caso) => (
              <article key={caso.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge cor={corModeracao(caso.estado)}>{caso.estado.toLowerCase()}</StatusBadge>
                      <StatusBadge cor={corSeveridade(caso.severidade)}>{caso.severidade.toLowerCase()}</StatusBadge>
                      {caso.ocultoPublicamente && <StatusBadge cor="rose">oculto</StatusBadge>}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{caso.tituloAlvo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {rotuloAlvoModeracao(caso.alvoTipo)} · {caso.motivo.toLowerCase()} · {formatarDataCurta(caso.atualizadoEm)}
                    </p>
                  </div>
                  <ShieldCheck size={18} className="text-muted-foreground" />
                </div>
                <p className="mt-3 rounded-md bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">{caso.descricao}</p>
                {caso.decisao && <p className="mt-2 text-sm leading-6 text-muted-foreground">Decisão: {caso.decisao}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <BotaoBizy
                    variante="secondary"
                    icone={ShieldCheck}
                    onClick={() => void decidirModeracaoRapida(caso, "COLOCAR_EM_REVISAO")}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                  >
                    Revisar
                  </BotaoBizy>
                  <BotaoBizy
                    variante="secondary"
                    icone={AlertTriangle}
                    onClick={() => void decidirModeracaoRapida(caso, "OCULTAR_TEMPORARIAMENTE")}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                  >
                    Ocultar
                  </BotaoBizy>
                  <BotaoBizy
                    variante="ghost"
                    icone={CheckCircle2}
                    onClick={() => void decidirModeracaoRapida(caso, "RESOLVER")}
                    disabled={!dados?.podeAdministrar || Boolean(acao)}
                  >
                    Resolver
                  </BotaoBizy>
                </div>
              </article>
            ))}
            {!(dados?.moderacao ?? []).length && (
              <p className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                Sem casos de moderação. Denúncias de produtos, posts, comunidades, mentores e certificados aparecem aqui para revisão humana.
              </p>
            )}
          </div>
        </div>
      </PanelCard>}

      {area === "programas" && <PanelCard
        titulo="Criar programa administrado pelo Team"
        descricao="Define perfil dono, perfis-alvo, formato e primeira lição aplicável ao Bizy."
        acaoTexto={dados?.podeAdministrar ? undefined : "Sem permissão"}
        acaoIcone={LockKeyhole}
      >
        <form onSubmit={(evento) => void criarPrograma(evento)} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_160px_160px]">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Título</span>
            <input
              value={form.titulo}
              onChange={(evento) => setForm((actual) => ({ ...actual, titulo: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="Ex.: Vender por live no fim de semana"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Categoria</span>
            <select
              value={form.categoria}
              onChange={(evento) => setForm((actual) => ({ ...actual, categoria: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {CATEGORIAS_PADRAO.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Dono perfil</span>
            <select
              value={form.ownerPerfil}
              onChange={(evento) => setForm((actual) => ({ ...actual, ownerPerfil: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {PERFIS_PADRAO.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <BotaoBizy tipo="submit" icone={Plus} disabled={!dados?.podeAdministrar || criando || !form.titulo.trim()}>
            Criar
          </BotaoBizy>
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Perfis-alvo</span>
            <input
              value={form.perfisAlvo}
              onChange={(evento) => setForm((actual) => ({ ...actual, perfisAlvo: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Formato</span>
            <select
              value={form.formato}
              onChange={(evento) => setForm((actual) => ({ ...actual, formato: evento.target.value as FormatoProgramaLearning }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="CURSO">Curso</option>
              <option value="MICROLEARNING">Microlearning</option>
              <option value="LIVE">Live</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="MENTORIA">Mentoria</option>
              <option value="TRILHO">Trilho</option>
              <option value="COHORT">Cohort</option>
              <option value="COMUNIDADE">Comunidade</option>
              <option value="MEMBERSHIP">Membership</option>
              <option value="CERTIFICACAO">Certificação</option>
              <option value="BUNDLE">Bundle</option>
              <option value="ACADEMIA">Academia</option>
              <option value="DOWNLOAD">Download digital</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Nível</span>
            <select
              value={form.nivel}
              onChange={(evento) => setForm((actual) => ({ ...actual, nivel: evento.target.value as NivelLearning }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="INICIAL">Inicial</option>
              <option value="INTERMEDIO">Intermédio</option>
              <option value="AVANCADO">Avançado</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Acesso</span>
            <select
              value={form.tipoAcesso}
              onChange={(evento) => setForm((actual) => ({ ...actual, tipoAcesso: evento.target.value as TipoAcessoLearning }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="GRATUITO">Gratuito</option>
              <option value="PAGO">Pago</option>
              <option value="OBRIGATORIO">Obrigatório Team</option>
              <option value="CONVITE">Convite</option>
              <option value="PRIVADO">Privado</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Preço AOA</span>
            <input
              value={form.valor}
              onChange={(evento) => setForm((actual) => ({ ...actual, valor: evento.target.value.replace(/\D/g, "") }))}
              disabled={!dados?.podeAdministrar || criando || form.tipoAcesso !== "PAGO"}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              placeholder="0"
              inputMode="numeric"
            />
          </label>
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Resultado esperado</span>
            <input
              value={form.resultadoEsperado}
              onChange={(evento) => setForm((actual) => ({ ...actual, resultadoEsperado: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="O que muda no trabalho da equipa"
            />
          </label>
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Cupões</span>
            <input
              value={form.cupoes}
              onChange={(evento) => setForm((actual) => ({ ...actual, cupoes: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando || form.tipoAcesso !== "PAGO"}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              placeholder="BIZY10, TEAM20"
            />
          </label>
          <label className="grid gap-1.5 lg:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Primeira lição</span>
            <input
              value={form.licaoTitulo}
              onChange={(evento) => setForm((actual) => ({ ...actual, licaoTitulo: evento.target.value }))}
              disabled={!dados?.podeAdministrar || criando}
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="Checklist prático inicial"
            />
          </label>
        </form>
      </PanelCard>}

      {["programas", "conteudos", "biblioteca"].includes(area) && <PanelCard
        titulo={area === "conteudos" ? "Lições e progresso" : area === "biblioteca" ? "Biblioteca Learning" : "Programas, publicação e progresso"}
        descricao={area === "biblioteca" ? "Materiais de consulta, downloads e conjuntos de conteúdo disponíveis." : "Gestão operacional do catálogo, da estrutura e do progresso."}
      >
        <div className="grid gap-3">
          {carregando && Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />)}
          {!carregando && programasDaArea.map((programa) => (
            <article key={programa.slug} className="rounded-lg border bg-background p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.32fr)] lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge cor={programa.estado === "PUBLICADO" ? "green" : programa.estado === "RASCUNHO" ? "amber" : "mute"}>
                      {programa.estado.toLowerCase()}
                    </StatusBadge>
                    <StatusBadge cor={programa.visibilidade === "PUBLICO" ? "blue" : "mute"}>
                      {programa.visibilidade === "PUBLICO" ? "home pública" : "Team"}
                    </StatusBadge>
                    <StatusBadge cor={programa.tipoAcesso === "PAGO" ? "green" : programa.tipoAcesso === "GRATUITO" ? "blue" : "amber"}>
                      {programa.tipoAcesso.toLowerCase()}
                    </StatusBadge>
                    {programa.destaque && <StatusBadge cor="green">destaque</StatusBadge>}
                    <PillBizy>{programa.origem}</PillBizy>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{programa.titulo}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{programa.subtitulo}</p>
                  {area === "conteudos" && (
                    <div className="learning-team-lessons" aria-label={`Lições de ${programa.titulo}`}>
                      {programa.licoes.slice(0, 5).map((licao, indice) => (
                        <span key={licao.id}><b>{indice + 1}</b>{licao.titulo}</span>
                      ))}
                      {!programa.licoes.length && <span>Nenhuma lição configurada.</span>}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={13} /> Owner {programa.ownerPerfil}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {programa.duracaoMinutos} min</span>
                    <span className="inline-flex items-center gap-1"><GraduationCap size={13} /> {programa.perfisAlvo.join(", ")}</span>
                    <span className="inline-flex items-center gap-1"><CreditCard size={13} /> {rotuloPreco(programa)}</span>
                    {programa.certificadoConfigurado && <span className="inline-flex items-center gap-1"><BadgeCheck size={13} /> certificado</span>}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${programa.progresso?.percentual ?? 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{programa.progresso?.percentual ?? 0}% concluído</p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  {programa.tipoAcesso === "PAGO" ? (
                    <BotaoBizy variante="secondary" icone={CreditCard} onClick={() => void comprar(programa)} disabled={Boolean(acao) || programa.estado !== "PUBLICADO"}>
                      Comprar/acesso
                    </BotaoBizy>
                  ) : (
                    <BotaoBizy variante="secondary" onClick={() => void inscrever(programa)} disabled={Boolean(acao) || programa.estado !== "PUBLICADO"}>
                      {programa.progresso?.inscrito ? "Inscrito" : "Inscrever"}
                    </BotaoBizy>
                  )}
                  <BotaoBizy variante="tertiary" icone={CheckCircle2} onClick={() => void concluirProxima(programa)} disabled={Boolean(acao) || programa.estado !== "PUBLICADO" || programa.licoes.length === 0}>
                    Concluir lição
                  </BotaoBizy>
                  <BotaoBizy variante="tertiary" icone={BadgeCheck} onClick={() => void emitirCertificado(programa)} disabled={Boolean(acao) || !programa.certificadoConfigurado || !programa.progresso?.concluido}>
                    Certificado
                  </BotaoBizy>
                  {dados?.podeAdministrar && (
                    <>
                      <BotaoBizy variante="tertiary" onClick={() => void publicar(programa)} disabled={Boolean(acao)}>
                        {programa.estado === "PUBLICADO" ? "Retirar" : "Publicar"}
                      </BotaoBizy>
                      <BotaoBizy variante="ghost" icone={Sparkles} onClick={() => void destacar(programa)} disabled={Boolean(acao)}>
                        {programa.destaque ? "Remover destaque" : "Destacar"}
                      </BotaoBizy>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!carregando && !programasDaArea.length && (
            <div className="learning-team-empty">
              <BookOpenCheck size={22} aria-hidden="true" />
              <strong>Nenhum conteúdo nesta área</strong>
              <span>Publique um programa compatível para o tornar disponível aqui.</span>
            </div>
          )}
        </div>
      </PanelCard>}

      {area === "certificados" && <PanelCard
        titulo="Certificados emitidos"
        descricao="Credenciais verificáveis e respetivo estado de validade."
      >
        <div className="learning-team-record-list">
          {(dados?.certificados ?? []).map((certificado) => (
            <article key={certificado.id} className="learning-team-record">
              <BadgeCheck size={18} aria-hidden="true" />
              <div>
                <strong>{programas.find((programa) => programa.slug === certificado.programaSlug)?.titulo ?? certificado.programaSlug}</strong>
                <span>Emitido em {formatarDataCurta(certificado.emitidoEm)} · código {certificado.codigoVerificacao}</span>
              </div>
              <StatusBadge cor={certificado.estado === "VALIDO" ? "green" : "mute"}>{certificado.estado.toLowerCase()}</StatusBadge>
            </article>
          ))}
          {!(dados?.certificados ?? []).length && (
            <div className="learning-team-empty">
              <BadgeCheck size={22} aria-hidden="true" />
              <strong>Nenhum certificado emitido</strong>
              <span>Os certificados aparecem quando uma pessoa conclui um programa elegível.</span>
            </div>
          )}
        </div>
      </PanelCard>}

      {area === "compras" && <PanelCard
        titulo="Compras digitais e acessos"
        descricao="Checkout Learning gera compra, documento, origem financeira e entitlement rastreável."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard size={16} />
              Compras recentes
            </div>
            <div className="mt-3 grid gap-2">
              {(dados?.compras ?? []).slice(0, 5).map((compra) => (
                <div key={compra.id} className="rounded-md bg-muted/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{compra.programaSlug}</strong>
                    <StatusBadge cor={corCompra(compra.estado)}>{compra.estado.toLowerCase()}</StatusBadge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatarKwanza(compra.valor, compra.moeda)}</span>
                    {compra.factura && <span className="inline-flex items-center gap-1"><FileText size={13} /> {compra.factura.numero}</span>}
                    {compra.motivoAjuste && <span>{compra.motivoAjuste}</span>}
                  </div>
                  {dados?.podeAdministrar && compra.estado === "CONFIRMADO" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <BotaoBizy
                        variante="secondary"
                        icone={RefreshCcw}
                        onClick={() => void ajustarCompra(compra, "REEMBOLSADO")}
                        disabled={Boolean(acao)}
                      >
                        Reembolsar e revogar
                      </BotaoBizy>
                    </div>
                  )}
                  {dados?.podeAdministrar && compra.estado === "PENDENTE_VALIDACAO" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <BotaoBizy
                        variante="danger"
                        icone={AlertTriangle}
                        onClick={() => void ajustarCompra(compra, "CANCELADO")}
                        disabled={Boolean(acao)}
                      >
                        Cancelar
                      </BotaoBizy>
                    </div>
                  )}
                </div>
              ))}
              {!(dados?.compras ?? []).length && <p className="text-sm text-muted-foreground">Sem compras Learning registadas.</p>}
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LockKeyhole size={16} />
              Entitlements
            </div>
            <div className="mt-3 grid gap-2">
              {(dados?.entitlements ?? []).slice(0, 5).map((entitlement) => (
                <div key={entitlement.id} className="rounded-md bg-muted/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{entitlement.programaSlug}</strong>
                    <StatusBadge cor={entitlement.estado === "ATIVO" ? "green" : "mute"}>{entitlement.estado.toLowerCase()}</StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Origem {entitlement.origem.toLowerCase()} · {formatarDataCurta(entitlement.acessoDesde)}</p>
                  {dados?.podeAdministrar && entitlement.estado === "ATIVO" && (
                    <div className="mt-3">
                      <BotaoBizy
                        variante="secondary"
                        icone={LockKeyhole}
                        onClick={() => void revogarAcesso(entitlement)}
                        disabled={Boolean(acao)}
                      >
                        Revogar acesso
                      </BotaoBizy>
                    </div>
                  )}
                </div>
              ))}
              {!(dados?.entitlements ?? []).length && <p className="text-sm text-muted-foreground">Sem acessos digitais activos.</p>}
            </div>
          </div>
        </div>
      </PanelCard>}
    </CrmPageMotion>
  );
}

function MetricHero({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <div className="rounded-lg border border-white/18 bg-white/12 p-4 text-white backdrop-blur">
      <strong className="block text-2xl font-semibold">{valor}</strong>
      <span className="mt-1 block text-xs font-medium uppercase tracking-normal text-white/62">{rotulo}</span>
    </div>
  );
}

function SinalLearning({
  icone: Icone,
  titulo,
  texto
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 p-5 transition-all hover:border-neutral-300">
      <span className="inline-flex size-10 items-center justify-center bg-neutral-100 text-neutral-700 mb-3">
        <Icone size={18} />
      </span>
      <h3 className="text-sm font-bold text-neutral-900">{titulo}</h3>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">{texto}</p>
    </div>
  );
}

const ICONES_FAMILIA_LEARNING: LucideIcon[] = [
  BookOpenCheck,
  Clock3,
  UsersRound,
  GraduationCap,
  BadgeCheck,
  FileText
];

function FamiliaLearningPublica({
  familia,
  indice,
  totalProdutos
}: {
  familia: string;
  indice: number;
  totalProdutos: number;
}) {
  const Icone = ICONES_FAMILIA_LEARNING[indice % ICONES_FAMILIA_LEARNING.length];
  return (
    <article className="learn-format-card animate-fade-in" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
      <span className="inline-flex size-10 items-center justify-center bg-white/10 text-white mb-3">
        <Icone size={18} />
      </span>
      <h3 className="text-sm font-bold text-white">{familia}</h3>
      <p className="mt-2 text-xs leading-5 text-white/70">
        Programa didático estruturado com progresso rastreável, regras claras e apoio.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/50 border-t border-white/10 pt-3">
        <span>{totalProdutos || "Novo"} produto(s)</span>
        <span className="font-semibold uppercase tracking-normalr text-white/40">Learning</span>
      </div>
    </article>
  );
}



function obterIconeFormato(formato: FormatoProgramaLearning): LucideIcon {
  const icones: Record<FormatoProgramaLearning, LucideIcon> = {
    CURSO: BookOpenCheck,
    MICROLEARNING: Clock3,
    LIVE: PlayCircle,
    WORKSHOP: CalendarClock,
    MENTORIA: UserCheck,
    CERTIFICACAO: BadgeCheck,
    COMUNIDADE: MessageSquareText,
    MEMBERSHIP: LockKeyhole,
    BUNDLE: Layers3,
    TRILHO: Compass,
    TRILHA: Compass,
    ACADEMIA: GraduationCap,
    DOWNLOAD: FileText,
    COHORT: UsersRound
  };
  return icones[formato] || BookOpenCheck;
}

function CabecalhoLearningComercial({
  busca,
  categoriaSelecionada,
  formatoSelecionado,
  categorias,
  onBusca,
  onCategoria,
  onFormato,
  onLimpar,
  lowData = false,
  onLowData = () => undefined,
  placeholder = "Buscar cursos, mentorias e comunidades..."
}: {
  busca: string;
  categoriaSelecionada: string;
  formatoSelecionado: string;
  categorias: string[];
  onBusca: (valor: string) => void;
  onCategoria: (categoria: string) => void;
  onFormato: (formato: string) => void;
  onLimpar: () => void;
  lowData?: boolean;
  onLowData?: () => void;
  placeholder?: string;
}) {
  return (
    <header aria-label="Cabeçalho do Bizy Learning" style={{ width: "100%" }}>
      <div className="learn-topbar" aria-label="Benefícios do Bizy Learning">
        <div className="learn-topbar-left">
          <BookOpenCheck size={14} />
          <span>Cursos práticos · Mentoria com especialistas · Certificado digital</span>
        </div>
        <div className="learn-topbar-right">
          <Link to="/app/learning">
            <span>Área do Criador</span>
          </Link>
          <span>Progresso</span>
          <span>PT · Kz</span>
        </div>
      </div>

      <div className="learn-navbar">
        <Link to="/learning" className="learn-brand" aria-label="Abrir Bizy Learning">
          <LogoBizy className="learn-brand-logo" titulo="Bizy" />
          <span className="learn-brand-tag">Learning</span>
        </Link>

        <form className="learn-search" role="search" onSubmit={(evento) => evento.preventDefault()}>
          <Search className="learn-search-icon" size={18} aria-hidden="true" />
          <input
            aria-label="Buscar no Bizy Learning"
            value={busca}
            onChange={(evento) => onBusca(evento.target.value)}
            placeholder={categoriaSelecionada ? `Buscar em ${categoriaSelecionada}` : placeholder}
          />
          {busca && (
            <button type="button" className="learn-search-clear" onClick={onLimpar} aria-label="Limpar busca">
              <X size={15} />
            </button>
          )}
        </form>

        <div className="learn-nav-actions" aria-label="Ações rápidas">
          <button type="button" className={`learn-nav-link ${lowData ? "active" : ""}`} onClick={onLowData} aria-pressed={lowData} aria-label="Alternar modo de dados reduzidos" title="Dados reduzidos">
            <WifiOff size={18} />
          </button>
          <Link to="/market" className="learn-nav-link" aria-label="Ir para o Market">
            <Store size={18} />
            <span>Market</span>
          </Link>
          <Link to="/app/learning" className="learn-nav-link" aria-label="Abrir dashboard">
            <User size={18} />
            <span>Painel</span>
          </Link>
        </div>
      </div>

      <nav className="learn-filters" aria-label="Categorias do Learning">
        <button
          type="button"
          className={`learn-pill ${!categoriaSelecionada && !formatoSelecionado ? "active" : ""}`}
          onClick={onLimpar}
        >
          Todos
        </button>
        {categorias.slice(0, 6).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`learn-pill ${categoriaSelecionada === cat ? "active" : ""}`}
            onClick={() => onCategoria(cat)}
          >
            {cat}
          </button>
        ))}
        {["CURSO", "MENTORIA", "COHORT", "COMUNIDADE"].map((fmt) => (
          <button
            key={fmt}
            type="button"
            className={`learn-pill ${formatoSelecionado === fmt ? "active" : ""}`}
            onClick={() => onFormato(fmt)}
          >
            {fmt === "CURSO" ? "Cursos" : fmt === "MENTORIA" ? "Mentorias" : fmt === "COHORT" ? "Turmas ao Vivo" : "Comunidades"}
          </button>
        ))}
      </nav>
    </header>
  );
}

function SecaoConfiancaLearning() {
  const itens = [
    { icon: BookOpenCheck, titulo: "Ensino Prático", texto: "Foco total em execução" },
    { icon: ShieldCheck, titulo: "Compra Segura", texto: "Garantia e suporte Bizy" },
    { icon: GraduationCap, titulo: "Certificação Real", texto: "Certificados digitais válidos" },
    { icon: Compass, titulo: "Apoio do Mentor", texto: "Alinhado com especialistas" }
  ];

  return (
    <section
      aria-label="Confiança no Bizy Learning"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        flexWrap: "wrap",
        padding: "16px 24px",
        borderBottom: "1px solid var(--learn-border)",
        background: "var(--learn-surface)",
        fontSize: "13px"
      }}
    >
      {itens.map(({ icon: Icone, titulo, texto }) => (
        <div key={titulo} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Icone size={16} style={{ color: "var(--learn-ink-2)", flexShrink: 0 }} />
          <span>
            <strong style={{ color: "var(--learn-ink)", fontWeight: 700 }}>{titulo}</strong>{" "}
            <span style={{ color: "var(--learn-ink-3)" }}>{texto}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

function PerfilLearningPublicoCard({ perfil }: { perfil: PerfilLearningPublico }) {
  return (
    <article className="learn-profile-card">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex size-11 shrink-0 items-center justify-center bg-neutral-100 text-neutral-700">
          <GraduationCap size={20} />
        </span>
        <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 text-xs font-bold text-neutral-600">
          {perfil.metricas.programas} produto(s)
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-tight text-neutral-900">{perfil.nomePublico}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-500">{perfil.descricaoPublica}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {perfil.categorias.slice(0, 4).map((categoria) => (
          <span key={categoria} className="bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600">
            {categoria}
          </span>
        ))}
      </div>
      <div className="mt-4 grid gap-2 text-xs text-neutral-500 sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5"><CreditCard size={14} /> {perfil.metricas.pagos} pagos</span>
        <span className="inline-flex items-center gap-1.5"><MessageSquareText size={14} /> {perfil.metricas.comunidades} comunidades</span>
        <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} /> {perfil.metricas.certificados} certificados</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {perfil.metricas.minutos} min</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5 border-t border-neutral-100">
        <span className="min-w-0 truncate text-xs font-medium text-neutral-400">{perfil.nomeNegocio}</span>
        <Link to={perfil.urlPublica} className="learn-program-cta" style={{ textDecoration: "none" }}>
          Visitar
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function ProgramaLearningPublico({ programa }: { programa: ProgramaLearning }) {
  const Icone = obterIconeFormato(programa.formato);

  return (
    <article className="learn-program-card">
      <Link
        to={`/learning/produtos/${programa.slug}`}
        className={`learn-program-media format-${programa.formato.toLowerCase()}`}
      >
        <Icone size={40} className="learn-program-media-icon" />
        <span className="learn-program-badge">
          {programa.formato.toLowerCase()}
        </span>
        {programa.destaque && (
          <span className="learn-program-destaque">
            <Sparkles size={10} />
            Destaque
          </span>
        )}
      </Link>
      <div className="learn-program-body">
        <div className="learn-program-meta">
          <span className="learn-program-cat">
            {programa.categoria}
          </span>
          <span className="text-neutral-300">·</span>
          <span className="learn-program-level">
            {programa.nivel === "INICIAL" ? "Iniciante" : programa.nivel === "INTERMEDIO" ? "Intermediário" : "Avançado"}
          </span>
        </div>

        <Link
          to={`/learning/produtos/${programa.slug}`}
          className="learn-program-title"
        >
          {programa.titulo}
        </Link>
        
        <p className="learn-program-subtitle">
          {programa.subtitulo}
        </p>

        <div className={`learn-program-price ${programa.tipoAcesso !== "PAGO" ? "free" : ""}`}>
          {rotuloPreco(programa)}
        </div>

        <div className="learn-program-signals">
          <span>
            <Clock3 size={13} />
            {programa.duracaoMinutos} min de aulas
          </span>
          <span>
            <BookOpenCheck size={13} />
            {programa.licoes.length} lições práticas
          </span>
          {programa.certificadoConfigurado && (
            <span className="cert">
              <BadgeCheck size={13} />
              Certificado Verificável
            </span>
          )}
        </div>

        <div className="learn-program-footer">
          <span className="learn-program-mentor">
            <User size={13} />
            {programa.mentorNome || "Academy " + (programa.ownerPerfil === "DONO" ? "Bizy" : programa.ownerPerfil)}
          </span>
          
          <Link
            to={`/learning/produtos/${programa.slug}`}
            className="learn-program-cta"
          >
            Aceder
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function rotuloPreco(programa: ProgramaLearning): string {
  if (programa.tipoAcesso !== "PAGO") return programa.tipoAcesso === "GRATUITO" ? "Gratuito" : programa.tipoAcesso.toLowerCase();
  const valor = typeof programa.oferta.valorPromocional === "number" && programa.oferta.valorPromocional > 0
    ? programa.oferta.valorPromocional
    : programa.oferta.valor;
  return formatarKwanza(valor, programa.oferta.moeda);
}

function dataLocalParaIso(valor: string): string | null {
  if (!valor) return null;
  const data = new Date(`${valor}T23:59:59.000`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function dataHoraLocalParaIso(valor: string): string | null {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function corAtribuicao(estado: EstadoAtribuicaoLearning): "green" | "amber" | "mute" | "blue" {
  if (estado === "CONCLUIDA") return "green";
  if (estado === "ATRASADA") return "amber";
  if (estado === "REVOGADA") return "mute";
  return "blue";
}

function corCompra(estado: CompraLearning["estado"]): "green" | "amber" | "mute" | "rose" {
  if (estado === "CONFIRMADO") return "green";
  if (estado === "PENDENTE_VALIDACAO") return "amber";
  if (estado === "REEMBOLSADO") return "rose";
  return "mute";
}

function corCohort(estado: EstadoCohortLearning): "green" | "amber" | "mute" | "blue" {
  if (estado === "EM_ANDAMENTO" || estado === "ABERTO") return "green";
  if (estado === "AGENDADO") return "blue";
  if (estado === "CANCELADO") return "mute";
  return "amber";
}

function corComunidade(estado: EstadoComunidadeLearning): "green" | "amber" | "mute" | "blue" {
  if (estado === "ABERTA") return "green";
  if (estado === "PRIVADA") return "blue";
  if (estado === "PAUSADA") return "amber";
  return "mute";
}

function corModeracao(estado: EstadoCasoModeracaoLearning): "green" | "amber" | "mute" | "blue" | "rose" {
  if (estado === "RESOLVIDO") return "green";
  if (estado === "REJEITADO") return "mute";
  if (estado === "OCULTO_TEMPORARIAMENTE") return "rose";
  if (estado === "EM_REVISAO") return "amber";
  return "blue";
}

function corSeveridade(severidade: SeveridadeModeracaoLearning): "green" | "amber" | "blue" | "rose" {
  if (severidade === "CRITICA") return "rose";
  if (severidade === "ALTA") return "amber";
  if (severidade === "BAIXA") return "green";
  return "blue";
}

function rotuloAlvoModeracao(tipo: TipoAlvoModeracaoLearning): string {
  const rotulos: Record<TipoAlvoModeracaoLearning, string> = {
    PROGRAMA: "Programa",
    COMUNIDADE: "Comunidade",
    POST: "Post",
    PERFIL: "Perfil",
    MENTOR: "Mentor",
    CERTIFICADO: "Certificado"
  };
  return rotulos[tipo];
}

function opcoesAlvoModeracao(
  tipo: TipoAlvoModeracaoLearning,
  programas: ProgramaLearning[],
  comunidades: ResumoLearningTeamResposta["comunidades"],
  posts: Array<{ id: string; titulo: string }>,
  certificados: CertificadoLearning[]
): Array<{ id: string; titulo: string }> {
  if (tipo === "PROGRAMA") return programas.map((programa) => ({ id: programa.slug, titulo: programa.titulo }));
  if (tipo === "COMUNIDADE") return comunidades.map((comunidade) => ({ id: comunidade.id, titulo: comunidade.titulo }));
  if (tipo === "POST") return posts;
  if (tipo === "PERFIL") return PERFIS_PADRAO.map((perfil) => ({ id: perfil, titulo: perfil }));
  if (tipo === "MENTOR") {
    const mentores = programas
      .map((programa) => programa.mentorNome || programa.ownerPerfil)
      .filter((mentor): mentor is string => Boolean(mentor));
    return [...new Set(mentores)].map((mentor) => ({ id: mentor, titulo: mentor }));
  }
  return certificados.map((certificado) => ({ id: certificado.id, titulo: certificado.codigoVerificacao }));
}

function formatarKwanza(valor: number, moeda = "AOA"): string {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: moeda,
    maximumFractionDigits: 0
  }).format(valor || 0);
}

function formatarKwanzaCompacto(valor: number): string {
  if (!valor) return "0 AOA";
  return new Intl.NumberFormat("pt-AO", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(valor);
}

function formatarDataCurta(valor: string): string {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-AO", { day: "2-digit", month: "short" }).format(data);
}
