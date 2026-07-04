# Bizy Learning - Requisitos Funcionais, Nao Funcionais e Regras de Negocio

Documento: `RF-RNF-RN-BIZY-LEARNING.md`
Versao: 0.2
Data: 2026-07-04
Autor: Carlos + Codex
Status: especificacao viva com implementacao incremental em curso

---

## 0. Implementacao Incremental Atual

- 2026-07-04: `/app/learning` passou a suportar atribuição Team de produto Learning a membro (`usuarioId`) ou perfil, com obrigação, prazo, mensagem operacional e métricas de atribuições activas/atrasadas.
- Quando a atribuição tem membro definido, o backend cria entitlement de origem `TEAM`, inscrição rastreável e evento `LEARNING_ATRIBUICAO_TEAM_CRIADA`.
- Esta entrega cobre parcialmente RF-L045/RF-L046. Ainda faltam atribuições por departamento, projecto, turma/cohort real, políticas avançadas de revogação e notificações.
- 2026-07-04: `/app/learning` passou a suportar abertura de cohorts/turmas por programa publicado, com data, vagas, sala, replay, regras de entrada e registo de presença. Presença de membro pode gerar entitlement de origem `TEAM` e inscrição rastreável.
- Esta entrega cobre parcialmente RF-L057/RF-L060. Ainda faltam calendário avançado, presença por QR/check-in, tarefas pós-evento, replay protegido por entitlement e cohorts recorrentes.
- 2026-07-04: `/app/learning` passou a suportar comunidades/memberships administradas pelo Team, com criação por programa, acesso aberto/entitlement/membership/convite, regras, moderadores, tópicos e posts do tipo anúncio, pergunta, resposta, material ou desafio.
- Esta entrega cobre parcialmente RF-L058/RF-L059/RF-L030. Ainda faltam página pública de comunidade, permissões finas por membro, denúncias/moderação formal, anexos reais e protecção de materiais premium por entitlement.

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

- [ ] **RF-L001**: O sistema deve expor o Bizy Learning como produto publico proprio em `/learning`.
- [ ] **RF-L002**: O Bizy Learning deve ter home publica separada do Bizy Market e do Bizy Team.
- [ ] **RF-L003**: A home Learning deve apresentar produtos digitais, academias, comunidades, lives, certificacoes e trilhas.
- [ ] **RF-L004**: O Learning deve permitir perfis publicos de academias, comerciantes, mentores ou criadores.
- [ ] **RF-L005**: Cada perfil Learning deve exibir identidade, descricao, categorias, produtos digitais, certificados oferecidos, comunidade e sinais de confianca.
- [ ] **RF-L006**: O perfil Learning deve poder existir sem perfil Market activo.
- [ ] **RF-L007**: O perfil Market deve poder existir sem perfil Learning activo.
- [ ] **RF-L008**: Um negocio deve poder ter perfil Market e perfil Learning activos em paralelo, preservando diferencas de produto e operacao.
- [ ] **RF-L009**: A home Learning deve permitir busca por tema, mentor, perfil, categoria, formato, preco, certificado, nivel e disponibilidade.
- [ ] **RF-L010**: Produtos Learning publicados devem ter URL propria, metadata SEO e preview social sem expor conteudo premium.

### 5.2 Bizy Studio e Escolha Market/Learning/Ambos

- [ ] **RF-L011**: O Bizy Studio deve apresentar a escolha de presenca publica: Market, Learning ou ambos.
- [ ] **RF-L012**: O Studio deve explicar que Market vende produtos fisicos/servicos e Learning vende produtos digitais/formativos.
- [ ] **RF-L013**: O dono deve conseguir activar e configurar o perfil Learning a partir do Studio.
- [ ] **RF-L014**: O Studio deve permitir configurar identidade Learning, categorias, biografia, links, imagem, politicas e canais de suporte.
- [ ] **RF-L015**: O Studio deve mostrar estado de elegibilidade do perfil Learning antes de publicar.
- [ ] **RF-L016**: O Studio deve separar produtos Market e produtos Learning para evitar confusao entre stock fisico e acesso digital.
- [ ] **RF-L017**: O Studio deve permitir publicar produtos fisicos no Market, produtos digitais no Learning ou campanhas que apontem para ambos.
- [ ] **RF-L018**: O Studio deve mostrar metricas separadas para Market e Learning, alem de uma visao consolidada.

