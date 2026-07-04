# Organizacao por Projectos Bizy

Status: activo
Criado em: 2026-07-03

## Decisao

Novos dominios grandes do Bizy devem ser organizados por projecto/produto, nao apenas por camada tecnica global.

O padrao alvo e:

```text
backend/src/projetos/<projecto>/
  aplicacao/        regras, casos de uso e orquestracao do projecto
  dominio/          tipos, politicas e validadores especificos do projecto
  infra/http/       modulo HTTP, schemas de entrada e adaptadores de rota
  infra/persistencia/ quando houver repositorios dedicados
  index.ts          fachada publica do projecto

frontend/src/projetos/<projecto>/
  api.ts            cliente HTTP e contratos da UI
  componentes/      componentes especificos do projecto
  paginas/          paginas publicas e Team do projecto
  index.ts          fachada publica do projecto
```

## Por que isto e necessario

O codigo cresceu em tres eixos ao mesmo tempo:

- produto: Team, Market, Learning, Financas, Atendimento, Projectos;
- camada tecnica: HTTP, use cases, repositorios, paginas;
- experiencia publica e backoffice no mesmo frontend.

Manter tudo apenas em `backend/src/use-case`, `backend/src/infra/http/modulos` e `frontend/src/paginas` transforma cada novo produto num ficheiro grande e dificil de testar. O resultado ja aparece em ficheiros acima de 2 mil linhas e paginas acima de 4 mil linhas.

## Regra pratica

- Produto novo ou dominio grande entra em `src/projetos/<projecto>`.
- Caminhos antigos podem existir como fachada temporaria para nao quebrar imports.
- Rotas e composicao principal devem importar pelo projecto novo.
- Shared real continua em `dominio`, `infra`, `componentes`, `components/ui`, `lojas` ou `utilidades`.
- Nao duplicar regra de negocio no frontend; UI chama API do projecto.

## Projectos migrados

`learning` passa a existir como projecto:

- backend: `backend/src/projetos/learning`
- frontend: `frontend/src/projetos/learning`

Os ficheiros antigos `backend/src/use-case/BizyLearningUseCase.ts`, `backend/src/infra/http/modulos/learning.ts`, `frontend/src/learning.ts` e `frontend/src/paginas/Learning.tsx` ficam como fachadas de compatibilidade.

`market` passa a existir como projecto:

- backend: `backend/src/projetos/market`
- frontend: `frontend/src/projetos/market`

Os ficheiros antigos em `backend/src/use-case`, `backend/src/infra/http/modulos`, `frontend/src/lojas`, `frontend/src/marketDominio.ts`, `frontend/src/lojaSubdominio.ts` e `frontend/src/paginas` ficam como fachadas de compatibilidade.

`team` passa a existir como projecto para equipa e projectos:

- backend: `backend/src/projetos/team`
- frontend: `frontend/src/projetos/team`

Os ficheiros antigos de `GestaoEquipaUseCase`, `GestaoProjectosUseCase`, modulos `equipa/projectos` e paginas `Equipa/Projectos` ficam como fachadas de compatibilidade.

## Proxima sequencia recomendada

1. Separar internamente `learning/aplicacao/BizyLearningUseCase.ts` em tipos, seeds, regras de oferta, checkout, entitlement e certificado.
2. Separar internamente `market`: Studio, loja publica, descoberta, checkout, acompanhamento, repasses e helpers de URL.
3. Separar internamente `team`: membros, convites, metas, passagem de turno, projectos comerciais, war room e filas.
4. Atacar ficheiros grandes: `LojaPublica.tsx`, `LojaDigitalPublica.tsx`, `GestaoFinancasUseCase.ts`, `LojaPublicaUseCase.ts` e repositorios memoria/prisma.
5. Criar testes por projecto, nao apenas por endpoint solto.
