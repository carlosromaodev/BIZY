import type { ContextoAplicacao } from "./ContextoAplicacao.js";
import type { ContextoComercialHttp } from "./contextoComercial.js";

export type AlteracoesAuditoria = Record<string, { antes: unknown; depois: unknown }>;

export function montarAlteracoes(
  antes: Record<string, unknown> | null | undefined,
  depois: Record<string, unknown> | null | undefined,
  campos: string[]
): AlteracoesAuditoria {
  return campos.reduce<AlteracoesAuditoria>((alteracoes, campo) => {
    const valorAnterior = antes?.[campo] ?? null;
    const valorNovo = depois?.[campo] ?? null;
    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNovo)) {
      alteracoes[campo] = { antes: valorAnterior, depois: valorNovo };
    }
    return alteracoes;
  }, {});
}

export async function registrarAuditoriaCritica(
  contexto: ContextoAplicacao,
  contextoComercial: ContextoComercialHttp,
  dados: {
    topico: string;
    tipo: string;
    entidadeTipo: string;
    entidadeId: string;
    motivo?: string | null;
    alteracoes?: AlteracoesAuditoria;
    payload?: Record<string, unknown>;
  }
) {
  await contexto.gestaoGovernancaCrm.registrarEvento({
    negocioId: contextoComercial.negocio.id,
    topico: dados.topico,
    tipo: dados.tipo,
    entidadeTipo: dados.entidadeTipo,
    entidadeId: dados.entidadeId,
    payload: {
      atorUsuarioId: contextoComercial.usuario.id,
      atorNome: contextoComercial.usuario.nome,
      papel: contextoComercial.papel,
      motivo: dados.motivo ?? null,
      alteracoes: dados.alteracoes ?? {},
      ...(dados.payload ?? {})
    },
    estado: "PROCESSADO"
  });
}
