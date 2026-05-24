# Bizy / ÉMeu V1 - Requisitos Funcionais, Não Funcionais e Regras de Negócio

Documento: `RF-RNF-RN-EMEUV1.md`
Versão: 1.2
Data: 2026-05-24
Autor: Carlos
Status: MVP base implementado; próxima etapa CRM de loja em planeamento

---

## 1. Objetivo do Documento

Este documento formaliza os requisitos funcionais, requisitos não funcionais e regras de negócio do ÉMeu V1, considerando:

- O estado atual do projeto ÉMeu.
- O relatório técnico `RELATORIO-COMPLETO-EMEU.md`.
- O escopo de MVP piloto para automação de vendas em lives em Angola.

O objetivo é servir como base para implementação, testes, validação do piloto e criação de issues/tarefas.

Atualização 1.1: o documento passa a orientar a evolução do Bizy para um CRM completo de loja, com foco em clientes, pedidos, produtos, conversas WhatsApp, campanhas, relatórios úteis e remoção de navegação/informação que não ajuda a operação diária.

Atualização 1.2: adicionada a frente de identidade e onboarding, com login por telefone, Gmail e UOR/ISPTEC, persistência de identidade separada do telefone, cadastro do negócio e produto inicial como base para o CRM.

---

## 2. Legenda

### Prioridade

| Código | Significado |
|---|---|
| Alta | Obrigatório para piloto funcional |
| Média | Importante para boa operação, mas não bloqueia primeiro teste |
| Baixa | Melhoria ou preparação para evolução |

### Estado

Use estes marcadores como checklist de acompanhamento:

- `[x]` concluído no código atual.
- `[~]` existe parcialmente e precisa ser completado.
- `[ ]` ainda exige ação, decisão operacional ou implementação futura.

| Estado | Significado |
|---|---|
| [x] Implementado | Já existe no código atual |
| [~] Parcial | Existe parcialmente, mas precisa completar |
| [ ] Planeado | Deve ser implementado para o piloto ou pós-piloto |
| [ ] Pós-MVP | Fora do escopo imediato do piloto |
| [ ] Em escopo CRM | Saiu do fora de escopo e entra na próxima etapa CRM |
| [ ] Parcial CRM | Parte entra na próxima etapa CRM; parte continua para evolução posterior |
| [ ] Processo | Regra operacional do piloto, não necessariamente implementação de código |

---

## 3. Requisitos Funcionais (RF)

### 3.1 Autenticação e Sessão

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF01 | O sistema deve permitir login por telefone móvel angolano. | Alta | [x] Implementado |
| RF02 | O sistema deve enviar código SMS de autenticação usando provider configurável, inicialmente Ombala. | Alta | [x] Implementado |
| RF03 | O sistema deve confirmar o código SMS e criar uma sessão autenticada para o vendedor. | Alta | [x] Implementado |
| RF04 | O código SMS deve expirar no tempo configurado e não pode ser reutilizado. | Alta | [x] Implementado |
| RF05 | Em ambiente de desenvolvimento, o sistema pode expor o código para facilitar testes. | Média | [x] Implementado |
| RF06 | Em produção, o sistema não deve expor código SMS em resposta, UI ou logs públicos. | Alta | [x] Implementado |
| RF07 | O vendedor deve poder encerrar a sessão pelo painel. | Alta | [x] Implementado |
| RF07A | O sistema deve permitir login estudantil por UOR/ISPTEC usando o mesmo padrão de validação do UOR Connect. | Alta | [x] Implementado |
| RF07B | O sistema deve permitir login com Gmail via OAuth quando `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estiverem configurados. | Alta | [x] Implementado |
| RF07C | O sistema deve separar identidade de telefone, permitindo usuários com telefone, Gmail ou identidade estudantil sem criar números falsos. | Alta | [x] Implementado |
| RF07D | O sistema deve persistir origem do cadastro, email, avatar e perfil académico quando esses dados forem devolvidos pelo provedor de autenticação. | Alta | [x] Implementado |
| RF07E | Após o primeiro login, o usuário deve passar por onboarding para cadastrar negócio, canais de venda, pagamentos e regra padrão de reserva. | Alta | [x] Implementado |
| RF07F | O onboarding deve permitir criar o primeiro produto ligado ao negócio antes de entrar na operação diária. | Alta | [x] Implementado |
| RF07G | O login com Gmail deve informar claramente quando as credenciais OAuth ainda não estiverem configuradas. | Média | [x] Implementado |

### 3.2 Catálogo de Peças

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF08 | O vendedor deve poder cadastrar peça com código, nome, descrição, preço e quantidade. | Alta | [x] Implementado |
| RF09 | O código da peça deve ser único no catálogo. | Alta | [x] Implementado |
| RF10 | O vendedor deve poder listar e pesquisar peças por nome ou código. | Alta | [x] Implementado |
| RF11 | O vendedor deve poder editar preço, quantidade, nome, descrição, fotos e estado da peça. | Alta | [x] Implementado |
| RF12 | O vendedor deve poder desativar ou remover uma peça que não será vendida na live. | Média | [x] Implementado |
| RF13 | O catálogo deve aceitar foto opcional da peça via URL ou placeholder. | Média | [x] Implementado |
| RF14 | O painel deve mostrar o estado da peça: disponível, reservada, vendida ou esgotada. | Alta | [x] Implementado |

### 3.3 Captura de Comentários de Live

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF15 | O sistema deve conectar numa live do TikTok pelo `username` ou `uniqueId`. | Alta | [x] Implementado |
| RF16 | O sistema deve capturar comentários da live em tempo real. | Alta | [x] Implementado |
| RF17 | O sistema deve normalizar comentários capturados para um formato interno único. | Alta | [x] Implementado |
| RF18 | O sistema deve permitir selecionar provider de captura: TikTok principal, TikTok Python ou manual. | Alta | [x] Implementado |
| RF19 | O sistema deve fornecer modo manual para simular ou registrar comentários quando a captura automática falhar. | Alta | [x] Implementado |
| RF20 | O painel deve exibir comentários capturados em tempo real. | Alta | [x] Implementado |

### 3.4 Parser de Intenção

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF21 | O sistema deve identificar intenção de compra em português informal. | Alta | [x] Implementado |
| RF22 | O sistema deve extrair telefone móvel angolano válido do comentário. | Alta | [x] Implementado |
| RF23 | O sistema deve extrair código da peça independentemente da ordem do telefone e do código. | Alta | [x] Implementado |
| RF24 | O sistema deve calcular nível de confiança da interpretação. | Alta | [x] Implementado |
| RF25 | O sistema deve marcar comentários ambíguos para revisão manual. | Alta | [x] Implementado |
| RF26 | O sistema deve suportar variações como `peça 4`, `peca 4`, `#4`, `produto 4`, `item 4` e código livre. | Alta | [x] Implementado |
| RF27 | O sistema deve permitir evoluir o parser com dicionário de termos por loja ou por segmento. | Baixa | [ ] Pós-MVP |
| RF28 | Quando o comentário mencionar mais de uma peça, o sistema deve permitir criar múltiplas reservas vinculadas ao mesmo telefone. | Média | [x] Implementado |

### 3.5 Revisão Manual

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF29 | O painel deve listar comentários pendentes de revisão manual. | Alta | [x] Implementado |
| RF30 | O vendedor deve poder corrigir telefone, código da peça e observação de um comentário em revisão. | Alta | [x] Implementado |
| RF31 | O vendedor deve poder aprovar manualmente um comentário e forçar a criação da reserva. | Alta | [x] Implementado |
| RF32 | O vendedor deve poder rejeitar ou ignorar um comentário em revisão. | Alta | [x] Implementado |
| RF33 | A aprovação manual deve criar reserva em até 10 segundos em condições normais. | Alta | [x] Implementado |

