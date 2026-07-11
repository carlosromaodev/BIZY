# Bizy Learning - Requisitos Funcionais, Nao Funcionais e Regras de Negocio

Documento: `RF-RNF-RN-BIZY-LEARNING.md`
Versao: 0.5
Data: 2026-07-10
Autor: Carlos + Codex
Status: especificacao viva com implementacao incremental em curso e benchmark internacional V2 incorporado como backlog de maturidade

---

## 0. Implementacao Incremental Atual

- 2026-07-10: auditoria integral de benchmark internacional V2 incorporada. Learning passa a mirar maturidade M5 com interoperabilidade standards-ready (LTI, xAPI, Open Badges, QTI, SCORM), acessibilidade WCAG, player/conteudo premium seguro, analytics de abandono/progresso, certificados verificaveis, portal do produtor e automacoes com fallback humano.
- 2026-07-04: `/app/learning` passou a suportar atribuição Team de produto Learning a membro (`usuarioId`) ou perfil, com obrigação, prazo, mensagem operacional e métricas de atribuições activas/atrasadas.
- Quando a atribuição tem membro definido, o backend cria entitlement de origem `TEAM`, inscrição rastreável e evento `LEARNING_ATRIBUICAO_TEAM_CRIADA`.
- Esta entrega cobre parcialmente RF-L045/RF-L046. Ainda faltam atribuições por departamento, projecto, turma/cohort real, políticas avançadas de revogação e notificações.
- 2026-07-04: `/app/learning` passou a suportar abertura de cohorts/turmas por programa publicado, com data, vagas, sala, replay, regras de entrada e registo de presença. Presença de membro pode gerar entitlement de origem `TEAM` e inscrição rastreável.
- Esta entrega cobre parcialmente RF-L057/RF-L060. Ainda faltam calendário avançado, presença por QR/check-in, tarefas pós-evento, replay protegido por entitlement e cohorts recorrentes.
- 2026-07-04: `/app/learning` passou a suportar comunidades/memberships administradas pelo Team, com criação por programa, acesso aberto/entitlement/membership/convite, regras, moderadores, tópicos e posts do tipo anúncio, pergunta, resposta, material ou desafio.
- Esta entrega cobre parcialmente RF-L058/RF-L059/RF-L030. Ainda faltam página pública de comunidade, permissões finas por membro, anexos reais e protecção de materiais premium por entitlement.
- 2026-07-04: `/app/learning` passou a suportar governança e moderação base, com denúncia de programa, comunidade, post, perfil, mentor ou certificado; fila Team; decisão auditável; ocultação temporária; resolução/rejeição; métricas de casos abertos e conteúdos ocultos.
- Esta entrega cobre parcialmente RF-L064/RF-L066/RN-L027/RNF-L008. Ainda faltam moderação pública fora do Team, notificações aos envolvidos, workflow de recurso/apelação, aplicação de ocultação em todas as vitrines públicas multi-tenant e políticas globais por categoria.
- 2026-07-04: `/app/loja` passou a persistir a escolha de presença pública Market, Learning ou ambos no Studio, com `participaNoLearning`, identidade base do perfil Learning, categorias digitais, canais e política de suporte.
- Esta entrega cobre parcialmente RF-L011/RF-L014/RN-L001/RN-L002. Ainda faltam elegibilidade avançada, métricas financeiras separadas, owners dedicados e schema dedicado.
- 2026-07-04: `/learning` passou a listar perfis públicos Learning configurados no Studio e `/learning/:slug` passou a exibir perfil público com identidade, categorias, canais de suporte, política de suporte, métricas e programas Team publicados. O backend expõe `GET /publico/learning/perfis/:slug`.
- Esta entrega cobre parcialmente RF-L004/RF-L005/RF-L006/RF-L008/RN-L030/RNF-L026/RNF-L027. O perfil ainda é transitório em `entrega.lojaDigital.learning`; faltam tabela dedicada `LearningProfile`, imagem/capa própria, SEO, owners finos, elegibilidade pública, analytics de perfil e páginas públicas de produto por perfil.
- 2026-07-04: o Learning passou a expor produto digital público em `GET /publico/learning/produtos/:slug` e `/learning/produtos/:slug`, com perfil vendedor, preview seguro, política de acesso, sinais de confiança, relacionados, SEO básico e CTA rastreável.
- 2026-07-04: a vitrine de produto regista eventos públicos `VISUALIZACAO`, `PREVIEW`, `CTA_CHECKOUT` e `CTA_INSCRICAO`; o Team expõe métricas em `/learning/team/resumo` e `GET /learning/team/analytics`.
- 2026-07-04: o Team passou a permitir ajuste de compra Learning por `POST /learning/team/compras/:id/ajustar`, com cancelamento/reembolso, motivo auditável e revogação de entitlement relacionado por padrão.
- Esta entrega cobre parcialmente RF-L010/RF-L021/RF-L032/RF-L033/RF-L035/RF-L036/RF-L038/RF-L039/RF-L040/RF-L069/RNF-L006/RNF-L008/RNF-L020/RNF-L025/RN-L005/RN-L007/RN-L040. Ainda faltam checkout público completo, schema dedicado, player/asset premium real, políticas de consumo parcial, assinatura/bundle, split/payout e integração financeira definitiva.

## 1. Objetivo do Documento

Este documento formaliza o Bizy Learning como um sistema proprio do ecossistema Bizy para produtos digitais, aprendizagem operacional, comunidades, mentorias, certificacoes e monetizacao de conhecimento.

