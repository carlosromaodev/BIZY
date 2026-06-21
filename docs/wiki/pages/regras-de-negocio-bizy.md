---
title: Regras de Negocio do Bizy
aliases:
  - RN Bizy
  - Regras de Negocio
tags:
  - bizy/requisitos
  - bizy/rn
status: ativo
updated: 2026-06-17
---

# Regras de Negocio do Bizy

> [!info] Fonte principal
> Sintese organizada por dominio a partir de `docs/RF-RNF-RN-EMEUV1.md` v1.107 (136 RNs).
> Para regras do Bizy Market e Lojas Digitais, ver [[requisitos-bizy-market]].

## Cobertura Geral

| Metrica | Valor |
|---|---|
| Total de RNs | 136 (RN01–RN136) |
| Implementados `[x]` | ~100 (74%) |
| Parciais `[~]` | ~33 (24%) |
| Planeados/Processo `[ ]` | ~3 (2%) |

---

## 5.1 Comentarios e Parser (RN01–RN10)

Regras que governam quando um comentario de live e valido, ambiguo ou ignorado.

- **RN01**: Comentario so e valido com intencao de compra + telefone angolano + codigo de peca. `[x]`
- **RN02**: Ordem entre telefone e codigo nao altera validade. `[x]`
- **RN03**: Telefones moveis angolanos com 9 digitos e prefixos validos (com ou sem 244/00244). `[x]`
- **RN04**: Codigos aceitam `peca`, `produto`, `item`, `#` ou numero livre. `[x]`
- **RN05**: Intencoes incluem `eu quero`, `qro`, `meu`, `e meu`, `pega`, `reserva`, `guarda`, `fica pra mim`. `[x]`
- **RN06–RN09**: Falta de telefone, codigo, telefone invalido ou confianca baixa → revisao manual. `[x]`
- **RN07A**: Com telefone mas sem codigo/peca no catalogo → mensagem pedindo codigo. `[x]`
- **RN10**: Sem intencao de compra → ignorar, manter no historico. `[x]`

**Estado**: Totalmente implementado.

---

## 5.2 Catalogo e Stock (RN11–RN17)

Regras de unicidade, estados de stock e bloqueio por reservas.

- **RN11**: Codigo unico por negocio/loja, nao globalmente. `[x]`
- **RN12**: Quantidade zero = esgotada/indisponivel. `[x]`
- **RN13**: Pecas vendidas/esgotadas nao recebem reserva automatica. `[x]`
- **RN14**: Stock livre = total − reservas que bloqueiam. `[x]`
- **RN15**: `WAITING_PAYMENT`, `PENDING`, `RESERVED`, `PAID` bloqueiam stock. `[x]`
- **RN16**: `WAITLISTED` nao bloqueia stock. `[x]`
- **RN17**: Quando pago = total stock → peca pode ser marcada como vendida. `[x]`

**Estado**: Totalmente implementado.

---

## 5.3 Reservas e Fila (RN18–RN28)

Regras de prioridade, deduplicacao, expiracao e promocao de fila.

- **RN18**: Primeiro comentario valido ganha reserva. `[x]`
- **RN19**: Seguintes entram em fila. `[x]`
- **RN20**: Mesmo telefone nao pode ter reserva ativa duplicada para mesma peca. `[x]`
- **RN21**: Mesmo cliente pode reservar pecas diferentes na mesma live. `[x]`
- **RN22**: Reserva automatica inicia como `WAITING_PAYMENT`. `[x]`
- **RN23**: Fila inicia como `WAITLISTED` sem expiracao. `[x]`
- **RN24**: Reserva expira quando prazo termina sem pagamento. `[x]`
- **RN25–RN26**: Ao expirar ou cancelar → promover primeiro da fila se houver stock. `[x]`
- **RN27**: Promovido da fila recebe novo prazo. `[x]`
- **RN28**: Prazo recomendado do piloto = 15min, configuravel. `[x]`

**Estado**: Totalmente implementado.

---

## 5.4 Revisao Manual (RN29–RN33)

- **RN29**: Em revisao → nao cria reserva automatica. `[x]`
- **RN30**: Vendedor pode corrigir telefone e codigo antes de aprovar. `[x]`
- **RN31**: Aprovacao manual aplica mesmas regras de stock, duplicidade e fila. `[x]`
- **RN32**: Rejeicao → nenhuma reserva, motivo registado. `[x]`
- **RN33**: Correcoes manuais ficam auditaveis. `[x]`

**Estado**: Totalmente implementado.

---

## 5.5 Pagamentos (RN34–RN39)

