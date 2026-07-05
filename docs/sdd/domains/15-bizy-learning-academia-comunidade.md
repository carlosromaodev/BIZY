# SDD Dominio 15 - Bizy Learning Commerce, Academia e Comunidade

Status: ativo
Owner logico: Produto Learning
Fontes: `/home/carlos/Downloads/deep-research-report.md`, `docs/RF-RNF-RN-BIZY-LEARNING.md`, `docs/sdd/domains/09-bizy-team-equipa-projectos.md`, `docs/sdd/domains/07-bizy-market-checkout-repasses.md`, `docs/sdd/domains/10-financas-facturacao-conformidade.md`, `docs/sdd/domains/05-clientes-atendimento-whatsapp.md`
Ultima atualizacao: 2026-07-04

## 1. Proposito

Definir o Bizy Learning como sistema proprio de produtos digitais, aprendizagem operacional, comunidade e monetizacao de conhecimento dentro do ecossistema Bizy. O Learning nao e um catalogo, nem uma aba secundaria do Team, nem apenas uma pagina publica. A rota `/learning` e a vitrine do ecossistema; o produto completo inclui perfis publicos, produtos digitais vendaveis, checkout digital, entitlement, progresso, certificados, comunidades, mentorias, chat interno, analytics e governanca.

O Bizy Team e o backoffice administrativo do Learning: nele o dono do negocio, gestor, mentor ou criador autorizado gere perfil, produto, publicacao, precos, acesso, turmas, progresso, comunidade, suporte e metricas. O Bizy Studio e a entrada operacional para escolher presenca publica em Market, Learning ou ambos.

## 2. Posicionamento no Ecossistema

```text
Team -> Studio -> escolher Market/Learning/Ambos
     -> configurar perfil publico
     -> criar produto fisico ou digital
     -> publicar -> vender -> operar no Team -> medir em Financas/Analytics
```

| Area | Bizy Market | Bizy Learning |
|---|---|---|
| Produto principal | Produto fisico ou servico operacional | Produto digital, formativo, comunidade, mentoria ou certificacao |
| Unidade de venda | Item, variante, quantidade, servico | Acesso, inscricao, licenca, turma, certificado, assinatura |
| Disponibilidade | Stock, entrega, agenda, fornecedor | Conteudo publicado, vagas, calendario, validade, entitlement |
| Operacao | Pedido, entrega, comprovativo, repasse | Inscricao, progresso, consumo, comunidade, certificado |
| Risco principal | Overselling, entrega, fornecedor, pagamento | Acesso indevido, pirataria, qualidade, abandono, refund |
| Backoffice | Studio e Team | Studio e Team |

Learning e Market podem coexistir no mesmo negocio, mas nao partilham stock, entrega fisica ou variantes. A integracao acontece por identidade, checkout, financeiro, CRM, campanhas, afiliados, chat e analytics.

## 3. Escopo

Entra neste dominio:

- home publica do Learning em `/learning`;
- perfis Learning de negocios, academias, mentores, formadores, criadores e parceiros;
- escolha no Studio entre Market, Learning ou ambos;
- produtos digitais: cursos estruturados, microlearning, lives/workshops, mentorias/coaching, certificacoes, comunidades/memberships, bundles/trilhas/academias e downloads digitais;
- precos, ofertas, cupoes, bundles, assinaturas, acesso gratuito, acesso pago e acesso manual auditado;
- checkout digital e emissao de factura/recibo quando aplicavel;
- entitlement, inscricao, liberacao de conteudo e revogacao de acesso;
- progresso, avaliacoes, quizzes, assignments, certificados e recertificacoes;
- cohorts, turmas, lives, mentoria, comunidade e moderacao;
- chat interno Learning para decisoes, tarefas, suporte e coordenacao entre gestores, mentores, donos e criadores;
- analytics de venda, aprendizagem, retencao, abandono, receita e impacto operacional;
- integracoes com Team, Market, Financas, Chat, Afiliados, Campanhas e CRM.

Fica fora deste dominio:

- stock fisico, entrega, variantes e logistica do Market;
- gestao diaria de membros, metas e projectos do Team, excepto quando usados para administracao Learning;
- ledger financeiro generico e regras fiscais detalhadas, cobertas no dominio 10;
- mensageria externa WhatsApp, coberta no dominio 05;
- autorizacao global, sessoes e RBAC base, cobertos nos dominios 02 e 14.

## 4. Atores e Permissoes

