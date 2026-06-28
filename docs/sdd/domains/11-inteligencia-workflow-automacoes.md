# SDD Dominio 11 - Inteligencia, Workflow e Automacoes

Status: ativo
Owner logico: Produto Inteligencia/Automacao
Fontes: `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`, `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`, `backend/src/infra/http/modulos/n8n.ts`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Usar previsoes, insights, workflows e automacoes para apoiar a operacao sem tirar o humano do controle em decisoes sensiveis.

## 2. Escopo

Entra: previsao de demanda, churn, LTV, lead scoring, previsao de caixa, anomalias, insights, feedback, fluxos automaticos, passos, execucoes, notificacoes, n8n e IA assistiva.

Fica fora: regras financeiras de contabilizacao, cobertas no dominio 10, e politica WhatsApp detalhada, coberta no dominio 05.

## 3. Atores e Permissoes

- Dono/gestor: recebe alertas e insights.
- Vendedor/atendente: recebe proxima acao contextual.
- Financeiro: recebe previsoes e alertas de caixa.
- Sistema: calcula scores, cria tarefas e executa fluxos.
- IA: sugere, classifica e apoia, mas nao decide dados sensiveis sem backend.

## 4. Entidades e Dados

- `PrevisaoDemanda`
- `ScoreCliente`
- `PrevisaoFluxoCaixa`
- `InsightPreditivo`
- `FeedbackInsight`
- `FluxoAutomatico`
- `PassoFluxo`
- `ExecucaoFluxo`
- `ConfiguracaoNotificacao`
- `ContadorNotificacaoDiaria`
- `OutboxEventoN8n`

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

## 6. Requisitos Funcionais

- Prever demanda por SKU.
- Calcular risco de churn e LTV.
- Prever fluxo de caixa.
- Detectar anomalias.
- Criar insights com acao sugerida.
- Registrar feedback aceito/rejeitado/ignorado.
- Criar fluxos condicionais.
- Pausar e retomar fluxos.
- Publicar eventos para n8n com retry.

## 7. Regras de Negocio

- IA nao inventa preco, stock, prazo, estado ou confirmacao.
- Automacao nao confirma pagamento, concede desconto, cancela ou promete entrega sem regra.
- Baixa confianca vira tarefa humana.
- n8n so age por endpoints autorizados.
- Conflito entre automacao e seguranca favorece humano.

## 8. Requisitos Nao Funcionais

- Processamento preditivo em background quando pesado.
- Explicabilidade minima para insights.
- Execucoes auditaveis.
- Outbox resiliente.
- Notificacoes configuraveis para evitar fadiga.

## 9. APIs, Telas e Integracoes

APIs: `/inteligencia/*`, `/workflow/*`, `/n8n/*`, `/automacoes/*`, `/eventos-operacionais`.

Telas: Inteligencia, Sequencias, Recuperacao, Painel, Administracao, Auditoria.

Integracoes: n8n, OpenRouter/IA, WhatsApp, jobs internos.

## 10. Guardrails

- Nao permitir automacao irreversivel sem auditoria.
- Nao enviar marketing sem consentimento.
- Nao esconder falha de provider.
- Nao usar IA como fonte de verdade.

## 11. Estado Atual

Backend possui n8n, outbox, IA assistiva, inteligencia preditiva, workflow e notificacoes em evolucao. Frontend possui pagina Inteligencia e Sequencias.

## 12. Lacunas

- P0: tarefas humanas para falhas criticas de automacao.
- P1: insights contextuais melhores e notificacoes WhatsApp configuraveis.
- P2: explicabilidade avancada, motor de recomendacao e automacoes cross-domain.

## 13. Testes e Verificacao

- Testes de n8n.
- Testes de politica de automacao.
- Testes de workflow.
- Testes de insights e feedback.
- Testes de outbox/retry.

## 14. Proximos Planos

- Spec de notificacoes proactivas via WhatsApp.
- Spec de explicabilidade de insights.
- Spec de workflow cross-domain.
