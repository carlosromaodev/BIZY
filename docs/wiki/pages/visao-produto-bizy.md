---
title: Visao de Produto do Bizy
aliases:
  - Visao Bizy
  - Estrategia Bizy
tags:
  - bizy/produto
  - bizy/visao
status: ativo
updated: 2026-06-07
---

# Visao de Produto do Bizy

## Identidade

Bizy/EMeu nasceu como automacao de vendas em live: capturar comentarios, interpretar intencao de compra, extrair telefone angolano e codigo da peca, criar reserva e acionar WhatsApp.

A visao atual e maior: Bizy e um CRM+ de social commerce. A live continua importante, mas o nucleo passa a ser a operacao completa da loja.

## Visao

Ser o sistema operacional de vendas para negocios que vendem em canais sociais e conversacionais:

- WhatsApp;
- TikTok/live;
- Instagram/Facebook/TikTok comentarios;
- loja publica;
- links de produto;
- campanhas;
- afiliados e criadores;
- atendimento humano com apoio de automacao.

## Expansao: Bizy Market

Em 2026-06-07 a visao de loja digital foi ampliada para [[bizy-market-lojas-digitais|Bizy Market e Lojas Digitais]].

O Bizy passa a ter uma camada adicional:

- cada negocio continua com loja/perfil autonomo e subdominio proprio;
- produtos elegiveis podem aparecer num shopping center central do Bizy;
- compradores podem sair de uma loja e procurar produtos similares de outros fornecedores;
- o checkout deve ser unificado pelo Bizy;
- toda central de controlo da loja continua dentro do CRM.

Essa expansao reforca a tese do CRM+: descoberta publica so tem valor se virar pedido, atendimento, pagamento, entrega, recuperacao e relatorio dentro da operacao da loja.

## Objetivo Pratico

Quando a vendedora abre o Bizy, ela deve saber:

- quem precisa de resposta;
- que pedidos precisam de pagamento;
- que entregas estao pendentes;
- que produtos estao com stock baixo;
- que clientes podem ser recuperados;
- que links/campanhas deram resultado;
- que automacoes falharam e precisam de humano.

O objetivo e reduzir caos operacional, nao aumentar burocracia.

## Publico-Alvo

O publico principal:

- vendedoras em live;
- lojas pequenas e medias;
- equipas comerciais por WhatsApp;
- criadores que vendem produtos;
- afiliados e revendedores;
- negocios com produtos fisicos e alto volume de conversa.

Contexto forte:

- Angola;
- Kwanza/AOA;
- telefone angolano;
- WhatsApp como canal dominante;
- pagamento por comprovativo/IBAN;
- operacao mobile;
- necessidade de linguagem simples para vendedor nao tecnico.

## Tese do Produto

> [!tip] Tese
> Pequenos negocios nao precisam primeiro de mais automacao. Precisam de uma fonte de verdade simples para cliente, produto, pedido, pagamento, entrega e conversa. A automacao vem depois, com guardrails.

## Diferenca Entre MVP Antigo e CRM+

MVP de live:

- comentario;
- parser;
- reserva;
- fila;
- WhatsApp;
- n8n.

CRM+ atual:

- [[dominio-e-entidades-bizy#Negocio|Negocio]];
- [[dominio-e-entidades-bizy#Cliente|Cliente]];
- [[dominio-e-entidades-bizy#Produto e Stock|Produto e stock]];
- [[dominio-e-entidades-bizy#Pedido|Pedido]];
- [[dominio-e-entidades-bizy#Conversa|Conversa]];
- pagamento;
- entrega;
- campanha;
- afiliado;
- tracking;
- tarefa;
- relatorio;
- auditoria.

## Norte de UX

Bizy deve parecer ferramenta de operacao diaria, nao landing page permanente.

Direcao:

- telas densas, claras e escaneaveis;
- acoes previsiveis;
- poucos cliques/toques;
- mobile-first;
- Admin/Sistema separado de loja;
- estados vazios com proxima acao;
- texto curto e humano;
- sem paginas decorativas.

Ver tambem [[dores-e-qualidades-bizy]] e [[inventario-frontend]].
