---
title: Loja Digital com Operacao CRM
aliases:
  - Loja Digital Operacional
  - Operacao CRM da Loja
tags:
  - bizy/loja-digital
  - bizy/crm
  - bizy/operacao
status: ativo
updated: 2026-06-17
---

# Loja Digital com Operacao CRM

## Decisao de Produto

A Loja Digital do Bizy nao deve ser apenas uma vitrine publica. Ela deve ser uma frente de venda ligada ao CRM, onde o dono configura como a compra vira pedido, atendimento, entrega, recompra e relatorio.

O admin da loja passa a ter uma etapa propria chamada **Operacao**, depois de identidade, produtos, experiencia, entrega e pagamentos. Essa etapa guarda a configuracao em `experiencia.operacao`.

## Evolucao 2026-06-07: Bizy Market

A decisao mais recente expande esta frente para [[bizy-market-lojas-digitais|Bizy Market e Lojas Digitais]].

A loja publica atual deve evoluir para:

- perfil social-comercial da loja, com capa, avatar, descricao, seguidores e colecoes clicaveis;
- subdominio pessoal como `minhaloja.bizy.space`;
- grelha de produtos controlada por colecoes internas;
- participacao opcional no shopping center central do Bizy;
- checkout unificado Bizy;
- central de controlo inteira dentro do CRM.

Regra de produto: o Market gera descoberta entre lojas, mas a execucao comercial continua no CRM da loja.

## Fluxos Configuraveis

### Plano e limites

- recursos bloqueados por plano;
- quotas de encomendas, imagens, WhatsApp e email;
- upgrade contextual quando uma funcao avancada ainda nao esta disponivel.

### Checkout inteligente

- manter pedido em rascunho ate pagamento;
- confirmar pagamento automaticamente quando o metodo permitir;
- exigir telefone ou login no checkout;
- permitir pular pagina de pagamento quando a loja opera tudo pelo WhatsApp;
- configurar entrada/sinal, taxa percentual, taxa fixa, prefixo e sufixo de pedido;
- mostrar numero da encomenda na fatura, mensagem e acompanhamento.

### Pagamentos

- dinheiro na entrega;
- transferencia bancaria;
- cartao/Adyen;
- PayPal;
- pagamento personalizado com instrucoes;
- credito em loja.

### Entrega e disponibilidade

- entrega ao domicilio, levantamento/retirada e consumo no local;
- disponibilidade semanal;
- metodos de entrega adicionais;
- zonas com preco e prazo por area.

### Acesso e fidelizacao

- loja aberta, telefone obrigatorio, login ou membros aprovados;
- oferta/cupom de boas-vindas;
- recompensas por frequencia;
- recompensa por indicacao;
- credito em loja para trocas, campanhas e compensacoes.

### Catalogo

- categorias visiveis e ocultas;
- sequencia das categorias;
- descontos ativos;
- produtos por colecao/categoria;
- estatisticas e encomendas ligadas a produto.

### Clientes e encomendas

- importar, exportar, editar em massa e adicionar cliente manualmente;
- pesquisa por nome, telefone, email ou notas;
- filtros como todos, inativos, primeiro pedido e nunca comprou;
- transmissao/broadcast para clientes filtrados;
- criar pedido manual, exportar encomendas, rascunhos, pagamentos e calendario;
- colunas operacionais configuraveis: cliente, total, estado, pagamento, entrega, equipa e criado em.

### Automacoes comerciais

- perfil do cliente;
- carrinho abandonado;
- pedido de avaliacao;
- avaliacao recebida;
- comprar novamente;
- aniversario;
- pagamento pendente;
- pagamento confirmado;
- credito atualizado;
- credito reembolsado;
- saiu para entrega;
- pedido cancelado.
- confirmacao de produto digital;
- operacoes internas quando encomenda e criada.

### Canais conectados

- site;
- WhatsApp;
- Instagram;
- Google;
- POS;
- transmissoes/live commerce;
- app movel com QR code;
- caixa de entrada unificada;
- transmissoes/broadcasts;
- chatbot.

