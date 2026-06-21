# Análise de Design do Frontend - ÉMeu

Documento: `ANALISE-DESIGN-FRONTEND-EMEU.md`
Data: 2026-05-21
Projeto: ÉMeu
Escopo: análise visual, UX, arquitetura de páginas e páginas necessárias para o MVP

---

## 1. Diagnóstico Executivo

O frontend já tem uma base funcional importante: rotas organizadas, autenticação, painel autenticado, catálogo, comentários, reservas, conversas, WhatsApp, agentes, n8n e configurações. O problema principal não é falta de telas, é direção de produto e direção visual.

Hoje o app parece mais um painel SaaS genérico escuro do que uma ferramenta de operação de vendas em live para Angola. A interface usa muitos cartões, roxo/preto dominante, gradientes, ícones com aparência de "IA" e uma landing page com imagem promocional muito artificial. Para o ÉMeu, a primeira impressão deve ser: "isto ajuda-me a vender durante a live", não "isto é uma apresentação de software".

Principais problemas encontrados:

- O tema visual está declarado como "Modern SaaS Premium Theme" e usa roxo/preto como base dominante, mesmo com variáveis chamadas `verde`. Isso cria ruído de marca e sensação genérica.
- A página Home está parcialmente quebrada visualmente: vários nomes de classes usados em `Home.tsx` não existem no CSS atual.
- O Dashboard mistura operação real com ferramentas de teste, o que faz o produto parecer ambiente de desenvolvimento.
- As páginas de vendedor e de administração técnica estão no mesmo nível de navegação.
- Ainda falta uma página/fluxo forte de "Ao vivo" que una comentários, reservas críticas, fila, pagamentos e ações rápidas.
- Ainda falta uma página pós-live para entregas, exportação e relatório da live.

---

## 2. Evidências Técnicas

### Rotas atuais

As rotas estão concentradas em `frontend/src/rotasApp.tsx`:

| Rota | Página atual | Tipo | Observação |
|------|--------------|------|------------|
| `/` | Home | Pública | Landing page promocional |
| `/login` | Login | Pública | Login por telefone/SMS |
| `/app` | Dashboard | Privada | Painel geral, hoje mistura métricas e testes |
| `/app/catalogo` | Catálogo | Privada | CRUD de peças |
| `/app/comentarios` | Comentários | Privada | Feed e revisão manual |
| `/app/reservas` | Reservas | Privada | Gestão de reservas e pagamentos |
| `/app/conversas` | Conversas | Privada | Atendimento com contexto |
| `/app/whatsapp` | WhatsApp | Privada | QR Code e instâncias Evolution |
| `/app/agentes` | Agentes | Privada | Status de automações |
| `/app/n8n` | n8n | Privada | Workflows e contrato técnico |
| `/app/configuracoes` | Configurações | Privada | Estado operacional do backend |

### Problema de CSS na Home

Foram encontrados nomes de classes usados em `Home.tsx` que não possuem definição em `frontend/src/estilos.css`:

```text
home-faq-a
home-faq-chevron
home-faq-lista
home-faq-q
home-hero-glow
home-hero-img
home-logo-bar
home-logo-bar-item
home-logo-bar-label
home-logo-bar-lista
home-passo-conector
home-showcase
home-showcase-descricao
home-showcase-imagem
home-showcase-pontos
home-showcase-texto
```

Impacto: a landing fica com seções desalinhadas, espaços vazios grandes e elementos sem acabamento. No screenshot local, a barra "Integrado com" aparece sem espaçamento/estilo e o layout fica com muito vazio antes do rodapé.

### Observação do teste visual local

Foi executada verificação visual com Vite e Playwright usando Chrome local. As imagens foram geradas em `tmp/design-audit`.

Achados principais:

- Home desktop tem hero visualmente forte, mas com estética roxa/AI/tech genérica e grande vazio vertical depois do primeiro bloco.
- Dashboard desktop é consistente, mas escuro demais e muito orientado a "painel técnico".
- Dashboard mobile funciona em uma coluna, mas a navegação superior ocupa demasiado espaço e mistura páginas de vendedor com páginas técnicas.
- O teste por `127.0.0.1:5173` gerou CORS porque o backend aceita `http://localhost:5173`. Para desenvolvimento, convém padronizar um host ou permitir ambos.

---

## 3. Direção de Produto Recomendada

O ÉMeu deve ser desenhado como uma central de operação de live commerce, não como landing page de IA.

Princípios visuais recomendados:

