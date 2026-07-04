# Meta Global Bizy - Sistema Operacional Comercial

Status: rascunho estrategico para orientar specs
Data: 2026-06-30
Escopo: meta global do Bizy e criterios de decisao para Team, Market, Studio, Checkout, Automacoes, WhatsApp e futuras distribuicoes

## Fontes

- `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
- `docs/wiki/pages/mapa-de-modulos-bizy.md`
- `docs/superpowers/specs/2026-06-07-bizy-market-frontend-lojas-design.md`
- `docs/superpowers/specs/2026-05-23-bizy-design-interno-comercio-suave-design.md`

## Decisao

O Bizy deve ser tratado como o sistema operacional comercial para pequenos negocios: uma plataforma que ajuda a trazer clientes, vender, atender, cobrar, entregar, medir e repetir crescimento sem o dono da loja sair do Bizy.

A meta nao e ter muitos modulos. A meta e fazer cada modulo contribuir para um ciclo comercial completo, mensuravel e confiavel.

## Frase Norteadora

> O Bizy transforma negocios locais em operacoes comerciais digitais completas: cada loja tem presenca propria, vende em canais publicos e pelo Market, executa tudo no Team e mede crescimento com dados reais.

## Meta 2026/2027

Consolidar o Bizy como uma plataforma modular onde qualquer negocio consegue:

- criar uma presenca comercial propria;
- publicar produtos e ofertas;
- ser descoberto no Market;
- converter interesse em pedido;
- atender o cliente com contexto;
- cobrar, confirmar pagamento e organizar entrega;
- gerir equipa, tarefas, permissoes e metas;
- recuperar oportunidades perdidas;
- medir vendas, origem, desempenho e retorno de cada canal.

## Principio Central

Toda funcionalidade nova deve aumentar pelo menos uma destas capacidades:

1. **Descoberta**
   Fazer mais compradores encontrarem lojas, produtos, campanhas ou ofertas.

2. **Conversao**
   Transformar visita, conversa, comentario, lead, carrinho ou interesse em pedido real.

3. **Execucao**
   Ajudar a loja a cumprir venda, pagamento, stock, entrega, atendimento e tarefas com menos falha.

4. **Retencao**
   Fazer clientes, seguidores e compradores voltarem por relacionamento, campanha, recomendacao ou recuperacao.

5. **Controlo**
   Dar ao dono clareza sobre dinheiro, equipa, permissao, risco, origem, desempenho e proximas acoes.

Se uma feature nao melhora nenhuma destas capacidades, ela nao deve entrar no roadmap principal.

## Papel de Cada Distribuicao

### Bizy Team / team-core

O Team e o centro operacional do negocio.

Responsabilidades:

- CRM e clientes;
- equipa, papeis e permissoes;
- pedidos, tarefas, metas e rotina;
- atendimento e conversas;
- financeiro operacional;
- relatorios de execucao;
- configuracao dos modulos ativos.

Regra: o Team deve continuar sendo a fonte principal de verdade da operacao.

### Bizy Market

O Market e a camada de descoberta e aquisicao.

Responsabilidades:

- expor produtos elegiveis de varias lojas;
- permitir busca, categorias, similares e lojas em destaque;
- aumentar descoberta cruzada;
- gerar tracking de origem;
- encaminhar comprador para checkout, loja ou produto;
- criar dados acionaveis para o CRM da loja.

Regra: o Market gera descoberta; o Team controla execucao.

### Bizy Studio / Loja

O Studio e a ponte entre presenca publica e operacao interna.

Responsabilidades:

- configurar perfil publico da loja;
- gerir publicacao de produtos;
- controlar participacao no Market;
- mostrar pendencias de elegibilidade;
- exibir preview e metricas da loja;
- orientar o lojista sobre o que falta para vender melhor.

Regra: o Studio nao deve virar um painel separado. Ele deve ser uma area operacional dentro do Team.

### Checkout, Pedidos e Pagamentos

Checkout e Pedidos sao o ponto de conversao formal.

Responsabilidades:

- transformar carrinho, reserva, conversa ou campanha em pedido;
- separar origem da venda;
- organizar pagamento, comprovativo e estado;
- suportar pedidos filhos por fornecedor quando houver compra multi-loja;
- registrar dados suficientes para atendimento, entrega e relatorio.

Regra: toda conversao publica precisa terminar em informacao operacional dentro do Team.

### WhatsApp, IA e Automacoes

WhatsApp, IA e automacoes sao camadas de produtividade, nao fontes concorrentes de verdade.

Responsabilidades:

- responder mais rapido;
- recuperar carrinhos, leads e clientes inativos;
- sugerir proximas acoes;
- lembrar tarefas e follow-ups;
- apoiar segmentacao com consentimento;
- reduzir trabalho manual repetitivo.

Regra: automacao deve executar ou sugerir acao sobre dados do Bizy, sem substituir o backend como fonte de verdade.

## Regras Para Novos Specs

Todo spec novo deve responder claramente:

- Que capacidade melhora: descoberta, conversao, execucao, retencao ou controlo?
- Qual distribuicao lidera: Team, Market, Studio, Checkout, WhatsApp, IA ou outra?
- Que entidade operacional nasce ou muda: cliente, lead, seguidor, produto, pedido, pagamento, entrega, conversa, tarefa, campanha, meta ou relatorio?
- Que dado entra no CRM/Team depois da acao publica?
- Como o dono da loja percebe valor: mais venda, menos tempo, menos erro, mais controlo ou melhor retorno?
- Que modulo, permissao ou plano controla acesso?
- Que estados vazios, bloqueados ou pendentes precisam aparecer sem promessa quebrada?
- Que metricas provam que a funcionalidade funcionou?

## Criterios de Aceitacao Global

Uma entrega alinhada com esta meta deve cumprir:

- dados operacionais isolados por negocio;
- acao publica ligada a origem rastreavel;
- resultado acionavel dentro do Team;
- UI coerente com o design interno do Bizy;
- estados de erro, vazio, permissao e modulo desativado bem definidos;
- metricas minimas de uso ou resultado;
- nenhuma duplicacao desnecessaria de painel ou fonte de verdade;
- compatibilidade progressiva com lojas, Market e checkout existentes.

## Anti-Metas

O Bizy nao deve caminhar para:

- marketplace anonimo que apaga a marca da loja;
- CRM cheio de telas sem impacto comercial;
- automacoes que escondem ou corrompem a fonte de verdade;
- modulos que aparecem na UI mas nao funcionam por completo;
- checkout separado da operacao de pedidos;
- relatorios bonitos sem acao seguinte;
- funcionalidades copiadas de plataformas grandes sem encaixe no contexto local.

## Indicadores de Produto

Indicadores principais:

- lojas ativas com perfil publico completo;
- produtos elegiveis publicados;
- visitantes por origem;
- conversao de visita para lead, carrinho ou pedido;
- pedidos por origem: loja, Market, campanha, WhatsApp, live, afiliado e link;
- tempo medio de resposta;
- tempo de confirmacao de pagamento;
- taxa de entrega/conclusao;
- recuperacao de carrinhos, leads e clientes inativos;
- receita gerada por canal;
- tarefas e metas concluidas pela equipa.

## Sequencia Recomendada de Trabalho

1. Consolidar `team-core` como centro operacional e manter compatibilidade com contratos antigos.
2. Fortalecer Studio como centro de loja, publicacao e elegibilidade.
3. Fazer o Market gerar descoberta com origem rastreavel.
4. Garantir que checkout e pedidos fechem o ciclo de conversao.
5. Ligar WhatsApp, IA e automacoes a tarefas e recuperacao reais.
6. Tornar relatorios e metas consequencia natural dos dados operacionais.

## Formula de Validacao

Antes de aprovar um novo spec, aplicar esta pergunta:

> Esta funcionalidade ajuda um negocio real a vender mais, atender melhor, executar com menos falha ou controlar melhor a operacao?

Se a resposta for fraca, o spec deve ser reescrito, adiado ou removido do escopo.