### 5.3 Criacao e Publicacao de Produtos Digitais

- [ ] **RF-L019**: O sistema deve permitir criar produto digital Learning com titulo, descricao, categoria, publico-alvo, nivel, formato, owner, preco e estado.
- [ ] **RF-L020**: O sistema deve suportar os formatos curso, microlearning, live, workshop, mentoria, certificacao, comunidade, membership, bundle, trilha, academia e download digital.
- [ ] **RF-L021**: O produto Learning deve permitir preview publico seguro, com limite configuravel.
- [ ] **RF-L022**: O produto Learning deve permitir conteudo gratuito, pago, privado, por convite ou obrigatorio para membros Team.
- [ ] **RF-L023**: O produto Learning deve suportar estado rascunho, em revisao, publicado, pausado, arquivado e suspenso.
- [ ] **RF-L024**: O produto Learning deve guardar versoes de conteudo quando alteracoes relevantes forem publicadas.
- [ ] **RF-L025**: O produto Learning deve permitir owner principal e co-owners com permissoes diferentes.
- [ ] **RF-L026**: O produto Learning deve suportar anexos digitais como PDF, audio, video, imagem, template, planilha e ficheiro comprimido conforme politica.
- [ ] **RF-L027**: Produtos com video devem permitir thumbnail, legenda/caption, transcricao e material complementar.
- [ ] **RF-L028**: Produtos com live/workshop devem permitir data, hora, vagas, sala, replay, presenca e follow-up.
- [ ] **RF-L029**: Produtos com mentoria devem permitir pacote de sessoes, calendario, capacidade, mentor responsavel e regras de remarcacao.
- [ ] **RF-L030**: Produtos com comunidade/membership devem permitir periodo de acesso, beneficios, canais, regras e moderadores.

### 5.4 Pricing, Ofertas e Checkout Digital

- [ ] **RF-L031**: O sistema deve permitir preco gratuito, preco unico, assinatura, bundle, preco promocional, cupao e acesso manual.
- [ ] **RF-L032**: O checkout Learning deve criar uma compra digital com origem, produto, perfil vendedor, comprador, valor, moeda e estado.
- [ ] **RF-L033**: O checkout Learning deve suportar comprovativo digital quando o metodo de pagamento exigir.
- [ ] **RF-L034**: O checkout Learning deve permitir compra de produto unico, bundle, assinatura, live, mentoria ou certificacao.
- [ ] **RF-L035**: O checkout Learning deve emitir factura/recibo quando aplicavel, sem duplicar movimento financeiro.
- [ ] **RF-L036**: O checkout Learning deve criar movimento financeiro com origem `learning` e ligacao ao produto digital comprado.
- [ ] **RF-L037**: O checkout Learning deve suportar comissao, split, repasse e ledger de payout quando produto for vendido por comerciante, mentor ou criador.
- [ ] **RF-L038**: O comprador deve conseguir acompanhar o estado da compra digital e do acesso.
- [ ] **RF-L039**: O sistema deve permitir reembolso total ou parcial conforme politica do produto e estado de consumo.
- [ ] **RF-L040**: O sistema deve ajustar acesso quando uma compra digital for cancelada, reembolsada, expirada ou contestada.

### 5.5 Entitlement, Inscricao e Acesso

- [ ] **RF-L041**: Toda compra, convite, atribuicao interna ou inscricao gratuita deve gerar um entitlement rastreavel.
- [ ] **RF-L042**: O entitlement deve definir quem pode aceder, a que produto, por quanto tempo, em que negocio e com que origem.
- [ ] **RF-L043**: O produto pago so deve liberar conteudo premium apos pagamento confirmado ou autorizacao manual auditada.
- [ ] **RF-L044**: O sistema deve permitir inscricao individual, em equipa, por cohort, por convite, por cupao ou por assinatura.
- [ ] **RF-L045**: O gestor Team deve poder atribuir produto Learning a membros, papeis, departamentos, projecto ou turma.
- [ ] **RF-L046**: O sistema deve permitir formacao obrigatoria por perfil Team, com prazos e acompanhamento.
- [ ] **RF-L047**: O formando deve ver os produtos comprados, atribuidos, em progresso, concluidos e expirados.
- [ ] **RF-L048**: O sistema deve bloquear acesso quando entitlement expirar, for revogado ou estiver suspenso.

