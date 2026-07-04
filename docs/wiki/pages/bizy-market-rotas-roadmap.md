---
title: Bizy Market Rotas e Roadmap
aliases:
  - Rotas do Bizy Market
  - Roadmap de Rotas Bizy Market
tags:
  - bizy/market
  - bizy/rotas
  - bizy/backend
  - bizy/frontend
status: implementado
updated: 2026-07-02
---

# Bizy Market Rotas e Roadmap

Status: implementado
Ultima atualizacao: 2026-07-02
Fontes principais: [[bizy-market-lojas-digitais]], [[requisitos-bizy-market]], `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, `frontend/src/lojas/rotasLojas.ts`, `backend/src/infra/http/modulos/market.ts`, `backend/src/infra/http/modulos/checkoutUnificado.ts`.

> [!abstract] Decisao
> As rotas do Bizy Market separam experiencia publica, API publica, controlo da loja dentro do Team, checkout unificado e administracao Bizy. O Market gera descoberta; o Team continua sendo a fonte de verdade da operacao. `/team/loja` e o prefixo canonico; `/crm/loja` e alias legado.

## Principios de Roteamento

- Rotas publicas sem dados pessoais devem ser cacheaveis e compartilhaveis.
- Rotas de checkout, carrinho, pagamento e comprovativo devem usar `no-store`.
- Rotas Team exigem sessao, permissao e isolamento por `negocioId`.
- Rotas Admin Bizy exigem papel interno e auditoria.
- O perfil da loja e o Market devem apontar um para o outro sem apagar a identidade do fornecedor.
- URLs antigas da loja publica continuam funcionando durante a migracao.
- O dominio canonico do shopping center e `market.usebizy.space`; `/market` continua como fallback local e rota de compatibilidade no app principal.
- Codigo novo nao deve chamar `/crm/loja/*`; os aliases existem apenas para compatibilidade.

## Rotas Publicas do Comprador

```txt
https://market.usebizy.space/
https://market.usebizy.space/categorias
https://market.usebizy.space/categorias/:categoria
https://market.usebizy.space/busca
https://market.usebizy.space/produtos/:codigo
https://market.usebizy.space/produtos/:codigo/similares
https://market.usebizy.space/lojas
https://market.usebizy.space/lojas/:slug
https://market.usebizy.space/promocoes
https://market.usebizy.space/novidades
https://market.usebizy.space/destaques
```

Fallback de compatibilidade/local: `/market`, `/market/categorias/:categoria`, `/market/produtos/:codigo`, `/market/lojas` e `/market/lojas/:slug`.

## Perfil Publico da Loja

```txt
/lojas/:slug
/lojas/:slug/catalogos/:catalogo
/lojas/:slug/categorias/:categoria
/lojas/:slug/produtos/:codigo
/lojas/:slug/produtos/:codigo/similares
/lojas/:slug/seguir
/lojas/:slug/contacto
```

## Checkout e Compra

```txt
/checkout
/checkout/carrinho
/checkout/identificacao
/checkout/entrega
/checkout/pagamento
/checkout/comprovativo
/checkout/confirmacao/:numeroCompra
/compras/:id
/compras/:id/acompanhar
```

## APIs Publicas

```txt
GET    /publico/market/produtos
GET    /publico/market/produtos/:codigo
GET    /publico/market/produtos/:codigo/similares
GET    /publico/market/categorias
GET    /publico/market/lojas
GET    /publico/market/lojas/:slug

POST   /publico/market/checkout
GET    /publico/market/compras/:id
POST   /publico/market/compras/:id/pagamento

GET    /publico/lojas/:slug
GET    /publico/lojas/:slug/catalogos/:catalogo
GET    /publico/lojas/:slug/produtos/:codigo
GET    /publico/lojas/:slug/produtos/:codigo/similares
POST   /publico/lojas/:slug/checkout
POST   /publico/lojas/:slug/checkout/abandonado
POST   /publico/lojas/:slug/seguir
DELETE /publico/lojas/:slug/seguir

POST   /publico/tracking/eventos
POST   /publico/recomendacoes/eventos
```

## Team e Bizy Studio

Estas telas ficam dentro do Team e substituem qualquer painel separado da loja.

```txt
/app/loja
/app/loja/perfil
/app/loja/tema
/app/loja/catalogos
/app/loja/produtos
/app/loja/publicacao
/app/loja/market
/app/loja/checkout
/app/loja/entrega
/app/loja/pagamentos
/app/loja/seo
/app/loja/seguidores
/app/loja/metricas
```

## APIs Team

Estas rotas controlam a loja a partir do Team.

```txt
GET    /loja-publica/configuracao
PUT    /loja-publica/configuracao
GET    /loja-publica/tracking/resumo

GET    /team/loja/catalogos
POST   /team/loja/catalogos
PUT    /team/loja/catalogos/:id
DELETE /team/loja/catalogos/:id

PUT    /team/loja/produtos/:codigo/publicacao
PUT    /team/loja/produtos/publicacao-em-massa

GET    /team/loja/market/resumo
GET    /team/loja/seguidores
GET    /team/loja/metricas
GET    /team/loja/pedidos-market
GET    /team/loja/repasses
```

Aliases legados registrados no backend:

```txt
/crm/loja/*
```

## Admin Bizy

```txt
/admin/market
/admin/market/categorias
/admin/market/lojas
/admin/market/produtos
/admin/market/destaques
/admin/market/patrocinados
/admin/market/denuncias
/admin/market/politicas
/admin/market/relatorios
/admin/market/repasses
```

## APIs Admin Bizy

```txt
GET  /admin/market/categorias
POST /admin/market/categorias
PUT  /admin/market/categorias/:id

PUT  /admin/market/lojas/:negocioId/suspensao
PUT  /admin/market/produtos/:codigo/suspensao
PUT  /admin/market/produtos/:codigo/destaque
PUT  /admin/market/produtos/:codigo/patrocinio

GET  /admin/market/denuncias
POST /admin/market/denuncias/:id/resolver

GET  /admin/market/relatorios
GET  /admin/market/repasses
POST /admin/market/repasses/:id/conciliar
```

## Sequencia Implementada

### Fase 1 - Perfil e Publicacao

- [x] `GET /publico/lojas/:slug` com perfil, colecoes e CTA para Market.
- [x] `GET /publico/market/produtos` com produtos elegiveis e fornecedor sanitizado.
- [x] `GET /publico/market/categorias`.
- [x] `GET /team/loja/market/resumo`.
- [x] `PUT /team/loja/produtos/:codigo/publicacao`.
- [x] `PUT /team/loja/produtos/publicacao-em-massa`.

### Fase 2 - Produto, Similares e Descoberta

- [x] `GET /publico/market/produtos/:codigo`.
- [x] `GET /publico/market/produtos/:codigo/similares`.
- [x] `GET /publico/lojas/:slug/produtos/:codigo/similares`.
- [x] `GET /publico/market/lojas`.
- [x] `GET /publico/market/lojas/:slug`.
- [x] `POST /publico/recomendacoes/eventos`.

### Fase 3 - Bizy Studio no Team

- [x] `GET /team/loja/catalogos`.
- [x] `POST /team/loja/catalogos`.
- [x] `PUT /team/loja/catalogos/:id`.
- [x] `DELETE /team/loja/catalogos/:id`.
- [x] `GET /team/loja/seguidores`.
- [x] `GET /team/loja/metricas`.

### Fase 4 - Checkout Unificado

- [x] `/checkout` frontend com carrinho local, fornecedor por item e idempotencia.
- [x] Checkout para carrinho de uma unica loja via endpoint da loja.
- [x] Carrinho multi-loja agrupado por fornecedor.
- [x] `POST /publico/market/checkout` para compra unificada multi-loja com pedidos filhos por fornecedor, IVA, taxa Bizy e repasses.
- [x] `POST /publico/market/compras/:id/pagamento` para pagamento/comprovativo centralizado e propagacao para pedidos filhos.
- [x] `GET /publico/market/compras/:id` para acompanhamento pelo comprador com estado por fornecedor.
- [x] `GET /team/loja/pedidos-market` para pedidos com origem Market no Team da loja.

### Fase 5 - Governanca, Financeiro e Boost

- [x] `GET /admin/market/categorias` e `POST /admin/market/categorias`.
- [x] `POST /admin/market/suspender` ou endpoints equivalentes de suspensao/reativacao de lojas e produtos.
- [x] `POST /admin/market/destaque` ou endpoints equivalentes de destaque, verificado e patrocinado para produtos.
- [x] `GET /admin/market/denuncias` e `PUT /admin/market/denuncias/:id/resolver`.
- [x] `GET /admin/market/repasses` e `POST /admin/market/repasses/:id/conciliar`.
- [x] `GET /team/loja/repasses`.

## MVP Obrigatorio

O menor conjunto coerente para lancar o Bizy Market sem quebrar a proposta:

```txt
/market
/market/categorias/:categoria
/market/produtos/:codigo
/market/lojas
/lojas/:slug
/lojas/:slug/produtos/:codigo
/checkout
/compras/:id
/app/loja
```

APIs correspondentes:

```txt
GET /publico/market/produtos
GET /publico/market/categorias
GET /publico/market/produtos/:codigo
GET /publico/market/produtos/:codigo/similares
POST /publico/market/checkout
GET /publico/market/compras/:id
GET /team/loja/market/resumo
PUT /team/loja/produtos/:codigo/publicacao
```

## Guardrails

- Nao criar rotas publicas que exponham `negocioId`, custo, margem ou dados privados.
- Nao colocar dados pessoais em query string de checkout, tracking ou preview social.
- Nao duplicar configuracao de loja fora do Team.
- Nao permitir que produto patrocinado apareca se falhar regras de seguranca.
- Nao deixar rota admin sem auditoria.
- Nao inventar prova social publica: ratings, vendidos, reviews, seguidores e tempo de resposta devem vir do backend ou ficar ausentes.

## Ligacoes

- [[bizy-market-lojas-digitais]]
- [[bizy-market-frontend-lojas]]
- [[requisitos-bizy-market]]
- [[loja-digital-operacao-crm]]