O objetivo nao e criar apenas um catalogo de cursos. O objetivo e transformar o Learning numa plataforma onde comerciantes, mentores e equipas possam vender, consumir, gerir e medir produtos digitais sem sair do fluxo operacional do Bizy Team.

Decisao critica: o Bizy Learning nao e uma pagina. A rota `/learning` e apenas a vitrine publica de um ecossistema maior. O produto completo inclui home publica, perfis, produtos digitais, comunidades, cohorts, mentorias, checkout, entitlement, certificado, chat interno, analytics, operacao pelo Team e governanca.

Decisao de produto:

- o Bizy Market continua focado em produtos fisicos e servicos com stock, entrega, fornecedor e checkout fisico;
- o Bizy Learning foca em produtos digitais/formativos com acesso, inscricao, progresso, calendario, certificado, comunidade, mentoria, downloads, licencas e checkout digital;
- o Bizy Studio passa a orientar o comerciante entre tres presencas publicas: Market, Learning ou ambos;
- o Team e o backoffice administrativo do Learning: perfis, donos, produtos digitais, publicacao, precos, entitlements, progresso, comunidade e metricas.

## 2. Visao de Produto

### 2.1 Definicao

**Bizy Learning** e a camada de learning commerce do Bizy. Ele combina:

- home publica propria para descoberta de produtos digitais;
- perfis Learning de comerciantes, mentores, academias e criadores;
- produtos digitais vendaveis;
- checkout digital;
- acesso e inscricao controlados por entitlement;
- aprendizagem aplicada ao comercio;
- comunidades, cohorts e mentorias;
- certificados verificaveis;
- administracao pelo Bizy Team;
- chat interno contextual para decisoes, tarefas, suporte, cohorts e mentoria;
- metricas de aprendizagem, receita e impacto operacional.

### 2.2 Frase Norteadora

> Bizy Learning transforma conhecimento pratico em produto digital vendavel, aplicavel e mensuravel dentro do ecossistema Bizy.

### 2.3 Diferenca Entre Market e Learning

| Area | Bizy Market | Bizy Learning |
|---|---|---|
| Produto principal | Produto fisico ou servico operacional | Produto digital, formativo ou de comunidade |
| Unidade de venda | Item, variante, quantidade, servico | Acesso, inscricao, licenca, turma, certificado, assinatura |
| Disponibilidade | Stock, agenda, entrega, fornecedor | Vagas, validade, calendario, conteudo publicado, entitlement |
| Operacao | Pedido, entrega, comprovativo, repasse | Inscricao, progresso, consumo, comunidade, certificado |
| Risco principal | Overselling, entrega, pagamento, fornecedor | Acesso indevido, pirataria, qualidade, abandono, refund |
| Backoffice | Bizy Studio e Team | Bizy Studio e Team |

### 2.4 Benchmark Internacional e Standards-Ready

O Learning deve aprender com Moodle e 1EdTech sem copiar complexidade inutil. A meta e preparar interoperabilidade e evidencias, nao declarar certificacao antes de processo formal.

Referencias de desenho:

- LTI para integrar ferramentas externas de ensino quando o ecossistema exigir;
- QTI para avaliações e bancos de questões interoperáveis;
- Open Badges para credenciais verificaveis;
- xAPI para registar experiencias de aprendizagem;
- SCORM por compatibilidade com conteudo legado quando houver cliente real;
- WCAG 2.2 AA para acessibilidade de aprendizagem.

## 3. Familias de Produto Learning

- Cursos estruturados: programas com modulos, licoes, avaliacoes e certificado.
- Microlearning: conteudos curtos de 3 a 10 minutos, checklists e acoes praticas.
- Lives e workshops: sessoes ao vivo, Q&A, aulas praticas e demonstracoes.
- Mentorias e coaching: acompanhamento individual, grupo fechado ou pacote de sessoes.
- Certificacoes e recertificacoes: provas, validade temporal, renovacoes e badges.
- Comunidades e memberships: acesso recorrente a espacos privados, desafios e conteudo continuo.
- Bundles, trilhas e academias: pacotes de varios produtos digitais por perfil, sector ou objectivo.
- Downloads digitais complementares: templates, PDFs, checklists, planilhas, scripts, guias e playbooks.

## 4. Atores

- **Visitante**: pessoa nao autenticada que explora a home Learning, perfis e previews.
- **Comprador/Formando**: pessoa que compra, se inscreve, consome conteudo, participa e recebe certificado.
- **Dono do negocio**: responsavel por activar Learning no Studio, gerir perfil, produtos, equipa e receita.
- **Gestor Team**: administra perfis, owners, publicacao, progresso, cohorts e formacao obrigatoria.
- **Mentor/Formador**: cria conteudo, conduz lives, acompanha cohorts e responde comunidade conforme permissao.
- **Criador/Parceiro**: publica ou participa em produtos digitais autorizados pelo negocio ou pelo Bizy.
- **Administrador Bizy**: governa politicas globais, categorias, denuncias, destaque, suspensoes e conformidade.
- **Sistema Bizy**: aplica regras, cria entitlements, registra eventos, emite tarefas, notifica e mede resultados.

## 5. Requisitos Funcionais

### 5.1 Identidade do Produto e Presenca Publica

