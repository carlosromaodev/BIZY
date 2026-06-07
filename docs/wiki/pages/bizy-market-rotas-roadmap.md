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
status: rascunho
updated: 2026-06-07
---

# Bizy Market Rotas e Roadmap

Status: rascunho
Ultima atualizacao: 2026-06-07
Fontes principais: [[bizy-market-lojas-digitais]], `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`

> [!abstract] Decisao
> As rotas do Bizy Market devem separar experiencia publica, API publica, controlo da loja dentro do CRM, checkout unificado e administracao Bizy. O Market gera descoberta; o CRM continua sendo a fonte de verdade da operacao.

## Principios de Roteamento

- Rotas publicas sem dados pessoais devem ser cacheaveis e compartilhaveis.
- Rotas de checkout, carrinho e comprovativo devem usar `no-store`.
- Rotas de CRM exigem sessao, permissao e isolamento por `negocioId`.
- Rotas Admin Bizy exigem papel interno e auditoria.
- O perfil da loja e o Market devem apontar um para o outro sem apagar a identidade do fornecedor.
- URLs antigas da loja publica devem continuar funcionando durante a migracao.

## Rotas Publicas do Comprador

Estas rotas representam telas navegaveis no frontend publico.

```txt
/market
/market/categorias
/market/categorias/:categoria
/market/busca
/market/produtos/:codigo
/market/produtos/:codigo/similares
/market/lojas
/market/lojas/:slug
/market/promocoes
/market/novidades
/market/destaques
```

## Perfil Publico da Loja

Estas rotas preservam a autonomia do cliente Bizy.

```txt
/lojas/:slug
/lojas/:slug/catalogos/:catalogo
/lojas/:slug/categorias/:categoria
/lojas/:slug/produtos/:codigo
/lojas/:slug/produtos/:codigo/similares
/lojas/:slug/seguir
/lojas/:slug/contacto
```

## Checkout Unificado

Estas rotas representam a experiencia unica do comprador.

```txt
/checkout
/checkout/carrinho
/checkout/identificacao
/checkout/entrega
/checkout/pagamento
/checkout/comprovativo
/checkout/confirmacao/:numeroCompra
/compras/:numeroCompra
/compras/:numeroCompra/acompanhar
```

## APIs Publicas

Estas rotas alimentam Market, perfil de loja, produto publico, similares e tracking.

```txt
GET  /publico/market/produtos
GET  /publico/market/produtos/:codigo
GET  /publico/market/produtos/:codigo/similares
GET  /publico/market/categorias
GET  /publico/market/lojas
GET  /publico/market/lojas/:slug

GET  /publico/lojas/:slug
GET  /publico/lojas/:slug/produtos/:codigo
GET  /publico/lojas/:slug/produtos/:codigo/similares
POST /publico/lojas/:slug/seguir
DELETE /publico/lojas/:slug/seguir

POST /publico/tracking/eventos
POST /publico/recomendacoes/eventos
```

## APIs do Checkout

Estas rotas devem ser idempotentes onde criam ou alteram estado.

```txt
GET  /publico/checkout/:checkoutId
POST /publico/checkout/carrinho
PUT  /publico/checkout/carrinho/:itemId
DELETE /publico/checkout/carrinho/:itemId
POST /publico/checkout/entrega/calcular
POST /publico/checkout/iniciar
POST /publico/checkout/pagamento
POST /publico/checkout/comprovativo
GET  /publico/compras/:numeroCompra
```

## CRM e Bizy Studio

Estas rotas ficam dentro do CRM e substituem qualquer painel separado da loja.

```txt
/crm/loja
/crm/loja/perfil
/crm/loja/tema
/crm/loja/catalogos
/crm/loja/produtos
/crm/loja/publicacao
/crm/loja/market
/crm/loja/checkout
/crm/loja/entrega
/crm/loja/pagamentos
/crm/loja/seo
/crm/loja/seguidores
/crm/loja/metricas
```

