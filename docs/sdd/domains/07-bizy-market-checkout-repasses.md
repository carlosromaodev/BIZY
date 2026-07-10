# SDD Dominio 07 - Bizy Market, Checkout e Repasses

Status: implementado
Owner logico: Produto Market
Fontes: `docs/wiki/pages/bizy-market-lojas-digitais.md`, `docs/wiki/pages/requisitos-bizy-market.md`, `docs/wiki/pages/bizy-market-rotas-roadmap.md`
Ultima atualizacao: 2026-07-02

## 1. Proposito

Organizar o Bizy Market como camada de descoberta central, mantendo perfis independentes de loja, checkout unificado e execucao operacional dentro do Team.

## 2. Escopo

Entra: Bizy Loja, Bizy Market, categorias globais, similares, checkout unificado, compra multi-loja, pedidos filhos, repasses, reembolsos, seguidores, denuncias, boost/patrocinados e Admin Bizy.

Fica fora: catalogo base da loja, coberto no dominio 06, financeiro geral fora de repasses Market, coberto no dominio 10, e perfil autenticado completo do comprador, evolucao futura do social graph.

## 3. Atores e Permissoes

- Visitante/comprador: explora Market, loja e produtos, inicia checkout e acompanha compra.
- Dono da loja: configura perfil, catalogos, publicacao, entrega e pagamentos.
- Fornecedor: ve apenas pedidos e repasses da sua loja.
- Admin Bizy: gere categorias, denuncias, suspensoes, destaques e patrocinados.
- Sistema: separa compra unificada em pedidos por fornecedor, calcula taxas e mantem isolamento.

## 4. Entidades e Dados

- `SeguidorLoja`
- `DenunciaMarket`
- `ReservaStockCheckout`
- `CompraUnificada`
- `PedidoFilho`
- `RepasseFinanceiro`
- `ReembolsoPedido`
- `Peca`
- `Pedido`

Dados sensiveis do comprador nao podem vazar entre fornecedores.

## 5. Fluxos Principais

```text
Comprador -> Market/Loja -> Produto -> Carrinho
          -> Checkout unificado -> Compra unificada
          -> Pedidos filhos -> Team de cada loja
          -> Pagamento/Entrega/Repasses
```

## 6. Requisitos Funcionais

- Listar produtos elegiveis no Market.
- Manter identidade da loja no card/produto.
- Buscar e filtrar por categoria, loja, localizacao e disponibilidade.
- Exibir similares sem confundir fornecedor.
- Criar compra unificada e pedidos filhos.
- Acompanhar estado da compra e de cada fornecedor.
- Controlar repasses, taxas, cancelamentos e reembolsos.
- Permitir governanca de categorias, denuncias, suspensoes, destaques e patrocinados.
- Expor seguidores e metricas reais no Team.

## 7. Regras de Negocio

- Loja pode existir sem participar do Market.
- Produto no Market exige loja ativa, imagem, preco, categoria global e disponibilidade.
- Categoria global e do Bizy; colecao/catalogo local e da loja.
- Cada fornecedor ve apenas sua parte.
- Market gera descoberta; Team executa.
- Produto patrocinado nao pode contornar suspensao, inelegibilidade ou falta de seguranca.
- Prova social publica deve vir de dados reais; a UI nao deve fabricar ratings, reviews, vendidos, seguidores ou tempo de resposta.

## 8. Requisitos Nao Funcionais

- Market mobile-first.
- Busca responsiva com volume.
- Checkout idempotente.
- Dados pessoais minimizados.
- Cache seguro para paginas publicas.
- Observabilidade de compra, pagamento, repasse e falhas.
- Sem scroll horizontal em telas publicas e Team.

## 9. APIs, Telas e Integracoes

APIs publicas principais:

- `/publico/market/produtos`
- `/publico/market/categorias`
- `/publico/market/lojas`
- `/publico/market/produtos/:codigo/similares`
- `/publico/market/checkout`
- `/publico/market/compras/:id`
- `/publico/market/compras/:id/pagamento`
- `/publico/lojas/:slug`
- `/publico/lojas/:slug/catalogos/:catalogo`

APIs Team principais:

- `/team/loja/market/resumo`
- `/team/loja/catalogos`
- `/team/loja/seguidores`
- `/team/loja/metricas`
- `/team/loja/pedidos-market`
- `/team/loja/repasses`

`/crm/loja/*` e alias legado, nao contrato novo.

Telas: Market Home, Categoria, Produto Market, Diretorio de Lojas, Perfil da Loja, Catalogo Publico, Checkout, Compra Unificada, Bizy Studio e Admin Bizy.

## 10. Guardrails

- Nao apagar identidade da loja.
- Nao mostrar similares agressivamente dentro da loja.
- Nao criar pedido impossivel de operar no Team.
- Nao expor dados privados de outra loja.
- Nao permitir patrocinio que contorne bloqueio.
- Nao inventar dados sociais ou comerciais publicos.

## 11. Estado Atual

Market possui endpoints publicos de produtos, categorias, lojas, detalhes, similares, tracking, checkout multi-loja, compra unificada e comprovativo. O Team possui publicacao, catalogos, seguidores, metricas, pedidos Market e repasses. Admin Bizy possui governanca de categorias, suspensoes, denuncias, patrocinados, relatorios e repasses. Frontend publico, checkout, acompanhamento e Studio estao implementados.

## 12. Lacunas Residuais

- [ ] Validar em staging o fluxo completo multi-loja com dados reais de pagamento/entrega.
- [ ] Ligar provider de pagamento online quando houver decisao comercial; comprovativo/transferencia e dinheiro na entrega seguem como fluxo operacional.
- [ ] Evoluir perfil autenticado do comprador e recomendacao comportamental avancada sem simular dados no MVP.
- [ ] Ampliar observabilidade com dashboards de falhas por etapa de checkout, pagamento e repasse.

## 13. Testes e Verificacao

- [x] Testes HTTP de Market.
- [ ] Testes de contrato frontend.
- [ ] Testes de checkout unificado.
- [ ] Testes de isolamento por fornecedor.
- [ ] Testes de repasses e reembolsos.
- [ ] Testes mobile sem scroll horizontal.
- [ ] Varredura de UI publica para evitar ratings/reviews/vendidos simulados.

## 14. Proximos Planos

- [ ] Validacao staging ponta a ponta: Market -> checkout -> compra -> pedidos filhos -> repasses.
- [ ] Observabilidade operacional de checkout, pagamento e repasse.
- [ ] Provider de pagamento online com idempotencia e conciliacao.
- [ ] Perfil autenticado do comprador e recomendacao avancada baseada em consentimento.
