# BIZY — Planta de Produto e MVP

**Operação de vendas por Live (TikTok) e WhatsApp para lojas angolanas.**

Documento único de referência. Consolida as decisões: foco, coluna vertebral, módulos por camada, captação, afiliados, persona inicial, mapa de ecrãs, parser, identidade do cliente, modelo de dados, MVP, riscos e conformidade.

**Frase-guia:** *Se não ajuda a vender, cobrar, entregar ou responder hoje, não entra no núcleo.*

---

## 1. Foco

Ajudar pequenas lojas em Angola a transformar interesse vindo de **live, WhatsApp ou catálogo** em **pedido pago**, com stock controlado, atendimento simples e cobrança organizada.

O produto tinha-se espalhado para uma suíte tipo CRM+ (afiliados, social inbox, pipeline, metas, formulários, sequências, atribuição). A correção não é cortar à toa — é **reorganizar tudo à volta de um só fluxo** e empurrar o resto para camadas opcionais ou para fora.

---

## 2. A coluna vertebral

Tudo no produto orbita **um objeto que avança por estados — o Pedido**. "Reserva" não é módulo: é o primeiro estado. Pagamento, entrega e histórico são estados ou leituras do mesmo objeto.

```
Interesse → Reservado → A aguardar pagamento → Pago → A entregar → Entregue → Fechado
              (fila/expira)     (comprovativo →            (estado de
                                 confirma/rejeita)          entrega)
   estados laterais: Expirado · Cancelado · Rejeitado
```

Teste para qualquer funcionalidade: faz um pedido **nascer**, **avançar** ou ser **lido**? Se não, não é núcleo.

---

## 3. Estrutura em camadas

Em vez de ~15 módulos planos e ligados por defeito, quatro camadas.

### Camada 0 — Entrada
Login por telefone · onboarding do negócio · primeiro produto.

### Camada 1 — Núcleo de vendas (sempre ligado, *é* o produto)
- Produtos & Stock (com **variantes**, ver §5)
- Captação unificada (funil + adaptadores: live, whatsapp, link, afiliado, social-manual)
- Parser (telefone, código, intenção, variante)
- Pedidos (fila e expiração são estados)
- Pagamentos (comprovativo, confirmar/rejeitar)
- Entrega (estado)
- Conversas + Cliente 360
- Afiliados mínimos (identidade + link + atribuição + livro de comissão manual)
- Painel "Hoje"
- Relatório simples

### Camada 2 — Crescimento (opt-in, desligado por defeito, só depois do núcleo provar valor)
Loja pública + checkout completo · campanhas / mensagens em massa · links rastreáveis avançados · automação leve (3–5 eventos críticos) · relatórios ricos · **identidade partilhada do cliente** (ver §8) · afiliados avançados (auto-payout, escalões, mini-lojas).

### Camada 3 — Fora ou isolado (remover, ou governar com advogado)
Login académico (UOR/ISPTEC) — remover · social inbox multi-rede — adiar · partilha de clientes sem consentimento — **nunca** (substituída pela identidade consentida) · Meta CAPI / atribuição avançada — adiar · score de fiabilidade de comprador na rede — só com parecer jurídico.

---

## 4. Duas simplificações que sustentam tudo

**1. Um só "Interesse" para todos os canais.** Não há um funil por canal. Há **um funil agnóstico à fonte** e cada canal é um adaptador fino que cria um Interesse com um campo `fonte`. Adicionar canal = adaptador pequeno, não módulo novo. Isto torna a pergunta "qual o canal principal?" irrelevante: o funil aceita qualquer um.

**2. "Tarefas" em vez de CRM.** Pipeline, metas, cotações, formulários, sequências e agenda colapsam numa única lista de **tarefas** anexada a pedido / cliente / conversa ("confirmar comprovativo", "repor stock", "ligar amanhã"). 90% do valor desses módulos com 10% da complexidade — e some a cara de "HubSpot pequeno".

---

