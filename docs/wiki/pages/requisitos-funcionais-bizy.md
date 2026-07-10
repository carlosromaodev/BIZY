---
title: Requisitos Funcionais do Bizy
aliases:
  - RF Bizy
  - Requisitos Funcionais
tags:
  - bizy/requisitos
  - bizy/rf
status: ativo
updated: 2026-07-10
---

# Requisitos Funcionais do Bizy

> [!info] Fonte principal
> Sintese organizada por modulo a partir de `docs/RF-RNF-RN-EMEUV1.md` v1.107 (340 RFs).
> Para o Bizy Market e Lojas Digitais, ver [[requisitos-bizy-market]].

## Cobertura Geral

| Metrica | Valor |
|---|---|
| Total de RFs | 340 (RF01–RF340) |
| Implementados `[x]` | ~215 (63%) |
| Parciais `[~]` | ~55 (16%) |
| Planeados `[ ]` | ~70 (21%) |

---

## 3.1 Autenticacao e Sessao (RF01–RF07G)

Login por telefone angolano, SMS, Gmail OAuth, identidade estudantil UOR/ISPTEC, sessao segura e onboarding de negocio.

- **RF01–RF06**: Login por telefone com SMS, codigo expiravel, sessao autenticada. `[x]`
- **RF07**: Encerrar sessao pelo painel. `[x]`
- **RF07A**: Login estudantil UOR/ISPTEC. `[x]`
- **RF07B**: Login Gmail via OAuth. `[x]`
- **RF07C**: Identidade separada de telefone (telefone, Gmail, estudantil). `[x]`
- **RF07D**: Persistencia de origem, email, avatar e perfil academico. `[x]`
- **RF07E**: Onboarding pos-login (negocio, canais, pagamentos, regra de reserva). `[x]`
- **RF07F**: Criar primeiro produto no onboarding. `[x]`
- **RF07G**: Feedback claro quando Gmail OAuth nao esta configurado. `[x]`

**Estado**: Totalmente implementado.

---

## 3.2 Catalogo de Pecas (RF08–RF14)

CRUD de produtos com codigo unico por negocio, fotos, estados de stock.

- **RF08–RF14**: Cadastrar, listar, pesquisar, editar, desativar pecas; foto opcional; estado visivel (disponivel, reservada, vendida, esgotada). `[x]`

**Estado**: Totalmente implementado.

---

## 3.3 Captura de Comentarios de Live (RF15–RF20)

Conexao TikTok, captura em tempo real, normalizacao, modo manual.

- **RF15–RF20**: Conectar por username, capturar e normalizar comentarios, selecionar provider, modo manual como fallback. `[x]`

**Estado**: Totalmente implementado.

---

## 3.4 Parser de Intencao (RF21–RF28)

Identificacao de intencao de compra em portugues informal, extracao de telefone e codigo, confianca, revisao manual.

- **RF21–RF28**: Intencao, telefone angolano, codigo de peca, confianca, marcacao de ambiguos, variacoes de linguagem, dicionario por negocio, multiplas pecas. `[x]`

**Estado**: Totalmente implementado.

---

## 3.5 Revisao Manual (RF29–RF33)

Listagem de pendentes, correcao de telefone/codigo, aprovacao/rejeicao.

- **RF29–RF33**: Listar, corrigir, aprovar, rejeitar, criacao de reserva em ate 10s. `[x]`

**Estado**: Totalmente implementado.

---

## 3.6 Motor de Reservas e Fila (RF34–RF43)

Reserva automatica, fila de espera, bloqueio de stock, expiracao, promocao de fila, cancelamento.

- **RF34–RF43**: Primeiro valido ganha reserva, fila quando sem stock, deduplicacao, expiracao configuravel, promocao automatica, cancelamento manual, confirmacao de pagamento. `[x]`

**Estado**: Totalmente implementado.

---

## 3.7 Painel Operacional (RF44–RF49)

Estado da live, SSE em tempo real, metricas de operacao, atividade recente.

- **RF44–RF49**: Painel com estado, SSE, destaque de expiracao, acoes rapidas em 2 cliques, metricas e atividade recente. `[x]`

**Estado**: Totalmente implementado.

---

## 3.8 WhatsApp e Atendimento (RF50–RF56A)

Evolution API, QR Code, mensagens automaticas, webhooks, templates, historico, limpeza operacional.

- **RF50–RF56A**: Conectar via Evolution/Cloud API, mensagens automaticas por evento, webhooks normalizados, envio manual, templates, historico com contexto, limpeza controlada. `[x]`

**Estado**: Totalmente implementado.

---

## 3.9 Pagamento e Pos-Venda (RF57–RF63A)

Comprovativo, confirmacao/rejeicao, entrega, exportacao, recibo PDF.