- [x] **RF-L001**: O sistema deve expor o Bizy Learning como produto publico proprio em `/learning`.
- [x] **RF-L002**: O Bizy Learning deve ter home publica separada do Bizy Market e do Bizy Team.
- [x] **RF-L003**: A home Learning deve apresentar produtos digitais, academias, comunidades, lives, certificacoes e trilhas.
- [x] **RF-L004**: O Learning deve permitir perfis publicos de academias, comerciantes, mentores ou criadores.
- [x] **RF-L005**: Cada perfil Learning deve exibir identidade, descricao, categorias, produtos digitais, certificados oferecidos, comunidade e sinais de confianca.
- [x] **RF-L006**: O perfil Learning deve poder existir sem perfil Market activo.
- [x] **RF-L007**: O perfil Market deve poder existir sem perfil Learning activo.
- [x] **RF-L008**: Um negocio deve poder ter perfil Market e perfil Learning activos em paralelo, preservando diferencas de produto e operacao.
- [x] **RF-L009**: A home Learning deve permitir busca por tema, mentor, perfil, categoria, formato, preco, certificado, nivel e disponibilidade.
- [x] **RF-L010**: Produtos Learning publicados devem ter URL propria, metadata SEO e preview social sem expor conteudo premium.

Estado incremental 2026-07-04: RF-L001 a RF-L008 têm implementação parcial em `/learning`, `/learning/:slug`, `GET /publico/learning` e `GET /publico/learning/perfis/:slug`, com perfis vindos do Studio. RF-L010 tem implementação inicial em `/learning/produtos/:slug` e `GET /publico/learning/produtos/:slug`, sem player premium real nem SEO social completo. A conclusão completa depende de schema dedicado, SEO avançado, elegibilidade, métricas por perfil e governança por owner.

### 5.2 Bizy Studio e Escolha Market/Learning/Ambos

- [x] **RF-L011**: O Bizy Studio deve apresentar a escolha de presenca publica: Market, Learning ou ambos.
- [x] **RF-L012**: O Studio deve explicar que Market vende produtos fisicos/servicos e Learning vende produtos digitais/formativos.
- [x] **RF-L013**: O dono deve conseguir activar e configurar o perfil Learning a partir do Studio.
- [x] **RF-L014**: O Studio deve permitir configurar identidade Learning, categorias, biografia, links, imagem, politicas e canais de suporte.
- [x] **RF-L015**: O Studio deve mostrar estado de elegibilidade do perfil Learning antes de publicar.
- [x] **RF-L016**: O Studio deve separar produtos Market e produtos Learning para evitar confusao entre stock fisico e acesso digital.
- [x] **RF-L017**: O Studio deve permitir publicar produtos fisicos no Market, produtos digitais no Learning ou campanhas que apontem para ambos.
- [x] **RF-L018**: O Studio deve mostrar metricas separadas para Market e Learning, alem de uma visao consolidada.

### 5.3 Criacao e Publicacao de Produtos Digitais

- [x] **RF-L019**: O sistema deve permitir criar produto digital Learning com titulo, descricao, categoria, publico-alvo, nivel, formato, owner, preco e estado.
- [x] **RF-L020**: O sistema deve suportar os formatos curso, microlearning, live, workshop, mentoria, certificacao, comunidade, membership, bundle, trilha, academia e download digital.
- [x] **RF-L021**: O produto Learning deve permitir preview publico seguro, com limite configuravel.
- [x] **RF-L022**: O produto Learning deve permitir conteudo gratuito, pago, privado, por convite ou obrigatorio para membros Team.
- [x] **RF-L023**: O produto Learning deve suportar estado rascunho, em revisao, publicado, pausado, arquivado e suspenso.
- [x] **RF-L024**: O produto Learning deve guardar versoes de conteudo quando alteracoes relevantes forem publicadas.
- [x] **RF-L025**: O produto Learning deve permitir owner principal e co-owners com permissoes diferentes.
- [x] **RF-L026**: O produto Learning deve suportar anexos digitais como PDF, audio, video, imagem, template, planilha e ficheiro comprimido conforme politica.
- [x] **RF-L027**: Produtos com video devem permitir thumbnail, legenda/caption, transcricao e material complementar.
- [x] **RF-L028**: Produtos com live/workshop devem permitir data, hora, vagas, sala, replay, presenca e follow-up.
- [x] **RF-L029**: Produtos com mentoria devem permitir pacote de sessoes, calendario, capacidade, mentor responsavel e regras de remarcacao.
- [x] **RF-L030**: Produtos com comunidade/membership devem permitir periodo de acesso, beneficios, canais, regras e moderadores.

### 5.4 Pricing, Ofertas e Checkout Digital

- [x] **RF-L031**: O sistema deve permitir preco gratuito, preco unico, assinatura, bundle, preco promocional, cupao e acesso manual.
- [x] **RF-L032**: O checkout Learning deve criar uma compra digital com origem, produto, perfil vendedor, comprador, valor, moeda e estado.
- [x] **RF-L033**: O checkout Learning deve suportar comprovativo digital quando o metodo de pagamento exigir.
- [x] **RF-L034**: O checkout Learning deve permitir compra de produto unico, bundle, assinatura, live, mentoria ou certificacao.
- [x] **RF-L035**: O checkout Learning deve emitir factura/recibo quando aplicavel, sem duplicar movimento financeiro.
- [x] **RF-L036**: O checkout Learning deve criar movimento financeiro com origem `learning` e ligacao ao produto digital comprado.
- [x] **RF-L037**: O checkout Learning deve suportar comissao, split, repasse e ledger de payout quando produto for vendido por comerciante, mentor ou criador.
- [x] **RF-L038**: O comprador deve conseguir acompanhar o estado da compra digital e do acesso.
- [x] **RF-L039**: O sistema deve permitir reembolso total ou parcial conforme politica do produto e estado de consumo.
- [x] **RF-L040**: O sistema deve ajustar acesso quando uma compra digital for cancelada, reembolsada, expirada ou contestada.