### 3.6 Motor de Reservas e Fila

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF34 | O sistema deve criar reserva automática para o primeiro comentário válido. | Alta | [x] Implementado |
| RF35 | O sistema deve impedir reservas duplicadas ativas para o mesmo telefone e mesma peça. | Alta | [x] Implementado |
| RF36 | O sistema deve colocar o cliente em fila de espera quando não houver stock livre. | Alta | [x] Implementado |
| RF37 | Reservas ativas devem bloquear stock durante o prazo de pagamento. | Alta | [x] Implementado |
| RF38 | O sistema deve expirar reservas não pagas após o prazo configurado. | Alta | [x] Implementado |
| RF39 | O prazo padrão do MVP deve ser configurável, com recomendação de 15 minutos para piloto. | Alta | [x] Implementado |
| RF40 | Ao expirar ou cancelar uma reserva, o sistema deve promover automaticamente o primeiro cliente da fila. | Alta | [x] Implementado |
| RF41 | O vendedor deve poder cancelar uma reserva manualmente. | Alta | [x] Implementado |
| RF42 | O vendedor deve poder confirmar pagamento de uma reserva. | Alta | [x] Implementado |
| RF43 | O sistema deve atualizar o estado da peça quando todo o stock for vendido. | Alta | [x] Implementado |

### 3.7 Painel Operacional

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF44 | O painel deve mostrar estado da live, comentários, reservas, stock, fila e integrações. | Alta | [x] Implementado |
| RF45 | O painel deve atualizar dados em tempo real via SSE. | Alta | [x] Implementado |
| RF46 | O painel deve destacar reservas próximas da expiração. | Alta | [x] Implementado |
| RF47 | O painel deve permitir ações rápidas em até 2 cliques para confirmar pagamento e cancelar reserva. | Alta | [x] Implementado |
| RF48 | O painel deve mostrar métricas de operação: reservas criadas, pagas, pendentes, fila e conversão. | Alta | [x] Implementado |
| RF49 | O painel deve exibir atividade recente com eventos de reserva, pagamento, expiração e mensagens. | Média | [x] Implementado |

### 3.8 WhatsApp e Atendimento

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF50 | O sistema deve permitir conectar WhatsApp via Evolution API com QR Code ou código de pareamento. | Alta | [x] Implementado |
| RF51 | O painel deve permitir criar, conectar, consultar, definir padrão e remover instâncias Evolution. | Alta | [x] Implementado |
| RF52 | O sistema deve enviar mensagens automáticas de reserva, fila, expiração, pagamento, cancelamento e peça vendida. | Alta | [x] Implementado |
| RF52A | Quando o comentário tiver telefone, mas a peça estiver ausente ou não existir no catálogo, o sistema deve contactar o cliente e pedir o código da peça. | Alta | [x] Implementado |
| RF53 | O sistema deve receber e normalizar webhooks de mensagens recebidas pela Evolution API. | Alta | [x] Implementado |
| RF54 | O vendedor deve poder enviar mensagem manual pelo painel sem sair do ÉMeu. | Alta | [x] Implementado |
| RF55 | O painel deve oferecer templates de WhatsApp para IBAN, reserva, lembrete, pagamento confirmado e atendimento. | Alta | [x] Implementado |
| RF56 | A página de conversas deve mostrar histórico do cliente, reserva atual e contexto operacional. | Alta | [x] Implementado |
| RF56A | O vendedor deve poder limpar, com confirmação explícita, dados operacionais de comentários, histórico de atendimento, outbox/mensagens WhatsApp e códigos SMS sem apagar produtos, reservas, usuários ou conexão WhatsApp. | Média | [x] Implementado |

### 3.9 Pagamento e Pós-Venda

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF57 | O sistema deve registrar comprovativo de pagamento recebido por URL externa ou ficheiro `dataUrl` de imagem/PDF. | Alta | [x] Implementado |
| RF58 | O vendedor ou fluxo autorizado deve poder confirmar pagamento. | Alta | [x] Implementado |
| RF59 | O vendedor ou fluxo autorizado deve poder rejeitar pagamento com motivo. | Alta | [x] Implementado |
| RF60 | O estado de pagamento deve ser exibido no painel de reservas e conversas. | Alta | [x] Implementado |
| RF61 | O sistema deve atualizar endereço de entrega após pagamento confirmado. | Média | [x] Implementado |
| RF62 | O sistema deve marcar pedido como entregue por endpoint controlado. | Média | [x] Implementado |
| RF63 | O sistema deve exportar lista de entregas ao final da live. | Média | [x] Implementado |
| RF63A | O sistema deve emitir recibo PDF autenticado para cada reserva. | Média | [x] Implementado |

### 3.10 n8n e Automações

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF64 | O backend deve publicar eventos de venda para o n8n por webhook assinado. | Alta | [x] Implementado |
| RF65 | Eventos destinados ao n8n devem ser persistidos em outbox antes da publicação ou para retry. | Alta | [x] Implementado |
| RF66 | O backend deve expor endpoints `/n8n/*` para consulta contextual e ações controladas. | Alta | [x] Implementado |
| RF67 | O n8n deve poder consultar cliente, reservas ativas e produto antes de responder ao cliente. | Alta | [x] Implementado |
| RF68 | O n8n deve encaminhar casos sensíveis para aprovação humana. | Alta | [x] Implementado |
| RF69 | O painel deve mostrar workflows, guardrails e estado operacional das automações. | Média | [x] Implementado |
| RF70 | O painel deve mostrar eventos pendentes, falhados e publicados da outbox n8n. | Média | [x] Implementado |

### 3.11 Configurações e Piloto

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF71 | URLs, tokens e segredos devem ser configurados por variáveis de ambiente. | Alta | [x] Implementado |
| RF72 | O frontend não deve depender de URLs hardcoded para n8n, Evolution ou backend em produção. | Alta | [x] Implementado |
| RF73 | O painel deve mostrar configurações operacionais em execução. | Média | [x] Implementado |
| RF74 | O sistema deve registrar métricas úteis para piloto: comentário, reserva, revisão, pagamento e expiração. | Alta | [x] Implementado |
| RF75 | O sistema deve permitir gerar relatório de live piloto com métricas e feedback. | Média | [x] Implementado |

### 3.12 CRM e Atendimento Completo - Passos Pretendidos

Esta secção é o backlog vivo do CRM. Deve permanecer neste documento como fonte central de fluxo, expectativas e lacunas do projeto.

