import type { DespachadorEventos } from "../eventos/DespachadorEventos.js";
import type { ProvedorWhatsApp } from "../provedores/ProvedorWhatsApp.js";
import type { Peca, Reserva } from "../tipos.js";

type TipoMensagemAutomatica =
  | "RESERVA_CRIADA"
  | "FILA_ESPERA"
  | "PAGAMENTO_CONFIRMADO"
  | "RESERVA_CANCELADA"
  | "RESERVA_EXPIRADA"
  | "CHAMADA_FILA"
  | "PECA_VENDIDA"
  | "PEDIR_CODIGO_PECA";

export interface TemplateWhatsApp {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  variaveis: string[];
  corpo: string;
}

export interface DadosMensagemManualWhatsApp {
  telefone: string;
  mensagem?: string;
  templateId?: string;
  variaveis?: Record<string, string>;
}

const templatesWhatsApp: TemplateWhatsApp[] = [
  {
    id: "iban",
    nome: "Dados de pagamento",
    tipo: "MANUAL_IBAN",
    descricao: "Envia IBAN, titular e referência para pagamento.",
    variaveis: ["nomeCliente", "codigoPeca", "nomePeca", "preco", "iban", "titular", "referencia"],
    corpo: `Olá, {nomeCliente}. Seguem os dados para pagamento da tua reserva.

Peça: {codigoPeca} {nomePeca}
Valor: {preco}
IBAN: {iban}
Titular: {titular}
Referência: {referencia}

Depois de pagar, envia o comprovativo por aqui para confirmação.`
  },
  {
    id: "reserva",
    nome: "Confirmação de reserva",
    tipo: "MANUAL_RESERVA",
    descricao: "Confirma manualmente uma reserva feita durante a live.",
    variaveis: ["nomeCliente", "codigoPeca", "nomePeca", "preco", "minutosReserva"],
    corpo: `Olá, {nomeCliente}. A peça {codigoPeca} {nomePeca} ficou reservada para ti por {minutosReserva} minutos.

Valor: {preco}
Para garantir a compra, faz o pagamento e envia o comprovativo.`
  },
  {
    id: "lembrete",
    nome: "Lembrete de expiração",
    tipo: "MANUAL_LEMBRETE",
    descricao: "Lembra o cliente que a reserva está perto de expirar.",
    variaveis: ["nomeCliente", "codigoPeca", "minutosRestantes"],
    corpo: `Olá, {nomeCliente}. A tua reserva da peça {codigoPeca} expira em cerca de {minutosRestantes} minutos.

Se ainda quiseres ficar com ela, envia o comprovativo assim que fizeres o pagamento.`
  },
  {
    id: "pagamento_confirmado",
    nome: "Pagamento confirmado",
    tipo: "MANUAL_PAGAMENTO_CONFIRMADO",
    descricao: "Confirma pagamento validado pelo vendedor.",
    variaveis: ["nomeCliente", "codigoPeca"],
    corpo: `Pagamento confirmado, {nomeCliente}. A peça {codigoPeca} ficou marcada como paga. Obrigado pela compra!`
  },
  {
    id: "atendimento",
    nome: "Atendimento geral",
    tipo: "MANUAL_ATENDIMENTO",
    descricao: "Resposta curta de atendimento humano.",
    variaveis: ["nomeCliente", "mensagem"],
    corpo: `Olá, {nomeCliente}. {mensagem}`
  }
];

export class AutomacaoWhatsApp {
  private readonly ultimosEnvios = new Map<string, number>();
  private readonly intervaloMinimoMs = 30_000;
  private readonly ativo: boolean;

  constructor(
    private readonly provedorWhatsApp: ProvedorWhatsApp,
    private readonly eventos: DespachadorEventos,
    private readonly minutosReserva: number,
    opcoes: { ativo?: boolean } = {}
  ) {
    this.ativo = opcoes.ativo ?? true;
  }

