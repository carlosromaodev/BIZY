# Projecto Learning Frontend

Projecto responsavel pela experiencia frontend do ecossistema Bizy Learning.

`/learning` e a vitrine publica do produto. `/app/learning` e o backoffice Team. O dominio completo deve cobrir produtos digitais, comunidades, cohorts, mentorias, certificados, checkout, entitlement, progresso, chat interno e analytics.

Camadas:

- `api.ts`: contratos e chamadas HTTP.
- `paginas/`: superficies publicas e administrativas.
- `index.ts`: fachada para rotas e imports futuros.

Componentes especificos devem entrar neste projecto antes de virar componente global.

Regras de produto:

- nao tratar Learning como pagina unica ou catalogo simples;
- manter design publico forte, com qualidade comparavel ao Market;
- separar comunidade/chat Learning de atendimento externo WhatsApp/CRM;
- manter Team como backoffice operacional, nao como vitrine principal.
