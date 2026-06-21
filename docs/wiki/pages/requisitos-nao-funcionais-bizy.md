---
title: Requisitos Nao Funcionais do Bizy
aliases:
  - RNF Bizy
  - Requisitos Nao Funcionais
tags:
  - bizy/requisitos
  - bizy/rnf
status: ativo
updated: 2026-06-17
---

# Requisitos Nao Funcionais do Bizy

> [!info] Fonte principal
> Sintese organizada por area a partir de `docs/RF-RNF-RN-EMEUV1.md` v1.107 (110 RNFs).
> Para RNFs do Bizy Market, ver [[requisitos-bizy-market]].

## Cobertura Geral

| Metrica | Valor |
|---|---|
| Total de RNFs | 110 (RNF01–RNF110) |
| Implementados `[x]` | ~85 (77%) |
| Parciais `[~]` | ~23 (21%) |
| Planeados `[ ]` | ~3 (3%) |

---

## 4.1 Tecnologia e Arquitetura (RNF01–RNF07)

| ID | Resumo | Estado |
|---|---|---|
| RNF01 | Backend em Node.js, TypeScript e Fastify | `[x]` |
| RNF02 | Frontend em React, Vite e TypeScript | `[x]` |
| RNF03 | PostgreSQL com Prisma | `[x]` |
| RNF04 | Dominio separado de HTTP, Prisma, React, TikTok, n8n e Evolution | `[x]` |
| RNF05 | Regras em classes de use-case, nao em handlers HTTP | `[x]` |
| RNF06 | Providers externos atras de contratos (`LiveCommentProvider`, `ProvedorWhatsApp`, `ProvedorSms`) | `[x]` |
| RNF07 | Camada HTTP modular registrada por manifesto | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.2 Performance e Tempo de Resposta (RNF08–RNF12)

| ID | Resumo | Estado |
|---|---|---|
| RNF08 | Comentarios no painel em ate 3s | `[x]` |
| RNF09 | Reserva a partir de comentario valido em ate 10s | `[x]` |
| RNF10 | Envio de SMS em ate 30s | `[x]` |
| RNF11 | Acoes criticas com poucos cliques e feedback visual imediato | `[x]` |
| RNF12 | Bundle adequado para conexoes comuns de Angola | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.3 Confiabilidade e Resiliencia (RNF13–RNF18)

| ID | Resumo | Estado |
|---|---|---|
| RNF13 | Modo manual como contingencia quando provider falhar | `[x]` |
| RNF14 | Retry automatico por outbox para n8n | `[x]` |
| RNF15 | Reservas e comentarios persistidos (nao depender de memoria) | `[x]` |
| RNF16 | Agendador de expiracao periodico e configuravel | `[x]` |
| RNF17 | Tolerar falhas do n8n sem perder eventos | `[x]` |
| RNF18 | Continuar operacao pelo modo manual se TikTok falhar | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.4 Seguranca (RNF19–RNF29)

| ID | Resumo | Estado |
|---|---|---|
| RNF19 | Endpoints operacionais exigem sessao autenticada | `[x]` |
| RNF20 | Codigo SMS armazenado como hash | `[x]` |
| RNF21 | Token de sessao como hash no backend | `[x]` |
| RNF22 | Backend → n8n usa HMAC SHA-256 | `[x]` |
| RNF23 | n8n → backend exige `X-EMEU-N8N-TOKEN` | `[x]` |
| RNF24 | Webhook Evolution exige token configurado | `[x]` |
| RNF25 | `LOGIN_SMS_DEV_MODE` desativado em producao | `[x]` |
| RNF26 | CORS restrito a origem real do frontend | `[x]` |
| RNF27 | Rate limit em endpoints HTTP sensiveis | `[x]` |
| RNF28 | Rate limit distribuido por Redis REST/Upstash com fallback local | `[x]` |
| RNF29 | Sessao HttpOnly/SameSite com compatibilidade Bearer temporaria | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.5 Dados, Auditoria e Observabilidade (RNF30–RNF35)

| ID | Resumo | Estado |
|---|---|---|
| RNF30 | Comentario original mantido como evidencia | `[x]` |
| RNF31 | Eventos internos registrados para auditoria | `[x]` |
| RNF32 | Mensagens WhatsApp auditaveis | `[x]` |
| RNF33 | Timestamps para medir tempos operacionais | `[x]` |
| RNF34 | Metricas de saude da outbox n8n | `[x]` |
| RNF35 | Logs estruturados e centralizados | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.6 Usabilidade e Acessibilidade (RNF36–RNF40)

