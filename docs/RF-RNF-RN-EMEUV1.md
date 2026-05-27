# Bizy / ÉMeu V1 - Requisitos Funcionais, Não Funcionais e Regras de Negócio

Documento: `RF-RNF-RN-EMEUV1.md`
Versão: 1.85
Data: 2026-05-26
Autor: Carlos
Status: MVP base implementado; fundação backend Bizy CRM+ com Clientes 360, Pedidos, Catálogo/Stock, Loja Pública, Vitrine Pública, Checkout, Entrega, Afiliados, Criadores, Revendedores, Mini-lojas Públicas, Comissões, Atribuição Comercial, Lotes Financeiros, Campanhas, Governança, Jobs, Eventos Operacionais, eventos server-side preparados, Inbox Comercial, SLA, Social Inbox seguro, transferência operacional, política WhatsApp, descontos aprováveis, carrinho abandonado, antifraude de afiliados, anonimização, SEO público, logs operacionais, navegação comercial, busca global, auditoria de exportações comerciais e painel diário em evolução

---

## 1. Objetivo do Documento

Este documento formaliza os requisitos funcionais, requisitos não funcionais e regras de negócio do ÉMeu V1, considerando:

- O estado atual do projeto ÉMeu.
- O relatório técnico `RELATORIO-COMPLETO-EMEU.md`.
- O escopo de MVP piloto para automação de vendas em lives em Angola.

O objetivo é servir como base para implementação, testes, validação do piloto e criação de issues/tarefas.

Atualização 1.1: o documento passa a orientar a evolução do Bizy para um CRM completo de loja, com foco em clientes, pedidos, produtos, conversas WhatsApp, campanhas, relatórios úteis e remoção de navegação/informação que não ajuda a operação diária.

Atualização 1.2: adicionada a frente de identidade e onboarding, com login por telefone, Gmail e UOR/ISPTEC, persistência de identidade separada do telefone, cadastro do negócio e produto inicial como base para o CRM.

Atualização 1.3: o posicionamento estratégico passa a ser Bizy CRM+ para criadores, afiliados e social commerce. Além da automação de live, o produto deve oferecer loja virtual, catálogo digital, checkout por WhatsApp/site, links rastreáveis, afiliados, social inbox, funil de vendas, automações comerciais e governança das categorias oficiais de WhatsApp: marketing, utilidade, autenticação e serviço.

Atualização 1.4: antes das novas telas e módulos, o backend deve ser preparado como núcleo multi-negócio, modular e auditável. Os requisitos passam a usar o marcador de checklist antes do texto em tabelas e listas, facilitando leitura, priorização e acompanhamento do que falta.

Atualização 1.5: iniciado o backend de Clientes 360, com API autenticada/multi-negócio para cadastro, listagem, perfil, atualização, bloqueio/estado, exportação CSV e sincronização automática de clientes a partir de comentários, reservas e mensagens de atendimento.

Atualização 1.6: iniciado o backend de Pedidos completos, com APIs autenticadas/multi-negócio para criar pedidos manuais com vários itens, cliente obrigatório, cálculo de subtotal/desconto/entrega/total, validação de stock, funil operacional, confirmação de pagamento, atualização de entrega e exportação CSV.

Atualização 1.7: iniciado o backend de Produtos, Stock e Catálogo Comercial, com metadados de produto, SKU, custo, margem estimada, categoria, coleção, variantes simples, estado de stock, resumo comercial e histórico de movimentos de stock por negócio.

Atualização 1.8: iniciado o backend de Loja Pública, Catálogo Digital e Tracking, com publicação por slug, listagem pública de produtos vendáveis, página pública de produto, checkout WhatsApp pré-preenchido com origem e tracking básico de visitas, produto visto e clique WhatsApp.

Atualização 1.9: iniciado o checkout público pelo site e cálculo de entrega, com regras por zona/bairro/município, taxa padrão, retirada na loja, entrega grátis por valor mínimo, criação de cliente/pedido a partir da loja pública e tracking de checkout iniciado e pedido criado.

Atualização 1.10: iniciado o backend de Afiliados/Criadores, com módulo comercial próprio, criação de parceiro, links rastreáveis com `ref`, atribuição no checkout público, comissão estimada no pedido atribuído e confirmação automática da comissão após pagamento confirmado.

Atualização 1.11: ampliado o backend de Afiliados/Criadores com reversão automática de comissão quando pedido atribuído é cancelado, devolvido ou reembolsado, além de marcação operacional de comissão paga com referência e observação de pagamento.

Atualização 1.12: adicionada auditoria operacional de comissões de afiliados/criadores, registrando criação, atualização, confirmação, pagamento e reversão com estado anterior, estado novo, valor, motivo, referência e autor quando houver ação humana.

Atualização 1.13: adicionados lotes financeiros para pagamento de comissões confirmadas, com período, referência, observação, autor, total, itens pagos, vínculo nas comissões e histórico auditável por pagamento em lote.

Atualização 1.14: adicionados saldos financeiros por afiliado/criador e exportação CSV dos lotes de pagamento de comissão, preparando operação de fecho, conciliação e prestação de contas para parceiros comerciais.

Atualização 1.15: o resumo de tracking comercial passou a devolver funil operacional com visitas, produtos vistos, cliques WhatsApp, checkouts, pedidos, leads identificados, receita atribuída e taxas básicas de conversão.

Atualização 1.16: adicionada política interna de envio WhatsApp por categoria oficial (`marketing`, `utility`, `authentication`, `service`), com classificação antes do provider, metadados de política no envio, bloqueio de marketing sem consentimento e bloqueio de serviço fora da janela declarada.

Atualização 1.17: o catálogo interno de templates WhatsApp passou a expor categoria, idioma, provider, versão, estado de aprovação e eventos compatíveis, com filtros na API `/whatsapp/templates` e bloqueio de envio para templates ainda não aprovados.

Atualização 1.18: adicionada fundação backend de tarefas operacionais, com persistência multi-negócio, rota `/tarefas` e criação automática de tarefa humana quando o envio WhatsApp é bloqueado por template/política antes do provider.

Atualização 1.19: tarefas operacionais passaram a ter criação manual, consulta individual, atualização de estado/responsável/observação/contexto e suporte de persistência para cliente, pedido, conclusão e observação.

Atualização 1.20: adicionada fundação backend de Social Inbox para registrar comentários/mensagens/menções de redes sociais, guardar autor/perfil/post/intenção e criar tarefa comercial automática quando há intenção de compra com confiança suficiente.

Atualização 1.21: adicionada fundação backend de Playbooks de Recuperação, com configuração multi-negócio, gatilhos comerciais, condições em JSON, ação segura de criação de tarefa humana, execução por evento e trilha/listagem de execuções para futura ligação ao funil.

Atualização 1.22: adicionada fundação backend de Funil Comercial, com etapas padronizadas, registro manual/API de movimentos por entidade, motivo obrigatório, origem, autor, contexto e histórico consultável para preparar automações seguras e intervenção humana.

Atualização 1.23: Playbooks de Recuperação agora alimentam o Funil Comercial e geram Oportunidades Recuperáveis acionáveis, com valor estimado, tarefa vinculada, movimento de funil, responsável, observação e atualização operacional de estado.

Atualização 1.24: adicionada governança backend de módulos por negócio, com catálogo de módulos CRM+, rota `/negocio/modulos`, ativação/desativação operacional, configuração em JSON e bloqueio real de rotas quando módulo opcional está desativado.

Atualização 1.25: adicionada API operacional de relacionamento entre negócios e compartilhamento seguro de clientes, exigindo relação aprovada, consentimento de dados, escopo limitado e auditoria, com consulta sanitizada pela loja destino sem histórico comercial privado.

Atualização 1.26: compartilhamento de cliente passou a exigir motivo explícito, persistir esse motivo no banco, permitir revogação auditada com motivo e remover automaticamente o acesso da loja destino quando o compartilhamento é revogado.

Atualização 1.27: exportação CSV de clientes passou a registrar evento operacional `CLIENTS_EXPORTED` com negócio, usuário, recurso, formato, quantidade e filtros, além de expor consulta auditada em `/auditoria/eventos`.

Atualização 1.28: navegação do frontend separada por operação comercial e Admin/Sistema, com rotas técnicas ocultas para perfis não autorizados, dock mobile com cinco atalhos principais, menu `Mais` para módulos secundários e pesquisa global comercial sobre clientes/conversas, pedidos e produtos.

Atualização 1.29: Painel passou a incluir a área "Hoje na loja", reunindo pedidos novos, pagamentos pendentes, conversas sem resposta, stock baixo, entregas pendentes, faturação do dia e tarefas atrasadas em cartões compactos de ação diária.

Atualização 1.30: backend CRM+ ampliado com importação CSV de clientes/produtos, fusão de clientes com preview, segmentação operacional, ações rápidas de cliente, orçamentos, listas de preparação/entrega, recuperação de pedidos parados, relatórios comerciais, configuração de pagamentos, templates WhatsApp persistidos por negócio, campanhas segmentadas com opt-out, pausa imediata, métricas, papéis/membros, eventos idempotentes e jobs operacionais com migrations/testes.

Atualização 1.31: backend de Conversas evoluiu para inbox comercial acionável, com resposta WhatsApp dentro da conversa, criação de pedido contextual, sugestão de próximas ações, tarefa automática por SLA sem resposta, tarefas humanas para reclamação/desconto/troca em Social Inbox e bloqueio de tracking público com telefone, email, nome ou endereço.

Atualização 1.32: backend CRM+ recebeu transferência operacional de conversa/pedido/tarefa com motivo, onboarding operacional ampliado, deduplicação e filtros comerciais da Social Inbox, rate limit público separado e bloqueio de texto promocional em categorias WhatsApp de utilidade/autenticação.

Atualização 1.33: backend CRM+ fechou novas lacunas operacionais com solicitação/aprovação auditada de descontos em pedidos, oportunidade de carrinho abandonado com consentimento e deduplicação, pacote de divulgação para afiliados/criadores, resolução pública de link curto rastreável, bloqueio de autoindicação de afiliado, relatório social-receita, auditoria operacional legível e anonimização de cliente preservando histórico financeiro.

Atualização 1.34: exportação CSV de pedidos passou a incluir resumo de itens, filtros por cliente/produto cobertos por teste e evento auditável `ORDERS_EXPORTED` com usuário, negócio, quantidade e filtros. A política WhatsApp passou a classificar carrinho abandonado, lead frio, cliente inativo, novidades, reengajamento, campanhas e divulgação de afiliados/criadores como `marketing` por padrão, exigindo consentimento antes do provider.

Atualização 1.35: exportação CSV do relatório comercial passou a registrar evento auditável `REPORTS_EXPORTED` com usuário, negócio, quantidade, formato e filtros, fechando a trilha mínima de auditoria para clientes, pedidos e relatórios.

Atualização 1.36: exportação CSV de clientes passou a aceitar filtros de busca, tag, estado de relacionamento e consentimento de marketing, incluindo campos de origem, username e consentimentos no ficheiro para apoiar segmentação operacional sem misturar clientes sem autorização.

Atualização 1.37: resumo do catálogo passou a devolver alertas operacionais de produtos com stock baixo, stock sem giro, ranking de vendidos e produtos reservados sem pagamento, alimentando decisões rápidas de reposição, cobrança e promoção.

Atualização 1.38: campanhas WhatsApp passaram a bloquear criação sem segmento claro, evitando disparo acidental para todos os clientes; segmentos aceites devem usar filtros operacionais como tag, estado de relacionamento, origem ou consentimento de marketing.

Atualização 1.39: relatório comercial passou a exportar PDF simples com resumo de vendas, cobrança, atendimento, oportunidades perdidas e ranking de produtos, mantendo auditoria `REPORTS_EXPORTED` com usuário, negócio, formato, quantidade e filtros também para PDF.

Atualização 1.40: relatório comercial passou a aceitar filtro por coleção de produto, restringindo pedidos, reservas e rankings aos produtos daquela coleção para fechar os filtros operacionais de período, canal, produto, coleção, responsável e estado do pedido.

Atualização 1.41: Cliente 360 passou a calcular indicadores comerciais completos a partir de pedidos e reservas: total gasto, compras pagas, pedidos pagos, pedidos cancelados, pedidos com pagamento pendente, reservas expiradas, tempo médio de pagamento e data da última compra. A segmentação comportamental agora considera pedidos reais e reservas antigas de live sem duplicar compra convertida em pedido.

Atualização 1.42: Clientes 360 passaram a manter agenda de endereços de entrega reutilizáveis, com rota para cadastrar/listar endereços por cliente e criação de pedido usando `enderecoEntregaId` para preencher automaticamente o endereço textual do pedido.

Atualização 1.43: Cadastro manual de cliente passou a aceitar WhatsApp como contacto principal, notas internas e endereço inicial de entrega, salvando notas/preferências no Cliente 360 e endereço na agenda reutilizável do cliente.

Atualização 1.44: Relatório comercial passou a cobrir o ranking completo de produtos exigido para CRM de loja: mais vendidos, encalhados, maior margem e reserva perdida, ordenando perdas por quantidade e impacto financeiro estimado.

Atualização 1.45: Inbox comercial passou a expor `/atendimento/conversas/filtros`, agregando contadores e conversas para sem resposta, pagamento pendente, entrega pendente, VIP, reclamação, campanha respondida e meu atendimento com base em estado CRM, prioridade, tags, responsável, reserva/pedido e contexto das mensagens.

Atualização 1.46: Relatório comercial passou a medir desempenho real de atendimento com conversas abertas, conversas resolvidas, tempo médio de primeira resposta, taxa de resolução, mensagens falhadas e tarefas abertas/atrasadas, expondo esses indicadores em JSON, CSV e PDF.

Atualização 1.47: Relatório comercial passou a incluir desempenho de campanhas com receita atribuída, respostas, opt-out, falhas, pedidos gerados e segmentos que converteram, cruzando campanhas, itens, tracking e pedidos pagos sem duplicar receita por pedido.

Atualização 1.48: Relatório comercial passou a sinalizar oportunidades perdidas e recuperáveis com clientes que perguntaram e não compraram, comprovativos não enviados, leads sociais sem atendimento e cliques WhatsApp sem compra, além de pedidos pendentes, reservas expiradas e conversas sem resposta.

Atualização 1.49: Relatório comercial passou a medir retenção com tempo médio entre compras, dias médios desde última compra, distribuição de clientes por recência/risco e coortes mensais de recompra com taxa de retenção e receita de recompra.

Atualização 1.50: Tarefas automáticas passaram a ter rotina operacional em `/tarefas/automaticas/rotina`, criando cobranças por pagamento vencido, entregas para pedido pago sem entrega, resposta urgente para cliente VIP sem resposta, reposição de stock baixo/esgotado e pós-venda após entrega, com deduplicação de tarefas abertas.

Atualização 1.51: Painel passou a expor `minhasTarefas` e `tarefasOperacionais`, ordenando tarefas do usuário por atraso, prioridade e impacto comercial para apoiar a rotina diária de vendedor/atendente.

Atualização 1.52: Tarefas operacionais passaram a validar vínculos de cliente e pedido no backend, preenchendo automaticamente o cliente a partir do pedido e recusando tarefas com cliente ou pedido inexistente/inconsistente.

Atualização 1.53: Permissões comerciais ficaram mais finas para ações críticas: desconto acima do limite exige perfil autorizado, aprovação de desconto usa permissão própria, cancelamento de pedido exige permissão e motivo, e exportação de clientes tem permissão dedicada.

Atualização 1.54: Auditoria crítica passou a registrar alterações humanas de pedido, pagamento, entrega, cancelamento, stock manual e permissões/membros com ator, papel, motivo e diff antes/depois.

Atualização 1.55: Reservas de live passaram a poder virar pedidos completos por rota autenticada e auditada, de forma idempotente, preservando cliente, origem, item, desconto autorizado, entrega e compatibilidade com a operação antiga de reservas.

Atualização 1.56: Pedidos passaram a permitir atualização dos itens antes da confirmação de pagamento, com substituição auditada da lista, ajuste de quantidade, remoção por omissão, recálculo financeiro e validação de stock livre sem contar o próprio pedido.

Atualização 1.57: Requisitos de desconto, APIs completas de pedido e auditoria crítica foram reconciliados no MD: motivo obrigatório, limite configurável, aprovação por perfil, comprovativos, origem comercial e diff auditável já estão cobertos no backend.

Atualização 1.58: Catálogo WhatsApp de cobrança passou a incluir template aprovado de utilidade para pedir comprovativo pendente, fechando o fluxo mínimo de pagamento, lembrete, comprovativo pendente e pagamento confirmado.

Atualização 1.59: Pedidos passaram a ter fluxo completo de comprovativo de pagamento no backend, com anexo por URL/data URL privada, rejeição com motivo, confirmação, recibo operacional e histórico auditável de aprovação/rejeição.

Atualização 1.60: Loja pública passou a aceitar busca e filtros de produto no endpoint público, com normalização de acentos para categoria, coleção e texto livre, além de limite controlado para listagens.

Atualização 1.61: Social Inbox passou a aceitar importação CSV para fallback operacional quando o provider social não liberar extração automática, com relatório de criados, duplicados e erros por linha.

Atualização 1.62: Checkout público do site passou a exigir consentimento de dados antes de confirmar o pedido, mantendo compra sem conta, mas com contacto validável e aceite mínimo.

Atualização 1.63: Loja pública e página pública de produto passaram a devolver metadados de SEO e preview social por canal para WhatsApp, Facebook, Instagram, TikTok e navegador, com título, descrição, imagem destacada e caminho canónico preparados para o frontend renderizar as tags finais.

Atualização 1.64: Produtos passaram a aceitar configuração de vitrine pública com selos comerciais, prioridade, texto promocional, preço promocional e componentes de kit. A loja pública agora devolve agrupamentos prontos para destaques, promoções, novidades, reposições, mais vendidos e kits.

Atualização 1.65: Parser de comentários passou a aceitar dicionário por negócio ou segmento, com termos de intenção de compra, rótulos alternativos de artigo/ref/SKU e aliases de produto guardados na configuração do negócio e aplicados ao processamento manual ou live.

Atualização 1.66: Atribuição comercial do checkout passou a suportar primeiro toque, último toque, conversão assistida e ajuste manual auditado. A janela de atribuição pode vir da configuração do negócio ou de metadados do parceiro, preservando assistências no pedido/tracking e permitindo correção humana com motivo e histórico.

Atualização 1.67: Loja pública e checkout passaram a preparar eventos server-side para providers futuros como Meta CAPI quando o negócio configura provider, pixel/dataset e referência segura de credencial. O backend só enfileira evento operacional com consentimento aplicável e armazena telefone/email como hash SHA-256, sem vazar dados pessoais no payload.

Atualização 1.68: Criadores e revendedores passaram a poder expor uma mini-loja pública a partir de um link próprio ativo, com apenas produtos autorizados por links de produto, rastreamento próprio, URL pública por produto e resposta sanitizada sem contacto, método de pagamento ou dados privados do parceiro.

