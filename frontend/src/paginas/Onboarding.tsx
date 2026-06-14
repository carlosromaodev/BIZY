import {
  ArrowLeft,
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  Eye,
  Flag,
  ImageIcon,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  PackagePlus,
  Rocket,
  ShoppingBag,
  Store,
  Tag,
  Upload,
  UserRound
} from "lucide-react";
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obterUsuario, requisitarApi, resolverUrlMedia, type NegocioSessao } from "../api";
import { enviarMedia } from "../media";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy } from "../marca/bizy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const canaisDisponiveis = ["tiktok", "instagram", "whatsapp", "facebook"];
const pagamentosDisponiveis = ["transferencia", "multicaixa", "cash", "referencia"];
const CLASSE_CAMPO_PUBLICO = "bizy-flow-input";
const CLASSE_TEXTAREA_PUBLICO = "bizy-flow-textarea";

type PassoOnboarding = "objetivo" | "negocio" | "produto" | "pronto";
type ObjetivoOnboarding = "loja" | "crm" | "live" | "explorar";

interface EstadoOnboarding {
  negocio: NegocioSessao | null;
  pendencias: string[];
  completo: boolean;
}

const passosOnboarding: Array<{ id: PassoOnboarding; titulo: string; eta?: string; icone: typeof Store }> = [
  { id: "objetivo", titulo: "Objetivo", eta: "~30s", icone: Rocket },
  { id: "negocio", titulo: "Negócio", eta: "~2min", icone: Building2 },
  { id: "produto", titulo: "Produto inicial", eta: "~1min", icone: PackagePlus },
  { id: "pronto", titulo: "Loja pronta", eta: "feito", icone: CheckCircle2 }
];

const objetivos: Array<{
  id: ObjetivoOnboarding;
  titulo: string;
  texto: string;
  etiqueta?: string;
  tom: string;
  icone: typeof Store;
}> = [
  {
    id: "loja",
    titulo: "Criar loja digital",
    texto: "Montar perfil, link público, primeiro produto e checklist de publicação.",
    etiqueta: "Mais escolhido",
    tom: "verde",
    icone: Store
  },
  {
    id: "crm",
    titulo: "Gerir clientes e vendas",
    texto: "Começar pelo CRM com clientes, pedidos, pagamentos e relatórios.",
    tom: "azul",
    icone: ShoppingBag
  },
  {
    id: "live",
    titulo: "Vender por WhatsApp / Live",
    texto: "Preparar atendimento, conversas e captação de pedidos pelos canais sociais.",
    tom: "violeta",
    icone: MessageCircle
  },
  {
    id: "explorar",
    titulo: "Só explorar a plataforma",
    texto: "Entrar no painel e conhecer os módulos antes de publicar a loja.",
    tom: "ambar",
    icone: Eye
  }
];

function criarNegocioSessaoDemo(negocio: {
  nomeComercial: string;
  segmento: string;
  tipo: string;
  telefone: string;
  whatsapp: string;
  email: string;
  provincia: string;
  municipio: string;
  canaisVenda: string[];
  metodosPagamento: string[];
  minutosReservaPadrao: number;
}): NegocioSessao {
  return {
    id: "negocio-teste-bizy",
    nomeComercial: negocio.nomeComercial,
    segmento: negocio.segmento,
    tipo: negocio.tipo,
    telefone: negocio.telefone || null,
    whatsapp: negocio.whatsapp || null,
    email: negocio.email || null,
    provincia: negocio.provincia || null,
    municipio: negocio.municipio || null,
    moeda: "AOA",
    fusoHorario: "Africa/Luanda",
    canaisVenda: negocio.canaisVenda,
    metodosPagamento: negocio.metodosPagamento,
    minutosReservaPadrao: negocio.minutosReservaPadrao,
    usuarioPapel: "ADMIN"
  };
}

