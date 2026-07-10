# SDD Dominio 00 - Visao Produto e Principios

Status: ativo
Owner logico: Produto
Fonte canonica: `docs/wiki/pages/visao-produto-bizy.md`
Fontes derivadas: `docs/wiki/pages/memoria-projeto-bizy.md`, `docs/wiki/pages/dores-e-qualidades-bizy.md`, `docs/superpowers/specs/2026-06-30-meta-global-bizy.md`, `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`
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

## 7. Regras de Negocio

- Pedido e a entidade comercial principal.
- Reserva e bloqueio temporario.
- Tracking nao e venda.
- Comprovativo recebido nao e pagamento confirmado.
- Comissao depende de pedido pago.
- Automacao sensivel prefere tarefa humana.

## 8. Requisitos Nao Funcionais

- Linguagem simples para utilizador nao tecnico.
- Mobile-first para contexto de operacao angolano.
- UX operacional, nao decorativa.
- Guardrails de privacidade, auditoria e permissao por padrao.

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

## 11. Estado Atual

A visao unificada esta documentada em `docs/wiki/pages/visao-produto-bizy.md`. Este dominio SDD, a meta global historica, ADRs e roadmap sao derivados dessa fonte. O produto ja possui caminhos vivos para Team, Market, Learning e Anani interno.

## 12. Lacunas

- [x] P0: alinhar experiencia publica a promessa Bizy Market.
- [x] P0: consolidar visao Bizy em uma fonte canonica.
- [ ] P1: revisar textos de produto para vendedores nao tecnicos.
- [ ] P2: refinar posicionamento Bizy Team por segmento de cliente.

## 13. Testes e Verificacao

- [ ] Revisar specs novas contra a frase norteadora.
- [ ] Revisar specs novas contra a meta global oficial.
- [x] Verificar se documentos de visao apontam para a fonte canonica.
- [ ] Verificar se toda tela tem acao operacional.
- [ ] Verificar se nova automacao possui fallback humano quando sensivel.

## 14. Proximos Planos

- [ ] Spec de posicionamento publico Bizy Team.
- [ ] Spec de linguagem operacional para CRM, Market e Team.
