# Relatorio de Seguranca da Pleno - Backend e Servidor

Data inicial: 2026-06-29  
Atualizado em: 2026-06-30  
Alvo: `https://pleno.ao/beta/`  
Contexto do teste: analise autorizada com conta de teste fornecida.

## Resumo Executivo

A analise encontrou varias falhas de backend e servidor com impacto direto na seguranca:

- IDOR critico sem autenticacao na consulta de itens de encomenda.
- Token de autenticacao continua valido depois do logout.
- O token de autenticacao funciona sozinho como bearer token de longa duracao.
- Logout aceita `GET`, permitindo logout CSRF.
- Injecao HTML armazenada nas notas da carteira, com provavel XSS armazenado porque o frontend renderiza o valor via insercao de HTML.
- Erros de producao expostos com stack traces PHP e caminhos absolutos do servidor.
- Metadados do Composer e versoes de dependencias expostos publicamente.
- Recuperacao de senha permite identificar se um e-mail esta registado.
- Headers de hardening de seguranca ausentes.

As correcoes mais urgentes sao:

1. Exigir autenticacao e validacao de propriedade em todos os endpoints com dados de utilizador.
2. Invalidar o `plenotoken` no servidor durante logout e troca de senha.
3. Restringir logout a `POST` com validacao CSRF/Origin.
4. Escapar a saida de campos vindos do utilizador antes de renderizar HTML.
5. Desativar `display_errors` em producao.
6. Bloquear acesso publico a ficheiros Composer e metadados de `vendor`.

## Escopo e Metodo

Os testes foram feitos com requisicoes HTTP controladas. Nao foram realizados ataques de negacao de servico, alteracoes destrutivas, captura de pagamento ou despejo de dados de terceiros. Quando um endpoint aparentou expor dados de terceiros, foram registados apenas metadados, como codigo HTTP, tipo JSON, contagem de itens e nomes de campos.

Ferramentas utilizadas:

- `curl`
- scripts shell
- parsing JSON local com Python
- OSV API para consulta de vulnerabilidades conhecidas em dependencias

## Achados Confirmados

### PLENO-001 - Critico - IDOR Sem Autenticacao em Itens de Encomenda

Endpoint afetado:

`GET /beta/source/Load/OrderItems.php?order_id={id}`

Descricao:

O endpoint retorna dados de itens de encomenda para valores numericos de `order_id` sem exigir autenticacao. IDs sequenciais devolveram arrays nao vazios em varios valores amostrados.

Evidencia:

```text
MODE noauth
order_id=1      status=200 list len=1 keys=created_at,domain_admin_contact,domain_dns_preset,domain_extension,domain_holder,domain_name,domain_period,domain_premium,domain_price,domain_privacy,domain_privacy_price,email_price
order_id=2      status=200 list len=1 keys=created_at,domain_admin_contact,domain_dns_preset,domain_extension,domain_holder,domain_name,domain_period,domain_premium,domain_price,domain_privacy,domain_privacy_price,email_price
order_id=620    status=200 list len=4 keys=created_at,domain_admin_contact,domain_dns_preset,domain_extension,domain_holder,domain_name,domain_period,domain_premium,domain_price,domain_privacy,domain_privacy_price,email_price
order_id=999999 status=200 list len=0
```

Impacto:

Um atacante nao autenticado consegue enumerar IDs de encomendas e obter metadados de itens, incluindo campos relacionados a dominios e referencias de contactos/perfis. Dependendo dos valores retornados, isto pode expor compras de clientes e dados de registo de dominios.

Correcao recomendada:

- Exigir autenticacao antes de processar a requisicao.
- Verificar se o utilizador autenticado e dono da encomenda solicitada.
- Retornar `401` para requisicoes sem autenticacao e `403` para encomendas de outra conta.
- Usar identificadores publicos nao enumeraveis quando necessario.

Exemplo de logica:

```php
if (!$user) {
    http_response_code(401);
    exit(json_encode(['error' => 'Nao autenticado']));
}

$order = $orders->findById($orderId);
if (!$order || $order->user_id !== $user->id) {
    http_response_code(403);
    exit(json_encode(['error' => 'Sem permissao']));
}
```

### PLENO-002 - Alto - Logout Nao Invalida Token no Servidor

Mecanismo de autenticacao afetado:

`plenotoken`

Descricao:

