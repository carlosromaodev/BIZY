# Estado da refatoracao Commerce

Revisao de origem: `72a575f25cdeb21b3b701f6d4f3578d98c3bdfa9`  
Documento-alvo: `BIZY-REFATORACAO-SOCIAL-COMMERCE-AFILIACAO-COMPRADOR-2026-07-14.md`

## Fase 0 — Auditoria tecnica e plano

Estado: CONCLUIDA

### Implementado

- [x] Documento-alvo lido integralmente e identificado por hash.
- [x] Codigo, schema, HTTP, use cases, repositorios, frontend e testes inventariados.
- [x] Funcionalidades completas, parciais e ausentes classificadas.
- [x] Riscos de seguranca e migration documentados.
- [x] Plano por ficheiro, rollback e testes definidos.

### Ficheiros alterados

- `docs/implementacao/commerce-refactor-auditoria.md`.
- `docs/implementacao/commerce-refactor-status.md`.

### Migrations

- Nenhuma; fase documental.

### Testes

- `npm run typecheck`: aprovado em backend e frontend.
- Testes backend focados em auth, checkout, Market e afiliados: 32 aprovados.

### Riscos restantes

- Endpoints publicos do comprador expostos por identificador ate o cutover da Fase 1.
- Identidades ainda separadas entre operador e cliente.

### Proxima fase

- Fase 1: conta universal e seguranca do comprador.

## Fase 1 — Conta universal e seguranca do comprador

Estado: CONCLUIDA

### Implementado

- [x] Schema expansivo e migration sem remocao de `UsuarioSistema`.
- [x] `ContaBizy` universal com contextos de comprador, afiliado, criador, seller, produtor Learning e membro de negocio.
- [x] Compatibilidade progressiva com `UsuarioSistema` e isolamento dos contextos por negocio.
- [x] OTP por telefone, limite por contacto, tentativas limitadas e codigo armazenado como hash.
- [x] Sessoes opacas, revogaveis e associadas a dispositivo, IP e user-agent anonimizados.
- [x] Perfil de comprador, enderecos, preferencias, consentimentos, dispositivos e favoritos persistentes.
- [x] Compra guest com token de alta entropia, hash, expiracao, ownership e revogacao apos associacao.
- [x] Associacao posterior de compras ao telefone verificado sem expor PII em URL ou resposta publica.
- [x] Portal autenticado e pagina de compra autorizada por conta ou token especifico da compra.
- [x] Remocao da rota e do use case que pesquisavam compras livremente por telefone ou email.
- [x] Testes negativos de IDOR, enumeracao, token expirado, token de outra compra e ownership de endereco.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260714223000_conta_bizy_comprador/migration.sql`.
- `backend/src/projetos/commerce/` para dominio, aplicacao, repositorios e HTTP da conta universal.
- `backend/src/infra/http/ContextoAplicacao.ts`, `criarAplicacao.ts` e manifesto de modulos.
- Contratos, tipos e repositorios de compras unificadas em memoria e Prisma.
- Checkout e portal do comprador em `backend/src/projetos/market/`.
- APIs e paginas de checkout, compra, portal e produto em `frontend/src/projetos/market/`.
- Testes de conta, checkout, Market e configuracao deterministica do Vitest.

### Migrations

- Expand: novas tabelas de conta, perfil, contexto, endereco, favorito, consentimento, dispositivo, sessao, OTP e acesso guest.
- Compatibilidade: FK opcional `CompraUnificada.contaBizyId` e backfill conservador de `UsuarioSistema`/`MembroNegocio`.
- Indices: contactos unicos, sessoes/tokens, contextos, ownership e expiracoes.
- Rollback: nao apagar tabelas com dados; desligar o modulo novo, manter dual read e remover FK/coluna apenas numa contract migration posterior.
- Validacao: 53 migrations aplicadas do zero numa base PostgreSQL descartavel; schema final actualizado.

### Testes

- `npm run typecheck`: backend e frontend aprovados.
- Backend focado: 21 testes aprovados.
- Backend integral sequencial: 368 aprovados e 1 ignorado.
- Frontend integral: 144 testes aprovados.
- `npm run build`: backend e frontend aprovados.
- Migration PostgreSQL do zero: 53/53 aplicadas e `migrate status` actualizado.
- Browser QA: OTP, login e logout aprovados em 1440x900; layout sem overflow e rodape no fim em 1440x900 e 375x812.
- Consola: nenhum erro de aplicacao ou resposta 5xx; apenas 401 esperados na sondagem de sessao anonima.

### Riscos restantes

- Contactos historicos foram migrados sem os marcar como verificados; a verificacao ocorre apenas por OTP.
- Email e persistido como contacto da identidade, mas nao concede autenticacao enquanto nao existir verificacao por provider dedicado.
- O upload privado de comprovativos e a reserva transacional de stock pertencem as Fases 2 e 3.

### Proxima fase

- Fase 2: produto, variantes reais, preco e stock por combinacao.

## Fase 2 — Produto, variantes e checkout

Estado: CONCLUIDA

### Implementado

- [x] Combinacoes de variante persistidas com seleccao canonica, SKU, preco, custo, stock, stock minimo e estado.
- [x] Migration expansiva com FKs opcionais em item de pedido e reserva de checkout.
- [x] Compatibilidade progressiva para produtos existentes e distribuicao conservadora do stock legado.
- [x] Endpoints tenant-aware para listar e configurar combinacoes no catalogo.
- [x] Editor Team para configurar stock, preco e SKU por combinacao em desktop e mobile.
- [x] Pagina de produto com seleccao real, disponibilidade, preco e limite de quantidade por combinacao.
- [x] Carrinho transporta a seleccao e o checkout recalcula preco e valida stock no backend.
- [x] Checkout directo de uma loja, entrega e WhatsApp usam a mesma combinacao, preco e stock validados no backend.
- [x] Item do pedido conserva a seleccao canonica e a FK da variante para devolucao e comissao.
- [x] Movimentos de stock por variante actualizam combinacao e total do produto numa unica transaccao.
- [x] Favorito do produto permanece persistido na conta Bizy autenticada.
- [x] Testes negativos de variante incompleta, inexistente, inactiva, stock insuficiente, preco manipulado e IDOR entre lojas.
- [x] Gate integral de typecheck, testes, build, migration local e QA visual.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260714234500_variantes_reais_produto/migration.sql`.
- `backend/src/dominio/servicos/VariantesProduto.ts`, tipos, esquemas e contratos de repositorio.
- Catalogo, pedidos, checkout unificado, checkout de loja e Market publico no backend, com repositorios Prisma e memoria equivalentes.
- `frontend/src/paginas/Catalogo.tsx`, produto do Market, loja publica e checkout Bizy.
- Testes de variantes, catalogo, checkout unificado, loja publica, afiliacao e formularios do frontend.

