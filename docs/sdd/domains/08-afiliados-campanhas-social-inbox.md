# SDD Dominio 08 - Afiliados, Campanhas e Social Inbox

Status: ativo
Owner logico: Produto Crescimento
Fontes: `docs/wiki/pages/mapa-de-modulos-bizy.md`, `docs/wiki/pages/fluxos-operacionais-bizy.md`, `docs/wiki/pages/regras-de-negocio-bizy.md`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Controlar canais de crescimento: parceiros, campanhas, links rastreaveis, Social Inbox, atribuicao, comissoes e relatorios social-receita.

## 2. Escopo

Entra: afiliados, criadores, revendedores, links, mini-lojas, pacotes de divulgacao, campanhas, templates, Social Inbox, atribuicao e comissoes.

Fica fora: atendimento individual detalhado, coberto no dominio 05, e financeiro geral, coberto no dominio 10.

## 3. Atores e Permissoes

- Dono/gestor: cria campanhas e regras de comissao.
- Afiliado/criador: divulga links e acompanha comissao permitida.
- Atendente: transforma item social em conversa/tarefa.
- Sistema: atribui origem e calcula comissao.

## 4. Entidades e Dados

- `ParceiroComercial`
- `LinkAfiliado`
- `ComissaoParceiro`
- `HistoricoComissaoParceiro`
- `LotePagamentoComissao`
- `ItemLotePagamentoComissao`
- `CampanhaCrm`
- `ItemCampanhaCrm`
- `TemplateWhatsAppNegocio`
- `SocialInboxItem`
- `EventoTrackingComercial`

## 5. Fluxos Principais

```text
Parceiro -> Link -> Visita/Pedido -> Atribuicao -> Pedido pago -> Comissao
```

```text
Comentario social -> Classificacao -> Lead/Tarefa/Conversa/Oportunidade
```

```text
Segmento -> Template aprovado -> Campanha -> Resultado -> Receita atribuida
```

## 6. Requisitos Funcionais

- Criar parceiro e link rastreavel.
- Gerar pacote de divulgacao.
- Calcular comissao estimada, confirmada, paga e revertida.
- Criar lotes de pagamento.
- Criar campanha segmentada com template e pausa.
- Capturar/importar interacoes sociais.
- Converter item social em WhatsApp, tarefa, conversa ou oportunidade.

## 7. Regras de Negocio

- Comissao so confirma apos pedido pago.
- Cancelamento/devolucao/reembolso reverte comissao.
- Campanha sem segmento claro deve ser bloqueada.
- Marketing exige consentimento.
- Comentario social nao vira pedido confirmado automaticamente.
- Reclamacao, desconto ou troca cria tarefa humana.

## 8. Requisitos Nao Funcionais

- Links rastreaveis estaveis.
- Relatorios de afiliados sem dados privados desnecessarios.
- Idempotencia em tracking, webhooks e importacoes.
- Campanhas com limites e opt-out.
- Falhas sem reenvio infinito.

## 9. APIs, Telas e Integracoes

APIs: `/afiliados`, `/publico/links/:codigo`, `/publico/mini-lojas/:codigo`, `/campanhas`, `/whatsapp/templates`, `/social/inbox/*`, `/publico/tracking/eventos`.

Telas: Afiliados, Campanhas, Social Inbox, Relatorios.

## 10. Guardrails

- Nao expor cliente privado para afiliado.
- Nao confirmar comissao sem pedido pago.
- Nao enviar campanha promocional para opt-out.
- Nao automatizar acao social de baixa confianca.

## 11. Estado Atual

Backend possui afiliados, links, comissoes, lotes, campanhas, templates, Social Inbox, importacao e relatorios. Frontend possui paginas Afiliados, Campanhas e Social Inbox.

## 12. Lacunas

- P0: garantir privacidade/tracking publico.
- P1: resultados de campanha por webhook/status.
- P2: portal de afiliado, conectores sociais oficiais e comissao por meta.

## 13. Testes e Verificacao

- Testes HTTP de afiliados.
- Testes de campanhas e templates.
- Testes de Social Inbox.
- Testes de tracking sem dados pessoais.
- Testes de reversao de comissao.

## 14. Proximos Planos

- Spec de portal do afiliado.
- Spec de campanhas com status provider.
- Spec de conectores sociais oficiais.
