# Integração n8n

O n8n é a camada de automação e atendimento do ÉMeu. Ele envia WhatsApp, executa follow-ups, aciona IA, pede aprovação humana e trata exceções. O backend continua sendo a fonte de verdade para parser, stock, reservas, fila, expiração, pagamento e histórico.

## Variáveis

```env
N8N_WEBHOOK_EVENTOS_URL=http://localhost:5678/webhook/emeu-eventos
N8N_WEBHOOK_SECRET=trocar_este_segredo
N8N_BACKEND_TOKEN=trocar_este_token
N8N_EVENTOS_ATIVOS=true
N8N_ASSUME_WHATSAPP=true
N8N_MINUTOS_ANTES_EXPIRAR=2
```

## Saída do Backend para o n8n

O backend envia eventos por `POST` para `N8N_WEBHOOK_EVENTOS_URL`.

Headers:

- `X-EMEU-EVENTO`: tipo do evento.
- `X-EMEU-TIMESTAMP`: data ISO usada na assinatura.
- `X-EMEU-ASSINATURA`: HMAC SHA-256 de `timestamp.body` usando `N8N_WEBHOOK_SECRET`.

Payload:

```json
{
  "eventId": "uuid",
  "eventType": "RESERVATION_CREATED",
  "occurredAt": "2026-05-02T12:00:00.000Z",
  "source": "emeu-backend",
  "payload": {
    "reserva": {},
    "peca": {}
  }
}
```

Eventos enviados:

- `RESERVATION_CREATED`
- `RESERVATION_EXPIRING`
- `RESERVATION_EXPIRED`
- `RESERVATION_WAITLISTED`
- `PAYMENT_PROOF_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_REJECTED`
- `ORDER_READY_TO_SHIP`
- `ORDER_DELIVERED`

## Entrada do n8n para o Backend

Todos os endpoints `/n8n/*` aceitam o header:

```http
X-EMEU-N8N-TOKEN: trocar_este_token
```

Endpoints:

- `GET /n8n/customers/by-phone/:phone`
- `GET /n8n/reservations/active/:phone`
- `GET /n8n/products/:code`
- `POST /n8n/messages/classify`
- `POST /n8n/reservations/:id/cancel`
- `POST /n8n/payments/:id/proof-received`
- `POST /n8n/payments/:id/confirm`
- `POST /n8n/payments/:id/reject`
- `POST /n8n/orders/:id/delivery-address`
- `POST /n8n/orders/:id/delivered`

## Workflow 1: Nova Reserva

Gatilho: Webhook n8n recebe `RESERVATION_CREATED`.

Modelo importável:

- `n8n/workflows/emeu-eventos-vendas.json`

Passos:

1. Validar assinatura `X-EMEU-ASSINATURA`.
2. Extrair `reserva`, `peca`, `telefoneCliente`, `precoEmKwanza` e `expiraEm`.
3. Enviar WhatsApp com peça, preço, prazo e instruções de pagamento.
4. Aguardar alguns minutos.
5. Chamar `GET /n8n/reservations/active/:phone`.
6. Se a reserva ainda estiver `WAITING_PAYMENT`, enviar lembrete.
7. Se estiver `PAID`, encerrar sem lembrete.

## Workflow 2: Atendimento WhatsApp com IA

Gatilho: mensagem recebida no WhatsApp.

Modelo importável:

- `n8n/workflows/emeu-atendimento-whatsapp.json`
- Prompt para AI Agent: `n8n/prompts/atendimento-consciente.md`

Passos:

1. Normalizar telefone do remetente.
2. Chamar `GET /n8n/customers/by-phone/:phone`.
3. Montar contexto com nome, telefone, reserva ativa, peça, preço, tempo restante, estado de pagamento, fila e histórico.
4. Chamar `POST /n8n/messages/classify` para saber se o caso exige humano.
5. Responder automaticamente apenas quando a intenção for simples.
6. Encaminhar para humano quando o pedido tocar em desconto, troca, cancelamento, conflito, irritação ou baixa confiança.

Prompt-base do agente:

```text
És o assistente do ÉMeu. Responde em português natural e curto.
Usa apenas dados vindos do backend.
Nunca confirmes pagamento, preço, stock, prazo, reserva ou cancelamento sem dado explícito do backend.
Se o pedido for sensível, responde que vais chamar uma pessoa da equipa e marca aprovação humana.
```

## Workflow 3: Comprovativo

Gatilho: imagem ou documento recebido no WhatsApp.

Modelo importável:

- `n8n/workflows/emeu-comprovativo-pagamento.json`

Passos:

1. Identificar telefone.
2. Chamar `GET /n8n/reservations/active/:phone`.
3. Se houver reserva ativa, chamar `POST /n8n/payments/:id/proof-received`.
4. Notificar vendedor para aprovação humana.
5. Se aprovado, chamar `POST /n8n/payments/:id/confirm`.
6. Se rejeitado, chamar `POST /n8n/payments/:id/reject` com motivo.
7. Enviar WhatsApp com a decisão.

## Workflow 4: Expiração e Fila

Gatilho: `RESERVATION_EXPIRING` ou `RESERVATION_EXPIRED`.

Passos para `RESERVATION_EXPIRING`:

1. Enviar lembrete final com tempo restante.
2. Não alterar reserva diretamente.

Passos para `RESERVATION_EXPIRED`:

1. Enviar mensagem ao cliente anterior.
2. Verificar no payload se existe `promovida`.
3. Se existir, enviar mensagem ao próximo cliente da fila.
4. Se não existir, não prometer disponibilidade sem consultar `GET /n8n/products/:code`.

## Workflow 5: Pós-venda

Gatilho: `PAYMENT_CONFIRMED`.

Passos:

1. Pedir dados de entrega.
2. Ao receber endereço, chamar `POST /n8n/orders/:id/delivery-address`.
3. Enviar status da encomenda quando receber `ORDER_READY_TO_SHIP`.
4. Ao concluir entrega, chamar `POST /n8n/orders/:id/delivered`.
5. Após `ORDER_DELIVERED`, pedir feedback.

## Guardrails

O agente deve saber sempre:

- nome do cliente
- telefone
- peça reservada
- preço
- tempo restante
- estado da reserva
- estado do pagamento
- posição na fila
- histórico de mensagens
- histórico de compras

A IA não pode:

- confirmar pagamento sem validação
- alterar reserva sem regra do backend
- prometer peça indisponível
- cancelar pedido sem confirmação
- inventar preço, stock ou prazo

Encaminhar para humano:

- baixa confiança
- pedido de desconto
- troca de peça
- comprovativo ilegível
- cliente irritado
- pedido de cancelamento ambíguo
- divergência entre mensagem e backend
