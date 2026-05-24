import type { RepositorioInstanciasWhatsApp } from "../dominio/repositorios/contratos.js";
import type { InstanciaWhatsApp } from "../dominio/tipos.js";
import {
  ClienteEvolutionApi,
  extrairMensagemEvolution,
  extrairQrEvolution,
  instanciaWhatsAppEstaConectada,
  normalizarEstadoEvolution
} from "../infra/provedores/ClienteEvolutionApi.js";

export interface OpcoesGestaoWhatsAppEvolution {
  baseUrl: string;
  apiKey: string;
  managerUrl?: string | null;
}

export class GestaoWhatsAppEvolutionUseCase {
  constructor(
    private readonly repositorio: RepositorioInstanciasWhatsApp,
    private readonly opcoes: OpcoesGestaoWhatsAppEvolution
  ) {}

  async listarResumo(negocioId?: string | null) {
    const instancias = await this.repositorio.listarAtivas(negocioId);
    const padrao =
      instancias.find((instancia) => instancia.padrao && instanciaWhatsAppEstaConectada(instancia.status)) ??
      instancias.find((instancia) => instanciaWhatsAppEstaConectada(instancia.status)) ??
      instancias.find((instancia) => instancia.padrao) ??
      instancias[0] ??
      null;

    return {
      integracao: {
        configurada: Boolean(this.opcoes.baseUrl && this.opcoes.apiKey),
        baseUrl: this.opcoes.baseUrl || null,
        managerUrl: this.opcoes.managerUrl || null
      },
      instanciaPadraoId: padrao?.id ?? null,
      instancias: instancias.map((instancia) => this.formatarInstancia(instancia))
    };
  }

  async criarInstancia(dados: {
    negocioId?: string | null;
    nome: string;
    etiqueta?: string | null;
    telefone?: string | null;
    baseUrl?: string | null;
    apiKey?: string | null;
    token?: string | null;
    padrao?: boolean;
  }) {
    const negocioId = dados.negocioId ?? null;
    const instancia = await this.repositorio.criar({
      negocioId,
      nome: dados.nome.trim().replace(/\s+/g, "-"),
      etiqueta: dados.etiqueta?.trim() || null,
      telefone: dados.telefone ? this.normalizarNumeroDono(dados.telefone) : null,
      baseUrl: dados.baseUrl?.trim() || null,
      apiKey: dados.apiKey?.trim() || null,
      padrao: dados.padrao
    });

    const resultado = await this.criarCliente(instancia).criarInstancia({
      nome: instancia.nome,
      token: dados.token ?? null,
      numero: instancia.telefone
    });
    const artefatos = await extrairQrEvolution(resultado.payload);
    const atualizada = await this.repositorio.atualizar(instancia.id, {
      status: this.resolverEstado({
        providerOk: resultado.ok,
        payload: resultado.payload,
        qrCode: artefatos.qrCode,
        pairingCode: artefatos.pairingCode
      }),
      qrCode: artefatos.qrCode,
      pairingCode: artefatos.pairingCode,
      ultimaConsultaEm: new Date(),
      ultimoErro: resultado.ok ? null : resultado.mensagemErro
    }, negocioId);

    return this.formatarInstancia(atualizada);
  }

  async conectar(id: string, negocioId?: string | null) {
    const instancia = await this.exigirInstancia(id, negocioId);
    const resultado = await this.criarCliente(instancia).conectar(instancia.nome, instancia.telefone);
    const artefatos = await extrairQrEvolution(resultado.payload);
    const atualizada = await this.repositorio.atualizar(instancia.id, {
      status: this.resolverEstado({
        providerOk: resultado.ok,
        payload: resultado.payload,
        qrCode: artefatos.qrCode,
        pairingCode: artefatos.pairingCode
      }),
      qrCode: artefatos.qrCode,
      pairingCode: artefatos.pairingCode,
      ultimaConsultaEm: new Date(),
      ultimoErro: resultado.ok ? null : resultado.mensagemErro
    }, negocioId);

    return this.formatarInstancia(atualizada);
  }

