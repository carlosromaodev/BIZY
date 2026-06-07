---
title: Mapa de Modulos do Bizy
aliases:
  - Modulos Bizy
  - Mapa funcional Bizy
tags:
  - bizy/modulos
  - bizy/produto
status: ativo
updated: 2026-06-07
---

# Mapa de Modulos do Bizy

> [!info] Relacao com codigo
> O inventario tecnico dos endpoints fica em [[inventario-backend-api]]. Esta nota explica os modulos pelo ponto de vista do produto.

## Autenticacao e Onboarding

Responsavel por entrada do utilizador e criacao inicial da loja.

Inclui:

- login por telefone/SMS;
- login estudantil UOR/ISPTEC;
- login Gmail quando OAuth estiver configurado;
- sessao por cookie HttpOnly e Bearer em transicao;
- onboarding de negocio;
- canais de venda;
- dados de pagamento;
- regra de reserva;
- primeiro produto.

Entidades: [[dominio-e-entidades-bizy#Identidade e Acesso]].

## Negocio, Papeis, Permissoes e Modulos

Define quem trabalha em que loja e que funcionalidades estao ativas.

Inclui:

- `Negocio`;
- membros;
- papeis;
- permissoes;
- modulos por negocio;
- relacoes entre negocios;
- compartilhamento controlado de clientes.

Regra: modulo desativado nao deve executar automacao nem aparecer como promessa vazia na UI.

## Catalogo, Produtos e Stock

Cuida dos produtos vendidos.

Inclui:

- SKU/codigo unico por negocio;
- preco;
- custo;
- stock;
- fotos;
- categoria;
- colecao;
- variantes;
- vitrine publica;
- importacao CSV;
- movimentos de stock;
- alertas de baixo stock, sem giro, vendidos e reservados sem pagamento.

Entidades: [[dominio-e-entidades-bizy#Produto e Stock]].

## Live, Comentarios e Parser

Cuida da venda em live.

Inclui:

- provider TikTok principal;
- provider Python;
- modo manual;
- comentarios em tempo real;
- parser de intencao;
- telefone angolano;
- codigo da peca;
- confianca;
- revisao manual.

Fluxo: [[fluxos-operacionais-bizy#Live, Comentario, Reserva e Pedido]].

## Reservas e Fila

Reserva e mecanismo de prioridade e bloqueio temporario, especialmente em live.

Inclui:

- primeira pessoa ganha prioridade;
- sem stock entra em fila;
- reserva bloqueia stock;
- expiracao libera stock;
- promocao automatica da fila;
- pagamento/cancelamento;
- conversao em pedido.

Regra: reserva nao substitui pedido. Pedido e a entidade comercial principal.

## Pedidos, Cobranca e Entrega

Cuida da venda formal.

Inclui:

- pedido manual;
- pedido vindo de checkout;
- pedido convertido de reserva;
- multiplos itens;
- desconto com motivo/aprovacao;
- comprovativo;
- confirmacao/rejeicao de pagamento;
- recibo;
- preparacao;
- entrega/retirada/orcamento humano;
- cancelamento, troca e devolucao;
- exportacao.

Entidades: [[dominio-e-entidades-bizy#Pedido]].

## Clientes 360

Cuida da relacao da loja com cada pessoa.

Inclui:

- cadastro manual;
- importacao;
- exportacao auditada;
- telefone/email/WhatsApp;
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

Entidades: [[dominio-e-entidades-bizy#Cliente]].

## Conversas e Atendimento

E a inbox comercial do CRM.

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
- tarefas.

Fluxo: [[fluxos-operacionais-bizy#Atendimento WhatsApp e Conversa CRM]].

## WhatsApp, Evolution, Cloud API e Politica

Cuida de envio, recebimento e seguranca do canal WhatsApp.

Inclui:

- Evolution API;
- WhatsApp Cloud API;
- templates;
- categorias oficiais: marketing, utilidade, autenticacao, servico;
- janela de atendimento;
- consentimento;
- opt-out;
- bloqueio de texto promocional em utilidade/autenticacao;
- tarefa humana quando envio for inseguro.

Guardrail: [[arquitetura-e-guardrails-bizy#Politica WhatsApp]].

## n8n e Automacoes

n8n executa fluxos, mas nao e fonte de verdade.

Inclui:

- eventos assinados;
- outbox;
- retry;
- endpoints `/n8n/*`;
- consulta de contexto;
- aprovacao humana;
- follow-up.

Fonte de verdade continua no backend.

## Loja Publica, Checkout e Tracking

Cuida da presenca publica e compra pelo cliente final.

Inclui:

- loja por slug;
- produto publico;
- SEO/preview social no backend;
- checkout WhatsApp;
- checkout site;
- entrega;
- carrinho abandonado;
- tracking;
- eventos server-side futuros;
- privacidade de identificadores.

Lacuna P0: frontend publico completo. Ver [[prioridades-lancamento-bizy#P0 Bloqueia Lancamento]].

## Bizy Market e Perfis de Loja

Novo ramo de produto descrito em [[bizy-market-lojas-digitais]].

Inclui:

- perfil publico autonomo por loja;
- subdominio proprio;
- personalizacao de capa, avatar, descricao e links;
- colecoes clicaveis que mudam a grelha de produtos;
- shopping center central com produtos de varios clientes Bizy;
- categorias globais;
- busca e filtros do Market;
- produtos similares entre fornecedores;
- checkout unificado Bizy;
- compra unificada com pedidos filhos por fornecedor;
- central de controlo inteira dentro do CRM.

Regra: o Market aumenta descoberta, mas nao substitui a identidade da loja nem a operacao CRM. Toda venda deve virar pedido, pagamento, entrega, conversa, cliente, tarefa ou relatorio no CRM.

## Afiliados, Criadores e Revendedores

Cuida de parceiros comerciais.

Inclui:

- parceiro;
- link rastreavel;
- mini-loja;
- pacote de divulgacao;
- regra de comissao;
- atribuicao;
- comissao estimada, confirmada, paga e revertida;
- lote financeiro;
- saldo;
- antifraude basico.

Regra: comissao so confirma depois de pedido pago.

## Social Inbox

Cuida de comentarios e interacoes de redes sociais.

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

Regra: comentario social vira lead/tarefa/conversa, nao pedido automatico sem regra aprovada.

## Campanhas e Templates

Cuida de mensagens segmentadas e autorizadas.

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

Regra: campanha sem segmento claro deve ser bloqueada.

## Tarefas e Recuperacao

Cuida de trabalho humano e recuperacao comercial.

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

## Pipeline de Vendas

Quadro visual de negocios em andamento. E o modulo mais usado em qualquer CRM.

Inclui:

- kanban com etapas configuraveis por negocio;
- etapas padrao: lead, contacto feito, proposta enviada, negociacao, fechado ganho, fechado perdido;
- arrastar negocios entre etapas;
- valor estimado por negocio;
- valor total por etapa;
- motivo obrigatorio ao perder;
- responsavel por negocio;
- data prevista de fecho;
- filtros por responsavel, produto, valor e periodo;
- historico de mudanca de etapa.

Regra: negocio perdido exige motivo. Pipeline vazio deve sugerir criar primeiro negocio.

## Agenda e Lembretes

Calendario simples para o comerciante nao esquecer follow-ups, cobranças e entregas.

Inclui:

- criar lembrete ligado a cliente, pedido ou conversa;
- lembretes de follow-up;
- lembretes de cobranca;
- lembretes de entrega;
- lembretes de callback;
- vista diaria, semanal;
- notificacao quando o lembrete vence;
- lembretes recorrentes para clientes regulares;
- integracao com tarefas operacionais.

Regra: lembrete vencido sem acao deve virar tarefa visivel no painel.

## Metas de Vendas

Objectivos mensais e semanais para medir se a loja esta no caminho certo.

Inclui:

- meta de receita por periodo;
- meta de pedidos fechados;
- meta de clientes novos;
- meta por vendedor quando houver equipa;
- progresso visual em tempo real;
- comparacao com periodo anterior;
- alerta quando meta estiver em risco.

Regra: meta sem progresso nao deve ser decorativa. Deve mostrar o que falta e sugerir acao.

## Cotacoes e Orcamentos

Criar e enviar propostas de preco ao cliente antes de fechar pedido.

Inclui:

- criar cotacao com produtos, quantidades e precos;
- desconto por cotacao;
- validade da cotacao;
- enviar cotacao por WhatsApp;
- converter cotacao aceite em pedido;
- cotacao expirada vira oportunidade perdida;
- historico de cotacoes por cliente.

Regra: cotacao aceite deve gerar pedido sem o vendedor preencher tudo de novo.

## Respostas Rapidas e Atalhos

Mensagens prontas para situacoes do dia-a-dia que o vendedor usa dezenas de vezes.

Inclui:

- biblioteca de respostas rapidas por negocio;
- categorias: saudacao, preco, disponibilidade, pagamento, entrega, pos-venda;
- variaveis dinamicas: nome do cliente, produto, preco, IBAN;
- atalho por teclado ou lista rapida na conversa;
- cada vendedor pode ter favoritas;
- importacao/exportacao de respostas rapidas.

Regra: resposta rapida nao e template WhatsApp oficial. E texto interno usado dentro da conversa.

## Notas e Historico de Actividades

Timeline unificada de tudo o que aconteceu com um cliente. O vendedor abre o cliente e ve o historico completo.

Inclui:

- notas manuais por cliente;
- registo de chamadas;
- registo de visitas;
- registo de reunioes;
- tipo de actividade: chamada, nota, reuniao, WhatsApp, email;
- data/hora e responsavel;
- actividades futuras planeadas;
- timeline cronologica no perfil 360;
- filtro por tipo de actividade.

Regra: actividade registada deve aparecer na timeline do cliente e na agenda do vendedor.

## Formularios de Captacao de Leads

Recolher contactos de clientes interessados sem depender apenas de comentarios de live.

Inclui:

- formulario simples com nome, telefone, produto de interesse;
- link partilhavel por WhatsApp, Instagram bio ou site;
- lead criado automaticamente no CRM;
- notificacao ao vendedor;
- tag automatica por formulario;
- multiplos formularios por negocio;
- integracao com pipeline e campanhas.

Regra: formulario deve criar cliente no CRM e notificar. Lead sem follow-up deve virar tarefa.

## Sequencias Automaticas

Automacao simples de follow-up: se X acontece, fazer Y depois de Z tempo.

Inclui:

- sequencia de boas-vindas apos primeiro contacto;
- sequencia de cobranca apos pedido criado;
- sequencia de pos-venda apos entrega confirmada;
- sequencia de reactivacao apos inactividade;
- espera configuravel entre passos;
- pausa automatica se cliente responder;
- cada passo: enviar template, criar tarefa ou adicionar tag;
- relatorio de conversao por sequencia.

Regra: sequencia deve parar se o cliente responder ou se o objectivo for atingido. Nunca disparar em loop.

## Relatorios

Relatorios devem responder perguntas praticas:

- quanto vendeu;
- que esta pendente;
- que produto performou;
- que campanha converteu;
- que canal gerou receita;
- que atendimento atrasou;
- que afiliado gerou comissao;
- que cliente pode ser recuperado;
- como esta cada vendedor em relacao a meta;
- que cotacoes estao por responder;
- que sequencias estao a converter.

Relatorio tecnico pertence ao Admin/Sistema.
