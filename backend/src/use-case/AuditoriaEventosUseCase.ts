import type { DespachadorEventos } from "../dominio/eventos/DespachadorEventos.js";
import type { RepositorioAuditoria } from "../dominio/repositorios/contratos.js";
import type { EventoSistema } from "../dominio/tipos.js";

export class AuditoriaEventosUseCase {
  constructor(
    eventos: DespachadorEventos,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly logger: Pick<Console, "error"> = console
  ) {
    eventos.aoReceberQualquer((evento) => {
      void this.registrar(evento).catch((erro) => {
        this.logger.error("[auditoria] Falha ao persistir evento", erro);
      });
    });
  }

  private async registrar(evento: EventoSistema): Promise<void> {
    await this.repositorioAuditoria.registrarEventoSistema(evento);

    if (evento.tipo === "WHATSAPP_MESSAGE_SENT") {
      const dados = evento.dados;
      const telefone = this.obterString(dados.telefone);
      const tipo = this.obterString(dados.tipo);
      const conteudo = this.obterString(dados.conteudo);
      const provider = this.obterString(dados.provider);

      if (telefone && tipo && conteudo && provider) {
        await this.repositorioAuditoria.registrarMensagemWhatsApp({
          negocioId: this.obterString(dados.negocioId) ?? this.obterNegocioIdDoContexto(dados.contexto),
          telefone,
          tipo,
          conteudo,
          provider,
          idExterno: this.obterString(dados.idExterno),
          enviadaEm: this.obterData(dados.enviadoEm)
        });
      }
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_FAILED") {
      const dados = evento.dados;
      const telefone = this.obterString(dados.telefone);
      const tipo = this.obterString(dados.tipo);
      const conteudo = this.obterString(dados.conteudo);
      const erro = this.obterString(dados.erro);

      if (telefone && tipo && conteudo) {
        await this.repositorioAuditoria.registrarMensagemWhatsApp({
          negocioId: this.obterString(dados.negocioId) ?? this.obterNegocioIdDoContexto(dados.contexto),
          telefone,
          tipo: `${tipo}_FALHOU`,
          conteudo: erro ? `${conteudo}\n\nErro: ${erro}` : conteudo,
          provider: "whatsapp-falhou",
          enviadaEm: this.obterData(dados.ocorridoEm)
        });
      }
    }

    if (evento.tipo === "WHATSAPP_MESSAGE_RECEIVED") {
      const mensagem = this.obterObjeto(evento.dados.mensagem);
      const telefone = this.obterString(mensagem.telefone);
      const conteudo = this.obterString(mensagem.texto);

      if (telefone && conteudo) {
        await this.repositorioAuditoria.registrarMensagemWhatsApp({
          negocioId: this.obterString(mensagem.negocioId) ?? this.obterNegocioIdDoContexto(mensagem.payloadOriginal),
          telefone,
          tipo: "RECEBIDA",
          conteudo,
          provider: this.obterString(mensagem.provider) ?? "evolution",
          idExterno: this.obterString(mensagem.idMensagem),
          enviadaEm: this.obterData(mensagem.recebidaEm)
        });
      }
    }
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

  private obterData(valor: unknown): Date | undefined {
    if (valor instanceof Date) return valor;
    if (typeof valor === "string") {
      const data = new Date(valor);
      return Number.isNaN(data.getTime()) ? undefined : data;
    }

    return undefined;
  }
}