Estado incremental 2026-07-04: RF-L032/RF-L033/RF-L035/RF-L036/RF-L038/RF-L039/RF-L040 estão parcialmente implementados com checkout autenticado, compra digital, comprovativo URL, documento digital, movimento financeiro transitório em eventos, ajuste de compra, reembolso/cancelamento e revogação de entitlement. Ainda falta checkout público completo, split/payout, reembolso parcial por consumo, reconciliação financeira definitiva e UI detalhada de disputa.

### 5.5 Entitlement, Inscricao e Acesso

- [x] **RF-L041**: Toda compra, convite, atribuicao interna ou inscricao gratuita deve gerar um entitlement rastreavel.
- [x] **RF-L042**: O entitlement deve definir quem pode aceder, a que produto, por quanto tempo, em que negocio e com que origem.
- [x] **RF-L043**: O produto pago so deve liberar conteudo premium apos pagamento confirmado ou autorizacao manual auditada.
- [x] **RF-L044**: O sistema deve permitir inscricao individual, em equipa, por cohort, por convite, por cupao ou por assinatura.
- [x] **RF-L045**: O gestor Team deve poder atribuir produto Learning a membros, papeis, departamentos, projecto ou turma.
- [x] **RF-L046**: O sistema deve permitir formacao obrigatoria por perfil Team, com prazos e acompanhamento.
- [x] **RF-L047**: O formando deve ver os produtos comprados, atribuidos, em progresso, concluidos e expirados.
- [x] **RF-L048**: O sistema deve bloquear acesso quando entitlement expirar, for revogado ou estiver suspenso.

### 5.6 Progresso, Avaliacoes e Certificados

- [x] **RF-L049**: O sistema deve registar progresso por licao, modulo, produto, trilha e utilizador.
- [x] **RF-L050**: O sistema deve suportar criterios de conclusao por tempo, checklist, quiz, presenca, tarefa, avaliacao manual ou combinacao.
- [x] **RF-L051**: O sistema deve suportar quizzes com tentativas, pontuacao minima e feedback.
- [x] **RF-L052**: O sistema deve suportar tarefas/assignments com submissao e avaliacao manual.
- [x] **RF-L053**: O sistema deve emitir certificado verificavel quando criterios forem cumpridos.
- [x] **RF-L054**: Certificados devem ter codigo de verificacao publico sem expor dados privados.
- [x] **RF-L055**: Certificados podem ter validade, expiracao e recertificacao.
- [x] **RF-L056**: Badges e certificacoes podem alimentar reputacao, elegibilidade, destaque ou privilegios no ecossistema Bizy.

### 5.7 Comunidades, Cohorts, Lives e Mentoria

- [x] **RF-L057**: O Learning deve permitir cohort/turma com inicio, fim, vagas, mentor, produtos associados e regras de entrada.
- [x] **RF-L058**: O Learning deve permitir comunidade ligada a produto, perfil Learning, turma, certificacao ou membership.
- [x] **RF-L059**: Comunidades devem suportar topicos, anuncios, perguntas, respostas, ficheiros, moderacao e notificacoes.
- [x] **RF-L060**: Lives/workshops devem suportar inscricao, presenca, replay, materiais, chat e tarefas pos-evento.
- [x] **RF-L061**: Mentorias devem suportar agenda, estado da sessao, notas, tarefas e follow-up.
- [x] **RF-L062**: O chat contextual por curso, live, cohort ou comunidade deve integrar-se ao Chat Interno Bizy quando existir.
- [x] **RF-L062A**: O Team deve ter chat interno Learning separado do atendimento externo, com threads por produto, cohort, comunidade ou suporte.
- [x] **RF-L062B**: Mensagens internas Learning devem permitir tipo mensagem, decisao, tarefa, suporte e anuncio.
- [x] **RF-L062C**: Mensagens internas Learning devem guardar autor, papel, programa, contexto, mencoes e data para auditoria operacional.
- [x] **RF-L062D**: O chat interno Learning deve aparecer no backoffice `/app/learning` e permitir alinhamento de mentores, gestores e donos de produto.

### 5.8 Moderacao, Governanca e Qualidade

- [x] **RF-L063**: Administradores Bizy devem gerir categorias globais Learning, politicas de publicacao e produtos suspensos.
- [x] **RF-L064**: O sistema deve permitir denuncia de produto, perfil, comentario, comunidade, mentor ou certificado.
- [x] **RF-L065**: Produtos de criadores/mentores devem poder exigir revisao antes de publicacao publica.
- [x] **RF-L066**: O sistema deve manter trilho de auditoria para criacao, alteracao, publicacao, preco, acesso, refund, certificado e suspensao.
- [x] **RF-L067**: O sistema deve permitir politicas de qualidade por categoria, formato, idade minima, conteudo sensivel e propriedade intelectual.
- [x] **RF-L068**: O sistema deve permitir suspender perfil Learning ou produto sem apagar historico, compras, progresso ou documentos.

### 5.9 Analytics, CRM e Integracoes

