---
title: Wiki do Projeto Bizy
aliases:
  - README Wiki Bizy
tags:
  - bizy/wiki
status: ativo
updated: 2026-07-11
---

# Wiki do Projeto Bizy

Esta pasta organiza a memoria persistente do Bizy/EMeu. Documentos existentes continuam nos seus lugares, mas o entendimento consolidado fica aqui, com indice e log.

Quando abrires no Obsidian, usa `docs/wiki/` como cofre do projeto.

## Estrutura

- `.obsidian/`: configuracao base partilhada do vault. O estado local de janela/workspace fica ignorado no Git.
- `schema.md`: regras de manutencao da wiki.
- `index.md`: catalogo vivo dos documentos e paginas principais.
- `log.md`: historico cronologico das atualizacoes da wiki.
- `raw/`: fontes brutas ou referencias a materiais originais.
- `pages/`: sinteses mantidas pelo agente, com ligacoes para os ficheiros de origem.

## Como usar

1. Antes de organizar documentacao, ler `schema.md`.
2. Ao adicionar conhecimento novo, criar ou atualizar uma pagina em `pages/`.
3. Atualizar `index.md`.
4. Registar a alteracao em `log.md`.

Esta wiki evita que requisitos, decisoes, deploys e memoria operacional fiquem espalhados sem contexto.

## Entradas Recomendadas

- [[visao-produto-bizy|Visao Unificada do Bizy]]: fonte canonica da direcao Team, Market, Learning e Anani.
- [[memoria-projeto-bizy|Memoria de Projeto do Bizy]]: briefing para outra IA entender a visao, dores, objetivos, qualidades e prioridades.
- [[guia-para-ia-bizy|Guia para IA no Bizy]]: como outra IA deve usar esta memoria.
- [[mapa-de-modulos-bizy|Mapa de Modulos]]: leitura funcional do que o produto faz.
- [[inventario-sistema-bizy|Inventario do Sistema Bizy]]: mapa do que ja existe no produto.
- [[auditoria-criticas-sistema-bizy|Auditoria Unificada das Criticas do Sistema]]: estado canonico dos achados, decisoes e gates externos.
- [[deploy-vps-antiga|Deploy na VPS Antiga]]: operacao especifica de subida na VPS antiga.
- [[schema|Schema]]: regras de manutencao da propria wiki.
