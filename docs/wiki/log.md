---
title: Log da Wiki Bizy
aliases:
  - Historico da Wiki
tags:
  - bizy/wiki
  - bizy/log
status: ativo
updated: 2026-06-07
---

# Log da Wiki

## [2026-06-07] backend | Bizy Market pronto para primeira frente frontend

- Backend do primeiro recorte navegavel do Bizy Market passou a expor categorias, detalhe de produto, similares de outros fornecedores e controlo CRM de publicacao.
- Novas rotas: `GET /publico/market/categorias`, `GET /publico/market/produtos/:codigo`, `GET /publico/market/produtos/:codigo/similares`, `GET /crm/loja/market/resumo`, `PUT /crm/loja/produtos/:codigo/publicacao` e `PUT /crm/loja/produtos/publicacao-em-massa`.
- Produtos ganharam flag JSON `vitrine.publicacaoMarket`, permitindo que um produto continue no perfil da loja e seja despublicado apenas do Market sem migration nova.
- Atualizados os checkboxes backend em `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, [[bizy-market-lojas-digitais]] e [[bizy-market-rotas-roadmap]].

## [2026-06-07] produto | Rotas e sequencia do Bizy Market

- Criada a nota [[bizy-market-rotas-roadmap]] com rotas publicas, APIs publicas, checkout unificado, Bizy Studio no CRM, APIs do CRM, Admin Bizy e APIs admin.
- Definida a sequencia recomendada: perfil/publicacao, produto/similares/descoberta, Bizy Studio, checkout unificado e governanca/financeiro.
- Atualizado `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md` com a secao `8.1 Sequencia Tecnica de Rotas`.
- Atualizadas [[bizy-market-lojas-digitais]] e [[index]] para apontar para o novo mapa.
- Nenhum ficheiro foi movido; apenas foi adicionada uma nota sintetizada e links de navegacao.

## [2026-06-07] backend | Perfil publico de loja para Bizy Market

- `GET /publico/lojas/:slug` continua compatível com `loja`, `produtos`, `vitrine` e `seo`, mas agora também devolve `perfil`, `colecoes` e `market`.
- O bloco `perfil` expõe avatar/logo, capa, bio, localização, cor de acento, contadores sociais iniciais, selos operacionais e ações públicas.
- `colecoes` é derivado dos produtos vendáveis da loja e separa coleções locais de categorias, com URLs filtráveis para mudar a grelha sem trocar de página.
- `market` fornece CTA para explorar similares no Bizy Market com categoria principal e `lojaOrigem`.
- Slugs reservados como `market`, `shop`, `checkout`, `api`, `www`, `n8n`, `wa` e `suporte` passaram a ser bloqueados antes da publicação.
- Atualizados `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, [[bizy-market-lojas-digitais]], [[index]] e o plano `docs/superpowers/plans/2026-06-07-bizy-market-perfil-loja-backend.md`.

## [2026-06-07] backend | Primeira API publica do Bizy Market

- Criado o primeiro recorte backend do Bizy Market: `GET /publico/market/produtos`.
- Adicionado `BizyMarketUseCase` para listar produtos elegiveis de lojas publicadas usando `RepositorioAutenticacao` e `RepositorioPecas`, sem migration nova nesta fase.
- `RepositorioAutenticacao` ganhou `listarNegociosPublicados()` nas implementacoes memoria e Prisma.
- A resposta publica inclui produto sanitizado, loja fornecedora sanitizada, `urlLoja`, `urlProduto`, filtros aplicados e resumo de categorias.
- Criado teste de contrato em `backend/src/testes/bizy-market-http.test.ts`.
- Atualizados `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`, [[bizy-market-lojas-digitais]] e o plano `docs/superpowers/plans/2026-06-07-bizy-market-backend-foundation.md`.

## [2026-06-07] produto | Bizy Market e lojas digitais

- Criado `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md` com RF, RNF e regras de negocio para evoluir a loja digital em Bizy Market, perfis autonomos de loja, checkout unificado e central de controlo dentro do CRM.
- Criada a nota [[bizy-market-lojas-digitais]] no vault Obsidian para sintetizar a decisao e ligar a loja atual a nova visao.
- Atualizadas [[loja-digital-operacao-crm]], [[visao-produto-bizy]], [[mapa-de-modulos-bizy]] e [[memoria-projeto-bizy]] para registrar que o Market gera descoberta, mas a execucao comercial continua no CRM.
- Atualizado [[index]] para incluir a nova nota e o novo documento formal de requisitos.

