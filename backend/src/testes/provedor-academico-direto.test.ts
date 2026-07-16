import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvedorAcademicoDireto } from "../infra/provedores/ProvedorAcademicoDireto.js";
import type { ProvedorAutenticacaoEstudantil } from "../use-case/AutenticacaoEstudantilUseCase.js";

const credenciaisUor = {
  provider: "uor" as const,
  identificador: "20243454",
  tipoIdentificador: "studentNumber" as const,
  palavraPasse: "segredo-academico"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ProvedorAcademicoDireto", () => {
  it("autentica na Secretaria UOR, preserva cookies e extrai o perfil oficial", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("<html>login</html>", {
        status: 200,
        headers: { "set-cookie": "JSESSIONID=inicial; Path=/" }
      }))
      .mockResolvedValueOnce(new Response("", {
        status: 302,
        headers: {
          location: "/netpa/page?stage=BoletimMatricula",
          "set-cookie": "ClientRemoteAddress=127.0.0.1; Path=/"
        }
      }))
      .mockResolvedValueOnce(new Response(`
        <html>
          <div id="BoletimMatricula">
            <label for="aluno">Aluno:</label><br>[20243454] Carlos Romão
            <input id="email" value="carlos@uor.example">
            <input id="curso" value="Engenharia Informática">
            <input id="telefonePrincipal" value="923000111">
          </div>
        </html>
      `, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provedor = new ProvedorAcademicoDireto({ timeoutMs: 2_000 });
    const resultado = await provedor.autenticar(credenciaisUor);

    expect(resultado).toEqual({
      sucesso: true,
      perfil: expect.objectContaining({
        institutionCode: "UOR",
        studentNumber: "20243454",
        nome: "Carlos Romão",
        email: "carlos@uor.example",
        telefone: "923000111",
        curso: "Engenharia Informática"
      })
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const login = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(login[1].headers).toEqual(expect.objectContaining({ Cookie: "JSESSIONID=inicial" }));
    expect(String(login[1].body)).toContain("_user=20243454");
    expect(String(login[1].body)).toContain("_pass=segredo-academico");
    const perfil = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(perfil[1].headers).toEqual(expect.objectContaining({
      Cookie: expect.stringContaining("ClientRemoteAddress=127.0.0.1")
    }));
  });

  it("classifica rejeição explícita como credenciais inválidas", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("<html>login</html>", {
        status: 200,
        headers: { "set-cookie": "JSESSIONID=inicial; Path=/" }
      }))
      .mockResolvedValueOnce(new Response(
        '<form name="login">Credenciais inválidas</form>',
        { status: 200 }
      )));

    const resultado = await new ProvedorAcademicoDireto().autenticar(credenciaisUor);

    expect(resultado).toEqual({
      sucesso: false,
      codigo: "CREDENCIAIS_INVALIDAS",
      erro: "Número de estudante, utilizador ou palavra-passe inválidos."
    });
  });

  it("autentica no portal ISPTEC e mapeia os dados académicos", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(`
        <form action="/projetos/nucleo/uteis/login.php" method="post">
          <input name="codigo">
          <input name="senha">
        </form>
      `, {
        status: 200,
        headers: { "set-cookie": "PHPSESSID=inicial; Path=/" }
      }))
      .mockResolvedValueOnce(new Response("", {
        status: 302,
        headers: {
          location: "https://portal.isptec.co.ao/projetos/portal_online/index.php",
          "set-cookie": "PHPSESSID=autenticado; Path=/"
        }
      }))
      .mockResolvedValueOnce(new Response(`
        <html>
          <a href="/portal_online">portal_online</a>
          <input id="nm_pessoa" value="Epifânio Pedro da Costa Cazo">
          <input id="ds_contato_04" value="20200477@isptec.co.ao">
          <input id="ds_contato_03" value="927234389">
          <input id="ds_curso_origem" value="Engenharia Informática">
          <input id="ds_turma_origem" value="EI3A">
          <input id="nr_anosemestre_origem" value="20252">
        </html>
      `, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await new ProvedorAcademicoDireto().autenticar({
      provider: "isptec",
      identificador: "20200477",
      tipoIdentificador: "studentNumber",
      palavraPasse: "segredo-academico"
    });

    expect(resultado).toEqual({
      sucesso: true,
      perfil: expect.objectContaining({
        institutionCode: "ISPTEC",
        studentNumber: "20200477",
        nome: "Epifânio Cazo",
        email: "20200477@isptec.co.ao",
        telefone: "927234389",
        curso: "Engenharia Informática",
        turma: "EI3A",
        anoAcademico: "2025"
      })
    });
    expect(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body)).toContain("codigo=20200477");
  });

  it("usa o UOR Connect apenas como fallback quando o portal directo não responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const fallback: ProvedorAutenticacaoEstudantil = {
      autenticar: vi.fn(async () => ({
        sucesso: true as const,
        perfil: {
          institutionCode: "UOR",
          studentNumber: "20243454",
          nome: "Perfil do fallback"
        }
      }))
    };

    const resultado = await new ProvedorAcademicoDireto({ fallback }).autenticar(credenciaisUor);

    expect(resultado).toEqual({
      sucesso: true,
      perfil: expect.objectContaining({ nome: "Perfil do fallback" })
    });
    expect(fallback.autenticar).toHaveBeenCalledWith(credenciaisUor);
  });
});
