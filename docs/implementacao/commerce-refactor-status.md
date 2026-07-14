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

Estado: CONCLUIDA

### Implementado

- [x] Schema expansivo e migration sem remocao de `UsuarioSistema`.
- [x] `ContaBizy` universal com contextos de comprador, afiliado, criador, seller, produtor Learning e membro de negocio.
- [x] Compatibilidade progressiva com `UsuarioSistema` e isolamento dos contextos por negocio.
- [x] OTP por telefone, limite por contacto, tentativas limitadas e codigo armazenado como hash.
- [x] Sessoes opacas, revogaveis e associadas a dispositivo, IP e user-agent anonimizados.
- [x] Perfil de comprador, enderecos, preferencias, consentimentos, dispositivos e favoritos persistentes.
- [x] Compra guest com token de alta entropia, hash, expiracao, ownership e revogacao apos associacao.
- [x] Associacao posterior de compras ao telefone verificado sem expor PII em URL ou resposta publica.
- [x] Portal autenticado e pagina de compra autorizada por conta ou token especifico da compra.
- [x] Remocao da rota e do use case que pesquisavam compras livremente por telefone ou email.
- [x] Testes negativos de IDOR, enumeracao, token expirado, token de outra compra e ownership de endereco.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260714223000_conta_bizy_comprador/migration.sql`.
- `backend/src/projetos/commerce/` para dominio, aplicacao, repositorios e HTTP da conta universal.
- `backend/src/infra/http/ContextoAplicacao.ts`, `criarAplicacao.ts` e manifesto de modulos.
- Contratos, tipos e repositorios de compras unificadas em memoria e Prisma.
- Checkout e portal do comprador em `backend/src/projetos/market/`.
- APIs e paginas de checkout, compra, portal e produto em `frontend/src/projetos/market/`.
- Testes de conta, checkout, Market e configuracao deterministica do Vitest.

### Migrations

- Expand: novas tabelas de conta, perfil, contexto, endereco, favorito, consentimento, dispositivo, sessao, OTP e acesso guest.
- Compatibilidade: FK opcional `CompraUnificada.contaBizyId` e backfill conservador de `UsuarioSistema`/`MembroNegocio`.
- Indices: contactos unicos, sessoes/tokens, contextos, ownership e expiracoes.
- Rollback: nao apagar tabelas com dados; desligar o modulo novo, manter dual read e remover FK/coluna apenas numa contract migration posterior.
- Validacao: 53 migrations aplicadas do zero numa base PostgreSQL descartavel; schema final actualizado.

### Testes

- `npm run typecheck`: backend e frontend aprovados.
- Backend focado: 21 testes aprovados.
- Backend integral sequencial: 368 aprovados e 1 ignorado.
- Frontend integral: 144 testes aprovados.
- `npm run build`: backend e frontend aprovados.
- Migration PostgreSQL do zero: 53/53 aplicadas e `migrate status` actualizado.
- Browser QA: OTP, login e logout aprovados em 1440x900; layout sem overflow e rodape no fim em 1440x900 e 375x812.
- Consola: nenhum erro de aplicacao ou resposta 5xx; apenas 401 esperados na sondagem de sessao anonima.

### Riscos restantes

- Contactos historicos foram migrados sem os marcar como verificados; a verificacao ocorre apenas por OTP.
- Email e persistido como contacto da identidade, mas nao concede autenticacao enquanto nao existir verificacao por provider dedicado.
- O upload privado de comprovativos e a reserva transacional de stock pertencem as Fases 2 e 3.

### Proxima fase

- Fase 2: produto, variantes reais, preco e stock por combinacao.

## Fases 2 a 12

Estado: NAO INICIADAS

O detalhe de cada fase sera aberto apenas quando a fase anterior cumprir migrations, autorizacao, testes negativos, typecheck, testes e build.
