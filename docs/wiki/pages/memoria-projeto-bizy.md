---
title: Memoria de Projeto do Bizy
aliases:
  - Briefing Bizy
  - Memoria principal do Bizy
  - Bizy para outra IA
tags:
  - bizy/memoria
  - bizy/produto
  - ia/briefing
status: ativo
updated: 2026-07-10
---

# Memoria de Projeto do Bizy

> [!abstract] Leitura obrigatoria
> Esta e a nota principal para outra IA entender o Bizy sem reler todo o repositorio. Ela aponta para notas tematicas ligadas entre si, nao para uma memoria presa apenas no `index`.

## Resumo Curto

Bizy e o sistema operacional comercial para pequenos negocios que vendem, atendem, cobram, entregam, recuperam clientes, gerem equipa e medem crescimento no mesmo lugar.

Formula atual:

```text
Bizy = Bizy Team + Bizy Market + Bizy Learning + Anani interno
```

O projeto nasceu como EMeu, focado em automacao de vendas em lives. Essa origem continua importante, mas live, WhatsApp, loja publica, campanhas, afiliados e social inbox agora sao canais que alimentam o mesmo loop comercial. A fonte canonica desta direcao e [[visao-produto-bizy|Visao Unificada do Bizy]].

## Mapa da Memoria

Leia nesta ordem quando estiveres a continuar o projeto:

1. [[guia-para-ia-bizy|Guia para outra IA]]
2. [[protocolo-atualizacao-memoria-bizy|Protocolo de Atualizacao da Memoria]]
3. [[visao-produto-bizy|Visao Unificada do Bizy]]
4. [[anani-intelligence-control-plane|Anani Intelligence Control Plane]]
5. [[dores-e-qualidades-bizy|Dores resolvidas e qualidades do produto]]
6. [[mapa-de-modulos-bizy|Mapa de modulos funcionais]]
7. [[dominio-e-entidades-bizy|Dominio e entidades principais]]
8. [[fluxos-operacionais-bizy|Fluxos operacionais]]
9. [[arquitetura-e-guardrails-bizy|Arquitetura e guardrails]]
10. [[prioridades-lancamento-bizy|Prioridades de lancamento]]

Depois de entender o produto, use os inventarios:

- [[inventario-sistema-bizy|Inventario do Sistema Bizy]]
- [[inventario-backend-api|Inventario Backend e API HTTP]]
- [[inventario-dados-prisma|Inventario de Dados, Prisma e Migrations]]
- [[inventario-frontend|Inventario Frontend e UX]]
- [[inventario-operacao-testes|Inventario de Operacao, Integracoes e Testes]]
- [[memoria-viva-bizy|Memoria Viva do Bizy]]

## O Que o Bizy E

O Bizy tem tres sistemas visiveis e um nucleo interno:

- Bizy Team: operacao privada, CRM, equipa, pedidos, pagamentos, tarefas, financeiro e backoffice.
- Bizy Market: descoberta publica, lojas, produtos, checkout, confianca, tracking e repasses.
- Bizy Learning: produtos digitais, cursos, mentorias, comunidade, acesso, progresso e certificados.
- Anani: nucleo interno invisivel de inteligencia, risco, auditoria, controlo e governanca.

Ele transforma interacoes dispersas em [[dominio-e-entidades-bizy|clientes, produtos, pedidos, pagamentos, entregas, conversas, tarefas, campanhas, tracking, comissoes e relatorios auditaveis]].

## O Que o Bizy Nao E

> [!warning] Nao confundir
> Deploy, VPS, Docker, n8n e Evolution sao suporte operacional. Eles nao sao o centro da memoria. O centro do projeto e o produto comercial descrito em [[visao-produto-bizy]] e [[mapa-de-modulos-bizy]].

O Bizy tambem nao deve virar:

- painel tecnico para desenvolvedor;
- landing page decorativa;
- chatbot autonomo sem guardrails;
- sistema dependente de n8n como fonte de verdade;
- automacao que confirma pagamento ou promete entrega sem regra;
- app cheio de modulos vazios.
- Anani exposto como produto de tenant.

## Frase Norteadora

> [!tip] Produto
> Toda decisao deve ajudar a loja a vender, atender, cobrar, entregar, recuperar ou medir melhor.

Se uma tela, endpoint ou automacao nao faz isso, precisa ser repensada, escondida, movida para Admin/Sistema ou deixada para depois.

## Estado Atual em Uma Leitura

O backend ja esta amplo: autenticacao, negocio, catalogo, reservas, pedidos, clientes 360, conversas, WhatsApp, n8n, loja publica, Market, Learning, tracking, afiliados, social inbox, campanhas, funil, tarefas, relatorios, auditoria, jobs, contratos, Anani, backup e rate limit.

As lacunas de lancamento devem ser lidas em [[prioridades-lancamento-bizy]]. O P0 do roadmap atual esta fechado; a sequencia agora e P1/P2 sem inventar nova visao: projectors/read models Anani, polimento operacional, matriz de permissoes e melhorias de primeira operacao. Guard frontend de URL por modulo ja foi fechado.

Detalhes de estado tecnico ficam em [[memoria-viva-bizy]] e nos inventarios.

## Regra Para Futuras IAs

> [!important] Memoria primeiro
> Qualquer mudanca relevante deve atualizar a memoria seguindo [[protocolo-atualizacao-memoria-bizy]]. Se faltar informacao, consultar o codigo e corrigir a memoria.

Antes de alterar codigo, outra IA deve responder:

- Que dor real isto resolve?
- Isto respeita [[visao-produto-bizy|a visao unificada]]?
- Qual entidade principal esta envolvida?
- O dado esta isolado por `negocioId`?
- Existe permissao/auditoria?
- Existe fallback humano?
- O modulo pode estar desativado?
- O frontend tem estado vazio util?
- Existe teste ou verificacao?
- Algum dado pessoal pode vazar em URL, tracking, log ou relatorio?

Essas perguntas tambem estao detalhadas em [[guia-para-ia-bizy]].
