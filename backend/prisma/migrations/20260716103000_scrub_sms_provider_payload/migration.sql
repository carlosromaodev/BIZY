-- Respostas brutas do provider podem repetir o texto do OTP.
-- Mantemos apenas metadados operacionais sem telefone, mensagem ou código.
UPDATE "CodigoLoginSms"
SET "providerResponseJson" = jsonb_build_object(
  'provider',
  jsonb_strip_nulls(
    jsonb_build_object(
      'idExterno', "providerMessageId",
      'statusEnvio', "statusEnvio"
    )
  )
)::text
WHERE "providerResponseJson" IS NOT NULL;
