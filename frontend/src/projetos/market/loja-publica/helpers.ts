import { registrarEventoTrackingPublico } from "../api";
import type {
  AbaLojaPublica,
  CatalogoBloco,
  CatalogoFiltroAtivo,
  CatalogoPersonalizadoLoja,
  ColecaoPerfilLoja,
  EntregaCheckout,
  ExperienciaLojaPublica,
  LojaPublicaResposta,
  ModoNegocio,
  PaletaLojaPublica,
  PedidoHistoricoLoja,
  PerfilClienteLoja,
  ProdutoPublico,
  SecaoVitrine,
  TipoEventoTracking,
  VisualProdutoLoja
} from "./tipos";

export const perfilVazio: PerfilClienteLoja = {
  nome: "",
  telefone: "",
  email: "",
  consentimentoMarketing: false,
  consentimentoDados: true
};

export const entregaInicial: EntregaCheckout = {
  tipo: "ENTREGA",
  provincia: "",
  municipio: "",
  bairro: "",
  endereco: ""
};

export const TITULOS_ABAS_LOJA: Record<AbaLojaPublica, string> = {
  home: "Início",
  item: "Produtos",
  new: "Novidades",
  promo: "Promoções",
  review: "Avaliações"
};

export function obterVisuaisProduto(produto: ProdutoPublico): VisualProdutoLoja {
  const corPrincipal = obterCoresReaisProduto(produto)[0] ?? "#111111";
  const cores = obterCoresReaisProduto(produto);
  const tamanho = obterTamanhoAmostra(produto);
  const subtitulo = produto.vitrine?.descricao || produto.colecao || produto.categoria || "Selecionado pela loja";

  return { corPrincipal, cores, tamanho, subtitulo };
}

function obterTamanhoAmostra(produto: ProdutoPublico): string | null {
  const entrada = Object.entries(produto.variantes ?? {}).find(([nome]) =>
    ["tamanho", "tam", "size", "numero", "número", "calce"].some((termo) => nome.toLowerCase().includes(termo))
  );
  return entrada?.[1]?.[0] ?? null;
}

function obterCoresReaisProduto(produto: ProdutoPublico): string[] {
  const entrada = Object.entries(produto.variantes ?? {}).find(([nome]) =>
    ["cor", "color", "tom"].some((termo) => nome.toLowerCase().includes(termo))
  );
  return [...new Set((entrada?.[1] ?? []).slice(0, 4).map((valor) => resolverCorVisual(valor, "#111111")))];
}

export function criarFiltroDeColecaoPerfil(colecao: ColecaoPerfilLoja): CatalogoFiltroAtivo {
  const tipoNormalizado = colecao.tipo === "categoria" || colecao.tipo === "colecao" ? colecao.tipo : "busca";
  return {
    id: colecao.id,
    nome: colecao.nome,
    criterio: tipoNormalizado,
    valor: colecao.nome,
    totalProdutos: colecao.totalProdutos,
    origem: "perfil"
  };
}

export function criarFiltroDeCatalogoBloco(catalogo: CatalogoBloco): CatalogoFiltroAtivo {
  const criterio = catalogo.filtro?.criterio ?? (catalogo.tipo === "personalizado" ? "busca" : catalogo.tipo);
  return {
    id: catalogo.id,
    nome: catalogo.nome,
    criterio,
    valor: catalogo.filtro?.valor || catalogo.nome,
    totalProdutos: catalogo.produtos.length,
    origem: "bloco"
  };
}

export function filtrarProdutosPorCatalogo(produtos: ProdutoPublico[], catalogo: CatalogoFiltroAtivo | null): ProdutoPublico[] {
  if (!catalogo || catalogo.criterio === "todos") return produtos;
  const valor = normalizarTextoCatalogo(catalogo.valor || catalogo.nome);
  if (!valor) return produtos;

  return produtos.filter((produto) => {
    if (catalogo.criterio === "categoria") return normalizarTextoCatalogo(produto.categoria) === valor;
    if (catalogo.criterio === "colecao") return normalizarTextoCatalogo(produto.colecao) === valor;
    return [produto.nome, produto.descricao, produto.categoria, produto.colecao, produto.codigo]
      .filter(Boolean)
      .some((campo) => normalizarTextoCatalogo(campo).includes(valor));
  });
}

