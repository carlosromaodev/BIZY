# Spec - Modulos Desativados na UI Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/02-identidade-acesso-negocios.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: controlo
Owner logico: Identidade/Frontend

## 1. Objetivo

Fechar a lacuna P0 de verificacao de modulos desativados na UI: rotas opcionais nao devem aparecer em tabs primarias, drawer desktop ou sheet mobile quando o modulo nao esta ativo no negocio.

## 2. Contexto

O Shell ja usava `filtrarRotasPorModulos`, mas a funcao devolvia todas as rotas quando `modulosAtivos` estava vazio. Isso impedia distinguir backend indisponivel, carregamento inicial ou negocio sem modulos opcionais ativos.

## 3. Escopo

- Tratar lista vazia de modulos ativos como operacao minima.
- Manter rotas nucleo sempre visiveis.
- Esconder rotas com `modulo` quando o modulo nao estiver ativo.
- Verificar tabs primarias, drawer desktop e sheet mobile.
- Atualizar SDD/wiki.

## 4. Fora de Escopo

- Matriz RBAC/ABAC completa por dominio.
- Matriz RBAC/ABAC completa por dominio.
- Testes HTTP backend de permissao por modulo.
- Modo sombra/progressive disclosure para membros.

## 5. Modulos Opcionais Cobertos

- `automacoes`
- `social-inbox`
- `funil`
- `loja-publica`
- `afiliados`

## 6. Regras

- Rota sem `modulo` pertence ao nucleo operacional e fica visivel.
- Rota com `modulo` so aparece se `modulosAtivos` contem esse modulo.
- Shell deve derivar tabs, drawer desktop e sheet mobile das rotas filtradas.
- Backend continua responsavel por bloquear acesso real e permissoes. O guard frontend de URL direta foi fechado depois em `docs/superpowers/specs/2026-07-10-guard-url-modulos-bizy.md`.

## 7. Implementacao

- `frontend/src/rotasApp.tsx`
- `frontend/testes/modulos-ui.test.ts`

## 8. Testes e Verificacao

- `cd frontend && npx vitest run testes/modulos-ui.test.ts`
- `npm run typecheck --workspace frontend`
- `git diff --check`

## 9. Criterios de Aceite

- [x] Lista vazia de modulos ativos mostra apenas nucleo.
- [x] `loja-publica` e `funil` ativos mostram apenas suas rotas opcionais.
- [x] `afiliados`, `automacoes` e `social-inbox` desligados nao aparecem.
- [x] Shell deriva tabs, drawer desktop e sheet mobile da lista filtrada.
- [x] SDD e wiki marcam o P0 como concluido.

## 10. Links

- `docs/sdd/domains/02-identidade-acesso-negocios.md`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-modulos-desativados-ui-bizy.md`
