# SDD Completo do Bizy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a camada SDD completa em `docs/sdd/`, cobrindo processo, indice, templates, ADR e dominios mestres do Bizy.

**Architecture:** O SDD sera uma camada documental permanente, separada da wiki e das specs/plans de iniciativas. `docs/sdd/` organiza o produto por dominios; `docs/superpowers/specs/` continua para specs de iniciativa; `docs/superpowers/plans/` continua para planos executaveis.

**Tech Stack:** Markdown, estrutura existente de `docs/`, wiki Obsidian em `docs/wiki/`, specs/plans Superpowers.

---

## File Structure

Create:

- `docs/sdd/README.md` - entrada rapida do SDD.
- `docs/sdd/00-processo-sdd-bizy.md` - processo oficial, lifecycle e regras de atualizacao.
- `docs/sdd/01-indice-mestre-sdd.md` - indice de dominios, templates, ADRs e relacao com docs existentes.
- `docs/sdd/02-mapa-dominio-produto.md` - mapa entre dominios SDD, modulos, entidades, APIs e telas.
- `docs/sdd/03-roadmap-sdd.md` - lacunas e proximos planos por dominio.
- `docs/sdd/templates/spec-template.md` - template de spec de iniciativa.
- `docs/sdd/templates/plan-template.md` - template de plano executavel.
- `docs/sdd/templates/review-template.md` - template de revisao de spec/plano.
- `docs/sdd/templates/decision-record-template.md` - template de ADR.
- `docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md` - decisao inicial do SDD.
- `docs/sdd/domains/00-visao-produto-e-principios.md`
- `docs/sdd/domains/01-arquitetura-plataforma.md`
- `docs/sdd/domains/02-identidade-acesso-negocios.md`
- `docs/sdd/domains/03-crm-social-commerce.md`
- `docs/sdd/domains/04-live-reservas-pedidos.md`
- `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
- `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- `docs/sdd/domains/07-bizy-market-checkout-repasses.md`
- `docs/sdd/domains/08-afiliados-campanhas-social-inbox.md`
- `docs/sdd/domains/09-bizy-team-equipa-projectos.md`
- `docs/sdd/domains/10-financas-facturacao-conformidade.md`
- `docs/sdd/domains/11-inteligencia-workflow-automacoes.md`
- `docs/sdd/domains/12-frontend-ux-design-system.md`
- `docs/sdd/domains/13-operacao-deploy-observabilidade.md`
- `docs/sdd/domains/14-seguranca-privacidade-auditoria.md`

Modify:

- `docs/wiki/index.md` - adicionar secao curta apontando para o SDD.
- `docs/wiki/log.md` - registrar criacao do pacote SDD.

Reference only:

- `docs/superpowers/specs/2026-06-28-sdd-completo-bizy-design.md`
- `BIZY-FONTE-CHATGPT.md`
- `docs/wiki/pages/*.md`
- `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/rotasApp.tsx`

---

### Task 1: Criar raiz SDD, README e processo

**Files:**
- Create: `docs/sdd/README.md`
- Create: `docs/sdd/00-processo-sdd-bizy.md`
- Create: `docs/sdd/01-indice-mestre-sdd.md`

- [ ] **Step 1: Criar diretorios**

Run:

```bash
mkdir -p docs/sdd/domains docs/sdd/templates docs/sdd/decisions
```

Expected: command exits with code 0.

- [ ] **Step 2: Criar `docs/sdd/README.md`**

Use `apply_patch` to create a Markdown file with these sections:

```markdown
# SDD do Bizy

Status: ativo
Criado em: 2026-06-28
Spec base: ../superpowers/specs/2026-06-28-sdd-completo-bizy-design.md

## Objetivo

O SDD organiza o Bizy por dominios de produto e arquitetura. Ele nao substitui a wiki nem os planos Superpowers; ele conecta visao, requisitos, dominio, specs de iniciativa, planos, implementacao e memoria.

## Como Usar

1. Comece pelo processo em `00-processo-sdd-bizy.md`.
2. Navegue pelo indice em `01-indice-mestre-sdd.md`.
3. Consulte o dominio afetado em `domains/`.
4. Crie specs novas com `templates/spec-template.md`.
5. Crie planos executaveis com `templates/plan-template.md`.
6. Registre decisoes estruturais em `decisions/`.

## Fluxo

```text
Visao/Wiki -> SDD por dominio -> Spec de iniciativa -> Plano -> Implementacao -> Testes -> Atualizacao Wiki/SDD
```

## Fontes Principais

- `BIZY-FONTE-CHATGPT.md`
- `docs/wiki/pages/memoria-projeto-bizy.md`
- `docs/wiki/pages/visao-produto-bizy.md`
- `docs/wiki/pages/bizy-market-lojas-digitais.md`
- `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
- `backend/prisma/schema.prisma`
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- `frontend/src/rotasApp.tsx`
```

- [ ] **Step 3: Criar `docs/sdd/00-processo-sdd-bizy.md`**

Use `apply_patch` with this content outline and fill each section with concise prose:

```markdown
# Processo SDD do Bizy