## APIs do CRM

Estas rotas controlam a loja a partir do CRM.

```txt
GET  /loja-publica/configuracao
PUT  /loja-publica/configuracao

GET  /crm/loja/catalogos
POST /crm/loja/catalogos
PUT  /crm/loja/catalogos/:id
DELETE /crm/loja/catalogos/:id

PUT  /crm/loja/produtos/:codigo/publicacao
PUT  /crm/loja/produtos/publicacao-em-massa

GET  /crm/loja/market/resumo
GET  /crm/loja/seguidores
GET  /crm/loja/metricas
GET  /crm/loja/pedidos-market
GET  /crm/loja/repasses
```

## Admin Bizy

Estas rotas pertencem ao painel interno Bizy.

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

Estas rotas exigem auditoria operacional.

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

## Sequencia Recomendada

### Fase 1 - Perfil e Publicacao

- [x] `GET /publico/lojas/:slug` com perfil, colecoes e CTA para Market.
- [x] `GET /publico/market/produtos` com produtos elegiveis e fornecedor sanitizado.
- [x] `GET /publico/market/categorias`.
- [x] `GET /crm/loja/market/resumo`.
- [x] `PUT /crm/loja/produtos/:codigo/publicacao`.
- [x] `PUT /crm/loja/produtos/publicacao-em-massa`.

### Fase 2 - Produto, Similares e Descoberta

- [x] `GET /publico/market/produtos/:codigo`.
- [x] `GET /publico/market/produtos/:codigo/similares`.
- [ ] `GET /publico/lojas/:slug/produtos/:codigo/similares`.
- [ ] `GET /publico/market/lojas`.
- [ ] `GET /publico/market/lojas/:slug`.
- [ ] `POST /publico/recomendacoes/eventos`.

### Fase 3 - Bizy Studio no CRM

- [ ] `GET /crm/loja/catalogos`.
- [ ] `POST /crm/loja/catalogos`.
- [ ] `PUT /crm/loja/catalogos/:id`.
- [ ] `DELETE /crm/loja/catalogos/:id`.
- [ ] `GET /crm/loja/seguidores`.
- [ ] `GET /crm/loja/metricas`.

### Fase 4 - Checkout Unificado

- [ ] `POST /publico/checkout/carrinho`.
- [ ] `POST /publico/checkout/entrega/calcular`.
- [ ] `POST /publico/checkout/iniciar`.
- [ ] `POST /publico/checkout/pagamento`.
- [ ] `POST /publico/checkout/comprovativo`.
- [ ] `GET /publico/compras/:numeroCompra`.
- [ ] `GET /crm/loja/pedidos-market`.

### Fase 5 - Governanca, Financeiro e Boost

- [ ] `/admin/market/categorias`.
- [ ] `/admin/market/lojas`.
- [ ] `/admin/market/produtos`.
- [ ] `/admin/market/denuncias`.
- [ ] `/admin/market/repasses`.
- [ ] `GET /crm/loja/repasses`.

## MVP Obrigatorio

O menor conjunto coerente para lançar o Bizy Market sem quebrar a proposta:

```txt
/market
/market/categorias/:categoria
/lojas/:slug
/lojas/:slug/produtos/:codigo
/checkout
/crm/loja/market
```

APIs correspondentes:

```txt
GET /publico/market/produtos
GET /publico/market/categorias
GET /publico/market/produtos/:codigo
GET /publico/market/produtos/:codigo/similares
PUT /crm/loja/produtos/:codigo/publicacao
GET /crm/loja/market/resumo
```

## Guardrails

- Nao criar rotas publicas que exponham `negocioId`, custo, margem ou dados privados.
- Nao colocar dados pessoais em query string de checkout, tracking ou preview social.
- Nao duplicar configuracao de loja fora do CRM.
- Nao permitir que produto patrocinado apareca se falhar regras de seguranca.
- Nao deixar rota admin sem auditoria.
