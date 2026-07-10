# SDD Dominio 12 - Frontend, UX e Design System

Status: ativo
Owner logico: Produto Frontend
Fontes: `docs/wiki/pages/identidade-visual-bizy-v2.md`, `docs/wiki/pages/inventario-frontend.md`, `frontend/src/rotasApp.tsx`
Ultima atualizacao: 2026-06-28

## 1. Proposito

Garantir que o frontend do Bizy seja operacional, mobile-first, coerente com a identidade `bizy.` e consistente entre CRM, Team, loja publica e Market.

## 2. Escopo

Entra: identidade visual v2, rotas, shell, navegacao, design system, paginas publicas, CRM, Market, Team, estados vazios, responsividade, acessibilidade e testes frontend.

Fica fora: regras de backend e dados, cobertas nos dominios funcionais.

## 3. Atores e Permissoes

- Comprador: usa loja publica, Market e checkout.
- Vendedor/atendente: usa CRM operacional.
- Dono/gestor: usa painel, relatorios, equipa, financas e configuracoes.
- Admin/Sistema: acessa auditoria, diagnosticos e integracoes tecnicas.

## 4. Entidades e Dados

Frontend consome entidades dos demais dominios via API. Tipos e helpers ficam em `frontend/src/tipos.ts`, `frontend/src/api.ts`, `frontend/src/lojas/` e modulos de dominio.

Dados sensiveis devem ser ocultados por papel e nunca renderizados em contexto publico.

## 5. Fluxos Principais

```text
Login -> Onboarding -> Shell CRM/Team -> Modulo -> Acao operacional
```

```text
Visitante -> Loja/Market -> Produto -> Checkout/WhatsApp -> Pedido
```

## 6. Requisitos Funcionais

- Navegacao por seccoes e modulos ativos.
- Shell desktop e mobile coerente.
- Componentes reutilizaveis em `BizyDesignSystem.tsx`.
- Rotas publicas sem sessao.
- Rotas comerciais com sessao e permissao.
- Estados vazios com proxima acao.
- Design v2 aplicado a novas telas.

## 7. Regras de Negocio

- Modulo desativado nao aparece como promessa vazia.
- Admin/Sistema nao aparece para vendedor comum.
- Tela operacional deve ajudar acao real.
- Loja e Market preservam identidade do fornecedor.

## 8. Requisitos Nao Funcionais

- Mobile 360px sem scroll horizontal.
- Texto cabe no container.
- Icones lucide quando houver equivalente.
- Componentes acessiveis.
- Performance adequada em conexoes comuns.
- Sem dados pessoais em URL publica.

## 9. APIs, Telas e Integracoes

Arquivos: `frontend/src/rotasApp.tsx`, `frontend/src/App.tsx`, `frontend/src/api.ts`, `frontend/src/componentes/BizyDesignSystem.tsx`, `frontend/src/estilos.css`, `frontend/src/lojas/`.

Telas: Home, Login, Painel, Live, Pedidos, Conversas, Clientes, Catalogo, Loja Publica, Market, Checkout, Equipa, Financas, Inteligencia, Auditoria.

## 10. Guardrails

- Nao criar landing page quando o pedido for ferramenta operacional.
- Nao usar cards dentro de cards sem necessidade.
- Nao usar texto visivel para explicar funcionalidades obvias.
- Nao expor tokens/providers/debug para perfis comerciais.
- Nao introduzir tema paralelo fora dos tokens v2.

## 11. Estado Atual

Frontend possui Vite/React, rotas publicas e privadas, design system v2, paginas CRM, Market/lojas, checkout e testes frontend. Identidade visual v2 esta documentada.

## 12. Lacunas

- P0: consistencia mobile 360px sem scroll horizontal e verificacao de modulos desativados na UI. SEO publico, checkout visual, privacidade/tracking e paginacao ja foram fechados.
- P1: Cliente 360, colecoes visuais, envio binario e revisao textual.
- P2: painel personalizavel e war rooms.

## 13. Testes e Verificacao

- Testes Vitest frontend.
- Testes de navegacao e design.
- Testes mobile.
- Playwright quando houver fluxo visual critico.
- Auditoria manual de contraste e sobreposicao.

## 14. Proximos Planos

- Spec de auditoria visual v2 por dominio.
- Spec de checkout publico.
- Spec de shell por papel/persona.
