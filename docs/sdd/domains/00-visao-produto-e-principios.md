# SDD Dominio 00 - Visao Produto e Principios

Status: ativo
Owner logico: Produto
Fonte canonica: `docs/wiki/pages/visao-produto-bizy.md`
Fontes derivadas: `docs/wiki/pages/memoria-projeto-bizy.md`, `docs/wiki/pages/dores-e-qualidades-bizy.md`, `docs/superpowers/specs/2026-06-30-meta-global-bizy.md`, `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`, auditoria integral de benchmark internacional V2 de 2026-07-10
Ultima atualizacao: 2026-07-10

## 1. Proposito

Projetar a [[visao-produto-bizy|Visao Unificada do Bizy]] para o SDD. Este dominio nao cria uma visao paralela; ele transforma a visao canonica em principios, guardrails e criterios para specs.

### 1.1 Formula Oficial

```text
Bizy = 3 sistemas visiveis + 1 nucleo interno invisivel

Sistemas visiveis:
- Bizy Team
- Bizy Market
- Bizy Learning

Nucleo interno:
- Anani
```

### 1.2 Meta Global

O Bizy deve ser o sistema operacional comercial para pequenos negocios: trazer clientes, vender, atender, cobrar, entregar, medir e repetir crescimento sem o dono da loja sair do Bizy.

Essa meta deve orientar qualquer nova spec, plano ou decisao de produto.

Atualizacao 2026-07-10: o Bizy passa a tratar cada modulo como dominio operacional completo. Um modulo so esta pronto quando e mensuravel, automatizavel, auditavel, seguro, acessivel e integrado ao restante ecossistema.

Toda iniciativa deve melhorar pelo menos uma capacidade:

- descoberta;
- conversao;
- execucao;
- retencao;
- controlo.

Anani nao e produto vendido, chatbot publico, menu de tenant ou assistente operacional comum. Donos, gestores, vendedores, alunos, professores, compradores e afiliados veem apenas efeitos do Anani dentro dos sistemas visiveis: alertas, tarefas, scores, protecoes, relatorios simplificados e pedidos de verificacao.

## 2. Escopo

Entra neste dominio: tese do produto, publico, contexto angolano, principios, dores resolvidas, linguagem de decisao e relacao entre canais e nucleo operacional.

Fica fora: requisitos detalhados de cada modulo, implementacao tecnica e planos de feature.

## 3. Atores e Permissoes

- Dono: controla vendas, equipa, dinheiro e operacao dentro do Team.
- Vendedor/atendente: atende e vende com pouco atrito.
- Comprador: descobre, compra e acompanha com clareza no Market, loja publica ou Learning.
- Criador/mentor: vende produtos digitais e acompanha acesso/progresso pelo Team/Learning.
- Administrador Bizy: governa plataforma, Market, Learning e sinais operacionais.
- Governante Bizy/Admin Geral: pode acessar diretamente o Anani.
- IA/dev: usa a visao canonica antes de propor mudancas.

## 4. Entidades e Dados

Este dominio nao possui entidade propria. Ele define a relacao entre entidades centrais: `Negocio`, `ClienteNegocio`, `Peca`, `Pedido`, `ConversaAtendimento`, `TarefaOperacional`, `MovimentoFinanceiro` e eventos de auditoria.

## 5. Fluxos Principais

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
        -> Equipa -> Financas -> Auditoria
