-- Permite que o mesmo contacto reserve mais de uma unidade da mesma peça.
-- O controlo de stock continua a ser feito por transação serializável no backend.
DROP INDEX IF EXISTS "Reserva_cliente_peca_ativa_unica_idx";
