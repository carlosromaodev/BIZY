# Roadmap SDD Bizy

Status: ativo
Criado em: 2026-06-28

## Meta Global

O roadmap deve seguir a visao unificada definida em `../wiki/pages/visao-produto-bizy.md` e a meta global em `../superpowers/specs/2026-06-30-meta-global-bizy.md`: Bizy como sistema operacional comercial para pequenos negocios.

Toda prioridade precisa melhorar pelo menos uma capacidade:

- descoberta;
- conversao;
- execucao;
- retencao;
- controlo.

## 1. P0

P0 bloqueia lancamento ou experiencia minima aceitavel:

- [ ] checkout visual completo;
- [x] SEO e preview social publico;
- [x] aviso de privacidade e tracking;
- [x] paginacao padronizada em listas grandes;
- [ ] consistencia mobile sem scroll horizontal;
- [x] estabilidade de loja publica e Bizy Market;
- [ ] verificacao de modulos desativados na UI;
- [x] rotas publicas sem dados pessoais em tracking.
- [x] Anani restrito a governanca, sem exposicao em tenant, com migration e policies basicas validas.

## 2. P1

P1 melhora primeira operacao comercial:

- Cliente 360 polido;
- pedido direto na conversa;
- envio binario real no WhatsApp;
- colecoes visuais;
- templates transacionais por evento;
- tarefas automaticas para falhas de automacao;
- textos operacionais para vendedora nao tecnica;
- prioridade visual para VIP, reclamacao e pagamento pendente;
- resultados de campanha por webhook/status.
- Bizy Learning separado como learning commerce engine, com home publica tipo Market, backoffice Team e Studio capaz de activar Market, Learning ou ambos.

## 3. P2

P2 depende de feedback, escala ou integracao madura:

- portal de afiliado;
- conectores sociais oficiais;
- opt-out granular;
- multi-moeda real;
- painel personalizavel;
- logistica avancada;
- reconciliacao bancaria;
- e-invoicing estruturado;
- dominio personalizado;
- social graph do comprador;
- recomendacoes avancadas;
- war rooms de projectos comerciais;
- teste de carga.
- checkout digital Learning, entitlement, certificados, comunidades pagas, bundles, memberships e mentorias.

## 4. Por Dominio

| Dominio | Proximos Planos Sugeridos |
|---|---|
| 00 Visao | Revisar posicionamento publico Bizy Team e promessa comercial por segmento. |
| 01 Arquitetura | Consolidar bus/outbox unico e contratos versionados entre modulos. |
| 02 Identidade | Formalizar matriz de permissoes por papel, persona e modulo. |
| 03 CRM Social Commerce | Polir funil comercial, tarefas e relatorios operacionais no mesmo modelo. |
| 04 Live/Reservas | Fechar fluxo reserva -> pedido -> pagamento -> entrega com telemetria. |
| 05 Clientes/WhatsApp | Completar Cliente 360 visual, envio binario e opt-out granular. |
| 06 Catalogo/Loja | Finalizar checkout visual e SEO; manter guardrail de privacidade publica. |
| 07 Market | Evoluir checkout multi-loja, acompanhamento do comprador e repasses. |
| 08 Afiliados/Social | Criar portal do afiliado e conectores sociais oficiais. |
| 09 Team/Projectos | Completar onboarding de membros, modo sombra, war rooms e passagem via WhatsApp. |
| 10 Financas | Avancar reconciliacao bancaria, e-invoicing e relatorios fiscais. |
| 11 Inteligencia/Anani | [ ] Ligar insights a tarefas, notificacoes WhatsApp e feedback de utilidade; [ ] completar projectors/read models iniciais; [ ] audit trail; [x] teste HTTP completo de governanca. |
| 12 Frontend/UX | Auditar rotas para design v2, estados vazios e mobile 360px. |
| 13 Operacao | Documentar runbooks de incidentes, backup, restore e deploy continuo. |
| 14 Seguranca | Expandir testes de isolamento multi-tenant, auditoria e minimizacao de dados. |
| 15 Learning | Consolidar RF/RNF/RN do Learning; depois implementar Studio Market/Learning/Ambos, produto digital, checkout digital, entitlement, certificados, comunidade, mentorias e low-data mode. |

## 5. Regra de Priorizacao

Priorizar nesta ordem:

1. Funcionalidade que impede venda, atendimento, pagamento ou entrega.
2. Risco de privacidade, dinheiro, permissoes ou auditoria.
3. Iniciativa que melhora descoberta, conversao, execucao, retencao ou controlo de forma mensuravel.
4. Experiencia publica de comprador.
5. Operacao diaria da equipa.
6. Escala, automacao e inteligencia.

## 6. Como Atualizar

Quando uma lacuna vira spec:

1. Criar spec em `../superpowers/specs/`.
2. Linkar o dominio SDD afetado.
3. Criar plano em `../superpowers/plans/`.
4. Atualizar esta tabela quando o plano for concluido ou substituido.
