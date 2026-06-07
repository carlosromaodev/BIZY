---
title: Guia para IA no Bizy
aliases:
  - Guia para outra IA
  - Como continuar o Bizy
tags:
  - bizy/memoria
  - ia/guia
status: ativo
updated: 2026-05-27
---

# Guia para IA no Bizy

> [!abstract] Objetivo
> Esta nota orienta outra IA a trabalhar no Bizy usando a memoria do Obsidian em vez de reler o projeto inteiro.

## Ordem de Leitura

1. [[memoria-projeto-bizy|Memoria de Projeto do Bizy]]
2. [[protocolo-atualizacao-memoria-bizy|Protocolo de Atualizacao da Memoria]]
3. [[visao-produto-bizy|Visao e estrategia]]
4. [[dores-e-qualidades-bizy|Dores e qualidades]]
5. [[mapa-de-modulos-bizy|Mapa de modulos]]
6. [[dominio-e-entidades-bizy|Dominio e entidades]]
7. [[fluxos-operacionais-bizy|Fluxos operacionais]]
8. [[arquitetura-e-guardrails-bizy|Arquitetura e guardrails]]
9. [[prioridades-lancamento-bizy|Prioridades P0/P1/P2]]

Se a tarefa for tecnica, consulte depois:

- [[inventario-backend-api]]
- [[inventario-dados-prisma]]
- [[inventario-frontend]]
- [[inventario-operacao-testes]]
- [[memoria-viva-bizy]]

## Como Pensar o Produto

Bizy deve ser pensado como CRM+ de social commerce, nao como app de deploy, dashboard generico ou bot de WhatsApp.

O eixo principal e:

```text
Cliente -> Produto -> Pedido -> Pagamento -> Entrega
        -> Conversa -> Tarefa -> Recuperacao -> Relatorio
```

Live, loja publica, social inbox, campanhas e afiliados sao canais de entrada e aceleradores comerciais. Eles alimentam o mesmo nucleo.

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
- Nao confirmar pagamento automaticamente sem regra e permissao.
- Nao conceder desconto, resolver reclamacao, cancelar pedido ou prometer entrega sem trilha.
- Nao usar dados pessoais em tracking, URL, cookies ou identificadores publicos.
- Nao escrever regra pesada em handler HTTP se deve estar em use case.
- Nao quebrar isolamento por `negocioId`.
- Nao depender de Evolution, n8n ou IA como fonte de verdade.

## Onde Colocar Conhecimento Novo

- Produto, visao e principios: atualizar [[visao-produto-bizy]] ou [[dores-e-qualidades-bizy]].
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