## [2026-06-07] marca | Logotipo final Bizy

- Navegacao desktop do CRM passou a seguir a referencia em video: rail preto estreito, cantos grandes, icones em coluna, item ativo em capsule animada e painel secundario claro com paginas da seccao.
- Refinamento posterior: dentro do CRM, header mobile, sheet mobile e sidebar usam apenas o wordmark `bizy.`, sem o simbolo `b.` na navegacao interna.
- Implementado o logotipo final da referencia `Bizy - Logotipo Final.html`: wordmark lowercase `bizy.` em Geist 700, tracking apertado e ponto esmeralda `#16A07A`.
- Favicon/app icon passa a ser `b.` branco em quadrado arredondado escuro `#0B1014`, removendo o simbolo antigo de folha/check.
- `frontend/src/marca/bizy.tsx`, `frontend/public/bizy-logo.svg`, `frontend/public/bizy-favico.svg`, `frontend/public/favico.svg` e `frontend/index.html` ficaram alinhados ao novo sistema de marca.
- Login e Onboarding deixaram de usar a imagem que ainda exibia o simbolo antigo em cena, evitando conflito visual com a nova identidade.
- Verificacoes associadas: `frontend/testes/marca-bizy.test.ts`, `frontend/testes/design-login.test.ts`, `frontend/testes/design-home.test.ts`, `frontend/testes/design-onboarding.test.ts`, `npm run typecheck --workspace frontend`, `npm run build --workspace frontend` e Playwright em home/login/favico.

## [2026-06-07] tiktok/cliente-360 | Avatar útil do payload aninhado

- Normalizador de comentários passou a ler o formato real `{ tiktok: { identidade, usuario, mensagem } }`, promovendo apenas dados úteis para o perfil: `userId`, `secUid`, `uniqueId`, `displayName/nickname` e avatar.
- `foto_perfil.urls` agora alimenta `comentario.avatarUrl`, `Cliente.avatarUrl`, `identidadesDigitais.tiktok.avatarUrl` e `Reserva.avatarUrlCliente`; `m_uri` sem URL absoluta continua ignorado.
- Atendimento desktop também passa `avatarUrlCliente` para `AvatarBizy` na lista e no cabeçalho da conversa; assim a UI deixa de cair para o `span` com inicial quando a foto já veio do TikTok.
- O evento bruto segue preservado em `dadosCaptura.tiktok.ultimoEvento.rawEvent` para auditoria, sem virar avatar/perfil operacional por acidente.
- Verificações associadas: `backend/src/testes/cliente-360-captura-social.test.ts`, `backend/src/testes/tiktok-live-connector-provider.test.ts`, `backend/src/testes/interpretador-comentario.test.ts`, `backend/src/testes/pedidos-http.test.ts`, `frontend/testes/clientes-pedidos-identidade.test.ts`, `npm run typecheck --workspace backend` e `npm run typecheck --workspace frontend`.

## [2026-06-06] live/pedidos | Pedido automático, contraste e deploy VPS

- Parser de comentários passou a tratar `telefone + artigo/id/código` como compra operacional mesmo sem verbo explícito de intenção, criando pedido automaticamente quando o produto é encontrado.
- Auditoria Playwright desktop/mobile percorreu as rotas autenticadas principais e corrigiu contraste de botões/chips/tabs que ficavam com texto branco sobre fundo transparente ou contraste abaixo do mínimo.
- Deploy feito na VPS antiga `135.181.47.46` com backup prévio em `/opt/bizy/backups/postgres/bizy-production-20260606T215941Z.dump`.
- Incidente de deploy: a migration `20260604005544_adiciona_variantes_e_variante_selecionada` já estava materializada no banco, mas não registada como aplicada; foi marcada com `prisma migrate resolve --applied` e depois `20260606193000_cliente_360_captura_social` aplicou as colunas 360.

## [2026-06-06] frontend | Identidade visual v2 como regra do sistema

