import type {
  MensagemWhatsApp,
  ProvedorWhatsApp,
  ResultadoEnvioWhatsApp
} from "../../dominio/provedores/ProvedorWhatsApp.js";
import { normalizarTelefoneWhatsApp } from "./ClienteEvolutionApi.js";

interface OpcoesControleEnvioWhatsApp {
  intervaloPorContatoMs?: number;
  intervaloGlobalMs?: number;
  relogioMs?: () => number;
  aguardarMs?: (ms: number) => Promise<void>;
}

export class ProvedorWhatsAppComControleEnvio implements ProvedorWhatsApp {
  private readonly intervaloPorContatoMs: number;
  private readonly intervaloGlobalMs: number;
  private readonly relogioMs: () => number;
  private readonly aguardarMs: (ms: number) => Promise<void>;
  private readonly ultimoEnvioPorContato = new Map<string, number>();
  private readonly filaPorContato = new Map<string, Promise<void>>();
  private ultimoEnvioGlobal = 0;
  private filaGlobal: Promise<void> = Promise.resolve();

  constructor(
    private readonly provedor: ProvedorWhatsApp,
    opcoes: OpcoesControleEnvioWhatsApp = {}
  ) {
    this.intervaloPorContatoMs = Math.max(0, opcoes.intervaloPorContatoMs ?? 6_500);
    this.intervaloGlobalMs = Math.max(0, opcoes.intervaloGlobalMs ?? 0);
    this.relogioMs = opcoes.relogioMs ?? (() => Date.now());
    this.aguardarMs = opcoes.aguardarMs ?? aguardar;
  }

  async enviarMensagem(mensagem: MensagemWhatsApp): Promise<ResultadoEnvioWhatsApp> {
    const chaveContato = this.criarChaveContato(mensagem.telefone);
    const filaAnterior = this.filaPorContato.get(chaveContato) ?? Promise.resolve();
    const execucao = filaAnterior
      .catch(() => undefined)
      .then(() => this.enviarComControle(chaveContato, mensagem));
    const marcador = execucao.then(() => undefined, () => undefined);

    this.filaPorContato.set(chaveContato, marcador);
    marcador.finally(() => {
      if (this.filaPorContato.get(chaveContato) === marcador) {
        this.filaPorContato.delete(chaveContato);
      }
    });

    return execucao;
  }

  private async enviarComControle(
    chaveContato: string,
    mensagem: MensagemWhatsApp
  ): Promise<ResultadoEnvioWhatsApp> {
    await this.aguardarIntervalo(this.ultimoEnvioPorContato, chaveContato, this.intervaloPorContatoMs);

    const enviar = async () => {
      try {
        return await this.provedor.enviarMensagem(mensagem);
      } finally {
        this.ultimoEnvioPorContato.set(chaveContato, this.relogioMs());
      }
    };

    if (this.intervaloGlobalMs <= 0) {
      return enviar();
    }

    return this.executarNaFilaGlobal(enviar);
  }

  private async executarNaFilaGlobal<T>(operacao: () => Promise<T>): Promise<T> {
    const filaAnterior = this.filaGlobal.catch(() => undefined);
    let liberarFilaAtual: () => void = () => undefined;
    const filaAtual = new Promise<void>((resolve) => {
      liberarFilaAtual = resolve;
    });
    this.filaGlobal = filaAnterior.then(() => filaAtual);

    await filaAnterior;
    await this.aguardarIntervaloGlobal();

    try {
      return await operacao();
    } finally {
      this.ultimoEnvioGlobal = this.relogioMs();
      liberarFilaAtual();
    }
  }

  private async aguardarIntervalo(
    mapa: Map<string, number>,
    chave: string,
    intervaloMs: number
  ): Promise<void> {
    if (intervaloMs <= 0) return;

    const ultimoEnvio = mapa.get(chave);
    if (!ultimoEnvio) return;

    const esperaMs = intervaloMs - (this.relogioMs() - ultimoEnvio);
    if (esperaMs > 0) {
      await this.aguardarMs(esperaMs);
    }
  }

  private async aguardarIntervaloGlobal(): Promise<void> {
    if (this.intervaloGlobalMs <= 0 || !this.ultimoEnvioGlobal) return;

    const esperaMs = this.intervaloGlobalMs - (this.relogioMs() - this.ultimoEnvioGlobal);
    if (esperaMs > 0) {
      await this.aguardarMs(esperaMs);
    }
  }

  private criarChaveContato(telefone: string): string {
    const telefoneNormalizado = normalizarTelefoneWhatsApp(telefone)?.providerTo;
    if (telefoneNormalizado) return telefoneNormalizado;

    return telefone.replace(/\D/g, "") || telefone;
  }
}

function aguardar(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