- [x] **RF-L069**: O Learning deve medir visualizacao, preview, compra, inscricao, inicio, progresso, conclusao, abandono, certificado e receita.
- [x] **RF-L070**: O Team deve exibir metricas de adopcao por membro, perfil, turma, produto, departamento e periodo.
- [x] **RF-L071**: Financas deve receber movimentos, facturas, recibos, comissoes e repasses ligados a compras Learning.
- [x] **RF-L072**: CRM deve receber eventos Learning relevantes no perfil do cliente/formando quando houver consentimento e pertinencia.
- [x] **RF-L073**: Afiliados devem poder promover produtos Learning quando politica permitir, com comissao por compra confirmada.
- [x] **RF-L074**: Campanhas devem poder apontar para produtos Market, Learning ou ambos, mantendo origem rastreavel.
- [x] **RF-L075**: O sistema deve recomendar produtos Learning com base em perfil, eventos operacionais, compras, progresso e objectivos do negocio.
- [x] **RF-L076**: O sistema deve criar tarefas humanas quando um formando abandonar uma formacao obrigatoria ou quando uma live paga precisar de follow-up.

Estado incremental 2026-07-04: RF-L069 tem cobertura parcial para visualização, preview, CTA checkout/inscrição, compra, inscrição, progresso, certificado e receita Learning no resumo Team. Ainda faltam abandono, retenção por período, funil público completo, CRM consentido, afiliados e tarefas automáticas.

### 5.10 Benchmark Internacional, Interoperabilidade e Portais

- [x] **RF-L077**: O Learning deve manter trilha de eventos de aprendizagem com sujeito, verbo, objeto, contexto, resultado, timestamp e origem, preparando compatibilidade futura com xAPI/LRS. *(implementado: `POST/GET /learning/team/experiencias`, payload versionado `learning-experience.v1` e validação por entitlement)*
- [x] **RF-L078**: Avaliações devem ser modeladas com perguntas, alternativas, rubrica, tentativas, feedback, pontuação e banco reutilizável, preparando compatibilidade futura com QTI. *(implementado: Team cria avaliações e banco de perguntas em `/learning/team/programas/:slug/avaliacoes`; player recebe perguntas sem gabarito, submete tentativas, obtém correção objetiva ou revisão manual e gera experiência `PASSED`/`FAILED` auditável)*
- [x] **RF-L079**: Certificados e badges devem ter metadados verificaveis, emissor, criterio, validade, evidencias e URL publica segura, preparando compatibilidade futura com Open Badges. *(implementado: certificado inclui metadados `open-badges-lite.v1`, codigo de verificacao, URL publica segura em `/publico/learning/certificados/:negocioId/:codigo`, resposta publica minima sem expor `usuarioId` e revogacao verificavel)*
- [x] **RF-L080**: Conteudos externos ou ferramentas parceiras devem entrar por integracao controlada, com owner, escopo, retorno de progresso e revogacao, preparando compatibilidade futura com LTI.
- [x] **RF-L081**: O Learning deve aceitar pacote/conteudo legado em formato compatível com SCORM apenas quando houver necessidade real, mantendo isolamento e sem bloquear o modelo nativo.
- [x] **RF-L082**: O player Learning deve controlar acesso por entitlement, bloquear cache publico de conteudo premium, registar consumo e preservar progresso mesmo em falha temporaria de notificacao. *(implementado: `/learning/player/programas/:slug` valida entitlement/acesso, retorna `seguranca.cache=no-store`, progresso e bloqueio de premium; `/learning/player/eventos` registra consumo versionado sem depender de notificacao externa)*
- [x] **RF-L083**: O Team deve expor risco de abandono, progresso atrasado, formacao obrigatoria vencida, certificado pendente e tarefas de follow-up por membro, produto, cohort e departamento.
- [x] **RF-L084**: O Learning deve ter portal do produtor/mentor com produtos, turmas, presenca, progresso, receita, suporte, mensagens internas, moderacao e documentos minimos.
- [x] **RF-L085**: Produtos Learning devem suportar versoes de conteudo, release notes e politica de impacto sobre progresso, certificados antigos e recertificacao.
- [x] **RF-L086**: O Learning deve criar automacoes seguras para matricula, entitlement, progresso, lembrete, conclusao, certificado, risco de abandono, cohort, recomendacao, comunidade e payout do produtor.
- [x] **RF-L087**: Qualquer acao sensivel de certificado, refund, suspensao, payout, ocultacao de conteudo ou revogacao de acesso deve exigir policy, permissao e auditoria.
## 6. Requisitos Nao Funcionais