- Criada a nota [[identidade-visual-bizy-v2]] a partir da referencia `Bizy - Direcao Visual v2.html`.
- Registados tokens, tipografia, paleta semantica, regras de cards, modais/sheets, navegacao e Atendimento como padrao oficial para o frontend.
- O padrao reforca que paginas novas devem partir de `BizyDesignSystem.tsx` e dos tokens OKLCH em `frontend/src/estilos.css`.
- Atendimento recebeu guardrails de responsividade para SMS longas: previews com duas linhas, bolhas com quebra agressiva, composer com altura limitada e cabecalhos/contexto protegidos contra overflow.
- Criada [[auditoria-visual-frontend-bizy-v2]] com capturas desktop/mobile, achados e guardrails; corrigida sidebar desktop no mobile, ponte v2 para classes herdadas `crm-*`/`dash-*`, modais/sheets/alert dialogs e modal de produto.
- Rodada completa no navegador com 62 capturas em `/tmp/bizy-audit-all-after`: loja individual alinhada a v2, botoes shadcn com verde primario, sheet de produto da loja validado e overflow mobile de Pedidos corrigido em `bz-tabs`.

## [2026-06-05] frontend | Refatoracao design v2 e expansao de paginas

- Frontend expandido de ~15 para 31 paginas roteadas com cobertura completa dos modulos CRM, Vendas, Gestao e Admin/Sistema.
- Novas paginas criadas: Pipeline, Cotacoes, Agenda, Metas, RespostasRapidas, Actividades, Formularios, Sequencias, Campanhas, SocialInbox, Equipa, Pagamentos, Diagnosticos, Auditoria, LojaDigitalPublica, Tarefas.
- Design system v2 centralizado em `BizyDesignSystem.tsx` com componentes reutilizaveis: PageHead, KpiGrid, KpiCard, TableCard, Table, StatusBadge, AvatarBizy, FilterChips, BotaoBizy, Money, CrmPageMotion.
- Pagina Live refatorada para design v2: stage escuro com gradiente, mini-metrics 4 colunas, feed de reservas com auto-badge.
- Pagina Atendimento/Conversas refatorada para design v2: inbox split 2 colunas com tabs semanticos, thread com context card, composer minimal, propriedades em painel lateral.
- CSS v2 adicionado em `estilos.css`: tokens oklch, Plus Jakarta Sans, blocos dedicados para live stage, feed, inbox/atendimento.
- Navegacao reorganizada por seccoes (Hoje, Vendas, CRM, Vitrine, Gestao, Admin/Sistema) com visibilidade por modulos activos e papel do utilizador.
- Rota publica `/lojas/:slug` e `PaginaLojaDigitalPublica` para loja por subdominio.
- Wiki actualizada: inventario-frontend, memoria-viva, bizy-estado-atual, inventario-sistema-bizy.

## [2026-05-31] loja-digital | Operacao avancada unificada

- Admin da Loja Digital ganhou configuracao organizada para plano/quotas, checkout, pagamentos, entrega, catalogos, clientes, encomendas, automacoes, canais, relatorios e site/SEO.
- Backend passou a validar, guardar e devolver o contrato ampliado em `experiencia.operacao`, mantendo os mesmos endpoints de configuracao e loja publica.
- Social Inbox agora considera uma interacao social recente com telefone como janela omnicanal para levar o atendimento ao WhatsApp, sem relaxar a regra das conversas WhatsApp normais.
- Documentacao [[loja-digital-operacao-crm]] atualizada com a estrutura operacional recomendada para Loja Digital, Checkout, Entrega, Clientes CRM, Atendimento, Automacoes e Relatorios.
- Verificacoes associadas: `frontend/testes/loja-digital-operacao-avancada.test.ts`, `backend/src/testes/loja-operacao-avancada-schema.test.ts`, `backend/src/testes/loja-publica-tracking-http.test.ts`, `backend/src/testes/social-inbox.test.ts`, typecheck, build e suite completa do backend.

## [2026-05-31] loja-digital | Subdominio publico por loja