| ID | Resumo | Estado |
|---|---|---|
| RNF36 | Interface responsiva (desktop, tablet, mobile) | `[x]` |
| RNF37 | Onboarding de vendedor em ate 5 minutos | `[x]` |
| RNF38 | Mensagens claras de erro, sucesso e carregamento | `[x]` |
| RNF39 | Navegacao principal consistente entre paginas | `[x]` |
| RNF40 | Destaque de estados criticos (expiracao, pagamento pendente) | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.7 Qualidade e Testes (RNF41–RNF47)

| ID | Resumo | Estado |
|---|---|---|
| RNF41 | Validacao de entradas HTTP com Zod | `[x]` |
| RNF42 | TypeScript em modo estrito | `[x]` |
| RNF43 | Testes para parser, reservas, autenticacao, n8n, SMS, Evolution, media, PDF | `[x]` |
| RNF44 | Testes de integracao HTTP para fluxo critico | `[x]` |
| RNF45 | Testes E2E para login, catalogo, comentario, reserva e pagamento | `[x]` |
| RNF46 | Concorrencia de reservas testada com PostgreSQL real | `[x]` |
| RNF47 | Build e typecheck devem passar antes de publicar | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.8 Deploy e Operacao (RNF48–RNF54)

| ID | Resumo | Estado |
|---|---|---|
| RNF48 | Docker Compose para ambiente integrado | `[x]` |
| RNF49 | `prisma migrate deploy` em producao | `[x]` |
| RNF50 | Imagens n8n/Evolution fixadas por versao/digest | `[x]` |
| RNF51 | PostgreSQL e Redis nao expostos publicamente | `[x]` |
| RNF52 | Staging com HTTPS e dominio proprio | `[x]` |
| RNF53 | Segredos nao versionados no repo | `[x]` |
| RNF54 | Comprovativos guardados em raiz controlada, servidos por rota autenticada | `[x]` |

**Estado**: Totalmente implementado.

---

## 4.9 Operabilidade do CRM Completo (RNF55–RNF72)

Acoes principais em 2 cliques/toques, responsividade 360px, paginacao, busca global rapida, controlo de acesso, auditoria de exportacoes, backups, separacao comercial/tecnica, design system padronizado, `shadcn/ui`.

| ID | Resumo | Estado |
|---|---|---|
| RNF55 | Acoes principais em 2 cliques (desktop) / 2 toques (mobile) | `[x]` |
| RNF56 | Responsivo em 360px sem scroll horizontal | `[x]` |
| RNF57 | Paginacao, filtros e busca sem travar com 10k+ registros | `[~]` |
| RNF58 | Busca global em ate 1s para bases pequenas | `[x]` |
| RNF59 | Dados pessoais protegidos por papel e auditoria | `[~]` |
| RNF60 | Exportacoes registram usuario, filtro, data e quantidade | `[x]` |
| RNF61 | Backups PostgreSQL com scripts e media | `[x]` |
| RNF62 | Interface distingue operacao comercial de configuracao tecnica | `[x]` |
| RNF63 | Paginas sem funcionalidade nao publicadas na navegacao | `[x]` |
| RNF64 | Design system padronizado (cards, listas, tabelas, badges, estados vazios) | `[x]` |
| RNF65 | Textos curtos e orientados a acao | `[~]` |
| RNF66 | Metricas de funil sem dependencia de servicos externos | `[~]` |
| RNF67 | Campanhas respeitam limites, opt-out, consentimento | `[~]` |
| RNF68 | Automacoes falham de forma segura (tarefa humana) | `[~]` |
| RNF69 | Idempotencia em importacoes, campanhas, webhooks | `[~]` |
| RNF70 | Evolucao modular por dominios | `[x]` |
| RNF71 | `shadcn/ui` como fonte padrao de componentes | `[x]` |
| RNF72 | Componentes proprios so quando nao existir primitivo shadcn | `[x]` |

---

## 4.10 Operabilidade CRM+ Social Commerce (RNF73–RNF95)

Loja publica mobile-first, checkout sem cookies, modulos separados, outbox/event bus, idempotencia, adaptadores por provider, motor de politica WhatsApp, opt-out, minimizacao de dados, cache seguro.

