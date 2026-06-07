import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("dashboard de live", () => {
  it("mantém uma sessão ativa explícita para comentários manuais e encerramento", () => {
    const live = source("src/paginas/Live.tsx");

    expect(live).toContain("const liveAtual");
    expect(live).toContain("/comentarios/manual`");
    expect(live).toContain("/parar`");
    expect(live).toContain("LIVE_DISCONNECTED");
    expect(live).not.toContain('liveId: "manual_dashboard"');
  });

  it("usa métricas reais de espectadores em vez de comentários recebidos", () => {
    const live = source("src/paginas/Live.tsx");
    const tipos = source("src/tipos.ts");

    expect(tipos).toContain("espectadoresAtuais: number | null");
    expect(tipos).toContain("picoEspectadores: number | null");
    expect(live).toContain("LIVE_METRICS_UPDATED");
    expect(live).toContain("espectadoresAtuaisTexto");
    expect(live).toContain("liveAtual.espectadoresAtuais");
    expect(live).not.toContain("resumo.comentariosRecebidos} a assistir");
  });

  it("transforma o painel em agenda operacional do dia", () => {
    const painel = source("src/paginas/Painel.tsx");

    expect(painel).toContain("Prioridades operacionais");
    expect(painel).toContain("Pedidos hoje");
    expect(painel).toContain("Pagamentos pendentes");
    expect(painel).toContain("Faturação do dia");
    expect(painel).toContain("Tarefas atrasadas");
    expect(painel).toContain("/atendimento/conversas");
    expect(painel).toContain("/tarefas?estado=ABERTA&limite=8");
    expect(painel).toContain("obterSaudacao");
    expect(painel).not.toContain("comentarioManual");
    expect(painel).not.toContain("providerLive");
  });
});
