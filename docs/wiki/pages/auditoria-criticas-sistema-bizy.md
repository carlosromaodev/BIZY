---
title: Auditoria Unificada das Criticas do Sistema Bizy
aliases:
  - Criticas do Sistema Bizy
  - Auditoria Unificada Bizy
tags:
  - bizy/auditoria
  - bizy/qualidade
  - bizy/seguranca
status: ativo
updated: 2026-07-11
---

# Auditoria Unificada das Criticas do Sistema Bizy

Esta e a fonte canonica para criticas tecnicas e de produto. Relatorios anteriores continuam como historico, mas nao devem abrir backlog sem reconfirmacao no codigo atual.

## Fontes reconciliadas

- `ANALISE-UX-DESIGN.md`;
- `docs/ANALISE-DESIGN-FRONTEND-EMEU.md`;
- `RELATORIO-COMPLETO-EMEU.md`;
- [[auditoria-tripla-bizy]];
- [[auditoria-visual-frontend-bizy-v2]];
- [[prioridades-lancamento-bizy]];
- `docs/sdd/03-roadmap-sdd.md` e lacunas dos dominios SDD;
- auditoria de dependencias, typecheck, testes HTTP e Playwright de 2026-07-11.

## Criticas encerradas no estado atual

- [x] Entidades comerciais separadas: clientes, pedidos, pagamentos, entregas, lojas, lives, compras unificadas, repasses e reembolsos existem no Prisma e nos use cases.
- [x] IVA: pedidos, facturas e relatorios mantem percentual e valor de IVA, com 14% como configuracao padrao e sem alegar certificacao fiscal.
- [x] Reembolsos: fluxo financeiro e Market suportam solicitacao, processamento, parcialidade, ajuste do repasse e auditoria.
- [x] Reconciliacao e recebiveis: importacao CSV/OFX, conciliacao assistida, aging, fluxo de caixa e DRE estao implementados.
- [x] Analitica comercial: RFM, churn VIP, LTV, previsao de caixa, anomalias, cohort, funil e serie temporal estao implementados com dados reais.
- [x] Robustez numerica: medias descartam `NaN`/`Infinity`; relatorios possuem limite e cache TTL/LRU para proteger o processo.
- [x] Visualizacao: Recharts esta em uso no relatorio e nao ha necessidade de adicionar outra biblioteca de graficos.
- [x] Paginacao: helpers e metadados de offset estao aplicados nas listas grandes de clientes, pedidos, membros, campanhas e Market.
- [x] Funil anti-regressao: movimentos automaticos nao podem voltar uma entidade para etapa anterior; perda explicita continua permitida.
- [x] Outbox e recuperacao: eventos n8n e mensagens WhatsApp possuem persistencia, idempotencia, retry, limite de tentativas e saude operacional.
- [x] Rate limit distribuivel: Redis REST/Upstash e suportado, mantendo memoria apenas como fallback local.
- [x] Sessao: cookie HttpOnly e Bearer sao suportados; 401 expira a sessao no cliente.
- [x] RBAC e isolamento: contexto comercial, permissao por papel/modulo, guard de URL e testes multi-tenant existem.
- [x] Isolamento de projectos: projectos normais, projectos comerciais, filas, membros e produtos associados validam o `negocioId` autenticado antes de operar IDs recebidos pela API.
- [x] UX critica antiga: menu mobile, precos, login separado, reenvio SMS, edicao/fotos de produto, revisao de comentario, chat, urgencia, confirmacao destrutiva e notificacoes foram implementados.
- [x] Design mobile: auditorias Playwright em 375 px e 1440 px confirmaram zero overflow nas superficies Learning, Compras, Projectos, Seller e Produtor.
- [x] Portais externos prioritarios: comprador Market, seller e produtor Learning possuem rotas e dados minimos por contexto.
- [x] Dependencias de producao: Fastify/plugins, TikTok connector, React Router, Vite, Vitest, TSX e transientes foram atualizados; `npm audit` retorna zero vulnerabilidades.
- [x] Runtime de producao: imagens Docker do backend e build frontend usam Node 22, compativel com a cadeia atual do conector TikTok.
- [x] Portal Seller local: o proxy `/market`, o contraste da vista ativa e a grelha mobile de tabs foram corrigidos.
- [x] Acoes primarias Team: o reset global de `button` deixou de sobrepor o fundo de `.team-btn-primary`; a cor computada foi validada no browser em desktop e mobile.
- [x] Backlog RF/RNF/RN de Team, Market e Learning: 215 itens antes abertos foram implementados e reconciliados nos tres documentos de requisitos.

