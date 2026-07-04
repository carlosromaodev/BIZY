#!/bin/bash

# RNF-T019: probe simples para contabilizar disponibilidade financeira em horario comercial.
# A rota /financas/saude e publica de proposito para poder ser chamada por cron/monitor externo.

set -euo pipefail

BASE_URL="${BIZY_BASE_URL:-${BASE_URL:-http://127.0.0.1:3333}}"
PROBE_TIMEOUT_SECONDS="${PROBE_TIMEOUT_SECONDS:-5}"
PROBE_LOG_FILE="${PROBE_LOG_FILE:-}"

endpoint="${BASE_URL%/}/financas/saude"
corpo="$(mktemp)"
trap 'rm -f "$corpo"' EXIT

curl_status=0
curl_saida="$(curl -sS --max-time "$PROBE_TIMEOUT_SECONDS" -o "$corpo" -w "%{http_code} %{time_total}" "$endpoint" 2>&1)" || curl_status=$?

if [ "$curl_status" -eq 0 ]; then
  read -r http_code time_total <<< "$curl_saida"
  erro=""
else
  http_code="000"
  time_total="0"
  erro="${curl_saida//$'\n'/ }"
fi

latencia_ms="$(node -e 'const v = Number(process.argv[1] || "0"); console.log(Math.round(v * 1000));' "$time_total")"
estado="$(node - "$corpo" <<'NODE'
const fs = require("node:fs");
try {
  const dados = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  console.log(typeof dados.estado === "string" ? dados.estado : "DESCONHECIDO");
} catch {
  console.log("INDISPONIVEL");
}
NODE
)"

registro="$(node - "$endpoint" "$http_code" "$latencia_ms" "$estado" "$erro" <<'NODE'
const [, , endpoint, httpCode, latenciaMs, estado, erro] = process.argv;
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  endpoint,
  httpCode: Number(httpCode),
  latenciaMs: Number(latenciaMs),
  estado,
  erro: erro || null
}));
NODE
)"

echo "$registro"

if [ -n "$PROBE_LOG_FILE" ]; then
  mkdir -p "$(dirname "$PROBE_LOG_FILE")"
  printf '%s\n' "$registro" >> "$PROBE_LOG_FILE"
fi

if [ "$curl_status" -ne 0 ] || [ "$http_code" -ge 500 ] || [ "$estado" = "INDISPONIVEL" ]; then
  exit 2
fi

if [ "$http_code" -ne 200 ] || [ "$estado" = "DEGRADADO" ]; then
  exit 1
fi

exit 0
