# Análise Técnica do Projeto ÉMeu

Data da análise: 2026-05-02

## Resumo Executivo

O ÉMeu está estruturado como um MVP funcional para automação de vendas em lives, com foco em TikTok, reservas em tempo real, fila de espera, integração WhatsApp via Evolution API e automações via n8n.

A arquitetura atual está organizada em camadas razoavelmente claras:

- `dominio`: tipos, contratos, schemas, eventos e serviços puros.
- `use-case`: orquestração de regras, leitura/escrita e fluxos de aplicação.
- `infra`: HTTP, providers externos, Prisma client, n8n e Docker.
- `frontend`: painel operacional React/Vite.
- `docs`: documentação de Docker, n8n e integrações.

O projeto já tem uma base forte para evoluir, principalmente porque as bibliotecas externas não ficam presas ao motor principal. O backend continua sendo a fonte de verdade das vendas, enquanto n8n e Evolution atuam como automação/atendimento.

Após estudar as estruturas do n8n e do NocoBase, o projeto passou a usar uma organização modular própria: o backend registra módulos HTTP por manifesto e o frontend centraliza rotas/menu num manifesto único. Isso melhora a escalabilidade sem copiar a complexidade das plataformas de referência.

Atualização de hardening em 2026-05-03: o projeto passou a ter migrations formais, `prisma migrate deploy` no Docker, reserva com controle transacional/serializável no Prisma, índice parcial contra reserva ativa duplicada, outbox persistente para eventos n8n, auditoria de eventos/mensagens WhatsApp, autenticação obrigatória nos endpoints operacionais, SSE autenticado por token, rate limit HTTP e versões Docker fixadas para n8n/Evolution.

Os principais pontos a fortalecer antes de produção passam a ser: modelagem comercial mais madura (`Cliente`, `Pedido`, `Pagamento`, `Live`), revisão manual completa no painel, testes com banco real sob carga e observabilidade operacional da outbox.

## Mapa da Estrutura

```text
.
├── backend
│   ├── prisma
│   │   └── schema.prisma
│   ├── scripts
│   │   └── tiktok_live_provider.py
│   └── src
│       ├── dominio
│       │   ├── eventos
│       │   ├── provedores
│       │   ├── repositorios
│       │   ├── servicos
│       │   ├── esquemas.ts
│       │   └── tipos.ts
│       ├── infra
│       │   ├── banco
│       │   ├── http
│       │   │   └── modulos
│       │   ├── n8n
│       │   └── provedores
│       ├── testes
│       └── use-case
│           └── repositorios
├── frontend
│   └── src
│       └── rotasApp.tsx
├── docker
│   ├── backend
│   ├── frontend
│   ├── nginx
│   └── postgres
├── docs
└── n8n
```

## Camadas e Responsabilidades

### `backend/src/dominio`

Responsabilidade: representar o vocabulário central do sistema.

Contém:

- Estados de peça, reserva, comentário e pagamento.
- Tipos de eventos internos.
- Contratos `LiveCommentProvider` e `ProvedorWhatsApp`.
- Contratos de repositórios.
- Schemas Zod para validação.
- Parser/normalizador de comentários e telefone.
- Despachador de eventos em memória.
- Automação WhatsApp como serviço de domínio apoiado por provider.

Análise:

- Boa separação de contratos.
- O domínio não depende diretamente de Fastify, Prisma, Evolution, n8n ou React.
- `InterpretadorComentario` e `NormalizadorTelefone` estão no lugar certo: são regras puras e testáveis.
- `AutomacaoWhatsApp` depende de provider abstrato, o que respeita bem inversão de dependência.

Ponto de atenção:

- `EventoSistema` e `MensagemWhatsapp` agora são persistidos por `AuditoriaEventosUseCase`.
- Eventos enviados ao n8n agora passam também por `OutboxEventoN8n`, com retry e marcação de falha/publicação.

### `backend/src/use-case`

Responsabilidade: executar fluxos de aplicação, consultar/escrever dados e coordenar regras.

Principais classes:

- `MotorReservas`: cria reservas, fila de espera, pagamento, expiração, promoção da fila e entrega.
- `ProcessadorComentarios`: recebe comentário, interpreta, registra, cria reserva e aciona WhatsApp/eventos.
- `ConsultaAtendimentoN8n`: monta contexto consciente para IA/n8n.
- `ConsultaPainelUseCase`: consolida dados para dashboard.
- `ConsultaIntegracoesUseCase`: expõe status operacional de integrações.
- `GestaoPecasUseCase`: cadastro/listagem de peças.
- `MonitorReservasUseCase`: expiração e lembretes próximos do prazo.
- `ReceberMensagemWhatsAppUseCase`: normaliza webhooks da Evolution.
- `use-case/repositorios`: implementações em memória e Prisma.

