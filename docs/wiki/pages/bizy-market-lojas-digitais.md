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
  - bizy/team
status: implementado
updated: 2026-07-02
---

# Bizy Market e Lojas Digitais

Status: implementado
Ultima atualizacao: 2026-07-02
Fontes principais: `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, [[requisitos-bizy-market]], [[bizy-market-rotas-roadmap]], codigo em `frontend/src/lojas`, `backend/src/infra/http/modulos/market.ts` e `backend/src/infra/http/modulos/checkoutUnificado.ts`.

> [!abstract] Decisao
> A loja digital do Bizy e um ramo composto por perfis publicos de loja, shopping center central, checkout unificado e execucao operacional dentro do Team. O prefixo API operacional unico e `/team/loja`.

## Tese

O Bizy deve ser duas coisas ao mesmo tempo:

- uma loja independente para cada cliente, com identidade propria, link publico e catalogos partilhaveis;
- um shopping center central onde compradores encontram produtos de varias lojas, com categorias, busca, similares e checkout unificado.

O Market nao substitui o perfil da loja. Ele aumenta descoberta. O perfil preserva identidade, confianca e relacionamento.

## Componentes

### Bizy Loja

Perfil publico de cada negocio.

Inclui:

- capa/hero personalizavel;
- avatar/logo;
- descricao, localizacao e contactos;
- seguidores reais;
- colecoes e catalogos clicaveis;
- grelha de produtos filtravel por colecao/categoria;
- CTA de seguir, contacto, produto e checkout;
- subdominio ou URL publica propria.

### Bizy Market

Shopping center dos produtos publicados pelos clientes Bizy.

Inclui:

- busca global;
- categorias globais;
- produtos similares;
- diretorio e perfil de lojas no contexto Market;
- produtos em destaque, novidades e produtos em promocao quando existirem dados reais;
- filtros por preco, localizacao, disponibilidade e loja;
- ranking por relevancia, disponibilidade, qualidade de dados, confianca, desempenho e sinais administrados.

### Bizy Checkout

Checkout unificado do Bizy.

Regras atuais:

- carrinho de uma loja pode finalizar pelo checkout da propria loja;
- carrinho de varias lojas usa `POST /publico/market/checkout`;
- uma compra multi-loja cria compra unificada para o comprador e pedidos filhos por fornecedor;
- cada fornecedor ve apenas a sua parte no Team;
- o comprador acompanha a compra inteira por `GET /publico/market/compras/:id`;
- pagamento/comprovativo centralizado propaga estado aos pedidos filhos.

### Bizy Studio

Central de controlo da loja dentro do Team.

Inclui:

- identidade do perfil;
- colecoes/catalogos;
- publicacao no Market;
- produtos em destaque;
- checkout, pagamentos, entrega e SEO;
- seguidores e metricas;
- pedidos Market e repasses.

## Mudanca de Produto

Antes, a loja digital era principalmente uma vitrine publica ligada ao CRM.

Agora, a direcao implementada e:

- perfil social-comercial da loja;
- marketplace de descoberta entre lojas;
- checkout Bizy como camada central;
- Team como fonte de verdade da operacao comercial.

## Regras Essenciais

- A loja pode ter perfil publico sem participar do Market.
- Produto so entra no Market se tiver imagem, preco, categoria global, loja ativa e disponibilidade.
- Categoria global e do Bizy; colecao/catalogo local e da loja.
- Produtos similares podem sugerir outros fornecedores, mas nao podem apagar a identidade da loja atual.
- Checkout unificado cria uma experiencia unica para o comprador e pedidos separados por fornecedor quando necessario.
- Dados privados de uma loja nao podem vazar para outra loja.
- Toda central de controlo fica dentro do Team, nao num painel separado.
- O Market gera descoberta; o Team executa pedido, pagamento, entrega, atendimento e repasse.
- A UI publica nao pode inventar avaliacoes, seguidores, vendidos, reviews, tempo de resposta ou prova social. Se o backend nao envia o dado real, a UI deve mostrar estado neutro.

## Contratos Canônicos

### Publicos

- `GET /publico/market/produtos`
- `GET /publico/market/categorias`
- `GET /publico/market/lojas`
- `GET /publico/market/lojas/:slug`
- `GET /publico/market/produtos/:codigo`
- `GET /publico/market/produtos/:codigo/similares`
- `POST /publico/market/checkout`
- `GET /publico/market/compras/:id`
- `POST /publico/market/compras/:id/pagamento`
- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/catalogos/:catalogo`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `GET /publico/lojas/:slug/produtos/:codigo/similares`
- `POST /publico/lojas/:slug/seguir`
- `DELETE /publico/lojas/:slug/seguir`
- `POST /publico/tracking/eventos`
- `POST /publico/recomendacoes/eventos`

### Team

