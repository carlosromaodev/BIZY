# Spec - Checkout Visual Publico Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: conversao
Owner logico: Produto Vitrine

## 1. Objetivo

Fechar a lacuna P0 de checkout visual publico, tornando o checkout Bizy claro para carrinho, dados, entrega, pagamento, revisao e confirmacao.

O checkout deve aumentar conversao sem criar um caminho paralelo incompleto: single-store continua usando o checkout da loja e multi-loja continua usando o checkout unificado do Market.

## 2. Contexto

O backend e a camada frontend ja tinham carrinho local, idempotencia, checkout single-store, checkout multi-loja e acompanhamento publico. A lacuna era visual: a tela precisava mostrar progresso, resumo operacional, fornecedores, validacao e revisao antes de finalizar.

## 3. Escopo

- Passos visuais de checkout: carrinho, dados, entrega, pagamento e revisao.
- Painel visual com total, itens e fornecedores.
- Ajuste de quantidade no carrinho sem sair da pagina.
- Itens agrupados por loja com subtotal e pedido separado por fornecedor.
- Revisao operacional com pendencias visiveis antes de finalizar.
- Resumo de pagamento, entrega e fornecedores.
- CSS responsivo para o checkout publico.

## 4. Fora de Escopo

- Novo provider de pagamento online.
- Login obrigatorio de comprador.
- Perfil autenticado completo do comprador.
- Repasses, conciliacao e dashboards financeiros avancados.

## 5. Atores e Permissoes

- Comprador: revisa carrinho, dados, entrega, pagamento e cria compra.
- Loja/Team: recebe pedido operacional com fornecedor isolado.
- Sistema: mantem idempotencia, consentimento minimo e separacao por loja.

## 6. Requisitos Funcionais

- O comprador ve a etapa atual do checkout.
- O comprador consegue ajustar quantidade antes de finalizar.
- O checkout mostra subtotal, fornecedores, pagamento e entrega.
- O checkout informa campos pendentes sem depender apenas de alerta apos clique.
- Multi-loja deixa claro que cada fornecedor recebe pedido separado.

## 7. Regras de Negocio

- Compra sem conta deve continuar possivel.
- Dados pessoais nao devem ir para query string.
- Checkout multi-loja deve usar `POST /publico/market/checkout`.
- Checkout de uma loja deve continuar usando `POST /publico/lojas/:slug/checkout`.

## 8. Requisitos Nao Funcionais

- Sem dependencia nova.
- Mobile-first, sem componentes que forcem scroll horizontal da pagina.
- Layout visual consistente com Market e Loja Publica.

## 9. Dados e Entidades

Nao ha migracao. Entidades afetadas indiretamente: carrinho local, compra unificada, pedido da loja e pedidos filhos.

## 10. APIs, Telas e Integracoes

Telas: `/checkout`, `/compras/:id`.

APIs: `/publico/lojas/:slug/checkout`, `/publico/market/checkout`, `/publico/market/compras/:id`.

## 11. UX e Estados

Estados cobertos: carrinho vazio, carrinho com uma loja, carrinho multi-loja, campos pendentes, finalizacao em curso, erro, pedido criado e compra unificada criada.

## 12. Riscos e Guardrails

- Nao esconder fornecedor original.
- Nao simular pagamento online.
- Nao transformar tracking em prova de venda.
- Nao criar rotas paralelas de checkout ainda nao suportadas.

## 13. Testes e Verificacao

- `cd frontend && npx vitest run testes/checkout-unificado.test.ts`
- `npm run typecheck --workspace frontend`
- `git diff --check`

## 14. Criterios de Aceite

- [x] Checkout exibe passos visuais.
- [x] Checkout permite ajuste de quantidade.
- [x] Checkout exibe revisao e pendencias.
- [x] Checkout mantem single-store e multi-loja nos endpoints reais.
- [x] Teste focado e typecheck executados.

## 15. Links

- `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-checkout-visual-publico-bizy.md`
