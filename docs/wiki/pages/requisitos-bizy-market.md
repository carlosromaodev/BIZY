---
title: Requisitos do Bizy Market e Lojas Digitais
aliases:
  - RF Bizy Market
  - Requisitos Market
  - Bizy Market Requisitos
tags:
  - bizy/requisitos
  - bizy/market
status: ativo
updated: 2026-06-17
---

# Requisitos do Bizy Market e Lojas Digitais

> [!info] Fonte principal
> Sintese a partir de `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md` v0.1 (rascunho estrategico).
> Para requisitos do CRM base, ver [[requisitos-funcionais-bizy]], [[requisitos-nao-funcionais-bizy]] e [[regras-de-negocio-bizy]].

## Visao de Produto

O **Bizy Market** combina perfis de loja independentes, shopping center de descoberta, checkout centralizado, CRM operacional e tracking unificado. Cada negocio mantem loja autonoma (`slug.bizy.space`) e pode participar num shopping center central (`market.usebizy.space`).

> Bizy transforma cada negocio numa loja digital propria e conecta todas essas lojas num shopping center inteligente.

## Modulos

| Modulo | Descricao |
|---|---|
| **Bizy Loja** | Perfil publico autonomo: subdominio, capa, avatar, colecoes, seguidores, selos, contacto |
| **Bizy Market** | Shopping center: busca global, categorias, similares, lojas em destaque, ranking |
| **Bizy Checkout** | Checkout unificado: carrinho, entrega, pagamento, comprovativo, pedidos por fornecedor |
| **Bizy Studio** | Central de configuracao da loja no CRM: perfil, colecoes, destaques, banners, politicas |
| **Operacao CRM** | Controlo diario: pedidos, pagamentos, entregas, clientes, conversas, tarefas, relatorios |

## Atores

- **Visitante**: explora perfis e Market sem autenticacao
- **Comprador**: inicia checkout, segue lojas, compra produtos
- **Dono da loja**: configura perfil, produtos, operacao, equipa
- **Vendedor/atendente**: responde clientes, confirma pagamentos, prepara pedidos
- **Administrador Bizy**: governa categorias globais, politicas, denuncias, lojas destacadas
- **Sistema Bizy**: aplica regras, cria pedidos, calcula stock, regista tracking

---

## Requisitos Funcionais (RF-001 a RF-114)

### 5.1 Identidade e Estrutura (RF-001 a RF-007)

Modulo/servico Bizy Market, loja digital individual, subdominio unico por slug, slugs reservados, loja activa sem Market, criterios de publicacao, configuracao dentro do CRM.

- RF-001 a RF-007: todos `[x]`.

### 5.2 Perfil Publico da Loja (RF-008 a RF-016)

Capa/hero, avatar, nome, descricao, localizacao, contadores sociais, selos de confianca, seguir, colecoes clicaveis, mobile-first, explorar Market, identidade do fornecedor.

- RF-008, RF-010, RF-012 a RF-016: `[x]`.
- RF-009 (contadores sociais), RF-011 (seguir loja): `[ ]`.

### 5.3 Personalizacao da Loja (RF-017 a RF-023)

Editar capa/avatar/descricao/cor, colecoes, produtos destacados, visibilidade Market, mensagens por colecao, guardrails de design.

- RF-017 a RF-023: todos `[x]`.

### 5.4 Catalogos, Colecoes e Produtos (RF-024 a RF-032)

Categorias globais vs colecoes locais, colecoes manuais e automaticas, ordenacao, destaques visuais, bloqueio de publicacao sem dados completos.

- RF-024 a RF-029, RF-031: `[x]`.
- RF-030 (produtos digitais/servicos), RF-032 (historico de alteracoes): `[ ]`.

### 5.5 Bizy Market - Shopping Center (RF-033 a RF-042)

Home de descoberta, busca global, categorias, similares, loja fornecedora no card, produtos patrocinados, ranking.

- RF-033 a RF-039, RF-042: `[x]`.
- RF-040 (lojas destacadas/patrocinados), RF-041 (ranking completo): `[ ]`.

