# Bizy Design Interno — Comércio Suave

Data: 2026-05-23

## Decisão

O design interno do Bizy seguirá a direção **Comércio suave**: uma interface de CRM para lojas que parece acolhedora, comercial e moderna, sem perder leitura operacional. A aplicação continua a ser uma ferramenta de trabalho, mas deve ficar menos rígida, menos cinzenta e mais desejável para quem vende todos os dias pelo WhatsApp, live e catálogo.

## Objetivo

Melhorar a experiência interna do sistema com:

- melhores cores e estados visuais;
- layouts mais organizados e menos empilhados;
- animações com propósito;
- modais, sheets e alertas mais premium;
- organização visual consistente entre Dashboard, Clientes, Conversas, Reservas, Catálogo, Comentários, WhatsApp, n8n, Configurações e Relatórios.

## Princípios Visuais

1. **Loja conectada, não painel genérico**
   A interface deve lembrar uma operação comercial viva: clientes, pedidos, produtos, pagamento e conversa no centro.

2. **Suave sem perder contraste**
   Fundos podem ser mais quentes e comerciais, mas texto e estados devem continuar legíveis em AA/AAA quando aplicável.

3. **Verde é dinheiro, confirmação e progresso**
   Verde deve aparecer em saldo positivo, pagamento confirmado, disponibilidade, sucesso e ações de confirmação.

4. **Vinho é marca e ação principal**
   `#971A58` continua como identidade Bizy, CTA primário, navegação ativa e destaque comercial.

5. **Cards só quando enquadram uma ferramenta ou item**
   Evitar tela composta por cartões empilhados sem hierarquia. Cards devem ter função clara: resumo, lista, ferramenta, conversa ou decisão.

6. **Movimento comunica mudança**
   Animações devem indicar entrada de página, abertura de modal, mudança de estado, foco, envio, sucesso, erro ou navegação. Nada decorativo demais.

## Sistema de Cores

### Base

- Fundo da aplicação: neutro quente muito claro, próximo de `#fbfaf8`.
- Superfícies: branco quente, com variações suaves para cards e listas.
- Texto principal: neutro escuro, não preto puro.
- Texto secundário: cinza azulado/ardósia para manter leitura.
- Bordas: neutro quente com baixa saturação.

### Marca e estados

- Primário Bizy: `#971A58`.
- Primário hover: versão mais escura do vinho.
- Sucesso: verde profundo para texto/ícone, verde suave para fundos tintados.
- Aviso: amarelo/laranja discreto para pendência, fila e expiração.
- Erro: vermelho escuro em texto, fundo vermelho muito claro para área de erro.
- Informação: azul escuro apenas para informação técnica ou estado neutro tecnológico.

### Regra de contraste

- Texto em fundos fortes usa branco.
- Texto em fundos tintados usa foreground escuro do próprio estado.
- Não transmitir estado só por cor: sempre combinar badge, texto ou ícone.

## Layout

### Shell

- Desktop mantém navegação lateral, mas com aparência mais leve e comercial.
- Mobile mantém bottom navigation em ilha, mas pode ficar menos “dark cockpit” e mais integrada à paleta suave.
- Header mobile deve continuar compacto, com marca clara e botão de menu visível.

### Páginas internas

Cada página deve seguir uma composição previsível:

1. Cabeçalho curto com rótulo, título e ação principal.
2. Resumo em bloco único quando houver métricas.
3. Área principal com ferramentas e listas organizadas.
4. Estados vazios com ação ou orientação curta.
5. Mensagens de sistema próximas ao fluxo onde surgem.

### Métricas

- Métricas devem continuar agrupadas em bloco único.
- No desktop, métricas podem ter mais respiro horizontal.
- No mobile, manter grelha de 2 colunas ou linha compacta quando o conteúdo for curto.
- Valores importantes, como saldo e pagos, devem usar verde quando positivos.

### Listas

- Clientes, pedidos, produtos e conversas devem parecer listas comerciais, não tabelas antigas comprimidas.
- Linhas devem ter avatar/ícone, título, metadados, estado e ação principal.
- Evitar bordas pesadas em cada item; usar separação por espaçamento, sombra leve ou fundo suave.