## 5. Persona inicial e o que obriga

Primeiro cliente-tipo: **vendedora de roupa e calçado em live no TikTok.** Fluxo: **live (comentário) → reserva com variante → handoff para WhatsApp → comprovativo → confirma → entrega.** A live capta; o WhatsApp fecha.

Três decisões que este nicho força:

1. **Variante é cidadão de primeira classe.** Roupa e calçado são SKU × tamanho × cor. Stock, parser e reserva têm *todos* de entender variante, senão reserva-se um 38 que já não existe.
2. **A Live tem ecrã próprio.** É onde ela passa horas; precisa de modo ao vivo com código por peça e captura rápida de comentário.
3. **Reserva com fila + expiração importa de verdade.** Na live, várias pessoas gritam pela mesma peça ao mesmo tempo.

---

## 6. Mapa de ecrãs — Camada 1

Barra lateral, abrindo sempre no **Hoje**.

- **Hoje** *(cockpit, ecrã inicial)* — filas de ação, não relatórios: reservas a expirar, pagamentos pendentes, conversas sem resposta, stock baixo por variante, reservas "falta tamanho".
- **Live** *(modo ao vivo — ecrã mais importante)* — produtos com código e stock por variante; caixa para capturar comentário → parser cria reserva; painel em tempo real das reservas e fila por peça; botão "enviar para WhatsApp" em cada reserva.
- **Pedidos** *(o funil)* — lista por estado; cada pedido abre com itens (tamanho/cor), cliente, conversa, pagamento e entrega num só sítio.
- **Produtos & Stock** — produto-pai com variantes (tamanho × cor), stock por variante, código por peça/lote, alerta de stock baixo.
- **Conversas** — WhatsApp + histórico, ligado a cliente e pedidos.
- **Clientes** — 360 simples (ver §7).
- **Afiliados** — afiliadas, link de cada uma, pedidos atribuídos, livro de comissão ("a pagar"), botão "marcar como pago". Uma só % por afiliada.
- **Relatórios** — vendas, pendências, comissões. Simples.

Configurações: dados do negócio · ligação WhatsApp · % de comissão padrão · fontes ligadas.

A Camada 2 vive atrás de "Ativar funcionalidades", desligada por defeito. A Camada 3 sai do menu.

---

## 7. Parser e Cliente 360

### Parser
De um comentário tipo *"@joana quero a 14 tam M"* extrai: produto (código 14), **variante (M)**, cliente (@joana → telefone se conhecido), intenção (compra). Sem tamanho/cor, a reserva nasce **incompleta** e o painel "Hoje" marca "falta tamanho" → pergunta-se na conversa. **A reserva não avança para pagamento sem variante resolvida.**

### Cliente 360 (dentro da loja)
A IA lê conversa + pedidos e propõe atributos; a loja confirma. Cada atributo guarda **valor + fonte + confiança + data**. Atributos do ramo:
- **Identidade:** nome, telefone(s), @redes sociais, idioma
- **Localização:** município/bairro, ponto de entrega
- **Moda (ouro):** tamanhos (roupa, calçado), cores/estilos, categorias
- **Comercial:** gama de preço, sensibilidade a desconto, ticket médio
- **Fiabilidade:** pedidos, % que paga, no-shows, devoluções, tempo até pagar
- **Canal:** de onde costuma vir

Limites: **não inferir dados sensíveis** (saúde, raça, religião, vida sexual, política — proibidos por regra na Lei 22/11) e **informar o cliente** que existe um perfil dele.

---

## 8. Identidade do cliente (partilha entre lojas, com consentimento)

Reformulação da ideia "lojas partilham clientes": deixa de ser partilha nas costas do cliente e passa a ser **uma identidade que o cliente possui e consente partilhar** — um "passaporte BIZY". Mesma magia (o número vira pessoa na loja B), mas legal e desejada.

