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
status: rascunho
updated: 2026-06-07
---

# Frontend das Lojas e Bizy Market

Status: rascunho
Ultima atualizacao: 2026-06-07
Fontes principais: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`, `docs/superpowers/plans/2026-06-07-bizy-market-frontend-lojas.md`, referencia visual colada, [[bizy-market-lojas-digitais]], [[bizy-market-rotas-roadmap]]

> [!abstract] Decisao
> O proximo frontend deve focar apenas no ramo das lojas digitais: perfil publico da loja, produto da loja, Bizy Market, detalhe do produto no Market e Minha Loja/Bizy Studio. O CRM geral nao entra neste recorte.

## Telas Prioritarias

- `/lojas/:slug`: perfil publico da loja como perfil social-comercial.
- `/lojas/:slug/produtos/:codigo`: detalhe de produto vendido por uma loja.
- `/market`: shopping center de produtos publicados por varias lojas.
- `/market/categorias/:categoria`: navegacao por categoria global.
- `/market/produtos/:codigo`: detalhe de produto no Market com similares.
- `/app/loja`: configuracao e publicacao da loja dentro do CRM.

## O Que Aproveitar da Referencia

- Top app bar translucida e simples.
- Bottom navigation apenas no mobile.
- Hero de loja com avatar/logo sobreposto.
- Bio, localizacao, acoes e contadores no perfil.
- Colecoes em chips horizontais sticky.
- Grelha de produtos com imagem forte e cards leves.
- Market com busca, categorias, filtros, destaques e produtos por fornecedor.
- Produto com galeria, variantes, barra mobile fixa e similares.
- Studio com formulario de perfil, tabela de publicacao no Market, status e preview.

## Referencia Stitch Local

Fonte: `/home/carlos/Downloads/vitorino/stitch_bizy_marketplace_suite.zip`

Modelos analisados:

- `bizy_market_home_mobile`
- `bizy_market_categorias_mobile`
- `bizy_perfil_da_loja_mobile`
- `bizy_produto_da_loja_mobile`
- `bizy_market_detalhe_do_produto_mobile`
- `bizy_studio_minha_loja_mobile`

Decisoes de inspiracao:

- Marketplace publico deve ficar claro, editorial e mobile-first, com canvas off-white, cards brancos, bordas leves e imagem de produto como protagonista.
- Top app bar e bottom nav devem passar experiencia nativa: sticky/translucidos, com bottom nav somente no mobile.
- Perfil da loja deve usar capa forte, avatar sobreposto, bio curta, chips de colecoes e CTA discreto para o Market.
- Produto da loja deve ter galeria, badge da loja, variantes, accordions e barra de acao fixa mobile.
- Detalhe do produto no Market deve separar claramente fornecedor original e similares de outros fornecedores.
- Studio deve ser operacional: formulario de perfil, tabela de produtos no Market, status/tracking e preview mini.

Adaptacoes obrigatorias:

- Substituir Material Symbols por `lucide-react`.
- Usar verde Bizy nos CTAs e estados principais, nao rosa nem preto puro como unica cor de acao.
- Usar Kz/AOA e portugues.
- Nao inventar seguidores, avaliacoes, carrinho ou perfil de comprador sem backend.
- Nao copiar HTML estatico do Stitch; converter para componentes React ligados aos endpoints reais.

## O Que Evitar

- Copiar HTML estatico.
- Usar Material Symbols em vez de `lucide-react`.
- Usar dados falsos para seguidores, avaliacoes, carrinho ou perfil de comprador.
- Esconder o fornecedor nos cards do Market.
- Misturar este recorte com o CRM inteiro.
- Ativar checkout multi-loja sem backend.

## Contratos Reais

### Publico

- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `POST /publico/lojas/:slug/produtos/:codigo/whatsapp`
- `POST /publico/lojas/:slug/checkout`
- `POST /publico/tracking/eventos`
- `GET /publico/market/categorias`
- `GET /publico/market/produtos`
- `GET /publico/market/produtos/:codigo`
- `GET /publico/market/produtos/:codigo/similares`

### CRM

- `GET /loja-publica/configuracao`
- `PUT /loja-publica/configuracao`
- `GET /loja-publica/tracking/resumo`
- `GET /crm/loja/market/resumo`
- `PUT /crm/loja/produtos/:codigo/publicacao`
- `PUT /crm/loja/produtos/publicacao-em-massa`

## Principios de UX

- A loja preserva identidade propria.
- O Market aumenta descoberta, mas nao apaga a loja fornecedora.
- Produto similar pode vir de outra loja, mas isso deve ser explicito.
- O mobile e a experiencia principal para comprador.
- O desktop do Studio deve ser denso, rapido e operacional.
- Motion deve ajudar orientacao, nao decorar.

## Estado Atual dos MDs

- [x] Spec criada: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`
- [x] Plano criado: `docs/superpowers/plans/2026-06-07-bizy-market-frontend-lojas.md`
- [x] Nota de memoria criada: [[bizy-market-frontend-lojas]]
- [x] Implementacao frontend iniciada com a camada `frontend/src/lojas`.
- [x] Teste de contrato da camada API criado em `frontend/testes/lojas-api.test.ts`.
- [x] Fase 1 concluida: tipos, rotas, helpers e normalizadores para loja publica, Market e Studio.
- [x] Pacote Stitch local analisado e incorporado na spec como direcao visual.
- [x] Primeira versao da tela `/lojas/:slug` iniciada com perfil social-comercial.
- [x] Catalogos do perfil passaram a filtrar a grelha da loja sem troca de pagina.
- [ ] Produto da loja, Market e Studio ainda por implementar.