- [x] Criar entidade persistente de cliente com telefone, nome, username, origem, tags, consentimento, primeira interação, última interação e métricas de compra.
- [x] Criar entidade persistente de conversa por cliente, canal e linha WhatsApp, com estado operacional, prioridade, responsável e timestamps de SLA.
- [x] Criar timeline persistente de mensagens de atendimento separada da auditoria, cobrindo comentário da live, WhatsApp recebido, WhatsApp enviado, eventos de reserva, comprovativos, notas internas e ações humanas.
- [x] Separar webhooks Evolution por tipo: mensagem recebida do cliente, mensagem enviada pelo sistema, atualização de entrega/leitura/falha e eventos técnicos de conexão.
- [x] Tratar `messages.update` com erro da Evolution como falha assíncrona real, marcando a mensagem como falhada e reenfileirando quando houver conteúdo recuperável.
- [x] Adicionar playbook operacional para falhas técnicas da Evolution/Baileys, como `Bad MAC`, `No session record` and `No matching sessions`, com diagnóstico no painel e ação guiada para reconectar/reiniciar a instância WhatsApp.
- [x] Adicionar diagnóstico específico para Evolution `OPEN` que envia para o próprio número, mas retorna `ERROR` sem detalhe para números externos, indicando bloqueio/limitação do provider e ação de migração.
- [x] Implementar provider alternativo oficial para envio WhatsApp via WhatsApp Cloud API, mantendo Evolution apenas como conector não oficial/fallback durante o piloto.
- [x] Permitir que o provider WhatsApp Cloud API use template aprovado configurado por `WHATSAPP_CLOUD_DEFAULT_TEMPLATE_NAME` para contactos iniciados pelo sistema fora da janela de conversa livre.
- [x] Exibir na página de conversas o estado real de cada mensagem: pendente, enviada, entregue, lida, falhada ou reprocessada.
- [x] Permitir responder ao cliente diretamente pela conversa, usando texto livre, templates, anexos e mensagens rápidas.
- [x] Permitir atribuir conversa a vendedor ou agente, transferir atendimento e filtrar por responsável.
- [x] Adicionar estados de conversa como nova, aberta, aguardando cliente, aguardando pagamento, aguardando humano, resolvida e encerrada.
- [x] Adicionar tags operacionais como pagamento, comprovativo, entrega, desconto, troca, reclamação e prioridade alta.
- [x] Adicionar notas internas visíveis apenas à equipa, sem envio ao cliente.
- [x] Adicionar contador de não lidas baseado em mensagens inbound ainda não vistas pelo vendedor.
- [x] Adicionar ações rápidas na conversa: confirmar pagamento, rejeitar comprovativo, cancelar reserva, pedir comprovativo, pedir endereço e marcar entregue.
- [x] Adicionar histórico do cliente com compras pagas, reservas expiradas/canceladas, fila de espera e taxa de conversão.
- [x] Adicionar painel de saúde do atendimento: mensagens falhadas, conversas abertas, SLA vencido, mensagens pendentes e outbox WhatsApp.
- [x] Adicionar deduplicação idempotente para comentários de live e webhooks Evolution usando identificadores do provider sempre que disponíveis.
- [x] Adicionar limpeza operacional controlada para comentários, histórico CRM, outbox/mensagens WhatsApp e códigos SMS, preservando reservas, catálogo, usuários e instâncias WhatsApp.
- [x] Adicionar políticas de automação por conversa: automático permitido, sugerir resposta, exigir humano ou bloquear IA.
- [x] Adicionar aprovação humana para respostas sugeridas por IA antes de enviar em casos sensíveis.
- [x] Adicionar rastreabilidade de cada decisão automática: regra usada, dados consultados, confiança e ação executada.
- [x] Adicionar exportação CRM pós-live com clientes atendidos, conversões, falhas, tempos de resposta e oportunidades perdidas.

Atualização de 2026-05-23: o atendimento já possui gestão operacional por conversa no backend e na aba Conversas, incluindo responsável, filtros por responsável, estados CRM, prioridade, política de automação, notas internas, sugestões pendentes de aprovação humana e rastreabilidade da decisão automática no contexto da mensagem. Também há relatório/exportação CRM pós-live em JSON e CSV com clientes atendidos, conversões, mensagens falhadas, tempo de primeira resposta e oportunidades perdidas.

### 3.13 CRM Completo de Loja - Próxima Grande Etapa

Esta etapa transforma o Bizy de painel de live em CRM operacional para lojas que vendem por WhatsApp, live e catálogo. A navegação deve deixar de copiar categorias genéricas e passar a representar fluxos reais de loja: vender, atender, cobrar, entregar, recuperar clientes e medir resultado.

#### 3.13.1 Navegação Comercial e Remoção de Ruído

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF76 | A navegação principal do CRM deve conter apenas módulos de uso frequente: Painel, Pedidos, Produtos, Clientes, Conversas, Campanhas, Relatórios e Configurações da Loja. | Alta | [ ] Planeado |
| RF77 | Funcionalidades técnicas como n8n, providers, filas internas, saúde da automação e logs devem sair da navegação da loja e ficar em área Admin/Sistema acessível apenas a perfis autorizados. | Alta | [ ] Planeado |
| RF78 | O sistema deve remover ou ocultar submenus sem utilidade operacional imediata, como `Drafts`, `Calendário`, `Resumo`, `Categoria`, `Descontos`, `Chatbot`, `Explorar`, `Relatórios` vazios, `Site`, `Montra`, `Finalizar compra`, `Apresentação`, `Menu` e `Páginas`, até existir fluxo real para cada um. | Alta | [ ] Planeado |
| RF79 | O módulo Painel deve mostrar o que a loja precisa fazer hoje: pedidos novos, pagamentos pendentes, conversas sem resposta, produtos com stock baixo, entregas pendentes, faturação do dia e tarefas atrasadas. | Alta | [ ] Planeado |
| RF80 | A interface deve oferecer pesquisa global por cliente, telefone, produto, código de peça, pedido, conversa e comprovativo. | Alta | [ ] Planeado |
| RF81 | A navegação mobile deve priorizar até 5 atalhos: Painel, Pedidos, Clientes, Conversas e Mais. | Alta | [ ] Planeado |
| RF82 | O menu `Mais` no mobile deve agrupar Produtos, Campanhas, Relatórios, Configurações da Loja e Admin/Sistema quando permitido. | Média | [ ] Planeado |
| RF83 | Telas vazias devem explicar a próxima ação útil, como importar clientes, criar produto, criar pedido, conectar WhatsApp ou enviar primeira campanha. | Alta | [ ] Planeado |
| RF84 | O sistema deve evitar páginas decorativas, estatísticas vazias ou configurações técnicas expostas à vendedora sem ação clara. | Alta | [ ] Planeado |

#### 3.13.2 Clientes 360

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF85 | O CRM deve ter lista de clientes com nome, telefone, WhatsApp, última interação, último pedido, total comprado, estado, tags e responsável. | Alta | [ ] Planeado |
| RF86 | O vendedor deve poder cadastrar cliente manualmente com nome, telefone, WhatsApp, endereço, notas, tags, origem e consentimento de comunicação. | Alta | [ ] Planeado |
| RF87 | O sistema deve importar clientes por CSV/Excel com validação de telefone angolano, deduplicação e relatório de erros. | Alta | [ ] Planeado |
| RF88 | O perfil do cliente deve mostrar visão 360: dados pessoais, conversas, pedidos, pagamentos, reservas, entregas, notas internas, tags, tarefas e histórico de campanhas. | Alta | [ ] Planeado |
| RF89 | O sistema deve deduplicar clientes por telefone canónico, mantendo aliases de username, TikTok, Instagram ou nome exibido. | Alta | [ ] Planeado |
| RF90 | O vendedor deve poder fundir clientes duplicados com pré-visualização de dados que serão mantidos. | Média | [ ] Planeado |
| RF91 | O CRM deve segmentar clientes por comportamento: novo, primeiro pedido, recorrente, VIP, inativo, nunca comprou, pagamento pendente, carrinho/reserva perdida e alto potencial. | Alta | [ ] Planeado |
| RF92 | O perfil do cliente deve permitir ações rápidas: enviar WhatsApp, criar pedido, reservar produto, adicionar nota, criar tarefa, atribuir responsável e marcar follow-up. | Alta | [ ] Planeado |
| RF93 | O sistema deve registrar preferências do cliente, como tamanho, cor, categoria favorita, faixa de preço, bairro de entrega e observações de atendimento. | Média | [ ] Planeado |
| RF94 | O CRM deve calcular indicadores por cliente: total gasto, pedidos pagos, pedidos cancelados, reservas expiradas, tempo médio de pagamento e data da última compra. | Alta | [ ] Planeado |
| RF95 | O vendedor deve poder marcar cliente como bloqueado, sem WhatsApp, sem consentimento, inadimplente ou prioridade alta. | Alta | [ ] Planeado |
| RF96 | O sistema deve permitir exportar clientes filtrados com campos úteis para operação e marketing autorizado. | Média | [ ] Planeado |

