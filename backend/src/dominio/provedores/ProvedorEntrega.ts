export const tiposEntrega = ["RETIRADA_LOJA", "DOMICILIO", "ORCAMENTO", "A_COMBINAR"] as const;
export type TipoEntrega = (typeof tiposEntrega)[number];

export interface DadosCalculoEntrega {
  negocioId: string;
  tipoEntrega: TipoEntrega;
  provincia?: string | null;
  municipio?: string | null;
  endereco?: string | null;
  itens: Array<{
    codigoPeca: string;
    quantidade: number;
    pesoGramas?: number | null;
  }>;
}

export interface ResultadoCalculoEntrega {
  provider: string;
  tipoEntrega: TipoEntrega;
  taxaEntregaEmKwanza: number;
  prazoEstimadoMinutos: number | null;
  disponivel: boolean;
  motivo?: string | null;
}

export interface DadosRastreioEntrega {
  pedidoId: string;
  negocioId: string;
  codigoRastreio?: string | null;
}

export interface EventoRastreioEntrega {
  estado: string;
  descricao: string;
  ocorridoEm: Date;
}

export interface ProvedorEntrega {
  readonly nome: string;
  calcularEntrega(dados: DadosCalculoEntrega): Promise<ResultadoCalculoEntrega>;
  rastrear(dados: DadosRastreioEntrega): Promise<EventoRastreioEntrega[]>;
}
