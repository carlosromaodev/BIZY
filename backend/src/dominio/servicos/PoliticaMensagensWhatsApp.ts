import type { CategoriaMensagemWhatsApp, PoliticaEnvioWhatsApp } from "../provedores/ProvedorWhatsApp.js";

interface DadosPoliticaMensagemWhatsApp {
  tipo: string;
  origem: PoliticaEnvioWhatsApp["origem"];
  categoriaSolicitada?: CategoriaMensagemWhatsApp | null;
  categoriaTemplate?: CategoriaMensagemWhatsApp | null;
  consentimentoMarketing?: boolean | null;
  janelaAtendimentoAtiva?: boolean | null;
  conteudo?: string | null;
}

const categoriasPorTipoAutomatico: Record<string, CategoriaMensagemWhatsApp> = {
  RESERVA_CRIADA: "utility",
  FILA_ESPERA: "utility",
  PAGAMENTO_CONFIRMADO: "utility",
  RESERVA_CANCELADA: "utility",
  RESERVA_EXPIRADA: "utility",
  CHAMADA_FILA: "utility",
  PECA_VENDIDA: "service",
  PEDIR_CODIGO_PECA: "service",
  CARRINHO_ABANDONADO: "marketing",
  LEAD_FRIO: "marketing",
  CLIENTE_INATIVO: "marketing",
  CAMPANHA_NOVIDADE: "marketing",
  REPOSICAO_PRODUTO: "marketing",
  AFFILIATE_PROMOTION: "marketing",
  CUSTOMER_REENGAGEMENT: "marketing",
  CAMPAIGN_BROADCAST: "marketing"
};

export class PoliticaMensagensWhatsApp {
  avaliar(dados: DadosPoliticaMensagemWhatsApp): PoliticaEnvioWhatsApp {
    const categoria =
      dados.categoriaSolicitada ?? dados.categoriaTemplate ?? categoriasPorTipoAutomatico[dados.tipo] ?? "service";
    const janelaAtendimentoAtiva = dados.janelaAtendimentoAtiva ?? categoria === "service";
    const requerConsentimentoMarketing = categoria === "marketing";
    const requerTemplateOficial = categoria !== "service";

    if (requerConsentimentoMarketing && dados.consentimentoMarketing !== true) {
      throw new Error("Mensagem WhatsApp de marketing exige consentimento explícito do cliente.");
    }

    if (categoria === "service" && !janelaAtendimentoAtiva) {
      throw new Error("Mensagem WhatsApp de serviço só pode ser enviada dentro da janela de atendimento ativa.");
    }

    if (categoria === "authentication" && !dados.categoriaTemplate) {
      throw new Error("Mensagem WhatsApp de autenticação deve usar template oficial aprovado.");
    }

    if ((categoria === "utility" || categoria === "authentication") && this.contemPromocao(dados.conteudo)) {
      throw new Error("Texto promocional não pode ser enviado como utilidade ou autenticação.");
    }

    return {
      categoria,
      origem: dados.origem,
      motivo: this.descreverMotivo(categoria),
      requerTemplateOficial,
      requerConsentimentoMarketing,
      janelaAtendimentoAtiva
    };
  }

  private contemPromocao(conteudo?: string | null): boolean {
    if (!conteudo) return false;
    return /\b(promo[cç][aã]o|desconto|cupom|oferta|liquida[cç][aã]o|black friday|compre agora|novidade exclusiva|s[oó] hoje)\b/iu.test(
      conteudo
    );
  }

  private descreverMotivo(categoria: CategoriaMensagemWhatsApp): string {
    switch (categoria) {
      case "marketing":
        return "Conteúdo promocional, retargeting, oferta ou reativação comercial.";
      case "utility":
        return "Atualização operacional solicitada ou relacionada a pedido, reserva, pagamento ou entrega.";
      case "authentication":
        return "Código de autenticação ou verificação de identidade.";
      case "service":
        return "Resposta dentro da janela de atendimento iniciada pelo cliente.";
    }
  }
}