Análise:

- A regra pedida foi seguida: classes que fazem operações de banco/orquestração estão em `use-case`.
- A camada HTTP fica mais fina e delega comportamento para use-cases.
- O motor de reservas é a peça central e está separado dos providers.

Ponto de atenção:

- Colocar implementações de repositório dentro de `use-case/repositorios` atende a regra do projeto, mas não é o arranjo mais comum em Clean Architecture. Em arquiteturas mais ortodoxas, os contratos ficam no domínio/aplicação e as implementações ficam em infra. Aqui a decisão é coerente com o requisito do projeto, mas deve ser mantida conscientemente.

### `backend/src/infra`

Responsabilidade: adaptar o sistema ao mundo externo.

Contém:

- Fastify e rotas HTTP modulares.
- `ContextoAplicacao`, responsável por montar dependências.
- `modulos/manifestoModulosHttp`, responsável por registrar rotas por domínio.
- SSE em `HubTempoReal`.
- Publisher de eventos para n8n.
- Providers TikTok.
- Provider Evolution API.
- Provider console para WhatsApp.
- Prisma client.

Análise:

- Providers externos estão isolados.
- O HTTP deixou de ficar concentrado em um único arquivo grande.
- Novas áreas podem entrar como módulos `ModuloHttp`, sem mexer no boot principal.
- `TikTokLiveConnectorProvider` suporta API atual e fallback legado.
- `TikTokLivePythonProvider` permite fallback via Python.
- `ProvedorWhatsAppEvolution` está atrás de `ProvedorWhatsApp`.
- `PublicadorEventosN8n` assina payloads com HMAC.

Pontos de atenção:

- `PublicadorEventosN8n` agora cria registros em `OutboxEventoN8n`, tenta envio imediato e reprocessa pendências com backoff.
- `TikTokLiveConnectorProvider` usa `any` por causa da biblioteca externa; é aceitável no provider, mas a normalização deve continuar muito bem testada.
- Logs usam `console.error` em alguns providers. Em produção, ideal padronizar com logger estruturado.

## Fluxos Lógicos

### Fluxo 1: Comentário até Reserva

```text
Live/TikTok/Manual
  -> LiveCommentProvider
  -> ComentarioLive normalizado
  -> ProcessadorComentarios
  -> InterpretadorComentario
  -> RepositorioComentarios
  -> MotorReservas
  -> RepositorioPecas / RepositorioReservas
  -> eventos internos
  -> WhatsApp/n8n/painel
```

Estado atual:

- Comentários são normalizados.
- Parser identifica intenção, telefone angolano e código da peça.
- Comentários ambíguos vão para revisão.
- Reservas válidas entram como `WAITING_PAYMENT`.
- Sem stock livre entra como `WAITLISTED`.
- Duplicidade de cliente/peça é bloqueada em nível lógico.

Risco principal:

- O Prisma agora cria reservas com `TransactionIsolationLevel.Serializable`, retry para conflito de transação e índice parcial para impedir duplicidade ativa por cliente/peça.

### Fluxo 2: Reserva até n8n/Evolution

```text
MotorReservas
  -> DespachadorEventos
  -> PublicadorEventosN8n
  -> n8n
  -> WhatsApp/IA/aprovação humana
```

Alternativa direta:

```text
AutomacaoWhatsApp
  -> ProvedorWhatsApp
  -> ProvedorWhatsAppEvolution
  -> Evolution API
  -> WhatsApp
```

Estado atual:

- Se `N8N_ASSUME_WHATSAPP=true`, backend não envia WhatsApp direto.
- Se `N8N_ASSUME_WHATSAPP=false` e `WHATSAPP_PROVIDER=evolution`, backend envia via Evolution.
- Eventos n8n são assinados.
- Evolution webhook é recebido por `POST /webhooks/evolution`.

Risco principal:

- O token de webhook Evolution pode vir por query string por compatibilidade. Isso funciona, mas em produção query strings podem aparecer em logs de proxy. Header ainda é preferível quando possível.

### Fluxo 3: Pagamento e Entrega

```text
n8n/Evolution/Atendimento
  -> /n8n/payments/:id/proof-received
  -> /n8n/payments/:id/confirm ou reject
  -> /n8n/orders/:id/delivery-address
  -> /n8n/orders/:id/delivered
```

Estado atual:

- Comprovativo recebido muda `estadoPagamento` para `COMPROVATIVO_RECEBIDO`.
- Pagamento confirmado muda reserva para `PAID` e pagamento para `CONFIRMADO`.
- Endereço de entrega é guardado na reserva.
- Eventos de pós-venda são emitidos.

Pontos de atenção:

