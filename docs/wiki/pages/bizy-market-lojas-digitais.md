---
title: Bizy Market e Lojas Digitais
aliases:
  - Bizy Market
  - Shopping Center Bizy
  - Perfis de Loja Bizy
tags:
  - bizy/market
  - bizy/loja-digital
  - bizy/produto
  - bizy/crm
status: rascunho
updated: 2026-06-07
---

# Bizy Market e Lojas Digitais

Status: rascunho
Ultima atualizacao: 2026-06-07
Fontes principais: `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, conversa de produto de 2026-06-07, [[loja-digital-operacao-crm]], [[visao-produto-bizy]], [[bizy-market-rotas-roadmap]]

> [!abstract] Decisao
> A loja digital atual deve evoluir para um ramo maior do Bizy: perfis de loja autonomos + shopping center central + checkout unificado + toda operacao controlada dentro do CRM.

## Tese

O Bizy deve ser as duas coisas ao mesmo tempo:

- uma loja independente para cada cliente, com identidade propria e link pessoal como `minhaloja.bizy.space`;
- um shopping center central onde compradores encontram produtos de varias lojas, com categorias, busca, similares e checkout unificado.

O Market nao substitui o perfil da loja. Ele aumenta descoberta. O perfil mantem identidade, confianca e relacionamento.

## Componentes

### Bizy Loja

Perfil publico de cada negocio.

Inclui:

- capa/hero personalizavel;
- avatar/logo;
- descricao;
- localizacao;
- seguidores e seguindo;
- colecoes clicaveis;
- grelha de produtos que muda por colecao;
- botao de seguir, contacto e checkout;
- subdominio proprio.

### Bizy Market

Shopping center dos produtos cadastrados pelos clientes Bizy.

Inclui:

- busca global;
- categorias globais;
- produtos similares;
- lojas em destaque;
- promocoes, novidades e mais vendidos;
- filtros por preco, localizacao, entrega, disponibilidade e loja;
- ranking por relevancia, confianca, disponibilidade e desempenho.

### Bizy Checkout

Checkout unificado do Bizy.

Regra central:

- carrinho de uma loja gera pedido para essa loja;
- carrinho de varias lojas gera uma compra unificada para o comprador e pedidos filhos por fornecedor;
- cada fornecedor ve apenas a parte dele no CRM;
- o comprador acompanha a compra inteira numa experiencia unica.

### Bizy Studio

Central de controlo da loja dentro do CRM.

Inclui:

- identidade do perfil;
- colecoes;
- publicacao no Market;
- produtos em destaque;
- checkout;
- pagamentos;
- entrega;
- SEO;
- metricas;
- campanhas.

## Mudanca de Produto

Antes, a loja digital era principalmente uma vitrine publica ligada ao CRM.

Agora, a direcao passa a ser:

- perfil social-comercial da loja;
- marketplace de descoberta entre lojas;
- checkout Bizy como camada central;
- CRM como fonte de verdade da operacao.

## Regras Essenciais

- A loja pode ter perfil publico sem estar no Market.
- Produto so entra no Market se tiver imagem, preco, categoria global, loja ativa e disponibilidade.
- Categoria global e do Bizy; colecao local e da loja.
- Produtos similares podem sugerir outros fornecedores, mas nao devem apagar a identidade da loja atual.
- Checkout unificado cria uma experiencia unica para o comprador e pedidos separados por fornecedor quando necessario.
- Dados privados de uma loja nao podem vazar para outra loja.
- Toda central de controlo fica dentro do CRM, nao num painel separado.
- O Market deve gerar descoberta, mas a execucao comercial acontece no CRM.

## Impacto no Sistema Atual

Ver requisitos completos em [`docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`](../../RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md).

Ver mapa de rotas e sequencia de implementacao em [[bizy-market-rotas-roadmap]].

Impactos principais:

- [[loja-digital-operacao-crm]] deixa de ser apenas loja publica operacional e passa a ser base para Bizy Loja + Bizy Studio.
- [[mapa-de-modulos-bizy]] precisa tratar Bizy Market como modulo/servico proprio.
- [[visao-produto-bizy]] passa a incluir shopping center e perfis de loja como expansao natural do CRM+.
- [[dominio-e-entidades-bizy]] futuramente deve modelar entidades como Market, PerfilLoja, ColecaoPublica, CompraUnificada, PedidoFornecedor, SeguidorLoja, RepasseMarket e CategoriaGlobal.
- [[fluxos-operacionais-bizy]] futuramente deve detalhar busca, compra multi-loja, pagamento, repasse e pos-venda.

## Progresso de Implementacao

- [x] RF/RNF/RN do documento formal convertidos para checklist.
- [x] Primeiro endpoint backend criado: `GET /publico/market/produtos`.
- [x] `BizyMarketUseCase` criado para listar produtos elegiveis de lojas publicadas.
- [x] Resposta publica inclui fornecedor sanitizado e URLs para loja/produto.
- [x] Produtos sem foto, sem categoria, sem stock, vendidos, esgotados, arquivados ou de loja nao publicada ficam fora do Market.
- [x] Teste de contrato criado em `backend/src/testes/bizy-market-http.test.ts`.
- [x] Perfil publico estilo social com hero, avatar, bio, localizacao, contadores sociais iniciais e colecoes/categorias clicaveis.
- [x] Slugs reservados como `market`, `shop`, `checkout`, `api`, `www`, `n8n`, `wa` e `suporte` ficam bloqueados no backend.
- [x] Perfil publico ganhou CTA para explorar similares no Bizy Market sem substituir a loja atual.
- [x] Mapa de rotas e sequencia tecnica documentados em [[bizy-market-rotas-roadmap]].
- [x] Categorias globais do Market expostas em `GET /publico/market/categorias`.
- [x] Detalhe publico de produto do Market exposto em `GET /publico/market/produtos/:codigo`.
- [x] Produtos similares de outros fornecedores expostos em `GET /publico/market/produtos/:codigo/similares`.
- [x] Controlo CRM de publicacao no Market exposto em `GET /crm/loja/market/resumo`, `PUT /crm/loja/produtos/:codigo/publicacao` e `PUT /crm/loja/produtos/publicacao-em-massa`.
- [ ] Bizy Studio completo dentro do CRM.
- [ ] Checkout unificado e compra multi-loja.
- [ ] Repasses, taxas, cancelamentos parciais e conciliacao financeira.
- [ ] Ranking avancado, boost e recomendacoes comportamentais.

## Decisoes em Aberto

- Dominio principal do Market.
- Se o MVP tera carrinho multi-loja ou checkout unificado por uma loja de cada vez.
- Se o pagamento centralizado entra no MVP ou comeca com comprovativo/conciliacao manual.
- Como sera a autenticacao do comprador que segue lojas.
- Categorias globais iniciais.
- Politica de destaque patrocinado e comissao por venda.

## Ligacoes

- [[loja-digital-operacao-crm]]
- [[bizy-market-rotas-roadmap]]
- [[visao-produto-bizy]]
- [[mapa-de-modulos-bizy]]
- [[fluxos-operacionais-bizy]]
- [[dominio-e-entidades-bizy]]
- [[arquitetura-e-guardrails-bizy]]
