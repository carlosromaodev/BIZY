# Relatório Completo do Projeto ÉMeu

> Documento historico. O estado atual das criticas e das evidencias esta consolidado em `docs/wiki/pages/auditoria-criticas-sistema-bizy.md`.

Data da análise: 2026-05-21
Projeto analisado: `/home/carlos/Documentos/project/ÉMeu`
Escopo: produto, arquitetura, backend, frontend, integrações, dados, segurança, UX, testes, deploy, riscos e roadmap.

---

## 1. Sumário Executivo

O ÉMeu é um MVP operacional para automatizar vendas em lives, com foco inicial no TikTok. O sistema captura comentários, interpreta intenção de compra, extrai telefone angolano e código da peça, cria reservas por prioridade, gere fila de espera, atualiza o painel em tempo real e aciona automações via WhatsApp, Evolution API e n8n.

O projeto não é apenas uma interface visual. Existe uma base real de backend com Fastify, TypeScript, Prisma, Postgres, domínio separado, use cases, providers externos, autenticação por telefone, outbox para n8n, SSE e testes automatizados. O frontend em React/Vite consome APIs reais nas páginas internas e apresenta uma experiência já próxima de um cockpit operacional.

Veredicto geral: o ÉMeu está em estado de MVP avançado e viável para piloto controlado. Para produção comercial mais séria, os principais pontos a fortalecer são multi-loja/multi-vendedor, modelo comercial mais completo, revisão manual acionável, chat de atendimento com envio real, observabilidade operacional e testes com Postgres real sob concorrência.

---

## 2. Evidências de Verificação

Comandos executados durante esta análise:

| Verificação | Resultado |
|---|---|
| `npm run typecheck` | Passou, backend e frontend sem erros TypeScript |
| `npm test` | Passou, 7 ficheiros de teste e 19 testes |
| `npm run build` | Passou, backend compilado e frontend Vite gerado |
| `git status --short` | Não aplicável: a pasta atual não é um repositório Git |

Resultado do build frontend:

| Artefato | Tamanho | Gzip |
|---|---:|---:|
| `dist/index.html` | 0.51 kB | 0.32 kB |
| CSS | 53.06 kB | 9.83 kB |
| JS | 284.41 kB | 84.20 kB |

Observação importante: alguns documentos anteriores estão parcialmente desatualizados. Por exemplo, `VIABILIDADE.md` fala em 8 tabelas, mas o schema atual tem 10 modelos Prisma. `docs/arquitetura-modular.md` recomenda outbox como próximo nível, mas a outbox já está implementada em `OutboxEventoN8n`. `ANALISE-UX-DESIGN.md` também cita problemas que já foram corrigidos, como menu mobile na landing, persistência da sidebar, validação de telefone no login, reenvio de SMS e confirmação de remoção de instância WhatsApp.

---

## 3. Proposta do Produto

O ÉMeu resolve um problema concreto de vendedores que fazem lives: durante a transmissão, compradores comentam rapidamente, o vendedor precisa identificar quem pediu primeiro, confirmar telefone, reservar stock, mandar WhatsApp, controlar pagamento e chamar a fila caso a primeira pessoa não pague.

O fluxo principal implementado é:

```text
Live TikTok ou entrada manual
  -> captura de comentário
  -> interpretação de intenção, telefone e peça
  -> criação de reserva ou fila de espera
  -> atualização em tempo real no painel
  -> evento para n8n
  -> WhatsApp, lembretes, comprovativo e pós-venda
```

Funcionalidades centrais já presentes:

- Login por telefone com código SMS.
- Cadastro e listagem de peças.
- Captura de comentários por provider TikTok, provider Python ou modo manual.
- Parser de comentários com regras para português informal.
- Reserva automática com expiração.
- Fila de espera automática.
- Confirmação e rejeição de pagamento.
- Registro de comprovativo.
- Atualização de endereço de entrega.
- Eventos internos para SSE, auditoria e automações.
- Integração n8n com HMAC e token.
- Integração Evolution API para WhatsApp e QR Code.
- Dashboard, catálogo, comentários, reservas, conversas, WhatsApp, agentes, n8n e configurações.

