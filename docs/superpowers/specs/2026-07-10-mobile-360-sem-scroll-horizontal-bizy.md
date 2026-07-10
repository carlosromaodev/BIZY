# Spec - Mobile 360 Sem Scroll Horizontal Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/12-frontend-ux-design-system.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: conversao
Owner logico: Frontend/UX

## 1. Objetivo

Fechar a lacuna P0 de consistencia mobile sem scroll horizontal em 360px, com correcao real onde havia corte visual e teste repetivel para rotas publicas.

## 2. Contexto

O frontend ja tinha `overflow-x: hidden` no corpo e varios ajustes mobile. A auditoria Playwright em 360px confirmou overflow de pagina igual a zero, mas revelou corte visual no cabecalho do Bizy Learning e no grid de formatos em telas pequenas.

## 3. Escopo

- Medir rotas publicas principais em viewport 360x800.
- Corrigir cabecalho do Bizy Learning para quebrar layout no mobile.
- Corrigir grid de formatos do Learning para uma coluna em telas pequenas.
- Criar teste e2e reutilizavel contra scroll horizontal de pagina.
- Atualizar SDD/wiki com o estado fechado.

## 4. Fora de Escopo

- Redesenho completo das paginas privadas.
- Teste visual autenticado com dados reais de staging.
- Mudanca de backend.
- Nova biblioteca de teste.

## 5. Rotas Auditadas

- `/`
- `/login`
- `/market`
- `/market/lojas`
- `/checkout`
- `/learning`

## 6. Regras

- `documentElement.scrollWidth` nao pode ultrapassar `clientWidth` em 360px.
- Rails horizontais intencionais devem ficar contidos no proprio componente.
- Conteudo fora de containers rolaveis permitidos deve falhar o e2e.

## 7. Implementacao

- `frontend/src/projetos/learning/learning.css`
- `frontend/e2e/mobile-overflow.e2e.mjs`
- `frontend/testes/mobile-ux.test.ts`
- `frontend/package.json`

## 8. Testes e Verificacao

- `cd frontend && npx vitest run testes/mobile-ux.test.ts`
- `E2E_BASE_URL=http://127.0.0.1:5174 npm run test:e2e:mobile --workspace frontend`
- `npm run typecheck --workspace frontend`
- `git diff --check`

## 9. Criterios de Aceite

- [x] Rotas publicas auditadas retornam overflow 0 em 360px.
- [x] Cabecalho Learning nao corta links de acao em 360px.
- [x] Grid de formatos Learning nao passa da largura em 360px.
- [x] Teste e2e mobile sem dependencia nova existe.
- [x] SDD e wiki marcam a lacuna P0 como concluida.

## 10. Links

- `docs/sdd/03-roadmap-sdd.md`
- `docs/sdd/domains/12-frontend-ux-design-system.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-mobile-360-sem-scroll-horizontal-bizy.md`
