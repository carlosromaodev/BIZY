# Migração BIZY CRM → BIZY Team — Requisitos Funcionais, Não Funcionais e Regras de Negócio

Documento: `RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
Versão: 1.1
Data: 2026-07-10
Autor: Carlos
Status: Planeamento — migração do BIZY CRM+ para ecossistema operacional BIZY Team com benchmark internacional V2 incorporado

---

## 1. Objetivo do Documento

Este documento formaliza os requisitos para a transformação do BIZY CRM+ num ecossistema operacional completo — o **BIZY Team** — integrando inteligência preditiva, gestão financeira, adaptabilidade organizacional e integração profunda nos fluxos de trabalho diários. A migração visa tornar a plataforma indispensável para toda a rede Bizy, passando de ferramenta utilitária a sistema operacional central de negócio.

Referência estratégica: "Do Utilitário ao Essencial: Um Modelo para Transformar o BIZY Team num Ecossistema Operacional Indispensável"

Atualização 2026-07-10: a auditoria integral de benchmark internacional V2 reforça o Team como dominio operacional M5 para pessoas, estrutura, turnos, presença, desenvolvimento, performance, projectos, portfólio, workflow, auditoria e controlo de mudanças. ISO 30414:2025 e ISO 21500/21502 entram como referencias de desenho, nao como certificacao declarada.

---

## 2. Contexto da Migração

### 2.1 Estado Actual (BIZY CRM+)

O BIZY CRM+ possui 20 módulos HTTP, 55 modelos Prisma e 44 use cases cobrindo:
- Automação de lives (Instagram, TikTok)
- CRM com Clientes 360 e funil comercial
- Catálogo, stock e variantes
- Pedidos com comprovativo, entrega e auditoria
- Loja pública e checkout unificado
- Bizy Market (marketplace multi-loja)
- Afiliados, criadores e revendedores com comissões
- Social Inbox (Instagram, WhatsApp)
- Campanhas WhatsApp segmentadas
- Tarefas operacionais e playbooks de recuperação
- Relatórios comerciais (vendas, atendimento, retenção)
- Governança, auditoria e RBAC com 8 papéis

### 2.2 Lacunas Identificadas para BIZY Team

**Equipa/Team:**
- Sem dashboard de desempenho por membro
- Sem gestão de turnos/horários
- Sem metas individuais vs equipa
- Sem presença/disponibilidade em tempo real
- Sem fluxo de onboarding completo para membros convidados

**Finanças:**
- Sem fluxo de caixa / DRE
- Sem gestão de despesas
- Sem geração de facturas/recibos
- Sem orçamento por período
- Sem contas a receber/pagar além de pedidos
- Sem previsão financeira
- Reconciliação bancária por importação CSV/OFX implementada; integração bancária directa ainda não incluída.

**Inteligência Preditiva:**
- Sem previsão de demanda
- Sem scoring de risco de churn
- Sem previsão de fluxo de caixa
- Sem detecção de anomalias
- Sem insights proactivos na interface

**Conformidade Regulatória:**
- Geração de e-invoicing XML/UBL implementada; submissão Peppol/API governamental depende de credenciais externas.
- Sem conformidade fiscal automatizada
- Sem integração com portais governamentais

---

## 3. Renomeação e Identidade

### 3.1 De BIZY CRM para BIZY Team

| Antes | Depois |
|---|---|
| BIZY CRM+ | BIZY Team ✅ |
| Secção "CRM" na navegação | Secção "Comercial" ✅ |
| Módulo `crm` (obrigatório) | Módulo `team-core` (obrigatório) |
| Papéis CRM (VENDEDOR, ATENDENTE) | Mantidos + novos papéis |
| `crmApoio` | `apoioComercial` ✅ |
| Referências a "CRM" no código | Substituídas por "Team" onde aplicável; aliases técnicos legados permanecem para compatibilidade ✅ |

---

## 4. Pilares da Migração

### Pilar 1 — Motor de Inteligência Preditiva
### Pilar 2 — Plataforma de Gestão Financeira Integrada
### Pilar 3 — Modo Equipa Avançado
### Pilar 4 — Interface de Workflow Integrada (Ambient Analytics)
### Pilar 5 — Adaptabilidade Estrutural (Híbrido Hierárquico + Projectos)
### Pilar 6 — Conformidade Regulatória e E-Invoicing
### Pilar 7 — Métricas de ROI e Adopção
### Pilar 8 — Integração Operacional (Projectos Comerciais, Lives e Campanhas)
### Pilar 9 — Gestão de Pessoas, Capacidade e Portfólio M5

---

## 5. Requisitos Funcionais (RF)

### Pilar 1 — Motor de Inteligência Preditiva

#### 5.1.1 Previsão de Demanda

- [x] [RF-T001] O sistema deve calcular previsão de demanda por SKU com base no histórico de vendas, sazonalidade e tendências, actualizando diariamente.
- [x] [RF-T002] O sistema deve gerar alertas proactivos de reposição de stock quando a previsão indicar ruptura nos próximos 7/14/30 dias.
- [x] [RF-T003] O sistema deve identificar produtos encalhados com risco de obsolescência e sugerir acções (promoção, bundle, descontinuação).
- [x] [RF-T004] O sistema deve detectar padrões sazonais e apresentar comparação período-a-período (mês actual vs mesmo mês do ano anterior).

#### 5.1.2 Scoring de Clientes e Churn

- [x] [RF-T005] O sistema deve calcular score de risco de churn por cliente com base em recência, frequência, valor monetário (RFM) e comportamento de interacção.
- [x] [RF-T006] O sistema deve segmentar automaticamente clientes em coortes: activo, em risco, inactivo, perdido, novo, VIP.
- [x] [RF-T007] O sistema deve gerar alertas quando um cliente VIP entra em risco de churn, criando tarefa operacional para o responsável.
- [x] [RF-T008] O sistema deve calcular LTV (Lifetime Value) estimado por cliente e por segmento.
- [x] [RF-T009] O sistema deve pontuar oportunidades de venda (lead scoring) com base no histórico, comportamento no site/loja e interacções sociais.

#### 5.1.3 Previsão Financeira

- [x] [RF-T010] O sistema deve gerar previsão de fluxo de caixa rolling para as próximas 13 semanas com cenários: optimista, pessimista e mais provável.
- [x] [RF-T011] O sistema deve alertar gestores sobre potenciais défices de caixa com antecedência mínima de 7 dias.
- [x] [RF-T012] O sistema deve prever receita mensal com base em pipeline comercial, histórico e sazonalidade.
- [x] [RF-T013] O sistema deve identificar anomalias em receita/despesa (desvios superiores a 2 desvios-padrão da média histórica).

#### 5.1.4 Previsão Operacional

- [x] [RF-T014] O sistema deve prever atrasos em tarefas e projectos com base na velocidade histórica da equipa e carga actual.
- [x] [RF-T015] O sistema deve sugerir rebalanceamento de carga quando detectar sobrecarga num membro da equipa.
- [x] [RF-T016] O sistema deve identificar gargalos no funil comercial e sugerir acções correctivas.

#### 5.1.5 Ambient Analytics

- [x] [RF-T017] O sistema deve apresentar insights preditivos de forma contextualizada dentro dos fluxos de trabalho (não apenas em dashboards dedicados).
- [x] [RF-T018] O sistema deve entregar notificações proactivas de insights via WhatsApp para gestores e donos de negócio. *(implementado em `POST /workflow/notificacoes/proactivas/alertas`: inclui insights preditivos de alta confiança no alerta WhatsApp aos gestores)*
- [x] [RF-T019] O sistema deve permitir configuração do nível de proactividade dos alertas (mínimo, moderado, completo) por utilizador.

---

### Pilar 2 — Plataforma de Gestão Financeira Integrada

#### 5.2.1 Fluxo de Caixa e DRE

- [x] [RF-T020] O sistema deve manter registo de todas as entradas (vendas, recebimentos, comissões recebidas) e saídas (despesas, pagamentos a fornecedores, comissões pagas, taxas) por negócio.
- [x] [RF-T021] O sistema deve apresentar dashboard de fluxo de caixa dinâmico com saldo actual, entradas/saídas do dia/semana/mês e tendência.
- [x] [RF-T022] O sistema deve gerar DRE (Demonstração de Resultado do Exercício) mensal automática com receita bruta, deduções, receita líquida, custos variáveis, margem de contribuição, custos fixos e resultado operacional.
- [x] [RF-T023] O sistema deve permitir categorização de entradas e saídas financeiras com categorias configuráveis por negócio.

#### 5.2.2 Gestão de Despesas

- [x] [RF-T024] O sistema deve permitir registo manual de despesas com categoria, valor, data, recorrência (única/mensal/semanal), fornecedor e comprovativo.
- [x] [RF-T025] O sistema deve suportar despesas recorrentes com criação automática mensal/semanal e alerta de vencimento.
- [x] [RF-T026] O sistema deve calcular custos fixos vs variáveis e apresentar evolução mensal.
- [x] [RF-T027] O sistema deve alertar quando despesas de uma categoria ultrapassarem o orçamento definido.

#### 5.2.3 Contas a Receber

- [x] [RF-T028] O sistema deve manter ledger de contas a receber com aging (a vencer, vencido 1-30d, 31-60d, 61-90d, >90d).
- [x] [RF-T029] O sistema deve gerar automaticamente cobrança para pagamentos vencidos via tarefa operacional e opcionalmente via WhatsApp.
- [x] [RF-T030] O sistema deve calcular taxa de inadimplência por período e por segmento de cliente.
- [x] [RF-T031] O sistema deve prever risco de inadimplência por cliente/pedido com base no histórico de pagamento.

#### 5.2.4 Contas a Pagar

- [x] [RF-T032] O sistema deve manter ledger de contas a pagar com data de vencimento, fornecedor, valor e estado.
- [x] [RF-T033] O sistema deve sugerir priorização de pagamentos com base na previsão de fluxo de caixa e condições de pagamento.
- [x] [RF-T034] O sistema deve alertar sobre pagamentos próximos do vencimento (3 dias, 1 dia, vencido).

#### 5.2.5 Facturação e Recibos

- [x] [RF-T035] O sistema deve gerar facturas a partir de pedidos confirmados com dados fiscais do negócio e do cliente.
- [x] [RF-T036] O sistema deve suportar numeração sequencial de facturas por série e ano fiscal, configurável por negócio.
- [x] [RF-T037] O sistema deve gerar recibos de pagamento quando o pagamento for confirmado.
- [x] [RF-T038] O sistema deve suportar notas de crédito vinculadas à factura original para devoluções e reembolsos.
- [x] [RF-T039] O sistema deve exportar facturas em PDF com layout configurável (logo, dados fiscais, rodapé legal).

#### 5.2.6 Orçamento

- [x] [RF-T040] O sistema deve permitir definição de orçamento mensal por categoria de despesa.
- [x] [RF-T041] O sistema deve apresentar comparação orçado vs realizado com variação percentual e absoluta.
- [x] [RF-T042] O sistema deve alertar quando o realizado ultrapassar 80% e 100% do orçamento de uma categoria.

#### 5.2.7 Reconciliação

- [x] [RF-T043] O sistema deve permitir importação de extracto bancário (CSV/OFX) para reconciliação manual assistida. *(implementado: `POST /financas/reconciliacao/importar` persiste importação e movimentos bancários)*
- [x] [RF-T044] O sistema deve sugerir correspondências automáticas entre movimentos bancários e registos internos (pedidos, despesas, comissões). *(implementado: matching por tipo/valor/data/descrição com sugestões em `sugestoesJson`)*
- [x] [RF-T045] O sistema deve marcar itens reconciliados e destacar itens sem correspondência para resolução manual. *(implementado: conciliação marca movimento bancário e ledger; itens pendentes/ignorados ficam filtráveis)*

#### 5.2.8 E-Invoicing e Conformidade

- [x] [RF-T046] O sistema deve suportar geração de facturas electrónicas em formato estruturado (XML/UBL) compatível com normativas locais. *(implementado: `GET /conformidade/facturas/:id/e-invoicing` gera XML UBL 2.1/Peppol BIS)*
- [x] [RF-T047] O sistema deve permitir configuração de regras fiscais por país/região (IVA, retenções, isenções).
- [x] [RF-T048] O sistema deve preparar integração com redes Peppol e gateways de e-invoicing regionais via API. *(implementado: catálogo de adaptadores UBL/Peppol/API regional e `POST /conformidade/facturas/:id/e-invoicing/enviar` prepara despacho assíncrono via outbox n8n com referência de credencial cifrada)*
- [x] [RF-T049] O sistema deve validar facturas contra regras fiscais antes da emissão, bloqueando emissão não conforme.
- [x] [RF-T050] O sistema deve manter registo auditável de todas as facturas emitidas, canceladas e corrigidas.

---

### Pilar 3 — Modo Equipa Avançado

#### 5.3.1 Dashboard de Desempenho por Membro

- [x] [RF-T051] O sistema deve calcular KPIs individuais por membro: vendas realizadas, valor total vendido, pedidos processados, conversas atendidas, tempo médio de resposta, tarefas concluídas no prazo.
- [x] [RF-T052] O sistema deve apresentar ranking comparativo de membros da equipa por KPI seleccionado (com opção de ocultar ranking para equipas pequenas).
- [x] [RF-T053] O sistema deve apresentar evolução temporal do desempenho de cada membro (diário, semanal, mensal).
- [x] [RF-T054] O sistema deve calcular taxa de conversão individual (leads atendidos vs vendas fechadas) por membro.

#### 5.3.2 Metas Individuais e de Equipa

- [x] [RF-T055] O sistema deve permitir definição de metas de vendas por membro e por equipa com período (diário, semanal, mensal).
- [x] [RF-T056] O sistema deve apresentar progresso em tempo real da meta individual e colectiva com percentagem e valor restante.
- [x] [RF-T057] O sistema deve gerar alerta quando um membro estiver abaixo de 50% da meta com menos de 50% do período restante.
- [x] [RF-T058] O sistema deve calcular bónus/comissão por membro quando a meta for atingida, conforme regras configuráveis por negócio.

#### 5.3.3 Gestão de Turnos e Disponibilidade

- [x] [RF-T059] O sistema deve permitir configuração de turnos/horários por membro com dia da semana, hora de início e fim.
- [x] [RF-T060] O sistema deve considerar disponibilidade de turno na atribuição automática de conversas e tarefas.
- [x] [RF-T061] O sistema deve registar presença/ausência (check-in/check-out) manual ou automática.
- [x] [RF-T062] O sistema deve calcular horas trabalhadas por membro e por período.

#### 5.3.4 Onboarding de Membros

- [x] [RF-T063] O sistema deve enviar convite por WhatsApp ou email com link de activação quando um membro é adicionado.
- [x] [RF-T064] O sistema deve apresentar fluxo de onboarding guiado para novos membros com configuração de perfil, tour das funcionalidades permitidas e primeira tarefa. *(implementado: checklist orientado por membro, primeira tarefa `ONBOARDING_MEMBRO`, endpoint `/equipa/onboarding-guiado` e cartão no Painel com passos pendentes e módulos permitidos)*
- [x] [RF-T065] O sistema deve permitir que o dono/admin acompanhe o estado do onboarding de cada membro convidado.

#### 5.3.5 Comunicação Interna

- [x] [RF-T066] O sistema deve suportar notas internas por conversa, pedido, cliente e projecto, visíveis apenas para membros da equipa.
- [x] [RF-T067] O sistema deve permitir menção (@membro) em notas internas com notificação ao mencionado.
- [x] [RF-T068] O sistema deve manter feed de actividade da equipa com acções relevantes (venda fechada, tarefa concluída, meta atingida).

#### 5.3.6 Convite e Acesso Frictionless (Sem Fricção)

> **Filosofia:** No mercado angolano e em mercados emergentes, o email corporativo com senhas complexas é barreira. O acesso deve ser Mobile-First e centrado no WhatsApp/Telemóvel. O convite via "Magic Link" no WhatsApp elimina fricção: o dono envia directamente pelo WhatsApp da equipa — *"Olá Ana, adicionei-te à equipa da Loja X no BIZY. Clica aqui para aceitar e veres as tuas tarefas."*

- [x] [RF-T108] O sistema deve gerar "Magic Links" de convite que podem ser partilhados via WhatsApp, SMS ou Email, com token único e data de expiração.
- [x] [RF-T109] O sistema deve suportar login passwordless (sem palavra-passe) através de código OTP (One-Time Password) enviado via WhatsApp ou SMS para o número do membro.
- [x] [RF-T110] O sistema deve permitir que um utilizador (ex: contabilista externo) pertença a múltiplos negócios (Workspaces) com uma única conta, utilizando um seletor de Workspace na interface sem necessidade de logout/login.
- [x] [RF-T111] O sistema deve oferecer "Personas de Acesso" (Templates de Papéis) durante o convite (ex: Vendedor, Atendente, Gestor de Loja, Apenas Leitura), para evitar que o dono tenha de configurar permissões granulares (RBAC) manualmente.

#### 5.3.7 Onboarding Interativo e "Aha! Moment"

> **Filosofia:** Se o funcionário faz login e vê um dashboard vazio/complexo, a perceção de "não é necessário" instala-se imediatamente. O primeiro contacto deve gerar valor imediato.

- [x] [RF-T112] O sistema deve apresentar um "Checklist de Primeiro Dia" dinâmico no painel do novo membro (ex: 1. Configurar notificações WhatsApp; 2. Responder ao primeiro lead; 3. Conhecer a equipa), adaptado ao papel.
- [x] [RF-T113] O sistema deve ocultar módulos complexos e desnecessários para o papel do utilizador durante os primeiros 7 dias, focando apenas nas tarefas imediatas (ex: o vendedor não vê Finanças/Fluxo de Caixa; o atendente não vê Pipeline).
- [x] [RF-T114] O sistema deve gerar automaticamente uma "Tarefa de Boas-vindas" atribuída ao novo membro e uma tarefa de "Mentoria" atribuída ao gestor, para garantir o primeiro contacto humano na plataforma.
- [x] [RF-T115] O sistema deve suportar "Modo Sombra" (Shadow Mode) para o dono/admin, permitindo que ele veja exactamente o que o novo membro vê, para ajudar no suporte em tempo real. *(implementado: `GET /equipa/membros/:id/modo-sombra` devolve módulos, widgets filtrados por papel e checklist do membro alvo; página Equipa abre painel de simulação auditado)*

#### 5.3.8 Dinâmicas de Turno e Passagem de Bastão

- [x] [RF-T116] O sistema deve gerar automaticamente um "Relatório de Passagem de Turno" no final do horário de um membro, resumindo conversas abertas, tarefas pendentes e clientes quentes, enviando-o para o membro do turno seguinte ou para a fila geral.
- [x] [RF-T117] O sistema deve permitir "Check-in de Turno" via WhatsApp (o membro envia "Iniciar" no bot do BIZY e o sistema activa o seu turno no painel web). *(implementado: webhook Evolution interpreta comandos de turno e regista `RegistoPresenca` com método `WHATSAPP`)*

#### 5.3.9 Workflow Lock-in para a Equipa (Empoderamento do Funcionário)

> **Filosofia:** Para que a equipa não sinta que o sistema é um "chicote" ou burocracia imposta pelo dono, o BIZY Team tem de ser a ferramenta que facilita a vida deles. O sistema torna-se o "advogado" do funcionário.

- [x] [RF-T118] O painel do vendedor deve apresentar widget de "Comissão Estimada Hoje/Mês" em tempo real, calculado com base nas vendas atribuídas e metas atingidas, para que o vendedor veja quanto vai ganhar e abra o sistema todos os dias.
- [x] [RF-T119] O sistema deve registar toda a actividade do membro (mensagens enviadas, follow-ups, tarefas concluídas) no Feed de Actividade pessoal, servindo como prova auditável do trabalho realizado em caso de disputa.
- [x] [RF-T120] O sistema deve suportar "Modo Competição" opcional (gamificação saudável), activável pelo dono, com ranking semanal da equipa por KPI seleccionado (vendas, conversões, tempo de resposta) e configuração de prémio/recompensa descritiva.
- [x] [RF-T121] O sistema deve apresentar ao vendedor/atendente apenas as informações necessárias para a sua função, removendo ruído visual e complexidade desnecessária (progressive disclosure por papel). *(implementado: widgets contextuais são filtrados por papel antes da resposta da API, incluindo ocultação financeira para vendedor/atendente/entregador)*
- [x] [RF-T122] O sistema deve permitir que o membro personalize as suas notificações (quais alertas quer receber, por que canal, em que horário) para evitar fadiga de notificações.

---

### Pilar 4 — Interface de Workflow Integrada

#### 5.4.1 Notificações Proactivas via WhatsApp

- [x] [RF-T069] O sistema deve enviar resumo diário matinal via WhatsApp ao dono/gestor com: vendas do dia anterior, pagamentos pendentes, tarefas atrasadas, alertas de stock e saldo de caixa. *(implementado: `POST /workflow/notificacoes/proactivas/resumo-diario`, respeitando consentimento e limite diário)*
- [x] [RF-T070] O sistema deve enviar alertas financeiros críticos via WhatsApp: pagamento recebido acima de X, défice de caixa previsto, despesa acima do orçamento. *(implementado: threshold configurável em `/workflow/notificacoes/proactivas/configuracoes`, alerta de pagamento alto, défice previsto e orçamento excedido)*
- [x] [RF-T071] O sistema deve enviar alertas comerciais via WhatsApp: novo lead qualificado, cliente VIP em risco, meta prestes a ser atingida. *(implementado em `POST /workflow/notificacoes/proactivas/alertas`)*
- [x] [RF-T072] O sistema deve enviar alertas de projecto via WhatsApp: tarefa atrasada, prazo iminente, conclusão de etapa crítica. *(implementado: tarefas/projectos fora do prazo e detecção de entregas concluídas com marcador crítico/marco/go-live/homologação/aprovação)*
- [x] [RF-T073] O sistema deve permitir configuração individual de quais alertas cada membro recebe via WhatsApp.

#### 5.4.2 Automação de Fluxos Cross-Funcionais

- [x] [RF-T074] O sistema deve permitir criação de fluxos automáticos que conectem módulos: novo cliente → tarefa de onboarding → alerta WhatsApp → actualização de dashboard.
- [x] [RF-T075] O sistema deve suportar fluxos condicionais: se valor do pedido > X → notificar gestor financeiro; se cliente novo → criar tarefa de boas-vindas.
- [x] [RF-T076] O sistema deve registar execução de cada fluxo automático com resultado, timestamp e eventuais falhas para auditoria.
- [x] [RF-T077] O sistema deve permitir pausa/retoma de fluxos automáticos sem perder estado.

#### 5.4.3 Widgets Contextuais

- [x] [RF-T078] O painel principal deve mostrar widgets dinâmicos adaptados ao papel do utilizador: vendedor vê pipeline e metas; financeiro vê fluxo de caixa e cobranças; gestor vê visão geral.
- [x] [RF-T079] O sistema deve apresentar sugestões de próxima acção com base no contexto actual do utilizador (tarefa mais urgente, lead mais quente, pagamento mais atrasado).
- [x] [RF-T080] O sistema deve permitir personalização da disposição de widgets no painel por utilizador. *(implementado: `PUT /workflow/widgets/:contexto/layout` persiste ordem/ocultação por membro em `PreferenciaWidgetPainel`)*

---

### Pilar 5 — Adaptabilidade Estrutural

#### 5.5.1 Multi-Hierarquia

- [x] [RF-T081] O sistema deve permitir que um membro pertença simultaneamente a um departamento (estrutura hierárquica) e a um ou mais projectos (estrutura projetual).
- [x] [RF-T082] O sistema deve suportar criação de departamentos com líder, membros e KPIs próprios.
- [x] [RF-T083] O sistema deve suportar criação de projectos com membros de diferentes departamentos, prazo, orçamento e entregas.
- [x] [RF-T084] O sistema deve aplicar permissões contextuais: um membro pode ter permissões diferentes no seu departamento e num projecto.

#### 5.5.2 Projectos e Entregas

- [x] [RF-T085] O sistema deve permitir criação de projectos com nome, descrição, prazo, orçamento estimado, membros e entregas.
- [x] [RF-T086] O sistema deve suportar entregas (milestones) dentro de um projecto com dependências, responsável e estado.
- [x] [RF-T087] O sistema deve calcular progresso do projecto com base nas entregas concluídas vs totais.
- [x] [RF-T088] O sistema deve alertar sobre projectos em risco (atrasados, acima do orçamento, com gargalos).

#### 5.5.3 Visibilidade Contextual

- [x] [RF-T089] O sistema deve filtrar dados e visualizações com base no contexto actual do utilizador (departamento vs projecto).
- [x] [RF-T090] O sistema deve permitir navegação rápida entre contextos sem perda de estado.
- [x] [RF-T091] O sistema deve agregar dados de múltiplos contextos para visões consolidadas de gestão.

---

### Pilar 6 — Conformidade Regulatória

(Coberto pelos RF-T046 a RF-T050 no Pilar 2)

#### 5.6.1 Preparação Multi-Jurisdição

- [x] [RF-T092] O sistema deve manter catálogo de regras fiscais por jurisdição com taxas de IVA/imposto, formatos de factura e requisitos de reporte.
- [x] [RF-T093] O sistema deve permitir configuração da jurisdição fiscal do negócio e aplicar automaticamente as regras correspondentes.
- [x] [RF-T094] O sistema deve gerar relatórios fiscais periódicos (mensal/trimestral) com totais de IVA cobrado, IVA dedutível e IVA a entregar.
- [x] [RF-T095] O sistema deve manter arquivo digital de facturas por período fiscal mínimo exigido pela jurisdição.

---

### Pilar 7 — Métricas de ROI e Adopção

#### 5.7.1 Dashboard de ROI

- [x] [RF-T096] O sistema deve calcular e apresentar economia de tempo estimada por automação (tarefas automáticas, fluxos, cobranças).
- [x] [RF-T097] O sistema deve calcular receita atribuída a funcionalidades do sistema (leads convertidos via pipeline, vendas via loja pública, comissões geradas por afiliados).
- [x] [RF-T098] O sistema deve apresentar comparação antes/depois de indicadores-chave com data de baseline configurável.
- [x] [RF-T099] O sistema deve calcular custo evitado (multas, erros, inadimplência prevenida) quando aplicável.

#### 5.7.2 Métricas de Adopção da IA

- [x] [RF-T100] O sistema deve medir taxa de conclusão de tarefas assistidas por IA vs manuais.
- [x] [RF-T101] O sistema deve medir taxa de erro quando a IA está activa vs inactiva.
- [x] [RF-T102] O sistema deve medir tempo médio por utilizador a interagir com funcionalidades de IA.
- [x] [RF-T103] O sistema deve medir utilidade percebida das sugestões de IA (aceite vs rejeitado vs ignorado).

#### 5.7.3 Métricas de Adopção da Plataforma

- [x] [RF-T104] O sistema deve medir DAU/MAU (utilizadores activos diários/mensais) por módulo.
- [x] [RF-T105] O sistema deve medir profundidade de uso (número de módulos usados por utilizador por sessão).
- [x] [RF-T106] O sistema deve identificar módulos subutilizados e sugerir activação ou formação.
- [x] [RF-T107] O sistema deve medir NPS (Net Promoter Score) por recolha periódica in-app.

---

### Pilar 8 — Integração Operacional (Projectos Comerciais, Lives e Campanhas)

> **Contexto:** O maior problema do social commerce em Angola é o caos operacional. O dono usa WhatsApp pessoal para falar com o afiliado, uma planilha para controlar stock da live, e o cérebro para não vender o que já acabou. Este pilar transforma o BIZY Team no centro de comando de qualquer operação comercial temporária — lives, campanhas, lançamentos — com pool de stock protegido, equipa dedicada, sala de guerra e fecho automático com comissões.

#### 5.8.1 Gestão Matricial de Projectos Comerciais

- [x] [RF-T123] O sistema deve permitir que um Projecto Comercial (ex: Live TikTok, Campanha Black Friday) tenha um Pool de Stock vinculado a produtos do catálogo, reservando quantidades específicas para aquela operação sem alterar o stock global disponível para venda corrente.
- [x] [RF-T124] O sistema deve permitir a criação de "Equipas de Projecto" temporárias, onde membros de diferentes departamentos recebem papéis específicos de projecto (ex: REVISOR_PARSER, SUPORTE_VENDAS, LOGISTICA) válidos apenas durante a vigência do Projecto Comercial.
- [x] [RF-T125] O sistema deve suportar "Salas de Guerra" (War Rooms): dashboards temporários que só ficam visíveis e activos para a equipa alocada durante o intervalo de tempo do Projecto/Live, com métricas em tempo real da operação. *(implementado: backend `/projectos/comerciais/:id/war-room` com acesso restrito e UI dedicada em `/app/projectos`)*

#### 5.8.2 Orquestração de Filas e Automações por Projecto

- [x] [RF-T126] As tarefas operacionais e itens da Social Inbox gerados por uma Live ou Campanha devem ser roteados automaticamente para a "Fila do Projecto", priorizando a equipa alocada àquela operação sobre a fila geral.
- [x] [RF-T127] O sistema deve etiquetar automaticamente todas as vendas, leads, reservas e atendimentos realizados durante o intervalo de tempo de um Projecto Comercial, permitindo calcular o ROI e a performance da equipa por transmissão/campanha.
- [x] [RF-T128] O "Fecho de Projecto" deve gerar automaticamente o lote financeiro de comissões para afiliados e membros da equipa envolvidos, baseado nas regras de atribuição e metas do período do projecto.

#### 5.8.3 Gamificação e Métricas de Live/Projecto

- [x] [RF-T129] O sistema deve apresentar um "Placar ao Vivo" no War Room, mostrando vendas fechadas, reservas confirmadas e stock do Pool consumido em tempo real pela equipa de suporte. *(implementado: placar backend expõe vendas fechadas, receita, reservas e stock consumido; UI mostra placar e actualização manual em `/app/projectos`)*
- [x] [RF-T130] O sistema deve gerar um "Relatório de Debriefing" automático após o fecho do Projecto, consolidando dados do Studio (audiência) com dados do BIZY Team (vendas da equipa, tempo médio de resposta, tickets de suporte, stock liquidado) e enviá-lo via WhatsApp ao gestor.

---

### Pilar 9 — Gestão de Pessoas, Capacidade e Portfólio M5

> **Contexto:** A auditoria V2 posiciona Team como domínio completo de pessoas, estrutura, disponibilidade, projectos, capacidade, desenvolvimento e governança operacional. O objetivo nao e transformar o Bizy em RH pesado; e dar controlo simples sobre quem trabalha, quando trabalha, em que projecto, com que carga, que acesso possui e que risco operacional existe.

#### 5.9.1 Pessoas, Skills e Disponibilidade

- [x] [RF-T131] O Team deve manter perfil operacional 360 de membro com papel, departamento, cargo, skills, disponibilidade, turno, metas, tarefas, projectos, desempenho, acessos e historico. *(implementado: `MembroNegocio` guarda departamento, cargo, skills e desenvolvimento; `GET /equipa/membros/:id/360` consolida esses dados com disponibilidade, presença, ausência, turnos, metas, carga, projectos, desempenho, acessos, onboarding e histórico; `PATCH /equipa/membros/:id/perfil-operacional` mantém departamento/cargo com auditoria)*
- [x] [RF-T132] O sistema deve permitir matriz de skills por membro, incluindo atendimento, vendas, logistica, finanças, live, moderação, Learning, Market e suporte. *(implementado: `PUT /equipa/membros/:id/skills` mantém categoria, nível, estado, evidências e validação; a UI do Perfil 360 permite editar a matriz e o feed audita `SKILLS_ATUALIZADAS`)*
- [x] [RF-T133] O sistema deve calcular capacidade disponivel por membro/equipa considerando turno, presença, tarefas abertas, SLA, projectos activos, ausencias e carga ponderada. *(implementado: `GET /equipa/capacidade` calcula carga ponderada por turno, presença/check-in recente, tarefas, conversas, pedidos, projectos, tarefas atrasadas, conversas fora de SLA e ausência operacional via `POST /equipa/ausencias`)*
- [x] [RF-T134] O sistema deve gerir ausencias, folgas, indisponibilidade e substituicao temporaria com impacto automatico em filas e projectos.
- [x] [RF-T135] O Team deve suportar offboarding seguro com checklist, redistribuicao de tarefas/conversas, revogacao de acessos, preservacao de auditoria e handover. *(implementado: `POST /equipa/membros/:id/offboarding` suspende membro, redistribui tarefas/conversas abertas, gera checklist e audita no feed)*

#### 5.9.2 Desenvolvimento, Desempenho e Capital Humano

- [x] [RF-T136] O Team deve medir indicadores de pessoas inspirados em ISO 30414: composicao, rotatividade, produtividade, bem-estar operacional, competencias, recrutamento, mobilidade e desenvolvimento.
- [x] [RF-T137] O sistema deve ligar Learning a lacunas de skill, onboarding, formacao obrigatoria, coaching e recertificacao por perfil operacional.
- [x] [RF-T138] O sistema deve permitir plano simples de desenvolvimento por membro com objetivo, acao, prazo, evidencias e acompanhamento do gestor. *(implementado: `POST /equipa/membros/:id/desenvolvimento` cria o plano e `PATCH /equipa/membros/:id/desenvolvimento/:itemId` regista estado, evidências, observação, gestor e acompanhamento; o Perfil 360 expõe o fluxo)*
- [x] [RF-T139] Indicadores individuais sensiveis devem ter visibilidade por permissao e resumo adequado para o proprio membro.

#### 5.9.3 Project Portfolio e Controlo de Mudancas

- [x] [RF-T140] Projectos devem ter charter minimo com objetivo, owner, stakeholders, prazo, orçamento, risco, dependencias, criterios de sucesso e estado.
- [x] [RF-T141] O Team deve manter portfólio de projectos com prioridade, capacidade consumida, risco, progresso, bloqueios, ROI esperado e relatorio de encerramento.
- [x] [RF-T142] Mudancas relevantes em escopo, prazo, orçamento, owner, estado ou risco de projecto devem passar por controlo de mudança com motivo, aprovador e auditoria.
- [x] [RF-T143] Riscos e issues de projecto devem ter severidade, owner, plano de mitigacao, data alvo, estado e escalonamento.
- [x] [RF-T144] O sistema deve suportar licoes aprendidas, postmortem operacional e melhoria continua por projecto, campanha, live e incidente interno.
- [x] [RF-T145] O Team deve emitir eventos versionados para membro criado/alterado/desactivado, presença, turno, skill, projecto, mudança, risco, handover e offboarding.

---

## 6. Requisitos Não Funcionais (RNF)

### 6.1 Desempenho

- [~] [RNF-T001] Os dashboards financeiros e preditivos devem carregar em menos de 2 segundos para períodos até 90 dias. *(parcial: fluxo de caixa/DRE usam agregações (`groupBy` e série diária agregada) em vez de carregar movimentos completos; teste local mede guarda <2s e verifica que não há `findMany` de movimentos no dashboard; índices de período já existem para ledger/previsões; `npm run benchmark:team-rnfs` mede `/financas/fluxo-caixa` e `/financas/dre` contra o SLO em staging/produção; falta executar benchmark em base real/staging com 90 dias de dados para provar o SLA de 2s)*
- [x] [RNF-T002] Os cálculos preditivos (demanda, churn, fluxo de caixa) devem executar em background sem bloquear a interface do utilizador. *(implementado: `POST /inteligencia/recalcular/async` cria evento `PREDICTIVE_RECALCULO_SOLICITADO` em `OutboxEventoN8n` e devolve `202`; a execução pesada fica desacoplada para worker/n8n chamar `/inteligencia/recalcular`)*
- [~] [RNF-T003] As notificações WhatsApp proactivas devem ser entregues em menos de 60 segundos após o evento trigger. *(parcial: o trigger HTTP/cron/n8n enfileira imediatamente em `OutboxMensagemWhatsApp`; `/automacoes/whatsapp/outbox/saude` expõe `estado`, `sloEntregaMs`, pendentes acima de 60s e latência dos envios recentes; falta worker/provider em produção comprovar entrega real dentro de 60s)*
- [x] [RNF-T004] O sistema deve suportar até 500 membros por negócio sem degradação perceptível de performance. *(implementado: limite de negócio ajustado para 500 membros activos, listagens de equipa paginadas até 500, filtros por status/busca, índice `MembroNegocio(negocioId,status,criadoEm)` e KPIs agregados por responsável para evitar filtragem repetida por membro)*
- [~] [RNF-T005] A reconciliação bancária deve processar ficheiros CSV até 10.000 linhas em menos de 30 segundos. *(parcial: importação CSV usa `createMany` e sugestões em lote por chunks de 1.000 valores; teste local de 10.000 linhas mede guarda <30s e confirma 10 consultas de matching por chunks de 1.000; falta benchmark em base real/staging para confirmar o SLA de 30s)*

### 6.2 Escalabilidade

- [x] [RNF-T006] O motor preditivo deve escalar horizontalmente, permitindo processamento paralelo de múltiplos negócios. *(implementado: `enfileirarRecalculoPreditivoLote` cria um evento `PREDICTIVE_RECALCULO_SOLICITADO` independente por negócio, com `loteId`, `chaveParticao` e `concorrenciaSugerida`, e rota `POST /inteligencia/recalcular/lote/async` valida acesso aos workspaces antes de enfileirar)*
- [~] [RNF-T007] O ledger financeiro deve suportar até 100.000 movimentos por negócio por ano sem degradação de consulta. *(parcial: migration `20260701143000_indices_performance_financas_projectos` adiciona índices por negócio/período, reconciliação e origem; teste estático garante presença dos índices críticos; `npm run benchmark:team-rnfs` mede as consultas financeiras autenticadas contra SLO configurável; falta teste de carga real com 100k movimentos/ano)*
- [~] [RNF-T008] O sistema de projectos deve suportar até 200 projectos activos por negócio. *(parcial: migration `20260701143000_indices_performance_financas_projectos` adiciona índices por negócio/estado/criação para `Projecto` e `ProjetoComercial`; teste local lista 200 projectos activos com `take: 200` e filtro indexável; `npm run benchmark:team-rnfs` mede `/projectos?estado=ATIVO&limite=200`; falta benchmark com 200 projectos activos em base real/staging)*

### 6.3 Segurança

- [~] [RNF-T009] Os dados financeiros devem ser cifrados em repouso e em trânsito (AES-256 / TLS 1.3). *(parcial: TLS via reverse proxy em produção; Prisma acrescenta `sslmode=require` em produção quando a `DATABASE_URL` PostgreSQL não define SSL e aceita `DATABASE_SSL_MODE=verify-full`; credenciais usam AES-256-GCM; `npm run ops:verificar-transporte` confirma TLS 1.3 público e SSL PostgreSQL quando `psql` está disponível; ainda falta prova de cifra completa de volume/base em repouso e validação TLS 1.3 do proxy/DB em produção)*
- [x] [RNF-T010] O acesso a funcionalidades financeiras deve exigir permissão explícita (`financas:leitura`, `financas:escrita`, `financas:aprovacao`). *(permissões específicas adicionadas a DONO/ADMIN/FINANCEIRO; todos os endpoints financas.ts migrados de equipa:ler/gestao para financas:leitura/escrita/aprovacao; anulação e fecho de período exigem financas:aprovacao)*
- [x] [RNF-T011] Todas as operações financeiras (criação, edição, aprovação, cancelamento de factura/despesa/recebimento) devem ser auditadas com utilizador, timestamp e diff. *(GestaoFinancasUseCase emite eventos FINANCAS_MOVIMENTO_CRIADO, FINANCAS_FACTURA_EMITIDA/ANULADA, FINANCAS_DESPESA_CRIADA/PAGA, FINANCAS_CONTA_RECEBIDA/PAGA, FINANCAS_NOTA_CREDITO_EMITIDA, FINANCAS_REEMBOLSO_REGISTADO, FINANCAS_PERIODO_FECHADO via DespachadorEventos → AuditoriaEventosUseCase persiste com responsavelId e timestamp)*
- [x] [RNF-T012] Os modelos preditivos não devem expor dados de um negócio a outro (isolamento estrito multi-tenant). *(todas as queries filtram por negocioId)*
- [x] [RNF-T013] As credenciais de integração (WhatsApp, e-invoicing, bancário) devem ser armazenadas cifradas com referência segura, nunca em plaintext. *(cifraCredenciais.ts usa AES-256-GCM com scrypt; apiKey WhatsApp cifrada ao criar instância e decifrada ao ler em GestaoWhatsAppEvolutionUseCase; chave derivada de CREDENCIAIS_ENCRYPTION_KEY env)*

### 6.4 Usabilidade

- [x] [RNF-T014] A interface financeira deve ser compreensível por utilizadores sem formação contabilística, usando linguagem operacional em vez de técnica. *(usa "Fluxo de caixa", "Despesas", "Facturas", "Contas a receber/pagar" — sem termos técnicos)*
- [x] [RNF-T015] Os insights preditivos devem ser apresentados com linguagem natural e acções sugeridas, não apenas números. *(página Inteligencia.tsx com insights (título, descrição, acção sugerida, nível confiança), previsão fluxo caixa, anomalias detectadas, alertas churn VIP; feedback aceitar/rejeitar por insight; rota /app/inteligencia na secção Gestão)*
- [x] [RNF-T016] O sistema deve funcionar em dispositivos móveis com a mesma completude funcional dos módulos core. *(Shell mobile-first com Sheet menu, estados menuMobileAberto, layout responsivo)*
- [x] [RNF-T017] A navegação entre contextos (departamento, projecto, visão global) deve ser possível em no máximo 2 cliques. *(tabs primárias no Shell + drawer Módulos com secções agrupadas; qualquer módulo acessível em 2 cliques: Módulos → item)*
- [x] [RNF-T018] Os dashboards devem adaptar-se ao papel do utilizador sem necessidade de configuração manual inicial. *(Painel.tsx adapta KPIs e acções ao papel: DONO/ADMIN vê tudo; VENDEDOR sem receita detalhada; FINANCEIRO sem conversas/live; ATENDENTE sem stock/receita; ENTREGADOR vê apenas envios; Shell filtra rotas por modulosAtivos)*

### 6.5 Disponibilidade e Resiliência

- [~] [RNF-T019] O sistema financeiro deve ter disponibilidade mínima de 99,5% durante horário comercial. *(parcial: `GET /financas/saude` é público para probes de uptime, valida banco/ledger financeiro, latência do probe e backlog da outbox n8n com resposta 503 quando dependência crítica cai; `npm run ops:probe-financas` grava JSONL e exit codes para monitor/cron; falta monitoramento externo/staging contabilizar uptime real em horário comercial para provar 99,5%)*
- [x] [RNF-T020] As previsões preditivas devem ser recalculadas mesmo com falha parcial de dados (graceful degradation). *(implementado: `POST /inteligencia/recalcular` executa demanda, fluxo de caixa, receita e scores com `Promise.allSettled`, devolvendo estado `PARCIAL` e erros por fonte sem bloquear cálculos restantes)*
- [x] [RNF-T021] Os fluxos automáticos devem usar outbox pattern para garantir execução even-after-crash. *(implementado: `executarFluxo` cria `ExecucaoFluxo` e `OutboxEventoN8n` em transação antes dos passos; sucesso/falha actualizam o outbox com `execucaoId`, estado e erro para reprocessamento externo)*
- [~] [RNF-T022] O sistema deve manter backup incremental diário dos dados financeiros com retenção mínima de 365 dias. *(parcial: `backup-postgres.sh` gera dump PostgreSQL custom, media opcional, checksum e limpeza com `BACKUP_RETENTION_DAYS=365`; `archive-postgres-wal.sh` suporta WAL archive incremental/PITR idempotente com checksum e `WAL_ARCHIVE_RETENTION_DAYS=365`; ainda falta activar `archive_mode`/`archive_command`, backup base periódico e agendamento/monitorização geridos pela infra)*

### 6.6 Integrabilidade

- [x] [RNF-T023] A plataforma financeira deve expor API REST documentada para integração com sistemas de contabilidade externos. *(implementado: `GET /financas/openapi.json` expõe contrato OpenAPI com endpoints, permissões, parâmetros e campos de request para integrações contabilísticas)*
- [x] [RNF-T024] O motor preditivo deve aceitar dados de fontes externas (indicadores macroeconómicos, dados de mercado) via API ou importação. *(implementado: `POST /inteligencia/fontes-externas` aceita indicadores JSON ou CSV, persiste por fonte/chave/período em `fontesDadosJson` e `GET /inteligencia/fontes-externas` expõe os factores para uso nas previsões)*
- [x] [RNF-T025] O sistema de e-invoicing deve suportar múltiplos protocolos (Peppol, APIs governamentais regionais) via adaptadores plugáveis. *(implementado: adaptadores UBL, Peppol e API regional com despacho assíncrono por outbox n8n e exigência de `credencialRef` para adaptadores credenciados)*
- [x] [RNF-T026] Os fluxos automáticos devem ser compatíveis com n8n para extensões customizadas. *(implementado: outbox `OutboxEventoN8n`, rotas operacionais n8n e `POST /workflow/notificacoes/proactivas/executar` com origem `N8N`/`CRON`)*

### 6.7 Internacionalização

- [x] [RNF-T027] O sistema financeiro deve suportar múltiplas moedas com taxa de câmbio configurável. *(implementado: `/financas/movimentos/multi-moeda` aceita moeda original, valor original e taxa de câmbio, convertendo para a moeda do negócio e registando detalhe do câmbio no movimento)*
- [x] [RNF-T028] As facturas devem suportar múltiplos idiomas com template por jurisdição. *(implementado: catálogo `/conformidade/e-invoicing/templates`, geração XML com `idioma`/`jurisdicao` e nota fiscal localizada por template de Angola em pt-AO/en-US/fr-FR)*
- [x] [RNF-T029] Os formatos de data, número e moeda devem adaptar-se à locale do negócio. *(implementado: `/workspaces` expõe moeda/fuso do negócio activo, o Shell configura a locale por workspace e os helpers centrais `formatarKwanza`, `formatarDataCurta` e `formatarDataHoraCurta` usam `Intl` com locale/moeda/fuso do negócio, com fallback por moeda)*

### 6.8 Acesso e Onboarding

- [~] [RNF-T030] O tempo de autenticação via OTP (WhatsApp/SMS) não deve exceder 10 segundos, garantindo experiência de login inferior a 15 segundos no total. *(parcial: cliente Ombala tem timeout configurável com padrão 9s; `/auth/telefone/solicitar-codigo` devolve `latenciaEnvioMs`, `sloEnvioMs` e `dentroSloEnvio`, também persistidos em `providerResponseJson`; teste SLO local garante OTP <10s/login <15s em modo dev; falta métrica de entrega real por provider em produção)*
- [~] [RNF-T031] A interface web do BIZY Team deve ser totalmente responsiva e optimizada para navegadores móveis (Chrome/Safari no Android/iOS), permitindo que membros de campo ou vendedores usem o sistema 100% pelo telemóvel sem perder funcionalidades core. *(parcial: shell mobile com Sheet mantém todos os módulos, abas principais incluem Tarefas, Metas, Equipa, Projectos e Finanças, dock inferior compacta em 320px e CSS evita overflow horizontal; QA local em Chromium mobile 320x740 e 390x844 passou em `/app`, `/app/tarefas`, `/app/metas`, `/app/equipa`, `/app/projectos` e `/app/financas` sem overflow/respostas >=400; falta QA visual real em Chrome/Safari Android/iOS antes de marcar como 100%)*
- [x] [RNF-T032] O seletor de Workspaces (para utilizadores multi-negócio) deve alternar entre contextos em menos de 1 segundo sem recarregar a página (usando state management reactivo). *(implementado: Shell carrega `/workspaces`, valida `/workspaces/alternar`, actualiza `bizy_negocio_actual_id`, emite `bizy:workspace-alterado` e remonta o conteúdo por chave de workspace sem `window.location.reload`)*
- [x] [RNF-T033] Links de convite (Magic Links) devem ter validade de 72 horas e ser de uso único (invalidados após o primeiro acesso bem-sucedido) por motivos de segurança.

### 6.9 Pessoas, Portfólio e Governança M5

- [x] [RNF-T034] Dados de desempenho, presença, ausência, bem-estar, skills e desenvolvimento devem ter classificação de sensibilidade, acesso minimo necessario e auditoria.- [x] [RNF-T035] Métricas de pessoas devem separar indicador operacional de decisão laboral; decisões disciplinares, despedimento ou redução de acesso sensível exigem revisão humana.- [x] [RNF-T036] Filas por capacidade devem recalcular sem travar a interface e devem degradar para fila geral quando dados de presença/turno estiverem indisponíveis. *(implementado: capacidade usa fallback quando não há turno/presença e a página Equipa carrega o resumo em paralelo)*
- [x] [RNF-T037] Project portfolio deve suportar pelo menos 200 projectos activos por negócio com filtros por estado, owner, risco, prioridade e data.
- [x] [RNF-T038] Mudanças de projecto e offboarding devem produzir eventos, auditoria e tarefas de follow-up reprocessaveis.- [x] [RNF-T039] Relatorios de pessoas devem ser agregados quando usados para benchmark interno, evitando exposição desnecessária de dados individuais.
- [x] [RNF-T040] O Team deve preparar evidencias de governança de pessoas e projectos inspiradas em ISO 30414 e ISO 21500/21502 sem declarar certificação formal.
- [x] [RNF-T041] A UI de Team deve manter linguagem operacional simples, evitando jargão de RH/PMO quando a loja pequena precisa apenas saber disponibilidade, tarefa, meta, risco e proxima acao.

---

## 7. Regras de Negócio (RN)

### 7.1 Regras Financeiras

- [x] [RN-T001] **Princípio de partidas dobradas simplificado:** toda entrada financeira deve ter origem (pedido, recebimento manual, comissão) e toda saída deve ter destino (fornecedor, despesa, imposto, comissão paga). Movimentos sem classificação são bloqueados.
- [x] [RN-T002] **Imutabilidade de factura emitida:** uma factura emitida não pode ser alterada. Correcções devem ser feitas por nota de crédito vinculada à factura original.
- [x] [RN-T003] **Numeração fiscal contínua:** a numeração de facturas deve ser sequencial sem lacunas dentro de uma série fiscal. Cancelamentos devem anular (não eliminar) o número.
- [x] [RN-T004] **Reconciliação antes de fecho:** o fecho de período mensal só pode ser executado quando todas as entradas e saídas do período estiverem reconciliadas ou explicitamente marcadas como pendentes com justificação.
- [x] [RN-T005] **Limite de desconto sem aprovação:** descontos acima do limite configurado pelo negócio (padrão: 15%) exigem aprovação de perfil com permissão `financas:aprovacao` antes de emissão da factura.
- [x] [RN-T006] **Reembolso vinculado:** todo reembolso deve estar vinculado a um pedido, factura ou nota de crédito. Reembolsos avulsos são bloqueados.
- [x] [RN-T007] **Moeda do negócio:** todas as transacções internas são registadas na moeda base do negócio. Transacções em moeda estrangeira devem registar taxa de câmbio e valor original.
- [x] [RN-T008] **IVA configurável:** a taxa de IVA deve ser configurável por produto, categoria ou jurisdição. O sistema deve calcular IVA automaticamente na factura com base na configuração aplicável.

### 7.2 Regras de Equipa

- [x] [RN-T009] **Papel mínimo obrigatório:** todo membro deve ter pelo menos um papel atribuído. Membros sem papel não acedem ao sistema.
- [x] [RN-T010] **Dono irremovível:** o papel DONO não pode ser removido enquanto não houver outro DONO activo no negócio. Transferência de propriedade exige confirmação dupla.
- [x] [RN-T011] **Meta herdada:** quando uma meta de equipa é definida, cada membro sem meta individual herda quota proporcional (divisão igualitária por padrão, configurável).
- [x] [RN-T012] **Turno e atribuição:** conversas e tarefas só são atribuídas automaticamente a membros cujo turno actual esteja activo. Fora do turno, a atribuição vai para a fila geral.
- [x] [RN-T013] **Desactivação segura:** desactivar um membro redistribui automaticamente conversas abertas e tarefas pendentes para a fila geral, com notificação ao gestor.
- [x] [RN-T014] **Privacidade de desempenho:** o ranking individual só é visível para o próprio membro e para perfis com permissão `equipa:gestao`. Membros com papel VENDEDOR/ATENDENTE não vêem dados de desempenho de outros membros por padrão.

### 7.3 Regras de Inteligência Preditiva

- [x] [RN-T015] **Mínimo de dados para previsão:** previsões de demanda/fluxo de caixa/churn só são geradas quando o negócio tem pelo menos 90 dias de dados históricos ou 100 transacções. Antes disso, o sistema apresenta apenas médias e tendências simples.
- [x] [RN-T016] **Transparência de confiança:** todo insight preditivo deve apresentar nível de confiança (alta >80%, média 50-80%, baixa <50%) e factores que mais contribuíram para a previsão.
- [x] [RN-T017] **Não-automatização de decisões financeiras:** insights preditivos sugerem acções mas nunca executam automaticamente movimentos financeiros (pagamentos, cancelamentos, reembolsos). A acção humana é sempre obrigatória para movimentos de dinheiro.
- [x] [RN-T018] **Ciclo de feedback:** quando um utilizador aceita ou rejeita uma sugestão preditiva, o sistema deve registar o feedback para refinar modelos futuros.
- [x] [RN-T019] **Isolamento de modelos:** os modelos preditivos são treinados por negócio. Dados de um negócio nunca alimentam modelos de outro, mesmo dentro da mesma rede Bizy.

### 7.4 Regras de Projectos e Estrutura

- [x] [RN-T020] **Projecto com dono:** todo projecto deve ter pelo menos um membro com papel de gestor de projecto. Projectos sem gestor activo são sinalizados como órfãos.
- [x] [RN-T021] **Orçamento de projecto isolado:** o orçamento de um projecto é separado do orçamento departamental. Despesas atribuídas a um projecto são contabilizadas em ambos os contextos mas não duplicadas no total.
- [x] [RN-T022] **Visibilidade por contexto:** um membro só vê dados de projectos onde está alocado e do departamento onde está inserido. Dados de outros contextos exigem permissão explícita.
- [x] [RN-T023] **Fecho de projecto:** um projecto só pode ser fechado quando todas as entregas estiverem concluídas ou explicitamente canceladas com motivo. O fecho gera relatório final com KPIs, orçamento consumido e lições aprendidas.

### 7.5 Regras de Workflow e Automação

- [x] [RN-T024] **Limite de fluxos activos:** cada negócio tem limite de fluxos automáticos activos conforme plano (padrão: 20). Fluxos além do limite são bloqueados com sugestão de upgrade.
- [x] [RN-T025] **Fallback humano:** todo fluxo automático que falhe 3 vezes consecutivas é pausado automaticamente e gera tarefa humana para o gestor com contexto da falha.
- [x] [RN-T026] **Rate limit de notificações:** cada membro recebe no máximo 20 notificações WhatsApp por dia do sistema. Além do limite, notificações são consolidadas num resumo diário.
- [x] [RN-T027] **Consentimento de notificação:** o membro deve aceitar receber notificações via WhatsApp. O sistema não envia notificações operacionais sem consentimento explícito.

### 7.6 Regras de Conformidade

- [x] [RN-T028] **Arquivo fiscal mínimo:** facturas e documentos fiscais devem ser retidos pelo período mínimo exigido pela jurisdição do negócio (padrão: 10 anos quando não configurado).
- [x] [RN-T029] **Validação fiscal pré-emissão:** o sistema deve validar NIF/NUIT/TIN do cliente e dados obrigatórios da factura antes de emitir. Facturas com dados fiscais inválidos são bloqueadas.
- [x] [RN-T030] **Selo temporal:** toda factura emitida deve ter selo temporal (timestamp) inalterável para fins de auditoria fiscal.

### 7.7 Regras de ROI e Adopção

- [x] [RN-T031] **Baseline automático:** o sistema regista automaticamente valores de baseline dos KPIs no momento da activação de cada módulo para permitir comparação antes/depois.
- [x] [RN-T032] **Anonimização de métricas:** métricas de adopção agregadas podem ser usadas para benchmarking cross-negócio, mas apenas de forma anonimizada e com consentimento.

### 7.8 Regras de Governança de Equipa e Acesso

- [x] [RN-T033] **Limite de membros por plano:** o número de membros activos (com permissão de escrita) num negócio é limitado pelo plano contratado. Membros em "Modo Sombra" ou "Apenas Leitura" não contam para o limite.
- [x] [RN-T034] **Convite e consentimento de dados:** o convite só é formalizado quando o utilizador clica em "Aceitar e Concordar" com os termos de uso e política de dados no ecrã de boas-vindas. Sem aceitação, o acesso é bloqueado.
- [x] [RN-T035] **Mascaramento de dados sensíveis:** membros com papel de Vendedor ou Atendente não podem ver o número de telemóvel completo do cliente ou dados financeiros sensíveis na interface, apenas os dados necessários para a venda/atendimento (ex: `923 *** ** 12`). O mascaramento é configurável por negócio e por papel.
- [x] [RN-T036] **Expiração por inactividade:** membros que não fizerem login por 90 dias terão o seu acesso automaticamente suspenso (não eliminado), libertando a vaga do plano e exigindo reactivação pelo dono para segurança.
- [x] [RN-T037] **Hierarquia de aprovação de convites:** em negócios com mais de 10 membros, a criação de novos convites para papéis sensíveis (ex: GESTOR_FINANCEIRO, ADMIN) exige a aprovação do DONO ou ADMIN.
- [x] [RN-T038] **Magic Link de uso único:** links de convite são invalidados após o primeiro acesso bem-sucedido ou após 72 horas, o que ocorrer primeiro. Links expirados geram nova emissão automática se o dono solicitar reenvio.
- [x] [RN-T039] **Workspace isolado:** ao alternar entre Workspaces, o sistema deve limpar completamente o estado da sessão anterior (dados em memória, cache local, contexto de conversa) para impedir vazamento de dados entre negócios.
- [x] [RN-T040] **Gamificação opt-in:** o "Modo Competição" com ranking só é activado pelo dono e cada membro pode optar por não participar (opt-out individual) sem consequências no acesso ou funcionalidades.

### 7.9 Regras de Integração Operacional (Projectos Comerciais e Lives)

- [x] [RN-T041] **Prioridade de fila omnichannel:** durante um Projecto/Live activa, as regras de distribuição de conversas do Social Inbox e tarefas de revisão de Parser devem priorizar automaticamente os membros alocados à "Equipa do Projecto" em detrimento da fila geral. Membros não alocados ao projecto só recebem overflow quando a equipa alocada atingir capacidade máxima.
- [x] [RN-T042] **Rastreabilidade de receita por projecto:** toda transacção financeira, pedido ou reserva criada durante o intervalo de tempo de um Projecto Comercial (ou via link de afiliado vinculado ao projecto) deve receber uma tag de origem `PROJETO_X` imutável. Esta tag serve para o cálculo de comissões, métricas de ROI e debriefing, não podendo ser alterada ou removida após atribuição.
- [x] [RN-T043] **Protecção de contexto (War Room):** o acesso ao War Room Dashboard e às métricas em tempo real do Projecto é estritamente restrito aos membros alocados àquela operação e a perfis com permissão `equipa:gestao`. Dados financeiros globais da empresa não são expostos neste dashboard para evitar distracções e manter foco operacional.
- [x] [RN-T044] **Handoff automático pós-projecto:** se um Projecto/Live terminar e houver conversas em aberto ou reservas pendentes vinculadas a ele, o sistema deve manter a atribuição ao membro que estava a atender, mas adicionar um timer de SLA de 15 minutos para resolução. Após o SLA, escalonamento automático para a fila geral do departamento com contexto completo da conversa.
- [x] [RN-T045] **Integridade do pool de stock:** o Pool de Stock de um Projecto é um subconjunto do stock real. Se o stock global do produto chegar a zero (por vendas fora do projecto), o sistema deve pausar automaticamente as reservas do Projecto, notificar a Sala de Guerra e bloquear novas vendas daquele produto no contexto do projecto, evitando overselling.

### 7.10 Regras de Pessoas, Capacidade e Portfólio

- [x] [RN-T046] **Dados de pessoas com necessidade de conhecimento:** desempenho, presença, ausência, skills, bem-estar e desenvolvimento só podem ser vistos por quem tem papel operacional legitimo.
- [x] [RN-T047] **Automação não decide trabalho sensível:** o sistema pode sugerir coaching, escalação, formação ou redistribuição, mas não executa decisão disciplinar, salarial ou desligamento sem revisão humana. *(implementado na nova fatia: capacidade apenas sinaliza carga e offboarding exige ação humana com permissão `equipa:gestao`)*
- [x] [RN-T048] **Capacidade antes de atribuição:** novas tarefas, conversas e projectos devem respeitar disponibilidade, turno, carga, skill e prioridade quando os dados estiverem disponíveis.- [x] [RN-T049] **Offboarding preserva histórico:** desactivar membro remove acesso e redistribui trabalho, mas não apaga auditoria, autoria de eventos, decisões ou documentos. *(implementado: suspensão preserva membro e regista `MEMBRO_DESATIVADO` + `OFFBOARDING_SEGURO` no feed)*
- [x] [RN-T050] **Projecto sem owner é risco:** projecto sem gestor activo deve ser sinalizado, não fechado automaticamente nem receber novas automações sensíveis. *(implementado: perfil 360 sinaliza `PROJECTOS_SEM_OWNER` e lista projectos sem gestor activo como risco; nao ha fecho automatico nem automacao sensivel associada)*
- [x] [RN-T051] **Mudança relevante exige motivo:** alteração de escopo, prazo, orçamento, owner, estado ou risco de projecto deve guardar motivo, actor, data e impacto.
- [x] [RN-T052] **Skills não substituem permissão:** possuir skill operacional não concede acesso a dados ou ações sem papel/permissão correspondente. *(implementado: skills são dados separados de `papel`/`permissoesJson`; leitura e gestão continuam protegidas por `equipa:ler` e `equipa:gestao`)*
- [x] [RN-T053] **Indicador de pessoas não é sentença:** métricas individuais servem para operação e desenvolvimento, não para punição automatizada.
- [x] [RN-T054] **Benchmark internacional como orientação:** ISO 30414 e ISO 21500/21502 guiam estrutura de dados, métricas e processos, mas não autorizam alegar conformidade certificada.

---

## 8. Priorização de Implementação

### Fase 0 — Renomeação, Acesso e Base (Semana 1-3)
- [x] [RF-T renomeação] Substituir referências BIZY CRM → BIZY Team no código, UI e documentação. *(rotas operacionais usam `/team/loja/*` e `/relatorios/team-pos-live`; helpers e tipos frontend usam nomes `Team`; o alias `/crm/loja/*` foi removido no cutover commerce)*
- [x] [RF-T108-T111] Convite frictionless (Magic Links, OTP, Workspaces, Personas)
- [x] [RF-T051-T054] Dashboard de desempenho por membro (extensão do existente)
- [x] [RF-T066-T068] Notas internas e feed de actividade (extensão do existente)
- [x] [RN-T033-T040] Regras de governança de equipa e acesso

### Fase 1 — Finanças Core (Semana 4-7)
- [x] [RF-T020-T023] Fluxo de caixa e DRE
- [x] [RF-T024-T027] Gestão de despesas
- [x] [RF-T028-T031] Contas a receber
- [x] [RF-T035-T039] Facturação e recibos
- [x] [RF-T040-T045] Orçamento e reconciliação bancária assistida
- [x] [RN-T001-T008] Regras financeiras

### Fase 2 — Equipa Avançada e Onboarding (Semana 8-11)
- [x] [RF-T055-T058] Metas individuais e de equipa
- [x] [RF-T059-T062] Gestão de turnos
- [x] [RF-T063-T065] Onboarding de membros existente
- [x] [RF-T112-T115] Onboarding interativo e "Aha! Moment"
- [x] [RF-T116-T117] Dinâmicas de turno e passagem de bastão
- [x] [RF-T118-T122] Workflow lock-in para a equipa (comissão visível, gamificação, progressive disclosure)
- [x] [RN-T009-T014] Regras de equipa

### Fase 3 — Inteligência Preditiva (Semana 10-14)
- [x] [RF-T005-T009] Scoring de clientes e churn (RFM, LTV)
- [x] [RF-T001-T004] Previsão de demanda
- [x] [RF-T010-T013] Previsão financeira
- [x] [RF-T017-T019] Ambient analytics
- [x] [RN-T015-T019] Regras preditivas

### Fase 4 — Workflow e Notificações (Semana 15-17)
- [x] [RF-T069-T073] Notificações proactivas via WhatsApp (resumo diário, alertas comerciais, financeiros configuráveis, insights preditivos e etapas críticas de projecto)
- [x] [RF-T074-T077] Automação cross-funcional
- [x] [RF-T078-T080] Widgets contextuais
- [x] [RN-T024-T027] Regras de workflow

### Fase 5 — Projectos, Estrutura e Integração Operacional (Semana 18-22)
- [x] [RF-T081-T084] Multi-hierarquia
- [x] [RF-T085-T088] Projectos e entregas
- [x] [RF-T089-T091] Visibilidade contextual
- [x] [RN-T020-T023] Regras de projectos
- [x] [RF-T123-T125] Gestão matricial de projectos comerciais (Pool de Stock, Equipas e War Room implementados)
- [x] [RF-T126-T128] Orquestração de filas e automações por projecto
- [x] [RF-T129-T130] Gamificação e métricas de live/projecto (Placar ao Vivo e Debriefing implementados)
- [x] [RN-T041-T045] Regras de integração operacional

### Fase 6 — Conformidade e ROI (Semana 23-26)
- [x] [RF-T046-T050] E-invoicing (XML/UBL, validação fiscal e preparação de despacho externo Peppol/API regional via outbox n8n)
- [x] [RF-T092-T095] Multi-jurisdição
- [x] [RF-T096-T107] Métricas de ROI e adopção
- [x] [RN-T028-T032] Regras de conformidade e ROI

### Fase 7 — Pessoas, Capacidade e Portfólio M5
- [x] [RF-T131-T145] Perfil 360 de membro, skills, capacidade, ausência, offboarding, desenvolvimento, portfólio, riscos, mudanças, lições aprendidas e eventos versionados.- [x] [RNF-T034-T041] Proteção de dados de pessoas, capacidade resiliente, portfolio escalável, evidências ISO-inspired e linguagem operacional simples.- [x] [RN-T046-T054] Regras de necessidade de conhecimento, revisão humana, capacidade antes de atribuição, offboarding, mudanças e limites de automação.

---

## 9. Modelo de Dados — Novos Modelos Prisma (Estimativa)

### 9.1 Finanças
- `MovimentoFinanceiro` — ledger central de entradas/saídas
- `CategoriaFinanceira` — categorias configuráveis por negócio
- `Despesa` — despesas avulsas e recorrentes
- `ContaReceber` — aging de recebíveis
- `ContaPagar` — fornecedores e vencimentos
- `Factura` — facturas fiscais com série, número e estado
- `ItemFactura` — itens de cada factura
- `NotaCredito` — notas de crédito vinculadas
- `OrcamentoPeriodo` — orçamento por categoria e período
- `ImportacaoExtratoBancario` — lote de extrato importado para reconciliação
- `MovimentoBancario` — linha bancária conciliável com movimentos financeiros
- `RegraFiscal` — regras fiscais por jurisdição

### 9.2 Equipa, Acesso e Onboarding
- `MetaVendas` — metas individuais e de equipa
- `TurnoMembro` — horários de turno por membro
- `RegistoPresenca` — check-in/check-out
- `NotaInterna` — notas internas por entidade
- `FeedActividade` — feed de actividade da equipa
- `ConviteEquipa` — token (Magic Link), papel/persona sugerido, telemóvel/email convidado, data de expiração, estado (PENDENTE, ACEITE, EXPIRADO, REENVIO)
- `WorkspaceAcesso` — associação N:N entre utilizador (pessoa física) e negócio (empresa), com papel específico naquele negócio e estado activo/suspenso
- `PersonaPapel` — templates pré-configurados de permissões (ex: "Vendedor" agrupa `crm:leitura`, `pedidos:escrita`, `financas:nulo`)
- `PassagemTurno` — resumo automático gerado no fim do turno (conversas abertas, tarefas pendentes, clientes quentes) para o membro seguinte
- `MascaramentoDados` — configuração por negócio/papel do que deve ser ofuscado (telefones, NIFs, valores financeiros)
- `ChecklistOnboarding` — itens do checklist de primeiro dia por membro, com estado concluído/pendente e data
- `ConfiguracaoGamificacao` — modo competição por negócio (activo/inactivo), KPI seleccionado, período, recompensa descritiva
- `RankingEquipa` — snapshot periódico do ranking para feed e histórico
- `SkillMembro` — matriz de skills operacionais por membro, nivel, validade e evidencias
- `AusenciaMembro` — ausencias, folgas, indisponibilidade e substituicoes temporarias
- `PlanoDesenvolvimentoMembro` — objectivos, acoes, prazos, evidencias e acompanhamento
- `OffboardingMembro` — checklist de saida, redistribuicao, revogacao e handover

### 9.3 Projectos
- `Departamento` — departamentos com líder
- `Projecto` — projectos com orçamento e prazo
- `EntregaProjecto` — milestones com dependências
- `MembroProjecto` — alocação de membros a projectos
- `PortfolioProjecto` — agrupamento de projectos por prioridade, capacidade, risco e ROI esperado
- `RiscoProjecto` — risco/issue com severidade, owner, mitigacao e escalonamento
- `MudancaProjecto` — controlo de mudancas de escopo, prazo, orçamento, owner, estado e risco
- `LicaoAprendidaProjecto` — postmortem e melhoria continua por projecto/campanha/live

### 9.4 Inteligência
- `PrevisaoDemanda` — previsões de stock por SKU
- `ScoreCliente` — scoring RFM, churn, LTV
- `PrevisaoFluxoCaixa` — previsões semanais rolling
- `InsightPreditivo` — insights gerados com confiança e acção sugerida
- `FeedbackInsight` — aceite/rejeição de sugestões

### 9.5 Métricas e ROI
- `BaselineKPI` — valores de baseline por módulo
- `MetricaAdopcao` — DAU/MAU, profundidade de uso por módulo
- `PesquisaNPS` — recolha periódica de NPS

### 9.6 Workflows
- `FluxoAutomatico` — definição de fluxos cross-funcionais
- `PassoFluxo` — passos com condições e acções
- `ExecucaoFluxo` — execuções com resultado e auditoria
- `ConfiguracaoNotificacao` — preferências de alerta por membro
- `ConfiguracaoAlertaProactivo` — thresholds e regras de alertas proactivos por negócio/canal
- `PreferenciaWidgetPainel` — ordem e ocultação de widgets por membro/contexto

### 9.7 Integração Operacional (Projectos Comerciais e Lives)
- `ProjetoComercial` — nome, descrição, data início/fim, estado (PLANEADO, EM_ANDAMENTO, FECHADO), tipo (LIVE, CAMPANHA, LANCAMENTO), vinculado a Negocio
- `PoolStockProjeto` — associação N:N entre ProjetoComercial e Peca (Produto), com quantidadeReservada, quantidadeVendida e quantidadeDisponivel calculada
- `EquipaProjeto` — associação N:N entre MembroNegocio e ProjetoComercial, com papelProjeto (REVISOR_PARSER, SUPORTE_VENDAS, LOGISTICA, GESTOR_LIVE), datas de alocação e estado activo/inactivo
- `FilaProjeto` — agrupador que vincula TarefaOperacional, Reserva e SocialInboxItem a um ProjetoComercial, com prioridade e estado de atribuição
- `DebriefingProjeto` — relatório consolidado gerado no fecho (ROI, vendas, tempo médio de resposta, stock liquidado, comissões geradas, audiência quando disponível)

---

## 10. Impacto na Navegação Frontend

### 10.1 Nova Estrutura de Navegação

| Secção | Páginas | Módulo |
|---|---|---|
| **Hoje** | Painel (widgets contextuais), Live | team-core |
| **Vendas** | Reservas, Conversas, Clientes, Pipeline, Social Inbox, Campanhas, Recuperação | team-core |
| **Equipa** | Membros, Desempenho, Metas, Turnos, Actividade | equipa |
| **Finanças** | Fluxo de Caixa, Despesas, Facturação, Cobranças, Orçamento, Reconciliação | financas |
| **Vitrine** | Catálogo, Loja Pública, Afiliados, Market | catalogo |
| **Projectos** | Lista, Kanban, Entregas, Relatório | projectos |
| **Relatórios** | Comercial, Financeiro, Equipa, ROI, Adopção | relatorios |
| **Configurações** | Administração, Pagamentos, Integrações, Regras Fiscais, Módulos | team-core |

### 10.2 Novos Papéis

| Papel | Descrição | Permissões-chave adicionadas |
|---|---|---|
| `GESTOR_FINANCEIRO` | Gestão financeira completa | financas:*, facturas:*, reconciliacao:* |
| `GESTOR_PROJECTO` | Gestão de projectos | projectos:*, entregas:* |
| `ANALISTA` | Acesso a relatórios e métricas | relatorios:*, metricas:*, insights:leitura |

---

## 11. Compatibilidade e Migração de Dados

### Evidencia de conclusao RF-T131 a RF-T145 em 2026-07-11

- Perfil 360 inclui departamento, cargo, skills e plano de desenvolvimento auditado.
- Capacidade considera turno, presenca, ausencia, carga e projectos; atribuicao de projecto valida capacidade e skill.
- Ausencia aceita substituto temporario e redistribui tarefas, conversas, pedidos, filas e alocacoes de projecto.
- Governanca de pessoas agrega indicadores ISO 30414-inspired, classifica sensibilidade e proibe decisao laboral automatica.
- Portfolio suporta charter, prioridade, capacidade, ROI, risco, filtros ate 200 itens, mudanca aprovada, issues, licoes e eventos `bizy.team.events.v1`.
- `/app/projectos` unifica portfolio operacional e War Room; `gestao-projectos-usecase.test.ts`, typecheck e build passam.

- [x] [MIG-001] Os 55 modelos Prisma existentes são mantidos sem alterações destrutivas.
- [x] [MIG-002] Novos modelos são adicionados com migrations incrementais.
- [x] [MIG-003] O módulo `crm` é renomeado para `team-core` com migration de dados em `ModuloNegocio`.
- [x] [MIG-004] Os dados financeiros existentes (pedidos, comissões, repasses) alimentam automaticamente o ledger financeiro via migration de bootstrap.
- [x] [MIG-005] Os KPIs existentes no Painel servem de baseline para métricas de ROI.
- [x] [MIG-006] Os papéis existentes são mantidos; novos papéis são adicionados sem afectar os anteriores.
- [x] [MIG-007] A API existente mantém compatibilidade; novos endpoints são adicionados sob prefixos dedicados (`/financas/*`, `/equipa/*`, `/projectos/*`, `/insights/*`).

---

## 12. Referência Cruzada com Documento Estratégico

| Componente Estratégico | RF/RNF/RN Correspondentes |
|---|---|
| Motor de Inteligência Preditiva | RF-T001 a RF-T019, RN-T015 a RN-T019 |
| Plataforma de Gestão Financeira Integrada | RF-T020 a RF-T050, RN-T001 a RN-T008 |
| Interface de Workflow Integrada | RF-T069 a RF-T080, RN-T024 a RN-T027 |
| Ciclo de Feedback e Aprendizagem | RF-T100 a RF-T103, RN-T018 |
| Adaptabilidade Estrutural (Híbrido) | RF-T081 a RF-T091, RN-T020 a RN-T023 |
| Workflow Lock-in (WhatsApp) | RF-T069 a RF-T073, RN-T026 a RN-T027 |
| Workflow Lock-in (Equipa/Empoderamento) | RF-T118 a RF-T122, RN-T040 |
| Convite e Acesso Frictionless | RF-T108 a RF-T111, RN-T033 a RN-T039, RNF-T030 a RNF-T033 |
| Onboarding e "Aha! Moment" | RF-T112 a RF-T115 |
| Passagem de Turno e Dinâmicas de Equipa | RF-T116 a RF-T117 |
| Métricas de ROI Tangível | RF-T096 a RF-T107, RN-T031 a RN-T032 |
| E-Invoicing e Conformidade | RF-T046 a RF-T050, RF-T092 a RF-T095, RN-T028 a RN-T030 |
| Ambient Analytics | RF-T017 a RF-T019 |
| Scoring de Clientes | RF-T005 a RF-T009 |
| Dashboard de Fluxo de Caixa Dinâmico | RF-T021, RF-T010 |
| Previsão Rolling 13 Semanas | RF-T010 |
| Automação AP/AR | RF-T028 a RF-T034 |
| Mascaramento e Protecção de Dados | RN-T035, RN-T039 |
| Gamificação e Competição Saudável | RF-T120, RN-T040 |
| Projectos Comerciais e Lives (War Room) | RF-T123 a RF-T130, RN-T041 a RN-T045 |
| Pool de Stock por Operação | RF-T123, RN-T045 |
| Fila e Roteamento por Projecto | RF-T126, RN-T041 |
| Rastreabilidade de Receita por Projecto | RF-T127, RN-T042 |
| Debriefing e Fecho Automático | RF-T128, RF-T130 |
| Handoff Pós-Projecto | RN-T044 |
| Pessoas, Skills e Capacidade | RF-T131 a RF-T139, RNF-T034 a RNF-T036, RN-T046 a RN-T049 |
| Project Portfolio e Controlo de Mudanças | RF-T140 a RF-T145, RNF-T037 a RNF-T041, RN-T050 a RN-T054 |