Atualização 1.69: Modo revendedor passou a expor, na mini-loja pública, preço especial calculado por desconto, margem/preço sugerido, limite e validade de reserva de stock e regras públicas de entrega/retirada quando o negócio configurar esses dados no perfil do parceiro.

Atualização 1.70: Social Inbox passou a gerir contas sociais conectadas por providers oficiais ou conectores autorizados, com catálogo de providers, persistência por negócio, referência segura de credencial, rejeição de tokens brutos e validação das permissões mínimas antes de liberar captura futura.

Atualização 1.71: Social Inbox passou a ter captura controlada de eventos de provider em `/social/inbox/capturar`, aceitando comentários de foto, vídeo, post, live, reel e story somente quando a conta social do negócio está conectada, o provider é autorizado e a permissão `comments.read` está presente.

Atualização 1.72: Social Inbox ganhou classificador conservador de intenção para comentários sem intenção enviada pelo provider, cobrindo preço, disponibilidade, tamanho/cor, entrega, reclamação, compra, lead quente, lead frio, spam e dúvida geral, registrando a regra no contexto para auditoria.

Atualização 1.73: Social Inbox passou a sincronizar comentários sociais acionáveis com o atendimento CRM, criando conversa com o cliente quando houver telefone, preservando autor/post/contexto na mensagem e abrindo oportunidade de recuperação vinculada à tarefa comercial.

Atualização 1.74: Capturas do Social Inbox passaram a registrar auditoria operacional `SOCIAL_INBOX_CAPTURED` com provider, post, link original, autor, intenção, confiança, origem da captura, permissões e data, tornando a origem do lead rastreável fora do JSON interno do item.

Atualização 1.75: Interações do Social Inbox com telefone passaram a poder ser levadas para WhatsApp por `/social/inbox/itens/:id/whatsapp`, enviando mensagem de serviço com política WhatsApp, registrando a resposta na conversa CRM e preservando post, autor, intenção e contexto original.

Atualização 1.76: Comentários sociais com intenção comercial passaram a movimentar o funil automaticamente para `LEAD` e, quando houver telefone e conversa criada no atendimento, para `CONVERSA`, preservando origem, post, autor, intenção e confiança no contexto do movimento.

Atualização 1.77: Eventos de tracking da loja pública passaram a alimentar o funil operacional por `trackingId` e por pedido, avançando de visita para produto visto, clique WhatsApp, checkout, pedido e pagamento pendente sem regredir etapa quando o cliente repete uma ação anterior.

Atualização 1.78: Pedidos manuais e de checkout passaram a alimentar automaticamente o funil por pedido, registrando criação, pagamento pendente, pagamento confirmado, preparação, entrega, entregue e perda operacional quando o estado do pedido/entrega avançar de forma segura.

Atualização 1.79: Respostas manuais de WhatsApp classificadas como serviço agora calculam automaticamente a janela de atendimento pela última mensagem inbound da conversa nos últimos 24h, bloqueando texto livre fora da janela e devolvendo erro de regra de negócio em vez de falha interna.

Atualização 1.80: Checkout público por WhatsApp passou a resolver referência de afiliado/criador antes de existir pedido, preservando origem efetiva, link principal, assistências e tracking do clique para que vendas iniciadas por WhatsApp não percam atribuição comercial.

Atualização 1.81: Entrega pública passou a aceitar `ORCAMENTO`, permitindo checkout WhatsApp/site sem bloquear compra quando a taxa precisa de validação humana; o total fica sem taxa automática e a mensagem ao cliente informa que a equipa confirma o valor antes do pagamento.

Atualização 1.82: Afiliados/criadores passaram a suportar regras de comissão específicas por produto, preservando a regra no cadastro do parceiro e calculando a comissão por item do pedido antes de aplicar a regra geral do parceiro.

Atualização 1.83: Templates WhatsApp do negócio passaram a ter ciclo de vida operacional com motivo obrigatório para rejeição, pausa, substituição ou descontinuação; estados finais desativam o template e impedem uso em campanhas.

Atualização 1.84: Resumo de afiliados/criadores passou a expor receita atribuída, pedidos pagos, ticket médio e comissão pendente no ranking, deixando o backend mais pronto para painel operacional de parcerias.

Atualização 1.85: Links de afiliados/criadores passaram a suportar destino comercial genérico e metadata operacional, permitindo rastrear campanhas, vendedor, post social, live e UTMs sem criar um link diferente para cada canal.

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

Nas tabelas de RF, RNF, RN e fora de escopo, o marcador deve aparecer no início do texto do item. A coluna `Estado` deve descrever a situação sem repetir o marcador.

| Estado | Significado |
|---|---|
| Implementado | Já existe no código atual |
| Parcial | Existe parcialmente, mas precisa completar |
| Planeado | Deve ser implementado para o piloto ou pós-piloto |
| Pós-MVP | Fora do escopo imediato do piloto |
| Em escopo CRM | Saiu do fora de escopo e entra na próxima etapa CRM |
| Em escopo CRM+ | Entra na etapa Bizy CRM+ Social Commerce |
| Parcial CRM | Parte entra na próxima etapa CRM; parte continua para evolução posterior |
| Processo | Regra operacional do piloto, não necessariamente implementação de código |

---

## 3. Requisitos Funcionais (RF)

### 3.1 Autenticação e Sessão

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF01 | [x] O sistema deve permitir login por telefone móvel angolano. | Alta | Implementado |
| RF02 | [x] O sistema deve enviar código SMS de autenticação usando provider configurável, inicialmente Ombala. | Alta | Implementado |
| RF03 | [x] O sistema deve confirmar o código SMS e criar uma sessão autenticada para o vendedor. | Alta | Implementado |
| RF04 | [x] O código SMS deve expirar no tempo configurado e não pode ser reutilizado. | Alta | Implementado |
| RF05 | [x] Em ambiente de desenvolvimento, o sistema pode expor o código para facilitar testes. | Média | Implementado |
| RF06 | [x] Em produção, o sistema não deve expor código SMS em resposta, UI ou logs públicos. | Alta | Implementado |
| RF07 | [x] O vendedor deve poder encerrar a sessão pelo painel. | Alta | Implementado |
| RF07A | [x] O sistema deve permitir login estudantil por UOR/ISPTEC usando o mesmo padrão de validação do UOR Connect. | Alta | Implementado |
| RF07B | [x] O sistema deve permitir login com Gmail via OAuth quando `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estiverem configurados. | Alta | Implementado |
| RF07C | [x] O sistema deve separar identidade de telefone, permitindo usuários com telefone, Gmail ou identidade estudantil sem criar números falsos. | Alta | Implementado |
| RF07D | [x] O sistema deve persistir origem do cadastro, email, avatar e perfil académico quando esses dados forem devolvidos pelo provedor de autenticação. | Alta | Implementado |
| RF07E | [x] Após o primeiro login, o usuário deve passar por onboarding para cadastrar negócio, canais de venda, pagamentos e regra padrão de reserva. | Alta | Implementado |
| RF07F | [x] O onboarding deve permitir criar o primeiro produto ligado ao negócio antes de entrar na operação diária. | Alta | Implementado |
| RF07G | [x] O login com Gmail deve informar claramente quando as credenciais OAuth ainda não estiverem configuradas. | Média | Implementado |

### 3.2 Catálogo de Peças

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF08 | [x] O vendedor deve poder cadastrar peça com código, nome, descrição, preço e quantidade. | Alta | Implementado |
| RF09 | [x] O código da peça deve ser único dentro do catálogo de cada negócio/loja, não globalmente entre todas as lojas. | Alta | Implementado |
| RF10 | [x] O vendedor deve poder listar e pesquisar peças por nome ou código. | Alta | Implementado |
| RF11 | [x] O vendedor deve poder editar preço, quantidade, nome, descrição, fotos e estado da peça. | Alta | Implementado |
| RF12 | [x] O vendedor deve poder desativar ou remover uma peça que não será vendida na live. | Média | Implementado |
| RF13 | [x] O catálogo deve aceitar foto opcional da peça via URL ou placeholder. | Média | Implementado |
| RF14 | [x] O painel deve mostrar o estado da peça: disponível, reservada, vendida ou esgotada. | Alta | Implementado |

### 3.3 Captura de Comentários de Live

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF15 | [x] O sistema deve conectar numa live do TikTok pelo `username` ou `uniqueId`. | Alta | Implementado |
| RF16 | [x] O sistema deve capturar comentários da live em tempo real. | Alta | Implementado |
| RF17 | [x] O sistema deve normalizar comentários capturados para um formato interno único. | Alta | Implementado |
| RF18 | [x] O sistema deve permitir selecionar provider de captura: TikTok principal, TikTok Python ou manual. | Alta | Implementado |
| RF19 | [x] O sistema deve fornecer modo manual para simular ou registrar comentários quando a captura automática falhar. | Alta | Implementado |
| RF20 | [x] O painel deve exibir comentários capturados em tempo real. | Alta | Implementado |

### 3.4 Parser de Intenção

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF21 | [x] O sistema deve identificar intenção de compra em português informal. | Alta | Implementado |
| RF22 | [x] O sistema deve extrair telefone móvel angolano válido do comentário. | Alta | Implementado |
| RF23 | [x] O sistema deve extrair código da peça independentemente da ordem do telefone e do código. | Alta | Implementado |
| RF24 | [x] O sistema deve calcular nível de confiança da interpretação. | Alta | Implementado |
| RF25 | [x] O sistema deve marcar comentários ambíguos para revisão manual. | Alta | Implementado |
| RF26 | [x] O sistema deve suportar variações como `peça 4`, `peca 4`, `#4`, `produto 4`, `item 4` e código livre. | Alta | Implementado |
| RF27 | [x] O sistema deve permitir evoluir o parser com dicionário de termos por loja ou por segmento. | Baixa | Implementado no backend |
| RF28 | [x] Quando o comentário mencionar mais de uma peça, o sistema deve permitir criar múltiplas reservas vinculadas ao mesmo telefone. | Média | Implementado |

### 3.5 Revisão Manual

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF29 | [x] O painel deve listar comentários pendentes de revisão manual. | Alta | Implementado |
| RF30 | [x] O vendedor deve poder corrigir telefone, código da peça e observação de um comentário em revisão. | Alta | Implementado |
| RF31 | [x] O vendedor deve poder aprovar manualmente um comentário e forçar a criação da reserva. | Alta | Implementado |
| RF32 | [x] O vendedor deve poder rejeitar ou ignorar um comentário em revisão. | Alta | Implementado |
| RF33 | [x] A aprovação manual deve criar reserva em até 10 segundos em condições normais. | Alta | Implementado |

### 3.6 Motor de Reservas e Fila

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF34 | [x] O sistema deve criar reserva automática para o primeiro comentário válido. | Alta | Implementado |
| RF35 | [x] O sistema deve impedir reservas duplicadas ativas para o mesmo telefone e mesma peça. | Alta | Implementado |
| RF36 | [x] O sistema deve colocar o cliente em fila de espera quando não houver stock livre. | Alta | Implementado |
| RF37 | [x] Reservas ativas devem bloquear stock durante o prazo de pagamento. | Alta | Implementado |
| RF38 | [x] O sistema deve expirar reservas não pagas após o prazo configurado. | Alta | Implementado |
| RF39 | [x] O prazo padrão do MVP deve ser configurável, com recomendação de 15 minutos para piloto. | Alta | Implementado |
| RF40 | [x] Ao expirar ou cancelar uma reserva, o sistema deve promover automaticamente o primeiro cliente da fila. | Alta | Implementado |
| RF41 | [x] O vendedor deve poder cancelar uma reserva manualmente. | Alta | Implementado |
| RF42 | [x] O vendedor deve poder confirmar pagamento de uma reserva. | Alta | Implementado |
| RF43 | [x] O sistema deve atualizar o estado da peça quando todo o stock for vendido. | Alta | Implementado |

### 3.7 Painel Operacional

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF44 | [x] O painel deve mostrar estado da live, comentários, reservas, stock, fila e integrações. | Alta | Implementado |
| RF45 | [x] O painel deve atualizar dados em tempo real via SSE. | Alta | Implementado |
| RF46 | [x] O painel deve destacar reservas próximas da expiração. | Alta | Implementado |
| RF47 | [x] O painel deve permitir ações rápidas em até 2 cliques para confirmar pagamento e cancelar reserva. | Alta | Implementado |
| RF48 | [x] O painel deve mostrar métricas de operação: reservas criadas, pagas, pendentes, fila e conversão. | Alta | Implementado |
| RF49 | [x] O painel deve exibir atividade recente com eventos de reserva, pagamento, expiração e mensagens. | Média | Implementado |

### 3.8 WhatsApp e Atendimento

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF50 | [x] O sistema deve permitir conectar WhatsApp via Evolution API com QR Code ou código de pareamento. | Alta | Implementado |
| RF51 | [x] O painel deve permitir criar, conectar, consultar, definir padrão e remover instâncias Evolution. | Alta | Implementado |
| RF52 | [x] O sistema deve enviar mensagens automáticas de reserva, fila, expiração, pagamento, cancelamento e peça vendida. | Alta | Implementado |
| RF52A | [x] Quando o comentário tiver telefone, mas a peça estiver ausente ou não existir no catálogo, o sistema deve contactar o cliente e pedir o código da peça. | Alta | Implementado |
| RF53 | [x] O sistema deve receber e normalizar webhooks de mensagens recebidas pela Evolution API. | Alta | Implementado |
| RF54 | [x] O vendedor deve poder enviar mensagem manual pelo painel sem sair do ÉMeu. | Alta | Implementado |
| RF55 | [x] O painel deve oferecer templates de WhatsApp para IBAN, reserva, lembrete, pagamento confirmado e atendimento. | Alta | Implementado |
| RF56 | [x] A página de conversas deve mostrar histórico do cliente, reserva atual e contexto operacional. | Alta | Implementado |
| RF56A | [x] O vendedor deve poder limpar, com confirmação explícita, dados operacionais de comentários, histórico de atendimento, outbox/mensagens WhatsApp e códigos SMS sem apagar produtos, reservas, usuários ou conexão WhatsApp. | Média | Implementado |

### 3.9 Pagamento e Pós-Venda

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF57 | [x] O sistema deve registrar comprovativo de pagamento recebido por URL externa ou ficheiro `dataUrl` de imagem/PDF. | Alta | Implementado |
| RF58 | [x] O vendedor ou fluxo autorizado deve poder confirmar pagamento. | Alta | Implementado |
| RF59 | [x] O vendedor ou fluxo autorizado deve poder rejeitar pagamento com motivo. | Alta | Implementado |
| RF60 | [x] O estado de pagamento deve ser exibido no painel de reservas e conversas. | Alta | Implementado |
| RF61 | [x] O sistema deve atualizar endereço de entrega após pagamento confirmado. | Média | Implementado |
| RF62 | [x] O sistema deve marcar pedido como entregue por endpoint controlado. | Média | Implementado |
| RF63 | [x] O sistema deve exportar lista de entregas ao final da live. | Média | Implementado |
| RF63A | [x] O sistema deve emitir recibo PDF autenticado para cada reserva. | Média | Implementado |

### 3.10 n8n e Automações

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF64 | [x] O backend deve publicar eventos de venda para o n8n por webhook assinado. | Alta | Implementado |
| RF65 | [x] Eventos destinados ao n8n devem ser persistidos em outbox antes da publicação ou para retry. | Alta | Implementado |
| RF66 | [x] O backend deve expor endpoints `/n8n/*` para consulta contextual e ações controladas. | Alta | Implementado |
| RF67 | [x] O n8n deve poder consultar cliente, reservas ativas e produto antes de responder ao cliente. | Alta | Implementado |
| RF68 | [x] O n8n deve encaminhar casos sensíveis para aprovação humana. | Alta | Implementado |
| RF69 | [x] O painel deve mostrar workflows, guardrails e estado operacional das automações. | Média | Implementado |
| RF70 | [x] O painel deve mostrar eventos pendentes, falhados e publicados da outbox n8n. | Média | Implementado |

### 3.11 Configurações e Piloto

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF71 | [x] URLs, tokens e segredos devem ser configurados por variáveis de ambiente. | Alta | Implementado |
| RF72 | [x] O frontend não deve depender de URLs hardcoded para n8n, Evolution ou backend em produção. | Alta | Implementado |
| RF73 | [x] O painel deve mostrar configurações operacionais em execução. | Média | Implementado |
| RF74 | [x] O sistema deve registrar métricas úteis para piloto: comentário, reserva, revisão, pagamento e expiração. | Alta | Implementado |
| RF75 | [x] O sistema deve permitir gerar relatório de live piloto com métricas e feedback. | Média | Implementado |

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
| RF76 | [x] A navegação principal do CRM deve conter apenas módulos de uso frequente: Painel, Pedidos, Produtos, Clientes, Conversas, Campanhas, Relatórios e Configurações da Loja. | Alta | Implementado no frontend |
| RF77 | [x] Funcionalidades técnicas como n8n, providers, filas internas, saúde da automação e logs devem sair da navegação da loja e ficar em área Admin/Sistema acessível apenas a perfis autorizados. | Alta | Implementado no frontend com separação de rotas e guarda por perfil |
| RF78 | [x] O sistema deve remover ou ocultar submenus sem utilidade operacional imediata, como `Drafts`, `Calendário`, `Resumo`, `Categoria`, `Descontos`, `Chatbot`, `Explorar`, `Relatórios` vazios, `Site`, `Montra`, `Finalizar compra`, `Apresentação`, `Menu` e `Páginas`, até existir fluxo real para cada um. | Alta | Implementado na navegação atual |
| RF79 | [x] O módulo Painel deve mostrar o que a loja precisa fazer hoje: pedidos novos, pagamentos pendentes, conversas sem resposta, produtos com stock baixo, entregas pendentes, faturação do dia e tarefas atrasadas. | Alta | Implementado no frontend |
| RF80 | [~] A interface deve oferecer pesquisa global por cliente, telefone, produto, código de peça, pedido, conversa e comprovativo. | Alta | Parcial - pesquisa global já cobre clientes/conversas, pedidos, produtos, códigos e estados de pagamento; falta busca em anexos/ficheiros de comprovativo |
| RF81 | [x] A navegação mobile deve priorizar até 5 atalhos: Painel, Pedidos, Clientes, Conversas e Mais. | Alta | Implementado |
| RF82 | [x] O menu `Mais` no mobile deve agrupar Produtos, Campanhas, Relatórios, Configurações da Loja e Admin/Sistema quando permitido. | Média | Implementado |
| RF83 | [~] Telas vazias devem explicar a próxima ação útil, como importar clientes, criar produto, criar pedido, conectar WhatsApp ou enviar primeira campanha. | Alta | Parcial - padrão de estado vazio existe e cobre páginas principais; falta revisão fina de todos os casos novos |
| RF84 | [x] O sistema deve evitar páginas decorativas, estatísticas vazias ou configurações técnicas expostas à vendedora sem ação clara. | Alta | Implementado na navegação comercial atual |