  async notificarReservaCriada(reserva: Reserva, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "RESERVA_CRIADA",
      `Olá, ${reserva.nomeCliente}. Recebemos o teu pedido da peça #${peca.codigo}.

A peça foi reservada temporariamente para ti por ${this.minutosReserva} minutos.

Preço: ${this.formatarKwanza(peca.precoEmKwanza)}
Pagamento: enviaremos os dados de pagamento por aqui.

Após o pagamento, envia o comprovativo por aqui para confirmação.`,
      { reserva, peca }
    );
  }

  async notificarFilaEspera(reserva: Reserva, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "FILA_ESPERA",
      `Olá, ${reserva.nomeCliente}. A peça #${peca.codigo} já está reservada neste momento.

Colocamos o teu pedido na fila de espera. Se a reserva atual expirar ou for cancelada, vamos chamar-te por aqui.`,
      { reserva, peca }
    );
  }

  async notificarPagamentoConfirmado(reserva: Reserva, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "PAGAMENTO_CONFIRMADO",
      `Pagamento confirmado, ${reserva.nomeCliente}. A peça #${peca.codigo} ficou marcada como paga. Obrigado pela compra!`,
      { reserva, peca }
    );
  }

  async notificarCancelamento(reserva: Reserva, peca: Peca, motivo: string): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "RESERVA_CANCELADA",
      `Olá, ${reserva.nomeCliente}. A reserva da peça #${peca.codigo} foi cancelada.

Motivo: ${motivo}`,
      { reserva, peca, motivo }
    );
  }

  async notificarReservaExpirada(reserva: Reserva, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "RESERVA_EXPIRADA",
      `Olá, ${reserva.nomeCliente}. A reserva temporária da peça #${peca.codigo} expirou porque o pagamento não foi confirmado dentro do prazo.`,
      { reserva, peca }
    );
  }

  async notificarChamadoFila(reserva: Reserva, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      reserva.telefoneCliente,
      "CHAMADA_FILA",
      `Olá, ${reserva.nomeCliente}. Chegou a tua vez na fila da peça #${peca.codigo}.

A peça está reservada para ti por ${this.minutosReserva} minutos. Para garantir a compra, faz o pagamento e envia o comprovativo por aqui.`,
      { reserva, peca }
    );
  }

  async notificarPecaVendida(telefone: string, nomeCliente: string, peca: Peca): Promise<void> {
    await this.enviarComRateLimit(
      telefone,
      "PECA_VENDIDA",
      `Olá, ${nomeCliente}. A peça #${peca.codigo} já foi vendida ou está esgotada. Vamos avisar-te quando houver novidades semelhantes.`,
      { peca }
    );
  }

  async solicitarCodigoPeca(
    telefone: string,
    nomeCliente: string,
    comentarioOriginal: string,
    motivo: string
  ): Promise<void> {
    await this.enviarComRateLimit(
      telefone,
      "PEDIR_CODIGO_PECA",
      `Olá, ${nomeCliente}. Vi o teu pedido na live, mas ainda não consegui identificar a peça certa.

Responde com o código da peça que queres reservar, por exemplo: A03 ou peça 4.

Assim que receber o código da peça, confirmo a disponibilidade e sigo com a tua compra.`,
      { comentarioOriginal, motivo }
    );
  }

  listarTemplates(): TemplateWhatsApp[] {
    return templatesWhatsApp.map((template) => ({ ...template }));
  }

  async enviarMensagemManual(dados: DadosMensagemManualWhatsApp) {
    const template = dados.templateId ? this.exigirTemplate(dados.templateId) : null;
    const conteudo = dados.mensagem?.trim() || (template ? this.renderizarTemplate(template, dados.variaveis ?? {}) : "");
    const tipo = template?.tipo ?? "MANUAL";

    const resultado = await this.enviarSemBloqueioAutomatico(dados.telefone, tipo, conteudo, {
      origem: "painel",
      templateId: template?.id ?? null,
      variaveis: dados.variaveis ?? {}
    });

    return {
      telefone: dados.telefone,
      tipo,
      conteudo,
      template,
      resultado
    };
  }

  private async enviarComRateLimit(
    telefone: string,
    tipo: TipoMensagemAutomatica,
    conteudo: string,
    contexto: Record<string, unknown>
  ): Promise<void> {
    if (!this.ativo) {
      return;
    }

    const chave = `${telefone}:${tipo}:${JSON.stringify(this.extrairChaveContexto(contexto))}`;
    const agora = Date.now();
    const ultimoEnvio = this.ultimosEnvios.get(chave) ?? 0;

    if (agora - ultimoEnvio < this.intervaloMinimoMs) {
      return;
    }

    try {
      const resultado = await this.provedorWhatsApp.enviarMensagem({ telefone, conteudo, tipo, contexto });
      this.ultimosEnvios.set(chave, agora);

      this.eventos.emitir("WHATSAPP_MESSAGE_SENT", {
        telefone,
        tipo,
        conteudo,
        contexto,
        provider: resultado.provider,
        idExterno: resultado.idExterno,
        enviadoEm: resultado.enviadoEm
      });
    } catch (erro) {
      this.eventos.emitir("WHATSAPP_MESSAGE_FAILED", {
        telefone,
        tipo,
        conteudo,
        contexto,
        erro: erro instanceof Error ? erro.message : "Falha desconhecida ao enviar WhatsApp.",
        ocorridoEm: new Date()
      });
    }
  }

  private async enviarSemBloqueioAutomatico(
    telefone: string,
    tipo: string,
    conteudo: string,
    contexto: Record<string, unknown>
  ) {
    const resultado = await this.provedorWhatsApp.enviarMensagem({ telefone, conteudo, tipo, contexto });

    this.eventos.emitir("WHATSAPP_MESSAGE_SENT", {
      telefone,
      tipo,
      conteudo,
      contexto,
      provider: resultado.provider,
      idExterno: resultado.idExterno,
      enviadoEm: resultado.enviadoEm
    });

    return resultado;
  }

  private exigirTemplate(templateId: string): TemplateWhatsApp {
    const template = templatesWhatsApp.find((item) => item.id === templateId);

    if (!template) {
      throw new Error(`Template WhatsApp ${templateId} não encontrado.`);
    }

    return template;
  }

  private renderizarTemplate(template: TemplateWhatsApp, variaveis: Record<string, string>): string {
    return template.corpo.replace(/\{([a-zA-Z0-9_]+)\}/g, (_trecho, chave: string) => {
      const valor = variaveis[chave];
      return valor && valor.trim().length > 0 ? valor : "-";
    });
  }

  private extrairChaveContexto(contexto: Record<string, unknown>): Record<string, unknown> {
    const reserva = contexto.reserva as Reserva | undefined;
    const peca = contexto.peca as Peca | undefined;

    return {
      reservaId: reserva?.id,
      codigoPeca: peca?.codigo
    };
  }

  private formatarKwanza(valor: number): string {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0
    }).format(valor);
  }
}