| ID | Resumo | Estado |
|---|---|---|
| RNF73 | Loja publica rapida em mobile 360px | `[ ]` |
| RNF74 | Checkout e WhatsApp nao dependem de tracking/cookies | `[x]` |
| RNF75 | Modulos separados por fronteiras claras | `[~]` |
| RNF76 | Eventos de tracking/automacao usam outbox sem bloquear operacao principal | `[~]` |
| RNF77 | Webhooks sociais e WhatsApp idempotentes | `[~]` |
| RNF78 | Suporte a limitacoes de providers por adaptadores e fallback manual | `[~]` |
| RNF79 | Motor de politica WhatsApp testavel e independente do provider | `[~]` |
| RNF80 | Categoria WhatsApp rastreavel para auditoria e custo | `[~]` |
| RNF81 | Validacao automatica de categoria antes do provider | `[~]` |
| RNF82 | Opt-out e consentimento antes de marketing | `[~]` |
| RNF83 | Cookies/tracking sem dados pessoais sensiveis | `[x]` |
| RNF84 | Texto claro sobre tracking/privacidade na loja publica | `[ ]` |
| RNF85 | Relatorios de afiliados sem dados privados desnecessarios | `[~]` |
| RNF86 | Calculo de comissao reprocessavel e auditavel | `[~]` |
| RNF87 | Eventos analiticos eficientes para 100k+ eventos | `[~]` |
| RNF88 | Paginas publicas cacheáveis sem expor dados privados | `[x]` |
| RNF89 | UI oculta modulos nao ativados, preserva dados | `[ ]` |
| RNF90 | Automacao falha segura (tarefa humana com contexto) | `[~]` |
| RNF91 | Logs operacionais compreensiveis pelo dono do negocio | `[x]` |
| RNF92 | Importacoes/sincronizacoes com relatorio de resultado | `[~]` |
| RNF93 | Links rastreaveis estaveis e resilientes | `[x]` |
| RNF94 | Pausar campanhas/afiliados/automacoes sem desligar a loja | `[~]` |
| RNF95 | Decisoes automaticas com baixa confianca explicaveis e encaminhadas para humano | `[~]` |

---

## 4.11 Preparacao Tecnica Backend CRM+ (RNF96–RNF110)

Indices por negocioId, isolamento multi-tenant, transacoes criticas, jobs reprocessaveis, paginacao, rate limit publico, feature flags, payloads versionados, auditoria legivel, dados minimizados, testes de regressao.

| ID | Resumo | Estado |
|---|---|---|
| RNF96 | Indices por `negocioId`, estado e data | `[~]` |
| RNF97 | Nenhuma consulta retorna dados de outro negocio sem permissao | `[~]` |
| RNF98 | Operacoes criticas usam transacao Prisma | `[~]` |
| RNF99 | Jobs reprocessaveis sem duplicar dados | `[~]` |
| RNF100 | APIs com paginacao, filtros e ordenacao previsivel | `[~]` |
| RNF101 | Rate limit publico separado do autenticado | `[x]` |
| RNF102 | Motor de politica WhatsApp testavel sem provider externo | `[x]` |
| RNF103 | Feature flags/modulos por negocio sem deploy | `[~]` |
| RNF104 | Payloads estaveis e versionados | `[~]` |
| RNF105 | Auditoria e logs compreensiveis pelo dono/admin | `[~]` |
| RNF106 | Dados sensiveis minimizados em logs, URLs, cookies | `[~]` |
| RNF107 | Testes impedem uso de identificadores globais entre negocios | `[~]` |
| RNF108 | Migracao gradual reservas → pedidos sem quebrar lives | `[~]` |
| RNF109 | Fronteiras de dominio claras por modulo | `[~]` |
| RNF110 | Falhas de provider externo resultam em tarefa/retry, nunca perda silenciosa | `[~]` |

---

## Ligacoes

- [[requisitos-funcionais-bizy]] — RFs do Bizy
- [[regras-de-negocio-bizy]] — Regras de Negocio do Bizy
- [[requisitos-bizy-market]] — RNFs do Bizy Market
- [[arquitetura-e-guardrails-bizy]] — Arquitetura e Guardrails
- `docs/RF-RNF-RN-EMEUV1.md` — Documento fonte completo