O fluxo de login emite `plenotoken` e `plenoauthemail` com flags fortes de cookie (`Secure`, `HttpOnly`, `SameSite=Lax`). Contudo, o logout remove o cookie do navegador, mas o token antigo continua valido quando reutilizado manualmente depois do logout.

Evidencia:

```text
before_logout={"loggedIn":true}
logout={"success":true}
old_token_after_logout={"loggedIn":true}
```

Impacto:

Se um token de autenticacao for roubado, o logout nao o revoga. O atacante pode continuar a usar o token antigo ate a expiracao. O tempo de vida observado no cookie foi de aproximadamente 30 dias.

Evidencia adicional:

O `plenotoken` funciona como bearer token suficiente para autenticar a sessao. O cookie `plenoauthemail` nao e necessario para `CheckLogin.php`:

```text
token_only={"loggedIn":true}
email_only={"loggedIn":false}
token_with_empty_email={"loggedIn":true}
wrong_email_same_token={"loggedIn":true}
```

Isto significa que qualquer copia valida do `plenotoken` e suficiente para assumir a sessao ate expiracao ou revogacao server-side.

Correcao recomendada:

- Guardar hash do token ou registo de sessao no servidor.
- Marcar o token como revogado no logout.
- Rotacionar o token no login.
- Revogar todos os tokens ativos apos troca de senha.
- Considerar tempo de vida menor e rotacao de refresh tokens.

### PLENO-003 - Alto - Injecao HTML Armazenada em Notas da Carteira, Provavel XSS Armazenado

Endpoints/componentes afetados:

- `POST /beta/source/Load/WalletCredit.php`
- `GET /beta/source/Load/WalletTransactions.php`
- Renderizacao da carteira no frontend em `scripts.js`

Descricao:

A nota de deposito da carteira e armazenada e devolvida sem escaping de saida. O frontend renderiza `record.notes` dentro de template HTML, o que confirma injecao HTML armazenada e torna XSS armazenado provavel se payloads com execucao de script forem aceites.

Payload controlado utilizado:

```json
{"amount":5000,"payment_method":"bai","note":"<b data-proof=pleno>SECURITY_TEST</b>"}
```

Resposta de criacao:

```text
{"success":true,"details":{"reference":"DEP-SCFUVNMCQN","amount":5000,"bank":{"name":"Banco BAI", ... }}}
```

A resposta posterior da API incluiu HTML bruto:

```text
notes: <b data-proof=pleno>SECURITY_TEST</b>
```

Sink no frontend:

```javascript
${record.notes && record.notes.trim() !== '' ? `...<p class="mb-0 small">${record.notes}</p>...` : ''}
```

Impacto:

Um atacante com conta consegue armazenar HTML/JavaScript malicioso nas notas de transacoes da carteira. Quando o proprio utilizador ou um operador interno visualizar o historico da carteira, o payload pode executar no navegador. Como nao ha CSP configurada, o impacto potencial aumenta.

Correcao recomendada:

- Escapar todos os campos controlados pelo utilizador antes da renderizacao.
- Preferir `textContent` em vez de `innerHTML`.
- Se HTML for realmente necessario, usar sanitizador com allowlist.
- Adicionar uma Content Security Policy restritiva.
- Normalizar e validar notas tambem no backend.

### PLENO-004 - Alto - Divulgacao de Erros e Stack Traces em Producao

Endpoints afetados incluem:

- `/beta/source/Load/WalletTransactions.php`
- `/beta/source/App/CheckDomain.php`
- `/beta/source/Load/OrderList.php`
- `/beta/source/Load/DomainList.php`
- `/beta/source/Load/PresetList.php`
- `/beta/source/Load/ContactProfile.php`
- `/beta/source/Load/DomainDetails.php`
- `/beta/source/Load/DnsPresets.php`
- `/beta/source/Load/DomainLinks.php`
- `/beta/source/Load/GetDomainAuthInfo.php`

Descricao:

Requisicoes sem autenticacao e parametros invalidos retornam warnings ou fatal errors PHP com caminhos absolutos do sistema de ficheiros e stack traces.

Exemplos:

```text
Warning: Trying to access array offset on value of type bool in
/home/pleno/public_html/beta/source/Models/App/Order.php
on line 33
```

```text
Fatal error: Uncaught TypeError: Source\Models\App\Wallet::list(): Argument #1 ($offset) must be of type int, string given, called in /home/pleno/public_html/beta/source/Load/WalletTransactions.php on line 35
Stack trace:
/home/pleno/public_html/beta/source/Load/WalletTransactions.php(35)
/home/pleno/public_html/beta/source/Models/App/Wallet.php
```

