---
title: Auditoria Visual Frontend Bizy v2
aliases:
  - Auditoria UI Bizy v2
  - Auditoria Frontend Visual
tags:
  - bizy/wiki
  - bizy/design
  - bizy/frontend
  - bizy/auditoria
status: ativo
updated: 2026-07-11
---

# Auditoria Visual Frontend Bizy v2

> [!info] Continuidade
> Os achados desta rodada foram reconciliados com a verificacao real de 2026-07-11 em [[auditoria-criticas-sistema-bizy]].

Status: ativo
Ultima atualizacao: 2026-06-06
Fonte de design: handoff `Bizy - Direcao Visual v2.html` de `https://api.anthropic.com/v1/design/h/XyIJCNFsfNxd2UHQC76h3A`
Ligacao principal: [[identidade-visual-bizy-v2]]

## Escopo Auditado

Foram capturadas rotas desktop e mobile do CRM real com sessao mockada e chamadas API interceptadas para evitar logout por backend indisponivel.

Capturas geradas:

- `/tmp/bizy-audit2/desktop/*.png`
- `/tmp/bizy-audit2/mobile/*.png`
- `/tmp/bizy-audit3/produto-editar-modal-open.png`
- `/tmp/bizy-audit4/*.png`
- `/tmp/bizy-audit5/mobile-pipeline.png`
- `/tmp/bizy-audit-all-after/desktop/*.png`
- `/tmp/bizy-audit-all-after/mobile/*.png`
- `/tmp/bizy-audit-full-after2/loja-desktop.png`
- `/tmp/bizy-audit-full-after2/loja-mobile.png`
- `/tmp/bizy-audit-full-after2/loja-produto-sheet-mobile.png`
- `/tmp/bizy-audit-all-after/pedidos-mobile-fixed.png`

Rotas auditadas: Painel, Live, Pedidos, Tarefas, Atendimento, Clientes, Recuperacao, Campanhas, Social Inbox, Pipeline, Cotacoes, Agenda, Metas, Respostas rapidas, Notas, Formularios, Sequencias, Produtos, Loja Digital, Afiliados, Relatorios, Equipa, Pagamentos, Administracao, Diagnosticos e Auditoria.

## Achados Principais

- Mobile estava a renderizar a sidebar desktop porque `.app-desktop-sidebar { display:flex }` anulava `hidden lg:flex`; isto quebrava todas as telas mobile.
- Produtos estava proximo da direcao v2 nos KPIs, mas o empty state e o modal de criacao/edicao ainda tinham linguagem generica.
- Relatorios ainda nao aplicava o KPI hero verde; agora o primeiro KPI segue a hierarquia de cor oficial.
- Pipeline, Metas, Notas, Formularios e Sequencias usam classes herdadas `crm-*`; foi criada ponte CSS v2 para cards, metricas, timelines e filtros sem reescrever cada pagina.
- Modais, sheets e alert dialogs usavam animacoes `data-open/data-closed`; foram normalizadas para `data-[state=open]` e `data-[state=closed]`, alinhando com Radix.

## Guardrails Aplicados

- Sidebar desktop so aparece a partir de `1024px`.
- `Dialog`, `Sheet` e `AlertDialog` passam a herdar raio, sombra, borda e animacao corretos da identidade v2.
- `ConfirmarAcao` passa a usar icone em chip semantico, com rose para destrutivo e green para confirmacao.
- Modal de produto ganhou cabecalho com chip, secoes organicas, dropzone de fotos, footer fixo e empty state refinado.
- Grelha de produto foi consolidada com regras finais mobile-first para evitar conflito entre definicoes duplicadas.
- Páginas antigas `crm-*` e `dash-*` recebem hero KPI, cards brancos, sombras leves, filtros pills e timeline em painel v2.
- `--primary` passa a ser o verde Bizy; botoes shadcn diretos deixam de nascer pretos por defeito.
- Loja individual recebe camada `loja-publica-v2`: header claro, pills verdes, cards brancos, checkout/sheets e bottom nav alinhados ao handoff.
- `bz-tabs` fica contido e scrollavel no mobile para evitar overflow horizontal em Pedidos.

## Rodada 2026-06-06 · Navegador Completo

Foi feita uma segunda varredura com Playwright em 31 rotas, desktop e mobile, totalizando 62 capturas. A API foi mockada de forma controlada para impedir logout e para testar estados vazios, Produtos e Loja Individual com dados representativos.

Resultados:

- Sem sidebar desktop no mobile.
- Sem overflow horizontal nas rotas auditadas depois da correcao de `bz-tabs`.
- Loja individual deixou de usar preto/neutro como identidade principal e passou a herdar a v2.
- Modal de produto e sheet de produto da loja foram abertos no navegador e comparados visualmente.
- Onboarding nao foi considerado achado visual nessa rodada porque o mock devolveu JSON de autenticacao em vez de renderizar a pagina.

## Regra Para Futuras Mudancas

Ao criar ou alterar paginas, modais, sheets, notificacoes ou cards, verificar:

- Desktop e mobile com screenshots.
- Ausencia de overflow em 390px.
- Primeiro KPI de pagina operacional deve ser hero quando houver metrica principal.
- Empty states devem ser cards/painel com acao ou contexto, nao texto solto.
- Modais devem ter cabecalho curto, chip semantico, secoes agrupadas e footer de acoes claro.

Relacionadas: [[inventario-frontend]], [[memoria-viva-bizy]], [[bizy-estado-atual]].
