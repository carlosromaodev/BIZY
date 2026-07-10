---
title: Protocolo de Atualizacao da Memoria Bizy
aliases:
  - Atualizar memoria
  - Regra de memoria Bizy
  - Memoria sempre atualizada
tags:
  - bizy/memoria
  - bizy/wiki
  - ia/protocolo
status: ativo
updated: 2026-07-10
---

# Protocolo de Atualizacao da Memoria Bizy

> [!important] Regra Permanente
> Qualquer mudanca relevante no projeto deve atualizar a memoria antes da resposta final. Se a memoria estiver incompleta, a IA deve consultar o codigo, corrigir a memoria e so depois responder.

## Quando Atualizar

Atualizar a wiki sempre que houver:

- nova funcionalidade;
- novo endpoint;
- nova tela;
- novo modelo Prisma ou migration;
- novo fluxo operacional;
- nova regra de negocio;
- nova decisao de arquitetura;
- nova integracao;
- novo script, deploy, comando ou procedimento;
- bug importante corrigido;
- incidente operacional;
- lacuna descoberta entre codigo e memoria;
- mudanca de prioridade P0/P1/P2;
- mudanca em permissao, auditoria, privacidade, tracking, pagamento, stock ou automacao.

## Como Atualizar

1. Ler [[schema|Schema da Wiki]].
2. Comecar por [[visao-produto-bizy|Visao Unificada do Bizy]], depois [[memoria-projeto-bizy|Memoria de Projeto do Bizy]] ou [[guia-para-ia-bizy|Guia para IA no Bizy]].
3. Identificar a nota correta:
   - produto/visao: [[visao-produto-bizy]];
   - dor/qualidade: [[dores-e-qualidades-bizy]];
   - modulo: [[mapa-de-modulos-bizy]];
   - entidade/dados: [[dominio-e-entidades-bizy]] e [[inventario-dados-prisma]];
   - fluxo: [[fluxos-operacionais-bizy]];
   - arquitetura/guardrails: [[arquitetura-e-guardrails-bizy]];
   - prioridade: [[prioridades-lancamento-bizy]];
   - API/use case: [[inventario-backend-api]];
   - UI/rotas/componentes: [[inventario-frontend]];
   - scripts/deploy/testes/integracoes: [[inventario-operacao-testes]];
   - contexto recente/incidente: [[memoria-viva-bizy]].
4. Usar `[[wikilinks]]` para notas internas.
5. Atualizar [[log|Log da Wiki]] com uma entrada curta.
6. Validar com `git diff --check -- docs/wiki`.

## Se a Memoria Parecer Incompleta

Quando o utilizador perguntar algo e a memoria nao tiver resposta suficiente:

1. Procurar no codigo com `rg`/`find`.
2. Confirmar a verdade na fonte:
   - backend: `backend/src/infra/http/modulos/`, `backend/src/use-case/`, `backend/prisma/schema.prisma`;
   - frontend: `frontend/src/rotasApp.tsx`, `frontend/src/paginas/`, `frontend/src/api.ts`;
   - operacao: `package.json`, `docker-compose*.yml`, `docs/*.md`, `scripts/`;
   - workflows: `n8n/`.
3. Atualizar a nota adequada.
4. Responder ao utilizador citando a memoria atualizada.

## Mapeamento Rapido

| Mudanca | Atualizar |
|---|---|
| Endpoint, rota HTTP, use case | [[inventario-backend-api]], [[mapa-de-modulos-bizy]] se mudar produto |
| Modelo Prisma, migration, isolamento de dados | [[inventario-dados-prisma]], [[dominio-e-entidades-bizy]] |
| Pagina, componente, UX, rota frontend | [[inventario-frontend]], [[prioridades-lancamento-bizy]] se for lacuna |
| Fluxo comercial | [[fluxos-operacionais-bizy]], [[dores-e-qualidades-bizy]] se resolver dor nova |
| Decisao tecnica ou guardrail | [[arquitetura-e-guardrails-bizy]], [[schema]] se virar regra |
| Deploy, Docker, VPS, scripts | [[inventario-operacao-testes]], [[deploy-vps-antiga]] quando aplicavel |
| Incidente/correcao importante | [[memoria-viva-bizy]], [[log]] |
| Nova prioridade | [[prioridades-lancamento-bizy]], [[memoria-projeto-bizy]] se afetar direcao |

## Verificacao Feita em 2026-05-27

Foi feita uma varredura rapida contra o codigo atual:

- modulos HTTP em `backend/src/infra/http/modulos/`;
- use cases em `backend/src/use-case/`;
- paginas em `frontend/src/paginas/`;
- endpoints declarados com `app.get/post/put/patch/delete`.

Resultado: a memoria ja cobre a estrutura principal do sistema. A melhoria necessaria era formalizar este protocolo e registrar as skills Obsidian instaladas em [[inventario-operacao-testes]].
