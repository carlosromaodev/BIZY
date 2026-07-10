---
title: Visao Unificada do Bizy
aliases:
  - Visao de Produto do Bizy
  - Visao Bizy
  - Estrategia Bizy
  - Meta Global Bizy
tags:
  - bizy/produto
  - bizy/visao
status: ativo
updated: 2026-07-10
---

# Visao Unificada do Bizy

> [!important] Fonte canonica
> Esta nota e a visao unica do Bizy. SDD, specs, roadmap, memoria e inventarios devem apontar para ela, nao criar teses paralelas.

## Formula

```text
Bizy = 3 sistemas visiveis + 1 nucleo interno invisivel

Sistemas visiveis:
- Bizy Team
- Bizy Market
- Bizy Learning

Nucleo interno:
- Anani
```

Bizy nao e apenas live, CRM, marketplace, escola, bot, dashboard ou IA. Bizy e o sistema operacional comercial para pequenos negocios que precisam vender, atender, cobrar, entregar, recuperar clientes, gerir equipa e medir crescimento no mesmo lugar.

## Direcao 2026-07-10

A auditoria integral de benchmark internacional V2 eleva a visao do Bizy para **Business Operating System modular**. Isso significa que Team, Market, Learning, Anani e os servicos de plataforma devem evoluir como dominios operacionais completos, nao como paginas soltas nem modulos que parecem prontos apenas por terem menu, tabela ou dashboard.

Definicao de excelencia:

> Um modulo Bizy e um dominio operacional completo, mensuravel, automatizavel, auditavel, seguro, acessivel e integrado ao restante ecossistema.

As referencias internacionais usadas pelo Bizy sao guias de alinhamento e preparacao, nao promessa de certificacao: NIST CSF, ISO/IEC 27001, OWASP ASVS, ISO/IEC 27701, WCAG 2.2, ISO 20000/ITIL, PCI DSS, IFRS for SMEs, ISO 30414, ISO 21500/21502, ISO/IEC 42001, OpenAPI, CloudEvents, OpenTelemetry, OIDC/WebAuthn/SCIM, LTI, xAPI, Open Badges, QTI e SCORM.

## Tese

Pequenos negocios nao precisam primeiro de mais automacao. Precisam primeiro de uma fonte de verdade simples para cliente, produto, pedido, pagamento, entrega, conversa, equipa e dinheiro.

Automacao, IA, n8n, WhatsApp, tracking, campanhas e recomendacoes so entram quando fortalecem essa fonte de verdade e deixam fallback humano.

## Loop Comercial

Toda parte do Bizy deve servir pelo menos uma etapa deste loop:

```text
Descobrir -> Converter -> Executar -> Reter -> Controlar
```

Traduzido para operacao:

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
        -> Equipa -> Financas -> Auditoria
