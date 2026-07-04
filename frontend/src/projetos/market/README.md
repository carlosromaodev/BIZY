# Bizy Market - frontend

Este projecto concentra a experiencia publica e operacional do comercio fisico:

- home e diretorio do Market;
- detalhe de produto Market;
- perfil de loja publica;
- catalogo publico;
- checkout e acompanhamento de compra;
- Studio de loja/publicacao no Market.

Regras de organizacao:

- `api/` expoe contratos, rotas e cliente HTTP do Market.
- `dominio/` guarda helpers de URL, subdominio e dominio publico.
- `loja-publica/` guarda tipos, regras de vitrine, catalogos, tracking e persistencia local da loja publica.
- `studio-loja/` guarda tipos e regras puras do formulario administrativo da loja.
- `paginas/` contem as paginas publicas e a area Studio ligada a loja.
- `src/lojas`, `src/marketDominio`, `src/lojaSubdominio` e as paginas antigas ficam como compatibilidade temporaria.
