---
title: Fluxos Operacionais do Bizy
aliases:
  - Fluxos Bizy
  - Jornada Operacional Bizy
tags:
  - bizy/fluxos
  - bizy/operacao
status: ativo
updated: 2026-05-31
---

# Fluxos Operacionais do Bizy

## Live, Comentario, Reserva e Pedido

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

Modulos: [[mapa-de-modulos-bizy#Live, Comentarios e Parser]], [[mapa-de-modulos-bizy#Reservas e Fila]], [[mapa-de-modulos-bizy#Pedidos, Cobranca e Entrega]].

## Atendimento WhatsApp e Conversa CRM

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
- falha de envio deve criar tarefa ou ficar auditavel.

Modulos: [[mapa-de-modulos-bizy#Conversas e Atendimento]], [[mapa-de-modulos-bizy#WhatsApp, Evolution, Cloud API e Politica]].

## Pedido, Pagamento e Entrega

```text
Pedido -> Itens -> Total -> Comprovativo
       -> Confirmar ou rejeitar pagamento
       -> Preparacao -> Entrega/retirada
       -> Entregue -> Pos-venda/relatorio
```

Regras:

- pedido e entidade comercial principal;
- desconto exige motivo e pode exigir aprovacao;
- comprovativo precisa de historico;
- pagamento confirmado alimenta funil e relatorios;
- entrega deve ter estado, responsavel e observacao quando aplicavel.

Modulos: [[mapa-de-modulos-bizy#Pedidos, Cobranca e Entrega]], [[dominio-e-entidades-bizy#Pedido]].

## Loja Publica, Checkout e Tracking

```text
Visita -> Produto visto -> Clique WhatsApp ou Checkout
       -> Cliente identificado -> Pedido
       -> Pagamento -> Receita atribuida
```

Regras:

- compra deve funcionar sem cookies/tracking;
- tracking nao pode conter telefone, email, nome ou endereco;
- checkout deve calcular entrega antes de confirmar;
- carrinho abandonado vira oportunidade se houver consentimento aplicavel;
- SEO/preview devem ser renderizados no frontend publico.

Operacao CRM configuravel: ver [[loja-digital-operacao-crm|Loja Digital com Operacao CRM]].

Lacuna restante: consentimento publico/SEO completo. Ver [[prioridades-lancamento-bizy#P0 Bloqueia Lancamento]].

## Afiliado, Criador e Comissao

```text
Parceiro -> Link -> Visita/Checkout/Pedido
         -> Atribuicao -> Pedido pago
         -> Comissao confirmada -> Lote/Pagamento
```

Regras:

- link preserva origem;
- autoindicacao deve ser bloqueada;
- comissao so confirma com pedido pago;
- cancelamento/devolucao/reembolso revertem comissao;
- pagamento de comissao deve ser auditado.

Modulos: [[mapa-de-modulos-bizy#Afiliados, Criadores e Revendedores]].

## Social Inbox

```text
Post/Live/Reel/Story -> Comentario social
                     -> Classificacao conservadora
                     -> Lead/Tarefa/Conversa/Oportunidade
                     -> WhatsApp ou pedido manual aprovado
```

Regras:

- comentario social nao deve virar pedido confirmado automaticamente;
- duvida, reclamacao, desconto, troca ou conflito cria tarefa humana;
- origem, post, provider e permissao devem ficar preservados;
- fallback manual/CSV e valido quando API social nao permitir captura.

Modulos: [[mapa-de-modulos-bizy#Social Inbox]].

## Campanha

```text
Segmento -> Template aprovado -> Preview
         -> Confirmacao -> Envio -> Resultado
         -> Receita atribuida ou tarefa se falhar
```

Regras:

- campanha sem segmento claro deve ser bloqueada;
- marketing exige consentimento;
- opt-out bloqueia marketing;
- template precisa estar aprovado e compativel;
- falha nao pode gerar reenvio infinito.

Modulos: [[mapa-de-modulos-bizy#Campanhas e Templates]].

## Recuperacao Comercial

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

Modulos: [[mapa-de-modulos-bizy#Tarefas e Recuperacao]].

## n8n e Automacoes

```text
Backend -> Outbox -> Webhook assinado n8n
        -> n8n consulta contexto
        -> n8n chama endpoint autorizado
        -> backend valida e persiste
```

Regra: n8n automatiza, mas nao decide fora dos contratos do backend.

Guardrail: [[arquitetura-e-guardrails-bizy#Backend como Fonte de Verdade]].