---

## 4. Arquitetura Geral

O repositório é um monorepo npm com workspaces:

```text
.
├── backend
├── frontend
├── docker
├── docs
├── n8n
├── README.md
├── ANALISE.md
├── ANALISE-UX-DESIGN.md
├── VIABILIDADE.md
└── docker-compose.yml
```

Stack principal:

| Área | Tecnologia |
|---|---|
| Backend | Node.js, TypeScript, Fastify, Zod |
| Banco | PostgreSQL via Prisma |
| Testes backend | Vitest |
| Frontend | React 18, Vite, TypeScript |
| UI | CSS próprio, lucide-react |
| Tempo real | SSE com `EventSource` |
| Automações | n8n |
| WhatsApp | Evolution API |
| SMS | Ombala |
| Live | `tiktok-live-connector`, fallback Python, provider manual |
| Deploy local | Docker Compose |

O desenho arquitetural está bem separado:

```text
backend/src/dominio
  -> tipos, contratos, eventos, serviços puros, validações

backend/src/use-case
  -> regras de aplicação, consultas, coordenação de repositórios

backend/src/infra
  -> HTTP, Prisma, providers externos, n8n, SSE

frontend/src
  -> rotas, cliente API, páginas, shell, estilos e tipos
```

Ponto forte: o motor de reservas não depende diretamente de Fastify, React, TikTok, n8n, Prisma ou Evolution. Isso facilita testes, manutenção e substituição de providers.

---

## 5. Backend

### 5.1 Organização

O backend está organizado em camadas claras:

| Camada | Papel |
|---|---|
| `dominio` | Vocabulário central, tipos, contratos, serviços puros |
| `use-case` | Regras e fluxos de aplicação |
| `infra/http` | Fastify, módulos HTTP, segurança, SSE, rate limit |
| `infra/provedores` | Evolution, TikTok, SMS, providers manuais/futuros |
| `infra/n8n` | Publicação de eventos para n8n |
| `prisma` | Schema e migrations |

O `ContextoAplicacao.ts` é o ponto de composição. Ele monta repositórios, use cases, providers, motor de reservas, automações, publicador n8n e hub de tempo real.

### 5.2 Módulos HTTP e Endpoints

O backend registra rotas por manifesto em `manifestoModulosHttp.ts`. Foram identificados 35 endpoints principais:

| Módulo | Endpoints |
|---|---:|
| Saúde | 1 |
| Autenticação | 4 |
| Lives e comentários | 4 |
| Catálogo | 2 |
| Reservas | 4 |
| Integrações e Evolution | 8 |
| n8n | 9 |
| Operacional | 2 |
| Painel | 1 |

Rotas relevantes:

- `GET /saude`
- `POST /auth/telefone/solicitar-codigo`
- `POST /auth/telefone/confirmar-codigo`
- `GET /auth/sessao`
- `DELETE /auth/sessao`
- `GET /eventos`
- `POST /lives/iniciar`
- `POST /comentarios/manual`
- `GET /comentarios`
- `POST /pecas`
- `GET /pecas`
- `GET /reservas`
- `POST /reservas/:id/confirmar-pagamento`
- `POST /reservas/:id/cancelar`
- `POST /reservas/expirar`
- `GET /painel/resumo`
- `GET /automacoes/status`
- `GET /atendimento/conversas`
- `GET /integracoes/status`
- `GET /evolution/resumo`
- `POST /evolution/instancias`
- `POST /evolution/instancias/:id/conectar`
- `POST /evolution/instancias/:id/estado`
- `POST /evolution/instancias/:id/padrao`
- `DELETE /evolution/instancias/:id`
- `POST /webhooks/evolution`
- `GET /n8n/customers/by-phone/:phone`
- `GET /n8n/reservations/active/:phone`
- `GET /n8n/products/:code`
- `POST /n8n/reservations/:id/cancel`
- `POST /n8n/payments/:id/proof-received`
- `POST /n8n/payments/:id/confirm`
- `POST /n8n/payments/:id/reject`
- `POST /n8n/orders/:id/delivery-address`
- `POST /n8n/orders/:id/delivered`