- **Camada partilhada (identidade):** só o que o cliente consentiu — nome, social pública, localização aproximada, talvez tamanhos e categorias. É o que a loja B vê quando só tinha o número.
- **Camada privada da loja:** pedidos, conversas, notas e **fiabilidade** nunca saem da loja que os gerou.
- O cliente vê, edita e revoga o que partilha.

O **score de fiabilidade de comprador na rede** é a parte mais cobiçada e mais perigosa — partilha de dados tipo solvência entre entidades é especialmente regulada (autorização prévia da APD) e cria risco de difamação. Por isso, no MVP **a fiabilidade fica privada de cada loja**; só identidade positiva/neutra é partilhada.

---

## 9. Modelo de dados das duas camadas

Princípio: **uma pessoa, um perfil global (do cliente); muitas relações privadas (uma por loja).** Chave de junção = telefone. A loja B nunca lê a camada privada da loja A.

### `pessoa` — identidade global (do cliente)

| Campo | Tipo | Partilhado? | Nota |
|---|---|---|---|
| `pessoa_id` | uuid | — | chave interna |
| `telefone_principal` | E.164 | sim | chave de junção |
| `telefones_secundarios` | string[] | sim | |
| `nome` | string | conforme consentimento | |
| `redes_sociais` | [{rede, handle, publico}] | conforme consentimento | só públicos |
| `idioma` | string | sim | |
| `localizacao` | {provincia, municipio, bairro, ref} | conforme consentimento | |
| `localizacao_precisao` | enum(aprox, exata) | — | partilhar só aproximada |
| `tamanhos` | {roupa[], calcado[]} | conforme consentimento | ouro no ramo |
| `categorias_interesse` | string[] | conforme consentimento | |
| `estilo_cores` | string[] | conforme consentimento | |
| `partilha_ativa` | bool | — | opt-in global |
| `criado_em` / `atualizado_em` | timestamp | — | |

Nunca em `pessoa`: dados sensíveis.

### `cliente_loja` — relação privada (nunca sai da loja)

| Campo | Tipo | Nota |
|---|---|---|
| `cliente_loja_id` | uuid | |
| `loja_id` | uuid | dono dos dados |
| `pessoa_id` | uuid (fk) | liga à identidade global |
| `notas_loja` | text | privado |
| `tags_loja` | string[] | |
| `canal_origem` | enum/ref | live · link · afiliada_id |
| `gama_preco_observada` | range | privado |
| `ticket_medio` | número | privado |
| `fiabilidade` | objeto | **PRIVADO** — pedidos, pagos, no_shows, devolucoes, tempo_medio_pagamento, score_interno |
| `primeiro_contacto_em` / `ultimo_contacto_em` | timestamp | |

### `atributo` — enriquecimento com proveniência

| Campo | Tipo | Nota |
|---|---|---|
| `atributo_id` | uuid | |
| `escopo` | enum(pessoa, cliente_loja) | global ou privado |
| `alvo_id` | uuid | pessoa_id ou cliente_loja_id |
| `chave` | string | ex: `tamanho_calcado` |
| `valor` | json | |
| `fonte` | enum(mensagem, pedido, manual, inferido) | |
| `origem_ref` | uuid | id da mensagem/pedido |
| `confianca` | float 0–1 | inferido = baixa até confirmar |
| `partilhado` | bool | só se escopo = pessoa |
| `confirmado_por_loja` | bool | |
| `atualizado_em` | timestamp | |

Fluxo: IA infere (`fonte=inferido`, confiança baixa) → loja confirma → confiança sobe. Atributos `pessoa` com `partilhado=true` compõem o perfil que a loja B lê.

### `permissao_partilha` — registo do consentimento

| Campo | Tipo | Nota |
|---|---|---|
| `pessoa_id` | uuid | |
| `campos_partilhados` | string[] | chaves autorizadas |
| `consentido_em` | timestamp | |
| `versao_termos` | string | auditoria |