Impacto:

Atacantes conseguem mapear nomes de classes, caminhos internos, estrutura de models, numeros de linhas e condicoes de falha. Isto melhora significativamente a capacidade de reconhecimento e desenvolvimento de exploits.

Correcao recomendada:

Configuracao PHP em producao:

```ini
display_errors = Off
log_errors = On
html_errors = Off
```

No codigo:

- Validar e converter parametros numericos antes de chamar models.
- Retornar erros JSON genericos.
- Encerrar a requisicao antes de chamar models quando nao houver utilizador autenticado.

### PLENO-005 - Medio/Alto - Metadados Composer e Vendor Publicamente Expostos

Caminhos afetados:

- `/beta/composer.json`
- `/beta/composer.lock`
- `/beta/vendor/composer/installed.json`

Evidencia:

```text
/beta/composer.json                       200 application/json 820 bytes
/beta/composer.lock                       200                 8787 bytes
/beta/vendor/composer/installed.json      200 application/json 38528 bytes
```

Pacotes observados:

```text
guzzlehttp/guzzle 7.9.3
guzzlehttp/psr7 2.7.1
matthiasmullie/minify 1.3.73
paragonie/sodium_compat v2.1.0
phpmailer/phpmailer v6.9.3
pusher/pusher-php-server 7.2.7
```

Achados da OSV API nas versoes expostas:

```text
guzzlehttp/guzzle 7.9.3
  GHSA-cwxw-98qj-8qjx / CVE-2026-55767 fixed in 7.12.1
  GHSA-wpwq-4j6v-78m3 / CVE-2026-55568 fixed in 7.12.1

guzzlehttp/psr7 2.7.1
  GHSA-34xg-wgjx-8xph / CVE-2026-48998 fixed in 2.10.2
  GHSA-hq7v-mx3g-29hw / CVE-2026-49214 fixed in 2.10.2
  GHSA-vm85-hxw5-5432 / CVE-2026-55766 fixed in 2.12.1

paragonie/sodium_compat 2.1.0
  GHSA-mrfv-m5wm-5w6w / CVE-2025-69277 fixed in 2.5.0
```

Impacto:

A exposicao revela a stack tecnologica e as versoes exatas das dependencias. Se caminhos vulneraveis do codigo usarem essas bibliotecas, atacantes podem direcionar CVEs conhecidos com alta confianca.

Correcao recomendada:

- Mover ficheiros Composer para fora do web root publico.
- Bloquear acesso a `composer.json`, `composer.lock` e `/vendor`.
- Executar `composer audit` no CI/CD.
- Atualizar dependencias vulneraveis.

Exemplo Apache:

```apache
<FilesMatch "^(composer\\.json|composer\\.lock)$">
    Require all denied
</FilesMatch>

<Directory "/home/pleno/public_html/beta/vendor">
    Require all denied
</Directory>
```

### PLENO-006 - Medio - Enumeracao de E-mails na Recuperacao de Senha

Endpoint afetado:

`POST /beta/source/App/ForgotPassword.php`

Descricao:

A resposta e diferente para e-mails existentes e inexistentes.

Evidencia:

```text
email=security-test-not-real@example.invalid
{"success":false,"message":"A conta para recuperacao nao foi encontrada."}

email=carlos.programador12@gmail.com
{"success":true,"message":"Foi enviado um e-mail contendo as instrucoes necessarias para recuperar a sua senha."}
```

Impacto:

Atacantes podem enumerar enderecos de e-mail registados de clientes.

Correcao recomendada:

Retornar sempre uma mensagem generica:

```text
Se existir uma conta com este e-mail, enviaremos instrucoes de recuperacao.
```

Tambem aplicar rate limiting e monitorizacao.

### PLENO-007 - Medio - Rate Limit de Login Nao Observado em Teste Leve

Endpoint afetado:

`POST /beta/source/App/Login.php`

Descricao:

Oito tentativas invalidas de login contra uma conta inexistente retornaram respostas identicas, sem throttling observado, bloqueio, captcha ou `429`.

Evidencia:

```text
try 1 status=200 message=E-mail ou palavra-passe invalidos.
try 8 status=200 message=E-mail ou palavra-passe invalidos.
```

Impacto:

