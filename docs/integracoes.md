# Integrações

## Evolution API

O provider `ProvedorWhatsAppEvolution` implementa o contrato `ProvedorWhatsApp` e envia mensagens usando:

- `POST /message/sendText/{instance}`
- `POST /message/sendMedia/{instance}`
- header `apikey`
- body com `number`, `text`, `delay` e `linkPreview`
- retry com backoff para falhas temporárias
- validação anti-spam antes de chamar o provider

Configuração:

```env
N8N_ASSUME_WHATSAPP=false
WHATSAPP_PROVIDER=evolution
WHATSAPP_INTERVALO_POR_CONTATO_MS=6500
WHATSAPP_INTERVALO_GLOBAL_MS=0
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=trocar_api_key
EVOLUTION_INSTANCE=emeu
EVOLUTION_DELAY_MS=800
EVOLUTION_RETRY_ATTEMPTS=3
EVOLUTION_RETRY_INTERVAL_MS=600
EVOLUTION_LINK_PREVIEW=false
EVOLUTION_WEBHOOK_TOKEN=trocar_token_webhook_evolution
```

Entrada de mensagens:

- `POST /webhooks/evolution`
- header opcional: `X-EMEU-EVOLUTION-TOKEN`

O webhook é normalizado pelo use case `ReceberMensagemWhatsAppUseCase` e emite `WHATSAPP_MESSAGE_RECEIVED`.

Status:

- `GET /integracoes/status`
- `GET /whatsapp/templates`: lista templates aprovados para IBAN, reserva, lembrete, pagamento e atendimento.
- `POST /whatsapp/mensagens`: envia mensagem manual autenticada usando texto livre ou `templateId`.

O painel consome este status dentro de `GET /painel/resumo`.

### Central administrativa da Evolution

O ÉMeu também expõe uma camada administrativa própria para criar e conectar instâncias sem obrigar o vendedor a decorar endpoints da Evolution:

- `GET /evolution/resumo`
- `POST /evolution/instancias`
- `POST /evolution/instancias/:id/conectar`
- `POST /evolution/instancias/:id/estado`
- `POST /evolution/instancias/:id/padrao`
- `DELETE /evolution/instancias/:id`

Fluxo recomendado:

1. Entre no frontend em `/login` usando telefone.
2. Acesse `/integracoes`.
3. Crie uma instância com nome técnico, etiqueta e telefone.
4. Clique em `Conectar`.
5. Leia o QR Code pelo WhatsApp em `Dispositivos conectados`.
6. Use `Estado` para atualizar a ligação.
7. Marque a instância como padrão para os envios automáticos.

O botão `Abrir Evolution Manager` usa:

```env
EVOLUTION_MANAGER_PUBLIC_URL=http://localhost:3000
```

No Docker do ÉMeu, o manager fica no serviço `evolution-manager`. A API fica em `evolution-api`.

## Login por telefone e SMS

O login do painel segue o padrão do UOR Connect: código temporário por SMS, sessão por token e validação de telefone angolano.

Endpoints:

- `POST /auth/telefone/solicitar-codigo`
- `POST /auth/telefone/confirmar-codigo`
- `GET /auth/sessao`
- `DELETE /auth/sessao`

Configuração:

```env
AUTH_SECRET=trocar_secret_login
LOGIN_SMS_MINUTOS_EXPIRACAO=10
LOGIN_SESSAO_DIAS_EXPIRACAO=7
LOGIN_SMS_DEV_MODE=false
LOGIN_SMS_EXPOR_CODIGO_DEV=false
OMBALA_API_BASE_URL=https://api.useombala.ao
OMBALA_API_TOKEN=
OMBALA_SMS_DEFAULT_SENDER=BIZYCODE
OMBALA_SMS_SENDER_AUTH=BIZYCODE
OMBALA_SMS_SENDER_CARE=BIZYCARE
OMBALA_SMS_SENDER_LIVE=BIZYLIVE
OMBALA_SMS_SENDER_MARKET=BIZYSHOP
OMBALA_SMS_APPROVED_SENDERS=BIZYCODE,BIZYCARE,BIZYLIVE,BIZYSHOP
```

Em desenvolvimento local, `LOGIN_SMS_EXPOR_CODIGO_DEV=true` mostra o código no frontend quando o provider SMS não está configurado.
O modo de entrada sem conta só aparece quando `LOGIN_UI_DEV_MODE=true` e nunca é exposto em produção.

Os remetentes são escolhidos por finalidade. OTP e autenticação usam `BIZYCODE`, suporte usa
`BIZYCARE`, comunicações de live usam `BIZYLIVE` e Market usa `BIZYSHOP`. Envios reais de
diagnóstico rejeitam remetentes fora da lista aprovada. `BIZYPAY` só deve ser configurado após
aparecer entre os remetentes aprovados pela Ombala.

