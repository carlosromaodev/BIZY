---
title: Inventario Backend e API HTTP
aliases:
  - Backend API Bizy
tags:
  - bizy/inventario
  - bizy/backend
status: ativo
updated: 2026-07-09
---

# Inventario Backend e API HTTP

Status: ativo
Ultima atualizacao: 2026-07-09
Fontes principais: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`, `backend/src/infra/http/modulos/*.ts`, `backend/src/use-case/`, `backend/src/anani/`

## Entrada e Composicao

- Entrada do backend: `backend/src/main.ts`.
- Criacao Fastify, CORS, auth, rate limit e error handler: `backend/src/infra/http/criarAplicacao.ts`.
- Montagem de repositorios/use cases/providers: `backend/src/infra/http/ContextoAplicacao.ts`.
- Bootstrap Anani interno: `backend/src/app/bootstrap/bootstrapAnani.ts`.
- Contratos de repositorio: `backend/src/dominio/repositorios/contratos.ts`.
- Repositorios concretos: `backend/src/use-case/repositorios/RepositorioPrisma.ts` e `RepositorioMemoria.ts`.

## Ligacoes de Contexto

- Visao de produto que orienta estes modulos: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- Persistencia usada por estes endpoints: [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Telas que consomem estas rotas: [Inventario Frontend e UX](inventario-frontend.md).
- Como testar/subir estes endpoints: [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- Visao geral do sistema: [Inventario do Sistema Bizy](inventario-sistema-bizy.md).
- Nucleo interno de governanca: [[anani-intelligence-control-plane]].

## Modulos HTTP Registrados

Ordem em `manifestoModulosHttp.ts`:

1. `saude`
2. `autenticacao`
3. `lives`
4. `catalogo`
5. `clientes`
6. `campanhas`
7. `contratos`
8. `lojaPublica`
9. `afiliados`
10. `diagnosticos`
11. `media`
12. `pedidos`
13. `reservas`
14. `integracoes`
15. `n8n`
16. `operacional`
17. `painel`
18. `admin-governanca`
19. `anani-governance`
20. `checkoutUnificado`
21. `equipa`
22. `financas`
23. `inteligencia`
24. `workflow`
25. `projectos`
26. `conformidade`

## Anani Governance

Rotas internas. Exigem sessao e papel de plataforma: `GOVERNANTE_BIZY`, `ADMIN_GERAL` ou `SUPER_ADMIN_PLATFORM`.

- `GET /governance/anani/health`
- `GET /governance/anani/policies`
- `POST /governance/anani/policies/evaluate`
- `POST /governance/anani/events`
- `POST /governance/anani/events/processar`
- `GET /governance/anani/incidents`
- `POST /governance/anani/incidents`
- `PATCH /governance/anani/incidents/:id`
- `GET /governance/anani/quarantine`
- `POST /governance/anani/quarantine`
- `POST /governance/anani/quarantine/:id/resolver`
- `POST /governance/anani/risk-snapshots`
- `GET /governance/anani/risk-snapshots/:negocioId/:sistema`

## Saude

- `GET /`
- `GET /saude`

## Autenticacao, Sessao, Onboarding e Negocio

- `POST /auth/telefone/solicitar-codigo`
- `POST /auth/telefone/confirmar-codigo`
- `POST /auth/estudantil/login`
- `GET /auth/google/status`
- `GET /auth/google/iniciar`
- `GET /auth/google/callback`
- `GET /auth/sessao`
- `DELETE /auth/sessao`
- `GET /onboarding/estado`
- `POST /onboarding/negocio`
- `POST /onboarding/produto-inicial`
- `GET /negocio/pagamentos`
- `PATCH /negocio/pagamentos`
- `GET /negocio/modulos`
- `PATCH /negocio/modulos/:modulo`

## Lives, Eventos e Comentarios

- `GET /eventos`
- `POST /lives/iniciar`
- `GET /lives`
- `POST /lives/:id/parar`
- `POST /lives/:id/comentarios/manual`
- `POST /comentarios/manual`
- `GET /comentarios`
- `DELETE /comentarios/dados-operacionais`
- `POST /comentarios/:id/aprovar`
- `POST /comentarios/:id/rejeitar`

## Catalogo, Produtos, Pecas e Stock

Relaciona-se com os modelos `Peca` e `MovimentoStock` em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md), e com a tela `PaginaCatalogo` em [Inventario Frontend e UX](inventario-frontend.md).

- `POST /pecas`
- `GET /pecas`
- `GET /pecas/resumo`
- `POST /pecas/importar.csv`
- `GET /pecas/:codigo/movimentos`
- `POST /pecas/:codigo/movimentos`
- `POST /pecas/:codigo/arquivar`
- `PATCH /pecas/:codigo`
- `DELETE /pecas/:codigo`

## Clientes 360, Relacoes e Privacidade

Relaciona-se com `ClienteGlobal`, `ClienteNegocio`, `RelacaoNegocio` e compartilhamentos em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md), e com `PaginaClientes` em [Inventario Frontend e UX](inventario-frontend.md).

- `GET /clientes`
- `POST /clientes`
- `POST /clientes/importar.csv`
- `POST /negocio/relacoes`
- `PATCH /negocio/relacoes/:id`
- `GET /clientes/exportar.csv`
- `GET /clientes/segmentos`
- `POST /clientes/mesclar/preview`
- `POST /clientes/mesclar`
- `GET /clientes/compartilhamentos/recebidos`
- `POST /clientes/compartilhamentos/:id/revogar`
- `POST /clientes/:id/compartilhamentos`
- `POST /clientes/:id/acoes`
- `POST /clientes/:id/privacidade/anonimizar`
- `GET /clientes/:id/enderecos`
- `POST /clientes/:id/enderecos`
- `GET /clientes/:id`
- `PATCH /clientes/:id`

## Pedidos, Orcamentos, Pagamentos e Entrega

Relaciona-se com `Pedido` e `ItemPedido` em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md), e com `PaginaReservas`/rotulo `Pedidos` em [Inventario Frontend e UX](inventario-frontend.md).

- `GET /pedidos`
- `POST /pedidos`
- `POST /pedidos/orcamentos`
- `GET /pedidos/exportar.csv`
- `GET /pedidos/preparacao`
- `GET /pedidos/entregas`
- `POST /pedidos/recuperar-parados`
- `GET /pedidos/:id`
- `GET /pedidos/:id/recibo`
- `GET /pedidos/:id/historico-pagamento`
- `PATCH /pedidos/:id/itens`
- `PATCH /pedidos/:id/estado`
- `POST /pedidos/:id/descontos/solicitar`
- `POST /pedidos/:id/descontos/aprovar`
- `POST /pedidos/:id/comprovativo`
- `POST /pedidos/:id/rejeitar-pagamento`
- `POST /pedidos/:id/confirmar-pagamento`
- `PATCH /pedidos/:id/entrega`

## Reservas

- `GET /reservas`
- `GET /reservas/:id/recibo.pdf`
- `POST /reservas/:id/confirmar-pagamento`
- `POST /reservas/:id/comprovativo`
- `POST /reservas/:id/converter-pedido`
- `POST /reservas/:id/cancelar`
- `POST /reservas/expirar`

## Loja Publica, Checkout e Tracking

Relaciona-se com tracking, afiliados e negocio em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md), e com as lacunas de UI publica em [Inventario Frontend e UX](inventario-frontend.md).

- `PUT /loja-publica/configuracao`
- `GET /loja-publica/tracking/resumo`
- `GET /publico/lojas/:slug`
- `GET /publico/lojas/:slug/produtos/:codigo`
- `POST /publico/lojas/:slug/entrega/calcular`
- `POST /publico/lojas/:slug/produtos/:codigo/whatsapp`
- `POST /publico/lojas/:slug/checkout`
- `POST /publico/lojas/:slug/checkout/abandonado`
- `POST /publico/tracking/eventos`

## Afiliados, Criadores, Links e Comissoes

Rotas publicas:

- `GET /publico/links/:codigo`
- `GET /publico/mini-lojas/:codigo`

Rotas autenticadas:

- `GET /afiliados`
- `POST /afiliados`
- `GET /afiliados/links`
- `POST /afiliados/:id/links`
- `GET /afiliados/:id/pacote-divulgacao`
- `GET /afiliados/comissoes`
- `POST /afiliados/atribuicoes/manual`
- `GET /afiliados/comissoes/saldos`
- `GET /afiliados/comissoes/lotes-pagamento/exportar.csv`
- `GET /afiliados/comissoes/lotes-pagamento`
- `POST /afiliados/comissoes/lotes-pagamento`
- `GET /afiliados/comissoes/:id/auditoria`
- `POST /afiliados/comissoes/:id/pagar`
- `GET /afiliados/resumo`

## Campanhas, Templates, Governanca e Jobs

- `POST /whatsapp/templates`
- `PATCH /whatsapp/templates/:id`
- `GET /campanhas`
- `POST /campanhas`
- `POST /campanhas/:id/confirmar`
- `POST /campanhas/:id/pausar`
- `GET /campanhas/:id/resultados`
- `GET /negocio/papeis`
- `GET /negocio/membros`
- `POST /negocio/membros`
- `PATCH /negocio/membros/:id`
- `POST /eventos-operacionais`
- `GET /eventos-operacionais`
- `POST /jobs/importacao/clientes`
- `POST /jobs/exportacao/clientes`
- `POST /jobs/importacao/produtos`
- `POST /jobs/exportacao/produtos`

## Integracoes, WhatsApp e Evolution

Relaciona-se com n8n/Evolution em [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md), e com instancias persistidas em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).

- `GET /integracoes/status`
- `GET /evolution/resumo`
- `GET /whatsapp/templates`
- `POST /whatsapp/mensagens`
- `POST /evolution/instancias`
- `POST /evolution/instancias/:id/conectar`
- `POST /evolution/instancias/:id/estado`
- `POST /evolution/instancias/:id/padrao`
- `DELETE /evolution/instancias/:id`
- `POST /webhooks/evolution`

## n8n

- `GET /n8n/customers/by-phone/:phone`
- `GET /n8n/reservations/active/:phone`
- `GET /n8n/products/:code`
- `POST /n8n/messages/classify`
- `POST /n8n/reservations/:id/cancel`
- `POST /n8n/payments/:id/proof-received`
- `POST /n8n/payments/:id/confirm`
- `POST /n8n/payments/:id/reject`
- `POST /n8n/orders/:id/delivery-address`
- `POST /n8n/orders/:id/delivered`

## Operacional: Automacoes, Auditoria e Outbox

- `GET /automacoes/status`
- `GET /operacional/auditoria`
- `GET /automacoes/n8n/outbox`
- `GET /automacoes/n8n/outbox/saude`
- `GET /automacoes/whatsapp/outbox`
- `GET /automacoes/whatsapp/outbox/saude`
- `GET /auditoria/eventos`
- `POST /automacoes/whatsapp/outbox/reprocessar`
- `POST /operacional/transferencias`

## Tarefas Operacionais

- `GET /tarefas`
- `POST /tarefas`
- `POST /tarefas/automaticas/rotina`
- `GET /tarefas/:id`
- `PATCH /tarefas/:id`

## Social Inbox

- `GET /social/inbox/itens`
- `GET /social/contas/providers`
- `GET /social/contas`
- `POST /social/contas`
- `POST /social/inbox/capturar`
- `POST /social/inbox/importar.csv`
- `POST /social/inbox/itens`
- `POST /social/inbox/itens/:id/whatsapp`

## Funil, Recuperacao e Playbooks

- `GET /funil/etapas`
- `GET /funil/movimentos`
- `POST /funil/movimentos`
- `GET /recuperacao/oportunidades`
- `PATCH /recuperacao/oportunidades/:id`
- `GET /playbooks/recuperacao`
- `POST /playbooks/recuperacao`
- `GET /playbooks/recuperacao/execucoes`
- `POST /playbooks/recuperacao/:id/executar`

## Atendimento CRM

Relaciona-se com `ConversaAtendimento`, `MensagemAtendimento`, tarefas e clientes em [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md), e com `PaginaConversas` em [Inventario Frontend e UX](inventario-frontend.md).

- `GET /atendimento/conversas`
- `GET /atendimento/conversas/filtros`
- `POST /atendimento/conversas/verificar-sla`
- `GET /atendimento/conversas/:id/proximas-acoes`
- `POST /atendimento/conversas/:id/pedidos`
- `PATCH /atendimento/conversas/:id`
- `POST /atendimento/conversas/:id/mensagens`
- `POST /atendimento/conversas/:id/politica`
- `POST /atendimento/conversas/:id/notas`
- `POST /atendimento/conversas/:id/sugestoes`

## Relatorios e Painel

Painel:

- `GET /painel/resumo`
- `GET /relatorios/comercial`
- `GET /relatorios/resumo-diario`
- `GET /relatorios/social-receita`
- `GET /relatorios/comercial.csv`
- `GET /relatorios/comercial.pdf`

Operacional:

- `GET /relatorios/entregas`
- `GET /relatorios/entregas.csv`
- `GET /relatorios/live-piloto`
- `GET /relatorios/crm-pos-live`
- `GET /relatorios/crm-pos-live.csv`

## Media, Diagnosticos e Contratos

Media:

- `POST /media/upload`
- `GET /media/files/*`

Diagnosticos:

- `GET /diagnosticos/sms/overview`
- `GET /diagnosticos/sms/remetentes`
- `GET /diagnosticos/sms/mensagens`
- `POST /diagnosticos/sms/testar`

Contratos:

- `GET /contratos`

## Use Cases Principais Existentes

- Atendimento/CRM: `AtendimentoCrmUseCase`, `GestaoAtendimentoCrmUseCase`, `ConsultaAtendimentoOperacionalUseCase`.
- Autenticacao/identidade: `AutenticacaoTelefoneUseCase`, `AutenticacaoEstudantilUseCase`, `OnboardingBizyUseCase`.
- Catalogo/pedidos/reservas: `GestaoPecasUseCase`, `GestaoPedidosUseCase`, `MotorReservas`, `MonitorReservasUseCase`, `GerarReciboReservaUseCase`.
- Clientes/governanca: `GestaoClientesCrmUseCase`, `GestaoCompartilhamentoClientesUseCase`, `GestaoGovernancaCrmUseCase`, `GestaoModulosNegocioUseCase`.
- Automacoes/WhatsApp/n8n: `GestaoWhatsAppEvolutionUseCase`, `ReceberMensagemWhatsAppUseCase`, `RecuperacaoMensagensWhatsAppUseCase`, `ConsultaAtendimentoN8n`.
- Anani interno: `AnaniPolicyEngine`, `bootstrapAnani`.
- Social commerce: `LojaPublicaUseCase`, `GestaoAfiliadosUseCase`, `GestaoCampanhasCrmUseCase`, `GestaoSocialInboxUseCase`, `GestaoFunilComercialUseCase`, `GestaoOportunidadesRecuperacaoUseCase`, `GestaoPlaybooksRecuperacaoUseCase`.
- Relatorios/auditoria: `RelatoriosComerciaisUseCase`, `ConsultaPainelUseCase`, `ConsultaOperacionalUseCase`, `AuditoriaEventosUseCase`.