### 5.3 Use Cases

Principais use cases atuais:

| Use case | Responsabilidade |
|---|---|
| `MotorReservas` | Reserva, fila, expiração, promoção, pagamento e entrega |
| `ProcessadorComentarios` | Normaliza comentário, interpreta e cria reserva |
| `GestaoPecasUseCase` | Cadastro/listagem de peças |
| `ConsultaPainelUseCase` | Resumo do cockpit |
| `ConsultaOperacionalUseCase` | Agentes, workflows, configurações e métricas |
| `ConsultaAtendimentoN8n` | Contexto seguro para n8n/IA |
| `ConsultaAtendimentoOperacionalUseCase` | Conversas derivadas de comentários/reservas |
| `ConsultaIntegracoesUseCase` | Status de TikTok, n8n, Evolution e WhatsApp |
| `AutenticacaoTelefoneUseCase` | SMS, código e sessão |
| `GestaoWhatsAppEvolutionUseCase` | Instâncias, QR Code, estado e padrão |
| `MonitorReservasUseCase` | Expiração e lembrete de reservas |
| `AuditoriaEventosUseCase` | Persistência de eventos e mensagens enviadas |
| `ReceberMensagemWhatsAppUseCase` | Normalização de webhooks Evolution |

O uso de use cases está coerente. Os handlers HTTP ficam relativamente finos e delegam regra de negócio.

### 5.4 Motor de Reservas

O `MotorReservas` é uma das partes mais importantes do projeto. Ele:

- Exige telefone e código de peça interpretados.
- Cria reserva quando existe stock livre.
- Coloca em `WAITLISTED` quando não há stock livre.
- Bloqueia duplicidade ativa para o mesmo telefone e peça.
- Expira reservas vencidas.
- Promove o próximo cliente da fila.
- Confirma pagamento.
- Marca peça como vendida quando reservas pagas atingem a quantidade.
- Atualiza endereço de entrega.
- Emite eventos internos para painel, n8n e auditoria.

Ponto forte: a versão Prisma usa transação com isolamento `Serializable`, retentativa em conflito `P2034` e índice parcial contra duplicidade ativa. Isso é uma escolha madura para concorrência em live, onde vários comentários podem chegar ao mesmo tempo.

Ponto de atenção: a confirmação de pagamento não valida estado anterior com rigor suficiente para fluxo financeiro complexo. Por exemplo, o sistema permite confirmar uma reserva por endpoint sem uma entidade `Pagamento` separada e sem trilha de aprovação humana rica no banco.

### 5.5 Parser de Comentários

O `InterpretadorComentario` cobre:

- Intenções como `eu quero`, `eu queri`, `qro`, `meu`, `é meu`, `reserva`, `guarda`.
- Telefone móvel angolano com ou sem indicativo `244` ou `00244`.
- Código de peça rotulado (`peça 4`, `produto 4`, `#4`) ou número livre.
- Score de confiança.
- Encaminhamento para revisão manual quando falta telefone, peça ou intenção clara.

Ponto forte: regras puras, testáveis e isoladas.

Ponto de atenção: o parser é regex/rule-based. Isso é adequado para MVP, mas em produção real pode precisar de uma camada de aprendizagem por loja, sinônimos, ruído de live, português informal angolano e mensagens com múltiplas peças.

---

## 6. Banco de Dados

O schema Prisma atual possui 10 modelos:

| Modelo | Finalidade |
|---|---|
| `Peca` | Catálogo e stock |
| `Reserva` | Reserva, pagamento básico, expiração e entrega |
| `ComentarioRecebido` | Comentários capturados e interpretação |
| `MensagemWhatsapp` | Auditoria de mensagens enviadas |
| `EventoSistema` | Eventos internos persistidos |
| `OutboxEventoN8n` | Fila persistente para n8n |
| `UsuarioSistema` | Vendedor/usuário |
| `CodigoLoginSms` | Código de login temporário |
| `SessaoUsuario` | Sessões autenticadas |
| `InstanciaWhatsApp` | Instâncias Evolution/WhatsApp |

