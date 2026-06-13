# Plano - Frontend das Lojas e Bizy Market

Status: em execucao
Data: 2026-06-07
Spec base: `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`

## Objetivo

Implementar apenas as telas ligadas a lojas digitais:

- loja publica;
- produto da loja;
- Bizy Market;
- categoria do Market;
- detalhe de produto no Market;
- Minha Loja/Bizy Studio minimo dentro do CRM.

## Fora do Escopo

- refazer CRM inteiro;
- mexer em Conversas, Live, Clientes, Campanhas, Relatorios ou Administracao, salvo ajuste de rota/link para abrir Minha Loja;
- checkout multi-loja completo enquanto backend ainda nao existir;
- seguidores/avaliacoes reais sem endpoint.

## Checklist Geral

- [x] Confirmar rotas atuais em `frontend/src/rotasApp.tsx`.
- [x] Analisar pacote Stitch local `stitch_bizy_marketplace_suite.zip` como inspiracao visual.
- [x] Atualizar spec com padroes visuais aproveitaveis do Stitch.
- [x] Criar tipos publicos de loja e Market.
- [x] Criar helpers API para loja publica, Market e Studio.
- [x] Garantir que paginas publicas nao dependem de sessao.
- [x] Garantir que Studio usa `requisitarApi` com cookie.
- [x] Remover qualquer mock de dados quando existir endpoint real.
- [x] Usar moeda Kz e textos em portugues.
- [x] Usar `lucide-react` em vez de Material Symbols.
- [x] Usar tokens/componentes Bizy existentes.

## Fase 1 - API e Tipos

- [x] Mapear resposta de `GET /publico/lojas/:slug`.
- [x] Mapear resposta de `GET /publico/lojas/:slug/produtos/:codigo`.
- [x] Mapear resposta de `GET /publico/market/categorias`.
- [x] Mapear resposta de `GET /publico/market/produtos`.
- [x] Mapear resposta de `GET /publico/market/produtos/:codigo`.
- [x] Mapear resposta de `GET /publico/market/produtos/:codigo/similares`.
- [x] Mapear resposta de `GET /crm/loja/market/resumo`.
- [x] Criar normalizadores para foto, preco, slug, categoria e fornecedor.

## Fase 2 - Loja Publica

- [x] Criar ou refatorar pagina `/lojas/:slug`.
- [x] Renderizar hero/capa com fallback controlado.
- [x] Renderizar avatar/logo, nome, bio e localizacao.
- [x] Renderizar acoes publicas: contacto, comprar/ver produtos, seguir visual quando habilitado.
- [x] Renderizar colecoes/categorias em chips clicaveis no perfil e tabs da grelha.
- [x] Filtrar grelha por colecao/categoria sem mudar de pagina.
- [x] Mostrar CTA para explorar similares no Market.
- [x] Enviar evento de tracking publico.
- [x] Tratar loja inexistente.
- [x] Tratar loja sem produtos.

## Fase 3 - Produto da Loja

- [x] Criar ou refatorar rota `/lojas/:slug/produtos/:codigo`.
- [x] Renderizar galeria com thumbnails.
- [x] Renderizar nome, preco, promocao, stock e variantes.
- [x] Renderizar badge da loja fornecedora.
- [x] Implementar CTA WhatsApp usando endpoint real.
- [x] Preparar CTA checkout com endpoint atual de loja.
- [x] Implementar barra fixa de acao no mobile.
- [x] Adicionar accordion para descricao, entrega e politicas.
- [x] Adicionar link para similares no Market.
- [x] Tratar produto inexistente ou indisponivel.

## Fase 4 - Bizy Market Home e Categoria

- [x] Criar rota `/market`.
- [x] Criar rota `/market/categorias/:categoria`.
- [x] Renderizar busca global.
- [x] Renderizar categorias globais.
- [x] Renderizar filtros por categoria, loja, provincia e municipio.
- [x] Sincronizar filtros com query string.
- [x] Renderizar cards com fornecedor visivel.
- [x] Renderizar secao de lojas em destaque apenas se houver dados reais ou derivaveis.
- [x] Tratar filtros sem resultados.
- [x] Garantir que bottom nav aparece apenas no mobile.

## Fase 5 - Detalhe de Produto no Market

- [x] Criar rota `/market/produtos/:codigo`.
- [x] Consumir `GET /publico/market/produtos/:codigo`.
- [x] Consumir `GET /publico/market/produtos/:codigo/similares`.
- [x] Mostrar fornecedor original com CTA para loja.
- [x] Mostrar similares de outros fornecedores com aviso claro.
- [x] Manter botao de compra/contacto coerente com produto da loja.
- [x] Tratar produto fora do Market.

## Fase 6 - Minha Loja / Bizy Studio

- [x] Criar rota `/app/loja` ou reaproveitar rota existente de loja.
- [x] Consumir configuracao da loja.
- [x] Permitir salvar slug, descricao publica e dados editaveis ja aceitos pelo backend.
- [x] Consumir resumo de tracking.
- [x] Consumir resumo de publicacao no Market.
- [x] Renderizar tabela de produtos com pendencias de elegibilidade.
- [x] Implementar publicar/despublicar produto.
- [x] Implementar publicacao em massa.
- [x] Renderizar preview mini da loja.
- [x] Tratar produto com pendencias sem permitir publicacao silenciosa.

## Fase 7 - Testes

- [x] Teste de contrato da camada API.
- [x] Teste inicial de `/lojas/:slug` com perfil social-comercial e tracking publico.
- [x] Teste de `/lojas/:slug` com colecoes filtraveis.
- [x] Teste de produto da loja com barra mobile.
- [x] Teste de `/market` com filtros.
- [x] Teste de `/market/produtos/:codigo` com similares.
- [x] Teste de Studio publicando e despublicando produtos.
- [x] Teste de responsividade mobile/desktop.
- [x] Teste de ausencia de mock data nas paginas conectadas.

## Criterios de Aceite

- [x] Loja publica parece perfil social-comercial.
- [x] Market parece shopping center de descoberta.
- [x] Produto mostra fornecedor sem ambiguidade.
- [x] Similares nao confundem o comprador sobre a loja de origem.
- [x] Studio controla publicacao real no Market.
- [x] Todas as chamadas das telas implementadas usam endpoints reais.
- [x] Paginas publicas implementadas funcionam sem login.
- [x] Pagina Studio exige sessao e respeita cookie.
- [x] Mobile nao tem sobreposicao, texto cortado ou navbar no desktop.
