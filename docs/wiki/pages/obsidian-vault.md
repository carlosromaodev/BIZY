---
title: Vault Obsidian do Bizy
aliases:
  - Obsidian Bizy
tags:
  - bizy/wiki
  - obsidian
status: ativo
updated: 2026-07-10
---

# Vault Obsidian

Status: ativo
Ultima atualizacao: 2026-07-10
Fontes principais: `docs/wiki/README.md`, `docs/wiki/schema.md`, `docs/wiki/pages/anani-intelligence-control-plane.md`

## Pasta do Vault

Usar esta pasta como cofre do Obsidian:

```text
docs/wiki/
```

## Ligacoes de Contexto

- Regras de manutencao: [Schema da Wiki](../schema.md).
- Mapa de navegacao: [Indice da Wiki](../index.md).
- Memoria que deve aparecer como no central do grafo: [Memoria Viva do Bizy](memoria-viva-bizy.md).
- Inventario detalhado: [Inventario do Sistema Bizy](inventario-sistema-bizy.md).
- Nucleo interno novo: [[anani-intelligence-control-plane]].

## Como Abrir

1. Abrir o Obsidian.
2. Escolher "Open folder as vault" ou "Abrir pasta como cofre".
3. Selecionar a pasta `docs/wiki/` deste projeto.
4. Manter notas novas dentro de `pages/` ou `raw/`, conforme o tipo de conteudo.

## Regras

- `pages/` guarda sinteses vivas.
- `raw/` guarda fontes brutas.
- `index.md` e o mapa principal.
- `log.md` registra alteracoes da wiki.
- `workspace.json` e estado local do Obsidian e nao deve ser versionado.
- Notas de arquitetura interna como Anani devem ficar em `pages/` e usar wikilinks para SDD/ADR/spec.

## Para Memoria do Agente

Depois do vault estar criado no Obsidian, o agente pode usar a skill `llm-wiki` para registrar memoria persistente do projeto em paginas sintetizadas. A memoria nao deve depender so do [Indice da Wiki](../index.md); cada pagina nova deve ligar para suas vizinhas naturais.