function normalizarTextoCatalogo(valor?: string | null): string {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function montarVitrinesOrganizadas(dados: LojaPublicaResposta | null): SecaoVitrine[] {
  if (!dados) return [];
  const secoesBase: SecaoVitrine[] = [
    { id: "destaques", titulo: "Destaques", detalhe: "Produtos escolhidos pela loja", produtos: dados.vitrine?.destaques ?? [], icone: "star" },
    { id: "promocoes", titulo: "Promoções", detalhe: "Preços especiais e oportunidades", produtos: dados.vitrine?.promocoes ?? [], icone: "tag" },
    { id: "novidades", titulo: "Novidades", detalhe: "Chegaram agora ao catálogo", produtos: dados.vitrine?.novidades ?? [], icone: "package" },
    { id: "maisVendidos", titulo: "Mais vendidos", detalhe: "Itens que merecem atenção", produtos: dados.vitrine?.maisVendidos ?? [], icone: "star" },
    { id: "kits", titulo: "Kits e conjuntos", detalhe: "Compre combinações prontas", produtos: dados.vitrine?.kits ?? [], icone: "package" },
    { id: "reposicoes", titulo: "Reposições", detalhe: "Produtos que voltaram ao stock", produtos: dados.vitrine?.reposicoes ?? [], icone: "package" }
  ];

  const promocoesDerivadas = dados.produtos.filter((produto) => produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza);
  const secoesProntas = secoesBase
    .map((secao) => ({
      ...secao,
      produtos: secao.produtos.length ? secao.produtos : secao.id === "promocoes" ? promocoesDerivadas : []
    }))
    .filter((secao) => secao.produtos.length > 0);
  const ordemVitrines = dados.loja.experiencia?.ordemVitrines ?? secoesBase.map((secao) => secao.id);
  const indice = new Map(ordemVitrines.map((id, posicao) => [id, posicao]));
  return secoesProntas.sort((a, b) => (indice.get(a.id) ?? 99) - (indice.get(b.id) ?? 99));
}

export function montarCatalogosPorBlocos(produtos: ProdutoPublico[], experiencia?: ExperienciaLojaPublica): CatalogoBloco[] {
  const personalizados = montarCatalogosPersonalizados(produtos, experiencia?.catalogosPersonalizados ?? []);
  const colecoes = agruparProdutosPorCampo(produtos, "colecao").map(([nome, itens]) => ({
    id: `colecao-${nome}`,
    nome,
    tipo: "colecao" as const,
    detalhe: montarDetalheCatalogo(itens, "Coleção com"),
    produtos: itens,
    filtro: { criterio: "colecao" as const, valor: nome }
  }));
  const categorias = agruparProdutosPorCampo(produtos, "categoria").map(([nome, itens]) => ({
    id: `categoria-${nome}`,
    nome,
    tipo: "categoria" as const,
    detalhe: montarDetalheCatalogo(itens, "Categoria com"),
    produtos: itens,
    filtro: { criterio: "categoria" as const, valor: nome }
  }));

  const automaticos = [...colecoes, ...categorias]
    .sort((a, b) => b.produtos.length - a.produtos.length || a.nome.localeCompare(b.nome, "pt-AO"))
    .slice(0, 10);

  return [...personalizados, ...automaticos].slice(0, 10);
}

function montarCatalogosPersonalizados(produtos: ProdutoPublico[], catalogos: CatalogoPersonalizadoLoja[]): CatalogoBloco[] {
  return catalogos
    .map((catalogo) => {
      const valor = catalogo.valor?.trim() ?? "";
      const termo = valor.toLowerCase();
      const itens = produtos.filter((produto) => {
        if (catalogo.criterio === "todos") return true;
        if (!termo) return false;
        if (catalogo.criterio === "categoria") return produto.categoria?.toLowerCase() === termo;
        if (catalogo.criterio === "colecao") return produto.colecao?.toLowerCase() === termo;
        return [produto.nome, produto.descricao, produto.categoria, produto.colecao]
          .filter(Boolean)
          .some((campo) => String(campo).toLowerCase().includes(termo));
      });
      return {
        id: `personalizado-${catalogo.id}`,
        nome: catalogo.nome,
        tipo: "personalizado" as const,
        detalhe: catalogo.descricao || montarDetalheCatalogo(itens, "Seleção com"),
        produtos: itens,
        filtro: { criterio: catalogo.criterio, valor: catalogo.valor }
      };
    })
    .filter((catalogo) => catalogo.produtos.length > 0);
}

function agruparProdutosPorCampo(produtos: ProdutoPublico[], campo: "categoria" | "colecao"): Array<[string, ProdutoPublico[]]> {
  const grupos = new Map<string, ProdutoPublico[]>();
  for (const produto of produtos) {
    const nome = produto[campo]?.trim();
    if (!nome) continue;
    grupos.set(nome, [...(grupos.get(nome) ?? []), produto]);
  }
  return Array.from(grupos.entries()).filter(([, itens]) => itens.length > 0);
}

function montarDetalheCatalogo(produtos: ProdutoPublico[], prefixo: string): string {
  const amostras = produtos.slice(0, 2).map((produto) => produto.nome).join(", ");
  return `${prefixo} ${produtos.length} ${produtos.length === 1 ? "item" : "itens"}${amostras ? `: ${amostras}` : ""}`;
}

export function calcularTopProdutos(produtos: ProdutoPublico[]): ProdutoPublico[] {
  return [...produtos]
    .filter((produto) => produto.disponivel !== false && produto.quantidade > 0)
    .sort((a, b) => pontuarProdutoTop(b) - pontuarProdutoTop(a) || precoProduto(b) - precoProduto(a))
    .slice(0, 8);
}

function pontuarProdutoTop(produto: ProdutoPublico): number {
  const selos = (produto.vitrine?.selos ?? []).join(" ").toLowerCase();
  const temPromocao = produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza;
  return [
    produto.vitrine?.prioridade ?? 0,
    temPromocao ? 24 : 0,
    produto.fotos.length ? 10 : 0,
    produto.colecao ? 7 : 0,
    produto.categoria ? 5 : 0,
    selos.includes("destaque") || selos.includes("mais") ? 18 : 0,
    Math.min(produto.quantidade, 12)
  ].reduce((total, valor) => total + valor, 0);
}

export function resolverModoNegocio(loja?: LojaPublicaResposta["loja"], produtos: ProdutoPublico[] = []): ModoNegocio {
  if (loja?.experiencia?.modoNegocio && loja.experiencia.modoNegocio !== "auto") {
    return loja.experiencia.modoNegocio;
  }
  const texto = [
    loja?.segmento,
    loja?.tipo,
    loja?.descricaoPublica,
    ...produtos.slice(0, 12).flatMap((produto) => [produto.categoria, produto.colecao, produto.nome])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(moda|roupa|vestido|calcado|calçado|tenis|ténis|camisa|blusa|saia|look|tamanho)/.test(texto)) return "moda";
  if (/(comida|restaurante|food|bolo|doce|pizza|hamburg|bebida|prato|pastel|catering)/.test(texto)) return "comida";
  if (/(servico|serviço|consulta|agenda|marcacao|marcação|barbearia|salao|salão|aula|sessao|sessão)/.test(texto)) return "servicos";
  return "geral";
}

export function resolverPaletaLoja(corPrimaria: string): PaletaLojaPublica {
  const paletas: PaletaLojaPublica[] = [
    { primaria: "#111111", fundo: "#fafaf8", superficie: "#ffffff", texto: "#111111", acento: "#d6b56d" },
    { primaria: "#0f766e", fundo: "#f5fbf8", superficie: "#ffffff", texto: "#10201d", acento: "#f59e0b" },
    { primaria: "#1d4ed8", fundo: "#f6f8ff", superficie: "#ffffff", texto: "#111827", acento: "#06b6d4" },
    { primaria: "#be123c", fundo: "#fff7f8", superficie: "#ffffff", texto: "#1f1115", acento: "#fb7185" },
    { primaria: "#c2410c", fundo: "#fffaf4", superficie: "#ffffff", texto: "#1c130d", acento: "#84cc16" },
    { primaria: "#6d28d9", fundo: "#fbf9ff", superficie: "#ffffff", texto: "#171321", acento: "#14b8a6" }
  ];
  return paletas.find((paleta) => paleta.primaria.toLowerCase() === corPrimaria.toLowerCase()) ?? {
    primaria: corPrimaria,
    fundo: "#fafaf8",
    superficie: "#ffffff",
    texto: "#111111",
    acento: corPrimaria
  };
}

export function precoProduto(produto: ProdutoPublico): number {
  return produto.precoPromocionalEmKwanza && produto.precoPromocionalEmKwanza < produto.precoEmKwanza
    ? produto.precoPromocionalEmKwanza
    : produto.precoEmKwanza;
}

export function normalizarCodigoProdutoRota(codigo?: string | null): string {
  if (!codigo) return "";
  try {
    return decodeURIComponent(codigo).trim().toUpperCase();
  } catch {
    return codigo.trim().toUpperCase();
  }
}

export function temVariantesProduto(produto: ProdutoPublico): boolean {
  return Object.values(produto.variantes ?? {}).some((opcoes) => opcoes.length > 0);
}

export function criarSelecoesIniciaisProduto(produto: ProdutoPublico): Record<string, string> {
  return Object.fromEntries(
    Object.entries(produto.variantes ?? {})
      .filter(([, opcoes]) => opcoes.length > 0)
      .map(([nome, opcoes]) => [nome, opcoes[0]])
  );
}

export function montarResumoVariantes(variantes: Record<string, string>): string {
  return Object.entries(variantes).map(([nome, valor]) => `${nome}: ${valor}`).join(", ");
}

export function resolverCorVisual(valor: string, corFallback: string): string {
  const texto = valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(preto|black|grafite|graphite)/.test(texto)) return "#111312";
  if (/(branco|white|off|neve)/.test(texto)) return "#f8f9fa";
  if (/(verde|green|menta|mint)/.test(texto)) return "#1f8b4c";
  if (/(azul|blue|indigo|marinho)/.test(texto)) return "#1d4ed8";
  if (/(vermelho|red|scarlet|vinho)/.test(texto)) return "#dc3545";
  if (/(rosa|pink)/.test(texto)) return "#e83e8c";
  if (/(amarelo|yellow|gold|dourado)/.test(texto)) return "#f4b400";
  if (/(castanho|brown|cafe|coffee|camel)/.test(texto)) return "#7c4a2d";
  if (/(cinza|grey|gray|prata|silver)/.test(texto)) return "#9ca3af";
  return corFallback;
}

