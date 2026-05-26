import type {
  RepositorioAuditoria,
  RepositorioCampanhas,
  RepositorioClientes,
  RepositorioTemplatesWhatsApp
} from "../dominio/repositorios/contratos.js";
import { PoliticaMensagensWhatsApp } from "../dominio/servicos/PoliticaMensagensWhatsApp.js";
import type {
  CampanhaCrm,
  Cliente360,
  EstadoCampanhaCrm,
  FiltrosCampanhasCrm,
  MetricasCampanhaCrm,
  NovoTemplateWhatsAppNegocio,
  TemplateWhatsAppNegocio
} from "../dominio/tipos.js";
import type { CategoriaMensagemWhatsApp } from "../dominio/provedores/ProvedorWhatsApp.js";

export interface DadosCriarCampanhaCrm {
  negocioId: string;
  usuarioId?: string | null;
  nome: string;
  objetivo: string;
  canal: string;
  templateId: string;
  categoria: CategoriaMensagemWhatsApp;
  segmento?: Record<string, unknown>;
  limiteDiario?: number;
  janelaEnvio?: {
    inicio?: Date | null;
    fim?: Date | null;
  };
}

function metricasCampanhaZeradas(): MetricasCampanhaCrm {
  return {
    selecionados: 0,
    bloqueados: 0,
    enfileirados: 0,
    enviados: 0,
    entregues: 0,
    lidos: 0,
    respondidos: 0,
    falhados: 0,
    pedidosGerados: 0,
    receitaAtribuidaEmKwanza: 0
  };
}

export class GestaoCampanhasCrmUseCase {
  private readonly politicaWhatsApp = new PoliticaMensagensWhatsApp();

  constructor(
    private readonly campanhas: RepositorioCampanhas,
    private readonly templates: RepositorioTemplatesWhatsApp,
    private readonly clientes: RepositorioClientes,
    private readonly auditoria: RepositorioAuditoria
  ) {}

  criarTemplate(dados: NovoTemplateWhatsAppNegocio) {
    return this.templates.criar({
      ...dados,
      idioma: dados.idioma ?? "pt_AO",
      provider: dados.provider ?? "whatsapp_cloud_api",
      estadoAprovacao: dados.estadoAprovacao ?? "rascunho",
      eventosCompativeis: dados.eventosCompativeis ?? [],
      variaveis: dados.variaveis ?? [],
      ativo: dados.ativo ?? true
    });
  }

  listarTemplates(negocioId: string) {
    return this.templates.listar(negocioId);
  }

  async atualizarTemplate(
    id: string,
    negocioId: string,
    dados: Parameters<RepositorioTemplatesWhatsApp["atualizar"]>[2]
  ) {
    const template = await this.templates.atualizar(id, negocioId, {
      ...dados,
      motivoUltimaAlteracao: dados.motivoUltimaAlteracao ?? dados.motivoUltimaAlteracao
    });
    if (!template) throw new Error(`Template WhatsApp ${id} não encontrado.`);
    return template;
  }

  listarCampanhas(negocioId: string, filtros: FiltrosCampanhasCrm = {}) {
    return this.campanhas.listar(negocioId, filtros);
  }

  async criarCampanha(dados: DadosCriarCampanhaCrm) {
    const template = await this.exigirTemplateAprovado(dados.templateId, dados.negocioId);
    if (template.categoria !== dados.categoria) {
      throw new Error("Categoria da campanha não corresponde à categoria do template aprovado.");
    }
    if (dados.categoria !== "marketing") {
      throw new Error("Campanhas WhatsApp devem usar categoria marketing.");
    }

    const campanha = await this.campanhas.criar({
      negocioId: dados.negocioId,
      nome: dados.nome,
      objetivo: dados.objetivo,
      canal: dados.canal,
      templateId: dados.templateId,
      categoria: dados.categoria,
      segmento: dados.segmento ?? {},
      limiteDiario: dados.limiteDiario,
      janelaInicio: dados.janelaEnvio?.inicio ?? null,
      janelaFim: dados.janelaEnvio?.fim ?? null,
      criadaPorUsuarioId: dados.usuarioId ?? null
    });

    const preview = await this.prepararDestinatarios(campanha, template);
    await this.campanhas.atualizar(campanha.id, campanha.negocioId, {
      metricas: {
        ...campanha.metricas,
        selecionados: preview.selecionados,
        bloqueados: preview.bloqueados
      }
    });

    return {
      campanha: (await this.campanhas.buscarPorId(campanha.id, campanha.negocioId)) ?? campanha,
      preview
    };
  }

