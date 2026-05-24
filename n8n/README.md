# Workflows n8n do ÉMeu

Importe estes arquivos no n8n:

- `workflows/emeu-eventos-vendas.json`
- `workflows/emeu-atendimento-whatsapp.json`
- `workflows/emeu-comprovativo-pagamento.json`

## Variáveis usadas

```env
N8N_BACKEND_BASE_URL=http://backend:3333
N8N_BACKEND_TOKEN=trocar_este_token
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=trocar_api_key
EVOLUTION_INSTANCE=emeu
```

## Webhooks

- Backend para n8n: `/webhook/emeu-eventos`
- Atendimento WhatsApp: `/webhook/emeu-whatsapp-inbound`
- Comprovativo: `/webhook/emeu-comprovativo`

Em modo teste do n8n, use `/webhook-test/...`.

## IA

O workflow `emeu-atendimento-whatsapp.json` vem com resposta determinística e segura para funcionar sem credenciais de IA. Para usar AI Agent, substitua o node `Preparar resposta com guardrails` por um `AI Agent` ligado a um modelo de chat e use o prompt em:

- `n8n/prompts/atendimento-consciente.md`
