"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Grid3x3,
  List,
  Search,
  Filter,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Evento {
  id: string
  titulo: string
  descricao?: string
  inicio: Date
  fim: Date
  cor: string
  categoria?: string
  participantes?: string[]
  etiquetas?: string[]
  estado?: string
  clienteId?: string | null
  clienteNome?: string | null
  conversaId?: string | null
  pedidoId?: string | null
  responsavelId?: string | null
}

type ResultadoEvento = void | Promise<void>

export interface GestorEventosProps {
  eventos?: Evento[]
  aocriarEvento?: (evento: Omit<Evento, "id">) => ResultadoEvento
  aoCriarEvento?: (evento: Omit<Evento, "id">) => ResultadoEvento
  aoActualizarEvento?: (id: string, evento: Partial<Evento>) => ResultadoEvento
  aoEliminarEvento?: (id: string) => ResultadoEvento
  aoConcluirEvento?: (id: string) => ResultadoEvento
  renderizarAcoesCrm?: (evento: Evento) => React.ReactNode
  categorias?: string[]
  cores?: { nome: string; valor: string; bg: string; texto: string }[]
  vistaInicial?: "mes" | "semana" | "dia" | "lista"
  className?: string
  etiquetasDisponiveis?: string[]
}

/* ── CRM colour palette ── */
const coresPadrao: GestorEventosProps["cores"] = [
  { nome: "Follow-up",  valor: "followup",  bg: "bg-[#6366F1]", texto: "text-[#6366F1]" },
  { nome: "Cobrança",   valor: "cobranca",  bg: "bg-[#F59E0B]", texto: "text-[#F59E0B]" },
  { nome: "Entrega",    valor: "entrega",   bg: "bg-[#10B981]", texto: "text-[#10B981]" },
  { nome: "Callback",   valor: "callback",  bg: "bg-[#8B5CF6]", texto: "text-[#8B5CF6]" },
  { nome: "Reunião",    valor: "reuniao",   bg: "bg-[#EC4899]", texto: "text-[#EC4899]" },
  { nome: "Outro",      valor: "outro",     bg: "bg-[#78716C]", texto: "text-[#78716C]" },
]

