# Fonte principal do projeto Bizy para ChatGPT

Gerado em: 2026-06-28

Objetivo deste arquivo: servir como fonte unica, detalhada e exportavel para um Projeto no ChatGPT entender a visao, o produto, a arquitetura, os modulos, as regras, os guardrails, o estado atual e a direcao futura do Bizy.

Este arquivo consolida informacao existente na wiki e nos documentos do repositorio. Ele nao deve conter segredos, tokens, senhas, chaves API, credenciais de producao ou dados reais de clientes.

## Como usar esta fonte no ChatGPT

Ao carregar este arquivo como fonte de um Projeto no ChatGPT, use-o como memoria base do Bizy. A IA deve:

- entender o Bizy como um ecossistema operacional de social commerce, vendas, equipa, financas, Market e automacao segura;
- responder com foco pratico, sempre ligado a vender, atender, cobrar, entregar, recuperar, medir, gerir equipa ou controlar financas;
- evitar respostas genericas de "CRM", "marketplace" ou "bot de WhatsApp" sem considerar o contexto real do Bizy;
- respeitar Angola, Kwanza/AOA, telefone angolano, WhatsApp como canal dominante e operacao mobile-first;
- tratar o backend como fonte de verdade para stock, pedido, pagamento, consentimento, permissao, comissao e auditoria;
- preferir automacao conservadora com fallback humano em casos sensiveis;
- manter a loja publica, o Bizy Market e o CRM/Team integrados na mesma operacao;
- lembrar que n8n, Evolution, WhatsApp Cloud API, IA e conectores sociais sao suporte, nao a fonte de verdade.

## Hierarquia de fonte de verdade

Quando houver conflito entre documentos antigos e recentes, priorizar nesta ordem:

1. Este arquivo consolidado.
2. Documentos recentes da wiki em `docs/wiki/pages/`, especialmente:
   - `memoria-projeto-bizy.md`
   - `visao-produto-bizy.md`
   - `bizy-market-lojas-digitais.md`
   - `requisitos-bizy-market.md`
   - `requisitos-funcionais-bizy.md`
   - `requisitos-nao-funcionais-bizy.md`
   - `regras-de-negocio-bizy.md`
   - `identidade-visual-bizy-v2.md`
3. Requisitos formais:
   - `docs/RF-RNF-RN-EMEUV1.md`
   - `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md`
   - `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
4. Codigo atual:
   - `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
   - `backend/prisma/schema.prisma`
   - `frontend/src/rotasApp.tsx`
5. README e documentos antigos, quando nao contradizem a visao mais recente.

O README antigo ainda descreve o Bizy como MVP de automacao de live. Isso continua verdadeiro como origem historica, mas a direcao atual e maior: Bizy e CRM+/Bizy Team para operacao completa de negocios de social commerce, com Market, equipa, financas, inteligencia e automacao controlada.

## Resumo executivo

Bizy nasceu como EMeu, um MVP para automatizar vendas em lives: capturar comentarios, interpretar intencao de compra, extrair telefone angolano e codigo da peca, criar reservas por prioridade e acionar WhatsApp/n8n.

A visao atual e mais ampla. Bizy e um sistema operacional comercial para pequenos e medios negocios que vendem por WhatsApp, lives, loja publica, redes sociais, links de produto, campanhas, afiliados, criadores e marketplace. O produto transforma interacoes dispersas em clientes, pedidos, pagamentos, entregas, tarefas, campanhas, comissoes, relatorios e auditoria.

A evolucao mais recente amplia o CRM+ para Bizy Team: um ecossistema operacional completo que integra:

- CRM de vendas e atendimento;
- catalogo, stock, reservas, pedidos, pagamentos e entrega;
- loja digital propria por negocio;
- Bizy Market como shopping center central;
- checkout unificado;
- social inbox;
- campanhas e templates WhatsApp;
- afiliados, criadores e revendedores;
- tarefas, playbooks e recuperacao comercial;
- gestao de equipa, turnos, metas, desempenho e onboarding;
- financas, fluxo de caixa, DRE, despesas, facturas, recibos, contas a receber/pagar e orcamento;
- inteligencia preditiva, alertas e insights contextuais;
- workflow, projectos, conformidade, auditoria e governanca.

Frase norteadora:

> Toda decisao deve ajudar a loja a vender, atender, cobrar, entregar, recuperar, medir, gerir a equipa ou controlar o dinheiro melhor.

Se uma tela, endpoint, regra, automacao ou relatorio nao ajuda uma dessas coisas, precisa ser repensado, escondido, movido para Admin/Sistema ou deixado para depois.

## Identidade do produto

Nome principal: Bizy.

Marca visual: `bizy.` em lowercase, com ponto final verde esmeralda como assinatura.

Evolucao de posicionamento:

- Fase inicial: EMeu/Bizy como automacao de live commerce.
- Fase atual: Bizy CRM+ de social commerce.
- Visao de evolucao: Bizy Team, um ecossistema operacional para lojas, equipas, financas, Market e automacoes do negocio.

O Bizy nao deve ser apresentado como:

- apenas um bot de WhatsApp;
- apenas um dashboard generico;
- apenas um marketplace;
- apenas um sistema de live;
- apenas uma landing page;
- apenas n8n/Evolution empacotado;
- um chatbot autonomo sem guardrails.

O Bizy deve ser apresentado como:

- centro operacional de vendas sociais;
- fonte de verdade para cliente, produto, pedido, pagamento, entrega, conversa, equipa, comissao e relatorio;
- ferramenta diaria de operacao para donos, vendedoras, atendentes, gestores, financeiros, afiliados e criadores;
- camada de descoberta publica via loja digital e Market, mas sempre conectada ao CRM/Team.

## Contexto de mercado

O Bizy foi desenhado com forte contexto angolano:

- moeda principal: Kwanza/AOA;
- telefones angolanos, incluindo prefixos moveis validos;
- WhatsApp como canal comercial dominante;
- pagamentos por transferencia, IBAN e comprovativo;
- vendedores e donos operando muito pelo telemovel;
- negocios com pouca tolerancia a burocracia;
- necessidade de linguagem simples para utilizadores nao tecnicos;
- operacoes onde live, Instagram, TikTok, WhatsApp, afiliados e loja digital se misturam.

Publico principal:

- vendedoras em live;
- lojas pequenas e medias;
- equipas comerciais por WhatsApp;
- donos de negocio;
- atendentes;
- gestores de loja;
- criadores e afiliados;
- revendedores;
- negocios com produtos fisicos e alto volume de conversa;
- negocios que precisam controlar stock, encomendas, pagamentos, entregas, campanhas e equipa.

## Tese do produto

Pequenos negocios nao precisam primeiro de mais automacao. Precisam de uma fonte de verdade simples para cliente, produto, pedido, pagamento, entrega, conversa, equipa, dinheiro e relatorio. A automacao vem depois, com guardrails.

Essa tese tem implicacoes importantes:

- reserva nao substitui pedido;
- tracking nao substitui pedido nem pagamento;
- comentario social nao vira pedido automaticamente sem regra;
- comprovativo recebido nao e pagamento confirmado;
- campanha sem segmento claro deve ser bloqueada;
- comissao so confirma apos pedido pago;
- n8n nao decide stock, pagamento, permissao ou consentimento;
- IA nao inventa preco, stock, prazo, estado, confirmacao ou promessa de entrega;
- quando houver duvida, o sistema cria tarefa humana com contexto.

## Dores que o Bizy resolve

### Pedidos perdidos durante lives

Problema: durante uma live, varios clientes comentam ao mesmo tempo. A vendedora pode perder ordem, vender produto sem stock, esquecer quem pediu primeiro ou criar reserva duplicada.

Resposta do Bizy:

- captura de comentarios;
- parser de intencao;
- telefone angolano;
- codigo de peca/produto;
- confianca;
- revisao manual;
- reserva por prioridade;
- fila de espera;
- expiracao;
- promocao automatica da fila;
- conversao em pedido.

### Conversas espalhadas

Problema: o cliente comenta na live, chama no WhatsApp, manda comprovativo, pede entrega e depois volta em campanha. Sem CRM, o historico fica invisivel.

Resposta do Bizy:

- Cliente 360;
- conversas CRM;
- timeline de mensagens;
- notas internas;
- tags;
- responsavel;
- SLA;
- proximas acoes;
- pedidos vinculados;
- historico de reservas e pagamentos.

### Stock sem controle

Problema: planilhas, mensagens soltas e memoria do dono causam venda duplicada, produto esgotado divulgado e preparacao confusa.

Resposta do Bizy:

- catalogo;
- SKU/codigo unico por negocio;
- stock;
- variantes;
- fotos;
- movimentos de stock;
- alertas de baixo stock;
- pedidos com itens;
- lista de preparacao;
- lista de entrega.

