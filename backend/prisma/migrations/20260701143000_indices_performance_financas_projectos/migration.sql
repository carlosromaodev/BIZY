-- Índices de suporte para consultas por período/tenant em ledger financeiro e listagens de projectos activos.
CREATE INDEX "MovimentoFinanceiro_negocioId_dataMovimento_idx"
  ON "MovimentoFinanceiro"("negocioId", "dataMovimento");

CREATE INDEX "MovimentoFinanceiro_negocioId_reconciliado_dataMovimento_idx"
  ON "MovimentoFinanceiro"("negocioId", "reconciliado", "dataMovimento");

CREATE INDEX "MovimentoFinanceiro_negocioId_origemTipo_origemId_idx"
  ON "MovimentoFinanceiro"("negocioId", "origemTipo", "origemId");

CREATE INDEX "Projecto_negocioId_estado_criadoEm_idx"
  ON "Projecto"("negocioId", "estado", "criadoEm");

CREATE INDEX "ProjetoComercial_negocioId_estado_criadoEm_idx"
  ON "ProjetoComercial"("negocioId", "estado", "criadoEm");

CREATE INDEX "ProjetoComercial_negocioId_tipo_estado_criadoEm_idx"
  ON "ProjetoComercial"("negocioId", "tipo", "estado", "criadoEm");
