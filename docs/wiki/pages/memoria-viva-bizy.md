---
title: Memoria Viva do Bizy
aliases:
  - Memoria operacional Bizy
tags:
  - bizy/memoria
  - bizy/operacao
status: ativo
updated: 2026-07-10
---

# Memoria Viva do Bizy

Status: ativo
Ultima atualizacao: 2026-07-10
Fontes principais: `README.md`, `docs/RF-RNF-RN-EMEUV1.md`, `docs/deploy.md`, `docs/docker.md`, `docs/n8n.md`, `frontend/src/rotasApp.tsx`, `backend/src/infra/http/modulos/manifestoModulosHttp.ts`, `docs/sdd/decisions/ADR-0002-anani-nucleo-interno-invisivel.md`

## Identidade do Projeto

Bizy/EMeu e o sistema operacional comercial para pequenos negocios. A primeira identidade era automacao de vendas em lives, mas a direcao atual organiza o produto em tres sistemas visiveis: Bizy Team, Bizy Market e Bizy Learning. Por dentro, Anani e o nucleo invisivel de inteligencia, risco, auditoria, controlo e governanca.

O produto deve parecer ferramenta de operacao diaria, nao landing page permanente. As telas internas devem ser densas, claras, previsiveis e orientadas a acao.

Para a memoria de produto, visao, dores resolvidas, qualidades e regras de decisao para outra IA, comecar por [[memoria-projeto-bizy|Memoria de Projeto do Bizy]], [[guia-para-ia-bizy|Guia para IA no Bizy]] e [[anani-intelligence-control-plane]]. Esta pagina continua como memoria operacional e historico de trabalho.

## Como Navegar Esta Memoria