```

## 6. Requisitos Funcionais

- Explicar o Bizy como operacao comercial, nao apenas bot, live, marketplace, escola ou IA.
- Manter live, WhatsApp, loja publica, Market, Learning, Social Inbox, campanhas e afiliados como canais/capacidades que alimentam o loop comercial.
- Manter Team como centro de execucao e fonte de verdade operacional.
- Orientar novas specs pela frase: vender, atender, cobrar, entregar, recuperar, medir, gerir equipa ou controlar dinheiro.
- Validar specs novas contra as cinco capacidades da meta global: descoberta, conversao, execucao, retencao e controlo.
- Exigir anatomia minima de modulo em specs novas: overview, listas, detalhe 360, criacao, edicao controlada, workflow, tarefas/aprovacoes, automacao, relatorios, configuracao, permissoes, auditoria, integracoes, notificacoes e ajuda contextual.
- Exigir que cada modulo declare owner de dominio, entidades, regras, estados, transicoes, comandos, consultas, eventos, policies, logs, testes, metricas, retencao, exportacao e documentacao.
- Separar plataforma comum de produto visivel: catalogo de modulos, capacidades, event envelope, workflow engine, auditoria, notificacoes, error model, observabilidade, catalogo de KPI e classificacao de dados devem servir Team, Market e Learning.

## 7. Regras de Negocio

- Pedido e a entidade comercial principal.
- Reserva e bloqueio temporario.
- Tracking nao e venda.
- Comprovativo recebido nao e pagamento confirmado.
- Comissao depende de pedido pago.
- Automacao sensivel prefere tarefa humana.
- KPI sem fonte real, periodo e definicao nao deve ser usado para decisao de produto.
- Padrões internacionais sao referencias de alinhamento e preparacao; o Bizy nao declara certificacao formal sem processo independente.
- Estado operacional nao deve mudar por `string` livre: precisa de transicao, condicao, permissao, evento e auditoria.

## 8. Requisitos Nao Funcionais

- Linguagem simples para utilizador nao tecnico.
- Mobile-first para contexto de operacao angolano.
- UX operacional, nao decorativa.
- Guardrails de privacidade, auditoria e permissao por padrao.
- APIs e eventos novos devem preparar OpenAPI, versionamento, idempotencia e envelope compativel com CloudEvents quando houver integracao externa.
- Fluxos criticos devem produzir logs, metricas e traces compativeis com uma estrategia OpenTelemetry.
- Specs novas devem verificar WCAG 2.2 AA, ASVS proporcional ao risco, minimizacao de dados e fallback humano para automacoes sensiveis.

## 9. APIs, Telas e Integracoes

Este dominio orienta todas as APIs e telas, mas nao define endpoints proprios.

## 10. Guardrails

- Nao reduzir Bizy a chatbot, marketplace, escola, dashboard ou IA.
- Nao criar feature que nao melhore descoberta, conversao, execucao, retencao ou controlo.
- Nao deixar o Market substituir o Team: Market gera descoberta; Team controla execucao.
- Nao deixar o Learning virar pagina decorativa: Learning precisa ter produto digital, acesso, progresso, checkout ou operacao no Team.
- Nao transformar Anani em modulo de tenant; Anani e infraestrutura interna governada.
- Nao transformar deploy, n8n ou Evolution no centro da memoria.
- Nao criar modulo sem fluxo operacional real.
- Nao prometer automacao perigosa como diferencial.
- Nao tratar pagina, endpoint, tabela, card de KPI ou menu como prova de maturidade de modulo.
- Nao duplicar caminhos incompletos quando Team, Market, Learning ou Anani ja forem o caminho vivo.

## 11. Estado Atual

A visao unificada esta documentada em `docs/wiki/pages/visao-produto-bizy.md`. Este dominio SDD, a meta global historica, ADRs e roadmap sao derivados dessa fonte. O produto ja possui caminhos vivos para Team, Market, Learning e Anani interno.

## 12. Lacunas

- [x] P0: alinhar experiencia publica a promessa Bizy Market.
- [x] P0: consolidar visao Bizy em uma fonte canonica.
- [ ] P0: formalizar catalogo vivo de modulos, capacidades, owners e maturidade M0-M5 para Team, Market, Learning e servicos de plataforma.
- [ ] P0: aplicar anatomia minima de modulo a qualquer nova spec antes de aceitar novas telas ou endpoints.
- [ ] P1: revisar textos de produto para vendedores nao tecnicos.
- [ ] P1: criar catalogo de KPIs com codigo, definicao, formula, fonte, periodo, moeda, confianca e drill-down.
- [ ] P1: padronizar event envelope, idempotencia, replay e dead-letter para integracoes externas.
- [ ] P2: refinar posicionamento Bizy Team por segmento de cliente.
- [ ] P2: preparar evidencias de ASVS, WCAG AA, NIST CSF profile, governanca de IA, continuidade e load tests para fase de excelencia internacional.

## 13. Testes e Verificacao

- [ ] Revisar specs novas contra a frase norteadora.
- [ ] Revisar specs novas contra a meta global oficial.
- [x] Verificar se documentos de visao apontam para a fonte canonica.
- [ ] Verificar se toda tela tem acao operacional.
- [ ] Verificar se nova automacao possui fallback humano quando sensivel.
- [ ] Verificar se todo modulo novo possui workflow, auditoria, permissao, metricas, integracao/eventos e testes proporcionais ao risco.
- [ ] Verificar se todo KPI novo possui fonte real, periodo e definicao antes de aparecer em dashboard.
- [ ] Verificar se toda integracao externa possui contrato, idempotencia, logs e caminho de erro explicito.

## 14. Proximos Planos

- [ ] Spec de posicionamento publico Bizy Team.
- [ ] Spec de linguagem operacional para CRM, Market e Team.
- [ ] Spec de plataforma comum: modulos, capacidades, workflow, eventos, auditoria, notificacoes, observabilidade e KPIs.
- [ ] Spec de Developer Platform com OpenAPI, webhooks, OAuth/OIDC, sandbox, limites e versionamento.