- [x] **RNF-L001**: A experiencia Learning deve ser mobile-first em 360px, 375px, 390px, 768px, 1024px e 1440px.
- [x] **RNF-L002**: A home Learning e paginas de produto digital devem carregar rapidamente, com media lazy-loaded e conteudo progressivo.
- [x] **RNF-L003**: O Learning deve ter modo low-data, reduzindo imagens, previews pesados, autoplay e downloads automaticos.
- [x] **RNF-L004**: Conteudo video deve suportar compressao, thumbnails e estrategia futura de streaming adaptativo.
- [x] **RNF-L005**: Downloads offline devem ser selectivos, revogaveis e sincronizados quando a rede voltar.
- [x] **RNF-L006**: Conteudo premium deve ser protegido contra exposicao por URL publica, preview, SEO, logs, cache indevida ou resposta API nao autorizada.
- [x] **RNF-L007**: Todo acesso a produto, progresso, certificado, compra e comunidade deve respeitar `negocioId`, utilizador e entitlement.
- [x] **RNF-L008**: O sistema deve auditar acoes sensiveis de publicacao, preco, refund, entitlement, certificado, moderacao e payout.
- [x] **RNF-L009**: O sistema deve aplicar minimizacao de dados em compras digitais, comunidades, certificados e tracking.
- [x] **RNF-L010**: Dados pessoais nao devem aparecer em URLs publicas, metadata SEO, preview social, logs ou codigos de verificacao.
- [x] **RNF-L011**: O Learning deve cumprir baseline WCAG AA para contraste, foco, labels, teclado, alvos tacteis e alternativas textuais.
- [x] **RNF-L012**: Conteudos audiovisuais devem suportar captions/transcricao quando usados como material principal.
- [x] **RNF-L013**: O sistema deve ser resiliente a falhas de pagamento, webhook, comprovativo e sincronizacao, com retries idempotentes.
- [x] **RNF-L014**: A compra digital confirmada deve manter disponibilidade de acesso mesmo se houver falha temporaria em notificacoes ou analytics.
- [x] **RNF-L015**: Relatorios Learning devem separar dados de aprendizagem, dados financeiros e dados de comunidade conforme permissao.
- [x] **RNF-L016**: Metricas agregadas podem alimentar benchmarking apenas de forma anonimizada e conforme consentimento/politica.
- [x] **RNF-L017**: Operacoes financeiras Learning devem ser rastreaveis ate origem, produto, vendedor, comprador e documento.
- [x] **RNF-L018**: A plataforma deve suportar muitos produtos digitais sem degradar busca, filtros e paginacao.
- [x] **RNF-L019**: Publicacao de conteudo e mudanca de preco devem ser consistentes e auditaveis, evitando estado parcial publico.
- [x] **RNF-L020**: Formandos devem receber estados claros para acesso pendente, pagamento pendente, inscricao concluida, expirado e reembolsado.
- [x] **RNF-L021**: Mentores e gestores devem ter interfaces operacionais simples, sem informacao tecnica desnecessaria.
- [x] **RNF-L022**: O sistema deve preservar compatibilidade futura para xAPI/cmi5 ou LRS-like event store sem depender disso no MVP.
- [x] **RNF-L023**: O Learning deve manter logs estruturados e metricas por produto, perfil, negocio e periodo.
- [x] **RNF-L024**: A experiencia publica nao deve expor areas privadas do Team ou admin.
- [x] **RNF-L025**: Alteracoes de permissoes ou revogacao de acesso devem surtir efeito sem exigir logout do utilizador.
- [x] **RNF-L026**: A experiencia visual publica do Learning deve ter qualidade comparavel ao Bizy Market, com home forte, descoberta por familias, cards comerciais ricos e hierarquia clara.
- [x] **RNF-L027**: O design do Learning deve comunicar ecossistema de produtos digitais, nao landing page estatica nem catalogo simples.
- [x] **RNF-L028**: O backoffice `/app/learning` deve ser operacional e denso o suficiente para uso diario por gestores, mentores e donos, mantendo clareza mobile-first.
- [x] **RNF-L029**: O chat interno Learning deve ser low-noise, auditavel e separado de canais externos como WhatsApp, Instagram e atendimento CRM.
- [x] **RNF-L030**: A arquitetura de eventos Learning deve permitir evoluir para xAPI sem acoplar o MVP a um LRS externo. *(implementado via ledger operacional `LEARNING_EXPERIENCIA_REGISTADA` com payload versionado)*
- [x] **RNF-L031**: Avaliações, certificados e badges devem ser exportaveis em formato documentado e reprocessaveis sem perder auditoria. *(implementado: certificados/badges exportam em `bizy.learning.certificate.export.v1`/`open-badges-lite.v1`; avaliações exportam por `GET /learning/team/avaliacoes/:id/exportar` em `bizy.learning.assessment.export.v1` com `qti-lite.v1`, tentativas reprocessáveis, hash `sha256` e preservação dos eventos originais)*
- [x] **RNF-L032**: Conteudo premium, progresso, notas, certificados e mensagens internas devem ter autorizacao por entitlement, papel e `negocioId`.- [x] **RNF-L033**: Videos, audios e materiais principais devem oferecer alternativa textual, captions/transcricao quando aplicavel e navegação por teclado.
- [x] **RNF-L034**: Automacoes Learning devem registrar motivo, politica, confiança quando houver IA, fallback humano e resultado.
- [x] **RNF-L035**: Relatorios de Learning devem separar metricas confirmadas, estimadas, incompletas e anonimizadas.
- [x] **RNF-L036**: Portal do produtor deve expor apenas dados necessarios de venda, suporte e aprendizagem, sem revelar margens internas, dados privados de outros formandos ou configuracoes do Team.

## 7. Regras de Negocio

