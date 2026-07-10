# ADR-0002 - Anani como nucleo interno invisivel

Status: aprovado
Data: 2026-07-09
Dominio SDD: `domains/00-visao-produto-e-principios.md`, `domains/01-arquitetura-plataforma.md`, `domains/11-inteligencia-workflow-automacoes.md`, `domains/14-seguranca-privacidade-auditoria.md`

## Contexto

O plano `ANANI-INTELLIGENCE-MASTER-PLAN.md` redefine o Bizy como tres sistemas visiveis e um nucleo interno:

```text
Bizy = Bizy Team + Bizy Market + Bizy Learning + Anani interno
```

Antes desta decisao, "inteligencia", "workflow", "n8n", "IA" e "admin/sistema" estavam documentados e expostos de forma misturada. Isso criava risco de tratar Anani como produto de tenant, chatbot ou menu operacional comum.

## Decisao

Anani passa a ser nucleo interno invisivel da plataforma Bizy.

- Sistemas visiveis: Bizy Team, Bizy Market e Bizy Learning.
- Anani nao aparece como modulo de tenant.
- Acesso direto ao Anani e restrito a `GOVERNANTE_BIZY`, `ADMIN_GERAL` e `SUPER_ADMIN_PLATFORM`.
- Tenants recebem apenas efeitos do Anani dentro dos sistemas visiveis: alertas, tarefas, scores, bloqueios preventivos, relatorios simplificados e recomendacoes.
- n8n nao decide. n8n executa workflows aprovados pelo backend/Anani.
- Claude/GPT nao decide acoes de alto impacto. Modelo externo e apenas motor cognitivo com contexto sanitizado e auditado.

## Alternativas Consideradas

- Expor Anani como assistente IA para donos de loja: rejeitado, porque mistura plataforma interna com produto de tenant.
- Manter inteligencia/workflow/n8n como modulos comuns: rejeitado, porque preserva confusao de fronteira e risco operacional.
- Criar primeiro uma UI completa de governanca: adiado. A primeira etapa deve consolidar backend, politicas e dados.
- Criar pastas vazias `systems/*` apenas como promessa de refatoracao: rejeitado por agora, porque o repositorio ja usa `projetos/team`, `projetos/market`, `projetos/learning` e `anani`; a migracao fisica so deve acontecer quando mover codigo real sem duplicar caminhos.

## Consequencias

- [x] O backend ganha uma fronteira `backend/src/anani/` para policies.
- [x] O backend ganha suporte inicial de governance, risk, incidents e quarantine.
- [ ] O backend ganha read models completos e action gateway real.
- [x] O `ContextoAplicacao` expoe `anani` como nucleo interno.
- [x] Rotas comerciais nao dependem diretamente do Anani.
- [x] Endpoints diretos do Anani ficam sob `/governance/anani/*`.
- [x] Novas acoes automatizadas devem passar pelo `AnaniPolicyEngine`.
- [x] Qualquer acao que toque dinheiro, ledger, pagamento, reembolso, PII em prompt ou dados entre tenants e bloqueada por politica.
- [x] Acoes de nivel 3 exigem aprovacao humana.

## Links

- Plano fonte: `/home/carlos/Documentos/ANANI-INTELLIGENCE-MASTER-PLAN.md`
- Spec: `docs/sdd/specs/2026-07-09-anani-control-plane-backend.md`
- Codigo: `backend/src/anani/policies/AnaniPolicyEngine.ts`
- Rotas: `backend/src/infra/http/modulos/ananiGovernance.ts`
