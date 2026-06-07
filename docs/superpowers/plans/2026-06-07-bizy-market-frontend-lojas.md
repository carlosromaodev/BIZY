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
- [ ] Remover qualquer mock de dados quando existir endpoint real.
- [ ] Usar moeda Kz e textos em portugues.
- [ ] Usar `lucide-react` em vez de Material Symbols.
- [ ] Usar tokens/componentes Bizy existentes.

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
- [ ] Renderizar acoes publicas: contacto, comprar/ver produtos, seguir visual quando habilitado.
- [x] Renderizar colecoes/categorias em chips clicaveis no perfil e tabs da grelha.
- [x] Filtrar grelha por colecao/categoria sem mudar de pagina.
- [x] Mostrar CTA para explorar similares no Market.
- [x] Enviar evento de tracking publico.
- [ ] Tratar loja inexistente.
- [ ] Tratar loja sem produtos.

## Fase 3 - Produto da Loja

- [ ] Criar ou refatorar rota `/lojas/:slug/produtos/:codigo`.
- [ ] Renderizar galeria com thumbnails.
- [ ] Renderizar nome, preco, promocao, stock e variantes.
- [ ] Renderizar badge da loja fornecedora.
- [ ] Implementar CTA WhatsApp usando endpoint real.
- [ ] Preparar CTA checkout com endpoint atual de loja.
- [ ] Implementar barra fixa de acao no mobile.
- [ ] Adicionar accordion para descricao, entrega e politicas.
- [ ] Adicionar link para similares no Market.
- [ ] Tratar produto inexistente ou indisponivel.

## Fase 4 - Bizy Market Home e Categoria

- [ ] Criar rota `/market`.
- [ ] Criar rota `/market/categorias/:categoria`.
- [ ] Renderizar busca global.
- [ ] Renderizar categorias globais.
- [ ] Renderizar filtros por categoria, loja, provincia e municipio.
- [ ] Sincronizar filtros com query string.
- [ ] Renderizar cards com fornecedor visivel.
- [ ] Renderizar secao de lojas em destaque apenas se houver dados reais ou derivaveis.
- [ ] Tratar filtros sem resultados.
- [ ] Garantir que bottom nav aparece apenas no mobile.

## Fase 5 - Detalhe de Produto no Market

- [ ] Criar rota `/market/produtos/:codigo`.
- [ ] Consumir `GET /publico/market/produtos/:codigo`.
- [ ] Consumir `GET /publico/market/produtos/:codigo/similares`.
- [ ] Mostrar fornecedor original com CTA para loja.
- [ ] Mostrar similares de outros fornecedores com aviso claro.
- [ ] Manter botao de compra/contacto coerente com produto da loja.
- [ ] Tratar produto fora do Market.

## Fase 6 - Minha Loja / Bizy Studio

- [ ] Criar rota `/app/loja` ou reaproveitar rota existente de loja.
- [ ] Consumir configuracao da loja.
- [ ] Permitir salvar slug, descricao publica e dados editaveis ja aceitos pelo backend.
- [ ] Consumir resumo de tracking.
- [ ] Consumir resumo de publicacao no Market.
- [ ] Renderizar tabela de produtos com pendencias de elegibilidade.
- [ ] Implementar publicar/despublicar produto.
- [ ] Implementar publicacao em massa.
- [ ] Renderizar preview mini da loja.
- [ ] Tratar produto com pendencias sem permitir publicacao silenciosa.

## Fase 7 - Testes

- [x] Teste de contrato da camada API.
- [x] Teste inicial de `/lojas/:slug` com perfil social-comercial e tracking publico.
- [x] Teste de `/lojas/:slug` com colecoes filtraveis.
- [ ] Teste de produto da loja com barra mobile.
- [ ] Teste de `/market` com filtros.
- [ ] Teste de `/market/produtos/:codigo` com similares.
- [ ] Teste de Studio publicando e despublicando produtos.
- [ ] Teste de responsividade mobile/desktop.
- [ ] Teste de ausencia de mock data nas paginas conectadas.

## Criterios de Aceite

- [ ] Loja publica parece perfil social-comercial.
- [ ] Market parece shopping center de descoberta.
- [ ] Produto mostra fornecedor sem ambiguidade.
- [ ] Similares nao confundem o comprador sobre a loja de origem.
- [ ] Studio controla publicacao real no Market.
- [ ] Todas as chamadas usam endpoints reais.
- [ ] Paginas publicas funcionam sem login.
- [ ] Pagina Studio exige sessao e respeita cookie.
- [ ] Mobile nao tem sobreposicao, texto cortado ou navbar no desktop.
