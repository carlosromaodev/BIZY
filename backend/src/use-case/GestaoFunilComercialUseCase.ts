import type { RepositorioFunilComercial } from "../dominio/repositorios/contratos.js";
import {
  etapasFunilComercial,
  type FiltrosMovimentosFunilComercial,
  type NovoMovimentoFunilComercial
} from "../dominio/tipos.js";

export class GestaoFunilComercialUseCase {
  constructor(private readonly funil: RepositorioFunilComercial) {}

  listarEtapas() {
    return [...etapasFunilComercial];
  }

  listarMovimentos(negocioId: string, filtros: FiltrosMovimentosFunilComercial = {}) {
    return this.funil.listarMovimentos(negocioId, filtros);
  }

  async registrarMovimento(dados: NovoMovimentoFunilComercial) {
    const etapaAnterior =
      dados.etapaAnterior !== undefined ? dados.etapaAnterior : await this.inferirEtapaAnterior(dados);

    return this.funil.registrarMovimento({
      ...dados,
      etapaAnterior,
      origem: dados.origem ?? "manual",
      autorId: dados.autorId ?? null,
      contexto: dados.contexto ?? {}
    });
  }

  private async inferirEtapaAnterior(dados: NovoMovimentoFunilComercial) {
    const [ultimoMovimento] = await this.funil.listarMovimentos(dados.negocioId, {
      entidadeTipo: dados.entidadeTipo,
      entidadeId: dados.entidadeId,
      limite: 1
    });

    return ultimoMovimento?.etapaNova ?? null;
  }
}
