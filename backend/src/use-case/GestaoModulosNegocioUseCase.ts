import type { RepositorioAutenticacao } from "../dominio/repositorios/contratos.js";
import {
  catalogoModulosNegocio,
  modulosNegocioObrigatorios,
  modulosNegocioPadrao,
  normalizarModuloNegocio,
  type AtualizacaoModuloNegocio,
  type ModuloNegocioCodigo,
  type ModuloNegocioConfigurado
} from "../dominio/tipos.js";

export class GestaoModulosNegocioUseCase {
  constructor(private readonly autenticacao: RepositorioAutenticacao) {}

  async listar(negocioId: string) {
    const configurados = await this.autenticacao.listarModulosPorNegocio(negocioId);
    const configuradosPorCodigo = new Map(
      configurados.map((modulo) => [normalizarModuloNegocio(modulo.modulo), { ...modulo, modulo: normalizarModuloNegocio(modulo.modulo) }])
    );
    const modulos = catalogoModulosNegocio.map((definicao) => {
      const configurado = configuradosPorCodigo.get(definicao.modulo);
      const ativo = configurado ? configurado.ativo : modulosNegocioPadrao.includes(definicao.modulo);

      return {
        ...definicao,
        ativo,
        configuracao: configurado?.configuracao ?? {},
        configuradoEm: configurado?.atualizadoEm ?? null
      };
    });

    return {
      modulos,
      modulosAtivos: modulos.filter((modulo) => modulo.ativo).map((modulo) => modulo.modulo)
    };
  }

  async atualizar(negocioId: string, modulo: ModuloNegocioCodigo, dados: AtualizacaoModuloNegocio) {
    this.validarAtualizacao(modulo, dados);
    const atualizado = await this.autenticacao.salvarModuloNegocio(negocioId, modulo, dados);
    const estado = await this.listar(negocioId);

    return {
      modulo: this.enriquecerModulo(atualizado),
      modulosAtivos: estado.modulosAtivos
    };
  }

  private validarAtualizacao(modulo: ModuloNegocioCodigo, dados: AtualizacaoModuloNegocio) {
    if (modulosNegocioObrigatorios.includes(modulo) && dados.ativo === false) {
      throw new Error(`O módulo ${modulo} é obrigatório para manter o núcleo BIZY Team consistente.`);
    }
  }

  private enriquecerModulo(configurado: ModuloNegocioConfigurado) {
    const definicao = catalogoModulosNegocio.find((modulo) => modulo.modulo === configurado.modulo);

    return {
      ...definicao,
      modulo: configurado.modulo,
      ativo: configurado.ativo,
      configuracao: configurado.configuracao,
      configuradoEm: configurado.atualizadoEm
    };
  }
}
