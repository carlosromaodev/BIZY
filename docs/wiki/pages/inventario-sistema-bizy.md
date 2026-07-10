---
title: Inventario do Sistema Bizy
aliases:
  - Inventario Bizy
tags:
  - bizy/inventario
  - bizy/sistema
status: ativo
updated: 2026-06-05
---

# Inventario do Sistema Bizy

Status: ativo
Ultima atualizacao: 2026-05-27
Fontes principais: `docs/RF-RNF-RN-EMEUV1.md`, `README.md`, `backend/src/infra/http/modulos/`, `frontend/src/`, `backend/prisma/schema.prisma`, `package.json`

## Objetivo Desta Pagina

Esta pagina e o mapa de entrada para a memoria detalhada do que ja existe no sistema. Quando o pedido do utilizador envolver "o que ja temos", "o que falta", "subir na VPS", "arrumar modulo" ou "continuar de onde parou", comecar por aqui.

## Ligacoes de Contexto

- Briefing de produto para outra IA: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- Contexto operacional amplo: [Memoria Viva do Bizy](memoria-viva-bizy.md).
- Fotografia executiva do produto: [Estado Atual do Bizy](bizy-estado-atual.md).
- Deploy especifico: [Deploy na VPS Antiga](deploy-vps-antiga.md).
- Organizacao da documentacao: [Organizacao de Arquivos](organizacao-de-arquivos.md).

## Sintese Geral

O Bizy ja tem:

- autenticacao por telefone/SMS, Google e login estudantil UOR/ISPTEC;
- onboarding de negocio e produto inicial;
- multi-negocio, membros, papeis, permissoes e modulos por negocio;
- catalogo/produtos/pecas com stock, movimentos, importacao e resumo;
- reservas de live, fila, pagamento, comprovativo, recibo e conversao em pedido;
- pedidos comerciais completos com itens, orcamentos, desconto, pagamento, entrega, recibo, exportacao e recuperacao de parados;
- clientes 360, segmentos, importacao/exportacao, enderecos, acoes, fusao, compartilhamento e anonimização;
- atendimento/conversas CRM, mensagens, notas, sugestoes, politica WhatsApp e criacao de pedido a partir da conversa;
- live/comentarios, provider TikTok/manual, SSE e limpeza/revisao operacional;
- loja publica backend com slug, produto publico, entrega, checkout, carrinho abandonado e tracking;
- afiliados/criadores com parceiros, links, mini-lojas, comissoes, lotes e auditoria;
- campanhas CRM, templates WhatsApp, resultados, jobs de importacao/exportacao, governanca e eventos operacionais;
- Social Inbox, contas sociais, captura/importacao, WhatsApp a partir de item, funil, oportunidades e playbooks de recuperacao;
- automacoes/outbox n8n e WhatsApp, reprocessamento, auditoria e saude;
- relatorios comerciais, resumo diario, receita social, entregas, live piloto e CSV/PDF;
- media storage para uploads e arquivos;
- integracoes Evolution, webhook idempotente, templates e envio manual;
- n8n como camada de automacao com endpoints protegidos;
- Docker Compose com Postgres, Redis, backend, frontend, n8n, Evolution API, Evolution Manager e Caddy opcional;
- scripts de dev, backup, restore, ngrok, bootstrap e Prisma;
- suite de testes backend e frontend cobrindo autenticação, CRM, pedidos, afiliados, social inbox, WhatsApp, n8n, relatorios, design e navegacao.

## Inventarios Detalhados e Relacoes

- [Backend e API HTTP](inventario-backend-api.md): modulos HTTP e endpoints existentes.
- [Dados, Prisma e Migrations](inventario-dados-prisma.md): modelos persistidos e linha do tempo das migrations.
- [Frontend e UX](inventario-frontend.md): rotas, paginas, componentes, testes e estado visual.
- [Operacao, Integracoes e Testes](inventario-operacao-testes.md): scripts, Docker, n8n, Evolution, docs e cobertura de testes.

As relacoes principais sao:

- [Backend e API HTTP](inventario-backend-api.md) depende diretamente de [Dados, Prisma e Migrations](inventario-dados-prisma.md).
- [Frontend e UX](inventario-frontend.md) consome as rotas de [Backend e API HTTP](inventario-backend-api.md).
- [Operacao, Integracoes e Testes](inventario-operacao-testes.md) valida e sobe backend, frontend, banco, n8n e Evolution.

## Regra de Memoria

Quando alguma funcionalidade nova for implementada, atualizar a pagina especifica do inventario e depois registrar no `docs/wiki/log.md`. A memoria so fica confiavel se acompanhar o codigo.

## Frontend Expandido (2026-06-05)

O frontend passou de ~15 paginas para 31 paginas roteadas, cobrindo todos os modulos do mapa de produto:

- CRM completo: pipeline, cotacoes, agenda, metas, respostas rapidas, notas/actividades, formularios, sequencias.
- Vendas: campanhas, social inbox, tarefas.
- Gestao: equipa, pagamentos.
- Admin/Sistema: diagnosticos SMS, auditoria.
- Vitrine: loja digital publica com subdominio.

Design system v2 (`BizyDesignSystem.tsx`) com componentes reutilizaveis. Paginas Live e Atendimento alinhadas ao prototipo HTML v2. Navegacao por seccoes com visibilidade controlada por modulos activos.

## Lacunas Globais Conhecidas

As lacunas de lancamento estao em `docs/RF-RNF-RN-EMEUV1.md`, secao de priorizacao P0/P1/P2. Em resumo:

- P0 restante concentra consistencia mobile sem scroll horizontal e verificacao final de modulos desativados na UI; checkout visual, SEO social publico e aviso de privacidade/tracking ja foram fechados.
- P1 concentra perfil 360 polido, envio binario real nas conversas, colecoes visuais e templates/fallbacks WhatsApp.
- Paginas CRM novas (pipeline, cotacoes, agenda, metas, formularios, sequencias) precisam de maturacao visual para design v2 e ligacao completa aos endpoints backend.