  async confirmarCampanha(id: string, negocioId: string) {
    const campanha = await this.exigirCampanha(id, negocioId);
    if (campanha.estado === "PAUSADA") throw new Error("Campanha pausada não pode ser confirmada antes de ser reativada.");
    if (campanha.estado !== "RASCUNHO" && campanha.estado !== "AGENDADA") {
      throw new Error(`Campanha em estado ${campanha.estado} não pode ser confirmada.`);
    }

    const template = await this.exigirTemplateAprovado(campanha.templateId, negocioId);
    const preview = await this.prepararDestinatarios(campanha, template);
    const itens = [];
    let enfileirados = 0;

    for (const destinatario of preview.destinatarios) {
      const conteudo = this.renderizar(template, destinatario.cliente);
      const politica = this.politicaWhatsApp.avaliar({
        tipo: "CAMPANHA_WHATSAPP",
        origem: "automatica",
        categoriaSolicitada: campanha.categoria,
        categoriaTemplate: template.categoria,
        consentimentoMarketing: destinatario.cliente.consentimentoMarketing,
        janelaAtendimentoAtiva: false,
        conteudo
      });
      const outbox = await this.auditoria.criarMensagemWhatsAppPendente({
        negocioId,
        telefone: destinatario.cliente.telefone ?? "",
        tipo: "CAMPANHA_WHATSAPP",
        conteudo,
        contexto: {
          campanhaId: campanha.id,
          templateId: template.id,
          politicaWhatsApp: politica,
          objetivo: campanha.objetivo,
          segmento: campanha.segmento
        }
      });
      enfileirados += 1;
      itens.push({
        negocioId,
        campanhaId: campanha.id,
        clienteId: destinatario.cliente.id,
        telefone: destinatario.cliente.telefone,
        nomeCliente: destinatario.cliente.nome,
        status: "ENFILEIRADO" as const,
        outboxMensagemId: outbox.id,
        contexto: { templateId: template.id }
      });
    }

    for (const bloqueio of preview.bloqueios) {
      itens.push({
        negocioId,
        campanhaId: campanha.id,
        clienteId: bloqueio.cliente.id,
        telefone: bloqueio.cliente.telefone,
        nomeCliente: bloqueio.cliente.nome,
        status: "BLOQUEADO" as const,
        motivoBloqueio: bloqueio.motivo,
        contexto: { templateId: template.id }
      });
    }

    await this.campanhas.registrarItens(campanha.id, itens);
    const metricas: MetricasCampanhaCrm = {
      ...campanha.metricas,
      selecionados: preview.selecionados,
      bloqueados: preview.bloqueados,
      enfileirados
    };
    const atualizada = await this.campanhas.atualizar(campanha.id, negocioId, {
      estado: "AGENDADA",
      metricas,
      confirmadaEm: new Date()
    });

    return {
      campanha: atualizada ?? campanha,
      resultado: { enfileirados, bloqueados: preview.bloqueados }
    };
  }

  async pausarCampanha(id: string, negocioId: string, motivo: string) {
    const campanha = await this.exigirCampanha(id, negocioId);
    const atualizada = await this.campanhas.atualizar(campanha.id, negocioId, {
      estado: "PAUSADA",
      pausadaEm: new Date(),
      motivoPausa: motivo
    });
    return atualizada ?? campanha;
  }