#### 3.13.3 Pedidos, Cobrança e Entrega

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF97 | Reservas devem evoluir para pedidos completos com cliente, itens, quantidade, desconto autorizado, total, estado de pagamento, estado de entrega e origem. | Alta | [ ] Planeado |
| RF98 | O vendedor deve criar pedido manual fora da live a partir do cliente ou da conversa. | Alta | [ ] Planeado |
| RF99 | O pedido deve suportar múltiplos itens, ajuste de quantidade, remoção de item e validação de stock antes de confirmar. | Alta | [ ] Planeado |
| RF100 | O CRM deve ter funil de pedidos com estados: novo, aguardando pagamento, pago, em preparação, pronto para entrega, enviado, entregue, cancelado, trocado e devolvido. | Alta | [ ] Planeado |
| RF101 | O sistema deve permitir cobrança por WhatsApp com templates de pagamento, lembrete, comprovativo pendente e pagamento confirmado. | Alta | [ ] Planeado |
| RF102 | O pedido deve anexar comprovativos, recibos, notas de pagamento e histórico de aprovação/rejeição. | Alta | [ ] Planeado |
| RF103 | O vendedor deve poder aplicar desconto apenas com motivo obrigatório e auditoria. | Média | [ ] Planeado |
| RF104 | O CRM deve registrar endereço de entrega por pedido e permitir reutilizar endereços salvos do cliente. | Alta | [ ] Planeado |
| RF105 | O sistema deve gerar lista de preparação/separação com produtos, quantidades, fotos e códigos. | Média | [ ] Planeado |
| RF106 | O sistema deve gerar lista de entrega por bairro, estado, entregador ou data. | Média | [ ] Planeado |
| RF107 | O vendedor deve marcar pedido como entregue com data, responsável e observação opcional. | Alta | [ ] Planeado |
| RF108 | O sistema deve permitir pedido rascunho apenas quando houver uso real: orçamento, carrinho em conversa ou checkout incompleto; não deve aparecer como submenu solto. | Média | [ ] Planeado |
| RF109 | O CRM deve permitir recuperar pedidos parados com lembrete automático ou tarefa humana. | Alta | [ ] Planeado |
| RF110 | O pedido deve mostrar margem estimada quando custo do produto estiver cadastrado. | Baixa | [ ] Planeado |
| RF111 | O sistema deve exportar pedidos com filtros por data, estado, cliente, produto, pagamento e entrega. | Média | [ ] Planeado |

#### 3.13.4 Produtos, Stock e Catálogo Comercial

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF112 | Produtos devem suportar SKU/código, nome, fotos, descrição curta, preço, custo opcional, stock, estado e coleção de venda. | Alta | [ ] Planeado |
| RF113 | O sistema deve permitir criar coleções comerciais, como live atual, novidades, promoção, reposição, mais vendidos e catálogo WhatsApp. | Alta | [ ] Planeado |
| RF114 | Categorias só devem aparecer quando forem usadas para filtros, relatórios ou catálogo; não devem ser menu principal separado sem conteúdo operacional. | Alta | [ ] Planeado |
| RF115 | Descontos devem ser tratados como regra aplicada em pedido, campanha ou produto específico, não como página solta sem fluxo de aprovação. | Alta | [ ] Planeado |
| RF116 | O CRM deve alertar produtos com stock baixo, stock parado, mais vendidos e produtos reservados sem pagamento. | Alta | [ ] Planeado |
| RF117 | O sistema deve manter histórico de movimentos de stock: entrada, venda, reserva, cancelamento, devolução, ajuste manual e correção. | Alta | [ ] Planeado |
| RF118 | O vendedor deve importar produtos por CSV/Excel com validação de código único e relatório de erros. | Média | [ ] Planeado |
| RF119 | O produto deve permitir variantes simples, como tamanho, cor ou modelo, quando a loja precisar. | Média | [ ] Planeado |
| RF120 | O CRM deve gerar catálogo compartilhável por WhatsApp com produtos selecionados, preço, fotos e disponibilidade. | Média | [ ] Planeado |
| RF121 | O sistema deve permitir arquivar produtos sem histórico de venda recente, preservando pedidos e relatórios antigos. | Média | [ ] Planeado |

#### 3.13.5 Conversas, Campanhas e Atendimento

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF122 | Conversas devem ser a caixa de entrada comercial do CRM, unificando WhatsApp, comentários de live e eventos de pedido do cliente. | Alta | [ ] Planeado |
| RF123 | Cada conversa deve estar vinculada a cliente, pedido atual quando houver, responsável, estado, prioridade, SLA e tags. | Alta | [ ] Planeado |
| RF124 | A conversa deve permitir responder com texto livre, template aprovado, mensagem rápida, imagem, documento, recibo e link de catálogo. | Alta | [ ] Planeado |
| RF125 | O CRM deve sugerir próximas ações na conversa, como pedir comprovativo, confirmar pagamento, pedir endereço, oferecer alternativa, criar pedido ou marcar follow-up. | Alta | [ ] Planeado |
| RF126 | `Chatbot` não deve ser módulo principal; automações devem aparecer como assistente dentro de Conversas, Campanhas ou Configurações da Loja. | Alta | [ ] Planeado |
| RF127 | Campanhas devem substituir o conceito genérico de `Transmissões`, com foco em mensagens segmentadas e autorizadas por WhatsApp. | Alta | [ ] Planeado |
| RF128 | O vendedor deve criar campanha para segmentos de clientes com template aprovado, janela de envio, limite diário, preview e confirmação antes do disparo. | Alta | [ ] Planeado |
| RF129 | O sistema deve mostrar resultado de campanha: enviados, entregues, lidos, respondidos, falhados, pedidos gerados e receita atribuída. | Média | [ ] Planeado |
| RF130 | Clientes sem consentimento ou com opt-out não devem receber campanhas, mas podem receber mensagens transacionais permitidas. | Alta | [ ] Planeado |
| RF131 | O CRM deve permitir sequências pós-venda: agradecer compra, pedir endereço, lembrar pagamento, confirmar entrega e reativar cliente inativo. | Média | [ ] Planeado |
| RF132 | A caixa de entrada deve ter filtros úteis: sem resposta, pagamento pendente, entrega pendente, VIP, reclamação, campanha respondida e meu atendimento. | Alta | [ ] Planeado |

#### 3.13.6 Relatórios que a Loja Usa

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF133 | Relatórios devem começar por indicadores práticos: vendas do dia, pedidos pagos, pagamentos pendentes, ticket médio, clientes novos, clientes recorrentes e conversão de reservas. | Alta | [ ] Planeado |
| RF134 | O CRM deve mostrar ranking de produtos mais vendidos, produtos encalhados, produtos com maior margem e produtos com mais reserva perdida. | Média | [ ] Planeado |
| RF135 | O CRM deve mostrar desempenho de atendimento: tempo médio de primeira resposta, conversas abertas, SLA vencido, mensagens falhadas e taxa de resolução. | Alta | [ ] Planeado |
| RF136 | O CRM deve mostrar desempenho de campanhas: receita gerada, respostas, opt-out, falhas e segmentos que converteram. | Média | [ ] Planeado |
| RF137 | A página `Explorar` não deve existir como relatório vazio; relatórios avançados só entram quando houver perguntas reais de negócio a responder. | Alta | [ ] Planeado |
| RF138 | O vendedor deve exportar relatórios em CSV e PDF simples para operação diária. | Média | [ ] Planeado |
| RF139 | O sistema deve gerar resumo diário automático com vendas, pendências e tarefas para o dia seguinte. | Média | [ ] Planeado |
| RF140 | O CRM deve permitir filtrar relatórios por período, canal, produto, coleção, responsável e estado do pedido. | Média | [ ] Planeado |
| RF141 | O painel deve mostrar oportunidades perdidas, como clientes que perguntaram e não compraram, reserva expirada e comprovativo não enviado. | Alta | [ ] Planeado |
| RF142 | O CRM deve medir retenção simples: clientes que voltaram a comprar, tempo desde última compra e clientes em risco de sumir. | Média | [ ] Planeado |
| RF143 | Relatórios técnicos de automação devem ficar no Admin/Sistema, não no menu comercial da loja. | Alta | [ ] Planeado |