  async consultarEstado(id: string, negocioId?: string | null) {
    const instancia = await this.exigirInstancia(id, negocioId);
    const resultado = await this.criarCliente(instancia).consultarEstado(instancia.nome);
    const estado = normalizarEstadoEvolution(resultado.payload);
    const conectado = instanciaWhatsAppEstaConectada(estado);
    const atualizada = await this.repositorio.atualizar(instancia.id, {
      status: resultado.ok ? estado : "ERROR",
      qrCode: conectado ? null : instancia.qrCode,
      pairingCode: conectado ? null : instancia.pairingCode,
      ultimaConexaoEm: conectado ? new Date() : instancia.ultimaConexaoEm,
      ultimaConsultaEm: new Date(),
      ultimoErro: resultado.ok ? null : resultado.mensagemErro ?? extrairMensagemEvolution(resultado.payload)
    }, negocioId);

    return this.formatarInstancia(atualizada);
  }

  async definirPadrao(id: string, negocioId?: string | null) {
    const instancia = await this.repositorio.definirPadrao(id, negocioId);
    return this.formatarInstancia(instancia);
  }

  async remover(id: string, negocioId?: string | null) {
    const instancia = await this.exigirInstancia(id, negocioId);
    const resultado = await this.criarCliente(instancia).apagarInstancia(instancia.nome);
    const removida = await this.repositorio.desativar(id, negocioId);

    return {
      instancia: this.formatarInstancia(removida),
      provider: {
        ok: resultado.ok,
        status: resultado.status,
        mensagem: resultado.mensagemErro
      }
    };
  }

  private criarCliente(instancia?: InstanciaWhatsApp) {
    return new ClienteEvolutionApi({
      baseUrl: instancia?.baseUrl?.trim() || this.opcoes.baseUrl,
      apiKey: instancia?.apiKey?.trim() || this.opcoes.apiKey
    });
  }

  private async exigirInstancia(id: string, negocioId?: string | null) {
    const instancia = await this.repositorio.buscarPorId(id, negocioId);
    if (!instancia || !instancia.ativa) {
      throw new Error("Instância WhatsApp não encontrada.");
    }
    return instancia;
  }

  private resolverEstado(input: {
    providerOk: boolean;
    payload: unknown;
    qrCode: string | null;
    pairingCode: string | null;
  }) {
    if (!input.providerOk) return "ERROR";
    const estado = normalizarEstadoEvolution(input.payload);
    if (instanciaWhatsAppEstaConectada(estado)) return estado;
    if (input.qrCode || input.pairingCode) return "PAIRING";
    return estado === "UNKNOWN" ? "CONNECTING" : estado;
  }

  private normalizarNumeroDono(valor: string) {
    const digitos = valor.replace(/\D/g, "");
    if (digitos.startsWith("244")) return digitos;
    return `244${digitos}`;
  }

  private formatarInstancia(instancia: InstanciaWhatsApp) {
    return {
      id: instancia.id,
      negocioId: instancia.negocioId,
      nome: instancia.nome,
      etiqueta: instancia.etiqueta,
      telefone: instancia.telefone,
      status: instancia.status,
      qrCode: instancia.qrCode,
      pairingCode: instancia.pairingCode,
      baseUrl: instancia.baseUrl,
      temApiKeyPropria: Boolean(instancia.apiKey),
      padrao: instancia.padrao,
      ativa: instancia.ativa,
      ultimoErro: instancia.ultimoErro,
      ultimaConexaoEm: instancia.ultimaConexaoEm?.toISOString() ?? null,
      ultimaConsultaEm: instancia.ultimaConsultaEm?.toISOString() ?? null,
      criadaEm: instancia.criadaEm.toISOString(),
      atualizadaEm: instancia.atualizadaEm.toISOString()
    };
  }
}
