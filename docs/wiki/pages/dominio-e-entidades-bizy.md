---
title: Dominio e Entidades do Bizy
aliases:
  - Entidades Bizy
  - Dominio Bizy
tags:
  - bizy/dominio
  - bizy/dados
status: ativo
updated: 2026-05-27
---

# Dominio e Entidades do Bizy

> [!info] Fonte tecnica
> O detalhe persistente fica em [[inventario-dados-prisma]]. Esta nota explica o papel de cada entidade no produto.

## Negocio

`Negocio` e a fronteira principal de tenant. Produto, pedido, cliente da loja, conversa, campanha, modulo e tracking devem respeitar `negocioId`.

Regra: uma loja nao pode ver historico privado de outra sem relacao, consentimento, escopo e auditoria.

## Identidade e Acesso

Entidades:

- `UsuarioSistema`;
- `IdentidadeAutenticacao`;
- `PerfilEstudantilUsuario`;
- `SessaoUsuario`;
- `CodigoLoginSms`;
- `MembroNegocio`.

Papel no produto:

- permitir login;
- separar telefone, Gmail e identidade estudantil;
- controlar papel/permissao dentro do negocio;
- permitir sessao segura.

## Cliente

Entidades:

- `ClienteGlobal`;
- `ClienteNegocio`;
- `RelacaoNegocio`;
- `CompartilhamentoCliente`;
- `AuditoriaCompartilhamentoCliente`.

`ClienteGlobal` identifica a pessoa. `ClienteNegocio` representa a relacao comercial daquela pessoa com uma loja.

Isto permite CRM multi-negocio sem misturar historico privado.

## Produto e Stock

Entidades:

- `Peca`;
- `MovimentoStock`.

`Peca` representa produto/peca/catalogo. O nome historico vem do MVP de live. O codigo/SKU e unico por negocio, nao global.

`MovimentoStock` registra entrada, venda, reserva, cancelamento, devolucao, ajuste e correcao.

## Live e Comentario

Entidades:

- `SessaoLive`;
- `ComentarioRecebido`.

Comentarios sao evidencias operacionais. O texto original deve ser preservado. O parser extrai intencao, telefone, codigo e confianca.

## Reserva

Entidade:

- `Reserva`.

Reserva bloqueia stock temporariamente e preserva prioridade. Ela e essencial em live, mas nao deve ser tratada como substituta permanente de pedido.

Regra: pedido e a entidade comercial principal.

## Pedido

Entidades:

- `Pedido`;
- `ItemPedido`.

Pedido guarda venda formal:

- cliente;
- itens;
- origem;
- subtotal;
- desconto;
- entrega;
- total;
- pagamento;
- comprovativo;
- estado;
- entrega;
- auditoria.

Pode nascer de reserva, checkout, conversa ou criacao manual.

## Conversa

Entidades:

- `ClienteAtendimento`;
- `ConversaAtendimento`;
- `MensagemAtendimento`;
- `MensagemWhatsapp`;
- `OutboxMensagemWhatsApp`.

Conversa e a inbox comercial. Ela carrega contexto de cliente, pedido, reserva, mensagem, SLA, prioridade, responsavel e politica de automacao.

## Automacao, Eventos e Auditoria

Entidades:

- `EventoSistema`;
- `OutboxEventoN8n`;
- `EventoOperacional`;
- `JobOperacional`.

Eventos devem ser persistidos quando precisam de retry, idempotencia, auditoria ou integracao externa.

## Tarefa e Recuperacao

Entidades:

- `TarefaOperacional`;
- `PlaybookRecuperacao`;
- `ExecucaoPlaybookRecuperacao`;
- `MovimentoFunilComercial`;
- `OportunidadeRecuperacao`.

Tarefa e o fallback humano. Playbook e oportunidade ajudam recuperacao comercial sem automatizar acao sensivel sem regra.

## Campanha e Template

Entidades:

- `CampanhaCrm`;
- `ItemCampanhaCrm`;
- `TemplateWhatsAppNegocio`.

Campanha depende de segmento, consentimento e template aprovado. Template carrega categoria, idioma, provider, versao e estado.

## Tracking e Afiliados

Entidades:

- `EventoTrackingComercial`;
- `ParceiroComercial`;
- `LinkAfiliado`;
- `ComissaoParceiro`;
- `HistoricoComissaoParceiro`;
- `LotePagamentoComissao`;
- `ItemLotePagamentoComissao`.

Tracking ajuda atribuicao, mas nao substitui pedido, pagamento ou consentimento.

Comissao depende de pedido pago e atribuicao valida.

## Social Inbox

Entidade:

- `SocialInboxItem`.

Guarda provider, conta, post, autor, texto, intencao, confianca, telefone quando houver e contexto. Deve preservar origem para auditoria.

## Modulos

Entidade:

- `ModuloNegocio`.

Permite ativar/desativar capacidades por negocio. UI, rotas e automacoes devem respeitar esta configuracao.
