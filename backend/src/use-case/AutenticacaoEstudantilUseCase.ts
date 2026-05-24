import type { RepositorioAutenticacao } from "../dominio/repositorios/contratos.js";
import { NormalizadorTelefone } from "../dominio/servicos/NormalizadorTelefone.js";
import type { UsuarioSistema } from "../dominio/tipos.js";
import type { AutenticacaoTelefoneUseCase } from "./AutenticacaoTelefoneUseCase.js";

export type ProviderAcademico = "uor" | "isptec";
export type TipoIdentificadorAcademico = "studentNumber" | "username";

export interface CredenciaisEstudantis {
  provider: ProviderAcademico;
  identificador: string;
  tipoIdentificador: TipoIdentificadorAcademico;
  palavraPasse: string;
}

export interface PerfilAcademicoAutenticado {
  institutionCode: string;
  studentNumber: string;
  username?: string | null;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  curso?: string | null;
  turma?: string | null;
  anoAcademico?: string | null;
  avatarUrl?: string | null;
  dados?: Record<string, unknown>;
}

export type ResultadoAutenticacaoEstudantil =
  | { sucesso: true; perfil: PerfilAcademicoAutenticado }
  | { sucesso: false; erro: string };

export interface ProvedorAutenticacaoEstudantil {
  autenticar(credenciais: CredenciaisEstudantis): Promise<ResultadoAutenticacaoEstudantil>;
}

export class AutenticacaoEstudantilUseCase {
  private readonly normalizadorTelefone = new NormalizadorTelefone();

  constructor(
    private readonly repositorio: RepositorioAutenticacao,
    private readonly provedor: ProvedorAutenticacaoEstudantil,
    private readonly autenticacaoTelefone: AutenticacaoTelefoneUseCase
  ) {}

  async login(credenciais: CredenciaisEstudantis): Promise<{
    sucesso: true;
    token: string;
    expiraEm: Date;
    usuario: UsuarioSistema;
    perfil: PerfilAcademicoAutenticado;
  }> {
    const normalizadas = this.normalizarCredenciais(credenciais);
    const resultado = await this.provedor.autenticar(normalizadas);

    if (!resultado.sucesso) {
      throw new Error(resultado.erro);
    }

    const perfil = this.normalizarPerfil(resultado.perfil);
    const usuario = await this.repositorio.criarOuAtualizarUsuarioPorIdentidade({
      tipo: "ESTUDANTIL",
      provider: normalizadas.provider,
      providerUserId: `${perfil.institutionCode}:${perfil.studentNumber}`,
      nome: perfil.nome,
      telefone: perfil.telefone,
      email: perfil.email,
      avatarUrl: perfil.avatarUrl,
      origemCadastro: "ESTUDANTIL",
      dados: {
        ...perfil.dados,
        tipoIdentificador: normalizadas.tipoIdentificador,
        identificadorUsado: normalizadas.identificador
      }
    });

    await this.repositorio.salvarPerfilEstudantil({
      usuarioId: usuario.id,
      institutionCode: perfil.institutionCode,
      studentNumber: perfil.studentNumber,
      username: perfil.username,
      nome: perfil.nome,
      email: perfil.email,
      telefone: perfil.telefone,
      curso: perfil.curso,
      turma: perfil.turma,
      anoAcademico: perfil.anoAcademico,
      avatarUrl: perfil.avatarUrl,
      dados: perfil.dados
    });

    const sessao = await this.autenticacaoTelefone.criarSessaoParaUsuario(usuario.id);

    return {
      sucesso: true,
      token: sessao.token,
      expiraEm: sessao.expiraEm,
      usuario,
      perfil
    };
  }

  private normalizarCredenciais(credenciais: CredenciaisEstudantis): CredenciaisEstudantis {
    const provider = credenciais.provider;
    const tipoIdentificador = provider === "isptec" ? "studentNumber" : credenciais.tipoIdentificador;
    const identificador =
      tipoIdentificador === "username"
        ? credenciais.identificador.trim().replace(/\s+/g, " ").slice(0, 40)
        : credenciais.identificador.replace(/\D/g, "").slice(0, 12);

    if (!identificador) {
      throw new Error("Informe o número de estudante ou nome de utilizador.");
    }

    if (tipoIdentificador === "studentNumber" && (identificador.length < 8 || identificador.length > 12)) {
      throw new Error("Número de estudante deve ter entre 8 e 12 dígitos.");
    }

    if (tipoIdentificador === "username" && !/^[\p{L}\p{N}._@ -]+$/u.test(identificador)) {
      throw new Error("Nome de utilizador contém caracteres inválidos.");
    }

    if (!credenciais.palavraPasse.trim()) {
      throw new Error("Informe a palavra-passe académica.");
    }

    return {
      provider,
      tipoIdentificador,
      identificador,
      palavraPasse: credenciais.palavraPasse
    };
  }

