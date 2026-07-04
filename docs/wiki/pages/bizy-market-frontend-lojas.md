---
title: Frontend das Lojas e Bizy Market
aliases:
  - Telas das Lojas Bizy
  - Frontend Bizy Market
  - Bizy Studio Frontend
tags:
  - bizy/market
  - bizy/frontend
  - bizy/loja-digital
  - bizy/ux
status: implementado
updated: 2026-07-02
---

# Frontend das Lojas e Bizy Market

Status: implementado
Ultima atualizacao: 2026-07-02
Fontes principais: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`, `docs/superpowers/plans/2026-06-07-bizy-market-frontend-lojas.md`, [[bizy-market-lojas-digitais]], [[bizy-market-rotas-roadmap]], `frontend/src/lojas`.

> [!abstract] Decisao
> O frontend de lojas cobre perfil publico da loja, produto da loja, Bizy Market, detalhe do produto no Market, checkout unificado e Bizy Studio em `/app/loja`. A camada operacional usa endpoints Team; nomes CRM sobrevivem apenas como aliases de compatibilidade no codigo.

## Telas Implementadas

- `/lojas/:slug`: perfil publico da loja como perfil social-comercial.
- `/lojas/:slug/catalogos/:catalogo`: catalogo partilhavel da loja.
- `/lojas/:slug/produtos/:codigo`: detalhe de produto vendido por uma loja.
- `market.usebizy.space/`: shopping center de produtos publicados por varias lojas, com `/market` como fallback local.
- `market.usebizy.space/categorias/:categoria`: navegacao por categoria global, com `/market/categorias/:categoria` como fallback.
- `market.usebizy.space/produtos/:codigo`: detalhe de produto no Market, com `/market/produtos/:codigo` como fallback.
- `market.usebizy.space/lojas`: diretorio de lojas, com `/market/lojas` como fallback.
- `market.usebizy.space/lojas/:slug`: perfil de loja no contexto Market, com `/market/lojas/:slug` como fallback.
- `/checkout`: checkout Bizy com carrinho local, single-store e multi-loja.
- `/compras/:id`: acompanhamento de compra unificada.
- `/app/loja`: configuracao e publicacao da loja dentro do Team.

## Direcao Visual

- Marketplace publico claro, mobile-first, canvas off-white, cards brancos, bordas leves e imagem de produto como protagonista.
- Top app bar e bottom nav com experiencia nativa; bottom nav somente no mobile.
- Perfil da loja com capa forte, avatar sobreposto, bio curta, chips de colecoes e CTA discreto para o Market.
- Produto da loja com galeria, badge da loja, variantes, accordions e barra de acao fixa mobile.
- Detalhe do produto no Market separa claramente fornecedor original e similares de outros fornecedores.
- Studio operacional: formulario de perfil, tabela de produtos no Market, status/tracking, seguidores, metricas e preview.
- CTAs e estados principais usam verde Bizy; identidade visual da loja aparece como acento, sem dominar a acao principal.
- UI publica nao usa prova social simulada. Ratings, reviews, vendidos, seguidores, tempo de resposta e selos so aparecem quando vierem de contrato real.

## O Que Evitar

- Copiar HTML estatico de referencia.
- Usar Material Symbols em vez de `lucide-react`.
- Usar dados falsos para seguidores, avaliacoes, vendidos, carrinho, reviews ou perfil de comprador.
- Esconder o fornecedor nos cards do Market.
- Misturar este recorte com telas administrativas que nao fazem parte da loja/Market.
- Simular checkout multi-loja fora do backend. O fluxo multi-loja deve usar `POST /publico/market/checkout`.

## Contratos Reais

### Publico

- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/catalogos/:catalogo`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `GET /publico/lojas/:slug/produtos/:codigo/similares`
- `POST /publico/lojas/:slug/produtos/:codigo/whatsapp`
- `POST /publico/lojas/:slug/checkout`
- `POST /publico/lojas/:slug/checkout/abandonado`
- `POST /publico/lojas/:slug/seguir`
- `DELETE /publico/lojas/:slug/seguir`
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

- `GET /loja-publica/configuracao`
- `PUT /loja-publica/configuracao`
- `GET /loja-publica/tracking/resumo`
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

`/crm/loja/*` e exports como `listarSeguidoresCrm` existem apenas como aliases legados apontando para Team.

## Principios de UX

- A loja preserva identidade propria.
- O Market aumenta descoberta, mas nao apaga a loja fornecedora.
- Produto similar pode vir de outra loja, mas isso deve ser explicito.
- O mobile e a experiencia principal para comprador.
- O desktop do Studio deve ser denso, rapido e operacional.
- Motion deve ajudar orientacao, nao decorar.
- A UI deve ser honesta: sem contadores fabricados, sem ratings deterministicas e sem reviews demonstrativas em telas publicas.
- Texto de entrega, pagamento e disponibilidade deve refletir regras reais da loja ou estado neutro.

