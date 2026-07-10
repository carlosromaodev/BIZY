# SDD Dominio 06 - Catalogo, Stock e Loja Publica

Status: ativo
Owner logico: Produto Vitrine
Fontes: `docs/wiki/pages/loja-digital-operacao-crm.md`, `docs/wiki/pages/requisitos-funcionais-bizy.md`, `docs/wiki/pages/bizy-market-lojas-digitais.md`
Ultima atualizacao: 2026-07-10

## 1. Proposito

Controlar produtos, stock, variantes, vitrine publica e checkout da loja, mantendo tudo conectado ao CRM operacional.

## 2. Escopo

Entra: catalogo, SKU, fotos, variantes, stock, movimentos, colecoes, loja publica, slug, produto publico, tracking, checkout da loja e configuracao operacional.

Fica fora: Market multi-loja e repasses, cobertos no dominio 07.

## 3. Atores e Permissoes

- Dono/gestor: configura catalogo, loja e publicacao.
- Vendedor: consulta stock e cria pedido.
- Comprador: navega loja publica e compra.
- Sistema: valida disponibilidade e registra tracking seguro.

## 4. Entidades e Dados

- `Peca`
- `VariantePeca`
- `MovimentoStock`
- `Pedido`
- `ItemPedido`
- `EventoTrackingComercial`
- `ReservaStockCheckout`

Dados sensiveis: dados de checkout, telefone, endereco e comprovativo. Tracking publico nao deve carregar dados pessoais.

## 5. Fluxos Principais

```text
Produto cadastrado -> Estoque disponivel -> Loja publica
                   -> Visita/checkout/WhatsApp -> Pedido -> Pagamento
```

## 6. Requisitos Funcionais

- Cadastrar produto com codigo unico por negocio.
- Controlar stock e movimentos.
- Suportar variantes e fotos.
- Publicar loja por slug/subdominio.
- Mostrar produto publico com SEO/preview.
- Calcular entrega e criar pedido via checkout.
- Registrar carrinho abandonado quando houver base legal/consentimento.

## 7. Regras de Negocio

- Codigo de produto e unico por negocio.
- Produto sem stock nao e vendido automaticamente.
- Movimento manual exige motivo e responsavel.
- Compra deve funcionar sem cookies nao essenciais.
- Tracking nao pode conter telefone, email, nome ou endereco.

## 8. Requisitos Nao Funcionais

- Loja publica rapida em mobile 360px.
- Imagens otimizadas.
- Paginas publicas cacheaveis sem dados privados.
- Checkout idempotente.
- Estados vazios claros para loja sem produtos.

## 9. APIs, Telas e Integracoes

APIs: `/pecas`, `/pecas/:codigo/movimentos`, `/publico/lojas/:slug`, `/publico/lojas/:slug/produtos/:codigo`, `/publico/lojas/:slug/checkout`, `/publico/tracking/eventos`, `/loja-publica/configuracao`.

Telas: Produtos/Catalogo, Loja Digital, Loja Publica, Produto Publico, Checkout.

## 10. Guardrails

- Nao criar loja publica decorativa sem operacao CRM.
- Nao expor dados privados em paginas publicas.
- Nao publicar produto sem informacao minima.
- Nao usar tracking como prova de venda.

## 11. Estado Atual

Catalogo, stock, variantes, loja publica, tracking, checkout e configuracao operacional existem. Aviso de privacidade/tracking e bloqueio de dados pessoais em tracking publico estao implementados. SEO/preview social runtime das paginas publicas foi consolidado no frontend. Checkout visual publico agora cobre passos, carrinho, quantidade, resumo, pendencias e revisao antes de finalizar.

## 12. Lacunas

- [x] P0: checkout visual publico.
- [x] P0: SEO publico e preview social.
- [x] P0: aviso de privacidade/tracking publico.
- [ ] P1: gestao visual de colecoes e categorias uteis.
- [ ] P2: dominio personalizado e catalogos avancados.

## 13. Testes e Verificacao

- [ ] Testes de catalogo/stock.
- [x] Testes de loja publica/tracking.
- [x] Testes de checkout.
- [x] Teste frontend de SEO/canonical publico.
- [x] Teste frontend de checkout visual publico.
- [ ] Testes frontend mobile sem scroll horizontal.

## 14. Proximos Planos

- [x] Spec de checkout visual publico.
- [x] Spec de SEO e preview social.
- [x] Guardrail de privacidade/tracking publico aplicado.