```

Se uma tela, endpoint, workflow ou documento nao ajuda esse loop, deve sair da navegacao principal, ir para Admin/Sistema, ficar como capacidade interna ou ser adiado.

## Anatomia Minima de Modulo

Qualquer modulo novo ou refatorado deve nascer com:

- overview operacional;
- listas/registos;
- detalhe 360;
- criacao e edicao controlada;
- estado e workflow;
- tarefas, filas e aprovacoes quando aplicavel;
- automacao com fallback humano;
- relatorios e KPIs com fonte real;
- configuracao;
- permissoes;
- auditoria;
- integracoes/eventos;
- notificacoes;
- ajuda contextual.

O modulo so pode ser tratado como completo quando tambem possuir dono de dominio, entidades, regras, estados, transicoes, comandos, consultas, eventos, policies, logs, testes, metricas, retencao, exportacao e documentacao minima.

## Sistemas Visiveis

### Bizy Team

Team e o centro operacional privado do negocio.

Responsabilidades:

- CRM, clientes, conversas e tarefas;
- produtos, stock, pedidos, pagamentos e entregas;
- equipa, papeis, permissoes, metas e projectos;
- configuracao de loja, Market, Learning e modulos ativos;
- relatorios operacionais e financeiro do negocio.

Regra: Team e a fonte principal de verdade da operacao.

### Bizy Market

Market e a camada publica de descoberta, compra e confianca.

Responsabilidades:

- expor lojas, produtos elegiveis, categorias e similares;
- gerar descoberta cruzada sem apagar a marca da loja;
- preservar origem, tracking e privacidade;
- encaminhar para checkout e criar dados acionaveis para o Team;
- suportar confianca, denuncias, moderacao, repasses e governanca de marketplace.

Regra: Market gera descoberta; Team controla execucao.

### Bizy Learning

Learning e a camada de produtos digitais, formacao e comunidade comercial.

Responsabilidades:

- cursos, mentorias, cohorts, comunidades, certificados e produtos digitais;
- descoberta publica de ofertas de conhecimento;
- checkout digital, acesso, progresso e entitlement;
- backoffice operacional dentro do Team;
- qualidade, moderacao e confianca apoiadas por Anani.

Regra: Learning nao e apenas uma pagina publica; e commerce de conhecimento ligado ao Team.

## Nucleo Interno

### Anani

Anani e o nucleo interno invisivel de inteligencia, risco, auditoria, controlo e governanca.

Anani pode observar, cruzar sinais, avaliar politicas, criar incidentes, colocar entidades em quarentena, recomendar acoes e preparar execucao segura.

Anani nao e produto de tenant, chatbot publico, menu comum, copilot vendido ou fonte de verdade. O acesso direto pertence apenas a `GOVERNANTE_BIZY`, `ADMIN_GERAL` e `SUPER_ADMIN_PLATFORM`.

Regra: tenants veem efeitos do Anani dentro de Team, Market e Learning: alertas, tarefas, scores, protecoes, relatorios simplificados e pedidos de verificacao.

## Canais e Capacidades

Live, WhatsApp, loja publica, Social Inbox, campanhas, afiliados, formularios, links rastreaveis, n8n, Evolution, IA externa e providers nao sao visoes separadas.

Eles sao canais, capacidades, adapters ou infraestrutura que alimentam o loop comercial.

Regra: nenhum provider externo decide stock, preco, pagamento, desconto, entrega, comissao, permissao ou dado de tenant fora dos use cases, policies e auditoria do Bizy.

## Contexto Principal

O Bizy nasce para lojas pequenas e medias, equipas comerciais por WhatsApp, vendedoras em live, criadores, afiliados, mentores e negocios com alto volume de conversa.

Contexto forte:

- Angola;
- Kwanza/AOA;
- telefone angolano;
- WhatsApp como canal dominante;
- comprovativo/IBAN e dinheiro na entrega como fluxos reais;
- operacao mobile;
- linguagem simples para utilizador nao tecnico.

## Regras de Decisao

Toda iniciativa deve responder:

- melhora descoberta, conversao, execucao, retencao ou controlo?
- qual sistema lidera: Team, Market ou Learning?
- e canal/capacidade ou produto visivel?
- que entidade operacional nasce ou muda?
- o resultado fica acionavel dentro do Team?
- existe permissao, auditoria e isolamento por `negocioId`?
- existe fallback humano quando mexe com dinheiro, privacidade, stock, comissao, permissao ou reclamacao?
- existe workflow validado, KPI com fonte real, evento versionado e observabilidade minima?
- existe evidencia de acessibilidade, seguranca e privacidade proporcional ao risco?

## Anti-Metas

Bizy nao deve caminhar para:

- app com muitos modulos incompletos;
- modulo declarado completo por ter pagina, endpoint, tabela ou KPI isolado;
- marketplace anonimo que apaga lojas;
- CRM com telas bonitas sem acao;
- Learning decorativo sem checkout/acesso/progresso;
- automacao que confirma pagamento ou promete entrega sem regra;
- IA ou n8n como fonte de verdade;
- Anani exposto a tenant comum;
- relatorios sem decisao seguinte;
- KPI inventado, estimado sem rotulo, sem periodo ou sem fonte;
- certificacao formal declarada sem processo independente;
- specs que repetem visao em vez de apontar para esta nota.

## Norte de UX

Bizy deve parecer ferramenta de operacao diaria, nao landing page permanente.

Direcao:

- telas densas, claras e escaneaveis;
- acoes previsiveis;
- poucos cliques/toques;
- mobile-first;
- Admin/Sistema separado da operacao comercial;
- estados vazios com proxima acao;
- texto curto e humano;
- sem paginas decorativas.

## Documentos Derivados

- [[memoria-projeto-bizy]]: briefing para outra IA e entrada narrativa.
- [`SDD Dominio 00`](../../sdd/domains/00-visao-produto-e-principios.md): projecao da visao para Spec-Driven Development.
- [`Meta Global Bizy`](../../superpowers/specs/2026-06-30-meta-global-bizy.md): criterios historicos de decisao e aceite global.
- [[mapa-de-modulos-bizy]]: mapa funcional dos sistemas e capacidades.
- [[anani-intelligence-control-plane]]: detalhe do nucleo interno Anani.
- [[prioridades-lancamento-bizy]]: fila de prioridades derivada desta visao.
