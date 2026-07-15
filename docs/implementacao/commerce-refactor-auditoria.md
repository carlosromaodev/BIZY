# Auditoria tecnica da refatoracao Commerce

Data: 2026-07-14  
Documento-alvo: `BIZY-REFATORACAO-SOCIAL-COMMERCE-AFILIACAO-COMPRADOR-2026-07-14.md`  
Hash SHA-256 do documento: `06f03970a9f2dcaf2bfa0407948f11b5da8c5caa9edaf2fcb943520cd7dafaf3`

## Revisao analisada

- Branch: `main`.
- Commit: `72a575f25cdeb21b3b701f6d4f3578d98c3bdfa9`.
- Estado inicial: worktree limpo e alinhado com `origin/main`.
- Linha de base: typecheck backend/frontend aprovado; 32 testes de autenticacao, Market, checkout e afiliados aprovados.

## Inventario

### Identidade e seguranca

- `backend/prisma/schema.prisma`: `UsuarioSistema`, `IdentidadeAutenticacao`, `CodigoLoginSms`, `SessaoUsuario`, `ClienteGlobal`, `ClienteNegocio` e `MembroNegocio`.
- `backend/src/infra/http/modulos/autenticacao.ts`: OTP por telefone, Google, sessao, workspaces e onboarding.
- `backend/src/use-case/AutenticacaoTelefoneUseCase.ts`: normalizacao de telefone, hash do OTP, verificacao e sessao.
- `backend/src/infra/http/seguranca.ts`: cookie HttpOnly, JWT, issuer/audience e autenticacao de rotas.
- `backend/src/infra/http/rateLimit.ts`: limite por IP, metodo e rota, com memoria ou Redis REST.
- `backend/src/dominio/repositorios/contratos.ts`: contrato actual de autenticacao e sessoes.
- `backend/src/use-case/repositorios/RepositorioPrisma.ts` e `RepositorioMemoria.ts`: persistencia real e dupla de testes.

### Market, checkout e comprador

- Nove ficheiros em `backend/src/projetos/market/`: catalogo publico, loja publica, checkout multi-loja e repasses.
- Vinte e seis ficheiros em `frontend/src/projetos/market/`: Market, produto, checkout, portal do comprador, compra e portal seller.
- `backend/src/projetos/market/aplicacao/CheckoutUnificadoUseCase.ts`: precos no backend, pedidos-filho, IVA, entrega, repasses e estados.
- `backend/src/projetos/market/infra/http/moduloCheckoutUnificado.ts`: checkout guest e portais comprador/seller.
- `frontend/src/projetos/market/api/checkoutUnificado.ts`: carrinho e identificador do comprador em `localStorage`.
- `frontend/src/projetos/market/paginas/PortalComprador.tsx`: consulta por telefone/email sem prova de posse.
- `frontend/src/projetos/market/paginas/CompraUnificada.tsx`: detalhe e comprovativo dependentes do mesmo identificador.
- `frontend/src/rotasApp.tsx`: rotas publicas `/compras` e `/compras/:id`.

### Afiliacao e creator commerce

- `backend/src/infra/http/modulos/afiliados.ts`: gestao tenant-aware, links publicos, mini-loja e tracking existente.
- `backend/src/use-case/GestaoAfiliadosUseCase.ts`: parceiros, regras, links, comissoes, lotes, ranking e materiais.
- `frontend/src/paginas/Afiliados.tsx`: consola interna do seller; nao e um portal publico do creator.
- Schema existente: `ParceiroComercial`, `LinkAfiliado`, `ComissaoParceiro`, `HistoricoComissaoParceiro`, `LotePagamentoComissao` e itens do lote.

### Testes relacionados

- `backend/src/testes/auth-cookie-http.test.ts`.
- `backend/src/testes/checkout-unificado.test.ts`.
- `backend/src/testes/bizy-market-http.test.ts`.
- `backend/src/testes/bizy-market-fase2-3.test.ts`.
- `backend/src/testes/afiliados-http.test.ts`.
- Testes frontend de checkout, loja publica, Market e afiliados em `frontend/testes/`.

## Estado funcional

Os itens abaixo mantem o inventario de origem; a marcacao foi actualizada apos as fases verificadas.

### Completo e preservado

- [x] OTP por telefone com codigo hasheado, expiracao, tentativas e revogacao de codigos anteriores.
- [x] Sessao interna com token hasheado, cookie HttpOnly e revogacao individual.
- [x] Membro de varios negocios com isolamento tenant nas rotas internas.
- [x] Checkout guest multi-loja com pedidos-filho por fornecedor.
- [x] Recalculo de preco e verificacao basica de stock no backend.
- [x] Idempotencia de checkout por comprador e chave.
- [x] Repasses, retencao inicial, reembolsos e historico basico de comissao.
- [x] Links de afiliacao e mini-loja com destinos de produto/loja existentes.

