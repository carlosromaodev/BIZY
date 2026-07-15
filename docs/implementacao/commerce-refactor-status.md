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

## Fases 4 a 12

Estado: NAO INICIADAS

O detalhe de cada fase sera aberto apenas quando a fase anterior cumprir migrations, autorizacao, testes negativos, typecheck, testes e build.
