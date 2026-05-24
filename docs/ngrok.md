# Ngrok para o sistema Bizy

Este projeto usa ngrok para expor o sistema Bizy em desenvolvimento: a interface abre no browser e os webhooks externos continuam a chegar ao backend.

O túnel não deve apontar para a Evolution API. A Evolution continua local em `http://localhost:8080` para o backend enviar WhatsApp. O ngrok aponta para o frontend Vite em `http://localhost:5173`; o Vite encaminha `/webhooks`, `/saude` e as rotas da API para o backend em `http://localhost:3333`.

## Variáveis

Arquivo local: `.env`

```env
NGROK_PORT=5173
NGROK_REGION=us
NGROK_AUTHTOKEN=coloque_o_token_localmente
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_PUBLIC_URL=http://localhost:8080
```

Arquivo local: `backend/.env`

```env
EVOLUTION_API_URL=http://localhost:8080
```

O script atualiza:

```env
BACKEND_PUBLIC_URL=https://seu-tunel.ngrok-free.app
APP_PUBLIC_URL=https://seu-tunel.ngrok-free.app
EVOLUTION_WEBHOOK_URL=https://seu-tunel.ngrok-free.app/webhooks/evolution?token=...
```

## Setup rápido

```bash
npm run dev:backend
npm run dev:frontend
npm run ngrok:sistema
docker compose up -d --force-recreate evolution-api
```

O script:

- usa `NGROK_AUTHTOKEN` se existir no `.env`;
- abre túnel para `NGROK_PORT`, por padrão `5173`;
- lê a URL pública em `http://localhost:4040/api/tunnels`;
- sincroniza `BACKEND_PUBLIC_URL`, `APP_PUBLIC_URL` e `EVOLUTION_WEBHOOK_URL`;
- não altera `EVOLUTION_API_URL`.

## Domínio reservado

```bash
bash scripts/setup-ngrok-domain.sh seu-dominio.ngrok-free.app
```

## Atualizar URL sem reiniciar túnel

```bash
npm run ngrok:update
```

## Observações

- A URL muda quando ngrok reinicia sem domínio reservado.
- O token real não deve ser colocado nos ficheiros `.example`.
- Reinicie a Evolution API depois de atualizar `EVOLUTION_WEBHOOK_URL`, porque ela lê essa variável no arranque.
- Se abrir a URL pública e aparecer apenas JSON, o túnel ainda está preso ao backend antigo. Reinicie com `npm run ngrok:sistema`; o script encerra o túnel anterior e sobe em `5173`.