Cada canal deve apontar para uma area real do CRM, como conversas, clientes, pedidos, agenda, respostas rapidas e relatorios.

### Relatorios guiados

- metricas selecionaveis: pedidos, artigos, vendas, custo dos itens, lucro, imposto, vendas liquidas, entrega e clientes;
- agrupamento por produto, cliente ou hora;
- filtros de estados de pedido como unpaid, confirmando pagamento, pendente, pago, concluido, cancelado e em entrega;
- relatorios prontos: pedidos ao longo do tempo, clientes por pedidos, produtos por lucro, ticket medio, dinheiro arrecadado, categorias por pedidos, novos clientes, clientes inativos, maiores descontos, visualizacoes de pagina, metodos de pagamento, referenciadores e entrega por pedidos.

### Site, dominio e SEO

- dominio personalizado;
- instrucoes DNS;
- titulo do site;
- upload de logotipo;
- imagem gerada por IA apenas quando escolhida pelo dono;
- categorias de diretorio para organizar lojas.

## Contrato Tecnico

Backend:

- schema: `SalvarConfiguracaoLojaPublicaSchema.experiencia.operacao`;
- normalizacao admin: `backend/src/infra/http/modulos/lojaPublica.ts`;
- normalizacao publica: `backend/src/use-case/LojaPublicaUseCase.ts`;
- contrato avancado: `plano`, `checkout`, `pagamentos`, `entrega`, `fidelizacao`, `automacoes`, `canais`, `catalogo`, `clientes`, `encomendas`, `relatorios` e `siteSeo`;
- dominio publico por loja: `PUBLIC_STORE_DOMAIN=usebizy.space` gera `slug.usebizy.space`;
- autorizacao TLS sob demanda: `/publico/lojas/dominios/autorizar?domain=slug.usebizy.space`;
- testes: `backend/src/testes/loja-publica-tracking-http.test.ts` e `backend/src/testes/loja-operacao-avancada-schema.test.ts`.

Frontend:

- admin: `frontend/src/paginas/LojaPublica.tsx`;
- loja publica: `frontend/src/paginas/LojaDigitalPublica.tsx`;
- helper de dominio: `frontend/src/lojaSubdominio.ts`;
- testes: `frontend/testes/loja-publica-fase1.test.ts` e `frontend/testes/loja-digital-operacao-avancada.test.ts`.

## Guardrails

- Toda personalizacao da loja deve nascer no admin do dono da loja.
- A pagina publica deve consumir configuracao ja validada pelo backend.
- Tracking publico nao pode enviar telefone, nome, email ou endereco.
- Automacoes comerciais podem sugerir e preparar acao, mas decisao sensivel continua auditavel.
- A loja deve continuar funcionando mesmo sem tracking/cookies.

## Incidente Relacionado: Monitorar Live

Em 2026-05-31 foi identificado na VPS que o backend estava saudavel, mas o provider TikTok Live entrava em loop de reconexao quando a conta/live era invalida, offline ou sem permissao de fallback Euler.

Correcao aplicada:

- `disableEulerFallbacks: true` na conexao TikTok;
- `STREAM_END` encerra reconexao terminal;
- erros `user_not_found`, `API Error 19881007`, live offline, `MissingRoomId`, `InvalidUniqueId` e falta de permissao param reconexao;
- teste coberto em `backend/src/testes/tiktok-live-connector-provider.test.ts`.

## Ligacoes

- [[bizy-market-lojas-digitais|Bizy Market e Lojas Digitais]]
- [[bizy-market-rotas-roadmap|Rotas e Roadmap do Market]]
- [[bizy-market-frontend-lojas|Frontend das Lojas e Market]]
- [[requisitos-bizy-market|Requisitos do Market e Lojas]]
- [[fluxos-operacionais-bizy|Fluxos Operacionais]]
- [[inventario-backend-api|Inventario Backend e API HTTP]]
- [[inventario-frontend|Inventario Frontend e UX]]
- [[deploy-vps-antiga|Deploy na VPS Antiga]]