- Visitante: explora home Learning, perfis, previews, comunidades abertas e paginas de produto.
- Comprador/Formando: compra, recebe acesso, consome conteudo, participa, conclui avaliacoes e recebe certificado.
- Dono do negocio: activa Learning no Studio, gere perfil, produtos, owners, receita, politicas e publicacao.
- Gestor Team: atribui formacoes, acompanha progresso, gere cohorts, owners e formacao obrigatoria.
- Mentor/Formador: cria conteudo, conduz lives, acompanha turmas, responde comunidade e avalia tarefas conforme permissao.
- Criador/Parceiro: publica ou participa em produtos digitais autorizados pelo negocio ou pelo Bizy.
- Administrador Bizy: governa politicas globais, categorias, denuncias, destaques, suspensoes e conformidade.
- Sistema Bizy: cria entitlements, registra eventos, emite tarefas, notifica, aplica regras e mede resultados.

## 5. Familias de Produto Learning

- Cursos estruturados: modulos, licoes, progresso, avaliacoes e certificado.
- Microlearning: conteudos curtos, checklists e accoes praticas.
- Lives/workshops: sessoes ao vivo, Q&A, replay, materiais e presenca.
- Mentorias/coaching: pacotes individuais ou de grupo, agenda, tarefas e follow-up.
- Certificacoes/recertificacoes: prova, validade, renovacao, badge e verificacao publica.
- Comunidades/memberships: acesso recorrente a espacos privados, desafios, beneficios e conteudo continuo.
- Bundles/trilhas/academias: conjunto de produtos digitais por perfil, sector, objectivo ou licenca B2B.
- Downloads digitais: templates, PDFs, checklists, playbooks, planilhas, scripts, guias e ficheiros complementares.

## 6. Entidades e Dados Alvo

Entidades alvo dedicadas:

- `LearningProfile`
- `LearningProfileOwner`
- `LearningDigitalProduct`
- `LearningProductVersion`
- `LearningOffer`
- `LearningBundle`
- `LearningAsset`
- `LearningEnrollment`
- `LearningEntitlement`
- `LearningProgress`
- `LearningAssessment`
- `LearningQuizAttempt`
- `LearningAssignmentSubmission`
- `LearningCertificate`
- `LearningCohort`
- `LearningLiveSession`
- `LearningMentorshipSession`
- `LearningCommunitySpace`
- `LearningInternalThread`
- `LearningInternalMessage`
- `LearningModerationCase`
- `LearningEvent`
- `LearningPayoutPolicy`

Estado incremental permitido: enquanto as entidades dedicadas nao existirem em schema proprio, o MVP pode persistir publicacoes, inscricoes, progresso, chat interno e eventos em `EventoOperacional` com `topico="learning"` e payload versionado. Esta persistencia e transitoria, nao substitui o dominio definitivo.

## 7. Fluxos Principais

### 7.1 Activacao pelo Studio

```text
Team -> Studio -> escolher Market/Learning/Ambos
     -> criar perfil Market, Learning ou ambos
     -> validar elegibilidade
     -> criar produto fisico ou digital
     -> publicar no canal correcto
```

### 7.2 Venda e Acesso Learning

```text
Visitante descobre produto digital -> ve preview seguro
     -> compra ou inscreve-se
     -> pagamento confirmado ou liberacao manual auditada
     -> entitlement criado
     -> acesso liberado
     -> consumo, comunidade, progresso, avaliacao e certificado
```

### 7.3 Operacao no Team

```text
Dono/Gestor Team -> cria produto Learning
     -> define owner, preco, politica, acesso e publicacao
     -> atribui formacao a membro, perfil, cohort ou comunidade quando aplicavel
     -> abre cohort/turma com data, vagas, sala e replay
     -> regista presenca e libera acesso quando a regra permitir
     -> cria comunidade/membership com regras, moderadores, topicos e posts
     -> acompanha inscritos, receita, progresso, abandono e suporte
     -> acciona mentor, tarefa, mensagem ou campanha quando necessario
```

### 7.4 Financas e Documentos

```text
Compra Learning confirmada
     -> movimento financeiro com origem learning
     -> factura/recibo quando aplicavel
     -> comissao/repasse se houver vendedor, mentor, criador ou afiliado
     -> entitlement rastreavel e auditavel
```

### 7.5 Recomendacao Operacional

```text
Evento operacional no Bizy -> recomendacao Learning
     -> aprendizagem curta -> aplicacao no CRM/Market/Financas/Team
     -> medicao de impacto em adopcao, venda, retencao ou controlo
```

### 7.6 Chat Interno Learning

