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
  Trash2,
  Upload
} from "lucide-react";
import { type DragEvent, type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { obterUsuario, requisitarApi, resolverUrlMedia, type NegocioSessao } from "../api";
import { enviarMedia } from "../media";
import { ExibidorImagem } from "../componentes/ExibidorImagem";
import { CORES_LOGO_BIZY_ESCURA, LogoBizy } from "../marca/bizy";
import { BorderTrail } from "@/components/ui/border-trail";
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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const passosOnboarding: Array<{ id: PassoOnboarding; titulo: string; eta?: string; icone: typeof Store }> = [
  { id: "objetivo", titulo: "Objetivo", eta: "~30s", icone: Rocket },
  { id: "negocio", titulo: "Negócio", eta: "~2min", icone: Building2 },
  { id: "produto", titulo: "Primeiro produto", eta: "~1min", icone: PackagePlus },
  { id: "pronto", titulo: "Pronto", eta: "feito", icone: CheckCircle2 }
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
    titulo: "Montar a loja digital",
    texto: "Perfil, link público, compra online e primeiro produto — pronto para partilhar.",
    etiqueta: "Mais escolhido",
    tom: "verde",
    icone: Store
  },
  {
    id: "crm",
    titulo: "Gerir clientes e vendas",
    texto: "Team multi-canal com pedidos, pagamentos, conversas e relatórios.",
    tom: "azul",
    icone: ShoppingBag
  },
  {
    id: "live",
    titulo: "Vender por lives e WhatsApp",
    texto: "Pedidos automáticos na live, inbox centralizado e recuperação de vendas.",
    tom: "violeta",
    icone: MessageCircle
  },
  {
    id: "explorar",
    titulo: "Explorar a plataforma",
    texto: "Conhecer os módulos antes de publicar — sem compromisso.",
    tom: "ambar",
    icone: Eye
  }
];

const titulosPasso: Record<PassoOnboarding, string> = {
  objetivo: "Por onde queres começar?",
  negocio: "Dados do negócio",
  produto: "Primeiro produto",
  pronto: "Tudo pronto"
};