#### 3.13.7 Tarefas, Equipa e Rotina da Loja

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF144 | O CRM deve criar tarefas manuais ou automáticas para follow-up, cobrança, entrega, reclamação, reposição e pós-venda. | Alta | [ ] Planeado |
| RF145 | Cada tarefa deve ter responsável, cliente/pedido relacionado, prazo, prioridade, estado e observação. | Alta | [ ] Planeado |
| RF146 | O vendedor deve ver `Minhas tarefas` no Painel, ordenadas por atraso e impacto comercial. | Alta | [ ] Planeado |
| RF147 | O sistema deve criar tarefa automática quando pagamento vencer, mensagem falhar, cliente VIP ficar sem resposta ou pedido pago ficar sem entrega. | Alta | [ ] Planeado |
| RF148 | O CRM deve suportar papéis mínimos: dono da loja, vendedor, atendente, financeiro, entregador e admin técnico. | Média | [ ] Planeado |
| RF149 | Permissões devem controlar quem pode dar desconto, confirmar pagamento, cancelar pedido, exportar clientes e alterar configurações. | Alta | [ ] Planeado |
| RF150 | A equipa deve poder transferir conversa/pedido/tarefa entre responsáveis com motivo opcional. | Média | [ ] Planeado |
| RF151 | O sistema deve registrar auditoria de ações humanas críticas, incluindo quem fez, quando fez e qual dado foi alterado. | Alta | [ ] Planeado |

---

## 4. Requisitos Não Funcionais (RNF)

### 4.1 Tecnologia e Arquitetura

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF01 | O backend deve ser implementado em Node.js, TypeScript e Fastify. | Alta | [x] Implementado |
| RNF02 | O frontend deve ser implementado em React, Vite e TypeScript. | Alta | [x] Implementado |
| RNF03 | O banco principal deve usar PostgreSQL com Prisma. | Alta | [x] Implementado |
| RNF04 | O domínio deve permanecer separado de HTTP, Prisma, React, TikTok, n8n e Evolution. | Alta | [x] Implementado |
| RNF05 | Regras de aplicação devem ficar em classes de `use-case`, não diretamente nos handlers HTTP. | Alta | [x] Implementado |
| RNF06 | Providers externos devem ficar atrás de contratos: `LiveCommentProvider`, `ProvedorWhatsApp` e `ProvedorSms`. | Alta | [x] Implementado |
| RNF07 | A camada HTTP deve ser modular e registrada por manifesto. | Média | [x] Implementado |

### 4.2 Performance e Tempo de Resposta

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF08 | Comentários capturados devem aparecer no painel em até 3 segundos em condições normais. | Alta | [x] Implementado |
| RNF09 | A criação de reserva a partir de comentário válido deve ocorrer em até 10 segundos. | Alta | [x] Implementado |
| RNF10 | O envio de código SMS deve ocorrer preferencialmente em até 30 segundos. | Alta | [x] Implementado |
| RNF11 | Ações críticas no painel devem exigir poucos cliques e dar feedback visual imediato. | Alta | [x] Implementado |
| RNF12 | O frontend deve manter bundle adequado para carregamento rápido em conexões comuns de Angola. | Média | [x] Implementado |

### 4.3 Confiabilidade e Resiliência

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF13 | O sistema deve manter modo manual como contingência quando provider automático falhar. | Alta | [x] Implementado |
| RNF14 | Eventos para n8n devem ter retry automático por outbox. | Alta | [x] Implementado |
| RNF15 | Reservas e comentários processados devem ser persistidos para não depender de estado em memória. | Alta | [x] Implementado |
| RNF16 | O agendador de expiração deve rodar periodicamente e ser configurável. | Alta | [x] Implementado |
| RNF17 | O sistema deve tolerar falhas temporárias do n8n sem perder eventos. | Alta | [x] Implementado |
| RNF18 | Em caso de falha de TikTok, o vendedor deve conseguir continuar a operação pelo modo manual. | Alta | [x] Implementado |

### 4.4 Segurança

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF19 | Endpoints operacionais devem exigir sessão autenticada. | Alta | [x] Implementado |
| RNF20 | Código SMS deve ser armazenado como hash. | Alta | [x] Implementado |
| RNF21 | Token de sessão deve ser armazenado como hash no backend. | Alta | [x] Implementado |
| RNF22 | Comunicação backend -> n8n deve usar HMAC SHA-256. | Alta | [x] Implementado |
| RNF23 | Comunicação n8n -> backend deve exigir `X-EMEU-N8N-TOKEN`. | Alta | [x] Implementado |
| RNF24 | Webhook Evolution deve exigir token configurado. | Alta | [x] Implementado |
| RNF25 | Em produção, `LOGIN_SMS_DEV_MODE` e `LOGIN_SMS_EXPOR_CODIGO_DEV` devem estar desativados. | Alta | [x] Implementado |
| RNF26 | CORS deve ser restrito à origem real do frontend em produção. | Alta | [x] Implementado |
| RNF27 | Rate limit deve proteger endpoints HTTP sensíveis. | Alta | [x] Implementado |
| RNF28 | Em escala, rate limit deve usar armazenamento distribuído como Redis. | Média | [ ] Pós-MVP |
| RNF29 | Em produção madura, sessão deve considerar cookie HttpOnly ou mecanismo equivalente mais seguro que `localStorage`. | Média | [ ] Pós-MVP |

### 4.5 Dados, Auditoria e Observabilidade

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF30 | O comentário original deve ser mantido como evidência operacional. | Alta | [x] Implementado |
| RNF31 | Eventos internos devem ser registrados para auditoria. | Alta | [x] Implementado |
| RNF32 | Mensagens WhatsApp enviadas devem ser auditáveis. | Alta | [x] Implementado |
| RNF33 | O sistema deve registrar timestamps para medir tempo comentário -> reserva e reserva -> pagamento. | Alta | [x] Implementado |
| RNF34 | O sistema deve expor métricas de saúde da outbox n8n. | Média | [x] Implementado |
| RNF35 | Logs de produção devem ser estruturados e centralizados. | Média | [x] Implementado |

### 4.6 Usabilidade e Acessibilidade

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF36 | A interface deve ser responsiva para desktop, tablet e mobile. | Alta | [x] Implementado |
| RNF37 | O painel deve ser simples o suficiente para onboarding de vendedor em até 5 minutos. | Alta | [x] Implementado |
| RNF38 | Formulários devem exibir mensagens claras de erro, sucesso e carregamento. | Alta | [x] Implementado |
| RNF39 | A navegação principal deve ser consistente entre páginas internas. | Média | [x] Implementado |
| RNF40 | A UI deve destacar estados críticos como reserva perto de expirar, pagamento pendente e comentário em revisão. | Alta | [x] Implementado |

### 4.7 Qualidade e Testes

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF41 | Entradas HTTP e dados críticos devem ser validados com Zod. | Alta | [x] Implementado |
| RNF42 | O projeto deve manter TypeScript em modo estrito. | Alta | [x] Implementado |
| RNF43 | O backend deve ter testes automatizados para parser, motor de reservas, autenticação, n8n, SMS, Evolution, media e PDF. | Alta | [x] Implementado |
| RNF44 | O fluxo crítico deve ter testes de integração HTTP. | Alta | [x] Implementado |
| RNF45 | O frontend deve ter testes E2E para login, catálogo, comentário manual, reserva e pagamento. | Média | [x] Implementado |
| RNF46 | A lógica de concorrência de reservas deve ser testada com PostgreSQL real. | Alta | [x] Implementado |
| RNF47 | O build e o typecheck devem passar antes de publicar piloto. | Alta | [x] Implementado |

