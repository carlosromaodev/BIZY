import { describe, expect, it } from "vitest";
import { RepositorioSessoesLiveMemoria } from "../use-case/repositorios/RepositorioMemoria.js";

describe("RepositorioSessoesLive", () => {
  it("persiste a ligação ativa da live e permite encerrá-la", async () => {
    const repositorio = new RepositorioSessoesLiveMemoria();
    const iniciadaEm = new Date("2026-05-22T10:00:00.000Z");

    await repositorio.salvar({
      id: "manual_mattbtw_1",
      username: "mattbtw",
      providerNome: "manual",
      status: "CONECTADA",
      iniciadaEm,
      comentariosRecebidos: 1,
      comentariosProcessados: 1
    });

    expect(await repositorio.listarAtivas()).toEqual([
      expect.objectContaining({
        id: "manual_mattbtw_1",
        username: "mattbtw",
        providerNome: "manual",
        status: "CONECTADA",
        ativa: true,
        comentariosRecebidos: 1,
        comentariosProcessados: 1
      })
    ]);

    const encerrada = await repositorio.encerrar("manual_mattbtw_1", new Date("2026-05-22T10:05:00.000Z"));
    expect(encerrada).toEqual(expect.objectContaining({ ativa: false, status: "ENCERRADA" }));
    expect(await repositorio.listarAtivas()).toEqual([]);
  });
});