```text
Team -> /app/learning -> escolhe produto/cohort/comunidade/suporte
     -> envia mensagem, decisao, tarefa, suporte ou anuncio
     -> thread interna guarda autor, papel, contexto e timestamp
     -> mentor/gestor/dono acompanha follow-up
     -> atendimento externo e comunidade publica continuam separados
```

## 8. Requisitos Funcionais Sinteticos

O documento detalhado `docs/RF-RNF-RN-BIZY-LEARNING.md` e a fonte primaria dos RF. Este SDD fixa as responsabilidades de dominio:

- expor Learning como sistema publico proprio em `/learning`;
- permitir perfis Learning independentes ou combinados com perfis Market;
- permitir que o Studio active presenca em Market, Learning ou ambos;
- separar produtos Market e produtos Learning no Studio e no backend;
- criar e publicar produtos digitais por formato, owner, preco, estado e politica;
- suportar produtos gratuitos, pagos, privados, por convite, por assinatura e por acesso manual;
- criar checkout digital com origem `learning`, comprovativo, factura/recibo quando aplicavel e relacao financeira auditavel;
- gerar entitlement para compra, convite, acesso gratuito, assinatura, turma ou atribuicao interna;
- bloquear conteudo premium quando nao houver entitlement valido;
- registar progresso, quizzes, avaliacoes, presenca, assignments, certificados e recertificacao;
- gerir communities, memberships, cohorts, lives, workshops e mentorias;
- permitir chat interno contextual por curso, live, cohort, comunidade, mentoria, certificado ou suporte sem misturar com atendimento externo;
- aplicar moderacao, denuncias, revisao humana, suspensao e governanca de qualidade;
- integrar Learning com Team, Market, Financas, Chat, Afiliados, Campanhas e CRM;
- medir descoberta, preview, compra, inscricao, inicio, progresso, conclusao, abandono, certificado, receita e retencao.

## 9. Regras de Negocio

- Learning e sistema separado do Market e do Team; Team administra o backstage operacional.
- Market e Learning nao partilham stock fisico, entrega fisica, variantes ou fila de entrega.
- Produto Learning publicado so aparece na home se tiver perfil activo, owner valido, preco/acesso definido, conteudo minimo e estado permitido.
- Produto Learning pago so libera conteudo premium apos pagamento confirmado ou liberacao manual auditada.
- Produto gratuito tambem deve gerar inscricao ou entitlement para progresso, revogacao e metricas.
- Compra digital deve gerar origem financeira, movimento, factura/recibo quando aplicavel e entitlement rastreavel.
- Factura/recibo Learning nao pode duplicar movimento financeiro nem misturar receita como venda Market.
- Refund, cancelamento, expiracao ou disputa deve revogar, reduzir ou manter acesso conforme politica publicada no momento da compra.
- Certificado so pode ser emitido quando criterios de conclusao estiverem cumpridos.
- Certificado revogado deve manter historico e motivo.
- Mentor/criador so pode publicar conforme papel, permissao e politica do negocio ou do Bizy.
- Comunidade, membership e mentoria paga exigem inscricao activa ou entitlement equivalente.
- Live paga deve declarar regra de replay, presenca e acesso posterior antes da venda.
- Bundle deve preservar entitlement individual dos itens para progresso, certificado e revogacao granular.
- Conteudo premium nao pode aparecer em preview publico, SEO, logs, cache publica, URLs previsiveis ou mensagens de erro.
- Recomendacao automatica nao substitui formacao obrigatoria definida por gestor Team.
- Dados de progresso vinculados a negocio sao dados de trabalho; a visibilidade depende de papel e permissao.
- Afiliados so geram comissao Learning apos pagamento confirmado e regra de anulacao aplicavel.
- Produtos oficiais Bizy e produtos de comerciantes/mentores devem ser identificados claramente.
- Toda alteracao de acesso, preco, refund, certificado, publicacao ou payout deve guardar actor, timestamp e motivo.
- Chat interno Learning serve coordenacao operacional do Team; comunidade publica e atendimento externo continuam canais separados.
- Decisoes, tarefas e suporte registados no chat interno Learning devem guardar autor, papel, contexto e timestamp.

## 10. Requisitos Nao Funcionais