### 4.8 Deploy e Operação

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF48 | O projeto deve possuir Docker Compose para ambiente integrado. | Alta | [x] Implementado |
| RNF49 | O backend deve executar `prisma migrate deploy` em produção. | Alta | [x] Implementado |
| RNF50 | Imagens de n8n e Evolution devem ser fixadas por versão ou digest em produção. | Média | [x] Implementado |
| RNF51 | PostgreSQL e Redis não devem ficar expostos publicamente em produção. | Alta | [x] Implementado |
| RNF52 | O ambiente de staging deve usar HTTPS e domínio próprio. | Média | [x] Implementado |
| RNF53 | Segredos reais não devem ser versionados no repositório. | Alta | [x] Implementado |
| RNF54 | Ficheiros de comprovativo devem ser guardados dentro de raiz controlada e servidos por rota autenticada. | Alta | [x] Implementado |

### 4.9 Operabilidade do CRM Completo

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF55 | A navegação comercial deve permitir chegar às ações principais em até 2 cliques no desktop e 2 toques no mobile. | Alta | [ ] Planeado |
| RNF56 | O CRM deve continuar responsivo e utilizável em telemóveis de 360px de largura sem scroll horizontal. | Alta | [x] Implementado |
| RNF57 | Listas de clientes, pedidos, produtos e conversas devem suportar paginação, filtros e busca sem travar com pelo menos 10.000 registros. | Alta | [ ] Planeado |
| RNF58 | A busca global deve responder em até 1 segundo para bases pequenas e manter feedback de carregamento em bases maiores. | Média | [ ] Planeado |
| RNF59 | Dados pessoais de clientes devem ser protegidos com controlo de acesso por papel e auditoria de exportação. | Alta | [ ] Planeado |
| RNF60 | Exportações de clientes, pedidos e relatórios devem registrar usuário, filtro usado, data e quantidade exportada. | Alta | [ ] Planeado |
| RNF61 | O CRM deve manter backups e estratégia de recuperação para clientes, pedidos, mensagens, comprovativos e produtos. | Alta | [ ] Planeado |
| RNF62 | A interface deve distinguir claramente operação comercial de configuração técnica. | Alta | [ ] Planeado |
| RNF63 | Páginas sem funcionalidade real não devem ser publicadas na navegação principal. | Alta | [ ] Planeado |
| RNF64 | O design system deve padronizar cards, listas, tabelas, filtros, badges, estados vazios e ações destrutivas antes de novas páginas CRM. | Alta | [x] Implementado |
| RNF65 | A aplicação deve manter textos curtos, orientados à ação e compreensíveis por vendedor não técnico. | Alta | [ ] Planeado |
| RNF66 | O CRM deve registrar métricas de funil sem depender de serviços externos para operação básica. | Média | [ ] Planeado |
| RNF67 | Campanhas devem respeitar limites de envio, opt-out, consentimento e regras do provider WhatsApp usado. | Alta | [ ] Planeado |
| RNF68 | Automações devem falhar de forma segura: se houver dúvida, criar tarefa humana em vez de executar ação crítica. | Alta | [ ] Planeado |
| RNF69 | O sistema deve manter idempotência em importações, campanhas e webhooks para evitar duplicação de clientes, pedidos ou mensagens. | Alta | [ ] Planeado |
| RNF70 | O CRM deve permitir evolução modular por domínios: Clientes, Pedidos, Produtos, Conversas, Campanhas, Relatórios e Configurações. | Alta | [ ] Planeado |
| RNF71 | O frontend deve usar `shadcn/ui` como fonte padrão de componentes de interface: botões, cards, badges, inputs, selects, tabelas, dialogs, sheets, tabs, skeletons e estados de feedback. | Alta | [x] Implementado |
| RNF72 | Novos componentes próprios só devem ser criados quando não existir primitivo equivalente em `shadcn/ui`; composições de domínio devem reaproveitar os primitivos instalados. | Alta | [x] Implementado |

---

## 5. Regras de Negócio (RN)

### 5.1 Comentários e Parser

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN01 | Um comentário só é automaticamente válido quando possui intenção de compra, telefone angolano válido e código de peça. | [x] Implementado |
| RN02 | A ordem entre telefone e código da peça não altera a validade do comentário. | [x] Implementado |
| RN03 | Telefones aceitos devem ser móveis angolanos com 9 dígitos e prefixos válidos, com ou sem indicativo `244` ou `00244`. | [x] Implementado |
| RN04 | Códigos de peça podem aparecer como número livre ou com rótulos como `peça`, `peca`, `produto`, `item` ou `#`. | [x] Implementado |
| RN05 | Intenções reconhecidas incluem variações como `eu quero`, `eu queri`, `qro`, `qr`, `meu`, `é meu`, `pega`, `reserva`, `guarda` e `fica pra mim`. | [x] Implementado |
| RN06 | Se faltar telefone, o comentário deve ir para revisão manual. | [x] Implementado |
| RN07 | Se faltar código de peça, o comentário deve ir para revisão manual. | [x] Implementado |
| RN07A | Se houver telefone e intenção de compra, mas faltar código da peça ou a peça não existir no catálogo, o cliente deve receber mensagem pedindo o código correto. | [x] Implementado |
| RN08 | Se o telefone não for angolano válido, o comentário deve ir para revisão manual. | [x] Implementado |
| RN09 | Se a confiança do parser ficar abaixo do limite operacional, o comentário deve ir para revisão manual. | [x] Implementado |
| RN10 | Comentários sem intenção de compra devem ser ignorados, mas podem permanecer no histórico. | [x] Implementado |

### 5.2 Catálogo e Stock

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN11 | Cada peça deve ter um código único. | [x] Implementado |
| RN12 | Peças com quantidade zero devem ser tratadas como esgotadas ou indisponíveis. | [x] Implementado |
| RN13 | Peças vendidas ou esgotadas não devem receber nova reserva automática. | [x] Implementado |
| RN14 | O stock livre de uma peça é a quantidade total menos reservas que bloqueiam stock. | [x] Implementado |
| RN15 | Reservas em `WAITING_PAYMENT`, `PENDING`, `RESERVED` ou `PAID` bloqueiam stock. | [x] Implementado |
| RN16 | Reservas em `WAITLISTED` não bloqueiam stock. | [x] Implementado |
| RN17 | Quando a quantidade paga atingir o stock total, a peça pode ser marcada como vendida. | [x] Implementado |

### 5.3 Reservas e Fila

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN18 | O primeiro comentário válido para uma peça com stock livre ganha a reserva. | [x] Implementado |
| RN19 | Clientes seguintes entram em fila quando não há stock livre. | [x] Implementado |
| RN20 | O mesmo telefone não pode ter mais de uma reserva ativa para a mesma peça. | [x] Implementado |
| RN21 | O mesmo cliente pode reservar peças diferentes durante a mesma live. | [x] Implementado |
| RN22 | Reserva criada automaticamente deve iniciar como `WAITING_PAYMENT`. | [x] Implementado |
| RN23 | Reserva em fila deve iniciar como `WAITLISTED` e sem expiração até ser promovida. | [x] Implementado |
| RN24 | Uma reserva deve expirar quando o prazo configurado terminar sem pagamento confirmado. | [x] Implementado |
| RN25 | Ao expirar uma reserva, o sistema deve promover o primeiro cliente da fila, se houver stock livre. | [x] Implementado |
| RN26 | Ao cancelar uma reserva, o sistema deve promover o primeiro cliente da fila, se houver stock livre. | [x] Implementado |
| RN27 | Reserva promovida da fila deve receber novo prazo de pagamento. | [x] Implementado |
| RN28 | Para o piloto, o prazo recomendado de reserva é 15 minutos, mas deve permanecer configurável. | [x] Implementado |

