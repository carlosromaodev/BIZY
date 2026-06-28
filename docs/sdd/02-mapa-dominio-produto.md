# Mapa de Dominio e Produto do Bizy

Status: ativo
Criado em: 2026-06-28

## 1. Eixo Operacional

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
        -> Equipa -> Financas -> Auditoria
```

Live, WhatsApp, loja publica, Bizy Market, Social Inbox, campanhas, afiliados e formularios sao canais de entrada. Eles alimentam o mesmo nucleo operacional.

## 2. Mapa de Dominios

| Dominio | Modulos | Entidades Principais | APIs/Telas | Fontes |
|---|---|---|---|---|
| 00 Visao | Produto, estrategia, principios | N/A | N/A | `memoria-projeto-bizy.md`, `visao-produto-bizy.md` |
| 01 Arquitetura | HTTP, use cases, repositorios, providers | `EventoSistema`, outbox, contratos | manifesto HTTP, `ContextoAplicacao.ts` | `arquitetura-e-guardrails-bizy.md` |
| 02 Identidade | Auth, negocios, modulos, RBAC | `UsuarioSistema`, `Negocio`, `MembroNegocio`, `ModuloNegocio` | `/auth/*`, `/negocio/*`, onboarding | `schema.prisma`, modulos auth |
| 03 CRM Social Commerce | CRM+, pedidos, tarefas, relatorios | `Pedido`, `TarefaOperacional`, `MovimentoFunilComercial` | `/painel`, `/relatorios`, `/tarefas` | requisitos CRM |
| 04 Live/Reservas | Live, parser, reservas, fila | `SessaoLive`, `ComentarioRecebido`, `Reserva`, `Pedido` | `/lives`, `/comentarios`, `/reservas`, `/pedidos` | requisitos live |
| 05 Clientes/WhatsApp | Cliente 360, atendimento, WhatsApp | `ClienteGlobal`, `ClienteNegocio`, `ConversaAtendimento`, `MensagemAtendimento` | `/clientes`, `/atendimento`, `/whatsapp`, `/webhooks/evolution` | inventarios CRM |
| 06 Catalogo/Loja | Produtos, stock, loja publica | `Peca`, `VariantePeca`, `MovimentoStock`, tracking | `/pecas`, `/publico/lojas`, `/loja-publica` | loja digital |
| 07 Market | Market, checkout, repasses | `CompraUnificada`, `PedidoFilho`, `RepasseFinanceiro`, `SeguidorLoja` | `/publico/market`, `/checkout`, `/crm/loja/*` | requisitos Market |
| 08 Afiliados/Social | Afiliados, campanhas, Social Inbox | `ParceiroComercial`, `LinkAfiliado`, `CampanhaCrm`, `SocialInboxItem` | `/afiliados`, `/campanhas`, `/social/inbox` | requisitos social commerce |
| 09 Team/Projectos | Equipa, turnos, projectos | `ConviteEquipa`, `MetaVendas`, `Projecto`, `ProjetoComercial` | `/equipa`, `/projectos` | requisitos Bizy Team |
| 10 Financas | Ledger, facturacao, conformidade | `MovimentoFinanceiro`, `Factura`, `Despesa`, `RegraFiscal` | `/financas`, `/conformidade` | requisitos Team, financas |
| 11 Inteligencia | Previsoes, insights, workflow, n8n | `InsightPreditivo`, `FluxoAutomatico`, `ExecucaoFluxo` | `/inteligencia`, `/workflow`, `/n8n` | requisitos Team, automacoes |
| 12 Frontend/UX | Shell, paginas, design system | tipos frontend e componentes | `frontend/src/rotasApp.tsx`, paginas React | identidade visual v2 |
| 13 Operacao | Deploy, Docker, backup, observabilidade | jobs, logs, scripts | `/saude`, scripts, Docker Compose | docs deploy |
| 14 Seguranca | RBAC, privacidade, auditoria | `EventoOperacional`, `Auditoria*`, sessoes | guardas HTTP, auditoria, rate limit | guardrails seguranca |

## 3. Fronteiras Criticas

- `Negocio` e a fronteira principal de tenant.
- Pedido e a entidade comercial principal.
- Reserva e bloqueio temporario, nao venda final.
- Tracking nao substitui pedido, pagamento ou consentimento.
- Backend e fonte de verdade para stock, pagamento, permissao, consentimento, comissao e auditoria.
- n8n, Evolution, Cloud API, IA e conectores sociais sao suporte operacional.
- Market gera descoberta; CRM/Team controla execucao.
- Financas devem estar ligadas a origem operacional auditavel.

## 4. Relacao com Codigo

Arquivos de entrada:

- Backend HTTP: `backend/src/infra/http/modulos/manifestoModulosHttp.ts`
- Composicao backend: `backend/src/infra/http/ContextoAplicacao.ts`
- Dados: `backend/prisma/schema.prisma`
- Frontend rotas: `frontend/src/rotasApp.tsx`
- API frontend: `frontend/src/api.ts`
- Design system: `frontend/src/componentes/BizyDesignSystem.tsx`

## 5. Relacao com Documentos

- Memoria principal: `docs/wiki/pages/memoria-projeto-bizy.md`
- Guia para IA: `docs/wiki/pages/guia-para-ia-bizy.md`
- Modulos: `docs/wiki/pages/mapa-de-modulos-bizy.md`
- Entidades: `docs/wiki/pages/dominio-e-entidades-bizy.md`
- Fluxos: `docs/wiki/pages/fluxos-operacionais-bizy.md`
- Guardrails: `docs/wiki/pages/arquitetura-e-guardrails-bizy.md`
- Market: `docs/wiki/pages/bizy-market-lojas-digitais.md`
- Team: `docs/RF-RNF-RN-BIZY-TEAM-MIGRACAO.md`

## 6. Como Usar Este Mapa

Antes de criar uma spec:

1. Localizar o dominio afetado.
2. Conferir entidades principais e fronteiras.
3. Verificar se a iniciativa toca outro dominio.
4. Linkar a spec ao dominio principal e citar dominios secundarios.
5. Atualizar o mapa se surgir um novo modulo, entidade ou fronteira.
