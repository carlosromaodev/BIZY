---
title: Inventario de Dados, Prisma e Migrations
aliases:
  - Dados Prisma Bizy
tags:
  - bizy/inventario
  - bizy/dados
status: ativo
updated: 2026-07-09
---

# Inventario de Dados, Prisma e Migrations

Status: ativo
Ultima atualizacao: 2026-07-09
Fontes principais: `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/src/use-case/repositorios/RepositorioPrisma.ts`

## Armazenamento

- Prisma Client 5.
- PostgreSQL em Docker/local/producao.
- Repositorio em memoria existe para testes/dev quando `MODO_ARMAZENAMENTO=memoria`.
- Cliente Prisma criado em `backend/src/infra/banco/prismaCliente.ts`.
- Implementacao persistente central em `backend/src/use-case/repositorios/RepositorioPrisma.ts`.

## Ligacoes de Contexto

- Conceitos de dominio e entidades principais: [Memoria de Projeto do Bizy](memoria-projeto-bizy.md).
- Endpoints que usam estes modelos: [Inventario Backend e API HTTP](inventario-backend-api.md).
- Operacao de migrations, backup e restore: [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).
- Procedimento de deploy que depende destas migrations: [Deploy na VPS Antiga](deploy-vps-antiga.md).
- Incidente de migrations documentado na [Memoria Viva do Bizy](memoria-viva-bizy.md).

## Modelos Prisma Existentes

Catalogo, live e reservas:

- `Peca`
- `MovimentoStock`
- `Reserva`
- `ComentarioRecebido`
- `SessaoLive`

Pedidos e atendimento:

- `Pedido`
- `ItemPedido`
- `MensagemWhatsapp`
- `ClienteAtendimento`
- `ConversaAtendimento`
- `MensagemAtendimento`

Eventos e outbox:

- `EventoSistema`
- `OutboxEventoN8n`
- `OutboxMensagemWhatsApp`
- `EventoOperacional`
- `JobOperacional`

Anani interno:

- `EventOutbox`
- `AnaniTenantRiskSnapshot`
- `AnaniQuarantine`
- `AnaniIncident`

Identidade, negocios e modulos:

- `UsuarioSistema`
- `IdentidadeAutenticacao`
- `PerfilEstudantilUsuario`
- `Negocio`
- `MembroNegocio`
- `ModuloNegocio`
- `CodigoLoginSms`
- `SessaoUsuario`
- `InstanciaWhatsApp`

Clientes e compartilhamento:

- `ClienteGlobal`
- `ClienteNegocio`
- `RelacaoNegocio`
- `CompartilhamentoCliente`
- `AuditoriaCompartilhamentoCliente`

CRM+, social inbox, funil e recuperacao:

- `SocialInboxItem`
- `PlaybookRecuperacao`
- `ExecucaoPlaybookRecuperacao`
- `MovimentoFunilComercial`
- `OportunidadeRecuperacao`
- `TarefaOperacional`

Campanhas e WhatsApp:

- `TemplateWhatsAppNegocio`
- `CampanhaCrm`
- `ItemCampanhaCrm`

Tracking, afiliados e comissoes:

- `EventoTrackingComercial`
- `ParceiroComercial`
- `LinkAfiliado`
- `ComissaoParceiro`
- `HistoricoComissaoParceiro`
- `LotePagamentoComissao`
- `ItemLotePagamentoComissao`

## Linha do Tempo das Migrations

- `20260503070000_inicial`
- `20260503073000_hardening_operacional`
- `20260522000000_permitir_reservas_repetidas`
- `20260522001000_persistir_sessoes_live`
- `20260522002000_outbox_whatsapp`
- `20260522003000_crm_atendimento`
- `20260523000100_enriquecer_perfil_cliente`
- `20260524073000_identidade_onboarding_bizy`
- `20260524190000_crm_plus_multitenancy_foundation`
- `20260525001000_pedidos_crm_operacional`
- `20260525003000_catalogo_stock_comercial`
- `20260525004000_loja_publica_tracking`
- `20260525012000_afiliados_comissoes`
- `20260525014500_pagamento_reversao_comissoes`
- `20260525020500_historico_comissoes_afiliados`
- `20260525022000_lotes_pagamento_comissoes`
- `20260525024500_tarefas_operacionais`
- `20260525031500_tarefas_operacionais_manual`
- `20260525033000_social_inbox`
- `20260525040000_playbooks_recuperacao`
- `20260525043000_funil_comercial`
- `20260525050000_oportunidades_recuperacao`
- `20260525065000_motivo_revogacao_compartilhamento_cliente`
- `20260525123000_campanhas_governanca_crm`
- `20260526020000_vitrine_produto_publico`
- `20260526033000_contas_sociais_negocio`
- `20260526090000_links_afiliados_contexto_comercial`
- `20260527045500_evento_operacional_payload_version`
- `20260623090000_renomeia_modulo_crm_team_core`
- `20260709090000_anani_internal_control_plane`

## Comandos de Banco

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:migrate:status
npm run bootstrap:ambiente
```

Estes comandos sao usados em desenvolvimento, Docker e deploy; ver tambem [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).

## Backup e Restore

Scripts:

- `scripts/backup-postgres.sh`
- `scripts/restore-postgres.sh`

Comandos:

```bash
BACKUP_ENV=production npm run backup:postgres
CONFIRM_RESTORE=SIM BACKUP_FILE=/caminho/arquivo.dump npm run restore:postgres
```

Restore exige confirmacao explicita e usa `pg_restore --clean --if-exists --exit-on-error`.

Para VPS antiga, ver [Deploy na VPS Antiga](deploy-vps-antiga.md). Para stack e scripts gerais, ver [Inventario de Operacao, Integracoes e Testes](inventario-operacao-testes.md).

## Incidente Que Deve Ficar na Memoria

Rotas autenticadas retornaram 500 porque a base local nao tinha migrations recentes. A coluna `Negocio.contasSociaisJson` faltava. A solucao foi:

```bash
npm run prisma:migrate:deploy --workspace backend
```

Depois `npm run prisma:migrate:status --workspace backend` confirmou schema atualizado. Quando varias rotas falharem juntas, verificar migrations antes de investigar frontend.

## Cuidados

- Nao usar `prisma db push` em producao.
- Em Docker, o backend executa `prisma generate` e `prisma migrate deploy` no arranque.
- Migrations devem ser versionadas antes de deploy.
- Se migrar banco antigo criado por `db push`, fazer backup e usar baseline apenas se a estrutura corresponder ao schema.
