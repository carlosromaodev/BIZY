import type { DespachadorEventos } from "../eventos/DespachadorEventos.js";
import type { CategoriaMensagemWhatsApp, PoliticaEnvioWhatsApp, ProvedorWhatsApp } from "../provedores/ProvedorWhatsApp.js";
import type { NovaTarefaOperacional, Peca, Reserva } from "../tipos.js";
import { PoliticaMensagensWhatsApp } from "./PoliticaMensagensWhatsApp.js";

type TipoMensagemAutomatica =
  | "RESERVA_CRIADA"
  | "FILA_ESPERA"
  | "PAGAMENTO_CONFIRMADO"
  | "RESERVA_CANCELADA"
  | "RESERVA_EXPIRADA"
  | "CHAMADA_FILA"
  | "PECA_VENDIDA"
  | "PEDIR_CODIGO_PECA";

type EstadoAprovacaoTemplateWhatsApp = "aprovado" | "pendente" | "rascunho" | "rejeitado";
type ProviderTemplateWhatsApp = "whatsapp_cloud_api" | "evolution" | "console";

export interface FiltrosTemplatesWhatsApp {
  categoria?: CategoriaMensagemWhatsApp;
  evento?: string;
  provider?: ProviderTemplateWhatsApp;
  apenasAprovados?: boolean;
  estadoAprovacao?: EstadoAprovacaoTemplateWhatsApp;
}

export interface TemplateWhatsApp {
  id: string;
  nome: string;
  tipo: string;
  categoria: CategoriaMensagemWhatsApp;
  idioma: string;
  provider: ProviderTemplateWhatsApp;
  versao: number;
  estadoAprovacao: EstadoAprovacaoTemplateWhatsApp;
  eventosCompativeis: string[];
  descricao: string;
  variaveis: string[];
  corpo: string;
}

export interface DadosMensagemManualWhatsApp {
  negocioId?: string | null;
  telefone: string;
  mensagem?: string;
  templateId?: string;
  variaveis?: Record<string, string>;
  categoria?: CategoriaMensagemWhatsApp;
  consentimentoMarketing?: boolean;
  janelaAtendimentoAtiva?: boolean;
}

type RegistradorTarefaHumana = (dados: NovaTarefaOperacional) => Promise<void> | void;

const templatesWhatsApp: TemplateWhatsApp[] = [
  {
    id: "iban",
    nome: "Dados de pagamento",
    tipo: "MANUAL_IBAN",
    categoria: "utility",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["PAYMENT_PENDING", "PAYMENT_INSTRUCTIONS", "RESERVATION_PAYMENT"],
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
    categoria: "utility",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["RESERVATION_CREATED", "ORDER_CREATED"],
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
    categoria: "utility",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["RESERVATION_EXPIRING", "PAYMENT_REMINDER"],
    descricao: "Lembra o cliente que a reserva está perto de expirar.",
    variaveis: ["nomeCliente", "codigoPeca", "minutosRestantes"],
    corpo: `Olá, {nomeCliente}. A tua reserva da peça {codigoPeca} expira em cerca de {minutosRestantes} minutos.

Se ainda quiseres ficar com ela, envia o comprovativo assim que fizeres o pagamento.`
  },
  {
    id: "comprovativo_pendente",
    nome: "Comprovativo pendente",
    tipo: "MANUAL_COMPROVATIVO_PENDENTE",
    categoria: "utility",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["PAYMENT_PROOF_PENDING", "ORDER_PAYMENT_PROOF_PENDING"],
    descricao: "Pede ao cliente para enviar o comprovativo de um pedido já criado.",
    variaveis: ["nomeCliente", "numeroPedido", "total", "metodoPagamento"],
    corpo: `Olá, {nomeCliente}. O pedido #{numeroPedido} ainda está sem comprovativo de pagamento.

Total: {total}
Método: {metodoPagamento}

Quando terminares o pagamento, envia o comprovativo por aqui para confirmarmos.`
  },
  {
    id: "pagamento_confirmado",
    nome: "Pagamento confirmado",
    tipo: "MANUAL_PAGAMENTO_CONFIRMADO",
    categoria: "utility",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["PAYMENT_CONFIRMED", "ORDER_PAID"],
    descricao: "Confirma pagamento validado pelo vendedor.",
    variaveis: ["nomeCliente", "codigoPeca"],
    corpo: `Pagamento confirmado, {nomeCliente}. A peça {codigoPeca} ficou marcada como paga. Obrigado pela compra!`
  },
  {
    id: "atendimento",
    nome: "Atendimento geral",
    tipo: "MANUAL_ATENDIMENTO",
    categoria: "service",
    idioma: "pt_AO",
    provider: "evolution",
    versao: 1,
    estadoAprovacao: "aprovado",
    eventosCompativeis: ["SERVICE_REPLY", "CUSTOMER_SUPPORT"],
    descricao: "Resposta curta de atendimento humano.",
    variaveis: ["nomeCliente", "mensagem"],
    corpo: `Olá, {nomeCliente}. {mensagem}`
  },
  {
    id: "marketing_reengajamento",
    nome: "Reativação com cupom",
    tipo: "MANUAL_MARKETING_REENGAJAMENTO",
    categoria: "marketing",
    idioma: "pt_AO",
    provider: "whatsapp_cloud_api",
    versao: 1,
    estadoAprovacao: "pendente",
    eventosCompativeis: ["CUSTOMER_REENGAGEMENT", "CAMPAIGN_BROADCAST", "AFFILIATE_PROMOTION"],
    descricao: "Mensagem promocional para clientes com consentimento. Só pode enviar quando estiver aprovada.",
    variaveis: ["nomeCliente", "cupom"],
    corpo: `Olá, {nomeCliente}. Temos novidades na loja e um cupom especial para ti: {cupom}.`
  }
];