### Migrations

- Expand: metadados reais em `VariantePeca`, FK opcional em `ItemPedido` e campos de variante em `ReservaStockCheckout`.
- Backfill: combinacoes legadas que ja continham JSON sao copiadas para `opcoesJson`.
- Dual read: produtos historicos com definicoes mas sem linhas materializadas geram combinacoes uma unica vez, preservando a soma do stock agregado.
- Compatibilidade: pedidos historicos e produtos simples continuam validos; nenhuma coluna foi removida ou tornada obrigatoria.
- Rollback: desligar dual read e remover FKs, indices e colunas apenas depois de confirmar ausencia de dados dependentes.
- [x] 54 migrations aplicadas do zero numa base PostgreSQL descartavel.
- [x] Migration aplicada e validada na base local de desenvolvimento; `migrate status` actualizado.
- [x] Backfill legado validado no PostgreSQL: 4 combinacoes materializadas, stock 5 distribuido e total do produto mantido em 5.

### Testes

- [x] Backend focado: 34 testes aprovados em variantes, catalogo, checkout unificado e loja publica.
- [x] Frontend focado: 9 testes aprovados em catalogo e checkout.
- [x] Typecheck backend e frontend aprovado.
- [x] Backend integral: 373 testes aprovados e 1 ignorado.
- [x] Frontend integral: 144 testes aprovados.
- [x] Build backend e frontend aprovado; frontend com 2.781 modulos transformados.
- [x] Browser QA em 1440x900 e 375x812: variante `Preto / 40`, preco `24.000 Kz`, checkout directo coerente, sem erros de consola, respostas 5xx ou overflow.
- [x] Revisao visual das capturas: detalhe desktop em duas colunas e checkout mobile com largura integral, fundo opaco e estados seleccionados consistentes.

