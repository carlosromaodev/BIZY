# SDD Dominio 10 - Financas, Facturacao e Conformidade

Status: ativo
Owner logico: Produto Financas
Fontes: `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`, `backend/src/infra/http/modulos/financas.ts`, `backend/src/use-case/GestaoFinancasUseCase.ts`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Integrar dinheiro, documentos fiscais, despesas, contas e conformidade a operacao comercial do Bizy.

## 2. Escopo

Entra: categorias financeiras, movimentos, fluxo de caixa, DRE, despesas, contas a receber/pagar, facturas, recibos, notas de credito, reembolsos, orcamentos, regras fiscais e e-invoicing futuro.

Fica fora: repasses especificos do Market, cobertos no dominio 07, embora alimentem este dominio.

## 3. Atores e Permissoes

- Dono/admin: ve e aprova operacoes financeiras.
- Financeiro: cria, consulta e reconcilia movimentos conforme permissao.
- Vendedor: ve apenas informacao financeira operacional permitida.
- Sistema: cria movimentos a partir de pedido, pagamento, despesa ou reembolso.

## 4. Entidades e Dados

- `CategoriaFinanceira`
- `MovimentoFinanceiro`
- `Despesa`
- `ContaReceber`
- `ContaPagar`
- `OrcamentoPeriodo`
- `Factura`
- `ItemFactura`
- `NotaCredito`
- `ReembolsoPedido`
- `RegraFiscal`

Dados sensiveis: valores, NIF, documentos fiscais, comprovativos, fornecedores, contas e historico financeiro.

## 5. Fluxos Principais

```text
Pedido pago -> Movimento entrada -> Fluxo de caixa -> DRE -> Relatorio
```

```text
Despesa/Conta pagar -> Movimento saida -> Orcamento -> Alerta
```

```text
Pedido/servico -> Factura -> Pagamento -> Recibo -> Arquivo fiscal
```

## 6. Requisitos Funcionais

- Registrar entradas e saidas por negocio.
- Categorizar movimentos.
- Calcular fluxo de caixa.
- Gerar DRE mensal.
- Gerir despesas recorrentes.
- Gerir contas a receber e pagar.
- Emitir facturas, recibos e notas de credito.
- Definir orcamentos por categoria.
- Validar regras fiscais.
- Preparar e-invoicing e reconciliacao bancaria.

## 7. Regras de Negocio

- Todo movimento financeiro tem origem classificada.
- Operacoes financeiras exigem permissoes explicitas.
- Factura anulada exige motivo.
- Reembolso e nota de credito devem manter vinculo.
- Dados financeiros pertencem a um `Negocio`.

## 8. Requisitos Nao Funcionais

- Auditoria para criacao, anulacao, pagamento, reembolso e fechamento.
- Linguagem operacional, nao contabilistica demais.
- Dados financeiros protegidos por papel.
- Consultas com filtros por periodo.
- Preparacao para maior volume por negocio.

## 9. APIs, Telas e Integracoes

APIs: `/financas/categorias`, `/financas/movimentos`, `/financas/fluxo-caixa`, `/financas/dre`, `/financas/despesas`, `/financas/contas-receber`, `/financas/contas-pagar`, `/financas/facturas`, `/conformidade/*`.

Telas: Financas, Pagamentos, Relatorios, Administracao, Conformidade.

## 10. Guardrails

- Nao registrar movimento sem origem.
- Nao expor financeiro a papel sem permissao.
- Nao emitir documento fiscal fora de regra.
- Nao apagar historico financeiro sensivel.

## 11. Estado Atual

Backend possui categorias, movimentos, fluxo de caixa, DRE, despesas, contas, facturas, recibos, notas de credito, reembolsos, orcamentos e regras fiscais em evolucao.

## 12. Lacunas

- P0: garantir permissoes e auditoria em todos endpoints financeiros.
- P1: UX financeira simples para nao contabilistas.
- P2: reconciliacao bancaria, e-invoicing e integracoes fiscais.

## 13. Testes e Verificacao

- Testes HTTP de financas.
- Testes de permissao financeira.
- Testes de auditoria de eventos financeiros.
- Testes de PDF factura/recibo.
- Testes de regra fiscal.

## 14. Proximos Planos

- Spec de reconciliacao bancaria.
- Spec de e-invoicing.
- Spec de dashboard financeiro operacional.
