# SDD Dominio 04 - Live, Reservas e Pedidos

Status: ativo
Owner logico: Produto Live Commerce
Fontes: `docs/wiki/pages/fluxos-operacionais-bizy.md`, `docs/wiki/pages/regras-de-negocio-bizy.md`, `README.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Controlar o fluxo historico inicial do Bizy: live, comentarios, parser, reserva por prioridade, fila, pagamento e conversao em pedido.

## 2. Escopo

Entra: provider de live, comentarios, parser, telefone angolano, codigo de produto, revisao manual, reservas, fila, expiracao, comprovativo e pedido derivado.

Fica fora: atendimento WhatsApp detalhado, loja publica, Market e financeiro contabil.

## 3. Atores e Permissoes

- Vendedora de live: inicia live, acompanha comentarios, aprova revisoes.
- Atendente: cobra pagamento e acompanha fila.
- Dono/gestor: configura regras e acompanha relatorio.
- Sistema: interpreta comentario e aplica prioridade.

## 4. Entidades e Dados

- `SessaoLive`
- `ComentarioRecebido`
- `Reserva`
- `Peca`
- `Pedido`
- `ItemPedido`
- `MensagemWhatsapp`

Dados sensiveis: telefone, texto original, avatar/social id, comprovativo e historico de pagamento.

## 5. Fluxos Principais

```text
Live -> Comentario -> Parser -> Revisao se ambiguo
     -> Reserva -> Fila se sem stock -> Pagamento
     -> Pedido completo -> Entrega -> Relatorio
```

## 6. Requisitos Funcionais

- Conectar live por provider.
- Capturar comentarios em tempo real.
- Interpretar intencao em portugues informal.
- Extrair telefone angolano e codigo/produto.
- Criar reserva para primeiro comentario valido.
- Colocar seguintes em fila.
- Expirar reserva e promover fila.
- Registrar comprovativo e confirmar/rejeitar pagamento.
- Converter reserva em pedido.

## 7. Regras de Negocio

- Comentario valido exige intencao, telefone angolano e codigo/produto.
- Ordem telefone/codigo nao altera validade.
- Ambiguos vao para revisao manual.
- Primeiro comentario valido ganha prioridade.
- Reserva bloqueia stock; fila nao bloqueia.
- Reserva paga nao expira automaticamente.
- Pedido e entidade comercial principal.

## 8. Requisitos Nao Funcionais

- Comentarios aparecem em ate poucos segundos.
- Reserva valida deve ser criada rapidamente.
- Provider falhou: modo manual continua operacao.
- Comentario original fica preservado.
- Operacoes de pagamento e revisao ficam auditaveis.

## 9. APIs, Telas e Integracoes

APIs: `/lives`, `/comentarios`, `/reservas`, `/pedidos`, `/eventos`.

Telas: Live, Comentarios/Live monitor, Pedidos/Reservas, Painel.

Integracoes: TikTok provider, provider Python, ManualProvider, WhatsApp/n8n.

## 10. Guardrails

- Nao vender automaticamente produto sem stock.
- Nao confirmar pagamento por comprovativo recebido.
- Nao perder operacao se provider externo cair.
- Nao apagar texto original do comentario.

## 11. Estado Atual

Parser, reservas, fila, expiracao, pagamento, comprovativo, recibo e conversao em pedido existem no backend com testes. Frontend possui Central de live e Pedidos.

## 12. Lacunas

- P0: telemetria final do fluxo reserva -> pedido -> entrega.
- P1: UX de revisao e prioridade visual em live.
- P2: war room de projectos comerciais para lives maiores.

## 13. Testes e Verificacao

- Testes de parser.
- Testes de concorrencia de reservas.
- Testes de pagamento e comprovativo.
- Testes de provider TikTok/manual.
- Testes de fluxo pedido.

## 14. Proximos Planos

- Spec de war room de live.
- Spec de telemetria live -> pedido.
- Spec de revisao visual de comentarios.
