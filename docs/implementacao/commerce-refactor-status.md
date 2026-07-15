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
- O carrinho server-side e o caminho primario; a entrada inline permanece apenas como contrato de checkout direto e todos os precos, variantes e stock sao recalculados no backend.

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
- [x] URL publica gerada pela afiliacao migrada para `/go/:codigo`; o caminho publico fecha a jornada por redireccionamento HTTP real.
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
- O endpoint JSON legado deixou de ser contrato publico; `/go/:codigo` e a unica rota canonica de Smart Link.

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
- O resolvedor de referencias historicas permanece encapsulado no caso de uso para interpretar vendas antigas; novas sessoes e conversoes usam exclusivamente o grafo versionado.

### Proxima fase

- Fase 6: portal autenticado de criadores e afiliados com dados reais.

## Fase 6 — Portal Creator e afiliados

Estado: CONCLUIDA

### Implementado

- [x] Parceiro comercial ligado opcionalmente a uma ContaBizy sem quebrar identidades legadas.
- [x] Associacao progressiva apenas por telefone previamente verificado por OTP.
- [x] Uma conta pode operar como comprador, afiliado e criador em varios negocios.
- [x] Portal autenticado em todas as rotas `/creator` previstas, com shell responsivo unico.
- [x] Metricas reais de visualizacoes, cliques, checkouts, pedidos, receita, comissoes, pagamentos e reversoes.
- [x] Criacao de Smart Links restrita aos perfis pertencentes a conta autenticada.
- [x] Nenhuma receita inferida por multiplicadores ou constante arbitraria.
- [x] Respostas uniformes para perfil de outra conta e testes negativos de IDOR.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715053000_creator_portal_identity/migration.sql`.
- `backend/src/projetos/market/aplicacao/CreatorPortalUseCase.ts`.
- `backend/src/projetos/market/infra/http/moduloCreatorPortal.ts`.
- Contratos e repositorios de afiliados em memoria e Prisma.
- `frontend/src/projetos/market/paginas/CreatorPortal.tsx`, API, rotas e estilos Market.

### Migrations

- [x] Expand-only com FK `SET NULL`, indice por conta/estado e unicidade por negocio/conta.
- [x] Migration aplicada na base local e 58 migrations aplicadas do zero numa base PostgreSQL descartavel.

### Testes

- [x] Backend integral: 90 ficheiros e 385 testes passaram; 1 ficheiro e 1 teste ignorados.
- [x] Frontend integral: 39 ficheiros e 144 testes passaram.
- [x] Typecheck e build aprovados no backend e frontend.
- [x] QA em 1440x900 e 375x812: login OTP, dashboard, quatro KPIs, zero overflow e zero resposta 5xx.
- [x] Erros de consola limitados aos 401 esperados da sondagem anonima antes do login.

### Riscos restantes

- Oportunidades, conteudos, missoes e carrinhos aparecem na navegacao, mas so recebem dados operacionais nas Fases 7, 8 e 11.
- Parceiros historicos sem contacto verificado sao associados sob demanda por OTP; o sistema nao faz vinculacao automatica insegura por similaridade de contacto.

### Proxima fase

- Fase 7: conteudo compravel formal, produtos multi-loja e rota publica `/c/:slug`.

## Fase 7 — Conteudo compravel

Estado: CONCLUIDA

### Implementado

- [x] Dominio formal para video, Reel, Story, publicacao, live, review, tutorial, colecao, carrinho e unboxing.
- [x] Conteudo ligado a criador/afiliado, seller, produtos reais, variantes, media, divulgacao, moderacao, metricas e Smart Link.
- [x] Criacao autenticada no portal Creator com associacao retroactiva por contacto verificado.
- [x] Moderacao tenant-aware pelo seller e resposta uniforme para tentativa de IDOR.
- [x] Rota publica `/c/:slug` com dados reais, divulgacao comercial explicita e produtos de varias lojas.
- [x] Produtos indisponiveis ou variantes invalidas sao rejeitados no backend.
- [x] Visualizacao publica emite `CONTENT_VIEW` e conserva a evidencia do parceiro e Smart Link.
- [x] Frontend editorial responsivo alinhado ao design canonico do Market, sem navegacao inferior mobile.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715070000_conteudo_compravel/migration.sql`.
- `backend/src/projetos/market/dominio/conteudoCommerce.ts`.
- `backend/src/projetos/market/aplicacao/ConteudoCompravelUseCase.ts`.
- Repositorios Prisma e memoria, contexto da aplicacao e modulo HTTP Creator.
- `frontend/src/projetos/market/paginas/ConteudoCompravel.tsx`, portal Creator, API, rotas e estilos Market.
- `backend/src/testes/conteudo-compravel-http.test.ts`.

