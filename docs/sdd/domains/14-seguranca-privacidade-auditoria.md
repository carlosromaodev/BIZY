# SDD Dominio 14 - Seguranca, Privacidade e Auditoria

Status: ativo
Owner logico: Seguranca/Plataforma
Fontes: `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`, `docs/wiki/pages/requisitos-nao-funcionais-bizy.md`, `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Proteger dados, dinheiro, permissoes, sessoes, automacoes e auditoria em todos os dominios do Bizy.

## 2. Escopo

Entra: sessoes, cookies, RBAC, permissoes, auditoria, dados pessoais, tracking, consentimento, opt-out, mascaramento, cifra de credenciais, rate limit e anti-vazamento.

Fica fora: implementacao detalhada de cada feature, coberta nos dominios funcionais.

## 3. Atores e Permissoes

- Dono/admin: administra seguranca do negocio.
- Membro: acessa apenas dados permitidos.
- Financeiro: acessa dados financeiros por permissao.
- Admin Bizy: acessa governanca da plataforma.
- Sistema: aplica guardas, auditoria e mascaramento.

## 4. Entidades e Dados

- `SessaoUsuario`
- `CodigoLoginSms`
- `MembroNegocio`
- `ModuloNegocio`
- `EventoOperacional`
- `AuditoriaCompartilhamentoCliente`
- `MascaramentoDados`
- `InstanciaWhatsApp`
- credenciais cifradas

Dados sensiveis: telefone, email, endereco, mensagens, comprovativos, NIF, valores financeiros, tokens, chaves API e dados de cliente.

## 5. Fluxos Principais

```text
Requisicao -> Sessao -> Negocio -> Permissao -> Modulo ativo -> Use case -> Auditoria
```

```text
Evento sensivel -> Validacao -> Persistencia -> Evento/Auditoria -> Relatorio
```

## 6. Requisitos Funcionais

- Exigir sessao em endpoints comerciais.
- Aplicar permissoes por papel e dominio.
- Auditar pagamento, desconto, stock, comissao, exportacao, permissao e financeiro.
- Mascarar dados conforme papel.
- Aplicar consentimento e opt-out.
- Cifrar credenciais de integracao.
- Validar tracking publico sem dados pessoais.

## 7. Regras de Negocio

- Dados comerciais respeitam `negocioId`.
- Exportacao exige permissao e auditoria.
- Alteracao manual sensivel exige responsavel e motivo.
- Marketing exige consentimento.
- Opt-out bloqueia marketing.
- Conflito automacao vs seguranca favorece tarefa humana.

## 8. Requisitos Nao Funcionais

- Cookies HttpOnly/SameSite e seguros em producao.
- Rate limit em endpoints sensiveis.
- Logs sem dados pessoais desnecessarios.
- Cifra de credenciais.
- Testes de isolamento multi-tenant.
- Auditoria legivel para dono/admin.

## 9. APIs, Telas e Integracoes

APIs transversais: guardas HTTP, `/auth/*`, `/operacional/auditoria`, `/auditoria/eventos`, endpoints financeiros, campanhas, WhatsApp, Market e exportacoes.

Telas: Auditoria, Administracao, Diagnosticos, Equipa, Financas.

## 10. Guardrails

- Nao versionar segredos.
- Nao colocar telefone, email, nome ou endereco em URL/tracking/cookies.
- Nao permitir que frontend seja unica barreira de permissao.
- Nao confirmar pagamento, desconto, cancelamento ou comissao sem auditoria.
- Nao expor provider/token a vendedor comum.

## 11. Estado Atual

Projeto possui sessoes, cookie HttpOnly, rate limit, CORS, hash de SMS/sessao, cifra de credenciais, auditoria, permissoes financeiras e guardrails WhatsApp em evolucao.

## 12. Lacunas

- P0: varredura final de tracking/privacidade publica.
- P1: matriz completa de permissoes por dominio.
- P2: testes de isolamento mais amplos e relatorios de auditoria por dono/admin.

## 13. Testes e Verificacao

- Testes de autenticacao e cookie.
- Testes de rate limit.
- Testes de permissao financeira.
- Testes de isolamento operacional.
- Testes de tracking sem dados pessoais.
- Revisao de logs e URLs publicas.

## 14. Proximos Planos

- Spec de matriz de permissoes por dominio.
- Spec de auditoria operacional legivel.
- Spec de privacidade publica e tracking seguro.