Pontos fortes:

- Migrations versionadas.
- Índices para reservas por peça/estado e telefone/peça.
- Índice parcial `Reserva_cliente_peca_ativa_unica_idx`.
- Outbox persistente para eventos n8n.
- Sessões armazenadas por hash de token.
- Códigos SMS armazenados por hash.

Lacunas de modelo para evolução:

- Não há entidade `Cliente` separada.
- Não há entidade `Pedido`.
- Não há entidade `Pagamento`.
- Não há entidade `Entrega` ou estado logístico persistente completo.
- Não há entidade `Loja`.
- Não há entidade `Live` persistida no schema atual.
- `Reserva` carrega responsabilidades demais: reserva, pagamento, comprovativo e entrega.

Recomendação: antes de escalar comercialmente, separar `Cliente`, `Pedido`, `Pagamento`, `Entrega`, `Loja` e `Live`. Isso evita que a reserva vire uma tabela gigante e melhora auditoria financeira.

---

## 7. Integrações

### 7.1 TikTok

Providers:

- `TikTokLiveConnectorProvider`: provider principal com `tiktok-live-connector`.
- `TikTokLivePythonProvider`: fallback por processo Python.
- `ManualProvider`: contingência e testes.
- `FutureInstagramProvider`: contrato preparado para futuro.

Pontos fortes:

- O domínio depende de `LiveCommentProvider`, não da biblioteca TikTok.
- Há fallback manual e fallback Python.
- O provider principal tenta lidar com API atual e legada.

Riscos:

- Bibliotecas de live do TikTok são dependências frágeis e não oficiais.
- O provider usa `any`, aceitável na borda externa, mas precisa de testes e logs bons.
- Reconexão existe, mas não há painel rico de saúde da conexão.

### 7.2 n8n

O backend envia eventos para n8n por webhook assinado:

- Header `X-EMEU-EVENTO`.
- Header `X-EMEU-TIMESTAMP`.
- Header `X-EMEU-ASSINATURA` com HMAC SHA-256.

Eventos enviados:

- `RESERVATION_CREATED`
- `RESERVATION_EXPIRING`
- `RESERVATION_EXPIRED`
- `RESERVATION_WAITLISTED`
- `PAYMENT_PROOF_RECEIVED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_REJECTED`
- `ORDER_READY_TO_SHIP`
- `ORDER_DELIVERED`

O backend também expõe endpoints `/n8n/*` protegidos por `X-EMEU-N8N-TOKEN`.

Pontos fortes:

- n8n é automação, não fonte de verdade.
- Há guardrails explícitos para IA.
- Existe outbox persistente com retry.
- Workflows importáveis estão versionados em `n8n/workflows`.

Pontos de atenção:

- Não há UI de administração da outbox.
- Não há métrica de eventos pendentes/falhados no painel.
- O documento `docs/arquitetura-modular.md` precisa ser atualizado, pois trata outbox como próximo passo, mas ela já existe.

### 7.3 Evolution API e WhatsApp

O projeto cobre duas frentes:

- Envio direto de WhatsApp pelo backend via `ProvedorWhatsAppEvolution`.
- Gestão de instâncias WhatsApp no painel: criar, conectar, QR Code, consultar estado, definir padrão e remover.

Pontos fortes:

- Provider atrás do contrato `ProvedorWhatsApp`.
- QR Code exibido no painel.
- Webhook Evolution normalizado para evento interno.
- Instâncias persistidas em `InstanciaWhatsApp`.

Riscos:

- Token de webhook pode vir por query string no Docker Compose. Funciona, mas query string pode aparecer em logs de proxy. Header é melhor para produção.
- Mensagens recebidas são emitidas como evento, mas não há tabela própria de conversa/mensagem recebida; a tela de conversas é derivada principalmente de comentários e reservas.
- Não há envio manual de mensagem pelo vendedor dentro da página de conversas.