### 5.6 Progresso, Avaliacoes e Certificados

- [ ] **RF-L049**: O sistema deve registar progresso por licao, modulo, produto, trilha e utilizador.
- [ ] **RF-L050**: O sistema deve suportar criterios de conclusao por tempo, checklist, quiz, presenca, tarefa, avaliacao manual ou combinacao.
- [ ] **RF-L051**: O sistema deve suportar quizzes com tentativas, pontuacao minima e feedback.
- [ ] **RF-L052**: O sistema deve suportar tarefas/assignments com submissao e avaliacao manual.
- [ ] **RF-L053**: O sistema deve emitir certificado verificavel quando criterios forem cumpridos.
- [ ] **RF-L054**: Certificados devem ter codigo de verificacao publico sem expor dados privados.
- [ ] **RF-L055**: Certificados podem ter validade, expiracao e recertificacao.
- [ ] **RF-L056**: Badges e certificacoes podem alimentar reputacao, elegibilidade, destaque ou privilegios no ecossistema Bizy.

### 5.7 Comunidades, Cohorts, Lives e Mentoria

- [ ] **RF-L057**: O Learning deve permitir cohort/turma com inicio, fim, vagas, mentor, produtos associados e regras de entrada.
- [ ] **RF-L058**: O Learning deve permitir comunidade ligada a produto, perfil Learning, turma, certificacao ou membership.
- [ ] **RF-L059**: Comunidades devem suportar topicos, anuncios, perguntas, respostas, ficheiros, moderacao e notificacoes.
- [ ] **RF-L060**: Lives/workshops devem suportar inscricao, presenca, replay, materiais, chat e tarefas pos-evento.
- [ ] **RF-L061**: Mentorias devem suportar agenda, estado da sessao, notas, tarefas e follow-up.
- [ ] **RF-L062**: O chat contextual por curso, live, cohort ou comunidade deve integrar-se ao Chat Interno Bizy quando existir.
- [ ] **RF-L062A**: O Team deve ter chat interno Learning separado do atendimento externo, com threads por produto, cohort, comunidade ou suporte.
- [ ] **RF-L062B**: Mensagens internas Learning devem permitir tipo mensagem, decisao, tarefa, suporte e anuncio.
- [ ] **RF-L062C**: Mensagens internas Learning devem guardar autor, papel, programa, contexto, mencoes e data para auditoria operacional.
- [ ] **RF-L062D**: O chat interno Learning deve aparecer no backoffice `/app/learning` e permitir alinhamento de mentores, gestores e donos de produto.

### 5.8 Moderacao, Governanca e Qualidade

- [ ] **RF-L063**: Administradores Bizy devem gerir categorias globais Learning, politicas de publicacao e produtos suspensos.
- [ ] **RF-L064**: O sistema deve permitir denuncia de produto, perfil, comentario, comunidade, mentor ou certificado.
- [ ] **RF-L065**: Produtos de criadores/mentores devem poder exigir revisao antes de publicacao publica.
- [ ] **RF-L066**: O sistema deve manter trilho de auditoria para criacao, alteracao, publicacao, preco, acesso, refund, certificado e suspensao.
- [ ] **RF-L067**: O sistema deve permitir politicas de qualidade por categoria, formato, idade minima, conteudo sensivel e propriedade intelectual.
- [ ] **RF-L068**: O sistema deve permitir suspender perfil Learning ou produto sem apagar historico, compras, progresso ou documentos.

### 5.9 Analytics, CRM e Integracoes

