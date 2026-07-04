#!/bin/bash

# RNF-T001/RNF-T007/RNF-T008: benchmark HTTP nao destrutivo para staging/producao.
# Exige um token real porque mede os endpoints por dentro do contrato autenticado.

set -euo pipefail

BASE_URL="${BIZY_BASE_URL:-${BASE_URL:-http://127.0.0.1:3333}}"
BIZY_TOKEN="${BIZY_TOKEN:-}"
ITERACOES="${ITERACOES:-5}"
SLO_DASHBOARD_MS="${SLO_DASHBOARD_MS:-2000}"
SLO_PROJECTOS_MS="${SLO_PROJECTOS_MS:-2000}"
BENCHMARK_LOG_FILE="${BENCHMARK_LOG_FILE:-}"

if [ -z "$BIZY_TOKEN" ]; then
  echo "Defina BIZY_TOKEN com um token que tenha financas:leitura e equipa:ler."
  exit 2
fi

if ! [[ "$ITERACOES" =~ ^[0-9]+$ ]] || [ "$ITERACOES" -lt 1 ]; then
  echo "ITERACOES deve ser um inteiro positivo."
  exit 2
fi

hoje="$(date -u +%F)"
inicio_90d="$(date -u -d "90 days ago" +%F)"
mes_actual="$(date -u +%-m)"
ano_actual="$(date -u +%Y)"

falhou=0

registrar() {
  local registro="$1"
  echo "$registro"
  if [ -n "$BENCHMARK_LOG_FILE" ]; then
    mkdir -p "$(dirname "$BENCHMARK_LOG_FILE")"
    printf '%s\n' "$registro" >> "$BENCHMARK_LOG_FILE"
  fi
}

medir_endpoint() {
  local requisito="$1"
  local path="$2"
  local slo_ms="$3"
  local maior_ms=0
  local codigo_final=0

  for tentativa in $(seq 1 "$ITERACOES"); do
    local corpo
    corpo="$(mktemp)"
    local curl_status=0
    local saida
    saida="$(curl -sS --max-time 30 -o "$corpo" -w "%{http_code} %{time_total}" \
      -H "Authorization: Bearer $BIZY_TOKEN" \
      "${BASE_URL%/}$path" 2>&1)" || curl_status=$?

    local http_code="000"
    local time_total="0"
    local erro=""
    if [ "$curl_status" -eq 0 ]; then
      read -r http_code time_total <<< "$saida"
    else
      erro="${saida//$'\n'/ }"
    fi

    local latencia_ms
    latencia_ms="$(node -e 'const v = Number(process.argv[1] || "0"); console.log(Math.round(v * 1000));' "$time_total")"
    rm -f "$corpo"

    if [ "$latencia_ms" -gt "$maior_ms" ]; then
      maior_ms="$latencia_ms"
    fi
    codigo_final="$http_code"

    local registro
    registro="$(node - "$requisito" "$path" "$tentativa" "$http_code" "$latencia_ms" "$slo_ms" "$erro" <<'NODE'
const [, , requisito, path, tentativa, httpCode, latenciaMs, sloMs, erro] = process.argv;
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  requisito,
  path,
  tentativa: Number(tentativa),
  httpCode: Number(httpCode),
  latenciaMs: Number(latenciaMs),
  sloMs: Number(sloMs),
  dentroSlo: Number(latenciaMs) <= Number(sloMs),
  erro: erro || null
}));
NODE
)"
    registrar "$registro"

    if [ "$curl_status" -ne 0 ] || [ "$http_code" -lt 200 ] || [ "$http_code" -ge 400 ] || [ "$latencia_ms" -gt "$slo_ms" ]; then
      falhou=1
    fi
  done

  echo "$requisito $path: max=${maior_ms}ms slo=${slo_ms}ms http_final=$codigo_final"
}

medir_endpoint "RNF-T001" "/financas/fluxo-caixa?de=$inicio_90d&ate=$hoje" "$SLO_DASHBOARD_MS"
medir_endpoint "RNF-T001" "/financas/dre?mes=$mes_actual&ano=$ano_actual" "$SLO_DASHBOARD_MS"
medir_endpoint "RNF-T008" "/projectos?estado=ATIVO&limite=200" "$SLO_PROJECTOS_MS"

exit "$falhou"
