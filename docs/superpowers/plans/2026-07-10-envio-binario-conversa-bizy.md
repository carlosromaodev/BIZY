# Envio Binario na Conversa WhatsApp Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o atendente envie imagem/PDF real pela conversa CRM, com historico persistido e provider WhatsApp usando media de verdade.

**Meta global:** Capacidade melhorada: execucao.

**Architecture:** A pagina Conversas envia `mediaDataUrl` ou `mediaUrl` para o endpoint CRM; o backend valida, persiste a media em storage privado, transporta media no contrato `ProvedorWhatsApp` e grava no historico apenas URL/metadados sanitizados.

**Tech Stack:** Fastify, Zod, TypeScript, React, Vitest, Evolution API, WhatsApp Cloud API.

---

## File Structure

Create:

- `docs/superpowers/specs/2026-07-10-envio-binario-conversa-bizy.md`
- `docs/superpowers/plans/2026-07-10-envio-binario-conversa-bizy.md`

Modify:

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
- `docs/sdd/03-roadmap-sdd.md`
- `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/wiki/pages/memoria-viva-bizy.md`
- `docs/wiki/pages/requisitos-funcionais-bizy.md`
- `docs/wiki/log.md`

---

### Task 1: Backend contract

- [x] **Step 1: Estender contrato do provider**

Adicionar `media` opcional em `MensagemWhatsApp`.

- [x] **Step 2: Estender automacao manual**

Fazer `AutomacaoWhatsApp` aceitar media, derivar tipo `MANUAL_IMAGEM`/`MANUAL_DOCUMENTO` e emitir eventos sanitizados.

- [x] **Step 3: Estender schema HTTP**

Adicionar `mediaDataUrl`, `mediaMimeType`, `mediaFileName` e permitir envio sem texto quando ha media.

### Task 2: Backend delivery

- [x] **Step 1: Persistir anexo de atendimento**

Salvar `mediaDataUrl` com purpose `atendimento-anexos`, documento permitido e limite de 10 MB.

- [x] **Step 2: Enviar pela Evolution**

Mapear imagem/documento para `sendMedia` com `mediatype`, `mimetype`, `caption`, `media` e `fileName`.

- [x] **Step 3: Enviar pela Cloud API**

Gerar payload `image`/`document` somente quando a media possui URL HTTPS publica.

### Task 3: Frontend Conversas

- [x] **Step 1: Adicionar seletor de arquivo**

Permitir PNG/JPG/WebP/PDF ate 10 MB no composer.

- [x] **Step 2: Enviar media pelo endpoint CRM**

Converter arquivo para data URL e enviar `mediaDataUrl`, `mediaMimeType`, `mediaFileName` e `tipo`.

- [x] **Step 3: Renderizar anexo no historico**

Extrair media do contexto da mensagem e mostrar link resolvido por `resolverUrlMedia`.

### Task 4: Testar

- [x] **Step 1: Teste de politica/automacao**

Garantir que media chega ao provider e base64 nao fica persistido no contexto.

- [x] **Step 2: Teste provider Evolution**

Garantir chamada `sendMedia` com body esperado.

- [x] **Step 3: Teste CRM e storage**

Rodar suite de atendimento e media; mockar Evolution externa para evitar timeout de rede no teste.

- [x] **Step 4: Teste frontend**

Cobrir contrato da pagina Conversas e typecheck.

### Task 5: Documentar

- [x] **Step 1: Atualizar SDD**

Marcar envio binario real como `[x]` no roadmap e dominio 05.

- [x] **Step 2: Atualizar wiki**

Atualizar prioridades, memoria viva, requisitos e log.

### Task 6: Validar

- [x] **Step 1: Rodar verificacoes**

```bash
cd backend && npx vitest run src/testes/whatsapp-politica.test.ts src/testes/evolution-admin.test.ts src/testes/media-storage.test.ts src/testes/crm-atendimento.test.ts
cd frontend && npx vitest run testes/conversas-crm.test.ts
npm run typecheck --workspace backend
npm run typecheck --workspace frontend
```

- [x] **Step 2: Conferir diff**

Garantir que nao ha base64 em contexto persistido e que docs usam `[x]`/`[ ]` onde aplicavel.