#### 3.13.2 Clientes 360

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF85 | [~] O CRM deve ter lista de clientes com nome, telefone, WhatsApp, última interação, último pedido, total comprado, estado, tags e responsável. | Alta | Parcial - API lista clientes com métricas de reserva/mensagem/compra; faltam WhatsApp explícito, último pedido e responsável na UI |
| RF86 | [x] O vendedor deve poder cadastrar cliente manualmente com nome, telefone, WhatsApp, endereço, notas, tags, origem e consentimento de comunicação. | Alta | Implementado no backend com telefone/WhatsApp/email, endereço inicial reutilizável, notas internas, tags, origem e consentimentos |
| RF87 | [x] O sistema deve importar clientes por CSV/Excel com validação de telefone angolano, deduplicação e relatório de erros. | Alta | Implementado no backend para CSV com relatório de criados, atualizados e erros |
| RF88 | [~] O perfil do cliente deve mostrar visão 360: dados pessoais, conversas, pedidos, pagamentos, reservas, entregas, notas internas, tags, tarefas e histórico de campanhas. | Alta | Parcial - API entrega dados pessoais, métricas, reservas, conversas, ações e preferências; faltam completar UI e histórico de campanhas no perfil |
| RF89 | [~] O sistema deve deduplicar clientes por telefone canónico, mantendo aliases de username, TikTok, Instagram ou nome exibido. | Alta | Parcial - backend normaliza telefone angolano, preserva username/userId/avatar/preferências por negócio e permite fusão; faltam aliases sociais por provider completos |
| RF90 | [x] O vendedor deve poder fundir clientes duplicados com pré-visualização de dados que serão mantidos. | Média | Implementado no backend com preview, motivo obrigatório e marcação da origem mesclada |
| RF91 | [x] O CRM deve segmentar clientes por comportamento: novo, primeiro pedido, recorrente, VIP, inativo, nunca comprou, pagamento pendente, carrinho/reserva perdida e alto potencial. | Alta | Implementado no backend em `/clientes/segmentos`, considerando pedidos reais, reservas antigas de live, pendências, tags e interações |
| RF92 | [~] O perfil do cliente deve permitir ações rápidas: enviar WhatsApp, criar pedido, reservar produto, adicionar nota, criar tarefa, atribuir responsável e marcar follow-up. | Alta | Parcial - backend cria tarefa/follow-up a partir do cliente; demais ações diretas ainda dependem de UI e fluxos específicos |
| RF93 | [x] O sistema deve registrar preferências do cliente, como tamanho, cor, categoria favorita, faixa de preço, bairro de entrega e observações de atendimento. | Média | Implementado no backend via preferências estruturadas do Cliente 360 e importação CSV |
| RF94 | [x] O CRM deve calcular indicadores por cliente: total gasto, pedidos pagos, pedidos cancelados, reservas expiradas, tempo médio de pagamento e data da última compra. | Alta | Implementado no backend em listagem, perfil 360 e exportação CSV de clientes |
| RF95 | [x] O vendedor deve poder marcar cliente como bloqueado, sem WhatsApp, sem consentimento, inadimplente ou prioridade alta. | Alta | Implementado no backend por `estadoRelacionamento` |
| RF96 | [x] O sistema deve permitir exportar clientes filtrados com campos úteis para operação e marketing autorizado. | Média | Implementado - exportação CSV autenticada e auditada com filtros por busca, tag, estado, limite e consentimento de marketing; inclui origem, username e consentimentos |

#### 3.13.3 Pedidos, Cobrança e Entrega

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF97 | [x] Reservas devem evoluir para pedidos completos com cliente, itens, quantidade, desconto autorizado, total, estado de pagamento, estado de entrega e origem. | Alta | Implementado - pedido completo criado por API e reservas de live convertidas por rota idempotente `/reservas/:id/converter-pedido` |
| RF98 | [~] O vendedor deve criar pedido manual fora da live a partir do cliente ou da conversa. | Alta | Parcial - API manual implementada a partir do cliente; falta ação direta na conversa/UI |
| RF99 | [x] O pedido deve suportar múltiplos itens, ajuste de quantidade, remoção de item e validação de stock antes de confirmar. | Alta | Implementado - criação e atualização de itens por `PATCH /pedidos/:id/itens`, com recálculo financeiro, remoção por omissão e stock validado antes do pagamento |
| RF100 | [~] O CRM deve ter funil de pedidos com estados: novo, aguardando pagamento, pago, em preparação, pronto para entrega, enviado, entregue, cancelado, trocado e devolvido. | Alta | Parcial - estados de funil suportados no backend; falta UI kanban/lista operacional |
| RF101 | [x] O sistema deve permitir cobrança por WhatsApp com templates de pagamento, lembrete, comprovativo pendente e pagamento confirmado. | Alta | Implementado - catálogo interno aprovado cobre dados de pagamento, lembrete, pedido de comprovativo pendente e confirmação de pagamento com política WhatsApp de utilidade |
| RF102 | [x] O pedido deve anexar comprovativos, recibos, notas de pagamento e histórico de aprovação/rejeição. | Alta | Implementado - `/pedidos/:id/comprovativo`, `/rejeitar-pagamento`, `/confirmar-pagamento`, `/recibo` e `/historico-pagamento` cobrem comprovativo, notas, recibo e trilha auditável |
| RF103 | [x] O vendedor deve poder aplicar desconto apenas com motivo obrigatório e auditoria. | Média | Implementado - motivo obrigatório, limite configurável por negócio, aprovação por perfil autorizado e auditoria crítica de desconto |
| RF104 | [x] O CRM deve registrar endereço de entrega por pedido e permitir reutilizar endereços salvos do cliente. | Alta | Implementado no backend com agenda de endereços do Cliente 360 e criação de pedido por `enderecoEntregaId` |
| RF105 | [x] O sistema deve gerar lista de preparação/separação com produtos, quantidades, fotos e códigos. | Média | Implementado no backend em `/pedidos/preparacao` |
| RF106 | [x] O sistema deve gerar lista de entrega por bairro, estado, entregador ou data. | Média | Implementado no backend em `/pedidos/entregas` com filtros operacionais |
| RF107 | [x] O vendedor deve marcar pedido como entregue com data, responsável e observação opcional. | Alta | Implementado no backend |
| RF108 | [~] O sistema deve permitir pedido rascunho apenas quando houver uso real: orçamento, carrinho em conversa ou checkout incompleto; não deve aparecer como submenu solto. | Média | Parcial - orçamento operacional com validade implementado no backend; falta carrinho persistente na conversa/checkout incompleto |
| RF109 | [x] O CRM deve permitir recuperar pedidos parados com lembrete automático ou tarefa humana. | Alta | Implementado no backend com geração de tarefas de cobrança/entrega/follow-up para pedidos parados |
| RF110 | [x] O pedido deve mostrar margem estimada quando custo do produto estiver cadastrado. | Baixa | Implementado no backend no detalhe do pedido |
| RF111 | [x] O sistema deve exportar pedidos com filtros por data, estado, cliente, produto, pagamento e entrega. | Média | Implementado - CSV de pedidos aceita filtros de estado, pagamento, entrega, data, cliente, produto e inclui resumo de itens |

#### 3.13.4 Produtos, Stock e Catálogo Comercial

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF112 | [x] Produtos devem suportar SKU/código, nome, fotos, descrição curta, preço, custo opcional, stock, estado e coleção de venda. | Alta | Implementado no backend |
| RF113 | [~] O sistema deve permitir criar coleções comerciais, como live atual, novidades, promoção, reposição, mais vendidos e catálogo WhatsApp. | Alta | Parcial - campo coleção e resumo por coleção implementados; faltam regras/telas de gestão |
| RF114 | [~] Categorias só devem aparecer quando forem usadas para filtros, relatórios ou catálogo; não devem ser menu principal separado sem conteúdo operacional. | Alta | Parcial - backend agrupa apenas categorias usadas; falta refletir no frontend |
| RF115 | [x] Descontos devem ser tratados como regra aplicada em pedido, campanha ou produto específico, não como página solta sem fluxo de aprovação. | Alta | Implementado no backend para pedidos com solicitação, tarefa de aprovação, aprovação financeira, recálculo de total e evento operacional |
| RF116 | [x] O CRM deve alertar produtos com stock baixo, stock parado, mais vendidos e produtos reservados sem pagamento. | Alta | Implementado no resumo do catálogo com alertas de baixo stock, stock sem giro, vendidos e reservas sem pagamento |
| RF117 | [x] O sistema deve manter histórico de movimentos de stock: entrada, venda, reserva, cancelamento, devolução, ajuste manual e correção. | Alta | Implementado no backend |
| RF118 | [x] O vendedor deve importar produtos por CSV/Excel com validação de código único e relatório de erros. | Média | Implementado no backend para CSV com upsert por código no negócio |
| RF119 | [x] O produto deve permitir variantes simples, como tamanho, cor ou modelo, quando a loja precisar. | Média | Implementado no backend |
| RF120 | [~] O CRM deve gerar catálogo compartilhável por WhatsApp com produtos selecionados, preço, fotos e disponibilidade. | Média | Parcial - loja pública e checkout WhatsApp por produto implementados; faltam catálogos selecionáveis por campanha |
| RF121 | [x] O sistema deve permitir arquivar produtos sem histórico de venda recente, preservando pedidos e relatórios antigos. | Média | Implementado no backend com estado `ARQUIVADO` e motivo |

#### 3.13.5 Conversas, Campanhas e Atendimento

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF122 | [~] Conversas devem ser a caixa de entrada comercial do CRM, unificando WhatsApp, comentários de live e eventos de pedido do cliente. | Alta | Parcial - backend unifica WhatsApp, comentários, reservas e eventos de pedido no inbox; falta polimento final de UI |
| RF123 | [~] Cada conversa deve estar vinculada a cliente, pedido atual quando houver, responsável, estado, prioridade, SLA e tags. | Alta | Parcial - conversa guarda cliente, responsável, estado, prioridade, tags e SLA gera tarefa; pedido atual é sugerido por cliente e falta vínculo único visual |
| RF124 | [~] A conversa deve permitir responder com texto livre, template aprovado, mensagem rápida, imagem, documento, recibo e link de catálogo. | Alta | Parcial - endpoint responde por WhatsApp com texto/template e registra mídia/recibo/catálogo como mensagem contextual; falta envio binário real pelo provider |
| RF125 | [x] O CRM deve sugerir próximas ações na conversa, como pedir comprovativo, confirmar pagamento, pedir endereço, oferecer alternativa, criar pedido ou marcar follow-up. | Alta | Implementado no backend com `/atendimento/conversas/:id/proximas-acoes` |
| RF126 | [~] `Chatbot` não deve ser módulo principal; automações devem aparecer como assistente dentro de Conversas, Campanhas ou Configurações da Loja. | Alta | Parcial - backend expõe automações como política/sugestão/tarefa dentro da conversa e campanhas; falta remoção total de qualquer promessa visual antiga |
| RF127 | [x] Campanhas devem substituir o conceito genérico de `Transmissões`, com foco em mensagens segmentadas e autorizadas por WhatsApp. | Alta | Implementado no backend com módulo `/campanhas` e templates WhatsApp por negócio |
| RF128 | [x] O vendedor deve criar campanha para segmentos de clientes com template aprovado, janela de envio, limite diário, preview e confirmação antes do disparo. | Alta | Implementado no backend com preview, bloqueios por política e confirmação explícita |
| RF129 | [~] O sistema deve mostrar resultado de campanha: enviados, entregues, lidos, respondidos, falhados, pedidos gerados e receita atribuída. | Média | Parcial - backend calcula selecionados, bloqueados, enfileirados e estados dos itens; faltam atualização automática por webhooks/receita atribuída |
| RF130 | [x] Clientes sem consentimento ou com opt-out não devem receber campanhas, mas podem receber mensagens transacionais permitidas. | Alta | Implementado no backend para campanhas marketing com política WhatsApp e bloqueio por consentimento |
| RF131 | [~] O CRM deve permitir sequências pós-venda: agradecer compra, pedir endereço, lembrar pagamento, confirmar entrega e reativar cliente inativo. | Média | Parcial - playbooks, templates utilidade e ações de conversa cobrem cobrança/endereço/entrega de forma segura; falta sequenciador temporal completo |
| RF132 | [x] A caixa de entrada deve ter filtros úteis: sem resposta, pagamento pendente, entrega pendente, VIP, reclamação, campanha respondida e meu atendimento. | Alta | Implementado no backend com `/atendimento/conversas/filtros`, devolvendo contadores e conversas por filtro operacional |

#### 3.13.6 Relatórios que a Loja Usa

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF133 | [x] Relatórios devem começar por indicadores práticos: vendas do dia, pedidos pagos, pagamentos pendentes, ticket médio, clientes novos, clientes recorrentes e conversão de reservas. | Alta | Implementado no backend em `/relatorios/comercial` |
| RF134 | [x] O CRM deve mostrar ranking de produtos mais vendidos, produtos encalhados, produtos com maior margem e produtos com mais reserva perdida. | Média | Implementado no backend em `/relatorios/comercial`, com ranking de perdas por reservas expiradas/canceladas e impacto financeiro |
| RF135 | [x] O CRM deve mostrar desempenho de atendimento: tempo médio de primeira resposta, conversas abertas, SLA vencido, mensagens falhadas e taxa de resolução. | Alta | Implementado no relatório comercial com métricas de primeira resposta, resolução, conversas abertas, mensagens falhadas e tarefas/SLA atrasadas |
| RF136 | [x] O CRM deve mostrar desempenho de campanhas: receita gerada, respostas, opt-out, falhas e segmentos que converteram. | Média | Implementado no relatório comercial com receita atribuída, pedidos gerados, respostas, opt-out, falhas e segmentos convertidos por tag, origem e estado |
| RF137 | [ ] A página `Explorar` não deve existir como relatório vazio; relatórios avançados só entram quando houver perguntas reais de negócio a responder. | Alta | Planeado |
| RF138 | [x] O vendedor deve exportar relatórios em CSV e PDF simples para operação diária. | Média | Implementado no backend em `/relatorios/comercial.csv` e `/relatorios/comercial.pdf`, ambos auditados |
| RF139 | [x] O sistema deve gerar resumo diário automático com vendas, pendências e tarefas para o dia seguinte. | Média | Implementado no backend em `/relatorios/resumo-diario` |
| RF140 | [x] O CRM deve permitir filtrar relatórios por período, canal, produto, coleção, responsável e estado do pedido. | Média | Implementado no backend em `/relatorios/comercial`, `/relatorios/resumo-diario`, CSV e PDF com filtro `colecao` |
| RF141 | [x] O painel deve mostrar oportunidades perdidas, como clientes que perguntaram e não compraram, reserva expirada e comprovativo não enviado. | Alta | Implementado no relatório comercial com pedidos aguardando pagamento, reservas expiradas, conversas sem resposta, clientes que perguntaram e não compraram, comprovativos não enviados, leads sociais sem atendimento e cliques WhatsApp sem compra |
| RF142 | [x] O CRM deve medir retenção simples: clientes que voltaram a comprar, tempo desde última compra e clientes em risco de sumir. | Média | Implementado no relatório comercial com clientes recorrentes, tempo médio entre compras, dias médios desde última compra, distribuição por risco e coortes mensais de recompra |
| RF143 | [x] Relatórios técnicos de automação devem ficar no Admin/Sistema, não no menu comercial da loja. | Alta | Implementado na navegação/rotas técnicas atuais |

#### 3.13.7 Tarefas, Equipa e Rotina da Loja

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF144 | [x] O CRM deve criar tarefas manuais ou automáticas para follow-up, cobrança, entrega, reclamação, reposição e pós-venda. | Alta | Implementado no backend com tarefas manuais, bloqueios WhatsApp, follow-up/SLA, recuperação de cobrança/entrega, reclamações sociais, rotina de reposição de stock e pós-venda |
| RF145 | [x] Cada tarefa deve ter responsável, cliente/pedido relacionado, prazo, prioridade, estado e observação. | Alta | Implementado no backend com campos normalizados, responsável, prazo, prioridade, estado, observação/contexto, conclusão, validação de cliente/pedido e preenchimento automático do cliente a partir do pedido |
| RF146 | [x] O vendedor deve ver `Minhas tarefas` no Painel, ordenadas por atraso e impacto comercial. | Alta | Implementado no backend do Painel com `minhasTarefas`, resumo operacional, ordenação por atraso/prioridade/tipo e classificação de impacto comercial |
| RF147 | [x] O sistema deve criar tarefa automática quando pagamento vencer, mensagem falhar, cliente VIP ficar sem resposta ou pedido pago ficar sem entrega. | Alta | Implementado no backend com tarefas de bloqueio/falha WhatsApp, cobrança vencida, cliente VIP sem resposta e pedido pago sem entrega via rotina automática |
| RF148 | [x] O CRM deve suportar papéis mínimos: dono da loja, vendedor, atendente, financeiro, entregador e admin técnico. | Média | Implementado no backend com catálogo de papéis e membros por negócio |
| RF149 | [x] Permissões devem controlar quem pode dar desconto, confirmar pagamento, cancelar pedido, exportar clientes e alterar configurações. | Alta | Implementado no backend com permissões por papel para pagamentos, aprovação de desconto, cancelamento, exportação de clientes e configurações, incluindo limite de desconto sem aprovação e motivo obrigatório no cancelamento |
| RF150 | [x] A equipa deve poder transferir conversa/pedido/tarefa entre responsáveis com motivo opcional. | Média | Implementado no backend por `/operacional/transferencias` com nota/observação de motivo |
| RF151 | [x] O sistema deve registrar auditoria de ações humanas críticas, incluindo quem fez, quando fez e qual dado foi alterado. | Alta | Implementado no backend com trilha operacional para pagamento, entrega, cancelamento, desconto aprovado, stock manual, permissões/membros, exportações, comissões, compartilhamento e fusão de cliente, registrando ator, motivo e diff antes/depois |

### 3.14 Bizy CRM+ Social Commerce - Criadores, Afiliados e Loja Virtual

Esta etapa posiciona o Bizy como uma plataforma de operação comercial para criadores, afiliados, revendedores, social sellers e lojas que vendem em múltiplos canais. A automação de live continua importante, mas deixa de ser o produto inteiro: ela passa a ser um canal de aquisição dentro de uma base maior com loja virtual, catálogo digital, checkout, tracking, afiliados, social inbox, funil e automações.