  private normalizarPerfil(perfil: PerfilAcademicoAutenticado): PerfilAcademicoAutenticado {
    const institutionCode = perfil.institutionCode.trim().toUpperCase() || "UOR";
    const studentNumber = perfil.studentNumber.replace(/\D/g, "").trim();
    const telefone = perfil.telefone ? this.normalizadorTelefone.normalizar(perfil.telefone) ?? perfil.telefone.trim() : null;

    if (!studentNumber) {
      throw new Error("O provedor académico não devolveu o número oficial do estudante.");
    }

    return {
      institutionCode,
      studentNumber,
      username: perfil.username?.trim() || null,
      nome: perfil.nome.trim() || `Estudante ${studentNumber}`,
      email: perfil.email?.trim().toLowerCase() || null,
      telefone,
      curso: perfil.curso?.trim() || null,
      turma: perfil.turma?.trim() || null,
      anoAcademico: perfil.anoAcademico?.trim() || null,
      avatarUrl: perfil.avatarUrl?.trim() || null,
      dados: perfil.dados ?? {}
    };
  }
}

export class UorConnectAuthProvider implements ProvedorAutenticacaoEstudantil {
  constructor(
    private readonly opcoes: {
      baseUrl?: string;
      timeoutMs?: number;
      permitirDev?: boolean;
    }
  ) {}

  async autenticar(credenciais: CredenciaisEstudantis): Promise<ResultadoAutenticacaoEstudantil> {
    const baseUrl = this.opcoes.baseUrl?.trim().replace(/\/+$/, "");

    if (!baseUrl) {
      if (this.opcoes.permitirDev) {
        return this.autenticarEmDev(credenciais);
      }

      return {
        sucesso: false,
        erro: "Login estudantil não configurado. Configure UORCONNECT_API_URL ou ative LOGIN_ESTUDANTIL_DEV_MODE em desenvolvimento."
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.opcoes.timeoutMs ?? 25_000);

    try {
      const resposta = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: credenciais.identificador,
          password: credenciais.palavraPasse,
          origin: "uorconnect",
          provider: credenciais.provider,
          identifierType: credenciais.tipoIdentificador
        }),
        signal: controller.signal
      });
      const payload = await resposta.json().catch(() => null) as Record<string, unknown> | null;

      if (!resposta.ok || payload?.success === false) {
        return {
          sucesso: false,
          erro: this.obterMensagemErro(payload) ?? "Não foi possível validar a sessão académica."
        };
      }

      const estudante = (payload?.student ?? payload?.profile ?? {}) as Record<string, unknown>;
      return {
        sucesso: true,
        perfil: this.mapearPerfil(estudante, credenciais)
      };
    } catch (erro) {
      return {
        sucesso: false,
        erro:
          erro instanceof Error && erro.name === "AbortError"
            ? "O UOR Connect demorou a responder. Tente novamente dentro de instantes."
            : "Não foi possível contactar o UOR Connect para validar o login estudantil."
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private autenticarEmDev(credenciais: CredenciaisEstudantis): ResultadoAutenticacaoEstudantil {
    const studentNumber = credenciais.tipoIdentificador === "studentNumber"
      ? credenciais.identificador.replace(/\D/g, "")
      : "20240000";

    return {
      sucesso: true,
      perfil: {
        institutionCode: credenciais.provider === "isptec" ? "ISPTEC" : "UOR",
        studentNumber,
        username: credenciais.tipoIdentificador === "username" ? credenciais.identificador : null,
        nome: `Estudante ${studentNumber}`,
        email: `${studentNumber}@bizy.local`,
        dados: { modo: "dev" }
      }
    };
  }

  private mapearPerfil(estudante: Record<string, unknown>, credenciais: CredenciaisEstudantis): PerfilAcademicoAutenticado {
    const institutionCode = this.lerTexto(estudante.institutionCode) ??
      (credenciais.provider === "isptec" ? "ISPTEC" : "UOR");
    const studentNumber = this.lerTexto(estudante.studentNumber) ??
      (credenciais.tipoIdentificador === "studentNumber" ? credenciais.identificador : "");

    return {
      institutionCode,
      studentNumber,
      username: this.lerTexto(estudante.username),
      nome: this.lerTexto(estudante.name) ?? this.lerTexto(estudante.nome) ?? `Estudante ${studentNumber}`,
      email: this.lerTexto(estudante.email),
      telefone: this.lerTexto(estudante.phone) ?? this.lerTexto(estudante.telefone),
      curso: this.lerTexto(estudante.course) ?? this.lerTexto(estudante.curso),
      turma: this.lerTexto(estudante.classCode) ?? this.lerTexto(estudante.turma),
      anoAcademico: this.lerTexto(estudante.academicYear) ?? this.lerTexto(estudante.anoAcademico),
      avatarUrl: this.lerTexto(estudante.avatarUrl),
      dados: estudante
    };
  }

  private obterMensagemErro(payload: Record<string, unknown> | null) {
    return this.lerTexto(payload?.error) ?? this.lerTexto(payload?.mensagem) ?? this.lerTexto(payload?.message);
  }

  private lerTexto(valor: unknown): string | null {
    if (typeof valor !== "string") return null;
    const texto = valor.trim();
    return texto || null;
  }
}
