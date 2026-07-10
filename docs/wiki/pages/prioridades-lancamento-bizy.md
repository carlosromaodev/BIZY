---
title: Prioridades de Lancamento do Bizy
aliases:
  - P0 P1 P2 Bizy
  - Lacunas de Lancamento
tags:
  - bizy/prioridades
  - bizy/lancamento
status: ativo
updated: 2026-07-10
---

# Prioridades de Lancamento do Bizy

Fonte principal: `docs/RF-RNF-RN-EMEUV1.md`, secao 10.

## Diagnostico

O backend esta maduro como fundacao CRM+ multi-negocio, modular e auditavel.

As maiores lacunas restantes estao em:

- ~~checkout visual completo~~;
- ~~SEO/preview social renderizado no frontend publico~~;
- ~~privacidade/tracking banner~~;
- ~~paginacao padronizada com volume~~;
- ~~consistencia mobile sem scroll horizontal~~;
- ~~verificacao final de modulos desativados na UI~~;
- ~~read models internos iniciais da Anani e console de governanca oculta~~;
- maturacao visual das paginas CRM novas para design v2.

Lacunas ja fechadas (2026-06-05):

- Frontend de todos os modulos CRM (pipeline, cotacoes, agenda, metas, respostas rapidas, notas, formularios, sequencias).
- Ocultacao de modulos desativados na UI (controlado por `filtrarRotasPorModulos`).
- Telas de campanhas, social inbox, equipa, pagamentos, diagnosticos SMS e auditoria.
- Estados vazios com orientacao nas novas paginas.
- Design system v2 reutilizavel (`BizyDesignSystem.tsx`).
- Read models Anani `TeamHealth`, `MarketSnapshot`, `SecuritySnapshot` e console interna inicial em `/app/governance/anani`.
- Envio real de imagem/PDF na conversa WhatsApp, com storage privado, Evolution `sendMedia`, Cloud API por link publico HTTPS e renderizacao do anexo no historico.
- Pedido direto pela conversa, com endpoint CRM, mensagem de timeline e acao no frontend de Conversas.

## P0 Bloqueia Lancamento

P0 impede primeiro cliente real com experiencia minima aceitavel.

### Loja publica frontend

Backend ja devolve produtos, SEO, previews, vitrine e agrupamentos. O frontend publico ja cobre loja, Market, produto, checkout e tracking. Auditoria mobile 360px sem scroll horizontal foi fechada com e2e nas rotas publicas principais.

