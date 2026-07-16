import type {
  CredenciaisEstudantis,
  PerfilAcademicoAutenticado,
  ProvedorAutenticacaoEstudantil,
  ResultadoAutenticacaoEstudantil
} from "../../use-case/AutenticacaoEstudantilUseCase.js";

type TipoFalhaAcademica = "CREDENCIAIS_INVALIDAS" | "PROVIDER_INDISPONIVEL" | "PERFIL_INCOMPLETO";

type ResultadoPortal =
  | { sucesso: true; perfil: PerfilAcademicoAutenticado }
  | { sucesso: false; tipo: TipoFalhaAcademica; motivo: string };

interface PaginaPortal {
  status: number;
  url: string;
  html: string;
  cookies: string;
  location: string;
}

interface OpcoesProvedorAcademicoDireto {
  timeoutMs?: number;
  uorLoginUrl?: string;
  isptecLoginUrl?: string;
  isptecGroupUrl?: string;
  isptecHomeUrl?: string;
  fallback?: ProvedorAutenticacaoEstudantil;
}

const UOR_LOGIN_URL_PADRAO = "http://secretaria.uor.edu.ao/netpa/page?stage=loginstage";
const UOR_TARGET_STAGE = "BoletimMatricula";
const ISPTEC_LOGIN_URL_PADRAO =
  "https://portal.isptec.co.ao/projetos/nucleo/uteis/login.php?&tid=0&lid=0&pid=24&arq_ret=R5QT1WSRQBMCVQVPFFQSF99MCT5RT44Q9WRW0RBM0FMM5QQ4R4CV59RWRF1F5SWCW0";
const ISPTEC_GROUP_URL_PADRAO =
  "https://portal.isptec.co.ao/projetos/nucleo/uteis/grupo_selecionar.php?&tid=0&lid=0&pid=24&arq_ret=R5QT1WSRQBMCVQVPFFQSF99MCT5RT44Q9WRW0RBM0FMM5QQ4R4CV59RWRF1F5SWCW0&arq_ret_natural=&tid=0&lid=0&pid=24";