- [ ] **RF-L069**: O Learning deve medir visualizacao, preview, compra, inscricao, inicio, progresso, conclusao, abandono, certificado e receita.
- [ ] **RF-L070**: O Team deve exibir metricas de adopcao por membro, perfil, turma, produto, departamento e periodo.
- [ ] **RF-L071**: Financas deve receber movimentos, facturas, recibos, comissoes e repasses ligados a compras Learning.
- [ ] **RF-L072**: CRM deve receber eventos Learning relevantes no perfil do cliente/formando quando houver consentimento e pertinencia.
- [ ] **RF-L073**: Afiliados devem poder promover produtos Learning quando politica permitir, com comissao por compra confirmada.
- [ ] **RF-L074**: Campanhas devem poder apontar para produtos Market, Learning ou ambos, mantendo origem rastreavel.
- [ ] **RF-L075**: O sistema deve recomendar produtos Learning com base em perfil, eventos operacionais, compras, progresso e objectivos do negocio.
- [ ] **RF-L076**: O sistema deve criar tarefas humanas quando um formando abandonar uma formacao obrigatoria ou quando uma live paga precisar de follow-up.

## 6. Requisitos Nao Funcionais

- [ ] **RNF-L001**: A experiencia Learning deve ser mobile-first em 360px, 375px, 390px, 768px, 1024px e 1440px.
- [ ] **RNF-L002**: A home Learning e paginas de produto digital devem carregar rapidamente, com media lazy-loaded e conteudo progressivo.
- [ ] **RNF-L003**: O Learning deve ter modo low-data, reduzindo imagens, previews pesados, autoplay e downloads automaticos.
- [ ] **RNF-L004**: Conteudo video deve suportar compressao, thumbnails e estrategia futura de streaming adaptativo.
- [ ] **RNF-L005**: Downloads offline devem ser selectivos, revogaveis e sincronizados quando a rede voltar.
- [ ] **RNF-L006**: Conteudo premium deve ser protegido contra exposicao por URL publica, preview, SEO, logs, cache indevida ou resposta API nao autorizada.
- [ ] **RNF-L007**: Todo acesso a produto, progresso, certificado, compra e comunidade deve respeitar `negocioId`, utilizador e entitlement.
- [ ] **RNF-L008**: O sistema deve auditar acoes sensiveis de publicacao, preco, refund, entitlement, certificado, moderacao e payout.
- [ ] **RNF-L009**: O sistema deve aplicar minimizacao de dados em compras digitais, comunidades, certificados e tracking.
- [ ] **RNF-L010**: Dados pessoais nao devem aparecer em URLs publicas, metadata SEO, preview social, logs ou codigos de verificacao.
- [ ] **RNF-L011**: O Learning deve cumprir baseline WCAG AA para contraste, foco, labels, teclado, alvos tacteis e alternativas textuais.
- [ ] **RNF-L012**: Conteudos audiovisuais devem suportar captions/transcricao quando usados como material principal.
- [ ] **RNF-L013**: O sistema deve ser resiliente a falhas de pagamento, webhook, comprovativo e sincronizacao, com retries idempotentes.
- [ ] **RNF-L014**: A compra digital confirmada deve manter disponibilidade de acesso mesmo se houver falha temporaria em notificacoes ou analytics.
- [ ] **RNF-L015**: Relatorios Learning devem separar dados de aprendizagem, dados financeiros e dados de comunidade conforme permissao.
- [ ] **RNF-L016**: Metricas agregadas podem alimentar benchmarking apenas de forma anonimizada e conforme consentimento/politica.
- [ ] **RNF-L017**: Operacoes financeiras Learning devem ser rastreaveis ate origem, produto, vendedor, comprador e documento.
- [ ] **RNF-L018**: A plataforma deve suportar muitos produtos digitais sem degradar busca, filtros e paginacao.
- [ ] **RNF-L019**: Publicacao de conteudo e mudanca de preco devem ser consistentes e auditaveis, evitando estado parcial publico.
- [ ] **RNF-L020**: Formandos devem receber estados claros para acesso pendente, pagamento pendente, inscricao concluida, expirado e reembolsado.
- [ ] **RNF-L021**: Mentores e gestores devem ter interfaces operacionais simples, sem informacao tecnica desnecessaria.
- [ ] **RNF-L022**: O sistema deve preservar compatibilidade futura para xAPI/cmi5 ou LRS-like event store sem depender disso no MVP.
- [ ] **RNF-L023**: O Learning deve manter logs estruturados e metricas por produto, perfil, negocio e periodo.
- [ ] **RNF-L024**: A experiencia publica nao deve expor areas privadas do Team ou admin.
- [ ] **RNF-L025**: Alteracoes de permissoes ou revogacao de acesso devem surtir efeito sem exigir logout do utilizador.
- [ ] **RNF-L026**: A experiencia visual publica do Learning deve ter qualidade comparavel ao Bizy Market, com home forte, descoberta por familias, cards comerciais ricos e hierarquia clara.
- [ ] **RNF-L027**: O design do Learning deve comunicar ecossistema de produtos digitais, nao landing page estatica nem catalogo simples.
- [ ] **RNF-L028**: O backoffice `/app/learning` deve ser operacional e denso o suficiente para uso diario por gestores, mentores e donos, mantendo clareza mobile-first.
- [ ] **RNF-L029**: O chat interno Learning deve ser low-noise, auditavel e separado de canais externos como WhatsApp, Instagram e atendimento CRM.

