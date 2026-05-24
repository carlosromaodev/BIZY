import { createHmac } from "node:crypto";
import type { DespachadorEventos } from "../../dominio/eventos/DespachadorEventos.js";
import type { RepositorioAuditoria } from "../../dominio/repositorios/contratos.js";
import { eventosEnviadosAoN8n, type EventoSistema, type RegistroOutboxEventoN8n } from "../../dominio/tipos.js";

interface OpcoesPublicadorEventosN8n {
  webhookUrl?: string;
  segredo?: string;
  ativo?: boolean;
  repositorioAuditoria?: RepositorioAuditoria;
  intervaloReprocessamentoMs?: number;
  logger?: Pick<Console, "info" | "warn" | "error">;
}

export class PublicadorEventosN8n {
  private readonly webhookUrl: string | undefined;
  private readonly segredo: string | undefined;
  private readonly ativo: boolean;
  private readonly repositorioAuditoria: RepositorioAuditoria | undefined;
  private readonly logger: Pick<Console, "info" | "warn" | "error">;
  private readonly intervalo?: NodeJS.Timeout;
  private processandoPendentes = false;

  constructor(eventos: DespachadorEventos, opcoes: OpcoesPublicadorEventosN8n = {}) {
    this.webhookUrl = opcoes.webhookUrl;
    this.segredo = opcoes.segredo;
    this.ativo = opcoes.ativo ?? true;
    this.repositorioAuditoria = opcoes.repositorioAuditoria;
    this.logger = opcoes.logger ?? console;

    eventos.aoReceberQualquer((evento) => {
      if (this.devePublicar(evento)) {
        void this.enfileirarOuPublicar(evento).catch((erro) => {
          this.logger.error("[n8n] Falha ao publicar evento", erro);
        });
      }
    });

    if (this.repositorioAuditoria) {
      this.intervalo = setInterval(
        () => void this.processarPendentes().catch((erro) => this.logger.error("[n8n] Falha ao reprocessar outbox", erro)),
        opcoes.intervaloReprocessamentoMs ?? 15_000
      );
      this.intervalo.unref?.();
    }
  }

  private devePublicar(evento: EventoSistema): boolean {
    return this.ativo && Boolean(this.webhookUrl) && (eventosEnviadosAoN8n as readonly string[]).includes(evento.tipo);
  }

  async fechar(): Promise<void> {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  private async enfileirarOuPublicar(evento: EventoSistema): Promise<void> {
    if (!this.repositorioAuditoria) {
      await this.publicar(evento);
      return;
    }

    const registro = await this.repositorioAuditoria.criarEventoN8n(evento);
    await this.publicarRegistro(registro);
  }

  private async processarPendentes(): Promise<void> {
    if (!this.repositorioAuditoria || this.processandoPendentes || !this.ativo || !this.webhookUrl) return;

    this.processandoPendentes = true;
    try {
      const pendentes = await this.repositorioAuditoria.listarEventosN8nPendentes(25, new Date());

      for (const registro of pendentes) {
        await this.publicarRegistro(registro);
      }
    } finally {
      this.processandoPendentes = false;
    }
  }

  private async publicarRegistro(registro: RegistroOutboxEventoN8n): Promise<void> {
    if (!this.repositorioAuditoria) return;

    const evento: EventoSistema = {
      id: registro.eventoId,
      tipo: registro.tipo,
      dados: registro.payload,
      criadoEm: registro.criadoEm
    };

    try {
      await this.publicar(evento);
      await this.repositorioAuditoria.marcarEventoN8nPublicado(registro.id, new Date());
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Falha desconhecida ao publicar no n8n.";
      const atrasoMs = Math.min(60_000, 1000 * 2 ** Math.min(registro.tentativas + 1, 6));
      await this.repositorioAuditoria.marcarEventoN8nFalha(
        registro.id,
        mensagem,
        new Date(Date.now() + atrasoMs)
      );
      this.logger.warn(`[n8n] Evento ${registro.tipo} ficou pendente na outbox: ${mensagem}`);
    }
  }

  private async publicar(evento: EventoSistema): Promise<void> {
    if (!this.webhookUrl) return;

    const corpo = JSON.stringify({
      eventId: evento.id,
      eventType: evento.tipo,
      occurredAt: evento.criadoEm.toISOString(),
      source: "emeu-backend",
      payload: evento.dados
    });
    const timestamp = new Date().toISOString();
    const assinatura = this.segredo ? this.assinar(corpo, timestamp, this.segredo) : undefined;

    const resposta = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-EMEU-EVENTO": evento.tipo,
        "X-EMEU-TIMESTAMP": timestamp,
        ...(assinatura ? { "X-EMEU-ASSINATURA": assinatura } : {})
      },
      body: corpo
    });

    if (!resposta.ok) {
      throw new Error(`Webhook respondeu ${resposta.status} para ${evento.tipo}`);
    }

    this.logger.info(`[n8n] Evento publicado: ${evento.tipo}`);
  }

  private assinar(corpo: string, timestamp: string, segredo: string): string {
    return createHmac("sha256", segredo).update(`${timestamp}.${corpo}`).digest("hex");
  }
}
