import { describe, expect, it } from "vitest";
import { RelatoriosComerciaisUseCase } from "../use-case/RelatoriosComerciaisUseCase.js";
import {
  RepositorioAtendimentoMemoria,
  RepositorioClientesMemoria,
  RepositorioPecasMemoria,
  RepositorioPedidosMemoria,
  RepositorioReservasMemoria,
  RepositorioSocialInboxMemoria,
  RepositorioTarefasOperacionaisMemoria,
  RepositorioTrackingComercialMemoria
} from "../use-case/repositorios/RepositorioMemoria.js";

describe("Relatórios comerciais - oportunidades perdidas", () => {
  it("identifica perguntas sem compra, comprovativos pendentes, social leads e cliques WhatsApp sem pedido", async () => {
    const negocioId = "negocio-oportunidades";
    const pedidos = new RepositorioPedidosMemoria();
    const clientes = new RepositorioClientesMemoria();
    const pecas = new RepositorioPecasMemoria();
    const reservas = new RepositorioReservasMemoria();
    const atendimento = new RepositorioAtendimentoMemoria();
    const tarefas = new RepositorioTarefasOperacionaisMemoria();
    const tracking = new RepositorioTrackingComercialMemoria();
    const socialInbox = new RepositorioSocialInboxMemoria();

    const clientePerguntou = await clientes.salvar({
      negocioId,
      telefone: "937700101",
      nome: "Cliente perguntou",
      origem: "whatsapp",
      consentimentoDados: true,
      consentimentoMarketing: true
    });
    const clientePendente = await clientes.salvar({
      negocioId,
      telefone: "937700102",
      nome: "Cliente pagamento pendente",
      origem: "site",
      consentimentoDados: true,
      consentimentoMarketing: true
    });

    await atendimento.registrarMensagem({
      negocioId,
      clienteNegocioId: clientePerguntou.id,
      telefone: clientePerguntou.telefone!,
      direcao: "INBOUND",
      remetente: "cliente",
      canal: "whatsapp",
      tipo: "RECEBIDA",
      conteudo: "Tem esse vestido no tamanho M?",
      status: "RECEIVED",
      origem: "whatsapp"
    });

    await pedidos.criar({
      negocioId,
      clienteNegocioId: clientePendente.id,
      subtotalEmKwanza: 12_000,
      descontoEmKwanza: 0,
      taxaEntregaEmKwanza: 1_000,
      totalEmKwanza: 13_000,
      estado: "AGUARDANDO_PAGAMENTO",
      estadoPagamento: "PENDENTE",
      estadoEntrega: "PENDENTE",
      origem: "checkout_site",
      canal: "site",
      itens: [
        {
          pecaId: "peca-pendente",
          codigoPeca: "PEND-01",
          nomeProduto: "Camisa pendente",
          quantidade: 1,
          precoUnitarioEmKwanza: 12_000,
          subtotalEmKwanza: 12_000
        }
      ]
    });

    await socialInbox.criar({
      negocioId,
      canal: "instagram",
      provider: "instagram_business",
      tipo: "COMENTARIO",
      estado: "NOVO",
      texto: "Quanto custa?",
      intencao: "COMPRA",
      confianca: 0.92,
      postId: "post-01",
      autorUsername: "cliente_social"
    });

    await tracking.registrarEvento({
      negocioId,
      tipo: "WHATSAPP_CLICK",
      trackingId: "trk-sem-compra",
      origem: "loja_publica",
      canal: "whatsapp",
      metadata: { produtoCodigo: "PEND-01" }
    });

    const relatorios = new RelatoriosComerciaisUseCase(
      pedidos,
      clientes,
      pecas,
      reservas,
      atendimento,
      tarefas,
      tracking,
      socialInbox
    );

    const relatorio = await relatorios.gerarRelatorio(negocioId);

    expect(relatorio.oportunidadesPerdidas).toEqual(
      expect.objectContaining({
        clientesQuePerguntaramENaoCompraram: 1,
        comprovativosNaoEnviados: 1,
        socialLeadsSemAtendimento: 1,
        whatsappClicksSemCompra: 1
      })
    );
  });
});
