import { moduloAdminGovernanca } from "./adminGovernanca.js";
import { moduloAnaniGovernance } from "./ananiGovernance.js";
import { moduloAfiliados } from "./afiliados.js";
import { moduloCheckoutUnificado } from "../../../projetos/market/infra/http/moduloCheckoutUnificado.js";
import { moduloAutenticacao } from "./autenticacao.js";
import { moduloContaBizy } from "./contaBizy.js";
import { moduloCampanhas } from "./campanhas.js";
import { moduloCatalogo } from "./catalogo.js";
import { moduloClientes } from "./clientes.js";
import { moduloContratos } from "./contratos.js";
import { moduloApoioComercial } from "./apoioComercial.js";
import { moduloDiagnosticos } from "./diagnosticos.js";
import { moduloEquipa } from "../../../projetos/team/infra/http/moduloEquipa.js";
import { moduloFinancas } from "./financas.js";
import { moduloInteligencia } from "./inteligencia.js";
import { moduloIntegracoes } from "./integracoes.js";
import { moduloWorkflow } from "./workflow.js";
import { moduloProjectos } from "../../../projetos/team/infra/http/moduloProjectos.js";
import { moduloConformidade } from "./conformidade.js";
import { moduloLives } from "./lives.js";
import { moduloLojaPublica } from "../../../projetos/market/infra/http/moduloLojaPublica.js";
import { moduloLearning } from "../../../projetos/learning/infra/http/moduloLearning.js";
import { moduloMarket } from "../../../projetos/market/infra/http/moduloMarket.js";
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
  moduloContaBizy,
  moduloLives,
  moduloCatalogo,
  moduloClientes,
  moduloCampanhas,
  moduloApoioComercial,
  moduloContratos,
  moduloLojaPublica,
  moduloLearning,
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
  moduloAnaniGovernance,
  moduloCheckoutUnificado,
  moduloEquipa,
  moduloFinancas,
  moduloInteligencia,
  moduloWorkflow,
  moduloProjectos,
  moduloConformidade
] satisfies ModuloHttp[];
