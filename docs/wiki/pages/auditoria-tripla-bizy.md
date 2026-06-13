---
title: Auditoria Tripla — Contabilista, Estatistico e Engenheiro de Dados
aliases:
  - Parecer Profissional Bizy
  - Auditoria Financeira
  - Analise Estatistica
  - Data Engineering Review
tags:
  - bizy/auditoria
  - bizy/financas
  - bizy/estatistica
  - bizy/dados
status: ativo
updated: 2026-06-12
---

# Auditoria Tripla do Bizy

Parecer independente do ponto de vista de tres especialistas: contabilista, estatistico e engenheiro de dados. Analise feita sobre o estado do codigo em Jun 2026.

---

## 1. Parecer do Contabilista

### Pontuacao de Prontidao Financeira: 6/10

### O que funciona bem

- Estrutura de dados normalizada para pedidos, itens, pagamentos
- Auditoria operacional implementada (`auditoriaOperacional.ts`) — regista alteracoes com antes/depois, autor e motivo
- Sistema de comissoes de afiliados sofisticado com estados (ESTIMADA -> CONFIRMADA -> PAGA -> REVERTIDA)
- Historico de comissoes imutavel (`HistoricoComissaoParceiro`)
- Politica de desconto configuravel com limites por papel
- Segregacao basica: quem solicita desconto != quem aprova

### Riscos criticos

| Area | Problema | Impacto |
|------|----------|---------|
| **IVA** | Nao calculado (Angola = 14% desde Jan 2024) | Ilegal para venda formal |
| **Precisao monetaria** | Valores em `Int` (Kwanza inteiro), sem centavos | Erros acumulam em milhares de transacoes |
| **Reembolsos** | Estado `REEMBOLSADO` declarado em tipos mas nao implementado | Fluxo incompleto |
| **Recibos fiscais** | Recibos simples, sem modelo fiscal angolano | Nao-compilante |
| **Retencao na fonte** | Sem PIT sobre comissoes de afiliados | Obrigacao fiscal ignorada |

### Fluxos financeiros ausentes

- Reconciliacao de pagamentos (comprovativo vs saldo recebido)
- Envelhecimento de recebiveis (aging report: 7d, 15d, 30d, 60d+)
- Fluxo de caixa projetado
- Devolucao automatica de comissao ao cancelar pedido pago
- Assinatura digital/hash criptografico nos registos de auditoria

### Ficheiros-chave

- `schema.prisma` linhas 114-151 (modelo Pedido)
- `GestaoPedidosUseCase.ts` linhas 49-102 (criacao), 228-270 (pagamento)
- `auditoriaOperacional.ts` (sistema de auditoria)
- `RelatoriosComerciaisUseCase.ts` linhas 75-80 (calculo receita)

---

## 2. Parecer do Estatistico

### Pontuacao de Maturidade Analitica: 4/10

### Metricas existentes (bem implementadas)

| Metrica | Formula | Localização |
|---------|---------|-------------|
| Receita bruta/liquida | SUM(subtotal) - SUM(desconto) + SUM(entrega) | RelatoriosComerciaisUseCase.ts:77-80 |
| Ticket medio | SUM(total) / COUNT(pedidos_pagos) | RelatoriosComerciaisUseCase.ts:99-101 |
| Taxa conversao reservas | COUNT(pagas) / COUNT(total) * 100 | RelatoriosComerciaisUseCase.ts:104-105 |
| Cohort basico | Agrupa clientes por mes da primeira compra | RelatoriosComerciaisUseCase.ts:451-495 |
| Tempo medio resposta | AVG(primeira_resposta - primeira_msg) | RelatoriosComerciaisUseCase.ts:425-426 |
| Receita por canal social | SUM(receita) GROUP BY canal | RelatoriosComerciaisUseCase.ts:252-316 |
| Produtos mais vendidos | ORDER BY SUM(quantidade) DESC | RelatoriosComerciaisUseCase.ts:319-343 |

### O que falta (critico para CRM de e-commerce)

| Analise | Descricao | Prioridade |
|---------|-----------|------------|
| **Segmentacao RFM** | Score de Recencia, Frequencia e Valor monetario por cliente. Permite segmentar em Champions, Loyal, At Risk, Lost | CRITICA |
| **Previsao de Churn** | Probabilidade de abandono baseada em padrao de atividade decrescente | CRITICA |
| **Customer Lifetime Value** | Valor total esperado do cliente ao longo do tempo. Essencial para ROI de aquisicao | CRITICA |
| **Decomposicao sazonal** | Separar tendencia + sazonalidade + ruido nas vendas (statsmodels: seasonal_decompose) | IMPORTANTE |
| **Testes A/B** | Significancia estatistica em campanhas. Chi-square, t-test, p-values | IMPORTANTE |
| **Intervalos de confianca** | Margem de erro nas taxas de conversao (scipy.stats: binom confidence) | IMPORTANTE |
| **Analise de funil** | Taxa de conversao etapa-a-etapa: view -> interesse -> reserva -> pagamento -> entrega | IMPORTANTE |
| **Market basket** | Afinidade entre produtos (quem compra X tambem compra Y) | MEDIO |
| **Deteccao de anomalias** | Alertas para spikes/drops anormais (Z-score, IQR) | MEDIO |
| **Analise de sobrevivencia** | Curva Kaplan-Meier para tempo de vida do cliente | MEDIO |

### Problemas de qualidade de dados

- Funcao `mediaArredondada()` (RelatoriosComerciaisUseCase.ts:527-529) **nao protege contra NaN/Infinity** — se um valor for Infinity, propaga para todos os relatorios
- **Sem protecao contra outliers**: um pedido de 10M Kz distorce ticket medio. Recomendacao: usar mediana ou percentil 50
- JSON blobs como `perfilCompletoJson` impedem queries SQL nativas para segmentacao