`SMS_NOTIFICACOES_TRANSACIONAIS_ATIVAS=true` liga avisos de reservas, compras, pagamentos,
entregas e suporte disparados por eventos reais. Campanhas de marketing continuam fora deste
fluxo e exigem consentimento próprio.

Diagnóstico protegido por sessão:

- `GET /diagnosticos/sms/overview`: configuração, créditos e remetentes aprovados.
- `GET /diagnosticos/sms/remetentes`: remetentes aprovados, pendentes e totais.
- `GET /diagnosticos/sms/mensagens`: histórico Ombala por página ou telefone.
- `POST /diagnosticos/sms/testar`: dry-run por padrão; com `enviarReal=true` chama Ombala.

## Login académico UOR e ISPTEC

O Bizy valida as credenciais directamente nos portais institucionais. A API do UOR Connect é
apenas um fallback opcional quando `UORCONNECT_API_URL` estiver configurado e o portal directo
não responder.

Endpoints:

- `GET /auth/disponibilidade`: informa providers, modo de ligação e métodos activos.
- `POST /auth/estudantil/login`: valida a sessão institucional e cria ou actualiza a Conta Bizy.

Configuração:

```env
LOGIN_ESTUDANTIL_DIRECT_ENABLED=true
LOGIN_ESTUDANTIL_PROVIDERS=uor,isptec
ACADEMIC_AUTH_TIMEOUT_MS=25000
SECRETARIA_UOR_LOGIN_URL=http://secretaria.uor.edu.ao/netpa/page?stage=loginstage
ISPTEC_LOGIN_URL=
ISPTEC_GROUP_SELECT_URL=
ISPTEC_PORTAL_HOME_URL=
UORCONNECT_API_URL=
UORCONNECT_AUTH_TIMEOUT_MS=25000
LOGIN_ESTUDANTIL_DEV_MODE=false
```

As cookies dos portais existem apenas em memória durante a autenticação. A palavra-passe
institucional não é gravada no Bizy, não entra em logs e não é devolvida ao frontend. A Secretaria
UOR actualmente só responde em HTTP; quando a instituição disponibilizar HTTPS, actualize
`SECRETARIA_UOR_LOGIN_URL` sem alterar o código.

## Media e comprovativos

O ÉMeu guarda ficheiros locais em `MEDIA_STORAGE_DIR` para comprovativos e imagens operacionais.

Endpoints:

- `POST /media/upload`: upload autenticado por `dataUrl`, com suporte a imagens e PDF quando `allowDocuments=true`.
- `GET /media/files/*`: leitura autenticada do ficheiro guardado.
- `POST /reservas/:id/comprovativo`: registra comprovativo pelo painel.
- `POST /n8n/payments/:id/proof-received`: registra comprovativo vindo do n8n.

Configuração:

```env
MEDIA_STORAGE_DIR=storage/media
MEDIA_UPLOAD_MAX_BYTES=12000000
```

Quando `comprovativoPagamentoUrl` vier como `data:...;base64,...`, o backend salva o ficheiro e grava uma URL interna `/media/files/...` na reserva.

## PDF

O recibo de reserva pode ser baixado por:

- `GET /reservas/:id/recibo.pdf`

O renderer usa Playwright quando disponível e pode cair para um PDF simples em ambientes sem Chromium.

```env
PDF_RENDERER_ENGINE=playwright
PDF_RENDERER_ALLOW_FALLBACK=true
```

## TikTok-Live-Connector

O provider principal é `TikTokLiveConnectorProvider`.

Ele tenta usar a API atual:

- `TikTokLiveConnection`
- `WebcastEvent.CHAT`

E mantém fallback para o legado:

- `WebcastPushConnection`
- evento `chat`

Eventos de desconexão tentam reconectar automaticamente com backoff simples.

## TikTokLive Python

O provider alternativo é `TikTokLivePythonProvider`, que executa:

```bash
python3 backend/scripts/tiktok_live_provider.py @unique_id
```

O script Python usa `TikTokLiveClient` e `CommentEvent`, imprime comentários em JSON por stdout, e o backend normaliza para `ComentarioLive`.

## Organização use-case

Classes que consultam ou alteram dados ficam em `backend/src/use-case`:

- `MotorReservas`
- `ProcessadorComentarios`
- `ConsultaAtendimentoN8n`
- `ConsultaPainelUseCase`
- `GestaoPecasUseCase`
- `MonitorReservasUseCase`
- `ReceberMensagemWhatsAppUseCase`
- `ConsultaIntegracoesUseCase`
- `AutenticacaoTelefoneUseCase`
- `GestaoWhatsAppEvolutionUseCase`
- `GerarReciboReservaUseCase`
- `use-case/repositorios/*`

Handlers HTTP apenas validam entrada, chamam use cases e devolvem resposta.