- Interface de trabalho, calma e rápida de escanear.
- Cores neutras como base: branco/quase branco, grafite, cinza quente/frio.
- Cor de marca como acento, não como fundo dominante.
- Verde deve comunicar ação positiva, venda, pagamento confirmado e WhatsApp.
- Amarelo/âmbar deve comunicar urgência: reserva a expirar, revisão pendente.
- Vermelho deve ficar reservado para risco real: erro, cancelamento, expiração.
- Tipografia menor e mais densa nas telas internas.
- Menos cartões decorativos, mais listas operacionais, tabelas compactas e painéis de ação.
- Ícones devem ser funcionais e previsíveis, não decorativos.
- Evitar hero artificial com notebook 3D, brilhos, roxo e badges de automação.

---

## 4. Análise das Páginas Atuais

### 4.1 Home

Estado atual: página promocional completa com hero, mockups, funcionalidades, planos, FAQ e CTA.

Problemas:

- Estética de IA/SaaS genérico: roxo/preto, imagem 3D artificial, badges e brilho.
- Algumas classes da Home não existem no CSS.
- O hero comunica automação, mas não comunica Angola, venda em live real, pressão dos comentários ou WhatsApp do vendedor.
- A landing ocupa muito esforço visual antes de o produto operacional estar com cara profissional.

Recomendação:

- Não priorizar a landing agora.
- Quando refazer, usar imagem/screenshot real do produto ou cena realista de live commerce, não mockup artificial.
- Trocar headline para algo mais direto: "ÉMeu" ou "Vendas em live sem perder pedidos".
- Corrigir classes CSS ausentes.

### 4.2 Login

Estado atual: login por telefone com nome do vendedor, telefone, envio de código e estado visual.

Pontos positivos:

- Fluxo simples.
- Boa separação entre telefone e código.
- Estado de carregamento já existe.

Problemas:

- Texto ainda é técnico: "provider configurado no backend".
- Valores padrão de desenvolvimento aparecem na interface.
- Visual ainda usa roxo e fundo diagonal pesado.

Recomendação:

- Copy mais humana: "Vamos enviar um código para confirmar que este número é seu."
- Remover dados pré-preenchidos em produção.
- Usar tela mais limpa, com marca e confiança, sem visual promocional exagerado.

### 4.3 Dashboard

Estado atual: métricas, estado da live, receita, conversão, reservas a expirar, pagamento, stock, conectar live, comentário manual e resumo.

Pontos positivos:

- Métricas importantes já existem.
- SSE e atualização periódica já estão previstos.
- Ações de live e comentário manual existem.

Problemas:

- Parece painel de teste, não cockpit de live.
- "Comentário manual" aparece como ferramenta de teste rápido, mas no produto deveria ser fallback operacional.
- Faltam feed real de eventos e fila de urgência.
- A vendedora precisa ver primeiro: comentários que exigem ação, reservas a expirar e pagamentos pendentes.

Recomendação:

- Transformar `/app` em página "Ao vivo".
- Layout recomendado: topo com estado da live, coluna de comentários, coluna de reservas/fila, painel lateral de ações.
- Remover linguagem de teste do fluxo principal.

### 4.4 Catálogo

Estado atual: CRUD de peças com código, nome, descrição, preço, quantidade, estado e fotos por URL.

Pontos positivos:

- Já cria, edita e desativa peças.
- Já mostra foto/placeholder.
- Já tem busca e estado.

Problemas:

- Fotos por URL são pouco naturais para vendedoras.
- Não existe modo "preparar live".
- Não mostra stock reservado versus stock disponível.
- Não existe importação rápida ou cadastro em massa.

Recomendação:

- Evoluir para "Preparar live".
- Mostrar checklist: peças cadastradas, códigos conferidos, preços, stock e WhatsApp conectado.
- Adicionar visão compacta de peças da live.
- Deixar upload real de foto para fase seguinte, se o backend suportar.

### 4.5 Comentários

Estado atual: métricas, lista de comentários, filtro, busca e revisão manual inline.

Pontos positivos:

- A revisão manual já existe.
- Aprovar/rejeitar já chama endpoints corretos.
- Mostra confiança, telefone e peça interpretada.

Problemas:

- Formulário inline pode expandir a lista e atrapalhar durante uma live.
- A tela ainda parece um feed de logs, não uma fila de trabalho.
- Falta prioridade visual: "resolver primeiro estes 3".

Recomendação:

- Separar em duas experiências: feed ao vivo e fila de revisão.
- Usar drawer/modal para corrigir comentário sem quebrar a lista.
- Destacar comentários com telefone, sem peça, baixa confiança e cliente repetido.

### 4.6 Reservas e Pagamentos

Estado atual: métricas, tabela de reservas, busca, filtro, confirmar pagamento e cancelar reserva.

Pontos positivos:

- Fluxo mínimo de pagamento já aparece.
- Reservas críticas ganham destaque.
- A tabela é direta.

Problemas:

- Não há fluxo visual de comprovativo.
- Não há rejeição de pagamento com motivo.
- Não há ação rápida de lembrar cliente no WhatsApp.
- Não há detalhes expandíveis com comentário original e histórico.