### 5.6 Produto Publico e Similares (RF-043 a RF-048)

Fotos, preco, loja, variantes, contexto comercial, mais da mesma loja, similares de outras lojas.

- RF-043 a RF-048: todos `[x]`.

### 5.7 Checkout Unificado (RF-049 a RF-062)

Checkout unificado, carrinho multi-origem, loja por item, pedido por fornecedor, pagamento, consentimento, comprovativo.

- RF-049 a RF-052, RF-056 a RF-061: `[x]`.
- RF-053 (compra multi-loja), RF-054 (experiencia unica multi-fornecedor), RF-055 (entrega por loja), RF-062 (acompanhamento pelo comprador): `[ ]`.

### 5.8 Pedidos, Pagamentos e Repasses (RF-063 a RF-072)

Pedidos no CRM, origem do pedido, comprovativo, estado por fornecedor, repasse financeiro, cancelamento parcial, reembolso.

- RF-063 a RF-072: todos `[ ]` — planeados para fases futuras.

### 5.9 Central de Controlo no CRM (RF-073 a RF-081)

Configuracao dentro do CRM, Bizy Studio, metricas, publicar/despublicar em massa, tarefas automaticas.

- RF-073, RF-074, RF-077: `[x]`.
- RF-075 a RF-076, RF-078 a RF-081: `[ ]`.

### 5.10 Seguidores e Social Graph (RF-082 a RF-087)

Seguir lojas, contadores, listas, alimentar campanhas/recomendacoes.

- RF-082 a RF-087: todos `[ ]` — planeados.

### 5.11 Recomendacoes e Descoberta (RF-088 a RF-092)

Produtos similares, lojas relacionadas, blocos de recomendacao, guardrails, eventos de medicao.

- RF-088 a RF-092: todos `[ ]` — planeados.

### 5.12 SEO, Links e Presenca Publica (RF-093 a RF-097)

URL canonica, metadata SEO, preview social por canal, protecao de paginas privadas.

- RF-093 a RF-095: `[x]`.
- RF-096, RF-097: `[ ]`.

### 5.13 Administracao e Governanca (RF-098 a RF-104)

Categorias globais, politicas de publicacao, suspensao, destaque/patrocinio, relatorios admin, denuncias, auditoria.

- RF-098 a RF-104: todos `[ ]` — planeados.

### 5.14 Notificacoes e Comunicacao (RF-105 a RF-108)

Confirmacao de compra, notificacao no CRM, tarefas humanas, politica WhatsApp.

- RF-105 a RF-108: todos `[ ]` — planeados.

### 5.15 Relatorios (RF-109 a RF-114)

Relatorios loja vs Market, origem de vendas, ranking de produtos, funil do comprador, desempenho Market, exportacao auditada.

- RF-109 a RF-114: todos `[ ]` — planeados.

---

## Requisitos Nao Funcionais (RNF-001 a RNF-025)

