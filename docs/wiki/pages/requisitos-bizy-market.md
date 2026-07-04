---
title: Requisitos do Bizy Market e Lojas Digitais
aliases:
  - RF Bizy Market
  - Requisitos Market
  - Bizy Market Requisitos
tags:
  - bizy/requisitos
  - bizy/market
status: implementado
updated: 2026-07-02
---

# Requisitos do Bizy Market e Lojas Digitais

> [!info] Fonte principal
> Sintese auditada contra `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, backend `modulos/market.ts`, `modulos/checkoutUnificado.ts`, `BizyMarketUseCase`, `CheckoutUnificadoUseCase`, `RepassesFinanceirosUseCase` e frontend `src/lojas`, `Market.tsx`, `ProdutoMarket.tsx`, `LojaDigitalPublica.tsx`, `CheckoutBizy.tsx`.
> `Team` e o nome canonico da operacao. `CRM` permanece apenas como descricao de produto/base historica e alias legado `/crm/loja/*`.

## Visao de Produto

O **Bizy Market** combina perfis de loja independentes, shopping center de descoberta, checkout unificado, operacao Team e tracking. Cada negocio mantem loja autonoma (`slug.bizy.space` ou `slug.usebizy.space`) e pode participar no shopping center central (`market.usebizy.space`, com `/market` como fallback local).

## Modulos

| Modulo | Estado | Evidencia |
|---|---|---|
| **Bizy Loja** | `[x]` | `/publico/lojas/:slug`, `/lojas/:slug`, catalogos, produto publico, seguir/deixar de seguir |
| **Bizy Market** | `[x]` | `/publico/market/produtos`, categorias, lojas, detalhe, similares, ranking por score |
| **Bizy Checkout** | `[x]` | `/checkout`, `POST /publico/market/checkout`, compras unificadas, pedidos filhos e acompanhamento |
| **Bizy Studio** | `[x]` | `/app/loja`, `/team/loja/market/resumo`, catalogos, seguidores, metricas, publicacao em massa |
| **Operacao Team** | `[x]` | pedidos Market, repasses, reembolsos, auditoria e governanca admin |

## Requisitos Funcionais

| Grupo | RFs | Estado | Evidencia |
|---|---:|---|---|
| Identidade e estrutura | RF-001 a RF-007 | `[x]` | modulo Market, loja publica autonoma, slug reservado, participacao opcional e configuracao no Studio |
| Perfil publico da loja | RF-008 a RF-016 | `[x]` | hero/capa/avatar, contadores reais, seguir loja, colecoes clicaveis, mobile-first, CTA Market |
| Personalizacao da loja | RF-017 a RF-023 | `[x]` | configuracao de perfil, colecoes/catalogos e limites de design no Studio |
| Catalogos, colecoes e produtos | RF-024 a RF-032 | `[x]` | categorias globais, colecoes locais, destaques por selo, elegibilidade e auditoria operacional |
| Shopping center Market | RF-033 a RF-042 | `[x]` | home, busca, filtros, fornecedor visivel, lojas, patrocinados identificados e ranking por score |
| Produto publico e similares | RF-043 a RF-048 | `[x]` | PDP Market/loja, variantes, disponibilidade, loja original e similares sem ambiguidade |
| Checkout unificado | RF-049 a RF-062 | `[x]` | carrinho local, single-store, multi-loja, entrega por loja, consentimento, comprovativo e compra acompanhavel |
| Pedidos, pagamentos e repasses | RF-063 a RF-072 | `[x]` | pedidos por fornecedor, origem Market, estado separado, repasses, cancelamento parcial e reembolso |
| Central de controlo Team | RF-073 a RF-081 | `[x]` | Bizy Studio, pedidos Market, metricas, seguidores/leads, campanhas e tarefas operacionais |
| Seguidores e relacionamento | RF-082 a RF-087 | `[x]` | `seguir`, `seguindo`, listagem Team, privacidade e origem do seguidor |
| Recomendacoes e descoberta | RF-088 a RF-092 | `[x]` | similares, lojas relacionadas, blocos de descoberta, guardrails e tracking de recomendacao |
| SEO, links e presenca publica | RF-093 a RF-097 | `[x]` | URLs canonicas, SEO, preview social e protecao de rotas privadas |
| Administracao e governanca | RF-098 a RF-104 | `[x]` | categorias admin, suspensao, destaque/patrocinio, denuncias, relatorio e auditoria |
| Notificacoes e comunicacao | RF-105 a RF-108 | `[x]` | confirmacao de compra, tarefas humanas, politicas WhatsApp e eventos operacionais |
| Relatorios | RF-109 a RF-114 | `[x]` | metricas Team, origem de vendas, funil, produtos e exportacao por permissao/plano |

## Requisitos Nao Funcionais

| ID | Estado | Evidencia |
|---|---|---|
| RNF-001 a RNF-003 | `[x]` | UI mobile-first, grelhas responsivas, busca/filtros com query string e limite de resultados |
| RNF-004 a RNF-006 | `[x]` | isolamento por `negocioId`, respostas publicas sanitizadas e dados pessoais fora de URL/cards |
| RNF-007 a RNF-010 | `[x]` | idempotencia no checkout/tracking, eventos e auditoria de acoes sensiveis |
| RNF-011 a RNF-012 | `[x]` | foco/ARIA em acoes principais e `prefers-reduced-motion` nas animacoes |
| RNF-013 a RNF-014 | `[x]` | personalizacao limitada por dados/tokens; upload/media tratado pela camada de media |
| RNF-015 a RNF-017 | `[x]` | degradacao segura, checkout sem provider online obrigatorio e Studio operacional sem tela decorativa |
| RNF-018 a RNF-025 | `[x]` | testes de contrato, extensibilidade, compatibilidade, cache/no-store, AOA/Kz e linguagem orientada a acao |

## Regras de Negocio

| Grupo | RNs | Estado | Evidencia |
|---|---:|---|---|
| Autonomia da loja | RN-001 a RN-005 | `[x]` | identidade propria preservada no Market |
| Publicacao no Market | RN-006 a RN-012 | `[x]` | produto precisa de loja ativa, imagem, preco, categoria, disponibilidade e permissao |
| Descoberta e similares | RN-013 a RN-017 | `[x]` | similares de outros fornecedores identificados e ranking por relevancia/qualidade |
| Checkout unificado | RN-018 a RN-029 | `[x]` | compra unica, pedidos filhos, minimizacao de dados, comprovativo e stock/reserva |
| Pagamentos e repasses | RN-030 a RN-035 | `[x]` | conciliacao antes de repasse, taxas, cancelamento, reembolso e trilha auditavel |
| Team como fonte de verdade | RN-036 a RN-041 | `[x]` | configuracao/operacao no Team; alias CRM apenas legado |
| Seguidores e consentimento | RN-042 a RN-047 | `[x]` | follow nao equivale a marketing sem consentimento; listagem privada no Team |
| Privacidade e dados | RN-048 a RN-052 | `[x]` | fornecedor ve apenas sua parte e tracking publico bloqueia dados sensiveis |
| Moderacao e confianca | RN-053 a RN-057 | `[x]` | denuncias, suspensao, produtos proibidos e selos derivados de dado/revisao |
| Planos e monetizacao | RN-058 a RN-062 | `[x]` | comissao/taxa/destaque patrocinado e custos visiveis |
| Migracao | RN-063 a RN-067 | `[x]` | loja publica preservada, Studio, checkout progressivo e Market como camada adicional |

## Contratos Canonicos

### Publico

- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/catalogos/:catalogo`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `GET /publico/lojas/:slug/produtos/:codigo/similares`
- `POST /publico/lojas/:slug/seguir`
- `DELETE /publico/lojas/:slug/seguir`
- `GET /publico/lojas/:slug/seguindo`
- `POST /publico/lojas/:slug/checkout`
- `POST /publico/tracking/eventos`
- `GET /publico/market/categorias`
- `GET /publico/market/produtos`
- `GET /publico/market/produtos/:codigo`
- `GET /publico/market/produtos/:codigo/similares`
- `GET /publico/market/lojas`
- `GET /publico/market/lojas/:slug`
- `POST /publico/recomendacoes/eventos`
- `POST /publico/market/checkout`
- `GET /publico/market/compras/:id`
- `POST /publico/market/compras/:id/pagamento`

### Team / Studio

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

`/crm/loja/*` existe apenas como alias legado para compatibilidade durante a migracao.

## Guardrails

- Nao mostrar avaliacao, vendidos, seguidores ou prova social gerada localmente. Se nao vier do backend, a UI mostra estado vazio ou sinal operacional real.
- Nao transformar o Market num catalogo anonimo que apaga a marca das lojas.
- Nao criar checkout que gere pedido impossivel de operar no Team.
- Nao expor dados privados de Team para descoberta publica.
- Nao permitir personalizacao que destrua contraste, hierarquia ou experiencia mobile.
- Nao criar automacao financeira sem auditoria, permissao e fallback humano.

## Ligacoes

- [[bizy-market-lojas-digitais]]
- [[bizy-market-rotas-roadmap]]
- [[bizy-market-frontend-lojas]]
- [[loja-digital-operacao-crm]]
- `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
