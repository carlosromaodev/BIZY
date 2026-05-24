# Arquitetura Modular do ÉMeu

Data: 2026-05-02

## Referências Estudadas

Os repositórios foram clonados como material de estudo em:

- `/home/carlos/Documentos/project/referencias-emeu/n8n`
- `/home/carlos/Documentos/project/referencias-emeu/nocobase`

O link `https://github.com/nocobase/nocobas` não existe e foi tratado como erro de digitação.

## Decisão Arquitetural

O ÉMeu não deve copiar a complexidade do n8n nem do NocoBase. Eles são plataformas muito maiores. O que foi aproveitado como conhecimento:

- Do n8n: separação entre núcleo, integrações e workflows; manifesto de componentes registráveis; automações sem virar fonte de verdade.
- Do NocoBase: módulos administrativos por domínio; estrutura plugável; separação entre app, permissões, recursos e integrações.

No ÉMeu, isso virou uma arquitetura modular simples:

```text
backend/src/infra/http
├── ContextoAplicacao.ts
├── criarAplicacao.ts
├── seguranca.ts
└── modulos
    ├── ModuloHttp.ts
    ├── manifestoModulosHttp.ts
    ├── autenticacao.ts
    ├── catalogo.ts
    ├── integracoes.ts
    ├── lives.ts
    ├── n8n.ts
    ├── painel.ts
    ├── reservas.ts
    └── saude.ts
```

## Regra Principal

Handlers HTTP não devem conter regra de negócio pesada nem acesso direto ao banco.

O fluxo correto é:

```text
Rota HTTP
  -> validação Zod
  -> use-case
  -> repositórios/use-case
  -> domínio/eventos/providers
```

## Contexto da Aplicação

`ContextoAplicacao.ts` é o ponto de composição. Ele monta:

- repositórios em memória ou Prisma;
- use-cases;
- providers de live;
- provider WhatsApp;
- publisher n8n;
- hub SSE;
- sessões de live em memória.

Isso impede que cada rota saiba criar dependências próprias.

## Módulos HTTP

Cada módulo implementa:

```ts
interface ModuloHttp {
  nome: string;
  descricao: string;
  registrar(app, contexto): Promise<void> | void;
}
```

O manifesto `manifestoModulosHttp.ts` define a ordem de registro. Para criar um módulo novo, o fluxo é:

1. Criar o arquivo em `backend/src/infra/http/modulos`.
2. Implementar `ModuloHttp`.
3. Registrar no manifesto.
4. Manter operações de dados dentro de use-cases.

## Frontend

O frontend também ganhou manifesto:

```text
frontend/src/rotasApp.tsx
```

Ele centraliza:

- rotas públicas;
- rotas privadas;
- labels;
- ícones;
- seções do menu;
- componente de cada página.

Assim `App.tsx` apenas renderiza rotas e `Shell.tsx` apenas renderiza navegação.

## Próximo Nível

Quando o MVP crescer, os próximos módulos devem seguir o mesmo padrão:

- `lojas`
- `vendedores`
- `permissoes`
- `workflows`
- `outbox-eventos`
- `auditoria`
- `pedidos`
- `entregas`

O próximo salto técnico recomendado é uma outbox persistente para eventos enviados ao n8n.