## Evidencia local de 2026-07-11

- `npm audit --omit=dev`: 0 vulnerabilidades em 766 dependencias avaliadas.
- Frontend: 39 ficheiros e 143 testes passaram; typecheck e build de producao passaram.
- Backend: 81 ficheiros e 364 testes passaram; 1 teste opcional ficou ignorado; typecheck e build passaram.
- Bundle frontend: paginas passam a carregar por rota; o chunk inicial caiu de 1,87 MB para 189 kB e nenhum chunk JavaScript excede 500 kB.
- Playwright: Learning, Compras, Projectos, Seller e Produtor passaram em 375 px e 1440 px, sem overflow, erros de consola ou erros de pagina.
- Portal Seller: a vista ativa calculou fundo `rgb(14, 140, 104)` e texto branco nos dois breakpoints.
- Sondas locais autenticadas: `/financas/fluxo-caixa` ate 73 ms, `/financas/dre` ate 49 ms, `/projectos` ate 43 ms e `/financas/saude` em 46 ms. Estes numeros nao substituem o teste de carga nem um SLO externo.

## Decisoes deliberadas, nao defeitos

- [x] Valores continuam em `Int` com unidade explicitada em Kwanza. A plataforma nao mistura unidades nem usa ponto flutuante como saldo contabil; uma migracao global para subunidade so deve ocorrer quando um provider real exigir centimos.
- [x] Redis nao e introduzido como dependencia obrigatoria de relatorio no processo unico. O cache local limitado reduz custo sem criar indisponibilidade adicional; distribuicao e pre-agregacao pertencem ao teste de escala.
- [x] Estados persistidos como `String` sao validados nos schemas e use cases para permitir migracao controlada; escrita livre em endpoints criticos continua proibida.
- [x] Developer Platform, app nativo, dominio personalizado, conectores sociais oficiais e analitica experimental sao evolucao de produto, nao falhas do fluxo operacional atual.
- [x] Referencias ISO, NIST, OWASP, WCAG, PCI, OpenTelemetry, QTI e SCORM sao guardrails de desenho; o Bizy nao declara certificacao sem avaliacao independente.

## Evidencias externas ainda necessarias

Estes itens nao podem ser fabricados por codigo local. Permanecem como gates operacionais unicos, sem duplicar implementacao:

- [ ] Executar o checkout multi-loja em staging com provider, pagamento e entrega reais.
- [ ] Medir carga com volume representativo, incluindo 100 mil movimentos financeiros por negocio/ano.
- [ ] Medir disponibilidade financeira de 99,5% em horario comercial com monitor externo.
- [ ] Executar e registar restore periodico, WAL/PITR e retencao de backup no ambiente gerido.
- [ ] Validar obrigacoes fiscais, recibos, retencoes e e-invoicing com contabilista/AGT antes de uso fiscal formal.
- [ ] Produzir evidencias independentes de WCAG 2.2 AA, ASVS proporcional, continuidade e disaster recovery antes de promover modulos a M5.
- [ ] Validar TikTok, WhatsApp, SMS e gateways com credenciais/provedores de producao e SLO observado.

## Regra de encerramento

Uma critica so volta ao backlog quando houver reproducao atual, requisito verificavel, owner e evidencia que contradiga esta auditoria. Documento antigo, hipotese de escala ou funcionalidade P2 nao bastam por si so.