- **RN34**: Comprovativo recebido ≠ pagamento confirmado. `[x]`
- **RN34A**: Comprovativo em dataUrl deve ser persistido como ficheiro interno. `[x]`
- **RN35**: Pagamento so confirmado por acao autorizada. `[x]`
- **RN36**: Ao confirmar → `PAID` e pagamento `CONFIRMADO`. `[x]`
- **RN37**: Ao rejeitar → `REJEITADO` com motivo. `[x]`
- **RN38**: Reserva paga nao expira automaticamente. `[x]`
- **RN39**: Reserva paga nao pode ser cancelada por fluxo automatico. `[x]`

**Estado**: Totalmente implementado.

---

## 5.6 WhatsApp e Atendimento (RN40–RN45A)

- **RN40**: `N8N_ASSUME_WHATSAPP=true` → backend emite eventos, nao envia direto. `[x]`
- **RN41**: `WHATSAPP_PROVIDER=evolution` → envia pela Evolution API. `[x]`
- **RN41A**: `WHATSAPP_PROVIDER=cloud-api` → envia pelo WhatsApp Cloud API oficial. `[x]`
- **RN42**: Instancia padrao conectada e preferida; fallback para outra conectada. `[x]`
- **RN43**: Rate limit para evitar spam e duplicidade. `[x]`
- **RN43A**: Validacao anti-spam antes do provider externo. `[x]`
- **RN44**: Templates aprovados para IBAN, reserva, lembrete e pagamento. `[x]`
- **RN45**: Desconto, troca, comprovativo ilegivel, cliente irritado, cancelamento ambiguo → encaminhar para humano. `[x]`
- **RN45A**: Limpeza operacional exige sessao autenticada e confirmacao `LIMPAR`. `[x]`

**Estado**: Totalmente implementado.

---

## 5.7 n8n, IA e Fonte de Verdade (RN46–RN51)

- **RN46**: Backend e fonte de verdade para stock, preco, reserva, pagamento e fila. `[x]`
- **RN47**: n8n nao pode alterar dados fora dos endpoints autorizados. `[x]`
- **RN48**: IA usa apenas dados retornados pelo backend. `[x]`
- **RN49**: IA nao pode inventar preco, stock, prazo, estado ou confirmacao. `[x]`
- **RN50**: Eventos para n8n apenas para tipos permitidos pelo contrato. `[x]`
- **RN51**: n8n indisponivel → eventos ficam na outbox para retry. `[x]`

**Estado**: Totalmente implementado.

---

## 5.8 Operacao do Piloto (RN52–RN57)

- **RN52–RN54**: Cadastrar pecas antes da live, codigos simples, WhatsApp conectado. `[ ]` Processo.
- **RN55**: TikTok falhar → modo manual sem perder reservas. `[x]`
- **RN56**: Live piloto registra metricas completas. `[x]`
- **RN57**: Decisao pos-piloto considera conversao, erros, satisfacao e recorrencia. `[ ]` Processo.

---

## 5.9 CRM de Loja, Clientes e Pedidos (RN58–RN78)

Regras de identidade de cliente, pedidos, descontos, campanhas, relatorios e tarefas.

- **RN58**: Telefone canonico e identificador principal; aliases sociais permitidos. `[~]`
- **RN59**: Fusao so por acao explicita de usuario autorizado. `[x]`
- **RN60**: Cliente com opt-out nao recebe campanha promocional. `[x]`
- **RN61**: Mensagens transacionais permitidas quando necessarias a venda. `[~]`
- **RN62**: Campanhas usam segmentos claros, nunca todos os clientes por padrao. `[x]`
- **RN63**: Todo pedido deve ter cliente, item(s), total e estado. `[x]`
- **RN64**: Pedido pago nao pode ser apagado; so cancelado/devolvido com auditoria. `[x]`
- **RN65**: Desconto exige motivo; acima do limite exige aprovacao de perfil autorizado. `[x]`
- **RN66**: Produto sem stock nao e vendido automaticamente. `[~]` (falta lista de interesse)
- **RN67**: Movimento manual de stock exige motivo e responsavel. `[x]`
- **RN68**: Categoria so existe se melhora filtro/catalogo/relatorio. `[~]`
- **RN69**: Pedido rascunho nao e categoria principal; so aparece em contexto real. `[~]`
- **RN70**: Relatorio so entra no menu se responde pergunta pratica da loja. `[~]`
- **RN71**: Relatorios tecnicos pertencem ao Admin/Sistema. `[x]`
- **RN72**: Conversa sem resposta dentro do SLA → tarefa ou alerta. `[x]`
- **RN73**: VIP, reclamacao e pagamento pendente → prioridade visual superior. `[~]`
- **RN74**: Chatbot autonomo nao assume atendimento critico sem politica/aprovacao humana. `[~]`
- **RN75**: Campanha falhada → registro de falha, sem reenvio infinito. `[~]`
- **RN76**: Tarefa atrasada visivel ate concluida, reagendada ou cancelada com motivo. `[~]`
- **RN77**: Exportacao de clientes respeita permissoes e auditoria. `[x]`
- **RN78**: Configuracoes tecnicas nao acessiveis a vendedor comum. `[~]`