export function formatarNumeroCurto(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(valor >= 10_000_000 ? 0 : 1)}M`;
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(valor >= 10_000 ? 0 : 1)}k`;
  return String(valor);
}

export function montarEntregaPayload(entrega: EntregaCheckout) {
  return {
    tipo: entrega.tipo,
    provincia: entrega.provincia || null,
    municipio: entrega.municipio || null,
    bairro: entrega.bairro || null,
    endereco: entrega.endereco || null
  };
}

export function obterTrackingIdLoja(slug: string): string {
  if (typeof window === "undefined") return "trk_server";
  const chave = `bizy_loja_tracking_${slug || "sem_slug"}`;
  const chaveCookie = chave.replace(/[^a-zA-Z0-9_]/g, "_");
  const cookie = document.cookie
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${chaveCookie}=`))
    ?.split("=")[1];
  const existente = window.localStorage.getItem(chave) || cookie;
  if (existente) {
    window.localStorage.setItem(chave, existente);
    return existente;
  }

  const novo = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(chave, novo);
  document.cookie = `${chaveCookie}=${encodeURIComponent(novo)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
  return novo;
}

export function carregarPerfilCliente(slug: string): PerfilClienteLoja {
  if (typeof window === "undefined") return perfilVazio;
  try {
    return { ...perfilVazio, ...JSON.parse(window.localStorage.getItem(`bizy_loja_perfil_${slug}`) ?? "{}") };
  } catch {
    return perfilVazio;
  }
}

export function guardarPerfilCliente(slug: string, perfil: PerfilClienteLoja): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`bizy_loja_perfil_${slug}`, JSON.stringify(perfil));
}

