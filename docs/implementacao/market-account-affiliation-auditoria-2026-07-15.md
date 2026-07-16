# Bizy Market - tratamento da auditoria de conta, afiliacao e marketplace

Documento de origem: `BIZY-MARKET-ORIENTACAO-CONTA-AFILIACAO-AUDITORIA-MARKETPLACE-2026-07-15.md`.

Branch analisada: `main`.

## Resultado do tratamento

### Conta

- [x] O icone de conta do Market abre `/conta`.
- [x] O login preserva e valida a intencao `returnTo` sem open redirect.
- [x] O comprador deixa de ser enviado automaticamente ao Team.
- [x] A conta possui dashboard e navegacao para compras, entregas, devolucoes, favoritos, lojas, moradas, avaliacoes, notificacoes, afiliacao, seguranca e privacidade.
- [x] Os contextos comprador, Creator e Team aparecem apenas quando existem e estao validos.
- [x] Logout e revogacao de sessoes usam a sessao autenticada da ContaBizy.
- [x] O estado anonimo da conta e consultado sem gerar `401`; dados privados so sao pedidos depois de confirmar sessao.
- [x] O proxy de desenvolvimento distingue as paginas `/conta/*` dos endpoints da API, inclusive em refresh e URL directa.

### Creator e afiliacao

- [x] O comprador pode criar um `PerfilCreator` global por onboarding.
- [x] A candidatura deriva o perfil da sessao e nao aceita `parceiroId` arbitrario.
- [x] `OPEN_ACCESS` aprova e cria a relacao automaticamente.
- [x] `APPROVAL_REQUIRED` aguarda decisao do seller.
- [x] O seller decide a solicitacao no Team com isolamento por negocio.
- [x] O Creator acompanha solicitacoes e relacoes.
- [x] Smart Link de produto exige autorizacao activa para o produto.
- [x] `ParceiroComercial` foi mantido como adaptador operacional durante o cutover, sem ser identidade publica.

### Produto e oferta

- [x] A rota canonica usa ID global: `/market/p/:listingId/:slug` e `/publico/market/p/:id`.
- [x] Codigos iguais em lojas diferentes nao colidem; o alias legado exige `slugLoja + codigo`.
- [x] `ProdutoCatalogo` e `OfertaSeller` separam a identidade do produto da oferta do seller.
- [x] Novas pecas fazem dual-write transacional e alteracoes de preco/stock actualizam a oferta.
- [x] Reviews verificadas e reputacao do seller aparecem sem score inventado quando nao existe amostra.
- [x] Variantes, preco e stock sao validados no backend e seguem para o checkout.
- [x] O CTA Creator so aparece quando existe oferta de afiliacao elegivel.

### Descoberta Market

- [x] Busca possui endpoint de sugestoes.
- [x] Ordenacao e paginacao estao expostas e visiveis.
- [x] Busca, filtros, contagem e pagina de produtos usam consulta Prisma limitada em producao; a varredura em memoria fica apenas no repositorio de testes.
- [x] Categorias equivalentes sao agregadas por chave normalizada e o frontend nao inventa categorias ausentes da API.
- [x] Produtos usam ranking versionado com factores e penalizacoes explicaveis.
- [x] Lojas sao ordenadas por score medio real dos produtos, com versao e tamanho da amostra.
- [x] Foram removidos minimos artificiais, categorias falsas e indicadores de carrossel sem carrossel.

### Checkout

- [x] As cinco etapas controlam o conteudo e a navegacao reais.
- [x] ContaBizy preenche identidade e morada principal quando autenticada.
- [x] Moradas guardadas podem ser seleccionadas.
- [x] A cotacao recalcula preco, variante, stock, entrega, prazo, IVA e total no backend.
- [x] O metodo submetido precisa estar disponivel em todos os sellers do carrinho.
- [x] O comprovativo usa upload privado no acompanhamento, sem URL externa ou dependencia de WhatsApp.
- [x] O total final aparece antes da confirmacao.
- [x] Guest checkout continua activo e a compra pode ser associada a conta por OTP.
- [x] A loja publica encaminha para o mesmo carrinho e checkout unificado.
- [x] O checkout assistido/WhatsApp, historico local e formulario de contacto sem persistencia foram removidos da loja publica.

## Dados e migration

Migration: `20260715143000_market_account_creator_catalog_expand`.

- [x] Expand-only, sem apagar colunas ou tabelas legadas.
- [x] Indices e chaves estrangeiras incluidos.
- [x] Backfill deterministico de produto e oferta por `Peca.id`.
- [x] Compatibilidade por dual-read e dual-write durante o cutover.
- [x] Aplicada com sucesso na base local em 2026-07-15.
- [x] Backfill e dual-write verificados: 69 pecas com negocio e 69 ofertas antes da limpeza do registo temporario.

Rollback operacional: desactivar a leitura das novas projeccoes e voltar ao caminho `Peca`; o schema antigo permanece intacto. Antes de remover as tabelas novas, exportar `AutorizacaoProdutoAfiliado`, `RelacaoAfiliacao`, `SolicitacaoAfiliacao`, `ProgramaAfiliacao`, `PerfilCreator`, `OfertaSeller` e `ProdutoCatalogo`. O rollback destrutivo dessas tabelas so pode ocorrer numa migration posterior e depois de confirmar que nao existem escritas exclusivas no modelo novo.

## Evolucoes que nao bloqueiam o cutover

- [ ] Q&A publico com moderacao, compra verificada e proteccao contra spam.
- [ ] Motor formal de vouchers e cupons com budget, elegibilidade e antiabuso.
- [ ] Personalizacao cross-device baseada em eventos consentidos.
- [ ] Feed social hibrido dominante na home do Market.
- [ ] Provider unificado de pagamentos; a implementacao actual usa a interseccao de metodos configurados pelos sellers.
- [ ] Indice externo de pesquisa para sinonimos angolanos, tolerancia fonetica e catalogos com milhoes de ofertas.
- [ ] Step-up adicional para alteracao de payout e dados bancarios; as rotas actuais continuam protegidas por sessao, permissao e tenant.

Estes itens permanecem `[]` porque exigem dominios ou providers proprios. Nao foram simulados com mocks nem apresentados como concluidos.

## Verificacao

- [x] Prisma schema valido e formatado.
- [x] Migration aplicada na base local.
- [x] Backend typecheck.
- [x] Frontend typecheck.
- [x] Testes HTTP de conta, Creator, Market, variantes e checkout.
- [x] Testes frontend de rotas, API, dominio e checkout.
- [x] Suite completa: backend com 398 testes aprovados e 1 ignorado; frontend com 144 testes aprovados.
- [x] Builds de producao do backend e frontend.
- [x] QA visual desktop e mobile em Market, lojas, produto, conta, Creator e checkout, sem overflow ou respostas `5xx`.
- [x] Acesso directo a `/conta` e endpoints `/conta/estado` e `/conta/sessao` verificados no servidor local.
- [ ] Auditoria de carga com volume de producao.