### Migrations

- [x] `20260715070000_conteudo_compravel`: cria conteudos e produtos associados sem remover contratos legados.
- [x] FKs de produto, variante, parceiro, negocio e Smart Link com indices de publicacao e ownership.
- [x] Migration aplicada na base local e 59 migrations aplicadas desde zero num schema PostgreSQL descartavel.
- [x] Schema de verificacao removido depois da validacao.

### Testes

- [x] Integracao HTTP: conta Creator, seleccao multi-loja, produto invalido, estado previo a moderacao, IDOR e publicacao.
- [x] Backend integral aprovado, incluindo todas as regressoes das Fases 1 a 6.
- [x] Frontend integral: 39 ficheiros e 144 testes aprovados.
- [x] Typecheck e build aprovados no backend e frontend.
- [x] QA em 1440x900 e 375x812: quatro produtos reais, cinco imagens carregadas, zero overflow e zero erro de consola.
- [x] Divulgacao comercial, rodape e rotas canonicas de produto confirmados no browser.

### Riscos restantes

- Upload de media do criador reutilizara o armazenamento privado quando a politica de moderacao de video for definida; URLs HTTPS continuam validadas nesta fase.
- Oportunidades, amostras e missoes pertencem ao Creator Marketplace da Fase 8.

### Proxima fase

- Fase 8: Creator Marketplace com ofertas, candidaturas, amostras e missoes.

## Fase 8 — Creator Marketplace

Estado: CONCLUIDA

### Implementado

