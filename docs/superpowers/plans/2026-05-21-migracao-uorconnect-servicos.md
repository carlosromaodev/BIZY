# Migração UOR Connect Serviços Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar serviços maduros do UOR Connect para o backend do ÉMeu sem importar domínio desnecessário.

**Architecture:** Criar infraestruturas focadas (`OmbalaClient`, media storage, PDF renderer) e fortalecer providers existentes (`ProvedorSmsOmbala`, `ClienteEvolutionApi`, `ProvedorWhatsAppEvolution`). Os módulos HTTP expõem apenas operações úteis ao MVP e usam autenticação para diagnósticos sensíveis.

**Tech Stack:** TypeScript ESM, Fastify 4, Zod 3, Prisma 5, Vitest, Sharp, Playwright.

---

### Task 1: SMS Ombala Robusto

**Files:**
- Create: `backend/src/infra/provedores/OmbalaClient.ts`
- Modify: `backend/src/infra/provedores/ProvedorSmsOmbala.ts`
- Modify: `backend/src/infra/http/modulos/diagnosticos.ts`
- Test: `backend/src/testes/ombala-client.test.ts`
- Test: `backend/src/testes/sms-diagnostico.test.ts`

- [ ] Escrever testes para normalização de telefone, política de SMS, créditos, remetentes e dry-run autenticado.
- [ ] Verificar falha dos testes antes da implementação.
- [ ] Implementar `OmbalaClient` com métodos `sendMessage`, `getCredits`, `getApprovedSenders`, `getSenders`, `getPendingSenders`, `createSender`, `deleteSender`, `listMessages`, `listRecipients`, `listMessagesByRecipient`.
- [ ] Refatorar `ProvedorSmsOmbala` para usar o client.
- [ ] Adicionar endpoints de diagnóstico SMS protegidos por sessão.
- [ ] Executar testes SMS.

### Task 2: WhatsApp Evolution Robusto

**Files:**
- Modify: `backend/src/infra/provedores/ClienteEvolutionApi.ts`
- Modify: `backend/src/infra/provedores/ProvedorWhatsAppEvolution.ts`
- Modify: `backend/src/use-case/GestaoWhatsAppEvolutionUseCase.ts`
- Test: `backend/src/testes/evolution-admin.test.ts`
- Test: `backend/src/testes/evolution.test.ts`

- [ ] Escrever testes para status conectado, instância preferida, extração profunda de erro e envio com retry.
- [ ] Verificar falha dos testes antes da implementação.
- [ ] Adicionar helpers de status, política de mensagem e retry/backoff.
- [ ] Adicionar envio de texto e media ao `ClienteEvolutionApi`.
- [ ] Refatorar provider WhatsApp para usar o client robusto.
- [ ] Executar testes Evolution.

### Task 3: Media Storage para Imagens e Comprovativos

**Files:**
- Create: `backend/src/infra/media/MediaStorage.ts`
- Create: `backend/src/infra/http/modulos/media.ts`
- Modify: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- Modify: `backend/package.json`
- Test: `backend/src/testes/media-storage.test.ts`

- [ ] Escrever testes para guardar imagem como WebP, guardar PDF quando permitido e bloquear acesso público a comprovativos.
- [ ] Verificar falha dos testes antes da implementação.
- [ ] Adicionar `sharp` como dependência.
- [ ] Implementar storage local por `MEDIA_STORAGE_DIR`.
- [ ] Expor `POST /media/upload` autenticado e `GET /media/files/*` público apenas para ficheiros não privados.
- [ ] Executar testes media.

### Task 4: PDF de Recibo de Reserva

**Files:**
- Create: `backend/src/infra/pdf/PdfRenderer.ts`
- Create: `backend/src/use-case/GerarReciboReservaUseCase.ts`
- Modify: `backend/src/infra/http/modulos/reservas.ts`
- Modify: `backend/src/infra/http/ContextoAplicacao.ts`
- Modify: `backend/package.json`
- Test: `backend/src/testes/recibo-reserva-pdf.test.ts`

- [ ] Escrever testes para renderização HTML segura e endpoint de PDF de reserva.
- [ ] Verificar falha dos testes antes da implementação.
- [ ] Adicionar `playwright` como dependência.
- [ ] Implementar `escapeHtml` e `renderPdfFromHtml` com fallback de erro claro.
- [ ] Implementar recibo de reserva com dados de peça, cliente, preço, estado e referência.
- [ ] Expor `GET /reservas/:id/recibo.pdf` autenticado.
- [ ] Executar testes PDF.

### Task 5: Verificação Final

**Files:**
- Modify: `backend/.env.example`
- Modify: `docs/integracoes.md`
- Modify: `docs/RF-RNF-RN-EMEUV1.md`

- [ ] Documentar novas variáveis de ambiente.
- [ ] Marcar requisitos relacionados como implementados/parciais conforme resultado.
- [ ] Executar `npm run test --workspace backend`.
- [ ] Executar `npm run typecheck --workspace backend`.
- [ ] Executar `npm run build --workspace backend`.