Isto nao prova ausencia de rate limit em volume maior, mas nenhuma protecao ficou visivel no limiar basico testado. O risco de credential stuffing e password spraying permanece.

Correcao recomendada:

- Adicionar throttling por IP/conta/dispositivo.
- Usar backoff exponencial.
- Retornar `429 Too Many Requests` quando limites forem atingidos.
- Monitorizar padroes de falha de login.

### PLENO-008 - Medio - Headers de Seguranca Ausentes

Observado em paginas dinamicas:

Headers ausentes:

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Frame-Options` ou CSP `frame-ancestors`

Impacto:

A ausencia desses headers aumenta o impacto de XSS, clickjacking, MIME sniffing e riscos de downgrade.

Baseline recomendado:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'
```

A CSP deve ser ajustada porque o site usa Google Tag Manager, Meta Pixel, Brevo, Google Fonts e iframe de pagamento EMIS.

### PLENO-009 - Baixo/Medio - Cookie Auxiliar PHP Sem Flags

Observado:

`PHPSESSID` e emitido apenas com `path=/`.

Contexto importante:

Os cookies principais de autenticacao observados apos login estavam mais protegidos:

```text
plenotoken: Secure; HttpOnly; SameSite=Lax
plenoauthemail: Secure; HttpOnly; SameSite=Lax
```

Impacto:

Se `PHPSESSID` for usado para qualquer estado sensivel de workflow, a ausencia de flags aumenta a exposicao. Mesmo que nao seja o cookie principal de autenticacao, todos os cookies de sessao devem usar defaults seguros.

Correcao recomendada:

```ini
session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
session.use_strict_mode = 1
```

### PLENO-010 - Baixo/Medio - Logout Aceita GET e Permite Logout CSRF

Endpoint afetado:

`GET /beta/source/App/Logout.php`

Descricao:

O endpoint de logout aceita requisicao `GET` e encerra a sessao do utilizador. Como cookies `SameSite=Lax` sao enviados em navegacoes top-level `GET`, um site externo pode forcar o navegador da vitima a visitar esse URL e encerrar a sessao.

Evidencia:

```text
before_get_logout={"loggedIn":true}
GET /beta/source/App/Logout.php
get_logout_body={"success":true}
after_get_logout_with_cookiejar={"loggedIn":false}
```

Resposta observada:

```http
HTTP/1.1 200 OK
Set-Cookie: plenotoken=REDACTED; expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; path=/; domain=.pleno.ao
```

Impacto:

Um atacante pode forcar logout de utilizadores autenticados. O impacto e menor que roubo de conta, mas afeta disponibilidade da sessao e pode ser combinado com engenharia social, phishing ou interrupcao de fluxos de pagamento/checkout.

Correcao recomendada:

- Aceitar logout apenas por `POST`.
- Exigir token CSRF ou validar `Origin`/`Referer`.
- Retornar `405 Method Not Allowed` para `GET`.
- Manter revogacao server-side do token, conforme PLENO-002.

## Gateway EMIS e Integracao Pleno

Alvo observado:

`https://pagamentonline.emis.co.ao/online-payment-gateway/portal/login`

Nota de escopo:

O dominio `pagamentonline.emis.co.ao` pertence ao gateway/fornecedor de pagamento. A autorizacao da Pleno permite testar a integracao da Pleno, mas testes ativos contra infraestrutura EMIS, como brute force, fuzzing, scans amplos, exploracao de APIs autenticadas ou tentativa de bypass de login do portal EMIS, exigem autorizacao explicita da EMIS ou contrato/sandbox que inclua esse alvo. Nesta fase foram feitos apenas checks passivos de superficie publica.

### EMIS-OBS-001 - Observacao - Portal Publico Retorna SPA Mesmo no Caminho `/login`

Requisicao:

`GET /online-payment-gateway/portal/login`

Resultado observado:

```text
HTTP/1.1 404 Not Found
Content-Type: text/html
```

Apesar do `404`, o corpo retornado contem a aplicacao React:

```html
<title>Gateway de Pagamentos Online</title>
<script src="/gpoconfig/config.js" type="text/javascript"></script>
<script defer="defer" src="/online-payment-gateway/portal/static/js/main.6beec537.js"></script>
```

Impacto:

Nao e uma vulnerabilidade por si so. Deve ser tratado como observacao operacional: o roteamento da SPA devolve a aplicacao mesmo quando o status HTTP e `404`. Isto pode afetar monitorizacao, WAF, SEO e testes automatizados.