### Conversas

- O chat mobile continua imersivo.
- Composer fixo deve parecer ferramenta principal, com botão de contexto integrado ao textarea.
- Balões devem ter altura de conteúdo e não esticar.
- Erros de envio devem ser legíveis em fundo claro, com contraste suficiente e CTA de recuperação.

## Modais, Sheets e Alertas

### Dialog

- Radius maior que controles, mas sem excesso.
- Overlay com blur funcional e escurecimento leve.
- Cabeçalho com título forte e descrição curta.
- Footer com ação destrutiva separada visualmente da ação neutra.
- Entrada com scale/fade curto.

### AlertDialog

- Usar para ações destrutivas como limpar dados.
- Vermelho deve aparecer no botão destrutivo e no ícone/estado, não no corpo todo.
- Copy deve explicar consequência e recuperação possível.

### Sheet

- Mobile: sheet deve parecer painel de ação, com header limpo e conteúdo rolável.
- Desktop: sheet lateral com largura previsível e hierarquia clara.
- Sheet de menu deve agrupar CRM, Loja e Sistema com menos ruído visual.

## Animações

Tokens globais:

- `--motion-ui-fast`: 140-180ms.
- `--motion-ui-medium`: 220-280ms.
- `--motion-ui-spring`: curva suave para entrada e press feedback.

Usos:

- entrada de página: fade + rise leve;
- cards e linhas clicáveis: press scale discreto;
- nav ativa: transição curta;
- modal/sheet: fade + scale ou slide conforme origem;
- envio de mensagem: estado de carregamento e confirmação;
- erro: feedback próximo ao elemento, sem tremer a interface inteira.

Obrigatório:

- respeitar `prefers-reduced-motion`;
- animar apenas `opacity` e `transform`;
- não bloquear interação durante animações.

## Componentes e Organização

Usar shadcn/ui como base:

- `Button`, `Card`, `Badge`, `Dialog`, `AlertDialog`, `Sheet`, `Input`, `Textarea`, `Select`, `Tabs`, `Table`, `Tooltip`.

Criar ou consolidar composições internas apenas quando reduzirem repetição real:

- bloco de página;
- bloco de métricas;
- lista operacional;
- empty state;
- modal de confirmação;
- item de conversa;
- composer de chat.

Evitar:

- CSS solto com hexadecimais dentro das páginas;
- cards dentro de cards sem necessidade;
- múltiplos estilos de borda/raio para o mesmo nível de componente;
- ícones ou linguagem visual de IA.

## Escopo de Implementação

1. Consolidar tokens de cor, sombra, raio e motion em `frontend/src/estilos.css`.
2. Ajustar shadcn globalmente: cards, botões, inputs, badges, dialogs, sheets, tabs e tables.
3. Refinar `Shell.tsx`: navegação, menu mobile, sidebar desktop e ação ativa.
4. Refinar páginas principais por ordem de impacto:
   - Conversas;
   - Clientes;
   - Reservas;
   - Painel;
   - Catálogo;
   - Comentários;
   - Configurações, WhatsApp, n8n, Relatórios e Agentes.
5. Padronizar modais e alertas.
6. Verificar mobile e desktop com screenshots.

## Critérios de Aceitação

- A interface interna usa a direção Comércio suave de forma consistente.
- A paleta continua acessível e sem depender só de cor para estados.
- Cards e listas têm hierarquia clara e menos redundância.
- Modais e sheets têm visual premium e comportamento consistente.
- Mobile não tem overflow horizontal.
- Conversas continua imersivo no chat mobile.
- `npm test` e `npm run build` passam.
- Deve existir verificação visual mobile e desktop antes da entrega.

## Fora de Escopo

- Alterar regras de negócio.
- Mudar integrações com WhatsApp, Evolution, live ou backend.
- Criar landing page nova.
- Redesenhar o logo Bizy além de ajustes de harmonia com tokens.
- Adicionar sons agora; isso pode entrar depois como etapa separada.