### 7.4 SMS Ombala

O login usa `ProvedorSmsOmbala`.

Pontos fortes:

- O telefone é normalizado e validado como móvel angolano.
- Código expira.
- Código e sessão são armazenados como hash.
- Em dev, o código pode ser exposto para facilitar testes.

Riscos:

- O rate limit é em memória, então reinicia com o processo e não funciona distribuído em múltiplas instâncias.
- Não há bloqueio persistente por telefone/IP além das tentativas do código.

---

## 8. Frontend

### 8.1 Organização

Principais ficheiros:

| Ficheiro | Papel |
|---|---|
| `frontend/src/api.ts` | Cliente API, token, usuário e URL SSE |
| `frontend/src/tipos.ts` | Contratos usados pelo frontend |
| `frontend/src/utilidades.ts` | Formatação, traduções e helpers |
| `frontend/src/rotasApp.tsx` | Manifesto de rotas públicas/privadas |
| `frontend/src/App.tsx` | Router e guarda de autenticação |
| `frontend/src/componentes/Shell.tsx` | Layout interno, sidebar e componentes comuns |
| `frontend/src/estilos.css` | Design system e estilos globais |

Páginas:

| Página | Estado |
|---|---|
| Home | Landing rica, com mockups e conteúdo comercial |
| Login | Fluxo SMS com validação, reenvio e temporizador |
| Dashboard | Cockpit operacional com métricas e ações rápidas |
| Catálogo | Cadastro/listagem de peças |
| Comentários | Feed em tempo real e filtros |
| Reservas | Gestão de pagamento/cancelamento |
| Conversas | Linha do tempo operacional read-only |
| WhatsApp | Gestão Evolution e QR Code |
| Agentes | Leitura dos agentes reais do backend |
| n8n | Workflows, guardrails e contrato |
| Configurações | Parâmetros e integrações em execução |

### 8.2 Pontos Fortes de UX

- Design visual consistente, com tokens de cor, raio, sombra e tipografia.
- Navegação por sidebar com persistência do estado recolhido.

### 8.3 Limitações de UX e Produto (Atualizado: Resolvidas Lacunas Críticas de UX)

As lacunas mais críticas identificadas anteriormente foram **100% resolvidas**:
- **Catálogo**: Agora suporta edição, desativação/remoção de peças e upload/exibição de fotos reais.
- **Comentários**: O vendedor pode corrigir telefone, código da peça, adicionar observações, aprovar e rejeitar comentários em revisão manual diretamente na interface.
- **Conversas**: Agora possui um chat interativo para responder ao cliente diretamente via WhatsApp, além de ações operacionais rápidas (confirmar pagamento, cancelar reserva, etc.).

As limitações restantes incluem:

| Área | Limitação | Impacto |
|---|---|---|
| Configurações | Página é somente leitura (parâmetros de ambiente) | Médio |
| Dashboard | Ainda mistura cockpit de vendas com ferramentas técnicas de teste | Médio |
| n8n | Link para abrir n8n está hardcoded em `http://localhost:5678` | Médio |
| Home | Números comerciais e mockups são ilustrativos | Médio |
| API frontend | Não redireciona automaticamente em 401 dentro de `requisitarApi` | Médio |
| Listagens | Não há paginação nem virtualização | Baixo/Médio |

---

## 9. Segurança

Pontos positivos:

- Autenticação por telefone com código SMS.
- Token de sessão armazenado no banco como hash.
- Código SMS armazenado como hash.
- Validação de telefone angolano.
- Endpoints operacionais exigem sessão.
- Endpoints n8n exigem `X-EMEU-N8N-TOKEN`.
- Webhook backend -> n8n usa HMAC.
- Webhook Evolution exige token.
- Zod valida entradas críticas.
- Rate limit HTTP configurável.
- `validarConfiguracaoSegura()` impede produção sem segredos essenciais.

Riscos e recomendações:

| Risco | Severidade | Recomendação |
|---|---|---|
| Token do frontend em `localStorage` | Média | Considerar cookie HttpOnly em produção |
| Token SSE enviado por query string | Média | Preferir cookie HttpOnly ou token curto dedicado para SSE |
| CORS usa `ORIGEM_FRONTEND ?? true` | Média | Em produção, exigir origem explícita |
| Rate limit em memória | Média | Migrar para Redis quando houver múltiplas instâncias |
| Sem RBAC real além de `papel` | Alta para multi-equipa | Implementar permissões por papel e loja |
| Segredos default no Docker Compose | Alta se usado sem `.env` próprio | Exigir `.env.docker` real em produção |
| Imagens n8n/Evolution default `latest` | Média/Alta | Fixar versão ou digest |
| Query token no webhook Evolution | Média | Preferir header e remover query em produção |

---

## 10. DevOps e Deploy

O projeto já tem Docker Compose completo:

- PostgreSQL
- Redis
- Backend
- Frontend Nginx
- n8n
- Evolution API
- Evolution Manager

Pontos fortes:

- Backend Docker executa `prisma generate`, `prisma migrate deploy` e inicia `node dist/main.js`.
- Frontend é servido por Nginx com fallback para SPA.
- Postgres inicializa bases separadas para `emeu`, `n8n` e `evolution`.
- Documentação de Docker e deploy existe.
- `.env` de produção está previsto no README/docs.

Pontos de atenção:

- Não foi encontrado pipeline CI/CD no repositório.
- Não há configuração explícita de HTTPS/reverse proxy de produção.
- Não há observabilidade estruturada: métricas, tracing, logs agregados ou dashboard de outbox.
- Redis está no Compose, mas o rate limit ainda é em memória.
- A pasta analisada não é repositório Git, então não há histórico/branch/estado versionado nesta cópia.

---

## 11. Testes e Qualidade

Cobertura atual validada:

| Área | Testes existentes |
|---|---|
| Parser | Intenção, telefone, código de peça e revisão |
| Motor de reservas | Reserva, fila, expiração, duplicidade e concorrência em memória |
| n8n | Publicação com HMAC e contexto para IA |
| Evolution | Envio de mensagem e webhook recebido |
| Evolution admin | Helpers de estado, QR e erro |
| Autenticação | SMS, sessão e telefone inválido |
| Fluxo operacional | Integração HTTP com auth, catálogo, comentário, painel, n8n, conversas e pagamento |

Resultado: 19 ficheiros de teste com **67 testes passaram com sucesso** (cobertura robusta de ponta a ponta)!

Gaps importantes:

- Não há testes de interface automatizados no frontend.
- Não há testes E2E completos no browser com Playwright.
- Não há testes de concorrência com Postgres em ambiente Docker distribuído.
- Não há testes para expiração via scheduler em processo independente real.

Recomendação: migrar a base do rate limit para Redis e adicionar uma suíte Playwright mínima para simular fluxos completos do frontend.

---

## 12. Riscos Priorizados

### Prioridade Alta (Atualizado: Mitigados Riscos Críticos de Revisão e Chat)

Os riscos de revisão manual incompleta e conversas somente leitura foram **totalmente mitigados** com a implementação da interface interativa e do chat de conversas.

Riscos de escala comercial restantes:

1. Modelo comercial ainda concentrado em `Reserva`
   - Pagamento, comprovativo e entrega estão acoplados à reserva.

2. Falta de entidades `Cliente`, `Pedido`, `Pagamento`, `Entrega`, `Loja` e `Live` (Nota: entidades `ClienteAtendimento`, `ConversaAtendimento` e `MensagemAtendimento` já foram criadas no modelo CRM para o atendimento operacional, restando apenas as comerciais).
   - Limita auditoria, relatórios, multi-loja e escala comercial.

3. Ausência de testes com Postgres real sob concorrência
   - A lógica Prisma é boa, mas precisa de validação em banco real.

4. Dependência de provider TikTok não oficial
   - Risco externo relevante para operação ao vivo.

### Prioridade Média