### 5.4 Revisão Manual

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN29 | Comentários em revisão manual não devem criar reserva automática até aprovação do vendedor. | [x] Implementado |
| RN30 | O vendedor pode corrigir telefone e código da peça antes de aprovar a reserva. | [x] Implementado |
| RN31 | Ao aprovar manualmente, o sistema deve aplicar as mesmas regras de stock, duplicidade e fila da reserva automática. | [x] Implementado |
| RN32 | Ao rejeitar um comentário, nenhuma reserva deve ser criada e o motivo deve ficar registrado. | [x] Implementado |
| RN33 | Correções manuais devem ficar auditáveis para análise de erros do parser. | [x] Implementado |

### 5.5 Pagamentos

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN34 | Comprovativo recebido não significa pagamento confirmado. | [x] Implementado |
| RN34A | Comprovativo em `dataUrl` deve ser persistido como ficheiro interno antes de atualizar a reserva. | [x] Implementado |
| RN35 | Pagamento só pode ser confirmado por ação do backend autorizada por vendedor, humano ou regra explícita. | [x] Implementado |
| RN36 | Ao confirmar pagamento, a reserva deve passar para `PAID` e o pagamento para `CONFIRMADO`. | [x] Implementado |
| RN37 | Ao rejeitar pagamento, o estado de pagamento deve ser `REJEITADO` e o motivo deve ser informado. | [x] Implementado |
| RN38 | Reserva paga não deve expirar automaticamente. | [x] Implementado |
| RN39 | Reserva paga não deve ser cancelada por fluxo automático sem ação explícita autorizada. | [x] Implementado |

### 5.6 WhatsApp e Atendimento

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN40 | Quando `N8N_ASSUME_WHATSAPP=true`, o backend emite eventos, mas não envia WhatsApp direto. | [x] Implementado |
| RN41 | Quando `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=evolution`, o backend envia mensagens pela Evolution API. | [x] Implementado |
| RN41A | Quando `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=cloud-api`, o backend envia mensagens pelo WhatsApp Cloud API oficial usando `WHATSAPP_CLOUD_PHONE_NUMBER_ID`, `WHATSAPP_CLOUD_ACCESS_TOKEN` e, quando configurado, `WHATSAPP_CLOUD_DEFAULT_TEMPLATE_NAME`. | [x] Implementado |
| RN42 | A instância padrão conectada da Evolution deve ser preferida; se estiver fechada, o sistema pode escolher outra instância conectada. | [x] Implementado |
| RN43 | Mensagens automáticas devem respeitar rate limit para evitar spam e duplicidade. | [x] Implementado |
| RN43A | Mensagens WhatsApp devem passar por validação anti-spam antes de chegar ao provider externo. | [x] Implementado |
| RN44 | O vendedor deve poder usar templates aprovados para IBAN, reserva, lembrete e pagamento. | [x] Implementado |
| RN45 | Pedidos de desconto, troca de peça, comprovativo ilegível, cliente irritado ou cancelamento ambíguo devem ser encaminhados para humano. | [x] Implementado |
| RN45A | Limpeza operacional de comentários e mensagens deve exigir sessão autenticada e confirmação `LIMPAR`, apagando apenas histórico de comunicação e preservando catálogo, reservas, usuários, sessões e instâncias WhatsApp. | [x] Implementado |

### 5.7 n8n, IA e Fonte de Verdade

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN46 | O backend é a fonte de verdade para stock, preço, reserva, pagamento e fila. | [x] Implementado |
| RN47 | O n8n pode automatizar mensagens e follow-ups, mas não pode alterar dados fora dos endpoints autorizados. | [x] Implementado |
| RN48 | A IA deve usar apenas dados retornados pelo backend. | [x] Implementado |
| RN49 | A IA não pode inventar preço, stock, prazo, estado da reserva ou confirmação de pagamento. | [x] Implementado |
| RN50 | Eventos para n8n devem ser enviados apenas para tipos permitidos pelo contrato de automação. | [x] Implementado |
| RN51 | Se o n8n estiver indisponível, eventos devem permanecer na outbox para retry. | [x] Implementado |

### 5.8 Operação do Piloto

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN52 | O vendedor piloto deve cadastrar as peças antes da live. | [ ] Processo |
| RN53 | Cada peça da live deve ter código simples e comunicado verbalmente ou visualmente durante a transmissão. | [ ] Processo |
| RN54 | Antes da live, o WhatsApp deve estar conectado e a sessão do vendedor deve estar ativa. | [ ] Processo |
| RN55 | Se TikTok ou provider automático falhar, o vendedor deve usar modo manual sem perder reservas já criadas. | [x] Implementado |
| RN56 | A live piloto deve registrar métricas de comentários, reservas, revisões, pagamentos, expirações e erros. | [x] Implementado |
| RN57 | A decisão pós-piloto deve considerar conversão, erros operacionais, satisfação do vendedor e uso em lives recorrentes. | [ ] Processo |

### 5.9 CRM de Loja, Clientes e Pedidos

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN58 | O telefone canónico é o identificador principal de cliente no CRM, sem impedir múltiplos nomes, usernames ou origens. | [ ] Planeado |
| RN59 | Um cliente só pode ser fundido com outro mediante ação explícita de usuário autorizado. | [ ] Planeado |
| RN60 | Cliente com opt-out ou sem consentimento não pode receber campanha promocional. | [ ] Planeado |
| RN61 | Mensagens transacionais de pedido, pagamento e entrega podem ser enviadas quando necessárias à execução da venda e permitidas pelo provider/canal. | [ ] Planeado |
| RN62 | Campanhas devem usar segmentos claros e nunca devem disparar para todos os clientes por padrão. | [ ] Planeado |
| RN63 | Todo pedido deve ter cliente, pelo menos um item, valor total e estado operacional. | [ ] Planeado |
| RN64 | Pedido pago não pode ser apagado; deve ser cancelado, devolvido, trocado ou ajustado com auditoria. | [ ] Planeado |
| RN65 | Desconto exige motivo e, acima do limite configurado, aprovação de perfil autorizado. | [ ] Planeado |
| RN66 | Produto sem stock disponível não deve ser vendido automaticamente, mas pode entrar em lista de interesse/reposição. | [ ] Planeado |
| RN67 | Movimento manual de stock exige motivo e responsável. | [ ] Planeado |
| RN68 | Categoria de produto só deve existir se melhorar filtro, catálogo ou relatório; categoria vazia deve ficar oculta. | [ ] Planeado |
| RN69 | Pedido rascunho não é categoria principal; só aparece dentro do cliente, conversa ou funil quando houver carrinho/orçamento real. | [ ] Planeado |
| RN70 | Relatório só entra no menu comercial se responder uma pergunta prática da loja. | [ ] Planeado |
| RN71 | Relatórios técnicos de automação pertencem ao Admin/Sistema, não ao menu do vendedor. | [ ] Planeado |
| RN72 | Conversa sem resposta dentro do SLA deve gerar tarefa ou alerta. | [ ] Planeado |
| RN73 | Cliente VIP, reclamação e pagamento pendente devem ter prioridade visual superior a conversa comum. | [ ] Planeado |
| RN74 | Chatbot autônomo não pode assumir atendimento crítico sem política explícita e aprovação humana quando o caso envolver pagamento, desconto, troca, reclamação ou cancelamento. | [ ] Planeado |
| RN75 | Se uma mensagem de campanha falhar, o sistema deve registrar falha, motivo quando disponível e impedir reenvio infinito. | [ ] Planeado |
| RN76 | Tarefa atrasada deve continuar visível no Painel até ser concluída, reagendada ou cancelada com motivo. | [ ] Planeado |
| RN77 | Exportação de clientes deve respeitar permissões e registrar auditoria. | [ ] Planeado |
| RN78 | Configurações técnicas não devem ser acessíveis a vendedor comum. | [ ] Planeado |

### 5.10 Mapa de Navegação Pretendido para CRM

