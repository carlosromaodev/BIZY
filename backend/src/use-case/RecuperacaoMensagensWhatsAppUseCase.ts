import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { ProvedorWhatsApp } from "../dominio/provedores/ProvedorWhatsApp.js";
import type { RepositorioAuditoria } from "../dominio/repositorios/contratos.js";
import type { EventoSistema, RegistroOutboxMensagemWhatsApp } from "../dominio/tipos.js";

interface OpcoesRecuperacaoMensagensWhatsApp {
  ativo?: boolean;
  maxTentativas?: number;
  limitePorCiclo?: number;
  atrasoInicialMs?: number;
  atrasoMaximoMs?: number;
  intervaloReprocessamentoMs?: number;
  logger?: Pick<Console, "warn" | "error">;
}

interface DadosFalhaWhatsApp {
  negocioId?: string | null;
  telefone: string;
  tipo: string;
  conteudo: string;
  contexto?: Record<string, unknown>;
  erro?: string;
  ocorridoEm?: Date;
}

export class RecuperacaoMensagensWhatsAppUseCase {
  private readonly ativo: boolean;
  private readonly maxTentativas: number;
  private readonly limitePorCiclo: number;
  private readonly atrasoInicialMs: number;
  private readonly atrasoMaximoMs: number;
  private readonly logger: Pick<Console, "warn" | "error">;
  private readonly removerOuvinte?: () => void;
  private readonly intervalo?: NodeJS.Timeout;
  private processando = false;

  constructor(
    eventos: DespachadorEventos,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly provedorWhatsApp: ProvedorWhatsApp,
    opcoes: OpcoesRecuperacaoMensagensWhatsApp = {}
  ) {
    this.ativo = opcoes.ativo ?? true;
    this.maxTentativas = Math.max(1, opcoes.maxTentativas ?? 5);
    this.limitePorCiclo = Math.max(1, opcoes.limitePorCiclo ?? 25);
    this.atrasoInicialMs = Math.max(0, opcoes.atrasoInicialMs ?? 60_000);
    this.atrasoMaximoMs = Math.max(this.atrasoInicialMs, opcoes.atrasoMaximoMs ?? 30 * 60_000);
    this.logger = opcoes.logger ?? console;

    if (this.ativo) {
      this.removerOuvinte = eventos.aoReceber("WHATSAPP_MESSAGE_FAILED", (evento) => {
        void this.registrarFalhaDeEvento(evento).catch((erro) => {
          this.logger.error("[whatsapp-outbox] Falha ao registrar mensagem para recuperação", erro);
        });
      });

      const intervaloMs = opcoes.intervaloReprocessamentoMs ?? 30_000;
      if (intervaloMs > 0) {
        this.intervalo = setInterval(() => {
          void this.reprocessarPendentes().catch((erro) => {
            this.logger.error("[whatsapp-outbox] Falha ao reprocessar mensagens", erro);
          });
        }, intervaloMs);
        this.intervalo.unref?.();
      }
    }
  }

  async registrarFalha(dados: DadosFalhaWhatsApp) {
    return this.repositorioAuditoria.criarMensagemWhatsAppPendente({
      negocioId: dados.negocioId ?? this.obterNegocioIdDoContexto(dados.contexto),
      telefone: dados.telefone,
      tipo: dados.tipo,
      conteudo: dados.conteudo,
      contexto: dados.contexto ?? {},
      ultimoErro: dados.erro ?? "Falha desconhecida ao enviar WhatsApp.",
      maxTentativas: this.maxTentativas,
      proximaTentativaEm: new Date((dados.ocorridoEm ?? new Date()).getTime() + this.atrasoInicialMs)
    });
  }