- **RF57–RF63A**: Comprovativo por URL/dataUrl, confirmar/rejeitar com motivo, estado no painel, endereco de entrega, marcar entregue, lista de entregas, recibo PDF. `[x]`

**Estado**: Totalmente implementado.

---

## 3.10 n8n e Automacoes (RF64–RF70)

Eventos assinados, outbox com retry, endpoints n8n, guardrails, aprovacao humana.

- **RF64–RF70**: Webhook assinado, outbox, endpoints `/n8n/*`, consulta contextual, aprovacao humana, estado operacional. `[x]`

**Estado**: Totalmente implementado.

---

## 3.11 Configuracoes e Piloto (RF71–RF75)

Variaveis de ambiente, sem URLs hardcoded, metricas de piloto, relatorio de live.

- **RF71–RF75**: Configuracao por env, sem hardcode, painel de config, metricas e relatorio de piloto. `[x]`

**Estado**: Totalmente implementado.

---

## 3.12 CRM e Atendimento Completo

Backlog vivo do CRM: cliente persistente, conversa por canal, timeline, webhooks Evolution por tipo, politicas de automacao, aprovacao humana, rastreabilidade, exportacao CRM.

Todos os itens marcados `[x]` — inclui entidade de cliente, conversa com SLA, timeline de mensagens, deduplicacao idempotente, limpeza operacional, politicas de automacao, aprovacao humana para IA e exportacao pos-live.

**Estado**: Totalmente implementado no backend.

---

## 3.13 CRM Completo de Loja (RF76–RF151)

### 3.13.1 Navegacao Comercial (RF76–RF84)

Navegacao principal reduzida a Painel, Pedidos, Produtos, Clientes, Conversas, Campanhas, Relatorios e Configuracoes. Funcionalidades tecnicas em Admin/Sistema. Pesquisa global. Dock mobile com 5 atalhos.

- Maioria `[x]`; RF80 pesquisa global `[~]` (falta busca em anexos/comprovativos); RF83 estados vazios `[~]` (falta revisao fina).

### 3.13.2 Clientes 360 (RF85–RF96)

Lista, cadastro manual, importacao CSV, perfil 360, deduplicacao, fusao, segmentacao, acoes rapidas, preferencias, indicadores, estados, exportacao auditada.

- RF85 `[~]` (faltam WhatsApp/ultimo pedido/responsavel na UI); RF88 `[~]` (falta historico campanhas no perfil); RF89 `[~]` (faltam aliases sociais completos); RF92 `[~]` (faltam acoes diretas na UI).
- Restantes `[x]`.

### 3.13.3 Pedidos, Cobranca e Entrega (RF97–RF111)

Reservas evoluem para pedidos, pedido manual, multiplos itens, funil de estados, cobranca WhatsApp, comprovativos, desconto com auditoria, endereco reutilizavel, listas de preparacao/entrega, exportacao.

- RF98 `[~]` (falta acao na conversa/UI); RF100 `[~]` (falta UI kanban); RF108 `[~]` (falta carrinho persistente).
- Restantes `[x]`.

### 3.13.4 Produtos, Stock e Catalogo Comercial (RF112–RF121)

SKU, fotos, custo, margem, colecoes, variantes, alertas de stock, historico de movimentos, importacao CSV, arquivar.

- RF113 `[~]` (faltam telas de gestao de colecoes); RF114 `[~]` (falta frontend ocultar categorias vazias); RF120 `[~]` (faltam catalogos por campanha).
- Restantes `[x]`.

### 3.13.5 Conversas, Campanhas e Atendimento (RF122–RF132)

Inbox comercial unificado, conversa vinculada a cliente/pedido, resposta por WhatsApp, proximas acoes, campanhas segmentadas, opt-out, filtros uteis.

- RF122–RF124 `[~]` (falta polimento UI e vinculo visual; envio binario real fechado em 2026-07-10); RF126 `[~]` (falta remover promessa visual antiga de chatbot); RF129 `[~]` (falta atualizacao por webhooks); RF131 `[~]` (falta sequenciador temporal).
- Restantes `[x]`.

### 3.13.6 Relatorios que a Loja Usa (RF133–RF143)

Vendas do dia, ranking de produtos, atendimento, campanhas, oportunidades perdidas, retencao, exportacao CSV/PDF, resumo diario.

- RF137 `[ ]` (pagina Explorar nao deve existir como relatorio vazio).
- Restantes `[x]`.

### 3.13.7 Tarefas, Equipa e Rotina (RF144–RF151)

Tarefas manuais e automaticas, responsavel, prazo, prioridade, minhas tarefas no Painel, papeis minimos, permissoes, transferencia, auditoria.

- Todos `[x]`.

---

## 3.14 CRM+ Social Commerce (RF152–RF244)

### 3.14.1 Posicionamento e Arquitetura (RF152–RF156)