Recomendação:

- Transformar em página de cobrança operacional.
- Incluir estados: aguardando comprovativo, comprovativo recebido, confirmado, rejeitado.
- Ações principais: ver comprovativo, confirmar, rejeitar, enviar lembrete, cancelar.

### 4.7 Conversas

Estado atual: lista de conversas, painel de mensagens, contexto da reserva e ações de pagamento/cancelamento.

Pontos positivos:

- Layout de atendimento é familiar.
- Mostra contexto da reserva.
- Ações de venda estão no atendimento.

Problemas:

- Ainda não há campo de envio manual de mensagem no JSX atual.
- Não há templates visíveis: IBAN, confirmação, lembrete, entrega.
- Não há estado de entrega da mensagem WhatsApp.
- A diferença entre mensagem real do WhatsApp, agente e sistema precisa ficar mais clara.

Recomendação:

- Adicionar compositor de mensagem.
- Adicionar botões de template.
- Mostrar origem e estado da mensagem: enviada, falhou, pendente.
- Manter ações operacionais próximas do chat.

### 4.8 WhatsApp

Estado atual: cria instância Evolution, mostra QR Code, define padrão, consulta estado e remove.

Pontos positivos:

- O fluxo técnico necessário existe.
- QR Code e pairing code estão previstos.

Problemas:

- Linguagem muito técnica: "instância", "Evolution Manager", "nome técnico".
- Para a vendedora, isso deveria parecer "Conectar meu WhatsApp".
- Diagnóstico técnico deve ficar escondido ou em modo admin.

Recomendação:

- Página principal: "Conectar WhatsApp".
- Campos simples: nome da linha, telefone, tornar padrão.
- Mostrar passos claros para escanear QR Code.
- Deixar Evolution Manager e base URL em detalhes avançados.

### 4.9 Agentes

Estado atual: cards com agentes reais do sistema, origem, gatilho, ação, canal e evidência.

Problemas:

- Página útil para founder/dev, não para vendedora.
- O termo "agentes" pode reforçar a aparência de produto IA genérico.

Recomendação:

- Esconder da navegação principal da vendedora.
- Mover para área "Admin" ou "Saúde da automação".

### 4.10 n8n

Estado atual: workflows, eventos, endpoints, guardrails e link para n8n.

Problemas:

- Página técnica.
- Não deve disputar atenção com Comentários, Reservas e Conversas.

Recomendação:

- Manter apenas em área admin/founder.
- Para vendedora, mostrar no máximo "Automação ativa" ou "Automação com erro".

### 4.11 Configurações

Estado atual: leitura de configurações e integrações do backend.

Problemas:

- É página técnica, não operacional.
- Pode assustar ou confundir uma vendedora piloto.

Recomendação:

- Separar em "Configurações da loja" para vendedor e "Configurações técnicas" para admin.

---

## 5. Páginas Necessárias para o MVP

### Páginas para a vendedora

- [x] Login
- [x] Preparar live
- [x] Ao vivo
- [x] Revisão manual
- [x] Reservas e pagamentos
- [x] Conversas WhatsApp
- [x] Pós-live e entregas
- [x] Conectar WhatsApp
- [x] Relatório simples da live

### Páginas para administração/founder

- [x] Saúde da automação
- [x] n8n e workflows
- [x] Configurações técnicas
- [ ] Relatório do piloto

### Páginas que podem ficar para depois

- [x] Clientes
- [x] Relatórios avançados
- [ ] Multi-loja
- [x] Equipa e permissões
- [ ] Reconciliação bancária
- [ ] App mobile nativo

---

## 6. Arquitetura de Navegação Recomendada

### Navegação principal da vendedora

1. Ao vivo
2. Preparar live
3. Reservas
4. Conversas
5. Relatório da live
6. WhatsApp

### Navegação admin

1. Saúde da automação
2. n8n
3. Configurações técnicas

### Mudanças diretas nas rotas atuais

| Rota atual | Proposta | Ação |
|------------|----------|------|
| `/app` | Ao vivo | Renomear e redesenhar |
| `/app/catalogo` | Preparar live | Manter base, mudar foco |
| `/app/comentarios` | Revisão manual | Integrar com Ao vivo ou manter como fila |
| `/app/reservas` | Reservas | Expandir para comprovativos e lembretes |
| `/app/conversas` | Conversas | Adicionar envio manual e templates |
| `/app/whatsapp` | WhatsApp | Simplificar linguagem |
| `/app/agentes` | Saúde da automação | Mover para admin |
| `/app/n8n` | n8n | Mover para admin |
| `/app/configuracoes` | Configurações técnicas | Mover para admin |

---

## 7. Página Principal Recomendada: Ao Vivo

A página mais importante do MVP deve ser a tela da live.

Estrutura recomendada:

```text
Topo fixo:
Live ativa/inativa | TikTok conectado | WhatsApp conectado | comentários/min | reservas a expirar

Coluna esquerda:
Feed de comentários em tempo real
Comentários com intenção destacados
Botão de fallback manual

Coluna central:
Reservas ativas
Fila de espera
Pagamentos pendentes
Reservas a expirar nos próximos 5 minutos

Coluna direita:
Detalhe selecionado
Corrigir comentário
Enviar template WhatsApp
Confirmar/rejeitar pagamento

Rodapé discreto:
Eventos do sistema e erros técnicos resumidos
```

Objetivo: durante a live, a vendedora ou assistente deve resolver uma venda em poucos cliques.

---

## 8. Design System Recomendado

### Tokens

- [x] Renomear variáveis `--verde-*` que hoje guardam roxos.
- [x] Definir escala real de cores: marca, neutros, sucesso, atenção, perigo, informação.
- [x] Evitar roxo como cor dominante.
- [x] Usar sombras mais discretas.
- [x] Limitar raio de cards a 8px, exceto modais ou elementos específicos. (Design reto intencional: `--radius: 0`)

### Componentes base

- [x] Botão primário
- [x] Botão secundário
- [x] Botão destrutivo
- [x] Botão ícone com tooltip
- [x] Campo de telefone angolano
- [x] Select/segmentado para filtros
- [x] Status pill padronizado
- [x] Tabela compacta
- [x] Lista operacional
- [x] Drawer de detalhe
- [x] Modal de confirmação
- [x] Toast/alerta
- [x] Estado vazio
- [x] Estado de erro
- [x] Estado de carregamento

### Layout

- [x] Reduzir quantidade de cartões grandes.
- [x] Evitar cards dentro de cards.
- [x] Usar tabelas/listas para informação repetida.
- [x] Manter toolbar fixa ou fácil de alcançar nas telas críticas.
- [x] Melhorar navegação mobile, porque o menu horizontal atual ocupa muito espaço.

---

## 9. Prioridade de Implementação

### Fase 1 - Corrigir base visual

- [x] Corrigir classes CSS ausentes da Home.
- [x] Substituir tema roxo/preto dominante por paleta operacional.
- [x] Separar navegação de vendedora e navegação admin.
- [x] Padronizar botões, badges, cartões, tabelas e estados vazios.
- [x] Corrigir CORS local para aceitar `localhost` e `127.0.0.1`.

### Fase 2 - Redesenhar fluxo da live

- [x] Transformar Dashboard em "Ao vivo".
- [x] Criar layout de cockpit com comentários, reservas e ações.
- [x] Mover comentário manual para fallback operacional.
- [x] Mostrar reservas críticas e pagamentos pendentes no primeiro ecrã.
- [x] Adicionar feed de eventos recentes.

### Fase 3 - Completar vendas e atendimento

- [x] Adicionar comprovativo visual em Reservas.
- [x] Adicionar rejeição de pagamento com motivo.
- [x] Adicionar envio manual de WhatsApp em Conversas.
- [x] Adicionar templates: IBAN, confirmação, lembrete, entrega.
- [x] Mostrar falhas de envio WhatsApp de forma clara.

### Fase 4 - Pós-live

- [x] Criar página "Pós-live".
- [x] Mostrar entregas pendentes.
- [x] Exportar lista de entregas.
- [x] Mostrar relatório simples da live.
- [ ] Preparar feedback pós-live da vendedora piloto.

### Fase 5 - Landing depois do produto

- [x] Recriar Home com imagem real/screenshot real.
- [x] Remover visual artificial de IA.
- [x] Corrigir planos, FAQ e prova social.
- [x] Escrever copy focada em vendedores de live em Angola.

---

## 10. Critérios de Aceite para o Redesign

- [x] Uma vendedora consegue entender o painel principal em menos de 30 segundos.
- [x] Durante uma live, comentário com intenção, reserva e pagamento ficam visíveis sem navegar por 3 páginas.
- [x] Ações críticas exigem no máximo 2 cliques.
- [x] Páginas técnicas não aparecem na navegação principal da vendedora.
- [x] Mobile não perde navegação nem ações principais.
- [x] O app não parece landing/IA genérica.
- [x] Estados de erro dizem o que falhou e o que fazer.
- [x] Home pública não tem classes CSS sem definição.

---

## 11. Conclusão

O frontend do ÉMeu já tem bastante estrutura funcional, mas ainda não tem a forma visual correta para o produto. A prioridade agora deve ser redesenhar o app autenticado, especialmente a experiência "Ao vivo", antes de investir mais na landing page.

O melhor caminho é transformar o ÉMeu num painel de operação simples, rápido e confiável para lives: comentários entram, reservas aparecem, pagamentos são resolvidos e WhatsApp fica ao lado da venda.
