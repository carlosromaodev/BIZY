# SDD Dominio 03 - CRM Social Commerce

Status: ativo
Owner logico: Produto CRM
Fontes: `docs/wiki/pages/mapa-de-modulos-bizy.md`, `docs/wiki/pages/requisitos-funcionais-bizy.md`, `docs/wiki/pages/fluxos-operacionais-bizy.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Definir o nucleo CRM+ do Bizy: transformar canais sociais e conversacionais em clientes, pedidos, tarefas, recuperacao e relatorios operacionais.

## 2. Escopo

Entra: clientes, pedidos, conversas, tarefas, funil, campanhas como visao CRM, relatorios comerciais e recuperacao.

Fica fora: detalhes especificos de live, WhatsApp, Market, afiliados, financas e Team, cobertos em dominios proprios.

## 3. Atores e Permissoes

- Dono/gestor: acompanha operacao e desempenho.
- Vendedor/atendente: atende, cria pedidos e executa tarefas.
- Financeiro: consulta pedidos e pagamentos conforme permissao.
- Sistema: cria tarefas e oportunidades de recuperacao.

## 4. Entidades e Dados

- `ClienteGlobal`
- `ClienteNegocio`
- `Pedido`
- `ItemPedido`
- `ConversaAtendimento`
- `MensagemAtendimento`
- `TarefaOperacional`
- `MovimentoFunilComercial`
- `OportunidadeRecuperacao`

## 5. Fluxos Principais

```text
Lead/Cliente -> Conversa -> Pedido -> Pagamento -> Entrega -> Pos-venda
```

```text
Sinal perdido -> Oportunidade -> Tarefa/Playbook -> Recuperacao ou perda
```

## 6. Requisitos Funcionais

- Cliente 360 com historico comercial.
- Pedido manual e contextual.
- Conversa vinculada a cliente, pedido e tarefa.
- Painel com pendencias do dia.
- Relatorios de vendas, atendimento, campanhas e recuperacao.
- Tarefas manuais e automaticas.

## 7. Regras de Negocio

- Pedido deve ter cliente, item, total e estado.
- Pedido pago nao e apagado.
- Desconto exige motivo e pode exigir aprovacao.
- Tarefa atrasada continua visivel ate resolucao.
- Relatorio deve responder pergunta operacional real.

## 8. Requisitos Nao Funcionais

- Listas com paginacao e filtros.
- Mobile 360px sem scroll horizontal.
- Estados vazios com proxima acao.
- Auditoria para exportacao, desconto, pagamento e cancelamento.

## 9. APIs, Telas e Integracoes

APIs: `/clientes`, `/pedidos`, `/tarefas`, `/painel/resumo`, `/relatorios/*`, `/funil/*`, `/recuperacao/*`.

Telas: Painel, Pedidos, Clientes, Atendimento, Tarefas, Recuperacao, Relatorios, Pipeline.

## 10. Guardrails

- Nao criar relatorio decorativo.
- Nao criar modulo sem fluxo real.
- Nao automatizar desconto, cancelamento ou promessa de entrega sem regra.
- Nao misturar historico privado entre negocios.

## 11. Estado Atual

Backend CRM+ e amplo. Frontend tem paginas para painel, pedidos, clientes, conversas, tarefas, recuperacao, campanhas, social inbox, pipeline e relatorios.

## 12. Lacunas

- P0: paginacao padronizada.
- P1: Cliente 360 mais polido, pedido direto na conversa e prioridade visual.
- P2: pipeline completo, playbooks visuais e relatorios avancados.

## 13. Testes e Verificacao

- Testes HTTP de clientes, pedidos e tarefas.
- Testes de isolamento multi-tenant.
- Testes frontend de navegacao CRM.
- Testes de relatorios comerciais.

## 14. Proximos Planos

- Spec de Cliente 360 visual.
- Spec de pedido contextual na conversa.
- Spec de paginacao CRM.