- `GET /team/loja/market/resumo`
- `PUT /team/loja/produtos/:codigo/publicacao`
- `PUT /team/loja/produtos/publicacao-em-massa`
- `GET /team/loja/catalogos`
- `POST /team/loja/catalogos`
- `PUT /team/loja/catalogos/:id`
- `DELETE /team/loja/catalogos/:id`
- `GET /team/loja/seguidores`
- `GET /team/loja/metricas`
- `GET /team/loja/pedidos-market`
- `GET /team/loja/repasses`

O alias `/crm/loja/*` foi removido no cutover da Fase 12; clientes operacionais devem usar `/team/loja/*`.

## Progresso de Implementacao

- [x] RF/RNF/RN do documento formal convertidos para checklist em [[requisitos-bizy-market]].
- [x] Produtos elegiveis do Market expostos em `GET /publico/market/produtos`.
- [x] `BizyMarketUseCase` lista produtos elegiveis de lojas publicadas.
- [x] Resposta publica inclui fornecedor sanitizado e URLs para loja/produto.
- [x] Produtos sem foto, sem categoria, sem stock, vendidos, esgotados, arquivados ou de loja nao publicada ficam fora do Market.
- [x] Perfil publico estilo social-comercial com hero, avatar, bio, localizacao, colecoes/categorias clicaveis e CTAs.
- [x] Slugs reservados como `market`, `shop`, `checkout`, `api`, `www`, `n8n`, `wa` e `suporte` bloqueados no backend.
- [x] CTA para similares no Bizy Market preserva a loja atual.
- [x] Dominio canonico do Market definido como `market.usebizy.space`, com `/market` como fallback local.
- [x] Categorias globais expostas em `GET /publico/market/categorias`.
- [x] Produto Market exposto em `GET /publico/market/produtos/:codigo`.
- [x] Similares expostos em `GET /publico/market/produtos/:codigo/similares` e `GET /publico/lojas/:slug/produtos/:codigo/similares`.
- [x] Controlo Team de publicacao no Market exposto em `/team/loja/market/resumo`, `/team/loja/produtos/:codigo/publicacao` e `/team/loja/produtos/publicacao-em-massa`.
- [x] Camada frontend `frontend/src/lojas` centraliza tipos, rotas, helpers API, normalizadores e checkout.
- [x] Market home, categoria, detalhe do produto, diretorio de lojas e perfil de loja no Market implementados no frontend.
- [x] Bizy Studio em `/app/loja` implementado para configuracao, tracking, publicacao, seguidores e metricas.
- [x] Catalogos personalizados por loja implementados no backend e frontend.
- [x] Checkout unificado multi-loja implementado em `POST /publico/market/checkout`.
- [x] Compra unificada cria pedidos filhos por fornecedor, taxa Bizy, IVA, repasses e acompanhamento.
- [x] Pedidos Market no Team por loja em `GET /team/loja/pedidos-market`.
- [x] Repasses financeiros no Team em `GET /team/loja/repasses`.
- [x] Seguidores reais com follow/unfollow publico e listagem/metricas no Team.
- [x] Ranking, boost e recomendacoes operacionais implementados com score, eventos e sinais administrados; recomendacao comportamental avancada fica evolucao futura, nao bloqueio de MVP.
- [x] Admin Bizy para categorias, suspensoes, patrocinados, denuncias, repasses e relatorios.
- [x] Catalogo digital partilhavel em `GET /publico/lojas/:slug/catalogos/:catalogo` e `/lojas/:slug/catalogos/:catalogo`.
- [x] Experiencia mobile sem scroll horizontal nas superficies Team, loja publica, Market e checkout.
- [x] UI Market/loja revisada para remover prova social simulada: ratings, vendidos, reviews, tempo de resposta e badges nao enviados pelo backend.

## Decisoes Fechadas

- Dominio principal do Market: `market.usebizy.space`, com `/market` como fallback local.
- Checkout multi-loja entra no fluxo atual pelo endpoint unificado do Market.
- Pagamento inicial opera com transferencia/comprovativo, dinheiro na entrega ou metodo combinado; providers online entram como evolucao.
- Avaliacao publica de compradores nao deve ser simulada. No MVP, a UI mostra selos operacionais reais e estados vazios quando nao ha reviews.
- Social graph atual usa follow/unfollow e identificacao simples; perfil autenticado completo de comprador e evolucao futura.
- Categorias globais iniciais: Moda, Beleza, Comida, Tecnologia, Casa e Servicos.
- Patrocinio/destaque nao pode contornar elegibilidade, suspensao ou regras de seguranca.

## Ligacoes

- [[requisitos-bizy-market]] — RF/RNF/RN completos do Market e Lojas
- [[bizy-market-rotas-roadmap]]
- [[bizy-market-frontend-lojas]]
- [[loja-digital-operacao-crm]]
- [[visao-produto-bizy]]
- [[mapa-de-modulos-bizy]]
- [[fluxos-operacionais-bizy]]
- [[dominio-e-entidades-bizy]]
- [[arquitetura-e-guardrails-bizy]]
