# Spec - SEO e Preview Social Publico Bizy

Status: implementado
Data: 2026-07-10
Dominio SDD: `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
Visao canonica: `docs/wiki/pages/visao-produto-bizy.md`
Capacidade da meta global: descoberta
Owner logico: Produto Vitrine

## 1. Objetivo

Fechar a lacuna P0 de SEO e preview social das superficies publicas do Bizy sem adicionar biblioteca nova.

A iniciativa reforca a descoberta do loop comercial: compradores e alunos precisam abrir links publicos com titulo, descricao, canonical e preview coerentes para Market, lojas, catalogos e Learning.

## 2. Contexto

O backend publico ja devolve metadados SEO em rotas de loja, produto, catalogo e Market. O frontend aplicava parte desses dados, mas ainda havia paginas sem canonical, sem preview social completo ou com `document.title` manual.

## 3. Escopo

- Meta padrao no `frontend/index.html`.
- Helper unico para montar e aplicar SEO publico runtime na SPA.
- Canonical, Open Graph e Twitter Card para Market home, categorias, diretorio de lojas, loja Market, produto Market e catalogo publico.
- SEO da loja publica com fallback quando a API nao enviar SEO.
- SEO de produto da loja publica quando o detalhe/rota direta abre produto.
- SEO da home, perfil e produto do Bizy Learning.

## 4. Fora de Escopo

- SSR, prerender ou geracao estatica por rota.
- Sitemap, robots.txt dinamico e schema.org.
- Mudancas em ranking, analytics pago ou provider externo.

## 5. Atores e Permissoes

- Comprador/visitante: ve preview publico ao abrir links.
- Dono/gestor: beneficia de paginas publicas mais descobríveis.
- Sistema: aplica metadados sem exigir autenticacao nem cookies nao essenciais.

## 6. Requisitos Funcionais

- Cada rota publica principal deve definir `title`, `description`, canonical, `og:*` e `twitter:*`.
- Produto publico deve usar `og:type`/Twitter com imagem quando houver foto.
- Learning publico deve deixar de usar apenas `document.title`.
- Cleanup de SEO deve restaurar metadados anteriores quando o componente desmontar.

## 7. Regras de Negocio

- Nao inventar prova social, vendas, ratings ou reviews.
- Nao expor telefone, email, endereco ou dados de checkout em metadados.
- Se a API enviar SEO, ele e a fonte preferencial; o frontend usa fallback deterministico apenas quando faltar.

## 8. Requisitos Nao Funcionais

- Sem biblioteca nova.
- Execucao segura em SPA/Vite.
- Metadados devem aceitar URL relativa e normalizar para URL absoluta em runtime.

## 9. Dados e Entidades

Nao ha migracao. Entidades afetadas indiretamente: loja publica, produto, catalogo, Market e produto Learning.

## 10. APIs, Telas e Integracoes

APIs consumidas: `/publico/market/*`, `/publico/lojas/*`, `/publico/learning/*`.

Telas: Market, Diretorio Market, Produto Market, Loja Market, Loja Publica, Catalogo Publico, Learning, Perfil Learning e Produto Learning.

## 11. UX e Estados

SEO e invisivel na UI, mas deve acompanhar estados carregados. Em erro, a pagina mantem comportamento visual atual.

## 12. Riscos e Guardrails

- Redes sociais que nao executam JavaScript podem ver apenas o HTML padrao da SPA. Mitigacao: meta padrao no `index.html`; prerender/SSR fica fora deste recorte.
- Imagens relativas podem falhar em crawlers sem runtime. Mitigacao: helper normaliza para URL absoluta no browser.

## 13. Testes e Verificacao

- `cd frontend && npx vitest run testes/seo-publico-canonical.test.ts`
- `npm run typecheck --workspace frontend`
- `git diff --check`

## 14. Criterios de Aceite

- [x] Helper central de SEO publico existe.
- [x] Public pages usam canonical, Open Graph e Twitter Card.
- [x] Learning publico usa helper em vez de apenas `document.title`.
- [x] MDs SDD marcam o P0 como concluido.
- [x] Validacao automatizada executada nesta entrega.

## 15. Links

- `docs/sdd/domains/06-catalogo-stock-loja-publica.md`
- `docs/sdd/03-roadmap-sdd.md`
- `docs/wiki/pages/prioridades-lancamento-bizy.md`
- `docs/superpowers/plans/2026-07-10-seo-preview-publico-bizy.md`