#### 3.14.1 Posicionamento e Arquitetura Comercial

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF152 | [~] O Bizy deve suportar perfis de negócio como loja tradicional, criador/influenciador, afiliado, revendedor, social seller e marca que vende em múltiplos canais. | Alta | Parcial - modelo aceita tipos extensíveis e onboarding cobre loja/criador/revendedor/serviço; falta fluxo dedicado para social seller/afiliado como negócio |
| RF153 | [~] O dono do negócio deve poder ativar ou desativar módulos conforme a operação: loja virtual, catálogo digital, afiliados, social inbox, campanhas, checkout, entrega, stock, relatórios e automações. | Alta | Parcial - backend lista catálogo de módulos e ativa/desativa por negócio; falta UI e políticas específicas por módulo |
| RF154 | [x] O onboarding do negócio deve capturar modelo de venda, canais ativos, áreas de entrega, métodos de pagamento, regras de comissão, política de troca/devolução, contas sociais e tipo de produto vendido. | Alta | Implementado no backend; dados operacionais ficam normalizados na configuração do negócio |
| RF155 | [~] O painel deve priorizar indicadores de dinheiro, oportunidade e operação: vendas, pedidos parados, leads recuperáveis, stock em risco, campanhas que geram receita e afiliados que vendem. | Alta | Parcial - backend expõe resumo diário, relatórios, oportunidades, stock baixo, campanhas e afiliados; falta composição final em UI única |
| RF156 | [~] Funcionalidades técnicas devem continuar separadas da operação comercial, mantendo o vendedor focado em atender, vender, cobrar, entregar e recuperar clientes. | Alta | Parcial - permissões/módulos e navegação separam operação de integrações; falta varredura final de todas as telas futuras |

#### 3.14.2 Loja Virtual, Montra e Catálogo Digital

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF157 | [~] Cada negócio deve poder publicar uma loja virtual com URL própria por slug e, futuramente, domínio personalizado. | Alta | Parcial - publicação por slug implementada; faltam domínio personalizado e frontend público completo |
| RF158 | [x] A loja virtual deve listar produtos com fotos, nome, preço, variantes, estado de stock, coleções, busca e filtros úteis. | Alta | Implementado no backend público com produtos vendáveis, fotos, preço, variantes, stock, coleção, busca, filtro por categoria, coleção, estado de stock e limite de listagem |
| RF159 | [~] A página pública de produto deve permitir partilha direta, seleção de variante, cálculo inicial de entrega e chamada para comprar pelo WhatsApp ou pelo checkout do site. | Alta | Parcial - endpoint público, chamada WhatsApp, cálculo de entrega e checkout site básico implementados; faltam UI pública e seleção avançada de variante |
| RF160 | [~] O dono do negócio deve poder criar catálogos digitais por coleção, campanha, live, afiliado, data comemorativa ou segmento de clientes. | Alta | Parcial - base de loja/catálogo público implementada; faltam entidades de catálogo por campanha/segmento |
| RF161 | [~] O catálogo digital deve gerar link partilhável e, quando necessário, resumo visual ou PDF simples com produtos, preços e disponibilidade. | Média | Parcial - slug público e links de produto implementados; faltam resumo visual/PDF |
| RF162 | [x] O catálogo deve respeitar stock e disponibilidade, ocultando produtos indisponíveis ou oferecendo lista de interesse/reposição. | Alta | Implementado para ocultar indisponíveis |
| RF163 | [~] A loja deve permitir destacar produtos, promoções, novidades, mais vendidos, reposições e kits. | Média | Parcial - backend aceita vitrine por produto e expõe agrupamentos públicos; falta UI de gestão/montra pública final |
| RF164 | [~] Páginas públicas devem ter metadados de SEO e preview social para WhatsApp, Facebook, Instagram, TikTok e navegadores. | Média | Parcial - backend público devolve título, descrição, imagem, canonicalPath e previews por canal; falta frontend renderizar `<title>`, meta description e tags sociais nas páginas públicas |

#### 3.14.3 Checkout WhatsApp/Site, Entrega e Pedido

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF165 | [x] O checkout por WhatsApp deve gerar mensagem pré-preenchida com produto, variante, quantidade, preço, entrega estimada e origem do link. | Alta | Implementado no backend, incluindo referência de afiliado/criador quando existir |
| RF166 | [~] O checkout pelo site deve criar pedido/carrinho com dados do cliente, itens, entrega, pagamento e origem comercial. | Alta | Parcial - endpoint público cria cliente e pedido com itens, entrega e origem; faltam carrinho persistente e etapa de pagamento no site |
| RF167 | [x] O sistema deve calcular entrega por zona, município, bairro, tabela manual, retirada na loja ou regra de entrega grátis acima de valor configurado. | Alta | Implementado no backend público com zona, taxa padrão, retirada, entrega grátis e orçamento humano |
| RF168 | [~] O total do pedido deve calcular itens, descontos, entrega, taxas e valor final antes da confirmação. | Alta | Parcial - checkout público calcula itens e entrega antes da confirmação; faltam descontos/taxas públicas configuráveis |
| RF169 | [x] O cliente deve poder iniciar compra sem criar conta, mas a confirmação do pedido deve exigir contacto validável e aceite das condições necessárias. | Alta | Implementado no backend: checkout público não exige conta, mas exige telefone ou email e consentimento de dados antes de criar cliente/pedido |
| RF170 | [x] Checkout abandonado deve criar lead/oportunidade recuperável, respeitando consentimento e regras do canal. | Alta | Implementado no backend público com consentimento, cliente CRM, tracking técnico, oportunidade `CARRINHO_ABANDONADO` e deduplicação |
| RF171 | [~] A conversa deve permitir gerar orçamento/manual quote com produtos, entrega e validade. | Média | Parcial - backend gera orçamento/manual quote com validade; falta ação embutida diretamente na conversa/UI |
| RF172 | [~] Pedidos vindos de live, WhatsApp, site, catálogo, afiliado ou comentário social devem alimentar a mesma entidade comercial de pedido/funil. | Alta | Parcial - pedidos manuais, checkout site, checkout atribuído por afiliado e conversão de reserva em pedido alimentam a entidade Pedido e o funil por pedido; faltam criação direta por social em cenários aprovados |
| RF173 | [x] Cada negócio deve configurar métodos de pagamento aceitos, dados bancários, instruções e mensagens de cobrança. | Alta | Implementado no backend em `/negocio/pagamentos` |
| RF174 | [~] O pedido deve acompanhar estados de preparação, entrega, retirada, conclusão, troca, devolução e cancelamento. | Alta | Parcial - backend cobre preparação, envio, retirada da loja, entrega, cancelamento, troca/devolução e reflete esses estados no funil; falta UI operacional final |

#### 3.14.4 Links Rastreáveis, Cookies e Atribuição

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF175 | [~] O sistema deve gerar links rastreáveis para produto, catálogo, campanha, afiliado, criador, vendedor, post social e live. | Alta | Parcial - loja/produto, clique WhatsApp e links de produto/campanha por afiliado/criador com contexto de vendedor, post social, live e UTMs implementados; faltam catálogo selecionável e UI de criação por canal |
| RF176 | [~] Links rastreáveis devem suportar UTM, código de referência, canal, campanha, criador, afiliado, vendedor e origem do conteúdo. | Alta | Parcial - UTM, canal, origem, trackingId, `ref`, campanha, vendedor e entidade de afiliado/criador implementados; falta consolidar relatórios por vendedor/campanha na UI |
| RF177 | [~] O tracking deve associar visita anônima a lead, WhatsApp click, checkout ou pedido quando o cliente se identificar e houver base de consentimento aplicável. | Alta | Parcial - checkout associa trackingId/referência ao cliente/pedido quando há contacto e o funil preserva a jornada anônima até o pedido; falta associação retroativa de lead/conversa fora do checkout |
| RF178 | [~] O sistema deve registrar eventos como página vista, produto visto, catálogo visto, clique WhatsApp, checkout iniciado, pedido criado, pagamento confirmado e compra entregue. | Alta | Parcial - loja visitada, catálogo visto, produto visto, clique WhatsApp, checkout iniciado, pedido criado, pagamento confirmado e compra entregue são aceites no tracking e os módulos de pedido/entrega agora movem o funil automaticamente; faltam webhooks financeiros/logísticos externos |
| RF179 | [~] O dono do negócio deve ver conversão por link, produto, campanha, afiliado, criador, rede social e canal de venda. | Alta | Parcial - resumo por tipo/origem/canal, afiliados/comissões e social-receita implementados; faltam receita por campanha, ticket médio e conversão completa |
| RF180 | [x] O CRM+ deve suportar modelos de atribuição: primeiro toque, último toque, conversão assistida e ajuste manual auditado. | Média | Implementado no backend |
| RF181 | [~] O prazo de atribuição por cookie/referral deve ser configurável por negócio, campanha ou afiliado. | Média | Parcial - backend usa janela por negócio e suporta metadata por parceiro; falta configuração dedicada por campanha/link |
| RF182 | [~] A loja pública deve exibir consentimento/aviso de tracking quando necessário e permitir operação básica mesmo sem cookies. | Alta | Parcial - backend opera sem `trackingId` e bloqueia dados pessoais; falta aviso visual/consentimento no frontend |
| RF183 | [x] O sistema deve preparar integração futura com eventos server-side, como Meta Conversions API, quando o negócio configurar credenciais e consentimentos. | Média | Implementado no backend com fila operacional segura, provider configurável, consentimento obrigatório e dados pessoais hasheados |
| RF184 | [x] Links, cookies e eventos não devem expor dados sensíveis do cliente em URL, query string ou identificadores públicos. | Alta | Implementado no backend de tracking público com rejeição de telefone, email, nome, endereço e chaves sensíveis |

#### 3.14.5 Afiliados, Criadores e Revendedores

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF185 | [x] O dono do negócio deve poder criar perfis de afiliado/criador com código, nome público, contacto, comissão, método de pagamento e estado. | Alta | Implementado no backend |
| RF186 | [~] Produtos, coleções e catálogos devem poder ser associados a afiliados, criadores ou revendedores específicos. | Alta | Parcial - links rastreáveis já associam afiliado/criador/revendedor a produto específico e alimentam mini-loja pública autorizada; faltam coleções/catálogos autorizados |
| RF187 | [~] Cada afiliado deve ter links rastreáveis próprios para produtos, catálogos e campanhas. | Alta | Parcial - links próprios para produto, loja/mini-loja e campanha implementados com metadata comercial; faltam catálogos selecionáveis |
| RF188 | [~] O afiliado deve ter painel ou relatório com cliques, leads, pedidos, vendas pagas, conversão e comissão estimada. | Média | Parcial - API de comissões e resumo por afiliado implementada com valores estimados, confirmados, pagos e revertidos; faltam cliques/leads por link e UI própria do afiliado |
| RF189 | [~] O dono do negócio deve ver ranking de afiliados/criadores por receita, pedidos pagos, conversão, ticket médio e comissões pendentes. | Alta | Parcial - ranking por pedidos atribuídos, pedidos pagos, receita atribuída, ticket médio, comissão confirmada, pendente e paga implementado; faltam conversão por clique/lead, receita líquida e recortes por período |
| RF190 | [~] Regras de comissão devem suportar percentual, valor fixo, comissão por produto, por coleção, por campanha e por meta alcançada. | Alta | Parcial - percentual, valor fixo por parceiro e regra por produto implementados; faltam regras por coleção, campanha e meta |
| RF191 | [x] Comissão só deve ficar confirmada depois do pagamento do pedido; cancelamentos, devoluções ou reembolsos devem reverter a comissão. | Alta | Implementado no backend |
| RF192 | [x] O sistema deve ter proteção antifraude básica contra autoindicação, leads duplicados e atribuições suspeitas. | Alta | Implementado no backend com bloqueio de autoindicação em checkout afiliado, evento operacional de atribuição suspeita e deduplicação de carrinho abandonado/social |
| RF193 | [x] O afiliado/criador deve poder receber pacote de divulgação com links, fotos, textos sugeridos e regras da campanha. | Média | Implementado no backend em `/afiliados/:id/pacote-divulgacao` com links, produto, fotos, textos sugeridos e política de comissão |
| RF194 | [x] Criadores e revendedores devem poder ter mini-loja pública com produtos autorizados e rastreamento próprio. | Média | Implementado no backend em `/publico/mini-lojas/:codigo`, com produtos autorizados por links ativos, rastreamento e resposta pública sem dados privados do parceiro |
| RF195 | [~] O sistema deve gerar relatório de pagamento de comissões com período, vendas, reversões, saldo e histórico. | Alta | Parcial - comissão pode ser marcada como paga individualmente ou em lote financeiro com período, referência, total, itens e auditoria; saldo por afiliado e exportação CSV de lotes implementados; faltam UI e conciliação avançada |
| RF196 | [x] O modo revendedor deve permitir preço especial, reserva de stock, margem estimada e regras separadas de entrega/retirada quando configurado. | Média | Implementado no backend da mini-loja pública com preço especial, margem/preço sugerido, limite/validade de reserva e regras públicas de entrega/retirada por revendedor |

#### 3.14.6 Social Inbox e Comentários de Redes Sociais

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF197 | [x] O sistema deve permitir conectar contas sociais suportadas por providers oficiais ou conectores autorizados. | Alta | Implementado - endpoints `/social/contas/providers`, `/social/contas` e persistência segura por negócio |
| RF198 | [~] O CRM+ deve capturar comentários de fotos, vídeos, posts e lives quando a API do provider permitir, respeitando permissões e limites do canal. | Alta | Parcial - captura controlada por provider implementada com conta conectada, provider autorizado e permissão `comments.read`; falta worker/conector oficial ativo por rede |
| RF199 | [x] Comentários sociais devem ser normalizados numa entidade única de interação social com provider, post, autor, texto, data, link original e estado. | Alta | Implementado no backend em `SocialInboxItem` |
| RF200 | [x] O sistema deve classificar comentários por intenção: preço, disponibilidade, tamanho/cor, entrega, reclamação, intenção de compra, lead frio/quente, spam ou dúvida geral. | Alta | Implementado com classificador conservador no Social Inbox e registro da regra no contexto |
| RF201 | [~] Um comentário social deve poder gerar cliente, lead, conversa, tarefa, pedido ou oportunidade de recuperação. | Alta | Parcial - Social Inbox gera tarefa humana/lead, sincroniza conversa de atendimento quando há telefone, movimenta funil para lead/conversa e abre oportunidade de recuperação para intenção comercial; falta criação direta de pedido por cenários aprovados |
| RF202 | [x] Toda interação social deve preservar o link/post original, identificador do provider e contexto da campanha para auditoria e análise. | Alta | Implementado - backend guarda postUrl, postId, provider, autor, contexto/permissões e registra auditoria operacional `SOCIAL_INBOX_CAPTURED` por captura |
| RF203 | [~] Quando permitido pelo provider, o atendente deve poder responder ao comentário ou levar a conversa para WhatsApp com contexto. | Média | Parcial - interação social preserva contexto, gera tarefa/conversa operacional e pode ser levada para WhatsApp com contexto; falta envio direto pelo provider social |
| RF204 | [x] Quando a API não permitir extração automática, o sistema deve oferecer fallback de importação manual, CSV, colagem assistida ou captura operacional controlada. | Alta | Implementado no backend com criação manual/controlada e importação CSV com deduplicação, contexto do provider, campanha, produto e permissões |
| RF205 | [x] Comentários devem ser deduplicados por identificador do provider e por sinais de cliente, evitando criar leads repetidos. | Alta | Implementado no backend por identificador do provider e fallback por post/autor/texto |
| RF206 | [x] A social inbox deve filtrar por rede, post, campanha, intenção, urgência, respondido/não respondido, produto e responsável. | Alta | Implementado no backend com filtros diretos e contexto comercial |
| RF207 | [x] O CRM+ deve mostrar quais posts, vídeos, lives e criadores geram mais leads, pedidos e receita. | Alta | Implementado no backend em `/relatorios/social-receita`, cruzando Social Inbox, tracking, pedidos e receita atribuída |
| RF208 | [x] Automações em comentários sociais devem ser conservadoras: quando houver dúvida, o sistema cria tarefa humana em vez de responder automaticamente. | Alta | Implementado no backend para compra com confiança e casos sensíveis como reclamação, desconto, troca, devolução e conflito |

#### 3.14.7 Funil de Vendas, Automação e Recuperação

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF209 | [~] O CRM+ deve mapear funil com etapas: visita, produto visto, WhatsApp click, lead, conversa, checkout, pedido, pagamento pendente, pago, preparação, entrega, entregue, pós-venda e recompra. | Alta | Parcial - etapas padronizadas expostas por API, loja pública movimenta visita/produto/WhatsApp/checkout/pedido/pagamento pendente, pedidos movimentam pago/preparação/entrega/entregue/perdido e Social Inbox movimenta lead/conversa; faltam UI, pós-venda e recompra automáticos |
| RF210 | [~] Eventos de loja, WhatsApp, social, live, afiliado e checkout devem movimentar automaticamente o cliente/pedido no funil quando a regra for segura. | Alta | Parcial - loja pública/checkout, pedidos/entregas e Social Inbox já movimentam funil de forma segura, API registra movimentos com origem/contexto e playbooks criam movimento na execução; faltam disparos automáticos por live, afiliado avançado, pós-venda e WhatsApp inbound genérico |
| RF211 | [~] O dono do negócio deve poder configurar playbooks de recuperação para carrinho abandonado, pagamento pendente, reserva expirada, cliente inativo, pós-venda e reposição de produto. | Alta | Parcial - backend cria/lista playbooks por negócio com gatilhos principais e execução; faltam UI, edição/pausa avançada e ligação automática aos eventos reais |
| RF212 | [~] Automações devem aceitar condições por segmento, evento, inatividade, stock, canal, categoria de mensagem, consentimento e responsável. | Alta | Parcial - playbooks guardam condições flexíveis em JSON e responsável; faltam validação semântica por segmento, stock, consentimento e categoria WhatsApp |
| RF213 | [~] Ações de automação devem incluir enviar template WhatsApp, criar tarefa, adicionar tag, notificar responsável, reservar produto, mover etapa do funil e adicionar a campanha. | Alta | Parcial - ação segura `CRIAR_TAREFA` implementada com contexto e responsável; demais ações ficam planeadas para fases com política e auditoria |
| RF214 | [~] Casos sensíveis como desconto, pagamento, reclamação, troca, cancelamento e cliente irritado devem exigir aprovação humana ou tarefa. | Alta | Parcial - playbooks executam recuperação inicial por tarefa humana em vez de mensagem automática; faltam regras específicas por caso sensível |
| RF215 | [~] O painel deve mostrar oportunidades perdidas e recuperáveis: carrinhos, WhatsApp clicks sem compra, comentários com intenção, pedidos sem pagamento e clientes inativos. | Alta | Parcial - backend lista oportunidades recuperáveis geradas por playbooks com estado, valor estimado, tarefa e responsável; faltam geração por eventos de carrinho/clique/cliente inativo e UI |
| RF216 | [~] Relatórios de automação devem mostrar vendas recuperadas, receita atribuída, mensagens enviadas, falhas, opt-out, conversões e intervenção humana. | Alta | Parcial - oportunidades de recuperação têm estado e valor estimado para futura receita recuperada; faltam relatório agregado, opt-out e conversões automáticas |