---

## 5.10 CRM+ Social Commerce, Afiliados e WhatsApp Oficial (RN79–RN120)

Regras de atribuicao, comissoes, social inbox, funil, politica WhatsApp e privacidade.

**Nucleo e identidade:**
- **RN79**: Live e um canal; nucleo e cliente/produto/pedido/conversa/pagamento/entrega/campanha/relatorio. `[x]`
- **RN80**: Identidade canonica por telefone/email; aliases sociais como complemento. `[~]`
- **RN81**: Visita anonima so vira cliente com contacto, checkout ou conversa. `[~]`

**Atribuicao e comissoes:**
- **RN82**: Link rastreavel nao sobrescreve dados confirmados sem auditoria. `[~]`
- **RN83**: Atribuicao mostra origem (live, site, WhatsApp, catalogo, campanha, afiliado, criador, social). `[~]`
- **RN84**: Comissao confirmada so apos pedido pago e dentro das regras de atribuicao. `[x]`
- **RN85**: Cancelamento/devolucao/reembolso revertem comissao. `[~]`
- **RN86**: Correcao manual de atribuicao/comissao exige motivo e auditoria. `[~]`
- **RN87**: Afiliados nao veem dados privados de clientes alem do necessario. `[~]`

**Marketing e consentimento:**
- **RN88**: Opt-out bloqueia marketing, campanhas, reactivacao, promocoes de afiliados. `[~]`
- **RN89**: Utilidade para atualizacoes transacionais de pedido/pagamento/entrega. `[~]`
- **RN90**: Autenticacao apenas para OTP, login, validacao de identidade. `[~]`
- **RN91**: Servico depende de interacao do cliente e janela do WhatsApp. `[x]`
- **RN92**: Marketing inclui promocoes, campanhas, novidades, reactivacao, cupoes, cross-sell, afiliados. `[~]`
- **RN93**: Texto promocional proibido em template de utilidade/autenticacao. `[x]`
- **RN94**: Todo envio WhatsApp do sistema passa por politica de categoria. `[~]`
- **RN95**: Template ausente/nao aprovado → tarefa humana em vez de envio errado. `[~]`
- **RN96**: Carrinho abandonado, lead frio, cliente inativo = marketing com consentimento. `[x]`
- **RN97**: Pagamento pendente, recibo, entrega = utilidade sem promocao. `[x]`

**Social Inbox:**
- **RN98**: Comentario `preco?`, `tem M?`, `quero` → lead/oportunidade, nao pedido automatico. `[~]`
- **RN99**: Intencao incerta, reclamacao, desconto, troca, conflito → tarefa humana. `[x]`

**Checkout e tracking:**
- **RN100**: Entrega e total calculados antes da confirmacao do comprador. `[x]`
- **RN101**: Stock so bloqueado em estado configurado; visualizacao nao bloqueia. `[~]`
- **RN102**: Checkout WhatsApp preserva origem do link e produto selecionado. `[x]`
- **RN103**: Cookies armazenam apenas identificadores tecnicos, nunca dados pessoais. `[x]`
- **RN104**: Cliente pode comprar recusando cookies nao essenciais. `[x]`
- **RN105**: Tracking nao confirmado nao e venda; apenas intencao/oportunidade. `[x]`

**Dados sociais:**
- **RN106**: Dados de redes sociais mantem provider, permissoes, link e data. `[x]`
- **RN107**: API social limitada → indicar limitacao e oferecer alternativa. `[~]`

**Automacoes:**
- **RN108**: Automacoes priorizam recuperacao de baixo risco. `[~]`
- **RN109**: Automacoes nao confirmam pagamento, concedem desconto, prometem entrega ou cancelam sem regra/permissao. `[~]`
- **RN110**: Funil permite intervencao manual com motivo e historico. `[~]`

