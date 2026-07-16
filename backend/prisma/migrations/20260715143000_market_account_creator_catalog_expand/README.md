# Market account, creator and catalog expansion

## Impacto

Migration expand-only. Adiciona perfil Creator global, programas, solicitacoes, relacoes, autorizacoes de produto, produto canonico e oferta do seller. Os modelos legados continuam disponiveis durante o cutover.

## Backfill

Cada `Peca` com `negocioId` recebe `ProdutoCatalogo.id = catalogo-<Peca.id>` e `OfertaSeller.id = Peca.id`. Perfis, programas e relacoes existentes sao projectados a partir de `ParceiroComercial` e `OfertaCreator`.

## Rollback

1. Desactivar o uso de `ProdutoCatalogo`, `OfertaSeller`, `PerfilCreator`, `ProgramaAfiliacao`, `SolicitacaoAfiliacao`, `RelacaoAfiliacao` e `AutorizacaoProdutoAfiliado`.
2. Confirmar que todas as escritas continuam presentes nos modelos legados.
3. Exportar as tabelas novas para auditoria.
4. Remover tabelas e relacoes apenas numa migration posterior. Nao executar `DROP` como rollback automatico desta migration.

## Validacao

Executar `prisma migrate deploy`, comparar a contagem de `Peca` com `negocioId` e `OfertaSeller`, e criar/actualizar uma peca para confirmar o dual-write de titulo, preco e stock.
