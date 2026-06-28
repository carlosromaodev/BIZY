# SDD Completo do Bizy - Design

Status: aprovado para criar pacote SDD
Data: 2026-06-28
Escopo: camada oficial de Spec-Driven Development para organizar o Bizy inteiro

## Fontes

- `BIZY-FONTE-CHATGPT.md`
- `docs/wiki/pages/memoria-projeto-bizy.md`
- `docs/wiki/pages/visao-produto-bizy.md`
- `docs/wiki/pages/mapa-de-modulos-bizy.md`
- `docs/wiki/pages/dominio-e-entidades-bizy.md`
- `docs/wiki/pages/fluxos-operacionais-bizy.md`
- `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`
- `docs/wiki/pages/bizy-market-lojas-digitais.md`
- `docs/wiki/pages/requisitos-bizy-market.md`
- `docs/wiki/pages/requisitos-funcionais-bizy.md`
- `docs/wiki/pages/requisitos-nao-funcionais-bizy.md`
- `docs/wiki/pages/regras-de-negocio-bizy.md`
- `docs/wiki/pages/identidade-visual-bizy-v2.md`
- `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
- `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/rotasApp.tsx`

## Objetivo

Criar uma camada SDD permanente em `docs/sdd/` para organizar o Bizy inteiro por dominio. Essa camada deve servir como ponte entre visao de produto, requisitos, wiki, specs de iniciativa, planos de execucao e codigo.

O SDD completo deve evitar que o Bizy fique dependente de documentos soltos ou conversas antigas. Ele deve tornar claro:

- o que cada dominio resolve;
- quais entidades e fluxos pertencem a cada dominio;
- quais regras e guardrails nao podem ser quebrados;
- onde ficam specs e planos de novas iniciativas;
- como atualizar a memoria quando uma implementacao muda o produto;
- como outra IA deve navegar o projeto sem reler tudo do zero.

## Decisao de Abordagem

Foi escolhida a abordagem completa de uma vez: criar o pacote SDD mestre cobrindo todos os dominios relevantes do Bizy.

Para manter o pacote sustentavel, a entrega nao deve ser um arquivo unico gigante. O SDD deve ser dividido em documentos por dominio, com um indice mestre e templates reutilizaveis.

## Estrutura de Arquivos

Criar:

```text
docs/sdd/
  README.md
  00-processo-sdd-bizy.md
  01-indice-mestre-sdd.md
  02-mapa-dominio-produto.md
  03-roadmap-sdd.md
  templates/
    spec-template.md
    plan-template.md
    review-template.md
    decision-record-template.md
  domains/
    00-visao-produto-e-principios.md
    01-arquitetura-plataforma.md
    02-identidade-acesso-negocios.md
    03-crm-social-commerce.md
    04-live-reservas-pedidos.md
    05-clientes-atendimento-whatsapp.md
    06-catalogo-stock-loja-publica.md
    07-bizy-market-checkout-repasses.md
    08-afiliados-campanhas-social-inbox.md
    09-bizy-team-equipa-projectos.md
    10-financas-facturacao-conformidade.md
    11-inteligencia-workflow-automacoes.md
    12-frontend-ux-design-system.md
    13-operacao-deploy-observabilidade.md
    14-seguranca-privacidade-auditoria.md
  decisions/
    ADR-0001-sdd-como-fonte-de-organizacao.md
```

## Papel das Pastas Existentes

`docs/superpowers/specs/` continua sendo a pasta de specs de iniciativas especificas. Exemplos: uma nova feature, uma refatoracao de seguranca ou uma frente de frontend.

`docs/superpowers/plans/` continua sendo a pasta de planos executaveis por checklist, ligados a uma spec especifica.

`docs/wiki/pages/` continua sendo memoria viva e inventario navegavel do projeto.

`docs/sdd/` passa a ser a camada mestre de organizacao por dominio, conectando todos esses documentos.

## Fluxo Oficial SDD

O fluxo padrao do Bizy passa a ser:

```text
Visao/Wiki -> SDD por dominio -> Spec de iniciativa -> Plano -> Implementacao -> Testes -> Atualizacao Wiki/SDD
```

Regras:

- Toda iniciativa relevante deve nascer ou se ligar a um dominio SDD.
- Toda spec de iniciativa deve apontar para seu dominio SDD.
- Todo plano deve apontar para sua spec base.
- Toda mudanca duravel de produto deve atualizar wiki e, quando alterar fronteiras/regras, atualizar o SDD.
- Mudancas pequenas podem atualizar apenas wiki, desde que nao alterem contrato de dominio.

## Modelo dos Documentos de Dominio

Cada arquivo em `docs/sdd/domains/` deve seguir este formato:

```md
# SDD Dominio NN - Nome