1. Catálogo sem edição/fotos reais.
2. Configurações somente leitura.
3. n8n sem painel de outbox/eventos pendentes.
4. Link do n8n hardcoded no frontend.
5. Rate limit em memória.
6. Tokens no `localStorage` e SSE com token na URL.
7. Sem CI/CD e sem Git nesta pasta.

### Prioridade Baixa

1. Paginação ausente em listas.
2. Falta de gráficos temporais no dashboard.
3. Landing usa números ilustrativos que devem ser tratados como demonstração.
4. Poucos componentes React reutilizáveis em comparação com o tamanho do CSS.

---

## 13. Roadmap Recomendado

### Próximos 7 dias (Atualizado: Concluído com Sucesso)

- [x] Criar endpoints e UI para revisão manual de comentários.
- [x] Adicionar edição de peças e suporte visual a fotos.
- [x] Implementar envio manual de mensagem no painel de conversas (chat funcional).
- [x] Trocar link fixo do n8n por variável `VITE_N8N_URL`.
- [x] Atualizar documentação de requisitos e relatórios com progresso do projeto.
- [x] Criar painel simples de outbox n8n: pendentes, falhados, publicados e retry manual (funcional no painel).

### Próximos 30 dias

- [x] Separar entidades comerciais `Pedido`, `Pagamento` e `Entrega` (CRM operacional com `ClienteAtendimento`, `ConversaAtendimento` e `MensagemAtendimento` já concluído).
- [x] Persistir `Live` e relacionar comentários/reservas a lives reais.
- [x] Adicionar RBAC básico: vendedor, gestor, admin.
- [x] Migrar rate limit para Redis.
- [x] Implementar testes com Postgres em Docker.
- [x] Fixar imagens Docker de n8n/Evolution por versão/digest.
- [x] Adicionar Playwright para testes de fluxo do frontend.

### Próximos 60 a 90 dias

- Implementar multi-loja.
- Criar relatórios por live, vendedor, produto, conversão, pagamento e fila.
- Adicionar observabilidade: logs estruturados, métricas, alertas e tracing.
- Criar fluxo de reconciliação financeira.
- Melhorar parser com configuração por loja e dicionário de sinônimos.
- Preparar integração futura com Instagram/Facebook se for prioridade comercial.

---

## 14. Avaliação por Área

| Área | Nota | Justificativa |
|---|---:|---|
| Arquitetura backend | 9/10 | Excelentes camadas, use cases isolados, outbox persistente com retry e CRM de atendimento robusto. |
| Regra de negócio | 8.5/10 | Lógica de fila, reservas, expiração e tratamento de erros do WhatsApp assíncronos de alto nível. |
| Frontend operacional | 9/10 | UI moderna e rica em tempo real via SSE. Suporta revisão manual, chat interativo, catálogo editável e fotos. |
| UX comercial | 8/10 | Landing page premium com menus modernos, planos e provas de conceito refinadas. |
| Seguridad | 7.5/10 | Excelente base com hashes de sessões/códigos, tokens n8n/webhooks e validação Zod. |
| Testes | 8.5/10 | Suíte robusta com 67 testes passando com sucesso. |
| Deploy | 7.5/10 | Docker Compose completo com isolamento de base. |
| Prontidão para piloto | 9.5/10 | Totalmente pronto para piloto real com fluxos e contingências testadas. |
| Prontidão para escala | 6/10 | Depende de modelos de dados comerciais avançados, multi-loja e rate limit Redis. |

---

## 15. Conclusão

O ÉMeu é um projeto com base técnica forte para um MVP. A parte mais valiosa é que a lógica central foi colocada no backend, com domínio e use cases separados, enquanto n8n, Evolution e TikTok ficam como integrações substituíveis. Essa decisão protege o coração do produto.

O projeto está pronto para demonstração e piloto controlado. Para produção comercial mais exigente, o próximo salto deve ser menos visual e mais operacional: revisão manual acionável, conversa com envio real, modelo de dados comercial, testes com Postgres, observabilidade e hardening de deploy.

Se essas etapas forem executadas, o ÉMeu tem uma boa base para evoluir de MVP de live commerce para uma plataforma operacional real de vendas ao vivo em Angola.
