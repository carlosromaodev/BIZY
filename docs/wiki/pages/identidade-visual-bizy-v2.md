---
title: Identidade Visual Bizy v2
aliases:
  - Direcao Visual Bizy v2
  - Bizy UI v2
tags:
  - bizy/wiki
  - bizy/design
  - bizy/frontend
status: ativo
updated: 2026-06-12
---

# Identidade Visual Bizy v2

Status: ativo
Ultima atualizacao: 2026-06-12
Fontes principais: `/home/carlos/Musicas/export/Bizy - Direcao Visual v2.html`, `Bizy - Logotipo Final.html`, `frontend/testes/Bizy — Direcao Visual v2.html`, `frontend/src/estilos.css`, `frontend/src/componentes/BizyDesignSystem.tsx`

## Intencao

Bizy v2 e um CRM organico, amigavel e comercial. A interface deve parecer operacional, mas humana: leve, clara, comercial e sem ruído visual. A referencia oficial e o HTML `Bizy - Direcao Visual v2.html`.

## Tokens Base

- Tipografia: `Geist` + `Geist Mono` para o CRM; `Plus Jakarta Sans` para interface publica.
- Neutros: tom **warm/creme** (nao cool/azulado). Os valores hex de referencia do design sao:
  - `--ink: #17211c` · `--ink-2: #46514b` · `--ink-3: #6e7873` · `--ink-4: #9aa39e`
  - `--line: #e7e4dc` · `--line-2: #f0ede6`
  - `--bg / --paper: #faf8f4` (creme off-white quente)
  - `--cream: #f4f1ea` (campo/input background)
  - `--surface: #ffffff` (cards, paineis)
  - ATENCAO: os tokens oklch anteriores usavam hue 250 (azul-frio) que estava errado. Corrigido em 2026-06-12 para os hex warm acima.
- Marca: verde esmeralda como primaria unica (`--green / --em: #0e8c68`, `--green-600`, `--green-deep`, `--green-ink: #085440`, `--green-tint: #e7f4ee`, `--green-tint2`).
- Semantica: amber para pendente/atencao, blue para em curso/informacao, rose para erro/urgencia, violet para destaque/VIP.
- Cor lime destaque: `--lime: #c9f25e` (usada em badges, ativo no drawer de modulos).
- Raios: controles 10-12px, cards 16-18px, sheets/modais 22px.
- Sombras: subtis, com borda fina; usar `--shadow-hairline`, `--shadow-panel` e `--shadow-floating`.

## Marca e Logotipo

A marca oficial e o wordmark lowercase `bizy.`. O texto usa Geist 700, letter spacing apertado de `-0.055em`, tinta `#0B1014` em fundos claros e branco em fundos escuros. O ponto final e sempre esmeralda `#16A07A`: o ponto e a marca.

O favicon/app icon oficial e um quadrado arredondado escuro `#0B1014` com `b.` em branco e ponto `#16A07A`. Dentro do CRM, porem, a navegacao e os cabecalhos usam apenas o wordmark completo `bizy.`; o simbolo `b.` nao aparece como marca de interface. O simbolo antigo de folha/check deixa de ser usado em logo, favicon, imagens de autenticacao ou superficies de produto.

No codigo, a fonte de verdade fica em `frontend/src/marca/bizy.tsx`, com ativos sincronizados em `frontend/public/bizy-logo.svg`, `frontend/public/bizy-favico.svg` e `frontend/public/favico.svg`.

## Cards

Cards devem ser brancos, com `1px solid var(--line)`, raio 16px ou 22px conforme densidade, sombra quase imperceptivel e hierarquia por conteudo, nao por blocos decorativos. Cards repetidos usam icone em chip semantico, titulo compacto, numero com `tabular-nums` e detalhes secundarios em `--ink-3`.

KPI principal pode usar preenchimento verde em gradiente esmeralda. Os restantes KPIs permanecem brancos com chip colorido.