- [x] Ofertas publicadas por sellers com produtos e variantes reais, comissao em basis points, periodo, stock de amostras e criterios.
- [x] Descoberta autenticada de oportunidades validas no portal Creator.
- [x] Candidaturas cross-tenant com origem auditavel e decisao exclusiva do seller proprietario.
- [x] Aprovacao cria ou reutiliza o parceiro comercial da mesma ContaBizy no negocio de destino.
- [x] Solicitacao de amostra com stock atomico e proteccao contra duplicacao.
- [x] Missoes e participacao idempotente do criador.
- [x] Dados reais nas paginas de oportunidades, produtos, campanhas e missoes.
- [x] Gestao Team integrada em `/app/afiliados`, sem receita ou vendas inferidas por multiplicadores.
- [x] Rotas API separadas das rotas SPA para evitar intercepcao indevida pelo proxy de desenvolvimento.
- [x] Ownership, tenant isolation, estados e datas validados no backend.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715110000_creator_marketplace/migration.sql`.
- Dominio, use case e repositorios Prisma/memoria do Creator Marketplace em `backend/src/projetos/market/`.
- Contexto da aplicacao e modulo HTTP do portal Creator.
- `frontend/src/projetos/market/paginas/CreatorPortal.tsx`, API, estilos e proxy.
- `frontend/src/paginas/Afiliados.tsx` para operacao seller no Team.
- `backend/src/testes/creator-marketplace-http.test.ts` e ajustes de contratos das rotas Creator.

### Migrations

- [x] `20260715110000_creator_marketplace`: cria ofertas, produtos elegiveis, candidaturas, amostras, missoes e participacoes sem remover estruturas existentes.
- [x] Aplicada na base local; 60 migrations aplicadas do zero num schema PostgreSQL descartavel e schema removido apos validacao.
- [x] FKs, indices, unicidade de amostra/participacao e origem cross-tenant documentados com rollback nao destrutivo.

### Testes

- [x] Integracao HTTP das Fases 6 a 8: portal, conteudo compravel e Creator Marketplace aprovados.
- [x] Backend integral deterministico: 92 ficheiros e 387 testes aprovados; 1 ficheiro e 1 teste ignorados conforme configuracao existente.
- [x] Frontend integral: 39 ficheiros e 144 testes aprovados.
- [x] Typecheck e build aprovados no backend e frontend.
- [x] QA Creator em 1440x900 e 375x812 e Team seller em 1440x900: ofertas reais, candidatura, gestao e zero overflow ou erro de consola.

### Riscos restantes

- A movimentacao financeira das comissoes ainda depende do modelo legado e sera substituida pelo ledger imutavel da Fase 9.
- Integracao logistica externa para envio de amostras exige provider futuro; estado, stock e auditoria ja estao persistidos.

### Proxima fase

- Fase 9: ledger imutavel, distribuicao colaborativa, retencoes e payouts.

## Fase 9 — Ledger, comissoes e payouts

Estado: CONCLUIDA

### Implementado

- [x] Ledger imutavel com os onze tipos obrigatorios de movimento e saldos derivados exclusivamente do extrato.
- [x] Saldos estimado, confirmado, retido, disponivel, em pagamento, pago, revertido e em disputa.
- [x] Distribuicao colaborativa entre criador, afiliado, host, closer, vendedor, recuperacao e campanha.
- [x] Pesos validados em exactamente 10.000 basis points e arredondamento com soma exacta do valor distribuido.
- [x] Limites de margem e comissao maxima validados antes do credito.
- [x] Politica e versao congeladas em cada distribuicao e movimento.
- [x] Retencao, libertacao, payout, confirmacao e estorno idempotentes.
- [x] Dual write nas criacoes, confirmacoes, reversoes e pagamentos do modelo legado.
- [x] Backfill conservador de comissoes e payouts historicos sem alterar os registos de origem.
- [x] Portal Creator passou a apresentar saldos e movimentos reais do ledger.
- [x] Operacoes Team tenant-aware com permissao financeira e respostas uniformes contra IDOR.

### Ficheiros alterados

- `backend/prisma/schema.prisma` e `backend/prisma/migrations/20260715133000_ledger_comissoes/migration.sql`.
- Dominio, use case e repositorios Prisma/memoria do ledger em `backend/src/projetos/market/`.
- `backend/src/use-case/GestaoAfiliadosUseCase.ts` para dual write do caminho legado.
- Contexto da aplicacao e modulo HTTP Creator/Team.
- Portal Creator e contrato frontend do extrato financeiro.
- Testes unitarios e HTTP do ledger.

### Migrations

- [x] `20260715133000_ledger_comissoes` aplicada localmente e validada desde zero com as 61 migrations.
- [x] Backfill usa chaves idempotentes iguais ao dual write e preserva estados historicos.
- [x] Trigger PostgreSQL rejeita `UPDATE` e `DELETE` em `MovimentoLedgerComissao`; tentativa real falhou conforme esperado.
- [x] Primeira tentativa local foi revertida integralmente por erro de nome num indice, corrigida e reaplicada sem perda de dados.

### Testes

- [x] Unitarios e HTTP: distribuicao, pesos, arredondamento, margem, saldo, retencao, payout repetido e tenant isolation.
- [x] Backend integral: 94 ficheiros e 390 testes aprovados; 1 ficheiro e 1 teste ignorados.
- [x] Frontend integral: 39 ficheiros e 144 testes aprovados.
- [x] Typecheck e build aprovados sequencialmente no backend e frontend; frontend com 2.786 modulos transformados.
- [x] QA real em 1440x900 e 375x812: cinco movimentos, payout confirmado, zero overflow e apenas `401` esperado antes do OTP.

### Riscos restantes

- O provider bancario externo nao foi definido; o payout fica em processamento ate confirmacao humana e nao finge integracao automatica.
- O dual write ficou restrito a operacoes historicas encapsuladas; saldos, retencoes e payouts do portal usam exclusivamente o ledger imutavel.

### Proxima fase

- Fase 10: confianca, risco, disputas e proteccao do comprador.

## Fase 10 — Confianca, risco e proteccao

Estado: CONCLUIDA

### Implementado

- [x] Avaliacao verificada apenas para ContaBizy proprietaria de pedido entregue.
- [x] Produto avaliado deve pertencer ao pedido; duplicacao bloqueada por conta, pedido e produto.
- [x] Seller score versionado e recalculado a partir de avaliacoes verificadas.
- [x] Casos de risco com severidade, score, sinais, evidencias e revisao humana.
- [x] Deteccao de autoindicacao, contas relacionadas, cliques artificiais, multiplas contas, comprovativo repetido, abuso de cupoes, devolucoes anormais, manipulacao de atribuicao e payout duplicado.
- [x] Proteccao do comprador ligada a compra autenticada, pedido e evidencias.
- [x] Operacao Team tenant-aware para analisar, listar e decidir casos.
- [x] Denuncias, disputas e retencoes existentes preservadas como fluxo operacional.

### Migrations

- [x] `20260715160000_confianca_risco_protecao` aplicada localmente como expand-only.
- [x] Constraints de notas e scores, unicidade de avaliacao e indices de revisao/ownership.

### Testes

- [x] Testes de limiar, severidade, sinais combinados, pedido entregue e produto alheio ao pedido.
- [x] Typecheck e build backend aprovados.

### Riscos restantes

- Regras de risco sao versionaveis no codigo, mas calibracao estatistica depende de volume produtivo e revisao de falsos positivos.
- Evidencias externas continuam sujeitas ao scanner e armazenamento privado implementados na Fase 3.

### Proxima fase

- Fase 11: live afiliada e carrinhos partilhaveis.

## Fase 11 — Live afiliada e carrinhos partilhaveis

Estado: CONCLUIDA

### Implementado

- [x] Carrinho partilhavel canonico para afiliado, vendedor, comprador, criador, campanha e orcamento.
- [x] Snapshot auditavel com expiracao, estado, visualizacoes e importacoes.
- [x] Criacao autenticada no portal Creator com produtos e variantes revalidados pelo carrinho server-side.
- [x] Rota publica `/carrinhos/:codigo` e importacao para carrinho guest ou autenticado.
- [x] Seller, variante, parceiro, campanha, live e papel do host preservados em cada item.
- [x] Destaque unico e tenant-aware de produto em live activa.
- [x] Pagina publica responsiva no design canonico Market, com divulgacao de comissao.
- [x] Smart Links para carrinho passam a fechar a jornada publica ja prevista na Fase 4.

### Migrations

- [x] `20260715173000_live_carrinhos_partilhaveis` aplicada localmente como expand-only.
- [x] Indices por codigo, owner, parceiro, negocio e live.

### Testes

- [x] Importacao multi-loja, atribuicao de host e isolamento de live/produto por tenant.
- [x] Typecheck backend/frontend e build frontend aprovados.
- [x] QA em 1440x900 e 375x812: dois produtos reais, zero overflow, zero erro de consola e redirecionamento ao checkout.

### Riscos restantes

- Streaming de video continua a cargo do provider de live; o Bizy controla produto destacado, carrinho, tracking, pedido e comissao.

### Proxima fase

- Fase 12: consolidacao, contrato seguro, testes finais e remocao de legado.

## Fase 12

Estado: CONCLUIDA

### Implementado

- [x] Fase 12 — Consolidacao, testes e remocao de legado.
- [x] `/team/loja/*` consolidado como unico contrato operacional; `/crm/loja/*` e exports frontend `Crm` removidos.
- [x] Parser duplicado de publicacao removido; `SalvarConfiguracaoLojaPublicaSchema` e a unica validacao da configuracao.
- [x] Checklists da auditoria inicial reconciliados com as Fases 1 a 11, sem itens pendentes falsamente marcados.
- [x] Matriz final de autorizacao cobre portal Creator, ledger, risco, avaliacoes, carrinhos e codigos publicos inexistentes.
- [x] Carrinho partilhavel alinhado ao cabecalho, busca, navegacao e rodape canonicos do Market.
- [x] Reconciliacao local: 45 contas, 14 parceiros, zero comissoes legadas pendentes, 10 movimentos no ledger e zero compras guest sem associacao.
- [x] Parceiros sem conta continuam protegidos: associacao somente apos contacto verificado por OTP.

### Ficheiros alterados

- Modulos HTTP e schemas Market no backend.
- APIs, tipos, pagina e estilos Market no frontend.
- Testes de Market e `commerce-refactor-seguranca-final.test.ts`.
- Requisitos, SDD, wiki e documentos de implementacao commerce.

### Migrations

- [x] Nenhuma migration destrutiva adicionada no cutover de rotas e exports.
- [x] As 63 migrations foram aplicadas do zero numa base PostgreSQL descartavel e a base foi removida apos a validacao.

### Testes

- [x] Backend: typecheck e build aprovados; 97 ficheiros e 396 testes passaram, com 1 ficheiro e 1 teste ignorados pela configuracao existente.
- [x] Frontend: typecheck e build aprovados; 39 ficheiros e 144 testes passaram.
- [x] QA Playwright em 1440x900 e 375x812 para Market, Creator, Compras e carrinho partilhavel: zero overflow, erro de consola ou falha HTTP inesperada.
- [x] Carrinho partilhavel revalidado com cabecalho e rodape presentes nos dois viewports.

### Riscos restantes

- Provider bancario ainda nao definido: payout permanece em processamento ate confirmacao humana.
- Antivirus externo depende de credenciais; o contrato e o scanner local conservador permanecem activos.
- Streaming, logistica e meios de pagamento externos dependem dos respectivos providers; o dominio Bizy nao simula confirmacao externa.
- Dez parceiros locais ainda nao possuem uma ContaBizy verificada correspondente e serao associados por OTP quando entrarem no portal.

### Proxima fase

- Nenhuma fase funcional pendente neste plano. Proximo passo operacional: configurar providers reais, executar deploy e monitorar o cutover em producao.
