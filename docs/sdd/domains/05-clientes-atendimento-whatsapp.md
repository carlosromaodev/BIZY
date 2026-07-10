# SDD Dominio 05 - Clientes, Atendimento e WhatsApp

Status: ativo
Owner logico: Produto Atendimento
Fontes: `docs/wiki/pages/dominio-e-entidades-bizy.md`, `docs/wiki/pages/mapa-de-modulos-bizy.md`, `docs/wiki/pages/fluxos-operacionais-bizy.md`
Ultima atualizacao: 2026-07-10

## 1. Proposito

Unificar identidade de cliente, historico comercial, conversas, WhatsApp e acoes de atendimento em uma inbox operacional.

## 2. Escopo

Entra: Cliente 360, conversas, mensagens, notas, SLA, WhatsApp, Evolution, Cloud API, templates, consentimento, opt-out e fallback humano.

Fica fora: campanhas em massa e Social Inbox, cobertas no dominio 08.

## 3. Atores e Permissoes

- Atendente: responde conversas, cria notas, tarefas e pedidos contextuais.
- Vendedor: usa historico e proximas acoes para fechar venda.
- Dono/gestor: acompanha SLA, prioridade e qualidade.
- Sistema: classifica politica WhatsApp e cria tarefas quando envio for inseguro.

## 4. Entidades e Dados

- `ClienteGlobal`
- `ClienteNegocio`
- `ClienteAtendimento`
- `ConversaAtendimento`
- `MensagemAtendimento`
- `MensagemWhatsapp`
- `OutboxMensagemWhatsApp`
- `TemplateWhatsAppNegocio`

Dados sensiveis: telefone, nome, endereco, mensagens, comprovativos, consentimentos e opt-out.

## 5. Fluxos Principais

```text
Cliente -> WhatsApp/Comentario -> Conversa CRM
        -> Contexto Cliente 360 -> Proxima acao
        -> Resposta, template, pedido, tarefa ou aprovacao humana
```

## 6. Requisitos Funcionais

- Manter Cliente 360 por negocio.
- Vincular conversa a cliente, pedido, tarefa e canal.
- Registrar mensagens e notas internas.
- Verificar SLA e prioridade.
- Enviar WhatsApp manual ou por template autorizado.
- Criar pedido a partir da conversa.
- Sugerir proximas acoes com guardrails.

## 7. Regras de Negocio

- `ClienteGlobal` identifica pessoa; `ClienteNegocio` identifica relacao com loja.
- Loja nao ve historico privado de outra sem regra.
- Marketing exige consentimento.
- Opt-out bloqueia marketing.
- Servico depende da janela de atendimento.
- Template ausente ou inseguro vira tarefa humana.

## 8. Requisitos Nao Funcionais

- Inbox responsiva e sem scroll horizontal.
- Mensagens auditaveis.
- Webhooks idempotentes.
- Dados pessoais minimizados em logs.
- Falha de provider nao pode perder mensagem.

## 9. APIs, Telas e Integracoes

APIs: `/clientes`, `/atendimento/conversas`, `/whatsapp/templates`, `/whatsapp/mensagens`, `/webhooks/evolution`, `/evolution/*`.

Telas: Clientes, Conversas/Atendimento, Respostas Rapidas, Administracao/Integracoes.

Integracoes: Evolution API, WhatsApp Cloud API, n8n, Ombala para OTP quando aplicavel.

## 10. Guardrails

- Nao misturar historico privado entre negocios.
- Nao enviar promocao em template de utilidade/autenticacao.
- Nao responder reclamacao, desconto, troca ou cancelamento critico sem humano.
- Nao expor tokens de provider a atendente.

## 11. Estado Atual

Backend possui Cliente 360, atendimento, conversas, mensagens, notas, politica WhatsApp, Evolution, Cloud API e envio real de anexos de atendimento. Frontend possui pagina de Conversas e Clientes com evolucao visual em curso; a conversa ja envia imagem/PDF e mostra anexo no historico.

## 12. Lacunas

- [x] P0: revisar privacidade/tracking publico ligado a cliente.
- [ ] P1: Cliente 360 visual completo.
- [x] P1: envio binario real na conversa WhatsApp.
- [ ] P1: prioridade visual para VIP, reclamacao e pagamento pendente.
- [ ] P2: opt-out granular e sincronizacao completa de templates.

## 13. Testes e Verificacao

- Testes HTTP de clientes e atendimento.
- Testes de politica WhatsApp.
- Testes de webhooks Evolution.
- Testes frontend de conversas.
- Testes de provider WhatsApp com media e storage privado de anexos.

## 14. Proximos Planos

- [ ] Spec de Cliente 360 visual.
- [x] Spec de envio binario WhatsApp.
- [ ] Spec de opt-out granular.