Status:
Owner logico:
Fontes:
Ultima atualizacao:

## 1. Proposito
O que este dominio resolve no Bizy.

## 2. Escopo
O que entra e o que fica fora.

## 3. Atores e Permissoes
Quem usa, quem administra, quem so consulta.

## 4. Entidades e Dados
Modelos Prisma, objetos de dominio, dados sensiveis e fronteiras por `negocioId`.

## 5. Fluxos Principais
Jornadas operacionais em texto ou diagramas simples.

## 6. Requisitos Funcionais
Capacidades esperadas, agrupadas por subarea.

## 7. Regras de Negocio
Regras que nao podem ser quebradas.

## 8. Requisitos Nao Funcionais
Performance, seguranca, auditoria, responsividade e resiliencia.

## 9. APIs, Telas e Integracoes
Endpoints, paginas frontend, providers e jobs envolvidos.

## 10. Guardrails
O que a IA/dev nao deve fazer neste dominio.

## 11. Estado Atual
O que ja existe no codigo/documentacao.

## 12. Lacunas
O que falta, separado por P0/P1/P2 quando fizer sentido.

## 13. Testes e Verificacao
Testes existentes e minimos exigidos para mudancas futuras.

## 14. Proximos Planos
Specs/planos derivados que devem nascer deste dominio.
```

## Conteudo dos Dominios

### 00 - Visao Produto e Principios

Consolida identidade, tese do produto, publico, contexto angolano, diferenca entre MVP de live, CRM+, Bizy Market e Bizy Team, alem dos principios de decisao.

### 01 - Arquitetura Plataforma

Define stack, monorepo, backend Fastify/Prisma, frontend React/Vite, composicao por modulos HTTP, use cases, contratos, providers, outbox e regra de fonte de verdade.

### 02 - Identidade, Acesso e Negocios

Cobre autenticacao, sessoes, onboarding, negocios, membros, papeis, permissoes, modulos por negocio, relacoes entre negocios e isolamento multi-tenant.

### 03 - CRM Social Commerce

Cobre o nucleo comercial do CRM+: clientes, pedidos, conversas, campanhas, social commerce e relatorios comerciais como visao operacional.

### 04 - Live, Reservas e Pedidos

Cobre live, comentarios, parser, revisao manual, reservas, fila, pagamento, comprovativo, recibo e conversao para pedido.

### 05 - Clientes, Atendimento e WhatsApp

Cobre Cliente 360, conversas, mensagens, notas, SLA, WhatsApp, Evolution, Cloud API, politica de templates, consentimento e fallback humano.

### 06 - Catalogo, Stock e Loja Publica

Cobre produtos, variantes, movimentos de stock, vitrine publica, loja por slug, checkout da loja, tracking e configuracao operacional da loja.

### 07 - Bizy Market, Checkout e Repasses

Cobre perfis publicos de loja, shopping center central, categorias globais, similares, checkout unificado, compra multi-loja, pedidos filhos, repasses, reembolsos e governanca do Market.

### 08 - Afiliados, Campanhas e Social Inbox

Cobre parceiros, links, mini-lojas, comissoes, lotes, campanhas segmentadas, templates, Social Inbox, atribuicao e relatorios social-receita.

### 09 - Bizy Team, Equipa e Projectos

Cobre convites, personas, membros, desempenho, turnos, metas, gamificacao, notas internas, feed, departamentos, projectos, projectos comerciais, pool de stock e passagem de turno.

### 10 - Financas, Facturacao e Conformidade

Cobre categorias financeiras, ledger, fluxo de caixa, DRE, despesas, contas a receber/pagar, facturas, recibos, notas de credito, reembolsos, orcamentos, regras fiscais e e-invoicing futuro.

### 11 - Inteligencia, Workflow e Automacoes

Cobre previsao de demanda, churn, LTV, lead scoring, previsao de caixa, anomalias, insights, feedback, fluxos automaticos, passos, execucoes, notificacoes e n8n.

### 12 - Frontend, UX e Design System

Cobre identidade visual v2, rotas, shell, responsividade, mobile-first, componentes, paginas publicas, paginas CRM, design system e testes visuais.

### 13 - Operacao, Deploy e Observabilidade

Cobre Docker, scripts, banco, migrations, backup/restore, ngrok, VPS, deploy, logs, saude, rate limit, observabilidade e incidentes operacionais.

### 14 - Seguranca, Privacidade e Auditoria

Cobre sessoes, cookies, RBAC, permissao por dominio, auditoria critica, dados pessoais, mascaramento, consentimento, opt-out, tracking seguro, cifra de credenciais e guardrails anti-vazamento.

## Templates

### `spec-template.md`

Template para especificacao de iniciativa. Deve incluir objetivo, dominio SDD relacionado, contexto, escopo, fora de escopo, requisitos, desenho tecnico, UX quando aplicavel, dados, APIs, riscos, testes e criterios de aceite.

### `plan-template.md`

Template para plano executavel. Deve incluir spec base, checklist por fase, arquivos esperados, testes por etapa, criterios de aceite e regra de atualizacao de memoria.

### `review-template.md`

Template para revisar spec/plano antes de implementar. Deve verificar clareza, contradicoes, lacunas, seguranca, dados, UX, testes e rastreabilidade.

### `decision-record-template.md`

Template de ADR curto para decisoes estruturais. Deve incluir contexto, decisao, alternativas consideradas, consequencias e links.

## ADR Inicial

Criar `docs/sdd/decisions/ADR-0001-sdd-como-fonte-de-organizacao.md`.

Decisao: SDD passa a ser a camada mestre de organizacao do Bizy por dominio, sem substituir a wiki nem os planos Superpowers.

Consequencias:

- novas iniciativas devem apontar para um dominio;
- specs e planos ficam rastreaveis;
- outra IA consegue navegar produto, arquitetura e prioridades com menos risco;
- documentos antigos permanecem, mas novos conhecimentos estruturais devem entrar no SDD e na wiki.

## Criterios de Aceite

- `docs/sdd/README.md` explica o que e o SDD e como usar.
- `00-processo-sdd-bizy.md` define lifecycle, regras e quando atualizar SDD/wiki.
- `01-indice-mestre-sdd.md` lista todos os dominios, templates e decisoes.
- `02-mapa-dominio-produto.md` conecta modulos, entidades, rotas e dominios.
- `03-roadmap-sdd.md` organiza lacunas e proximos planos por dominio.
- Todos os 15 dominios planejados existem em `docs/sdd/domains/`.
- Todos os templates existem em `docs/sdd/templates/`.
- ADR inicial existe em `docs/sdd/decisions/`.
- Nenhum arquivo contem segredos ou dados reais de clientes.
- Os arquivos mantem linguagem clara, operacional e alinhada ao Bizy.
- O pacote referencia fontes existentes em vez de copiar documentos inteiros sem necessidade.

## Riscos e Mitigacoes

### Risco: documentacao duplicada e divergente

Mitigacao: o SDD deve consolidar decisao e fronteira de dominio, nao copiar todos os detalhes dos documentos fonte. Quando o detalhe ja existe na wiki ou requisito formal, o SDD deve apontar para a fonte.

### Risco: pacote grande demais para manter

Mitigacao: cada dominio deve ser organizado e direto. Lacunas devem apontar para specs/planos derivados, nao tentar resolver tudo no proprio SDD.

### Risco: SDD virar burocracia

Mitigacao: o processo deve ser pratico. Mudancas pequenas podem atualizar wiki; SDD muda quando a fronteira, regra, fluxo ou arquitetura do dominio mudar.

### Risco: conflito entre Bizy CRM+, Bizy Market e Bizy Team

Mitigacao: o dominio 00 deve explicar claramente a evolucao: live -> CRM+ -> Market -> Bizy Team. Dominios devem usar essa narrativa como norte.

## Fora do Escopo Desta Spec

- Implementar codigo de produto.
- Alterar banco de dados.
- Alterar rotas frontend/backend.
- Reescrever documentos antigos.
- Criar planos de implementacao de features especificas.
- Fazer deploy.

## Proximo Passo

Apos aprovacao desta spec, criar um plano executavel para gerar o pacote SDD completo. O plano deve usar checklist por arquivo e validar consistencia, links, ausencia de placeholders e alinhamento com a wiki.