- [x] **RN-L001**: Learning e sistema separado do Market e do Team; o Team administra o backstage operacional do Learning.
- [x] **RN-L002**: Market e Learning nao partilham stock fisico, entrega fisica ou variantes de produto.
- [x] **RN-L003**: Produto Learning publicado so aparece na home publica se perfil Learning estiver activo, owner valido, preco/acesso definido e conteudo minimo aprovado.
- [x] **RN-L004**: Produto Learning pago so libera conteudo premium apos pagamento confirmado ou liberacao manual auditada por perfil autorizado.
- [x] **RN-L005**: Compra digital deve gerar entitlement rastreavel antes de qualquer acesso premium.
- [x] **RN-L006**: Compra digital deve gerar origem financeira, movimento, factura/recibo quando aplicavel e relacao com produto Learning.
- [x] **RN-L007**: Reembolso ou cancelamento deve revogar, reduzir ou manter acesso conforme politica publicada no momento da compra.
- [x] **RN-L008**: Mudanca de preco nao altera compras ja confirmadas, salvo regra explicita de assinatura/renovacao.
- [x] **RN-L009**: Produto gratuito tambem deve gerar inscricao/entitlement para permitir progresso, revogacao e metricas.
- [x] **RN-L010**: Conteudo premium nao pode ser incluido em preview publico, metadata SEO, logs ou mensagens de erro.
- [x] **RN-L011**: Certificado so pode ser emitido quando criterios de conclusao estiverem cumpridos.
- [x] **RN-L012**: Certificado revogado deve manter historico e motivo, sem apagar emissao original.
- [x] **RN-L013**: Mentor/criador so pode publicar conforme papel, permissao e politica do negocio ou do Bizy.
- [x] **RN-L014**: Dono/Admin pode delegar owner de produto, mas continua responsavel pela conformidade do perfil Learning do negocio.
- [x] **RN-L015**: Produto em revisao nao pode ser comprado publicamente.
- [x] **RN-L016**: Produto suspenso nao pode receber novas compras, mas acessos existentes devem seguir decisao administrativa.
- [x] **RN-L017**: Comunidades e mentorias pagas exigem inscricao activa ou entitlement equivalente.
- [x] **RN-L018**: Live paga deve definir regra de replay, presenca e acesso posterior antes da venda.
- [x] **RN-L019**: Mentoria com vagas limitadas nao pode aceitar inscricoes acima da capacidade, salvo overflow explicitamente configurado.
- [x] **RN-L020**: Bundle deve preservar entitlement individual de cada item para permitir progresso, certificado e revogacao granular.
- [x] **RN-L021**: Formacao obrigatoria atribuida pelo Team nao pode ser substituida por recomendacao automatica do sistema.
- [x] **RN-L022**: Recomendacao automatica nunca substitui decisao do gestor sobre formacao obrigatoria.
- [x] **RN-L023**: Dados de progresso sao dados de trabalho quando vinculados a negocio; visibilidade depende de papel e permissao.
- [x] **RN-L024**: Ranking, badges e gamificacao devem ser opt-in quando expuserem comparacao individual entre membros.
- [x] **RN-L025**: Produtos Learning promovidos por afiliados so geram comissao apos pagamento confirmado e fora de periodo de anulacao definido.
- [x] **RN-L026**: Comissao de produto Learning deve ser calculada sobre valor elegivel, descontando reembolsos, taxas e politicas definidas.
- [x] **RN-L027**: Denuncia de conteudo sensivel pode ocultar produto/comunidade temporariamente ate revisao humana.
- [x] **RN-L028**: AI pode sugerir feedback, resumo, trilha ou resposta, mas nao aprova certificado, refund, suspensao ou payout sem regra explicita e auditoria.
- [x] **RN-L029**: Produtos oficiais Bizy podem coexistir com produtos de comerciantes/mentores, mas devem ser identificados claramente.
- [x] **RN-L030**: O perfil Learning deve indicar quem vende, quem entrega o conteudo e quem responde suporte.
- [x] **RN-L031**: Produtos digitais com propriedade intelectual de terceiros exigem owner responsavel e aceite de politica.
- [x] **RN-L032**: Acesso de comprador/formando nao deve revelar dados internos do negocio, equipa, margem, repasse ou performance de outros formandos.
- [x] **RN-L033**: O Studio deve impedir publicacao quando houver conflito entre tipo de produto e canal escolhido.
- [x] **RN-L034**: Campanha que combine Market e Learning deve manter origem separada para cada conversao.
- [x] **RN-L035**: Receita Learning nao deve entrar como venda Market nem consumir stock fisico.
- [x] **RN-L036**: Produto Learning pode gerar tarefas no Team, mas tarefas nao substituem progresso nem certificado.
- [x] **RN-L037**: Expiracao de assinatura deve bloquear novos conteudos premium e manter historico de progresso anterior.
- [x] **RN-L038**: Conteudo actualizado em nova versao nao deve invalidar certificado antigo sem regra de recertificacao publicada.
- [x] **RN-L039**: Toda alteracao de regra de acesso, refund, certificado ou preco deve guardar timestamp, actor e motivo.
- [x] **RN-L040**: O comprador deve ver politica de acesso, reembolso, certificado e suporte antes de concluir compra Learning.
- [x] **RN-L041**: Chat interno Learning nao substitui comunidade publica nem atendimento externo; ele serve para coordenacao operacional do Team.
- [x] **RN-L042**: Decisoes registadas no chat interno Learning devem manter autor, papel, contexto e timestamp.
- [x] **RN-L043**: Mensagens internas sobre cohort, mentoria, suporte ou certificacao nao podem revelar dados privados do comprador/formando a actores sem permissao.
- [x] **RN-L044**: Uma comunidade paga so pode receber mensagens de membros com entitlement activo ou permissao administrativa.
- [x] **RN-L045**: A vitrine publica do Learning deve priorizar descoberta por familias de produto, problema operacional, perfil-alvo e resultado, nao apenas lista cronologica de cursos.
- [x] **RN-L046**: LTI, xAPI, Open Badges, QTI e SCORM sao referencias de interoperabilidade; o Bizy so declara compatibilidade formal apos implementacao, testes e validacao dedicados.
- [x] **RN-L047**: Progresso Learning nao substitui avaliacao humana quando certificacao exigir criterio manual, presença validada ou evidência externa.
- [x] **RN-L048**: Certificado ou badge revogado deve permanecer verificavel como revogado, com motivo interno auditado e resposta publica minima.
- [x] **RN-L049**: Produto Learning com conteudo actualizado deve indicar se compradores antigos mantem versao anterior, recebem atualização ou precisam de recertificacao.
- [x] **RN-L050**: Recomendacao automatica de curso, trilha ou cohort nao deve matricular, cobrar, emitir certificado ou revogar acesso sem regra explicita e auditoria.
- [x] **RN-L051**: Payout de produtor Learning depende de compra confirmada, politica de reembolso, janela de contestacao e ausência de disputa aberta.
- [x] **RN-L052**: Comunidade Learning nao pode ser usada para suporte operacional de pedido Market quando o fluxo correto for atendimento/Team.

