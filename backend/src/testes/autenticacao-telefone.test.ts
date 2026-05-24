import { describe, expect, it } from "vitest";
import type { ProvedorSms, ResultadoEnvioSms } from "../dominio/provedores/ProvedorSms.js";
import { AutenticacaoTelefoneUseCase } from "../use-case/AutenticacaoTelefoneUseCase.js";
import { RepositorioAutenticacaoMemoria } from "../use-case/repositorios/RepositorioMemoria.js";

class ProvedorSmsFake implements ProvedorSms {
  configurado = true;
  ultimaMensagem: { telefone: string; conteudo: string; remetente: string } | null = null;

  async enviarMensagem(mensagem: { telefone: string; conteudo: string; remetente: string }): Promise<ResultadoEnvioSms> {
    this.ultimaMensagem = mensagem;
    return {
      ok: true,
      provider: "fake-sms",
      status: 200,
      idExterno: "sms_123",
      resposta: { id: "sms_123" },
      erro: null
    };
  }
}

describe("AutenticacaoTelefoneUseCase", () => {
  it("envia código SMS e cria sessão quando o código é confirmado", async () => {
    const repositorio = new RepositorioAutenticacaoMemoria();
    const provedor = new ProvedorSmsFake();
    const useCase = new AutenticacaoTelefoneUseCase(repositorio, provedor, {
      segredo: "segredo-testes",
      remetenteSms: "EMEU",
      exporCodigoDev: true
    });

    const solicitacao = await useCase.solicitarCodigo({
      telefone: "+244 923 456 789",
      nome: "Loja Teste"
    });

    expect(solicitacao.telefone).toBe("923456789");
    expect(provedor.ultimaMensagem?.conteudo).toContain("codigo de acesso");

    const confirmacao = await useCase.confirmarCodigo({
      telefone: "923456789",
      codigo: solicitacao.codigoDev!
    });

    expect(confirmacao.token).toBeTruthy();
    expect(confirmacao.usuario.nome).toBe("Loja Teste");

    const usuario = await useCase.obterSessao(confirmacao.token);
    expect(usuario?.telefone).toBe("923456789");
  });

  it("recusa telefone angolano inválido", async () => {
    const useCase = new AutenticacaoTelefoneUseCase(new RepositorioAutenticacaoMemoria(), new ProvedorSmsFake(), {
      segredo: "segredo-testes",
      remetenteSms: "EMEU"
    });

    await expect(useCase.solicitarCodigo({ telefone: "812345678" })).rejects.toThrow("Número de telefone");
  });
});
