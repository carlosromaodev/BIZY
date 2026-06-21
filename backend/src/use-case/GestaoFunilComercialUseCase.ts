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

    const origem = dados.origem ?? "manual";

    // RF279 — movimentos automáticos não podem regredir o funil
    if (origem !== "manual" && etapaAnterior !== null && dados.etapaNova !== "PERDIDO") {
      const idxAnterior = etapasFunilComercial.indexOf(etapaAnterior);
      const idxNova = etapasFunilComercial.indexOf(dados.etapaNova);
      if (idxNova >= 0 && idxAnterior >= 0 && idxNova < idxAnterior) {
        return null; // ignora silenciosamente — não regride
      }
    }

    return this.funil.registrarMovimento({
      ...dados,
      etapaAnterior,
      origem,
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
