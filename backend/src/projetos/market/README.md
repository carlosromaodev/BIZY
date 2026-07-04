# Bizy Market - backend

Este projecto concentra o motor de comercio fisico do Bizy:

- loja publica e catalogo publico;
- descoberta no Bizy Market;
- checkout unificado multi-loja;
- repasses e reembolsos associados a compras Market;
- modulos HTTP publicos e Team ligados a loja/market.

Regras de organizacao:

- `aplicacao/` contem casos de uso do dominio Market.
- `infra/http/` contem os modulos Fastify do projecto.
- Os caminhos antigos em `src/use-case` e `src/infra/http/modulos` ficam apenas como fachadas temporarias.
- Logica financeira generica continua em Financas; aqui ficam apenas repasses e reembolsos originados por compras Market.
