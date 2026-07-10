# ADR-0001 - SDD como Fonte de Organizacao

Status: aceito
Data: 2026-06-28
Dominio SDD: `domains/00-visao-produto-e-principios.md`

## Contexto

O Bizy cresceu de automacao de live para a visao unificada atual: Bizy Team, Bizy Market, Bizy Learning e Anani interno. A documentacao existente esta distribuida entre wiki, requisitos formais, specs Superpowers, planos, arquivos raiz e codigo.

Essa distribuicao guarda bastante conhecimento, mas dificulta responder rapidamente:

- qual dominio uma mudanca afeta;
- que regra nao pode quebrar;
- que entidades pertencem ao fluxo;
- que spec ou plano deve nascer a seguir;
- que documento atualizar depois da implementacao.

## Decisao

Criar `docs/sdd/` como camada mestre de organizacao por dominio.

O SDD nao substitui wiki, specs ou planos. Ele conecta esses artefatos e define fronteiras, regras, guardrails, estado atual e proximos planos por dominio.

## Alternativas Consideradas

- Manter apenas wiki: simples, mas menos rastreavel para implementacao.
- Manter apenas specs/plans: bom para tarefas, fraco para visao de dominio.
- Criar um documento unico: facil de exportar, dificil de manter.
- Criar SDD por dominio: mais organizado e sustentavel para o tamanho atual do Bizy.

## Consequencias

- Novas iniciativas relevantes devem apontar para um dominio SDD.
- Specs e planos ganham rastreabilidade.
- Mudancas estruturais exigem atualizacao do SDD.
- Documentos antigos continuam validos como fonte historica.
- Wiki continua memoria viva; SDD vira organizacao por fronteira.
- Outra IA consegue navegar produto, arquitetura e prioridades com menor risco.

## Links

- `../README.md`
- `../00-processo-sdd-bizy.md`
- `../01-indice-mestre-sdd.md`
- `../../superpowers/specs/2026-06-28-sdd-completo-bizy-design.md`
- `../../superpowers/plans/2026-06-28-sdd-completo-bizy.md`