  async reprocessarPendentes(
    opcoes: { agora?: Date; incluirFalhadas?: boolean; limite?: number; negocioId?: string | null } = {}
  ) {
    if (this.processando) {
      return { processadas: 0, enviadas: 0, falhadas: 0 };
    }

    this.processando = true;
    try {
      const agora = opcoes.agora ?? new Date();
      const limite = Math.max(1, Math.min(opcoes.limite ?? this.limitePorCiclo, 100));
      const mensagens = await this.repositorioAuditoria.listarMensagensWhatsAppPendentes(limite, agora, {
        incluirFalhadas: opcoes.incluirFalhadas,
        negocioId: opcoes.negocioId
      });
      let enviadas = 0;
      let falhadas = 0;

      for (const mensagem of mensagens) {
        const enviada = await this.reprocessarMensagem(mensagem, agora);
        if (enviada) enviadas += 1;
        else falhadas += 1;
      }

      return { processadas: mensagens.length, enviadas, falhadas };
    } finally {
      this.processando = false;
    }
  }

  async fechar(): Promise<void> {
    this.removerOuvinte?.();
    if (this.intervalo) clearInterval(this.intervalo);
  }

  private async registrarFalhaDeEvento(evento: EventoSistema): Promise<void> {
    const telefone = this.obterString(evento.dados.telefone);
    const tipo = this.obterString(evento.dados.tipo);
    const conteudo = this.obterString(evento.dados.conteudo);

    if (!telefone || !tipo || !conteudo) {
      return;
    }

    await this.registrarFalha({
      telefone,
      tipo,
      conteudo,
      negocioId: this.obterString(evento.dados.negocioId) ?? this.obterNegocioIdDoContexto(evento.dados.contexto),
      contexto: this.obterObjeto(evento.dados.contexto),
      erro: this.obterString(evento.dados.erro) ?? undefined,
      ocorridoEm: this.obterData(evento.dados.ocorridoEm) ?? evento.criadoEm
    });
  }

  private async reprocessarMensagem(registro: RegistroOutboxMensagemWhatsApp, agora: Date): Promise<boolean> {
    try {
      const resultado = await this.provedorWhatsApp.enviarMensagem({
        telefone: registro.telefone,
        tipo: registro.tipo,
        conteudo: registro.conteudo,
        contexto: registro.contexto
      });

      await this.repositorioAuditoria.marcarMensagemWhatsAppEnviada(registro.id, {
        provider: resultado.provider,
        idExterno: resultado.idExterno,
        enviadaEm: resultado.enviadoEm
      });
      return true;
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : "Falha desconhecida ao reenviar WhatsApp.";
      const tentativasDepois = registro.tentativas + 1;
      const falhaFinal = tentativasDepois >= registro.maxTentativas;

      await this.repositorioAuditoria.marcarMensagemWhatsAppFalha(
        registro.id,
        mensagemErro,
        this.calcularProximaTentativa(tentativasDepois, agora),
        { falhaFinal }
      );

      this.logger.warn(
        `[whatsapp-outbox] Reenvio ${falhaFinal ? "esgotou tentativas" : "ficou pendente"} para ${registro.telefone}: ${mensagemErro}`
      );
      return false;
    }
  }

  private calcularProximaTentativa(tentativas: number, agora: Date): Date {
    const atraso = Math.min(this.atrasoMaximoMs, this.atrasoInicialMs * 2 ** Math.max(0, tentativas - 1));
    return new Date(agora.getTime() + atraso);
  }

  private obterObjeto(valor: unknown): Record<string, unknown> {
    return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as Record<string, unknown>) : {};
  }

  private obterNegocioIdDoContexto(contexto: unknown): string | null {
    const dados = this.obterObjeto(contexto);
    const reserva = this.obterObjeto(dados.reserva);
    const peca = this.obterObjeto(dados.peca);
    return this.obterString(dados.negocioId) ?? this.obterString(reserva.negocioId) ?? this.obterString(peca.negocioId);
  }

  private obterString(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim().length > 0 ? valor : null;
  }

  private obterData(valor: unknown): Date | null {
    if (valor instanceof Date) return valor;
    if (typeof valor === "string") {
      const data = new Date(valor);
      return Number.isNaN(data.getTime()) ? null : data;
    }

    return null;
  }
}