### Regra de leitura — como a loja B vê o perfil
A loja B tem só o número e pede o perfil:
1. Procura `pessoa` por `telefone_principal`.
2. Não existe → "novo"; B cria a sua `cliente_loja` do zero.
3. Existe e `partilha_ativa=true` → devolve **Perfil Partilhado** (só atributos `pessoa` com `partilhado=true` e `chave ∈ campos_partilhados`).
4. Junta `cliente_loja` **apenas** onde `loja_id = B`.
5. **Filtra sempre** qualquer `cliente_loja` de outra loja.

Esta fronteira — *só o partilhado + só a minha loja* — é o que dá o efeito de rede sem expor ninguém.

---

## 10. MVP

### Essencial para lançar (Camada 0 + Camada 1)
Login telefone · onboarding + 1º produto · catálogo com **variantes e stock** · WhatsApp ligado ou fallback manual · captação live/manual → parser → interesse → reserva com fila/expiração · pedido com estados + pagamento + comprovativo + entrega · conversa com histórico do cliente (Cliente 360) · afiliados mínimos · painel "Hoje" · relatório simples.

### Depois (Camada 2)
Loja pública/checkout · campanhas · automação leve · relatórios ricos · identidade partilhada do cliente.

### Fora do MVP (Camada 3)
Afiliados avançados · social inbox multi-rede · módulos de CRM genérico · atribuição avançada/Meta CAPI · score de comprador na rede.

---

## 11. Ordem de construção

1. Produtos com **variante** + stock por variante
2. Ecrã **Live** + parser (com captura de variante)
3. Reserva com fila/expiração → Pedido (estados)
4. Pagamento / comprovativo / confirma-rejeita → Entrega
5. Conversas + Cliente 360 (em paralelo, cedo)
6. Afiliados mínimos (link → fonte → livro), em paralelo
7. Painel "Hoje" + relatório simples

Camada 2 e a identidade partilhada só depois disto rodar com a primeira cliente real.

---

## 12. Riscos

- **Técnico:** muitos domínios e integrações antes de fechar o fluxo principal → mitigado pelas camadas e pelo funil único.
- **Negócio:** proposta de valor confusa → fixada como "operação de vendas live/WhatsApp".
- **Usabilidade:** módulos demais → Camada 2 desligada por defeito, app abre no "Hoje".
- **Escopo:** backlog com cara de suíte → frase-guia trava entradas novas.
- **Financeiro:** SMS, WhatsApp, automação, comissões pesam cedo → manter stack simples no MVP.
- **Legal (o maior):** partilha de dados entre lojas → resolvido com consentimento, separação de camadas e fiabilidade privada.

---

## 13. Conformidade legal (Angola — Lei n.º 22/11)

- Consentimento tem de ser **livre, específico, explícito e informado**.
- Titular tem direito a **aceder, retificar e opor-se** (revogar).
- **Dados sensíveis** (saúde, raça, religião, vida sexual, política) — proibidos por regra.
- **Transferência internacional** (servidores fora de Angola) exige consentimento expresso e escrito → decidir hosting e texto do consentimento.
- Dados tipo **solvência/crédito** entre entidades exigem autorização prévia da **APD** → trava o score de comprador na rede.
- Incumprimento → sanções financeiras e responsabilidade criminal, fiscalizadas pela APD.

> Nota: isto não é aconselhamento jurídico. Antes de ligar qualquer partilha entre lojas, rever com um especialista em proteção de dados em Angola.

---

## 14. Decisões tomadas e perguntas em aberto

**Decidido:**
- Canal principal: **live TikTok**, com WhatsApp a fechar.
- Afiliados: **imediatos**, na versão mínima (fonte + livro manual).
- Partilha de clientes: **sim, mas como identidade consentida do cliente**, não partilha silenciosa.

**Em aberto:**
- Quem é, em concreto, a primeira loja real (nome).
- Modelo de preço/custo do BIZY (SMS, WhatsApp, hosting).
- Localização do hosting (decide o consentimento de transferência internacional).
