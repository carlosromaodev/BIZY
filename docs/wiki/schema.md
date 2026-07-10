---
title: Schema da Wiki Bizy
aliases:
  - Regras da Wiki
tags:
  - bizy/wiki
  - bizy/schema
status: ativo
updated: 2026-07-10
---

# Schema da Wiki

## Objetivo

Manter uma camada organizada entre os ficheiros brutos do projeto e as respostas futuras do agente. A wiki deve acumular conhecimento, nao apenas listar ficheiros.

## Ligacoes Essenciais

- O mapa de navegacao fica em [Indice da Wiki](index.md), mas as paginas tambem devem ligar diretamente umas as outras quando houver relacao real.
- A visao canonica fica em [Visao Unificada do Bizy](pages/visao-produto-bizy.md).
- A memoria de produto para outra IA fica em [Memoria de Projeto do Bizy](pages/memoria-projeto-bizy.md).
- O guia de uso da memoria por agentes fica em [Guia para IA no Bizy](pages/guia-para-ia-bizy.md).
- O protocolo obrigatorio de manutencao continua fica em [Protocolo de Atualizacao da Memoria](pages/protocolo-atualizacao-memoria-bizy.md).
- As notas tematicas principais sao [Visao Unificada](pages/visao-produto-bizy.md), [Dores e Qualidades](pages/dores-e-qualidades-bizy.md), [Mapa de Modulos](pages/mapa-de-modulos-bizy.md), [Dominio e Entidades](pages/dominio-e-entidades-bizy.md), [Fluxos Operacionais](pages/fluxos-operacionais-bizy.md), [Arquitetura e Guardrails](pages/arquitetura-e-guardrails-bizy.md) e [Prioridades de Lancamento](pages/prioridades-lancamento-bizy.md).
- A memoria operacional fica em [Memoria Viva do Bizy](pages/memoria-viva-bizy.md).
- O inventario detalhado comeca em [Inventario do Sistema Bizy](pages/inventario-sistema-bizy.md).
- As regras de localizacao de ficheiros ficam em [Organizacao de Arquivos](pages/organizacao-de-arquivos.md).

## Camadas

### Fontes

Fontes sao documentos originais, requisitos, relatorios, planos, specs, workflows, scripts e notas criadas durante o trabalho. Elas devem ser preservadas com o menor numero possivel de alteracoes.

Exemplos atuais:

- Requisitos principais em `docs/RF-RNF-RN-EMEUV1.md`
- Guias operacionais em `docs/deploy.md`, `docs/docker.md`, `docs/staging.md`, `docs/ngrok.md`, `docs/n8n.md`
- Arquitetura em `docs/arquitetura-modular.md`
- Design em `docs/STYLEGUIDE-FRONTEND-EMEU.md` e `docs/ANALISE-DESIGN-FRONTEND-EMEU.md`
- Planos em `docs/superpowers/plans/`
- Specs em `docs/superpowers/specs/`
- Workflows em `n8n/workflows/`

### Wiki

As paginas em `docs/wiki/pages/` sao sinteses mantidas pelo agente. Elas podem combinar varias fontes, apontar contradicoes e indicar decisoes atuais.

### Indice e Log

- `index.md` e o mapa de navegacao por tema.
- `log.md` e cronologico e append-only.

## Convencoes de Paginas

Cada pagina sintetizada deve usar este cabecalho:

```markdown
# Titulo

Status: ativo | rascunho | obsoleto
Ultima atualizacao: AAAA-MM-DD
Fontes principais: `ficheiro.md`, `docs/...`
```

## Regras de Organizacao

1. Nao criar novos `.md` soltos na raiz, exceto quando forem documentacao principal do repositorio.
2. Colocar documentacao nova em `docs/wiki/pages/`, `docs/superpowers/`, ou na pasta especifica do modulo.
3. Manter materiais temporarios em `tmp/`.
4. Manter materiais oficiais/entregaveis em `docs/` ou em storage proprio do sistema.
5. Nao mover ficheiros antigos em massa sem validar referencias.
6. Ao mover um documento, atualizar links e mencionar no `log.md`.
7. Quando uma resposta do agente definir regra de negocio, fluxo operacional ou decisao de arquitetura, registrar a sintese na wiki.
8. Quando qualquer tarefa alterar codigo, produto, operacao, deploy, testes ou comportamento, atualizar a memoria conforme [Protocolo de Atualizacao da Memoria](pages/protocolo-atualizacao-memoria-bizy.md) antes da resposta final.

## Regras Para Codigo

Backend:

- Dominio em `backend/src/dominio/`.
- Use cases em `backend/src/use-case/`.
- HTTP modular em `backend/src/infra/http/modulos/`.
- Repositorios por contrato em `backend/src/dominio/repositorios/contratos.ts`.
- Implementacoes Prisma/memoria em `backend/src/use-case/repositorios/`.

Frontend:

- Paginas grandes em `frontend/src/paginas/`.
- Shell e componentes compartilhados em `frontend/src/componentes/` e `frontend/src/components/`.
- Chamadas API em `frontend/src/api.ts`.
- Tipos em `frontend/src/tipos.ts`.
- Testes em `frontend/testes/`.
- Reaproveitar o design existente antes de criar padrao visual novo.

Documentacao:

- Requisitos duraveis em `docs/RF-RNF-RN-EMEUV1.md` e sinteses em `docs/wiki/pages/`.
- Planos de execucao em `docs/superpowers/plans/`.
- Specs em `docs/superpowers/specs/`.
- Guias operacionais em `docs/`.

## Obsidian

`docs/wiki/` e o cofre oficial do Obsidian para o projeto.

- Guardar fontes importadas em `docs/wiki/raw/`.
- Guardar sinteses em `docs/wiki/pages/`.
- Usar frontmatter com `title`, `aliases`, `tags`, `status` e `updated` em paginas novas.
- Usar `[[wikilinks]]` para notas internas do vault.
- Usar links Markdown apenas para ficheiros fora do vault ou URLs externas.
- Preferir links entre paginas relacionadas, nao apenas links para `index.md`.
- Evitar criar notas soltas na raiz do vault, exceto `README.md`, `schema.md`, `index.md` e `log.md`.
- Nao versionar `workspace.json`, porque e estado local da interface.