Status: ativo
Criado em: 2026-06-28

## 1. Principio

Toda mudanca relevante deve estar ligada a um dominio SDD.

## 2. Lifecycle

```text
Ideia -> Dominio SDD -> Spec -> Plano -> Implementacao -> Verificacao -> Wiki/SDD
```

## 3. Quando Criar Spec

Criar spec quando a mudanca altera comportamento, fluxo, entidade, permissao, UX relevante, integracao, seguranca, financeiro, Market, Team ou arquitetura.

## 4. Quando Criar Plano

Criar plano quando a spec aprovada exigir multiplos passos, varios arquivos, testes ou migracao de dados.

## 5. Quando Atualizar Wiki

Atualizar wiki quando a mudanca cria conhecimento duravel, incidente, decisao operacional, novo endpoint, nova tela, nova entidade ou nova prioridade.

## 6. Quando Atualizar SDD

Atualizar SDD quando a mudanca altera fronteira de dominio, regra de negocio, fluxo principal, modelo de dados, contrato publico, guardrail ou roadmap.

## 7. Guardrails

- Backend continua fonte de verdade.
- Dados comerciais respeitam `negocioId`.
- Automacao sensivel gera tarefa humana.
- Admin/Sistema fica separado da operacao comercial.
- Specs e planos devem citar dominio SDD relacionado.
```

- [ ] **Step 4: Criar `docs/sdd/01-indice-mestre-sdd.md`**

Use `apply_patch` with:

```markdown
# Indice Mestre SDD Bizy

Status: ativo
Criado em: 2026-06-28

## Entrada Rapida

- Processo: `00-processo-sdd-bizy.md`
- Mapa de dominios: `02-mapa-dominio-produto.md`
- Roadmap: `03-roadmap-sdd.md`
- Templates: `templates/`
- Decisoes: `decisions/`

## Dominios

Listar os 15 dominios com um resumo de uma linha e link relativo para cada arquivo.

## Relacao com Superpowers

Specs de iniciativa ficam em `../superpowers/specs/`.
Planos executaveis ficam em `../superpowers/plans/`.

## Relacao com Wiki

A wiki continua como memoria viva e inventario. O SDD organiza fronteiras e regras por dominio.
```

- [ ] **Step 5: Validar Task 1**

Run:

```bash
test -f docs/sdd/README.md
test -f docs/sdd/00-processo-sdd-bizy.md
test -f docs/sdd/01-indice-mestre-sdd.md
```

Expected: all commands exit with code 0.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add docs/sdd/README.md docs/sdd/00-processo-sdd-bizy.md docs/sdd/01-indice-mestre-sdd.md
git commit -m "docs: criar base do sdd do bizy"
```

Expected: commit created.

---

### Task 2: Criar templates SDD

**Files:**
- Create: `docs/sdd/templates/spec-template.md`
- Create: `docs/sdd/templates/plan-template.md`
- Create: `docs/sdd/templates/review-template.md`
- Create: `docs/sdd/templates/decision-record-template.md`

- [ ] **Step 1: Criar `spec-template.md`**

Create the template with these exact headings:

```markdown
# Spec - NOME_DA_INICIATIVA

Status: rascunho
Data:
Dominio SDD:
Owner logico:

## 1. Objetivo

## 2. Contexto

## 3. Escopo

## 4. Fora de Escopo

## 5. Atores e Permissoes

## 6. Requisitos Funcionais

## 7. Regras de Negocio

## 8. Requisitos Nao Funcionais

## 9. Dados e Entidades

## 10. APIs, Telas e Integracoes

## 11. UX e Estados

## 12. Riscos e Guardrails

## 13. Testes e Verificacao

## 14. Criterios de Aceite

## 15. Links
```