#### 3.14.8 WhatsApp Oficial: Categorias, Eventos e Metodologia

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF217 | [~] O motor de mensagens deve classificar todo envio WhatsApp como `marketing`, `utilidade`, `autenticacao` ou `servico` antes de enviar. | Alta | Parcial - AutomacaoWhatsApp classifica envios manuais/templates e automáticos antes do provider, anexando política ao contexto e calculando janela em conversas; faltam UI de configuração e cobertura de todos os eventos futuros |
| RF218 | [x] Conversas de serviço devem ser usadas para atendimento iniciado pelo cliente e dentro da janela permitida do canal, com texto livre quando aplicável. | Alta | Implementado no backend: texto livre de serviço calcula a janela pela última mensagem inbound de WhatsApp e bloqueia envio fora dela |
| RF219 | [~] Templates de utilidade devem ser usados para eventos transacionais como pedido criado, pagamento pendente, pagamento confirmado, entrega, recibo, reserva expirada e atualização de fila/reposição. | Alta | Parcial - templates internos de utilidade e templates por negócio com eventos compatíveis existem; falta amarrar todos os eventos transacionais a templates persistidos |
| RF220 | [~] Templates de marketing devem ser usados para promoções, novidades, campanhas, reativação, cross-sell, catálogo, cupões e divulgações de afiliados/criadores. | Alta | Parcial - campanhas exigem template marketing aprovado e consentimento; faltam reativação/cross-sell/catálogo/afiliados |
| RF221 | [~] Templates de autenticação devem ser usados apenas para códigos OTP, login, validação de identidade e operações de segurança. | Alta | Parcial - política exige template oficial para autenticação; falta fluxo WhatsApp OTP completo |
| RF222 | [~] Cada evento de mensagem deve registrar motivo, categoria, template, idioma, janela de atendimento, consentimento, entidade relacionada e fallback previsto. | Alta | Parcial - envios WhatsApp/campanhas carregam política, categoria, template e contexto; faltam colunas dedicadas e fallback padronizado por todos os eventos |
| RF223 | [x] O sistema deve impedir texto promocional em mensagens de utilidade ou autenticação. | Alta | Implementado no motor de política WhatsApp com teste de regressão |
| RF224 | [x] Quando a janela de serviço estiver fechada, o sistema deve exigir template aprovado e categoria compatível com o evento. | Alta | Implementado no backend para respostas manuais/conversas: serviço fora da janela é bloqueado e categorias com template passam pela política |
| RF225 | [~] Clientes com opt-out não devem receber marketing, mas podem receber mensagens transacionais permitidas e necessárias à execução do pedido. | Alta | Parcial - marketing manual e campanhas bloqueiam sem consentimento; falta opt-out granular por canal e transacionais por evento |
| RF226 | [~] Se a categoria ou template necessário não estiver configurado/aprovado, o sistema deve criar tarefa humana e não tentar envio inseguro. | Alta | Parcial - envio manual bloqueia templates não aprovados e cria tarefa humana; campanhas rejeitam template não aprovado; faltam tarefas automáticas para todos os eventos |
| RF227 | [~] Logs de mensagem devem guardar categoria, template, preço/categoria vigente quando disponível, resposta do provider, erro e estado final. | Alta | Parcial - mensagens/outbox guardam categoria, template, política, resposta/erro e estado; falta preço vigente oficial por categoria |
| RF228 | [~] A escolha de categoria deve ser configurável por tipo de evento, mas limitada por um motor de política para evitar uso indevido. | Alta | Parcial - templates/campanhas/manual passam pelo motor de política; falta tela de configuração por evento para todos os fluxos |
| RF229 | [x] Templates WhatsApp devem ter ciclo de vida: rascunho, enviado para aprovação, aprovado, rejeitado, pausado, substituído e descontinuado. | Média | Implementado no backend com estados formais, versão, ativo, motivo obrigatório para estados sensíveis e bloqueio de uso quando desativado |
| RF230 | [ ] As regras de categoria WhatsApp devem seguir a documentação oficial vigente do provider escolhido e ser revistas periodicamente. | Alta | Processo |

#### 3.14.9 Flexibilidade Operacional e Modularidade

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF231 | [~] Cada negócio deve poder operar com canais diferentes sem quebrar o sistema: só WhatsApp, só loja, social + WhatsApp, live + WhatsApp, afiliados + site ou combinação completa. | Alta | Parcial - módulos por negócio e guardas HTTP implementados; falta matriz completa de combinações testada em UI |
| RF232 | [~] Módulos devem ser controlados por configuração/plano, sem expor páginas vazias para quem não ativou a função. | Alta | Parcial - backend controla módulos e bloqueia rotas; falta ocultação final em todos os pontos de UI |
| RF233 | [x] A loja pública deve funcionar mesmo sem social inbox conectada. | Alta | Implementado no backend por módulos independentes |
| RF234 | [x] A social inbox deve funcionar mesmo sem loja pública publicada. | Alta | Implementado no backend por módulos independentes |
| RF235 | [x] O módulo de afiliados deve funcionar com checkout por WhatsApp antes do checkout completo do site estar maduro. | Alta | Implementado no backend: checkout WhatsApp resolve `referencia`, modelo de atribuição, assistências, origem efetiva e tracking do clique |
| RF236 | [x] A entrega deve aceitar cálculo automático, tabela manual, retirada na loja e orçamento humano. | Alta | Implementado no backend público com `ENTREGA`, `RETIRADA` e `ORCAMENTO` |
| RF237 | [~] O sistema deve usar Kwanza como moeda padrão e preparar arquitetura para múltiplas moedas no futuro. | Média | Parcial - valores operacionais usam Kwanza/AOA e onboarding guarda moeda; falta multi-moeda real |
| RF238 | [~] A arquitetura deve preparar multi-loja, múltiplas linhas WhatsApp, múltiplos domínios e múltiplas equipas como evolução. | Média | Parcial |
| RF239 | [~] Todos os canais públicos devem alimentar o mesmo núcleo de cliente, produto, pedido, conversa, pagamento e relatório. | Alta | Parcial - checkout público e afiliados já criam cliente, pedido, tracking e comissão; Social Inbox captura comentários, cria tarefas de lead, conversa de atendimento e oportunidade social; faltam campanhas, pagamento público completo e associação automática ao cliente 360 |
| RF240 | [~] Toda automação deve ter fallback humano claro, com tarefa, motivo e contexto suficiente para a equipa continuar. | Alta | Parcial - bloqueios de WhatsApp manual geram tarefa com motivo, telefone, template e contexto, e a equipa já consegue atualizar/concluir a tarefa; faltam demais automações e histórico detalhado |
| RF241 | [ ] Cada módulo deve ter estado vazio com próxima ação útil, sem cards decorativos ou métricas sem explicação. | Alta | Planeado |
| RF242 | [~] O CRM+ deve importar e exportar produtos, clientes, pedidos, afiliados, comissões e relatórios em formatos operacionais. | Média | Parcial - clientes/produtos importam CSV; clientes/pedidos/relatórios/comissões exportam CSV; faltam todos os formatos e jobs para tudo |
| RF243 | [~] Tracking deve funcionar parcialmente sem cookies usando UTM, código de referência, link curto e associação posterior ao telefone/cliente. | Alta | Parcial - UTM, origem e trackingId funcionam sem cookies; faltam link curto e associação posterior formal |
| RF244 | [~] O dono/admin deve poder pausar campanhas, automações, afiliados ou integrações rapidamente em caso de erro operacional. | Alta | Parcial - pausa de campanhas e ativação/desativação de módulos implementadas; falta botão único para automações/afiliados/integrações sociais |

### 3.15 Fundação Backend para Novas Atualizações CRM+

Esta etapa vem antes da implementação visual dos novos módulos. O objetivo é evitar que Clientes, Pedidos, Loja Virtual, Afiliados, Social Inbox e WhatsApp Oficial sejam construídos por atalhos difíceis de manter. O backend deve virar o núcleo operacional do Bizy: multi-negócio, modular, auditável, testável e preparado para crescer.

| ID | Requisito Funcional | Prioridade | Estado |
|---|---|---|---|
| RF245 | [x] O banco deve ter `Negocio` como fronteira principal de tenant, permitindo que produtos e instâncias WhatsApp sejam únicos por negócio. | Alta | Implementado |
| RF246 | [x] O banco deve separar `ClienteGlobal` de `ClienteNegocio`, permitindo identidade canónica compartilhável sem misturar dados comerciais privados de cada loja. | Alta | Implementado |
| RF247 | [x] O banco deve suportar relacionamento entre negócios, compartilhamento controlado de clientes e auditoria de compartilhamento. | Alta | Implementado - modelos Prisma e API operacional com motivo, escopo, consentimento e revogação auditada disponíveis |
| RF248 | [x] O banco deve ter configuração de módulos por negócio para ativar/desativar CRM, loja pública, afiliados, social inbox, campanhas, checkout e automações. | Alta | Implementado |
| RF249 | [x] Entidades operacionais existentes, como reservas, comentários, conversas, mensagens, outbox e instâncias WhatsApp, devem carregar `negocioId` para preparação multi-tenant. | Alta | Implementado na fundação operacional |
| RF250 | [~] Todas as rotas operacionais devem resolver o negócio atual do usuário autenticado e filtrar dados por `negocioId`. | Alta | Parcial - catálogo, painel, reservas, pedidos, comentários, conversas, clientes, WhatsApp/Evolution e outbox WhatsApp protegidos |
| RF251 | [x] O backend deve fornecer contexto de requisição com usuário, negócio, papel, permissões, módulos ativos e canal de origem. | Alta | Implementado |
| RF252 | [~] O backend deve expor APIs de Clientes 360 para criar, listar, segmentar, fundir, etiquetar, bloquear, exportar e gerir consentimento. | Alta | Parcial - criar, listar, pesquisar, detalhar, etiquetar, bloquear/estado, exportar, importar, fundir, segmentar parcialmente e consentimentos implementados; faltam segmentação comportamental completa |
| RF253 | [x] O backend deve expor APIs de Pedidos com múltiplos itens, estados de funil, pagamento, entrega, desconto, comprovativos e origem comercial. | Alta | Implementado em `/pedidos`, com criação/listagem/detalhe/exportação, atualização de itens, estado/funil, pagamento, entrega, descontos, comprovativos, origem/canal e reserva vinculada |
| RF254 | [~] O backend deve evoluir Produtos para suportar variantes, coleções, movimentos de stock, custo, margem, importação e catálogo digital. | Alta | Parcial - variantes, coleções, movimentos, custo, margem, importação CSV e loja pública implementados; faltam catálogos selecionáveis |
| RF255 | [~] O backend deve expor APIs públicas e privadas para loja virtual, página de produto, catálogo digital, checkout WhatsApp e checkout site. | Alta | Parcial - loja pública, página de produto, cálculo de entrega, checkout WhatsApp com atribuição e checkout site básico implementados; faltam catálogos selecionáveis e checkout/pagamento completo |
| RF256 | [~] O backend deve registrar tracking de links, UTM, referência, cookies técnicos, visitas, cliques WhatsApp, checkout iniciado, pedido e venda atribuída. | Alta | Parcial - trackingId, UTM, visitas, produto visto, clique WhatsApp, checkout iniciado, pedido criado, lead identificado e receita atribuída ao pedido implementados; faltam cookies técnicos e venda paga atribuída |
| RF257 | [~] O backend deve suportar afiliados, criadores e revendedores com links próprios, regras de comissão, reversões, pagamentos e relatórios. | Alta | Parcial - parceiros, links próprios, mini-loja pública, regras públicas de revenda, comissão estimada/confirmada/paga/revertida, pagamento individual/lote, saldos, exportação CSV, auditoria e resumo implementados; faltam regras avançadas, portal do afiliado e relatórios avançados |
| RF258 | [~] O backend deve normalizar social inbox com comentários de redes sociais, posts, autores, intenção, tarefas e oportunidades. | Alta | Parcial - endpoints `/social/inbox/itens` e `/social/inbox/capturar` registram canal, provider, conta, post, media, autor, texto, intenção, confiança, telefone, entidades/contexto, deduplicam, filtram, criam tarefas, conversa CRM e oportunidade estruturada; faltam anexos/media |
| RF259 | [~] O backend deve ter funil e playbooks de recuperação com eventos, condições, ações, tarefas humanas e histórico de mudança. | Alta | Parcial - playbooks criam tarefa humana, execução, movimento de funil e oportunidade recuperável; faltam agregados por período, campanhas e ações além de tarefa |
| RF260 | [~] O backend deve implementar motor de política WhatsApp para classificar envios em marketing, utilidade, autenticação ou serviço antes de chamar o provider. | Alta | Parcial - motor interno implementado em AutomacaoWhatsApp com metadados, bloqueio anti-promoção e validação de janela/template; faltam janela real e opt-out centralizado |
| RF261 | [~] O backend deve gerir templates WhatsApp por categoria, idioma, estado de aprovação, provider, versão e compatibilidade com eventos. | Alta | Parcial - catálogo interno, templates persistidos por negócio e API com filtros por categoria/evento/provider/aprovação implementados; falta sincronização com API oficial e histórico completo de versões |
| RF262 | [~] O backend deve unificar outbox/event bus para WhatsApp, n8n, tracking, campanhas, social inbox, comissões e notificações internas. | Alta | Parcial - eventos operacionais idempotentes e outboxes específicas existem; falta bus único para todos os domínios |
| RF263 | [x] O backend deve implementar permissões e papéis por negócio: dono, admin, vendedor, atendente, financeiro, entregador, afiliado/criador e suporte técnico. | Alta | Implementado no backend com papéis, permissões e membros operacionais |
| RF264 | [x] O backend deve registrar auditoria de ações críticas: exportação, desconto, pagamento, cancelamento, fusão de cliente, compartilhamento, comissão e alteração de permissão. | Alta | Implementado com trilhas para exportações, desconto aprovado, pagamento, entrega, cancelamento, stock, fusão/anonimização de cliente, compartilhamento, comissão/lotes e permissões/membros |
| RF265 | [~] Importações e exportações grandes devem rodar como jobs com estado, relatório de erros, idempotência e arquivo resultante. | Média | Parcial - job idempotente de importação de clientes implementado; faltam jobs para produtos/exportações e arquivo resultante persistido |
| RF266 | [~] Módulos desativados devem bloquear rotas, automações e menus relacionados, preservando dados para reativação futura. | Alta | Parcial - guarda HTTP aplicada em rotas comerciais, conversas e WhatsApp |
| RF267 | [~] Webhooks, importações, campanhas e eventos públicos devem usar chaves de idempotência para evitar duplicidade. | Alta | Parcial - eventos operacionais e job de importação suportam idempotencyKey; faltam todos os webhooks/campanhas públicas |
| RF268 | [~] Migrations, seeds e scripts de bootstrap devem preparar ambientes dev/staging/prod sem depender de dados manuais invisíveis. | Alta | Parcial - migration Prisma adicionada para campanhas/governança; faltam seeds/bootstrap formais dos novos módulos |
| RF269 | [~] O backend deve manter contratos versionados para APIs internas, públicas, webhooks e eventos de automação. | Média | Parcial - eventos operacionais possuem tópico/tipo/contexto e testes de rota; falta versionamento explícito de contrato |
| RF270 | [~] Cada módulo backend novo deve nascer com testes de schema, use-case, repositório e rota HTTP antes de ser ligado ao frontend. | Alta | Parcial - novas rotas CRM+/campanhas/governança têm testes HTTP; faltam testes de repositório/use-case separados para todos |

---

## 4. Requisitos Não Funcionais (RNF)

### 4.1 Tecnologia e Arquitetura

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF01 | [x] O backend deve ser implementado em Node.js, TypeScript e Fastify. | Alta | Implementado |
| RNF02 | [x] O frontend deve ser implementado em React, Vite e TypeScript. | Alta | Implementado |
| RNF03 | [x] O banco principal deve usar PostgreSQL com Prisma. | Alta | Implementado |
| RNF04 | [x] O domínio deve permanecer separado de HTTP, Prisma, React, TikTok, n8n e Evolution. | Alta | Implementado |
| RNF05 | [x] Regras de aplicação devem ficar em classes de `use-case`, não diretamente nos handlers HTTP. | Alta | Implementado |
| RNF06 | [x] Providers externos devem ficar atrás de contratos: `LiveCommentProvider`, `ProvedorWhatsApp` e `ProvedorSms`. | Alta | Implementado |
| RNF07 | [x] A camada HTTP deve ser modular e registrada por manifesto. | Média | Implementado |

### 4.2 Performance e Tempo de Resposta

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF08 | [x] Comentários capturados devem aparecer no painel em até 3 segundos em condições normais. | Alta | Implementado |
| RNF09 | [x] A criação de reserva a partir de comentário válido deve ocorrer em até 10 segundos. | Alta | Implementado |
| RNF10 | [x] O envio de código SMS deve ocorrer preferencialmente em até 30 segundos. | Alta | Implementado |
| RNF11 | [x] Ações críticas no painel devem exigir poucos cliques e dar feedback visual imediato. | Alta | Implementado |
| RNF12 | [x] O frontend deve manter bundle adequado para carregamento rápido em conexões comuns de Angola. | Média | Implementado |

### 4.3 Confiabilidade e Resiliência

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF13 | [x] O sistema deve manter modo manual como contingência quando provider automático falhar. | Alta | Implementado |
| RNF14 | [x] Eventos para n8n devem ter retry automático por outbox. | Alta | Implementado |
| RNF15 | [x] Reservas e comentários processados devem ser persistidos para não depender de estado em memória. | Alta | Implementado |
| RNF16 | [x] O agendador de expiração deve rodar periodicamente e ser configurável. | Alta | Implementado |
| RNF17 | [x] O sistema deve tolerar falhas temporárias do n8n sem perder eventos. | Alta | Implementado |
| RNF18 | [x] Em caso de falha de TikTok, o vendedor deve conseguir continuar a operação pelo modo manual. | Alta | Implementado |

### 4.4 Segurança

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF19 | [x] Endpoints operacionais devem exigir sessão autenticada. | Alta | Implementado |
| RNF20 | [x] Código SMS deve ser armazenado como hash. | Alta | Implementado |
| RNF21 | [x] Token de sessão deve ser armazenado como hash no backend. | Alta | Implementado |
| RNF22 | [x] Comunicação backend -> n8n deve usar HMAC SHA-256. | Alta | Implementado |
| RNF23 | [x] Comunicação n8n -> backend deve exigir `X-EMEU-N8N-TOKEN`. | Alta | Implementado |
| RNF24 | [x] Webhook Evolution deve exigir token configurado. | Alta | Implementado |
| RNF25 | [x] Em produção, `LOGIN_SMS_DEV_MODE` e `LOGIN_SMS_EXPOR_CODIGO_DEV` devem estar desativados. | Alta | Implementado |
| RNF26 | [x] CORS deve ser restrito à origem real do frontend em produção. | Alta | Implementado |
| RNF27 | [x] Rate limit deve proteger endpoints HTTP sensíveis. | Alta | Implementado |
| RNF28 | [ ] Em escala, rate limit deve usar armazenamento distribuído como Redis. | Média | Pós-MVP |
| RNF29 | [ ] Em produção madura, sessão deve considerar cookie HttpOnly ou mecanismo equivalente mais seguro que `localStorage`. | Média | Pós-MVP |