Recomendacao:

Confirmar com a EMIS se este comportamento e esperado. Para rotas validas da SPA, o ideal e responder `200`; para rotas inexistentes reais, responder `404` sem mascarar erro.

### EMIS-OBS-002 - Medio - CSP do Gateway Permite `unsafe-inline` e `unsafe-eval`

Header observado:

```http
Content-Security-Policy: default-src https://pagamentonline.emis.co.ao:* 'unsafe-inline' ; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; img-src 'self' blob:;
```

Impacto:

`unsafe-inline` e `unsafe-eval` reduzem significativamente a protecao oferecida pela CSP. Se existir qualquer XSS no portal ou em bibliotecas usadas, a politica atual tende a permitir execucao de scripts que uma CSP mais restritiva bloquearia.

Recomendacao:

Solicitar a EMIS um plano de hardening da CSP:

- remover `unsafe-eval`;
- substituir `unsafe-inline` por nonce/hash;
- adicionar `object-src 'none'`;
- adicionar `base-uri 'self'`;
- adicionar `frame-ancestors` conforme a necessidade real de iframe.

### EMIS-OBS-003 - Baixo/Medio - Ausencia de `frame-ancestors`/`X-Frame-Options` na Amostra

Headers observados:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Feature-Policy`
- `Content-Security-Policy`

Nao observado na amostra:

- `X-Frame-Options`
- CSP `frame-ancestors`

Impacto:

O gateway possui rota de iframe usada pela Pleno:

```text
https://pagamentonline.emis.co.ao/online-payment-gateway/portal/frame?token=...
```

Como o frame e parte do fluxo de pagamento, a EMIS deve controlar explicitamente quais origens podem emoldurar o conteudo. Sem `frame-ancestors`, a politica de enquadramento fica menos clara.

Recomendacao:

Solicitar a EMIS confirmacao da politica de iframe:

```http
Content-Security-Policy: frame-ancestors 'self' https://pleno.ao https://*.pleno.ao;
```

A lista exata deve refletir apenas os dominios de producao e sandbox autorizados.

### EMIS-OBS-004 - Informativo - Configuracao Publica do Portal Expõe Endpoints e Realm

Ficheiro publico:

`/gpoconfig/config.js`

Valores observados:

```javascript
REACT_APP_KEYCLOAK_BASE_URL = 'https://pagamentonline.emis.co.ao'
REACT_APP_KEYCLOAK_REALM = 'GPO'
REACT_APP_KEYCLOAK_CLIENT_ID = 'gpo-portal'
REACT_APP_KEYCLOAK_GRANT_TYPE = 'authorization_code'
REACT_APP_GPO_API_PATH = '/online-payment-gateway/api'
REACT_APP_GPM_API_PATH = '/mobile-payment-gateway/api'
```

O bundle publico tambem contem rotas/API paths como:

```text
/api/v1/entity-frame-tokens
/api/v1/payment-references
/protocol/openid-connect/auth
/protocol/openid-connect/token
/v1/merchants/{merchantId}/frameToken
/v1/merchants/{merchantId}/transactions
/v2/merchants/{merchantId}/transactions/start-transaction
/v2/points-of-sale/{posId}/payments
```

Impacto:

Estes dados normalmente nao sao secretos em aplicacoes SPA, mas ajudam no reconhecimento. O risco aumenta se algum endpoint aceitar chamadas sem autorizacao adequada.

Recomendacao:

Nao colocar segredos em `config.js` ou bundle frontend. Confirmar que todos os endpoints listados exigem autenticacao/autorizacao server-side e que tokens de frame sao curtos, de uso unico e vinculados ao comerciante/origem.

### EMIS-OBS-005 - Positivo - TLS e Certificado

Observado:

```text
TLS 1.0: rejeitado
TLS 1.1: rejeitado
TLS 1.2: aceite
TLS 1.3: aceite
Certificado: CN=pagamentonline.emis.co.ao
Emissor: Sectigo Public Server Authentication CA DV R36
Valido de 2026-03-10 ate 2027-04-10
SAN: pagamentonline.emis.co.ao, www.pagamentonline.emis.co.ao
```

Isto e positivo. O HSTS tambem esta presente:

```http
Strict-Transport-Security: max-age=15768000
```

Recomendacao:

Avaliar com a EMIS se e adequado aumentar para `max-age=31536000; includeSubDomains; preload`, desde que todos os subdominios estejam prontos para HTTPS.

### PLENO-EMIS-001 - Alto - Pontos de Integracao Que Precisam de Validacao Server-Side

Fluxo identificado na Pleno:

```javascript
const EMIS_API_FRAME_URL = "https://pagamentonline.emis.co.ao/online-payment-gateway/portal";
const frameUrl = `${EMIS_API_FRAME_URL}/frame?token=${encodeURIComponent(token)}`;
fetch(`${base}/source/Load/CheckPaymentStatus.php?reference=${reference}`)
```

Endpoints Pleno relacionados:

- `/beta/source/Load/DomainConnectTo.php`
- `/beta/source/Load/DomainRenewProcess.php`
- `/beta/source/Load/CheckPaymentStatus.php?reference=...`

Risco:

O frontend apenas deve abrir o iframe e mostrar estado visual. A decisao final de marcar uma encomenda como paga deve acontecer exclusivamente no backend da Pleno, apos confirmacao server-to-server com EMIS ou webhook assinado/validado.

Checks obrigatorios para a Pleno:

1. O `mce_token` deve ser gerado no backend e nunca conter segredos reutilizaveis.
2. O token do iframe deve ser curto, de uso unico e vinculado a encomenda/utilizador/valor.
3. O backend deve recalcular valor e itens; nao confiar em `localStorage` ou payload do frontend.
4. `CheckPaymentStatus.php` deve validar autenticacao e propriedade da referencia.
5. O webhook/callback EMIS deve validar assinatura/autenticidade.
6. Repeticao de callback nao pode duplicar pagamento nem reativar encomenda indevida.
7. Callback com valor divergente deve ser rejeitado.
8. Estado final deve ser transacional: `pendente`, `aceite/pago`, `rejeitado`, `expirado`, `cancelado`, `reembolsado`.

Testes que ainda exigem sandbox/credenciais EMIS:

- Gerar uma referencia MCE real de teste.
- Confirmar se `CheckPaymentStatus.php` revela estado sem sessao ou para outro utilizador.
- Enviar callback/webhook falso e confirmar rejeicao.
- Reenviar callback valido e confirmar idempotencia.
- Testar callback atrasado depois de expiracao/cancelamento.
- Testar pagamento com valor menor/maior que o pedido.

## Observacoes Positivas

- HTTP redireciona para HTTPS.
- TLS 1.0 e TLS 1.1 foram rejeitados.
- TLS 1.2 e TLS 1.3 foram aceites.
- Nao foi observado CORS wildcard nos endpoints amostrados.
- Listagem de diretorios para `/beta/source/`, `/beta/source/App/`, `/beta/source/Load/`, `/beta/vendor/` e `/beta/vendor/composer/` retornou 404.
- `.env`, `.git/HEAD`, backups obvios e caminhos `phpinfo` nao ficaram diretamente expostos nos caminhos amostrados.

## Itens em Aberto Que Exigem Mais Evidencia

Estes pontos devem ser testados com dados sandbox fornecidos pela Pleno ou com uma segunda conta de teste:

1. `CheckPaymentStatus.php` com uma referencia real de EMIS/pagamento.
2. Validacao de assinatura do webhook/callback do novo metodo de pagamento.
3. IDOR entre contas usando dois utilizadores legitimos de teste.
4. Replay/idempotencia de pagamento: callbacks repetidos, referencias repetidas e callbacks atrasados.
5. Recalculo do valor do checkout no backend versus valores enviados pelo frontend/localStorage.
6. Se administradores ou operadores visualizam notas da carteira, o que aumenta o impacto do XSS armazenado.
7. Se a troca de senha revoga todos os valores antigos de `plenotoken`.

## Ordem Recomendada de Correcao

1. Corrigir imediatamente a autorizacao em `OrderItems.php`.
2. Desativar exibicao de erros PHP em producao.
3. Revogar tokens no servidor durante logout e troca de senha.
4. Restringir logout a `POST` e adicionar validacao CSRF/Origin.
5. Escapar/sanitizar notas da carteira e todos os campos controlados pelo utilizador renderizados com HTML.
6. Bloquear metadados Composer/vendor publicos.
7. Adicionar rate limiting e respostas genericas na recuperacao de senha.
8. Adicionar headers de seguranca, comecando por HSTS e `X-Content-Type-Options`.
9. Atualizar dependencias e executar `composer audit`.
