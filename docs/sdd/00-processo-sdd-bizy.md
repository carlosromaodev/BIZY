# Processo SDD do Bizy

Status: ativo
Criado em: 2026-06-28

## 1. Principio

Toda mudanca relevante deve estar ligada a um dominio SDD.

O SDD existe para impedir que o Bizy cresca por documentos soltos, conversas antigas ou implementacoes sem fronteira. Ele transforma a visao do produto em dominios claros, specs rastreaveis, planos executaveis e memoria atualizada.

A visao canonica fica em `docs/wiki/pages/visao-produto-bizy.md`. A meta global em `docs/superpowers/specs/2026-06-30-meta-global-bizy.md` e o filtro objetivo: toda iniciativa deve provar que melhora descoberta, conversao, execucao, retencao ou controlo.

## 2. Lifecycle

```text
Ideia -> Dominio SDD -> Spec -> Plano -> Implementacao -> Verificacao -> Wiki/SDD
```

Etapas:

1. Validar a ideia contra a visao unificada e a meta global do Bizy.
2. Identificar o dominio SDD afetado.
3. Confirmar se a mudanca altera regra, fluxo, entidade, UX, seguranca, integracao ou roadmap.
4. Criar uma spec em `docs/superpowers/specs/` quando houver desenho de produto/arquitetura.
5. Criar um plano em `docs/superpowers/plans/` quando houver execucao em multiplos passos.
6. Implementar seguindo o plano.
7. Validar com testes, verificacoes documentais ou comandos adequados.
8. Atualizar wiki e SDD quando o conhecimento virar duravel.

## 3. Quando Criar Spec

Criar spec quando a mudanca altera:

- comportamento operacional;
- fluxo de venda, atendimento, pagamento, entrega, equipa ou financeiro;
- entidade ou contrato de dados;
- permissao, auditoria, privacidade ou seguranca;
- UX relevante de loja, Market, CRM ou Bizy Team;
- integracao externa;
- automacao n8n/WhatsApp/IA;
- arquitetura, modulo HTTP, use case ou provider;
- regra de negocio ou requisito nao funcional.

Mudancas pequenas de texto, correcao documental simples ou ajuste local sem mudanca de fronteira podem ir direto para wiki ou plano curto.

## 4. Quando Criar Plano

Criar plano quando a spec aprovada exigir:

- varios arquivos;
- fases ou checkpoints;
- migracao de dados;
- testes em mais de uma camada;
- alteracao backend + frontend;
- atualizacao coordenada de wiki/SDD;
- risco operacional que exige ordem de execucao.

Planos ficam em `docs/superpowers/plans/` e usam checklist com `- [ ]`.

## 5. Quando Atualizar Wiki

Atualizar wiki quando a mudanca cria conhecimento duravel:

- novo endpoint;
- nova tela;
- nova entidade;
- nova regra de negocio;
- nova prioridade;
- incidente ou decisao operacional;
- novo guia de deploy;
- mudanca no estado atual do produto.

A wiki continua sendo a memoria navegavel e historica. O SDD e a camada de fronteira e decisao por dominio.

## 6. Quando Atualizar SDD

Atualizar SDD quando a mudanca altera:

- fronteira de dominio;
- regra de negocio;
- fluxo principal;
- modelo de dados;
- contrato publico;
- guardrail;
- requisito nao funcional central;
- roadmap P0/P1/P2;
- relacao entre modulos.

Se a mudanca apenas implementa uma lacuna ja descrita, atualizar o estado atual e a lacuna do dominio.

## 7. Guardrails

- Backend continua fonte de verdade.
- Dados comerciais respeitam `negocioId`.
- Automacao sensivel gera tarefa humana.
- Admin/Sistema fica separado da operacao comercial.
- Specs e planos devem citar dominio SDD relacionado.
- Specs e planos devem declarar que capacidade da meta global melhoram e que parte da visao unificada respeitam.
- Pedido e a entidade comercial principal; reserva e bloqueio temporario.
- Tracking nao substitui pedido, pagamento ou consentimento.
- Comissao so confirma apos pedido pago.
- Informacao tecnica nao deve aparecer para vendedor comum.
- Dados pessoais nao devem vazar em URL, cookie, tracking, log ou preview.

## 8. Resultado Esperado

Cada dominio deve permitir que uma IA ou pessoa responda rapidamente:

- o que este dominio resolve;
- que entidades ele controla;
- que fluxos principais existem;
- que regras nao podem ser quebradas;
- que APIs, telas e integracoes estao envolvidas;
- que testes e verificacoes sao minimos;
- que planos devem vir a seguir.