### 4.5 Dados, Auditoria e Observabilidade

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF30 | [x] O comentário original deve ser mantido como evidência operacional. | Alta | Implementado |
| RNF31 | [x] Eventos internos devem ser registrados para auditoria. | Alta | Implementado |
| RNF32 | [x] Mensagens WhatsApp enviadas devem ser auditáveis. | Alta | Implementado |
| RNF33 | [x] O sistema deve registrar timestamps para medir tempo comentário -> reserva e reserva -> pagamento. | Alta | Implementado |
| RNF34 | [x] O sistema deve expor métricas de saúde da outbox n8n. | Média | Implementado |
| RNF35 | [x] Logs de produção devem ser estruturados e centralizados. | Média | Implementado |

### 4.6 Usabilidade e Acessibilidade

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF36 | [x] A interface deve ser responsiva para desktop, tablet e mobile. | Alta | Implementado |
| RNF37 | [x] O painel deve ser simples o suficiente para onboarding de vendedor em até 5 minutos. | Alta | Implementado |
| RNF38 | [x] Formulários devem exibir mensagens claras de erro, sucesso e carregamento. | Alta | Implementado |
| RNF39 | [x] A navegação principal deve ser consistente entre páginas internas. | Média | Implementado |
| RNF40 | [x] A UI deve destacar estados críticos como reserva perto de expirar, pagamento pendente e comentário em revisão. | Alta | Implementado |

### 4.7 Qualidade e Testes

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF41 | [x] Entradas HTTP e dados críticos devem ser validados com Zod. | Alta | Implementado |
| RNF42 | [x] O projeto deve manter TypeScript em modo estrito. | Alta | Implementado |
| RNF43 | [x] O backend deve ter testes automatizados para parser, motor de reservas, autenticação, n8n, SMS, Evolution, media e PDF. | Alta | Implementado |
| RNF44 | [x] O fluxo crítico deve ter testes de integração HTTP. | Alta | Implementado |
| RNF45 | [x] O frontend deve ter testes E2E para login, catálogo, comentário manual, reserva e pagamento. | Média | Implementado |
| RNF46 | [x] A lógica de concorrência de reservas deve ser testada com PostgreSQL real. | Alta | Implementado |
| RNF47 | [x] O build e o typecheck devem passar antes de publicar piloto. | Alta | Implementado |

### 4.8 Deploy e Operação

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF48 | [x] O projeto deve possuir Docker Compose para ambiente integrado. | Alta | Implementado |
| RNF49 | [x] O backend deve executar `prisma migrate deploy` em produção. | Alta | Implementado |
| RNF50 | [x] Imagens de n8n e Evolution devem ser fixadas por versão ou digest em produção. | Média | Implementado |
| RNF51 | [x] PostgreSQL e Redis não devem ficar expostos publicamente em produção. | Alta | Implementado |
| RNF52 | [x] O ambiente de staging deve usar HTTPS e domínio próprio. | Média | Implementado |
| RNF53 | [x] Segredos reais não devem ser versionados no repositório. | Alta | Implementado |
| RNF54 | [x] Ficheiros de comprovativo devem ser guardados dentro de raiz controlada e servidos por rota autenticada. | Alta | Implementado |

### 4.9 Operabilidade do CRM Completo

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF55 | [x] A navegação comercial deve permitir chegar às ações principais em até 2 cliques no desktop e 2 toques no mobile. | Alta | Implementado na navegação principal e no dock mobile |
| RNF56 | [x] O CRM deve continuar responsivo e utilizável em telemóveis de 360px de largura sem scroll horizontal. | Alta | Implementado |
| RNF57 | [~] Listas de clientes, pedidos, produtos e conversas devem suportar paginação, filtros e busca sem travar com pelo menos 10.000 registros. | Alta | Parcial - APIs principais aceitam limite/filtros e exportações usam teto operacional; falta paginação padronizada em todos os módulos e teste de carga |
| RNF58 | [x] A busca global deve responder em até 1 segundo para bases pequenas e manter feedback de carregamento em bases maiores. | Média | Implementado com debounce e estado de carregamento |
| RNF59 | [~] Dados pessoais de clientes devem ser protegidos com controlo de acesso por papel e auditoria de exportação. | Alta | Parcial - exportação de clientes exige permissão e registra auditoria; faltam políticas por papel mais finas e auditoria nas demais exportações |
| RNF60 | [x] Exportações de clientes, pedidos e relatórios devem registrar usuário, filtro usado, data e quantidade exportada. | Alta | Implementado para clientes, pedidos e relatório comercial CSV/PDF por eventos auditáveis `CLIENTS_EXPORTED`, `ORDERS_EXPORTED` e `REPORTS_EXPORTED` |
| RNF61 | [ ] O CRM deve manter backups e estratégia de recuperação para clientes, pedidos, mensagens, comprovativos e produtos. | Alta | Planeado |
| RNF62 | [x] A interface deve distinguir claramente operação comercial de configuração técnica. | Alta | Implementado por CRM/Loja versus Admin/Sistema |
| RNF63 | [x] Páginas sem funcionalidade real não devem ser publicadas na navegação principal. | Alta | Implementado na navegação atual |
| RNF64 | [x] O design system deve padronizar cards, listas, tabelas, filtros, badges, estados vazios e ações destrutivas antes de novas páginas CRM. | Alta | Implementado |
| RNF65 | [~] A aplicação deve manter textos curtos, orientados à ação e compreensíveis por vendedor não técnico. | Alta | Parcial - navegação e pesquisa foram simplificadas; falta revisão textual completa das páginas novas |
| RNF66 | [~] O CRM deve registrar métricas de funil sem depender de serviços externos para operação básica. | Média | Parcial - backend registra tracking/funil/resumos locais; faltam todos os eventos automáticos e retenção avançada |
| RNF67 | [~] Campanhas devem respeitar limites de envio, opt-out, consentimento e regras do provider WhatsApp usado. | Alta | Parcial - campanhas usam limite diário, consentimento e política WhatsApp; falta rate limit por provider oficial e opt-out granular |
| RNF68 | [~] Automações devem falhar de forma segura: se houver dúvida, criar tarefa humana em vez de executar ação crítica. | Alta | Parcial - WhatsApp bloqueado por template/política cria tarefa humana e não envia; faltam outros tipos de automação |
| RNF69 | [~] O sistema deve manter idempotência em importações, campanhas e webhooks para evitar duplicação de clientes, pedidos ou mensagens. | Alta | Parcial - importação de clientes e eventos operacionais têm idempotência; faltam todos os webhooks/campanhas externas |
| RNF70 | [x] O CRM deve permitir evolução modular por domínios: Clientes, Pedidos, Produtos, Conversas, Campanhas, Relatórios e Configurações. | Alta | Implementado na fundação HTTP/use-case e catálogo de módulos |
| RNF71 | [x] O frontend deve usar `shadcn/ui` como fonte padrão de componentes de interface: botões, cards, badges, inputs, selects, tabelas, dialogs, sheets, tabs, skeletons e estados de feedback. | Alta | Implementado |
| RNF72 | [x] Novos componentes próprios só devem ser criados quando não existir primitivo equivalente em `shadcn/ui`; composições de domínio devem reaproveitar os primitivos instalados. | Alta | Implementado |

### 4.10 Operabilidade CRM+ Social Commerce

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF73 | [ ] A loja pública, catálogo e checkout devem ser rápidos e utilizáveis em mobile, com prioridade para telas de 360px e conexões móveis comuns em Angola. | Alta | Planeado |
| RNF74 | [x] O checkout e o clique para WhatsApp não podem depender de tracking, cookies ou integrações sociais para funcionar. | Alta | Implementado no backend: checkout, pedido público e WhatsApp aceitam `trackingId` opcional e continuam sem cookies |
| RNF75 | [~] Tracking, social inbox, afiliados, checkout, funil, automações, catálogo, loja pública e WhatsApp policy devem ser módulos separados por fronteiras claras. | Alta | Parcial - módulos HTTP/use cases separados para loja pública, tracking, afiliados, social inbox, funil, campanhas e política WhatsApp; faltam extrações/adaptadores oficiais |
| RNF76 | [~] Eventos de tracking e automação devem usar outbox/event bus para não bloquear a operação principal de pedido, pagamento ou conversa. | Alta | Parcial - n8n/outbox, WhatsApp/outbox e eventos operacionais existem; falta bus único para tracking/social/comissões |
| RNF77 | [~] Webhooks de redes sociais e WhatsApp devem ser idempotentes para evitar duplicar clientes, comentários, mensagens, pedidos ou comissões. | Alta | Parcial - Evolution e comentários usam ids quando disponíveis; eventos operacionais têm idempotencyKey; faltam conectores sociais oficiais |
| RNF78 | [~] O sistema deve suportar limitações de providers sociais por adaptadores, permissões, rate limits e fallback manual documentado. | Alta | Parcial - Social Inbox registra provider, permissões e contexto de captura; falta adapter/rate limit por rede social oficial |
| RNF79 | [~] O motor de política WhatsApp deve ser testável, auditável e independente do provider concreto usado para envio. | Alta | Parcial - serviço de política testado em `whatsapp-politica.test.ts` e executado antes dos providers; faltam persistência/auditoria estruturada por tabela |
| RNF80 | [~] A categoria WhatsApp escolhida para cada envio deve ficar rastreável para auditoria, custo, troubleshooting e melhoria operacional. | Alta | Parcial - categoria e política são anexadas ao contexto do envio e evento emitido; faltam colunas/relatórios dedicados |
| RNF81 | [~] Mensagens de marketing, utilidade, autenticação e serviço devem ter validação automática de categoria antes de irem ao provider. | Alta | Parcial - validação automática implementada para manual/templates/automações, com anti-promoção em utilidade/autenticação e recuperação/novidades como marketing; falta sincronização de aprovação por provider |
| RNF82 | [~] O sistema deve aplicar opt-out e consentimento antes de campanhas, reativações, divulgações de afiliados e mensagens promocionais. | Alta | Parcial - envio manual e campanhas marketing exigem consentimento; faltam reativações/afiliados e opt-out granular |
| RNF83 | [x] Cookies e identificadores de tracking não devem conter telefone, email, nome, endereço ou qualquer dado pessoal sensível. | Alta | Implementado no backend: tracking público rejeita telefone, email, nome, endereço e chaves sensíveis |
| RNF84 | [ ] A loja pública deve exibir texto claro sobre tracking/privacidade quando cookies ou eventos de marketing forem usados. | Alta | Planeado |
| RNF85 | [~] Relatórios de afiliados e criadores devem expor apenas dados necessários, evitando mostrar dados privados de clientes sem necessidade operacional. | Alta | Parcial - APIs administrativas de comissões/pacote não expõem histórico privado do cliente final; falta política granular por perfil externo |
| RNF86 | [~] O cálculo de comissão deve ser reprocessável e auditável por período, pedido, afiliado, produto, reversão e pagamento. | Alta | Parcial - comissão por pedido/afiliado/produto é calculada, persistida, auditada, resumida em saldo financeiro e exportável por lote; faltam reprocessamento dedicado por período/produto e conciliação financeira avançada |
| RNF87 | [~] Eventos analíticos devem ser armazenados de forma eficiente para pelo menos 100.000 eventos sem travar a UI operacional. | Média | Parcial - eventos já são agregados no backend em resumo de tracking e funil, evitando cálculo bruto na UI; faltam paginação/consulta temporal e otimização para alto volume real |
| RNF88 | [ ] Páginas públicas de loja e catálogo devem ser cacheáveis sempre que possível, sem expor dados privados ou stock incorreto. | Média | Planeado |
| RNF89 | [ ] A UI deve ocultar módulos não ativados, mas preservar rotas e dados para reativação futura quando permitido. | Média | Planeado |
| RNF90 | [~] Toda automação deve falhar de forma segura: mensagem não enviada, categoria inválida, template ausente ou provider indisponível devem criar tarefa humana com contexto. | Alta | Parcial - envios automáticos capturam falhas/outbox, política bloqueia categorias inválidas, bloqueios manuais criam tarefa e campanhas rejeitam template inseguro; faltam provider indisponível e automações não WhatsApp |
| RNF91 | [x] O CRM+ deve manter logs operacionais compreensíveis para o dono do negócio, não apenas logs técnicos para desenvolvedores. | Alta | Implementado no backend em `/operacional/auditoria`, traduzindo eventos operacionais em mensagens legíveis |
| RNF92 | [~] Importações e sincronizações sociais devem ter relatório de sucesso, falha, duplicados, ignorados e próximos passos. | Média | Parcial - importações de clientes/produtos/social inbox têm relatório de criados, atualizados/duplicados e erros; falta sincronização automática por provider com próximos passos |
| RNF93 | [x] Links rastreáveis devem ser estáveis, curtos quando possível e resilientes a mudanças de slug do produto/catálogo. | Média | Implementado no backend com resolução pública por código em `/publico/links/:codigo`, mantendo código de referência estável |
| RNF94 | [~] O sistema deve permitir pausar rapidamente campanhas, afiliados, tracking, automações e integrações sociais sem desligar a loja inteira. | Alta | Parcial - campanha e módulos por negócio podem ser pausados/desativados; falta painel de emergência unificado |
| RNF95 | [~] Decisões automáticas com baixa confiança devem ser explicáveis e encaminhadas para humano, preservando o motivo da decisão. | Alta | Parcial - Social Inbox, SLA e próximas ações preservam contexto e criam tarefa humana para casos sensíveis; falta motor único de explicabilidade |

### 4.11 Preparação Técnica do Backend CRM+

| ID | Requisito Não Funcional | Prioridade | Estado |
|---|---|---|---|
| RNF96 | [~] Toda nova tabela operacional deve ter índices por `negocioId`, estado e data quando for consultada em listas, dashboards ou jobs. | Alta | Parcial - afiliados, links, comissões, lotes financeiros, campanhas, itens de campanha, templates, eventos e jobs têm índices principais; faltam revisão de alto volume e social inbox completo |
| RNF97 | [~] Nenhuma consulta de módulo comercial deve retornar dados de outro negócio sem relacionamento e permissão explícita. | Alta | Parcial - rotas comerciais filtram por negócio; compartilhamento de cliente exige relação aprovada, consentimento e escopo limitado; revogação remove acesso recebido; faltam demais exceções multi-loja |
| RNF98 | [~] Operações críticas com stock, pedido, pagamento, comissão e compartilhamento de cliente devem usar transação. | Alta | Parcial - confirmação, pagamento individual/lote e reversão de comissão gravam estado e auditoria na mesma transação Prisma; criação e revogação de compartilhamento gravam estado e auditoria em transação; faltam padronizar as demais áreas críticas |
| RNF99 | [~] Jobs assíncronos devem ser reprocessáveis sem duplicar mensagens, pedidos, clientes, comissões ou eventos de tracking. | Alta | Parcial - jobs operacionais têm idempotencyKey e relatório; falta scheduler/reprocessamento para todos os domínios |
| RNF100 | [~] APIs de listagem devem nascer com paginação, filtros e ordenação previsível. | Alta | Parcial - novos módulos usam limite/filtros básicos; falta paginação cursor/offset padronizada |
| RNF101 | [x] APIs públicas de loja, checkout e tracking devem ter rate limit separado das APIs autenticadas do painel. | Alta | Implementado com limite público configurável por `RATE_LIMIT_PUBLICO_MAXIMO` |
| RNF102 | [x] O motor de política WhatsApp deve ser testável sem depender de Evolution, Cloud API ou n8n. | Alta | Implementado em serviço de domínio com testes dedicados |
| RNF103 | [~] O backend deve permitir feature flags/módulos por negócio sem deploy novo para cada ativação operacional. | Média | Parcial |
| RNF104 | [~] Eventos de domínio devem usar payloads estáveis e versionados para não quebrar n8n, relatórios ou automações futuras. | Alta | Parcial - eventos operacionais usam tópico/tipo/payload e idempotência; falta campo formal de versão em todos os eventos |
| RNF105 | [~] Auditoria e logs operacionais devem ser compreensíveis pelo dono/admin, não apenas por desenvolvedor. | Alta | Parcial - eventos operacionais/auditoria possuem tipos e contexto de negócio; falta camada textual final para todos os eventos |
| RNF106 | [~] Dados sensíveis de cliente devem ser minimizados em logs, eventos, URLs, cookies e relatórios de afiliados. | Alta | Parcial - tracking público rejeita dados pessoais e eventos públicos usam identificadores técnicos; falta revisão completa de logs/relatórios |
| RNF107 | [~] Testes de regressão devem impedir voltar a usar código de produto, telefone ou nome como identificador global entre negócios. | Alta | Parcial |
| RNF108 | [~] O backend deve suportar migração gradual do modelo de reservas para pedidos sem quebrar vendas de live já existentes. | Alta | Parcial - pedidos completos coexistem com reservas, aceitam `reservaId` e reservas de live podem ser convertidas de forma idempotente; falta migração histórica em lote |
| RNF109 | [~] Novos módulos devem preservar fronteiras de domínio claras: Clientes, Pedidos, Produtos, Conversas, Campanhas, Loja, Afiliados, Social Inbox, Tracking e WhatsApp Policy. | Alta | Parcial - fronteiras implementadas para Clientes, Pedidos, Produtos, Loja Pública, Tracking, Afiliados, Social Inbox, Funil, Campanhas e WhatsApp Policy; falta revisão arquitetural final |
| RNF110 | [~] Falhas de provider externo devem resultar em tarefa, retry ou estado falhado explícito, nunca em perda silenciosa de dado. | Alta | Parcial - WhatsApp bloqueado antes do provider cria tarefa e outbox WhatsApp preserva retry/falhas; faltam tarefas para falha final de provider e demais integrações |

---

## 5. Regras de Negócio (RN)