### Riscos restantes

- A reserva transaccional com TTL por variante e o carrinho server-side pertencem a Fase 3.
- Produtos com mais de 500 combinacoes sao rejeitados antes da persistencia para evitar explosao cartesiana.

### Proxima fase

- Fase 3: carrinho server-side, fusao entre dispositivos, reserva transaccional com TTL e upload privado de comprovativo.

## Fase 3 — Carrinho e checkout

Estado: CONCLUIDA

### Implementado

- [x] Carrinho server-side para convidado e conta autenticada, com token opaco armazenado como hash.
- [x] Importacao e fusao deterministica do carrinho local entre dispositivos.
- [x] Preco e stock recalculados no backend por loja e variante.
- [x] Reserva transaccional com TTL, renovacao, libertacao e proteccao contra overselling.
- [x] Conversao idempotente do carrinho em compra, com consumo de stock e auditoria.
- [x] Upload privado de comprovativo com validacao, scan e acesso autorizado do comprador ou seller.
- [x] Testes negativos, migrations, typecheck, testes, build e QA desktop/mobile.

### Ficheiros alterados

- `backend/prisma/schema.prisma`
- `backend/src/projetos/market/dominio/carrinhoCommerce.ts`
- `backend/src/projetos/market/aplicacao/CarrinhoCommerceUseCase.ts`
- `backend/src/projetos/market/infra/repositorios/RepositorioCarrinhosCommerceMemoria.ts`
- `backend/src/projetos/market/infra/repositorios/RepositorioCarrinhosCommercePrisma.ts`
- `backend/src/projetos/market/infra/http/moduloCheckoutUnificado.ts`
- `backend/src/projetos/market/aplicacao/CheckoutUnificadoUseCase.ts`
- `backend/src/infra/media/ScannerMedia.ts`
- `backend/src/infra/media/MediaStorage.ts`
- `frontend/src/projetos/market/api/checkoutUnificado.ts`
- `frontend/src/projetos/market/paginas/CheckoutBizy.tsx`
- `frontend/src/projetos/market/paginas/CompraUnificada.tsx`

### Migrations

- [x] `20260715003000_carrinho_server_side`: cria carrinhos e itens, associa conta, compra e reserva sem remover contratos legados.
- [x] Aplicada na base local e validada de raiz numa base PostgreSQL descartavel com as 55 migrations.
- [x] `prisma validate` executado com sucesso.

### Testes

- [x] Backend: 85 ficheiros e 377 testes passaram; 1 ficheiro e 1 teste ficaram ignorados conforme configuracao existente.
- [x] Frontend: 39 ficheiros e 144 testes passaram.
- [x] Concorrencia PostgreSQL real: duas reservas concorrentes nao excedem stock e sincronizacoes do mesmo carrinho convergem.
- [x] Seguranca: ownership do token, enumeracao uniforme, reutilizacao do carrinho, preco manipulado, overselling e PDF activo rejeitados.
- [x] `npm run typecheck` e `npm run build` passaram no backend e frontend.
- [x] QA em 1440x900 e 375x812 sem overflow, sobreposicoes, erros de consola ou falhas HTTP inesperadas.

### Riscos restantes

- O provider antivirus externo depende de credenciais futuras; o contrato e a configuracao estao prontos e o scanner local conservador permanece activo.
- O checkout inline legado permanece em dual read durante a migracao expand/cutover e sera removido apenas na Fase 12.

### Proxima fase

- Fase 4: Smart Links e tracking server-side da jornada publica.

## Fase 4 — Smart Links

Estado: CONCLUIDA

### Implementado

