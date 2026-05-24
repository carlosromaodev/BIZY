import type {
  RepositorioComentarios,
  RepositorioPecas,
  RepositorioReservas
} from "../dominio/repositorios/contratos.js";
import { NormalizadorTelefone } from "../dominio/servicos/NormalizadorTelefone.js";
import type { Peca, Reserva } from "../dominio/tipos.js";

const estadosReservaAtiva = ["PENDING", "RESERVED", "WAITING_PAYMENT", "WAITLISTED"] as const;

export class ConsultaAtendimentoN8n {
  private readonly normalizadorTelefone = new NormalizadorTelefone();

  constructor(
    private readonly repositorioPecas: RepositorioPecas,
    private readonly repositorioReservas: RepositorioReservas,
    private readonly repositorioComentarios: RepositorioComentarios
  ) {}

  async buscarClientePorTelefone(telefoneEntrada: string) {
    const telefone = this.exigirTelefoneValido(telefoneEntrada);
    const reservas = (await this.repositorioReservas.listar()).filter((reserva) => reserva.telefoneCliente === telefone);
    const comentarios = (await this.repositorioComentarios.listar(500)).filter(
      (comentario) => comentario.interpretacao?.phone === telefone
    );
    const reservaAtiva = reservas.find((reserva) => estadosReservaAtiva.includes(reserva.estado as never)) ?? null;
    const pecaAtiva = reservaAtiva ? await this.repositorioPecas.buscarPorCodigo(reservaAtiva.codigoPeca) : null;

    return {
      cliente: {
        telefone,
        nome: reservaAtiva?.nomeCliente ?? reservas.at(-1)?.nomeCliente ?? comentarios.at(0)?.comentario.displayName ?? null,
        username: reservaAtiva?.usernameCliente ?? reservas.at(-1)?.usernameCliente ?? comentarios.at(0)?.comentario.username ?? null
      },
      reservaAtiva: reservaAtiva ? await this.enriquecerReserva(reservaAtiva) : null,
      pecaReservada: pecaAtiva,
      historicoCompras: reservas.filter((reserva) => reserva.estado === "PAID"),
      historicoReservas: reservas,
      historicoMensagens: comentarios.map((comentario) => ({
        texto: comentario.comentario.commentText,
        estado: comentario.estado,
        criadoEm: comentario.criadoEm
      })),
      guardrails: this.criarGuardrails()
    };
  }

  async listarReservasAtivasPorTelefone(telefoneEntrada: string) {
    const telefone = this.exigirTelefoneValido(telefoneEntrada);
    const reservas = (await this.repositorioReservas.listar()).filter(
      (reserva) => reserva.telefoneCliente === telefone && estadosReservaAtiva.includes(reserva.estado as never)
    );

    return Promise.all(reservas.map((reserva) => this.enriquecerReserva(reserva)));
  }

  async buscarProduto(codigo: string) {
    const peca = await this.repositorioPecas.buscarPorCodigo(codigo);

    if (!peca) {
      return null;
    }

    const reservasQueBloqueiamStock = (await this.repositorioReservas.listar()).filter(
      (reserva) =>
        reserva.codigoPeca === codigo && ["PENDING", "RESERVED", "WAITING_PAYMENT", "PAID"].includes(reserva.estado)
    ).length;
    const fila = await this.repositorioReservas.listarFilaDaPeca(codigo);

    return {
      ...peca,
      stockLivre: Math.max(0, peca.quantidade - reservasQueBloqueiamStock),
      filaEspera: fila.length
    };
  }

  async enriquecerReserva(reserva: Reserva) {
    const peca = await this.repositorioPecas.buscarPorCodigo(reserva.codigoPeca);
    const fila = await this.repositorioReservas.listarFilaDaPeca(reserva.codigoPeca);
    const indiceFila = fila.findIndex((item) => item.id === reserva.id);

    return {
      ...reserva,
      peca,
      tempoRestanteSegundos: this.calcularTempoRestante(reserva),
      posicaoNaFila: indiceFila >= 0 ? indiceFila + 1 : null
    };
  }

  criarGuardrails() {
    return {
      podeResponderAutomaticamente: [
        "consultar estado da reserva",
        "informar preço vindo do backend",
        "informar tempo restante vindo do backend",
        "pedir comprovativo",
        "pedir dados de entrega após pagamento confirmado"
      ],
      exigeHumano: [
        "baixa confiança na intenção",
        "pedido de desconto",
        "troca de peça",
        "comprovativo ilegível",
        "cliente irritado",
        "cancelamento sem confirmação explícita",
        "qualquer divergência entre mensagem e dados do backend"
      ],
      proibicoesDaIa: [
        "confirmar pagamento sem validação do backend",
        "alterar reserva fora dos endpoints do backend",
        "prometer peça indisponível",
        "cancelar pedido sem confirmação",
        "inventar preço, stock ou prazo"
      ]
    };
  }

  classificarMensagemParaHumano(textoOriginal: string) {
    const texto = this.normalizarTexto(textoOriginal);
    const categorias = [
      this.contem(texto, ["desconto", "baixa", "baixar", "faz menos", "mais barato"]) ? "pedido_desconto" : null,
      this.contem(texto, ["troca", "trocar", "outra peca", "outro tamanho", "mudar peca"]) ? "troca_peca" : null,
      this.contem(texto, ["ilegivel", "não abre", "nao abre", "borrado", "não da para ver", "nao da para ver"])
        ? "comprovativo_ilegivel"
        : null,
      this.contem(texto, ["chatead", "irritad", "reclama", "burla", "engan", "demora demais", "não gostei", "nao gostei"])
        ? "cliente_irritado"
        : null,
      this.contem(texto, ["cancelar", "cancela", "desist", "não quero mais", "nao quero mais"])
        ? "cancelamento_ambiguo"
        : null
    ].filter((categoria): categoria is string => Boolean(categoria));

    return {
      exigeHumano: categorias.length > 0,
      categorias,
      acaoRecomendada: categorias.length > 0 ? "ENCAMINHAR_HUMANO" : "PODE_RESPONDER_COM_CONTEXTO",
      guardrails: this.criarGuardrails()
    };
  }

  private calcularTempoRestante(reserva: Reserva): number | null {
    if (!reserva.expiraEm || !["PENDING", "RESERVED", "WAITING_PAYMENT"].includes(reserva.estado)) {
      return null;
    }

    return Math.max(0, Math.floor((reserva.expiraEm.getTime() - Date.now()) / 1000));
  }

  private exigirTelefoneValido(telefoneEntrada: string): string {
    const telefone = this.normalizadorTelefone.normalizar(telefoneEntrada);

    if (!telefone) {
      throw new Error("Telefone angolano inválido.");
    }

    return telefone;
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private contem(texto: string, termos: string[]): boolean {
    return termos.some((termo) => texto.includes(this.normalizarTexto(termo)));
  }
}