- Ainda não existe entidade `Pedido` separada de `Reserva`.
- `ORDER_DELIVERED` é emitido, mas não há campo persistido de estado logístico.
- Rejeição de pagamento não recoloca automaticamente a reserva em fluxo de cobrança; apenas emite evento e atualiza estado de pagamento.

### Fluxo 4: Dashboard

```text
React/Vite
  -> GET /painel/resumo
  -> EventSource /eventos
  -> métricas, catálogo, reservas, comentários, integrações
```

Estado atual:

- O painel já tem visual comercial mais rico.
- `frontend/src/rotasApp.tsx` centraliza rotas, ícones e navegação privada.
- Exibe receita reservada, conversão, fila ativa, vitrine, integrações, catálogo, reservas e comentários.
- Usa SSE para atualizar quando eventos acontecem.

Pontos de atenção:

- Algumas páginas ainda concentram componentes internos. Para crescimento, devem ser quebradas em componentes:
  - `PalcoVendas`
  - `PainelOperacao`
  - `Metricas`
  - `CatalogoPecas`
  - `TabelaReservas`
  - `ComentariosRecentes`
  - `StatusIntegracoes`
- Não há camada de cliente API centralizada.
- Ainda não há autenticação de vendedor.

## Modelo de Dados

### Tabelas atuais

- `Peca`
- `Reserva`
- `ComentarioRecebido`
- `MensagemWhatsapp`
- `EventoSistema`

Análise:

- `Peca`, `Reserva` e `ComentarioRecebido` sustentam o MVP.
- `MensagemWhatsapp` e `EventoSistema` já existem no schema, mas ainda não estão integradas a repositórios/use-cases.
- `Reserva` acumula reserva, pagamento e alguns dados de entrega. Isso é bom para MVP, mas em escala tende a pedir separação.

Sugestão de evolução:

- Criar `Pedido` para pós-pagamento.
- Criar `Pagamento` ou `ComprovativoPagamento`.
- Criar `Cliente`.
- Criar `Loja`, `Vendedor` e `Live`.
- Criar `OutboxEvento` para eventos enviados ao n8n.
- Criar `MensagemCliente` para histórico WhatsApp real.

## Docker e Infraestrutura

### Serviços

- `postgres`: banco principal.
- `redis`: cache/sessões Evolution.
- `backend`: Fastify/Prisma.
- `frontend`: Nginx servindo build Vite.
- `n8n`: automações.
- `evolution-api`: WhatsApp.
- `evolution-manager`: UI de gestão Evolution.

Análise:

- Todos coabitam na rede `emeu_net`.
- Backend fala com n8n por `http://n8n:5678`.
- Backend fala com Evolution por `http://evolution-api:8080`.
- Evolution chama backend por `http://backend:3333/webhooks/evolution`.
- PostgreSQL usa bases separadas para app, n8n e Evolution.

Pontos fortes:

- Boa separação por serviço.
- Healthchecks básicos.
- Volumes persistentes.
- `.env.docker.example` documenta variáveis.

Pontos de atenção:

- O startup do container usa `prisma migrate deploy`.
- n8n/Evolution passaram a ser fixados por versão/digest no `.env.docker.example`.
- Portas Postgres/Redis estão expostas no host; em produção devem ser removidas ou protegidas.
- O caminho local com acento (`ÉMeu`) causou problema no Buildx; o script usa builder clássico como mitigação.

## Testes

### Cobertura atual

- Parser de comentários.
- Motor de reservas.
- Publicação de eventos n8n.
- Provider Evolution.
- Fluxo operacional integrado via `Fastify.inject`.

Teste mais importante:

- `backend/src/testes/fluxo-operacional.test.ts`

Ele cobre:

```text
status integrações
  -> cadastro de peça
  -> comentário manual
  -> parser
  -> reserva
  -> painel
  -> contexto n8n
  -> webhook Evolution
  -> comprovativo
  -> confirmação de pagamento
  -> endereço de entrega
```

Análise:

- Os testes cobrem bem o fluxo feliz do MVP.
- Falta testar cenários de erro e concorrência.

Testes recomendados:

- Dois comentários simultâneos para uma peça com stock 1. Implementado em `motor-reservas.test.ts`.
- Provider TikTok com payloads reais gravados.
- Webhook Evolution com payloads de imagem/documento.
- n8n token inválido.
- Evolution token inválido.
- Expiração promovendo fila com múltiplos clientes.
- Peça inexistente indo para revisão manual.
- Telefone inválido indo para revisão manual.

## Aderência a SOLID

### S - Single Responsibility

Boa aderência geral.

Exemplos:

- `InterpretadorComentario`: interpreta texto.
- `NormalizadorTelefone`: normaliza/valida telefone.
- `MotorReservas`: regras de reserva.
- `ProvedorWhatsAppEvolution`: envio Evolution.
- `PublicadorEventosN8n`: publicação de eventos.