- [ ] **Step 2: Criar `plan-template.md`**

Create the template with the required Superpowers header:

```markdown
# NOME_DA_INICIATIVA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**

**Architecture:**

**Tech Stack:**

---

## File Structure

### Task 1: NOME_DA_TAREFA

**Files:**
- Create:
- Modify:
- Test:

- [ ] **Step 1: DESCREVER_ACAO_ESPECIFICA**

Run:

```bash
COMANDO_DE_VALIDACAO
```

Expected:
```

- [ ] **Step 3: Criar `review-template.md`**

Create the template:

```markdown
# Review - NOME_DO_ARQUIVO_REVISADO

Status:
Data:
Revisor:
Arquivo revisado:

## 1. Cobertura da Spec

## 2. Clareza e Ambiguidade

## 3. Consistencia com SDD

## 4. Dados, Privacidade e Seguranca

## 5. UX e Operacao

## 6. Testes e Verificacao

## 7. Riscos

## 8. Resultado

- [ ] Aprovado
- [ ] Aprovado com ajustes
- [ ] Bloqueado
```

- [ ] **Step 4: Criar `decision-record-template.md`**

Create:

```markdown
# ADR-XXXX - TITULO_DA_DECISAO

Status:
Data:
Dominio SDD:

## Contexto

## Decisao

## Alternativas Consideradas

## Consequencias

## Links
```

- [ ] **Step 5: Validar templates**

Run:

```bash
ls docs/sdd/templates
rg -n "Dominio SDD|Criterios de Aceite|Consequencias" docs/sdd/templates
```

Expected: four template files listed; `rg` returns matches in the templates.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add docs/sdd/templates
git commit -m "docs: adicionar templates do sdd"
```

Expected: commit created.

---

### Task 3: Criar mapa, roadmap e ADR inicial

**Files:**
- Create: `docs/sdd/02-mapa-dominio-produto.md`
- Create: `docs/sdd/03-roadmap-sdd.md`
- Create: `docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md`

- [ ] **Step 1: Criar mapa de dominio**

Create `docs/sdd/02-mapa-dominio-produto.md` with these sections:

```markdown
# Mapa de Dominio e Produto do Bizy

Status: ativo
Criado em: 2026-06-28

## 1. Eixo Operacional

Cliente -> Produto -> Pedido -> Pagamento -> Entrega -> Conversa -> Tarefa -> Recuperacao -> Relatorio -> Equipa -> Financas -> Auditoria

## 2. Mapa de Dominios

Tabela com colunas: Dominio, Modulos, Entidades Principais, APIs/Telas, Fontes.

## 3. Fronteiras Criticas

- `Negocio` e tenant.
- Pedido e entidade comercial principal.
- Reserva e bloqueio temporario.
- Tracking nao substitui pedido.
- Backend e fonte de verdade.

## 4. Relacao com Codigo

Apontar para manifesto HTTP, schema Prisma e rotas frontend.
```

- [ ] **Step 2: Criar roadmap SDD**

Create `docs/sdd/03-roadmap-sdd.md` with:

```markdown
# Roadmap SDD Bizy

Status: ativo
Criado em: 2026-06-28

## 1. P0

Checkout visual, SEO publico, privacidade/tracking, paginacao, consistencia mobile e estabilidade de loja/Market.

## 2. P1

Cliente 360 polido, pedido na conversa, envio binario, colecoes visuais, templates transacionais, tarefas automaticas, textos operacionais.

## 3. P2

Portal afiliado, conectores sociais oficiais, opt-out granular, multi-moeda, painel personalizavel, logistica avancada, reconciliacao bancaria e e-invoicing.

## 4. Por Dominio

Criar uma tabela com os 15 dominios e os proximos planos sugeridos.
```

- [ ] **Step 3: Criar ADR inicial**

Create `docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md`:

```markdown
# ADR-0001 - SDD como Fonte de Organizacao

Status: aceito
Data: 2026-06-28
Dominio SDD: 00-visao-produto-e-principios

## Contexto

O Bizy cresceu de automacao de live para CRM+, Bizy Market e Bizy Team. A documentacao existente esta distribuida entre wiki, requisitos formais, specs Superpowers, planos e arquivos raiz.

## Decisao

Criar `docs/sdd/` como camada mestre de organizacao por dominio. O SDD nao substitui wiki, specs ou planos; ele conecta esses artefatos e define fronteiras, regras e guardrails.