- Mobile-first e tolerante a baixa largura de banda, com experiencia aceitavel em 360px.
- Modo low-data para reduzir imagens, previews pesados, autoplay e downloads automaticos.
- Paginas publicas e player devem carregar conteudo progressivamente, com lazy loading de media.
- Conteudo premium deve ser protegido contra exposicao por URL publica, preview, SEO, logs ou cache indevida.
- Multi-tenant obrigatorio por `negocioId`, utilizador, perfil, produto, entitlement e progresso.
- Auditoria obrigatoria para publicacao, preco, entitlement, certificado, moderacao, refund e payout.
- Privacidade por minimizacao de dados; dados pessoais nao devem ir para URLs, metadata, codigos publicos ou logs.
- Acessibilidade baseline WCAG AA em foco, contraste, teclado, labels, alvos tacteis, captions e transcricoes quando aplicavel.
- Compra digital confirmada deve manter disponibilidade de acesso mesmo com falha temporaria de notificacao ou analytics.
- Webhooks de pagamento, comprovativos, entitlement e documentos devem ser idempotentes e tolerantes a retry.
- Relatorios devem separar dados financeiros, progresso de aprendizagem e actividade de comunidade conforme permissao.
- A arquitectura deve preservar compatibilidade futura com event store/xAPI-like sem depender disso no MVP.
- A experiencia visual do Learning deve ter forca comparavel ao Bizy Market: descoberta por familias, vitrine publica rica, hierarquia clara e backoffice operacional robusto.

## 11. APIs, Telas e Integracoes

APIs iniciais:

- `GET /publico/learning`
- `GET /publico/learning/perfis/:slug`
- `GET /publico/learning/produtos/:slug`
- `POST /publico/learning/eventos`
- `GET /learning/team/resumo`
- `GET /learning/team/analytics`
- `POST /learning/team/perfis`
- `PATCH /learning/team/perfis/:id/publicacao`
- `POST /learning/team/produtos`
- `PATCH /learning/team/produtos/:id/publicacao`
- `POST /learning/team/programas/:slug/atribuir`
- `GET /learning/team/cohorts`
- `POST /learning/team/programas/:slug/cohorts`
- `POST /learning/team/cohorts/:id/presencas`
- `GET /learning/team/comunidades`
- `POST /learning/team/programas/:slug/comunidades`
- `POST /learning/team/comunidades/:id/posts`
- `GET /learning/team/moderacao`
- `POST /learning/team/moderacao/denuncias`
- `PATCH /learning/team/moderacao/:id`
- `POST /learning/checkout`
- `POST /learning/team/compras/:id/ajustar`
- `POST /learning/produtos/:id/inscrever`
- `POST /learning/entitlements/:id/revogar`
- `POST /learning/licoes/:id/concluir`
- `POST /learning/avaliacoes/:id/tentativas`
- `POST /learning/certificados/:id/emitir`
- `GET /learning/progresso`
- `GET /learning/team/chat`
- `GET /learning/team/programas/:slug/chat`
- `POST /learning/team/chat/mensagens`
- `POST /learning/team/programas/:slug/chat/mensagens`

Telas:

- `/learning`: home publica do Bizy Learning.
- `/learning/:slug`: perfil publico Learning.
- `/learning/produtos/:slug`: pagina publica de produto digital.
- `/app/learning`: administracao Team do Learning.
- `/app/loja` ou Studio equivalente: escolha Market, Learning ou ambos.
- `/app/financas`: movimentos, facturas, recibos, comissoes e repasses de origem Learning.

Integracoes:

- Team: papeis, membros, donos de perfil, formacao obrigatoria, cohorts, progresso e tarefas.
- Studio: activacao Market/Learning/Ambos, perfis publicos, elegibilidade e publicacao.
- Market: campanhas cruzadas, formacao de fornecedores e produtos complementares sem misturar stock.
- Financas: movimentos, facturas, recibos, comprovativos, comissoes, repasses e reconciliacao.
- Chat: threads por curso, live, turma, comunidade, mentoria, certificado, suporte ou disputa.
- Chat Interno: decisoes, tarefas, suporte e anuncios ligados a produto/cohort/comunidade, separados de WhatsApp/CRM.
- Afiliados: promocao de produtos Learning com comissao rastreavel.
- CRM/Campanhas: eventos de compra, inscricao, abandono, certificado e upsell conforme consentimento e pertinencia.

## 12. Guardrails

- Nao tratar Learning como catalogo simples de cursos.
- Nao tratar `/learning` como o produto inteiro; ela e a vitrine publica de um ecossistema maior.
- Nao esconder Learning dentro do Team; Team e backoffice, nao vitrine principal.
- Nao copiar LMS academico generico sem venda, comunidade, checkout, financeiro e operacao real do Bizy.
- Nao misturar produto digital com stock fisico do Market.
- Nao liberar conteudo premium por URL publica ou payload publico.
- Nao expor progresso individual a papeis sem permissao.
- Nao emitir certificado sem criterio de conclusao auditavel.
- Nao deixar produto pago sem politica clara de acesso, refund, certificado e suporte.
- Nao permitir que AI aprove certificado, refund, suspensao ou payout sem regra explicita e auditoria.
- Nao considerar recomendacao como substituta de formacao obrigatoria definida pelo gestor Team.