- [x] Rota canonica `GET /go/:codigo` com redireccionamento HTTP real e destino construido por allowlist.
- [x] Destinos suportados para produto, loja, colecao, conteudo, campanha, carrinho, mini-loja, formulario e produto Learning.
- [x] Sessao commerce opaca, reutilizavel por cookie seguro e armazenada exclusivamente como hash.
- [x] Clique, toque de atribuicao, campanha, conteudo, afiliado, produto e origem persistidos no servidor.
- [x] Contexto do Smart Link propagado para carrinho server-side e compra unificada sem confiar em atribuicao enviada pelo cliente.
- [x] Preview Open Graph e Twitter para crawlers sem criar clique ou sessao artificial.
- [x] URL publica gerada pela afiliacao migrada para `/go/:codigo`, preservando o endpoint JSON legado durante o dual read.
- [x] Proteccao contra open redirect, link expirado, parceiro suspenso, destino nao suportado e enumeracao diferenciada.
- [x] Testes negativos, migration, typecheck, suites integrais, builds e QA desktop/mobile concluidos.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715020000_smart_links_sessions/migration.sql`.
- `backend/src/projetos/market/dominio/smartLinksCommerce.ts`.
- `backend/src/projetos/market/aplicacao/SmartLinksCommerceUseCase.ts`.
- Repositorios Prisma e memoria de Smart Links, carrinho e compras unificadas.
- `backend/src/infra/http/modulos/afiliados.ts`, contexto HTTP, rate limit e seguranca de cookies commerce.
- `frontend/src/paginas/Afiliados.tsx` e contrato de dados de afiliacao.
- Configuracoes de ambiente e Compose para a base publica canonica dos Smart Links.

### Migrations

- [x] `20260715020000_smart_links_sessions`: cria sessoes commerce e toques de atribuicao e associa opcionalmente carrinho e compra.
- [x] Migration expand-only, com indices, FKs opcionais, estrategia de rollback e nenhuma remocao de dados legados.
- [x] Aplicada na base local; `prisma validate`, `prisma generate` e `migrate status` aprovados.
- [x] As 56 migrations foram aplicadas do zero numa base PostgreSQL descartavel e a base foi removida apos a validacao.

### Testes

- [x] Backend focado: Smart Links, afiliacao, carrinho, checkout e regressoes de auth/CRM aprovados.
- [x] Backend integral: 87 ficheiros e 381 testes passaram; 1 ficheiro e 1 teste ficaram ignorados conforme configuracao existente.
- [x] Frontend integral: 39 ficheiros e 144 testes passaram.
- [x] Integracao PostgreSQL real: token armazenado como hash, sessao reutilizada, toques auditados e associacao ao carrinho e compra.
- [x] Jornada HTTP real: Smart Link, cookie seguro, carrinho server-side e checkout concluida.
- [x] Seguranca: open redirect ignorado, resposta 404 uniforme, expiracao, parceiro suspenso e destino desconhecido rejeitados.
- [x] `npm run typecheck` e `npm run build` passaram no backend e frontend; frontend transformou 2.781 modulos.
- [x] QA em 1440x900 e 375x812: preview, redireccionamento, produto real, cookie HttpOnly, zero overflow, erros de consola ou falhas HTTP inesperadas.

### Riscos restantes

- As rotas publicas de conteudo compravel e carrinho partilhavel ficam reservadas na allowlist, mas so serao activadas pelas Fases 7 e 11.
- O dominio publico configurado em `PUBLIC_SMART_LINK_BASE_URL` deve apontar para o backend no ambiente de deploy; o fallback local permanece funcional.
- O endpoint JSON legado sera removido apenas no cutover da Fase 12, depois de confirmar ausencia de consumidores antigos.

### Proxima fase

- Fase 5: atribuicao comercial versionada, explicavel e ligada a conversoes.

## Fase 5 — Atribuicao comercial

Estado: CONCLUIDA

### Implementado

- [x] Politicas de atribuicao imutaveis por negocio, codigo, versao, modelo, janela e peso principal.
- [x] Versao derivada do snapshot efectivo, incluindo hash mesmo quando existe versao declarada, para impedir reutilizacao silenciosa de regras diferentes.
- [x] Conversao formal por pedido-filho com snapshot de politica, valor base, moeda, explicacao e participantes.
- [x] Primeiro toque, ultimo toque, conversao assistida e ajuste manual legado preservados.
- [x] Participantes com papel, toque, parceiro, link, peso em basis points, valor atribuido e motivo auditavel.
- [x] Pesos distribuidos deterministicamente e com soma exacta de 10.000 basis points.
- [x] Receita de link de produto limitada aos itens correspondentes; link de loja permanece elegivel ao subtotal completo.
- [x] Cross-device por conta Bizy verificada, sem misturar toques entre contas ou negocios.
- [x] Janela temporal, estado do link, expiracao e estado do parceiro revalidados no momento da conversao.
- [x] Idempotencia por `negocioId + pedidoId + tipo`, inclusive na recuperacao de retry apos compra ja criada.
- [x] Endpoint seller tenant-aware para consultar a explicacao da atribuicao de uma compra.
- [x] Eventos canonicos da jornada adicionados sem remover os eventos legados; carrinho e checkout emitem `ADD_TO_CART`, `CHECKOUT_STARTED`, `BUYER_IDENTIFIED` e `ORDER_CREATED` no servidor.
- [x] Funil, resumo comercial e ranking de afiliados reconhecem eventos canonicos e legados sem perder compatibilidade.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715040000_atribuicao_commerce_versionada/migration.sql`.
- `backend/src/projetos/market/dominio/atribuicaoCommerce.ts`.
- `backend/src/projetos/market/aplicacao/AtribuicaoCommerceUseCase.ts`.
- Repositorios Prisma e memoria de atribuicao e Smart Links.
- Contexto da aplicacao e modulo HTTP do checkout unificado.
- Tipos de tracking, resumos comerciais e gestao de afiliados.
- Testes HTTP, PostgreSQL, Smart Links e contrato semantico do schema.