## Alternativas Consideradas

- Manter apenas wiki: simples, mas menos rastreavel para implementacao.
- Manter apenas specs/plans: bom para tarefas, fraco para visao de dominio.
- Um documento unico: facil de exportar, dificil de manter.

## Consequencias

- Novas iniciativas relevantes devem apontar para dominio SDD.
- Specs e planos ganham rastreabilidade.
- Mudancas estruturais exigem atualizacao do SDD.
- Documentos antigos continuam validos como fonte historica.

## Links

- `../README.md`
- `../../superpowers/specs/2026-06-28-sdd-completo-bizy-design.md`
```

- [ ] **Step 4: Validar mapa, roadmap e ADR**

Run:

```bash
test -f docs/sdd/02-mapa-dominio-produto.md
test -f docs/sdd/03-roadmap-sdd.md
test -f docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md
```

Expected: all commands exit with code 0.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add docs/sdd/02-mapa-dominio-produto.md docs/sdd/03-roadmap-sdd.md docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md
git commit -m "docs: mapear dominios e decisao inicial do sdd"
```

Expected: commit created.

---

### Task 4: Criar dominios 00 a 04

**Files:**
- Create: `docs/sdd/domains/00-visao-produto-e-principios.md`
- Create: `docs/sdd/domains/01-arquitetura-plataforma.md`
- Create: `docs/sdd/domains/02-identidade-acesso-negocios.md`
- Create: `docs/sdd/domains/03-crm-social-commerce.md`
- Create: `docs/sdd/domains/04-live-reservas-pedidos.md`

- [ ] **Step 1: Criar dominio 00**

Use the standard domain model. Content must cover: Bizy como CRM+/Bizy Team, contexto Angola/AOA/WhatsApp, frase norteadora, dores, principios, guardrails e relacao live -> CRM+ -> Market -> Team.

- [ ] **Step 2: Criar dominio 01**

Use the standard domain model. Content must cover: Fastify, Prisma, PostgreSQL, React/Vite, manifesto HTTP, use cases, providers, outbox, n8n como suporte, backend como fonte de verdade.

- [ ] **Step 3: Criar dominio 02**

Use the standard domain model. Content must cover: login telefone/SMS, Google, estudantil, sessoes, onboarding, `Negocio`, `MembroNegocio`, `ModuloNegocio`, RBAC, multi-workspace, isolamento por `negocioId`.

- [ ] **Step 4: Criar dominio 03**

Use the standard domain model. Content must cover: CRM social commerce, Cliente 360, pedidos, conversas, campanhas, social commerce, relatorios, tarefas e recuperacao como nucleo comercial.

- [ ] **Step 5: Criar dominio 04**

Use the standard domain model. Content must cover: live, comentarios, parser, telefone angolano, revisao manual, reservas, fila, expiracao, pagamento, comprovativo, pedido como entidade principal.

- [ ] **Step 6: Validar dominios 00 a 04**

Run:

```bash
for f in docs/sdd/domains/0{0,1,2,3,4}-*.md; do
  rg -q "## 1\\. Proposito" "$f"
  rg -q "## 14\\. Proximos Planos" "$f"
done
```

Expected: command exits with code 0.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add docs/sdd/domains/00-visao-produto-e-principios.md docs/sdd/domains/01-arquitetura-plataforma.md docs/sdd/domains/02-identidade-acesso-negocios.md docs/sdd/domains/03-crm-social-commerce.md docs/sdd/domains/04-live-reservas-pedidos.md
git commit -m "docs: criar dominios base do sdd"
```

Expected: commit created.

---

### Task 5: Criar dominios 05 a 08

**Files:**
- Create: `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
- Create: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- Create: `docs/sdd/domains/07-bizy-market-checkout-repasses.md`
- Create: `docs/sdd/domains/08-afiliados-campanhas-social-inbox.md`

- [ ] **Step 1: Criar dominio 05**

Use the standard domain model. Content must cover: Cliente 360, `ClienteGlobal`, `ClienteNegocio`, conversas, mensagens, SLA, WhatsApp, Evolution, Cloud API, templates, consentimento, opt-out e fallback humano.

- [ ] **Step 2: Criar dominio 06**

Use the standard domain model. Content must cover: `Peca`, variantes, stock, movimentos, loja publica, slug, produto publico, checkout da loja, tracking seguro e configuracao operacional da loja.