export function GestorEventos(props: GestorEventosProps) {
  const {
    eventos: eventosIniciais = [],
    aocriarEvento,
    aoCriarEvento,
    aoActualizarEvento,
    aoEliminarEvento,
    aoConcluirEvento,
    renderizarAcoesCrm,
    categorias = ["Follow-up", "Cobrança", "Entrega", "Callback", "Reunião", "Outro"],
    cores = coresPadrao!,
    vistaInicial = "mes",
    className,
    etiquetasDisponiveis = ["Urgente", "VIP", "Recorrente", "WhatsApp", "Telefone", "Presencial"],
  } = props
  const eventosControlados = props.eventos !== undefined
  const criarEventoExterno = aoCriarEvento ?? aocriarEvento
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciais)
  const [dataAtual, setDataAtual] = useState(new Date())
  const [vista, setVista] = useState<"mes" | "semana" | "dia" | "lista">(vistaInicial)
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [criando, setCriando] = useState(false)
  const [submetendo, setSubmetendo] = useState(false)
  const [erroDialogo, setErroDialogo] = useState("")
  const [eventoArrastado, setEventoArrastado] = useState<Evento | null>(null)
  const [novoEvento, setNovoEvento] = useState<Partial<Evento>>({
    titulo: "",
    descricao: "",
    cor: cores[0].valor,
    categoria: categorias[0],
    etiquetas: [],
  })

  const [termoBusca, setTermoBusca] = useState("")
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([])
  const [etiquetasSelecionadas, setEtiquetasSelecionadas] = useState<string[]>([])
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([])

  useEffect(() => {
    if (eventosControlados) setEventos(eventosIniciais)
  }, [eventosControlados, eventosIniciais])

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      if (termoBusca) {
        const q = termoBusca.toLowerCase()
        const coincide =
          evento.titulo.toLowerCase().includes(q) ||
          evento.descricao?.toLowerCase().includes(q) ||
          evento.categoria?.toLowerCase().includes(q) ||
          evento.etiquetas?.some((e) => e.toLowerCase().includes(q))
        if (!coincide) return false
      }
      if (coresSelecionadas.length > 0 && !coresSelecionadas.includes(evento.cor)) return false
      if (etiquetasSelecionadas.length > 0) {
        if (!evento.etiquetas?.some((e) => etiquetasSelecionadas.includes(e))) return false
      }
      if (categoriasSelecionadas.length > 0 && evento.categoria && !categoriasSelecionadas.includes(evento.categoria))
        return false
      return true
    })
  }, [eventos, termoBusca, coresSelecionadas, etiquetasSelecionadas, categoriasSelecionadas])

  const temFiltrosActivos = coresSelecionadas.length > 0 || etiquetasSelecionadas.length > 0 || categoriasSelecionadas.length > 0

  const limparFiltros = () => {
    setCoresSelecionadas([])
    setEtiquetasSelecionadas([])
    setCategoriasSelecionadas([])
    setTermoBusca("")
  }

  const abrirNovoEvento = () => {
    const inicio = new Date()
    inicio.setMinutes(Math.ceil(inicio.getMinutes() / 15) * 15, 0, 0)
    const fim = new Date(inicio.getTime() + 30 * 60_000)
    setNovoEvento({
      titulo: "",
      descricao: "",
      inicio,
      fim,
      cor: cores[0].valor,
      categoria: categorias[0],
      etiquetas: [],
    })
    setErroDialogo("")
    setCriando(true)
    setDialogoAberto(true)
  }

  const criarEvento = useCallback(async () => {
    if (!novoEvento.titulo || !novoEvento.inicio || !novoEvento.fim) return
    const evento: Evento = {
      id: Math.random().toString(36).substr(2, 9),
      titulo: novoEvento.titulo,
      descricao: novoEvento.descricao,
      inicio: novoEvento.inicio,
      fim: novoEvento.fim,
      cor: novoEvento.cor || cores[0].valor,
      categoria: novoEvento.categoria,
      participantes: novoEvento.participantes,
      etiquetas: novoEvento.etiquetas || [],
    }
    setSubmetendo(true)
    setErroDialogo("")
    try {
      await criarEventoExterno?.(evento)
      if (!eventosControlados) setEventos((prev) => [...prev, evento])
      setDialogoAberto(false)
      setCriando(false)
      setNovoEvento({ titulo: "", descricao: "", cor: cores[0].valor, categoria: categorias[0], etiquetas: [] })
    } catch (erro) {
      setErroDialogo(erro instanceof Error ? erro.message : "Não foi possível guardar o lembrete.")
    } finally {
      setSubmetendo(false)
    }
  }, [novoEvento, cores, categorias, criarEventoExterno, eventosControlados])

  const actualizarEvento = useCallback(async () => {
    if (!eventoSelecionado) return
    setSubmetendo(true)
    setErroDialogo("")
    try {
      await aoActualizarEvento?.(eventoSelecionado.id, eventoSelecionado)
      if (!eventosControlados) setEventos((prev) => prev.map((e) => (e.id === eventoSelecionado.id ? eventoSelecionado : e)))
      setDialogoAberto(false)
      setEventoSelecionado(null)
    } catch (erro) {
      setErroDialogo(erro instanceof Error ? erro.message : "Não foi possível atualizar o lembrete.")
    } finally {
      setSubmetendo(false)
    }
  }, [eventoSelecionado, aoActualizarEvento, eventosControlados])

  const eliminarEvento = useCallback(
    async (id: string) => {
      setSubmetendo(true)
      setErroDialogo("")
      try {
        await aoEliminarEvento?.(id)
        if (!eventosControlados) setEventos((prev) => prev.filter((e) => e.id !== id))
        setDialogoAberto(false)
        setEventoSelecionado(null)
      } catch (erro) {
        setErroDialogo(erro instanceof Error ? erro.message : "Não foi possível cancelar o lembrete.")
      } finally {
        setSubmetendo(false)
      }
    },
    [aoEliminarEvento, eventosControlados],
  )

  const concluirEvento = useCallback(
    async (id: string) => {
      setSubmetendo(true)
      setErroDialogo("")
      try {
        await aoConcluirEvento?.(id)
        if (!eventosControlados) setEventos((prev) => prev.filter((e) => e.id !== id))
        setDialogoAberto(false)
        setEventoSelecionado(null)
      } catch (erro) {
        setErroDialogo(erro instanceof Error ? erro.message : "Não foi possível concluir o lembrete.")
      } finally {
        setSubmetendo(false)
      }
    },
    [aoConcluirEvento, eventosControlados],
  )

  const iniciarArrasto = useCallback((evento: Evento) => { setEventoArrastado(evento) }, [])
  const terminarArrasto = useCallback(() => { setEventoArrastado(null) }, [])

  const largarEvento = useCallback(
    (data: Date, hora?: number) => {
      if (!eventoArrastado) return
      const duracao = eventoArrastado.fim.getTime() - eventoArrastado.inicio.getTime()
      const novoInicio = new Date(data)
      if (hora !== undefined) novoInicio.setHours(hora, 0, 0, 0)
      const novoFim = new Date(novoInicio.getTime() + duracao)
      const actualizado = { ...eventoArrastado, inicio: novoInicio, fim: novoFim }
      void (async () => {
        try {
          await aoActualizarEvento?.(eventoArrastado.id, actualizado)
          if (!eventosControlados) setEventos((prev) => prev.map((e) => (e.id === eventoArrastado.id ? actualizado : e)))
        } finally {
          setEventoArrastado(null)
        }
      })()
    },
    [eventoArrastado, aoActualizarEvento, eventosControlados],
  )

  const navegarData = useCallback(
    (dir: "prev" | "next") => {
      setDataAtual((prev) => {
        const d = new Date(prev)
        if (vista === "mes") d.setMonth(prev.getMonth() + (dir === "next" ? 1 : -1))
        else if (vista === "semana") d.setDate(prev.getDate() + (dir === "next" ? 7 : -7))
        else if (vista === "dia") d.setDate(prev.getDate() + (dir === "next" ? 1 : -1))
        return d
      })
    },
    [vista],
  )

  const obterClassesCor = useCallback(
    (valor: string) => {
      return cores.find((c) => c.valor === valor) || cores[0]
    },
    [cores],
  )

  const alternarEtiqueta = (etiqueta: string, estaCriando: boolean) => {
    if (estaCriando) {
      setNovoEvento((prev) => ({
        ...prev,
        etiquetas: prev.etiquetas?.includes(etiqueta) ? prev.etiquetas.filter((e) => e !== etiqueta) : [...(prev.etiquetas || []), etiqueta],
      }))
    } else {
      setEventoSelecionado((prev) =>
        prev ? { ...prev, etiquetas: prev.etiquetas?.includes(etiqueta) ? prev.etiquetas.filter((e) => e !== etiqueta) : [...(prev.etiquetas || []), etiqueta] } : null,
      )
    }
  }

  /* ── Titulo do cabeçalho ── */
  const tituloVista = () => {
    if (vista === "mes") return dataAtual.toLocaleDateString("pt-AO", { month: "long", year: "numeric" })
    if (vista === "semana") return `Semana de ${dataAtual.toLocaleDateString("pt-AO", { month: "short", day: "numeric" })}`
    if (vista === "dia") return dataAtual.toLocaleDateString("pt-AO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    return "Todos os eventos"
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-bold capitalize sm:text-2xl" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.025em" }}>
            {tituloVista()}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navegarData("prev")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDataAtual(new Date())}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={() => navegarData("next")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select */}
          <div className="sm:hidden">
            <Select value={vista} onValueChange={(v) => setVista(v as typeof vista)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mes"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Mês</div></SelectItem>
                <SelectItem value="semana"><div className="flex items-center gap-2"><Grid3x3 className="h-4 w-4" />Semana</div></SelectItem>
                <SelectItem value="dia"><div className="flex items-center gap-2"><Clock className="h-4 w-4" />Dia</div></SelectItem>
                <SelectItem value="lista"><div className="flex items-center gap-2"><List className="h-4 w-4" />Lista</div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            {([["mes", Calendar, "Mês"], ["semana", Grid3x3, "Semana"], ["dia", Clock, "Dia"], ["lista", List, "Lista"]] as const).map(([v, Icone, rotulo]) => (
              <Button key={v} variant={vista === v ? "secondary" : "ghost"} size="sm" onClick={() => setVista(v as typeof vista)} className="h-8">
                <Icone className="h-4 w-4" /><span className="ml-1">{rotulo}</span>
              </Button>
            ))}
          </div>

          <Button onClick={abrirNovoEvento} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />Novo lembrete
          </Button>
        </div>
      </div>

      {/* ── Busca e filtros ── */}
      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar lembretes..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="pl-9" style={{ paddingLeft: "2.25rem" }} />
          {termoBusca && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2" onClick={() => setTermoBusca("")}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FiltroDropdown rotulo="Tipo" itens={cores.map((c) => ({ chave: c.valor, rotulo: c.nome, elemento: <div className="flex items-center gap-2"><div className={cn("h-3 w-3 rounded", c.bg)} />{c.nome}</div> }))} selecionados={coresSelecionadas} aoAlterar={setCoresSelecionadas} />
          <FiltroDropdown rotulo="Etiquetas" itens={etiquetasDisponiveis.map((e) => ({ chave: e, rotulo: e }))} selecionados={etiquetasSelecionadas} aoAlterar={setEtiquetasSelecionadas} />
          <FiltroDropdown rotulo="Categorias" itens={categorias.map((c) => ({ chave: c, rotulo: c }))} selecionados={categoriasSelecionadas} aoAlterar={setCategoriasSelecionadas} />
          {temFiltrosActivos && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-2 shrink-0">
              <X className="h-4 w-4" />Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros activos */}
      {temFiltrosActivos && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          {coresSelecionadas.map((v) => {
            const c = obterClassesCor(v)
            return (
              <Badge key={v} variant="secondary" className="gap-1">
                <div className={cn("h-2 w-2 rounded-full", c.bg)} />{c.nome}
                <button type="button" onClick={() => setCoresSelecionadas((p) => p.filter((x) => x !== v))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button>
              </Badge>
            )
          })}
          {etiquetasSelecionadas.map((e) => (
            <Badge key={e} variant="secondary" className="gap-1">{e}<button type="button" onClick={() => setEtiquetasSelecionadas((p) => p.filter((x) => x !== e))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button></Badge>
          ))}
          {categoriasSelecionadas.map((c) => (
            <Badge key={c} variant="secondary" className="gap-1">{c}<button type="button" onClick={() => setCategoriasSelecionadas((p) => p.filter((x) => x !== c))} className="ml-1 hover:text-foreground"><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
      )}

      {/* ── Vistas ── */}
      {vista === "mes" && <VistaMes dataAtual={dataAtual} eventos={eventosFiltrados} aoClicar={(e) => { setEventoSelecionado(e); setDialogoAberto(true) }} aoIniciarArrasto={iniciarArrasto} aoTerminarArrasto={terminarArrasto} aoLargar={largarEvento} obterCor={obterClassesCor} />}
      {vista === "semana" && <VistaSemana dataAtual={dataAtual} eventos={eventosFiltrados} aoClicar={(e) => { setEventoSelecionado(e); setDialogoAberto(true) }} aoIniciarArrasto={iniciarArrasto} aoTerminarArrasto={terminarArrasto} aoLargar={largarEvento} obterCor={obterClassesCor} />}
      {vista === "dia" && <VistaDia dataAtual={dataAtual} eventos={eventosFiltrados} aoClicar={(e) => { setEventoSelecionado(e); setDialogoAberto(true) }} aoIniciarArrasto={iniciarArrasto} aoTerminarArrasto={terminarArrasto} aoLargar={largarEvento} obterCor={obterClassesCor} />}
      {vista === "lista" && <VistaLista eventos={eventosFiltrados} aoClicar={(e) => { setEventoSelecionado(e); setDialogoAberto(true) }} obterCor={obterClassesCor} />}

      {/* ── Dialogo criar/editar ── */}
      <Dialog
        open={dialogoAberto}
        onOpenChange={(aberto) => {
          setDialogoAberto(aberto)
          if (!aberto) {
            setErroDialogo("")
            setCriando(false)
            setEventoSelecionado(null)
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>{criando ? "Novo lembrete" : "Detalhes do lembrete"}</DialogTitle>
            <DialogDescription>{criando ? "Adicione um novo lembrete à agenda" : "Ver e editar detalhes"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" value={criando ? novoEvento.titulo : eventoSelecionado?.titulo} onChange={(e) => criando ? setNovoEvento((p) => ({ ...p, titulo: e.target.value })) : setEventoSelecionado((p) => p ? { ...p, titulo: e.target.value } : null)} placeholder="Título do lembrete" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Observação</Label>
              <Textarea id="descricao" value={criando ? novoEvento.descricao : eventoSelecionado?.descricao} onChange={(e) => criando ? setNovoEvento((p) => ({ ...p, descricao: e.target.value })) : setEventoSelecionado((p) => p ? { ...p, descricao: e.target.value } : null)} placeholder="Observação" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Início</Label>
                <Input id="inicio" type="datetime-local" value={formatarDatetimeLocal(criando ? novoEvento.inicio : eventoSelecionado?.inicio)} onChange={(e) => { const d = new Date(e.target.value); criando ? setNovoEvento((p) => ({ ...p, inicio: d })) : setEventoSelecionado((p) => p ? { ...p, inicio: d } : null) }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Fim</Label>
                <Input id="fim" type="datetime-local" value={formatarDatetimeLocal(criando ? novoEvento.fim : eventoSelecionado?.fim)} onChange={(e) => { const d = new Date(e.target.value); criando ? setNovoEvento((p) => ({ ...p, fim: d })) : setEventoSelecionado((p) => p ? { ...p, fim: d } : null) }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={criando ? novoEvento.categoria : eventoSelecionado?.categoria} onValueChange={(v) => criando ? setNovoEvento((p) => ({ ...p, categoria: v })) : setEventoSelecionado((p) => p ? { ...p, categoria: v } : null)}>
                  <SelectTrigger id="categoria"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Tipo</Label>
                <Select value={criando ? novoEvento.cor : eventoSelecionado?.cor} onValueChange={(v) => criando ? setNovoEvento((p) => ({ ...p, cor: v })) : setEventoSelecionado((p) => p ? { ...p, cor: v } : null)}>
                  <SelectTrigger id="cor"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {cores.map((c) => (
                      <SelectItem key={c.valor} value={c.valor}>
                        <div className="flex items-center gap-2"><div className={cn("h-4 w-4 rounded", c.bg)} />{c.nome}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Etiquetas</Label>
              <div className="flex flex-wrap gap-2">
                {etiquetasDisponiveis.map((etiqueta) => {
                  const sel = criando ? novoEvento.etiquetas?.includes(etiqueta) : eventoSelecionado?.etiquetas?.includes(etiqueta)
                  return <Badge key={etiqueta} variant={sel ? "default" : "outline"} className="cursor-pointer transition-all hover:scale-105" onClick={() => alternarEtiqueta(etiqueta, criando)}>{etiqueta}</Badge>
                })}
              </div>
            </div>

            {!criando && eventoSelecionado && renderizarAcoesCrm && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Atalhos CRM</p>
                {renderizarAcoesCrm(eventoSelecionado)}
              </div>
            )}

            {erroDialogo && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erroDialogo}
              </div>
            )}
          </div>

          <DialogFooter>
            {!criando && eventoSelecionado && aoConcluirEvento && (
              <Button variant="secondary" disabled={submetendo} onClick={() => void concluirEvento(eventoSelecionado.id)}>Concluir</Button>
            )}
            {!criando && (
              <Button variant="destructive" disabled={submetendo} onClick={() => eventoSelecionado && void eliminarEvento(eventoSelecionado.id)}>Cancelar lembrete</Button>
            )}
            <Button variant="outline" disabled={submetendo} onClick={() => { setDialogoAberto(false); setCriando(false); setEventoSelecionado(null) }}>Fechar</Button>
            <Button disabled={submetendo} onClick={criando ? () => void criarEvento() : () => void actualizarEvento()}>{criando ? "Criar" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   Utilitários
   ════════════════════════════════════════════════════ */

function formatarDatetimeLocal(d?: Date): string {
  if (!d) return ""
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatarHora(d: Date) {
  return d.toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })
}

function duracaoTexto(inicio: Date, fim: Date) {
  const diff = fim.getTime() - inicio.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

/* ── FiltroDropdown reutilizável ── */
function FiltroDropdown({ rotulo, itens, selecionados, aoAlterar }: {
  rotulo: string
  itens: { chave: string; rotulo: string; elemento?: React.ReactNode }[]
  selecionados: string[]
  aoAlterar: React.Dispatch<React.SetStateAction<string[]>>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap shrink-0 bg-transparent">
          <Filter className="h-4 w-4" />{rotulo}
          {selecionados.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{selecionados.length}</Badge>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Filtrar por {rotulo.toLowerCase()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {itens.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.chave}
            checked={selecionados.includes(item.chave)}
            onCheckedChange={(checked) => aoAlterar((prev) => checked ? [...prev, item.chave] : prev.filter((x) => x !== item.chave))}
          >
            {item.elemento ?? item.rotulo}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ════════════════════════════════════════════════════
   CartaoEvento — com hover tooltip
   ════════════════════════════════════════════════════ */

function CartaoEvento({ evento, aoClicar, aoIniciarArrasto, aoTerminarArrasto, obterCor, variante = "padrao" }: {
  evento: Evento
  aoClicar: (e: Evento) => void
  aoIniciarArrasto: (e: Evento) => void
  aoTerminarArrasto: () => void
  obterCor: (cor: string) => { bg: string; texto: string; nome: string }
  variante?: "padrao" | "compacto" | "detalhado"
}) {
  const [hover, setHover] = useState(false)
  const cls = obterCor(evento.cor)

  if (variante === "compacto") {
    return (
      <div draggable onDragStart={() => aoIniciarArrasto(evento)} onDragEnd={aoTerminarArrasto} onClick={() => aoClicar(evento)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="relative cursor-pointer">
        <div className={cn("rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-200 text-white truncate", cls.bg, hover && "scale-105 shadow-lg z-10")}>{evento.titulo}</div>
        {hover && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{evento.titulo}</h4>
                  <div className={cn("h-3 w-3 rounded-full shrink-0", cls.bg)} />
                </div>
                {evento.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{evento.descricao}</p>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatarHora(evento.inicio)} - {formatarHora(evento.fim)}</span>
                  <span className="text-[10px]">({duracaoTexto(evento.inicio, evento.fim)})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {evento.categoria && <Badge variant="secondary" className="text-[10px] h-5">{evento.categoria}</Badge>}
                  {evento.etiquetas?.map((e) => <Badge key={e} variant="outline" className="text-[10px] h-5">{e}</Badge>)}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variante === "detalhado") {
    return (
      <div draggable onDragStart={() => aoIniciarArrasto(evento)} onDragEnd={aoTerminarArrasto} onClick={() => aoClicar(evento)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        className={cn("cursor-pointer rounded-lg p-3 transition-all duration-200 text-white", cls.bg, hover && "scale-[1.02] shadow-2xl ring-2 ring-white/50")}>
        <div className="font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{evento.titulo}</div>
        {evento.descricao && <div className="mt-1 text-sm opacity-90 line-clamp-2">{evento.descricao}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />{formatarHora(evento.inicio)} - {formatarHora(evento.fim)}
        </div>
        {hover && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {evento.categoria && <Badge variant="secondary" className="text-xs">{evento.categoria}</Badge>}
            {evento.etiquetas?.map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
          </div>
        )}
      </div>
    )
  }

  /* padrao */
  return (
    <div draggable onDragStart={() => aoIniciarArrasto(evento)} onDragEnd={aoTerminarArrasto} onClick={() => aoClicar(evento)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className="relative">
      <div className={cn("cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-200 text-white", cls.bg, hover && "scale-105 shadow-lg z-10")}>
        <div className="truncate">{evento.titulo}</div>
      </div>
      {hover && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{evento.titulo}</h4>
                <div className={cn("h-4 w-4 rounded-full shrink-0", cls.bg)} />
              </div>
              {evento.descricao && <p className="text-sm text-muted-foreground">{evento.descricao}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatarHora(evento.inicio)} - {formatarHora(evento.fim)}</span>
                <span className="text-[10px]">({duracaoTexto(evento.inicio, evento.fim)})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {evento.categoria && <Badge variant="secondary" className="text-xs">{evento.categoria}</Badge>}
                {evento.etiquetas?.map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   Vista Mês
   ════════════════════════════════════════════════════ */

type VistaProps = {
  dataAtual: Date
  eventos: Evento[]
  aoClicar: (e: Evento) => void
  aoIniciarArrasto: (e: Evento) => void
  aoTerminarArrasto: () => void
  aoLargar: (d: Date, h?: number) => void
  obterCor: (c: string) => { bg: string; texto: string; nome: string }
}

const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function VistaMes({ dataAtual, eventos, aoClicar, aoIniciarArrasto, aoTerminarArrasto, aoLargar, obterCor }: VistaProps) {
  const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1)
  const inicio = new Date(primeiroDia)
  inicio.setDate(inicio.getDate() - inicio.getDay())
  const dias: Date[] = []
  const cursor = new Date(inicio)
  for (let i = 0; i < 42; i++) { dias.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1) }

  const eventosDia = (d: Date) => eventos.filter((e) => {
    const ed = new Date(e.inicio)
    return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
  })

  return (
    <Card className="agenda-cal-card overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {DIAS_SEMANA_CURTO.map((d) => (
          <div key={d} className="border-r p-2 text-center text-xs font-semibold last:border-r-0 sm:text-sm" style={{ fontFamily: "var(--font-heading)", letterSpacing: "0.03em" }}>
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia, i) => {
          const evts = eventosDia(dia)
          const mesAtual = dia.getMonth() === dataAtual.getMonth()
          const hoje = dia.toDateString() === new Date().toDateString()
          return (
            <div key={i} className={cn("min-h-20 border-b border-r p-1 transition-colors last:border-r-0 sm:min-h-24 sm:p-2", !mesAtual && "bg-muted/30", "hover:bg-accent/50")} onDragOver={(e) => e.preventDefault()} onDrop={() => aoLargar(dia)}>
              <div className={cn("mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm", hoje && "bg-primary text-primary-foreground font-semibold")}>{dia.getDate()}</div>
              <div className="space-y-1">
                {evts.slice(0, 3).map((e) => <CartaoEvento key={e.id} evento={e} aoClicar={aoClicar} aoIniciarArrasto={aoIniciarArrasto} aoTerminarArrasto={aoTerminarArrasto} obterCor={obterCor} variante="compacto" />)}
                {evts.length > 3 && <div className="text-[10px] text-muted-foreground sm:text-xs">+{evts.length - 3} mais</div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ════════════════════════════════════════════════════
   Vista Semana
   ════════════════════════════════════════════════════ */

function VistaSemana({ dataAtual, eventos, aoClicar, aoIniciarArrasto, aoTerminarArrasto, aoLargar, obterCor }: VistaProps) {
  const inicioSemana = new Date(dataAtual)
  inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay())
  const diasSemana = Array.from({ length: 7 }, (_, i) => { const d = new Date(inicioSemana); d.setDate(inicioSemana.getDate() + i); return d })
  const horas = Array.from({ length: 24 }, (_, i) => i)

  const eventosHora = (d: Date, h: number) => eventos.filter((e) => {
    const ed = new Date(e.inicio)
    return ed.getDate() === d.getDate() && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() && ed.getHours() === h
  })

  return (
    <Card className="agenda-cal-card overflow-auto max-h-[70vh]">
      <div className="grid grid-cols-8 border-b sticky top-0 bg-card z-10">
        <div className="border-r p-2 text-center text-xs font-semibold sm:text-sm" style={{ fontFamily: "var(--font-heading)" }}>Hora</div>
        {diasSemana.map((d) => (
          <div key={d.toISOString()} className="border-r p-2 text-center text-xs font-semibold last:border-r-0 sm:text-sm" style={{ fontFamily: "var(--font-heading)" }}>
            <div className="hidden sm:block">{d.toLocaleDateString("pt-AO", { weekday: "short" })}</div>
            <div className="sm:hidden">{d.toLocaleDateString("pt-AO", { weekday: "narrow" })}</div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">{d.toLocaleDateString("pt-AO", { day: "numeric", month: "short" })}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {horas.map((h) => (
          <div key={h} className="contents">
            <div className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs tabular-nums">{String(h).padStart(2, "0")}:00</div>
            {diasSemana.map((d) => {
              const evts = eventosHora(d, h)
              return (
                <div key={`${d.toISOString()}-${h}`} className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1" onDragOver={(e) => e.preventDefault()} onDrop={() => aoLargar(d, h)}>
                  <div className="space-y-1">{evts.map((e) => <CartaoEvento key={e.id} evento={e} aoClicar={aoClicar} aoIniciarArrasto={aoIniciarArrasto} aoTerminarArrasto={aoTerminarArrasto} obterCor={obterCor} />)}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ════════════════════════════════════════════════════
   Vista Dia
   ════════════════════════════════════════════════════ */

function VistaDia({ dataAtual, eventos, aoClicar, aoIniciarArrasto, aoTerminarArrasto, aoLargar, obterCor }: VistaProps) {
  const horas = Array.from({ length: 24 }, (_, i) => i)
  const eventosHora = (h: number) => eventos.filter((e) => {
    const ed = new Date(e.inicio)
    return ed.getDate() === dataAtual.getDate() && ed.getMonth() === dataAtual.getMonth() && ed.getFullYear() === dataAtual.getFullYear() && ed.getHours() === h
  })

  return (
    <Card className="agenda-cal-card overflow-auto max-h-[70vh]">
      {horas.map((h) => {
        const evts = eventosHora(h)
        return (
          <div key={h} className="flex border-b last:border-b-0" onDragOver={(e) => e.preventDefault()} onDrop={() => aoLargar(dataAtual, h)}>
            <div className="w-14 shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm tabular-nums">{String(h).padStart(2, "0")}:00</div>
            <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2">
              <div className="space-y-2">{evts.map((e) => <CartaoEvento key={e.id} evento={e} aoClicar={aoClicar} aoIniciarArrasto={aoIniciarArrasto} aoTerminarArrasto={aoTerminarArrasto} obterCor={obterCor} variante="detalhado" />)}</div>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

/* ════════════════════════════════════════════════════
   Vista Lista
   ════════════════════════════════════════════════════ */

function VistaLista({ eventos, aoClicar, obterCor }: { eventos: Evento[]; aoClicar: (e: Evento) => void; obterCor: (c: string) => { bg: string; texto: string; nome: string } }) {
  const ordenados = [...eventos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime())

  if (!ordenados.length) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Sem lembretes</h3>
        <p className="text-xs text-muted-foreground mt-1">Crie lembretes de follow-up, cobrança ou entrega.</p>
      </Card>
    )
  }

  return (
    <Card className="divide-y">
      {ordenados.map((e) => {
        const cls = obterCor(e.cor)
        return (
          <div key={e.id} className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/50 sm:p-4" onClick={() => aoClicar(e)}>
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", cls.bg)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>{e.titulo}</p>
              <p className="text-xs text-muted-foreground truncate">{e.descricao || e.categoria}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>{formatarHora(e.inicio)}</p>
              <p className="text-[10px] text-muted-foreground">{e.inicio.toLocaleDateString("pt-AO", { day: "numeric", month: "short" })}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              {e.categoria && <Badge variant="secondary" className="text-[0.6rem]">{e.categoria}</Badge>}
              {e.etiquetas?.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="text-[0.6rem]">{t}</Badge>)}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
