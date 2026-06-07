import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Agenda CRM", () => {
  it("integra o gestor de eventos com backend e atalhos comerciais", () => {
    const agenda = source("src/paginas/Agenda.tsx");
    const gestor = source("src/components/ui/event-manager.tsx");
    const css = source("src/estilos.css");

    expect(gestor).toContain("useEffect");
    expect(gestor).toContain("aoCriarEvento");
    expect(gestor).toContain("aoConcluirEvento");
    expect(gestor).toContain("renderizarAcoesCrm");
    expect(gestor).toContain("agenda-cal-card");
    expect(css).toContain(".agenda-cal-card .border-b");
    expect(agenda).toContain("GestorEventos");
    expect(agenda).toContain("criarLembrete");
    expect(agenda).toContain("actualizarLembrete");
    expect(agenda).toContain("concluirLembrete");
    expect(agenda).toContain("cancelarLembrete");
    expect(agenda).toContain('requisitarApi<RespostaLembreteCriado>("/lembretes"');
    expect(agenda).toContain('method: "POST"');
    expect(agenda).toContain('method: "PATCH"');
    expect(agenda).toContain("renderizarAcoesCrm");
    expect(agenda).toContain("/app/conversas");
    expect(agenda).toContain("/app/reservas");
    expect(agenda).toContain("/app/clientes");
  });
});