const descricoesPasso: Record<PassoOnboarding, string> = {
  objetivo: "O Bizy adapta-se ao teu objectivo. Escolhe e avançamos.",
  negocio: "Identidade, contacto e canais — o essencial para ires ao ar.",
  produto: "Adiciona a tua primeira peça ao catálogo.",
  pronto: "O teu negócio está configurado e pronto para operar."
};

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
  const rm = useReducedMotion();
  const [estado, setEstado] = useState<EstadoOnboarding | null>(null);
  const [passo, setPasso] = useState<PassoOnboarding>("objetivo");
  const [objetivo, setObjetivo] = useState<ObjetivoOnboarding>("loja");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("Como queres começar? O Bizy adapta-se ao teu objectivo.");
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
  const [arrastando, setArrastando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const tratarFotoProduto = useCallback(async (ficheiros: FileList | null) => {
    if (!ficheiros?.length) return;
    setEnviandoFoto(true);
    try {
      const novasUrls: string[] = [];
      for (const ficheiro of Array.from(ficheiros).slice(0, 4)) {
        if (!ficheiro.type.startsWith("image/")) continue;
        const resultado = await enviarMedia(ficheiro, "catalogo", 1200);
        novasUrls.push(resultado.url);
      }
      setProduto((atual) => ({ ...atual, fotos: [...atual.fotos, ...novasUrls].slice(0, 4) }));
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setArrastando(true); }, []);
  const onDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setArrastando(false); }, []);
  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setArrastando(false); void tratarFotoProduto(e.dataTransfer.files); }, [tratarFotoProduto]);

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
        setMensagem("Modo teste ativo — explora sem SMS nem Gmail.");
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
      setMensagem("Negócio guardado. Agora adiciona o primeiro produto.");
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
      setMensagem("Negócio guardado. Agora adiciona o primeiro produto ao catálogo.");
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
      setMensagem("Base criada — entra no painel e começa a operar.");
      setSalvando(false);
      return;
    }

    try {
      await requisitarApi("/onboarding/produto-inicial", {
        method: "POST",
        body: produto
      });
      setPasso("pronto");
      setMensagem("Tudo configurado — o teu negócio está pronto para operar.");
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
      {/* ══════════ RAIL ══════════ */}
      <aside className="bizy-wizard-rail">
        <div className="bizy-auth-canvas-grain" />

        <motion.div
          initial={rm ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
        >
          <LogoBizy cores={CORES_LOGO_BIZY_ESCURA} />
        </motion.div>

        <motion.div
          initial={rm ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
        >
          <Badge className="bizy-wizard-tag" variant="outline">
            <Rocket size={14} />
            Configuração inicial
          </Badge>
          <h1>Configura o teu negócio.</h1>
          <p>Loja, canais de venda, pagamento e primeiro produto — publicas quando estiver pronto.</p>
        </motion.div>

        <motion.div
          className="bizy-wizard-steps"
          initial={rm ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: EASE }}
        >
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
        </motion.div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <section className="bizy-wizard-main">
        <motion.div
          className="bizy-wizard-head"
          initial={rm ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        >
          <div>
            <span><i />Passo {indicePassoAtual + 1} de 4</span>
            <AnimatePresence mode="wait">
              <motion.h2
                key={passo}
                initial={rm ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {titulosPasso[passo]}
              </motion.h2>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={passo}
                initial={rm ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {descricoesPasso[passo]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="bizy-user-pill">
            <span>{iniciaisUsuario || "VB"}</span>
            <div>
              <strong>{usuario?.nome ?? "Vendedor Bizy"}</strong>
              <small>{usuario?.email ?? usuario?.telefone ?? "sessão ativa"}</small>
            </div>
          </div>
        </motion.div>

        {carregando ? (
          <div className="bizy-loading-card">
            <Loader2 className="animate-spin" size={30} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {passo === "objetivo" ? (
              <motion.div
                key="objetivo"
                className="bizy-objective-wrap"
                initial={rm ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="bizy-objective-grid">
                  {objetivos.map((item, i) => {
                    const Icone = item.icone;
                    const ativo = objetivo === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        className={cn("bizy-objective-card", ativo ? "is-active" : "")}
                        data-tone={item.tom}
                        onClick={() => setObjetivo(item.id)}
                        aria-pressed={ativo}
                        initial={rm ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08 * i, ease: EASE }}
                      >
                        {item.etiqueta ? <b>{item.etiqueta}</b> : null}
                        <i aria-hidden />
                        <span><Icone size={21} /></span>
                        <h3>{item.titulo}</h3>
                        <p>{item.texto}</p>
                      </motion.button>
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
              </motion.div>
            ) : passo === "negocio" ? (
              <motion.form
                key="negocio"
                onSubmit={salvarNegocio}
                className="bizy-form-layout"
                initial={rm ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div className="bizy-form-stack">
                  <section className="bizy-form-section">
                    <BorderTrail
                      size={40}
                      className="bg-[linear-gradient(to_right,var(--bizy-em),var(--bizy-lime),var(--bizy-em))]"
                      transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    />
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
              </motion.form>
            ) : passo === "produto" ? (
              <motion.form
                key="produto"
                onSubmit={criarProduto}
                className="bizy-form-layout"
                initial={rm ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
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
                            <ExibidorImagem
                              src={foto}
                              alt={`Foto ${i + 1}`}
                              fallbackIcone={<ImageIcon size={20} />}
                            />
                            <button type="button" aria-label="Remover" onClick={() => setProduto((a) => ({ ...a, fotos: a.fotos.filter((_, j) => j !== i) }))}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        {produto.fotos.length < 4 && (
                          <button
                            type="button"
                            className="bizy-upload-add"
                            onClick={() => inputFotoRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            disabled={enviandoFoto}
                          >
                            {enviandoFoto ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`bizy-upload-card ${arrastando ? "is-dragging" : ""}`}
                        onClick={() => inputFotoRef.current?.click()}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        disabled={enviandoFoto}
                      >
                        {enviandoFoto ? <Loader2 size={22} className="animate-spin" /> : arrastando ? <Upload size={22} /> : <ImageIcon size={22} />}
                        <strong>{enviandoFoto ? "A enviar..." : arrastando ? "Largar aqui" : "Clique ou arraste uma foto"}</strong>
                        <span>Produtos com foto vendem mais. PNG ou JPG até 5 MB.</span>
                      </button>
                    )}
                  </section>

                  <section className="bizy-form-section">
                    <BorderTrail
                      size={40}
                      className="bg-[linear-gradient(to_right,var(--bizy-em),var(--bizy-lime),var(--bizy-em))]"
                      transition={{ duration: 6, ease: "linear", repeat: Infinity }}
                    />
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
              </motion.form>
            ) : (
              <motion.div
                key="pronto"
                className="bizy-done-wrap"
                initial={rm ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <motion.div
                  className="bizy-done-ring"
                  initial={rm ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                >
                  <span><CheckCircle2 size={30} /></span>
                </motion.div>
                <motion.h2
                  initial={rm ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
                >
                  {(estado?.negocio?.nomeComercial ?? negocio.nomeComercial) || "O teu negócio"} está pronto.
                </motion.h2>
                <motion.p
                  initial={rm ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
                >
                  Negócio configurado com o primeiro produto. Partilha o link ou entra no painel para começar.
                </motion.p>
                <motion.div
                  className="bizy-sharebox"
                  initial={rm ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.42, ease: EASE }}
                >
                  <Link2 size={15} />
                  <span>bizy.store/{((estado?.negocio?.nomeComercial ?? negocio.nomeComercial) || "minha-loja").toLowerCase().replace(/\s+/g, "-")}</span>
                  <b>Copiar link</b>
                </motion.div>
                <motion.div
                  className="bizy-checklist"
                  initial={rm ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.5, ease: EASE }}
                >
                  <ChecklistItem icone={<Store size={16} />} titulo="Loja digital" texto="perfil + link público" estado="Criada" />
                  <ChecklistItem icone={<Tag size={16} />} titulo="Primeiro produto" texto={produto.nome || "produto inicial"} estado="Criado" />
                  <ChecklistItem icone={<MessageCircle size={16} />} titulo="WhatsApp ligado" texto={negocio.whatsapp || "contacto configurado"} estado="Ativo" />
                  <ChecklistItem icone={<Rocket size={16} />} titulo="Publicar a loja" texto="torna o link visível a todos" estado="A seguir" pendente />
                </motion.div>
                <motion.div
                  className="bizy-done-actions"
                  initial={rm ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.58, ease: EASE }}
                >
                  <Button className="bizy-btn bizy-btn-outline" type="button" variant="outline">
                    <Eye size={16} />
                    Ver a loja
                  </Button>
                  <Button className="bizy-btn bizy-btn-primary" type="button" onClick={() => navigate("/app")}>
                    Entrar no painel
                    <ArrowRight size={16} />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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

function PreviewProduto({ produto }: { produto: { nome: string; categoria: string; precoEmKwanza: number; quantidade: number; fotos: string[] } }) {
  return (
    <aside className="bizy-live-preview">
      <span><i />Como o cliente vê</span>
      <div className="bizy-product-preview-card">
        <div>
          <b>Novo</b>
          {produto.fotos.length > 0 ? (
            <ExibidorImagem src={produto.fotos[0]} alt={produto.nome} fallbackIcone={<ImageIcon size={34} />} />
          ) : (
            <ImageIcon size={34} />
          )}
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