## 7. Regras de Negocio

- [ ] **RN-L001**: Learning e sistema separado do Market e do Team; o Team administra o backstage operacional do Learning.
- [ ] **RN-L002**: Market e Learning nao partilham stock fisico, entrega fisica ou variantes de produto.
- [ ] **RN-L003**: Produto Learning publicado so aparece na home publica se perfil Learning estiver activo, owner valido, preco/acesso definido e conteudo minimo aprovado.
- [ ] **RN-L004**: Produto Learning pago so libera conteudo premium apos pagamento confirmado ou liberacao manual auditada por perfil autorizado.
- [ ] **RN-L005**: Compra digital deve gerar entitlement rastreavel antes de qualquer acesso premium.
- [ ] **RN-L006**: Compra digital deve gerar origem financeira, movimento, factura/recibo quando aplicavel e relacao com produto Learning.
- [ ] **RN-L007**: Reembolso ou cancelamento deve revogar, reduzir ou manter acesso conforme politica publicada no momento da compra.
- [ ] **RN-L008**: Mudanca de preco nao altera compras ja confirmadas, salvo regra explicita de assinatura/renovacao.
- [ ] **RN-L009**: Produto gratuito tambem deve gerar inscricao/entitlement para permitir progresso, revogacao e metricas.
- [ ] **RN-L010**: Conteudo premium nao pode ser incluido em preview publico, metadata SEO, logs ou mensagens de erro.
- [ ] **RN-L011**: Certificado so pode ser emitido quando criterios de conclusao estiverem cumpridos.
- [ ] **RN-L012**: Certificado revogado deve manter historico e motivo, sem apagar emissao original.
- [ ] **RN-L013**: Mentor/criador so pode publicar conforme papel, permissao e politica do negocio ou do Bizy.
- [ ] **RN-L014**: Dono/Admin pode delegar owner de produto, mas continua responsavel pela conformidade do perfil Learning do negocio.
- [ ] **RN-L015**: Produto em revisao nao pode ser comprado publicamente.
- [ ] **RN-L016**: Produto suspenso nao pode receber novas compras, mas acessos existentes devem seguir decisao administrativa.
- [ ] **RN-L017**: Comunidades e mentorias pagas exigem inscricao activa ou entitlement equivalente.
- [ ] **RN-L018**: Live paga deve definir regra de replay, presenca e acesso posterior antes da venda.
- [ ] **RN-L019**: Mentoria com vagas limitadas nao pode aceitar inscricoes acima da capacidade, salvo overflow explicitamente configurado.
- [ ] **RN-L020**: Bundle deve preservar entitlement individual de cada item para permitir progresso, certificado e revogacao granular.
- [ ] **RN-L021**: Formacao obrigatoria atribuida pelo Team nao pode ser substituida por recomendacao automatica do sistema.
- [ ] **RN-L022**: Recomendacao automatica nunca substitui decisao do gestor sobre formacao obrigatoria.
- [ ] **RN-L023**: Dados de progresso sao dados de trabalho quando vinculados a negocio; visibilidade depende de papel e permissao.
- [ ] **RN-L024**: Ranking, badges e gamificacao devem ser opt-in quando expuserem comparacao individual entre membros.
- [ ] **RN-L025**: Produtos Learning promovidos por afiliados so geram comissao apos pagamento confirmado e fora de periodo de anulacao definido.
- [ ] **RN-L026**: Comissao de produto Learning deve ser calculada sobre valor elegivel, descontando reembolsos, taxas e politicas definidas.
- [ ] **RN-L027**: Denuncia de conteudo sensivel pode ocultar produto/comunidade temporariamente ate revisao humana.
- [ ] **RN-L028**: AI pode sugerir feedback, resumo, trilha ou resposta, mas nao aprova certificado, refund, suspensao ou payout sem regra explicita e auditoria.
- [ ] **RN-L029**: Produtos oficiais Bizy podem coexistir com produtos de comerciantes/mentores, mas devem ser identificados claramente.
- [ ] **RN-L030**: O perfil Learning deve indicar quem vende, quem entrega o conteudo e quem responde suporte.
- [ ] **RN-L031**: Produtos digitais com propriedade intelectual de terceiros exigem owner responsavel e aceite de politica.
- [ ] **RN-L032**: Acesso de comprador/formando nao deve revelar dados internos do negocio, equipa, margem, repasse ou performance de outros formandos.
- [ ] **RN-L033**: O Studio deve impedir publicacao quando houver conflito entre tipo de produto e canal escolhido.
- [ ] **RN-L034**: Campanha que combine Market e Learning deve manter origem separada para cada conversao.
- [ ] **RN-L035**: Receita Learning nao deve entrar como venda Market nem consumir stock fisico.
- [ ] **RN-L036**: Produto Learning pode gerar tarefas no Team, mas tarefas nao substituem progresso nem certificado.
- [ ] **RN-L037**: Expiracao de assinatura deve bloquear novos conteudos premium e manter historico de progresso anterior.
- [ ] **RN-L038**: Conteudo actualizado em nova versao nao deve invalidar certificado antigo sem regra de recertificacao publicada.
- [ ] **RN-L039**: Toda alteracao de regra de acesso, refund, certificado ou preco deve guardar timestamp, actor e motivo.
- [ ] **RN-L040**: O comprador deve ver politica de acesso, reembolso, certificado e suporte antes de concluir compra Learning.
- [ ] **RN-L041**: Chat interno Learning nao substitui comunidade publica nem atendimento externo; ele serve para coordenacao operacional do Team.
- [ ] **RN-L042**: Decisoes registadas no chat interno Learning devem manter autor, papel, contexto e timestamp.
- [ ] **RN-L043**: Mensagens internas sobre cohort, mentoria, suporte ou certificacao nao podem revelar dados privados do comprador/formando a actores sem permissao.
- [ ] **RN-L044**: Uma comunidade paga so pode receber mensagens de membros com entitlement activo ou permissao administrativa.
- [ ] **RN-L045**: A vitrine publica do Learning deve priorizar descoberta por familias de produto, problema operacional, perfil-alvo e resultado, nao apenas lista cronologica de cursos.

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
- Criar testes de permissao para dono, admin, mentor, vendedor, afiliado/criador e comprador/formando.
- Criar testes de revogacao de acesso apos reembolso, cancelamento, expiracao ou suspensao.
- Criar browser QA em `/learning`, `/app/learning` e Studio.

## 10. Estado de Implementacao

Implementacao incremental existente:

- home publica `/learning`;
- backoffice `/app/learning`;
- produtos/programas digitais iniciais por familias;
- criacao/publicacao Team de produto Learning basico;
- checkout digital Learning com origem, documento e movimento transitorio;
- entitlement, inscricao, progresso e certificado;
- chat interno Learning por programa, com mensagens de decisao, tarefa, suporte, anuncio e mensagem normal;
- testes HTTP e frontend targeted para a base implementada.

Ainda pendente para o dominio definitivo:

- schema dedicado Learning;
- perfis publicos dedicados;
- player/conteudo premium protegido;
- comunidades/memberships reais;
- cohorts, lives, mentorias e agenda completa;
- moderacao, denuncias e governanca global;
- financeiro fiscal completo, comissoes, repasses e reconciliacao dedicados;
- integracao Studio Market/Learning/Ambos completa;
- browser QA visual completo em `/learning`, `/app/learning` e Studio.
