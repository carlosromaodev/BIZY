import { describe, expect, it, vi } from "vitest";
import type { ContextoAplicacao } from "../infra/http/ContextoAplicacao.js";
import {
  exigirModuloComercial,
  exigirPermissaoComercial,
  resolverContextoComercial
} from "../infra/http/contextoComercial.js";
import type { NegocioBizy, UsuarioSistema } from "../dominio/tipos.js";

function criarReplyFake() {
  const estado = {
    statusCode: 200,
    payload: null as unknown
  };

  return {
    estado,
    reply: {
      code(statusCode: number) {
        estado.statusCode = statusCode;
        return this;
      },
      async send(payload: unknown) {
        estado.payload = payload;
        return this;
      }
    }
  };
}

describe("contexto comercial HTTP", () => {
  const usuario: UsuarioSistema = {
    id: "usuario_1",
    nome: "Carlos",
    telefone: "923000111",
    email: "carlos@example.com",
    avatarUrl: null,
    papel: "VENDEDOR",
    origemCadastro: "TELEFONE",
    perfilCompletoEm: null,
    criadoEm: new Date("2026-05-24T10:00:00.000Z"),
    atualizadoEm: new Date("2026-05-24T10:00:00.000Z")
  };

  const negocio: NegocioBizy = {
    id: "negocio_1",
    nomeComercial: "Loja de Carlos",
    segmento: "geral",
    tipo: "LOJA",
    nif: null,
    telefone: "923000111",
    whatsapp: "923000111",
    email: "carlos@example.com",
    instagram: null,
    tiktok: null,
    provincia: null,
    municipio: null,
    endereco: null,
    moeda: "AOA",
    fusoHorario: "Africa/Luanda",
    canaisVenda: ["WHATSAPP"],
    metodosPagamento: [],
    entrega: {},
    minutosReservaPadrao: 10,
    usuarioPapel: "DONO",
    criadoEm: new Date("2026-05-24T10:00:00.000Z"),
    atualizadoEm: new Date("2026-05-24T10:00:00.000Z")
  };

  it("resolve usuário, negócio, papel, permissões e módulos padrão para rotas comerciais", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuario)
      },
      repositorios: {
        autenticacao: {
          buscarNegocioPrincipalPorUsuario: vi.fn().mockResolvedValue(null),
          salvarNegocioUsuario: vi.fn().mockResolvedValue(negocio),
          listarModulosAtivosPorNegocio: vi.fn().mockResolvedValue([])
        }
      }
    } as unknown as ContextoAplicacao;
    const { reply } = criarReplyFake();

    const resultado = await resolverContextoComercial(
      contexto,
      { headers: { authorization: "Bearer token-dev" } } as never,
      reply as never,
      "Faça login para gerir catálogo."
    );

    expect(resultado).toEqual(
      expect.objectContaining({
        usuario,
        negocio,
        papel: "DONO",
        modulosAtivos: expect.arrayContaining(["crm", "catalogo", "conversas", "whatsapp"])
      })
    );
    expect(resultado?.permissoes).toEqual(expect.arrayContaining(["catalogo:gerir", "clientes:gerir"]));
    expect(contexto.repositorios.autenticacao.salvarNegocioUsuario).toHaveBeenCalledWith(
      usuario.id,
      expect.objectContaining({
        nomeComercial: "Loja de Carlos",
        telefone: "923000111",
        whatsapp: "923000111"
      })
    );
  });

  it("usa módulos ativos configurados no negócio quando existirem", async () => {
    const listarModulosAtivosPorNegocio = vi.fn().mockResolvedValue(["crm", "loja-publica", "afiliados"]);
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuario)
      },
      repositorios: {
        autenticacao: {
          buscarNegocioPrincipalPorUsuario: vi.fn().mockResolvedValue(negocio),
          salvarNegocioUsuario: vi.fn(),
          listarModulosAtivosPorNegocio
        }
      }
    } as unknown as ContextoAplicacao;
    const { reply } = criarReplyFake();

    const resultado = await resolverContextoComercial(
      contexto,
      { headers: { authorization: "Bearer token-dev" } } as never,
      reply as never
    );

    expect(resultado?.modulosAtivos).toEqual(["crm", "loja-publica", "afiliados"]);
    expect(listarModulosAtivosPorNegocio).toHaveBeenCalledWith("negocio_1");
  });

  it("autoriza leitura quando o papel possui permissão de gestão do mesmo domínio", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuario)
      },
      repositorios: {
        autenticacao: {
          buscarNegocioPrincipalPorUsuario: vi.fn().mockResolvedValue(negocio),
          listarModulosAtivosPorNegocio: vi.fn().mockResolvedValue([])
        }
      }
    } as unknown as ContextoAplicacao;
    const { reply, estado } = criarReplyFake();

    const resultado = await exigirPermissaoComercial(
      contexto,
      { headers: { authorization: "Bearer token-dev" } } as never,
      reply as never,
      "catalogo:ler"
    );

    expect(resultado?.papel).toBe("DONO");
    expect(estado.statusCode).toBe(200);
    expect(estado.payload).toBeNull();
  });

  it("responde 403 quando o papel não possui a permissão exigida", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuario)
      },
      repositorios: {
        autenticacao: {
          buscarNegocioPrincipalPorUsuario: vi.fn().mockResolvedValue({
            ...negocio,
            usuarioPapel: "ENTREGADOR"
          }),
          listarModulosAtivosPorNegocio: vi.fn().mockResolvedValue([])
        }
      }
    } as unknown as ContextoAplicacao;
    const { reply, estado } = criarReplyFake();

    const resultado = await exigirPermissaoComercial(
      contexto,
      { headers: { authorization: "Bearer token-dev" } } as never,
      reply as never,
      "catalogo:gerir",
      "Sem permissão para gerir catálogo."
    );

    expect(resultado).toBeNull();
    expect(estado.statusCode).toBe(403);
    expect(estado.payload).toEqual({
      erro: "PERMISSAO_NEGADA",
      mensagem: "Sem permissão para gerir catálogo."
    });
  });

  it("responde 403 quando o módulo comercial exigido está desativado", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(usuario)
      },
      repositorios: {
        autenticacao: {
          buscarNegocioPrincipalPorUsuario: vi.fn().mockResolvedValue(negocio),
          listarModulosAtivosPorNegocio: vi.fn().mockResolvedValue(["crm", "reservas"])
        }
      }
    } as unknown as ContextoAplicacao;
    const { reply, estado } = criarReplyFake();

    const resultado = await exigirModuloComercial(
      contexto,
      { headers: { authorization: "Bearer token-dev" } } as never,
      reply as never,
      "catalogo",
      "Catálogo desativado para este negócio."
    );

    expect(resultado).toBeNull();
    expect(estado.statusCode).toBe(403);
    expect(estado.payload).toEqual({
      erro: "MODULO_DESATIVADO",
      mensagem: "Catálogo desativado para este negócio.",
      modulo: "catalogo"
    });
  });

  it("interrompe com 401 quando a sessão não existe", async () => {
    const contexto = {
      autenticacaoTelefone: {
        obterSessao: vi.fn().mockResolvedValue(null)
      }
    } as unknown as ContextoAplicacao;
    const { reply, estado } = criarReplyFake();

    const resultado = await resolverContextoComercial(
      contexto,
      { headers: { authorization: "Bearer token-invalido" } } as never,
      reply as never
    );

    expect(resultado).toBeNull();
    expect(estado.statusCode).toBe(401);
    expect(estado.payload).toEqual(
      expect.objectContaining({
        erro: "NAO_AUTENTICADO"
      })
    );
  });
});
