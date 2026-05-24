import {
  Ban,
  CheckCircle2,
  QrCode,
  RefreshCcw,
  Smartphone,
  Wifi
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { requisitarApi } from "../api";
import { CabecalhoPagina, EstadoVazio, ResumoIndicadores } from "../componentes/Shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { InstanciaEvolution, ResumoEvolution } from "../tipos";

export function PaginaConexaoWhatsApp() {
  const [resumo, setResumo] = useState<ResumoEvolution | null>(null);
  const [mensagem, setMensagem] = useState("Central WhatsApp pronta.");
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    nome: "emeu-vendas",
    etiqueta: "Linha de vendas",
    telefone: "244923456789",
    padrao: true
  });

  async function carregar() {
    const res = await requisitarApi<ResumoEvolution>("/evolution/resumo");
    setResumo(res);
  }

  useEffect(() => {
    void carregar().catch((e) => setMensagem(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setCarregando(true);
    setMensagem("A comunicar com a Evolution...");
    try {
      await acao();
      await carregar();
      setMensagem(sucesso);
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Falha.");
    } finally {
      setCarregando(false);
    }
  }

  async function criarInstancia(e: FormEvent) {
    e.preventDefault();
    await executar(
      () => requisitarApi("/evolution/instancias", { method: "POST", body: form }),
      "Instância criada."
    );
  }

  const conectadas = resumo?.instancias.filter((i) => ["open", "connected", "online"].includes(i.status.toLowerCase())).length ?? 0;

  return (
    <>
      <CabecalhoPagina rotulo="Conexão WhatsApp" titulo="QR Code e instâncias">
        <Button asChild variant="outline" size="lg">
          <a
            href={resumo?.integracao.managerUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
          >
            <QrCode size={18} />
            Evolution Manager
          </a>
        </Button>
      </CabecalhoPagina>

      <ResumoIndicadores
        rotulo="Resumo da conexão WhatsApp"
        colunas={3}
        itens={[
          {
            icone: <Wifi />,
            titulo: "Evolution API",
            valor: resumo?.integracao.configurada ? "Configurada" : "Pendente",
            detalhe: resumo?.integracao.baseUrl ?? "sem URL",
            tom: resumo?.integracao.configurada ? "sucesso" : "atencao"
          },
          {
            icone: <Smartphone />,
            titulo: "Instâncias",
            valor: resumo?.instancias.length ?? 0,
            detalhe: `${conectadas} conectadas`,
            tom: "principal"
          },
          {
            icone: <QrCode />,
            titulo: "Linha padrão",
            valor: resumo?.instanciaPadraoId ? "Definida" : "Nenhuma",
            detalhe: "Usada nas automações",
            tom: resumo?.instanciaPadraoId ? "sucesso" : "atencao"
          }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Nova linha</p>
              <h2 className="text-lg font-semibold">Criar instância</h2>
            </div>
            <Smartphone size={20} />
          </CardHeader>
          <CardContent>
          <form onSubmit={criarInstancia} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="nomeInst">Nome técnico</label>
              <Input id="nomeInst" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="etiqInst">Etiqueta</label>
              <Input id="etiqInst" value={form.etiqueta} onChange={(e) => setForm({ ...form, etiqueta: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="telInst">Telefone</label>
              <Input id="telInst" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.padrao} onCheckedChange={(checked) => setForm({ ...form, padrao: checked === true })} />
              Tornar linha padrão
            </label>
            <Button size="lg" disabled={carregando}>
              <Wifi size={18} />
              Criar instância
            </Button>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Admin WhatsApp</p>
              <h2 className="text-lg font-semibold">QR Code e estado</h2>
            </div>
            <QrCode size={20} />
          </CardHeader>

          <CardContent className="grid gap-3">
            {resumo?.instancias.length ? (
              resumo.instancias.map((inst) => (
                <InstanciaCard
                  key={inst.id}
                  instancia={inst}
                  carregando={carregando}
                  onExecutar={executar}
                />
              ))
            ) : (
              <EstadoVazio icone={<Smartphone />} titulo="Sem instâncias" detalhe="Crie uma linha para gerar o QR Code." />
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground" aria-live="polite">{mensagem}</footer>
    </>
  );
}

function InstanciaCard({
  instancia,
  carregando,
  onExecutar
}: {
  instancia: InstanciaEvolution;
  carregando: boolean;
  onExecutar: (acao: () => Promise<unknown>, sucesso: string) => Promise<void>;
}) {
  return (
    <Card className="bg-muted/20">
      <CardContent className="grid gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate">{instancia.etiqueta || instancia.nome}</strong>
          <span className="block truncate text-sm text-muted-foreground">{instancia.nome} · {instancia.telefone || "sem telefone"}</span>
        </div>
        <Badge variant={["open", "connected", "online"].includes(instancia.status.toLowerCase()) ? "success" : instancia.status.toLowerCase().includes("error") ? "destructive" : "warning"}>{instancia.status}</Badge>
      </div>

      {instancia.qrCode || instancia.pairingCode ? (
        <div className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[140px_1fr]">
          {instancia.qrCode && <img src={instancia.qrCode} alt={`QR Code ${instancia.nome}`} className="aspect-square w-full rounded-lg border object-contain" />}
          <div className="grid content-start gap-2">
            <strong>Escaneie no WhatsApp</strong>
            <span className="text-sm text-muted-foreground">WhatsApp &gt; Dispositivos conectados &gt; Conectar dispositivo</span>
            {instancia.pairingCode && <code className="w-fit rounded bg-muted px-2 py-1 text-sm">{instancia.pairingCode}</code>}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center gap-2 rounded-lg border border-dashed bg-background p-4 text-center text-sm text-muted-foreground">
          <QrCode size={22} />
          <span>Sem QR disponível. Clique em conectar.</span>
        </div>
      )}

      {instancia.ultimoErro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{instancia.ultimoErro}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="lg" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/conectar`, { method: "POST" }), "Pedido de conexão enviado.")}>
          <QrCode size={16} /> Conectar
        </Button>
        <Button variant="outline" size="lg" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/estado`, { method: "POST" }), "Estado atualizado.")}>
          <RefreshCcw size={16} /> Estado
        </Button>
        {!instancia.padrao && (
          <Button variant="outline" size="lg" disabled={carregando} onClick={() => void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}/padrao`, { method: "POST" }), "Linha padrão atualizada.")}>
            <CheckCircle2 size={16} /> Padrão
          </Button>
        )}
        <Button
          variant="destructive"
          size="lg"
          disabled={carregando}
          onClick={() => {
            if (!window.confirm(`Remover a instância ${instancia.etiqueta || instancia.nome}?`)) return;
            void onExecutar(() => requisitarApi(`/evolution/instancias/${instancia.id}`, { method: "DELETE" }), "Instância removida.");
          }}
        >
          <Ban size={16} /> Remover
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}
