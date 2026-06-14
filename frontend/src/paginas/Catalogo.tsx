import { AlertTriangle, ArrowUpRight, BadgeCheck, Coins, ImagePlus, Layers3, Package, PencilLine, Plus, Tag, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { requisitarApi, resolverUrlMedia } from "../api";
import { ConfirmarAcao } from "../componentes/ConfirmarAcao";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import {
  PageHead,
  KpiGrid,
  KpiCard,
  ToolbarBizy,
  BotaoBizy,
  StatusBadge,
  type CorSemantica,
} from "../componentes/BizyDesignSystem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EstadoPeca, Peca } from "../tipos";
import { formatarKwanza, traduzirEstadoPeca } from "../utilidades";

type SeloProduto = "DESTAQUE" | "PROMOCAO" | "NOVIDADE" | "MAIS_VENDIDO" | "REPOSICAO" | "KIT";

const selosDisponiveis: Array<{ id: SeloProduto; titulo: string; detalhe: string }> = [
  { id: "DESTAQUE", titulo: "Destaque", detalhe: "Aparece primeiro na loja" },
  { id: "PROMOCAO", titulo: "Promoção", detalhe: "Em oferta ou com desconto" },
  { id: "NOVIDADE", titulo: "Novidade", detalhe: "Recém-chegado ao catálogo" },
  { id: "MAIS_VENDIDO", titulo: "Mais vendido", detalhe: "Prova social para o cliente" },
  { id: "REPOSICAO", titulo: "Reposição", detalhe: "Voltou ao stock" },
  { id: "KIT", titulo: "Kit", detalhe: "Combinação de produtos" }
];

const formularioInicial = {
  codigo: "",
  sku: "",
  nome: "",
  descricao: "",
  categoria: "",
  novoCatalogo: "",
  colecao: "",
  precoEmKwanza: 12000,
  custoEmKwanza: 0,
  quantidade: 1,
  stockMinimo: 1,
  variantesTexto: "",
  fotos: [] as string[],
  estado: "DISPONIVEL" as EstadoPeca,
  selos: [] as SeloProduto[],
  prioridade: 100
};

const estadosPeca: EstadoPeca[] = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"];

import { enviarMedia } from "../media";

function corEstadoPeca(estado: EstadoPeca): CorSemantica {
  if (estado === "DISPONIVEL") return "green";
  if (estado === "RESERVADA") return "amber";
  if (estado === "ESGOTADA") return "rose";
  return "blue";
}

export function PaginaCatalogo() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [codigoEditando, setCodigoEditando] = useState<string | null>(null);
  const [formPeca, setFormPeca] = useState(formularioInicial);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [pecaParaDesativar, setPecaParaDesativar] = useState<Peca | null>(null);
  const inputFotosRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    try {
      setPecas(await requisitarApi<Peca[]>("/pecas"));
    } catch {
      setMensagem("Erro ao carregar catálogo.");
    }
  }

  useEffect(() => { void carregar().finally(() => setCarregandoInicial(false)); }, []);

  async function salvarPeca(e: FormEvent) {
    e.preventDefault();
    const categoria = formPeca.categoria.trim();

    if (!categoria) {
      setMensagem("Catálogo obrigatório: escolha um catálogo existente ou crie um novo antes de guardar o produto.");
      return;
    }

    setCarregando(true);
    try {
      const dadosBase = {
        sku: formPeca.sku.trim() || null,
        nome: formPeca.nome,
        descricao: formPeca.descricao,
        categoria,
        colecao: formPeca.colecao.trim() || null,
        precoEmKwanza: formPeca.precoEmKwanza,
        custoEmKwanza: formPeca.custoEmKwanza || null,
        quantidade: formPeca.quantidade,
        stockMinimo: formPeca.stockMinimo,
        variantes: extrairVariantes(formPeca.variantesTexto),
        fotos: formPeca.fotos,
        vitrine: {
          selos: formPeca.selos,
          prioridade: formPeca.prioridade
        }
      };

      if (codigoEditando) {
        await requisitarApi(`/pecas/${encodeURIComponent(codigoEditando)}`, {
          method: "PATCH",
          body: { ...dadosBase, estado: formPeca.estado }
        });
      } else {
        await requisitarApi("/pecas", {
          method: "POST",
          body: { ...dadosBase, codigo: formPeca.codigo.trim() }
        });
      }

      await carregar();
      setMensagem(codigoEditando ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.");
      fecharFormulario();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao guardar produto.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirCadastro() {
    setCodigoEditando(null);
    setFormPeca(formularioInicial);
    setModalProdutoAberto(true);
  }

  function fecharFormulario() {
    setCodigoEditando(null);
    setFormPeca(formularioInicial);
    setModalProdutoAberto(false);
  }

  function iniciarEdicao(peca: Peca) {
    setCodigoEditando(peca.codigo);
    setFormPeca({
      codigo: peca.codigo,
      sku: peca.sku ?? "",
      nome: peca.nome,
      descricao: peca.descricao,
      categoria: peca.categoria ?? "",
      novoCatalogo: "",
      colecao: peca.colecao ?? "",
      precoEmKwanza: peca.precoEmKwanza,
      custoEmKwanza: peca.custoEmKwanza ?? 0,
      quantidade: peca.quantidade,
      stockMinimo: peca.stockMinimo ?? 1,
      variantesTexto: formatarVariantes(peca.variantes),
      fotos: peca.fotos,
      estado: peca.estado,
      selos: (peca.vitrine?.selos ?? []) as SeloProduto[],
      prioridade: peca.vitrine?.prioridade ?? 100
    });
    setModalProdutoAberto(true);
  }

  async function confirmarDesativarPeca() {
    const peca = pecaParaDesativar;
    if (!peca) return;
    setPecaParaDesativar(null);

    setCarregando(true);
    try {
      await requisitarApi(`/pecas/${encodeURIComponent(peca.codigo)}`, { method: "DELETE" });
      await carregar();
      setMensagem(`Produto #${peca.codigo} desativado.`);
      if (codigoEditando === peca.codigo) fecharFormulario();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao desativar produto.");
    } finally {
      setCarregando(false);
    }
  }

  function adicionarNovoCatalogo() {
    const nome = formPeca.novoCatalogo.trim();
    if (!nome) {
      setMensagem("Escreva o nome do catálogo antes de adicionar.");
      return;
    }

    setFormPeca({ ...formPeca, categoria: nome, novoCatalogo: "" });
    setMensagem(`Catálogo "${nome}" selecionado para este produto.`);
  }

  async function enviarFotosProduto(arquivos: FileList | null) {
    const selecionados = Array.from(arquivos ?? []);
    if (!selecionados.length) return;

    setEnviandoFotos(true);
    try {
      const urls = await Promise.all(
        selecionados.map(async (arquivo) => {
          const media = await enviarMedia(arquivo, "catalogo", 1800);
          return media.url;
        })
      );

      setFormPeca((atual) => ({ ...atual, fotos: [...atual.fotos, ...urls] }));
      setMensagem(`${urls.length} foto${urls.length !== 1 ? "s" : ""} enviada${urls.length !== 1 ? "s" : ""} com sucesso.`);
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao enviar fotos.");
    } finally {
      setEnviandoFotos(false);
    }
  }

  function removerFotoProduto(url: string) {
    setFormPeca((atual) => ({ ...atual, fotos: atual.fotos.filter((foto) => foto !== url) }));
  }

  const pecasFiltradas = pecas.filter((p) => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.categoria ?? "").toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === "todas" || (p.categoria ?? "") === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  const disponiveis = pecas.filter((p) => p.estado === "DISPONIVEL").length;
  const stockBaixo = pecas.filter((p) => p.estado !== "VENDIDA" && p.estado !== "ESGOTADA" && p.quantidade <= 2).length;
  const totalStock = pecas.reduce((t, p) => t + p.quantidade, 0);
  const valorInventario = pecas.reduce((t, p) => t + (p.precoEmKwanza * p.quantidade), 0);
  const esgotados = pecas.filter((p) => p.estado === "ESGOTADA").length;
  const catalogos = ordenarUnicos(pecas.map((peca) => peca.categoria).concat(formPeca.categoria));
  const colecoes = ordenarUnicos(pecas.map((peca) => peca.colecao).concat(formPeca.colecao));

  /* ── Mais vendido (pelo código, simplificado) ── */
  const maisVendido = pecas.length > 0
    ? pecas.reduce((melhor, p) => (p.estado === "VENDIDA" || p.quantidade < melhor.quantidade) ? p : melhor, pecas[0])
    : null;

  const selectCategorias = [
    { id: "todas", rotulo: "Todas as categorias" },
    ...catalogos.map((c) => ({ id: c, rotulo: c })),
  ];

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      <PageHead eyebrow={`Vitrine · ${pecas.length} artigo${pecas.length !== 1 ? "s" : ""}`} titulo="Produtos" tamanhoTitulo="sm">
        <BotaoBizy icone={Plus} onClick={abrirCadastro}>Novo produto</BotaoBizy>
      </PageHead>

      <KpiGrid>
        <KpiCard
          hero
          icone={Coins}
          rotulo="Valor de inventário"
          valor={new Intl.NumberFormat("pt-AO").format(valorInventario)}
          unidade="Kz"
          delta={`${pecas.length} artigos ativos`}
          deltaPositivo
          rodape={`${totalStock} unidades em stock`}
        />
        <KpiCard
          icone={Tag}
          cor="blue"
          rotulo="Ativos"
          valor={disponiveis}
          delta={esgotados > 0 ? `${esgotados} esgotado${esgotados !== 1 ? "s" : ""}` : "todos ativos"}
        />
        <KpiCard
          icone={AlertTriangle}
          cor="amber"
          rotulo="Stock baixo"
          valor={stockBaixo}
          delta={stockBaixo > 0 ? "repor em breve" : "ok"}
          deltaPositivo={stockBaixo > 0 ? false : undefined}
        />
        <KpiCard
          icone={ArrowUpRight}
          cor="green"
          rotulo="Mais vendido"
          valor={maisVendido?.nome ?? "—"}
          delta={maisVendido ? `${maisVendido.quantidade} em stock` : undefined}
          deltaPositivo
        />
      </KpiGrid>

      <ToolbarBizy
        placeholder="Buscar produto…"
        valorBusca={busca}
        onBuscaChange={setBusca}
        selectOpcoes={selectCategorias}
        selectValor={categoriaFiltro}
        onSelectChange={setCategoriaFiltro}
      />

      {/* ── Product Grid ── */}
      {pecasFiltradas.length > 0 ? (
        <div className="bz-prod-grid">
          {pecasFiltradas.map((peca) => {
            const estadoCor = corEstadoPeca(peca.estado);
            const stockLabel = peca.estado === "ESGOTADA"
              ? "Esgotado"
              : peca.quantidade <= 2
                ? "Stock baixo"
                : "Em stock";
            const stockCor = peca.estado === "ESGOTADA"
              ? "rose"
              : peca.quantidade <= 2
                ? "amber"
                : "green";

            return (
              <div key={peca.id} className="bz-prod-card" onClick={() => iniciarEdicao(peca)} role="button" tabIndex={0}>
                <div className="bz-prod-photo">
                  {peca.fotos[0] ? (
                    <img src={resolverUrlMedia(peca.fotos[0])} alt={peca.nome} className="bz-prod-img" />
                  ) : (
                    <Package size={40} className="bz-prod-icon" />
                  )}
                  {peca.categoria && <span className="bz-prod-cat">{peca.categoria}</span>}
                  <span className="bz-prod-stock">
                    <StatusBadge cor={stockCor as CorSemantica}>{stockLabel}</StatusBadge>
                  </span>
                </div>
                <div className="bz-prod-body">
                  <div className="bz-prod-nm">{peca.nome}</div>
                  <div className="bz-prod-meta">
                    {peca.variantes && Object.keys(peca.variantes).length > 0
                      ? `${Object.entries(peca.variantes).map(([k, v]) => `${v.length} ${k}`).join(" · ")} · `
                      : ""
                    }
                    {peca.quantidade > 0 ? `${peca.quantidade} em stock` : "0 em stock"}
                  </div>
                  <div className="bz-prod-row">
                    <span className="bz-prod-pr bz-tnum">{formatarKwanza(peca.precoEmKwanza)}</span>
                    <div className="bz-prod-actions">
                      <button type="button" className="bz-iconbtn" onClick={(e) => { e.stopPropagation(); iniciarEdicao(peca); }} title="Editar">
                        <PencilLine size={14} />
                      </button>
                      <button type="button" className="bz-iconbtn" onClick={(e) => { e.stopPropagation(); setPecaParaDesativar(peca); }} title="Desativar" disabled={peca.estado === "ESGOTADA"}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bz-empty-msg">
          <Package size={24} style={{ opacity: 0.5 }} />
          <strong>Sem produtos</strong>
          <span>Cadastre o primeiro produto para iniciar a venda.</span>
        </div>
      )}

      {/* ── Product Form Dialog ── */}
      <Dialog open={modalProdutoAberto} onOpenChange={(aberto) => { if (!aberto) fecharFormulario(); }}>
        <DialogContent className="bz-product-dialog max-h-[calc(100dvh-1rem)] overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="bz-dialog-head border-b px-5 py-4 text-left">
            <span className="bz-dialog-icon"><Package size={18} /></span>
            <DialogTitle>{codigoEditando ? `Editar produto #${codigoEditando}` : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Produto completo, ligado a um catálogo e pronto para aparecer na loja digital.
            </DialogDescription>
          </DialogHeader>

          <form aria-label="Formulário de produto" onSubmit={salvarPeca} className="bz-product-form flex min-h-0 flex-col">
            <div className="bz-product-form-scroll grid gap-5 overflow-y-auto p-4 sm:p-5">
              <section className="bz-form-section grid gap-3">
                <div className="bz-form-section-head">
                  <span className="bz-form-section-icon"><Tag size={16} /></span>
                  <h3>Catálogo obrigatório</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="catalogoPeca">Catálogo</label>
                    {catalogos.length ? (
                      <Select value={formPeca.categoria} onValueChange={(categoria) => setFormPeca({ ...formPeca, categoria })}>
                        <SelectTrigger id="catalogoPeca">
                          <SelectValue placeholder="Escolha onde este produto entra" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogos.map((catalogo) => (
                            <SelectItem key={catalogo} value={catalogo}>{catalogo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="bz-form-help flex min-h-11 items-center rounded-md border px-3 text-sm">
                        Crie o primeiro catálogo ao lado.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="novoCatalogoPeca">Criar catálogo</label>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Input
                        id="novoCatalogoPeca"
                        value={formPeca.novoCatalogo}
                        onChange={(e) => setFormPeca({ ...formPeca, novoCatalogo: e.target.value })}
                        placeholder="Ex: Vestidos, Sneakers, Serviços"
                      />
                      <Button type="button" variant="outline" className="whitespace-normal sm:whitespace-nowrap" onClick={adicionarNovoCatalogo}>
                        <Plus size={16} />
                        Adicionar novo catálogo
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bz-form-section grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[0.8fr_1fr]">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="codPeca">Código</label>
                    <Input id="codPeca" value={formPeca.codigo} disabled={codigoEditando !== null} onChange={(e) => setFormPeca({ ...formPeca, codigo: e.target.value })} placeholder="Ex: A01" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="skuPeca">SKU interno</label>
                    <Input id="skuPeca" value={formPeca.sku} onChange={(e) => setFormPeca({ ...formPeca, sku: e.target.value })} placeholder="Ex: BIZY-VEST-001" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="nomePeca">Nome do produto</label>
                  <Input id="nomePeca" value={formPeca.nome} onChange={(e) => setFormPeca({ ...formPeca, nome: e.target.value })} placeholder="Vestido verde acetinado" />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="descPeca">Descrição de venda</label>
                  <Textarea
                    id="descPeca"
                    className="min-h-24"
                    value={formPeca.descricao}
                    onChange={(e) => setFormPeca({ ...formPeca, descricao: e.target.value })}
                    placeholder="Material, uso recomendado, cuidados, diferenciais e o que o cliente precisa saber antes de comprar."
                  />
                </div>
              </section>

              <section className="bz-form-section grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="precPeca">Preço de venda (Kz)</label>
                  <Input id="precPeca" type="number" min="0" step="500" value={formPeca.precoEmKwanza} onChange={(e) => setFormPeca({ ...formPeca, precoEmKwanza: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="custoPeca">Custo estimado (Kz)</label>
                  <Input id="custoPeca" type="number" min="0" step="500" value={formPeca.custoEmKwanza} onChange={(e) => setFormPeca({ ...formPeca, custoEmKwanza: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="qtdPeca">Quantidade disponível</label>
                  <Input id="qtdPeca" type="number" min="0" value={formPeca.quantidade} onChange={(e) => setFormPeca({ ...formPeca, quantidade: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="stockMinimoPeca">Alerta de stock mínimo</label>
                  <Input id="stockMinimoPeca" type="number" min="0" value={formPeca.stockMinimo} onChange={(e) => setFormPeca({ ...formPeca, stockMinimo: Number(e.target.value) })} />
                </div>
              </section>

              <section className="bz-form-section grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="colecaoPeca">Coleção ou vitrine</label>
                  <Input
                    id="colecaoPeca"
                    list="colecoesPeca"
                    value={formPeca.colecao}
                    onChange={(e) => setFormPeca({ ...formPeca, colecao: e.target.value })}
                    placeholder="Ex: Novidades, Promoções, Pronta entrega"
                  />
                  <datalist id="colecoesPeca">
                    {colecoes.map((colecao) => <option key={colecao} value={colecao} />)}
                  </datalist>
                </div>
                {codigoEditando && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="estadoPeca">Estado</label>
                    <Select value={formPeca.estado} onValueChange={(estado) => setFormPeca({ ...formPeca, estado: estado as EstadoPeca })}>
                      <SelectTrigger id="estadoPeca">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosPeca.map((estado) => (
                          <SelectItem key={estado} value={estado}>{traduzirEstadoPeca(estado)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </section>

              <section className="bz-form-section grid gap-3">
                <div className="bz-form-section-head">
                  <span className="bz-form-section-icon"><Layers3 size={16} /></span>
                  <h3>Variantes</h3>
                </div>
                <Textarea
                  className="min-h-24"
                  value={formPeca.variantesTexto}
                  onChange={(e) => setFormPeca({ ...formPeca, variantesTexto: e.target.value })}
                  placeholder={"tamanho: P, M, G\ncor: Preto, Branco\nmaterial: Algodão"}
                />
              </section>

              <section className="bz-form-section grid gap-3">
                <div className="bz-form-section-head">
                  <span className="bz-form-section-icon"><BadgeCheck size={16} /></span>
                  <h3>Vitrine e selos</h3>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {selosDisponiveis.map((selo) => {
                    const ativo = formPeca.selos.includes(selo.id);
                    return (
                      <label
                        key={selo.id}
                        className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                          ativo ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background hover:bg-muted/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={(e) => {
                            const novos = e.target.checked
                              ? [...formPeca.selos, selo.id]
                              : formPeca.selos.filter((s) => s !== selo.id);
                            setFormPeca({ ...formPeca, selos: novos });
                          }}
                          className="sr-only"
                        />
                        <div>
                          <strong className="block text-xs">{selo.titulo}</strong>
                          <span className={`text-xs ${ativo ? "opacity-70" : "text-muted-foreground"}`}>{selo.detalhe}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor="prioridadePeca">Prioridade (0 = topo, 9999 = fundo)</label>
                    <Input id="prioridadePeca" type="number" min="0" max="9999" value={formPeca.prioridade} onChange={(e) => setFormPeca({ ...formPeca, prioridade: Number(e.target.value) })} />
                  </div>
                </div>
              </section>

              <section className="bz-form-section grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="bz-form-section-head">
                    <span className="bz-form-section-icon"><ImagePlus size={16} /></span>
                    <h3>Fotos do produto</h3>
                  </div>
                  <input
                    ref={inputFotosRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="sr-only"
                    disabled={enviandoFotos}
                    onChange={(e) => {
                      void enviarFotosProduto(e.currentTarget.files);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={enviandoFotos}
                    onClick={() => inputFotosRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                    {enviandoFotos ? "A enviar..." : "Escolher fotos"}
                  </Button>
                </div>

                {formPeca.fotos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {formPeca.fotos.map((foto) => (
                      <div key={foto} className="group relative aspect-square overflow-hidden rounded-xl border bg-background">
                        <img src={resolverUrlMedia(foto)} alt="" className="h-full w-full object-cover" />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon-sm"
                          className="absolute right-2 top-2 opacity-90"
                          onClick={() => removerFotoProduto(foto)}
                          aria-label="Remover foto"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bz-upload-empty grid min-h-28 place-items-center rounded-xl border border-dashed text-center text-sm">
                    Envie fotos reais do produto para alimentar loja, catálogo e atendimento.
                  </div>
                )}
              </section>
            </div>

            <div className="bz-dialog-actions bz-dialog-actions-sticky flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="lg" onClick={fecharFormulario}>
                Cancelar
              </Button>
              <Button type="submit" size="lg" disabled={carregando || enviandoFotos}>
                <BadgeCheck size={18} />
                {codigoEditando ? "Guardar alterações" : "Cadastrar produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {mensagem && <footer className="bz-footer-msg" aria-live="polite">{mensagem}</footer>}

      <ConfirmarAcao
        aberto={pecaParaDesativar !== null}
        titulo="Desativar produto"
        descricao={`Esta ação desativa o produto #${pecaParaDesativar?.codigo ?? ""} da live. O produto deixará de aparecer no catálogo activo.`}
        textoBotao="Desativar"
        variante="destructive"
        onConfirmar={() => void confirmarDesativarPeca()}
        onCancelar={() => setPecaParaDesativar(null)}
      />
    </CrmPageMotion>
  );
}

function ordenarUnicos(valores: Array<string | null | undefined>): string[] {
  return Array.from(new Set(valores.map((valor) => valor?.trim()).filter((valor): valor is string => Boolean(valor))))
    .sort((a, b) => a.localeCompare(b, "pt-AO"));
}


function extrairVariantes(valor: string): Record<string, string[]> {
  return Object.fromEntries(
    valor
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean)
      .map((linha) => {
        const [nome, ...resto] = linha.split(":");
        const opcoes = resto
          .join(":")
          .split(",")
          .map((opcao) => opcao.trim())
          .filter(Boolean);
        return [nome.trim().toLowerCase(), opcoes] as const;
      })
      .filter(([nome, opcoes]) => nome.length > 0 && opcoes.length > 0)
  );
}

function formatarVariantes(variantes?: Peca["variantes"]): string {
  return Object.entries(variantes ?? {})
    .filter(([, opcoes]) => opcoes.length > 0)
    .map(([nome, opcoes]) => `${nome}: ${opcoes.join(", ")}`)
    .join("\n");
}
