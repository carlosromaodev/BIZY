import { moduloAutenticacao } from "./autenticacao.js";
import { moduloCatalogo } from "./catalogo.js";
import { moduloClientes } from "./clientes.js";
import { moduloDiagnosticos } from "./diagnosticos.js";
import { moduloIntegracoes } from "./integracoes.js";
import { moduloLives } from "./lives.js";
import { moduloLojaPublica } from "./lojaPublica.js";
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
  moduloLojaPublica,
  moduloDiagnosticos,
  moduloMedia,
  moduloPedidos,
  moduloReservas,
  moduloIntegracoes,
  moduloN8n,
  moduloOperacional,
  moduloPainel
] satisfies ModuloHttp[];