### Parcial

- [x] Identidade: `ContaBizy` universal criada com compatibilidade para `UsuarioSistema` e contextos de negocio.
- [x] Sessao: dispositivo, revogacao, motivo e metadados anonimizados implementados na conta Bizy.
- [x] OTP: associacao segura de compra guest a conta de comprador implementada por contacto verificado.
- [x] Compra: FK opcional de conta e perfil de comprador disponiveis sem quebrar snapshots historicos.
- [x] Variantes: entidade de combinacao, preco e stock real ligada ao carrinho, checkout e item do pedido.
- [x] Reserva: lacuna fechada na Fase 3 com variante, TTL e transacao unica entre stock, reserva e pedido.
- [x] Afiliacao: lacuna fechada nas Fases 6, 8 e 9 com portal Creator, marketplace e ledger imutavel.
- [x] Tracking: lacuna fechada nas Fases 4 e 5 com sessao commerce, eventos canonicos e atribuicao explicavel versionada.

### Ausente

- [x] `ContaBizy` universal, contactos verificados, contextos, perfil do comprador, enderecos, preferencias, consentimentos e dispositivos.
- [x] Token guest especifico por compra, de alta entropia, hasheado, expiravel e revogavel.
- [x] Portal de comprador autenticado e associacao pos-compra por OTP.
- [x] Carrinho server-side e sincronizacao/fusao entre dispositivos implementados na Fase 3.
- [x] Upload privado e scan de comprovativo implementados na Fase 3.
- [x] Smart Links canonicos `/go/:codigo` e preview social implementados na Fase 4.
- [x] Conteudo compravel, Creator Marketplace, ofertas, candidaturas, amostras e missoes implementados nas Fases 7 e 8.
- [x] Ledger imutavel completo, colaboracao, payouts e disputas financeiras implementados na Fase 9.
- [x] Avaliacao verificada, buyer/creator/seller score e proteccao do comprador implementados na Fase 10.
- [x] Live afiliada e carrinhos partilhaveis implementados na Fase 11.

## Riscos encontrados na auditoria inicial e resolvidos

### Seguranca

1. [x] Consulta publica por identificador removida; o portal exige sessao autenticada.
2. [x] Compras consultadas por sessao ou token guest hasheado, expiravel e restrito a uma compra.
3. [x] Alteracoes de pagamento exigem ownership e contexto autorizado.
4. [x] PII removida de query strings e da identidade persistida no navegador.
5. [x] OTP limitado por contacto, IP e finalidade, com sessoes revogaveis.
6. Alto: `SessaoUsuario` nao conserva revogacao, dispositivo ou trilho de seguranca; apagar a linha perde o historico.
7. Medio: `criarOuAtualizarUsuario` cria/actualiza `UsuarioSistema` antes da verificacao do OTP, permitindo dados nao verificados no cadastro interno.
8. Medio: comprovativo e uma URL HTTPS fornecida pelo utilizador; nao ha upload privado, validacao de ficheiro ou scan.

### Migracao

- Duplicar `UsuarioSistema`, `ClienteGlobal` e uma nova conta sem chaves de compatibilidade criaria tres identidades concorrentes.
- Unificar contactos directamente pode falhar em dados antigos com telefone/email divergentes ou compartilhados.
- Tornar `contaId` obrigatorio na compra quebraria checkout guest e dados historicos.
- Remover rotas inseguras antes de disponibilizar token guest e sessao autenticada quebraria links de compras recentes.
- Backfill automatico por contacto nao verificado pode associar compras a uma pessoa errada; so contactos comprovados podem consolidar contas.

## Dependencias entre fases

1. Fase 1 cria a raiz de identidade, sessao e ownership usada por todas as demais fases.
2. Fase 2 precisa de variante persistida antes da reserva/carrinho da Fase 3.
3. Fases 4 e 5 dependem de sessao commerce e identidade para atribuicao cross-device.
4. Fases 6 a 8 reutilizam `ContaBizy` e contextos, sem nova autenticacao paralela.
5. Fase 9 depende da atribuicao versionada e dos participantes das Fases 5 a 8.
6. Fases 10 e 11 dependem de ownership, ledger e tracking ja estabilizados.

## Plano por ficheiro

### Fase 1