export function carregarFavoritos(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(`bizy_loja_favoritos_${slug}`) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function guardarFavoritos(slug: string, favoritos: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`bizy_loja_favoritos_${slug}`, JSON.stringify(Array.from(favoritos)));
}

export function guardarProdutoVisto(slug: string, codigo: string): void {
  if (typeof window === "undefined") return;
  const chave = `bizy_loja_produtos_vistos_${slug}`;
  try {
    const atual = JSON.parse(window.localStorage.getItem(chave) ?? "[]") as string[];
    const proximo = [codigo, ...atual.filter((item) => item !== codigo)].slice(0, 12);
    window.localStorage.setItem(chave, JSON.stringify(proximo));
  } catch {
    window.localStorage.setItem(chave, JSON.stringify([codigo]));
  }
}

export function carregarProdutosVistos(slug: string, produtos: ProdutoPublico[]): ProdutoPublico[] {
  if (typeof window === "undefined" || !produtos.length) return [];
  try {
    const codigos = JSON.parse(window.localStorage.getItem(`bizy_loja_produtos_vistos_${slug}`) ?? "[]") as string[];
    return codigos
      .map((codigo) => produtos.find((produto) => produto.codigo === codigo))
      .filter((produto): produto is ProdutoPublico => Boolean(produto));
  } catch {
    return [];
  }
}