### 5.1 Comentários e Parser

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN01 | [x] Um comentário só é automaticamente válido quando possui intenção de compra, telefone angolano válido e código de peça. | Implementado |
| RN02 | [x] A ordem entre telefone e código da peça não altera a validade do comentário. | Implementado |
| RN03 | [x] Telefones aceitos devem ser móveis angolanos com 9 dígitos e prefixos válidos, com ou sem indicativo `244` ou `00244`. | Implementado |
| RN04 | [x] Códigos de peça podem aparecer como número livre ou com rótulos como `peça`, `peca`, `produto`, `item` ou `#`. | Implementado |
| RN05 | [x] Intenções reconhecidas incluem variações como `eu quero`, `eu queri`, `qro`, `qr`, `meu`, `é meu`, `pega`, `reserva`, `guarda` e `fica pra mim`. | Implementado |
| RN06 | [x] Se faltar telefone, o comentário deve ir para revisão manual. | Implementado |
| RN07 | [x] Se faltar código de peça, o comentário deve ir para revisão manual. | Implementado |
| RN07A | [x] Se houver telefone e intenção de compra, mas faltar código da peça ou a peça não existir no catálogo, o cliente deve receber mensagem pedindo o código correto. | Implementado |
| RN08 | [x] Se o telefone não for angolano válido, o comentário deve ir para revisão manual. | Implementado |
| RN09 | [x] Se a confiança do parser ficar abaixo do limite operacional, o comentário deve ir para revisão manual. | Implementado |
| RN10 | [x] Comentários sem intenção de compra devem ser ignorados, mas podem permanecer no histórico. | Implementado |

### 5.2 Catálogo e Stock

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN11 | [x] Cada peça deve ter um código único dentro do negócio/loja ao qual pertence. | Implementado |
| RN12 | [x] Peças com quantidade zero devem ser tratadas como esgotadas ou indisponíveis. | Implementado |
| RN13 | [x] Peças vendidas ou esgotadas não devem receber nova reserva automática. | Implementado |
| RN14 | [x] O stock livre de uma peça é a quantidade total menos reservas que bloqueiam stock. | Implementado |
| RN15 | [x] Reservas em `WAITING_PAYMENT`, `PENDING`, `RESERVED` ou `PAID` bloqueiam stock. | Implementado |
| RN16 | [x] Reservas em `WAITLISTED` não bloqueiam stock. | Implementado |
| RN17 | [x] Quando a quantidade paga atingir o stock total, a peça pode ser marcada como vendida. | Implementado |

### 5.3 Reservas e Fila

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN18 | [x] O primeiro comentário válido para uma peça com stock livre ganha a reserva. | Implementado |
| RN19 | [x] Clientes seguintes entram em fila quando não há stock livre. | Implementado |
| RN20 | [x] O mesmo telefone não pode ter mais de uma reserva ativa para a mesma peça. | Implementado |
| RN21 | [x] O mesmo cliente pode reservar peças diferentes durante a mesma live. | Implementado |
| RN22 | [x] Reserva criada automaticamente deve iniciar como `WAITING_PAYMENT`. | Implementado |
| RN23 | [x] Reserva em fila deve iniciar como `WAITLISTED` e sem expiração até ser promovida. | Implementado |
| RN24 | [x] Uma reserva deve expirar quando o prazo configurado terminar sem pagamento confirmado. | Implementado |
| RN25 | [x] Ao expirar uma reserva, o sistema deve promover o primeiro cliente da fila, se houver stock livre. | Implementado |
| RN26 | [x] Ao cancelar uma reserva, o sistema deve promover o primeiro cliente da fila, se houver stock livre. | Implementado |
| RN27 | [x] Reserva promovida da fila deve receber novo prazo de pagamento. | Implementado |
| RN28 | [x] Para o piloto, o prazo recomendado de reserva é 15 minutos, mas deve permanecer configurável. | Implementado |

### 5.4 Revisão Manual

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN29 | [x] Comentários em revisão manual não devem criar reserva automática até aprovação do vendedor. | Implementado |
| RN30 | [x] O vendedor pode corrigir telefone e código da peça antes de aprovar a reserva. | Implementado |
| RN31 | [x] Ao aprovar manualmente, o sistema deve aplicar as mesmas regras de stock, duplicidade e fila da reserva automática. | Implementado |
| RN32 | [x] Ao rejeitar um comentário, nenhuma reserva deve ser criada e o motivo deve ficar registrado. | Implementado |
| RN33 | [x] Correções manuais devem ficar auditáveis para análise de erros do parser. | Implementado |

### 5.5 Pagamentos

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN34 | [x] Comprovativo recebido não significa pagamento confirmado. | Implementado |
| RN34A | [x] Comprovativo em `dataUrl` deve ser persistido como ficheiro interno antes de atualizar a reserva. | Implementado |
| RN35 | [x] Pagamento só pode ser confirmado por ação do backend autorizada por vendedor, humano ou regra explícita. | Implementado |
| RN36 | [x] Ao confirmar pagamento, a reserva deve passar para `PAID` e o pagamento para `CONFIRMADO`. | Implementado |
| RN37 | [x] Ao rejeitar pagamento, o estado de pagamento deve ser `REJEITADO` e o motivo deve ser informado. | Implementado |
| RN38 | [x] Reserva paga não deve expirar automaticamente. | Implementado |
| RN39 | [x] Reserva paga não deve ser cancelada por fluxo automático sem ação explícita autorizada. | Implementado |

### 5.6 WhatsApp e Atendimento

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN40 | [x] Quando `N8N_ASSUME_WHATSAPP=true`, o backend emite eventos, mas não envia WhatsApp direto. | Implementado |
| RN41 | [x] Quando `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=evolution`, o backend envia mensagens pela Evolution API. | Implementado |
| RN41A | [x] Quando `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=cloud-api`, o backend envia mensagens pelo WhatsApp Cloud API oficial usando `WHATSAPP_CLOUD_PHONE_NUMBER_ID`, `WHATSAPP_CLOUD_ACCESS_TOKEN` e, quando configurado, `WHATSAPP_CLOUD_DEFAULT_TEMPLATE_NAME`. | Implementado |
| RN42 | [x] A instância padrão conectada da Evolution deve ser preferida; se estiver fechada, o sistema pode escolher outra instância conectada. | Implementado |
| RN43 | [x] Mensagens automáticas devem respeitar rate limit para evitar spam e duplicidade. | Implementado |
| RN43A | [x] Mensagens WhatsApp devem passar por validação anti-spam antes de chegar ao provider externo. | Implementado |
| RN44 | [x] O vendedor deve poder usar templates aprovados para IBAN, reserva, lembrete e pagamento. | Implementado |
| RN45 | [x] Pedidos de desconto, troca de peça, comprovativo ilegível, cliente irritado ou cancelamento ambíguo devem ser encaminhados para humano. | Implementado |
| RN45A | [x] Limpeza operacional de comentários e mensagens deve exigir sessão autenticada e confirmação `LIMPAR`, apagando apenas histórico de comunicação e preservando catálogo, reservas, usuários, sessões e instâncias WhatsApp. | Implementado |

### 5.7 n8n, IA e Fonte de Verdade

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN46 | [x] O backend é a fonte de verdade para stock, preço, reserva, pagamento e fila. | Implementado |
| RN47 | [x] O n8n pode automatizar mensagens e follow-ups, mas não pode alterar dados fora dos endpoints autorizados. | Implementado |
| RN48 | [x] A IA deve usar apenas dados retornados pelo backend. | Implementado |
| RN49 | [x] A IA não pode inventar preço, stock, prazo, estado da reserva ou confirmação de pagamento. | Implementado |
| RN50 | [x] Eventos para n8n devem ser enviados apenas para tipos permitidos pelo contrato de automação. | Implementado |
| RN51 | [x] Se o n8n estiver indisponível, eventos devem permanecer na outbox para retry. | Implementado |

### 5.8 Operação do Piloto

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN52 | [ ] O vendedor piloto deve cadastrar as peças antes da live. | Processo |
| RN53 | [ ] Cada peça da live deve ter código simples e comunicado verbalmente ou visualmente durante a transmissão. | Processo |
| RN54 | [ ] Antes da live, o WhatsApp deve estar conectado e a sessão do vendedor deve estar ativa. | Processo |
| RN55 | [x] Se TikTok ou provider automático falhar, o vendedor deve usar modo manual sem perder reservas já criadas. | Implementado |
| RN56 | [x] A live piloto deve registrar métricas de comentários, reservas, revisões, pagamentos, expirações e erros. | Implementado |
| RN57 | [ ] A decisão pós-piloto deve considerar conversão, erros operacionais, satisfação do vendedor e uso em lives recorrentes. | Processo |

### 5.9 CRM de Loja, Clientes e Pedidos

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN58 | [~] O telefone canónico é o identificador principal de cliente no CRM, sem impedir múltiplos nomes, usernames ou origens. | Parcial - telefone canónico e identidade global/negócio implementados; faltam aliases sociais completos |
| RN59 | [x] Um cliente só pode ser fundido com outro mediante ação explícita de usuário autorizado. | Implementado no backend com preview e motivo obrigatório |
| RN60 | [x] Cliente com opt-out ou sem consentimento não pode receber campanha promocional. | Implementado no backend de campanhas marketing |
| RN61 | [~] Mensagens transacionais de pedido, pagamento e entrega podem ser enviadas quando necessárias à execução da venda e permitidas pelo provider/canal. | Parcial - política classifica utility/service e templates utilidade existem; faltam amarração de todos os eventos de pedido |
| RN62 | [x] Campanhas devem usar segmentos claros e nunca devem disparar para todos os clientes por padrão. | Implementado no backend com bloqueio de segmento vazio e filtros claros por tag, estado de relacionamento, origem ou consentimento de marketing |
| RN63 | [x] Todo pedido deve ter cliente, pelo menos um item, valor total e estado operacional. | Implementado no backend de Pedidos |
| RN64 | [x] Pedido pago não pode ser apagado; deve ser cancelado, devolvido, trocado ou ajustado com auditoria. | Implementado no backend sem rota de exclusão de pedido e com auditoria operacional em mudanças de estado, cancelamento, devolução/troca, pagamento, entrega e desconto |
| RN65 | [x] Desconto exige motivo e, acima do limite configurado, aprovação de perfil autorizado. | Implementado no backend com motivo obrigatório, limite percentual configurável por negócio e permissão `descontos:aprovar` para aplicar descontos acima do limite |
| RN66 | [~] Produto sem stock disponível não deve ser vendido automaticamente, mas pode entrar em lista de interesse/reposição. | Parcial - venda automática bloqueia stock indisponível; lista de interesse/reposição ainda falta |
| RN67 | [x] Movimento manual de stock exige motivo e responsável. | Implementado no backend |
| RN68 | [~] Categoria de produto só deve existir se melhorar filtro, catálogo ou relatório; categoria vazia deve ficar oculta. | Parcial - resumo expõe apenas categorias usadas; falta ocultar no frontend |
| RN69 | [~] Pedido rascunho não é categoria principal; só aparece dentro do cliente, conversa ou funil quando houver carrinho/orçamento real. | Parcial - backend cria orçamento contextual, sem submenu solto; falta UI contextual completa |
| RN70 | [~] Relatório só entra no menu comercial se responder uma pergunta prática da loja. | Parcial - backend de relatório comercial responde vendas, pendências, produto e margem; falta revisão da navegação final |
| RN71 | [x] Relatórios técnicos de automação pertencem ao Admin/Sistema, não ao menu do vendedor. | Implementado na navegação atual |
| RN72 | [x] Conversa sem resposta dentro do SLA deve gerar tarefa ou alerta. | Implementado no backend com `/atendimento/conversas/verificar-sla` |
| RN73 | [~] Cliente VIP, reclamação e pagamento pendente devem ter prioridade visual superior a conversa comum. | Parcial - backend cria tarefas de alta prioridade para reclamação/SLA e marca conversa com estado/tags; falta hierarquia visual final |
| RN74 | [~] Chatbot autônomo não pode assumir atendimento crítico sem política explícita e aprovação humana quando o caso envolver pagamento, desconto, troca, reclamação ou cancelamento. | Parcial - Social Inbox sensível e sugestões de IA exigem tarefa/estado humano; falta regra central para todos os canais futuros |
| RN75 | [~] Se uma mensagem de campanha falhar, o sistema deve registrar falha, motivo quando disponível e impedir reenvio infinito. | Parcial - itens de campanha têm status `FALHOU` e outbox preserva falha; falta ligação automática do webhook/status ao item de campanha |
| RN76 | [~] Tarefa atrasada deve continuar visível no Painel até ser concluída, reagendada ou cancelada com motivo. | Parcial - backend mantém tarefa aberta por estado/prazo e permite reagendar/cancelar; falta motivo obrigatório para cancelamento em todos os fluxos |
| RN77 | [x] Exportação de clientes deve respeitar permissões e registrar auditoria. | Implementado no backend |
| RN78 | [~] Configurações técnicas não devem ser acessíveis a vendedor comum. | Parcial - permissões por papel e navegação técnica separada existem; falta varredura final de todas as rotas técnicas |

### 5.10 CRM+ Social Commerce, Afiliados e WhatsApp Oficial

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN79 | [x] A live é um canal de aquisição e venda, mas o núcleo do Bizy deve ser cliente, produto, pedido, conversa, pagamento, entrega, campanha e relatório. | Implementado como orientação de backend: entidades e rotas principais já giram nesses módulos |
| RN80 | [~] A identidade canônica do cliente deve priorizar telefone/email quando existirem, mantendo aliases sociais como TikTok, Instagram, Facebook, username e nome exibido. | Parcial - Cliente 360 normaliza telefone/email e mantém username/userId/avatar; faltam aliases por provider em tabela própria |
| RN81 | [~] Uma visita anônima só vira cliente identificado quando o usuário fornece contacto, faz checkout, conversa pelo WhatsApp ou é associado por regra segura e permitida. | Parcial - checkout público só cria cliente identificado quando telefone ou email é informado |
| RN82 | [~] Um link rastreável pode atribuir origem/campanha, mas não pode sobrescrever dados confirmados do cliente sem auditoria. | Parcial - tracking público registra origem sem atualizar cliente; checkout preserva origem nas preferências; falta auditoria específica para correções de atribuição |
| RN83 | [~] A atribuição padrão deve ser configurável, mas o sistema deve mostrar claramente se a venda veio de live, site, WhatsApp, catálogo, campanha, afiliado, criador ou comentário social. | Parcial - origem/canal do checkout WhatsApp, checkout site, pedido público, funil por trackingId e atribuição de afiliado/criador no checkout site e WhatsApp implementados; faltam campanha e comentário social direto em pedido |
| RN84 | [x] Comissão de afiliado/criador só fica confirmada depois do pedido pago e dentro das regras de validade da atribuição. | Implementado no backend inicial de afiliados |
| RN85 | [~] Cancelamento, devolução, chargeback, reembolso ou fraude devem reverter ou bloquear comissão. | Parcial - cancelamento, devolução e reembolso revertem comissão; faltam chargeback, fraude e bloqueio preventivo |
| RN86 | [~] O dono/admin pode corrigir atribuição ou comissão manualmente, mas deve informar motivo e a alteração deve ficar auditada. | Parcial - pagamento individual e em lote de comissão guarda referência, observação, autor e histórico; faltam correção manual de atribuição/comissão e motivo obrigatório para esses ajustes |
| RN87 | [~] Afiliados e criadores não devem ver dados privados de clientes além do necessário para acompanhar desempenho, comissão e suporte operacional permitido. | Parcial - APIs de comissão/resumo e mini-loja pública não expõem dados privados de cliente nem contacto/método de pagamento do parceiro; falta portal/permissão específica para afiliado |
| RN88 | [~] Cliente com opt-out não pode receber marketing, campanhas, reativação, promoções de afiliados ou novidades. | Parcial - campanhas e envio manual bloqueiam marketing sem consentimento; faltam reativação/afiliados e opt-out granular |
| RN89 | [~] Mensagens de utilidade podem ser usadas para atualizações transacionais de pedido, pagamento, entrega, reserva, recibo e suporte operacional quando permitido pelo canal. | Parcial - política, templates utilidade e funil transacional de pedido/pagamento/entrega implementados; falta disparo automático completo de mensagens por todos os eventos |
| RN90 | [~] Mensagens de autenticação devem ser usadas apenas para OTP, login, validação de identidade ou confirmação de ação sensível. | Parcial - política exige template oficial para autenticação; login atual continua por SMS normal |
| RN91 | [x] Mensagens de serviço dependem de interação iniciada pelo cliente e da janela de atendimento permitida pelo WhatsApp/provedor. | Implementado no backend: texto livre de serviço usa a última mensagem inbound de WhatsApp para calcular a janela de atendimento |
| RN92 | [~] Mensagens de marketing incluem promoções, campanhas, novidades, reativação, cupões, catálogo promocional, cross-sell e divulgação de criadores/afiliados. | Parcial - campanhas marketing implementadas; faltam demais fontes promocionais |
| RN93 | [x] Texto promocional não pode ser misturado em template de utilidade ou autenticação para contornar categoria. | Implementado no motor de política WhatsApp |
| RN94 | [~] Todo envio WhatsApp iniciado pelo sistema deve passar por política de categoria antes de tentar envio. | Parcial - automação/manual/campanhas passam pela política; faltam todos os futuros eventos e validação persistida por tabela |
| RN95 | [~] Se o template necessário não estiver aprovado, configurado ou compatível com a categoria, o sistema deve criar tarefa humana em vez de enviar mensagem errada. | Parcial - envio manual cria tarefa em bloqueio e campanhas rejeitam template não aprovado; faltam tarefas para todos os eventos automáticos |
| RN96 | [x] Carrinho abandonado, lead frio, cliente inativo e campanha de novidade são marketing salvo quando a regra oficial vigente permitir outra classificação clara. | Implementado no motor de política WhatsApp com consentimento obrigatório antes do provider |
| RN97 | [x] Pagamento pendente, recibo, entrega e atualização de pedido são utilidade quando não contêm promoção. | Implementado com templates utility e bloqueio anti-promoção |
| RN98 | [~] Comentário social como `preço?`, `tem tamanho M?`, `entrega onde?` ou `quero` deve criar lead/oportunidade, não pedido confirmado automaticamente. | Parcial - Social Inbox registra interação, cria tarefa/oportunidade quando seguro e move funil para lead/conversa sem confirmar pedido; faltam oportunidades completas por todos os tipos e regras aprovadas de criação de pedido |
| RN99 | [x] Comentário com intenção incerta, reclamação, pedido de desconto, troca ou conflito deve gerar tarefa humana. | Implementado no backend do Social Inbox para reclamação e palavras sensíveis como desconto, troca, devolução, cancelamento, problema ou reembolso |
| RN100 | [x] O valor de entrega e total do pedido devem ser calculados antes do cliente confirmar compra pelo site ou WhatsApp. | Implementado no backend público; quando a entrega é `ORCAMENTO`, o total fica sem taxa automática e a equipa confirma o valor antes do pagamento |
| RN101 | [~] Stock só deve ser bloqueado quando pedido/reserva atingir estado configurado para bloqueio; simples visualização ou clique não bloqueia stock. | Parcial - criação de pedido valida stock e considera pedidos ativos; falta configuração por negócio e movimentos de stock |
| RN102 | [x] O checkout por WhatsApp deve preservar origem do link e produto selecionado para que o atendente não precise perguntar tudo outra vez. | Implementado no backend com produto, variante, entrega, origem efetiva e referência comercial quando houver |
| RN103 | [x] Cookies devem armazenar apenas identificadores técnicos, referência, campanha e timestamps, nunca telefone, email, nome ou endereço. | Implementado no backend de tracking público: payload com telefone, email, nome ou endereço é rejeitado |
| RN104 | [x] O cliente deve conseguir comprar mesmo recusando cookies não essenciais, com perda apenas de parte da atribuição/analytics. | Implementado no checkout público: `trackingId` é opcional e compra segue sem cookie |
| RN105 | [x] Evento de tracking não confirmado não pode ser tratado como venda, apenas como sinal de intenção ou oportunidade. | Implementado no resumo de tracking: venda/receita só entra com pedido criado/pagamento/entrega, não com visita ou clique |
| RN106 | [x] Dados capturados de redes sociais devem manter origem, link, provider, permissões e data para auditoria. | Implementado - Social Inbox guarda canal/provider/postUrl/contexto/permissões/captura e registra evento operacional `SOCIAL_INBOX_CAPTURED` com payload auditável |
| RN107 | [~] Quando a API social não permitir determinada extração, a plataforma deve indicar limitação e oferecer alternativa operacional sem fingir automação inexistente. | Parcial - Social Inbox aceita fallback manual/controlado com provider/permissões; falta UX dedicada por provider |
| RN108 | [~] Automações devem priorizar recuperação comercial de baixo risco: lembrar pagamento, pedir endereço, enviar catálogo solicitado, avisar reposição e criar follow-up. | Parcial - playbooks começam com criação de follow-up humano para gatilhos de recuperação; faltam mensagens/templates seguros e ações específicas por cenário |
| RN109 | [~] Automações não devem confirmar pagamento, conceder desconto, prometer entrega, resolver reclamação ou cancelar pedido sem regra explícita e permissão adequada. | Parcial - automações críticas viram tarefas/sugestões humanas em conversa/social; falta motor central de proibição para todos os futuros conectores |
| RN110 | [~] Todo funil deve permitir intervenção manual, alteração de etapa com motivo e histórico da mudança. | Parcial - backend registra movimento manual/API com etapa, motivo, origem, autor, contexto e histórico por entidade; falta UI de intervenção |
| RN111 | [~] O negócio pode operar sem loja pública, sem afiliados ou sem social inbox, mas o núcleo de CRM deve permanecer consistente. | Parcial - backend mantém `crm` obrigatório e permite desligar módulos opcionais; falta refletir tudo na UI |
| RN112 | [~] Se o módulo estiver desativado, sua UI não deve aparecer como promessa vazia para o usuário final. | Parcial - backend já bloqueia rotas por módulo desativado; falta esconder navegação/componentes no frontend |
| RN113 | [~] Links de afiliado/criador devem expirar ou ser desativados quando o perfil for bloqueado, campanha encerrada ou produto indisponível. | Parcial - checkout e mini-loja ignoram link expirado/inativo, parceiro pausado/bloqueado e produto indisponível; faltam campanha encerrada e rotas operacionais de pausa |
| RN114 | [x] Pedido vindo de afiliado deve mostrar comissão estimada para o dono, mas o cliente final não precisa ver essa regra. | Implementado via API administrativa de comissões |
| RN115 | [x] Relatórios devem separar receita bruta, entrega, descontos, comissões e receita líquida estimada quando os dados existirem. | Implementado no backend comercial para pedidos/entrega/descontos; comissões já possuem relatórios próprios |
| RN116 | [x] O cliente deve poder pedir remoção/anonimização dos seus dados quando aplicável, preservando apenas dados fiscais/financeiros agregados exigidos por auditoria. | Implementado no backend: anonimização remove dados pessoais do cliente e preserva pedidos/histórico financeiro por vínculo interno |
| RN117 | [x] Campanhas devem ter nome, objetivo, público, canal, template, janela de envio, limite e métrica de sucesso antes de serem disparadas. | Implementado no backend com validação, preview e confirmação |
| RN118 | [x] Toda campanha deve ter mecanismo de interrupção/pausa imediata pelo dono/admin. | Implementado no backend com `/campanhas/:id/pausar` |
| RN119 | [~] A plataforma deve distinguir métrica de vaidade de métrica operacional: visualização só importa quando ligada a lead, conversa, pedido ou venda. | Parcial - relatórios priorizam pedidos, receita, comissões, tarefas, conversões e funil por tracking/social/pedido; falta camada final de UI/copy |
| RN120 | [ ] O documento de requisitos deve ser atualizado sempre que um novo canal, categoria WhatsApp, regra de comissão ou modelo de venda for adotado. | Processo |

