# Projecto Learning Backend

Projecto responsavel pelo dominio backend do ecossistema Bizy Learning.

Learning nao e uma pagina nem um catalogo simples. O backend deve sustentar produtos digitais, ofertas, checkout Learning, entitlement, progresso, certificados, comunidades, cohorts, mentorias, chat interno, analytics e backoffice Team.

Camadas:

- `aplicacao/`: caso de uso e regras transitorias baseadas em `EventoOperacional`.
- `infra/http/`: rotas Fastify e schemas de entrada.
- `index.ts`: fachada para composicao do backend.

Os caminhos antigos continuam como shims enquanto o resto do codigo migra.

Estado incremental:

- `EventoOperacional` com `topico="learning"` guarda programas, compras, entitlements, progresso, certificados e chat interno enquanto o schema dedicado nao existe.
- O schema dedicado futuro deve promover essas entidades para tabelas proprias sem perder auditoria historica.