export function PaginaOnboarding() {
  const navigate = useNavigate();
  const usuario = obterUsuario();
  const modoTeste = usuario?.origemCadastro === "Modo teste";
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null);
  const [passo, setPasso] = useState<PassoOnboarding>("objetivo");
  const [objetivo, setObjetivo] = useState<ObjetivoOnboarding>("loja");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("Escolhe o caminho e o Bizy prepara o CRM certo para o teu momento.");
  const [negocio, setNegocio] = useState({
    nomeComercial: "",
    segmento: "",
    tipo: "LOJA",
    telefone: usuario?.telefone ?? "",
    whatsapp: usuario?.telefone ?? "",
    email: usuario?.email ?? "",
    provincia: "Luanda",
    municipio: "",
    instagram: "",
    tiktok: "",
    canaisVenda: ["whatsapp"],
    metodosPagamento: ["transferencia"],
    minutosReservaPadrao: 10
  });
  const [produto, setProduto] = useState({
    codigo: "01",
    nome: "",
    categoria: "",
    descricao: "",
    precoEmKwanza: 0,
    quantidade: 1,
    fotos: [] as string[]
  });
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const tratarFotoProduto = useCallback(async (ficheiros: FileList | null) => {
    if (!ficheiros?.length) return;
    setEnviandoFoto(true);
    try {
      const novasUrls: string[] = [];
      for (const ficheiro of Array.from(ficheiros).slice(0, 4)) {
        const resultado = await enviarMedia(ficheiro, "catalogo", 1200);
        novasUrls.push(resultado.url);
      }
      setProduto((atual) => ({ ...atual, fotos: [...atual.fotos, ...novasUrls] }));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }, []);

  const indicePassoAtual = passosOnboarding.findIndex((item) => item.id === passo);
  const progresso = `${((indicePassoAtual + 1) / passosOnboarding.length) * 100}%`;
  const iniciaisUsuario = useMemo(() => {
    const nome = usuario?.nome?.trim() || "Vendedor Bizy";
    return nome
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("");
  }, [usuario?.nome]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      if (modoTeste) {
        setEstado({ negocio: null, pendencias: ["CADASTRAR_NEGOCIO"], completo: false });
        setPasso("objetivo");
        setMensagem("Modo teste ativo. Podes experimentar o lançamento sem SMS nem Gmail.");
        setCarregando(false);
        return;
      }

      try {
        const resposta = await requisitarApi<EstadoOnboarding>("/onboarding/estado");
        if (!ativo) return;
        setEstado(resposta);
        setPasso(resposta.negocio ? "produto" : "objetivo");
        if (resposta.negocio) {
          setNegocio((atual) => ({
            ...atual,
            nomeComercial: resposta.negocio?.nomeComercial ?? atual.nomeComercial,
            segmento: resposta.negocio?.segmento ?? atual.segmento,
            tipo: resposta.negocio?.tipo ?? atual.tipo,
            telefone: resposta.negocio?.telefone ?? atual.telefone,
            whatsapp: resposta.negocio?.whatsapp ?? atual.whatsapp,
            email: resposta.negocio?.email ?? atual.email,
            provincia: resposta.negocio?.provincia ?? atual.provincia,
            municipio: resposta.negocio?.municipio ?? atual.municipio,
            canaisVenda: resposta.negocio?.canaisVenda?.length ? resposta.negocio.canaisVenda : atual.canaisVenda,
            metodosPagamento: resposta.negocio?.metodosPagamento?.length
              ? resposta.negocio.metodosPagamento
              : atual.metodosPagamento,
            minutosReservaPadrao: resposta.negocio?.minutosReservaPadrao ?? atual.minutosReservaPadrao
          }));
        }
      } catch (erro) {
        setMensagem(erro instanceof Error ? erro.message : "Não foi possível carregar o onboarding.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [modoTeste]);

  async function salvarNegocio(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("A guardar dados da loja...");

    if (modoTeste) {
      const negocioDemo = criarNegocioSessaoDemo(negocio);
      setEstado({ negocio: negocioDemo, pendencias: [], completo: true });
      setPasso("produto");
      setMensagem("Loja demo guardada. Agora adiciona o primeiro produto para ver o catálogo ganhar forma.");
      setSalvando(false);
      return;
    }

    try {
      const resposta = await requisitarApi<{ negocio: NegocioSessao }>("/onboarding/negocio", {
        method: "POST",
        body: negocio
      });
      setEstado((atual) => ({
        negocio: resposta.negocio,
        completo: true,
        pendencias: atual?.pendencias.filter((item) => item !== "CADASTRAR_NEGOCIO") ?? []
      }));
      setPasso("produto");
      setMensagem("Negócio guardado. Agora adiciona o primeiro produto para testar a live.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível guardar o negócio.");
    } finally {
      setSalvando(false);
    }
  }

  async function criarProduto(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem("A criar produto inicial...");

    if (modoTeste) {
      setPasso("pronto");
      setMensagem("Base demo criada. O Bizy já tem loja e produto inicial para explorar.");
      setSalvando(false);
      return;
    }

    try {
      await requisitarApi("/onboarding/produto-inicial", {
        method: "POST",
        body: produto
      });
      setPasso("pronto");
      setMensagem("Base criada. O Bizy já tem negócio e produto inicial para operar.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível criar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  function alternarLista(campo: "canaisVenda" | "metodosPagamento", valor: string) {
    setNegocio((atual) => {
      const atualLista = atual[campo];
      const proxima = atualLista.includes(valor)
        ? atualLista.filter((item) => item !== valor)
        : [...atualLista, valor];
      return { ...atual, [campo]: proxima };
    });
  }

  return (
    <main className="bizy-public bizy-wizard-page">
      <aside className="bizy-wizard-rail">
        <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />
        <Badge className="bizy-wizard-tag" variant="outline">
          <Rocket size={14} />
          Lançamento da loja
        </Badge>
        <div>
          <h1>Vamos lançar a tua loja.</h1>
          <p>A loja nasce em rascunho. Publicas quando tiver identidade, contacto e primeiro produto.</p>
        </div>

        <div className="bizy-wizard-steps">
          <div className="bizy-wizard-progress">
            <span><i style={{ width: progresso }} /></span>
            <b>{indicePassoAtual + 1}/4</b>
          </div>
          {passosOnboarding.map((item, index) => {
            const completo = index < indicePassoAtual;
            const ativo = item.id === passo;
            const Icone = item.icone;

            return (
              <div
                key={item.id}
                className={cn("bizy-wizard-step", ativo ? "is-active" : "", completo ? "is-done" : "")}
              >
                <span>{completo ? <CheckCircle2 size={14} /> : index + 1}</span>
                <Icone size={17} />
                <strong>{item.titulo}</strong>
                <small>{item.eta}</small>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="bizy-wizard-main">
        <div className="bizy-wizard-head">
          <div>
            <span><i />Passo {indicePassoAtual + 1} de 4</span>
            <h2>
              {passo === "objetivo"
                ? "Por onde queres começar?"
                : passo === "negocio"
                  ? "Dados da loja"
                  : passo === "produto"
                    ? "O teu primeiro produto"
                    : "Loja pronta"}
            </h2>
            <p>{mensagem}</p>
          </div>

          <div className="bizy-user-pill">
            <span>{iniciaisUsuario || "VB"}</span>
            <div>
              <strong>{usuario?.nome ?? "Vendedor Bizy"}</strong>
              <small>{usuario?.email ?? usuario?.telefone ?? "sessão ativa"}</small>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="bizy-loading-card">
            <Loader2 className="animate-spin" size={30} />
          </div>
        ) : passo === "objetivo" ? (
          <div className="bizy-objective-wrap">
            <div className="bizy-objective-grid">
              {objetivos.map((item) => {
                const Icone = item.icone;
                const ativo = objetivo === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn("bizy-objective-card", ativo ? "is-active" : "")}
                    data-tone={item.tom}
                    onClick={() => setObjetivo(item.id)}
                    aria-pressed={ativo}
                  >
                    {item.etiqueta ? <b>{item.etiqueta}</b> : null}
                    <i aria-hidden />
                    <span><Icone size={21} /></span>
                    <h3>{item.titulo}</h3>
                    <p>{item.texto}</p>
                  </button>
                );
              })}
            </div>
            <div className="bizy-wizard-actions">
              <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline" onClick={() => navigate("/app")}>
                Decidir depois
              </Button>
              <Button className="bizy-btn bizy-btn-primary" type="button" onClick={() => setPasso("negocio")}>
                Continuar
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : passo === "negocio" ? (
          <form onSubmit={salvarNegocio} className="bizy-form-layout">
            <div className="bizy-form-stack">
              <section className="bizy-form-section">
                <HeaderSecao icone={<Store size={15} />} titulo="Identidade" tom="verde" />
                <div className="bizy-form-grid">
                  <Campo label="Nome comercial" id="nomeComercial">
                    <Input id="nomeComercial" className={CLASSE_CAMPO_PUBLICO} value={negocio.nomeComercial} onChange={(e) => setNegocio({ ...negocio, nomeComercial: e.target.value })} required />
                  </Campo>
                  <Campo label="Segmento" id="segmento">
                    <Input id="segmento" className={CLASSE_CAMPO_PUBLICO} value={negocio.segmento} onChange={(e) => setNegocio({ ...negocio, segmento: e.target.value })} placeholder="Moda, eletrônicos, cosméticos..." required />
                  </Campo>
                </div>
              </section>

              <section className="bizy-form-section">
                <HeaderSecao icone={<MapPin size={15} />} titulo="Contacto & localização" tom="azul" />
                <div className="bizy-form-grid">
                  <Campo label="WhatsApp oficial" id="whatsapp">
                    <Input id="whatsapp" className={CLASSE_CAMPO_PUBLICO} value={negocio.whatsapp} onChange={(e) => setNegocio({ ...negocio, whatsapp: e.target.value })} inputMode="tel" />
                  </Campo>
                  <Campo label="Email" id="emailNegocio">
                    <Input id="emailNegocio" className={CLASSE_CAMPO_PUBLICO} type="email" value={negocio.email} onChange={(e) => setNegocio({ ...negocio, email: e.target.value })} />
                  </Campo>
                  <Campo label="Província" id="provincia">
                    <Input id="provincia" className={CLASSE_CAMPO_PUBLICO} value={negocio.provincia} onChange={(e) => setNegocio({ ...negocio, provincia: e.target.value })} />
                  </Campo>
                  <Campo label="Município" id="municipio">
                    <Input id="municipio" className={CLASSE_CAMPO_PUBLICO} value={negocio.municipio} onChange={(e) => setNegocio({ ...negocio, municipio: e.target.value })} />
                  </Campo>
                </div>
              </section>

              <section className="bizy-form-section">
                <HeaderSecao icone={<Flag size={15} />} titulo="Canais & pagamento" tom="violeta" detalhe="podes mudar depois" />
                <SelecaoCompacta titulo="Canais de venda" itens={canaisDisponiveis} ativos={negocio.canaisVenda} onToggle={(valor) => alternarLista("canaisVenda", valor)} />
                <SelecaoCompacta titulo="Métodos de pagamento" itens={pagamentosDisponiveis} ativos={negocio.metodosPagamento} onToggle={(valor) => alternarLista("metodosPagamento", valor)} />
              </section>

              <div className="bizy-wizard-actions">
                <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline" onClick={() => setPasso("objetivo")}>
                  <ArrowLeft size={16} />
                  Voltar
                </Button>
                <Button className="bizy-btn bizy-btn-primary" disabled={salvando || !negocio.nomeComercial || !negocio.segmento}>
                  {salvando ? <Loader2 className="animate-spin" /> : <Store size={16} />}
                  Guardar e continuar
                </Button>
              </div>
            </div>

            <PreviewLoja negocio={negocio} />
          </form>
        ) : passo === "produto" ? (
          <form onSubmit={criarProduto} className="bizy-form-layout">
            <div className="bizy-form-stack">
              <section className="bizy-form-section">
                <HeaderSecao icone={<ImageIcon size={15} />} titulo="Foto do produto" tom="verde" detalhe="recomendado" />
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => tratarFotoProduto(e.target.files)}
                />
                {produto.fotos.length > 0 ? (
                  <div className="bizy-upload-preview">
                    {produto.fotos.map((foto, i) => (
                      <div key={i} className="bizy-upload-thumb">
                        <img src={resolverUrlMedia(foto)} alt={`Foto ${i + 1}`} />
                        <button type="button" aria-label="Remover" onClick={() => setProduto((a) => ({ ...a, fotos: a.fotos.filter((_, j) => j !== i) }))}>×</button>
                      </div>
                    ))}
                    {produto.fotos.length < 4 && (
                      <button type="button" className="bizy-upload-add" onClick={() => inputFotoRef.current?.click()} disabled={enviandoFoto}>
                        {enviandoFoto ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" className="bizy-upload-card" onClick={() => inputFotoRef.current?.click()} disabled={enviandoFoto}>
                    {enviandoFoto ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                    <strong>{enviandoFoto ? "A enviar..." : "Toca para escolher uma foto"}</strong>
                    <span>Produtos com foto vendem mais. PNG ou JPG até 5 MB.</span>
                  </button>
                )}
              </section>

              <section className="bizy-form-section">
                <HeaderSecao icone={<Tag size={15} />} titulo="Detalhes" tom="azul" />
                <div className="bizy-form-grid">
                  <Campo label="Código da peça" id="codigoProduto">
                    <Input id="codigoProduto" className={CLASSE_CAMPO_PUBLICO} value={produto.codigo} onChange={(e) => setProduto({ ...produto, codigo: e.target.value })} required />
                  </Campo>
                  <Campo label="Nome do produto" id="nomeProduto">
                    <Input id="nomeProduto" className={CLASSE_CAMPO_PUBLICO} value={produto.nome} onChange={(e) => setProduto({ ...produto, nome: e.target.value })} required />
                  </Campo>
                  <Campo label="Categoria" id="categoriaProduto">
                    <Input id="categoriaProduto" className={CLASSE_CAMPO_PUBLICO} value={produto.categoria} onChange={(e) => setProduto({ ...produto, categoria: e.target.value })} />
                  </Campo>
                  <Campo label="Preço em Kz" id="precoProduto">
                    <Input id="precoProduto" className={CLASSE_CAMPO_PUBLICO} type="number" min={0} value={produto.precoEmKwanza} onChange={(e) => setProduto({ ...produto, precoEmKwanza: Number(e.target.value) })} required />
                  </Campo>
                  <Campo label="Stock" id="stockProduto">
                    <Input id="stockProduto" className={CLASSE_CAMPO_PUBLICO} type="number" min={0} value={produto.quantidade} onChange={(e) => setProduto({ ...produto, quantidade: Number(e.target.value) })} required />
                  </Campo>
                </div>
                <Campo label="Descrição" id="descricaoProduto">
                  <Textarea id="descricaoProduto" className={CLASSE_TEXTAREA_PUBLICO} value={produto.descricao} onChange={(e) => setProduto({ ...produto, descricao: e.target.value })} rows={4} />
                </Campo>
              </section>

              <div className="bizy-wizard-actions">
                <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline" onClick={() => setPasso("negocio")}>
                  <ArrowLeft size={16} />
                  Voltar
                </Button>
                <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline" onClick={() => navigate("/app")}>
                  Fazer depois
                </Button>
                <Button className="bizy-btn bizy-btn-primary" disabled={salvando || !produto.codigo || !produto.nome}>
                  {salvando ? <Loader2 className="animate-spin" /> : <PackagePlus size={16} />}
                  Criar produto
                </Button>
              </div>
            </div>

            <PreviewProduto produto={produto} />
          </form>
        ) : (
          <div className="bizy-done-wrap">
            <div className="bizy-done-ring"><span><CheckCircle2 size={30} /></span></div>
            <h2>{(estado?.negocio?.nomeComercial ?? negocio.nomeComercial) || "A tua loja"} está pronta!</h2>
            <p>Loja criada em rascunho com o primeiro produto. Partilha o link ou entra no painel para começar a vender.</p>
            <div className="bizy-sharebox">
              <Link2 size={15} />
              <span>bizy.store/{((estado?.negocio?.nomeComercial ?? negocio.nomeComercial) || "minha-loja").toLowerCase().replace(/\s+/g, "-")}</span>
              <b>Copiar link</b>
            </div>
            <div className="bizy-checklist">
              <ChecklistItem icone={<Store size={16} />} titulo="Loja digital" texto="perfil + link público" estado="Criada" />
              <ChecklistItem icone={<Tag size={16} />} titulo="Primeiro produto" texto={produto.nome || "produto inicial"} estado="Criado" />
              <ChecklistItem icone={<MessageCircle size={16} />} titulo="WhatsApp ligado" texto={negocio.whatsapp || "contacto configurado"} estado="Ativo" />
              <ChecklistItem icone={<Rocket size={16} />} titulo="Publicar a loja" texto="torna o link visível a todos" estado="A seguir" pendente />
            </div>
            <div className="bizy-done-actions">
              <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline">
                <Eye size={16} />
                Ver a loja
              </Button>
              <Button className="bizy-btn bizy-btn-primary" type="button" onClick={() => navigate("/app")}>
                Entrar no painel
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function HeaderSecao({ icone, titulo, tom, detalhe }: { icone: ReactNode; titulo: string; tom: string; detalhe?: string }) {
  return (
    <div className="bizy-section-mini-head" data-tone={tom}>
      <span>{icone}</span>
      <strong>{titulo}</strong>
      {detalhe ? <small>{detalhe}</small> : null}
    </div>
  );
}

function Campo({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="bizy-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SelecaoCompacta({
  titulo,
  itens,
  ativos,
  onToggle
}: {
  titulo: string;
  itens: string[];
  ativos: string[];
  onToggle: (valor: string) => void;
}) {
  return (
    <div className="bizy-chip-group">
      <Label>{titulo}</Label>
      <div>
        {itens.map((item) => {
          const ativo = ativos.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={cn("bizy-chip", ativo ? "is-active" : "")}
              onClick={() => onToggle(item)}
              aria-pressed={ativo}
            >
              {ativo ? <CheckCircle2 size={13} /> : null}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewLoja({ negocio }: { negocio: { nomeComercial: string; segmento: string; provincia: string; canaisVenda: string[]; metodosPagamento: string[] } }) {
  const nome = negocio.nomeComercial || "Sapataria Verde";
  const inicial = nome.trim()[0]?.toUpperCase() ?? "S";
  const slug = nome.toLowerCase().trim().replace(/\s+/g, "-") || "sapataria-verde";

  return (
    <aside className="bizy-live-preview">
      <span><i />Pré-visualização ao vivo</span>
      <div className="bizy-store-preview-card">
        <div className="bizy-store-preview-hero" />
        <div className="bizy-store-preview-logo">{inicial}</div>
        <div>
          <strong>{nome}</strong>
          <small>{negocio.segmento || "Calçado"} · {negocio.provincia || "Luanda"}</small>
          <p><Link2 size={12} />bizy.store/{slug}</p>
          <div>
            {negocio.canaisVenda.slice(0, 2).map((item) => <span key={item}>{item}</span>)}
            {negocio.metodosPagamento.slice(0, 2).map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </div>
      <p>É assim que os teus clientes vão ver a loja. Atualiza enquanto preenches.</p>
    </aside>
  );
}

function PreviewProduto({ produto }: { produto: { nome: string; categoria: string; precoEmKwanza: number; quantidade: number } }) {
  return (
    <aside className="bizy-live-preview">
      <span><i />Como o cliente vê</span>
      <div className="bizy-product-preview-card">
        <div>
          <b>Novo</b>
          <ImageIcon size={34} />
        </div>
        <section>
          <strong>{produto.nome || "Sandália dourada salto bloco"}</strong>
          <small>{produto.categoria || "Calçado feminino"}</small>
          <p>{Number(produto.precoEmKwanza || 23500).toLocaleString("pt-AO")} Kz</p>
          <span><Box size={11} />{produto.quantidade || 1} em stock</span>
        </section>
      </div>
      <p>Este cartão entra direto no catálogo e na loja pública.</p>
    </aside>
  );
}

function ChecklistItem({ icone, titulo, texto, estado, pendente = false }: { icone: ReactNode; titulo: string; texto: string; estado: string; pendente?: boolean }) {
  return (
    <div className="bizy-check-item">
      <span>{icone}</span>
      <div>
        <strong>{titulo}</strong>
        <small>{texto}</small>
      </div>
      <b className={pendente ? "is-pending" : ""}>{estado}</b>
    </div>
  );
}