Perfis de negocio extensiveis, modulos ativaveis, onboarding completo, painel com indicadores de dinheiro e operacao.

- RF152–RF156 maioria `[~]` (faltam UI, matriz de modulos, composicao final em painel).

### 3.14.2 Loja Virtual e Catalogo Digital (RF157–RF164)

Loja por slug, produtos publicos, checkout WhatsApp/site, catalogos digitais, destaque, SEO e preview social.

- RF157 `[~]` (falta dominio personalizado e frontend completo); RF159–RF164 maioria `[~]` (faltam UI publica, selecao avancada de variante, catalogos por campanha, resumo PDF, montra final, tags SEO no frontend).
- RF158, RF162 `[x]`.

### 3.14.3 Checkout WhatsApp/Site (RF165–RF174)

Mensagem pre-preenchida, pedido/carrinho, calculo de entrega, total, compra sem conta, carrinho abandonado, orcamento.

- RF165, RF167, RF169, RF170, RF173 `[x]`.
- RF166, RF168, RF171, RF172, RF174 `[~]` (faltam carrinho persistente, descontos publicos, acao na conversa, criacao por social, UI operacional).

### 3.14.4 Links Rastreaveis e Atribuicao (RF175–RF184)

Links por produto/campanha/afiliado, UTM, tracking anonimo, modelos de atribuicao, eventos server-side, seguranca.

- RF180, RF183, RF184 `[x]`.
- RF175–RF179, RF181, RF182 `[~]` (faltam catalogo selecionavel, UI, associacao retroativa, consentimento visual).

### 3.14.5 Afiliados, Criadores e Revendedores (RF185–RF196)

Perfis de parceiro, links proprios, mini-loja, comissao por produto/colecao/campanha, reversao, lotes financeiros, antifraude, pacote de divulgacao, modo revendedor.

- RF185, RF191, RF192, RF193, RF194, RF196 `[x]`.
- RF186–RF190, RF195 `[~]` (faltam colecoes autorizadas, catalogos, UI do afiliado, receita liquida, regra por meta).

### 3.14.6 Social Inbox (RF197–RF208)

Contas sociais conectadas, captura controlada, normalizacao, classificacao de intencao, geracao de lead/conversa/tarefa, deduplicacao, filtros, relatorio social-receita.

- RF197, RF199, RF200, RF202, RF204, RF205, RF206, RF207, RF208 `[x]`.
- RF198, RF201, RF203 `[~]` (faltam worker/conector ativo, pedido direto por social, envio direto pelo provider social).

### 3.14.7 Funil, Automacao e Recuperacao (RF209–RF216)

Funil com etapas padronizadas, movimentacao automatica, playbooks de recuperacao, condicoes, acoes, oportunidades perdidas.

- RF209–RF216 todos `[~]` (faltam UI, pos-venda automatico, recompra, validacao por segmento, acoes alem de tarefa, geracoes por evento, relatorio agregado).

### 3.14.8 WhatsApp Oficial (RF217–RF230)

Classificacao por categoria (marketing/utilidade/autenticacao/servico), janela de servico, templates, ciclo de vida, politica.

- RF218, RF223, RF224, RF229 `[x]`.
- RF217, RF219–RF222, RF225–RF228 `[~]` (faltam UI de configuracao, amarracao de todos os eventos, OTP completo, colunas dedicadas, opt-out granular).
- RF230 `[ ]` (processo de revisao periodica).

### 3.14.9 Flexibilidade e Modularidade (RF231–RF244)

Canais independentes, modulos por configuracao, moeda AOA, multi-loja, alimentacao de nucleo unico, fallback humano.

- RF233–RF236 `[x]`.
- RF231, RF232, RF237–RF244 maioria `[~]` (faltam matriz de combinacoes, ocultacao UI, multi-moeda, bus unico, pausa unificada).
- RF241 `[ ]` (estados vazios com proxima acao).

---

## 3.15 Fundacao Backend CRM+ (RF245–RF270)

Multi-negocio, multi-tenant, modulos, permissoes, auditoria, contratos versionados, migrations, bootstrap.

- RF245–RF249, RF251, RF253, RF263, RF264, RF268, RF269 `[x]`.
- RF250, RF252, RF254–RF262, RF265–RF267, RF270 `[~]` (faltam varredura final, segmentacao completa, catalogos, bus unico, testes de repositorio).

---

## 3.16 Modulos de Evolucao (RF271–RF340)

### 3.16.1 Painel e Resumo Diario (RF271–RF274)

- RF271–RF273 `[~]` (faltam composicao UI, polimento visual, envio automatico).
- RF274 `[ ]` (personalizacao do painel por utilizador).

### 3.16.2 Funil Comercial standalone (RF275–RF279)

