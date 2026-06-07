---
title: Memoria de Projeto do Bizy
aliases:
  - Briefing Bizy
  - Memoria principal do Bizy
  - Bizy para outra IA
tags:
  - bizy/memoria
  - bizy/produto
  - ia/briefing
status: ativo
updated: 2026-06-07
---

# Memoria de Projeto do Bizy

> [!abstract] Leitura obrigatoria
> Esta e a nota principal para outra IA entender o Bizy sem reler todo o repositorio. Ela aponta para notas tematicas ligadas entre si, nao para uma memoria presa apenas no `index`.

## Resumo Curto

Bizy e um CRM+ de social commerce para negocios que vendem por live, WhatsApp, loja publica, catalogo, afiliados, criadores e redes sociais. O sistema transforma interacoes dispersas em [[dominio-e-entidades-bizy|clientes, pedidos, pagamentos, entregas, tarefas, campanhas, tracking, comissoes e relatorios auditaveis]].

O projeto nasceu como EMeu, focado em automacao de vendas em lives. A direcao atual e maior: o nucleo do produto e loja/CRM operacional, e a live e apenas um canal forte dentro desse ecossistema.

Atualizacao 2026-06-07: a loja digital deve evoluir para [[bizy-market-lojas-digitais|Bizy Market e Lojas Digitais]], combinando perfis autonomos de loja, shopping center central, produtos similares entre fornecedores, checkout unificado Bizy e controlo completo dentro do CRM.

## Mapa da Memoria

Leia nesta ordem quando estiveres a continuar o projeto:

1. [[guia-para-ia-bizy|Guia para outra IA]]
2. [[protocolo-atualizacao-memoria-bizy|Protocolo de Atualizacao da Memoria]]
3. [[visao-produto-bizy|Visao e estrategia de produto]]
4. [[dores-e-qualidades-bizy|Dores resolvidas e qualidades do produto]]
5. [[mapa-de-modulos-bizy|Mapa de modulos funcionais]]
6. [[dominio-e-entidades-bizy|Dominio e entidades principais]]
7. [[fluxos-operacionais-bizy|Fluxos operacionais]]
8. [[arquitetura-e-guardrails-bizy|Arquitetura e guardrails]]
9. [[prioridades-lancamento-bizy|Prioridades de lancamento]]

Depois de entender o produto, use os inventarios:

- [[inventario-sistema-bizy|Inventario do Sistema Bizy]]
- [[inventario-backend-api|Inventario Backend e API HTTP]]
- [[inventario-dados-prisma|Inventario de Dados, Prisma e Migrations]]
- [[inventario-frontend|Inventario Frontend e UX]]
- [[inventario-operacao-testes|Inventario de Operacao, Integracoes e Testes]]
- [[memoria-viva-bizy|Memoria Viva do Bizy]]

## O Que o Bizy E

O Bizy e uma plataforma de operacao comercial para vender, atender, cobrar, entregar, recuperar clientes e medir resultado nos canais onde pequenas lojas realmente trabalham.

Ele junta:

- CRM de clientes;
- catalogo e stock;
- pedidos e reservas;
- atendimento WhatsApp;
- lives e comentarios;
- loja publica;
- Bizy Market e perfis de loja;
- checkout;
- social inbox;
- campanhas;
- afiliados/criadores/revendedores;
- tarefas e playbooks;
- tracking e atribuicao;
- relatorios e auditoria.

## O Que o Bizy Nao E

> [!warning] Nao confundir
> Deploy, VPS, Docker, n8n e Evolution sao suporte operacional. Eles nao sao o centro da memoria. O centro do projeto e o produto comercial descrito em [[visao-produto-bizy]] e [[mapa-de-modulos-bizy]].

O Bizy tambem nao deve virar:

- painel tecnico para desenvolvedor;
- landing page decorativa;
- chatbot autonomo sem guardrails;
- sistema dependente de n8n como fonte de verdade;
- automacao que confirma pagamento ou promete entrega sem regra;
- app cheio de modulos vazios.

## Frase Norteadora

> [!tip] Produto
> Toda decisao deve ajudar a loja a vender, atender, cobrar, entregar, recuperar ou medir melhor.

Se uma tela, endpoint ou automacao nao faz isso, precisa ser repensada, escondida, movida para Admin/Sistema ou deixada para depois.

## Estado Atual em Uma Leitura

O backend CRM+ ja esta amplo: autenticacao, negocio, catalogo, reservas, pedidos, clientes 360, conversas, WhatsApp, n8n, loja publica, tracking, afiliados, social inbox, campanhas, funil, tarefas, relatorios, auditoria, jobs, contratos, backup e rate limit.

O maior risco de lancamento esta no frontend publico e em polimento operacional:

- loja publica visual;
- checkout visual;
- SEO e preview social;
- privacidade/tracking no frontend;
- estados vazios orientadores;
- ocultar modulos desativados;
- paginacao padronizada;
- telas visuais de funil, Cliente 360, afiliados e playbooks.

Detalhes ficam em [[prioridades-lancamento-bizy]].

## Regra Para Futuras IAs

> [!important] Memoria primeiro
> Qualquer mudanca relevante deve atualizar a memoria seguindo [[protocolo-atualizacao-memoria-bizy]]. Se faltar informacao, consultar o codigo e corrigir a memoria.

Antes de alterar codigo, outra IA deve responder:

- Que dor real isto resolve?
- Qual entidade principal esta envolvida?
- O dado esta isolado por `negocioId`?
- Existe permissao/auditoria?
- Existe fallback humano?
- O modulo pode estar desativado?
- O frontend tem estado vazio util?
- Existe teste ou verificacao?
- Algum dado pessoal pode vazar em URL, tracking, log ou relatorio?

Essas perguntas tambem estao detalhadas em [[guia-para-ia-bizy]].