export class AutomacaoWhatsApp {
  private readonly ultimosEnvios = new Map<string, number>();
  private readonly intervaloMinimoMs = 30_000;
  private readonly ativo: boolean;
  private readonly politicaWhatsApp = new PoliticaMensagensWhatsApp();

  constructor(
    private readonly provedorWhatsApp: ProvedorWhatsApp,
    private readonly eventos: DespachadorEventos,
    private readonly minutosReserva: number,
    private readonly opcoes: { ativo?: boolean; registrarTarefaHumana?: RegistradorTarefaHumana } = {}
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
    motivo: string,
    negocioId?: string | null
  ): Promise<void> {
    await this.enviarComRateLimit(
      telefone,
      "PEDIR_CODIGO_PECA",
      `Olá, ${nomeCliente}. Vi o teu pedido na live, mas ainda não consegui identificar a peça certa.

Responde com o código da peça que queres reservar, por exemplo: A03 ou peça 4.

Assim que receber o código da peça, confirmo a disponibilidade e sigo com a tua compra.`,
      { comentarioOriginal, motivo, negocioId: negocioId ?? null }
    );
  }

  listarTemplates(filtros: FiltrosTemplatesWhatsApp = {}): TemplateWhatsApp[] {
    return templatesWhatsApp
      .filter((template) => this.templateAtendeFiltros(template, filtros))
      .map((template) => this.clonarTemplate(template));
  }

