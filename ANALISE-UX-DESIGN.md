# Analise de Estrutura, Design e UX — EMeu

Data da analise: 2026-05-03

---

## Indice

1. [Visao geral da arquitectura frontend](#1-visao-geral)
2. [Lado publico — Landing page e Login](#2-lado-publico)
3. [Lado interno — Painel de administracao](#3-lado-interno)
4. [Design system actual](#4-design-system)
5. [Problemas identificados](#5-problemas)
6. [Recomendacoes por prioridade](#6-recomendacoes)

---

## 1. Visao geral

### Ficheiros e organizacao

```
frontend/src/
  api.ts                  → Cliente HTTP centralizado + gestao de sessao
  tipos.ts                → Todos os tipos TypeScript (23 tipos/interfaces)
  utilidades.ts           → Formatacao e traducao (11 funcoes puras)
  rotasApp.tsx            → Manifesto unico de rotas e navegacao
  App.tsx                 → Router com guarda de autenticacao
  componentes/
    Shell.tsx             → Sidebar, CabecalhoPagina, CartaoIndicador, EstadoVazio
  paginas/
    Home.tsx              → Landing page publica (7 seccoes, ~860 linhas)
    Login.tsx             → Autenticacao por telefone
    Painel.tsx            → Dashboard operacional
    Catalogo.tsx          → CRUD de pecas
    Comentarios.tsx       → Feed de comentarios em tempo real
    Reservas.tsx          → Gestao de reservas e pagamentos
    Conversas.tsx         → Chat operacional com contexto
    ConexaoWhatsApp.tsx   → QR Code e instancias Evolution
    Agentes.tsx           → Agentes de automacao
    IntegracaoN8n.tsx     → Workflows e contrato n8n
    Configuracoes.tsx     → Parametros operacionais read-only
  estilos.css             → Design system completo (2039 linhas)
```

### Pontos fortes da organizacao actual

- **Manifesto unico de rotas** (`rotasApp.tsx`): elimina duplicacao entre router e sidebar
- **Tipos centralizados** (`tipos.ts`): um unico ficheiro para todo o contrato frontend/backend
- **Utilitarios puros** (`utilidades.ts`): funcoes sem estado, faceis de testar
- **Shell reutilizavel**: `CabecalhoPagina`, `CartaoIndicador` e `EstadoVazio` usados em todas as paginas
- **CSS com custom properties**: sistema coerente de cores, sombras, raios e tipografia

---

## 2. Lado publico — Landing page e Login

### 2.1 Landing page (Home.tsx)

**O que funciona bem:**

- 7 seccoes bem estruturadas: Hero, ComoFunciona, Funcionalidades, Beneficios, MockupsPainel, Integracoes, CtaFinal
- Animacoes de scroll com IntersectionObserver (componente `AnimarEntrada`)
- Mockup interactivo no hero com comentarios animados — mostra o produto a funcionar
- Tabs interactivas para mostrar cada pagina do painel (7 tabs)
- Cabecalho fixo com blur e resposta ao scroll
- Indicadores de prova social no hero ("2.400+ reservas", "98% precisao", "<3s tempo")
- Seccao escura (funcionalidades) quebra monotonia visual
- CTA claro em dois pontos: hero e seccao final
- Responsivo com 4 breakpoints (1280, 1024, 768, 480)
- `prefers-reduced-motion` respeitado

**Problemas de design e UX:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| P1 | **Sem hamburger menu em mobile** — o `home-nav` faz `display: none` abaixo de 768px. O utilizador perde acesso a navegacao entre seccoes. | Alto | estilos.css:2003 |
| P2 | **Hero sem imagem real do produto** — o mockup e composto por divs e CSS. Funciona como prova de conceito mas falta peso visual de um screenshot ou video real. | Medio | Home.tsx:143-219 |
| P3 | **Indicadores de prova social sao ficticios** ("2.400+ reservas") — se um potencial cliente verificar e nao forem reais, destroi confianca. | Alto | Home.tsx:125-140 |
| P4 | **Sem seccao de precos/planos** — o CTA diz "Criar conta gratis" mas nao existe informacao de quanto custa. O visitante nao sabe se e gratis para sempre, freemium, ou trial. | Alto | Home.tsx:766-787 |
| P5 | **Sem depoimentos/testimonials** — nenhuma prova social de utilizadores reais. | Medio | — |
| P6 | **"Criar conta" e "Entrar" ambos levam a /login** — o utilizador nao consegue distinguir registo de login. | Medio | Home.tsx:72-73 |
| P7 | **Sem FAQ** — perguntas obvias ficam sem resposta (funciona com Instagram? preciso de computador? quanto custa?) | Baixo | — |
| P8 | **Mockup dos tabs nao mostra screenshot real** — mostra dados estaticos fabricados dentro de divs. Um screenshot do painel real seria mais convincente. | Medio | Home.tsx:604-721 |
| P9 | **Logo usa hack de background-image** — o `img` tem 1px e opacity 0, o logo e renderizado via CSS `background`. Isto significa que o logo nao aparece em modo de impressao, leitores de ecra podem ter dificuldade, e nao funciona como imagem partilhavel. | Baixo | estilos.css:276-286 |
| P10 | **Rodape minimalista demais** — falta contacto, termos, politica de privacidade, redes sociais. Para um SaaS angolano, um numero de WhatsApp no rodape e quase obrigatorio. | Medio | Home.tsx:789-818 |

### 2.2 Login (Login.tsx)

**O que funciona bem:**

- Fluxo de 2 etapas claro: telefone → codigo SMS
- Redirect automatico se ja tem token
- Feedback de estado em todas as fases ("A enviar...", "A validar...")
- Modo dev mostra o codigo directamente (util para desenvolvimento)
- Design visual limpo: gradiente diagonal, cartao centrado, botao "Voltar"
- Valores por defeito sensatos para teste rapido (923456789)

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| L1 | **Sem validacao de telefone no frontend** — aceita qualquer string. O backend valida, mas o feedback e lento (roundtrip). | Medio | Login.tsx:97-102 |
| L2 | **Sem indicador de carregamento visual** — so `disabled` no botao. Falta spinner ou animacao. | Baixo | Login.tsx:105-108 |
| L3 | **Sem reenviar codigo** — se o SMS nao chega, o unico recurso e "Alterar telefone" e recomecar. | Medio | Login.tsx:132-134 |
| L4 | **Sem temporizador de expiracao visivel** — o backend diz `minutosExpiracao` mas nao ha countdown. O utilizador nao sabe quanto tempo tem. | Baixo | Login.tsx:38 |
| L5 | **Telefone pre-preenchido com 923456789** — bom para dev, mau para producao. Deveria ser vazio em producao. | Baixo | Login.tsx:8 |

---

## 3. Lado interno — Painel de administracao

### 3.1 Shell e navegacao (Shell.tsx + rotasApp.tsx)

**O que funciona bem:**

- Sidebar recolhivel com transicao suave
- Seccoes agrupadas ("Principal" e "Automacao")
- Rotulo da seccao em uppercase com letra pequena — hierarquia clara
- Usuario com avatar, nome e telefone no fundo
- Botao de sair posicionado correctamente
- NavLink com `end` para evitar matchs parciais
- Em tablet/mobile, a sidebar transforma-se em barra horizontal com scroll
- Conteudo tem `max-width: 1400px` e centra automaticamente

**Problemas de navegacao:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| N1 | **9 itens na sidebar e muito** — a seccao "Automacao" tem 4 itens (WhatsApp, Agentes, n8n, Configuracoes) que a maioria dos vendedores nunca vai usar no dia-a-dia. Isto dilui o foco. | Alto | rotasApp.tsx:46-55 |
| N2 | **Sem breadcrumbs** — quando o utilizador esta em `/app/n8n`, nao ha indicacao visual da hierarquia. | Baixo | — |
| N3 | **Sem notificacoes/badge na sidebar** — o utilizador nao sabe que tem reservas a expirar ou comentarios em revisao sem abrir cada pagina. | Medio | Shell.tsx:42-59 |
| N4 | **Sidebar nao persiste estado recolhida** — ao mudar de pagina o estado perde-se (useState). Deveria usar localStorage. | Baixo | Shell.tsx:14 |
| N5 | **Em mobile, a barra horizontal esconde rotulos das seccoes** — o `.sidebar-secao-label` faz `display: none`, ficam 9 icones sem agrupamento. | Medio | estilos.css:1984 |
| N6 | **Sem guarda de autenticacao reactiva** — se o token expira durante o uso, o utilizador so descobre no proximo pedido API. Deveria haver um interceptor que redireciona para /login. | Medio | App.tsx:7-9 |

### 3.2 Dashboard (Painel.tsx)

**Pontos fortes:**
- Layout 3 colunas para accoes rapidas (Conectar live, Comentario manual, Actividade)
- Cartao de receita com gradiente, barra de progresso e taxa de liquidacao
- 5 indicadores KPI (conversao, expiracao, pagamento, stock, fila)
- SSE + polling de 15s como fallback — resiliencia real
- Formularios de teste integrados no dashboard — accao imediata

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| D1 | **Dashboard e mais "painel de controlo tecnico" do que "cockpit de vendas"** — o vendedor quer ver: quanto vendeu, o que falta pagar, proxima reserva a expirar. A seccao de "Conectar live" e "Comentario manual" ocupa 2/3 do espaco visivel. | Alto | Painel.tsx:173-268 |
| D2 | **Sem grafico de evolucao** — nenhuma visualizacao temporal (vendas por hora, comentarios por live, etc). Tudo sao numeros estaticos. | Medio | — |
| D3 | **Sem lista de actividade recente** — o "Resumo ao vivo" mostra 4 numeros, mas nao mostra *o que aconteceu* (ex: "Maria reservou peca #4 ha 2 min"). | Medio | Painel.tsx:242-268 |
| D4 | **"Iniciar captacao" no dashboard pode ser perigoso** — um clique acidental inicia a live. Deveria ter confirmacao. | Baixo | Painel.tsx:175-206 |

### 3.3 Catalogo (Catalogo.tsx)

**Pontos fortes:**
- Tabela limpa com 6 colunas
- Formulario de criacao togglable
- Busca por nome ou codigo
- Badge colorido para codigo da peca

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| C1 | **Sem edicao de pecas** — so cria. Nao pode corrigir um preco errado, mudar stock, ou desactivar peca. Import `Edit3` nao e usado. | Alto | Catalogo.tsx:1 |
| C2 | **Sem confirmacao de eliminacao** — import `Trash2` nao e usado, nao ha opcao de eliminar. | Medio | Catalogo.tsx:1 |
| C3 | **Sem fotos** — o tipo `Peca` tem `fotos: string[]` mas o catalogo nao mostra nem permite upload. Para vendas em live, a imagem da peca e critica. | Alto | tipos.ts:15 |
| C4 | **Sem paginacao** — se o vendedor tem 200+ pecas, a tabela carrega tudo. | Baixo | — |
| C5 | **Sem indicacao de stock reservado** — mostra `quantidade` mas nao quanto esta bloqueado por reservas activas. | Medio | — |

### 3.4 Comentarios (Comentarios.tsx)

**Pontos fortes:**
- Feed em tempo real via SSE
- 4 indicadores (total, validos, revisao, confianca)
- Filtro por estado + busca por texto
- Card com avatar, username, texto, selo de estado, badges de detalhe

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| CO1 | **Sem accao sobre comentarios em revisao** — o utilizador ve "Revisao" mas nao pode aprovar, rejeitar, ou corrigir a interpretacao. | Alto | Comentarios.tsx:98-121 |
| CO2 | **Sem audio/notificacao de novo comentario** — em tempo real mas silencioso. O vendedor pode estar a falar na live e perder um comentario importante. | Medio | — |
| CO3 | **Sem auto-scroll para novos comentarios** — os novos ficam no topo, mas se o utilizador esta a ler um comentario antigo, nao percebe que chegaram novos. | Baixo | — |

### 3.5 Reservas (Reservas.tsx)

**Pontos fortes:**
- SSE para 5 tipos de evento
- Tabela com dados reais (peca, cliente, pagamento, prazo, accoes)
- Accoes directas: confirmar pagamento, cancelar
- Filtro por estado + busca
- Formatacao de tempo restante humanizada

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| R1 | **Sem destaque visual para reservas a expirar** — uma reserva com 2 min restantes parece igual a uma com 28 min. Deveria ter cor/animacao de urgencia. | Medio | — |
| R2 | **Sem detalhes expandiveis** — nao mostra comentario original, historico de estados, ou mensagens WhatsApp enviadas. | Medio | — |
| R3 | **Pecas carregadas mas so usadas como lookup** — `setPecas` e definido mas `pecas` nunca e usado directamente na UI. O `obterPrecoDaPeca` importado nao e chamado na tabela. | Baixo | Reservas.tsx:28 |

### 3.6 Conversas (Conversas.tsx)

**Pontos fortes:**
- Layout classico de messenger: lista a esquerda, chat a direita
- Avatar com badge de mensagens nao lidas
- Preview com hora e tags de estado/peca
- Accoes operacionais integradas (confirmar pagamento, cancelar — directamente no chat)
- Traduccao de estados contextual
- SSE para 5 tipos de evento

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| CV1 | **Sem input de mensagem** — o vendedor nao pode responder. O chat e read-only. Para uma plataforma de atendimento, isto e uma limitacao severa. | Alto | Conversas.tsx:114-187 |
| CV2 | **Sem indicador de "a escrever..."** — nao ha typing indicator. | Baixo | — |
| CV3 | **Lista nao ordena por mais recente** — depende da ordem do backend. | Baixo | Conversas.tsx:84-111 |

### 3.7 WhatsApp (ConexaoWhatsApp.tsx)

**Pontos fortes:**
- Fluxo completo: criar instancia → conectar → QR Code → estado
- Mostra QR Code e pairing code directamente no painel
- Accoes claras por instancia (Conectar, Estado, Padrao, Remover)
- Link para Evolution Manager externo

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| W1 | **Sem polling de estado do QR** — apos clicar "Conectar", o utilizador precisa de clicar "Estado" manualmente para saber se ja pareou. | Medio | ConexaoWhatsApp.tsx:197-201 |
| W2 | **"Remover" sem confirmacao** — um clique elimina a instancia. Accao destrutiva sem dialogo. | Alto | ConexaoWhatsApp.tsx:208 |

### 3.8 Agentes (Agentes.tsx)

**Pontos fortes:**
- Cards visuais com icone, titulo, estado, descricao
- Detalhes estruturados (gatilho, accao, canal)
- Rodape com origem e evidencia
- SSE para actualizacao em tempo real

**Sem problemas significativos** — esta pagina e informativa/read-only por design.

### 3.9 Integracao n8n (IntegracaoN8n.tsx)

**Pontos fortes:**
- Mostra workflows, contrato de automacao, e guardrails
- Tags de eventos por workflow
- Stats de endpoints e guardrails por workflow
- Link para abrir n8n externamente

**Sem problemas significativos** — pagina informativa bem executada.

### 3.10 Configuracoes (Configuracoes.tsx)

**Pontos fortes:**
- Read-only com dados reais do backend
- Agrupamento por categoria com icones
- Mostra estado de cada configuracao (Ativa/Pendente/Desativada)
- Seccao de integracoes separada

**Problemas:**

| # | Problema | Impacto | Onde |
|---|---------|---------|------|
| CF1 | **100% read-only** — nao permite alterar nenhum parametro. O vendedor nao pode ajustar tempo de expiracao, URL do webhook, etc. Faz sentido para MVP, mas limita autonomia. | Medio | — |

---

## 4. Design system actual

### 4.1 Paleta de cores

A paleta verde e profissional e diferenciadora (a maioria dos SaaS usa azul). O verde remete a dinheiro/sucesso e encaixa no contexto de vendas.

```
Primarias:   verde-900 (#0a1f1b) → verde-50 (#edfff6) — 10 tons
Semanticas:  sucesso (#059669), atencao (#d97706), perigo (#dc2626), info (#2563eb)
Superficies: fundo (#f8f9fa), superficie (#fff), fria (#f4f7f5), quente (#fdfcf9)
Texto:       primario (#111827), secundario (#6b7280), terciario (#9ca3af)
```

**Avaliacao:** A paleta e completa e coerente. As 4 cores semanticas cobrem todos os estados. A hierarquia de texto com 3 niveis funciona bem.

### 4.2 Tipografia

- Familia: Inter (UI), JetBrains Mono (codigo)
- Hierarquia: titulos com `font-weight: 800`, corpo `0.88rem`, labels `0.82rem`, micro `0.72rem`
- Numeros: `font-variant-numeric: tabular-nums` em todos os contadores — alinhamento perfeito

**Avaliacao:** Excelente. Inter e uma das melhores fontes para dashboards. A escala de tamanhos e consistente.

### 4.3 Espacamento e layout

- Custom properties para raios: `--raio-sm` (6px) ate `--raio-full` (9999px)
- 5 niveis de sombra: `--sombra-sm` ate `--sombra-2xl`
- Transicoes: rapida (120ms), normal (180ms), lenta (300ms)
- Grid com `max-width: 1200px` na landing, `1400px` no painel

**Avaliacao:** Consistente. Os tokens de design estao bem definidos e sao usados de forma uniforme.

### 4.4 Componentes reutilizaveis

| Componente | Onde | Reutilizacao |
|------------|------|-------------|
| `CartaoIndicador` | Shell.tsx | 7 paginas |
| `CabecalhoPagina` | Shell.tsx | 9 paginas |
| `EstadoVazio` | Shell.tsx | 8 paginas |
| `AnimarEntrada` | Home.tsx | Apenas landing |
| `.selo` / `.selo-mini` | CSS | Todo o app |
| `.btn` / `.btn-icone` | CSS | Todo o app |
| `.cartao` | CSS | 6 paginas |
| `.campo-busca` | CSS | 3 paginas |

**Avaliacao:** Boa base, mas o numero de componentes React reutilizaveis e baixo (apenas 3). Varios padroes sao repetidos por CSS puro em vez de componentes (tabelas, formularios, barras de estado).

### 4.5 Responsividade

4 breakpoints bem definidos:
- `1280px`: metricas em 2 colunas, grid reduzido
- `1024px`: sidebar vira barra horizontal, hero em 1 coluna
- `768px`: tudo em 1 coluna, nav escondida, tabela sem header
- `480px`: padding reduzido, botoes full-width

**Avaliacao:** Cobertura boa mas incompleta. A sidebar mobile com 9 icones sem labels e confusa.

---

## 5. Resumo dos problemas por gravidade

### Criticos (impactam conversao ou operacao)

| # | Problema | Pagina |
|---|---------|--------|
| P1 | Sem menu mobile na landing | Home |
| P4 | Sem seccao de precos/planos | Home |
| N1 | 9 itens na sidebar — excesso para o vendedor | Shell |
| CV1 | Chat read-only — vendedor nao pode responder | Conversas |
| C1 | Sem edicao de pecas | Catalogo |
| C3 | Sem fotos de pecas | Catalogo |
| CO1 | Sem accao em comentarios de revisao | Comentarios |

### Importantes (afectam experiencia)

| # | Problema | Pagina |
|---|---------|--------|
| P3 | Indicadores ficticios no hero | Home |
| P6 | "Criar conta" e "Entrar" levam ao mesmo sitio | Home |
| P10 | Rodape sem contacto/WhatsApp | Home |
| D1 | Dashboard orientado a tecnico, nao a vendedor | Painel |
| D3 | Sem feed de actividade recente | Painel |
| N3 | Sem badges/notificacoes na sidebar | Shell |
| N6 | Sem intercepacao de token expirado | App |
| L1 | Sem validacao de telefone no frontend | Login |
| L3 | Sem opcao de reenviar codigo SMS | Login |
| R1 | Sem destaque para reservas urgentes | Reservas |
| W1 | Sem polling de QR Code | WhatsApp |
| W2 | Remover instancia sem confirmacao | WhatsApp |
| CO2 | Sem notificacao de novo comentario | Comentarios |

---

## 6. Recomendacoes por prioridade

### Prioridade 1 — Operacao viavel para o vendedor

Estas mudancas transformam o painel de "ferramenta tecnica" em "ferramenta de vendas":

1. **Reorganizar sidebar em 2 niveis:**
   - Nivel 1 (sempre visivel): Dashboard, Catalogo, Comentarios, Reservas, Conversas
   - Nivel 2 (sob "Configuracoes" ou "Avancado"): WhatsApp, Agentes, n8n, Configuracoes
   - Resultado: sidebar com 5+1 itens em vez de 9

2. **Adicionar edicao de pecas ao Catalogo:**
   - Backend ja tem contratos para isso no Prisma
   - Inline edit ou modal — evitar navegacao para outra pagina

3. **Adicionar accoes em comentarios de revisao:**
   - Botao "Aprovar" (processa como valido) e "Rejeitar" (marca como ignorado)
   - Backend: precisa de endpoint `POST /comentarios/:id/revisar`

4. **Dashboard orientado a vendas:**
   - Mover "Conectar live" e "Comentario manual" para um modal ou pagina separada
   - No espaco libertado, mostrar: ultimas 5 reservas, proximas a expirar, feed de actividade

### Prioridade 2 — Conversao na landing page

1. **Adicionar menu hamburger em mobile** (CSS puro, sem JS extra)
2. **Adicionar seccao de precos** — mesmo que seja "Contacte-nos", elimina a incerteza
3. **Substituir indicadores ficticios** por texto generico ("Milhares de reservas") ou remover ate ter dados reais
4. **Separar "Criar conta" de "Entrar"** — pelo menos visualmente, mesmo que o fluxo seja o mesmo
5. **Adicionar WhatsApp no rodape** — essencial para mercado angolano
6. **Adicionar FAQ** — 5-6 perguntas cobrindo: preco, plataformas suportadas, requisitos tecnicos, como comecar

### Prioridade 3 — Polish e confianca

1. **Validacao de telefone no frontend** — regex `^9[1-9]\d{7}$` antes de enviar
2. **Botao "Reenviar codigo"** com temporizador de 60s
3. **Destaque visual para reservas urgentes** — borda vermelha ou pulsacao quando `< 5 min`
4. **Confirmacao para accoes destrutivas** (Remover instancia WhatsApp, Cancelar reserva)
5. **Persistir estado da sidebar em localStorage**
6. **Polling automatico de QR Code** apos clicar "Conectar" (a cada 5s por 2 min)

### Prioridade 4 — Diferenciacao e maturidade

1. **Input de mensagem nas Conversas** — integrar com Evolution API para envio directo
2. **Upload de fotos de pecas** — essencial para catalogo visual
3. **Graficos no dashboard** — evolucao de vendas por live (pode ser uma lib leve como uPlot)
4. **Notificacoes na sidebar** — badge vermelho em "Reservas" quando ha pagamentos pendentes
5. **Interceptor de token expirado** — redireciona para login automaticamente
6. **Modo escuro** — o design system ja tem tokens preparados para isso

---

## Avaliacao final

### Para o cliente (visitante da landing page)

| Dimensao | Nota | Comentario |
|----------|------|-----------|
| Primeira impressao | 8/10 | Visual premium, animacoes suaves, mockup interactivo |
| Clareza da proposta | 9/10 | "Comentarios → vendas automaticas" e imediatamente claro |
| Confianca/credibilidade | 5/10 | Falta precos, depoimentos, metricas reais, contacto |
| Mobile | 4/10 | Sem menu de navegacao, layout funcional mas limitado |
| Conversao | 5/10 | CTA forte mas sem informacao de preco, o visitante nao sabe o que esperar |

### Para o utilizador (vendedor no painel)

| Dimensao | Nota | Comentario |
|----------|------|-----------|
| Navegacao | 7/10 | Clara mas com excesso de itens para o uso diario |
| Operacao de vendas | 7/10 | Dashboard + Reservas + Conversas cobrem o essencial |
| Gestao de catalogo | 4/10 | So cria pecas, nao edita, sem fotos |
| Tempo real | 9/10 | SSE em 5 paginas, actualizacao instantanea |
| Feedback de erros | 8/10 | Barra de estado em todas as paginas, mensagens claras |
| Mobile | 5/10 | Funcional mas a sidebar perde hierarquia |

### Para o administrador (configuracao avancada)

| Dimensao | Nota | Comentario |
|----------|------|-----------|
| WhatsApp | 8/10 | Fluxo completo de QR Code e instancias |
| Agentes e n8n | 9/10 | Informacao operacional detalhada e real |
| Configuracoes | 6/10 | Read-only, mostra mas nao permite ajustar |
| Visibilidade do sistema | 9/10 | Todas as integracoes, estados e metricas visiveis |

### Veredicto

O frontend esta **acima da media para um MVP**. O design system e profissional, a arquitectura e limpa, e o tempo real funciona. Os problemas principais nao sao de codigo — sao de **decisoes de produto**: a sidebar mostra funcionalidades avancadas ao mesmo nivel que operacoes diarias, o catalogo nao suporta edicao, e a landing page falta elementos de conversao.

Com as melhorias de Prioridade 1 e 2, o EMeu passa de "ferramenta tecnica funcional" para "produto SaaS pronto para vendedores".