Links: [[mapa-de-modulos-bizy#Loja Publica, Checkout e Tracking]], [[inventario-frontend]].

### SEO e preview social

~~Backend devolve `title`, `description`, `image`, `canonicalPath` e previews. Falta renderizar no frontend publico.~~ Fechado: o frontend publico aplica meta padrao, canonical, Open Graph e Twitter Card em Market, lojas, catalogos e Learning. Limite assumido: e SEO runtime da SPA; prerender/SSR fica como evolucao futura se a distribuicao exigir previews para crawlers que nao executam JavaScript.

### Checkout visual

~~Endpoint publico cria pedido e calcula entrega. Falta carrinho/resumo visual, etapa de pagamento e confirmacao clara.~~ Fechado: o checkout publico tem passos visuais, carrinho com ajuste de quantidade, resumo por fornecedor, dados de entrega/pagamento e revisao de pendencias antes da finalizacao.

### Privacidade e tracking

~~Backend opera sem cookies e bloqueia dados pessoais. Falta aviso/banner visual quando tracking ou eventos de marketing forem usados.~~ Fechado: tracking publico bloqueia dados pessoais e a UI publica usa aviso de privacidade/tracking.

### Estados vazios orientadores

~~Cada modulo sem dados deve explicar a proxima acao.~~ Fechado: novas paginas incluem estados vazios com orientacao.

### Ocultar modulos desativados

~~Backend bloqueia rotas por modulo. Falta esconder navegacao/componentes quando modulo estiver desligado.~~ Fechado na UI e na rota direta: `filtrarRotasPorModulos` em `rotasApp.tsx` trata lista vazia como nucleo minimo; o Shell deriva tabs, drawer desktop e sheet mobile das rotas filtradas; `RotaPrivada` consulta `/negocio/modulos` antes de renderizar rota opcional por URL. Limite: matriz RBAC/ABAC completa fica fora deste recorte.

### Paginacao padronizada

~~APIs aceitam limites/filtros, mas falta paginacao cursor/offset padronizada e teste com volume.~~ Fechado para as listas publicas grandes de Market com `limite`, `offset` e metadados de paginacao.

### Remover telas vazias/decorativas

~~Qualquer pagina sem pergunta operacional real deve sair da navegacao.~~ Fechado: todas as paginas roteadas tem funcionalidade operacional real.

## P1 Primeira Operacao Comercial

P1 melhora a operacao diaria logo apos o lancamento inicial.

- [ ] Kanban/lista visual de funil de pedidos.
- [x] Perfil Cliente 360 completo na UI.
- [x] Criar pedido diretamente na conversa.
- [x] Envio real de imagem/documento pelo provider WhatsApp.
- [x] Resultado de campanha atualizado por webhook/status.
- [x] Gestao visual de colecoes.
- [x] Categorias ocultas se nao tiverem uso real.
- [x] Revisao textual para vendedora nao tecnica.
- [x] Templates WhatsApp por evento transacional.
- [x] Tarefas automaticas para falhas de automacao.
- [x] Fallback estruturado em mensagens.
- [ ] Sequenciador pos-venda.
- [x] Lista de clientes com WhatsApp e ultimo pedido.
- [x] Aliases sociais completos.
- [x] Prioridade visual para VIP, reclamacao e pagamento pendente.

## P2 Evolucao Pos-Lancamento

P2 deve ser guiado por feedback real.

- Portal/UI de afiliado.
- UI de funil e playbooks.
- Catalogos digitais selecionaveis.
- Conectores sociais oficiais.
- Bus unico de eventos.
- Opt-out granular por canal.
- Comissao por meta.
- WhatsApp OTP completo.
- Sincronizacao de templates com provider.
- Link curto e associacao posterior.
- Carrinho persistente na conversa.
- Multi-moeda real.
- Dominio personalizado.
- Painel de emergencia unificado.
- Motor de explicabilidade.
- Reprocessamento de comissoes.
- Teste de carga.
- Chargeback e fraude avancada.
- Pedidos diretos por Social Inbox.
- Correcao manual de atribuicao.
- **Notificacoes internas** (alertas tempo real para equipa).
- **Pipeline de Vendas** — frontend criado (`Pipeline.tsx`), falta ligacao completa ao backend.
- **Agenda e Lembretes** — frontend criado (`Agenda.tsx`), falta ligacao completa ao backend.
- **Metas de Vendas** — frontend criado (`Metas.tsx`), falta ligacao completa ao backend.
- **Cotacoes e Orcamentos** — frontend criado (`Cotacoes.tsx`), falta ligacao completa ao backend.
- **Respostas Rapidas** — frontend criado (`RespostasRapidas.tsx`), falta ligacao completa ao backend.
- **Notas e Historico de Actividades** — frontend criado (`Actividades.tsx`), falta ligacao completa ao backend.
- **Formularios de Captacao de Leads** — frontend criado (`Formularios.tsx`), falta ligacao completa ao backend.
- **Sequencias Automaticas** — frontend criado (`Sequencias.tsx`), falta ligacao completa ao backend.
- **Entregas e logistica** (entregadores, tracking, rotas).
- **Painel personalizavel** (preferencias por utilizador).

## Sequencia Recomendada

1. **Sprint P0:** fechado no roadmap atual.
2. **Sprint P1:** fechado para Cliente 360 polido, colecoes visuais, templates WhatsApp, resultados de campanhas e projectors duraveis da Anani; seguem abertos kanban de funil, sequenciador pos-venda e P2 por feedback.
3. **P2 por feedback:** ligacao backend completa das paginas CRM novas (pipeline, agenda, metas, cotacoes, respostas rapidas, notas, formularios, sequencias), afiliados portal, social oficial, bus unificado.

## Como Usar Esta Nota

Antes de iniciar trabalho novo, classifique a tarefa:

- P0 se bloqueia lancamento ou cliente final.
- P1 se melhora primeira operacao comercial.
- P2 se depende de escala, feedback ou integracao madura.