| ID | Resumo | Estado |
|---|---|---|
| RNF-001 | Mobile-first em 375/390/768/1024/1440px | `[ ]` |
| RNF-002 | Perfil e Market rapidos, imagens otimizadas, paginacao | `[ ]` |
| RNF-003 | Busca do Market responsiva com muitos produtos | `[ ]` |
| RNF-004 | Multi-negocio sem misturar dados | `[ ]` |
| RNF-005 | Isolamento por `negocioId` (exceto entidades globais) | `[ ]` |
| RNF-006 | Dados pessoais nao vazam em URL, tracking, logs, previews | `[x]` |
| RNF-007 | Checkout idempotente (sem pedidos duplicados) | `[ ]` |
| RNF-008 | Eventos de tracking idempotentes | `[ ]` |
| RNF-009 | Auditoria para acoes sensiveis | `[ ]` |
| RNF-010 | Observabilidade minima (erros, latencia, compras, falhas) | `[ ]` |
| RNF-011 | WCAG 2.2 AA (contraste, foco, teclado, leitores de tela) | `[ ]` |
| RNF-012 | Animacoes respeitam `prefers-reduced-motion` | `[ ]` |
| RNF-013 | Personalizacoes sem JS/HTML/CSS inseguros | `[ ]` |
| RNF-014 | Imagens com limites de tamanho e tipos permitidos | `[ ]` |
| RNF-015 | Market degrada com seguranca para lojas offline/despublicadas | `[ ]` |
| RNF-016 | Checkout orienta comprador sem pagamento online | `[ ]` |
| RNF-017 | Sem telas decorativas no CRM | `[ ]` |
| RNF-018 | Testes de contrato e regras antes de considerar pronto | `[ ]` |
| RNF-019 | Evolucao para providers de pagamento/entrega/notificacao | `[ ]` |
| RNF-020 | Compatibilidade com loja publica atual durante migracao | `[x]` |
| RNF-021 | Protecao contra scraping, spam de checkout, abuso de busca | `[ ]` |
| RNF-022 | Cache seguro para catalogo, sem cachear dados de checkout | `[x]` |
| RNF-023 | Relatorios consistentes com pedidos/pagamentos confirmados | `[ ]` |
| RNF-024 | Operacao em AOA/Kwanza e formatos locais | `[ ]` |
| RNF-025 | Linguagem curta, humana, orientada a acao | `[ ]` |

---

## Regras de Negocio (RN-001 a RN-067)

### 7.1 Autonomia da Loja (RN-001 a RN-005)

- **RN-001–RN-002**: Autonomia visual com limites do design system. `[ ]`
- **RN-003**: Perfil publico activo sem Market. `[x]`
- **RN-004**: Market exige criterios minimos. `[x]`
- **RN-005**: Identidade do fornecedor preservada no Market. `[x]`

### 7.2 Publicacao no Market (RN-006 a RN-012)

- **RN-006**: Produto no Market exige loja activa, imagem, preco, categoria, disponibilidade. `[x]`
- **RN-007**: Rascunho/oculto/esgotado/suspenso nao aparece no Market. `[ ]`
- **RN-008**: Produto no perfil da loja sem aparecer no Market. `[x]`
- **RN-009**: Categoria global (Bizy) vs colecao local (loja). `[x]`
- **RN-010–RN-012**: Suspensao, patrocinio identificado, patrocinio nao contorna bloqueios. `[ ]`

### 7.3 Descoberta e Similares (RN-013 a RN-017)

- **RN-013**: Similares na area de descoberta do Market. `[x]`
- **RN-014–RN-017**: Nao confundir comprador, priorizar disponiveis/confiaveis, ranking equilibrado, penalizar falhas. `[ ]`

### 7.4 Checkout Unificado (RN-018 a RN-029)

Regras de carrinho, pedido por fornecedor, compra coerente, entrega separada, stock, reserva, comprovativo.

- RN-018 a RN-029: todos `[ ]` — planeados.

### 7.5 Pagamentos, Taxas e Repasses (RN-030 a RN-035)

Conciliacao, repasse, taxas, reembolso parcial, trilha auditavel.

- RN-030 a RN-035: todos `[ ]` — planeados.

### 7.6 CRM como Fonte de Verdade (RN-036 a RN-041)

- **RN-039**: Market gera descoberta; CRM controla execucao. `[x]`
- **RN-041**: Configuracao publica validada no backend. `[x]`
- RN-036 a RN-038, RN-040: `[ ]`.

### 7.7 Seguidores, Leads e Consentimento (RN-042 a RN-047)

Consentimento de marketing explicito, privacidade de seguidores, unfollow.

- RN-042 a RN-047: todos `[ ]` — planeados.

### 7.8 Privacidade e Dados (RN-048 a RN-052)

Dados privados nao expostos entre lojas, minimizacao, auditoria.

- RN-048 a RN-052: todos `[ ]` — planeados.

### 7.9 Moderacao e Confianca (RN-053 a RN-057)

