import { BadgeCheck, ChevronDown, ChevronRight, Coins, FolderOpen, Layers3, Package, PencilLine, Plus, Search, Tag, Trash2, Upload, X } from "lucide-react";
import { type DragEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { requisitarApi, resolverUrlMedia } from "../api";
import { ExibidorImagem } from "../componentes/ExibidorImagem";
import { ConfirmarAcao } from "../componentes/ConfirmarAcao";
import { CrmPageMotion } from "../componentes/CrmInterno21st";
import { SkeletonPagina } from "../componentes/SkeletonBlocks";
import { BotaoBizy } from "../componentes/BizyDesignSystem";
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

type SeloProduto = "DESTAQUE" | "PROMOCAO" | "NOVIDADE" | "MAIS_VENDIDO" | "REPOSICAO" | "KIT" | "PATROCINADO";

const selosDisponiveis: Array<{ id: SeloProduto; titulo: string; detalhe: string }> = [
  { id: "DESTAQUE", titulo: "Destaque", detalhe: "Aparece primeiro na loja" },
  { id: "PROMOCAO", titulo: "Promoção", detalhe: "Em oferta ou com desconto" },
  { id: "NOVIDADE", titulo: "Novidade", detalhe: "Recém-chegado ao catálogo" },
  { id: "MAIS_VENDIDO", titulo: "Mais vendido", detalhe: "Prova social para o cliente" },
  { id: "REPOSICAO", titulo: "Reposição", detalhe: "Voltou ao stock" },
  { id: "KIT", titulo: "Kit", detalhe: "Combinação de produtos" },
  { id: "PATROCINADO", titulo: "Patrocinado", detalhe: "Produto com impulsionamento pago" }
];

type VisibilidadeProduto = "market" | "loja" | "campanhas";
const opcoesVisibilidade: Array<{ id: VisibilidadeProduto; titulo: string; detalhe: string }> = [
  { id: "market", titulo: "Loja + Market", detalhe: "Aparece no perfil da loja e no shopping center" },
  { id: "loja", titulo: "Apenas loja", detalhe: "Visível só no link próprio da loja" },
  { id: "campanhas", titulo: "Apenas campanhas", detalhe: "Oculto na loja, usado em campanhas e links directos" }
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
  prioridade: 100,
  visibilidade: "market" as VisibilidadeProduto
};

const estadosPeca: EstadoPeca[] = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"];

import { enviarMedia } from "../media";

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
          prioridade: formPeca.prioridade,
          publicacaoMarket: {
            publicado: formPeca.visibilidade === "market",
            origem: "crm"
          },
          visibilidade: formPeca.visibilidade
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
      prioridade: peca.vitrine?.prioridade ?? 100,
      visibilidade: ((peca.vitrine as Record<string, unknown>)?.visibilidade as VisibilidadeProduto) ?? (peca.vitrine?.publicacaoMarket?.publicado === false ? "loja" : "market")
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
  const catalogos = ordenarUnicos(pecas.map((peca) => peca.categoria));
  const catalogosComForm = ordenarUnicos(pecas.map((peca) => peca.categoria).concat(formPeca.categoria));
  const colecoes = ordenarUnicos(pecas.map((peca) => peca.colecao).concat(formPeca.colecao));

  /* ── Mais vendido (pelo código, simplificado) ── */
  const maisVendido = pecas.length > 0
    ? pecas.reduce((melhor, p) => (p.estado === "VENDIDA" || p.quantidade < melhor.quantidade) ? p : melhor, pecas[0])
    : null;

  const selectCategorias = [
    { id: "todas", rotulo: "Todas as categorias" },
    ...catalogos.map((c) => ({ id: c, rotulo: c })),
  ];

  const contagensCatalogo = pecas.reduce<Record<string, number>>((acc, p) => {
    if (p.categoria) acc[p.categoria] = (acc[p.categoria] ?? 0) + 1;
    return acc;
  }, {});

  if (carregandoInicial) return <CrmPageMotion><SkeletonPagina /></CrmPageMotion>;

  return (
    <CrmPageMotion>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--studio-ink)", lineHeight: 1.2, margin: 0 }}>Produtos</h1>
          <p style={{ fontSize: 12.5, color: "var(--studio-muted)", marginTop: 2 }}>
            Gestão de catálogo, stock e preços
          </p>
        </div>
        <BotaoBizy icone={Plus} onClick={abrirCadastro}>Novo produto</BotaoBizy>
      </div>

      {/* ── Strip numérica ── */}
      <div className="cat-strip">
        <div className="cat-strip-cell">
          <div className="cat-strip-val">{formatarKwanza(valorInventario)}</div>
          <div className="cat-strip-lbl">inventário</div>
        </div>
        <div className="cat-strip-cell">
          <div className="cat-strip-val">{disponiveis}</div>
          <div className="cat-strip-lbl">activos</div>
        </div>
        <div className="cat-strip-cell">
          <div className="cat-strip-val" data-tom={stockBaixo > 0 ? "aviso" : undefined}>{stockBaixo}</div>
          <div className="cat-strip-lbl">stock baixo</div>
        </div>
        <div className="cat-strip-cell">
          <div className="cat-strip-val" data-tom={esgotados > 0 ? "perigo" : undefined}>{esgotados}</div>
          <div className="cat-strip-lbl">esgotados</div>
        </div>
      </div>

      {/* ── Tabs catálogos ── */}
      <div className="cat-tabs">
        <button
          type="button"
          className="cat-tab"
          data-active={categoriaFiltro === "todas" ? true : undefined}
          onClick={() => setCategoriaFiltro("todas")}
        >
          Todos
          <span className="cat-tab-count">{pecas.length}</span>
        </button>
        {catalogos.map((cat) => (
          <button
            key={cat}
            type="button"
            className="cat-tab"
            data-active={categoriaFiltro === cat ? true : undefined}
            onClick={() => setCategoriaFiltro(cat)}
          >
            {cat}
            <span className="cat-tab-count">{contagensCatalogo[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ── Barra de busca ── */}
      <div className="cat-bar">
        <div className="cat-search-wrap">
          <Search size={15} />
          <input
            type="text"
            className="cat-search"
            placeholder="Buscar produto…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* ── Coleções ── */}
      {colecoes.length > 0 && (
        <PainelColecoes
          colecoes={colecoes}
          contagens={pecas.reduce<Record<string, number>>((acc, p) => {
            if (p.colecao) acc[p.colecao] = (acc[p.colecao] ?? 0) + 1;
            return acc;
          }, {})}
          onRenomear={async (de, para) => {
            await requisitarApi("/pecas/colecoes/renomear", { method: "POST", body: { de, para } });
            await carregar();
          }}
          onLimpar={async (colecao) => {
            await requisitarApi("/pecas/colecoes/limpar", { method: "POST", body: { colecao } });
            await carregar();
          }}
        />
      )}

      {/* ── Grelha de produtos ── */}
      {pecasFiltradas.length > 0 ? (
        <div className="cat-grid">
          {pecasFiltradas.map((peca) => {
            const stockLabel = peca.estado === "ESGOTADA"
              ? "Esgotado"
              : peca.quantidade <= 2
                ? "Baixo"
                : null;
            const badgeCor = peca.estado === "ESGOTADA"
              ? "rose"
              : peca.quantidade <= 2
                ? "amber"
                : "green";

            return (
              <div key={peca.id} className="cat-card" onClick={() => iniciarEdicao(peca)} role="button" tabIndex={0}>
                <div className="cat-card-photo">
                  {peca.fotos[0] ? (
                    <img src={resolverUrlMedia(peca.fotos[0])} alt={peca.nome} loading="lazy" />
                  ) : (
                    <div className="cat-card-photo-empty">
                      <Package size={32} />
                    </div>
                  )}
                  {stockLabel && <span className="cat-card-badge" data-cor={badgeCor}>{stockLabel}</span>}
                  <span className="cat-card-stock">{peca.quantidade}</span>
                </div>
                <div className="cat-card-body">
                  <div className="cat-card-name">{peca.nome}</div>
                  <div className="cat-card-meta">
                    {peca.categoria ?? ""}
                    {peca.variantes && Object.keys(peca.variantes).length > 0
                      ? ` · ${Object.entries(peca.variantes).map(([k, v]) => `${v.length} ${k}`).join(", ")}`
                      : ""}
                  </div>
                  <div className="cat-card-foot">
                    <span className="cat-card-price">{formatarKwanza(peca.precoEmKwanza)}</span>
                    <div className="cat-card-actions">
                      <button type="button" onClick={(e) => { e.stopPropagation(); iniciarEdicao(peca); }} title="Editar">
                        <PencilLine size={13} />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPecaParaDesativar(peca); }} title="Desativar" disabled={peca.estado === "ESGOTADA"}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cat-empty">
          <Package size={28} style={{ opacity: 0.4 }} />
          <strong>Sem produtos</strong>
          <span>Cadastre o primeiro produto para iniciar a venda.</span>
        </div>
      )}

      {/* ── Product Form Dialog ── */}
      <ModalProduto
        aberto={modalProdutoAberto}
        codigoEditando={codigoEditando}
        formPeca={formPeca}
        setFormPeca={setFormPeca}
        catalogosComForm={catalogosComForm}
        colecoes={colecoes}
        carregando={carregando}
        enviandoFotos={enviandoFotos}
        inputFotosRef={inputFotosRef}
        onSubmit={salvarPeca}
        onEnviarFotos={enviarFotosProduto}
        onRemoverFoto={removerFotoProduto}
        onAdicionarCatalogo={adicionarNovoCatalogo}
        onFechar={fecharFormulario}
      />

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

function PainelColecoes({
  colecoes,
  contagens,
  onRenomear,
  onLimpar,
}: {
  colecoes: string[];
  contagens: Record<string, number>;
  onRenomear: (de: string, para: string) => Promise<void>;
  onLimpar: (colecao: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [aProcessar, setAProcessar] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function confirmarRenomear(de: string) {
    const destino = novoNome.trim();
    if (!destino || destino === de) { setEditando(null); return; }
    setAProcessar(true);
    setMensagem("");
    try {
      await onRenomear(de, destino);
      setMensagem(`"${de}" renomeada para "${destino}".`);
      setEditando(null);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao renomear.");
    } finally {
      setAProcessar(false);
    }
  }

  async function confirmarLimpar(colecao: string) {
    setAProcessar(true);
    setMensagem("");
    try {
      await onLimpar(colecao);
      setMensagem(`Coleção "${colecao}" removida dos produtos.`);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao limpar.");
    } finally {
      setAProcessar(false);
    }
  }

  return (
    <div className="bz-colecoes-panel">
      <button
        type="button"
        className="bz-colecoes-toggle"
        onClick={() => setAberto(!aberto)}
      >
        <FolderOpen size={15} />
        <span>Coleções ({colecoes.length})</span>
        <ChevronDown size={14} className={`bz-colecoes-chevron ${aberto ? "bz-colecoes-chevron--open" : ""}`} />
      </button>

      {aberto && (
        <div className="bz-colecoes-body">
          {colecoes.map((col) => (
            <div key={col} className="bz-colecoes-item">
              {editando === col ? (
                <form
                  className="bz-colecoes-edit"
                  onSubmit={(e) => { e.preventDefault(); void confirmarRenomear(col); }}
                >
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    disabled={aProcessar}
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={aProcessar || !novoNome.trim()}>
                    Guardar
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(null)} disabled={aProcessar}>
                    <X size={13} />
                  </Button>
                </form>
              ) : (
                <>
                  <div className="bz-colecoes-info">
                    <strong>{col}</strong>
                    <span>{contagens[col] ?? 0} produto{(contagens[col] ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="bz-colecoes-actions">
                    <button
                      type="button"
                      className="bz-iconbtn"
                      title="Renomear"
                      disabled={aProcessar}
                      onClick={() => { setEditando(col); setNovoNome(col); }}
                    >
                      <PencilLine size={13} />
                    </button>
                    <button
                      type="button"
                      className="bz-iconbtn"
                      title="Remover coleção"
                      disabled={aProcessar}
                      onClick={() => void confirmarLimpar(col)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {mensagem && <p className="bz-colecoes-msg">{mensagem}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Modal Produto (redesenhado) ─────────────────────────────── */

function ModalProduto({
  aberto,
  codigoEditando,
  formPeca,
  setFormPeca,
  catalogosComForm,
  colecoes,
  carregando,
  enviandoFotos,
  inputFotosRef,
  onSubmit,
  onEnviarFotos,
  onRemoverFoto,
  onAdicionarCatalogo,
  onFechar,
}: {
  aberto: boolean;
  codigoEditando: string | null;
  formPeca: typeof formularioInicial;
  setFormPeca: React.Dispatch<React.SetStateAction<typeof formularioInicial>>;
  catalogosComForm: string[];
  colecoes: string[];
  carregando: boolean;
  enviandoFotos: boolean;
  inputFotosRef: React.RefObject<HTMLInputElement>;
  onSubmit: (e: FormEvent) => void;
  onEnviarFotos: (arquivos: FileList | null) => void;
  onRemoverFoto: (url: string) => void;
  onAdicionarCatalogo: () => void;
  onFechar: () => void;
}) {
  const [arrastando, setArrastando] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);

  const alternarSecao = useCallback((id: string) => {
    setSecaoAberta((atual) => (atual === id ? null : id));
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setArrastando(true);
  }, []);

  const onDragLeave = useCallback(() => setArrastando(false), []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setArrastando(false);
      onEnviarFotos(e.dataTransfer.files);
    },
    [onEnviarFotos]
  );

  return (
    <Dialog open={aberto} onOpenChange={(v) => { if (!v) onFechar(); }}>
      <DialogContent className="bz-product-dialog p-0 gap-0">
        <DialogHeader className="bz-dialog-head">
          <div className="bz-dialog-icon"><Package size={20} /></div>
          <DialogTitle className="text-base font-bold">
            {codigoEditando ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription className="text-xs mt-0.5" style={{ color: "var(--ink-3)" }}>
            {codigoEditando ? `A editar #${codigoEditando}` : "Preenche os dados do produto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="bz-product-form flex flex-col">
          <div className="bz-product-form-scroll flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

            {/* ── 1. FOTOS (hero) ── */}
            <div className="flex flex-col gap-3">
              {formPeca.fotos.length > 0 ? (
                <div className="bizy-upload-preview">
                  {formPeca.fotos.map((foto) => (
                    <div key={foto} className="bizy-upload-thumb">
                      <ExibidorImagem src={foto} alt="Foto produto" />
                      <button type="button" onClick={() => onRemoverFoto(foto)} title="Remover">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="bizy-upload-add"
                    onClick={() => inputFotosRef.current?.click()}
                    disabled={enviandoFotos}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={`bizy-upload-card${arrastando ? " is-dragging" : ""}`}
                  onClick={() => inputFotosRef.current?.click()}
                  disabled={enviandoFotos}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <Upload size={28} />
                  <strong>{enviandoFotos ? "A enviar…" : "Adicionar fotos"}</strong>
                  <span>Arrasta ou clica para enviar</span>
                </button>
              )}
              <input
                ref={inputFotosRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onEnviarFotos(e.target.files)}
              />
            </div>

            {/* ── 2. ESSENCIAIS ── */}
            <div className="bz-form-section flex flex-col gap-3">
              <div className="bz-form-section-head">
                <div className="bz-form-section-icon"><Tag size={15} /></div>
                <h3>Essencial</h3>
              </div>

              <div className="flex flex-col gap-2.5">
                <label>
                  Nome do produto
                  <Input
                    value={formPeca.nome}
                    onChange={(e) => setFormPeca({ ...formPeca, nome: e.target.value })}
                    placeholder="Ex: Vestido Ankara"
                    required
                  />
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <label>
                    Preço (Kz)
                    <Input
                      type="number"
                      min={0}
                      value={formPeca.precoEmKwanza}
                      onChange={(e) => setFormPeca({ ...formPeca, precoEmKwanza: Number(e.target.value) })}
                      required
                    />
                  </label>
                  <label>
                    Stock
                    <Input
                      type="number"
                      min={0}
                      value={formPeca.quantidade}
                      onChange={(e) => setFormPeca({ ...formPeca, quantidade: Number(e.target.value) })}
                      required
                    />
                  </label>
                </div>

                {!codigoEditando && (
                  <label>
                    Código
                    <Input
                      value={formPeca.codigo}
                      onChange={(e) => setFormPeca({ ...formPeca, codigo: e.target.value })}
                      placeholder="Ex: VES-001"
                    />
                  </label>
                )}

                <label>
                  Catálogo
                  <Select
                    value={formPeca.categoria}
                    onValueChange={(v) => setFormPeca({ ...formPeca, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher catálogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogosComForm.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={formPeca.novoCatalogo}
                    onChange={(e) => setFormPeca({ ...formPeca, novoCatalogo: e.target.value })}
                    placeholder="Novo catálogo…"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={onAdicionarCatalogo}>
                    <Plus size={14} className="mr-1" /> Criar
                  </Button>
                </div>

                {codigoEditando && (
                  <label>
                    Estado
                    <Select
                      value={formPeca.estado}
                      onValueChange={(v) => setFormPeca({ ...formPeca, estado: v as EstadoPeca })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosPeca.map((e) => (
                          <SelectItem key={e} value={e}>{traduzirEstadoPeca(e)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                )}
              </div>
            </div>

            {/* ── 3. DESCRIÇÃO (colapsável) ── */}
            <SecaoColapsavel
              id="descricao"
              titulo="Descrição"
              icone={<PencilLine size={15} />}
              aberta={secaoAberta === "descricao"}
              onAlternar={alternarSecao}
            >
              <Textarea
                rows={3}
                value={formPeca.descricao}
                onChange={(e) => setFormPeca({ ...formPeca, descricao: e.target.value })}
                placeholder="Descreve o produto…"
              />
            </SecaoColapsavel>

            {/* ── 4. VARIANTES (colapsável) ── */}
            <SecaoColapsavel
              id="variantes"
              titulo="Variantes"
              icone={<Layers3 size={15} />}
              aberta={secaoAberta === "variantes"}
              onAlternar={alternarSecao}
            >
              <Textarea
                rows={3}
                value={formPeca.variantesTexto}
                onChange={(e) => setFormPeca({ ...formPeca, variantesTexto: e.target.value })}
                placeholder={"cor: vermelho, azul, preto\ntamanho: S, M, L, XL"}
              />
              <p className="text-xs mt-1" style={{ color: "var(--ink-3)" }}>
                Uma variante por linha. Formato: <strong>nome: opção1, opção2</strong>
              </p>
            </SecaoColapsavel>

            {/* ── 5. DETALHES AVANÇADOS (colapsável) ── */}
            <SecaoColapsavel
              id="avancado"
              titulo="Detalhes avançados"
              icone={<Coins size={15} />}
              aberta={secaoAberta === "avancado"}
              onAlternar={alternarSecao}
            >
              <div className="flex flex-col gap-2.5">
                <label>
                  SKU
                  <Input
                    value={formPeca.sku}
                    onChange={(e) => setFormPeca({ ...formPeca, sku: e.target.value })}
                    placeholder="Referência interna"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label>
                    Custo (Kz)
                    <Input
                      type="number"
                      min={0}
                      value={formPeca.custoEmKwanza}
                      onChange={(e) => setFormPeca({ ...formPeca, custoEmKwanza: Number(e.target.value) })}
                    />
                  </label>
                  <label>
                    Stock mínimo
                    <Input
                      type="number"
                      min={0}
                      value={formPeca.stockMinimo}
                      onChange={(e) => setFormPeca({ ...formPeca, stockMinimo: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  Coleção
                  <Select
                    value={formPeca.colecao}
                    onValueChange={(v) => setFormPeca({ ...formPeca, colecao: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem coleção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Sem coleção</SelectItem>
                      {colecoes.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              </div>
            </SecaoColapsavel>

            {/* ── 6. VITRINE & SELOS (colapsável) ── */}
            <SecaoColapsavel
              id="vitrine"
              titulo="Vitrine e selos"
              icone={<BadgeCheck size={15} />}
              aberta={secaoAberta === "vitrine"}
              onAlternar={alternarSecao}
            >
              <div className="flex flex-col gap-3">
                <label>
                  Visibilidade
                  <Select
                    value={formPeca.visibilidade}
                    onValueChange={(v) => setFormPeca({ ...formPeca, visibilidade: v as VisibilidadeProduto })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesVisibilidade.map((op) => (
                        <SelectItem key={op.id} value={op.id}>{op.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label>
                  Prioridade
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={formPeca.prioridade}
                    onChange={(e) => setFormPeca({ ...formPeca, prioridade: Number(e.target.value) })}
                  />
                </label>

                <div>
                  <span className="text-xs font-bold block mb-2" style={{ color: "var(--ink-2)" }}>Selos</span>
                  <div className="flex flex-wrap gap-2">
                    {selosDisponiveis.map((selo) => {
                      const ativo = formPeca.selos.includes(selo.id);
                      return (
                        <button
                          key={selo.id}
                          type="button"
                          className="bz-selo-chip"
                          data-ativo={ativo || undefined}
                          onClick={() =>
                            setFormPeca({
                              ...formPeca,
                              selos: ativo
                                ? formPeca.selos.filter((s) => s !== selo.id)
                                : [...formPeca.selos, selo.id],
                            })
                          }
                          title={selo.detalhe}
                        >
                          {selo.titulo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SecaoColapsavel>
          </div>

          {/* ── AÇÕES FIXAS ── */}
          <div className="bz-dialog-actions-sticky flex gap-2 justify-end border-t">
            <Button type="button" variant="ghost" onClick={onFechar} disabled={carregando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={carregando || !formPeca.nome.trim()}>
              {carregando ? "A guardar…" : codigoEditando ? "Guardar alterações" : "Cadastrar produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Secção colapsável reutilizável ── */

function SecaoColapsavel({
  id,
  titulo,
  icone,
  aberta,
  onAlternar,
  children,
}: {
  id: string;
  titulo: string;
  icone: React.ReactNode;
  aberta: boolean;
  onAlternar: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bz-form-section flex flex-col gap-3">
      <button
        type="button"
        className="bz-form-section-head w-full cursor-pointer"
        onClick={() => onAlternar(id)}
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <div className="bz-form-section-icon">{icone}</div>
        <h3 className="flex-1 text-left">{titulo}</h3>
        <ChevronRight
          size={14}
          style={{
            color: "var(--ink-3)",
            transition: "transform 0.2s",
            transform: aberta ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </button>
      {aberta && <div className="flex flex-col gap-2.5">{children}</div>}
    </div>
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
