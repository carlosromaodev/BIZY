# Bizy Frontend Style Guide

## Produto operacional

O Bizy deve parecer uma ferramenta de operação e atendimento, não uma landing page permanente. O caminho visual é inspirado em produtos de gestão como CRM, admin de loja e suporte: informação densa, clara, rápida de varrer e com ações críticas sempre previsíveis.

## Referências pesquisadas

- Salesforce Lightning Design System: design systems precisam de tokens, utilitários, guidelines e componentes reutilizáveis para manter consistência em escala.
- Salesforce Design Tokens: valores visuais devem usar tokens em vez de hexadecimais e espaçamentos soltos.
- Shopify Polaris: admin de loja deve manter uma linguagem partilhada para gestão de produtos, clientes e pedidos.
- Material Design: layouts responsivos devem usar estrutura consistente de margens, gutters e adaptação por viewport.
- Apple HIG: navegação mobile deve manter destinos estáveis e rótulos claros.

## Tokens

Usar primeiro os tokens canónicos em `frontend/src/estilos.css`:

- Cor estrutural: `--color-bg`, `--color-surface`, `--color-text`, `--color-border`, `--color-accent`.
- Cor semântica: `--success`, `--destructive`, `--warning`, `--info`, com versões `*-foreground` e `*-muted`.
- Espaço: `--space-1` até `--space-10`.
- Raio: `--radius-control`, `--radius-panel`, `--radius-sheet`, `--radius-pill`.
- Sombra: `--shadow-hairline`, `--shadow-panel`, `--shadow-floating`.
- Camadas: `--z-topbar`, `--z-bottom-nav`, `--z-backdrop`, `--z-drawer`.

Os tokens antigos em português ficam como aliases de compatibilidade. Código novo deve preferir os tokens canónicos para evitar redundância.

## Paleta

- Esmeralda `#16A07A` é a cor principal da identidade Bizy: ponto da marca, ação primária, foco, navegação ativa e destaque comercial.
- Neutro profundo `#0B1014` é a tinta oficial do wordmark e a base do favicon/app icon.
- Verde funcional adicional continua reservado para sucesso, confirmação, saldo positivo, disponibilidade, pagamento confirmado e ações de aprovação.
- Vermelho é reservado para erro, falha, perigo e ação destrutiva.
- Amarelo/laranja é reservado para aviso, pendência, fila, expiração e atenção operacional.
- Azul escuro é apenas informativo/tecnológico, sem competir com a marca.
- Neutros sustentam fundos, bordas, textos secundários e áreas densas de CRM.

Não usar cor funcional como decoração genérica. Sempre que a cor comunicar estado, deve existir texto ou ícone acompanhando. Pares de texto/fundo devem mirar AAA para texto normal; quando a interface usar tintas claras, usar foreground escuro do mesmo estado em vez de branco.

## Marca Bizy

A marca final usa o wordmark lowercase `bizy.` em Geist 700, letter spacing `-0.055em`, texto `#0B1014` em fundo claro e ponto esmeralda `#16A07A`. Dentro do CRM, sidebar, header mobile e sheets usam apenas este wordmark; não usar o símbolo `b.` como marca de navegação interna. O favicon/app icon oficial continua `b.` branco em quadrado arredondado `#0B1014`. O logo e o favicon ficam centralizados em `frontend/src/marca/bizy.tsx`.

- `LogoBizy`: componente React para o logo horizontal ou ícone.
- `resolverCoresBizy`: combina cores parciais com a paleta padrão.
- `criarSvgLogoBizy`: gera SVG do logo horizontal com cores novas.
- `criarSvgIconeBizy`: gera SVG do ícone/favico com cores novas.
- `criarFaviconBizyDataUrl`: gera `data:image/svg+xml` para trocar favicon em runtime.
- `aplicarIdentidadeBizy`: aplica título, favicon, `theme-color` e variáveis CSS globais.

Para trocar a direção visual depois, altere primeiro `CORES_BIZY_PADRAO` ou chame:

```ts
aplicarIdentidadeBizy({
  principal: "#0B1014",
  cinzaClaro: "#6B7178",
  cinzaMedio: "#0B1014",
  faviconBase: "#0B1014",
  faviconCheck: "#ffffff",
  faviconLinhas: "#16A07A"
});
```

## Mobile-first

- O mobile é o layout de decisão, não uma versão comprimida do desktop.
- A navegação principal no mobile usa bottom navigation com até 5 destinos.
- Fluxos densos, como Conversas, devem usar lista/detalhe em vez de empilhar tudo.
- Ações frequentes ficam visíveis; ações administrativas ficam recolhidas em detalhes ou painéis.
- Nenhum elemento fixo pode tapar conteúdo sem reservar espaço com safe-area.

## Densidade

- Painéis operacionais devem ser compactos e legíveis.
- Cards são usados para itens repetidos ou ferramentas enquadradas, não para envolver secções inteiras sem necessidade.
- No mobile, cards internos usam padding de 10-12px, gap de 10px e visual de lista quando estão dentro de outro card.
- Métricas devem usar o componente `CartaoIndicador`, que compacta ícone, título, valor e detalhe em duas colunas no mobile.
- Botões têm altura mínima de toque, mas não devem ocupar 100% da largura quando a ação é secundária no fluxo de chat.
- Estados críticos precisam de texto e cor, nunca só cor.
- Métricas no mobile devem ocupar grelha de 2 colunas sempre que couberem, evitando pilhas longas de cards.
- Tabelas viram listas densas com separadores internos; evitar repetir bordas arredondadas em cada linha quando o conteúdo pertence ao mesmo conjunto.

## Hierarquia visual

- Página: `pagina-rotulo` pequeno, `pagina-titulo` forte e ações alinhadas à direita quando houver espaço.
- Painel: `cartao-header h2` deve ser menor que o título da página e com menor espaçamento.
- Métrica: valor em destaque, título curto e detalhe discreto; ícone não deve competir com o número no mobile.
- Cor funcional: esmeralda `#16A07A` para ação/marca, verde para sucesso e saldo positivo, azul escuro para informação, amarelo/laranja para atenção, vermelho para erro e neutros para estrutura.
- Texto em fundo esmeralda, verde, vermelho, laranja ou azul escuro usa branco. Texto em fundos tintados usa foreground escuro do próprio estado.
- Borda: usar `--border-ui`, `--border-ui-soft` e `--border-ui-strong`; não misturar raios diferentes para componentes do mesmo nível.
- Cards comerciais não usam linha colorida no início. Estados aparecem por tint leve, badge, ícone e copy curta.

## Componentes

- `Shell`: uma fonte de verdade para navegação desktop e mobile.
- Navegação desktop do `Shell`: rail preto estreito com cantos grandes, ícones em coluna, capsule ativa animada e painel secundário claro com páginas da secção. O wordmark `bizy.` aparece no rail; não usar símbolo `b.` dentro do CRM.
- `CabecalhoPagina`: título curto e ação principal da página.
- `CartaoIndicador`, `.cartao`, `.indicador`: usar tokens de superfície/borda/sombra.
- `Bizy App Polish`: camada global no final de `frontend/src/estilos.css` que normaliza borda, sombra, densidade e hierarquia entre Dashboard, Catálogo, Comentários, Reservas, Conversas, WhatsApp, Agentes, n8n e Configurações.
- `Bizy Commercial Cards`: camada de estética comercial para cards vendáveis, removendo barras coloridas e mantendo profundidade suave.
- `Conversas`: lista/detalhe no mobile, painel duplo no desktop.
- `MensagemLinha`: bolhas legíveis, status pequeno, erro próximo da mensagem.

## Regras de manutenção

- Não duplicar seletores estruturais base como `.shell`, `.sidebar`, `.shell-conteudo`, `.pagina-cabecalho`, `.indicador` e `.conversas-layout`.
- Não criar novos hexadecimais para superfícies, texto, bordas ou acento sem antes verificar se já existe token.
- Não usar linguagem visual de IA no atendimento ao cliente; tratar como automação, rascunho ou operação.
- Antes de entregar mudanças visuais, rodar testes, typecheck, build e uma verificação mobile quando a alteração tocar navegação ou Conversas.