- `backend/prisma/schema.prisma`: adicionar `ContaBizy`, contactos, contextos, perfil, enderecos, consentimentos, dispositivos, sessoes e tokens guest; expandir compra com relacoes opcionais.
- `backend/prisma/migrations/20260714*_conta_bizy_comprador/`: migration somente expansiva, indices, backfill de compatibilidade e rollback documentado.
- `backend/src/dominio/tipos.ts`: tipos da conta, perfil, sessao e acesso guest.
- `backend/src/dominio/repositorios/contratos.ts`: repositorio de identidade universal e ownership de compras.
- `backend/src/use-case/repositorios/RepositorioPrisma.ts`: transaccoes, unicidade de contactos verificados e consultas por conta/token.
- `backend/src/use-case/repositorios/RepositorioMemoria.ts`: comportamento equivalente para testes.
- `backend/src/use-case/ContaBizyUseCase.ts`: OTP do comprador, sessao, dispositivos, associacao de compra e revogacao.
- `backend/src/infra/http/modulos/contaBizy.ts`: rotas passwordless e portal autenticado, sem regras de negocio no handler.
- `backend/src/projetos/market/aplicacao/CheckoutUnificadoUseCase.ts`: emitir token guest e associar compra ao perfil/conta.
- `backend/src/projetos/market/infra/http/moduloCheckoutUnificado.ts`: retirar identificador publico e exigir conta ou token por compra.
- `backend/src/infra/http/ContextoAplicacao.ts` e manifesto HTTP: wiring do novo repositorio/use case/modulo.
- `frontend/src/projetos/market/api/`: API de conta, cookies e token guest por compra; eliminar contacto em query string.
- `frontend/src/projetos/market/paginas/PortalComprador.tsx`: login OTP e compras da sessao.
- `frontend/src/projetos/market/paginas/CompraUnificada.tsx`: detalhe por sessao ou token guest restrito.
- `frontend/src/projetos/market/paginas/CheckoutBizy.tsx`: guardar token guest devolvido e oferecer associacao por OTP.
- `backend/src/testes/conta-bizy-http.test.ts`: conta, OTP, associacao, revogacao, IDOR e enumeracao.
- Testes existentes de checkout: migrar contratos antigos para o acesso seguro.

### Fases 2 a 12

- Evoluir os mesmos modulos de Market, afiliacao e tracking; criar novos dominios somente onde o inventario confirmou ausencia.
- Cada fase tera migration expansiva, contratos/use cases, HTTP, frontend real e testes antes da proxima.

## Estrategia de migration

1. Expand: criar tabelas e FKs opcionais sem remover colunas antigas.
2. Backfill: criar conta de compatibilidade para `UsuarioSistema`; ligar `ClienteGlobal` apenas quando o contacto for inequivoco.
3. Dual read: resolver conta por sessao nova e por ligacao ao utilizador interno.
4. Dual write: novas autenticacoes mantem a compatibilidade e novas compras guardam snapshot mais FK quando identificadas.
5. Validacao: medir compras sem conta, conflitos de contacto e sessoes activas.
6. Cutover: frontend e API deixam de enviar PII em URLs.
7. Contract: remocao das rotas/colunas antigas somente na Fase 12 e depois da janela de compatibilidade.

## Rollback

- A migration da Fase 1 nao elimina nem torna obrigatoria nenhuma coluna actual.
- Em rollback de aplicacao, o commit anterior ignora as novas tabelas e continua a usar `UsuarioSistema`, `SessaoUsuario` e snapshots da compra.
- Tokens/sessoes novos podem ser revogados em lote sem afectar sessoes internas antigas.
- O rollback SQL recomendado remove primeiro FKs/indices novos e depois tabelas novas, apenas se nao houver escrita em producao; com dados reais, manter as tabelas e reverter somente o codigo.
- Rotas antigas nao serao removidas sem cutover; durante a Fase 1, deixam de aceitar PII e respondem com o mesmo 404 generico.

## Testes a adicionar

- [x] Unicidade de telefone/email verificado e coexistencia de contextos.
- [x] OTP correcto, incorrecto, expirado, reutilizado e limitado por contacto.
- [x] Sessao activa, expirada, revogada, de outro dispositivo e revogacao global.
- [x] Checkout guest devolve somente token opaco e persiste apenas hash.
- [x] Token guest acessa uma compra e nunca outra.
- [x] Conta autenticada lista apenas compras associadas.
- [x] Associacao pos-compra exige OTP do contacto da compra.
- [x] Respostas para compra inexistente, token errado e ownership errado sao indistinguiveis.
- [x] Nenhuma rota de comprador recebe telefone/email em query string.
- [x] Compatibilidade: operador Team autenticado resolve a mesma `ContaBizy` sem perder negocios.

## Criterio de saida da Fase 1

- Migration validada numa base de teste.
- Typecheck, testes e build aprovados.
- Testes negativos de IDOR, enumeracao, token expirado e token de outra compra aprovados.
- Portal do comprador usa sessao autenticada; compra guest usa token restrito.
- Status e inventario actualizados com riscos restantes reais.
