# SDD Dominio 00 - Visao Produto e Principios

Status: ativo
Owner logico: Produto
Fontes: `docs/wiki/pages/memoria-projeto-bizy.md`, `docs/wiki/pages/visao-produto-bizy.md`, `docs/wiki/pages/dores-e-qualidades-bizy.md`, `docs/superpowers/specs/2026-06-30-meta-global-bizy.md`
Ultima atualizacao: 2026-06-30

## 1. Proposito

Definir a visao e a meta global que orientam todo o Bizy: um sistema operacional de social commerce que evoluiu de automacao de live para CRM+, Bizy Market e Bizy Team.

### 1.1 Meta Global Oficial

O Bizy deve ser o sistema operacional comercial para pequenos negocios: trazer clientes, vender, atender, cobrar, entregar, medir e repetir crescimento sem o dono da loja sair do Bizy.

Essa meta vem da spec `docs/superpowers/specs/2026-06-30-meta-global-bizy.md` e deve orientar qualquer nova spec, plano ou decisao de produto.

Toda iniciativa deve melhorar pelo menos uma capacidade:

- descoberta;
- conversao;
- execucao;
- retencao;
- controlo.

## 2. Escopo

Entra neste dominio: tese do produto, publico, contexto angolano, principios, dores resolvidas, linguagem de decisao e relacao entre canais e nucleo operacional.

Fica fora: requisitos detalhados de cada modulo, implementacao tecnica e planos de feature.

## 3. Atores e Permissoes

- Dono: precisa controlar vendas, equipa, dinheiro e operacao.
- Vendedor/atendente: precisa atender e vender com pouco atrito.
- Comprador: precisa comprar e acompanhar com clareza.
- Administrador Bizy: precisa governar plataforma e Market.
- IA/dev: precisa usar esta visao como norte antes de propor mudancas.

## 4. Entidades e Dados

Este dominio nao possui entidade propria. Ele define a relacao entre entidades centrais: `Negocio`, `ClienteNegocio`, `Peca`, `Pedido`, `ConversaAtendimento`, `TarefaOperacional`, `MovimentoFinanceiro` e eventos de auditoria.

## 5. Fluxos Principais

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
        -> Equipa -> Financas -> Auditoria
```

## 6. Requisitos Funcionais

- Explicar o Bizy como operacao comercial, nao apenas bot ou live.
- Manter live, WhatsApp, loja, Market e Social Inbox como canais de entrada.
- Manter CRM/Team como centro de execucao.
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

- Nao reduzir Bizy a chatbot, marketplace ou dashboard.
- Nao criar feature que nao melhore descoberta, conversao, execucao, retencao ou controlo.
- Nao deixar o Market substituir o Team: Market gera descoberta; Team controla execucao.
- Nao transformar deploy, n8n ou Evolution no centro da memoria.
- Nao criar modulo sem fluxo operacional real.
- Nao prometer automacao perigosa como diferencial.

## 11. Estado Atual

A visao esta documentada na wiki, consolidada no SDD e estabelecida como meta global na spec `docs/superpowers/specs/2026-06-30-meta-global-bizy.md`. O produto ja cobre CRM+, Market, Team, financas, inteligencia, workflow e operacao.

## 12. Lacunas

- P0: alinhar experiencia publica a promessa Bizy Market.
- P1: revisar textos de produto para vendedores nao tecnicos.
- P2: refinar posicionamento Bizy Team por segmento de cliente.

## 13. Testes e Verificacao

- Revisar specs novas contra a frase norteadora.
- Revisar specs novas contra a meta global oficial.
- Verificar se toda tela tem acao operacional.
- Verificar se nova automacao possui fallback humano quando sensivel.

## 14. Proximos Planos

- Spec de posicionamento publico Bizy Team.
- Spec de linguagem operacional para CRM, Market e Team.