- Para entender o projeto antes de tocar em codigo, ir para [[memoria-projeto-bizy|Memoria de Projeto do Bizy]].
- Para ver a memoria por temas, ir para [[visao-produto-bizy]], [[dores-e-qualidades-bizy]], [[mapa-de-modulos-bizy]], [[dominio-e-entidades-bizy]], [[fluxos-operacionais-bizy]], [[arquitetura-e-guardrails-bizy]] e [[prioridades-lancamento-bizy]].
- Para saber tudo que ja existe, ir para [Inventario do Sistema Bizy](inventario-sistema-bizy.md).
- Para APIs e contratos HTTP, ir para [Inventario Backend e API HTTP](inventario-backend-api.md).
- Para banco, modelos e migrations, ir para [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Para telas, rotas e UX, ir para [Inventario Frontend e UX](inventario-frontend.md).
- Para comandos, Docker, n8n, Evolution e testes, ir para [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- Para deploy na VPS antiga, ir para [Deploy na VPS Antiga](deploy-vps-antiga.md).
- Para a fotografia executiva do produto, ir para [Estado Atual do Bizy](bizy-estado-atual.md).

## Norte de Produto

O vendedor precisa conseguir:

- cadastrar produtos e stock;
- vender em live e transformar comentarios em reservas/pedidos;
- atender clientes por conversas;
- acompanhar pedidos, pagamentos e entregas;
- recuperar carrinhos/pedidos parados;
- publicar loja publica e links rastreaveis;
- usar campanhas, afiliados e tracking sem perder controle humano;
- operar WhatsApp/n8n/Evolution com guardrails.

O backend ja tem fundacao ampla de CRM+; a Loja Digital agora tem configuracao operacional ligada ao CRM via `experiencia.operacao`, cobrindo checkout, fidelizacao, automacoes, canais e relatorios. O frontend ja fechou checkout visual, SEO publico, mobile 360px, ocultacao de modulos desativados e guard de URL por modulo. Anani ja tem read models iniciais `TeamHealth`, `MarketSnapshot`, `SecuritySnapshot` e console interna oculta; o roadmap atual nao tem P0 aberto.

## Stack

- Monorepo npm workspaces: `backend` e `frontend`.
- Backend: Fastify, TypeScript ESM, Prisma, PostgreSQL, Zod. Ver [Inventario Backend e API HTTP](inventario-backend-api.md) e [Inventario de Dados, Prisma e Migrations](inventario-dados-prisma.md).
- Frontend: Vite, React, React Router, Tailwind/shadcn-like, lucide icons. Ver [Inventario Frontend e UX](inventario-frontend.md).
- Automacao: n8n.
- WhatsApp: Evolution API e provider modular; Cloud API tambem existe como caminho.
- Infra: Docker Compose, Postgres, Redis, n8n, Evolution API, Evolution Manager, Caddy opcional. Ver [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).

## Comandos Que Mais Importam

Local completo:

```bash
npm run dev
```

Build/test/typecheck:

```bash
npm run build
npm run test
npm run typecheck
```

Prisma:

```bash
npm run prisma:migrate:deploy
npm run prisma:migrate:status
npm run prisma:generate
```

Bootstrap:

```bash
npm run bootstrap:ambiente
```

Docker:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Arquitetura Backend

Entrada principal:

- `backend/src/main.ts`
- `backend/src/infra/http/criarAplicacao.ts`
- `backend/src/infra/http/ContextoAplicacao.ts`
- `backend/src/app/bootstrap/bootstrapAnani.ts`
- `backend/src/anani/policies/AnaniPolicyEngine.ts`

Manifesto de modulos HTTP:

- `saude`
- `autenticacao`
- `lives`
- `catalogo`
- `clientes`
- `campanhas`
- `contratos`
- `lojaPublica`
- `afiliados`
- `diagnosticos`
- `media`
- `pedidos`
- `reservas`
- `integracoes`
- `n8n`
- `operacional`
- `painel`

Use cases centrais:

- `MotorReservas`
- `ProcessadorComentarios`
- `GestaoPecasUseCase`
- `GestaoPedidosUseCase`
- `GestaoClientesCrmUseCase`
- `GestaoAtendimentoCrmUseCase`
- `GestaoTarefasOperacionaisUseCase`
- `GestaoSocialInboxUseCase`
- `GestaoOportunidadesRecuperacaoUseCase`
- `GestaoCampanhasCrmUseCase`
- `GestaoAfiliadosUseCase`
- `LojaPublicaUseCase`
- `RelatoriosComerciaisUseCase`
- `AutenticacaoTelefoneUseCase`
- `OnboardingBizyUseCase`

Regra de arquitetura: dominio/use cases nao devem depender de Fastify, React, TikTok, n8n ou Evolution diretamente. Providers e repositorios ficam atras de contratos.

Anani fica como nucleo interno. Rotas diretas devem ficar em `/governance/anani/*`, protegidas por papel de plataforma, e nao podem aparecer como modulo comum de tenant.

## Frontend Atual

Design system v2 centralizado em `BizyDesignSystem.tsx` com tokens oklch, Plus Jakarta Sans, componentes KpiCard, TableCard, FilterChips, StatusBadge, AvatarBizy, BotaoBizy.

Rotas publicas:

- `/` - Home ou Loja Digital Publica (conforme subdominio)
- `/login`
- `/lojas/:slug` - Loja Digital Publica

Rotas comerciais — Hoje:

- `/app` - Comando do dia / Painel
- `/app/live` - Central de live

Rotas comerciais — Vendas:

- `/app/reservas` - Pedidos
- `/app/tarefas` - Tarefas
- `/app/conversas` - Atendimento
- `/app/clientes` - Clientes
- `/app/recuperacao` - Recuperacao (modulo: automacoes)
- `/app/campanhas` - Campanhas (modulo: automacoes)
- `/app/social-inbox` - Social Inbox

Rotas comerciais — CRM (modulo: funil):

- `/app/pipeline` - Pipeline
- `/app/cotacoes` - Cotacoes
- `/app/agenda` - Agenda
- `/app/metas` - Metas
- `/app/respostas-rapidas` - Respostas rapidas
- `/app/actividades` - Notas
- `/app/formularios` - Formularios
- `/app/sequencias` - Sequencias (modulo: automacoes)

Rotas comerciais — Vitrine:

- `/app/catalogo` - Produtos
- `/app/loja-publica` - Loja Digital (modulo: loja-publica)
- `/app/afiliados` - Afiliados (modulo: afiliados)

Rotas comerciais — Gestao:

- `/app/relatorios` - Desempenho
- `/app/equipa` - Equipa
- `/app/pagamentos` - Pagamentos
- `/app/administracao` - Administracao

Rotas admin/sistema:

- `/app/comentarios` - Live monitor
- `/app/diagnosticos` - Diagnosticos SMS
- `/app/auditoria` - Auditoria

Rota oculta:

- `/onboarding`

API frontend:

- `frontend/src/api.ts` usa `VITE_API_URL` quando configurado.
- Em desenvolvimento local, `VITE_API_URL` vazio faz o Vite proxy encaminhar rotas para o backend.
- Sessao ainda preserva token em `localStorage` para compatibilidade, mas backend tambem suporta cookie HttpOnly.

## Integracoes e Automacao

n8n e camada de automacao, nao fonte de verdade. Backend continua dono de stock, reservas, pedidos, pagamentos e historico.

Fluxos n8n importaveis:

- `n8n/workflows/emeu-eventos-vendas.json`
- `n8n/workflows/emeu-atendimento-whatsapp.json`
- `n8n/workflows/emeu-comprovativo-pagamento.json`

Regras importantes:

- Backend -> n8n usa webhook assinado.
- n8n -> backend usa `X-EMEU-N8N-TOKEN`.
- `N8N_ASSUME_WHATSAPP=true`: backend emite eventos, n8n envia WhatsApp.
- `N8N_ASSUME_WHATSAPP=false` + `WHATSAPP_PROVIDER=evolution`: backend envia pela Evolution.

## Deploy e VPS

Guia geral: `docs/deploy.md`. A sintese operacional fica em [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md), e o procedimento especifico da VPS antiga fica em [Deploy na VPS Antiga](deploy-vps-antiga.md).

VPS antiga descoberta via UOR Connect:

- IP: `135.181.47.46`
- SSH: `root@135.181.47.46`
- Pasta sugerida para Bizy: `/opt/bizy`
- Guia do projeto: `docs/DEPLOY_VPS_ANTIGA.md`

Para producao Docker:

- usar `docker-compose.yml` + `docker-compose.prod.yml`;
- adicionar `docker-compose.staging.yml` se o proprio projeto for terminar HTTPS com Caddy;
- nunca sobrescrever `.env.docker` real na VPS;
- manter Postgres/Redis sem porta publica quando em producao;
- backend Docker executa Prisma generate + migrate deploy no arranque.

## Incidente Recente Importante

### 2026-06-07 - Logotipo final Bizy

Refinamento aplicado:

- marca oficial passa a ser o wordmark `bizy.` em Geist 700, com letter spacing `-0.055em`;
- ponto final esmeralda `#16A07A` vira assinatura fixa da marca;
- favicon/app icon passa a ser `b.` branco em base escura `#0B1014`;
- dentro do CRM, header mobile, sheet mobile e sidebar usam apenas o wordmark `bizy.`, sem o simbolo `b.` como marca de interface;
- navegacao desktop do CRM segue rail preto estreito com icones, capsule ativa animada e painel secundario claro por seccao, conforme video de referencia `IMG_0331.MOV`;
- simbolo antigo de folha/check deve ser tratado como legado e nao reaparecer em login, onboarding, favicon ou UI;
- fonte de verdade fica em `frontend/src/marca/bizy.tsx`, com SVGs publicos sincronizados.

Verificacao feita:

- `npx vitest run testes/marca-bizy.test.ts testes/design-login.test.ts testes/design-home.test.ts testes/design-onboarding.test.ts` em `frontend/`;
- `npm run typecheck --workspace frontend`;
- `npm run build --workspace frontend`;
- Playwright em home, login e favicon, sem erros de console.

### 2026-06-07 - TikTok Cliente 360 e avatar do payload real

Refinamento aplicado:

- payloads TikTok no formato `{ tiktok: { identidade, usuario, mensagem } }` agora sao lidos como fonte valida de identidade;
- o sistema promove apenas campos uteis para operacao: `userId`, `secUid`, `uniqueId`, `nickname/displayName` e avatar;
- `foto_perfil.urls` alimenta o avatar do comentario, cliente, identidade digital e reserva; `m_uri` isolado continua ignorado por nao ser URL absoluta;
- Atendimento desktop deve passar `avatarUrlCliente` para `AvatarBizy` na lista e no cabecalho da conversa, evitando fallback visual para inicial quando a foto ja existe;
- evento bruto permanece em `dadosCaptura.tiktok.ultimoEvento.rawEvent` para auditoria e futura admin Bizy.

Verificacao feita:

- `npm run test --workspace backend -- src/testes/cliente-360-captura-social.test.ts`
- `npm run test --workspace backend -- src/testes/tiktok-live-connector-provider.test.ts src/testes/interpretador-comentario.test.ts src/testes/pedidos-http.test.ts src/testes/cliente-360-captura-social.test.ts`
- `npm run typecheck --workspace backend`
- `npx vitest run testes/clientes-pedidos-identidade.test.ts` em `frontend/`
- `npm run typecheck --workspace frontend`

### 2026-06-06 - Deploy VPS, Cliente 360 e migration de variantes

Mudancas entregues:

- comentarios de live com `telefone + artigo/id/codigo` agora contam como compra operacional e criam pedido automaticamente, mesmo sem o cliente escrever verbo como "quero" ou "comprar";
- Cliente 360 continua a guardar perfil bruto/normalizado, foto e sinais digitais capturados do TikTok quando disponiveis;
- frontend teve auditoria desktop/mobile em rotas autenticadas para remover botoes/chips/tabs com texto invisivel ou contraste baixo.

Deploy:

- VPS antiga `135.181.47.46`, pasta `/opt/bizy`;
- backup criado antes do deploy: `/opt/bizy/backups/postgres/bizy-production-20260606T215941Z.dump`;
- stack subida com `docker-compose.yml`, `docker-compose.prod.yml` e `docker-compose.staging.yml`;
- validacoes finais: `https://api.usebizy.space/saude` e `https://usebizy.space/` responderam `200`.

Incidente de migration no deploy:

- `prisma migrate deploy` falhou em `20260604005544_adiciona_variantes_e_variante_selecionada` porque `ItemPedido.varianteSelecionada` ja existia no banco;
- auditoria confirmou que `ItemPedido.varianteSelecionada`, `Reserva.varianteSelecionada`, tabela `VariantePeca`, indices e FK ja estavam materializados;
- migration foi marcada como aplicada com `prisma migrate resolve --applied 20260604005544_adiciona_variantes_e_variante_selecionada`;
- em seguida `prisma migrate deploy` aplicou `20260606193000_cliente_360_captura_social`, incluindo `Negocio.perfil360Json`, `dadosOperacionaisJson`, `fontesDadosJson` e `ultimoEnriquecimentoEm`;
- backend voltou `healthy` e `/saude` respondeu com banco `OK`.

Lembrar: se uma migration falhar por coluna/tabela ja existente em producao, fazer backup, auditar a estrutura real com `information_schema`/`pg_indexes`/`pg_constraint` e so entao usar `prisma migrate resolve`.

### 2026-05-31 - Migrations locais pendentes

Erro visto no navegador:

- varias rotas em `:5173` retornavam `500`, incluindo `/painel/resumo`, `/atendimento/conversas`, `/tarefas`, `/pedidos`, `/clientes`, `/pecas`.

Causa raiz:

- backend estava vivo e Postgres respondia, mas havia migrations pendentes;
- Prisma tentava ler `Negocio.contasSociaisJson`, coluna ausente no banco local.

Correcao aplicada localmente:

```bash
npm run prisma:migrate:deploy --workspace backend
```

Verificacao feita:

- `npm run prisma:migrate:status --workspace backend` retornou schema atualizado;
- endpoints testados via `localhost:3333` e `localhost:5173` responderam `200`.

Lembrar: quando muitas rotas autenticadas falharem juntas com 500, verificar migrations antes de mexer no frontend.

## Prioridades P0/P1 do Documento de Requisitos

P0 pre-lancamento:

- frontend da loja publica;
- SEO e preview social nas paginas publicas; `[x]`
- checkout visual com carrinho; `[x]`
- aviso de privacidade/tracking;
- estados vazios orientadores;
- ocultar modulos desativados na UI;
- paginacao padronizada;
- remover pagina `Explorar` se existir como relatorio vazio.

P1 primeira operacao comercial:

- kanban/lista visual de funil de pedidos;
- perfil 360 completo na UI;
- [x] criar pedido direto na conversa;
- [x] envio binario real na conversa;
- resultados de campanha por webhook;
- gestao visual de colecoes;
- revisao textual para vendedora;
- templates WhatsApp por evento transacional;
- tarefas/fallbacks estruturados para automacoes;
- sequenciador pos-venda;
- prioridade visual VIP/reclamacao/pendencia.

## Regras Para Trabalhar Neste Repo

- Antes de alterar wiki, ler `docs/wiki/schema.md`.
- Usar `rg`/`rg --files` para procurar.
- Usar `apply_patch` para edicoes manuais.
- Nao reverter alteracoes locais do utilizador.
- Ha varias alteracoes locais no frontend/docs; tratar como trabalho do utilizador ate prova em contrario.
- Para bugs, reproduzir e achar causa raiz antes de corrigir.
- Para frontend, manter design operacional: denso, responsivo, sem landing page quando o pedido for app/ferramenta.
- Para deploy, nao versionar nem copiar segredos reais.

## Arquivos de Entrada Rapida

- Requisitos: `docs/RF-RNF-RN-EMEUV1.md`
- Wiki: `docs/wiki/index.md`
- Inventario geral: `docs/wiki/pages/inventario-sistema-bizy.md`
- Inventario backend/API: `docs/wiki/pages/inventario-backend-api.md`
- Inventario dados/Prisma: `docs/wiki/pages/inventario-dados-prisma.md`
- Inventario frontend/UX: `docs/wiki/pages/inventario-frontend.md`
- Inventario operacao/testes: `docs/wiki/pages/inventario-operacao-testes.md`
- Deploy: `docs/deploy.md`
- VPS antiga: `docs/DEPLOY_VPS_ANTIGA.md`
- Docker: `docs/docker.md`
- n8n: `docs/n8n.md`
- Arquitetura: `docs/arquitetura-modular.md`
- Frontend rotas: `frontend/src/rotasApp.tsx`
- API frontend: `frontend/src/api.ts`
- Modulos HTTP: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
