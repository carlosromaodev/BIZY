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
updated: 2026-06-19
---

# Frontend das Lojas e Bizy Market

Status: implementado
Ultima atualizacao: 2026-06-19
Fontes principais: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`, `docs/superpowers/plans/2026-06-07-bizy-market-frontend-lojas.md`, referencia visual colada, [[bizy-market-lojas-digitais]], [[bizy-market-rotas-roadmap]]

> [!abstract] Decisao
> O proximo frontend deve focar apenas no ramo das lojas digitais: perfil publico da loja, produto da loja, Bizy Market, detalhe do produto no Market e Minha Loja/Bizy Studio. O CRM geral nao entra neste recorte.

## Telas Prioritarias

- `/lojas/:slug`: perfil publico da loja como perfil social-comercial.
- `/lojas/:slug/produtos/:codigo`: detalhe de produto vendido por uma loja.
- `market.usebizy.space/`: shopping center de produtos publicados por varias lojas, com `/market` como fallback local.
- `market.usebizy.space/categorias/:categoria`: navegacao por categoria global, com `/market/categorias/:categoria` como fallback.
- `market.usebizy.space/produtos/:codigo`: detalhe de produto no Market com similares, com `/market/produtos/:codigo` como fallback.
- `/checkout`: entrada progressiva do checkout unificado Bizy.
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
- `GET /publico/market/lojas`
- `GET /publico/market/lojas/:slug`
- `POST /publico/recomendacoes/eventos`

### CRM

- `GET /loja-publica/configuracao`
- `PUT /loja-publica/configuracao`
- `GET /loja-publica/tracking/resumo`
- `GET /crm/loja/market/resumo`
- `PUT /crm/loja/produtos/:codigo/publicacao`
- `PUT /crm/loja/produtos/publicacao-em-massa`
- `GET /crm/loja/catalogos`
- `POST /crm/loja/catalogos`
- `PUT /crm/loja/catalogos/:id`
- `DELETE /crm/loja/catalogos/:id`
- `GET /crm/loja/seguidores`
- `GET /crm/loja/metricas`

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
- [x] Primeira versao do produto da loja implementada pela rota `/lojas/:slug/produtos/:codigo`.
- [x] Bottom nav da loja validada como experiencia mobile-only com sobreposicao nativa e verde Bizy.
- [x] Endpoint de similares da loja criado em `GET /publico/lojas/:slug/produtos/:codigo/similares`.
- [x] Chat de conversas preparado para atualizar mensagens recebidas automaticamente via SSE com fallback de polling.
- [x] Market completo, detalhe do produto no Market e Studio completo implementados no frontend.
- [x] Entrada progressiva `/checkout` implementada com carrinho local, fornecedor por item, bloqueio multi-loja e finalizacao real para carrinho de uma loja.

## Implementacao Frontend

- `frontend/src/lojas/tiposLojas.ts`: tipos dos contratos publicos, checkout, tracking, configuracao de loja, Market e publicacao no Studio.
- `frontend/src/lojas/rotasLojas.ts`: rotas publicas, rotas internas e endpoints de API centralizados.
- `frontend/src/marketDominio.ts`: dominio canonico do Bizy Market, resolvendo `market.usebizy.space` e mantendo fallback `/market`.
- `frontend/src/lojas/apiLojas.ts`: helpers para endpoints publicos sem sessao e endpoints CRM autenticados por cookie.
- `frontend/src/lojas/checkoutUnificado.ts`: carrinho local do checkout Bizy com item por fornecedor, agrupamento por loja e totais.
- `frontend/src/lojas/index.ts`: barrel export para as paginas importarem de `src/lojas`.
- `frontend/src/paginas/LojaDigitalPublica.tsx`: iniciou a conversao da loja publica para perfil social-comercial, consumindo `obterLojaPublica`, registrando tracking por `registrarEventoTrackingPublico`, expondo capa/avatar/bio/localizacao/contadores, CTA `Ver similares no Bizy Market`, catalogos clicaveis que filtram a grelha e abertura direta do produto pela URL `/lojas/:slug/produtos/:codigo`.
- `frontend/src/paginas/Market.tsx`: implementa `/market` e `/market/categorias/:categoria` com busca global, categorias reais, filtros por loja/provincia/municipio, query string sincronizada, cards com fornecedor visivel e lojas em destaque derivadas dos produtos reais.
- `frontend/src/paginas/ProdutoMarket.tsx`: implementa `/market/produtos/:codigo` com fornecedor original, CTA para loja, compra coerente pela loja e similares com aviso claro de que podem vir de outros fornecedores.
- `frontend/src/paginas/CheckoutBizy.tsx`: implementa `/checkout` com carrinho unificado progressivo, dados do comprador, entrega, consentimento e guardrail multi-loja.
- `frontend/src/paginas/LojaPublica.tsx`: passa a operar como Bizy Studio em `/app/loja`, consumindo resumo real do Market, publicacao individual, publicacao em massa apenas de elegiveis e tabela com pendencias.
- `frontend/src/estilos.css`: adicionou a base visual da experiencia nativa da loja com `--loja-accent` para identidade da loja, `--loja-action` para acoes em verde Bizy, top app bar translucida, capa sobreposta, avatar e stats.
- `frontend/src/paginas/Conversas.tsx`: adicionou revalidacao automatica quando chegam eventos `WHATSAPP_MESSAGE_RECEIVED` e fallback de polling quando o canal SSE cair.
- `backend/src/infra/http/HubTempoReal.ts`: ajustou SSE com CORS por origem permitida, credenciais, heartbeat e limpeza de conexao para evitar chat parado ate refresh manual.
- `backend/src/infra/http/modulos/lojaPublica.ts`: adicionou o contrato publico de similares dentro da loja.

## Garantias Ja Validadas

- Publico: chamadas para `/publico/lojas/*` e `/publico/market/*` usam `requisitarApi(..., false)`.
- Studio: chamadas `/loja-publica/*` e `/crm/loja/*` usam `requisitarApi` autenticado com `credentials: "include"`.
- Normalizadores devolvem foto principal, preco final, preco antigo, slug da loja, fornecedor e URL de Market.
- `/lojas/:slug` usa a camada `src/lojas` em vez de fetch manual para a consulta principal e para tracking.
- A loja publica usa a cor de acento da loja/perfil e cai para o verde Bizy quando o backend nao envia cor.
- Navegacao, contacto e botoes de compra usam `--loja-action: var(--green)` para evitar que lojas com cor rosa/vermelha pintem os CTAs principais.
- Catalogos de perfil e categorias internas usam o mesmo `CatalogoFiltroAtivo`, registram `CATALOGO_VISTO` e filtram produtos sem navegar para outra URL.
- A rota `/lojas/:slug/produtos/:codigo` abre o produto diretamente e trata produto inexistente com mensagem de erro.
- O produto da loja mostra badge da loja fornecedora, accordions de descricao/entrega/politicas e link para similares no Bizy Market.
- Produto da loja e produto do Market podem adicionar item ao checkout Bizy sem remover o fluxo atual de compra assistida.
- O checkout Bizy cria pedido real pelo endpoint atual quando todos os itens pertencem a uma unica loja; carrinhos multi-loja ficam bloqueados ate existir backend de pedidos filhos.
- `/market` e `/market/categorias/:categoria` usam endpoints publicos reais e sincronizam filtros com a URL.
- `/market/produtos/:codigo` consome produto e similares publicos, preservando fornecedor original.
- `/app/loja` exige sessao pela rota privada do CRM e usa cookies/credenciais nos endpoints do Studio.
- A barra inferior da loja aparece apenas em mobile, flutua sobre o conteudo com glass/safe-area e nao aparece no desktop.
- `GET /publico/lojas/:slug/produtos/:codigo/similares` usa o Bizy Market como fonte de similares sem confundir origem da loja.
- `npm run typecheck` no frontend passou em 2026-06-10.
- `npx vitest run testes/lojas-market-frontend.test.ts` passou em 2026-06-10 cobrindo Market, PDP do Market, Studio, PDP da loja e ausencia de mock data nas paginas conectadas.
- `npx vitest run testes/checkout-unificado.test.ts` passou em 2026-06-10 cobrindo rota `/checkout`, carrinho unificado, guardrail multi-loja e integracao dos produtos.
- Diretorio de lojas do Market (`PaginaDiretorioLojasMarket`) corrigido para usar `listarLojasMarket` API em vez de derivar lojas de produtos.
- Perfil de loja no Market (`PaginaLojaMarket`) criado em `/market/lojas/:slug` consumindo `obterLojaMarket`.
- Bizy Studio estendido com `StudioSeguidoresPanel` (seguidores via `listarSeguidoresCrm`) e `StudioMetricasPanel` (metricas via `obterMetricasLojaCrm`).
- Teste de contrato backend Fase 2+3 criado em `backend/src/testes/bizy-market-fase2-3.test.ts` (5 testes, todos passando em 2026-06-19).

## Ligacoes

- [[bizy-market-lojas-digitais]]
- [[bizy-market-rotas-roadmap]]
- [[requisitos-bizy-market]]
- [[loja-digital-operacao-crm]]
- [[inventario-frontend]]
- [[identidade-visual-bizy-v2]]
