import type {
  RepositorioAtendimento,
  RepositorioAuditoria,
  RepositorioAutenticacao,
  RepositorioComentarios
} from "../dominio/repositorios/contratos.js";
import type { ResultadoLimpezaDadosComunicacao } from "../dominio/tipos.js";

export class LimparDadosComunicacaoUseCase {
  constructor(
    private readonly repositorioComentarios: RepositorioComentarios,
    private readonly repositorioAtendimento: RepositorioAtendimento,
    private readonly repositorioAuditoria: RepositorioAuditoria,
    private readonly repositorioAutenticacao: RepositorioAutenticacao
  ) {}

  async executar(): Promise<{
    apagados: ResultadoLimpezaDadosComunicacao;
    preservados: string[];
    executadoEm: Date;
  }> {
    const [comentarios, atendimento, auditoria, codigosSms] = await Promise.all([
      this.repositorioComentarios.limparTodos(),
      this.repositorioAtendimento.limparHistorico(),
      this.repositorioAuditoria.limparMensagensComunicacao(),
      this.repositorioAutenticacao.limparCodigosSms()
    ]);

    return {
      apagados: {
        comentarios,
        mensagensAtendimento: atendimento.mensagensAtendimento,
        conversasAtendimento: atendimento.conversasAtendimento,
        clientesAtendimento: atendimento.clientesAtendimento,
        mensagensWhatsapp: auditoria.mensagensWhatsapp,
        outboxWhatsapp: auditoria.outboxWhatsapp,
        codigosSms
      },
      preservados: ["produtos", "reservas", "usuarios", "sessoes", "instancias_whatsapp"],
      executadoEm: new Date()
    };
  }
}