- A loja publica passa a aceitar `slug.usebizy.space` quando `PUBLIC_STORE_DOMAIN=usebizy.space`, mantendo `/lojas/:slug` como fallback local e de compatibilidade.
- Admin da loja monta o link publico no formato de subdominio e a pagina publica resolve o slug pelo hostname.
- Backend libera CORS para subdominios publicados, expõe `/publico/lojas/dominios/autorizar` para TLS sob demanda no Caddy e bloqueia subdominios reservados como `api`, `www`, `app`, `n8n` e `wa`.
- Docker/Caddy recebeu `PUBLIC_STORE_DOMAIN`, build arg `VITE_PUBLIC_STORE_DOMAIN` e rota catch-all com `on_demand_tls` autorizado pelo backend.
- Verificacoes associadas: `frontend/testes/loja-subdominio.test.ts`, `backend/src/testes/cors.test.ts`, `backend/src/testes/loja-publica-tracking-http.test.ts`, typecheck, build e validacao do Caddy.

## [2026-05-31] loja-digital | Polimento visual da loja publica

- Ajustada a loja publica com header mais presente, abas em formato de controle segmentado, logo com contraste fixo e botoes de compra no estilo da home.
- Secao "Sobre" simplificada para perfil da loja + card elegante "Loja criada com Bizy", removendo texto tecnico e blocos informativos repetidos.
- Modais/sheets de produto, checkout e captura de contacto receberam guardrail `loja-modal-responsivo`; textos em portugues foram revistos e removidas referencias tecnicas a VPS/storage na admin de produtos.
- Corrigidos resets globais de `button` e `a` para nao anularem classes Tailwind em CTAs customizados.
- Verificacoes associadas: `frontend/testes/loja-publica-fase1.test.ts`, `frontend/testes/catalogo-produto-modal.test.ts`, typecheck, build e screenshots Playwright desktop/mobile.

## [2026-05-31] catalogo | Produto completo, modal e storage local

- Cadastro/edicao de produto na admin passa a usar modal, com catalogo obrigatorio, campos comerciais completos, variantes e upload de fotos para `/media/upload`.
- Backend aceita fotos persistidas em `/media/files/...`, mantendo compatibilidade com URLs publicas; imagens de catalogo ficam acessiveis publicamente e comprovativos continuam privados.
- Frontend passa a resolver URLs locais de media contra `VITE_API_URL` quando necessario, incluindo admin da loja, loja publica e catalogo.
- Testes associados: `frontend/testes/catalogo-produto-modal.test.ts` e `backend/src/testes/catalogo-stock-http.test.ts`.

## [2026-05-31] loja-digital | Operacao CRM e live estavel

- Criada a nota [[loja-digital-operacao-crm]] para documentar checkout inteligente, acesso/fidelizacao, automacoes, canais conectados e relatorios guiados.
- Atualizado `docs/RF-RNF-RN-EMEUV1.md` para versao 1.106 com o contrato `experiencia.operacao`.
- Registrada a correcao do monitoramento live: provider TikTok desativa fallback Euler e interrompe reconexao em erros terminais de conta inexistente, live offline ou falta de permissao.
- Testes associados: `backend/src/testes/loja-publica-tracking-http.test.ts`, `backend/src/testes/tiktok-live-connector-provider.test.ts` e `frontend/testes/loja-publica-fase1.test.ts`.

## [2026-05-31] frontend | Responsividade como regra transversal

- Atualizado `docs/RF-RNF-RN-EMEUV1.md` para versao 1.107: toda pagina deve ser mobile-first, sem grids fixos antes de breakpoints, com `min-w-0`, acoes principais visiveis no mobile e guardrail de teste quando houver risco de overflow.
- Ajustada a admin "Minha loja" em `frontend/src/paginas/LojaPublica.tsx` com shell responsivo, acoes mobile, grelhas iniciando em uma coluna e assistente com navegacao horizontal.
- Adicionado guardrail em `frontend/testes/mobile-ux.test.ts` para a responsividade da Loja Digital admin.

## [2026-05-27] memoria | Protocolo de atualizacao continua

- Criada a nota [[protocolo-atualizacao-memoria-bizy]] com regra permanente: qualquer mudanca relevante deve atualizar a memoria antes da resposta final.
- Atualizados [[guia-para-ia-bizy]], [[memoria-projeto-bizy]], [[schema]] e [[index]] para tornar o protocolo parte da primeira leitura de qualquer IA.
- Varredura rapida feita contra modulos HTTP, use cases, paginas frontend e endpoints declarados no codigo; a estrutura principal ja estava coberta.
- Atualizado [[inventario-operacao-testes]] com `skills-lock.json`, `.agents/` e as skills Obsidian instaladas.