  async enviarMensagemManual(dados: DadosMensagemManualWhatsApp) {
    try {
      const template = dados.templateId ? this.exigirTemplate(dados.templateId) : null;
      const conteudo = dados.mensagem?.trim() || (template ? this.renderizarTemplate(template, dados.variaveis ?? {}) : "");
      const tipo = template?.tipo ?? "MANUAL";
      const politica = this.politicaWhatsApp.avaliar({
        tipo,
        origem: "manual",
        categoriaSolicitada: dados.categoria,
        categoriaTemplate: template?.categoria,
        consentimentoMarketing: dados.consentimentoMarketing,
        janelaAtendimentoAtiva: dados.janelaAtendimentoAtiva,
        conteudo
      });

      const resultado = await this.enviarSemBloqueioAutomatico(
        dados.telefone,
        tipo,
        conteudo,
        {
          negocioId: dados.negocioId ?? null,
          origem: "painel",
          templateId: template?.id ?? null,
          variaveis: dados.variaveis ?? {}
        },
        politica
      );

      return {
        telefone: dados.telefone,
        tipo,
        conteudo,
        template,
        politica,
        resultado
      };
    } catch (erro) {
      await this.registrarTarefaHumanaBloqueioManual(dados, erro);
      throw erro;
    }
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
      const negocioId = this.extrairNegocioIdDoContexto(contexto);
      const politica = this.politicaWhatsApp.avaliar({
        tipo,
        origem: "automatica",
        janelaAtendimentoAtiva: this.tipoUsaJanelaDeServico(tipo)
      });
      const contextoComPolitica = this.comPolitica(contexto, politica);
      const resultado = await this.provedorWhatsApp.enviarMensagem({
        telefone,
        conteudo,
        tipo,
        categoria: politica.categoria,
        politica,
        contexto: contextoComPolitica
      });
      this.ultimosEnvios.set(chave, agora);

      this.eventos.emitir("WHATSAPP_MESSAGE_SENT", {
        negocioId,
        telefone,
        tipo,
        categoriaWhatsApp: politica.categoria,
        politicaWhatsApp: politica,
        conteudo,
        contexto: contextoComPolitica,
        provider: resultado.provider,
        idExterno: resultado.idExterno,
        enviadoEm: resultado.enviadoEm
      });
    } catch (erro) {
      const negocioId = this.extrairNegocioIdDoContexto(contexto);
      this.eventos.emitir("WHATSAPP_MESSAGE_FAILED", {
        negocioId,
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
    contexto: Record<string, unknown>,
    politica: PoliticaEnvioWhatsApp
  ) {
    const contextoComPolitica = this.comPolitica(contexto, politica);
    const resultado = await this.provedorWhatsApp.enviarMensagem({
      telefone,
      conteudo,
      tipo,
      categoria: politica.categoria,
      politica,
      contexto: contextoComPolitica
    });
    const negocioId = this.extrairNegocioIdDoContexto(contexto);

    this.eventos.emitir("WHATSAPP_MESSAGE_SENT", {
      negocioId,
      telefone,
      tipo,
      categoriaWhatsApp: politica.categoria,
      politicaWhatsApp: politica,
      conteudo,
      contexto: contextoComPolitica,
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

    if (template.estadoAprovacao !== "aprovado") {
      throw new Error(`Template WhatsApp ${templateId} ainda não está aprovado para envio.`);
    }

    return this.clonarTemplate(template);
  }

  private templateAtendeFiltros(template: TemplateWhatsApp, filtros: FiltrosTemplatesWhatsApp): boolean {
    if (filtros.categoria && template.categoria !== filtros.categoria) return false;
    if (filtros.provider && template.provider !== filtros.provider) return false;
    if (filtros.apenasAprovados && template.estadoAprovacao !== "aprovado") return false;
    if (filtros.estadoAprovacao && template.estadoAprovacao !== filtros.estadoAprovacao) return false;
    if (filtros.evento && !template.eventosCompativeis.includes(filtros.evento)) return false;
    return true;
  }

  private clonarTemplate(template: TemplateWhatsApp): TemplateWhatsApp {
    return {
      ...template,
      variaveis: [...template.variaveis],
      eventosCompativeis: [...template.eventosCompativeis]
    };
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

  private extrairNegocioIdDoContexto(contexto: Record<string, unknown>): string | null {
    const reserva = contexto.reserva as Reserva | undefined;
    const peca = contexto.peca as Peca | undefined;
    const negocioId = contexto.negocioId;

    if (typeof negocioId === "string" && negocioId.trim()) return negocioId;
    if (typeof reserva?.negocioId === "string" && reserva.negocioId.trim()) return reserva.negocioId;
    if (typeof peca?.negocioId === "string" && peca.negocioId.trim()) return peca.negocioId;
    return null;
  }

  private comPolitica(contexto: Record<string, unknown>, politica: PoliticaEnvioWhatsApp) {
    return {
      ...contexto,
      politicaWhatsApp: politica
    };
  }

  private tipoUsaJanelaDeServico(tipo: string): boolean {
    return tipo === "PEDIR_CODIGO_PECA" || tipo === "PECA_VENDIDA";
  }

  private async registrarTarefaHumanaBloqueioManual(dados: DadosMensagemManualWhatsApp, erro: unknown) {
    const registrador = this.opcoes.registrarTarefaHumana;
    if (!registrador) return;

    const mensagemErro = erro instanceof Error ? erro.message : "Envio WhatsApp bloqueado por política operacional.";
    await registrador({
      negocioId: dados.negocioId ?? null,
      tipo: "WHATSAPP_POLICY_BLOCKED",
      titulo: "Rever envio WhatsApp bloqueado",
      descricao: mensagemErro,
      prioridade: "ALTA",
      origem: "whatsapp_policy",
      entidadeTipo: dados.templateId ? "whatsapp_template" : "whatsapp_message",
      entidadeId: dados.templateId ?? null,
      clienteTelefone: dados.telefone,
      contexto: {
        erro: mensagemErro,
        whatsapp: {
          telefone: dados.telefone,
          templateId: dados.templateId ?? null,
          categoria: dados.categoria ?? null,
          variaveis: dados.variaveis ?? {},
          janelaAtendimentoAtiva: dados.janelaAtendimentoAtiva ?? null,
          consentimentoMarketing: dados.consentimentoMarketing ?? null
        }
      }
    });
  }

  private formatarKwanza(valor: number): string {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0
    }).format(valor);
  }
}
