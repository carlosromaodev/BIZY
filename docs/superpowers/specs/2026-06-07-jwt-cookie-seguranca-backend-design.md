# JWT Cookie Segurança Backend Design

## Objetivo

Fortalecer a autenticação do backend Bizy usando JWT assinado em cookie HttpOnly, preservando a revogação server-side das sessões atuais e mantendo compatibilidade temporária com `Authorization: Bearer`.

## Decisão

- Usar `@fastify/jwt@8`, `@fastify/cookie@9` e `@fastify/helmet@11`, compatíveis com Fastify 4.
- Emitir token JWT com `sub`, `sid`, `jti`, `typ`, `iss`, `aud`, `iat` e `exp`.
- Guardar no banco apenas o hash do `jti`, não o JWT inteiro.
- Aceitar token por cookie `bizy_sessao` e por `Authorization: Bearer`.
- Validar sempre duas camadas: assinatura JWT e sessão ativa no repositório.
- Logout revoga a sessão por `jti` e expira o cookie.
- Cookies usam `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age`, `Expires` e `Secure` em produção.
- Rotas públicas continuam públicas; rotas operacionais seguem exigindo autenticação.

## Fora do Escopo Desta Entrega

- Refresh token rotativo.
- CSRF token dedicado para todas as mutações.
- Migração total do frontend para cookie-only.
- Remoção completa de Bearer token.

## Testes Necessários

- Login emite JWT e cookie HttpOnly.
- `/auth/sessao` autentica com cookie JWT.
- `/auth/sessao` autentica com Bearer JWT.
- Token adulterado retorna 401.
- Logout revoga sessão e o mesmo JWT deixa de funcionar.
- Typecheck do backend.