Verificacao, denuncias, suspensao, produtos proibidos, selos reais.

- RN-053 a RN-057: todos `[ ]` — planeados.

### 7.10 Planos e Monetizacao (RN-058 a RN-062)

Market como modulo separado, limites por plano, comissao/mensalidade, transparencia.

- RN-058 a RN-062: todos `[ ]` — planeados.

### 7.11 Migracao da Loja Atual (RN-063 a RN-067)

- **RN-063**: Loja actual evolui sem quebrar links. `[x]`
- **RN-064**: Checkout migrado progressivamente. `[x]`
- RN-065 a RN-067: `[ ]` — preservar dados, Bizy Studio, Market como camada adicional.

---

## Fases de Implementacao

| Fase | Foco | Estado |
|---|---|---|
| **Fase 1** | Perfil de loja evoluido, hero, avatar, colecoes, subdominios, SEO | Em progresso |
| **Fase 2** | Bizy Market MVP: descoberta, busca, categorias, similares | Em progresso |
| **Fase 3** | Checkout unificado: carrinho, compra, pedidos por fornecedor, acompanhamento | Planeado |
| **Fase 4** | Operacao financeira: conciliacao, taxas, comissoes, repasses, reembolsos | Planeado |
| **Fase 5** | Social graph, recomendacoes avancadas, patrocinados, campanhas Market | Planeado |

### Sequencia Tecnica (Backend + Frontend)

**Primeira sequencia backend** — todos `[x]`:
- `GET /publico/lojas/:slug` — perfil publico
- `GET /publico/market/produtos` — produtos elegiveis
- `GET /publico/market/categorias` — categorias globais
- `GET /publico/market/produtos/:codigo` — detalhe publico
- `GET /publico/market/produtos/:codigo/similares` — alternativas
- `GET /crm/loja/market/resumo` — estado de publicacao no CRM
- `PUT /crm/loja/produtos/:codigo/publicacao` — publicar/despublicar
- `PUT /crm/loja/produtos/publicacao-em-massa` — publicacao em massa

**Primeira sequencia frontend** — todos `[x]`:
- Base tecnica `frontend/src/lojas`
- Teste de contrato `frontend/testes/lojas-api.test.ts`
- `/market` — home de descoberta
- `/market/categorias/:categoria` — navegacao por categoria
- `market.usebizy.space` — dominio proprio do Market
- `/lojas/:slug` — perfil publico mobile-first
- `/lojas/:slug/produtos/:codigo` — detalhe de produto
- `/checkout` — entrada do checkout unificado
- `/app/loja` — controlo no CRM

**Planeado:**
- Checkout completo com carrinho, entrega, pagamento e acompanhamento
- Pedidos filhos por fornecedor
- Seguidores, ranking avancado, tracking de recomendacao
- Admin Bizy (categorias, suspensoes, denuncias, relatorios, repasses)

---

## Guardrails de Produto

- Nao transformar o Market num catalogo anonimo que apaga a marca das lojas
- Nao criar checkout que gere pedidos impossiveis de operar no CRM
- Nao mostrar similares de forma agressiva dentro do perfil de uma loja
- Nao expor dados privados de CRM para descoberta publica
- Nao permitir personalizacao que destrua contraste ou experiencia mobile
- Nao criar automacao financeira sem auditoria e fallback humano

---

## Ligacoes

- [[requisitos-funcionais-bizy]] — RFs do CRM base
- [[requisitos-nao-funcionais-bizy]] — RNFs do CRM base
- [[regras-de-negocio-bizy]] — RNs do CRM base
- [[bizy-market-lojas-digitais]] — Estrategia Market e Lojas
- [[bizy-market-rotas-roadmap]] — Rotas e Roadmap tecnico
- [[bizy-market-frontend-lojas]] — Frontend das Lojas e Market
- [[loja-digital-operacao-crm]] — Loja Digital com Operacao CRM
- `docs/RF-RNF-RN-BIZY-MARKET-LOJA-DIGITAL.md` — Documento fonte completo