## Modais, Sheets e Drawers

Modais e sheets seguem o mesmo ADN:

- fundo `var(--surface)`;
- borda `var(--line)`;
- raio 22px;
- shadow floating;
- cabecalho curto com titulo forte e descricao secundaria;
- botoes com icone quando a acao for concreta;
- no mobile, sheets sobem de baixo com grip visual e acoes ao alcance do polegar.

Dialogos de confirmacao usam icone grande em chip semantico e duas acoes claras. Sheets de formulario devem manter campos em grupos compactos e rodape fixo quando a acao principal precisar ficar sempre visivel.

## Navegacao

### CRM v3 — Shell Market (desktop)

O CRM desktop usa um header horizontal de 3 camadas (identidade Market, Jun 2026):

1. **Barra utilitaria** (`.crm-v3-util`): fundo escuro `var(--ink)`, links rapidos, nome do utilizador.
2. **Cabecalho** (`.crm-v3-head`): fundo branco com wordmark `bizy. CRM`, barra de busca global, acoes (avisos, criar, conta).
3. **Barra de tabs** (`.crm-v3-tabs`): tabs principais (Inicio, Pedidos, Atendimento, Clientes, Live, Studio, Relatorios) + botao Modulos + pill AO VIVO.

O botao **Modulos** expande inline na propria barra de tabs: ao hover ou click, o fundo escuro (`var(--ink)`) preenche a barra e mostra todas as rotas secundarias agrupadas por seccao (Vendas, CRM, Vitrine, Gestao). A transicao usa spring animation via framer-motion. Items activos ficam em `--lime`. Ao clicar num item ou afastar o rato, o drawer fecha e as tabs principais reaparecem.

Icones das tabs principais sao diferentes dos da sidebar legada:
- Inicio → Home, Pedidos → ShoppingBag, Atendimento → MessageSquare, Clientes → Users, Live → Video, Studio → Store, Relatorios → BarChart3.

### Mobile

No mobile, quatro atalhos ficam no dock nativo (Painel, Pedidos, Clientes, Chat) e todas as outras paginas aparecem no sheet "Mais".

O menu nao deve esconder paginas por falha temporaria do endpoint de modulos. Enquanto o estado de modulos nao estiver conhecido, a navegacao deve mostrar a superficie completa do produto.

## Atendimento

Atendimento deve parecer uma inbox comercial:

- coluna esquerda com tabs de estado, busca e cards de conversa;
- thread central com cabecalho, contexto de pedido/produto, mensagens e composer minimal;
- painel lateral de detalhes em desktop largo;
- mobile em fluxo lista -> detalhe, com composer fixo e sheets para gestao, nota e acoes rapidas.

Baloes enviados pela loja usam verde; mensagens recebidas usam card branco; falhas usam rose tint. Acoes inteligentes devem aparecer como chips horizontais, nao como blocos pesados.

## Loja Individual

A loja individual tambem segue a identidade v2. Ela nao deve ter um tema paralelo preto/neutro como base. A vitrine publica usa fundo quente `--bg`, header claro, marca em pill branca com icone verde, categorias em chips, cards de produto brancos com foto em painel suave, etiquetas semanticas e acoes primarias verdes.

Sheets de produto, checkout e confirmacao mantem o mesmo ADN dos modais do CRM: superficie branca, borda `--line`, raio 22px, sombra floating, rodape de acao fixo e seletores legiveis. O bottom nav mobile usa fundo claro translúcido, icones simples e ativo em `--green-tint`.

## Regra De Aplicacao

Toda nova tela do sistema deve seguir esta identidade antes de criar estilos proprios. Se uma pagina precisa de variacao, ela deve partir dos tokens v2 e dos componentes `BizyDesignSystem.tsx`, mantendo a experiencia operacional e comercial.

Ligacoes: [[inventario-frontend]], [[memoria-viva-bizy]], [[loja-digital-operacao-crm]], [[bizy-estado-atual]].