  async obterResultados(id: string, negocioId: string) {
    const campanha = await this.exigirCampanha(id, negocioId);
    const itens = await this.campanhas.listarItens(id, negocioId);
    const metricas = itens.reduce(
      (acumulador, item) => {
        if (item.status === "BLOQUEADO") acumulador.bloqueados += 1;
        if (item.status === "ENFILEIRADO") acumulador.enfileirados += 1;
        if (item.status === "ENVIADO") acumulador.enviados += 1;
        if (item.status === "ENTREGUE") acumulador.entregues += 1;
        if (item.status === "LIDO") acumulador.lidos += 1;
        if (item.status === "RESPONDIDO") acumulador.respondidos += 1;
        if (item.status === "FALHOU") acumulador.falhados += 1;
        if (item.status === "CONVERTIDO") acumulador.pedidosGerados += 1;
        return acumulador;
      },
      {
        ...metricasCampanhaZeradas(),
        selecionados: campanha.metricas.selecionados,
        receitaAtribuidaEmKwanza: campanha.metricas.receitaAtribuidaEmKwanza
      }
    );

    return { campanha, itens, metricas };
  }

  private async exigirCampanha(id: string, negocioId: string): Promise<CampanhaCrm> {
    const campanha = await this.campanhas.buscarPorId(id, negocioId);
    if (!campanha) throw new Error(`Campanha ${id} não encontrada.`);
    return campanha;
  }

  private async exigirTemplateAprovado(id: string, negocioId: string): Promise<TemplateWhatsAppNegocio> {
    const template = await this.templates.buscarPorId(id, negocioId);
    if (!template) throw new Error(`Template WhatsApp ${id} não encontrado.`);
    if (!template.ativo) throw new Error(`Template WhatsApp ${template.nome} está desativado.`);
    if (template.estadoAprovacao !== "aprovado") {
      throw new Error(`Template WhatsApp ${template.nome} não está aprovado para disparo.`);
    }
    return template;
  }

  private async prepararDestinatarios(campanha: CampanhaCrm, template: TemplateWhatsAppNegocio) {
    const clientes = await this.clientes.listar(campanha.negocioId, { limite: campanha.limiteDiario });
    const elegiveis = clientes.filter((cliente) => this.clienteAtendeSegmento(cliente, campanha.segmento));
    const destinatarios = [];
    const bloqueios = [];

    for (const cliente of elegiveis) {
      if (!cliente.telefone) {
        bloqueios.push({ cliente, motivo: "Cliente sem telefone para campanha WhatsApp." });
        continue;
      }

      try {
        this.politicaWhatsApp.avaliar({
          tipo: "CAMPANHA_WHATSAPP",
          origem: "automatica",
          categoriaTemplate: template.categoria,
          consentimentoMarketing: cliente.consentimentoMarketing,
          janelaAtendimentoAtiva: false,
          conteudo: template.corpo
        });
        destinatarios.push({ cliente });
      } catch (erro) {
        bloqueios.push({
          cliente,
          motivo: erro instanceof Error ? erro.message : "Cliente bloqueado por política WhatsApp."
        });
      }
    }

    return {
      selecionados: destinatarios.length,
      bloqueados: bloqueios.length,
      destinatarios,
      bloqueios
    };
  }

  private clienteAtendeSegmento(cliente: Cliente360, segmento: Record<string, unknown>): boolean {
    const tags = segmento.tags;
    if (Array.isArray(tags) && tags.length > 0) {
      return tags.some((tag) => typeof tag === "string" && cliente.tags.includes(tag));
    }
    const estadoRelacionamento = segmento.estadoRelacionamento;
    if (typeof estadoRelacionamento === "string" && cliente.estadoRelacionamento !== estadoRelacionamento) return false;
    return true;
  }

  private renderizar(template: TemplateWhatsAppNegocio, cliente: Cliente360): string {
    const variaveis: Record<string, string> = {
      nomeCliente: cliente.nome ?? cliente.username ?? "cliente",
      telefone: cliente.telefone ?? ""
    };

    return template.corpo.replace(/\{([a-zA-Z0-9_]+)\}/g, (_trecho, chave: string) => variaveis[chave] ?? "-");
  }
}
