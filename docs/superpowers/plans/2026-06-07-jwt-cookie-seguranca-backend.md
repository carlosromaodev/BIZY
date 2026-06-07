# JWT Cookie Segurança Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar JWT assinado em cookie HttpOnly mantendo revogação server-side.

**Architecture:** A autenticação continua centralizada em `AutenticacaoTelefoneUseCase`, mas o token de sessão passa a ser um JWT assinado cujo `jti` é guardado por hash. A camada HTTP usa plugins Fastify oficiais para cookie/JWT/headers e continua expondo helpers em `seguranca.ts`.

**Tech Stack:** Fastify 4, `@fastify/jwt@8`, `@fastify/cookie@9`, `@fastify/helmet@11`, Vitest, TypeScript.

---

### Task 1: Dependências

**Files:**
- Modify: `backend/package.json`
- Modify: `package-lock.json`

- [ ] Instalar `@fastify/jwt@8.0.1`, `@fastify/cookie@9.4.0`, `@fastify/helmet@11.1.1`.

### Task 2: Testes RED

**Files:**
- Modify: `backend/src/testes/auth-cookie-http.test.ts`

- [ ] Adicionar testes para JWT no cookie, Bearer JWT, token adulterado e revogação no logout.
- [ ] Rodar `npx vitest run src/testes/auth-cookie-http.test.ts` e confirmar falha antes da implementação.

### Task 3: Serviço de Sessão JWT

**Files:**
- Modify: `backend/src/use-case/AutenticacaoTelefoneUseCase.ts`
- Modify: `backend/src/dominio/repositorios/contratos.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioMemoria.ts`
- Modify: `backend/src/use-case/repositorios/RepositorioPrisma.ts`

- [ ] Emitir JWT com claims rígidas.
- [ ] Guardar hash do `jti`.
- [ ] Validar sessão ativa por `jti`.
- [ ] Revogar por `jti`.

### Task 4: Camada HTTP Segura

**Files:**
- Modify: `backend/src/infra/http/criarAplicacao.ts`
- Modify: `backend/src/infra/http/seguranca.ts`
- Modify: `backend/src/infra/http/modulos/autenticacao.ts`

- [ ] Registrar plugins de cookie, JWT e helmet.
- [ ] Trocar cookie manual por `reply.setCookie`.
- [ ] Extrair token de cookie plugin e header Bearer.
- [ ] Usar JWT em `/auth/sessao`, logout e guardas operacionais.

### Task 5: Verificação

- [ ] Rodar `npx vitest run src/testes/auth-cookie-http.test.ts`.
- [ ] Rodar `npm run typecheck --workspace backend`.
- [ ] Rodar teste de regressão de rotas comerciais relevante.