- [ ] **Step 3: Criar dominio 07**

Use the standard domain model. Content must cover: Bizy Loja, Bizy Market, categorias globais, similares, checkout unificado, compra multi-loja, pedidos filhos, repasses, reembolsos, denuncias e Admin Bizy.

- [ ] **Step 4: Criar dominio 08**

Use the standard domain model. Content must cover: afiliados, criadores, revendedores, links, mini-lojas, comissoes, lotes, campanhas, templates, Social Inbox, atribuicao e relatorios social-receita.

- [ ] **Step 5: Validar dominios 05 a 08**

Run:

```bash
for f in docs/sdd/domains/0{5,6,7,8}-*.md; do
  rg -q "## 1\\. Proposito" "$f"
  rg -q "## 14\\. Proximos Planos" "$f"
done
```

Expected: command exits with code 0.

- [ ] **Step 6: Commit Task 5**

Run:

```bash
git add docs/sdd/domains/05-clientes-atendimento-whatsapp.md docs/sdd/domains/06-catalogo-stock-loja-publica.md docs/sdd/domains/07-bizy-market-checkout-repasses.md docs/sdd/domains/08-afiliados-campanhas-social-inbox.md
git commit -m "docs: criar dominios comerciais e market do sdd"
```

Expected: commit created.

---

### Task 6: Criar dominios 09 a 11

**Files:**
- Create: `docs/sdd/domains/09-bizy-team-equipa-projectos.md`
- Create: `docs/sdd/domains/10-financas-facturacao-conformidade.md`
- Create: `docs/sdd/domains/11-inteligencia-workflow-automacoes.md`

- [ ] **Step 1: Criar dominio 09**

Use the standard domain model. Content must cover: Bizy Team, convites, magic links, personas, membros, metas, desempenho, turnos, presenca, gamificacao, departamentos, projectos, projectos comerciais, pool de stock e passagem de turno.

- [ ] **Step 2: Criar dominio 10**

Use the standard domain model. Content must cover: ledger financeiro, categorias, movimentos, fluxo de caixa, DRE, despesas, contas a receber/pagar, facturas, recibos, notas de credito, reembolsos, orcamentos, regras fiscais e e-invoicing futuro.

- [ ] **Step 3: Criar dominio 11**

Use the standard domain model. Content must cover: previsao de demanda, churn, LTV, lead scoring, previsao de caixa, anomalias, insights, feedback, workflows, passos, execucoes, notificacoes, automacoes e n8n.

- [ ] **Step 4: Validar dominios 09 a 11**

Run:

```bash
for f in docs/sdd/domains/{09,10,11}-*.md; do
  rg -q "## 1\\. Proposito" "$f"
  rg -q "## 14\\. Proximos Planos" "$f"
done
```

Expected: command exits with code 0.

- [ ] **Step 5: Commit Task 6**

Run:

```bash
git add docs/sdd/domains/09-bizy-team-equipa-projectos.md docs/sdd/domains/10-financas-facturacao-conformidade.md docs/sdd/domains/11-inteligencia-workflow-automacoes.md
git commit -m "docs: criar dominios team financas e inteligencia"
```

Expected: commit created.

---

### Task 7: Criar dominios 12 a 14

**Files:**
- Create: `docs/sdd/domains/12-frontend-ux-design-system.md`
- Create: `docs/sdd/domains/13-operacao-deploy-observabilidade.md`
- Create: `docs/sdd/domains/14-seguranca-privacidade-auditoria.md`

- [ ] **Step 1: Criar dominio 12**

Use the standard domain model. Content must cover: identidade visual v2, `bizy.`, tokens, shell, rotas, mobile-first, loja publica, Market, CRM, design system, componentes e testes frontend.

- [ ] **Step 2: Criar dominio 13**

Use the standard domain model. Content must cover: Docker, scripts, Prisma, migrations, backup/restore, ngrok, VPS, deploy, saude, logs, rate limit, observabilidade e incidentes.

- [ ] **Step 3: Criar dominio 14**

Use the standard domain model. Content must cover: sessoes, cookies, RBAC, permissoes, auditoria, dados pessoais, tracking, consentimento, opt-out, mascaramento, cifra de credenciais e anti-vazamento.

- [ ] **Step 4: Validar dominios 12 a 14**

Run:

```bash
for f in docs/sdd/domains/{12,13,14}-*.md; do
  rg -q "## 1\\. Proposito" "$f"
  rg -q "## 14\\. Proximos Planos" "$f"
done
```

Expected: command exits with code 0.

- [ ] **Step 5: Commit Task 7**

Run:

```bash
git add docs/sdd/domains/12-frontend-ux-design-system.md docs/sdd/domains/13-operacao-deploy-observabilidade.md docs/sdd/domains/14-seguranca-privacidade-auditoria.md
git commit -m "docs: criar dominios frontend operacao e seguranca"
```

Expected: commit created.

---

### Task 8: Integrar SDD com wiki

**Files:**
- Modify: `docs/wiki/index.md`
- Modify: `docs/wiki/log.md`

- [ ] **Step 1: Atualizar indice da wiki**

Add a section named `SDD - Spec-Driven Development` to `docs/wiki/index.md` with links:

```markdown
## SDD - Spec-Driven Development

- [`docs/sdd/README.md`](../sdd/README.md)
- [`docs/sdd/00-processo-sdd-bizy.md`](../sdd/00-processo-sdd-bizy.md)
- [`docs/sdd/01-indice-mestre-sdd.md`](../sdd/01-indice-mestre-sdd.md)
- [`docs/sdd/02-mapa-dominio-produto.md`](../sdd/02-mapa-dominio-produto.md)
- [`docs/sdd/03-roadmap-sdd.md`](../sdd/03-roadmap-sdd.md)
```

- [ ] **Step 2: Atualizar log da wiki**

Add an entry at the top of `docs/wiki/log.md`:

```markdown
## 2026-06-28 - SDD completo do Bizy

- Criada a camada `docs/sdd/` para organizar o Bizy por dominios.
- Criados processo, indice mestre, mapa de dominio, roadmap, templates, ADR inicial e 15 dominios SDD.
- O SDD passa a conectar wiki, requisitos, specs Superpowers, planos e codigo.
```

- [ ] **Step 3: Validar links adicionados**

Run:

```bash
rg -n "SDD - Spec-Driven Development|docs/sdd/README.md" docs/wiki/index.md
rg -n "SDD completo do Bizy" docs/wiki/log.md
```

Expected: both commands return matches.

- [ ] **Step 4: Commit Task 8**

Run:

```bash
git add docs/wiki/index.md docs/wiki/log.md
git commit -m "docs: indexar sdd na wiki"
```

Expected: commit created.

---

### Task 9: Validacao final do pacote SDD

**Files:**
- Verify: `docs/sdd/**/*.md`
- Verify: `docs/wiki/index.md`
- Verify: `docs/wiki/log.md`

- [ ] **Step 1: Conferir quantidade de arquivos**

Run:

```bash
find docs/sdd -type f -name '*.md' | sort | wc -l
```

Expected: `25`.

- [ ] **Step 2: Conferir dominios**

Run:

```bash
find docs/sdd/domains -type f -name '*.md' | sort | wc -l
```

Expected: `15`.

- [ ] **Step 3: Conferir templates**

Run:

```bash
find docs/sdd/templates -type f -name '*.md' | sort | wc -l
```

Expected: `4`.

- [ ] **Step 4: Escanear marcadores incompletos**

Run:

```bash
rg -n -F -e 'T''BD' -e 'TO''DO' -e 'FIX''ME' -e '?''??' -e '<no''me' -e '<ti''tulo' docs/sdd docs/wiki/index.md docs/wiki/log.md
```

Expected: no output.

- [ ] **Step 5: Escanear termos sensiveis**

Run:

```bash
rg -n -i -e 'password=' -e 'token=' -e 'secret=' -e 'api_key=' -e 'apikey=' -e 'senha real' -e 'chave real' docs/sdd
```

Expected: no output.

- [ ] **Step 6: Conferir estrutura dos dominios**

Run:

```bash
for f in docs/sdd/domains/*.md; do
  rg -q "## 1\\. Proposito" "$f"
  rg -q "## 2\\. Escopo" "$f"
  rg -q "## 14\\. Proximos Planos" "$f"
done
```

Expected: command exits with code 0.

- [ ] **Step 7: Verificar git status**

Run:

```bash
git status --short docs/sdd docs/wiki/index.md docs/wiki/log.md
```

Expected: no output after all commits.

- [ ] **Step 8: Relatar resultado**

Summarize:

- number of SDD files;
- commits created;
- validation commands run;
- any non-blocking caveat.
