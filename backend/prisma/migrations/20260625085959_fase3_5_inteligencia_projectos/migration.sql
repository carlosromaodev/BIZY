-- CreateTable
CREATE TABLE "PrevisaoDemanda" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "pecaId" TEXT,
    "sku" TEXT,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "quantidadePrevista" INTEGER NOT NULL,
    "quantidadeReal" INTEGER,
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "factoresJson" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrevisaoDemanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreCliente" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoScore" TEXT NOT NULL DEFAULT 'RFM',
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "segmento" TEXT,
    "recencia" INTEGER,
    "frequencia" INTEGER,
    "monetario" INTEGER,
    "probabilidadeChurn" DOUBLE PRECISION,
    "ltvEstimado" INTEGER,
    "factoresJson" TEXT NOT NULL DEFAULT '[]',
    "calculadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrevisaoFluxoCaixa" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "semanaInicio" TIMESTAMP(3) NOT NULL,
    "semanaFim" TIMESTAMP(3) NOT NULL,
    "entradasPrevistas" INTEGER NOT NULL DEFAULT 0,
    "saidasPrevistas" INTEGER NOT NULL DEFAULT 0,
    "saldoPrevisto" INTEGER NOT NULL DEFAULT 0,
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "factoresJson" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrevisaoFluxoCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightPreditivo" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "confianca" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "nivelConfianca" TEXT NOT NULL DEFAULT 'MEDIA',
    "acaoSugerida" TEXT,
    "entidadeTipo" TEXT,
    "entidadeId" TEXT,
    "factoresJson" TEXT NOT NULL DEFAULT '[]',
    "expiradoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightPreditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackInsight" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "accao" TEXT NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluxoAutomatico" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "gatilho" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "condicoesJson" TEXT NOT NULL DEFAULT '{}',
    "falhasConsecutivas" INTEGER NOT NULL DEFAULT 0,
    "pausadoPorFalha" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FluxoAutomatico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassoFluxo" (
    "id" TEXT NOT NULL,
    "fluxoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "configuracaoJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassoFluxo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecucaoFluxo" (
    "id" TEXT NOT NULL,
    "fluxoId" TEXT NOT NULL,
    "gatilhoEntidadeId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'EM_EXECUCAO',
    "passoActual" INTEGER NOT NULL DEFAULT 0,
    "resultadoJson" TEXT NOT NULL DEFAULT '{}',
    "erro" TEXT,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),

    CONSTRAINT "ExecucaoFluxo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoNotificacao" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "horarioInicio" TEXT,
    "horarioFim" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoNotificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContadorNotificacaoDiaria" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContadorNotificacaoDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "liderId" TEXT,
    "paisId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projecto" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "orcamento" INTEGER,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'PLANEADO',
    "departamentoId" TEXT,
    "gestorId" TEXT,
    "motivoFecho" TEXT,
    "relatorioFinalJson" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntregaProjecto" (
    "id" TEXT NOT NULL,
    "projectoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataLimite" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "dependeDeId" TEXT,
    "motivoCancelamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntregaProjecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroProjecto" (
    "id" TEXT NOT NULL,
    "projectoId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "papelProjecto" TEXT NOT NULL DEFAULT 'MEMBRO',
    "alocadoDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alocadoAte" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MembroProjecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoComercial" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'LIVE',
    "estado" TEXT NOT NULL DEFAULT 'PLANEADO',
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjetoComercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolStockProjeto" (
    "id" TEXT NOT NULL,
    "projetoComercialId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "quantidadeReservada" INTEGER NOT NULL DEFAULT 0,
    "quantidadeVendida" INTEGER NOT NULL DEFAULT 0,
    "pausado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoolStockProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipaProjeto" (
    "id" TEXT NOT NULL,
    "projetoComercialId" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "papelProjeto" TEXT NOT NULL DEFAULT 'SUPORTE_VENDAS',
    "alocadoDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alocadoAte" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EquipaProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilaProjeto" (
    "id" TEXT NOT NULL,
    "projetoComercialId" TEXT NOT NULL,
    "entidadeTipo" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PENDENTE',
    "atribuidoAId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilaProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebriefingProjeto" (
    "id" TEXT NOT NULL,
    "projetoComercialId" TEXT NOT NULL,
    "totalVendas" INTEGER NOT NULL DEFAULT 0,
    "receitaTotal" INTEGER NOT NULL DEFAULT 0,
    "tempoMedioResposta" INTEGER,
    "stockLiquidado" INTEGER,
    "comissoesGeradas" INTEGER,
    "audiencia" INTEGER,
    "roiPercentual" DOUBLE PRECISION,
    "notasJson" TEXT NOT NULL DEFAULT '{}',
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebriefingProjeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassagemTurno" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "membroSaindoId" TEXT NOT NULL,
    "membroEntrandoId" TEXT,
    "conversasAbertas" INTEGER NOT NULL DEFAULT 0,
    "tarefasPendentes" INTEGER NOT NULL DEFAULT 0,
    "clientesQuentes" INTEGER NOT NULL DEFAULT 0,
    "resumoJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassagemTurno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraFiscal" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "jurisdicao" TEXT NOT NULL DEFAULT 'AO',
    "tipoImposto" TEXT NOT NULL DEFAULT 'IVA',
    "taxa" DOUBLE PRECISION NOT NULL DEFAULT 14,
    "descricao" TEXT,
    "aplicavelA" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegraFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaselineKPI" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "valorBaseline" DOUBLE PRECISION NOT NULL,
    "registadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BaselineKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaAdopcao" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "dau" INTEGER NOT NULL DEFAULT 0,
    "mau" INTEGER NOT NULL DEFAULT 0,
    "profundidadeJson" TEXT NOT NULL DEFAULT '{}',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricaAdopcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PesquisaNPS" (
    "id" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "pontuacao" INTEGER NOT NULL,
    "comentario" TEXT,
    "modulo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PesquisaNPS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrevisaoDemanda_negocioId_pecaId_periodoInicio_idx" ON "PrevisaoDemanda"("negocioId", "pecaId", "periodoInicio");

-- CreateIndex
CREATE INDEX "PrevisaoDemanda_negocioId_criadoEm_idx" ON "PrevisaoDemanda"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "ScoreCliente_negocioId_clienteId_tipoScore_idx" ON "ScoreCliente"("negocioId", "clienteId", "tipoScore");

-- CreateIndex
CREATE INDEX "ScoreCliente_negocioId_tipoScore_segmento_idx" ON "ScoreCliente"("negocioId", "tipoScore", "segmento");

-- CreateIndex
CREATE INDEX "ScoreCliente_negocioId_calculadoEm_idx" ON "ScoreCliente"("negocioId", "calculadoEm");

-- CreateIndex
CREATE INDEX "PrevisaoFluxoCaixa_negocioId_semanaInicio_idx" ON "PrevisaoFluxoCaixa"("negocioId", "semanaInicio");

-- CreateIndex
CREATE INDEX "InsightPreditivo_negocioId_tipo_criadoEm_idx" ON "InsightPreditivo"("negocioId", "tipo", "criadoEm");

-- CreateIndex
CREATE INDEX "InsightPreditivo_negocioId_nivelConfianca_idx" ON "InsightPreditivo"("negocioId", "nivelConfianca");

-- CreateIndex
CREATE INDEX "FeedbackInsight_insightId_idx" ON "FeedbackInsight"("insightId");

-- CreateIndex
CREATE INDEX "FeedbackInsight_usuarioId_criadoEm_idx" ON "FeedbackInsight"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "FluxoAutomatico_negocioId_ativo_gatilho_idx" ON "FluxoAutomatico"("negocioId", "ativo", "gatilho");

-- CreateIndex
CREATE INDEX "FluxoAutomatico_negocioId_criadoEm_idx" ON "FluxoAutomatico"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "PassoFluxo_fluxoId_ordem_idx" ON "PassoFluxo"("fluxoId", "ordem");

-- CreateIndex
CREATE INDEX "ExecucaoFluxo_fluxoId_estado_idx" ON "ExecucaoFluxo"("fluxoId", "estado");

-- CreateIndex
CREATE INDEX "ExecucaoFluxo_fluxoId_iniciadoEm_idx" ON "ExecucaoFluxo"("fluxoId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "ConfiguracaoNotificacao_negocioId_membroId_idx" ON "ConfiguracaoNotificacao"("negocioId", "membroId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoNotificacao_negocioId_membroId_canal_tipo_key" ON "ConfiguracaoNotificacao"("negocioId", "membroId", "canal", "tipo");

-- CreateIndex
CREATE INDEX "ContadorNotificacaoDiaria_negocioId_membroId_data_idx" ON "ContadorNotificacaoDiaria"("negocioId", "membroId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "ContadorNotificacaoDiaria_negocioId_membroId_canal_data_key" ON "ContadorNotificacaoDiaria"("negocioId", "membroId", "canal", "data");

-- CreateIndex
CREATE INDEX "Departamento_negocioId_paisId_idx" ON "Departamento"("negocioId", "paisId");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_negocioId_nome_key" ON "Departamento"("negocioId", "nome");

-- CreateIndex
CREATE INDEX "Projecto_negocioId_estado_idx" ON "Projecto"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "Projecto_negocioId_departamentoId_idx" ON "Projecto"("negocioId", "departamentoId");

-- CreateIndex
CREATE INDEX "EntregaProjecto_projectoId_estado_idx" ON "EntregaProjecto"("projectoId", "estado");

-- CreateIndex
CREATE INDEX "MembroProjecto_projectoId_activo_idx" ON "MembroProjecto"("projectoId", "activo");

-- CreateIndex
CREATE INDEX "MembroProjecto_membroId_idx" ON "MembroProjecto"("membroId");

-- CreateIndex
CREATE UNIQUE INDEX "MembroProjecto_projectoId_membroId_key" ON "MembroProjecto"("projectoId", "membroId");

-- CreateIndex
CREATE INDEX "ProjetoComercial_negocioId_estado_idx" ON "ProjetoComercial"("negocioId", "estado");

-- CreateIndex
CREATE INDEX "ProjetoComercial_negocioId_tipo_estado_idx" ON "ProjetoComercial"("negocioId", "tipo", "estado");

-- CreateIndex
CREATE INDEX "PoolStockProjeto_projetoComercialId_idx" ON "PoolStockProjeto"("projetoComercialId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolStockProjeto_projetoComercialId_pecaId_key" ON "PoolStockProjeto"("projetoComercialId", "pecaId");

-- CreateIndex
CREATE INDEX "EquipaProjeto_projetoComercialId_activo_idx" ON "EquipaProjeto"("projetoComercialId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "EquipaProjeto_projetoComercialId_membroId_key" ON "EquipaProjeto"("projetoComercialId", "membroId");

-- CreateIndex
CREATE INDEX "FilaProjeto_projetoComercialId_estado_idx" ON "FilaProjeto"("projetoComercialId", "estado");

-- CreateIndex
CREATE INDEX "FilaProjeto_projetoComercialId_entidadeTipo_idx" ON "FilaProjeto"("projetoComercialId", "entidadeTipo");

-- CreateIndex
CREATE UNIQUE INDEX "DebriefingProjeto_projetoComercialId_key" ON "DebriefingProjeto"("projetoComercialId");

-- CreateIndex
CREATE INDEX "PassagemTurno_negocioId_criadoEm_idx" ON "PassagemTurno"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "PassagemTurno_membroSaindoId_idx" ON "PassagemTurno"("membroSaindoId");

-- CreateIndex
CREATE INDEX "RegraFiscal_negocioId_jurisdicao_tipoImposto_idx" ON "RegraFiscal"("negocioId", "jurisdicao", "tipoImposto");

-- CreateIndex
CREATE INDEX "BaselineKPI_negocioId_modulo_idx" ON "BaselineKPI"("negocioId", "modulo");

-- CreateIndex
CREATE UNIQUE INDEX "BaselineKPI_negocioId_modulo_kpi_key" ON "BaselineKPI"("negocioId", "modulo", "kpi");

-- CreateIndex
CREATE INDEX "MetricaAdopcao_negocioId_data_idx" ON "MetricaAdopcao"("negocioId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "MetricaAdopcao_negocioId_data_key" ON "MetricaAdopcao"("negocioId", "data");

-- CreateIndex
CREATE INDEX "PesquisaNPS_negocioId_criadoEm_idx" ON "PesquisaNPS"("negocioId", "criadoEm");

-- CreateIndex
CREATE INDEX "PesquisaNPS_negocioId_modulo_idx" ON "PesquisaNPS"("negocioId", "modulo");

-- AddForeignKey
ALTER TABLE "PrevisaoDemanda" ADD CONSTRAINT "PrevisaoDemanda_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreCliente" ADD CONSTRAINT "ScoreCliente_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrevisaoFluxoCaixa" ADD CONSTRAINT "PrevisaoFluxoCaixa_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightPreditivo" ADD CONSTRAINT "InsightPreditivo_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackInsight" ADD CONSTRAINT "FeedbackInsight_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "InsightPreditivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluxoAutomatico" ADD CONSTRAINT "FluxoAutomatico_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassoFluxo" ADD CONSTRAINT "PassoFluxo_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "FluxoAutomatico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecucaoFluxo" ADD CONSTRAINT "ExecucaoFluxo_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "FluxoAutomatico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoNotificacao" ADD CONSTRAINT "ConfiguracaoNotificacao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguracaoNotificacao" ADD CONSTRAINT "ConfiguracaoNotificacao_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "MembroNegocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projecto" ADD CONSTRAINT "Projecto_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaProjecto" ADD CONSTRAINT "EntregaProjecto_projectoId_fkey" FOREIGN KEY ("projectoId") REFERENCES "Projecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroProjecto" ADD CONSTRAINT "MembroProjecto_projectoId_fkey" FOREIGN KEY ("projectoId") REFERENCES "Projecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoComercial" ADD CONSTRAINT "ProjetoComercial_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolStockProjeto" ADD CONSTRAINT "PoolStockProjeto_projetoComercialId_fkey" FOREIGN KEY ("projetoComercialId") REFERENCES "ProjetoComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipaProjeto" ADD CONSTRAINT "EquipaProjeto_projetoComercialId_fkey" FOREIGN KEY ("projetoComercialId") REFERENCES "ProjetoComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilaProjeto" ADD CONSTRAINT "FilaProjeto_projetoComercialId_fkey" FOREIGN KEY ("projetoComercialId") REFERENCES "ProjetoComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebriefingProjeto" ADD CONSTRAINT "DebriefingProjeto_projetoComercialId_fkey" FOREIGN KEY ("projetoComercialId") REFERENCES "ProjetoComercial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassagemTurno" ADD CONSTRAINT "PassagemTurno_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegraFiscal" ADD CONSTRAINT "RegraFiscal_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BaselineKPI" ADD CONSTRAINT "BaselineKPI_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricaAdopcao" ADD CONSTRAINT "MetricaAdopcao_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PesquisaNPS" ADD CONSTRAINT "PesquisaNPS_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