### Pagamento manual sem auditoria

Problema: comprovativos, confirmacoes, rejeicoes e recibos precisam de historico. Sem isso, a equipa nao sabe quem aprovou ou rejeitou.

Resposta do Bizy:

- comprovativo por pedido/reserva;
- confirmacao/rejeicao com motivo;
- historico de pagamento;
- recibo;
- factura;
- nota de credito;
- auditoria critica.

### Recuperacao comercial fraca

Problema: carrinho abandonado, pedido sem pagamento, mensagem sem resposta, cliente inativo e lead frio desaparecem.

Resposta do Bizy:

- tarefas operacionais;
- playbooks de recuperacao;
- oportunidades recuperaveis;
- funil comercial;
- alertas;
- painel diario;
- campanhas segmentadas;
- sequencias de follow-up.

### Vendas sociais sem rastreio

Problema: posts, reels, criadores, links e campanhas geram interesse, mas o dono nao sabe o que virou lead, pedido ou receita.

Resposta do Bizy:

- Social Inbox;
- tracking;
- links rastreaveis;
- afiliados/criadores;
- mini-lojas;
- atribuicao comercial;
- comissoes;
- relatorios social-receita.

### Equipa sem coordenacao

Problema: dono distribui trabalho pelo WhatsApp, nao sabe quem esta disponivel, quem respondeu, quem vendeu, quem atrasou tarefa ou quem precisa de ajuda.

Resposta do Bizy Team:

- membros e papeis;
- convites por WhatsApp/SMS/email;
- personas de acesso;
- turnos e presenca;
- metas individuais e de equipa;
- desempenho por membro;
- feed de actividade;
- notas internas com mencoes;
- gamificacao opcional;
- passagem de turno;
- projectos comerciais e equipas temporarias.

### Financas desconectadas da operacao

Problema: vendas acontecem no WhatsApp/loja/live, despesas ficam fora, facturas/recibos sao manuais, fluxo de caixa e inadimplencia sao pouco visiveis.

Resposta do Bizy Team:

- ledger financeiro;
- fluxo de caixa;
- DRE mensal;
- categorias de receita/despesa;
- despesas recorrentes;
- contas a receber;
- contas a pagar;
- facturas;
- recibos;
- notas de credito;
- orcamento por categoria;
- previsao de caixa;
- alertas de anomalia.

## Qualidades essenciais

### Operacional antes de decorativo

Toda tela precisa ajudar a vender, atender, cobrar, entregar, recuperar, medir, gerir equipa ou controlar dinheiro. Telas decorativas, hero sections vazias e modulos sem fluxo real devem ser evitados.

### Mobile-first real

O produto precisa funcionar em telemoveis pequenos, especialmente 360px, sem scroll horizontal. A navegacao mobile deve ser objetiva, com atalhos principais e sheet "Mais" para modulos secundarios.

### WhatsApp-first, mas nao WhatsApp-only

WhatsApp e central, mas o Bizy tambem opera loja publica, live, Social Inbox, campanhas, afiliados, Market, equipa, financas e relatorios.

### Backend como fonte de verdade

n8n, IA, Evolution, Cloud API, conectores sociais e frontend nao decidem dados sensiveis. O backend valida negocio, usuario, permissao, modulo, stock, pedido, pagamento, consentimento, politica WhatsApp, auditoria e comissao.

### Automacao com humano no controle

Se houver duvida, criar tarefa humana. Isso e qualidade do produto, nao limitacao.

### Modularidade

Um negocio deve conseguir operar com diferentes combinacoes:

- CRM + WhatsApp;
- live + WhatsApp;
- loja publica sem afiliados;
- Market sem Social Inbox;
- afiliados + loja;
- campanhas + clientes;
- equipa + financas;
- operacao minima sem loja publica.

Modulo desativado nao deve aparecer como promessa vazia na UI nem executar automacoes por baixo.

### Auditoria e seguranca

Tudo que mexe com dinheiro, privacidade, stock, comissao, permissoes, exportacao, desconto, pagamento, entrega, cancelamento ou compartilhamento precisa de trilha.

## Atores e perfis

### Visitante

Pessoa anonima que explora uma loja publica ou o Bizy Market sem login.

Pode:

- ver loja;
- ver produtos;
- buscar no Market;
- abrir produto;
- iniciar checkout;
- clicar para WhatsApp.

Nao deve:

- ver dados privados;
- ver historico do cliente;
- acessar CRM;
- receber tracking com dados pessoais.

### Comprador

Cliente final que inicia compra, envia dados de contacto, faz checkout, acompanha pedido ou segue lojas.

Pode:

- comprar em uma loja;
- comprar em fluxo unificado do Market;
- enviar comprovativo;
- acompanhar compra;
- seguir lojas futuramente;
- consentir ou recusar marketing.

### Dono da loja

Responsavel pelo negocio.

Pode:

- configurar loja;
- gerir equipa;
- ver financas;
- aprovar pagamentos/descontos;
- gerir produtos, pedidos, clientes, campanhas, afiliados e relatorios;
- ativar/desativar modulos;
- ver auditoria conforme permissao.

### Vendedor/atendente

Pessoa que opera o dia a dia.

Pode:

- atender conversas;
- criar pedidos;
- acompanhar pagamentos e entregas conforme permissao;
- usar respostas rapidas;
- gerir tarefas;
- ver metas e comissoes estimadas;
- operar live conforme papel.

Nao deve ver:

- tokens;
- webhooks;
- segredos;
- configuracoes tecnicas;
- n8n interno;
- dados financeiros sensiveis fora de permissao.

### Gestor de loja

Pessoa que coordena equipa e operacao.

Pode:

- acompanhar indicadores;
- gerir turnos;
- distribuir tarefas;
- ver desempenho;
- aprovar acoes sensiveis conforme permissao;
- gerir campanhas e recuperacao.

### Financeiro

Pessoa que controla receitas, despesas, facturas, recibos, contas a receber/pagar e orcamento.

Pode:

- ver fluxo de caixa;
- emitir documentos;
- registrar despesas;
- acompanhar inadimplencia;
- validar ou aprovar movimentos conforme permissao.

### Afiliado/criador/revendedor

Parceiro que divulga produtos ou loja.

Pode:

- receber links rastreaveis;
- ter mini-loja ou pacote de divulgacao;
- acompanhar comissoes conforme regras;
- receber pagamento em lote.

Nao deve:

- ver dados privados de clientes alem do necessario;
- ver historico interno da loja;
- confirmar comissao antes de pedido pago.

### Administrador Bizy

Perfil da propria plataforma.

Pode:

- governar categorias globais do Market;
- suspender lojas/produtos;
- moderar denuncias;
- gerir patrocinados;
- acompanhar repasses;
- auditar operacao da plataforma conforme politica.

### Sistema Bizy

Executa regras, mas respeita guardrails.

Pode:

- classificar comentario;
- sugerir acao;
- criar reserva quando regra for clara;
- bloquear stock;
- gerar tarefas;
- calcular score;
- alertar;
- publicar eventos;
- recalcular relatorios;
- aplicar idempotencia.

Nao pode:

- confirmar pagamento sem regra/permissao;
- conceder desconto sem regra/permissao;
- prometer entrega sem base;
- cancelar pedido sensivel sem auditoria;
- expor dados entre negocios;
- enviar marketing sem consentimento.

## Estrutura geral do produto

O Bizy deve ser entendido em camadas:

1. Nucleo comercial: cliente, produto, pedido, pagamento, entrega, conversa.
2. Canais de entrada: live, WhatsApp, loja publica, Market, Social Inbox, campanhas, afiliados, formularios.
3. Operacao humana: tarefas, SLA, responsavel, notas, equipa, turnos, projectos.
4. Automacao segura: n8n, WhatsApp, IA, sequencias, playbooks, workflow.
5. Gestao do negocio: relatorios, financas, metas, ROI, conformidade, auditoria.
6. Descoberta publica: loja digital, Bizy Market, produtos similares, checkout unificado.

Eixo operacional principal:

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
        -> Equipa -> Financas -> Auditoria
