# Estado da refatoracao Commerce

Revisao de origem: `72a575f25cdeb21b3b701f6d4f3578d98c3bdfa9`  
Documento-alvo: `BIZY-REFATORACAO-SOCIAL-COMMERCE-AFILIACAO-COMPRADOR-2026-07-14.md`

## Fase 0 — Auditoria tecnica e plano

Estado: CONCLUIDA

### Implementado

- [x] Documento-alvo lido integralmente e identificado por hash.
- [x] Codigo, schema, HTTP, use cases, repositorios, frontend e testes inventariados.
- [x] Funcionalidades completas, parciais e ausentes classificadas.
- [x] Riscos de seguranca e migration documentados.
- [x] Plano por ficheiro, rollback e testes definidos.

### Ficheiros alterados

- `docs/implementacao/commerce-refactor-auditoria.md`.
- `docs/implementacao/commerce-refactor-status.md`.

### Migrations

- Nenhuma; fase documental.

### Testes

- `npm run typecheck`: aprovado em backend e frontend.
- Testes backend focados em auth, checkout, Market e afiliados: 32 aprovados.

### Riscos restantes

- Endpoints publicos do comprador expostos por identificador ate o cutover da Fase 1.
- Identidades ainda separadas entre operador e cliente.

### Proxima fase

- Fase 1: conta universal e seguranca do comprador.

## Fase 1 — Conta universal e seguranca do comprador

Estado: EM EXECUCAO

### Implementado

- [ ] Schema expansivo e migration.
- [ ] Repositorio e caso de uso de `ContaBizy`.
- [ ] OTP e sessoes revogaveis para comprador.
- [ ] Perfil, enderecos, preferencias, consentimentos e dispositivos.
- [ ] Compra guest com token restrito e associacao posterior.
- [ ] Portal autenticado e remocao de PII em URLs.
- [ ] Testes de IDOR, enumeracao, expiracao e ownership.

### Ficheiros alterados

- A preencher durante a implementacao.

### Migrations

- A criar.

### Testes

- Linha de base aprovada; verificacao final pendente.

### Riscos restantes

- Conflitos de contacto em dados historicos exigem backfill conservador.

### Proxima fase

- Fase 2, somente depois dos gates da Fase 1.

## Fases 2 a 12

Estado: NAO INICIADAS

O detalhe de cada fase sera aberto apenas quando a fase anterior cumprir migrations, autorizacao, testes negativos, typecheck, testes e build.
