# SDD Dominio 02 - Identidade, Acesso e Negocios

Status: ativo
Owner logico: Plataforma/Seguranca
Fontes: `backend/prisma/schema.prisma`, `docs/wiki/pages/dominio-e-entidades-bizy.md`, `docs/wiki/pages/regras-de-negocio-bizy.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Controlar quem acessa o Bizy, em que negocio trabalha, com que papel, permissoes e modulos ativos.

## 2. Escopo

Entra: login telefone/SMS, Google, identidade estudantil, sessoes, onboarding, negocio, membros, papeis, modulos, relacoes entre negocios e workspaces.

Fica fora: politicas detalhadas de dados pessoais e auditoria transversal, cobertas no dominio 14.

## 3. Atores e Permissoes

- Visitante: acessa paginas publicas.
- Usuario autenticado: tem sessao e pode escolher workspace.
- Dono/admin: gere negocio, membros, modulos e permissoes.
- Membro: acessa funcionalidades por papel/persona.
- Sistema: aplica guardas de sessao, modulo e permissao.

## 4. Entidades e Dados

- `UsuarioSistema`
- `IdentidadeAutenticacao`
- `PerfilEstudantilUsuario`
- `SessaoUsuario`
- `CodigoLoginSms`
- `Negocio`
- `MembroNegocio`
- `ModuloNegocio`
- `RelacaoNegocio`

Dados sensiveis: telefone, email, codigos OTP, tokens de sessao, identidade estudantil e papeis.

## 5. Fluxos Principais

```text
Telefone -> Codigo SMS/WhatsApp -> Confirmacao -> Sessao -> Negocio -> Onboarding
```

```text
Dono -> Convite/Membro -> Papel/Persona -> Permissoes -> Acesso a modulos
```

## 6. Requisitos Funcionais

- Login por telefone com codigo expiravel.
- Login Google quando configurado.
- Login estudantil UOR/ISPTEC.
- Sessao segura por cookie HttpOnly e compatibilidade Bearer quando necessario.
- Onboarding de negocio, canais, pagamento, reserva e produto inicial.
- Modulos ativaveis/desativaveis por negocio.
- Usuario pode pertencer a varios negocios.

## 7. Regras de Negocio

- Todo dado comercial pertence a um `Negocio`.
- Modulo desativado nao aparece como promessa vazia e nao executa automacao.
- Vendedor comum nao ve Admin/Sistema.
- Compartilhamento entre negocios exige regra, escopo, motivo e auditoria.

## 8. Requisitos Nao Funcionais

- Codigos de login armazenados como hash.
- Sessao revogavel.
- Rate limit em endpoints de login.
- CORS restrito.
- Cookies seguros em producao.

## 9. APIs, Telas e Integracoes

- `/auth/telefone/solicitar-codigo`
- `/auth/telefone/confirmar-codigo`
- `/auth/google/*`
- `/auth/estudantil/login`
- `/auth/sessao`
- `/onboarding/*`
- `/negocio/modulos`
- `/negocio/membros`
- `/equipa/convites`

Telas: login, onboarding, administracao, equipa e seletor de workspace.

## 10. Guardrails

- Nao expor codigo SMS em producao.
- Nao guardar token em plaintext.
- Nao permitir acesso comercial sem `negocioId`.
- Nao confiar apenas no frontend para esconder modulo.

## 11. Estado Atual

Autenticacao por telefone, Google, estudantil, onboarding, membros, modulos e sessoes existem. Team adiciona convites, personas e acesso frictionless.

## 12. Lacunas

- [x] P0: verificar ocultacao consistente de modulos desativados na UI.
- P1: matriz de permissoes por papel/persona.
- [x] P1: guard frontend de acesso direto por URL quando modulo estiver desligado.
- P2: modo sombra e progressive disclosure por novos membros.

## 13. Testes e Verificacao

- Testes HTTP de autenticacao.
- Testes de sessao e cookie.
- Testes de permissao por modulo.
- [x] Teste frontend de ocultacao de modulos desativados.
- [x] Teste frontend de guard de URL por modulo.
- [x] Teste HTTP backend de modulo desligado com 403.
- Testes de isolamento por `negocioId`.

## 14. Proximos Planos

- Spec de matriz RBAC/ABAC por dominio.
- Spec de convite e onboarding de membro completo.
