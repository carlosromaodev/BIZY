import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ConformidadeROIUseCase } from "../use-case/ConformidadeROIUseCase.js";

describe("ConformidadeROIUseCase", () => {
  it("RF-T046/RNF-T025: gera factura electrónica em XML UBL com adaptador Peppol preparado", async () => {
    const factura = {
      findFirstOrThrow: vi.fn().mockResolvedValue({
        id: "factura-1",
        serie: "FT",
        numero: 7,
        anoFiscal: 2026,
        clienteNome: "Cliente & Companhia",
        clienteNif: "541700000",
        clienteEndereco: "Rua 1",
        subtotal: 10000,
        ivaPercentual: 14,
        ivaValor: 1400,
        total: 11400,
        emitidaEm: new Date("2026-07-01T10:00:00.000Z"),
        negocio: {
          nomeComercial: "Bizy Loja",
          nif: "500000000",
          telefone: "+244900000000",
          email: "loja@bizy.test",
          endereco: "Luanda",
          moeda: "AOA"
        },
        itens: [
          {
            descricao: "Produto <Premium>",
            quantidade: 2,
            precoUnitario: 5000,
            subtotal: 10000,
            ivaPercentual: 14,
            ivaValor: 1400
          }
        ]
      })
    };
    const prisma = { factura } as unknown as PrismaClient;
    const useCase = new ConformidadeROIUseCase(prisma);

    const resultado = await useCase.gerarFacturaEletronica(
      "negocio-1",
      "factura-1",
      "PEPPOL_BIS_BILLING_3"
    );

    expect(resultado.formato).toBe("PEPPOL_BIS_BILLING_3");
    expect(resultado.adaptador.estado).toBe("PREPARADO");
    expect(resultado.xml).toContain("<Invoice");
    expect(resultado.xml).toContain("<cbc:ProfileID>PEPPOL_BIS_BILLING_3</cbc:ProfileID>");
    expect(resultado.xml).toContain("Cliente &amp; Companhia");
    expect(resultado.xml).toContain("Produto &lt;Premium&gt;");
    expect(factura.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "factura-1", negocioId: "negocio-1" },
        include: expect.objectContaining({ itens: true })
      })
    );
  });

  it("RNF-T028/RNF-T029: aplica template de factura por jurisdição e idioma com nota localizada", async () => {
    const factura = {
      findFirstOrThrow: vi.fn().mockResolvedValue({
        id: "factura-2",
        serie: "FT",
        numero: 9,
        anoFiscal: 2026,
        clienteNome: "Global Buyer",
        clienteNif: "541700001",
        clienteEndereco: "Rua Internacional",
        subtotal: 10000,
        ivaPercentual: 14,
        ivaValor: 1400,
        total: 11400,
        emitidaEm: new Date("2026-07-01T10:00:00.000Z"),
        negocio: {
          nomeComercial: "Bizy Global",
          nif: "500000001",
          telefone: "+244900000001",
          email: "global@bizy.test",
          endereco: "Luanda",
          moeda: "AOA"
        },
        itens: [
          {
            descricao: "Consulting",
            quantidade: 1,
            precoUnitario: 10000,
            subtotal: 10000,
            ivaPercentual: 14,
            ivaValor: 1400
          }
        ]
      })
    };
    const prisma = { factura } as unknown as PrismaClient;
    const useCase = new ConformidadeROIUseCase(prisma);

    const resultado = await useCase.gerarFacturaEletronica("negocio-1", "factura-2", "UBL_21", {
      jurisdicao: "AO",
      idioma: "en-US"
    });

    expect(resultado.template).toEqual(
      expect.objectContaining({
        jurisdicao: "AO",
        idioma: "en-US",
        locale: "en-US",
        nome: "Factura fiscal Angola"
      })
    );
    expect(resultado.xml).toContain('<cbc:Note languageID="en-US">Invoice | Issue date:');
    expect(resultado.xml).toContain("Total due:");
    expect(resultado.xml).toContain("Tax document issued under Angola fiscal rules.");
  });

  it("RF-T048/RNF-T025: prepara envio e-invoicing externo por adaptador e outbox n8n", async () => {
    const factura = {
      findFirstOrThrow: vi.fn().mockResolvedValue({
        id: "factura-1",
        serie: "FT",
        numero: 8,
        anoFiscal: 2026,
        clienteNome: "Cliente Fiscal",
        clienteNif: "541700000",
        clienteEndereco: "Rua 2",
        subtotal: 20000,
        ivaPercentual: 14,
        ivaValor: 2800,
        total: 22800,
        emitidaEm: new Date("2026-07-01T11:00:00.000Z"),
        negocio: {
          nomeComercial: "Bizy Loja",
          nif: "500000000",
          telefone: "+244900000000",
          email: "loja@bizy.test",
          endereco: "Luanda",
          moeda: "AOA"
        },
        itens: [
          {
            descricao: "Serviço fiscal",
            quantidade: 1,
            precoUnitario: 20000,
            subtotal: 20000,
            ivaPercentual: 14,
            ivaValor: 2800
          }
        ]
      })
    };
    const outboxEventoN8n = {
      create: vi.fn().mockResolvedValue({ id: "outbox-n8n-1", eventoId: "evento-1", status: "PENDENTE" })
    };
    const prisma = { factura, outboxEventoN8n } as unknown as PrismaClient;
    const useCase = new ConformidadeROIUseCase(prisma);

    const resultado = await useCase.prepararEnvioFacturaEletronica("negocio-1", "factura-1", {
      adaptadorId: "API_GOV_REGIONAL",
      credencialRef: "credencial:fiscal:ao",
      endpointUrl: "https://api.fiscal.test/e-invoicing"
    });

    expect(resultado).toEqual(
      expect.objectContaining({
        facturaId: "factura-1",
        estado: "PENDENTE_ENVIO",
        eventoN8n: { id: "outbox-n8n-1", eventoId: "evento-1", status: "PENDENTE" }
      })
    );
    expect(outboxEventoN8n.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          negocioId: "negocio-1",
          tipo: "EINVOICING_ENVIO_SOLICITADO",
          status: "PENDENTE"
        })
      })
    );
    const payload = JSON.parse(outboxEventoN8n.create.mock.calls[0][0].data.payloadJson);
    expect(payload).toEqual(
      expect.objectContaining({
        adaptadorId: "API_GOV_REGIONAL",
        protocolo: "API_REST",
        credencialRef: "credencial:fiscal:ao",
        endpointUrl: "https://api.fiscal.test/e-invoicing",
        mimeType: "application/xml"
      })
    );
    expect(payload.xml).toContain("<Invoice");
  });

  it("RF-T098: calcula ROI do módulo com valores actuais de KPI, não com baseline repetido", async () => {
    const registadoEm = new Date("2026-06-01T00:00:00.000Z");
    const baselineKPI = {
      findMany: vi.fn().mockResolvedValue([
        { modulo: "team-core", kpi: "pedidos_mensais", valorBaseline: 10, registadoEm },
        { modulo: "team-core", kpi: "receita_mensal", valorBaseline: 40_000, registadoEm }
      ])
    };
    const pedido = {
      count: vi.fn().mockResolvedValue(15),
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalEmKwanza: 52_000 } })
    };
    const prisma = { baselineKPI, pedido } as unknown as PrismaClient;
    const useCase = new ConformidadeROIUseCase(prisma);

    const resultado = await useCase.calcularROIModulo("negocio-1", "team-core");

    expect(resultado).toEqual({
      modulo: "team-core",
      semBaseline: false,
      metricas: [
        { kpi: "pedidos_mensais", baseline: 10, actual: 15, melhoriaPercentual: 50, registadoEm },
        { kpi: "receita_mensal", baseline: 40_000, actual: 52_000, melhoriaPercentual: 30, registadoEm }
      ]
    });
    expect(pedido.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ negocioId: "negocio-1" })
      })
    );
    expect(pedido.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ negocioId: "negocio-1", estadoPagamento: "CONFIRMADO" }),
        _sum: { totalEmKwanza: true }
      })
    );
  });
});