| Área | Deve ficar | Deve sair/ficar oculto |
|---|---|---|
| Painel | Hoje, pendências, tarefas, métricas úteis, alertas comerciais | Cards técnicos, logs crus, estatísticas vazias |
| Pedidos | Todos, pagamento pendente, preparação, entrega, cancelados, devoluções | `Drafts` solto, calendário sem fluxo, resumo duplicado |
| Produtos | Todos, coleções, stock baixo, importação, catálogo WhatsApp | Categoria vazia, descontos sem aprovação/uso real |
| Clientes | Lista, perfil 360, segmentos, importação, exportação auditada | Campos sem uso comercial, filtros sem resultado |
| Conversas | Caixa de entrada, templates, tarefas, pedidos vinculados, SLA | `Chatbot` como menu principal |
| Campanhas | Transmissões autorizadas, segmentos, métricas, opt-out | Disparo genérico sem consentimento |
| Relatórios | Vendas, clientes, produtos, atendimento, campanhas | `Explorar` vazio, relatórios técnicos no menu da loja |
| Configurações da Loja | Dados da loja, equipa, pagamentos, entrega, mensagens rápidas | n8n, tokens, providers e debug para vendedor comum |
| Admin/Sistema | Saúde técnica, n8n, providers, webhooks, auditoria técnica | Não deve aparecer para perfis comerciais sem permissão |

---

## 6. Itens Fora do Escopo do MVP

| ID | Item | Estado | Motivo |
|---|---|---|---|
| OOS01 | Multi-loja | [ ] Pós-MVP | Requer modelo de dados e permissões por loja |
| OOS02 | Multi-vendedor avançado | [ ] Parcial CRM | Papéis mínimos entram no CRM; organograma avançado fica depois |
| OOS03 | Entidades separadas `Cliente`, `Pedido`, `Pagamento` e `Entrega` | [ ] Em escopo CRM | Sai do fora de escopo e passa para RF85-RF111 |
| OOS04 | Relatórios analíticos avançados | [ ] Parcial CRM | Relatórios úteis entram no CRM; exploração avançada fica depois |
| OOS05 | Integração Instagram/Facebook | [ ] Pós-MVP | Depende de prioridade comercial e providers |
| OOS06 | App mobile nativo | [ ] Pós-MVP | Frontend web responsivo atende piloto |
| OOS07 | Reconciliação bancária automática | [ ] Pós-MVP | Requer integração financeira específica |
| OOS08 | Chatbot IA autônomo | [ ] Pós-MVP | Assistente controlado entra no CRM; autonomia total continua fora |
| OOS09 | Website/montra completa com páginas, menu e checkout público | [ ] Pós-MVP | Só entra quando houver estratégia clara de canal de venda fora de WhatsApp/live |
| OOS10 | Calendário de agenda comercial completo | [ ] Pós-MVP | Só entra se tarefas e entregas exigirem visão calendário |

---

## 7. Critérios de Aceite do MVP Piloto

O MVP pode ser considerado pronto para piloto quando:

- [x] Login por telefone funcionar com SMS real ou modo dev controlado.
- [x] Vendedor conseguir cadastrar peças da live.
- [x] Comentários reais ou manuais aparecerem no painel em tempo real.
- [x] Parser criar reservas automaticamente para comentários válidos.
- [x] Comentários ambíguos aparecerem em revisão manual.
- [x] Vendedor conseguir corrigir/aprovar comentários em revisão.
- [x] Reservas expirarem e promoverem fila automaticamente.
- [x] Vendedor conseguir confirmar ou rejeitar pagamento.
- [x] WhatsApp estiver conectado e permitir envio automático ou manual.
- [x] Eventos n8n forem assinados, persistidos em outbox e reenviados em caso de falha.
- [x] Build, typecheck e testes passarem antes da live piloto.

### 7.1 Critérios de Aceite da Etapa CRM Completo

O CRM completo pode ser considerado pronto para primeira operação de loja quando:

- [x] A navegação comercial estiver reduzida aos módulos Painel, Pedidos, Produtos, Clientes, Conversas, Campanhas, Relatórios e Configurações da Loja.
- [x] Submenus sem fluxo real estiverem removidos ou ocultos: `Drafts`, `Calendário`, `Resumo`, `Categoria`, `Descontos`, `Chatbot`, `Explorar`, `Site`, `Montra`, `Finalizar compra`, `Apresentação`, `Menu` e `Páginas`.
- [ ] Clientes tiverem perfil 360 com conversas, pedidos, pagamentos, entregas, notas, tags, tarefas e consentimento.
- [ ] Pedidos substituírem reservas como entidade comercial completa, mantendo compatibilidade com vendas de live.
- [ ] Conversas permitirem responder, criar pedido, cobrar, confirmar pagamento, pedir entrega e criar tarefa sem sair da tela.
- [ ] Campanhas respeitarem opt-out, consentimento, segmentos e templates aprovados.
- [ ] Relatórios úteis responderem perguntas de venda, atendimento, produto, campanha e cliente.
- [ ] Tarefas automáticas cobrirem pagamento vencido, mensagem falhada, cliente sem resposta, pedido pago sem entrega e follow-up pós-venda.
- [ ] Permissões impedirem vendedor comum de acessar tokens, providers, n8n, webhooks e configurações técnicas.
- [x] A experiência mobile não tiver scroll horizontal nas páginas de Clientes, Pedidos, Produtos, Conversas e Painel.
- [x] A interface estiver migrada para `shadcn/ui` nos componentes recorrentes e novas telas deixarem de usar botões, inputs, cards, badges e modais feitos do zero.

---

## 8. Rastreabilidade Resumida

| Módulo / etapa | RF relacionados | RNF relacionados | RN relacionados |
|---|---|---|---|
| Autenticação | RF01-RF07 | RNF19-RNF29 | RN52-RN54 |
| Catálogo | RF08-RF14 | RNF30-RNF35 | RN11-RN17 |
| Captura e Parser | RF15-RF28 | RNF08-RNF18 | RN01-RN10 |
| Revisão Manual | RF29-RF33 | RNF36-RNF47 | RN29-RN33 |
| Reservas e Fila | RF34-RF43 | RNF13-RNF18 | RN18-RN28 |
| Painel | RF44-RF49 | RNF36-RNF40 | RN56-RN57 |
| WhatsApp | RF50-RF56 | RNF19-RNF35 | RN40-RN45 |
| Pagamentos | RF57-RF63 | RNF30-RNF47 | RN34-RN39 |
| n8n | RF64-RF70 | RNF22-RNF35 | RN46-RN51 |
| Configuração e Deploy | RF71-RF75 | RNF48-RNF53 | RN52-RN57 |
| CRM Completo de Loja | RF76-RF151 | RNF55-RNF72 | RN58-RN78 |

---

## 9. Referências de Produto para a Etapa CRM

Estas referências não substituem as decisões do Bizy, mas ajudam a manter a próxima etapa alinhada com padrões reais de venda por WhatsApp, clientes, pedidos e segmentação:

- Take App Help Center: módulos de produtos, gestão de pedidos, pagamentos, entregas, clientes, WhatsApp Business, analytics e multi-store. Fonte: <https://help.take.app/en/>
- Take App Inbox & Broadcast: caixa de entrada WhatsApp e transmissões como aceleradores de venda quando usados com contexto e segmentação. Fonte: <https://help.take.app/en/articles/12798978-boost-whatsapp-sales-take-app-inbox-broadcast>
- Shopify Customer Segmentation: segmentos automáticos para comunicar a mensagem certa ao cliente certo. Fonte: <https://help.shopify.com/en/manual/customers/customer-segmentation>
- Shopify Customer Reports: relatórios de clientes, coortes, clientes de alto valor e reativação. Fonte: <https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/customers-reports>
- Meta WhatsApp Business Platform: mensagens iniciadas pela empresa exigem templates aprovados e respeito às políticas do canal. Fonte: <https://developers.facebook.com/docs/whatsapp>
