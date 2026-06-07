# Loja Digital Híbrida Design

## Objetivo

Transformar a página atual de loja pública numa central profissional de Loja Digital dentro do CRM, combinando gestão contínua com um assistente guiado em modal inspirado no fluxo do TakeApp analisado no vídeo.

## Contexto

A página atual `frontend/src/paginas/LojaPublica.tsx` permite publicar slug, descrição e ver tracking. O vídeo do TakeApp mostra um fluxo mais eficiente para criar loja: identificação do negócio, preview mobile em tempo real, produtos iniciais, métodos de entrega e abertura da loja pública. Para o ÉMeu/Bizy, a parte valiosa é a metodologia de configuração guiada com preview e validação; a assinatura/pagamento do TakeApp não entra neste escopo.

## Escopo V1

1. Página principal passa a comunicar “Loja Digital” em vez de só “Loja pública”.
2. Página mantém visão operacional permanente: estado da publicação, link, produtos vendáveis, stock baixo, funil do site, origem dos resultados e atalhos para CRM.
3. Botão “Configurar loja” abre um assistente em modal/sheet com 5 passos:
   - Identidade: nome, WhatsApp, slug, descrição, cor, imagens e endereço.
   - Produtos: resumo do catálogo, produtos vendáveis, stock baixo e atalho para catálogo.
   - Entrega: entrega ativa, retirada ativa, consumo local, taxa padrão, entrega grátis acima de valor, prazo e instruções.
   - Pagamento e mensagens: métodos de pagamento, instruções de cobrança e mensagens operacionais.
   - Testar e publicar: checklist de prontidão, copiar link, abrir loja e publicar/rascunho.
4. Desktop mostra preview mobile ao lado dos campos. Mobile usa sheet/bottom sheet sem preview lateral espremido.
5. Backend deixa de depender de `localStorage` para dados críticos da loja. A configuração salva nos campos do negócio e no JSON `entrega`, reaproveitando dados já usados por checkout, cálculo de entrega, pagamentos e CRM.

## Dados

O backend expõe `GET /loja-publica/configuracao` e mantém `PUT /loja-publica/configuracao`, agora aceitando payload detalhado sem quebrar payloads antigos.

Campos persistidos:

- Campos diretos do negócio: `nomeComercial`, `telefone`, `whatsapp`, `email`, `provincia`, `municipio`, `endereco`, `slugPublico`, `descricaoPublica`, `metodosPagamento`, `lojaPublicadaEm`.
- JSON `entrega`: `temaLoja`, `taxaPadraoEmKwanza`, `entregaGratisAcimaDeKwanza`, `prazoPadrao`, `retiradaNaLoja`, `consumoLocal`, `instrucoesEntrega`, `pagamentos`.
- Catálogo existente: produtos vêm de `/pecas` e do repositório de peças; a loja pública continua expondo apenas produtos vendáveis.

## UX

O tom visual deve seguir uma linha Cal.com: claro, preciso, tipografia forte, áreas com baixa decoração, informação útil e ações evidentes. Evitar textos longos, cartões soltos sem relação, ícones genéricos de IA e excesso de bordas. O preview deve mostrar o efeito das escolhas, não ser decoração.

## Erros E Validações

- Slug vazio ou inválido bloqueia publicação.
- Slug duplicado mantém resposta de conflito.
- Publicar exige pelo menos slug, WhatsApp/telefone e um produto vendável para a UI recomendar publicação; o backend mantém compatibilidade e valida o slug.
- Configurações de entrega aceitam zero como taxa válida.
- URL de imagem vazia deve ser salva como `null`, não como string vazia.

## Testes

- Backend: garantir GET de configuração detalhada, PUT legado compatível e PUT detalhado persistindo tema, entrega e pagamentos.
- Frontend: garantir carregamento da configuração, edição no assistente, publicação, estados vazios e textos essenciais.
- Verificação visual: desktop e mobile para a página de Loja Digital e para o assistente.
