# Bizy Market Frontend - Telas de Lojas

Status: rascunho aprovado para iniciar frontend
Data: 2026-06-07
Escopo: telas publicas de loja, telas publicas do Bizy Market e Minha Loja/Bizy Studio minimo no CRM

## Fontes

- `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
- `docs/wiki/pages/bizy-market-lojas-digitais.md`
- `docs/wiki/pages/bizy-market-rotas-roadmap.md`
- `backend/src/infra/http/modulos/lojaPublica.ts`
- `backend/src/infra/http/modulos/market.ts`
- `backend/src/use-case/BizyMarketUseCase.ts`
- Referencia visual colada: `Bizy Market - Categorias`, `Perfil da Loja`, `Produto da Loja`, `Bizy Market - Home`, `Detalhe do Produto`, `Minha Loja`
- Pacote Stitch local: `/home/carlos/Downloads/vitorino/stitch_bizy_marketplace_suite.zip`

## Referencia Stitch - Direcao Visual Aproveitavel

O pacote Stitch confirma uma direcao que encaixa bem no Bizy: marketplace claro, editorial e mobile-first, com Studio mais denso e operacional. A inspiracao deve ser tratada como linguagem de produto, nao como codigo a copiar.

### Principios Extraidos

- Base visual clara: canvas off-white, cards brancos, bordas discretas e sombras muito suaves.
- Produto e loja no centro: imagens reais grandes, texto curto e fornecedor sempre visivel.
- Navegacao nativa: top app bar simples, sticky e translucida; bottom nav apenas no mobile; barras fixas sobrepostas com blur quando houver acao critica.
- Hierarquia calma: titulares fortes, labels pequenos, preco destacado e metadados em chips.
- CRM diferente do comprador: Studio deve ser mais compacto, com tabela, status, metricas e preview, sem virar landing page.

### Adaptacoes Obrigatorias Para o Bizy

- Trocar o preto dominante de acao pelo verde do projeto (`--green`, `--primary`, `--color-accent`) sem perder contraste.
- Usar `lucide-react`; nao usar Material Symbols.
- Usar Kz/AOA, portugues e contexto local; remover euro, ingles e dados de surf como conteudo final.
- Usar apenas dados reais do backend: sem seguidores, avaliacoes, carrinho ou perfil de comprador falsos.
- Usar imagens de produtos/lojas vindas do backend; quando faltar imagem, usar placeholder discreto apenas em telas onde isso for permitido.
- Respeitar o design system existente em `frontend/src/estilos.css` e `frontend/src/componentes/BizyDesignSystem.tsx`.

### Padroes Por Tela

**Market Home**

- Top app bar com busca e atalho de notificacoes/conta apenas quando existir dado real.
- Busca global logo no topo, seguida de chips de localizacao/categoria.
- Categorias em carrossel horizontal com icone ou mini-imagem circular.
- Destaques em composicao bento, usando produtos/categorias reais quando houver dados.
- Grelha "Para ti" em duas colunas no mobile, com fornecedor, nome, preco e acao rapida.
- Bottom nav mobile: Home, Categorias, Loja/Market e Perfil; itens sem backend devem ficar ocultos ou neutros.

**Market Categoria**

- Breadcrumb curto, titulo grande e descricao da categoria.
- Filtros ativos em chips removiveis.
- No desktop, filtros laterais; no mobile, sheet de filtros.
- Cards de produto com fornecedor em uppercase discreto, nome, preco e badge de destaque quando existir dado.
- Secao de lojas em destaque apenas quando puder ser derivada de produtos reais da categoria.

**Perfil da Loja**

- Hero/capa horizontal forte, avatar/logo sobreposto e acoes proximas ao avatar.
- Bio curta, localizacao e contadores somente com dados reais.
- Colecoes/categorias em chips sticky.
- Grelha de produtos com imagem dominante e texto compacto.
- CTA "Ver similares no Bizy Market" no fim da grelha ou como bloco discreto.

**Produto da Loja**

- Galeria com imagem principal grande, thumbs e acoes flutuantes.
- Badge da loja fornecedora antes do titulo.
- Preco, promocao, stock e variantes com controles nativos: swatches, segmented buttons e accordions.
- Barra mobile fixa com acao principal e contacto/WhatsApp, sem aparecer no desktop.
- Link para similares no Market sem confundir a origem do produto atual.

**Detalhe do Produto no Market**

- Produto com destaque editorial, mas fornecedor original sempre visivel.
- Card da loja fornecedora com CTA "Visitar loja".
- Secao de similares com aviso claro: produtos podem ser de outros fornecedores.
- Cards de similares devem mostrar fornecedor e preco sem esconder que sao alternativas.

**Minha Loja / Bizy Studio**

- Pagina densa dentro do CRM, com titulo "Minha Loja" e subtitulo operacional.
- Card de perfil publico: capa, logo, nome, slug, bio, cor/acento e contactos.
- Card "Produtos no Market": busca, filtro, tabela compacta, pendencias e publicacao em massa.
- Card de status/tracking: loja online/publicada, visitas, cliques, produtos publicados e pendencias.
- Preview mobile mini apenas como espelho rapido, nao como tela decorativa principal.

## Decisao de Escopo

Este frontend nao deve tentar redesenhar o Bizy inteiro. O recorte certo e o ramo de lojas digitais:

- perfil publico da loja;
- produto publico da loja;
- home/categoria/listagem do Bizy Market;
- detalhe de produto do Market com similares;
- Minha Loja/Bizy Studio dentro do CRM para configuracao e publicacao.

Nao entram neste recorte: Painel geral, Clientes, Conversas, Live, Campanhas, Relatorios completos, Administracao do sistema e restantes telas do CRM.

## O Que Aproveitar da Referencia Visual

### Market Categoria

- Top app bar simples, translucida e fixa.
- Navegacao desktop por cluster horizontal e bottom nav apenas no mobile.
- Cabecalho de categoria com breadcrumb, titulo, descricao e filtros ativos.
- Filtros em chips removiveis.
- Sidebar de filtros no desktop.
- Grelha de produtos com imagem forte, fornecedor, nome e preco.
- Secao de lojas em destaque dentro da categoria.

### Perfil da Loja

- Hero/capa grande.
- Avatar/logo sobreposto ao hero.
- Nome da loja, selo visual, localizacao e descricao curta.
- Botao de seguir e botao de contacto.
- Contadores sociais/operacionais em linha.
- Colecoes em chips horizontais sticky.
- Grelha de produtos com cards leves.
- CTA discreto para ver lojas/produtos similares no Bizy Market.

### Produto da Loja

- Galeria principal com thumbnails.
- Acoes flutuantes sobre imagem.
- Badge da loja fornecedora.
- Nome, preco, disponibilidade e variantes.
- Acoes desktop no corpo e barra fixa no mobile.
- Accordion para descricao, entrega, politicas e detalhes.
- Link de cross-sell para similares no Market.

### Market Home

- Busca global e contexto de localizacao.
- Filtros rapidos por localizacao/categoria.
- Carrossel de categorias.
- Bento de destaques.
- Grelha "Para ti".
- Bottom nav mobile com Home, Categorias, Carrinho e Perfil, mas Carrinho/Perfil so devem aparecer quando o backend suportar ou como estado desativado/visual.

### Detalhe do Produto no Market

- Produto com imagens grandes e informacao clara.
- Loja fornecedora em destaque.
- CTA para visitar loja.
- Secao "Produtos Similares".
- Separacao explicita entre fornecedor original e fornecedores dos similares.

### Minha Loja / Bizy Studio

- Top app bar mobile dedicada.
- Sidebar desktop apenas se encaixar no shell existente do CRM.
- Pagina "Minha Loja" com descricao clara: configurar perfil publico e presenca no Market.
- Card de Perfil Publico com capa, logo, nome, slug, bio e localizacao.
- Card de Produtos no Market com tabela densa.
- Coluna secundaria com status da loja e preview mini.
- Acoes em massa para publicar/despublicar produtos.

## O Que Nao Aproveitar Literalmente

- Nao copiar HTML estatico da referencia.
- Nao usar Material Symbols; usar `lucide-react`, como o projeto ja faz.
- Nao usar CDN Tailwind nem fontes remotas novas; usar os tokens e imports existentes.
- Nao usar textos em ingles, euro ou dados de surf como conteudo real.
- Nao depender das imagens geradas da referencia.
- Nao expor carrinho/perfil de comprador como funcionalidade ativa se o backend ainda nao tiver checkout unificado/autenticacao do comprador.
- Nao renderizar seguidores, avaliacoes ou seguir como dado real sem contrato backend. Pode existir visual "em breve" ou contador oculto.

## Contratos Backend

### Loja Publica

- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `POST /publico/lojas/:slug/entrega/calcular`
- `POST /publico/lojas/:slug/produtos/:codigo/whatsapp`
- `POST /publico/lojas/:slug/checkout`
- `POST /publico/lojas/:slug/checkout/abandonado`
- `POST /publico/tracking/eventos`

### Bizy Market

- `GET /publico/market/categorias`
- `GET /publico/market/produtos`
- `GET /publico/market/produtos/:codigo`
- `GET /publico/market/produtos/:codigo/similares`

### Minha Loja / Bizy Studio

- `GET /loja-publica/configuracao`
- `PUT /loja-publica/configuracao`
- `GET /loja-publica/tracking/resumo`
- `GET /crm/loja/market/resumo`
- `PUT /crm/loja/produtos/:codigo/publicacao`
- `PUT /crm/loja/produtos/publicacao-em-massa`

## Rotas Frontend

- `/lojas/:slug`
- `/lojas/:slug/produtos/:codigo`
- `/market`
- `/market/categorias/:categoria`
- `/market/produtos/:codigo`
- `/app/loja` ou `/app/minha-loja`

## Estrutura Recomendada no Frontend

### API

Criar uma camada pequena e tipada para este ramo:

- `frontend/src/lojas/apiLojas.ts`
- `frontend/src/lojas/tiposLojas.ts`
- `frontend/src/lojas/rotasLojas.ts`

Caso o projeto prefira manter tudo em `frontend/src/api.ts`, pelo menos separar os tipos e helpers por prefixo `loja`/`market`.

### Componentes Publicos

- `LojaPerfilHero`
- `LojaColecoesTabs`
- `LojaProdutoGrid`
- `LojaProdutoCard`
- `ProdutoGaleria`
- `ProdutoAcoesCompra`
- `MarketBusca`
- `MarketCategorias`
- `MarketFiltros`
- `MarketProdutoCard`
- `MarketFornecedorBadge`
- `MarketSimilares`

### Componentes CRM

- `StudioPerfilPublicoForm`
- `StudioMarketResumo`
- `StudioProdutosMarketTabela`
- `StudioPreviewLoja`
- `StudioPublicacaoMassa`

## Regras de UX

- A loja deve parecer perfil social-comercial, nao landing page.
- O Market deve parecer shopping center de descoberta, nao lista administrativa.
- O fornecedor deve estar visivel em todos os cards do Market.
- Similares podem mostrar outros fornecedores, mas sem apagar a loja original.
- Produtos sem imagem devem usar placeholder discreto apenas se o endpoint permitir; no Market, o backend ja exclui sem foto.
- CTAs publicos devem ser claros: contactar, comprar, visitar loja, ver similares.
- Mobile deve ter prioridade: hero, tabs sticky, grelha 2 colunas, barra de acao fixa no produto.
- Desktop deve aproveitar largura com filtros laterais, colunas de produto e preview no Studio.

## Estados Obrigatorios

Cada tela deve tratar:

- carregando;
- vazio;
- erro 404 de loja/produto;
- erro de backend indisponivel;
- produto sem stock;
- produto nao publicado no Market;
- loja sem produtos;
- filtros sem resultados;
- acao de publicacao em andamento;
- sucesso/erro em salvar configuracao.

## Dados Que Nao Devem Ser Inventados

- seguidores;
- seguindo;
- avaliacoes;
- selo verificado;
- carrinho multi-loja;
- perfil de comprador;
- recomendacao comportamental.

Se aparecerem na UI antes do backend, devem ser:

- omitidos;
- marcados como "em breve";
- ou derivados de campos reais ja expostos, sem fingir numero.

## Movimento e Sensacao Nativa

Usar `motion` de forma controlada:

- entrada suave de paginas;
- transicao de tabs/colecoes;
- sheet de produto ou filtros;
- feedback de publicacao;
- barra mobile com sobreposicao e blur.

Nao usar animacao decorativa que atrase o fluxo de compra.

## Testes Esperados

- contrato de API para `/market`, `/lojas/:slug` e `/app/loja`;
- rendering de estados vazios;
- filtros do Market atualizam query e chamada API;
- colecoes da loja mudam grelha sem reload total;
- detalhe de produto mostra fornecedor e similares;
- Studio publica/despublica produto;
- mobile nav aparece apenas no mobile;
- produto mobile tem barra fixa de acao sem sobrepor conteudo.

## Sequencia Recomendada

1. Tipos e camada API das lojas.
2. Perfil publico da loja.
3. Produto publico da loja.
4. Market home/listagem/categoria.
5. Detalhe de produto do Market e similares.
6. Minha Loja/Bizy Studio.
7. Testes e QA visual mobile/desktop.
