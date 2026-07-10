---
title: Guia para IA no Bizy
aliases:
  - Guia para outra IA
  - Como continuar o Bizy
tags:
  - bizy/memoria
  - ia/guia
status: ativo
updated: 2026-07-10
---

# Guia para IA no Bizy

> [!abstract] Objetivo
> Esta nota orienta outra IA a trabalhar no Bizy usando a memoria do Obsidian em vez de reler o projeto inteiro.

## Ordem de Leitura

1. [[visao-produto-bizy|Visao Unificada do Bizy]]
2. [[memoria-projeto-bizy|Memoria de Projeto do Bizy]]
3. [[protocolo-atualizacao-memoria-bizy|Protocolo de Atualizacao da Memoria]]
4. [[anani-intelligence-control-plane|Anani Intelligence Control Plane]]
5. [[dores-e-qualidades-bizy|Dores e qualidades]]
6. [[mapa-de-modulos-bizy|Mapa de modulos]]
7. [[dominio-e-entidades-bizy|Dominio e entidades]]
8. [[fluxos-operacionais-bizy|Fluxos operacionais]]
9. [[arquitetura-e-guardrails-bizy|Arquitetura e guardrails]]
10. [[prioridades-lancamento-bizy|Prioridades P0/P1/P2]]

Se a tarefa for tecnica, consulte depois:

- [[inventario-backend-api]]
- [[inventario-dados-prisma]]
- [[inventario-frontend]]
- [[inventario-operacao-testes]]
- [[memoria-viva-bizy]]

## Como Pensar o Produto

Bizy deve ser pensado como tres sistemas visiveis, Team, Market e Learning, apoiados por Anani como nucleo interno invisivel. Nao tratar Bizy como app de deploy, dashboard generico, bot de WhatsApp ou vitrine de IA.

O eixo principal e:

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
```

Live, loja publica, social inbox, campanhas e afiliados sao canais de entrada e aceleradores comerciais. Eles alimentam o mesmo nucleo.

Anani nao e canal de entrada. Anani e governanca interna: observa, cruza sinais, aplica politicas, cria incidentes/quarentenas e prepara acoes seguras.

## Regra de Memoria Continua

Antes da resposta final, verificar se a mudanca feita criou conhecimento duravel. Se criou, atualizar a wiki seguindo [[protocolo-atualizacao-memoria-bizy]].

Se a memoria nao responder uma consulta, procurar no codigo, atualizar a nota correta e entao responder.

## Perguntas Antes de Implementar

- Que dor real da loja isto resolve?
- Isto ajuda vender, atender, cobrar, entregar, recuperar ou medir?
- Qual modulo de [[mapa-de-modulos-bizy]] esta envolvido?
- Qual entidade de [[dominio-e-entidades-bizy]] e afetada?
- O dado pertence a um `Negocio`?
- Existe permissao por papel?
- Existe auditoria quando mexe com dinheiro, privacidade, stock, comissao ou permissao?
- Se a automacao falhar, que [[mapa-de-modulos-bizy#Tarefas e Recuperacao|tarefa humana]] fica?
- O modulo pode estar desativado?
- A UI deve esconder esta funcionalidade se o modulo estiver desligado?
- Ha estado vazio com proxima acao?
- Ha teste ou caminho minimo de verificacao?

## Coisas Que Nao Deve Fazer

> [!warning] Guardrails
> Estes pontos evitam que o projeto volte a virar painel tecnico ou automacao perigosa.

- Nao centralizar tudo no `index`.
- Nao transformar deploy na memoria principal.
- Nao criar telas decorativas.
- Nao criar menu para modulo sem fluxo real.
- Nao mostrar tokens, providers, n8n e debug a vendedor comum.
- Nao mostrar Anani a tenant comum; acesso direto so para governanca Bizy.
- Nao confirmar pagamento automaticamente sem regra e permissao.
- Nao conceder desconto, resolver reclamacao, cancelar pedido ou prometer entrega sem trilha.
- Nao usar dados pessoais em tracking, URL, cookies ou identificadores publicos.
- Nao escrever regra pesada em handler HTTP se deve estar em use case.
- Nao quebrar isolamento por `negocioId`.
- Nao depender de Evolution, n8n ou IA como fonte de verdade.

## Onde Colocar Conhecimento Novo

- Produto, visao e principios: atualizar [[visao-produto-bizy]]; dores/qualidades ficam em [[dores-e-qualidades-bizy]].
- Novo modulo ou capacidade: atualizar [[mapa-de-modulos-bizy]].
- Nova entidade ou regra de dados: atualizar [[dominio-e-entidades-bizy]] e [[inventario-dados-prisma]].
- Novo fluxo: atualizar [[fluxos-operacionais-bizy]].
- Nova prioridade/lacuna: atualizar [[prioridades-lancamento-bizy]].
- Nova API: atualizar [[inventario-backend-api]].
- Nova tela: atualizar [[inventario-frontend]].
- Operacao/deploy/testes: atualizar [[inventario-operacao-testes]].
- Incidente ou decisao recente: atualizar [[memoria-viva-bizy]] e [[log]].

## Mini Checklist de Entrega

- [ ] A mudanca respeita a visao em [[visao-produto-bizy]].
- [ ] A dor resolvida esta clara em [[dores-e-qualidades-bizy]].
- [ ] O modulo esta ligado ao mapa em [[mapa-de-modulos-bizy]].
- [ ] Entidades e dados respeitam [[dominio-e-entidades-bizy]].
- [ ] Guardrails de [[arquitetura-e-guardrails-bizy]] foram seguidos.
- [ ] Prioridade P0/P1/P2 foi considerada em [[prioridades-lancamento-bizy]].
- [ ] A wiki foi atualizada se a mudanca criou conhecimento duravel.
