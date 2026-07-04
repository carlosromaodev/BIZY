# Bizy Team - backend

Este projecto concentra a base operacional de equipa:

- membros, convites, papeis e personas;
- feed de actividade e notas internas;
- metas de equipa e progresso por membro;
- passagem de turno;
- departamentos, projectos, war room comercial e filas de execucao.

Regras de organizacao:

- `aplicacao/` contem os casos de uso Team.
- `infra/http/` contem os modulos Fastify do projecto.
- Tarefas operacionais e metas comerciais legadas ainda ficam fora deste corte quando pertencem a `operacional` ou `apoioComercial`.
- Caminhos antigos ficam como fachadas temporarias.