## Implementacao Frontend

- `frontend/src/lojas/tiposLojas.ts`: tipos dos contratos publicos, checkout, tracking, configuracao de loja, Market e publicacao no Studio.
- `frontend/src/lojas/rotasLojas.ts`: rotas publicas, rotas internas e endpoints de API centralizados.
- `frontend/src/lojas/apiLojas.ts`: helpers para endpoints publicos sem sessao e endpoints CRM autenticados por cookie.
- `frontend/src/lojas/index.ts`: barrel export para as paginas importarem de `src/lojas`.
- `frontend/src/paginas/LojaDigitalPublica.tsx`: iniciou a conversao da loja publica para perfil social-comercial, consumindo `obterLojaPublica`, registrando tracking por `registrarEventoTrackingPublico`, expondo capa/avatar/bio/localizacao/contadores, CTA `Ver similares no Bizy Market` e catalogos clicaveis que filtram a grelha.
- `frontend/src/estilos.css`: adicionou a base visual da experiencia nativa da loja com `--loja-accent` para identidade da loja, `--loja-action` para acoes em verde Bizy, top app bar translucida, capa sobreposta, avatar e stats.

## Garantias Ja Validadas

- Publico: chamadas para `/publico/lojas/*` e `/publico/market/*` usam `requisitarApi(..., false)`.
- Studio: chamadas `/loja-publica/*` e `/crm/loja/*` usam `requisitarApi` autenticado com `credentials: "include"`.
- Normalizadores devolvem foto principal, preco final, preco antigo, slug da loja, fornecedor e URL de Market.
- `/lojas/:slug` usa a camada `src/lojas` em vez de fetch manual para a consulta principal e para tracking.
- A loja publica usa a cor de acento da loja/perfil e cai para o verde Bizy quando o backend nao envia cor.
- Navegacao, contacto e botoes de compra usam `--loja-action: var(--green)` para evitar que lojas com cor rosa/vermelha pintem os CTAs principais.
- Catalogos de perfil e categorias internas usam o mesmo `CatalogoFiltroAtivo`, registram `CATALOGO_VISTO` e filtram produtos sem navegar para outra URL.
- `npm run typecheck` no frontend passou em 2026-06-07.

## Ligacoes

- [[bizy-market-lojas-digitais]]
- [[bizy-market-rotas-roadmap]]
- [[loja-digital-operacao-crm]]
- [[inventario-frontend]]
- [[identidade-visual-bizy-v2]]