### 5.11 Regras de Negócio da Fundação Backend CRM+

| ID | Regra de Negócio | Estado |
|---|---|---|
| RN121 | [~] Todo dado comercial pertence a um negócio, exceto entidades globais controladas, como identidade canónica de cliente e catálogos públicos quando explicitamente publicados. | Parcial |
| RN122 | [x] Compartilhamento de dados de cliente entre negócios exige relacionamento aprovado, escopo definido, motivo e auditoria. | Implementado no backend com criação e revogação auditadas |
| RN123 | [~] Uma loja não pode ver histórico comercial privado de outra loja sem consentimento, relação operacional ou regra explícita de compartilhamento. | Parcial - consulta recebida retorna dados sanitizados por escopo e não inclui tags, pedidos ou histórico comercial; falta UI e políticas avançadas |
| RN124 | [x] Cliente global identifica a pessoa; cliente do negócio representa a relação comercial daquela pessoa com uma loja específica. | Implementado no modelo de dados |
| RN125 | [~] Produto, pedido, conversa, campanha, tarefa, afiliado, comissão e tracking sempre devem carregar origem e negócio responsável. | Parcial - produtos, pedidos, clientes, reservas, comentários, conversas, mensagens, outbox, instâncias WhatsApp, afiliados, comissões, campanhas, eventos, jobs e tracking avançados |
| RN126 | [~] Módulo desativado não pode executar automação, receber webhook ativo, disparar campanha ou aparecer como promessa visual na operação comercial. | Parcial - guardas comerciais ativas em módulos HTTP principais e campanhas; falta cobertura total em webhooks/futuros conectores |
| RN127 | [x] Código de produto só precisa ser único dentro do negócio, permitindo lojas diferentes usarem códigos iguais sem colisão. | Implementado |
| RN128 | [x] Pedido deve ser a entidade comercial principal; reserva continua como mecanismo de bloqueio temporário dentro de live, conversa ou checkout. | Implementado - reservas bloqueiam stock temporariamente e podem evoluir para pedido comercial completo com vínculo `reservaId` |
| RN129 | [x] Comissão de afiliado ou criador depende de pedido pago, atribuição válida e ausência de cancelamento/devolução/reembolso. | Implementado no backend |
| RN130 | [x] Tracking ajuda atribuição, mas não substitui prova de pedido, pagamento ou consentimento. | Implementado: eventos de tracking não contam como venda sem pedido/pagamento |
| RN131 | [~] Toda mensagem WhatsApp iniciada pelo sistema precisa de categoria, motivo, entidade relacionada e fallback antes do envio. | Parcial - política/categoria/motivo/contexto existem para WhatsApp e campanhas; faltam fallback estruturado em todos os eventos |
| RN132 | [~] Quando houver conflito entre automação e segurança operacional, o backend deve preferir tarefa humana. | Parcial - bloqueios de política e playbooks conservadores criam tarefa; falta regra central para todos os domínios |
| RN133 | [x] Exportação de clientes, pedidos, comissões ou relatórios só pode ocorrer por usuário autorizado e deve ficar auditada. | Implementado no backend com permissões comerciais e trilha de auditoria para exportações de clientes, pedidos, relatórios e lotes/comissões |
| RN134 | [~] Toda alteração manual em pagamento, desconto, comissão, stock, atribuição ou fusão de cliente exige responsável e motivo quando afetar dinheiro, entrega ou privacidade. | Parcial - pagamento, desconto, stock, comissão/lotes e fusão têm responsável/motivo e diff; falta correção manual de atribuição com motivo obrigatório |
| RN135 | [x] Dados recebidos de redes sociais devem manter provider, permissões, link original e data da captura para diagnóstico e conformidade. | Implementado no Social Inbox com provider, postUrl, permissões e `capturedAt` em contexto |
| RN136 | [~] O backend deve permitir operação mínima sem loja pública, sem afiliados ou sem social inbox, mantendo clientes, pedidos, produtos, conversas e pagamentos consistentes. | Parcial - módulos opcionais podem ser desligados mantendo CRM/pedidos/produtos; falta matriz de testes completa por combinação |

### 5.12 Mapa de Navegação Pretendido para CRM

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
| OOS01 | [~] Multi-loja | Parcial CRM+ | Fundação de banco iniciada; ainda faltam escopo total nas rotas, permissões e experiência de gestão entre negócios |
| OOS02 | [ ] Multi-vendedor avançado | Parcial CRM | Papéis mínimos entram no CRM; organograma avançado fica depois |
| OOS03 | [ ] Entidades separadas `Cliente`, `Pedido`, `Pagamento` e `Entrega` | Em escopo CRM | Sai do fora de escopo e passa para RF85-RF111 |
| OOS04 | [ ] Relatórios analíticos avançados | Parcial CRM | Relatórios úteis entram no CRM; exploração avançada fica depois |
| OOS05 | [ ] Integração Instagram/Facebook | Em escopo CRM+ | Entra como Social Inbox/Comentários Sociais em RF197-RF208, respeitando providers, permissões e fallback manual |
| OOS06 | [ ] App mobile nativo | Pós-MVP | Frontend web responsivo atende piloto |
| OOS07 | [ ] Reconciliação bancária automática | Pós-MVP | Requer integração financeira específica |
| OOS08 | [ ] Chatbot IA autônomo | Pós-MVP | Assistente controlado entra no CRM; autonomia total continua fora |
| OOS09 | [ ] Website/montra completa com páginas, menu e checkout público | Em escopo CRM+ | Entra como loja virtual, catálogo digital e checkout WhatsApp/site em RF157-RF174 |
| OOS10 | [ ] Calendário de agenda comercial completo | Pós-MVP | Só entra se tarefas e entregas exigirem visão calendário |
| OOS11 | [ ] Marketplace público multi-vendedor entre várias lojas independentes | Pós-MVP | O CRM+ prepara multi-loja, mas marketplace público exige regras próprias de catálogo, pagamento, disputa e reputação |
| OOS12 | [ ] App nativo específico para afiliados/criadores | Pós-MVP | O primeiro passo deve ser painel/link web responsivo e relatórios simples de comissão |

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
- [~] Clientes tiverem perfil 360 com conversas, pedidos, pagamentos, entregas, notas, tags, tarefas e consentimento.
- [x] Pedidos substituírem reservas como entidade comercial completa, mantendo compatibilidade com vendas de live.
- [~] Conversas permitirem responder, criar pedido, cobrar, confirmar pagamento, pedir entrega e criar tarefa sem sair da tela.
- [x] Campanhas respeitarem opt-out, consentimento, segmentos e templates aprovados.
- [~] Relatórios úteis responderem perguntas de venda, atendimento, produto, campanha e cliente.
- [x] Tarefas automáticas cobrirem pagamento vencido, mensagem falhada, cliente sem resposta, pedido pago sem entrega e follow-up pós-venda.
- [~] Permissões impedirem vendedor comum de acessar tokens, providers, n8n, webhooks e configurações técnicas.
- [x] A experiência mobile não tiver scroll horizontal nas páginas de Clientes, Pedidos, Produtos, Conversas e Painel.
- [x] A interface estiver migrada para `shadcn/ui` nos componentes recorrentes e novas telas deixarem de usar botões, inputs, cards, badges e modais feitos do zero.

### 7.2 Critérios de Aceite da Etapa Bizy CRM+ Social Commerce

O CRM+ Social Commerce pode ser considerado pronto para operação inicial quando:

- [~] Um negócio conseguir publicar loja virtual com URL própria, produtos, coleções, stock e página pública de produto; backend público lista e filtra produtos, faltam domínio final e UI de coleção avançada.
- [~] O cliente conseguir comprar pelo WhatsApp com mensagem pré-preenchida, entrega e atribuição comercial preservada, e pelo checkout do site com total calculado.
- [x] O sistema calcular entrega por zona, taxa padrão, retirada, entrega grátis ou orçamento humano antes da confirmação.
- [ ] O dono conseguir criar catálogo digital partilhável com produtos selecionados e disponibilidade correta.
- [~] Links rastreáveis de produto, criador e afiliado registrarem referência, origem, mini-loja pública, checkout WhatsApp/site, pedido, comissão atribuída, resolução pública e bloqueio de autoindicação; faltam catálogo e campanha.
- [x] O tracking funcionar parcialmente sem cookies, mantendo operação de compra intacta e rejeitando dados pessoais no identificador público.
- [~] O dono conseguir criar afiliado/criador, gerar link próprio, publicar mini-loja autorizada, receber pacote de divulgação, acompanhar pedidos atribuídos, confirmar comissão após pagamento, ver saldo financeiro e pagar/exportar comissões individualmente ou em lote; faltam UI e portal do afiliado.
- [x] O sistema reverter comissão quando pedido for cancelado, devolvido ou reembolsado.
- [~] Comentários sociais de posts, vídeos, fotos ou lives suportados forem capturados/importados, deduplicados, filtrados, classificados e convertidos em lead, conversa, tarefa ou oportunidade.
- [~] O funil mostrar jornada do cliente desde visita/interação até pagamento, entrega, pós-venda e recompra.
- [~] Playbooks e oportunidades de recuperação cobrirem carrinho abandonado, pagamento pendente, reserva expirada e cliente inativo; carrinho abandonado cria oportunidade deduplicada, faltam mensagens/templates automáticos finais.
- [~] Todo envio WhatsApp passar pela política de categoria: marketing, utilidade, autenticação ou serviço, incluindo bloqueio de texto promocional em utilidade/autenticação, recuperação comercial como marketing e janela de serviço calculada por conversa; faltam sincronização oficial/provider e preços por categoria.
- [~] O sistema impedir envio quando template/categoria estiver ausente, incompatível ou sem aprovação, criando tarefa humana.
- [x] Opt-out e consentimento bloquearem campanhas e mensagens promocionais.
- [~] Relatórios mostrarem receita por canal, produto, campanha, criador, afiliado, social post e funil; backend social-receita existe, faltam campanha completa e UI.
- [~] O dono/admin conseguir pausar campanhas, automações, afiliados e integrações sociais rapidamente.
- [ ] A experiência mobile da loja pública, checkout, catálogo e principais telas CRM+ estiver sem scroll horizontal e com ações principais acessíveis.

### 7.3 Critérios de Aceite da Fundação Backend CRM+

O backend pode ser considerado pronto para receber os módulos CRM+ quando:

- [~] Todas as rotas comerciais resolverem `usuarioId`, `negocioId`, papel, permissões e módulos ativos antes de consultar dados; fundação HTTP e governança de módulos já existem, faltam varredura final e cobertura em módulos futuros.
- [~] Produtos, clientes, pedidos, conversas, mensagens, afiliados, comissões, campanhas, tarefas e tracking estiverem isolados por negócio; faltam varredura final em todos os webhooks futuros.
- [~] Clientes globais e clientes por negócio estiverem deduplicados sem vazar histórico privado entre lojas; compartilhamento recebido sanitiza dados por escopo e revogação remove acesso, fusão backend existe, faltam portal de consentimento e políticas avançadas.
- [x] Pedidos existirem como entidade comercial completa, com compatibilidade para reservas de live.
- [~] O motor de WhatsApp Policy bloquear envio sem categoria, template, consentimento, janela válida ou texto promocional em categoria transacional.
- [~] Outbox/event bus suportar retry e idempotência para WhatsApp, n8n, campanhas, tracking, social inbox e comissões.
- [~] Permissões impedirem vendedor comum de acessar dados técnicos, tokens, configurações globais e exportações sensíveis.
- [x] Auditoria registrar ações críticas de dinheiro, cliente, stock, comissão, permissão e compartilhamento; exportação, pagamento, desconto, entrega, cancelamento, stock, permissões, comissão e compartilhamento têm trilhas com ator, motivo e diff quando aplicável.
- [~] APIs novas tiverem testes de use-case, repositório e rota HTTP; inbox/SLA/social/tracking/transferência e política WhatsApp têm testes dedicados.
- [~] Migrations e seeds permitirem subir dev/staging/prod sem correção manual invisível.

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
| CRM+ Social Commerce | RF152-RF244 | RNF73-RNF95 | RN79-RN120 |
| Fundação Backend CRM+ | RF245-RF270 | RNF96-RNF110 | RN121-RN136 |

---

## 9. Referências de Produto para a Etapa CRM

Estas referências não substituem as decisões do Bizy, mas ajudam a manter a próxima etapa alinhada com padrões reais de venda por WhatsApp, clientes, pedidos e segmentação:

- Take App Help Center: módulos de produtos, gestão de pedidos, pagamentos, entregas, clientes, WhatsApp Business, analytics e multi-store. Fonte: <https://help.take.app/en/>
- Take App Inbox & Broadcast: caixa de entrada WhatsApp e transmissões como aceleradores de venda quando usados com contexto e segmentação. Fonte: <https://help.take.app/en/articles/12798978-boost-whatsapp-sales-take-app-inbox-broadcast>
- Shopify Customer Segmentation: segmentos automáticos para comunicar a mensagem certa ao cliente certo. Fonte: <https://help.shopify.com/en/manual/customers/customer-segmentation>
- Shopify Customer Reports: relatórios de clientes, coortes, clientes de alto valor e reativação. Fonte: <https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/customers-reports>
- Meta WhatsApp Business Platform: mensagens iniciadas pela empresa exigem templates aprovados e respeito às políticas do canal. Fonte: <https://developers.facebook.com/docs/whatsapp>
- Meta WhatsApp Cloud API: referência oficial para envio, templates, webhooks e operação da API oficial. Fonte: <https://developers.facebook.com/docs/whatsapp/cloud-api>
- Meta Conversions API: referência para eventos server-side e atribuição futura de campanhas quando houver consentimento e configuração. Fonte: <https://developers.facebook.com/docs/marketing-api/conversions-api>
- Meta Instagram Platform Webhooks: referência para receber eventos de contas/conteúdos suportados por permissões oficiais. Fonte: <https://developers.facebook.com/docs/instagram-platform/webhooks>
- TikTok for Developers: referência para capacidades oficiais, limites e integrações possíveis com conteúdo e comentários. Fonte: <https://developers.tiktok.com/>
- Observação operacional: categorias, templates, janelas de atendimento, preços e políticas do WhatsApp devem seguir a documentação oficial vigente no momento da implementação, porque regras de plataforma podem mudar.
