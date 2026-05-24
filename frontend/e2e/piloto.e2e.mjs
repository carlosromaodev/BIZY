import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const codigoPeca = process.env.E2E_CODIGO_PECA ?? String(Date.now()).slice(-4);
const telefoneCliente = process.env.E2E_TELEFONE_CLIENTE ?? "923456789";

const browser = await chromium.launch({ headless: process.env.E2E_HEADLESS !== "false" });
const page = await browser.newPage();
page.setDefaultTimeout(Number(process.env.E2E_TIMEOUT_MS ?? 15_000));

try {
  await login();
  await cadastrarPeca();
  await enviarComentarioManual();
  await confirmarPagamento();
  console.log(`E2E piloto concluído para peça #${codigoPeca}.`);
} finally {
  await browser.close();
}

async function login() {
  await page.goto(`${baseUrl}/login`);
  await page.locator("#nomeLogin").fill("Vendedor E2E");
  await page.locator("#telefoneLogin").fill("923000088");
  await page.getByRole("button", { name: /enviar codigo|enviar código/i }).click();

  const codigoDev = (await page.locator(".codigo-dev strong").textContent())?.trim();
  if (!codigoDev) {
    throw new Error("O E2E exige backend em modo dev com codigoDev exposto para login.");
  }

  await page.locator("#codigoLogin").fill(codigoDev);
  await page.getByRole("button", { name: /validar e entrar/i }).click();
  await page.waitForURL(/\/app/);
}

async function cadastrarPeca() {
  await page.goto(`${baseUrl}/app/catalogo`);
  await page.getByRole("button", { name: /novo produto|nova peca|nova peça/i }).click();
  await page.locator("#codPeca").fill(codigoPeca);
  await page.locator("#nomePeca").fill(`Produto E2E ${codigoPeca}`);
  await page.locator("#descPeca").fill("Produto criado pelo teste E2E do piloto.");
  await page.locator("#precPeca").fill("12000");
  await page.locator("#qtdPeca").fill("1");
  await page.getByRole("button", { name: /cadastrar/i }).click();
  await page.getByText("Produto cadastrado com sucesso.").waitFor();
  await page.getByText(`#${codigoPeca}`).waitFor();
}

async function enviarComentarioManual() {
  await page.goto(`${baseUrl}/app`);
  await page.locator("#comManual").fill(`eu quero ${telefoneCliente} peça ${codigoPeca}`);
  await page.getByRole("button", { name: /enviar para parser/i }).click();
  await page.getByText("Comentário enviado.").waitFor();
}

async function confirmarPagamento() {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`${baseUrl}/app/reservas`);
  await page.getByText(`#${codigoPeca}`).waitFor();
  await page.locator("input[placeholder='Buscar por cliente, telefone ou produto...']").fill(codigoPeca);
  await page.getByTitle("Confirmar pagamento").first().click();
  await page.getByText("Pagamento confirmado.").waitFor();
}