## 8. Fluxos Principais

### 8.1 Fluxo Studio

```text
Team -> Studio -> escolher Market/Learning/Ambos
     -> criar perfil publico adequado
     -> criar produto fisico ou digital
     -> validar elegibilidade
     -> publicar
     -> vender
     -> operar no Team
     -> medir em Financas e Analytics
```

### 8.2 Fluxo Produto Learning

```text
Visitante descobre produto digital
 -> ve preview seguro
 -> compra ou inscreve-se
 -> pagamento/validacao cria entitlement
 -> recebe acesso
 -> consome conteudo
 -> participa em comunidade/cohort
 -> conclui avaliacao
 -> recebe certificado
 -> gera metricas e recomendacoes
```

### 8.3 Fluxo Financeiro

```text
Compra Learning confirmada
 -> cria movimento financeiro com origem learning
 -> emite factura/recibo quando aplicavel
 -> calcula comissao/repasse se houver vendedor externo
 -> acompanha refund/cancelamento
 -> ajusta entitlement e ledger
```

### 8.4 Fluxo Chat Interno Learning

```text
Gestor/Mentor/Dono abre /app/learning
 -> escolhe produto, cohort, comunidade ou suporte
 -> envia mensagem, decisao, tarefa, suporte ou anuncio
 -> Team acompanha thread interna
 -> decisoes e follow-ups ficam auditaveis
 -> atendimento externo e comunidade publica continuam separados
```

## 9. Testes e Verificacao Futura

- Validar que nenhum requisito trata Learning como catalogo simples.
- Validar que a experiencia publica parece um produto forte do ecossistema Bizy, nao uma pagina isolada.
- Validar que nenhum fluxo mistura stock fisico do Market com acesso digital do Learning.
- Validar que Studio suporta Market, Learning ou ambos.
- Validar que Team e backoffice administrativo do Learning.
- Validar que Financas recebe movimentos/facturas ligados a compras digitais.
- Validar que chat interno Learning nao mistura atendimento externo e conserva contexto do produto/cohort/comunidade.
- Validar que produtos gratuitos, pagos, bundles, memberships, lives, mentorias e certificacoes estao cobertos.
- Criar testes HTTP para home Learning, perfil, produto digital, publicacao, checkout, entitlement e progresso.
- Criar testes HTTP para chat interno Learning, threads por programa e mensagens de decisao/tarefa/suporte.
- Criar testes HTTP para denuncias, fila de moderacao, decisao humana e ocultacao temporaria.
- Criar testes de permissao para dono, admin, mentor, vendedor, afiliado/criador e comprador/formando.
- Criar testes de revogacao de acesso apos reembolso, cancelamento, expiracao ou suspensao.
- Criar testes de eventos Learning preparando xAPI sem exigir LRS externo no MVP.
- Criar testes de certificado/badge verificavel, revogacao e resposta publica minima.
- Criar testes de acessibilidade WCAG para player, produto publico, checkout, comunidade e certificado.
- Criar testes de automacao Learning garantindo fallback humano para certificado, refund, payout, suspensao e revogacao.
- Criar browser QA em `/learning`, `/app/learning` e Studio.

## 10. Estado de Implementacao

Implementacao consolidada:

- home publica `/learning`;
- perfil publico `/learning/:slug` alimentado transitoriamente por `entrega.lojaDigital.learning`;
- backoffice `/app/learning`;
- produtos/programas digitais iniciais por familias;
- criacao/publicacao Team de produto Learning basico;
- checkout digital Learning com origem, documento e movimento transitorio;
- entitlement, inscricao, progresso e certificado;
- chat interno Learning por programa, com mensagens de decisao, tarefa, suporte, anuncio e mensagem normal;
- activacao Studio Market/Learning/Ambos com persistencia transitoria em `entrega.lojaDigital.learning`;
- API publica `GET /publico/learning/perfis/:slug` para perfil Learning publicado sem exigir loja Market publicada;
- testes HTTP focados e build frontend para a base consolidada;
- player com conteudo premium filtrado por entitlement e `negocioId`;
- cohorts, presenca, comunidades, memberships, chat interno e moderacao;
- avaliacoes nativas, assignments com revisao manual e mentorias;
- versoes de conteudo, release notes, assets acessiveis e impacto de recertificacao;
- checkout, documento, movimento, refund total/parcial, payout de produtor e comissao de afiliado;
- portal do produtor, risco de abandono e automacoes com fallback humano;
- busca paginada, recomendacao explicavel e governanca global;
- event store LRS-like, exportacoes QTI-lite/Open Badges e integracoes LTI/SCORM controladas sem alegar compatibilidade formal.

### Evidencia de conclusao 2026-07-11

- Backend: `BizyLearningUseCase`, `learningPublico` e `moduloLearning` concentram a direcao unica do dominio.
- Frontend: `/learning`, `/app/learning` e `/app/learning/produtor` cobrem descoberta, operacao Team e produtor.
- Seguranca: preview publico remove assets premium, integrações sensiveis e IDs de assets bloqueados; player valida entitlement.
- Qualidade: `bizy-learning-http.test.ts`, typecheck backend/frontend e build Vite passam.
- Standards: SCORM, LTI, xAPI, cmi5, QTI e Open Badges continuam referencias; `compatibilidadeFormal` permanece `false` sem suite dedicada externa.
