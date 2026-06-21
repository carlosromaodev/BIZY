# BIZY — Modelo de dados do cliente (duas camadas)

Princípio: **uma pessoa, um perfil global (do cliente); muitas relações privadas (uma por loja).**
A chave que liga tudo é o telefone. A loja B nunca lê a camada privada da loja A — só a camada partilhada que o cliente consentiu.

---

## 1. `pessoa` — identidade global (propriedade do cliente)

Existe uma só por número. Melhora à medida que mais lojas a enriquecem (com consentimento). É daqui que sai o "perfil partilhado" que a loja B vê.

| Campo | Tipo | Partilhado? | Nota |
|---|---|---|---|
| `pessoa_id` | uuid | — | chave interna |
| `telefone_principal` | string (E.164) | sim | chave de junção; é como a encontram |
| `telefones_secundarios` | string[] | sim | |
| `nome` | string | conforme consentimento | |
| `redes_sociais` | [{rede, handle, publico}] | conforme consentimento | só handles públicos |
| `idioma` | string | sim | |
| `localizacao` | {provincia, municipio, bairro, ref} | conforme consentimento | |
| `localizacao_precisao` | enum(aprox, exata) | — | partilhar só aproximada por defeito |
| `tamanhos` | {roupa[], calcado[]} | conforme consentimento | **ouro no ramo de moda** |
| `categorias_interesse` | string[] | conforme consentimento | vestidos, ténis, bolsas… |
| `estilo_cores` | string[] | conforme consentimento | |
| `partilha_ativa` | bool | — | opt-in global; se false, nada sai |
| `criado_em` / `atualizado_em` | timestamp | — | |

**Nunca em `pessoa`:** dados sensíveis (saúde, raça, religião, vida sexual, política) — proibidos por regra na Lei 22/11.

---

## 2. `cliente_loja` — relação privada (uma por loja, nunca sai da loja)

Tudo aqui é privado da loja que o gerou. A fiabilidade vive **aqui**, não na camada global.

| Campo | Tipo | Nota |
|---|---|---|
| `cliente_loja_id` | uuid | |
| `loja_id` | uuid | dono dos dados |
| `pessoa_id` | uuid (fk → pessoa) | liga à identidade global |
| `notas_loja` | text | livre, privado |
| `tags_loja` | string[] | "VIP", "devolveu 2x"… |
| `canal_origem` | enum/ref | live · link · afiliada_id |
| `gama_preco_observada` | range | privado |
| `ticket_medio` | número | privado |
| **`fiabilidade`** | objeto (ver abaixo) | **PRIVADO — não partilhado no MVP** |
| `primeiro_contacto_em` / `ultimo_contacto_em` | timestamp | |

`fiabilidade` = `{pedidos, pagos, no_shows (reservas expiradas), devolucoes, tempo_medio_pagamento, score_interno}`.
Fica privado por opção: partilhar sinal tipo solvência entre entidades é tratado de forma especial pela lei (exige autorização prévia da APD) e cria risco de difamação. Score de comprador na rede é decisão futura, com advogado.

---

## 3. `atributo` — motor de enriquecimento com proveniência

Tabela genérica que alimenta tanto `pessoa` (global) como `cliente_loja` (privado). Garante que cada dado tem origem, confiança e data — para não virar lixo e ser auditável.

| Campo | Tipo | Nota |
|---|---|---|
| `atributo_id` | uuid | |
| `escopo` | enum(pessoa, cliente_loja) | global ou privado |
| `alvo_id` | uuid | pessoa_id ou cliente_loja_id |
| `chave` | string | ex: `tamanho_calcado` |
| `valor` | json | |
| `fonte` | enum(mensagem, pedido, manual, inferido) | de onde veio |
| `origem_ref` | uuid | id da mensagem/pedido de origem |
| `confianca` | float 0–1 | inferido pela IA = baixa até confirmar |
| `partilhado` | bool | só se escopo = pessoa |
| `confirmado_por_loja` | bool | loja validou o que a IA propôs |
| `atualizado_em` | timestamp | |

Fluxo: a IA lê a conversa → cria `atributo` com `fonte=inferido`, `confianca` baixa → a loja confirma → confiança sobe. Atributos de escopo `pessoa` com `partilhado=true` compõem o perfil que a loja B lê.

---

## 4. `permissao_partilha` — registo do consentimento

Regista que campos o cliente autorizou partilhar, quando e sob que versão dos termos. Sem registo aqui, o campo não sai da camada global — mesmo que `partilhado=true` no atributo.

| Campo | Tipo | Nota |
|---|---|---|
| `pessoa_id` | uuid | |
| `campos_partilhados` | string[] | chaves autorizadas (ex: `nome`, `tamanhos`, `localizacao`) |
| `consentido_em` | timestamp | data do consentimento |
| `versao_termos` | string | versão dos termos aceites — auditoria |

Sem este registo, não há base legal para partilhar sob a Lei 22/11.

---

## 5. Como a loja B vê o perfil (regra de leitura)

Cenário: a loja B só tem o número. Faz `GET perfil?telefone=...`.

A API resolve assim:

1. Para ter acesso aos dados, o cliente deve interagir primeiro com a loja.
2. Procura `pessoa` por `telefone_principal`.
3. Não existe → devolve "novo"; a loja B cria a sua `cliente_loja` do zero.
4. Existe e `partilha_ativa=true` → devolve **Perfil Partilhado** (só atributos `pessoa` com `partilhado=true` e `chave ∈ campos_partilhados`).
5. Junta `cliente_loja` **apenas** onde `loja_id = B`.
6. **Filtra sempre** qualquer `cliente_loja` de outra loja.

### Exemplo — a Joana puxa a loja B pela primeira vez

A loja B só tinha `+244 9XX XXX XXX`. Depois da leitura, vê:

**Perfil partilhado (vindo da identidade global):**
- Nome: Joana M.
- Social: @joana_tt
- Localização: Kilamba (aproximada)
- Calçado: 38 · Roupa: M
- Categorias: vestidos, ténis

**O que a loja B NÃO vê** (privado da loja A): que a Joana fez 4 pedidos na loja A, que pagou todos, as notas da loja A, o ticket médio dela na loja A.

Resultado: o número deixou de ser aleatório e ganhou identidade — exatamente a tua ideia — mas a loja B só recebeu o que a Joana consentiu partilhar, e começa a sua própria relação privada do zero.

---

## Resumo do desenho

- `pessoa` = identidade do cliente, partilhável campo a campo, com opt-in.
- `cliente_loja` = relação privada, siloada por loja; a fiabilidade vive aqui.
- `atributo` = enriquecimento com proveniência (fonte + confiança + data), alimenta as duas.
- `permissao_partilha` = registo de consentimento; sem ele, nenhum campo sai — base legal sob Lei 22/11.
- A fronteira de leitura ("só o partilhado + só a minha loja") é o que mantém o efeito de rede sem expor ninguém.
