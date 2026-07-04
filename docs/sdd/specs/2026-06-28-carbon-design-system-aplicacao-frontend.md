# Estudo Carbon Design System - Aplicacao no Frontend Bizy

Status: em aplicacao
Owner logico: Produto Frontend
Fontes externas: `https://carbondesignsystem.com/`, `https://carbondesignsystem.com/components/data-table/usage/`, `https://carbondesignsystem.com/components/button/usage/`, `https://carbondesignsystem.com/elements/color/overview/`, `https://github.com/carbon-design-system/carbon`
Fontes internas: `docs/sdd/domains/00-visao-produto-e-principios.md`, `docs/sdd/domains/12-frontend-ux-design-system.md`, `frontend/src/rotasApp.tsx`, `frontend/src/componentes/BizyDesignSystem.tsx`
Ultima atualizacao: 2026-06-28

## 1. Objetivo

Aplicar a gramatica operacional do Carbon Design System ao Bizy sem copiar a marca IBM. O resultado deve manter a paleta Bizy, mas usar uma UI mais adulta: menos decoracao, mais acao primaria, toolbar, estados vazios accionaveis, tabelas operaveis e hierarquia consistente.

## 2. Sintese do Carbon

- Carbon e um sistema open source para produtos e experiencias digitais, com codigo, guidelines, recursos de design e uma comunidade de contribuidores.
- A cor e tratada por tokens e temas: a UI nao depende de hex soltos, mas de papeis como layer, field, border, text, focus e support.
- Botoes inicializam uma acao. O label deve dizer o que acontece. A acao primaria deve aparecer uma vez por superficie principal.
- Data table organiza dados e permite ordenar, expandir, procurar, filtrar e executar acoes individuais ou em lote.
- Toolbars concentram pesquisa, filtro, definicoes e botoes primarios da tabela.
- Componentes devem ter estados de acessibilidade, teclado, screen reader e foco previsivel.

## 3. Comparacao Com Bizy Atual

### Pontos bons

- Existe `BizyDesignSystem.tsx` com componentes base: `PageHead`, `KpiCard`, `PanelCard`, `TableCard`, `TabsBizy`, `ToolbarBizy`, `BotaoBizy`.
- A paleta semantica ja existe: verde, amber, blue, rose, violet e neutros.
- O SDD exige mobile-first, sem scroll horizontal em 360px, estados vazios com proxima acao e telas operacionais orientadas a acao real.

### Pontos fracos

- Muitos blocos apresentam informacao, mas nao deixam claro o proximo movimento.
- Estados vazios aparecem como texto solto em tabelas, sem titulo, contexto e acao.
- `TableCard` e tabelas nao tem contrato de titulo, descricao, toolbar ou acoes por padrao.
- Botoes estao mais proximos de CTA visual do que de comandos de produto: falta secondary, tertiary e danger consistentes.
- KPIs usam hero/gradiente e leitura decorativa em alguns pontos, enquanto Carbon favorece tiles densos, planos e accionaveis.
- A navegacao entre paginas existe, mas os componentes internos nao ajudam a concluir fluxos: vender, atender, cobrar, entregar, recuperar, medir, gerir equipa ou controlar dinheiro.

## 4. Regras De Adaptacao Carbon Para Bizy

1. Manter marca Bizy: verde continua primario; amber, blue, rose e violet ficam como suporte semantico.
2. Usar camadas planas: `layer`, `layer-alt`, `field`, `border-subtle`, `border-strong`, `focus`.
3. Remover gradientes e sombras pesadas das superficies operacionais.
4. `PageHead` deve ter acao primaria clara, agrupada a direita no desktop e fluida no mobile.
5. `KpiCard` vira tile operacional: valor, estado, contexto e opcionalmente acao.
6. `TableCard` deve aceitar titulo, descricao e acoes, mesmo que paginas antigas ainda passem so a tabela.
7. `BotaoBizy` deve suportar `primary`, `secondary`, `tertiary`, `ghost` e `danger`.
8. Empty state deve ter icone, titulo, detalhe e, quando possivel, botao de proxima acao.
9. Tabelas devem priorizar acao por linha e toolbar por lista.
10. Mobile deve manter acao primaria acessivel e evitar tabelas quando cards forem mais operaveis.

## 5. Matriz Por Tipo De Pagina

| Tipo | Rotas | Padrao Carbon aplicado |
| --- | --- | --- |
| Comando operacional | `/app`, `/app/live`, `/app/equipa` | resumo accionavel, sinais, lista de pendencias, acao primaria |
| Listas comerciais | `/app/reservas`, `/app/clientes`, `/app/recuperacao`, `/app/campanhas`, `/app/afiliados` | table toolbar, row actions, empty state com proxima acao |
| CRM funil | `/app/pipeline`, `/app/cotacoes`, `/app/agenda`, `/app/metas`, `/app/actividades`, `/app/formularios`, `/app/sequencias` | metricas compactas, cards por etapa, empty states accionaveis |
| Gestao | `/app/relatorios`, `/app/financas`, `/app/pagamentos`, `/app/inteligencia` | KPI tiles, paineis de decisao, tabelas com acoes e filtros |
| Admin/Sistema | `/app/administracao`, `/app/diagnosticos`, `/app/auditoria`, `/app/comentarios` | densidade tecnica, tables, logs, filtros e acoes auditaveis |
| Publico | Home, Market, Loja, Checkout | nao copiar Carbon interno; usar apenas tokens de acessibilidade, foco e clareza de formulários |

## 6. Aplicacao Inicial

- Alterar `BizyDesignSystem.tsx` para suportar componentes accionaveis sem quebrar chamadas existentes.
- Aplicar camada CSS Carbon/Bizy no fim de `frontend/src/estilos.css`, sobrescrevendo visual amador por superficie plana, borda, foco e densidade.
- Ajustar `EstadoVazio` para aceitar acao opcional e usar a nova estrutura.
- Corrigir telas com botoes falsos ou vazios sem proxima acao: Tarefas, Recuperacao e estados base de tabela.

## 7. Criterios De Aceite

- Typecheck e build do frontend passam.
- Rotas principais abrem em desktop e mobile sem overflow horizontal.
- Componentes base mantem compatibilidade com paginas existentes.
- Primeira acao da pagina fica clara.
- Empty states deixam de ser apenas texto informativo.
- Carbon e aplicado como metodologia operacional, preservando identidade Bizy.
