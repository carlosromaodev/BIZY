import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const PREFIXO = "enc:";

function obterChave(): Buffer {
  const segredo = process.env.CREDENCIAIS_ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? "emeu-dev-fallback";
  return scryptSync(segredo, "bizy-credenciais-salt", 32);
}

export function cifrarCredencial(plaintext: string): string {
  if (!plaintext || plaintext.startsWith(PREFIXO)) return plaintext;

  const chave = obterChave();
  const iv = randomBytes(IV_BYTES);
  const cifra = createCipheriv(ALGORITMO, chave, iv);

  const cifrado = Buffer.concat([cifra.update(plaintext, "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();

  // formato: enc:<iv_hex>:<tag_hex>:<dados_hex>
  return `${PREFIXO}${iv.toString("hex")}:${tag.toString("hex")}:${cifrado.toString("hex")}`;
}

export function decifrarCredencial(ciphertext: string): string {
  if (!ciphertext || !ciphertext.startsWith(PREFIXO)) return ciphertext;

  const partes = ciphertext.slice(PREFIXO.length).split(":");
  if (partes.length !== 3) return ciphertext;

  const [ivHex, tagHex, dadosHex] = partes;
  const chave = obterChave();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const dados = Buffer.from(dadosHex, "hex");

  const decifra = createDecipheriv(ALGORITMO, chave, iv);
  decifra.setAuthTag(tag);

  return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
}
