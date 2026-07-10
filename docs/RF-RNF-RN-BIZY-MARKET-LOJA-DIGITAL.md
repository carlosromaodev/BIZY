# Bizy Market e Lojas Digitais - Requisitos Funcionais, Nao Funcionais e Regras de Negocio

Documento: `RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
Versao: 0.2
Data: 2026-07-10
Autor: Carlos + Codex
Status: especificacao viva para Bizy Market, loja digital e benchmark internacional V2

---

## 1. Objetivo do Documento

Este documento formaliza a evolucao da Loja Digital do Bizy para um novo ramo de produto: **Bizy Market + Perfis de Loja + Checkout Unificado + Central de Controlo no CRM**.

A proposta parte de uma decisao de produto:

- cada cliente Bizy deve manter uma loja autonoma, personalizavel e acessivel por link proprio, como `minhaloja.bizy.space`;
- todas as lojas podem participar num shopping center central do Bizy, onde compradores descobrem produtos de varios fornecedores;
- o checkout deve ser unificado pelo Bizy, mesmo quando a compra envolve produtos de diferentes lojas;
- toda a gestao da loja, catalogos, pedidos, pagamentos, clientes, seguidores, campanhas, relatorios e operacao deve acontecer dentro do CRM Bizy.

O objetivo nao e criar apenas uma vitrine bonita. O objetivo e transformar o Bizy numa rede comercial onde pequenas lojas ganham presenca propria, descoberta cruzada e operacao profissional sem sair do CRM.

## 2. Visao de Produto

### 2.1 Definicao

**Bizy Market** e um servico do Bizy que combina:

- perfis de loja independentes;
- shopping center de produtos de todos os clientes;
- checkout centralizado;
- CRM operacional para o lojista;
- descoberta social e local;
- tracking, pedidos, pagamentos, entregas e relatorios unificados.

### 2.2 Frase Norteadora

> Bizy transforma cada negocio numa loja digital propria e conecta todas essas lojas num shopping center inteligente.

### 2.3 Posicionamento

O Bizy deve parecer:

- Instagram comercial para identidade, perfil, seguidores e colecoes visuais;
- Shopify simplificado para catalogos, produtos e colecoes;
- TikTok Shop para descoberta de produtos e similares;
- CRM Bizy para fechar venda, atender, cobrar, entregar, recuperar e medir;
- WhatsApp-first para o contexto local, sem depender apenas dele.

### 2.4 Principio de Diferenciacao

O Bizy Market nao deve ser apenas um ecommerce generico. Ele deve ser social, local, operacional e confiavel.

O comprador deve sentir que esta explorando lojas reais. O lojista deve sentir que tem uma marca propria, nao apenas uma banca anonima dentro de uma plataforma.

### 2.5 Benchmark Internacional V2

A auditoria integral de 2026-07-10 passa a orientar o Market como marketplace operacional completo. A referencia nao e so vitrine: e seller onboarding, qualidade de catalogo, checkout unificado, pedidos-filho, comissao da plataforma, saldos, payouts, reembolsos, disputas, trust & safety, moderação, buyer portal e seller portal.

Stripe Connect e usado como referencia de arquitetura para contas conectadas, verificacao, split, saldos e payouts. Shopify e usado como referencia para fulfilment, returns, risco, confiança e operacao de loja. PCI DSS e referencia para reduzir escopo de dados sensiveis usando provider/tokenizacao quando houver pagamento por cartao ou gateway equivalente.

## 3. Modulos do Produto

### 3.1 Bizy Loja

Perfil publico e autonomo de cada cliente Bizy.

Inclui:

- subdominio proprio;
- capa/hero personalizavel;
- foto de perfil ou logo;
- descricao;
- localizacao;
- categorias e colecoes;
- seguidores e seguindo;
- produtos;
- avaliacoes/selo de confianca;
- botao de seguir;
- botao de contacto;
- entrada para checkout Bizy.

### 3.2 Bizy Market

Shopping center central onde produtos de varias lojas aparecem juntos.

Inclui:

- home de descoberta;
- busca global;
- categorias globais;
- produtos similares;
- lojas em destaque;
- produtos mais vendidos;
- novidades;
- promocoes;
- filtros por preco, localizacao, entrega, disponibilidade e fornecedor;
- ranking por relevancia, confianca e desempenho.

### 3.3 Bizy Checkout

Checkout unificado do Bizy para compras feitas no perfil da loja ou no Market.

Inclui:

- carrinho;
- identificacao do comprador;
- dados de entrega;
- pagamento;
- comprovativo quando aplicavel;
- divisao interna de pedidos por fornecedor;
- acompanhamento do pedido;
- confirmacao e notificacoes.

### 3.4 Bizy Studio

Central de configuracao da loja dentro do CRM.

Inclui:

- edicao de perfil publico;
- capa, avatar, descricao e links;
- configuracao de colecoes;
- regras de publicacao no Market;
- produtos em destaque;
- banners e campanhas;
- politicas de entrega e pagamento;
- horario/disponibilidade;
- metricas de perfil e produtos.

### 3.5 Operacao CRM

Area de controlo diario da loja dentro do CRM.

Inclui:

- pedidos;
- pagamentos;
- entregas;
- clientes;
- conversas;
- tarefas;
- produtos;
- stock;
- campanhas;
- relatorios;
- seguidores e leads;
- recuperacao de carrinho e clientes.

## 4. Atores

- **Visitante**: pessoa nao autenticada que explora perfis de loja ou o Bizy Market.
- **Comprador**: visitante que inicia checkout, segue lojas, compra produtos ou acompanha pedidos.
- **Dono da loja**: cliente Bizy responsavel por configurar perfil, produtos, operacao e equipa.
- **Vendedor/atendente**: membro do CRM que responde clientes, confirma pagamentos, prepara pedidos e acompanha entrega.
- **Administrador Bizy**: operador interno que governa categorias globais, politicas, denuncias, lojas destacadas e regras do Market.
- **Sistema Bizy**: backend que aplica regras, cria pedidos, calcula stock, registra tracking, gera tarefas e notifica partes envolvidas.
- **Fornecedor/loja participante**: negocio que publica produtos no seu perfil e, quando elegivel, no shopping center.

## 5. Requisitos Funcionais

### 5.1 Identidade e Estrutura do Servico

- [x] **RF-001**: O sistema deve expor um modulo/servico chamado Bizy Market para descoberta de produtos entre lojas.
- [x] **RF-002**: O sistema deve manter a Loja Digital individual de cada negocio como perfil publico autonomo.
- [x] **RF-003**: O sistema deve permitir subdominio unico por loja no formato `slug.bizy.space` ou `slug.usebizy.space`, conforme dominio configurado, reservando `market.usebizy.space` para o shopping center.
- [x] **RF-004**: O sistema deve reservar slugs sensiveis como `api`, `www`, `app`, `admin`, `market`, `shop`, `checkout`, `n8n`, `wa`, `suporte` e similares.
- [x] **RF-005**: O sistema deve permitir que uma loja esteja ativa no perfil publico sem estar publicada no Bizy Market.
- [x] **RF-006**: O sistema deve permitir que uma loja participe no Bizy Market apenas quando cumprir criterios minimos de publicacao.
- [x] **RF-007**: O sistema deve permitir que o dono da loja configure a identidade publica dentro do CRM, sem dashboard externo separado.

### 5.2 Perfil Publico da Loja

- [x] **RF-008**: O perfil publico da loja deve exibir capa/hero, avatar/logo, nome comercial, descricao, localizacao e canais de contacto.
- [x] **RF-009**: O perfil publico deve exibir contadores sociais, incluindo seguidores e seguindo, quando a funcionalidade estiver ativa.
- [x] **RF-010**: O perfil publico deve exibir selos de confianca, como verificada, entrega ativa, pagamento confirmado pelo Bizy ou bom tempo de resposta, quando aplicavel.
- [x] **RF-011**: O perfil publico deve permitir que compradores sigam a loja.
- [x] **RF-012**: O perfil publico deve permitir que o comprador veja produtos por colecoes/categorias clicaveis.
- [x] **RF-013**: O perfil publico deve permitir que colecoes mudem a grelha de produtos sem obrigar a navegacao para outra pagina.
- [x] **RF-014**: O perfil publico deve ter uma experiencia mobile-first, com cabecalho semelhante a perfil social e grelha de produtos clara.
- [x] **RF-015**: O perfil publico deve expor uma chamada para explorar produtos similares no Bizy Market quando o comprador quiser sair da loja atual.
- [x] **RF-016**: O perfil publico deve mostrar que cada produto e vendido por aquela loja, preservando identidade e confianca.

### 5.3 Personalizacao da Loja

- [x] **RF-017**: O dono da loja deve poder editar capa, avatar, descricao, cor/acento visual, links, localizacao e informacoes publicas no CRM.
- [x] **RF-018**: O dono da loja deve poder criar, editar, ordenar e ocultar colecoes.
- [x] **RF-019**: O dono da loja deve poder escolher produtos destacados no perfil.
- [x] **RF-020**: O dono da loja deve poder escolher se determinados produtos aparecem apenas na loja, apenas em campanhas, ou tambem no Bizy Market.
- [x] **RF-021**: O dono da loja deve poder configurar mensagens curtas de apresentacao por colecao.
- [x] **RF-022**: O sistema deve impedir personalizacoes que quebrem legibilidade, acessibilidade ou seguranca visual.
- [x] **RF-023**: O sistema deve usar tokens e limites de design para permitir autonomia sem destruir a consistencia Bizy.

### 5.4 Catalogos, Colecoes e Produtos

- [x] **RF-024**: O sistema deve manter categorias globais do Bizy Market separadas das colecoes internas de cada loja.
- [x] **RF-025**: Cada produto deve poder pertencer a uma categoria global e a uma ou mais colecoes da loja.
- [x] **RF-026**: O sistema deve suportar colecoes manuais criadas pelo dono da loja.
- [x] **RF-027**: O sistema deve suportar colecoes automaticas, como novidades, promocoes, mais vendidos, reposicoes, kits e pronta entrega.
- [x] **RF-028**: O sistema deve permitir ordenacao manual dos produtos dentro de uma colecao.
- [x] **RF-029**: O sistema deve suportar destaque visual para preco promocional, disponibilidade, stock baixo e ultima unidade.
- [x] **RF-030**: O sistema deve permitir produtos fisicos, servicos e produtos digitais quando as politicas do Bizy permitirem.
- [x] **RF-031**: O sistema deve bloquear publicacao no Market de produtos sem imagem, preco, categoria, fornecedor ativo ou disponibilidade definida.
- [x] **RF-032**: O sistema deve manter historico de alteracoes relevantes de produto para auditoria operacional.

### 5.5 Bizy Market - Shopping Center

- [x] **RF-033**: O Bizy Market deve ter uma pagina inicial com busca, categorias, destaques, novidades, promocoes e lojas em evidencia.
- [x] **RF-034**: O Bizy Market deve permitir navegar por categoria global.
- [x] **RF-035**: O Bizy Market deve permitir buscar produtos por nome, categoria, loja, descricao, tags e localizacao.
- [x] **RF-036**: O Bizy Market deve permitir filtros por preco, disponibilidade, entrega, provincia/municipio, loja e promocao.
- [x] **RF-037**: O Bizy Market deve exibir a loja fornecedora em cada card de produto.
- [x] **RF-038**: O Bizy Market deve permitir abrir o perfil da loja a partir de qualquer produto.
- [x] **RF-039**: O Bizy Market deve sugerir produtos similares de outros fornecedores quando o comprador pedir alternativas.
- [x] **RF-040**: O Bizy Market deve permitir lojas em destaque e produtos patrocinados, com identificacao clara quando houver impulsionamento pago.
- [x] **RF-041**: O Bizy Market deve ter ranking por relevancia, disponibilidade, qualidade de dados, confianca, desempenho e proximidade, nao apenas por patrocinio.
- [x] **RF-042**: O Bizy Market deve permitir que o comprador continue descobrindo produtos sem perder o carrinho.

### 5.6 Produto Publico e Produtos Similares

- [x] **RF-043**: A pagina ou sheet de produto deve mostrar fotos, nome, preco, loja, disponibilidade, variantes, descricao, entrega e acoes de compra.
- [x] **RF-044**: O produto deve mostrar contexto comercial util, como "em stock", "pronta entrega", "popular esta semana" ou "ultima unidade", quando os dados existirem.
- [x] **RF-045**: O produto deve permitir ver mais produtos da mesma loja.
- [x] **RF-046**: O produto deve permitir ver produtos similares de outras lojas no Bizy Market.
- [x] **RF-047**: Produtos similares devem respeitar categoria, preco aproximado, tags, disponibilidade e localizacao quando possivel.
- [x] **RF-048**: Produtos similares nao devem esconder a loja dona do produto original nem confundir o comprador sobre o fornecedor.

### 5.7 Checkout Unificado Bizy

- [x] **RF-049**: O Bizy deve oferecer checkout unificado para produtos comprados no perfil da loja ou no Bizy Market. `/checkout` suporta carrinho de uma loja pelo endpoint da loja e carrinho multi-loja pelo checkout unificado do Market.
- [x] **RF-050**: O comprador deve conseguir adicionar produtos ao carrinho a partir de varias origens.
- [x] **RF-051**: O checkout deve identificar a loja fornecedora de cada item.
- [x] **RF-052**: Quando o carrinho tiver produtos de uma unica loja, o sistema deve criar um pedido principal para essa loja.
- [x] **RF-053**: Quando o carrinho tiver produtos de varias lojas, o sistema deve criar uma compra unificada para o comprador e pedidos filhos separados por fornecedor.
- [x] **RF-054**: O comprador deve ver uma experiencia unica de pagamento, mesmo quando internamente existirem varios fornecedores.
- [x] **RF-055**: O sistema deve calcular entrega por loja, por zona ou por politica configurada.
- [x] **RF-056**: O checkout deve suportar retirada, entrega ao domicilio, entrega por orcamento e entrega a combinar, conforme a loja.
- [x] **RF-057**: O checkout deve recolher consentimento minimo de dados antes de criar pedido.
- [x] **RF-058**: O checkout deve suportar pagamento por transferencia/comprovativo, dinheiro na entrega, pagamento personalizado e providers futuros.
- [x] **RF-059**: O checkout deve permitir comprovativo de pagamento quando o metodo exigir.
- [x] **RF-060**: O checkout deve criar cliente/lead no CRM das lojas envolvidas, respeitando minimizacao de dados.
- [x] **RF-061**: O checkout deve gerar numero de compra unificado para o comprador e numeros internos por fornecedor.
- [x] **RF-062**: O checkout deve permitir acompanhamento do estado da compra pelo comprador.

### 5.8 Pedidos, Pagamentos e Repasses

- [x] **RF-063**: Cada pedido gerado pelo checkout deve aparecer no CRM da loja responsavel.
- [x] **RF-064**: Em compras multi-loja, cada fornecedor deve ver apenas os seus itens, valores, entrega e dados necessarios para cumprir o pedido.
- [x] **RF-065**: O CRM deve exibir a origem do pedido: perfil da loja, Bizy Market, campanha, afiliado, live, social ou link.
- [x] **RF-066**: O sistema deve permitir confirmacao, rejeicao e observacao de comprovativo.
- [x] **RF-067**: O sistema deve separar estado da compra do comprador e estado operacional de cada fornecedor.
- [x] **RF-068**: O sistema deve suportar repasse financeiro para fornecedores quando o Bizy centralizar pagamento.
- [x] **RF-069**: O sistema deve registrar taxas, comissoes, descontos, entrega e repasses de forma auditavel.
- [x] **RF-070**: O sistema deve suportar cancelamento parcial em compras multi-loja.
- [x] **RF-071**: O sistema deve suportar reembolso parcial ou total quando a operacao de pagamento permitir.
- [x] **RF-072**: O sistema deve exibir pendencias financeiras no painel da loja e no painel administrativo Bizy.

### 5.9 Central de Controlo no CRM

- [x] **RF-073**: Toda configuracao da loja deve existir dentro do CRM Bizy.
- [x] **RF-074**: O CRM deve ter uma area para "Minha Loja" ou "Bizy Studio" com identidade, colecoes, produtos, publicacao, checkout, entrega e SEO.
- [x] **RF-075**: O CRM deve ter uma area operacional para pedidos do Market e da loja propria.
- [x] **RF-076**: O CRM deve mostrar metricas de perfil, produtos, seguidores, carrinhos, pedidos, receita e conversao.
- [x] **RF-077**: O CRM deve permitir publicar/despublicar produtos no Market em massa.
- [x] **RF-078**: O CRM deve permitir gerir seguidores, leads e clientes gerados pelo perfil ou Market.
- [x] **RF-079**: O CRM deve permitir criar campanhas com produtos da loja e medir resultado no Market.
- [x] **RF-080**: O CRM deve mostrar tarefas automaticas geradas por pedido pendente, pagamento pendente, entrega atrasada, carrinho abandonado ou mensagem sem resposta.
- [x] **RF-081**: O CRM deve manter a loja como parte da operacao diaria, nao como configuracao isolada.

### 5.10 Seguidores, Social Graph e Relacionamento

- [x] **RF-082**: Compradores devem poder seguir lojas.
- [x] **RF-083**: Lojas devem poder exibir quantidade de seguidores.
- [x] **RF-084**: O sistema deve permitir que uma loja siga outras lojas quando essa funcionalidade fizer sentido para curadoria, parcerias ou fornecimento.
- [x] **RF-085**: O sistema deve permitir listas de seguidores apenas quando houver permissao e regras de privacidade.
- [x] **RF-086**: Seguir uma loja deve poder alimentar campanhas, notificacoes e recomendacoes, respeitando consentimento.
- [x] **RF-087**: O CRM deve registrar origem do seguidor: perfil, Market, campanha, produto, QR, live ou link.

### 5.11 Recomendacoes e Descoberta

- [x] **RF-088**: O sistema deve recomendar produtos similares com base em categoria, colecao, preco, tags, comportamento e disponibilidade.
- [x] **RF-089**: O sistema deve recomendar lojas relacionadas quando o comprador explora uma categoria.
- [x] **RF-090**: O sistema deve permitir blocos como "tambem podes gostar", "lojas parecidas", "mais vendidos nesta categoria" e "perto de ti".
- [x] **RF-091**: O sistema deve manter guardrails para que recomendacoes nao promovam produtos indisponiveis ou lojas com problemas operacionais graves.
- [x] **RF-092**: O sistema deve registrar eventos de recomendacao exibida e clicada para medir qualidade.

### 5.12 SEO, Links e Presenca Publica

- [x] **RF-093**: Cada perfil de loja deve ter URL canonica e metadata SEO.
- [x] **RF-094**: Cada produto publico deve ter metadata SEO e preview social.
- [x] **RF-095**: O Bizy Market deve ter URLs por categoria, busca e produto quando aplicavel.
- [x] **RF-096**: O sistema deve gerar preview adequado para WhatsApp, Instagram, TikTok, Facebook e navegador.
- [x] **RF-097**: O sistema deve evitar indexar paginas privadas, rascunhos, carrinhos e checkout com dados pessoais.

### 5.13 Administracao Bizy e Governanca

- [x] **RF-098**: Administradores Bizy devem gerir categorias globais do Market.
- [x] **RF-099**: Administradores Bizy devem gerir politicas de publicacao de lojas e produtos.
- [x] **RF-100**: Administradores Bizy devem conseguir suspender produto, loja ou participacao no Market sem apagar dados do CRM.
- [x] **RF-101**: Administradores Bizy devem conseguir marcar lojas/produtos como destacados, verificados ou patrocinados.
- [x] **RF-102**: Administradores Bizy devem visualizar relatorios de volume, conversao, pedidos, receita, comissoes, disputas e produtos denunciados.
- [x] **RF-103**: O sistema deve permitir denuncia de loja/produto pelo comprador.
- [x] **RF-104**: O sistema deve registrar auditoria de todas as acoes administrativas sensiveis.

### 5.14 Notificacoes e Comunicacao

- [x] **RF-105**: O comprador deve receber confirmacao de compra, atualizacao de pagamento e atualizacao de entrega quando os canais estiverem configurados.
- [x] **RF-106**: A loja deve receber notificacao no CRM quando houver novo pedido, pagamento pendente, comprovativo enviado, pedido atrasado ou pergunta de comprador.
- [x] **RF-107**: O sistema deve poder criar tarefas humanas quando uma notificacao automatica nao for segura ou permitida.
- [x] **RF-108**: Mensagens WhatsApp devem respeitar politica de categoria, janela de atendimento, consentimento e templates aprovados.

### 5.15 Relatorios

- [x] **RF-109**: O CRM deve mostrar relatorios da loja propria separados dos relatorios do Market.
- [x] **RF-110**: O CRM deve mostrar origem de vendas por perfil, Market, campanha, live, afiliado, social e link.
- [x] **RF-111**: O CRM deve mostrar produtos mais vistos, mais vendidos, mais adicionados ao carrinho, encalhados e com maior margem.
- [x] **RF-112**: O CRM deve mostrar funil do comprador: visualizacao, produto visto, carrinho, checkout, pagamento, entrega e recompra.
- [x] **RF-113**: O painel Bizy admin deve mostrar desempenho do shopping center por categoria, loja, produto e periodo.
- [x] **RF-114**: Relatorios devem permitir exportacao auditada quando o plano/permissao permitir.

### 5.16 Marketplace M5, Seller Operations e Trust & Safety

- [ ] **RF-115**: O Market deve ter seller onboarding com elegibilidade, documentos minimos, verificacao, estado de aprovacao, pendencias e historico de revisao.
- [ ] **RF-116**: O Market deve manter conta operacional por seller com saldo disponivel, saldo retido, saldo em disputa, taxas, comissoes e historico de payout.
- [ ] **RF-117**: O checkout multi-loja deve calcular split por fornecedor, taxa Bizy, desconto, entrega, retencao, comissao e impostos quando aplicavel.
- [ ] **RF-118**: O sistema deve suportar hold de repasse por regra de risco, prazo de entrega, disputa, reembolso ou politica de categoria.
- [ ] **RF-119**: O seller deve ter portal/visao dedicada para pedidos, preparacao, entregas, repasses, disputas, documentos, notificacoes e suporte.
- [ ] **RF-120**: O comprador deve ter portal de compra para acompanhar pedido unificado, pedidos-filho, pagamento, entrega, reembolso, disputa e suporte.
- [ ] **RF-121**: O Market deve suportar fluxo formal de reembolso, troca, devolucao, disputa e chargeback com estados, evidencias, responsavel, prazo e decisao.
- [ ] **RF-122**: O Market deve ter fila Trust & Safety para denuncias, fraude, produto proibido, loja com falhas recorrentes, abuso de checkout, spam e risco de reputacao.
- [ ] **RF-123**: O ranking do Market deve incorporar qualidade de catalogo, disponibilidade, cumprimento de entrega, cancelamentos, reclamacoes, disputas, confianca e frescor.
- [ ] **RF-124**: O Market deve gerir qualidade de catalogo com checklist de imagem, preco, categoria, descricao, variacao, stock, entrega, politica e dados obrigatorios por tipo de produto.
- [ ] **RF-125**: Fulfilment deve ligar pedido, separacao, embalagem, entrega, prova de entrega, atraso, tentativa falhada e devolucao ao Team e ao portal do comprador.
- [ ] **RF-126**: O Market deve expor eventos versionados para seller onboarding, checkout, pagamento, pedido-filho, entrega, disputa, payout e refund.

## 6. Requisitos Nao Funcionais

- [x] **RNF-001**: A experiencia publica deve ser mobile-first em 375px, 390px, 768px, 1024px e 1440px.
- [x] **RNF-002**: O perfil da loja e o Market devem carregar rapidamente, com imagens otimizadas e paginacao ou carregamento incremental.
- [x] **RNF-003**: A busca do Market deve responder em tempo adequado para uso comercial, mesmo com muitos produtos.
- [x] **RNF-004**: O sistema deve suportar crescimento multi-negocio sem misturar dados entre lojas.
- [x] **RNF-005**: Todo dado operacional deve ser isolado por `negocioId`, exceto entidades explicitamente globais do Market.
- [x] **RNF-006**: Dados pessoais do comprador nao devem vazar em URL, tracking publico, logs, previews sociais ou cards do Market.
- [x] **RNF-007**: O checkout deve ser idempotente para evitar pedidos duplicados por refresh, retry ou webhook repetido.
- [x] **RNF-008**: Eventos de tracking devem ser idempotentes quando houver chave tecnica ou `idempotencyKey`.
- [x] **RNF-009**: O sistema deve manter auditoria para acoes sensiveis: pagamento, cancelamento, reembolso, repasse, suspensao, publicacao e alteracao administrativa.
- [x] **RNF-010**: O Market deve ter observabilidade minima: erros, latencia, eventos de compra, falhas de checkout, falhas de pagamento e falhas de notificacao.
- [x] **RNF-011**: A interface deve respeitar WCAG 2.2 AA para contraste, foco, teclado e leitores de tela nas acoes principais.
- [x] **RNF-012**: Animacoes devem respeitar `prefers-reduced-motion`.
- [x] **RNF-013**: Personalizacoes de loja nao podem permitir JavaScript, HTML inseguro, CSS arbitrario ou upload de conteudo executavel.
- [x] **RNF-014**: Imagens devem ter limites de tamanho, tipos permitidos e processamento seguro.
- [x] **RNF-015**: O Market deve degradar com seguranca quando uma loja estiver offline, despublicada ou com modulo desativado.
- [x] **RNF-016**: O checkout deve continuar orientando o comprador mesmo quando pagamento online nao estiver disponivel.
- [x] **RNF-017**: O sistema deve evitar telas decorativas sem acao operacional no CRM.
- [x] **RNF-018**: Toda funcionalidade nova deve ter testes de contrato, regras de negocio e fluxo principal antes de ser considerada pronta.
- [x] **RNF-019**: O sistema deve permitir evolucao para providers de pagamento, entrega e notificacao sem reescrever a experiencia publica.
- [x] **RNF-020**: O sistema deve manter compatibilidade com o modelo atual de loja publica durante a migracao.
- [x] **RNF-021**: O Market deve ter protecao contra scraping abusivo, spam de checkout, abuso de busca e tentativas de enumeracao de dados.
- [x] **RNF-022**: O sistema deve manter cache seguro para catalogo publico, sem cachear dados pessoais de carrinho/checkout.
- [x] **RNF-023**: Relatorios devem ser consistentes com pedidos e pagamentos confirmados, nao apenas eventos de tracking.
- [x] **RNF-024**: O sistema deve suportar operacao em AOA/Kwanza e formatos locais de telefone, endereco e pagamento.
- [x] **RNF-025**: A linguagem da UI deve ser curta, humana e orientada a acao, adequada a vendedores nao tecnicos.
- [ ] **RNF-026**: Pagamentos Market devem reduzir escopo PCI usando provider/tokenizacao e nunca guardar PAN, CVV ou credenciais sensiveis de cartao no Bizy.
- [ ] **RNF-027**: Payouts, saldos, holds, refunds e disputas devem ser idempotentes, auditaveis e reconciliaveis por seller, pedido, periodo e lote.
- [ ] **RNF-028**: Portais de comprador e seller devem expor somente dados minimos necessarios, respeitando `negocioId`, pedido, papel e relacao operacional.
- [ ] **RNF-029**: Eventos do Market devem ser versionados, assinaveis quando externos, reprocessaveis e observaveis por seller, pedido e compra unificada.
- [ ] **RNF-030**: O Market deve ter SLOs para checkout, criacao de pedido-filho, upload de comprovativo, notificacao, payout e resolucao de disputa.
- [ ] **RNF-031**: Trust & Safety deve registrar evidencias, origem, decisao, responsavel e prazo sem expor dados sensiveis fora do painel autorizado.
- [ ] **RNF-032**: Ranking e recomendacao devem ser explicaveis em termos operacionais, sem favorecer patrocinio quando houver risco, produto indisponivel ou loja suspensa.
- [ ] **RNF-033**: A experiencia de devolucao/disputa deve continuar utilizavel em mobile e conexao lenta, com estados claros para comprador e seller.

## 7. Regras de Negocio

### 7.1 Autonomia da Loja

- [x] **RN-001**: Cada loja tem autonomia para configurar perfil, capa, avatar, descricao, colecoes, destaque e publicacao de produtos.
- [x] **RN-002**: A autonomia visual deve respeitar limites do design system Bizy para preservar legibilidade, acessibilidade e confianca.
- [x] **RN-003**: Uma loja pode ter perfil publico ativo sem participar do Bizy Market.
- [x] **RN-004**: Participar do Bizy Market exige criterios minimos de qualidade, seguranca e operacao.
- [x] **RN-005**: O perfil publico da loja deve sempre preservar a identidade do fornecedor, mesmo quando o produto for descoberto no Market.

### 7.2 Publicacao no Bizy Market

- [x] **RN-006**: Produto so pode aparecer no Market se tiver loja ativa, imagem, preco, categoria global, disponibilidade e permissao de publicacao.
- [x] **RN-007**: Produto rascunho, oculto, esgotado sem reposicao ou suspenso nao deve aparecer no Market.
- [x] **RN-008**: Produto pode aparecer no perfil da loja mesmo sem aparecer no Market, se a loja assim configurar.
- [x] **RN-009**: Categoria global e definida pelo Bizy; colecao local e definida pela loja.
- [x] **RN-010**: O Bizy pode remover ou suspender produto do Market por politica, denuncia, fraude, informacao incompleta ou risco operacional.
- [x] **RN-011**: Produto patrocinado deve ser identificado como patrocinado.
- [x] **RN-012**: Patrocinio nao pode passar por cima de bloqueios de seguranca, produto suspenso ou loja inativa.

### 7.3 Descoberta e Produtos Similares

- [x] **RN-013**: Produtos similares podem aparecer quando o comprador pedir alternativas ou estiver numa area de descoberta do Market.
- [x] **RN-014**: Produtos similares dentro do perfil da loja nao devem confundir o comprador sobre quem vende o produto atual.
- [x] **RN-015**: O Bizy deve priorizar produtos disponiveis, lojas confiaveis e categorias corretas nas recomendacoes.
- [x] **RN-016**: O ranking do Market deve equilibrar relevancia, disponibilidade, confianca, localizacao, desempenho e frescor.
- [x] **RN-017**: Produtos de uma loja com muitas falhas operacionais podem perder prioridade no Market.

### 7.4 Checkout Unificado

- [x] **RN-018**: O checkout unificado e a experiencia principal de compra do Bizy, tanto no perfil da loja quanto no Market.
- [x] **RN-019**: Carrinho com produtos de uma loja gera um pedido operacional para essa loja.
- [x] **RN-020**: Carrinho com produtos de varias lojas gera uma compra unificada para o comprador e pedidos filhos por fornecedor.
- [x] **RN-021**: Cada fornecedor so pode ver os dados necessarios para cumprir a parte dele do pedido.
- [x] **RN-022**: O comprador deve ver uma compra coerente, mesmo que internamente existam varios fornecedores.
- [x] **RN-023**: Entrega pode ser calculada separadamente por fornecedor quando nao houver logistica unificada.
- [x] **RN-024**: O total do comprador deve deixar claro produto, entrega, descontos, taxas e metodo de pagamento.
- [x] **RN-025**: Pedido nao deve ser marcado como pago sem confirmacao automatica do provider ou confirmacao humana autorizada.
- [x] **RN-026**: Comprovativo rejeitado deve exigir motivo e deixar historico auditavel.
- [x] **RN-027**: Pedido com pagamento pendente deve gerar tarefa ou alerta operacional para a loja.
- [x] **RN-028**: Stock deve ser reservado durante checkout por tempo limitado quando a loja usa controlo de stock.
- [x] **RN-029**: Reserva de stock expirada deve liberar o item automaticamente.

### 7.5 Pagamentos, Taxas e Repasses

- [x] **RN-030**: Quando o Bizy centralizar pagamento, o valor recebido deve ser conciliado antes do repasse ao fornecedor.
- [x] **RN-031**: Repasse ao fornecedor deve considerar taxas Bizy, comissoes, descontos, cancelamentos, reembolsos e ajustes.
- [x] **RN-032**: Repasse nao deve acontecer para pedido cancelado, fraudulento, nao pago ou em disputa.
- [x] **RN-033**: Reembolso parcial deve afetar apenas os itens/fornecedores correspondentes.
- [x] **RN-034**: Toda taxa ou comissao deve ser visivel para a loja em relatorio financeiro.
- [x] **RN-035**: O Bizy deve manter trilha auditavel de pagamento, comprovativo, repasse e reembolso.

### 7.6 CRM como Fonte de Verdade

- [x] **RN-036**: Toda central de controlo da loja deve estar dentro do CRM Bizy.
- [x] **RN-037**: Nao deve existir um painel separado que vire fonte concorrente de verdade da loja.
- [x] **RN-038**: Pedido, cliente, produto, pagamento, entrega e conversa devem continuar sendo entidades operacionais do CRM.
- [x] **RN-039**: O Market gera descoberta; o CRM controla execucao.
- [x] **RN-040**: Toda venda feita no Market deve gerar informacao operacional acionavel no CRM da loja.
- [x] **RN-041**: Toda configuracao publica deve ser validada no backend antes de aparecer para compradores.

### 7.7 Seguidores, Leads e Consentimento

- [x] **RN-042**: Seguir uma loja nao equivale automaticamente a consentimento para marketing fora das regras permitidas.
- [x] **RN-043**: Consentimento de marketing deve ser explicito quando necessario.
- [x] **RN-044**: Lista de seguidores nao deve expor dados pessoais publicamente.
- [x] **RN-045**: A loja pode usar seguidores para segmentacao apenas dentro das regras de consentimento e politica WhatsApp.
- [x] **RN-046**: Um comprador pode deixar de seguir uma loja.
- [x] **RN-047**: O CRM deve registrar origem do seguidor para relatorios e campanhas.

### 7.8 Privacidade e Dados

- [x] **RN-048**: Dados privados de uma loja nao podem ser expostos a outra loja por causa do Market.
- [x] **RN-049**: Em compra multi-loja, cada loja recebe somente os dados necessarios para cumprir o pedido.
- [x] **RN-050**: Tracking publico nao deve guardar nome, telefone, email ou endereco em payload publico.
- [x] **RN-051**: Dados de compradores devem ser minimizados, protegidos e auditaveis.
- [x] **RN-052**: Relatorios agregados do Market nao devem revelar informacao comercial privada de outra loja sem autorizacao.

### 7.9 Moderacao e Confianca

- [x] **RN-053**: O Bizy pode exigir verificacao adicional para lojas que recebem alto volume de pedidos.
- [x] **RN-054**: Denuncias de produto ou loja devem criar fila de revisao para administradores Bizy.
- [x] **RN-055**: Loja suspensa nao deve aparecer no Market e pode ter perfil publico limitado, conforme motivo.
- [x] **RN-056**: Produtos proibidos devem ser bloqueados mesmo que uma loja tente publica-los.
- [x] **RN-057**: Avaliacoes e selos de confianca devem ser derivados de dados reais ou revisao Bizy, nao apenas escolha da loja.

### 7.10 Planos e Monetizacao

- [x] **RN-058**: Bizy Market pode ser um modulo/servico separado dentro dos planos Bizy.
- [x] **RN-059**: Planos podem limitar quantidade de produtos publicados no Market, imagens, colecoes, impulsionamentos, relatorios e automacoes.
- [x] **RN-060**: O Bizy pode cobrar comissao por venda, mensalidade, destaque patrocinado ou combinacao desses modelos.
- [x] **RN-061**: Qualquer custo aplicado a loja deve ser transparente no CRM.
- [x] **RN-062**: Funcionalidades bloqueadas por plano devem aparecer como upgrade contextual, nao como promessa quebrada.

### 7.11 Migracao da Loja Atual

- [x] **RN-063**: A loja publica atual deve evoluir para perfil de loja sem quebrar links existentes.
- [x] **RN-064**: O checkout atual deve ser migrado para o checkout unificado de forma progressiva.
- [x] **RN-065**: Produtos, categorias, colecoes, tracking e pedidos existentes devem ser preservados.
- [x] **RN-066**: A area atual "Minha loja" deve virar Bizy Studio dentro do CRM.
- [x] **RN-067**: O Market deve ser introduzido como camada adicional de descoberta, nao como substituto da loja do cliente.

### 7.12 Marketplace, Repasses e Disputas

- [ ] **RN-068**: Seller sem elegibilidade minima nao pode receber destaque, patrocinio, payout acelerado ou alto volume sem revisao Bizy.
- [ ] **RN-069**: Saldo de seller so fica disponivel para payout apos pagamento confirmado, janela minima de risco e ausencia de disputa ou refund bloqueante.
- [ ] **RN-070**: Split e comissao devem ser calculados sobre valor elegivel, separando produto, entrega, desconto, taxa, imposto, reembolso e chargeback.
- [ ] **RN-071**: Disputa aberta deve congelar apenas os valores e pedidos afetados, sem bloquear operacao inteira da loja salvo risco grave.
- [ ] **RN-072**: Reembolso parcial deve afetar somente itens, sellers e taxas correspondentes, preservando historico financeiro completo.
- [ ] **RN-073**: Produto proibido, falsificado, inseguro ou sem owner responsavel deve ser suspenso mesmo que esteja pago, patrocinado ou em alta demanda.
- [ ] **RN-074**: Ranking patrocinado nao pode ultrapassar bloqueios de seguranca, disponibilidade, denuncia grave, fraude, disputa critica ou baixa qualidade de catalogo.
- [ ] **RN-075**: Buyer portal e seller portal nao substituem o Team; eles sao self-service externo para estados, documentos e suporte minimo.

## 8. Fases de Implementacao Sugeridas

### Fase 1 - Perfil de Loja Evoluido

- transformar loja publica em perfil comercial com hero, avatar, descricao, seguidores e colecoes clicaveis;
- manter compatibilidade com checkout da loja e encaminhar carrinho multi-loja para o checkout unificado;
- melhorar studio no CRM para personalizacao;
- preservar subdominios e SEO.

### Fase 2 - Bizy Market MVP

- criar pagina central de descoberta;
- publicar produtos elegiveis de varias lojas;
- busca e categorias globais;
- produtos similares;
- links entre Market e perfil da loja;
- tracking de descoberta.

### Fase 3 - Checkout Unificado

- carrinho Bizy;
- compra unificada;
- pedidos filhos por fornecedor;
- pagamento/comprovativo central;
- acompanhamento do comprador;
- pedidos no CRM por loja.

### Fase 4 - Operacao Financeira e Repasses

- conciliacao;
- taxas;
- comissoes;
- repasses;
- cancelamentos e reembolsos;
- painel financeiro Bizy admin e loja.

### Fase 5 - Social Graph, Recomendacoes e Boost

- seguidores;
- recomendacoes avancadas;
- lojas relacionadas;
- produtos patrocinados;
- campanhas Market;
- relatorios de performance.

### Fase 6 - Marketplace M5 e Operacao Externa

- seller onboarding e verificacao;
- saldos, holds, split e payouts;
- buyer portal e seller portal;
- disputas, chargebacks, devolucoes e reembolsos;
- Trust & Safety;
- eventos versionados e observabilidade por seller/pedido;
- preparacao PCI por reducao de escopo via provider/tokenizacao.

### 8.1 Sequencia Tecnica de Rotas

Mapa detalhado: `docs/wiki/pages/bizy-market-rotas-roadmap.md`.

#### Primeira sequencia backend

- [x] `GET /publico/lojas/:slug`: perfil publico com loja, produtos, vitrine, SEO, perfil, colecoes e CTA para Market.
- [x] `GET /publico/market/produtos`: produtos elegiveis de lojas publicadas, com fornecedor sanitizado.
- [x] `GET /publico/market/categorias`: categorias globais com contagem e URLs publicas.
- [x] `GET /publico/market/produtos/:codigo`: detalhe publico de produto descoberto no Market.
- [x] `GET /publico/market/produtos/:codigo/similares`: alternativas de outros fornecedores.
- [x] `GET /team/loja/market/resumo`: estado de publicacao, pendencias e metricas basicas no Team.
- [x] `PUT /team/loja/produtos/:codigo/publicacao`: publicar/despublicar produto no Market.
- [x] `PUT /team/loja/produtos/publicacao-em-massa`: publicacao em massa dentro do Team.

#### Primeira sequencia frontend

- [x] Base tecnica `frontend/src/lojas`: tipos, rotas, helpers API e normalizadores para consumir loja publica, Market e Studio.
- [x] Teste de contrato frontend `frontend/testes/lojas-api.test.ts`.
- [x] `/market`: home de descoberta com busca, categorias e destaques.
- [x] `/market/categorias/:categoria`: navegação por categoria global.
- [x] `market.usebizy.space`: dominio proprio do Bizy Market com raiz `/`, `/categorias/:categoria`, `/produtos/:codigo` e `/lojas`.
- [x] `/lojas/:slug`: perfil publico mobile-first da loja.
- [x] `/lojas/:slug/produtos/:codigo`: detalhe de produto da loja.
- [x] `/checkout`: entrada do checkout unificado.
- [x] `/app/loja`: controlo de participacao no Market dentro do CRM.

#### Sequencia posterior

- [x] Checkout com carrinho local, fornecedor por item, origens loja/Market, consentimento e finalizacao segura.
- [x] Checkout unificado multi-loja com carrinho, entrega, pagamento, comprovativo e acompanhamento.
- [x] Pedidos filhos por fornecedor no CRM.
- [x] Seguidores, similares avancados, ranking e tracking de recomendacao.
- [x] Admin Bizy para categorias, suspensoes, patrocinados, denuncias, relatorios e repasses.

## 9. Decisoes Fechadas

- [x] Dominio principal do Market definido como `market.usebizy.space`, mantendo `/market` como fallback local e compatibilidade.
- [x] Compra multi-loja implementada no checkout unificado por `POST /publico/market/checkout`, com pedidos filhos por fornecedor.
- [x] Pagamento inicial opera com transferencia/comprovativo, dinheiro na entrega ou metodo combinado; provider online entra como evolucao.
- [x] O MVP nao inventa avaliacao publica de compradores. A UI mostra selos operacionais reais ou estado vazio.
- [x] Social graph atual usa seguir loja com identificacao simples; perfil autenticado completo do comprador e evolucao futura.
- [x] Categorias globais iniciais: moda, beleza, comida, tecnologia, casa e servicos.
- [x] Prefixo operacional canonico da loja e `/team/loja`; `/crm/loja` fica somente como alias legado.

## 10. Guardrails de Produto

- Nao transformar o Market num catalogo anonimo que apaga a marca das lojas.
- Nao deixar o perfil da loja virar uma pagina pesada e decorativa sem conversao.
- Nao criar checkout que gere pedidos impossiveis de operar no CRM.
- Nao mostrar similares de outras lojas de forma agressiva dentro do perfil de uma loja.
- Nao expor dados privados de CRM para descoberta publica.
- Nao permitir personalizacao visual que destrua contraste, hierarquia ou experiencia mobile.
- Nao criar automacao financeira sem auditoria, permissao e fallback humano.

## 11. Ligacoes com Documentos Existentes

- `docs/RF-RNF-RN-EMEUV1.md`
- `docs/wiki/pages/loja-digital-operacao-crm.md`
- `docs/wiki/pages/visao-produto-bizy.md`
- `docs/wiki/pages/mapa-de-modulos-bizy.md`
- `docs/wiki/pages/dominio-e-entidades-bizy.md`
- `docs/wiki/pages/fluxos-operacionais-bizy.md`
- `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`
