import {
  Activity,
  CheckCircle2,
  Edit3,
  MessageSquareText,
  RefreshCcw,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { requisitarApi, obterUrlEventos } from "../api";
import { EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { ComentarioRecebido } from "../tipos";
import { formatarConfianca, obterIniciais, traduzirEstadoComentario } from "../utilidades";

interface ResultadoLimpezaComunicacao {
  apagados: {
    comentarios: number;
    mensagensAtendimento: number;
    conversasAtendimento: number;
    clientesAtendimento: number;
    mensagensWhatsapp: number;
    outboxWhatsapp: number;
    codigosSms: number;
  };
  preservados: string[];
  executadoEm: string;
}

export function PaginaComentarios() {
  const [comentarios, setComentarios] = useState<ComentarioRecebido[]>([]);
  const [estatisticas, setEstatisticas] = useState({ total: 0, validos: 0, invalidos: 0, revisao: 0, ignorados: 0 });
  const [mensagem, setMensagem] = useState("");
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("operacionais");
  const [comentarioEmRevisao, setComentarioEmRevisao] = useState<string | null>(null);
  const [limpandoDados, setLimpandoDados] = useState(false);
  const [formRevisao, setFormRevisao] = useState({
    telefone: "",
    codigoPeca: "",
    observacao: "",
    motivoRejeicao: "Comentário rejeitado na revisão manual."
  });
  const [salvandoRevisao, setSalvandoRevisao] = useState(false);

  async function carregar(opcoes: { silencioso?: boolean } = {}) {
    if (!opcoes.silencioso) {
      setCarregandoComentarios(true);
    }
    try {
      const lista = await requisitarApi<ComentarioRecebido[]>("/comentarios?incluirIgnorados=true");
      const validos = lista.filter((c) => c.estado === "PROCESSADO").length;
      const emRevisao = lista.filter((c) => c.estado === "REVISAO_MANUAL" || c.interpretacao?.requiresManualReview).length;
      const ignorados = lista.filter((c) => c.estado === "IGNORADO").length;

      setComentarios(lista);
      setEstatisticas({
        total: lista.length,
        validos,
        invalidos: lista.length - validos,
        revisao: emRevisao,
        ignorados
      });
      if (!opcoes.silencioso) {
        setMensagem(`Comentários atualizados. ${lista.length} capturados; ${ignorados} ignorados ocultos no filtro operacional.`);
      }
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao carregar comentários.");
    } finally {
      if (!opcoes.silencioso) {
        setCarregandoComentarios(false);
      }
    }
  }

  useEffect(() => {
    void carregar({ silencioso: true });
    const eventos = new EventSource(obterUrlEventos());
    const atualizar = () => void carregar({ silencioso: true });
    eventos.addEventListener("COMMENT_RECEIVED", atualizar);
    eventos.addEventListener("COMMENT_PARSED", atualizar);
    eventos.addEventListener("COMMENT_REVIEWED", atualizar);
    eventos.addEventListener("RESERVATION_CREATED", atualizar);
    eventos.onerror = () => {
      setMensagem("Ligação em tempo real instável. A atualizar comentários automaticamente.");
      void carregar({ silencioso: true });
    };

    const intervalo = window.setInterval(atualizar, 5_000);
    return () => {
      eventos.close();
      window.clearInterval(intervalo);
    };
  }, []);

  function abrirRevisao(comentario: ComentarioRecebido) {
    setComentarioEmRevisao(comentario.id);
    setFormRevisao({
      telefone: comentario.interpretacao?.phone ?? "",
      codigoPeca: comentario.interpretacao?.productCode ?? "",
      observacao: "",
      motivoRejeicao: "Comentário rejeitado na revisão manual."
    });
  }

  async function aprovarComentario(e: FormEvent, comentario: ComentarioRecebido) {
    e.preventDefault();
    setSalvandoRevisao(true);
    try {
      await requisitarApi(`/comentarios/${encodeURIComponent(comentario.id)}/aprovar`, {
        method: "POST",
        body: {
          telefone: formRevisao.telefone,
          codigoPeca: formRevisao.codigoPeca,
          observacao: formRevisao.observacao || undefined
        }
      });
      setMensagem("Comentário aprovado e reserva criada/encaminhada.");
      setComentarioEmRevisao(null);
      await carregar();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao aprovar comentário.");
    } finally {
      setSalvandoRevisao(false);
    }
  }

  async function rejeitarComentario(comentario: ComentarioRecebido) {
    setSalvandoRevisao(true);
    try {
      await requisitarApi(`/comentarios/${encodeURIComponent(comentario.id)}/rejeitar`, {
        method: "POST",
        body: { motivo: formRevisao.motivoRejeicao }
      });
      setMensagem("Comentário rejeitado.");
      setComentarioEmRevisao(null);
      await carregar();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Erro ao rejeitar comentário.");
    } finally {
      setSalvandoRevisao(false);
    }
  }

  async function limparDadosOperacionais() {
    setLimpandoDados(true);
    try {
      const resultado = await requisitarApi<ResultadoLimpezaComunicacao>("/comentarios/dados-operacionais", {
        method: "DELETE",
        body: { confirmacao: "LIMPAR" }
      });
      const mensagensApagadas =
        resultado.apagados.mensagensAtendimento +
        resultado.apagados.mensagensWhatsapp +
        resultado.apagados.outboxWhatsapp;
      setMensagem(
        `Dados limpos: ${resultado.apagados.comentarios} comentários e ${mensagensApagadas} registos de mensagens removidos. Reservas, produtos e ligação WhatsApp foram preservados.`
      );
      await carregar({ silencioso: true });
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Erro ao limpar dados.");
    } finally {
      setLimpandoDados(false);
    }
  }

  const comentariosFiltrados = comentarios.filter((c) => {
    if (filtro === "operacionais" && c.estado === "IGNORADO") return false;
    if (filtro !== "todos" && filtro !== "operacionais" && c.estado !== filtro) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      return (
        c.comentario.commentText.toLowerCase().includes(termo) ||
        c.comentario.username.toLowerCase().includes(termo) ||
        c.comentario.displayName.toLowerCase().includes(termo)
      );
    }
    return true;
  });
  const comentariosOcultos = filtro === "operacionais" ? estatisticas.ignorados : 0;

  return (
    <>
      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Entrada ao vivo</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Comentários da live</h1>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
            <Activity size={16} />
            <span>A ouvir</span>
          </div>
        </div>

        <ResumoIndicadores
          rotulo="Resumo dos comentários da live"
          itens={[
            { icone: <MessageSquareText />, titulo: "Total", valor: estatisticas.total, detalhe: "comentários recebidos", tom: "principal" },
            { icone: <CheckCircle2 />, titulo: "Válidos", valor: estatisticas.validos, detalhe: "compra", tom: "sucesso" },
            { icone: <Edit3 />, titulo: "Revisão", valor: estatisticas.revisao, detalhe: "manual", tom: estatisticas.revisao ? "atencao" : "neutro" },
            { icone: <XCircle />, titulo: "Ignorados", valor: estatisticas.ignorados, detalhe: "sem compra" }
          ]}
        />
      </section>

      <Card>
        <CardContent className="grid gap-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input aria-label="Buscar comentários" className="pl-9" style={{ paddingLeft: "2.25rem" }} placeholder="Buscar comentário..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger aria-label="Filtrar comentários por estado" className="w-full lg:w-64">
              <SelectValue placeholder="Operacionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operacionais">Operacionais</SelectItem>
              <SelectItem value="todos">Todos incluindo ignorados</SelectItem>
              <SelectItem value="RECEBIDO">Recebido</SelectItem>
              <SelectItem value="PROCESSADO">Processado</SelectItem>
              <SelectItem value="REVISAO_MANUAL">Em revisão</SelectItem>
              <SelectItem value="IGNORADO">Ignorado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => void carregar({ silencioso: false })}
            title="Atualizar"
            aria-label="Atualizar comentários"
            disabled={carregandoComentarios}
          >
            <RefreshCcw size={18} className={carregandoComentarios ? "animate-spin" : undefined} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={limpandoDados}
              >
                <Trash2 size={16} />
                Limpar dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar comentários e mensagens?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação remove comentários capturados, mensagens de atendimento associadas e estados de envio usados nos testes. Usa apenas quando precisares reiniciar a operação de teste.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => void limparDadosOperacionais()}
                  disabled={limpandoDados}
                >
                  <Trash2 size={16} />
                  Limpar dados
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="comentarios-commerce-list grid gap-3">
          {comentariosFiltrados.length ? (
            comentariosFiltrados.map((c) => (
              <Card key={c.id} className="bg-muted/20">
                <CardContent className="grid gap-4 p-4 lg:grid-cols-[auto_1fr_auto]">
                <Avatar className="h-10 w-10">
                  {c.comentario.avatarUrl && <AvatarImage src={c.comentario.avatarUrl} alt="" />}
                  <AvatarFallback>{obterIniciais(c.comentario.displayName || c.comentario.username)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{c.comentario.displayName || c.comentario.username}</strong>
                    <span className="text-sm text-muted-foreground">@{c.comentario.username}</span>
                  </div>
                  <p className="mt-2 leading-6">{c.comentario.commentText}</p>
                  {c.motivo && <p className="mt-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">{c.motivo}</p>}
                  {c.interpretacao?.reasons?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.interpretacao.reasons.map((motivo) => (
                        <Badge key={motivo} variant="outline">{motivo}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {c.estado === "REVISAO_MANUAL" && comentarioEmRevisao === c.id && (
                    <form className="mt-4 grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-2" onSubmit={(e) => void aprovarComentario(e, c)}>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor={`telefone-${c.id}`}>Telefone</label>
                        <Input
                          id={`telefone-${c.id}`}
                          value={formRevisao.telefone}
                          onChange={(e) => setFormRevisao({ ...formRevisao, telefone: e.target.value })}
                          placeholder="923456789"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor={`peca-${c.id}`}>Código da peça</label>
                        <Input
                          id={`peca-${c.id}`}
                          value={formRevisao.codigoPeca}
                          onChange={(e) => setFormRevisao({ ...formRevisao, codigoPeca: e.target.value })}
                          placeholder="A01"
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium" htmlFor={`obs-${c.id}`}>Observação</label>
                        <Input
                          id={`obs-${c.id}`}
                          value={formRevisao.observacao}
                          onChange={(e) => setFormRevisao({ ...formRevisao, observacao: e.target.value })}
                          placeholder="Correção feita durante a live"
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-sm font-medium" htmlFor={`motivo-${c.id}`}>Motivo da rejeição</label>
                        <Input
                          id={`motivo-${c.id}`}
                          value={formRevisao.motivoRejeicao}
                          onChange={(e) => setFormRevisao({ ...formRevisao, motivoRejeicao: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">
                        <Button size="lg" disabled={salvandoRevisao || !formRevisao.telefone || !formRevisao.codigoPeca}>
                          <CheckCircle2 size={18} />
                          Aprovar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="lg"
                          disabled={salvandoRevisao || formRevisao.motivoRejeicao.trim().length < 3}
                          onClick={() => void rejeitarComentario(c)}
                        >
                          <XCircle size={18} />
                          Rejeitar
                        </Button>
                        <Button type="button" variant="outline" size="lg" onClick={() => setComentarioEmRevisao(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="grid content-start gap-2 lg:justify-items-end">
                  <Badge variant={obterVarianteComentario(c.estado)}>
                    {traduzirEstadoComentario(c.estado)}
                  </Badge>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Badge variant="outline">{formatarConfianca(c.interpretacao?.confidence)}</Badge>
                    <Badge variant="outline">Tel. {c.interpretacao?.phone ?? "—"}</Badge>
                    <Badge variant="outline">Peça #{c.interpretacao?.productCode ?? "?"}</Badge>
                  </div>
                  {c.estado === "REVISAO_MANUAL" && (
                    <Button variant="outline" size="icon-lg" onClick={() => abrirRevisao(c)} title="Corrigir comentário" aria-label="Corrigir comentário">
                      <Edit3 size={16} />
                    </Button>
                  )}
                </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EstadoVazio
              icone={<MessageSquareText />}
              titulo="Sem comentários"
              detalhe={
                comentariosOcultos
                  ? `${comentariosOcultos} ignorados ocultos no filtro operacional.`
                  : "Conecte uma live ou envie um comentário manual para testar."
              }
            />
          )}
        </div>
        </CardContent>
      </Card>

      {mensagem && <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>}
    </>
  );
}

function obterVarianteComentario(estado: ComentarioRecebido["estado"]): "success" | "warning" | "secondary" | "info" {
  if (estado === "PROCESSADO") return "success";
  if (estado === "REVISAO_MANUAL" || estado === "RECEBIDO") return "warning";
  if (estado === "IGNORADO") return "secondary";
  return "info";
}