### Migrations

- [x] `20260715040000_atribuicao_commerce_versionada`: cria politicas, conversoes e participantes sem alterar tabelas financeiras legadas.
- [x] Migration expand-only, sem backfill destrutivo, com indices de negocio, compra, pedido, sessao, conta, politica, parceiro, link e toque.
- [x] FKs de sessao, conta, parceiro, link e toque usam `SET NULL` quando a auditoria deve sobreviver; participante usa cascade apenas com a sua conversao.
- [x] Aplicada na base local; `prisma validate`, `prisma generate` e `migrate status` aprovados.
- [x] As 57 migrations foram aplicadas do zero numa base PostgreSQL descartavel, validadas e removidas apos o teste.

### Testes

- [x] Backend focado: 48 testes de atribuicao, Smart Links, checkout, tracking e afiliacao aprovados.
- [x] Backend integral: 89 ficheiros e 384 testes passaram; 1 ficheiro e 1 teste ficaram ignorados conforme configuracao existente.
- [x] Frontend integral: 39 ficheiros e 144 testes passaram.
- [x] PostgreSQL real: snapshots, participantes, cross-device, soma de pesos/valores, idempotencia e nova versao de politica persistidos.
- [x] Seguranca: endpoint de outro tenant devolve 404; sessao ligada a outra conta nao e reutilizada; toques expirados, links inactivos e parceiros suspensos sao excluidos.
- [x] Regressao financeira: pedido com 30.000 Kz e link de produto de 18.000 Kz atribui apenas 18.000 Kz.
- [x] `npm run typecheck`, `npm test` e `npm run build` passaram no backend e frontend; frontend transformou 2.781 modulos.
- [x] QA em 1440x900 e 375x812: Market sem overflow, erros de consola, respostas 5xx ou regressao visual; rodape permanece no final do conteudo.

### Riscos restantes

- Eventos de conteudo, live, comissao e payout ja pertencem ao contrato canonico, mas os produtores reais entram nas Fases 7, 9 e 11.
- Comissoes continuam no modelo financeiro legado ate o ledger imutavel da Fase 9; a conversao da Fase 5 apenas congela a evidencia de atribuicao.
- O resolver legado de referencia permanece em dual read para checkouts antigos e sera removido apenas no cutover da Fase 12.

### Proxima fase

- Fase 6: portal autenticado de criadores e afiliados com dados reais.

## Fases 6 a 12

Estado: NAO INICIADAS

- [ ] Fase 6 — Portal Creator e afiliados.
- [ ] Fase 7 — Conteudo compravel.
- [ ] Fase 8 — Creator Marketplace.
- [ ] Fase 9 — Ledger, comissoes e payouts.
- [ ] Fase 10 — Confianca, risco e proteccao.
- [ ] Fase 11 — Live afiliada e carrinhos partilhaveis.
- [ ] Fase 12 — Consolidacao, testes e remocao de legado.

O detalhe de cada fase sera aberto apenas quando a fase anterior cumprir migrations, autorizacao, testes negativos, typecheck, testes e build.