**Modularidade:**
- **RN111**: Negocio pode operar sem loja publica, afiliados ou social inbox. `[~]`
- **RN112**: Modulo desativado → UI nao aparece como promessa vazia. `[~]`
- **RN113**: Links de afiliado expiram quando perfil bloqueado, campanha encerrada ou produto indisponivel. `[~]`
- **RN114**: Comissao estimada visivel para o dono, nao para o cliente final. `[x]`
- **RN115**: Relatorios separam receita bruta, entrega, descontos, comissoes e receita liquida. `[x]`
- **RN116**: Cliente pode pedir remocao/anonimizacao, preservando dados fiscais/financeiros. `[x]`
- **RN117**: Campanha deve ter nome, objetivo, publico, canal, template, janela, limite e metrica. `[x]`
- **RN118**: Campanha deve ter mecanismo de pausa imediata. `[x]`
- **RN119**: Plataforma distingue metrica de vaidade de metrica operacional. `[~]`
- **RN120**: Documento de requisitos atualizado quando novo canal/categoria/regra for adotado. `[ ]` Processo.

---

## 5.11 Fundacao Backend CRM+ (RN121–RN136)

Regras de isolamento multi-negocio, compartilhamento, modulos, transacoes e auditoria.

- **RN121**: Todo dado comercial pertence a um negocio (exceto identidade global e catalogos publicos). `[~]`
- **RN122**: Compartilhamento de cliente exige relacionamento, escopo, motivo e auditoria. `[x]`
- **RN123**: Loja nao ve historico privado de outra sem consentimento/regra. `[~]`
- **RN124**: ClienteGlobal = pessoa; ClienteNegocio = relacao comercial com loja. `[x]`
- **RN125**: Produto, pedido, conversa, campanha, tarefa, afiliado, comissao e tracking carregam origem e negocio. `[~]`
- **RN126**: Modulo desativado nao executa automacao, webhook, campanha nem aparece na UI. `[~]`
- **RN127**: Codigo de produto unico dentro do negocio, nao globalmente. `[x]`
- **RN128**: Pedido e entidade comercial principal; reserva e bloqueio temporario. `[x]`
- **RN129**: Comissao depende de pedido pago, atribuicao valida e ausencia de cancelamento/devolucao. `[x]`
- **RN130**: Tracking ajuda atribuicao, nao substitui prova de pedido/pagamento/consentimento. `[x]`
- **RN131**: Mensagem WhatsApp do sistema precisa de categoria, motivo, entidade e fallback. `[~]`
- **RN132**: Conflito entre automacao e seguranca → preferir tarefa humana. `[~]`
- **RN133**: Exportacao so por usuario autorizado, com auditoria. `[x]`
- **RN134**: Alteracao manual em pagamento/desconto/comissao/stock/atribuicao/fusao exige responsavel e motivo. `[~]`
- **RN135**: Dados de redes sociais mantem provider, permissoes, link e data. `[x]`
- **RN136**: Backend permite operacao minima sem loja publica, afiliados ou social inbox. `[~]`

---

## 5.12 Mapa de Navegacao Pretendido

| Area | Deve ficar | Deve sair/ficar oculto |
|---|---|---|
| Painel | Hoje, pendencias, tarefas, metricas uteis, alertas | Cards tecnicos, logs crus, estatisticas vazias |
| Pedidos | Todos, pagamento pendente, preparacao, entrega, cancelados | Drafts solto, calendario sem fluxo, resumo duplicado |
| Produtos | Todos, colecoes, stock baixo, importacao, catalogo WhatsApp | Categoria vazia, descontos sem aprovacao |
| Clientes | Lista, perfil 360, segmentos, importacao, exportacao auditada | Campos sem uso comercial |
| Conversas | Caixa de entrada, templates, tarefas, pedidos vinculados, SLA | Chatbot como menu principal |
| Campanhas | Transmissoes autorizadas, segmentos, metricas, opt-out | Disparo generico sem consentimento |
| Relatorios | Vendas, clientes, produtos, atendimento, campanhas | Explorar vazio, relatorios tecnicos |
| Config Loja | Dados, equipa, pagamentos, entrega, mensagens rapidas | n8n, tokens, providers para vendedor |
| Admin/Sistema | Saude tecnica, n8n, providers, webhooks, auditoria | Nao aparece para perfis comerciais |

---

## Ligacoes

- [[requisitos-funcionais-bizy]] — RFs do Bizy
- [[requisitos-nao-funcionais-bizy]] — RNFs do Bizy
- [[requisitos-bizy-market]] — RN do Bizy Market
- [[fluxos-operacionais-bizy]] — Fluxos Operacionais
- [[dominio-e-entidades-bizy]] — Dominio e Entidades
- `docs/RF-RNF-RN-EMEUV1.md` — Documento fonte completo