## Estado Atual dos MDs

- [x] Spec criada: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`.
- [x] Plano criado: `docs/superpowers/plans/2026-06-07-bizy-market-frontend-lojas.md`.
- [x] Nota de memoria criada: [[bizy-market-frontend-lojas]].
- [x] Camada `frontend/src/lojas` criada com tipos, rotas, helpers, normalizadores, checkout e aliases legados.
- [x] Teste de contrato da camada API criado em `frontend/testes/lojas-api.test.ts`.
- [x] Market, categoria, diretorio de lojas, perfil de loja no Market e PDP Market implementados.
- [x] Loja publica, catalogos partilhaveis e PDP da loja implementados.
- [x] Checkout Bizy implementado com single-store e multi-loja real.
- [x] Acompanhamento de compra unificada implementado em `/compras/:id`.
- [x] Bizy Studio em `/app/loja` implementado com publicacao, catalogos, seguidores e metricas reais.
- [x] UI publica revisada para remover dados comerciais simulados.

## Implementacao Frontend

- `frontend/src/lojas/tiposLojas.ts`: tipos dos contratos publicos, checkout, tracking, configuracao de loja, Market, publicacao no Studio e compra unificada.
- `frontend/src/lojas/rotasLojas.ts`: rotas publicas, rotas internas e endpoints de API centralizados; endpoints Team sao canônicos.
- `frontend/src/marketDominio.ts`: dominio canonico do Bizy Market, resolvendo `market.usebizy.space` e mantendo fallback `/market`.
- `frontend/src/lojas/apiLojas.ts`: helpers para endpoints publicos sem sessao e endpoints Team autenticados por cookie.
- `frontend/src/lojas/checkoutUnificado.ts`: carrinho local do checkout Bizy com item por fornecedor, agrupamento por loja, totais e idempotencia.
- `frontend/src/paginas/LojaDigitalPublica.tsx`: perfil publico, catalogos, PDP modal/sheet, tracking, follow, checkout e estados vazios sem reviews simuladas.
- `frontend/src/paginas/CatalogoPublico.tsx`: catalogo partilhavel por loja com filtros reais e fornecedor identificado.
- `frontend/src/paginas/Market.tsx`: home/categoria do Market com busca, categorias, filtros, fornecedor visivel e sinais reais de produto.
- `frontend/src/paginas/ProdutoMarket.tsx`: PDP do Market com fornecedor original, CTA para loja, checkout e similares.
- `frontend/src/paginas/CheckoutBizy.tsx`: checkout com dados do comprador, entrega, pagamento, consentimento, single-store e multi-loja.
- `frontend/src/paginas/CompraUnificada.tsx`: acompanhamento publico da compra unificada.
- `frontend/src/paginas/LojaPublica.tsx`: Bizy Studio em `/app/loja`, com configuracao, tracking, publicacao, seguidores e metricas.
- `frontend/src/estilos.css`: base visual da loja, Market, checkout, estados mobile e sinais reais de produto.

## Garantias Ja Validadas

- Publico: chamadas para `/publico/lojas/*` e `/publico/market/*` usam `requisitarApi(..., false)`.
- Studio: chamadas `/loja-publica/*` e `/team/loja/*` usam `requisitarApi` autenticado com `credentials: "include"`.
- Normalizadores devolvem foto principal, preco final, preco antigo, slug da loja, fornecedor e URL de Market.
- `/lojas/:slug` usa a camada `src/lojas` em vez de fetch manual para consulta principal e tracking.
- A loja publica usa a cor de acento da loja/perfil e cai para o verde Bizy quando o backend nao envia cor.
- Navegacao, contacto e botoes de compra usam verde Bizy para acoes principais.
- Catalogos de perfil e categorias internas registram tracking e filtram produtos sem navegar para outra URL.
- Produto da loja e produto do Market podem adicionar item ao checkout Bizy.
- Carrinho multi-loja finaliza por `POST /publico/market/checkout`; carrinho de uma loja continua podendo usar checkout da loja.
- `/market` e `/market/categorias/:categoria` usam endpoints publicos reais e sincronizam filtros com a URL.
- `/market/produtos/:codigo` consome produto e similares publicos, preservando fornecedor original.
- `/app/loja` exige sessao pela rota privada do Team.
- A barra inferior da loja aparece apenas em mobile, flutua sobre o conteudo com safe-area e nao aparece no desktop.
- `GET /publico/lojas/:slug/produtos/:codigo/similares` usa o Bizy Market como fonte de similares sem confundir origem da loja.
- `StudioSeguidoresPanel` usa `listarSeguidoresTeam`; `StudioMetricasPanel` usa `obterMetricasLojaTeam`.

## Ligacoes

- [[bizy-market-lojas-digitais]]
- [[bizy-market-rotas-roadmap]]
- [[requisitos-bizy-market]]
- [[loja-digital-operacao-crm]]
- [[inventario-frontend]]
- [[identidade-visual-bizy-v2]]