## 13. Estado Atual

Antes desta iniciativa, o Bizy tinha referencias iniciais a Learning como aprendizagem, comunidade e cohorts, mas ainda nao estava suficientemente definido como plataforma de produtos digitais. Este SDD passa a tratar o dominio 15 como learning commerce engine, com RF/RNF/RN detalhados em `docs/RF-RNF-RN-BIZY-LEARNING.md`.

Implementado de forma incremental:

- home publica `/learning`;
- perfil publico `/learning/:slug` e `GET /publico/learning/perfis/:slug`, derivados transitoriamente da configuração Studio `entrega.lojaDigital.learning`;
- produto publico `/learning/produtos/:slug` e `GET /publico/learning/produtos/:slug`, com perfil vendedor, preview seguro, politica de acesso, sinais de confianca, relacionados e SEO basico;
- backoffice Team `/app/learning`;
- programas/produtos digitais iniciais;
- checkout digital Learning;
- entitlement, inscricao, progresso, certificado, ajuste de compra, reembolso/cancelamento e revogacao de acesso relacionado;
- eventos publicos de visualizacao, preview e CTA, com metricas em `/learning/team/resumo` e `GET /learning/team/analytics`;
- chat interno Learning por programa, persistido transitoriamente em `EventoOperacional`;
- comunidades/memberships Team e moderação base, persistidas transitoriamente em `EventoOperacional`;
- base Studio Market/Learning/Ambos em `/app/loja`, com `participaNoLearning` e perfil Learning transitorio em `entrega.lojaDigital.learning`;
- testes HTTP e frontend targeted para o fluxo base.

## 14. Lacunas

- P0: documentacao consolidada, home `/learning`, backoffice `/app/learning`, produto digital basico, checkout Learning, entitlement, inscricao, progresso, certificado e chat interno por programa.
- P1: concluir schema dedicado e tabela `LearningProfile`, owners/permissões finas, imagem/capa, SEO social completo, elegibilidade Studio, comprovativo/factura completo, checkout publico completo, cohorts/lives recorrentes, comunidades publicas, moderacao completa e metricas separadas.
- P2: assinaturas, bundles avancados, memberships, mentorias pagas, afiliados Learning, analytics de retencao, mobile offline parcial e recomendacoes por evento operacional.
- P3: streaming adaptativo, xAPI/LRS-like event store, certificacoes verificaveis avancadas, marketplace de criadores e reputacao publica.

## 15. Testes e Verificacao

Checklist documental:

- nenhum requisito trata Learning como catalogo simples;
- nenhum fluxo mistura stock fisico do Market com acesso digital do Learning;
- Studio suporta Market, Learning ou ambos;
- Team e backoffice administrativo do Learning;
- Financas recebe movimentos/facturas ligados a compras digitais;
- regras cobrem produtos gratuitos, pagos, bundles, memberships, lives, mentorias e certificacoes.

Validacao futura de implementacao:

- testes HTTP para home Learning, perfil, produto digital, publicacao, checkout, entitlement e progresso;
- testes HTTP para chat interno Learning por programa/cohort/comunidade e tipos mensagem/decisao/tarefa/suporte;
- testes HTTP para denuncias, fila de moderacao, decisao humana e ocultacao temporaria;
- testes de permissao para dono, admin, gestor, mentor, criador, parceiro e comprador;
- testes de isolamento por `negocioId`, utilizador, produto e entitlement;
- testes de revogacao de acesso apos refund, cancelamento, expiracao ou suspensao;
- testes financeiros para movimento, factura/recibo, comprovativo, comissao e repasse de origem Learning;
- browser QA em `/learning`, `/app/learning` e Studio.
- QA visual para garantir que a experiencia publica tem qualidade comparavel ao Market e nao parece pagina solta.

## 16. Proximos Planos

- Spec de schema dedicado do Learning.
- Spec de Studio Market/Learning/Ambos.
- Spec de checkout digital, entitlement e documentos financeiros Learning.
- Spec de comunidades, cohorts, lives, mentorias e certificados.
- Spec de analytics Learning e ligacao com Team/CRM/Financas.
