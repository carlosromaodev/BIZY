import { randomUUID } from "node:crypto";
import type {
  RepositorioAtendimento,
  RepositorioClientes,
  RepositorioPecas,
  RepositorioPedidos,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import { normalizarEmail, normalizarTelefone } from "../dominio/servicos/normalizarContato.js";
import type {
  AtualizacaoCliente360,
  Cliente360,
  Cliente360ComMetricas,
  DadosCliente360,
  EnderecoCliente,
  FiltrosClientes360,
  MetricasCliente360,
  NovoEnderecoCliente,
  Pedido,
  Reserva
} from "../dominio/tipos.js";
import { lerBooleano, lerLista, parseCsv } from "./utils/csv.js";

const estadosReservaAtiva = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"];
const camposClienteImportacao = new Set([
  "telefone",
  "whatsapp",
  "nome",
  "email",
  "username",
  "user_id",
  "userid",
  "avatar_url",
  "avatarurl",
  "origem",
  "tags",
  "consentimento_marketing",
  "consentimentomarketing",
  "consentimento_dados",
  "consentimentodados",
  "estado_relacionamento",
  "estadorelacionamento"
]);
const chaveEnderecosEntrega = "enderecosEntrega";

type StatusLinhaImportacao = "CRIADO" | "ATUALIZADO" | "ERRO";

interface LinhaImportacaoCliente {
  linha: number;
  status: StatusLinhaImportacao;
  clienteId?: string;
  telefone?: string | null;
  email?: string | null;
  erro?: string;
}

export class GestaoClientesCrmUseCase {
  constructor(
    private readonly clientes: RepositorioClientes,
    private readonly atendimento: RepositorioAtendimento,
    private readonly reservas: RepositorioReservas,
    private readonly pecas: RepositorioPecas,
    private readonly pedidos: RepositorioPedidos
  ) {}

  async criarCliente(dados: DadosCliente360): Promise<Cliente360> {
    return this.clientes.salvar({
      ...dados,
      tags: this.normalizarTags(dados.tags ?? [])
    });
  }

  async atualizarCliente(id: string, negocioId: string, dados: AtualizacaoCliente360): Promise<Cliente360> {
    const cliente = await this.clientes.atualizar(id, negocioId, {
      ...dados,
      tags: dados.tags ? this.normalizarTags(dados.tags) : undefined
    });
    if (!cliente) throw new Error(`Cliente ${id} não encontrado.`);
    return cliente;
  }

  async anonimizarCliente(id: string, negocioId: string, motivo: string): Promise<Cliente360> {
    const cliente = await this.clientes.anonimizar(id, negocioId, {
      motivo,
      anonimizadoEm: new Date()
    });
    if (!cliente) throw new Error(`Cliente ${id} não encontrado.`);
    return cliente;
  }

  async importarCsv(negocioId: string, conteudo: string) {
    const linhasCsv = parseCsv(conteudo);
    const clientesAtuais = await this.clientes.listar(negocioId, { limite: 100_000 });
    const clientesPorContato = new Map<string, Cliente360>();
    for (const cliente of clientesAtuais) {
      for (const chave of this.chavesContato(cliente.telefone, cliente.email)) {
        clientesPorContato.set(chave, cliente);
      }
    }

    const linhas: LinhaImportacaoCliente[] = [];
    for (const linhaCsv of linhasCsv) {
      try {
        const dados = this.mapearLinhaImportacao(negocioId, linhaCsv.dados);
        const existia = this.chavesContato(dados.telefone, dados.email).some((chave) => clientesPorContato.has(chave));
        const cliente = await this.criarCliente(dados);
        for (const chave of this.chavesContato(cliente.telefone, cliente.email)) {
          clientesPorContato.set(chave, cliente);
        }
        linhas.push({
          linha: linhaCsv.numero,
          status: existia ? "ATUALIZADO" : "CRIADO",
          clienteId: cliente.id,
          telefone: cliente.telefone,
          email: cliente.email
        });
      } catch (erro) {
        linhas.push({
          linha: linhaCsv.numero,
          status: "ERRO",
          erro: erro instanceof Error ? erro.message : "Linha inválida."
        });
      }
    }

    return {
      total: linhasCsv.length,
      criados: linhas.filter((linha) => linha.status === "CRIADO").length,
      atualizados: linhas.filter((linha) => linha.status === "ATUALIZADO").length,
      erros: linhas.filter((linha) => linha.status === "ERRO").length,
      linhas
    };
  }

  async listarClientes(
    negocioId: string,
    filtros: FiltrosClientes360 = {}
  ): Promise<{ clientes: Cliente360ComMetricas[] }> {
    const clientes = await this.clientes.listar(negocioId, filtros);
    const [reservas, conversas, pecas, pedidos] = await Promise.all([
      this.reservas.listar(negocioId),
      this.atendimento.listarConversasComMensagens(1000, negocioId),
      this.pecas.listar(negocioId),
      this.pedidos.listar(negocioId, { limite: 100_000 })
    ]);
    const precoPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca.precoEmKwanza]));

    return {
      clientes: clientes.map((cliente) => ({
        ...cliente,
        metricas: this.calcularMetricas(cliente, reservas, conversas, precoPorCodigo, pedidos)
      }))
    };
  }

  async obterPerfil(id: string, negocioId: string) {
    const cliente = await this.clientes.buscarPorId(id, negocioId);
    if (!cliente) return null;

    const [reservas, conversas, pecas, pedidos] = await Promise.all([
      this.reservas.listar(negocioId),
      this.atendimento.listarConversasComMensagens(1000, negocioId),
      this.pecas.listar(negocioId),
      this.pedidos.listar(negocioId, { limite: 100_000 })
    ]);
    const precoPorCodigo = new Map(pecas.map((peca) => [peca.codigo, peca.precoEmKwanza]));
    const reservasCliente = reservas.filter((reserva) => this.mesmoCliente(cliente, reserva.telefoneCliente));
    const conversasCliente = conversas.filter((conversa) => this.mesmoCliente(cliente, conversa.conversa.telefone));
    const pedidosCliente = pedidos.filter((pedido) => pedido.clienteNegocioId === cliente.id);

    return {
      cliente,
      metricas: this.calcularMetricas(cliente, reservas, conversas, precoPorCodigo, pedidos),
      reservas: reservasCliente,
      conversas: conversasCliente,
      pedidos: pedidosCliente
    };
  }

  async listarEnderecosCliente(id: string, negocioId: string) {
    const cliente = await this.clientes.buscarPorId(id, negocioId);
    if (!cliente) return null;

    return {
      cliente,
      enderecos: this.obterEnderecosEntrega(cliente)
    };
  }

  async salvarEnderecoCliente(id: string, negocioId: string, dados: NovoEnderecoCliente) {
    const cliente = await this.clientes.buscarPorId(id, negocioId);
    if (!cliente) return null;

    const enderecosAtuais = this.obterEnderecosEntrega(cliente);
    const agora = new Date().toISOString();
    const principal = dados.principal === true || enderecosAtuais.length === 0;
    const endereco: EnderecoCliente = {
      id: randomUUID(),
      rotulo: this.textoOuNull(dados.rotulo),
      endereco: dados.endereco.trim(),
      bairro: this.textoOuNull(dados.bairro),
      municipio: this.textoOuNull(dados.municipio),
      referencia: this.textoOuNull(dados.referencia),
      principal,
      criadoEm: agora,
      atualizadoEm: agora
    };
    const enderecos = [
      ...enderecosAtuais.map((item) => ({
        ...item,
        principal: principal ? false : item.principal
      })),
      endereco
    ];

    const clienteAtualizado = await this.atualizarCliente(id, negocioId, {
      preferencias: {
        ...cliente.preferencias,
        [chaveEnderecosEntrega]: enderecos
      }
    });

    return {
      cliente: clienteAtualizado,
      endereco,
      enderecos
    };
  }

  async exportarCsv(
    negocioId: string,
    filtros: FiltrosClientes360 = { limite: 10_000 }
  ): Promise<{ csv: string; quantidade: number; filtros: FiltrosClientes360 }> {
    const filtrosExportacao: FiltrosClientes360 = { limite: 10_000, ...filtros };
    const { clientes } = await this.listarClientes(negocioId, filtrosExportacao);
    const linhas = [
      [
        "telefone",
        "nome",
        "email",
        "username",
        "origem",
        "estadoRelacionamento",
        "consentimentoMarketing",
        "consentimentoDados",
        "tags",
        "totalReservas",
        "totalCompradoEmKwanza",
        "pedidosPagos",
        "pedidosCancelados",
        "reservasExpiradas",
        "tempoMedioPagamentoEmMinutos",
        "ultimaCompraEm",
        "ultimaInteracaoEm"
      ],
      ...clientes.map((cliente) => [
        cliente.telefone ?? "",
        cliente.nome ?? "",
        cliente.email ?? "",
        cliente.username ?? "",
        cliente.origem ?? "",
        cliente.estadoRelacionamento,
        String(cliente.consentimentoMarketing),
        String(cliente.consentimentoDados),
        cliente.tags.join("|"),
        String(cliente.metricas.totalReservas),
        String(cliente.metricas.totalCompradoEmKwanza),
        String(cliente.metricas.pedidosPagos),
        String(cliente.metricas.pedidosCancelados),
        String(cliente.metricas.reservasExpiradas),
        cliente.metricas.tempoMedioPagamentoEmMinutos === null
          ? ""
          : String(cliente.metricas.tempoMedioPagamentoEmMinutos),
        cliente.metricas.ultimaCompraEm?.toISOString() ?? "",
        cliente.metricas.ultimaInteracaoEm?.toISOString() ?? ""
      ])
    ];

    return {
      csv: `${linhas.map((linha) => linha.map((valor) => this.csv(valor)).join(",")).join("\n")}\n`,
      quantidade: clientes.length,
      filtros: filtrosExportacao
    };
  }

  async previsualizarMesclagem(clienteDestinoId: string, clienteOrigemId: string, negocioId: string) {
    const { destino, origem } = await this.exigirClientesParaMesclagem(clienteDestinoId, clienteOrigemId, negocioId);
    return {
      destino,
      origem,
      resultado: this.construirClienteMesclado(destino, origem)
    };
  }

  async mesclarClientes(
    clienteDestinoId: string,
    clienteOrigemId: string,
    negocioId: string,
    motivo: string
  ): Promise<{ cliente: Cliente360; origem: Cliente360; motivo: string }> {
    const { destino, origem } = await this.exigirClientesParaMesclagem(clienteDestinoId, clienteOrigemId, negocioId);
    const mesclado = this.construirClienteMesclado(destino, origem);
    const cliente = await this.atualizarCliente(destino.id, negocioId, mesclado);
    const origemAtualizada = await this.atualizarCliente(origem.id, negocioId, {
      tags: this.normalizarTags([...origem.tags, "mesclado"]),
      estadoRelacionamento: "BLOQUEADO",
      preferencias: {
        ...origem.preferencias,
        mescladoPara: destino.id,
        mescladoEm: new Date().toISOString(),
        motivoMesclagem: motivo
      }
    });
    return { cliente, origem: origemAtualizada, motivo };
  }

  async segmentarClientes(negocioId: string) {
    const { clientes } = await this.listarClientes(negocioId, { limite: 100_000 });
    const agora = Date.now();
    const diasDesde = (data: Date | null) => (data ? (agora - data.getTime()) / 86_400_000 : Number.POSITIVE_INFINITY);
    const segmentos = [
      {
        id: "novo",
        titulo: "Novos clientes",
        criterio: "Primeira interação nos últimos 7 dias.",
        clientes: clientes.filter((cliente) => diasDesde(cliente.primeiraInteracaoEm) <= 7)
      },
      {
        id: "primeiro-pedido",
        titulo: "Primeiro pedido",
        criterio: "Cliente com exatamente uma compra paga.",
        clientes: clientes.filter((cliente) => cliente.metricas.totalComprasPagas === 1)
      },
      {
        id: "recorrente",
        titulo: "Recorrentes",
        criterio: "Cliente com duas ou mais compras pagas.",
        clientes: clientes.filter((cliente) => cliente.metricas.totalComprasPagas >= 2)
      },
      {
        id: "vip",
        titulo: "VIP",
        criterio: "Cliente marcado como VIP, com tag VIP ou alto valor acumulado.",
        clientes: clientes.filter(
          (cliente) =>
            cliente.estadoRelacionamento === "VIP" ||
            cliente.tags.some((tag) => tag.toLowerCase() === "vip") ||
            cliente.metricas.totalCompradoEmKwanza >= 500_000
        )
      },
      {
        id: "inativo",
        titulo: "Inativos",
        criterio: "Sem interação nos últimos 30 dias.",
        clientes: clientes.filter((cliente) => diasDesde(cliente.metricas.ultimaInteracaoEm) > 30)
      },
      {
        id: "nunca-comprou",
        titulo: "Nunca comprou",
        criterio: "Sem compra paga registada.",
        clientes: clientes.filter((cliente) => cliente.metricas.totalComprasPagas === 0 && cliente.metricas.totalCompradoEmKwanza === 0)
      },
      {
        id: "pagamento-pendente",
        titulo: "Pagamento pendente",
        criterio: "Reserva ou pedido em aberto aguardando pagamento.",
        clientes: clientes.filter(
          (cliente) => cliente.metricas.reservasAtivas > 0 || cliente.metricas.pedidosPagamentoPendente > 0
        )
      },
      {
        id: "reserva-perdida",
        titulo: "Reserva perdida",
        criterio: "Teve reserva, mas nenhuma compra paga nem reserva ativa.",
        clientes: clientes.filter(
          (cliente) =>
            cliente.metricas.totalReservas > 0 &&
            cliente.metricas.reservasAtivas === 0 &&
            cliente.metricas.totalComprasPagas === 0
        )
      },
      {
        id: "alto-potencial",
        titulo: "Alto potencial",
        criterio: "Cliente com intenção forte, tags comerciais ou várias interações.",
        clientes: clientes.filter(
          (cliente) =>
            cliente.metricas.totalMensagens >= 3 ||
            cliente.tags.some((tag) => ["vip", "lead", "retorno"].includes(tag.toLowerCase()))
        )
      }
    ];

    return {
      segmentos: segmentos.map((segmento) => ({
        id: segmento.id,
        titulo: segmento.titulo,
        criterio: segmento.criterio,
        total: segmento.clientes.length,
        clientes: segmento.clientes.map((cliente) => ({
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
          estadoRelacionamento: cliente.estadoRelacionamento,
          tags: cliente.tags,
          totalCompradoEmKwanza: cliente.metricas.totalCompradoEmKwanza,
          ultimaInteracaoEm: cliente.metricas.ultimaInteracaoEm
        }))
      }))
    };
  }

  private calcularMetricas(
    cliente: Cliente360,
    reservas: Reserva[],
    conversas: Awaited<ReturnType<RepositorioAtendimento["listarConversasComMensagens"]>>,
    precoPorCodigo: Map<string, number>,
    pedidos: Pedido[] = []
  ): MetricasCliente360 {
    const reservasCliente = reservas.filter((reserva) => this.mesmoCliente(cliente, reserva.telefoneCliente));
    const conversasCliente = conversas.filter((conversa) => this.mesmoCliente(cliente, conversa.conversa.telefone));
    const pedidosCliente = pedidos.filter((pedido) => pedido.clienteNegocioId === cliente.id);
    const pedidosPagos = pedidosCliente.filter((pedido) => this.pedidoPago(pedido));
    const pedidosCancelados = pedidosCliente.filter((pedido) => pedido.estado === "CANCELADO");
    const pedidosPagamentoPendente = pedidosCliente.filter(
      (pedido) =>
        pedido.estadoPagamento === "PENDENTE" &&
        !["CANCELADO", "DEVOLVIDO", "TROCADO"].includes(pedido.estado)
    );
    const reservasPagas = reservasCliente.filter((reserva) => reserva.estado === "PAID");
    const reservasExpiradas = reservasCliente.filter((reserva) => reserva.estado === "EXPIRED");
    const reservaIdsComPedidoPago = new Set(
      pedidosPagos.map((pedido) => pedido.reservaId).filter((reservaId): reservaId is string => Boolean(reservaId))
    );
    const reservasPagasSemPedido = reservasPagas.filter((reserva) => !reservaIdsComPedidoPago.has(reserva.id));
    const mensagens = conversasCliente.flatMap((conversa) => conversa.mensagens);
    const ultimaMensagemEm =
      mensagens.map((mensagem) => mensagem.enviadaEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaReservaEm =
      reservasCliente.map((reserva) => reserva.atualizadaEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const ultimaPedidoEm =
      pedidosCliente.map((pedido) => pedido.atualizadoEm).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const datasCompra = [
      ...pedidosPagos.map((pedido) => pedido.pagoEm ?? pedido.atualizadoEm),
      ...reservasPagasSemPedido.map((reserva) => reserva.atualizadaEm)
    ];
    const ultimaCompraEm = datasCompra.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const temposPagamento = [
      ...pedidosPagos
        .filter((pedido) => pedido.pagoEm)
        .map((pedido) => (pedido.pagoEm!.getTime() - pedido.criadoEm.getTime()) / 60_000),
      ...reservasPagasSemPedido.map((reserva) => (reserva.atualizadaEm.getTime() - reserva.criadaEm.getTime()) / 60_000)
    ].filter((tempo) => tempo >= 0);
    const tempoMedioPagamentoEmMinutos =
      temposPagamento.length === 0
        ? null
        : Number((temposPagamento.reduce((total, tempo) => total + tempo, 0) / temposPagamento.length).toFixed(2));
    const totalCompradoEmKwanza =
      pedidosPagos.reduce((total, pedido) => total + pedido.totalEmKwanza, 0) +
      reservasPagasSemPedido.reduce((total, reserva) => total + (precoPorCodigo.get(reserva.codigoPeca) ?? 0), 0);
    const ultimaInteracaoEm = [cliente.ultimaInteracaoEm, ultimaMensagemEm, ultimaReservaEm, ultimaPedidoEm]
      .filter((data): data is Date => Boolean(data))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      totalReservas: reservasCliente.length,
      reservasAtivas: reservasCliente.filter((reserva) => estadosReservaAtiva.includes(reserva.estado)).length,
      reservasPagas: reservasPagas.length,
      reservasExpiradas: reservasExpiradas.length,
      pedidosPagos: pedidosPagos.length,
      pedidosCancelados: pedidosCancelados.length,
      pedidosPagamentoPendente: pedidosPagamentoPendente.length,
      totalComprasPagas: pedidosPagos.length + reservasPagasSemPedido.length,
      totalCompradoEmKwanza,
      tempoMedioPagamentoEmMinutos,
      ultimaCompraEm,
      totalMensagens: mensagens.length,
      conversasAbertas: conversasCliente.filter((conversa) => conversa.conversa.estado !== "ENCERRADA").length,
      ultimaInteracaoEm
    };
  }

  private pedidoPago(pedido: Pedido): boolean {
    return pedido.estadoPagamento === "CONFIRMADO" || ["PAGO", "EM_PREPARACAO", "PRONTO_ENTREGA", "ENVIADO", "ENTREGUE"].includes(pedido.estado);
  }

  private obterEnderecosEntrega(cliente: Pick<Cliente360, "preferencias">): EnderecoCliente[] {
    const valor = cliente.preferencias[chaveEnderecosEntrega];
    if (!Array.isArray(valor)) return [];

    return valor.flatMap((item): EnderecoCliente[] => {
      if (!this.ehRegistro(item)) return [];
      const id = this.textoOuNull(item.id);
      const endereco = this.textoOuNull(item.endereco);
      if (!id || !endereco) return [];

      const criadoEm = this.textoOuNull(item.criadoEm) ?? new Date(0).toISOString();
      return [
        {
          id,
          rotulo: this.textoOuNull(item.rotulo),
          endereco,
          bairro: this.textoOuNull(item.bairro),
          municipio: this.textoOuNull(item.municipio),
          referencia: this.textoOuNull(item.referencia),
          principal: item.principal === true,
          criadoEm,
          atualizadoEm: this.textoOuNull(item.atualizadoEm) ?? criadoEm
        }
      ];
    });
  }

  private mesmoCliente(cliente: Cliente360, telefone: string): boolean {
    return Boolean(cliente.telefone && cliente.telefone === telefone);
  }

  private mapearLinhaImportacao(negocioId: string, linha: Record<string, string>): DadosCliente360 {
    const telefoneOriginal = linha.telefone || linha.whatsapp || null;
    const telefone = this.validarTelefoneImportado(telefoneOriginal);
    const email = normalizarEmail(linha.email);
    if (!telefone && !email) {
      throw new Error("Informe telefone angolano válido ou email para identificar o cliente.");
    }

    const preferencias = Object.entries(linha).reduce<Record<string, unknown>>((acumulador, [campo, valor]) => {
      if (!valor || camposClienteImportacao.has(campo)) return acumulador;
      acumulador[campo] = valor;
      return acumulador;
    }, {});

    return {
      negocioId,
      telefone,
      email,
      nome: linha.nome || null,
      username: linha.username || null,
      userId: linha.user_id || linha.userid || null,
      avatarUrl: linha.avatar_url || linha.avatarurl || null,
      origem: linha.origem || "importacao_csv",
      tags: lerLista(linha.tags),
      preferencias,
      consentimentoMarketing: lerBooleano(linha.consentimento_marketing || linha.consentimentomarketing) ?? false,
      consentimentoDados: lerBooleano(linha.consentimento_dados || linha.consentimentodados) ?? false,
      estadoRelacionamento: undefined
    };
  }

  private validarTelefoneImportado(valor?: string | null): string | null {
    if (!valor?.trim()) return null;
    const telefone = normalizarTelefone(valor);
    if (!telefone || telefone.local.length !== 9 || !telefone.local.startsWith("9")) {
      throw new Error("telefone angolano inválido na importação.");
    }
    return telefone.local;
  }

  private chavesContato(telefone?: string | null, email?: string | null): string[] {
    const chaves: string[] = [];
    const telefoneNormalizado = normalizarTelefone(telefone);
    const emailNormalizado = normalizarEmail(email);
    if (telefoneNormalizado) chaves.push(`telefone:${telefoneNormalizado.canonico}`);
    if (emailNormalizado) chaves.push(`email:${emailNormalizado}`);
    return chaves;
  }

  private async exigirClientesParaMesclagem(clienteDestinoId: string, clienteOrigemId: string, negocioId: string) {
    if (clienteDestinoId === clienteOrigemId) {
      throw new Error("Escolha dois clientes diferentes para a fusão.");
    }
    const [destino, origem] = await Promise.all([
      this.clientes.buscarPorId(clienteDestinoId, negocioId),
      this.clientes.buscarPorId(clienteOrigemId, negocioId)
    ]);
    if (!destino) throw new Error(`Cliente destino ${clienteDestinoId} não encontrado.`);
    if (!origem) throw new Error(`Cliente origem ${clienteOrigemId} não encontrado.`);
    return { destino, origem };
  }

  private construirClienteMesclado(destino: Cliente360, origem: Cliente360): AtualizacaoCliente360 {
    return {
      telefone: destino.telefone ?? origem.telefone,
      email: destino.email ?? origem.email,
      nome: destino.nome ?? origem.nome,
      username: destino.username ?? origem.username,
      userId: destino.userId ?? origem.userId,
      avatarUrl: destino.avatarUrl ?? origem.avatarUrl,
      origem: destino.origem ?? origem.origem,
      tags: this.normalizarTags([...destino.tags, ...origem.tags]),
      preferencias: { ...origem.preferencias, ...destino.preferencias },
      consentimentoMarketing: destino.consentimentoMarketing || origem.consentimentoMarketing,
      consentimentoDados: destino.consentimentoDados || origem.consentimentoDados,
      estadoRelacionamento: destino.estadoRelacionamento
    };
  }

  private normalizarTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  private textoOuNull(valor: unknown): string | null {
    return typeof valor === "string" && valor.trim() ? valor.trim() : null;
  }

  private ehRegistro(valor: unknown): valor is Record<string, unknown> {
    return Boolean(valor && typeof valor === "object" && !Array.isArray(valor));
  }

  private csv(valor: string): string {
    if (!/[",\n]/.test(valor)) return valor;
    return `"${valor.replace(/"/g, "\"\"")}"`;
  }
}
