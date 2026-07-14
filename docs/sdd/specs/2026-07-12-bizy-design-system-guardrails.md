# SDD - Guardrails de Design System Bizy

Status: implementado e validado
Fonte: `BIZY-DESIGN-SYSTEM-GUARDRAILS.md`
Ultima atualizacao: 2026-07-13

## Direcao unica

O Bizy usa um design system operacional, sem linguagem visual generica de IA. A marca, os tokens, a tipografia, os estados e os shells sao partilhados. Market preserva o sistema visual da Home e Learning Team separa cada contexto por rota.

## Checklist de implementacao

- [x] Marca centralizada em `frontend/src/marca/bizy.tsx`.
- [x] Wordmarks locais de Market e Learning substituidos por `LogoBizy`.
- [x] Pesos tipograficos limitados a 400-700 nas folhas auditadas.
- [x] `letter-spacing` normalizado para zero nas folhas auditadas.
- [x] Raios canonicos definidos em 6px, 10px e 14px.
- [x] Market Home, diretorio e produto usam o mesmo cabecalho e rodape.
- [x] Checkout, compras e acompanhamento usam a mesma marca, fundo e rodape do Market.
- [x] Footer publico ocupa toda a largura, alinha o conteudo a 1280px, permanece no fluxo e o shell reserva `100dvh`.
- [x] Avisos de privacidade aparecem antes do footer, preservando-o como encerramento visual da pagina.
- [x] Loja publica foi refeita com hero de imagem real, identidade comercial, colecoes, destaque e grelha 4/2 colunas.
- [x] Abas da loja mostram apenas filtros e acoes funcionais, sem controles decorativos ou prova social inventada.
- [x] Fallback de produto sem imagem usa superficie neutra, sem gradiente decorativo.
- [x] Learning Team possui menu interno persistente e rolavel.
- [x] Cada area Learning tem URL propria.
- [x] Visao geral Learning foi reduzida a indicadores prioritarios e atalhos operacionais.
- [x] Programas, conteudos, pessoas, avaliacoes, certificados, turmas, comunidade, biblioteca, relatorios, chat, compras e configuracoes foram separados.
- [x] Estados de erro Learning oferecem recuperacao.
- [x] Estados vazios foram adicionados para certificados, biblioteca e conteudos.
- [x] Heroes publicos do Learning usam imagem real e contraste solido em desktop e mobile.
- [x] Grelhas Learning usam `auto-fit` e mantem composicao coerente com poucos ou muitos programas.
- [x] Controles usam icones Lucide existentes.
- [x] Links utilitarios do Market executam acoes reais; elementos que pareciam clicaveis sem acao foram removidos.
- [x] Todas as 29 rotas Market e Learning foram auditadas com dados representativos no navegador.
- [x] Matriz responsiva completa validada no navegador em 348 combinacoes.
- [x] Build, testes focados e ausencia de overflow/overlap validados.

## Consolidacao do Bizy Market

- [x] A hero e o topo aprovados da Home foram preservados como referencia visual.
- [x] `CabecalhoMarket` centraliza a mesma barra superior, pesquisa, categorias e atalhos em todas as rotas publicas do Market.
- [x] A pesquisa partilhada direciona consultas para o catalogo e aceita contexto controlado nas lojas.
- [x] A Home abaixo da hero foi reorganizada em confianca, destaques, departamentos, fornecedores e catalogo, sem repetir a mesma montra de produtos.
- [x] `CartaoProdutoMarket` tornou-se o cartao comercial canonico para Home, categoria, catalogo e produtos similares.
- [x] Cartoes, botoes, campos, filtros e paineis comerciais usam cantos retos, bordas finas e hierarquia orientada a produto, preco, stock e fornecedor.
- [x] Diretorio de lojas e categorias usam os mesmos filtros, cabecalhos, grelhas e metadados comerciais.
- [x] A rota visual duplicada `/market/lojas/:slug` foi removida e redireciona para a loja canonica `/lojas/:slug`.
- [x] Loja publica, catalogo e pagina de produto usam a mesma identidade de marketplace em desktop e mobile.
- [x] Checkout, portal do comprador, acesso a compra e formulario de contacto usam o mesmo shell publico, rodape e linguagem visual.
- [x] Checkout vazio oculta formularios inativos e apresenta apenas a acao de retorno ao catalogo.
- [x] A navegacao inferior fixa foi removida do Market mobile; lojas, sacola e conta permanecem acessiveis pelo cabecalho partilhado.
- [x] A reserva inferior da navegacao removida foi eliminada e o rodape permanece no fundo da viewport em paginas curtas, sempre dentro do fluxo.
- [x] Estados de carregamento, erro, vazio e poucos resultados permanecem completos sem criar superficies decorativas ou dados falsos.
- [x] As 12 rotas publicas do Market foram validadas nas 12 larguras obrigatorias: 144 combinacoes, zero erros de consola e zero falhas visuais.
- [x] Typecheck, 39 ficheiros de teste com 144 testes e build de producao foram executados com sucesso.

## Matriz obrigatoria

- Mobile: 320x568, 360x800, 375x812, 390x844 e 412x915.
- Tablet: 768x1024, 820x1180 e 1024x768.
- Desktop: 1280x720, 1366x768, 1440x900 e 1920x1080.

## Criterio de aceite

Nenhuma rota alterada pode apresentar overflow horizontal, sobreposicao de texto, footer fixo sobre conteudo, logo recriado localmente, gradiente decorativo sem funcao ou navegacao interna dependente apenas de estado local.