## [2026-05-27] obsidian | Memoria refeita com skills Obsidian

- Instaladas as skills do repositorio `kepano/obsidian-skills` via `npx skills add https://github.com/kepano/obsidian-skills --all`.
- Criado `skills-lock.json` com `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli` e `obsidian-markdown`.
- Refeita a memoria principal em formato Obsidian com frontmatter, tags, callouts e `[[wikilinks]]`.
- Criadas notas tematicas: `guia-para-ia-bizy.md`, `visao-produto-bizy.md`, `dores-e-qualidades-bizy.md`, `mapa-de-modulos-bizy.md`, `dominio-e-entidades-bizy.md`, `fluxos-operacionais-bizy.md`, `arquitetura-e-guardrails-bizy.md` e `prioridades-lancamento-bizy.md`.
- Criado `bizy-memoria.canvas` com o mapa visual das notas de memoria e inventarios.
- Atualizados `index.md`, `README.md`, `schema.md` e `memoria-viva-bizy.md` para apontar para a nova memoria distribuida.
- Adicionado frontmatter Obsidian nas notas principais antigas da wiki para melhorar tags, aliases e descoberta no vault.
- O Obsidian CLI existe no sistema, mas a CLI do app ainda esta desativada em `Settings > General > Advanced`; as alteracoes foram feitas diretamente nos Markdown do vault.

## [2026-05-27] memoria | Briefing de produto para IA

- Criada a pagina `pages/memoria-projeto-bizy.md` como memoria principal de produto para outra IA entender o Bizy sem reler todo o repositorio.
- A memoria cobre identidade, visao, publico, dores resolvidas, qualidades essenciais, nucleo de dominio, modulos funcionais, arquitetura, experiencia frontend, estado atual, prioridades P0/P1 e principios de trabalho.
- Atualizadas ligacoes em `index.md`, memoria viva, estado atual e inventarios para que a nova memoria fique conectada ao grafo do projeto, nao isolada.

## [2026-05-27] grafos | Interligacao honesta entre paginas

- Adicionadas ligacoes laterais entre paginas da wiki para evitar que todo o grafo dependa apenas de `index.md`.
- Backend agora aponta para dados, frontend e operacao; dados aponta para backend, deploy e operacao; frontend aponta para backend, dados, operacao e memoria; deploy aponta para operacao, dados e backend.
- Atualizadas tambem as paginas de estado, organizacao e vault Obsidian para criarem relacoes naturais dentro do projeto.

## [2026-05-27] memoria | Inventario detalhado do sistema

- Criadas paginas de inventario detalhado: `inventario-sistema-bizy.md`, `inventario-backend-api.md`, `inventario-dados-prisma.md`, `inventario-frontend.md` e `inventario-operacao-testes.md`.
- O inventario cobre modulos HTTP, endpoints, use cases, modelos Prisma, migrations, rotas frontend, paginas roteadas/nao roteadas, componentes, scripts, Docker, n8n, Evolution, docs e testes.
- Atualizados `index.md` e `memoria-viva-bizy.md` para apontar para os inventarios antes de qualquer analise futura do que ja existe no sistema.

## [2026-05-27] memoria | Memoria viva do projeto

- Criada a pagina `pages/memoria-viva-bizy.md` com identidade do produto, stack, comandos, arquitetura backend, rotas frontend, integracoes, deploy, incidente recente de migrations e prioridades P0/P1.
- Atualizado `pages/bizy-estado-atual.md` para status ativo e link para a memoria operacional.
- Atualizado `index.md` para tornar a memoria viva a primeira entrada das sinteses do projeto.

## [2026-05-27] setup | Wiki inicial do Bizy

- Criada a estrutura `docs/wiki/` com `README.md`, `schema.md`, `index.md`, `log.md`, `pages/`, `raw/` e configuracao Obsidian minima.
- Criadas paginas sintetizadas para estado atual, organizacao de arquivos, vault Obsidian e deploy na VPS antiga.
- Criado o guia operacional `docs/DEPLOY_VPS_ANTIGA.md` no projeto Bizy/EMeu.
- Nenhum documento antigo foi movido; a wiki apenas indexa e sintetiza.