Ponto a melhorar:

- `App.tsx` ainda tem muitas responsabilidades visuais e lógicas juntas.

### O - Open/Closed

Boa aderência nos providers.

Exemplos:

- Novos providers de live podem implementar `LiveCommentProvider`.
- Novos providers de WhatsApp podem implementar `ProvedorWhatsApp`.

Ponto a melhorar:

- `criarProviderLive` e `criarProvedorWhatsApp` são factories com `if`. Para muitos providers, pode virar mapa/registro de providers.

### L - Liskov Substitution

Aceitável.

Todos os providers seguem contratos mínimos, mas faltam testes de contrato compartilhados para garantir substituição perfeita.

### I - Interface Segregation

Boa.

Interfaces são pequenas:

- `LiveCommentProvider`
- `ProvedorWhatsApp`
- Repositórios separados por agregado.

### D - Dependency Inversion

Boa no núcleo.

Use-cases dependem de contratos de repositório e providers, não de implementações diretas.

Exceção consciente:

- Implementações de repositório estão em `use-case/repositorios` por requisito do projeto.

## Segurança e Privacidade

Pontos positivos:

- O cliente só fornece telefone voluntariamente no comentário.
- Telefone é normalizado.
- n8n tem token de acesso.
- Eventos n8n podem ser assinados.
- Evolution webhook tem token por header ou query.

Pontos a reforçar:

- Tornar `N8N_BACKEND_TOKEN`, `N8N_WEBHOOK_SECRET` e `EVOLUTION_WEBHOOK_TOKEN` obrigatórios fora de dev/test. Implementado no boot HTTP para `NODE_ENV=production`.
- Evitar query token em produção quando possível.
- Criar autenticação para dashboard do vendedor. Implementado nas rotas privadas do frontend e endpoints operacionais do backend.
- Criar rate limit nos endpoints HTTP. Implementado com hook global configurável por env.
- Persistir logs de consentimento e mensagens. Eventos, comentários originais e mensagens WhatsApp agora são persistidos.
- Mascarar telefone em logs sensíveis.

## Pontos Fortes

- Arquitetura modular.
- Providers externos isolados.
- Parser testado.
- Fluxo principal coberto por teste integrado.
- Docker completo para ambiente realista.
- Documentação já distribuída por assunto.
- Dashboard operacional e comercialmente mais forte.
- n8n não substitui backend como fonte de verdade.
- Evolution pode operar como canal direto ou via n8n.

## Riscos Técnicos

### Alto

- Uso de bibliotecas TikTok não oficiais.
- Falta de teste de carga com PostgreSQL real durante live com muitos comentários por segundo.

### Médio

- `App.tsx` grande demais.
- Estados de entrega/pedido misturados em `Reserva`.
- Falta de tela operacional dedicada para acompanhar e reprocessar outbox.
- Provider TikTok usa `any` por instabilidade da lib.

### Baixo

- Scripts Docker usam builder clássico por causa do caminho com acento.
- `frontend/tsconfig.tsbuildinfo` apareceu no projeto e pode ser ignorado no `.gitignore`.
- Alguns nomes de arquivos antigos nos tabs do editor apontam para `backend/src/aplicacao`, que foi movido para `backend/src/use-case`.

## Recomendações Prioritárias

### Prioridade 1

- Implementar reserva com transação no Prisma. Concluído.
- Criar outbox persistente para eventos n8n. Concluído.
- Adicionar autenticação no painel. Concluído.
- Fixar versões de n8n e Evolution no Docker. Concluído.

### Prioridade 2

- Separar `Cliente`, `Pedido`, `Pagamento` e `Live`.
- Persistir mensagens WhatsApp e eventos internos. Concluído.
- Criar migrations formais com `prisma migrate`. Concluído.
- Criar rate limit e auditoria de endpoints. Concluído em nível HTTP/eventos; ainda falta uma tela de auditoria.

### Prioridade 3

- Modularizar frontend.
- Criar testes de contrato para providers.
- Criar seeds/demo data.
- Criar workflow n8n exportável real, não apenas blueprint.
- Criar página de revisão manual.

## Veredito

O projeto está bem encaminhado para um MVP robusto. A base atual permite demonstrar o ciclo central de venda em live:

```text
peça cadastrada
  -> comentário capturado
  -> parser
  -> reserva
  -> fila/stock
  -> WhatsApp/n8n
  -> pagamento
  -> entrega
  -> painel em tempo real
```

O próximo salto técnico deve ser menos sobre adicionar funcionalidades e mais sobre consistência operacional: transações, outbox, autenticação, auditoria e modelagem de entidades comerciais mais maduras.
