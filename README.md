# BIZY

BIZY é um MVP para automatizar vendas em lives, com foco inicial no TikTok. O vendedor cadastra as peças, conecta uma live, o sistema interpreta comentários de compra, cria reservas por prioridade e envia eventos para o n8n automatizar WhatsApp, IA e follow-ups.

## Arquitetura

- `backend`: Fastify, TypeScript, Zod, Prisma, Vitest.
- `frontend`: React, Vite, TypeScript e dashboard em tempo real.
- `prisma`: schema principal em PostgreSQL. Para testes rápidos sem banco, usar `MODO_ARMAZENAMENTO=memoria`.
- `n8n`: camada de automação para WhatsApp, atendimento com IA, aprovação humana e follow-up.
- `Evolution API`: provider direto de WhatsApp quando o backend deve enviar mensagens sem passar pelo n8n.
- `OutboxEventoN8n`: fila persistente para eventos destinados ao n8n, com retry quando o webhook falha.
- Providers de live ficam atrás do contrato `LiveCommentProvider`.
- Providers de WhatsApp ficam atrás do contrato `ProvedorWhatsApp`, mas em produção o n8n assume o envio quando `N8N_ASSUME_WHATSAPP=true`.
- O motor de reservas não conhece TikTok, Python, WhatsApp oficial, n8n ou dashboard. Ele trabalha apenas com comentários normalizados, peças e reservas.
- Classes que orquestram leituras/escritas de dados ficam em `backend/src/use-case`.
- A camada HTTP é modular: `backend/src/infra/http/ContextoAplicacao.ts` monta dependências e `backend/src/infra/http/modulos/manifestoModulosHttp.ts` registra rotas por domínio.
- O frontend também usa manifesto em `frontend/src/rotasApp.tsx`, evitando duplicação entre rotas e menu.

Análise técnica completa: `ANALISE.md`.
Decisão modular inspirada em n8n/NocoBase: `docs/arquitetura-modular.md`.

## Como rodar

```bash
npm install
cp backend/.env.example backend/.env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run bootstrap:ambiente
npm run dev
```

Backend: `http://localhost:3333`
Frontend: `http://localhost:5173`

O comando `npm run dev` sobe PostgreSQL/Redis/Evolution via Docker, mantém o túnel ngrok sincronizado, inicia backend/frontend locais e para backend/frontend Docker para evitar processos duplicados. Para parar também o ngrok ao sair, use:

```bash
STOP_NGROK_ON_EXIT=true npm run dev
```

Rotas do frontend:

- `/`: home comercial do produto.
- `/login`: acesso por telefone e código SMS.
- `/app`: cockpit de operação da live.
- `/app/catalogo`: catálogo real de peças vindo do backend.
- `/app/comentarios`: comentários reais, parser e revisão.
- `/app/reservas`: reservas e pagamentos reais.
- `/app/conversas`: conversas e contexto derivados de comentários/reservas do backend.
- `/app/whatsapp`: administração de WhatsApp, Evolution API e QR Code.
- `/app/agentes`: agentes operacionais lidos de `/automacoes/status`.
- `/app/n8n`: workflows, guardrails e contrato n8n.
- `/app/configuracoes`: parâmetros em execução lidos do backend.

Para iniciar rápido sem banco persistente, defina `MODO_ARMAZENAMENTO=memoria` no `backend/.env`.

## Produção

Guia completo: `docs/deploy.md`.

Pontos obrigatórios antes de subir em servidor:

- Criar PostgreSQL e configurar `DATABASE_URL`.
- Executar `npm run prisma:migrate:deploy` no backend.
- Executar `npm run bootstrap:ambiente` para validar variáveis críticas e criar configurações padrão dos módulos por negócio.
- Configurar rotina externa para `npm run backup:postgres` e testar `CONFIRM_RESTORE=SIM BACKUP_FILE=... npm run restore:postgres` em ambiente controlado.
- Manter `AUTH_COOKIE_SECURE=true` em produção com HTTPS ativo no proxy.
- Configurar `RATE_LIMIT_REDIS_REST_URL` e `RATE_LIMIT_REDIS_REST_TOKEN` quando houver mais de uma instância do backend.
- Configurar `N8N_WEBHOOK_EVENTOS_URL`, `N8N_WEBHOOK_SECRET` e `N8N_BACKEND_TOKEN`.
- Configurar `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `EVOLUTION_WEBHOOK_TOKEN`.
- Configurar `OMBALA_API_TOKEN` para SMS real.
- Definir `TIKTOK_LIVE_USERNAME` com o `@uniqueId` da conta que fará a live.

Modelo de ambiente: `backend/.env.production.example`.

## Docker

Stack completa com backend, frontend, PostgreSQL, Redis, n8n, Evolution API e Evolution Manager:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

Detalhes em `docs/docker.md`.

## n8n

A documentação da integração está em `docs/n8n.md`.
Os workflows importáveis ficam em `n8n/workflows`.

Fluxo recomendado:

- Backend emite eventos para `N8N_WEBHOOK_EVENTOS_URL`.
- n8n envia WhatsApp, executa IA, pede aprovação humana e chama endpoints `/n8n/*`.
- Backend continua a validar stock, reserva, fila, pagamento, expiração e histórico.

Modelos prontos:

- `n8n/workflows/emeu-eventos-vendas.json`
- `n8n/workflows/emeu-atendimento-whatsapp.json`
- `n8n/workflows/emeu-comprovativo-pagamento.json`

## Evolution API

Para envio direto pelo backend:

```env
N8N_ASSUME_WHATSAPP=false
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=trocar_api_key
EVOLUTION_INSTANCE=emeu
EVOLUTION_WEBHOOK_TOKEN=trocar_token_webhook_evolution
```

Para testar webhooks e WhatsApp fora da rede local com túnel público, use `docs/ngrok.md`.

Endpoint de webhook para mensagens recebidas pela Evolution:

- `POST /webhooks/evolution`

O envio usa `POST /message/sendText/{instance}` da Evolution com header `apikey`.

Status operacional das integrações:

- `GET /integracoes/status`

Administração da Evolution pelo ÉMeu:

- `GET /evolution/resumo`
- `POST /evolution/instancias`
- `POST /evolution/instancias/:id/conectar`
- `POST /evolution/instancias/:id/estado`
- `POST /evolution/instancias/:id/padrao`
- `DELETE /evolution/instancias/:id`

O vendedor cria a instância em `/integracoes`, clica em `Conectar` e escaneia o QR Code com WhatsApp > Dispositivos conectados.

## Login por telefone

O painel usa login por telefone com código SMS:

- `POST /auth/telefone/solicitar-codigo`
- `POST /auth/telefone/confirmar-codigo`
- `GET /auth/sessao`
- `DELETE /auth/sessao`

Configuração principal:

```env
AUTH_SECRET=trocar_secret_login
OMBALA_API_BASE_URL=https://api.useombala.ao
OMBALA_API_TOKEN=
OMBALA_SMS_DEFAULT_SENDER=BIZYCODE
OMBALA_SMS_SENDER_AUTH=BIZYCODE
OMBALA_SMS_SENDER_CARE=BIZYCARE
OMBALA_SMS_SENDER_LIVE=BIZYLIVE
OMBALA_SMS_SENDER_MARKET=BIZYSHOP
OMBALA_SMS_APPROVED_SENDERS=BIZYCODE,BIZYCARE,BIZYLIVE,BIZYSHOP
SMS_NOTIFICACOES_TRANSACIONAIS_ATIVAS=true
LOGIN_SMS_DEV_MODE=false
LOGIN_SMS_EXPOR_CODIGO_DEV=false
```

## Providers de comentários

Contrato principal:

```ts
interface LiveCommentProvider {
  connect(liveUsername: string): Promise<void>;
  onComment(callback: (comment: LiveComment) => void): void;
  disconnect(): Promise<void>;
}
```

Implementações previstas:

- `TikTokLiveConnectorProvider`: provider principal em Node.js usando `tiktok-live-connector`.
- `TikTokLivePythonProvider`: fallback via processo Python usando `TikTokLive`.
- `ManualProvider`: modo manual para testes, contingência e operação quando a captura falhar.
- `FutureInstagramProvider`: contrato preparado para integração futura.

## RF - Requisitos Funcionais

- RF01: O sistema deve conectar numa live do TikTok pelo `username`/`uniqueId`.
- RF02: O sistema deve capturar comentários em tempo real.
- RF03: O sistema deve normalizar comentários para um formato único.
- RF04: O sistema deve interpretar intenção de compra em comentários tolerando erros de escrita.
- RF05: O sistema deve extrair telefone angolano e código da peça independentemente da ordem.
- RF06: O sistema deve enviar comentários ambíguos para revisão manual.
- RF07: O sistema deve cadastrar peças com código, nome, descrição, preço, quantidade, fotos e estado.
- RF08: O sistema deve criar reserva automática para o primeiro comentário válido.
- RF09: O sistema deve colocar clientes seguintes em fila de espera quando não houver stock livre.
- RF10: O sistema deve expirar reservas após o tempo limite configurado.
- RF11: O sistema deve promover automaticamente o próximo cliente da fila quando uma reserva expirar ou for cancelada.
- RF12: O sistema deve enviar WhatsApp automático para reserva criada, fila de espera, expiração, pagamento, cancelamento e peça vendida.
- RF13: O painel deve mostrar live ativa, comentários, reservas, fila de espera e stock.
- RF14: O painel deve permitir confirmar pagamento, cancelar reserva, cadastrar peça e simular comentário manual.
- RF15: O sistema deve transmitir eventos em tempo real via SSE.
- RF16: O sistema deve permitir troca manual do provider de captura.
- RF17: O backend deve publicar eventos de venda para o n8n via webhook assinado.
- RF18: O backend deve expor endpoints `/n8n/*` para consulta contextual e ações controladas.
- RF19: O n8n deve enviar mensagens WhatsApp de reserva, lembrete, fila, pagamento, entrega e pós-venda.
- RF20: O n8n deve encaminhar atendimento sensível para aprovação humana.
- RF21: O backend deve poder enviar WhatsApp diretamente pela Evolution API.
- RF22: O backend deve receber e normalizar webhooks da Evolution API.
- RF23: O provider TikTok principal deve suportar a API atual do `tiktok-live-connector` e fallback legado.
- RF24: O frontend deve ter rotas públicas e autenticadas para home, login, operação e integrações.
- RF25: O sistema deve permitir login por telefone com código SMS.
- RF26: O painel deve permitir criar, conectar, consultar, definir padrão e remover instâncias da Evolution API.
- RF27: O painel deve exibir QR Code ou código de pareamento para conectar o WhatsApp.

## RNF - Requisitos Não Funcionais

- RNF01: O backend deve ser implementado em Fastify, Node.js e TypeScript.
- RNF02: O frontend deve ser implementado em React e Vite.
- RNF03: As entradas HTTP e dados críticos devem ser validados com Zod.
- RNF04: O domínio deve seguir separação por contratos para respeitar SOLID.
- RNF05: O banco principal deve usar Prisma com PostgreSQL.
- RNF06: O sistema deve ter testes unitários com Vitest para parser e motor de reservas.
- RNF07: As bibliotecas não oficiais do TikTok devem ficar isoladas em providers.
- RNF08: O sistema deve registrar eventos internos para auditoria e automações.
- RNF09: O WhatsApp deve ter provider modular para API oficial ou alternativa.
- RNF10: O envio automático deve ter rate limit para evitar duplicidade e spam.
- RNF11: O sistema deve manter logs do comentário original como evidência de consentimento.
- RNF12: O sistema deve aceitar múltiplas lives, lojas e providers em evolução sem alterar o motor principal.
- RNF13: A comunicação backend → n8n deve usar webhook com assinatura HMAC.
- RNF14: A comunicação n8n → backend deve usar token em `X-EMEU-N8N-TOKEN`.
- RNF15: A IA deve receber contexto do backend e não deve inventar preço, stock, prazo ou estado.
- RNF16: Operações de consulta/escrita de dados devem ficar em classes de `use-case`, não diretamente nos handlers HTTP.
- RNF17: O provider Evolution deve ficar atrás de `ProvedorWhatsApp`.
- RNF18: O provider TikTok deve ficar atrás de `LiveCommentProvider`.
- RNF19: O envio de SMS deve ficar atrás de `ProvedorSms`.
- RNF20: As operações de login e instâncias WhatsApp devem ficar em use cases.
- RNF21: Endpoints operacionais devem exigir sessão do vendedor.
- RNF22: Eventos destinados ao n8n devem ser persistidos em outbox antes/retry de publicação.
- RNF23: O backend deve aplicar rate limit configurável nos endpoints HTTP.

## RN - Regras de Negócio

- RN01: Comentários válidos precisam ter intenção de compra, telefone angolano válido e código de peça.
- RN02: A ordem entre telefone e código da peça não importa.
- RN03: O código da peça pode aparecer como `4`, `peça 4`, `peca 4`, `#4`, `produto 4` ou `item 4`.
- RN04: Intenções reconhecidas incluem `eu quero`, `eu queri`, `eu qro`, `qro`, `qr`, `meu`, `é meu`, `pega`, `reserva`, `guarda` e `fica pra mim`.
- RN05: Se faltar telefone ou peça, o comentário vai para revisão manual.
- RN06: Se o telefone não for angolano válido, o comentário vai para revisão manual.
- RN07: O primeiro comentário válido ganha prioridade.
- RN08: Uma peça sem stock livre coloca o cliente em `WAITLISTED`.
- RN09: Reservas em `WAITING_PAYMENT` bloqueiam stock durante o prazo configurado.
- RN10: Se o cliente não pagar dentro do prazo, a reserva passa para `EXPIRED`.
- RN11: Ao expirar ou cancelar uma reserva, o primeiro cliente em fila é promovido.
- RN12: O mesmo cliente não deve gerar reservas duplicadas para a mesma peça enquanto já existir reserva ativa.
- RN13: Peças pagas podem ser marcadas como vendidas quando a quantidade vendida atingir o stock.
- RN14: O sistema nunca deve depender diretamente de uma biblioteca específica para capturar comentários.
- RN15: Em falha de provider automático, o vendedor pode usar o modo manual sem perder reservas já criadas.
- RN16: O n8n pode automatizar mensagens, mas não pode alterar reservas fora dos endpoints autorizados.
- RN17: Pagamento só pode ser confirmado pelo backend após validação humana ou regra explícita.
- RN18: Pedido de desconto, troca de peça, cliente irritado ou comprovativo ilegível devem ir para humano.
- RN19: O atendimento com IA deve usar apenas dados retornados pelo backend.
- RN20: Quando `N8N_ASSUME_WHATSAPP=true`, o backend emite eventos mas não envia WhatsApp diretamente.
- RN21: Quando `WHATSAPP_PROVIDER=evolution` e `N8N_ASSUME_WHATSAPP=false`, o envio direto usa Evolution.
- RN22: O código de login expira no prazo configurado e não deve ser reutilizado.
- RN23: A instância padrão da Evolution é a primeira candidata para envio operacional.

## Eventos Internos

- `LIVE_CONNECTED`
- `COMMENT_RECEIVED`
- `COMMENT_PARSED`
- `INTENT_DETECTED`
- `RESERVATION_CREATED`
- `RESERVATION_EXPIRING`
- `RESERVATION_WAITLISTED`
- `RESERVATION_EXPIRED`
- `PAYMENT_PROOF_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_REJECTED`
- `ORDER_READY_TO_SHIP`
- `ORDER_DELIVERED`
- `WHATSAPP_MESSAGE_RECEIVED`
- `WHATSAPP_MESSAGE_SENT`
- `STOCK_UPDATED`

## Endpoints principais

- `GET /saude`
- `GET /eventos`
- `POST /lives/iniciar`
- `POST /comentarios/manual`
- `GET /integracoes/status`
- `GET /automacoes/status`
- `GET /atendimento/conversas`
- `GET /painel/resumo`
- `POST /pecas`
- `GET /pecas`
- `GET /reservas`
- `POST /reservas/:id/confirmar-pagamento`
- `POST /reservas/:id/cancelar`
- `POST /reservas/expirar`
- `GET /n8n/customers/by-phone/:phone`
- `GET /n8n/reservations/active/:phone`
- `GET /n8n/products/:code`
- `POST /n8n/reservations/:id/cancel`
- `POST /n8n/payments/:id/proof-received`
- `POST /n8n/payments/:id/confirm`
- `POST /n8n/payments/:id/reject`
- `POST /n8n/orders/:id/delivery-address`
- `POST /n8n/orders/:id/delivered`
- `POST /webhooks/evolution`
- `POST /auth/telefone/solicitar-codigo`
- `POST /auth/telefone/confirmar-codigo`
- `GET /auth/sessao`
- `DELETE /auth/sessao`
- `GET /evolution/resumo`
- `POST /evolution/instancias`
- `POST /evolution/instancias/:id/conectar`
- `POST /evolution/instancias/:id/estado`
- `POST /evolution/instancias/:id/padrao`
- `DELETE /evolution/instancias/:id`

## Prioridades do MVP

1. Captura com `TikTokLiveConnectorProvider`.
2. Parser inteligente com validação angolana.
3. Reserva automática e fila de espera.
4. n8n para WhatsApp, IA e follow-ups.
5. Dashboard em tempo real.
6. Fallback com `TikTokLivePythonProvider`.