```

Live, loja publica, Social Inbox, campanhas, afiliados e Market sao canais de entrada e aceleradores comerciais. Eles alimentam o mesmo nucleo.

## Modulos principais

### Autenticacao e onboarding

Responsavel pela entrada do utilizador e criacao inicial da loja.

Inclui:

- login por telefone/SMS;
- login estudantil UOR/ISPTEC;
- login Gmail quando OAuth estiver configurado;
- sessao por cookie HttpOnly e compatibilidade Bearer em transicao;
- onboarding de negocio;
- canais de venda;
- dados de pagamento;
- regra de reserva;
- primeiro produto;
- feedback claro quando integracao de login nao estiver configurada.

Entidades relevantes:

- `UsuarioSistema`;
- `IdentidadeAutenticacao`;
- `PerfilEstudantilUsuario`;
- `SessaoUsuario`;
- `CodigoLoginSms`;
- `MembroNegocio`.

### Negocio, papeis, permissoes e modulos

Define quem trabalha em que loja e que funcionalidades estao ativas.

Inclui:

- `Negocio`;
- membros;
- papeis;
- permissoes;
- modulos por negocio;
- relacoes entre negocios;
- compartilhamento controlado de clientes;
- workspace para utilizador que pertence a varios negocios.

Regras:

- `negocioId` e a fronteira principal de tenant;
- modulo desativado nao aparece como promessa vazia e nao executa automacao;
- vendedor comum nao deve ver Admin/Sistema;
- compartilhamento de cliente exige relacao, escopo, motivo, consentimento e auditoria.

### Catalogo, produtos e stock

Cuida dos produtos vendidos.

Inclui:

- SKU/codigo unico por negocio;
- nome;
- descricao;
- preco;
- custo;
- margem;
- stock;
- fotos;
- categoria;
- colecao;
- variantes;
- vitrine publica;
- importacao CSV;
- movimentos de stock;
- alertas de baixo stock;
- produtos sem giro;
- produtos vendidos;
- produtos reservados sem pagamento.

Entidades:

- `Peca`;
- `VariantePeca`;
- `MovimentoStock`.

Regras:

- codigo e unico por negocio, nao globalmente;
- stock livre = stock total menos reservas que bloqueiam;
- produto sem stock nao recebe venda automatica;
- movimento manual de stock exige motivo e responsavel;
- produto no Market exige criterios minimos de publicacao.

### Live, comentarios e parser

Modulo historico inicial do Bizy.

Inclui:

- provider TikTok principal;
- provider Python;
- modo manual;
- comentarios em tempo real;
- parser de intencao;
- telefone angolano;
- codigo da peca;
- confianca;
- revisao manual;
- captura social para Cliente 360;
- avatar e identidade digital quando provider envia dados validos.

Entidades:

- `SessaoLive`;
- `ComentarioRecebido`.

Regras:

- comentario valido precisa de intencao de compra, telefone angolano e codigo/produto;
- telefone e codigo podem vir em qualquer ordem;
- comentarios ambiguos vao para revisao;
- texto original deve ser preservado como evidencia;
- provider pode falhar, mas modo manual mantem operacao.

### Reservas e fila

Modulo de prioridade e bloqueio temporario, especialmente em live.

Inclui:

- primeira pessoa ganha prioridade;
- proximos entram em fila;
- reserva bloqueia stock;
- fila nao bloqueia stock;
- expiracao libera stock;
- cancelamento promove fila;
- pagamento impede expiracao automatica;
- conversao em pedido.

Entidade:

- `Reserva`.

Regras:

- reserva nao substitui pedido;
- pedido e a entidade comercial principal;
- reserva duplicada para mesmo telefone e mesma peca deve ser bloqueada;
- prazo recomendado do piloto historico era 15 minutos, configuravel.

### Pedidos, cobranca e entrega

Modulo da venda formal.

Inclui:

- pedido manual;
- pedido vindo de checkout;
- pedido convertido de reserva;
- multiplos itens;
- desconto com motivo/aprovacao;
- comprovativo;
- confirmacao/rejeicao de pagamento;
- recibo;
- factura;
- preparacao;
- entrega/retirada/orcamento humano;
- cancelamento;
- troca;
- devolucao;
- exportacao.

Entidades:

- `Pedido`;
- `ItemPedido`;
- `Factura`;
- `ItemFactura`;
- `NotaCredito`;
- `ReembolsoPedido`.

Regras:

- pedido pago nao pode ser apagado; so cancelado/devolvido com auditoria;
- desconto exige motivo e pode exigir aprovacao;
- comprovativo recebido nao e pagamento confirmado;
- pagamento confirmado alimenta funil, relatorios, financas e comissoes;
- entrega deve ter estado, responsavel e observacao quando aplicavel.

### Clientes 360

Modulo da relacao da loja com cada pessoa.

Inclui:

- cadastro manual;
- importacao;
- exportacao auditada;
- telefone;
- email;
- WhatsApp;
- aliases sociais;
- preferencias;
- tags;
- consentimentos;
- enderecos;
- metricas;
- historico;
- segmentos;
- fusao de duplicados;
- anonimizacao;
- compartilhamento controlado.

Entidades:

- `ClienteGlobal`;
- `ClienteNegocio`;
- `RelacaoNegocio`;
- `CompartilhamentoCliente`;
- `AuditoriaCompartilhamentoCliente`.

Regra central:

- `ClienteGlobal` identifica a pessoa;
- `ClienteNegocio` representa a relacao comercial daquela pessoa com uma loja;
- uma loja nao ve historico privado de outra sem relacao, consentimento, escopo e auditoria.

### Conversas e atendimento

Inbox comercial do Bizy.

Inclui:

- conversas por cliente/canal;
- mensagens;
- notas internas;
- estado CRM;
- prioridade;
- responsavel;
- SLA;
- filtros;
- proximas acoes;
- resposta WhatsApp;
- pedido contextual;
- tarefas;
- sugestoes de IA quando seguras.

Entidades:

- `ClienteAtendimento`;
- `ConversaAtendimento`;
- `MensagemAtendimento`;
- `MensagemWhatsapp`;
- `OutboxMensagemWhatsApp`.

Regras:

- conversa deve ter cliente, canal e contexto;
- casos sensiveis exigem humano;
- falha de envio deve criar tarefa ou ficar auditavel;
- conversa sem resposta dentro do SLA gera tarefa ou alerta.

### WhatsApp, Evolution, Cloud API e politica

Modulo de envio, recebimento e seguranca do canal WhatsApp.

Inclui:

- Evolution API;
- WhatsApp Cloud API;
- templates;
- categorias oficiais;
- janela de atendimento;
- consentimento;
- opt-out;
- bloqueio de promocao em templates de utilidade/autenticacao;
- fallback para tarefa humana quando envio for inseguro.

Categorias:

- marketing;
- utilidade;
- autenticacao;
- servico.

Guardrails:

- marketing exige consentimento;
- opt-out bloqueia marketing;
- servico depende de janela de atendimento;
- utilidade/autenticacao nao podem conter promocao;
- template precisa estar aprovado;
- sem template/categoria segura, criar tarefa humana.

### n8n e automacoes

n8n executa fluxos, mas nao e fonte de verdade.

Inclui:

- eventos assinados;
- outbox;
- retry;
- endpoints `/n8n/*`;
- consulta de contexto;
- aprovacao humana;
- follow-up;
- workflows importaveis para vendas, atendimento e comprovativo.

Fluxo recomendado:

```text
Backend -> Outbox -> Webhook assinado n8n
        -> n8n consulta contexto
        -> n8n chama endpoint autorizado
        -> backend valida e persiste
```

Regras:

- backend valida tudo;
- n8n nao altera dados fora dos endpoints autorizados;
- se n8n falhar, outbox permite retry;
- IA deve usar apenas dados retornados pelo backend.

### Loja publica, checkout e tracking

Frente publica de venda do negocio.

Inclui:

- loja por slug;
- subdominio;
- produto publico;
- SEO;
- preview social;
- checkout WhatsApp;
- checkout site;
- entrega;
- carrinho abandonado;
- tracking;
- eventos server-side futuros;
- privacidade de identificadores.

Regras:

- compra deve funcionar sem cookies/tracking;
- tracking nao pode conter telefone, email, nome ou endereco;
- checkout deve calcular entrega antes de confirmar;
- carrinho abandonado vira oportunidade se houver consentimento aplicavel;
- loja publica deve consumir configuracao validada pelo backend.

### Bizy Market e perfis de loja

Ramo de produto que combina lojas independentes e shopping center central.

Tese:

- cada negocio tem loja independente com identidade propria e link pessoal como `minhaloja.bizy.space`;
- produtos elegiveis podem aparecer no shopping center central em `market.usebizy.space`;
- o Market aumenta descoberta, mas nao substitui a identidade da loja;
- a execucao comercial continua no CRM/Team.

Componentes:

- Bizy Loja;
- Bizy Market;
- Bizy Checkout;
- Bizy Studio;
- Operacao CRM/Team.

Bizy Loja inclui:

- capa/hero personalizavel;
- avatar/logo;
- descricao;
- localizacao;
- seguidores e seguindo;
- colecoes clicaveis;
- grelha de produtos que muda por colecao;
- botao de seguir;
- contacto;
- checkout;
- subdominio proprio.

Bizy Market inclui:

- busca global;
- categorias globais;
- produtos similares;
- lojas em destaque;
- promocoes;
- novidades;
- mais vendidos;
- filtros por preco, localizacao, entrega, disponibilidade e loja;
- ranking por relevancia, confianca, disponibilidade e desempenho.

Bizy Checkout inclui:

- carrinho de uma loja;
- carrinho de varias lojas;
- compra unificada;
- pedidos filhos por fornecedor;
- pagamento centralizado ou controlado;
- acompanhamento;
- repasses financeiros.

Bizy Studio inclui:

- identidade do perfil;
- colecoes;
- publicacao no Market;
- produtos em destaque;
- checkout;
- pagamentos;
- entrega;
- SEO;
- metricas;
- campanhas;
- seguidores;
- relatorios.

Regras essenciais:

- loja pode ter perfil publico sem estar no Market;
- produto so entra no Market se tiver imagem, preco, categoria global, loja ativa e disponibilidade;
- categoria global e do Bizy; colecao local e da loja;
- similares podem sugerir outros fornecedores, mas nao devem apagar a identidade da loja atual;
- compra multi-loja cria pedidos separados por fornecedor;
- cada fornecedor ve apenas a sua parte;
- dados privados de uma loja nao vazam para outra;
- toda central de controlo fica dentro do CRM/Team.

### Afiliados, criadores e revendedores

Modulo para parceiros comerciais.

Inclui:

- parceiro;
- link rastreavel;
- mini-loja;
- pacote de divulgacao;
- regra de comissao;
- atribuicao;
- comissao estimada;
- comissao confirmada;
- comissao paga;
- comissao revertida;
- lote financeiro;
- saldo;
- antifraude basico.

Entidades:

- `ParceiroComercial`;
- `LinkAfiliado`;
- `ComissaoParceiro`;
- `HistoricoComissaoParceiro`;
- `LotePagamentoComissao`;
- `ItemLotePagamentoComissao`.

Regras:

- comissao so confirma apos pedido pago;
- cancelamento, devolucao ou reembolso revertem comissao;
- correcao manual de atribuicao/comissao exige motivo e auditoria;
- afiliado nao ve dados privados desnecessarios.

### Social Inbox

Modulo de comentarios e interacoes em redes sociais.

Inclui:

- contas sociais;
- captura controlada;
- importacao CSV/manual;
- classificacao conservadora;
- deduplicacao;
- tarefa;
- conversa CRM;
- funil;
- oportunidade de recuperacao;
- WhatsApp a partir de item.

Entidade:

- `SocialInboxItem`.

Regras:

- comentario social vira lead, tarefa, conversa ou oportunidade;
- nao vira pedido confirmado automaticamente sem regra aprovada;
- duvida, reclamacao, desconto, troca ou conflito cria tarefa humana;
- origem, post, provider e permissao ficam preservados.

### Campanhas e templates

Modulo de mensagens segmentadas e autorizadas.

Inclui:

- campanhas por segmento;
- consentimento;
- opt-out;
- template aprovado;
- limite diario;
- preview;
- pausa;
- resultados;
- receita atribuida.

Entidades:

- `CampanhaCrm`;
- `ItemCampanhaCrm`;
- `TemplateWhatsAppNegocio`.

Regras:

- campanha sem segmento claro deve ser bloqueada;
- marketing exige consentimento;
- opt-out bloqueia marketing;
- template precisa estar aprovado e compativel;
- falha nao pode gerar reenvio infinito;
- campanha deve ter mecanismo de pausa imediata.

### Tarefas e recuperacao

Modulo do trabalho humano e recuperacao comercial.

Inclui:

- tarefas manuais;
- tarefas automaticas;
- SLA;
- playbooks;
- oportunidades;
- follow-up;
- cobranca;
- carrinho abandonado;
- cliente inativo;
- pedido parado.

Entidades:

- `TarefaOperacional`;
- `PlaybookRecuperacao`;
- `ExecucaoPlaybookRecuperacao`;
- `MovimentoFunilComercial`;
- `OportunidadeRecuperacao`.

Sinais de recuperacao:

- carrinho abandonado;
- pedido sem pagamento;
- cliente inativo;
- conversa sem resposta;
- produto sem giro;
- WhatsApp click sem compra;
- comentario com intencao sem atendimento.

### Pipeline de vendas

Modulo visual de negocios em andamento.

Inclui:

- kanban com etapas configuraveis por negocio;
- etapas padrao: lead, contacto feito, proposta enviada, negociacao, fechado ganho, fechado perdido;
- arrastar negocios entre etapas;
- valor estimado;
- valor total por etapa;
- motivo obrigatorio ao perder;
- responsavel;
- data prevista de fecho;
- filtros;
- historico de mudanca de etapa.

Regra:

- negocio perdido exige motivo;
- pipeline vazio deve sugerir criar primeiro negocio.

### Agenda e lembretes

Calendario simples para follow-ups, cobrancas e entregas.

Inclui:

- lembrete ligado a cliente, pedido ou conversa;
- follow-up;
- cobranca;
- entrega;
- callback;
- vista diaria e semanal;
- notificacao de vencimento;
- recorrencia;
- integracao com tarefas.

Regra:

- lembrete vencido sem acao vira tarefa visivel no painel.

### Metas de vendas

Modulo de objectivos comerciais.

Inclui:

- meta de receita;
- meta de pedidos fechados;
- meta de clientes novos;
- meta por vendedor;
- progresso visual;
- comparacao com periodo anterior;
- alerta quando meta estiver em risco.

Regra:

- meta sem progresso nao deve ser decorativa; deve mostrar o que falta e sugerir acao.

### Cotacoes e orcamentos

Modulo de propostas antes de fechar pedido.

Inclui:

- cotacao com produtos, quantidades e precos;
- desconto;
- validade;
- envio por WhatsApp;
- conversao em pedido;
- historico por cliente.

Regra:

- cotacao aceite deve gerar pedido sem o vendedor preencher tudo de novo.

### Respostas rapidas e atalhos

Biblioteca de mensagens prontas para atendimento.

Inclui:

- categorias: saudacao, preco, disponibilidade, pagamento, entrega, pos-venda;
- variaveis dinamicas: nome do cliente, produto, preco, IBAN;
- atalho por teclado ou lista rapida;
- favoritas por vendedor;
- importacao/exportacao.

Regra:

- resposta rapida nao e template WhatsApp oficial; e texto interno usado dentro da conversa.

### Notas e historico de actividades

Timeline unificada do cliente e da operacao.

Inclui:

- notas manuais;
- chamadas;
- visitas;
- reunioes;
- WhatsApp;
- email;
- responsavel;
- timeline cronologica;
- filtro por tipo.

Regra:

- actividade registrada deve aparecer na timeline do cliente e na agenda do vendedor quando aplicavel.

### Formularios de captacao de leads

Modulo para recolher contactos sem depender apenas de live.

Inclui:

- formulario com nome, telefone, produto de interesse;
- link partilhavel por WhatsApp, Instagram bio ou site;
- lead criado automaticamente;
- notificacao ao vendedor;
- tag automatica;
- multiplos formularios por negocio;
- integracao com pipeline e campanhas.

Regra:

- lead sem follow-up vira tarefa.

### Sequencias automaticas

Automacao simples de follow-up.

Inclui:

- boas-vindas;
- cobranca apos pedido criado;
- pos-venda apos entrega confirmada;
- reactivacao apos inactividade;
- espera configuravel;
- pausa se cliente responder;
- passo de template, tarefa ou tag;
- relatorio de conversao.

Regra:

- sequencia para se o cliente responder ou se o objetivo for atingido; nunca disparar em loop.

### Relatorios

Relatorios devem responder perguntas praticas:

- quanto vendeu;
- o que esta pendente;
- que produto performou;
- que campanha converteu;
- que canal gerou receita;
- que atendimento atrasou;
- que afiliado gerou comissao;
- que cliente pode ser recuperado;
- como esta cada vendedor em relacao a meta;
- que cotacoes estao por responder;
- que sequencias estao a converter;
- como esta o caixa;
- que despesas passaram do orcamento;
- que projecto comercial deu retorno.

Relatorio tecnico pertence a Admin/Sistema.

### Equipa / Bizy Team

Modulo de gestao de pessoas e operacao interna.

Inclui:

- membros;
- convites;
- magic links;
- passwordless OTP via WhatsApp/SMS;
- personas de acesso;
- papeis;
- permissoes;
- desempenho por membro;
- ranking opcional;
- metas individuais e colectivas;
- turnos;
- presenca;
- feed de actividade;
- notas internas;
- mencoes;
- checklist de primeiro dia;
- tarefa de boas-vindas;
- mentoria;
- comissao estimada;
- gamificacao opcional;
- notificacoes personalizadas;
- passagem de turno.

Entidades recentes:

- `PersonaPapel`;
- `ConviteEquipa`;
- `NotaInterna`;
- `FeedActividade`;
- `ChecklistOnboarding`;
- `MascaramentoDados`;
- `ConfiguracaoGamificacao`;
- `RankingEquipa`;
- `MetaVendas`;
- `TurnoMembro`;
- `RegistoPresenca`;
- `PassagemTurno`.

Regras:

- convite deve reduzir friccao, especialmente por WhatsApp;
- novo membro deve ver valor rapido, nao dashboard vazio;
- vendedor/atendente deve ver apenas o necessario para sua funcao;
- dados sensiveis podem ser mascarados por papel;
- actividade registrada serve como prova auditavel do trabalho realizado;
- gamificacao deve ser opcional e configuravel.

### Financas

Modulo financeiro integrado a operacao.

Inclui:

- categorias financeiras;
- movimentos de entrada e saida;
- fluxo de caixa;
- DRE;
- despesas;
- despesas recorrentes;
- contas a receber;
- contas a pagar;
- facturas;
- recibos;
- notas de credito;
- reembolsos;
- orcamento por periodo;
- regras fiscais;
- validacao fiscal;
- fechamento de periodo;
- multi-moeda em evolucao;
- reconciliacao bancaria futura.

Entidades recentes:

- `CategoriaFinanceira`;
- `MovimentoFinanceiro`;
- `Despesa`;
- `ContaReceber`;
- `ContaPagar`;
- `OrcamentoPeriodo`;
- `Factura`;
- `ItemFactura`;
- `NotaCredito`;
- `RegraFiscal`.

Regras:

- todo movimento financeiro deve ter origem classificada;
- entradas e saidas devem pertencer a um negocio;
- operacoes financeiras exigem permissoes explicitas;
- criacao, anulacao, pagamento, reembolso e fechamento precisam de auditoria;
- linguagem financeira deve ser operacional e compreensivel, nao contabilistica demais;
- financeiro deve ligar vendas, pedidos, comissoes, despesas e caixa.

### Inteligencia preditiva

Modulo de previsoes, scores e insights contextuais.

Inclui:

- previsao de demanda por SKU;
- alerta de reposicao;
- produto encalhado;
- sazonalidade;
- score de churn;
- coortes de cliente;
- LTV;
- lead scoring;
- previsao de fluxo de caixa;
- risco de deficit;
- previsao de receita;
- anomalias;
- atraso em tarefas/projectos;
- gargalos de funil;
- insights dentro dos fluxos de trabalho.

Entidades recentes:

- `PrevisaoDemanda`;
- `ScoreCliente`;
- `PrevisaoFluxoCaixa`;
- `InsightPreditivo`;
- `FeedbackInsight`.

Regras:

- insight deve vir com explicacao e acao sugerida;
- baixa confianca nao deve executar acao sensivel;
- previsao deve respeitar isolamento por negocio;
- feedback do utilizador deve alimentar melhoria.

### Workflow e fluxos automaticos

Modulo de orquestracao cross-funcional.

Inclui:

- fluxos automaticos;
- passos condicionais;
- execucao auditavel;
- pausa/retoma;
- notificacoes contextuais;
- criacao de tarefas;
- atualizacao de dashboards.

Entidades:

- `FluxoAutomatico`;
- `PassoFluxo`;
- `ExecucaoFluxo`;
- `ConfiguracaoNotificacao`;
- `ContadorNotificacaoDiaria`.

Regras:

- fluxos devem ter historico de execucao;
- falhas devem ser visiveis;
- automacao deve poder ser pausada sem perder estado;
- fluxo nao contorna regras do backend.

### Projectos e projectos comerciais

Modulo de adaptabilidade estrutural e operacoes temporarias.

Inclui:

- departamentos;
- projectos;
- entregas/milestones;
- membros de projecto;
- permissoes contextuais;
- projectos comerciais para live/campanha/lancamento;
- pool de stock protegido;
- equipa temporaria;
- fila do projecto;
- debriefing;
- comissoes ao fechar projecto.

Entidades:

- `Departamento`;
- `Projecto`;
- `EntregaProjecto`;
- `MembroProjecto`;
- `ProjetoComercial`;
- `PoolStockProjeto`;
- `EquipaProjeto`;
- `FilaProjeto`;
- `DebriefingProjeto`.

Regras:

- membro pode pertencer a departamento e a projectos;
- permissao pode variar por contexto;
- projecto comercial pode reservar pool de stock;
- tarefas/leads da live/campanha podem ir para fila do projecto;
- fecho do projecto gera relatorio e pode gerar lote financeiro de comissoes.

### Conformidade e ROI

Modulo de governanca, fiscalidade e valor percebido.

Inclui:

- regras fiscais por jurisdicao;
- validacao de factura;
- arquivo digital;
- relatorios fiscais;
- metricas de ROI;
- economia de tempo por automacao;
- receita atribuida a funcionalidades;
- comparacao antes/depois;
- adopcao da IA;
- DAU/MAU por modulo;
- profundidade de uso;
- NPS.

Entidades:

- `BaselineKPI`;
- `MetricaAdopcao`;
- `PesquisaNPS`.

Regras:

- valor do Bizy deve ser medido, nao apenas presumido;
- funcionalidades subutilizadas devem sugerir ativacao, formacao ou simplificacao.

## Fluxos operacionais

### Live, comentario, reserva e pedido

```text
Live -> Comentario -> Parser -> Revisao se ambiguo
     -> Reserva -> Fila se sem stock -> Pagamento
     -> Pedido completo -> Entrega -> Relatorio
```

Regras:

- comentario valido precisa de intencao, telefone angolano e codigo/produto;
- primeiro comentario valido ganha prioridade;
- reserva bloqueia stock;
- reserva expira;
- fila e promovida;
- reserva pode virar pedido;
- vendedor pode usar modo manual se provider falhar.

### Atendimento WhatsApp e conversa CRM

```text
Cliente -> WhatsApp/Comentario -> Conversa CRM
        -> Contexto Cliente 360
        -> Proxima acao
        -> Resposta, template, pedido, tarefa ou aprovacao humana
```

Regras:

- conversa deve ter cliente/canal/contexto;
- casos sensiveis exigem humano;
- texto livre de servico depende da janela do WhatsApp;
- template precisa estar aprovado;
- falha de envio cria tarefa ou fica auditavel.

### Pedido, pagamento e entrega

```text
Pedido -> Itens -> Total -> Comprovativo
       -> Confirmar ou rejeitar pagamento
       -> Preparacao -> Entrega/retirada
       -> Entregue -> Pos-venda/relatorio
```

Regras:

- pedido e entidade comercial principal;
- desconto exige motivo/aprovacao;
- comprovativo precisa de historico;
- pagamento confirmado alimenta relatorios e financas;
- entrega precisa de estado operacional.

### Loja publica, checkout e tracking

```text
Visita -> Produto visto -> Clique WhatsApp ou Checkout
       -> Cliente identificado -> Pedido
       -> Pagamento -> Receita atribuida
```

Regras:

- compra funciona sem cookies;
- tracking nao carrega dados pessoais;
- checkout calcula entrega antes de confirmar;
- carrinho abandonado vira oportunidade quando houver consentimento.

### Bizy Market e checkout unificado

```text
Comprador -> Market ou Loja -> Produto -> Carrinho
          -> Checkout unificado
          -> Compra
          -> Pedido(s) por fornecedor
          -> Pagamento/Comprovativo
          -> CRM de cada loja
          -> Entrega/Repasses/Relatorio
```

Regras:

- carrinho de uma loja gera pedido para essa loja;
- carrinho multi-loja gera compra unificada e pedidos filhos;
- cada loja ve apenas seus pedidos;
- comprador deve ter experiencia unica;
- repasse financeiro precisa de trilha.

### Afiliado, criador e comissao

```text
Parceiro -> Link -> Visita/Checkout/Pedido
         -> Atribuicao -> Pedido pago
         -> Comissao confirmada -> Lote/Pagamento
```

Regras:

- link preserva origem;
- autoindicacao deve ser bloqueada;
- comissao so confirma com pedido pago;
- cancelamento/devolucao/reembolso revertem comissao.

### Social Inbox

```text
Post/Live/Reel/Story -> Comentario social
                     -> Classificacao conservadora
                     -> Lead/Tarefa/Conversa/Oportunidade
                     -> WhatsApp ou pedido manual aprovado
```

Regras:

- comentario social nao vira pedido confirmado automaticamente;
- reclamacao, desconto, troca ou conflito cria tarefa humana;
- origem e permissao ficam preservadas.

### Campanha

```text
Segmento -> Template aprovado -> Preview
         -> Confirmacao -> Envio -> Resultado
         -> Receita atribuida ou tarefa se falhar
```

Regras:

- campanha sem segmento claro e bloqueada;
- marketing exige consentimento;
- opt-out bloqueia marketing;
- falha nao gera reenvio infinito.

### Recuperacao comercial

```text
Sinal perdido -> Playbook -> Oportunidade
              -> Tarefa humana ou acao segura
              -> Conversao recuperada ou perda registrada
```

Sinais:

- carrinho abandonado;
- pedido sem pagamento;
- cliente inativo;
- conversa sem resposta;
- produto sem giro;
- WhatsApp click sem compra;
- comentario com intencao sem atendimento.

### Financas

```text
Pedido pago / Receita manual / Comissao recebida
     -> Movimento financeiro de entrada
     -> Fluxo de caixa / DRE / Relatorio

Despesa / Conta a pagar / Reembolso / Comissao paga
     -> Movimento financeiro de saida
     -> Orcamento / Fluxo de caixa / Auditoria
```

Regras:

- movimento financeiro deve ter origem classificada;
- facturas e recibos precisam de numeracao e auditoria;
- despesa recorrente pode gerar lancamentos futuros;
- contas vencidas geram tarefa/cobranca.

### Equipa e turno

```text
Convite -> Aceite -> Onboarding -> Papel/Persona
        -> Turno/Presenca -> Tarefas/Conversas
        -> Desempenho/Meta/Comissao
        -> Passagem de turno
```

Regras:

- acesso deve ser mobile-first e com pouca friccao;
- o novo membro precisa de primeira tarefa clara;
- painel deve se adaptar ao papel.

## Dominio e entidades

### Tenant principal

`Negocio` e a fronteira principal de tenant. Quase todo dado comercial deve carregar ou resolver `negocioId`.

Inclui:

- produtos;
- pedidos;
- clientes da loja;
- conversas;
- mensagens;
- campanhas;
- tarefas;
- afiliados;
- comissoes;
- tracking;
- eventos;
- financas;
- equipa;
- projectos;
- insights.

### Modelos Prisma existentes ou recentes

Catalogo, live e reservas:

- `Peca`;
- `VariantePeca`;
- `MovimentoStock`;
- `Reserva`;
- `ComentarioRecebido`;
- `SessaoLive`.

Pedidos e atendimento:

- `Pedido`;
- `ItemPedido`;
- `MensagemWhatsapp`;
- `ClienteAtendimento`;
- `ConversaAtendimento`;
- `MensagemAtendimento`.

Eventos e outbox:

- `EventoSistema`;
- `OutboxEventoN8n`;
- `OutboxMensagemWhatsApp`;
- `EventoOperacional`;
- `JobOperacional`.

Identidade, negocios e modulos:

- `UsuarioSistema`;
- `IdentidadeAutenticacao`;
- `PerfilEstudantilUsuario`;
- `Negocio`;
- `MembroNegocio`;
- `ModuloNegocio`;
- `CodigoLoginSms`;
- `SessaoUsuario`;
- `InstanciaWhatsApp`;
- `InstanciaInstagram`.

Clientes:

- `ClienteGlobal`;
- `ClienteNegocio`;
- `RelacaoNegocio`;
- `CompartilhamentoCliente`;
- `AuditoriaCompartilhamentoCliente`.

CRM, social, funil e recuperacao:

- `SocialInboxItem`;
- `PlaybookRecuperacao`;
- `ExecucaoPlaybookRecuperacao`;
- `MovimentoFunilComercial`;
- `OportunidadeRecuperacao`;
- `TarefaOperacional`.

Campanhas e WhatsApp:

- `TemplateWhatsAppNegocio`;
- `CampanhaCrm`;
- `ItemCampanhaCrm`.

Tracking, afiliados e comissoes:

- `EventoTrackingComercial`;
- `ParceiroComercial`;
- `LinkAfiliado`;
- `ComissaoParceiro`;
- `HistoricoComissaoParceiro`;
- `LotePagamentoComissao`;
- `ItemLotePagamentoComissao`.

Market e checkout:

- `SeguidorLoja`;
- `DenunciaMarket`;
- `ReservaStockCheckout`;
- `CompraUnificada`;
- `PedidoFilho`;
- `RepasseFinanceiro`;
- `ReembolsoPedido`.

Equipa:

- `PersonaPapel`;
- `ConviteEquipa`;
- `NotaInterna`;
- `FeedActividade`;
- `ChecklistOnboarding`;
- `MascaramentoDados`;
- `ConfiguracaoGamificacao`;
- `RankingEquipa`;
- `MetaVendas`;
- `TurnoMembro`;
- `RegistoPresenca`;
- `PassagemTurno`.

Financas:

- `CategoriaFinanceira`;
- `MovimentoFinanceiro`;
- `Despesa`;
- `ContaReceber`;
- `ContaPagar`;
- `OrcamentoPeriodo`;
- `Factura`;
- `ItemFactura`;
- `NotaCredito`.

Inteligencia e workflow:

- `PrevisaoDemanda`;
- `ScoreCliente`;
- `PrevisaoFluxoCaixa`;
- `InsightPreditivo`;
- `FeedbackInsight`;
- `FluxoAutomatico`;
- `PassoFluxo`;
- `ExecucaoFluxo`;
- `ConfiguracaoNotificacao`;
- `ContadorNotificacaoDiaria`.

Projectos e conformidade:

- `Departamento`;
- `Projecto`;
- `EntregaProjecto`;
- `MembroProjecto`;
- `ProjetoComercial`;
- `PoolStockProjeto`;
- `EquipaProjeto`;
- `FilaProjeto`;
- `DebriefingProjeto`;
- `RegraFiscal`;
- `BaselineKPI`;
- `MetricaAdopcao`;
- `PesquisaNPS`.

## Regras de negocio essenciais

### Comentarios e parser

- Comentario valido exige intencao de compra, telefone angolano e codigo/produto.
- Ordem entre telefone e codigo nao altera validade.
- Falta de telefone, codigo, telefone invalido ou confianca baixa envia para revisao manual.
- Sem intencao de compra: ignorar para venda, manter historico.
- Parser deve aceitar linguagem informal como "qro", "meu", "e meu", "pega", "reserva", "guarda", "fica pra mim".

### Stock e reservas

- Codigo de produto e unico por negocio.
- Quantidade zero significa esgotado/indisponivel.
- Produto vendido/esgotado nao recebe reserva automatica.
- Reserva bloqueia stock; fila nao bloqueia.
- Primeiro comentario valido ganha reserva.
- Mesmo telefone nao pode ter reserva ativa duplicada para mesma peca.
- Reserva expirada ou cancelada promove primeiro da fila se houver stock.

### Pagamentos

- Comprovativo recebido nao e pagamento confirmado.
- Pagamento so confirma por acao autorizada ou regra explicita.
- Pagamento rejeitado exige motivo.
- Reserva paga nao expira automaticamente.
- Pedido pago nao pode ser apagado sem trilha de cancelamento/devolucao.

### WhatsApp e campanhas

- Marketing exige consentimento.
- Opt-out bloqueia marketing.
- Utilidade serve para pedido, pagamento e entrega, sem promocao.
- Autenticacao e apenas para OTP/login/validacao.
- Servico depende da interacao do cliente e janela WhatsApp.
- Template ausente ou nao aprovado gera tarefa humana.
- Campanha sem segmento claro deve ser bloqueada.
- Falha de campanha nao pode gerar reenvio infinito.

### n8n, IA e fonte de verdade

- Backend e fonte de verdade para stock, preco, reserva, pedido, pagamento e fila.
- n8n nao altera dados fora de endpoints autorizados.
- IA usa apenas dados retornados pelo backend.
- IA nao inventa preco, stock, prazo, estado ou confirmacao.
- Eventos para n8n devem usar contratos permitidos.

### Clientes e privacidade

- Telefone canonico e identificador principal, aliases sociais complementam.
- Fusao de cliente so por acao autorizada.
- Exportacao de clientes exige permissao e auditoria.
- Dados pessoais nao devem aparecer em URL, cookies, tracking ou logs publicos.
- Cliente pode pedir remocao/anonimizacao, preservando exigencias fiscais/financeiras.

### Afiliados e comissoes

- Link rastreavel nao sobrescreve dados confirmados sem auditoria.
- Comissao confirmada depende de pedido pago, atribuicao valida e ausencia de cancelamento/devolucao.
- Correcao manual de atribuicao/comissao exige motivo.
- Afiliado ve apenas dados necessarios.

### Market

- Produto no Market exige loja ativa, imagem, preco, categoria global e disponibilidade.
- Produto pode existir no perfil da loja sem aparecer no Market.
- Patrocinio nao deve contornar bloqueios de seguranca/publicacao.
- Identidade do fornecedor deve ser preservada nos cards e no checkout.
- Similares nao devem confundir o comprador sobre quem vende o produto.

### Financas

- Todo movimento financeiro pertence a um negocio.
- Todo movimento financeiro precisa de origem classificada.
- Operacoes financeiras exigem permissao explicita.
- Facturas, recibos, notas de credito, despesas e reembolsos exigem auditoria.
- Validacao fiscal deve bloquear emissao nao conforme.

### Equipa

- Permissoes devem seguir papel/persona e contexto.
- Vendedor/atendente deve ver apenas o necessario para trabalhar.
- Dados sensiveis podem ser mascarados por papel.
- Actividade da equipa deve ser auditavel.
- Passagem de turno deve preservar pendencias.

## Guardrails inegociaveis

### Nao fazer

- Nao centralizar tudo no `index`.
- Nao transformar deploy/VPS/Docker/n8n na memoria principal do produto.
- Nao criar telas decorativas em areas operacionais.
- Nao criar menu para modulo sem fluxo real.
- Nao mostrar tokens, providers, n8n, webhooks e debug a vendedor comum.
- Nao confirmar pagamento automaticamente sem regra e permissao.
- Nao conceder desconto, resolver reclamacao, cancelar pedido ou prometer entrega sem trilha.
- Nao usar dados pessoais em tracking, URL, cookies ou identificadores publicos.
- Nao escrever regra pesada em handler HTTP se deve estar em use case.
- Nao quebrar isolamento por `negocioId`.
- Nao depender de Evolution, n8n ou IA como fonte de verdade.
- Nao apagar a identidade da loja dentro do Market.
- Nao criar checkout que gere pedidos impossiveis de operar.
- Nao permitir personalizacao publica que destrua contraste, mobile ou seguranca.
- Nao automatizar financeiro sem auditoria.

### Fazer

- Validar entradas HTTP com Zod.
- Colocar regra de negocio em use cases.
- Usar repositorios/providers por contrato.
- Auditar acoes sensiveis.
- Criar tarefas humanas quando automacao for insegura.
- Ocultar modulos desativados.
- Dar estados vazios com proxima acao.
- Manter interface densa, clara e escaneavel.
- Testar fluxo critico.
- Preservar contexto do negocio e permissao.

## Arquitetura tecnica

### Stack

Backend:

- Node.js;
- TypeScript;
- Fastify;
- Zod;
- Prisma;
- PostgreSQL;
- Vitest.

Frontend:

- React;
- Vite;
- TypeScript;
- React Router;
- Tailwind CSS;
- componentes estilo shadcn/Radix;
- lucide-react;
- Vitest.

Automacao e integracoes:

- n8n;
- Evolution API;
- WhatsApp Cloud API;
- Ombala SMS;
- TikTok live providers;
- Instagram provider em evolucao;
- Redis/Upstash para rate limit distribuido quando necessario.

Infra:

- Docker Compose;
- PostgreSQL;
- Redis;
- n8n;
- Evolution API;
- Evolution Manager;
- Caddy opcional;
- scripts de backup/restore;
- ngrok para tunel local quando necessario.

### Regra principal do backend

```text
Rota HTTP
  -> validacao Zod
  -> use case
  -> repositorio/provider por contrato
  -> dominio/eventos/auditoria
```

Handlers HTTP nao devem conter regra pesada nem acesso direto ao banco quando existe use case adequado.

### Composicao

Arquivos centrais:

- `backend/src/main.ts`;
- `backend/src/infra/http/criarAplicacao.ts`;
- `backend/src/infra/http/ContextoAplicacao.ts`;
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`;
- `backend/src/dominio/repositorios/contratos.ts`;
- `backend/src/use-case/repositorios/RepositorioPrisma.ts`;
- `backend/src/use-case/repositorios/RepositorioMemoria.ts`.

### Modulos HTTP registrados atualmente

O manifesto HTTP inclui:

- saude;
- autenticacao;
- lives;
- catalogo;
- clientes;
- campanhas-governanca;
- apoio-comercial;
- contratos;
- loja-publica;
- bizy-market;
- afiliados;
- diagnosticos;
- media;
- pedidos;
- reservas;
- integracoes;
- n8n;
- operacional;
- painel;
- admin-governanca;
- checkout-unificado;
- equipa;
- financas;
- inteligencia;
- workflow;
- projectos;
- conformidade.

### Use cases centrais

Exemplos relevantes:

- `MotorReservas`;
- `ProcessadorComentarios`;
- `GestaoPecasUseCase`;
- `GestaoPedidosUseCase`;
- `GestaoClientesCrmUseCase`;
- `GestaoAtendimentoCrmUseCase`;
- `GestaoTarefasOperacionaisUseCase`;
- `GestaoSocialInboxUseCase`;
- `GestaoOportunidadesRecuperacaoUseCase`;
- `GestaoCampanhasCrmUseCase`;
- `GestaoAfiliadosUseCase`;
- `LojaPublicaUseCase`;
- `BizyMarketUseCase`;
- `CheckoutUnificadoUseCase`;
- `RelatoriosComerciaisUseCase`;
- `AutenticacaoTelefoneUseCase`;
- `OnboardingBizyUseCase`;
- `GestaoEquipaUseCase`;
- `GestaoFinancasUseCase`;
- `InteligenciaPreditivaUseCase`;
- `GestaoProjectosUseCase`;
- `GestaoWorkflowUseCase`;
- `ConformidadeROIUseCase`.

## Frontend e experiencia

### Rotas publicas

- `/` - home ou loja publica conforme subdominio;
- `/login` - login;
- `/lojas/:slug` - perfil/loja publica;
- `/lojas/:slug/produtos/:codigo` - produto publico;
- `/lojas/:slug/catalogos/:catalogo` - catalogo partilhavel;
- `/market` - Bizy Market;
- `/market/categorias/:categoria` - categoria global;
- `/market/lojas` - diretorio de lojas;
- `/market/lojas/:slug` - perfil da loja no Market;
- `/checkout` - checkout unificado.

### Rotas comerciais principais

Hoje:

- `/app` - Painel / Comando do dia;
- `/app/live` - Central de live.

Vendas e atendimento:

- `/app/reservas` - Pedidos;
- `/app/tarefas` - Tarefas;
- `/app/conversas` - Atendimento;
- `/app/clientes` - Clientes;
- `/app/recuperacao` - Recuperacao;
- `/app/campanhas` - Campanhas;
- `/app/social-inbox` - Social Inbox.

Comercial/CRM:

- `/app/pipeline`;
- `/app/cotacoes`;
- `/app/agenda`;
- `/app/metas`;
- `/app/respostas-rapidas`;
- `/app/actividades`;
- `/app/formularios`;
- `/app/sequencias`.

Vitrine:

- `/app/catalogo`;
- `/app/loja-publica`;
- `/app/afiliados`;
- `/app/market` ou area de Studio/Market quando aplicavel.

Gestao:

- `/app/relatorios`;
- `/app/equipa`;
- `/app/pagamentos`;
- `/app/administracao`;
- `/app/financas`;
- `/app/inteligencia`;
- `/app/projectos`;
- `/app/workflow`;
- `/app/conformidade`.

Admin/Sistema:

- `/app/comentarios`;
- `/app/diagnosticos`;
- `/app/auditoria`.

Rota oculta:

- `/onboarding`.

### Direcao visual v2

Bizy v2 e um CRM organico, amigavel e comercial. A interface deve parecer operacional, mas humana: leve, clara, comercial e sem ruido visual.

Marca:

- wordmark oficial: `bizy.`;
- lowercase;
- ponto final esmeralda;
- favicon/app icon: `b.` branco em base escura;
- simbolo antigo de folha/check e legado e nao deve reaparecer.

Tokens principais:

- fundo quente/off-white;
- superficies brancas;
- neutros warm/creme, nao cool/azulado;
- verde esmeralda como primaria;
- amber para pendente/atencao;
- blue para informacao/em curso;
- rose para erro/urgencia;
- violet para destaque/VIP;
- lime como destaque pontual.

UX:

- telas internas densas, claras e escaneaveis;
- acoes previsiveis;
- poucos cliques/toques;
- mobile-first;
- Admin/Sistema separado de loja;
- estados vazios com proxima acao;
- texto curto e humano;
- sem paginas decorativas.

Cards:

- brancos;
- borda fina;
- sombra sutil;
- raio moderado;
- hierarquia por conteudo, nao por decoracao.

Atendimento:

- deve parecer inbox comercial;
- coluna de conversas;
- thread central;
- painel lateral no desktop;
- no mobile, lista -> detalhe;
- composer fixo;
- acoes inteligentes como chips, nao blocos pesados.

Loja individual:

- fundo quente;
- header claro;
- marca em pill branca;
- categorias em chips;
- cards de produto brancos;
- acoes primarias verdes;
- sheets de produto/checkout com rodape fixo.

## Estado atual resumido

O Bizy ja possui uma fundacao ampla:

- autenticacao por telefone/SMS, Google e login estudantil;
- onboarding de negocio e produto inicial;
- multi-negocio, membros, papeis, permissoes e modulos;
- catalogo, stock, variantes, movimentos e importacao;
- live, comentarios, parser, reservas, fila e pagamentos;
- pedidos completos com itens, comprovativo, entrega, recibo e exportacao;
- clientes 360, segmentos, enderecos, fusao, compartilhamento e anonimizacao;
- atendimento/conversas CRM, mensagens, notas, politica WhatsApp e pedido contextual;
- loja publica, checkout, tracking e carrinho abandonado;
- Bizy Market com produtos, categorias, lojas, similares e Studio em evolucao;
- checkout unificado e estruturas multi-loja em evolucao;
- afiliados, links, mini-lojas, comissoes, lotes e auditoria;
- campanhas, templates, governanca e jobs;
- Social Inbox, captura/importacao, WhatsApp a partir de item;
- funil, oportunidades, playbooks e tarefas;
- outbox n8n/WhatsApp, reprocessamento, auditoria e saude;
- relatorios comerciais, resumo diario, receita social, entregas, live piloto, CSV/PDF;
- media storage;
- Evolution, webhooks idempotentes, templates e envio manual;
- n8n com endpoints protegidos;
- Docker Compose, scripts de dev, backup, restore, ngrok, bootstrap e Prisma;
- equipa, financas, inteligencia, workflow, projectos e conformidade em evolucao recente.

## Prioridades de lancamento

### P0

P0 bloqueia primeiro cliente real com experiencia minima aceitavel.

Foco:

- checkout visual completo;
- SEO e preview social renderizado nas paginas publicas;
- aviso/banner de privacidade e tracking quando aplicavel;
- paginacao padronizada com volume;
- estabilidade e clareza da loja publica e Market em mobile;
- manter experiencia sem scroll horizontal;
- garantir que modulos desativados nao aparecem.

Algumas lacunas antigas ja foram fechadas, como estados vazios em novas paginas, ocultacao de modulos desativados e criacao de paginas CRM novas. Ainda assim, verificar no codigo antes de assumir 100%.

### P1

Melhora a primeira operacao comercial:

- perfil Cliente 360 polido;
- criar pedido diretamente na conversa;
- envio real de imagem/documento no WhatsApp;
- resultados de campanha por webhook/status;
- gestao visual de colecoes;
- categorias ocultas se nao tiverem uso;
- textos revisados para vendedora nao tecnica;
- templates WhatsApp por evento transacional;
- tarefas automaticas para falhas;
- sequenciador pos-venda;
- aliases sociais completos;
- prioridade visual para VIP, reclamacao e pagamento pendente.

### P2

Evolucao guiada por feedback real:

- portal de afiliado;
- funil e playbooks mais maduros;
- catalogos digitais selecionaveis;
- conectores sociais oficiais;
- bus unico de eventos;
- opt-out granular por canal;
- comissao por meta;
- WhatsApp OTP completo;
- sincronizacao de templates;
- link curto e associacao posterior;
- carrinho persistente na conversa;
- multi-moeda real;
- dominio personalizado;
- painel de emergencia;
- motor de explicabilidade;
- reprocessamento de comissoes;
- teste de carga;
- chargeback e fraude;
- pedidos diretos por Social Inbox;
- correccao manual de atribuicao;
- notificacoes internas;
- entregas/logistica avancada;
- painel personalizavel.

## Roadmap Bizy Team

Visao da migracao:

O Bizy CRM+ deve evoluir para Bizy Team, deixando de ser somente uma ferramenta utilitaria e tornando-se o sistema operacional central do negocio.

Pilares:

1. Motor de inteligencia preditiva.
2. Plataforma de gestao financeira integrada.
3. Modo equipa avancado.
4. Interface de workflow integrada.
5. Adaptabilidade estrutural: departamentos + projectos.
6. Conformidade regulatoria e e-invoicing.
7. Metricas de ROI e adopcao.
8. Projectos comerciais, lives e campanhas com equipa temporaria e stock protegido.

Lacunas estrategicas a continuar:

- notificacoes proactivas via WhatsApp para gestores;
- modo sombra para dono/admin;
- check-in de turno via WhatsApp;
- war rooms para projectos comerciais;
- placar ao vivo;
- reconciliacao bancaria;
- e-invoicing estruturado;
- adaptadores para gateways fiscais/Peppol/API governamental;
- escalabilidade forte para grandes equipas e alto volume financeiro;
- backups financeiros com retencao longa;
- API publica/documentada para sistemas contabeis.

## Instrucoes para outra IA trabalhar no Bizy

Antes de propor ou implementar algo, responder mentalmente:

- Que dor real da loja isto resolve?
- Isto ajuda vender, atender, cobrar, entregar, recuperar, medir, gerir equipa ou controlar dinheiro?
- Qual modulo esta envolvido?
- Qual entidade sera afetada?
- O dado pertence a um `Negocio`?
- Existe permissao por papel?
- Existe auditoria quando mexe com dinheiro, privacidade, stock, comissao ou permissao?
- Se a automacao falhar, que tarefa humana fica?
- O modulo pode estar desativado?
- A UI deve esconder a funcionalidade se o modulo estiver desligado?
- Ha estado vazio com proxima acao?
- Ha teste ou caminho minimo de verificacao?
- Algum dado pessoal pode vazar em URL, tracking, log ou preview?

Ao responder sobre produto:

- usar a tese do CRM+/Bizy Team;
- evitar prometer automacao perigosa;
- lembrar que live e canal, nao o nucleo;
- lembrar que Market gera descoberta, mas CRM/Team executa;
- sempre conectar feature a fluxo operacional.

Ao responder sobre arquitetura:

- preservar use cases;
- validar com Zod;
- usar contratos de provider/repositorio;
- respeitar manifesto de modulos;
- manter isolamento por `negocioId`;
- auditar acoes sensiveis;
- usar outbox para integracoes/retry.

Ao responder sobre UI:

- design operacional, nao landing page;
- mobile-first;
- texto curto;
- estados vazios com acao;
- icones lucide quando existir;
- Admin/Sistema separado;
- nao expor tecnico para vendedor;
- usar identidade visual v2.

## Glossario

`Negocio`: tenant/loja/workspace. Fronteira principal de dados.

`ClienteGlobal`: pessoa identificada globalmente.

`ClienteNegocio`: relacao comercial entre pessoa e loja.

`Peca`: produto/catalogo. Nome herdado do MVP de live.

`Reserva`: bloqueio temporario de stock, geralmente vindo de live.

`Pedido`: venda formal. Entidade comercial principal.

`ConversaAtendimento`: inbox comercial com cliente, canal, mensagens, SLA e contexto.

`SocialInboxItem`: comentario/interacao social capturada para classificacao e acao.

`EventoTrackingComercial`: evento anonimo/tecnico de atribuicao e comportamento.

`ParceiroComercial`: afiliado, criador ou revendedor.

`LinkAfiliado`: link rastreavel de parceiro/campanha/produto.

`CompraUnificada`: compra do checkout Bizy que pode conter itens de varias lojas.

`PedidoFilho`: pedido por fornecedor gerado a partir de compra unificada.

`RepasseFinanceiro`: valor a repassar para fornecedor/loja no contexto do Market.

`MovimentoFinanceiro`: entrada ou saida no ledger financeiro.

`Factura`: documento fiscal/comercial emitido a partir de pedido ou manualmente.

`InsightPreditivo`: sugestao/alerta gerado pela inteligencia do Bizy.

`ProjetoComercial`: operacao temporaria como live, campanha ou lancamento, com equipa e stock dedicados.

`Outbox`: fila persistente para publicar eventos de forma resiliente.

`ModuloNegocio`: configuracao que ativa/desativa capacidades por negocio.

## Frase final de orientacao

O Bizy deve reduzir o caos operacional do social commerce. O produto so deve crescer quando ajuda a loja a transformar conversas, comentarios, produtos, pessoas e pagamentos em uma operacao controlada, auditavel, simples de usar e lucrativa.