export function carregarHistoricoPedidos(slug: string): PedidoHistoricoLoja[] {
  if (typeof window === "undefined") return [];
  try {
    const historico = JSON.parse(window.localStorage.getItem(`bizy_loja_historico_${slug}`) ?? "[]") as PedidoHistoricoLoja[];
    return historico.filter((pedido) => pedido.codigo && pedido.nome && pedido.criadoEm).slice(0, 20);
  } catch {
    return [];
  }
}

export function guardarHistoricoPedido(slug: string, pedido: PedidoHistoricoLoja): void {
  if (typeof window === "undefined") return;
  const chave = `bizy_loja_historico_${slug}`;
  try {
    const atual = JSON.parse(window.localStorage.getItem(chave) ?? "[]") as PedidoHistoricoLoja[];
    window.localStorage.setItem(chave, JSON.stringify([pedido, ...atual].slice(0, 20)));
  } catch {
    window.localStorage.setItem(chave, JSON.stringify([pedido]));
  }
}

export function extrairUtmAtual(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  params.forEach((valor, chave) => {
    if (chave.startsWith("utm_") && valor.trim()) utm[chave] = valor;
  });
  return utm;
}

export function registrarEventoLoja({
  canal = "site",
  entidadeId,
  entidadeTipo,
  metadata = {},
  produto,
  slug,
  tipo,
  trackingId
}: {
  canal?: string;
  entidadeId?: string;
  entidadeTipo?: string;
  metadata?: Record<string, unknown>;
  produto?: ProdutoPublico | null;
  slug: string;
  tipo: TipoEventoTracking;
  trackingId: string;
}) {
  if (!slug) return;
  registrarEventoTrackingPublico({
    tipo,
    slugLoja: slug,
    codigoProduto: produto?.codigo ?? null,
    entidadeTipo: entidadeTipo ?? (produto ? "PRODUTO" : "LOJA"),
    entidadeId: entidadeId ?? produto?.codigo ?? slug,
    trackingId,
    origem: "loja-web",
    canal,
    utm: extrairUtmAtual(),
    metadata: sanitizarMetadataTracking(metadata)
  }).catch(() => undefined);
}

export function sanitizarMetadataTracking(metadata: Record<string, unknown>): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(metadata)) {
    if (chaveMetadataTrackingEhSensivel(chave)) continue;
    if (contemDadoPessoalTracking(valor)) continue;
    resultado[chave] = valor;
  }
  return resultado;
}

const camposSensiveisTracking = [
  "nome",
  "name",
  "cliente",
  "telefone",
  "phone",
  "email",
  "whatsapp",
  "endereco",
  "address",
  "morada",
  "nif",
  "bilhete",
  "documento",
  "password",
  "senha",
  "token",
  "cookie"
];

function normalizarChaveTracking(chave: string): string {
  return chave.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function chaveMetadataTrackingEhSensivel(chave: string): boolean {
  const normalizada = normalizarChaveTracking(chave);
  return camposSensiveisTracking.some((campo) => normalizada.includes(campo));
}

function contemDadoPessoalTracking(valor: unknown): boolean {
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (!texto) return false;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(texto)) return true;
    const digitos = texto.replace(/\D/g, "");
    return /^(244)?9\d{8}$/.test(digitos);
  }

  if (Array.isArray(valor)) return valor.some((item) => contemDadoPessoalTracking(item));

  if (valor && typeof valor === "object") {
    return Object.entries(valor as Record<string, unknown>).some(([chave, item]) => (
      chaveMetadataTrackingEhSensivel(chave) || contemDadoPessoalTracking(item)
    ));
  }

  return false;
}
