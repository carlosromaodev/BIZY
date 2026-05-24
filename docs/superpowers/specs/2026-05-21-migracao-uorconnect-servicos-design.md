# Migração Seletiva de Serviços do UOR Connect

## Objetivo

Reaproveitar, adaptando ao ÉMeu, as partes maduras do projeto `/home/carlos/Documentos/project/uorconnect` que melhor servem os requisitos do MVP: SMS Ombala, WhatsApp Evolution, upload/storage de comprovativos e emissão de PDFs operacionais.

## Decisão de Arquitetura

O ÉMeu não deve copiar o domínio do UOR Connect. O código será migrado como infraestrutura genérica, mantendo os contratos já existentes do ÉMeu: `ProvedorSms`, `ProvedorWhatsApp`, repositórios, módulos HTTP e use cases puros. A adaptação deve respeitar ESM, Fastify 4, Zod 3 e Prisma 5.

## Escopo Aprovado

1. SMS Ombala:
   - normalização robusta de números angolanos;
   - envio com agendamento opcional;
   - diagnóstico de créditos, remetentes e histórico básico;
   - validação anti-spam simples.

2. WhatsApp Evolution:
   - seleção e status mais robustos de instâncias;
   - extração profunda de erros;
   - envio com retry/backoff;
   - suporte interno a texto e media/documento;
   - política mínima contra mensagens problemáticas.

3. Media storage:
   - upload de `dataUrl`;
   - suporte a imagem e PDF;
   - compressão de imagem;
   - ficheiros privados para comprovativos de pagamento.

4. PDF:
   - utilitário HTML -> PDF via Playwright;
   - recibo de reserva em PDF;
   - base futura para lista de entregas e comprovativos.

## Fora do Escopo Nesta Iteração

- Campanhas massivas por audiência, turmas, cursos ou estudantes.
- Filas duráveis de PDF em banco.
- RBAC avançado.
- Reescrever a interface agora.

## Critérios de Aceite

- Testes unitários cobrirem helpers críticos de SMS, WhatsApp, media e PDF.
- Endpoints novos exigirem sessão autenticada quando expõem dados do provider ou ficheiros privados.
- `npm run test --workspace backend`, `npm run typecheck --workspace backend` e `npm run build --workspace backend` passarem.
- O ÉMeu continuar funcional em modo dev mesmo sem `OMBALA_API_TOKEN`, `EVOLUTION_API_KEY` ou navegador Playwright instalado.