const ISPTEC_HOME_URL_PADRAO =
  "https://portal.isptec.co.ao/projetos/portal_online/index.php?&tid=0&lid=0&pid=24";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export class ProvedorAcademicoDireto implements ProvedorAutenticacaoEstudantil {
  private readonly timeoutMs: number;
  private readonly uorLoginUrl: string;
  private readonly isptecLoginUrl: string;
  private readonly isptecGroupUrl: string;
  private readonly isptecHomeUrl: string;

  constructor(private readonly opcoes: OpcoesProvedorAcademicoDireto = {}) {
    this.timeoutMs = opcoes.timeoutMs && opcoes.timeoutMs > 0 ? opcoes.timeoutMs : 25_000;
    this.uorLoginUrl = opcoes.uorLoginUrl?.trim() || UOR_LOGIN_URL_PADRAO;
    this.isptecLoginUrl = opcoes.isptecLoginUrl?.trim() || ISPTEC_LOGIN_URL_PADRAO;
    this.isptecGroupUrl = opcoes.isptecGroupUrl?.trim() || ISPTEC_GROUP_URL_PADRAO;
    this.isptecHomeUrl = opcoes.isptecHomeUrl?.trim() || ISPTEC_HOME_URL_PADRAO;
  }

  async autenticar(credenciais: CredenciaisEstudantis): Promise<ResultadoAutenticacaoEstudantil> {
    const resultado = credenciais.provider === "isptec"
      ? await this.autenticarIsptec(credenciais)
      : await this.autenticarUor(credenciais);

    if (resultado.sucesso) {
      return resultado;
    }

    if (resultado.tipo === "PROVIDER_INDISPONIVEL" && this.opcoes.fallback) {
      const fallback = await this.opcoes.fallback.autenticar(credenciais);
      if (fallback.sucesso || fallback.codigo !== "PROVIDER_INDISPONIVEL") {
        return fallback;
      }
    }

    return {
      sucesso: false,
      codigo: resultado.tipo,
      erro: this.mensagemPublica(resultado.tipo, credenciais.provider)
    };
  }

  private async autenticarUor(credenciais: CredenciaisEstudantis): Promise<ResultadoPortal> {
    try {
      const inicial = await this.fetchPagina(this.uorLoginUrl, {
        method: "GET",
        headers: this.headersHtml()
      });
      if (inicial.status >= 400 || !inicial.cookies) {
        return this.falha("PROVIDER_INDISPONIVEL", `UOR init ${inicial.status}`);
      }

      const body = new URLSearchParams({
        _formsubmitstage: "loginstage",
        _formsubmitname: "login",
        _formfieldnames: "afterloginstageid,_user,_pass",
        afterloginstageid: UOR_TARGET_STAGE,
        _user: credenciais.identificador,
        _pass: credenciais.palavraPasse,
        submitAction: ""
      });
      const login = await this.fetchPagina(this.uorLoginUrl, {
        method: "POST",
        headers: this.headersHtml({
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: inicial.cookies,
          Referer: this.uorLoginUrl
        }),
        body: body.toString()
      }, inicial.cookies);

      if (login.status === 401 || this.temFalhaAutenticacaoUor(login.html)) {
        return this.falha("CREDENCIAIS_INVALIDAS", "UOR rejeitou as credenciais");
      }
      if (login.status >= 400 || (login.status < 300 && !login.location && this.temFormularioLoginUor(login.html))) {
        return this.falha("PROVIDER_INDISPONIVEL", `UOR login ${login.status}`);
      }

      const destinoDireto = this.uorLoginUrl.replace("loginstage", UOR_TARGET_STAGE);
      const candidatos = Array.from(new Set([
        login.location ? new URL(login.location, this.uorLoginUrl).toString() : "",
        destinoDireto
      ].filter(Boolean)));
      let sessaoAutenticada = false;

      for (const candidato of candidatos) {
        const pagina = await this.fetchPagina(candidato, {
          method: "GET",
          headers: this.headersHtml({
            Cookie: login.cookies,
            Referer: this.uorLoginUrl
          })
        }, login.cookies);

        if (pagina.status === 401 || this.temFalhaAutenticacaoUor(pagina.html)) {
          continue;
        }
        if (pagina.status >= 400) {
          continue;
        }
        if (!this.temFormularioLoginUor(pagina.html)) {
          sessaoAutenticada = true;
        }
        if (!this.temMarcadorPerfilUor(pagina.html)) {
          continue;
        }

        const perfil = this.extrairPerfilUor(pagina.html, credenciais);
        if (!perfil.studentNumber) {
          return this.falha("PERFIL_INCOMPLETO", "UOR não devolveu o número oficial");
        }
        return { sucesso: true, perfil };
      }

      if (sessaoAutenticada && credenciais.tipoIdentificador === "studentNumber") {
        return {
          sucesso: true,
          perfil: {
            institutionCode: "UOR",
            studentNumber: credenciais.identificador,
            nome: `Estudante ${credenciais.identificador}`,
            dados: {
              provider: "uor",
              origem: "SECRETARIA_DIRETA",
              perfilPendenteSincronizacao: true
            }
          }
        };
      }

      return this.falha(
        credenciais.tipoIdentificador === "username" ? "PERFIL_INCOMPLETO" : "PROVIDER_INDISPONIVEL",
        "UOR autenticou sem devolver perfil utilizável"
      );
    } catch (erro) {
      return this.falha("PROVIDER_INDISPONIVEL", this.mensagemTecnica(erro));
    }
  }

  private async autenticarIsptec(credenciais: CredenciaisEstudantis): Promise<ResultadoPortal> {
    try {
      const inicial = await this.fetchPagina(this.isptecLoginUrl, {
        method: "GET",
        headers: this.headersHtml()
      });
      if (inicial.status >= 400) {
        return this.falha("PROVIDER_INDISPONIVEL", `ISPTEC init ${inicial.status}`);
      }

      const loginUrl = this.lerFormAction(inicial.html, this.isptecLoginUrl);
      const login = await this.fetchPagina(loginUrl, {
        method: "POST",
        headers: this.headersHtml({
          "Content-Type": "application/x-www-form-urlencoded",
          ...(inicial.cookies ? { Cookie: inicial.cookies } : {}),
          Referer: this.isptecLoginUrl
        }),
        body: new URLSearchParams({
          codigo: credenciais.identificador,
          senha: credenciais.palavraPasse,
          acao: "efetuar_login",
          cd_coligada_matriz: "",
          url_navegador: ""
        }).toString()
      }, inicial.cookies);

      if (login.status === 401 || this.temFalhaAutenticacaoIsptec(login.html)) {
        return this.falha("CREDENCIAIS_INVALIDAS", "ISPTEC rejeitou as credenciais");
      }
      if (login.status >= 400) {
        return this.falha("PROVIDER_INDISPONIVEL", `ISPTEC login ${login.status}`);
      }

      const candidatos = Array.from(new Set([
        login.location ? new URL(login.location, loginUrl).toString() : "",
        this.isptecGroupUrl,
        this.isptecHomeUrl
      ].filter(Boolean)));
      let ultimoMotivo = "ISPTEC não devolveu perfil";

      for (const candidato of candidatos) {
        const resultado = await this.carregarPerfilIsptec(
          candidato,
          login.cookies,
          loginUrl,
          credenciais.identificador
        );
        if (resultado.sucesso) {
          return resultado;
        }
        ultimoMotivo = resultado.motivo;
      }

      return this.falha("PROVIDER_INDISPONIVEL", ultimoMotivo);
    } catch (erro) {
      return this.falha("PROVIDER_INDISPONIVEL", this.mensagemTecnica(erro));
    }
  }

  private async carregarPerfilIsptec(
    url: string,
    cookies: string,
    referer: string,
    studentNumber: string
  ): Promise<ResultadoPortal> {
    let pagina = await this.seguirRedirectsIsptec(url, cookies, referer);
    if (pagina.status >= 400 || this.temFalhaAutenticacaoIsptec(pagina.html)) {
      return this.falha("PROVIDER_INDISPONIVEL", `ISPTEC follow ${pagina.status}`);
    }

    const selecaoGrupo = this.resolverGrupoEstudanteIsptec(pagina.html, pagina.url);
    if (selecaoGrupo) {
      const grupo = await this.fetchPagina(selecaoGrupo.url, {
        method: "POST",
        headers: this.headersHtml({
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: pagina.cookies,
          Referer: pagina.url
        }),
        body: selecaoGrupo.body.toString()
      }, pagina.cookies);
      pagina = grupo.location
        ? await this.seguirRedirectsIsptec(
          new URL(grupo.location, selecaoGrupo.url).toString(),
          grupo.cookies,
          selecaoGrupo.url
        )
        : grupo;
    }

    const paginaPortal = pagina;
    let htmlPerfil = pagina.html;
    let cookiesActuais = pagina.cookies;
    const urlPerfil = this.resolverUrlMenuIsptec(pagina.html, pagina.url, ["pessoas_cadastro", "dados_pessoa"]);
    if (urlPerfil) {
      const perfil = await this.seguirRedirectsIsptec(urlPerfil, pagina.cookies, pagina.url);
      if (perfil.status < 400 && !this.temFalhaAutenticacaoIsptec(perfil.html)) {
        htmlPerfil = perfil.html;
        cookiesActuais = perfil.cookies;
      }
    }

    const urlAcademico = this.resolverUrlMenuIsptec(
      paginaPortal.html,
      paginaPortal.url,
      ["notas_frequencias", "diario_classes"]
    );
    const paginaAcademica = urlAcademico
      ? await this.seguirRedirectsIsptec(urlAcademico, cookiesActuais, paginaPortal.url).catch(() => null)
      : null;
    const contextoAcademico = paginaAcademica && paginaAcademica.status < 400
      ? this.extrairContextoAcademicoIsptec(paginaAcademica.html)
      : {};

    if (
      (this.temMarcadorAutenticadoIsptec(htmlPerfil) ||
        /(?:id|name)=["']nm_pessoa["']/i.test(htmlPerfil) ||
        Object.keys(contextoAcademico).length > 0) &&
      !this.temFormularioLoginIsptec(htmlPerfil)
    ) {
      const perfil = this.extrairPerfilIsptec(htmlPerfil, studentNumber);
      return {
        sucesso: true,
        perfil: {
          ...perfil,
          curso: contextoAcademico.curso ?? perfil.curso,
          turma: contextoAcademico.turma ?? perfil.turma,
          anoAcademico: contextoAcademico.anoAcademico ?? perfil.anoAcademico
        }
      };
    }

    return this.falha("PROVIDER_INDISPONIVEL", `ISPTEC sem perfil em ${pagina.url}`);
  }

  private async seguirRedirectsIsptec(
    url: string,
    cookies: string,
    referer: string,
    maximo = 8
  ): Promise<PaginaPortal> {
    let actualUrl = url;
    let cookiesActuais = cookies;
    let refererActual = referer;
    let pagina: PaginaPortal | null = null;

    for (let indice = 0; indice <= maximo; indice += 1) {
      pagina = await this.fetchPagina(actualUrl, {
        method: "GET",
        headers: this.headersHtml({
          ...(cookiesActuais ? { Cookie: cookiesActuais } : {}),
          Referer: refererActual
        })
      }, cookiesActuais);
      cookiesActuais = pagina.cookies;
      if (!pagina.location || pagina.status < 300 || pagina.status >= 400) {
        return pagina;
      }
      refererActual = actualUrl;
      actualUrl = new URL(pagina.location, actualUrl).toString();
    }

    return pagina ?? { status: 0, url, html: "", cookies, location: "" };
  }

  private async fetchPagina(url: string, init: RequestInit, cookiesAnteriores = ""): Promise<PaginaPortal> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resposta = await fetch(url, {
        ...init,
        redirect: "manual",
        signal: controller.signal
      });
      const html = await this.lerTextoResposta(resposta);
      return {
        status: resposta.status,
        url,
        html,
        cookies: this.mesclarCookies(cookiesAnteriores, this.extrairCookies(resposta)),
        location: resposta.headers.get("location") ?? ""
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private headersHtml(extras: Record<string, string> = {}) {
    return {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
      ...extras
    };
  }

  private async lerTextoResposta(resposta: Response) {
    const contentType = resposta.headers.get("content-type") ?? "";
    const charset =
      contentType.match(/charset=([^;]+)/i)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "utf-8";
    const buffer = await resposta.arrayBuffer();
    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      return new TextDecoder("utf-8").decode(buffer);
    }
  }

  private extrairCookies(resposta: Response) {
    const headers = resposta.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = headers.getSetCookie?.() ?? [];
    if (cookies.length) {
      return cookies.map((cookie) => cookie.split(";")[0]).filter(Boolean).join("; ");
    }

    const combinado = resposta.headers.get("set-cookie") ?? "";
    return combinado
      .split(/,(?=\s*[^;,=\s]+=[^;,]+)/)
      .map((cookie) => cookie.trim().split(";")[0])
      .filter(Boolean)
      .join("; ");
  }

  private mesclarCookies(...cabecalhos: string[]) {
    const cookies = new Map<string, string>();
    for (const parte of cabecalhos.flatMap((cabecalho) => cabecalho.split(";"))) {
      const [nome, ...valor] = parte.trim().split("=");
      if (nome && valor.length) {
        cookies.set(nome, valor.join("="));
      }
    }
    return Array.from(cookies.entries()).map(([nome, valor]) => `${nome}=${valor}`).join("; ");
  }

  private extrairPerfilUor(html: string, credenciais: CredenciaisEstudantis): PerfilAcademicoAutenticado {
    const aluno = html.match(
      /<label[^>]*for=["']aluno["'][^>]*>\s*Aluno:\s*<\/label>\s*<br[^>]*>\s*\[(\d+)\]\s*([^<]+)/i
    );
    const studentNumber =
      aluno?.[1]?.trim() ||
      this.extrairValorInput(html, "numeroAluno") ||
      (credenciais.tipoIdentificador === "studentNumber" ? credenciais.identificador : "");
    const nome = this.normalizarNome(
      aluno?.[2] ||
      this.extrairValorInput(html, "nome") ||
      this.extrairValorInput(html, "nomeRO") ||
      this.extrairTextoId(html, "nomeAluno")
    ) ?? `Estudante ${studentNumber}`;
    const curso = this.lerPrimeiro(
      this.extrairValorInput(html, "curso"),
      this.extrairValorInput(html, "cursoRO"),
      this.extrairTextoId(html, "curso"),
      this.extrairAposLabel(html, "Curso")
    );

    return {
      institutionCode: "UOR",
      studentNumber,
      username: credenciais.tipoIdentificador === "username" ? credenciais.identificador : null,
      nome,
      email: this.lerPrimeiro(this.extrairValorInput(html, "email"), this.extrairTextoId(html, "email")),
      telefone: this.lerPrimeiro(
        this.extrairValorInput(html, "telefonePrincipal"),
        this.extrairValorInput(html, "telemovel"),
        this.extrairTextoId(html, "telefonePrincipal")
      ),
      curso,
      avatarUrl: null,
      dados: {
        provider: "uor",
        origem: "SECRETARIA_DIRETA",
        sincronizadoEm: new Date().toISOString()
      }
    };
  }

  private extrairPerfilIsptec(html: string, studentNumber: string): PerfilAcademicoAutenticado {
    const texto = this.textoVisivel(html);
    const nome = this.normalizarNome(this.lerPrimeiro(
      this.extrairValorInput(html, "nm_pessoa"),
      this.extrairValorInput(html, "nome"),
      this.extrairValorInput(html, "nome_aluno"),
      this.extrairPorLabelTexto(texto, ["Nome completo", "Nome"])
    )) ?? `Estudante ${studentNumber}`;
    const curso = this.limparCampoPerfil(this.lerPrimeiro(
      this.extrairValorInput(html, "ds_curso_origem"),
      this.extrairValorInput(html, "curso"),
      this.extrairPorLabelTexto(texto, ["Curso", "Curso do estudante"]),
      texto.split(/\n+/).find((linha) => this.pareceCurso(linha))
    ));
    const email = this.lerPrimeiro(
      this.extrairValorInput(html, "ds_contato_04"),
      this.extrairValorInput(html, "email"),
      texto.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]
    )?.toLowerCase();
    const telefone = this.lerPrimeiro(
      this.extrairValorInput(html, "ds_contato_03"),
      this.extrairValorInput(html, "telemovel"),
      texto.match(/(?:\+?244[\s.-]*)?9\d{2}[\s.-]*\d{3}[\s.-]*\d{3}/)?.[0]
    );
    const turma = this.lerPrimeiro(
      this.extrairValorInput(html, "ds_turma_origem"),
      this.extrairValorInput(html, "turma"),
      this.extrairPorLabelTexto(texto, ["Turma"])
    );
    const anoSemestre = this.lerPrimeiro(
      this.extrairValorInput(html, "nr_anosemestre_origem"),
      this.extrairPorLabelTexto(texto, ["Ano letivo", "Ano lectivo"])
    );

    return {
      institutionCode: "ISPTEC",
      studentNumber,
      nome,
      email,
      telefone,
      curso,
      turma,
      anoAcademico: anoSemestre?.match(/\b(20\d{2})/)?.[1] ?? null,
      avatarUrl: null,
      dados: {
        provider: "isptec",
        origem: "ISPTEC_DIRETO",
        sincronizadoEm: new Date().toISOString()
      }
    };
  }

  private extrairContextoAcademicoIsptec(html: string) {
    const texto = this.textoVisivel(html);
    const actual = texto.match(/(\d{4})\/([12])\s*-\s*Curso\s+de\s+(.+?)\s*-\s*([A-Z0-9_]+)\b/i);
    if (actual) {
      return {
        anoAcademico: `${actual[1]}/${actual[2]}`,
        curso: this.limparCampoPerfil(actual[3]),
        turma: actual[4].trim()
      };
    }
    const historico = texto.match(/Hist[oó]rico\s*-\s*(.+?)\((\d{4})\/([12])\)/i);
    return historico
      ? { curso: this.limparCampoPerfil(historico[1]), anoAcademico: `${historico[2]}/${historico[3]}` }
      : {};
  }

  private resolverGrupoEstudanteIsptec(html: string, urlActual: string) {
    if (!/name=["']cd_grupo["']/i.test(html) || !/define_grupo/i.test(html)) {
      return null;
    }

    const formulario = html.match(/<form[\s\S]*?<\/form>/i)?.[0] ?? html;
    const opcoes = Array.from(
      formulario.matchAll(/<option\b[^>]*value=["']?([^"'>\s]*)["']?[^>]*>([\s\S]*?)<\/option>/gi)
    ).map((match) => ({
      valor: this.limparTexto(match[1]),
      texto: this.textoVisivel(match[2])
    })).filter((opcao) => opcao.valor);
    const estudante = opcoes.find((opcao) => this.semAcentos(opcao.texto).toLowerCase().includes("estudante")) ?? opcoes[0];
    if (!estudante?.valor) {
      return null;
    }

    const body = new URLSearchParams();
    for (const match of formulario.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)) {
      const atributos = this.lerAtributos(match[0]);
      const nome = atributos.get("name");
      if (!nome || (atributos.get("type")?.toLowerCase() === "submit" && nome !== "btn-entrar")) {
        continue;
      }
      body.set(nome, atributos.get("value") ?? "");
    }
    body.set("acao", body.get("acao") || "define_grupo");
    body.set("cd_grupo", estudante.valor);
    body.set("btn-entrar", body.get("btn-entrar") || "Entrar");

    return { url: this.lerFormAction(formulario, urlActual), body };
  }

  private resolverUrlMenuIsptec(html: string, urlActual: string, marcadores: string[]) {
    const caminho = Array.from(html.matchAll(/goUrl\('([^']+)'\)/g))
      .map((match) => match[1])
      .find((valor) => marcadores.some((marcador) => valor.includes(marcador)));
    return caminho ? new URL(caminho, urlActual).toString() : null;
  }

  private lerFormAction(html: string, urlActual: string) {
    const action = html.match(/<form[^>]*action=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
    return action ? new URL(action, urlActual).toString() : urlActual;
  }

  private lerAtributos(tag: string) {
    const atributos = new Map<string, string>();
    for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
      atributos.set(match[1].toLowerCase(), this.decodeHtml(match[3]));
    }
    return atributos;
  }

  private extrairValorInput(html: string, idOuNome: string) {
    const alvo = idOuNome.toLowerCase();
    for (const match of html.matchAll(/<(?:input|select|textarea)\b[^>]*>/gi)) {
      const atributos = this.lerAtributos(match[0]);
      if (atributos.get("id")?.toLowerCase() === alvo || atributos.get("name")?.toLowerCase() === alvo) {
        return this.limparTexto(atributos.get("value"));
      }
    }
    return null;
  }

  private extrairTextoId(html: string, id: string) {
    const regex = new RegExp(`<[^>]*id=["']${id}["'][^>]*>([^<]*)<`, "i");
    return this.limparTexto(regex.exec(html)?.[1]);
  }

  private extrairAposLabel(html: string, label: string) {
    const regex = new RegExp(`${label}\\s*:<\\/label>\\s*<br[^>]*>\\s*([^<]+)`, "i");
    return this.limparTexto(regex.exec(html)?.[1]);
  }

  private extrairPorLabelTexto(texto: string, labels: string[]) {
    for (const label of labels) {
      const escapado = this.semAcentos(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const normalizado = this.semAcentos(texto);
      const match = new RegExp(`${escapado}\\s*:?\\s+([^\\n]{2,160})`, "i").exec(normalizado);
      if (!match?.[1]) continue;
      const inicio = match.index + match[0].length - match[1].length;
      const valor = this.limparTexto(texto.slice(inicio, inicio + match[1].length));
      if (valor) return valor;
    }
    return null;
  }

  private textoVisivel(html: string) {
    return this.decodeHtml(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<\s*br\s*\/?>/gi, "\n")
        .replace(/<\/(?:p|div|li|tr|td|th|section|h[1-6]|label)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    ).split(/\n+/).map((linha) => linha.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  }

  private decodeHtml(valor: string) {
    return valor
      .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
      .replace(/&#x([0-9a-f]+);/gi, (_, codigo) => String.fromCodePoint(Number.parseInt(codigo, 16)))
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#0?39;|&apos;/gi, "'")
      .replace(/&ccedil;/gi, "ç")
      .replace(/&atilde;/gi, "ã")
      .replace(/&aacute;/gi, "á")
      .replace(/&eacute;/gi, "é")
      .replace(/&iacute;/gi, "í")
      .replace(/&oacute;/gi, "ó")
      .replace(/&uacute;/gi, "ú");
  }

  private temFalhaAutenticacaoUor(html: string) {
    const texto = this.semAcentos(html).toLowerCase();
    return [
      "notauthenticated",
      "acesso negado",
      "nao tem acesso",
      "credenciais invalidas",
      "utilizador inexistente",
      "authentication failed"
    ].some((marcador) => texto.includes(marcador));
  }

  private temFormularioLoginUor(html: string) {
    return /<form[^>]*name=["']login["']/i.test(html);
  }

  private temMarcadorPerfilUor(html: string) {
    const texto = this.semAcentos(html).toLowerCase();
    return texto.includes("boletimmatricula") ||
      texto.includes("boletim de matricula") ||
      /id=["'](?:nome|nomeRO|curso|cursoRO|telefonePrincipal|telemovel)["']/i.test(html) ||
      /for=["']aluno["']/i.test(html);
  }

  private temFormularioLoginIsptec(html: string) {
    return /name=["']codigo["']/i.test(html) && /name=["']senha["']/i.test(html);
  }

  private temFalhaAutenticacaoIsptec(html: string) {
    const texto = this.semAcentos(html).toLowerCase();
    return texto.includes("credenciais invalidas") ||
      texto.includes("usuario ou senha") ||
      texto.includes("utilizador ou senha") ||
      texto.includes("senha invalida") ||
      texto.includes("acesso negado") ||
      (texto.includes("efetuar_login") && this.temFormularioLoginIsptec(html));
  }

  private temMarcadorAutenticadoIsptec(html: string) {
    const texto = this.semAcentos(html).toLowerCase();
    return ["portal_online", "dados pessoais", "boletim", "matricula", "grupo_selecionar"]
      .some((marcador) => texto.includes(marcador));
  }

  private pareceCurso(valor: string) {
    const texto = this.semAcentos(valor).toLowerCase();
    return /\b(engenharia|arquitectura|arquitetura|gestao|informatica|comunicacoes|electrotecnica|ciencias)\b/
      .test(texto) && !texto.includes("turma");
  }

  private limparCampoPerfil(valor?: string | null) {
    const limpo = this.limparTexto(valor);
    if (!limpo || limpo.length > 180) return null;
    const texto = this.semAcentos(limpo).toLowerCase();
    if (["dados complementares", "senha para acesso", "senha atual", "nova senha"].some((ruido) => texto.includes(ruido))) {
      return null;
    }
    return limpo.replace(/^curso\s+de\s+/i, "").trim();
  }

  private normalizarNome(valor?: string | null) {
    const limpo = this.limparTexto(valor)?.replace(/^\[\d+\]\s*/, "");
    if (!limpo) return null;
    const partes = limpo.split(" ").filter(Boolean);
    return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : limpo;
  }

  private limparTexto(valor?: string | null) {
    const texto = valor ? this.decodeHtml(valor).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
    return texto && !["-", "null", "undefined"].includes(this.semAcentos(texto).toLowerCase()) ? texto : null;
  }

  private lerPrimeiro(...valores: Array<string | null | undefined>) {
    return valores.map((valor) => this.limparTexto(valor)).find((valor): valor is string => Boolean(valor)) ?? null;
  }

  private semAcentos(valor: string) {
    return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  private falha(tipo: TipoFalhaAcademica, motivo: string): ResultadoPortal {
    return { sucesso: false, tipo, motivo };
  }

  private mensagemPublica(tipo: TipoFalhaAcademica, provider: CredenciaisEstudantis["provider"]) {
    const instituicao = provider === "isptec" ? "ISPTEC" : "UOR";
    if (tipo === "CREDENCIAIS_INVALIDAS") {
      return "Número de estudante, utilizador ou palavra-passe inválidos.";
    }
    if (tipo === "PERFIL_INCOMPLETO") {
      return `A ${instituicao} validou a sessão, mas não devolveu o número oficial do estudante. Tente entrar com o número de estudante.`;
    }
    return `O portal académico ${instituicao} está temporariamente indisponível. Tente novamente dentro de instantes.`;
  }

  private mensagemTecnica(erro: unknown) {
    if (erro instanceof Error && erro.name === "AbortError") {
      return `timeout após ${this.timeoutMs}ms`;
    }
    return erro instanceof Error ? erro.message : "falha de rede";
  }
}