- RF275–RF277 `[~]` (faltam UI kanban, UI de intervencao).
- RF278–RF279 `[ ]` (valor por etapa, anti-regressao).

### 3.16.3 Entregas e Logistica (RF280–RF285)

- RF280–RF282 `[~]` (faltam UI de zonas, preparacao, mapa/rota).
- RF283–RF285 `[ ]` (atribuir entregador, tracking simplificado, tempo medio).

### 3.16.4 Notificacoes Internas (RF286–RF293)

- Todos `[ ]` — planeados.

### 3.16.5 Pipeline de Vendas (RF294–RF300)

- Todos `[ ]` — planeados. Kanban configuravel, arrastar entre etapas, valor estimado.

### 3.16.6 Agenda e Lembretes (RF301–RF306)

- Todos `[ ]` — planeados. Lembretes vinculados, vista diaria/semanal, recorrencia.

### 3.16.7 Metas de Vendas (RF307–RF312)

- Todos `[ ]` — planeados. Meta por periodo, por vendedor, progresso visual.

### 3.16.8 Cotacoes e Orcamentos (RF313–RF318)

- Todos `[ ]` — planeados. Cotacao com validade, envio por WhatsApp, conversao em pedido.

### 3.16.9 Respostas Rapidas (RF319–RF323)

- Todos `[ ]` — planeados. Biblioteca por categoria, variaveis dinamicas, atalhos.

### 3.16.10 Notas e Historico de Actividades (RF324–RF328)

- Todos `[ ]` — planeados. Notas manuais, timeline unificada, filtros por tipo.

### 3.16.11 Formularios de Captacao de Leads (RF329–RF334)

- Todos `[ ]` — planeados. Formulario simples, link partilhavel, criacao automatica de cliente.

### 3.16.12 Sequencias Automaticas (RF335–RF340)

- Todos `[ ]` — planeados. Sequencias de boas-vindas/cobranca/pos-venda/reactivacao, espera configuravel, pausa por resposta.

---

## Rastreabilidade Resumida

| Modulo | RFs | RNFs relacionados | RNs relacionados |
|---|---|---|---|
| Autenticacao | RF01–RF07G | RNF19–RNF29 | RN52–RN54 |
| Catalogo | RF08–RF14 | RNF30–RNF35 | RN11–RN17 |
| Captura e Parser | RF15–RF28 | RNF08–RNF18 | RN01–RN10 |
| Revisao Manual | RF29–RF33 | RNF36–RNF47 | RN29–RN33 |
| Reservas e Fila | RF34–RF43 | RNF13–RNF18 | RN18–RN28 |
| Painel | RF44–RF49 | RNF36–RNF40 | RN56–RN57 |
| WhatsApp | RF50–RF56A | RNF19–RNF35 | RN40–RN45 |
| Pagamentos | RF57–RF63A | RNF30–RNF47 | RN34–RN39 |
| n8n | RF64–RF70 | RNF22–RNF35 | RN46–RN51 |
| Configuracao | RF71–RF75 | RNF48–RNF53 | RN52–RN57 |
| CRM Loja | RF76–RF151 | RNF55–RNF72 | RN58–RN78 |
| CRM+ Social Commerce | RF152–RF244 | RNF73–RNF95 | RN79–RN120 |
| Fundacao Backend | RF245–RF270 | RNF96–RNF110 | RN121–RN136 |
| Painel/Resumo Diario | RF271–RF274 | RNF55–RNF58 | RN70 |
| Funil Comercial | RF275–RF279 | RNF66 | RN110 |
| Entregas/Logistica | RF280–RF285 | RNF55–RNF56 | RN100 |
| Notificacoes | RF286–RF293 | RNF55, RNF62 | — |
| Pipeline Vendas | RF294–RF300 | RNF66 | RN110 |
| Agenda/Lembretes | RF301–RF306 | RNF55 | RN70 |
| Metas Vendas | RF307–RF312 | RNF55 | — |
| Cotacoes | RF313–RF318 | RNF55 | RN64 |
| Respostas Rapidas | RF319–RF323 | — | — |
| Notas/Actividades | RF324–RF328 | RNF55 | — |
| Formularios Leads | RF329–RF334 | RNF73 | — |
| Sequencias | RF335–RF340 | RNF62 | RN85 |

---

## Ligacoes

- [[requisitos-nao-funcionais-bizy]] — RNFs do Bizy
- [[regras-de-negocio-bizy]] — Regras de Negocio do Bizy
- [[requisitos-bizy-market]] — RF/RNF/RN do Bizy Market e Lojas Digitais
- [[mapa-de-modulos-bizy]] — Mapa de Modulos
- [[prioridades-lancamento-bizy]] — Prioridades de Lancamento
- `docs/RF-RNF-RN-EMEUV1.md` — Documento fonte completo
