# Spec - Guard de URL por Modulo Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/02-identidade-acesso-negocios.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: controlo
Owner logico: Identidade/Frontend

## 1. Objetivo

Fechar a lacuna P1 de acesso direto por URL quando um modulo esta desligado no negocio, sem substituir o bloqueio real do backend.

## 2. Contexto

A navegacao ja escondia modulos desligados. O risco restante era o utilizador digitar uma URL como `/app/loja` ou usar a rota legada `/app/loja-publica` mesmo com `loja-publica` desativado.

## 3. Escopo

- `RotaPrivada` recebe `modulo`.
- `LayoutApp` repassa `modulo` da rota.
- A rota consulta `/negocio/modulos` antes de renderizar superficies com modulo opcional.
- Se o modulo nao estiver ativo, redireciona para `/app`.
- A rota reage a troca de workspace.
- A rota legada `/app/loja-publica` passa a exigir `loja-publica`.

## 4. Fora de Escopo

- Matriz RBAC/ABAC completa por dominio.
- Substituir guardas do backend.
- Tela dedicada de upsell/ativacao de modulo.

## 5. Regras

- Rota sem `modulo` continua acessivel se a sessao for valida.
- Rota com `modulo` so renderiza se `/negocio/modulos` listar o modulo em `modulosAtivos`.
- Erro ao consultar modulos bloqueia a rota por seguranca.
- Backend continua respondendo `MODULO_DESATIVADO` em endpoints protegidos.

## 6. Implementacao

- `frontend/src/App.tsx`
- `frontend/src/rotasApp.tsx`
- `frontend/testes/modulos-ui.test.ts`

## 7. Testes e Verificacao

- `cd frontend && npx vitest run testes/modulos-ui.test.ts`
- `cd backend && npx vitest run src/testes/modulos-negocio-http.test.ts`
- `npm run typecheck --workspace frontend`
- `git diff --check`

## 8. Criterios de Aceite

- [x] Rotas privadas recebem `modulo`.
- [x] Rota privada consulta `/negocio/modulos`.
- [x] Modulo desligado redireciona para `/app`.
- [x] `/app/loja-publica` exige modulo `loja-publica`.
- [x] Backend continua bloqueando endpoint de modulo desligado com 403.

## 9. Links

- `docs/sdd/domains/02-identidade-acesso-negocios.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-guard-url-modulos-bizy.md`
