# Spec - Envio Binario na Conversa WhatsApp Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: execucao
Owner logico: Atendimento/WhatsApp

## 1. Objetivo

Fechar a lacuna P1 de envio real de imagem e documento a partir da conversa de atendimento, usando o mesmo fluxo CRM que ja registra historico, politica WhatsApp e fallback de provider.

## 2. Contexto

O backend ja recebia media inbound, armazenava comprovativos e normalizava webhooks. A lacuna estava no envio manual outbound: a conversa aceitava metadados visuais, mas o provider ainda seguia essencialmente texto. O resultado esperado e um caminho unico: atendente escolhe imagem/PDF, backend valida e persiste, provider envia media, historico mostra o anexo.

## 3. Escopo

- `POST /atendimento/conversas/:id/mensagens` aceita `mediaDataUrl`, `mediaUrl`, `mediaMimeType` e `mediaFileName`.
- Backend salva media binaria de atendimento em storage privado.
- `AutomacaoWhatsApp` transporta media ate o provider e nao grava base64 no contexto persistido.
- Evolution usa endpoint `sendMedia`.
- WhatsApp Cloud API usa payload `image`/`document` quando ha URL HTTPS publica.
- Frontend da pagina Conversas permite anexar PNG/JPG/WebP/PDF ate 10 MB.
- Historico de mensagens mostra link de anexo resolvido por `resolverUrlMedia`.
- Testes cobrem politica, provider, storage, CRM e UI.

## 4. Fora de Escopo

- Upload direto multipart pelo frontend.
- Conversao/transcodificacao adicional de imagem.
- Preview inline de imagem/PDF dentro do chat.
- Envio de media pela rota manual generica `/whatsapp/mensagens`.
- URL publica temporaria assinada para Cloud API quando a media so existe em storage privado.

## 5. Regras

- Anexo outbound por arquivo local exige conversa CRM vinculada.
- `mediaDataUrl` pode ir ao provider, mas nao deve ficar persistido no contexto.
- Storage de atendimento e privado por padrao.
- Cloud API so envia media por URL HTTPS publica.
- Se nao houver texto, media ainda pode ser enviada com tipo `IMAGEM` ou `DOCUMENTO`.

## 6. Implementacao

- `backend/src/dominio/provedores/ProvedorWhatsApp.ts`
- `backend/src/dominio/servicos/AutomacaoWhatsApp.ts`
- `backend/src/dominio/esquemas.ts`
- `backend/src/infra/http/modulos/operacional.ts`
- `backend/src/infra/media/MediaStorage.ts`
- `backend/src/infra/provedores/ProvedorWhatsAppEvolution.ts`
- `backend/src/infra/provedores/ProvedorWhatsAppCloudApi.ts`
- `backend/src/testes/whatsapp-politica.test.ts`
- `backend/src/testes/evolution-admin.test.ts`
- `backend/src/testes/crm-atendimento.test.ts`
- `frontend/src/paginas/Conversas.tsx`
- `frontend/src/estilos.css`

## 7. Testes e Verificacao

- `cd backend && npx vitest run src/testes/whatsapp-politica.test.ts src/testes/evolution-admin.test.ts src/testes/media-storage.test.ts src/testes/crm-atendimento.test.ts`
- `cd frontend && npx vitest run testes/conversas-crm.test.ts`
- `npm run typecheck --workspace backend`
- `npm run typecheck --workspace frontend`

## 8. Criterios de Aceite

- [x] Backend aceita media binaria ou URL na resposta da conversa.
- [x] Backend persiste arquivo de atendimento em storage privado.
- [x] Contexto persistido guarda URL/metadados e nao guarda base64.
- [x] Evolution envia media via `sendMedia`.
- [x] Cloud API monta payload de imagem/documento com URL HTTPS publica.
- [x] Frontend permite selecionar/remover anexo antes do envio.
- [x] Frontend bloqueia tipo/tamanho invalido.
- [x] Historico renderiza link de anexo.
- [x] Testes focados cobrem backend e frontend.

## 9. Links

- `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-envio-binario-conversa-bizy.md`
