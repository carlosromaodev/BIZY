import { BadgeCheck, Boxes, Edit3, Package, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio } from "../componentes/Shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const formularioInicial = {
  codigo: "",
  nome: "",
  descricao: "",
  precoEmKwanza: 12000,
  quantidade: 1,
  fotosTexto: "",
  estado: "DISPONIVEL" as EstadoPeca
};

const estadosPeca: EstadoPeca[] = ["DISPONIVEL", "RESERVADA", "VENDIDA", "ESGOTADA"];

export function PaginaCatalogo() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [codigoEditando, setCodigoEditando] = useState<string | null>(null);
  const [formPeca, setFormPeca] = useState(formularioInicial);

  async function carregar() {
    try {
      setPecas(await requisitarApi<Peca[]>("/pecas"));
    } catch {
      setMensagem("Erro ao carregar catálogo.");
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function salvarPeca(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      const dadosBase = {
        nome: formPeca.nome,
        descricao: formPeca.descricao,
        precoEmKwanza: formPeca.precoEmKwanza,
        quantidade: formPeca.quantidade,
        fotos: extrairFotos(formPeca.fotosTexto)
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
    setMostrarForm(true);
  }

  function fecharFormulario() {
    setCodigoEditando(null);
    setFormPeca(formularioInicial);
    setMostrarForm(false);
  }

  function iniciarEdicao(peca: Peca) {
    setCodigoEditando(peca.codigo);
    setFormPeca({
      codigo: peca.codigo,
      nome: peca.nome,
      descricao: peca.descricao,
      precoEmKwanza: peca.precoEmKwanza,
      quantidade: peca.quantidade,
      fotosTexto: peca.fotos.join("\n"),
      estado: peca.estado
    });
    setMostrarForm(true);
  }

  async function desativarPeca(peca: Peca) {
    if (!window.confirm(`Desativar o produto #${peca.codigo} da live?`)) return;

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

  const pecasFiltradas = busca
    ? pecas.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          p.codigo.toLowerCase().includes(busca.toLowerCase())
      )
    : pecas;

  return (
    <>
      <CabecalhoPagina rotulo="Gestão de produtos" titulo="Produtos">
        <Button size="lg" onClick={abrirCadastro}>
          <Plus size={18} />
          Novo produto
        </Button>
      </CabecalhoPagina>

      {mostrarForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{codigoEditando ? `Editar produto #${codigoEditando}` : "Cadastrar novo produto"}</h2>
            {codigoEditando ? <Edit3 size={20} /> : <Package size={20} />}
          </CardHeader>
          <CardContent>
          <form onSubmit={salvarPeca} className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="codPeca">Código</label>
              <Input
                id="codPeca"
                value={formPeca.codigo}
                disabled={codigoEditando !== null}
                onChange={(e) => setFormPeca({ ...formPeca, codigo: e.target.value })}
                placeholder="Ex: A01"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="nomePeca">Nome</label>
              <Input id="nomePeca" value={formPeca.nome} onChange={(e) => setFormPeca({ ...formPeca, nome: e.target.value })} placeholder="Vestido floral" />
            </div>
            <div className="grid gap-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="descPeca">Descrição</label>
              <Input id="descPeca" value={formPeca.descricao} onChange={(e) => setFormPeca({ ...formPeca, descricao: e.target.value })} placeholder="Descrição do produto" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="precPeca">Preço (Kz)</label>
              <Input id="precPeca" type="number" min="0" step="500" value={formPeca.precoEmKwanza} onChange={(e) => setFormPeca({ ...formPeca, precoEmKwanza: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="qtdPeca">Quantidade</label>
              <Input id="qtdPeca" type="number" min="0" value={formPeca.quantidade} onChange={(e) => setFormPeca({ ...formPeca, quantidade: Number(e.target.value) })} />
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
            <div className="grid gap-2 md:col-span-3">
              <label className="text-sm font-medium" htmlFor="fotosPeca">Fotos por URL</label>
              <Textarea
                id="fotosPeca"
                className="min-h-28"
                value={formPeca.fotosTexto}
                onChange={(e) => setFormPeca({ ...formPeca, fotosTexto: e.target.value })}
                placeholder="Uma URL por linha ou separada por vírgula"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:col-span-3">
              <Button size="lg" disabled={carregando}>
                <BadgeCheck size={18} />
                {codigoEditando ? "Guardar alterações" : "Cadastrar"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={fecharFormulario}>
                Cancelar
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              aria-label="Buscar produtos"
              className="pl-9"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Buscar produto ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon-lg" onClick={() => void carregar()} title="Atualizar" aria-label="Atualizar produtos">
            <RefreshCcw size={18} />
          </Button>
        </div>

        <div className="catalogo-commerce-list grid gap-3">
          {pecasFiltradas.length ? (
            pecasFiltradas.map((peca) => (
              <Card key={peca.id} className="bg-muted/20">
                <CardContent className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center">
                <div className="h-14 w-14 overflow-hidden rounded-lg border bg-background sm:h-16 sm:w-16">
                  {peca.fotos[0] ? (
                    <img className="h-full w-full object-cover" src={peca.fotos[0]} alt={peca.nome} />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground" aria-label="Sem foto">
                      <Package size={18} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">#{peca.codigo}</Badge>
                    <Badge variant={obterVariantePeca(peca.estado)}>{traduzirEstadoPeca(peca.estado)}</Badge>
                  </div>
                  <strong className="mt-2 block truncate">{peca.nome}</strong>
                  <span className="block truncate text-sm text-muted-foreground">{peca.descricao || "Sem descrição"}</span>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <strong>{formatarKwanza(peca.precoEmKwanza)}</strong>
                    <span className="text-muted-foreground">{peca.quantidade} un.</span>
                  </div>
                </div>
                <div className="col-span-2 flex gap-2 sm:col-span-1 sm:justify-end">
                  <Button variant="outline" size="icon-lg" onClick={() => iniciarEdicao(peca)} title="Editar produto" disabled={carregando}>
                    <Edit3 size={16} />
                  </Button>
                  <Button variant="outline" size="icon-lg" onClick={() => void desativarPeca(peca)} title="Desativar produto" disabled={carregando || peca.estado === "ESGOTADA"}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EstadoVazio icone={<Boxes />} titulo="Sem produtos cadastrados" detalhe="Cadastre o primeiro produto para iniciar a venda." />
          )}
        </div>
        </CardContent>
      </Card>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function extrairFotos(valor: string): string[] {
  return valor
    .split(/[\n,]/)
    .map((foto) => foto.trim())
    .filter(Boolean);
}

function obterVariantePeca(estado: EstadoPeca): "success" | "warning" | "info" | "destructive" {
  if (estado === "DISPONIVEL") return "success";
  if (estado === "RESERVADA") return "warning";
  if (estado === "VENDIDA") return "info";
  return "destructive";
}
