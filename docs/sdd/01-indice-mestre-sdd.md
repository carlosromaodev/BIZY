# Indice Mestre SDD Bizy

Status: ativo
Criado em: 2026-06-28

## Entrada Rapida

- Processo: `00-processo-sdd-bizy.md`
- Mapa de dominios: `02-mapa-dominio-produto.md`
- Roadmap: `03-roadmap-sdd.md`
- Templates: `templates/`
- Decisoes: `decisions/`

## Dominios

| Dominio | Arquivo | Resumo |
|---|---|---|
| 00 | `domains/00-visao-produto-e-principios.md` | Visao, tese, publico, contexto angolano, principios e evolucao live -> CRM+ -> Market -> Team. |
| 01 | `domains/01-arquitetura-plataforma.md` | Stack, modularidade, use cases, providers, outbox e backend como fonte de verdade. |
| 02 | `domains/02-identidade-acesso-negocios.md` | Autenticacao, sessoes, negocios, membros, papeis, modulos e multi-tenant. |
| 03 | `domains/03-crm-social-commerce.md` | Nucleo CRM+ para vendas sociais, pedidos, conversas, tarefas e relatorios. |
| 04 | `domains/04-live-reservas-pedidos.md` | Live, comentarios, parser, reservas, fila, pagamentos e pedidos. |
| 05 | `domains/05-clientes-atendimento-whatsapp.md` | Cliente 360, atendimento, conversas, WhatsApp, templates e politicas. |
| 06 | `domains/06-catalogo-stock-loja-publica.md` | Produtos, variantes, stock, movimentos, loja publica, tracking e checkout da loja. |
| 07 | `domains/07-bizy-market-checkout-repasses.md` | Bizy Market, perfis de loja, checkout unificado, pedidos filhos e repasses. |
| 08 | `domains/08-afiliados-campanhas-social-inbox.md` | Afiliados, criadores, campanhas, Social Inbox, atribuicao e comissoes. |
| 09 | `domains/09-bizy-team-equipa-projectos.md` | Equipa, convites, metas, turnos, projectos, projectos comerciais e passagem de turno. |
| 10 | `domains/10-financas-facturacao-conformidade.md` | Ledger, fluxo de caixa, DRE, despesas, facturas, recibos, impostos e conformidade. |
| 11 | `domains/11-inteligencia-workflow-automacoes.md` | Previsoes, scores, insights, workflows, notificacoes, automacoes e n8n. |
| 12 | `domains/12-frontend-ux-design-system.md` | Identidade visual, rotas, UX, mobile-first, componentes e testes frontend. |
| 13 | `domains/13-operacao-deploy-observabilidade.md` | Docker, deploy, migrations, backup, restore, saude, logs e observabilidade. |
| 14 | `domains/14-seguranca-privacidade-auditoria.md` | Sessoes, RBAC, auditoria, privacidade, consentimento, tracking e cifra de credenciais. |

## Relacao com Superpowers

Specs de iniciativa ficam em `../superpowers/specs/`.
Planos executaveis ficam em `../superpowers/plans/`.

Fluxo recomendado:

```text
Dominio SDD -> spec em ../superpowers/specs -> plano em ../superpowers/plans -> implementacao
```

## Relacao com Wiki

A wiki continua como memoria viva e inventario:

- `../wiki/pages/memoria-projeto-bizy.md`
- `../wiki/pages/memoria-viva-bizy.md`
- `../wiki/pages/inventario-sistema-bizy.md`
- `../wiki/pages/inventario-backend-api.md`
- `../wiki/pages/inventario-frontend.md`
- `../wiki/pages/inventario-dados-prisma.md`

O SDD organiza fronteiras, regras e responsabilidades por dominio. Quando houver conflito, usar o SDD para fronteira/guardrail e a wiki para historico/detalhe operacional mais recente.

## Templates

- Spec de iniciativa: `templates/spec-template.md`
- Plano executavel: `templates/plan-template.md`
- Revisao: `templates/review-template.md`
- ADR: `templates/decision-record-template.md`

## Decisoes

- `decisions/ADR-0001-sdd-como-fonte-de-organizacao.md`
