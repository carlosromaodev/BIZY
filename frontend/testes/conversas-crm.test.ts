import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const conversasSource = () => readFileSync(resolve(process.cwd(), "src/paginas/Conversas.tsx"), "utf8");

describe("experiência CRM em conversas", () => {
  it("mantém ações críticas com feedback visual e poucos passos", () => {
    const source = conversasSource();

    expect(source).toContain('setMensagem("A processar...")');
    expect(source).toContain("Confirmar pagamento");
    expect(source).toContain("Cancelar");
    expect(source).toContain("Guardar");
    expect(source).toContain("/atendimento/conversas/${conversaAtual.conversaCrmId}");
    expect(source).toContain("/notas");
    expect(source).toContain("/sugestoes");
    expect(source).toContain("mensagem.status === \"FAILED\"");
  });

  it("destaca estados críticos de atendimento e prioridade", () => {
    const source = conversasSource();

    expect(source).toContain("traduzirEstadoCrm(conversa.estadoCrm)");
    expect(source).toContain("traduzirPrioridade(conversa.prioridade)");
    expect(source).toContain("obterVarianteStatusMensagem(mensagem.status)");
    expect(source).toContain('status === "FAILED"');
    expect(source).toContain("mensagemFalhou");
    expect(source).toContain("border-destructive/30");
    expect(source).toContain("bg-destructive/10");
    expect(source).toContain("politicasAutomacao.map");
  });

  it("relaciona conversas com produtos e pedidos antes do envio WhatsApp", () => {
    const source = conversasSource();

    expect(source).toContain('requisitarApi<Peca[]>("/pecas")');
    expect(source).toContain('requisitarApi<Reserva[]>("/reservas")');
    expect(source).toContain("ContextoPeca");
    expect(source).toContain("ContextoReserva");
    expect(source).toContain("montarMensagemPeca");
    expect(source).toContain("montarMensagemReserva");
    expect(source).toContain("enviarMensagemRapida");
    expect(source).toContain("Consultar produtos");
    expect(source).toContain("PainelContextoComercial");
    expect(source).toContain("RotuloComIcone");
    expect(source).toContain("Banco ligado");
  });

  it("usa próximas ações do backend e envia mensagens pelo contexto da conversa", () => {
    const source = conversasSource();
    const barra = readFileSync(resolve(process.cwd(), "src/componentes/atendimento/BarraAcoesInteligente.tsx"), "utf8");

    expect(source).toContain("RespostaProximasAcoesAtendimento");
    expect(source).toContain("/proximas-acoes");
    expect(source).toContain("acoesServidor={proximasAcoes}");
    expect(source).toContain("/atendimento/conversas/${conversaAtual.conversaCrmId}/mensagens");
    expect(source).toContain("entidadeTipo");
    expect(source).toContain("pedir-comprovativo");
    expect(barra).toContain("acoesServidor");
    expect(barra).toContain("PEDIR_COMPROVATIVO");
    expect(barra).toContain("ENVIAR_DADOS_PAGAMENTO");
    expect(barra).toContain("PEDIR_ENDERECO");
  });

  it("permite criar pedido diretamente a partir do produto no atendimento", () => {
    const source = conversasSource();

    expect(source).toContain("criarPedidoPorPeca");
    expect(source).toContain("/atendimento/conversas/${conversaAtual.conversaCrmId}/pedidos");
    expect(source).toContain("onCriarPedido={criarPedidoPorPeca}");
    expect(source).toContain("onCriarPedido?: (peca: Peca) => void");
    expect(source).toContain("Criar pedido");
  });
});
