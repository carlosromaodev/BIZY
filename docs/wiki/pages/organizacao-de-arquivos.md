---
title: Organizacao de Arquivos
aliases:
  - Organizacao do Projeto Bizy
tags:
  - bizy/wiki
  - bizy/organizacao
status: ativo
updated: 2026-05-27
---

# Organizacao de Arquivos

Status: ativo
Ultima atualizacao: 2026-05-27
Fontes principais: `docs/wiki/schema.md`, estrutura atual do repositorio

## Regra Geral

O Bizy deve evitar documentos soltos sem contexto. Documentos antigos podem permanecer onde estao para nao quebrar referencias, mas conhecimento novo deve ser indexado nesta wiki.

## Ligacoes de Contexto

- Regras completas da wiki: [Schema da Wiki](../schema.md).
- Como abrir e manter o cofre: [Vault Obsidian](obsidian-vault.md).
- Mapa principal: [Indice da Wiki](../index.md).
- Memoria operacional: [Memoria Viva do Bizy](memoria-viva-bizy.md).

## Onde Colocar

- Requisitos duraveis: `docs/RF-RNF-RN-EMEUV1.md` e sinteses em `docs/wiki/pages/`.
- Memoria e decisoes do projeto: `docs/wiki/pages/`.
- Planos de execucao: `docs/superpowers/plans/`.
- Specs de design/arquitetura: `docs/superpowers/specs/`.
- Guias de deploy e operacao: `docs/`.
- Workflows n8n: `n8n/workflows/`.
- Temporarios, imagens de debug e dumps: `tmp/`.

Os guias de deploy e operacao se conectam diretamente com [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md) e [Deploy na VPS Antiga](deploy-vps-antiga.md).

## Codigo

Backend:

- Dominio e tipos em `backend/src/dominio/`.
- Use cases em `backend/src/use-case/`.
- HTTP em `backend/src/infra/http/`.
- Prisma em `backend/prisma/`.

Frontend:

- Paginas em `frontend/src/paginas/`.
- Componentes de dominio em `frontend/src/componentes/`.
- Primitivos UI em `frontend/src/components/ui/`.
- API em `frontend/src/api.ts`.
- Testes em `frontend/testes/`.

## Cuidados

- Nao mover arquivos antigos em massa sem atualizar links.
- Nao versionar segredos ou `.env` reais.
- Nao duplicar documentos grandes na wiki quando um link para a fonte basta.
