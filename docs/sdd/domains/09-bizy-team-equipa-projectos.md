# SDD Dominio 09 - Bizy Team, Equipa e Projectos

Status: ativo
Owner logico: Produto Team
Fontes: `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`, `backend/src/infra/http/modulos/equipa.ts`, `backend/src/infra/http/modulos/projectos.ts`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Transformar o Bizy de CRM operacional em Bizy Team: ferramenta diaria para equipa, metas, turnos, projectos, actividade interna e projectos comerciais.

## 2. Escopo

Entra: membros, convites, magic links, personas, desempenho, metas, turnos, presenca, notas internas, feed, gamificacao, departamentos, projectos, projectos comerciais, pool de stock, fila de projecto e passagem de turno.

Fica fora: ledger financeiro detalhado, coberto no dominio 10.

## 3. Atores e Permissoes

- Dono/admin: gere membros, personas, metas, turnos e projectos.
- Gestor: acompanha desempenho, fila e passagem de turno.
- Vendedor/atendente: ve tarefas, comissao, metas e actividade propria.
- Membro externo: acessa workspaces conforme permissao.
- Sistema: cria checklists, tarefas e relatorios de passagem.

## 4. Entidades e Dados

- `MembroNegocio`
- `PersonaPapel`
- `ConviteEquipa`
- `NotaInterna`
- `FeedActividade`
- `ChecklistOnboarding`
- `MascaramentoDados`
- `ConfiguracaoGamificacao`
- `RankingEquipa`
- `MetaVendas`
- `TurnoMembro`
- `RegistoPresenca`
- `Departamento`
- `Projecto`
- `EntregaProjecto`
- `MembroProjecto`
- `ProjetoComercial`
- `PoolStockProjeto`
- `EquipaProjeto`
- `FilaProjeto`
- `DebriefingProjeto`
- `PassagemTurno`

## 5. Fluxos Principais

```text
Convite -> Aceite -> Persona/Papel -> Checklist -> Primeira tarefa -> Actividade
```

```text
Turno -> Check-in/Disponibilidade -> Conversas/Tarefas -> Passagem de turno
```

```text
Projecto comercial -> Pool de stock -> Equipa temporaria -> Fila -> Debriefing
```

## 6. Requisitos Funcionais

- Criar convite por WhatsApp/SMS/email.
- Suportar magic link e passwordless.
- Definir personas de acesso.
- Calcular KPIs de membro.
- Configurar metas individuais e colectivas.
- Gerir turnos e presenca.
- Criar notas internas com mencoes.
- Registrar feed de actividade.
- Criar departamentos, projectos e entregas.
- Criar projectos comerciais com stock e equipa dedicados.

## 7. Regras de Negocio

- Acesso deve ser mobile-first e com pouca friccao.
- Novo membro deve ver valor imediato.
- Vendedor nao deve ver modulos financeiros/tecnicos sem permissao.
- Actividade do membro e prova auditavel de trabalho.
- Projecto comercial pode ter permissao e stock especificos.

## 8. Requisitos Nao Funcionais

- Painel adaptado ao papel.
- Mascaramento de dados por papel.
- Navegacao entre contextos em ate poucos cliques.
- Operacao completa em mobile.
- Gamificacao opcional e configuravel.

## 9. APIs, Telas e Integracoes

APIs: `/equipa/membros`, `/equipa/convites`, `/equipa/personas`, `/equipa/feed`, `/equipa/desempenho`, `/equipa/gamificacao`, `/projectos/*`.

Telas: Equipa, Painel, Projectos, Metas, Actividades, Administracao.

## 10. Guardrails

- Nao transformar Team em fiscalizacao punitiva.
- Nao expor dados alem do papel.
- Nao criar ranking obrigatorio para toda equipa.
- Nao usar projecto comercial para contornar stock global sem registro.

## 11. Estado Atual

Backend inclui equipa, convites, personas, notas, feed, gamificacao, projectos, departamentos e projectos comerciais em evolucao. Frontend possui Equipa, Metas, Actividades e paginas relacionadas.

## 12. Lacunas

- P0: progressive disclosure por papel nas rotas criticas.
- P1: onboarding de membro guiado e passagem de turno visual.
- P2: modo sombra, check-in via WhatsApp, war rooms e placar ao vivo.

## 13. Testes e Verificacao

- Testes HTTP de equipa.
- Testes de permissoes por papel.
- Testes de projectos.
- Testes de mascaramento e feed.

## 14. Proximos Planos

- Spec de onboarding de membro.
- Spec de war room de projecto comercial.
- Spec de passagem de turno via WhatsApp.
