import { AlertTriangle, BookOpenCheck, CircleDollarSign, ClipboardCheck, FileClock, RefreshCcw, ShieldCheck, UsersRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { CrmPageMotion } from "../../../componentes/CrmInterno21st";
import { BotaoBizy, KpiCard, KpiGrid, PageHead, PanelCard, StatusBadge } from "../../../componentes/BizyDesignSystem";
import { criarTarefaProgramaLearning, executarAutomacoesLearning, obterPortalProdutorLearning, publicarVersaoLearning, type PortalProdutorLearning } from "../api";
import { formatarKwanza } from "../../../utilidades";

export function PaginaPortalProdutorLearning() {
  const [dados, setDados] = useState<PortalProdutorLearning | null>(null);
  const [erro, setErro] = useState("");
  const [acao, setAcao] = useState("");
  const [programaSlug, setProgramaSlug] = useState("");
  const [versao, setVersao] = useState({ releaseNotes: "", impacto: "ATUALIZAR_SEM_INVALIDAR" });
  const [tarefa, setTarefa] = useState({ titulo: "", instrucoes: "", prazoAte: "" });

  async function carregar() {
    setErro("");
    try {
      const resposta = await obterPortalProdutorLearning();
      setDados(resposta);
      setProgramaSlug((actual) => actual || resposta.produtos[0]?.slug || "");
    } catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o portal do produtor."); }
  }
  useEffect(() => { void carregar(); }, []);

  async function executar(nome: string, trabalho: () => Promise<unknown>) {
    setAcao(nome); setErro("");
    try { await trabalho(); await carregar(); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : "Não foi possível concluir a acção."); }
    finally { setAcao(""); }
  }

  function criarVersao(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!programaSlug || !versao.releaseNotes.trim()) return;
    void executar("versao", () => publicarVersaoLearning(programaSlug, versao));
  }
  function criarTarefa(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!programaSlug || !tarefa.titulo.trim() || !tarefa.instrucoes.trim()) return;
    void executar("tarefa", () => criarTarefaProgramaLearning(programaSlug, { ...tarefa, prazoAte: tarefa.prazoAte ? new Date(`${tarefa.prazoAte}T23:59:59`).toISOString() : null }));
  }

  return <CrmPageMotion><div className="p-4 sm:p-6">
    <PageHead eyebrow="Bizy Learning" titulo="Portal do produtor" descricao=""><BotaoBizy icone={RefreshCcw} variante="secondary" onClick={() => void carregar()}>Actualizar</BotaoBizy></PageHead>
    {erro && <div className="mb-4 flex items-center gap-2 border border-destructive p-3 text-sm text-destructive"><AlertTriangle size={17} />{erro}</div>}
    <KpiGrid>
      <KpiCard icone={BookOpenCheck} rotulo="Produtos" valor={dados?.produtos.length ?? 0} />
      <KpiCard icone={UsersRound} cor="blue" rotulo="Cohorts" valor={dados?.cohorts.length ?? 0} />
      <KpiCard icone={CircleDollarSign} cor="green" rotulo="Receita" valor={formatarKwanza(dados?.receita.confirmada ?? 0)} />
      <KpiCard icone={AlertTriangle} cor="amber" rotulo="Riscos" valor={dados?.riscos.metricas.total ?? 0} />
    </KpiGrid>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <PanelCard titulo="Produtos e versões" descricao="">
        <div className="space-y-2">{(dados?.produtos ?? []).map((produto) => <button type="button" key={produto.slug} onClick={() => setProgramaSlug(produto.slug)} className={`flex w-full items-center justify-between border p-3 text-left ${programaSlug === produto.slug ? "border-primary" : ""}`}><span><strong className="block text-sm">{produto.titulo}</strong><small className="text-muted-foreground">{produto.formato} · v{produto.versaoConteudo?.numero ?? 1}</small></span><StatusBadge cor={produto.estado === "PUBLICADO" ? "green" : "mute"}>{produto.estado}</StatusBadge></button>)}</div>
        <form className="mt-3 grid gap-2" onSubmit={criarVersao}><textarea className="min-h-20 border bg-background p-2 text-sm" placeholder="Notas da nova versão" value={versao.releaseNotes} onChange={(e) => setVersao({ ...versao, releaseNotes: e.target.value })} /><select className="h-10 border bg-background px-2 text-sm" value={versao.impacto} onChange={(e) => setVersao({ ...versao, impacto: e.target.value })}><option value="MANTER_VERSAO">Manter versão anterior</option><option value="ATUALIZAR_SEM_INVALIDAR">Actualizar sem invalidar</option><option value="RECERTIFICAR">Exigir recertificação</option></select><BotaoBizy tipo="submit" icone={FileClock} disabled={Boolean(acao) || !programaSlug}>Publicar versão</BotaoBizy></form>
      </PanelCard>
      <PanelCard titulo="Assignment" descricao="">
        <form className="grid gap-2" onSubmit={criarTarefa}><input className="h-10 border bg-background px-2 text-sm" placeholder="Título" value={tarefa.titulo} onChange={(e) => setTarefa({ ...tarefa, titulo: e.target.value })} /><textarea className="min-h-24 border bg-background p-2 text-sm" placeholder="Instruções e evidência esperada" value={tarefa.instrucoes} onChange={(e) => setTarefa({ ...tarefa, instrucoes: e.target.value })} /><input className="h-10 border bg-background px-2 text-sm" type="date" value={tarefa.prazoAte} onChange={(e) => setTarefa({ ...tarefa, prazoAte: e.target.value })} /><BotaoBizy tipo="submit" icone={ClipboardCheck} disabled={Boolean(acao) || !programaSlug}>Criar tarefa</BotaoBizy></form>
        <div className="mt-4 space-y-2">{(dados?.assignments.tarefas ?? []).slice(0, 8).map((item) => <div key={item.id} className="border p-3 text-sm"><strong>{item.titulo}</strong><span className="block text-xs text-muted-foreground">{item.programaSlug}</span></div>)}</div>
      </PanelCard>
      <PanelCard titulo="Risco e follow-up" descricao="">
        <div className="space-y-2">{(dados?.riscos.riscos ?? []).slice(0, 10).map((risco) => <div key={`${risco.atribuicaoId}-${risco.tipo}`} className="flex items-center justify-between border p-3 text-sm"><span><strong className="block">{risco.tipo.replace(/_/g, " ")}</strong><small>{risco.programaSlug} · {risco.percentual}%</small></span><AlertTriangle size={16} /></div>)}</div>
        <BotaoBizy icone={RefreshCcw} className="mt-3" disabled={Boolean(acao)} onClick={() => void executar("automacoes", executarAutomacoesLearning)}>Criar follow-ups</BotaoBizy>
      </PanelCard>
      <PanelCard titulo="Governança" descricao=""><div className="flex gap-3 text-sm"><ShieldCheck size={20} /><p>{dados?.privacidade ?? "Dados mínimos de venda, suporte e aprendizagem."}</p></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div className="border p-3"><strong>{dados?.moderacao.length ?? 0}</strong><span className="block text-xs text-muted-foreground">casos de moderação</span></div><div className="border p-3"><strong>{dados?.documentos.length ?? 0}</strong><span className="block text-xs text-muted-foreground">documentos</span></div></div></PanelCard>
    </div>
  </div></CrmPageMotion>;
}
