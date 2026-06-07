import type { MetricasLive } from "../../dominio/tipos.js";
import type { ContextoAplicacao, SessaoLive } from "./ContextoAplicacao.js";

export function atualizarMetricasSessaoLive(
  contexto: ContextoAplicacao,
  sessao: SessaoLive,
  metricas: MetricasLive
): void {
  const espectadoresAtuais = normalizarContagem(metricas.espectadoresAtuais);
  const picoInformado = normalizarContagem(metricas.picoEspectadores);

  if (espectadoresAtuais === null && picoInformado === null) return;

  if (espectadoresAtuais !== null) {
    sessao.espectadoresAtuais = espectadoresAtuais;
  }

  const candidatosPico = [sessao.picoEspectadores, espectadoresAtuais, picoInformado].filter(
    (valor): valor is number => typeof valor === "number" && Number.isFinite(valor)
  );

  sessao.picoEspectadores = candidatosPico.length > 0 ? Math.max(...candidatosPico) : null;
  sessao.metricasAtualizadasEm = metricas.atualizadaEm ?? new Date();

  contexto.eventos.emitir("LIVE_METRICS_UPDATED", {
    id: sessao.id,
    username: sessao.username,
    provider: sessao.providerNome,
    espectadoresAtuais: sessao.espectadoresAtuais,
    picoEspectadores: sessao.picoEspectadores,
    atualizadaEm: sessao.metricasAtualizadasEm.toISOString()
  });
}

function normalizarContagem(valor: number | null | undefined): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return Math.max(0, Math.floor(valor));
}
