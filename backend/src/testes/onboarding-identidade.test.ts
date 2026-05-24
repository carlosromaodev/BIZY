import { describe, expect, it } from "vitest";
import { AutenticacaoEstudantilUseCase, type ProvedorAutenticacaoEstudantil } from "../use-case/AutenticacaoEstudantilUseCase.js";
import { AutenticacaoTelefoneUseCase } from "../use-case/AutenticacaoTelefoneUseCase.js";
import { OnboardingBizyUseCase } from "../use-case/OnboardingBizyUseCase.js";
import { RepositorioAutenticacaoMemoria, RepositorioPecasMemoria } from "../use-case/repositorios/RepositorioMemoria.js";
import type { ProvedorSms, ResultadoEnvioSms } from "../dominio/provedores/ProvedorSms.js";
import { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import { GestaoPecasUseCase } from "../use-case/GestaoPecasUseCase.js";

class ProvedorSmsFake implements ProvedorSms {
  configurado = true;

  async enviarMensagem(): Promise<ResultadoEnvioSms> {
    return {
      ok: true,
      provider: "fake-sms",
      status: 200,
      idExterno: "sms_fake",
      resposta: {},
      erro: null
    };
  }
}

class ProvedorEstudantilFake implements ProvedorAutenticacaoEstudantil {
  async autenticar() {
    return {
      sucesso: true as const,
      perfil: {
        institutionCode: "UOR",
        studentNumber: "20243454",
        username: "carlosromaodev",
        nome: "Carlos Romão",
        email: "carlos@uor.ed.ao",
        telefone: "923000111",
        curso: "Engenharia Informática",
        turma: "EI-4A",
        anoAcademico: "2025/2026",
        avatarUrl: "https://example.com/avatar.png"
      }
    };
  }
}

describe("Identidade e onboarding Bizy", () => {
  it("cria uma sessão Bizy a partir do login estudantil validado pelo provedor externo", async () => {
    const repositorio = new RepositorioAutenticacaoMemoria();
    const autenticacaoTelefone = new AutenticacaoTelefoneUseCase(repositorio, new ProvedorSmsFake(), {
      segredo: "segredo-testes",
      remetenteSms: "BIZY"
    });
    const useCase = new AutenticacaoEstudantilUseCase(repositorio, new ProvedorEstudantilFake(), autenticacaoTelefone);

    const resposta = await useCase.login({
      provider: "uor",
      identificador: "20243454",
      tipoIdentificador: "studentNumber",
      palavraPasse: "senha-secreta"
    });

    expect(resposta.token).toBeTruthy();
    expect(resposta.usuario).toEqual(
      expect.objectContaining({
        nome: "Carlos Romão",
        telefone: "923000111",
        email: "carlos@uor.ed.ao",
        origemCadastro: "ESTUDANTIL"
      })
    );

    const sessao = await autenticacaoTelefone.obterSessao(resposta.token);
    expect(sessao?.id).toBe(resposta.usuario.id);
  });

  it("guarda negócio e produto inicial ligados ao usuário autenticado", async () => {
    const repositorio = new RepositorioAutenticacaoMemoria();
    const pecas = new RepositorioPecasMemoria();
    const gestaoPecas = new GestaoPecasUseCase(pecas, new DespachadorEventos());
    const usuario = await repositorio.criarOuAtualizarUsuario({
      telefone: "923000222",
      nome: "Vendedor Bizy"
    });
    const useCase = new OnboardingBizyUseCase(repositorio, gestaoPecas);

    const negocio = await useCase.salvarNegocio(usuario.id, {
      nomeComercial: "Loja Live Angola",
      segmento: "Moda feminina",
      tipo: "LOJA",
      telefone: "923000222",
      whatsapp: "923000222",
      email: "loja@example.com",
      provincia: "Luanda",
      municipio: "Talatona",
      moeda: "AOA",
      fusoHorario: "Africa/Luanda",
      canaisVenda: ["tiktok", "whatsapp"],
      metodosPagamento: ["transferencia", "multicaixa"],
      minutosReservaPadrao: 10
    });

    expect(negocio).toEqual(
      expect.objectContaining({
        nomeComercial: "Loja Live Angola",
        usuarioPapel: "DONO"
      })
    );

    const produto = await useCase.criarProdutoInicial(usuario.id, {
      codigo: "01",
      nome: "Vestido amarelo",
      descricao: "Primeiro produto da live",
      precoEmKwanza: 12000,
      quantidade: 5,
      categoria: "Moda",
      fotos: []
    });

    expect(produto.codigo).toBe("01");
    expect((await useCase.obterEstado(usuario.id)).pendencias).not.toContain("CADASTRAR_NEGOCIO");
  });
});
