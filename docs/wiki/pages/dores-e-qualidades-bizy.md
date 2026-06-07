---
title: Dores e Qualidades do Bizy
aliases:
  - Dores do Bizy
  - Qualidades do Produto
tags:
  - bizy/produto
  - bizy/dores
  - bizy/qualidades
status: ativo
updated: 2026-05-27
---

# Dores e Qualidades do Bizy

## Dores Que o Bizy Resolve

### Pedidos perdidos durante lives

Em live, muitos clientes comentam ao mesmo tempo. Sem sistema, a vendedora perde ordem, esquece quem pediu primeiro, vende produto sem stock ou cria reserva duplicada.

Resposta do Bizy:

- captura de comentarios;
- parser de intencao;
- telefone angolano;
- codigo de peca/produto;
- reserva por prioridade;
- fila de espera;
- expiracao e promocao automatica.

Ligacoes: [[fluxos-operacionais-bizy#Live, Comentario, Reserva e Pedido]], [[mapa-de-modulos-bizy#Live, Comentarios e Parser]].

### Conversas espalhadas

O cliente comenta na live, chama no WhatsApp, manda comprovativo, pede entrega e depois volta em campanha. Sem CRM, o historico fica invisivel.

Resposta do Bizy:

- Cliente 360;
- Conversas CRM;
- timeline de mensagens;
- notas internas;
- tags;
- responsavel;
- SLA;
- proximas acoes;
- historico de reservas e pedidos.

Ligacoes: [[mapa-de-modulos-bizy#Clientes 360]], [[mapa-de-modulos-bizy#Conversas e Atendimento]].

### Stock sem controle

Planilhas e mensagens soltas causam venda duplicada, produto esgotado divulgado e dificuldade de preparacao.

Resposta do Bizy:

- catalogo;
- SKU/codigo unico por negocio;
- stock;
- movimentos;
- alertas;
- pedidos com itens;
- lista de preparacao;
- lista de entrega.

Ligacoes: [[dominio-e-entidades-bizy#Produto e Stock]], [[mapa-de-modulos-bizy#Catalogo, Produtos e Stock]].

### Pagamento manual sem auditoria

Comprovativo, confirmacao, rejeicao e recibo precisam de historico. Sem isso, a equipa nao sabe quem aprovou ou rejeitou.

Resposta do Bizy:

- comprovativo por pedido/reserva;
- confirmacao/rejeicao com motivo;
- recibo;
- historico de pagamento;
- auditoria critica.

Ligacoes: [[fluxos-operacionais-bizy#Pedido, Pagamento e Entrega]], [[arquitetura-e-guardrails-bizy#Auditoria por Padrao]].

### Recuperacao comercial fraca

Carrinho abandonado, pedido sem pagamento, mensagem sem resposta e cliente inativo costumam desaparecer.

Resposta do Bizy:

- tarefas operacionais;
- playbooks de recuperacao;
- oportunidades recuperaveis;
- funil comercial;
- painel diario.

Ligacoes: [[mapa-de-modulos-bizy#Tarefas e Recuperacao]], [[fluxos-operacionais-bizy#Recuperacao Comercial]].

### Vendas sociais sem rastreio

Posts, reels, criadores e links geram interesse, mas o dono nao sabe o que virou lead, pedido ou receita.

Resposta do Bizy:

- Social Inbox;
- tracking;
- links rastreaveis;
- afiliados/criadores;
- mini-lojas;
- atribuicao comercial;
- relatorios social-receita.

Ligacoes: [[mapa-de-modulos-bizy#Loja Publica, Checkout e Tracking]], [[mapa-de-modulos-bizy#Afiliados, Criadores e Revendedores]], [[mapa-de-modulos-bizy#Social Inbox]].

### Automacao perigosa

Automacao que promete desconto, confirma pagamento, responde reclamacao ou cancela pedido sem regra pode causar dano.

Resposta do Bizy:

- politica WhatsApp;
- templates aprovados;
- categorias oficiais;
- aprovacao humana;
- tarefas em casos sensiveis;
- automacao conservadora.

Ligacoes: [[arquitetura-e-guardrails-bizy#Automacao com Fallback Humano]], [[mapa-de-modulos-bizy#WhatsApp, Evolution, Cloud API e Politica]].

## Qualidades Essenciais

### Operacional antes de decorativo

Toda tela precisa ajudar a vender, atender, cobrar, entregar, recuperar ou medir.

### Mobile-first real

O produto precisa funcionar bem em telemoveis pequenos, especialmente 360px, sem scroll horizontal.

### WhatsApp-first, mas nao WhatsApp-only

WhatsApp e central, mas o sistema tambem precisa operar loja publica, live, social inbox, campanhas e afiliados.

### Backend como fonte de verdade

n8n, IA, Evolution, Cloud API e conectores sociais nao decidem stock, pagamento, consentimento ou estado comercial. O backend decide.

### Automacao com humano no controle

Se houver duvida, criar tarefa humana. Essa e uma qualidade, nao uma limitacao.

### Modularidade

Um negocio deve poder operar so com CRM/WhatsApp, so loja, live + WhatsApp, social + WhatsApp, afiliados + site ou combinacoes.

### Auditoria e seguranca

Tudo que mexe com dinheiro, privacidade, stock, comissao, permissoes ou exportacao precisa de trilha.