### Visualizacoes ausentes no frontend

| Tipo | Uso | Estado |
|------|-----|--------|
| Linha (time series) | Tendencia de receita ao longo do tempo | Falta |
| Cohort heatmap | Retencao por mes de entrada | Falta |
| Scatter plot | Recencia vs Frequencia (RFM) | Falta |
| Histograma | Distribuicao de ticket, tempo entre compras | Falta |
| Funil (Sankey) | Fluxo comentario -> reserva -> pagamento | Falta |
| Box plot | Outliers em valores | Falta |

**Nota**: Nenhuma biblioteca de graficos instalada (sem recharts, visx, d3, plotly).

---

## 3. Parecer do Engenheiro de Dados

### Pontuacao de Robustez de Dados: 5/10

### Arquitectura actual

- **Database**: PostgreSQL via Prisma ORM
- **Computacao**: 100% on-the-fly em Node.js (sem pre-agregacao)
- **Cache**: Nenhum (sem Redis, sem LRU)
- **Background jobs**: Schema existe (JobOperacional, EventoOperacional) mas sem consumer/worker implementado
- **Real-time**: SSE para eventos de live + polling 15s no painel

### Indexacao (146 indices encontrados)

**Bem feito**: indices compostos em (negocioId, estado, criadoEm) nas tabelas principais.

**Faltam**: indice em `Pedido(pagoEm DESC)` para ultimas vendas, indice em `ClienteNegocio(estadoRelacionamento)` para filtros de segmento.

### Problema critico: relatórios in-memory

```
RelatoriosComerciaisUseCase.ts linhas 60-67:
  Carrega pedidos (limite 10.000)
  + clientes (limite 100.000)
  + pecas + reservas + conversas + tarefas
  = ~600k objectos em memoria
  → Computa TUDO em JavaScript
```

**Cenario de falha**: negocio com 50k+ pedidos → timeout de 30s no relatorio.

**Solucao**: tabelas de agregacao pre-computadas (materialized views):
```sql
CREATE MATERIALIZED VIEW mv_vendas_diarias AS
  SELECT negocioId, DATE(criadoEm) as dia,
         SUM(totalEmKwanza) as receita, COUNT(*) as pedidos
  FROM Pedido WHERE estadoPagamento = 'CONFIRMADO'
  GROUP BY negocioId, DATE(criadoEm);
```

### JSON blobs excessivos (58 campos JSON)

| Campo | Tabela | Problema |
|-------|--------|----------|
| `perfilCompletoJson` | ClienteNegocio | Impossivel filtrar/indexar em SQL |
| `metodosPagamentoJson` | Negocio | Deveria ser tabela normalizada |
| `utmJson` | EventoTrackingComercial | Deveria ser normalizado para analise de marketing |
| `tagsJson` | ClienteAtendimento | Sem indice, queries leem 100% |

### Integridade referencial

- Foreign keys bem configurados com CASCADE onde apropriado
- Unique constraints corretos (negocioId+codigo, negocioId+numero, etc.)
- **Risco**: campos `estado` sao `String` em vez de ENUM — aceita qualquer valor
- **Risco**: soft deletes inconsistentes (alguns modelos tem `arquivadoEm`, outros nao)

### Recomendacoes prioritarias

1. **Redis cache** para relatórios (ganho imediato 10x)
2. **Tabelas de agregacao** diaria/mensal para vendas, clientes, conversoes
3. **Consumer/worker** para JobOperacional e OutboxEventoN8n (schema existe, codigo nao)
4. **Normalizar** perfilCompletoJson e metodosPagamentoJson em tabelas proprias
5. **Cursor-based pagination** para APIs de listagem (em vez de offset)
6. **API versioning** (/v1/) para evitar breaking changes

---

## Matriz de Prioridades Unificada

### Critico (antes de ir para producao em Angola)

| # | Item | Perspectiva | Esforco |
|---|------|-------------|---------|
| 1 | Implementar IVA angolano (14%) | Contabilista | Medio |
| 2 | Migrar valores para Decimal ou BigInt (centavos) | Contabilista + Eng. Dados | Alto |
| 3 | Redis cache para relatórios | Eng. Dados | Baixo |
| 4 | Fluxo de reembolso completo | Contabilista | Medio |
| 5 | Segmentacao RFM de clientes | Estatistico | Medio |

### Importante (proximos 3 sprints)

| # | Item | Perspectiva | Esforco |
|---|------|-------------|---------|
| 6 | Tabelas de agregacao pre-computadas | Eng. Dados | Medio |
| 7 | Previsao de churn e CLV | Estatistico | Alto |
| 8 | Consumer para JobOperacional/Outbox | Eng. Dados | Medio |
| 9 | Recibos fiscais angolanos | Contabilista | Alto |
| 10 | Biblioteca de graficos (recharts) + time series | Estatistico | Medio |

### Medio prazo (go-live + 3 meses)

| # | Item | Perspectiva | Esforco |
|---|------|-------------|---------|
| 11 | Normalizar JSON blobs criticos | Eng. Dados | Alto |
| 12 | Testes A/B com significancia estatistica | Estatistico | Medio |
| 13 | Reconciliacao automatica de pagamentos | Contabilista | Alto |
| 14 | Decomposicao sazonal de vendas | Estatistico | Baixo |
| 15 | API versioning e cursor pagination | Eng. Dados | Medio |

---

*Auditoria realizada em 2026-06-12 usando analise estatica do codigo-fonte, schema Prisma e logica de negocios.*
