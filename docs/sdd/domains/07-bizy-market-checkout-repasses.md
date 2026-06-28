# SDD Dominio 07 - Bizy Market, Checkout e Repasses

Status: ativo
Owner logico: Produto Market
Fontes: `docs/wiki/pages/bizy-market-lojas-digitais.md`, `docs/wiki/pages/requisitos-bizy-market.md`, `docs/wiki/pages/bizy-market-rotas-roadmap.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Organizar o Bizy Market como camada de descoberta central, mantendo perfis independentes de loja, checkout unificado e execucao operacional dentro do CRM/Team.

## 2. Escopo

Entra: Bizy Loja, Bizy Market, categorias globais, similares, checkout unificado, compra multi-loja, pedidos filhos, repasses, reembolsos, seguidores, denuncias e Admin Bizy.

Fica fora: catalogo base da loja, coberto no dominio 06, e financeiro geral, coberto no dominio 10.

## 3. Atores e Permissoes

- Visitante/comprador: explora Market, loja e produtos.
- Dono da loja: configura perfil e publicacao.
- Fornecedor: ve apenas pedidos/repasses da sua loja.
- Admin Bizy: gere categorias, denuncias, suspensoes e patrocinados.
- Sistema: separa compra unificada em pedidos por fornecedor.

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
          -> Checkout unificado -> Compra
          -> Pedidos filhos -> CRM de cada loja
          -> Pagamento/Entrega/Repasses
```

## 6. Requisitos Funcionais

- Listar produtos elegiveis no Market.
- Manter identidade da loja no card/produto.
- Buscar e filtrar por categoria, loja, localizacao e disponibilidade.
- Exibir similares sem confundir fornecedor.
- Criar compra unificada e pedidos filhos.
- Controlar repasses, taxas e reembolsos.
- Permitir governanca de categorias, denuncias e suspensoes.

## 7. Regras de Negocio

- Loja pode existir sem participar do Market.
- Produto no Market exige loja ativa, imagem, preco, categoria global e disponibilidade.
- Categoria global e do Bizy; colecao local e da loja.
- Cada fornecedor ve apenas sua parte.
- Market gera descoberta; CRM/Team executa.

## 8. Requisitos Nao Funcionais

- Market mobile-first.
- Busca responsiva com volume.
- Checkout idempotente.
- Dados pessoais minimizados.
- Cache seguro para paginas publicas.
- Observabilidade de compra e falhas.

## 9. APIs, Telas e Integracoes

APIs: `/publico/market/produtos`, `/publico/market/categorias`, `/publico/market/lojas`, `/publico/market/produtos/:codigo/similares`, `/checkout`, `/crm/loja/pedidos-market`, `/crm/loja/repasses`.

Telas: Market Home, Categoria, Produto Market, Perfil da Loja, Checkout, Bizy Studio, Admin Bizy.

## 10. Guardrails

- Nao apagar identidade da loja.
- Nao mostrar similares agressivamente dentro da loja.
- Nao criar pedido impossivel de operar no CRM.
- Nao expor dados privados de outra loja.
- Nao permitir patrocinio que contorne bloqueio.

## 11. Estado Atual

Market possui endpoints de produtos, categorias, lojas, detalhes, similares, Studio e varias fases de checkout/repasses em evolucao. Frontend publico e Studio existem em progresso.

## 12. Lacunas

- P0: checkout visual e privacidade publica.
- P1: acompanhamento do comprador e UX de repasses.
- P2: social graph, ranking avancado, patrocinados e recomendacoes comportamentais.

## 13. Testes e Verificacao

- Testes HTTP de Market.
- Testes de contrato frontend.
- Testes de checkout unificado.
- Testes de isolamento por fornecedor.
- Testes mobile sem scroll horizontal.

## 14. Proximos Planos

- Spec de checkout multi-loja completo.
- Spec de acompanhamento do comprador.
- Spec de governanca Admin Bizy.
