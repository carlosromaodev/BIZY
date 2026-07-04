import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Compass,
  CreditCard,
  FileText,
  GraduationCap,
  Layers3,
  LockKeyhole,
  MessageCircle,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
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
  checkoutLearning,
  concluirLicaoLearning,
  criarProdutoLearningTeam,
  emitirCertificadoLearning,
  enviarMensagemChatLearning,
  inscreverProgramaLearning,
  listarChatInternoLearning,
  obterHomeLearning,
  obterResumoLearningTeam,
  type ChatInternoLearning,
  type ContextoChatLearning,
  type CriarProgramaLearningInput,
  type FormatoProgramaLearning,
  type HomeLearningResposta,
  type NivelLearning,
  type ProgramaLearning,
  type ResumoLearningTeamResposta,
  type TipoAcessoLearning,
  type TipoMensagemChatLearning
} from "../api";

const PERFIS_PADRAO = ["DONO", "ADMIN", "GESTOR", "VENDEDOR", "ATENDENTE", "FINANCEIRO", "AFILIADO", "CRIADOR"];
const CATEGORIAS_PADRAO = ["Team", "Market", "Atendimento", "Financas", "Afiliados", "Criadores"];

export function PaginaLearning() {
  const [dados, setDados] = useState<HomeLearningResposta | null>(null);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

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
  const categorias = dados?.categorias?.length ? dados.categorias : CATEGORIAS_PADRAO;
  const familias = dados?.familias?.length ? dados.familias : [
    "Cursos estruturados",
    "Microlearning",
    "Lives e workshops",
    "Mentorias e coaching",
    "Certificacoes e recertificacoes",
    "Comunidades e memberships"
  ];
  const filtrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return programas.filter((programa) => {
      const combinaCategoria = !categoria || programa.categoria === categoria;
      const combinaTexto =
        !texto ||
        [programa.titulo, programa.subtitulo, programa.descricao, programa.resultadoEsperado, programa.categoria]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      return combinaCategoria && combinaTexto;
    });
  }, [busca, categoria, programas]);

  return (
    <main className="min-h-[100dvh] bg-[#f4f6f8] text-neutral-950">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="rounded-full bg-black/45 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
            bizy<span className="text-[#a6e85f]">.</span> learning
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/market" className="hidden rounded-full bg-white/15 px-3 py-1.5 font-medium text-white backdrop-blur sm:inline-flex">
              Market
            </Link>
            <Link to="/login" className="rounded-full bg-[#a6e85f] px-4 py-2 font-semibold text-neutral-950 shadow-sm">
              Entrar no Team
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[76dvh] items-end overflow-hidden px-5 pb-14 pt-28 sm:px-8 lg:pb-20" aria-label="Bizy Learning">
        <img
          src="/bizy-login-team.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.6fr)] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur">
              <GraduationCap size={15} />
              Sistema próprio do ecossistema Bizy
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Bizy Learning
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/84 sm:text-lg">
              Home pública para descobrir programas, cohorts e comunidades de aprendizagem aplicada. A administração fica no Team: perfis, donos, publicação, progresso e governança.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#programas-learning" className="inline-flex items-center gap-2 rounded-full bg-[#a6e85f] px-5 py-3 text-sm font-semibold text-neutral-950 shadow-sm">
                Explorar programas
                <ArrowRight size={16} />
              </a>
              <Link to="/app/learning" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white backdrop-blur">
                Administrar no Team
                <ShieldCheck size={16} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:max-w-lg lg:ml-auto">
            <MetricHero rotulo="Produtos digitais" valor={dados?.metricas.produtosDigitais ?? dados?.metricas.programas ?? "-"} />
            <MetricHero rotulo="Produtos pagos" valor={dados?.metricas.pagos ?? "-"} />
            <MetricHero rotulo="Comunidades" valor={dados?.metricas.comunidades ?? "-"} />
            <MetricHero rotulo="Receita vitrine" valor={formatarKwanzaCompacto(dados?.metricas.receitaPotencial ?? 0)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Como funciona</p>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-950 sm:text-3xl">Produto digital, acesso e operação.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            O Team administra o backstage; a home do Learning dá descoberta pública. Cada programa aponta para uma prática real dentro do Bizy.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SinalLearning icone={Compass} titulo="Descoberta" texto="Home pública, filtros, destaques e produtos digitais por perfil." />
          <SinalLearning icone={CreditCard} titulo="Checkout" texto="Compra digital gera acesso, documento e origem financeira." />
          <SinalLearning icone={BookOpenCheck} titulo="Aplicação" texto="Lições curtas, progresso, comunidade e certificado." />
        </div>
      </section>

      <section className="bg-neutral-950 px-5 py-12 text-white sm:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex flex-col gap-3 lg:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a6e85f]">Ecossistema Learning</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">Famílias de produto digital para vender, formar e reter.</h2>
            <p className="text-sm leading-6 text-white/68">
              O Learning organiza cursos, comunidades, cohorts, mentorias, downloads e certificações como produtos digitais com acesso, operação e receita rastreáveis.
            </p>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

      <section id="programas-learning" className="mx-auto w-full max-w-7xl px-5 pb-14 sm:px-8">
        <div className="flex flex-col gap-4 border-t border-neutral-200 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Programas em destaque</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-950">Aprendizagem orientada a operação.</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar programa"
                className="h-11 w-full rounded-full border border-neutral-300 bg-white pl-9 pr-4 text-sm outline-none focus:border-neutral-950"
              />
            </label>
            <select
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value)}
              className="h-11 rounded-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-neutral-950"
            >
              <option value="">Todas categorias</option>
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>

        {erro && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}
        {carregando && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-lg bg-white" />)}</div>}
        {!carregando && !erro && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((programa) => <ProgramaLearningPublico key={programa.slug} programa={programa} />)}
          </div>
        )}
      </section>

      <section className="bg-neutral-950 px-5 py-12 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#a6e85f]">Perfis Learning</p>
            <h2 className="mt-2 text-2xl font-semibold">Perfis governados pelo Team.</h2>
            <p className="mt-3 text-sm leading-6 text-white/68">
              Donos e admins controlam quem aprende, quem publica e como o progresso entra na operação.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(dados?.perfis ?? []).map((perfil) => (
              <div key={perfil.codigo} className="rounded-lg border border-white/12 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm">{perfil.nome}</strong>
                  {perfil.podeAdministrar ? <LockKeyhole size={15} className="text-[#a6e85f]" /> : <GraduationCap size={15} className="text-white/60" />}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/60">{perfil.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function PaginaLearningTeam() {
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
  const [chatForm, setChatForm] = useState({
    programaSlug: "",
    tipo: "MENSAGEM" as TipoMensagemChatLearning,
    contexto: "PROGRAMA" as ContextoChatLearning,
    conteudo: ""
  });

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const resumo = await obterResumoLearningTeam();
      setDados(resumo);
      setChat(resumo.chat);
      setChatForm((actual) => ({
        ...actual,
        programaSlug: actual.programaSlug || resumo.programas[0]?.slug || ""
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

  return (
    <CrmPageMotion>
      <PageHead
        eyebrow="Bizy Learning · administração Team"
        titulo="Learning"
        descricao="Backoffice para perfis, donos de programa, publicação, inscrição e progresso. A home pública continua separada em /learning."
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

      {erro && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <KpiGrid>
        <KpiCard hero icone={GraduationCap} rotulo="Programas" valor={metricas?.programas ?? "-"} delta={`${metricas?.publicados ?? 0} publicados`} deltaPositivo />
        <KpiCard icone={CreditCard} cor="green" rotulo="Receita Learning" valor={formatarKwanzaCompacto(metricas?.receitaLearning ?? 0)} delta={`${metricas?.comprasConfirmadas ?? 0} compras`} deltaPositivo />
        <KpiCard icone={LockKeyhole} cor="blue" rotulo="Acessos ativos" valor={metricas?.entitlementsAtivos ?? "-"} />
        <KpiCard icone={BadgeCheck} cor="green" rotulo="Certificados" valor={metricas?.certificados ?? "-"} />
        <KpiCard icone={Layers3} cor="amber" rotulo="Rascunhos" valor={metricas?.rascunhos ?? "-"} />
        <KpiCard icone={UsersRound} cor="blue" rotulo="Inscrições" valor={metricas?.inscritos ?? "-"} />
        <KpiCard icone={CheckCircle2} cor="green" rotulo="Concluídos" valor={metricas?.concluidos ?? "-"} />
      </KpiGrid>

      <PanelCard
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
      </PanelCard>

      <PanelCard
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
      </PanelCard>

      <PanelCard
        titulo="Programas, publicação e progresso"
        descricao="Tudo aqui administra o Learning; o Team não é consumidor passivo, é o backoffice operacional."
      >
        <div className="grid gap-3">
          {carregando && Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />)}
          {!carregando && programas.map((programa) => (
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
        </div>
      </PanelCard>

      <PanelCard
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
                    <StatusBadge cor={compra.estado === "CONFIRMADO" ? "green" : "amber"}>{compra.estado.toLowerCase()}</StatusBadge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatarKwanza(compra.valor, compra.moeda)}</span>
                    {compra.factura && <span className="inline-flex items-center gap-1"><FileText size={13} /> {compra.factura.numero}</span>}
                  </div>
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
                </div>
              ))}
              {!(dados?.entitlements ?? []).length && <p className="text-sm text-muted-foreground">Sem acessos digitais activos.</p>}
            </div>
          </div>
        </div>
      </PanelCard>
    </CrmPageMotion>
  );
}

function MetricHero({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <div className="rounded-lg border border-white/18 bg-white/12 p-4 text-white backdrop-blur">
      <strong className="block text-2xl font-semibold">{valor}</strong>
      <span className="mt-1 block text-xs font-medium uppercase tracking-[0.08em] text-white/62">{rotulo}</span>
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-neutral-950 text-white">
        <Icone size={18} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-neutral-950">{titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{texto}</p>
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
    <article className="rounded-lg border border-white/12 bg-white/[0.04] p-4">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#a6e85f] text-neutral-950">
        <Icone size={18} />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{familia}</h3>
      <p className="mt-2 text-xs leading-5 text-white/62">
        Produto digital com acesso, regras, progresso, suporte e métrica própria.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/58">
        <span>{totalProdutos || "Novo"} produto(s)</span>
        <span>Learning commerce</span>
      </div>
    </article>
  );
}

function ProgramaLearningPublico({ programa }: { programa: ProgramaLearning }) {
  return (
    <article className="flex min-h-[290px] flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">{programa.categoria}</span>
        <span className="rounded-full bg-[#e8f8d5] px-2.5 py-1 text-xs font-semibold text-neutral-800">{programa.formato.toLowerCase()}</span>
        <span className="rounded-full bg-[#e9f1ff] px-2.5 py-1 text-xs font-semibold text-neutral-800">{programa.tipoAcesso.toLowerCase()}</span>
        {programa.cohort && <span className="rounded-full bg-[#fff0c2] px-2.5 py-1 text-xs font-semibold text-neutral-800">cohort</span>}
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-tight text-neutral-950">{programa.titulo}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{programa.subtitulo}</p>
      <div className="mt-4 grid gap-2 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {programa.duracaoMinutos} minutos</span>
        <span className="inline-flex items-center gap-1.5"><UsersRound size={14} /> {programa.publico.join(", ")}</span>
        <span className="inline-flex items-center gap-1.5"><BookOpenCheck size={14} /> {programa.licoes.length} lições práticas</span>
        <span className="inline-flex items-center gap-1.5"><CreditCard size={14} /> {rotuloPreco(programa)}</span>
        {programa.certificadoConfigurado && <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} /> certificado verificável</span>}
      </div>
      <div className="mt-4 rounded-md bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
        <strong className="block text-neutral-800">{programa.familiaProduto}</strong>
        <span className="mt-1 block">{programa.resultadoEsperado}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="text-xs font-medium text-neutral-500">Owner: {programa.ownerPerfil}</span>
        <Link to="/login" className="inline-flex items-center gap-1.5 rounded-full bg-neutral-950 px-3 py-2 text-xs font-semibold text-white">
          Entrar
          <ArrowRight size={14} />
        </Link>
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
