import { moduloAdminGovernanca } from "./adminGovernanca.js";
import { moduloAfiliados } from "./afiliados.js";
import { moduloCheckoutUnificado } from "./checkoutUnificado.js";
import { moduloAutenticacao } from "./autenticacao.js";
import { moduloCampanhas } from "./campanhas.js";
import { moduloCatalogo } from "./catalogo.js";
import { moduloClientes } from "./clientes.js";
import { moduloContratos } from "./contratos.js";
import { moduloApoioComercial } from "./apoioComercial.js";
import { moduloDiagnosticos } from "./diagnosticos.js";
import { moduloEquipa } from "./equipa.js";
import { moduloFinancas } from "./financas.js";
import { moduloInteligencia } from "./inteligencia.js";
import { moduloIntegracoes } from "./integracoes.js";
import { moduloWorkflow } from "./workflow.js";
import { moduloProjectos } from "./projectos.js";
import { moduloConformidade } from "./conformidade.js";
import { moduloLives } from "./lives.js";
import { moduloLojaPublica } from "./lojaPublica.js";
import { moduloMarket } from "./market.js";
import { moduloMedia } from "./media.js";
import type { ModuloHttp } from "./ModuloHttp.js";
import { moduloN8n } from "./n8n.js";
import { moduloOperacional } from "./operacional.js";
import { moduloPainel } from "./painel.js";
import { moduloPedidos } from "./pedidos.js";
import { moduloReservas } from "./reservas.js";
import { moduloSaude } from "./saude.js";

export const modulosHttp = [
  moduloSaude,
  moduloAutenticacao,
  moduloLives,
  moduloCatalogo,
  moduloClientes,
  moduloCampanhas,
  moduloApoioComercial,
  moduloContratos,
  moduloLojaPublica,
  moduloMarket,
  moduloAfiliados,
  moduloDiagnosticos,
  moduloMedia,
  moduloPedidos,
  moduloReservas,
  moduloIntegracoes,
  moduloN8n,
  moduloOperacional,
  moduloPainel,
  moduloAdminGovernanca,
  moduloCheckoutUnificado,
  moduloEquipa,
  moduloFinancas,
  moduloInteligencia,
  moduloWorkflow,
  moduloProjectos,
  moduloConformidade
] satisfies ModuloHttp[];
