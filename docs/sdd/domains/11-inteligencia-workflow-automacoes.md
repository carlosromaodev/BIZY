# SDD Dominio 11 - Inteligencia, Workflow e Automacoes

Status: ativo
Owner logico: Produto Inteligencia/Automacao
Fontes: `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`, `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`, `backend/src/infra/http/modulos/n8n.ts`, `/home/carlos/Documentos/ANANI-INTELLIGENCE-MASTER-PLAN.md`, `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`
Ultima atualizacao: 2026-07-09

## 1. Proposito

Usar previsoes, insights, workflows, automacoes e Anani para apoiar a operacao, proteger a plataforma e aumentar controlo sem tirar o backend e o humano do circuito em decisoes sensiveis.

## 2. Escopo

Entra: previsao de demanda, churn, LTV, lead scoring, previsao de caixa, anomalias, insights, feedback, fluxos automaticos, passos, execucoes, notificacoes, n8n, IA assistiva e Anani como nucleo interno de dados, cognicao, controlo e governanca.

Fica fora: regras financeiras de contabilizacao, cobertas no dominio 10; politica WhatsApp detalhada, coberta no dominio 05; e UI final da Governance Console, que deve nascer de spec propria.

## 3. Atores e Permissoes

- Dono/gestor: recebe alertas e insights.
- Vendedor/atendente: recebe proxima acao contextual.
- Financeiro: recebe previsoes e alertas de caixa.
- Sistema: calcula scores, cria tarefas e executa fluxos.
- IA: sugere, classifica e apoia, mas nao decide dados sensiveis sem backend.
- Anani: observa, avalia politica, cria incidente/quarentena e prepara acoes.
- Governante Bizy/Admin Geral: acessa `/governance/anani/*` e aprova acoes de alto impacto.

## 4. Entidades e Dados

- [x] `PrevisaoDemanda`
- [x] `ScoreCliente`
- [x] `PrevisaoFluxoCaixa`
- [x] `InsightPreditivo`
- [x] `FeedbackInsight`
- [x] `FluxoAutomatico`
- [x] `PassoFluxo`
- [x] `ExecucaoFluxo`
- [x] `ConfiguracaoNotificacao`
- [x] `ContadorNotificacaoDiaria`
- [x] `OutboxEventoN8n`
- [x] `EventOutbox`
- [x] `AnaniTenantRiskSnapshot`
- [x] `AnaniQuarantine`
- [x] `AnaniIncident`
- [x] `AnaniPolicyEngine`
- [x] `AnaniSkillRegistry`

## 5. Fluxos Principais

```text
Dados historicos -> Calculo/score -> Insight -> Acao sugerida -> Feedback
```

```text
Evento -> Fluxo automatico -> Passos -> Tarefa/Mensagem/Alerta -> Auditoria
```

```text
Backend -> Outbox -> n8n -> Endpoint autorizado -> Backend valida
```

```text
Team/Market/Learning -> EventOutbox -> Read Models -> Anani PolicyEngine -> ActionGateway/Governance -> Auditoria
```

## 6. Requisitos Funcionais

- [x] Prever demanda por SKU.
- [x] Calcular risco de churn e LTV.
- [x] Prever fluxo de caixa.
- [x] Detectar anomalias.
- [x] Criar insights com acao sugerida.
- [x] Registrar feedback aceito/rejeitado/ignorado.
- [x] Criar fluxos condicionais.
- [x] Pausar e retomar fluxos.
- [x] Publicar eventos para n8n com retry.
- [x] Avaliar acoes candidatas da Anani por politica.
- [x] Criar incidentes e quarentenas internas.
- [x] Registrar snapshots de risco por negocio e sistema visivel.
- [x] Manter skill registry com niveis de autonomia.

## 7. Regras de Negocio

- IA nao inventa preco, stock, prazo, estado ou confirmacao.
- Automacao nao confirma pagamento, concede desconto, cancela ou promete entrega sem regra.
- Baixa confianca vira tarefa humana.
- n8n so age por endpoints autorizados.
- n8n e sistema nervoso periferico: executa, nao decide.
- Anani nao e produto de tenant; e nucleo interno invisivel.
- Claude/GPT nunca recebe PII, tokens, segredos ou conteudo cru quando for integrado.
- Acoes de nivel 3 exigem aprovacao humana.
- Acoes sobre ledger, saldo, pagamento ou reembolso sao proibidas para Anani.
- Conflito entre automacao e seguranca favorece humano.

## 8. Requisitos Nao Funcionais

- Processamento preditivo em background quando pesado.
- Explicabilidade minima para insights.
- Execucoes auditaveis.
- Outbox resiliente.
- Notificacoes configuraveis para evitar fadiga.

## 9. APIs, Telas e Integracoes

APIs: `/inteligencia/*`, `/workflow/*`, `/n8n/*`, `/automacoes/*`, `/eventos-operacionais`, `/governance/anani/*`.

Telas: Inteligencia, Sequencias, Recuperacao, Painel, Administracao, Auditoria e futura Governance Console Anani.

Integracoes: n8n, OpenRouter/IA, WhatsApp, jobs internos.

## 10. Guardrails

- Nao permitir automacao irreversivel sem auditoria.
- Nao enviar marketing sem consentimento.
- Nao esconder falha de provider.
- Nao usar IA como fonte de verdade.
- Nao expor Anani em navegacao comercial de tenant.
- Nao executar skill Anani sem PolicyEngine.

## 11. Estado Atual

Backend possui n8n, outbox, IA assistiva, inteligencia preditiva, workflow e notificacoes em evolucao. Em 2026-07-09 ganhou a primeira fronteira interna Anani: policy engine, skill registry, bootstrap, rotas de governanca, migration e tabelas de outbox/risco/quarentena/incidentes. Frontend possui pagina Inteligencia e Sequencias; a Governance Console ainda nao foi implementada.

## 12. Lacunas

- [x] P0: manter Anani restrito a governanca e fora de tenant.
- [x] P0: tarefas humanas para falhas criticas de automacao.
- [ ] P1: projectors/read models reais de TeamHealth, MarketSnapshot e SecuritySnapshot.
- [ ] P1: insights contextuais melhores e notificacoes WhatsApp configuraveis.
- [ ] P2: explicabilidade avancada, motor de recomendacao, ActionGateway real e automacoes cross-domain.

## 13. Testes e Verificacao

- [x] Testes de n8n.
- [x] Testes de politica de automacao.
- [x] Testes de workflow.
- [x] Testes de insights e feedback.
- [x] Testes de outbox/retry.
- [x] Testes do PolicyEngine Anani.
- [x] Testes da guarda Anani por papel de plataforma.
- [x] Testes HTTP completos das rotas `/governance/anani/*` com papel `GOVERNANTE_BIZY`.

## 14. Proximos Planos

- [ ] Spec de notificacoes proactivas via WhatsApp.
- [ ] Spec de explicabilidade de insights.
- [ ] Spec de workflow cross-domain.
- [ ] Spec de projectors/read models Anani.
- [ ] Spec de Governance Console Anani.
