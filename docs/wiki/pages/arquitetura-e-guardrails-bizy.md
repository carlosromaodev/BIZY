---
title: Arquitetura e Guardrails do Bizy
aliases:
  - Guardrails Bizy
  - Arquitetura Bizy
tags:
  - bizy/arquitetura
  - bizy/guardrails
status: ativo
updated: 2026-07-10
---

# Arquitetura e Guardrails do Bizy

## Stack

- Backend: Fastify, TypeScript, Zod, Prisma, PostgreSQL.
- Frontend: Vite, React, TypeScript, React Router, shadcn-like/Radix, lucide.
- Automacao: n8n.
- WhatsApp: Evolution API e WhatsApp Cloud API por provider.
- Infra: Docker Compose, PostgreSQL, Redis, n8n, Evolution, Caddy opcional.

Detalhes: [[inventario-backend-api]], [[inventario-frontend]], [[inventario-operacao-testes]].

## Regra Organizacional Atual

```text
Bizy visivel = Bizy Team + Bizy Market + Bizy Learning
Nucleo interno = Anani
```

Anani nao e produto de tenant, chatbot publico ou menu operacional comum. O acesso direto fica restrito a `GOVERNANTE_BIZY`, `ADMIN_GERAL` e `SUPER_ADMIN_PLATFORM` em `/governance/anani/*`.

Ver [[anani-intelligence-control-plane]].

## Regra Principal do Backend

```text
Rota HTTP
  -> validacao Zod
  -> use-case
  -> repositorio/provider por contrato
  -> dominio/eventos/auditoria
```

Handlers HTTP nao devem conter regra pesada nem acesso direto ao banco quando existe use case adequado.

## Composicao

`backend/src/infra/http/ContextoAplicacao.ts` monta:

- repositorios;
- use cases;
- providers;
- contexto comercial;
- sessoes;
- eventos;
- dependencias.

Modulos HTTP ficam em `backend/src/infra/http/modulos/` e sao registrados por manifesto.

## Anatomia Tecnica de Modulo

Modulo Bizy nao deve nascer so como rota e pagina. Antes de ser tratado como caminho principal, precisa declarar:

- owner de dominio;
- entidades, regras, estados e transicoes;
- comandos, consultas e eventos;
- capabilities/policies/permissoes;
- auditoria, logs, metricas e retencao;
- testes proporcionais ao risco;
- exportacao/documentacao quando houver dado operacional relevante.

Estados sensiveis devem mudar por transicao validada, com condicao, permissao, acao, evento e auditoria. KPIs precisam de formula, fonte, periodo, moeda quando aplicavel e nivel de confianca.

## Backend como Fonte de Verdade

> [!warning] Fonte de verdade
> n8n, IA, Evolution, Cloud API e conectores sociais nao podem decidir stock, pagamento, pedido, consentimento, auditoria ou permissao sem passar pelo backend.

> [!warning] Anani
> Anani pode observar, recomendar, criar incidente, colocar quarentena preventiva e preparar acoes; mas qualquer acao passa por PolicyEngine, auditoria e, quando for alto impacto, aprovacao humana.

O backend valida:

- negocio;
- usuario;
- permissao;
- modulo ativo;
- politica Anani quando a acao vier do nucleo interno;
- stock;
- pedido;
- pagamento;
- consentimento;
- politica WhatsApp;
- auditoria.

## Isolamento por Negocio

Tudo que for dado comercial precisa carregar ou resolver `negocioId`.

Inclui:

- produtos;
- pedidos;
- clientes da loja;
- conversas;
- mensagens;
- campanhas;
- tarefas;
- afiliados;
- comissoes;
- tracking;
- eventos.

Compartilhamento entre negocios exige relacao aprovada, motivo, escopo, consentimento e auditoria.

## Politica WhatsApp

Mensagens iniciadas pelo sistema precisam ser classificadas antes do envio:

- marketing;
- utilidade;
- autenticacao;
- servico.

Guardrails:

- marketing exige consentimento;
- opt-out bloqueia marketing;
- servico depende da janela de atendimento;
- utilidade/autenticacao nao podem conter promocao;
- template precisa estar aprovado;
- se faltar template/categoria segura, criar tarefa humana.

## Automacao com Fallback Humano

Casos sensiveis devem ir para humano:

- desconto;
- pagamento;
- comprovativo duvidoso;
- reclamacao;
- troca/devolucao;
- cancelamento;
- cliente irritado;
- provider indisponivel;
- template ausente;
- baixa confianca.

Automacao deve ser conservadora. Criar tarefa com contexto e melhor que executar acao errada.

## Anani, n8n e IA

n8n e executor periferico: recebe instrucao autorizada e executa workflow. Ele nao decide sozinho stock, preco, pagamento, permissao, consentimento, suspensao ou dados de tenant.

Claude/GPT, quando integrado, deve receber apenas contexto sanitizado e estruturado. PII, tokens, segredos e conteudo cru nao entram no prompt.

O backend agora possui a primeira fronteira Anani:

- `backend/src/anani/policies/AnaniPolicyEngine.ts`
- `backend/src/app/bootstrap/bootstrapAnani.ts`
- `backend/src/infra/http/modulos/ananiGovernance.ts`
- `backend/prisma/migrations/20260709090000_anani_internal_control_plane/migration.sql`

## Auditoria por Padrao

Precisa de trilha:

- exportacao;
- pagamento;
- desconto;
- cancelamento;
- entrega;
- stock manual;
- fusao de cliente;
- anonimizacao;
- compartilhamento;
- comissao;
- lote financeiro;
- permissao/membro;
- atribuicao manual.

## Frontend

`frontend/src/rotasApp.tsx` e manifesto de rotas.

Regras:

- separa rotas publicas, comerciais, Admin/Sistema e ocultas;
- vendedor comum nao deve ver n8n/tokens/providers/debug;
- mobile deve ser primeira decisao;
- tela vazia precisa de proxima acao;
- modulo desativado deve sumir da navegacao;
- componentes devem seguir [[inventario-frontend]] e style guide.

## Deploy e Operacao

Deploy e suporte, nao memoria principal do produto.

Consultar:

- [[inventario-operacao-testes]]
- [[deploy-vps-antiga]]
- `docs/deploy.md`
- `docs/docker.md`

Regra operacional importante: migrations Prisma precisam estar aplicadas antes de investigar erros 500 em massa.
