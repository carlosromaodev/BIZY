import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarAplicacao } from "../infra/http/criarAplicacao.js";

const ambienteOriginal = { ...process.env };

describe("Cliente 360 com captura social completa", () => {
  beforeEach(() => {
    process.env = {
      ...ambienteOriginal,
      MODO_ARMAZENAMENTO: "memoria",
      N8N_EVENTOS_ATIVOS: "false",
      N8N_ASSUME_WHATSAPP: "true",
      INICIAR_AGENDADOR_EXPIRACAO: "false",
      RESTAURAR_LIVES_ATIVAS: "false",
      N8N_BACKEND_TOKEN: "",
      EVOLUTION_WEBHOOK_TOKEN: "",
      OMBALA_API_TOKEN: ""
    };
  });

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  it("guarda perfil TikTok bruto e normalizado no cliente quando comentário vira compra", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "360",
          nome: "Artigo Cliente 360",
          descricao: "Produto usado para captura social completa",
          precoEmKwanza: 12000,
          quantidade: 2,
          fotos: []
        }
      });

      const perfilUsuario = {
        provider: "tiktok-live-connector",
        identidade: {
          userId: "tt-user-360",
          secUid: "sec-user-360",
          uniqueId: "cliente360",
          nickname: "Cliente 360",
          avatarUrl: "https://cdn.tiktok.test/avatar-360.jpg"
        },
        perfil: {
          bioDescription: "Compra em lives e gosta de novidades.",
          verified: true,
          followerCount: "1200",
          followingCount: "77",
          followStatus: "following"
        },
        relacaoComHost: {
          isFollowerOfAnchor: true,
          isSubscriberOfAnchor: false,
          isModeratorOfAnchor: false,
          isGiftGiverOfAnchor: true
        },
        badges: {
          userBadges: [{ name: "top buyer" }]
        },
        comercio: {
          enableShowCommerceSale: true,
          ecommerceEntrance: { shopEntranceInfo: { storeLabel: "comprador frequente" } }
        },
        rawUser: {
          userId: "tt-user-360",
          secUid: "sec-user-360",
          uniqueId: "cliente360",
          bioDescription: "Compra em lives e gosta de novidades."
        }
      };

      const eventoBruto = {
        comment: "quero 923456789 peça 360",
        user: perfilUsuario.rawUser,
        userIdentity: perfilUsuario.relacaoComHost
      };

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_cliente_360",
          provider: "tiktok-live-connector",
          username: "cliente360",
          userId: "tt-user-360",
          displayName: "Cliente 360",
          avatarUrl: "https://cdn.tiktok.test/avatar-360.jpg",
          commentText: "quero 923456789 peça 360",
          perfilUsuario,
          eventoBruto
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().registro.comentario.perfilUsuario).toEqual(
        expect.objectContaining({
          identidade: expect.objectContaining({ secUid: "sec-user-360" }),
          rawUser: expect.objectContaining({ bioDescription: "Compra em lives e gosta de novidades." })
        })
      );

      const clientes = await app.inject({ method: "GET", url: "/clientes", headers });
      expect(clientes.statusCode).toBe(200);
      const cliente = clientes.json().clientes.find((item: { telefone: string | null }) => item.telefone === "923456789");

      expect(cliente).toEqual(
        expect.objectContaining({
          username: "cliente360",
          userId: "tt-user-360",
          perfil360: expect.objectContaining({
            tiktok: expect.objectContaining({
              rawUser: expect.objectContaining({ secUid: "sec-user-360" }),
              perfil: expect.objectContaining({ followerCount: "1200" })
            })
          }),
          identidadesDigitais: expect.objectContaining({
            tiktok: expect.objectContaining({
              provider: "tiktok-live-connector",
              userId: "tt-user-360",
              secUid: "sec-user-360",
              username: "cliente360"
            })
          }),
          sinaisRelacionamento: expect.objectContaining({
            tiktok: expect.objectContaining({
              isFollowerOfAnchor: true,
              isGiftGiverOfAnchor: true
            })
          }),
          dadosCaptura: expect.objectContaining({
            tiktok: expect.objectContaining({
              ultimoEvento: expect.objectContaining({
                rawEvent: expect.objectContaining({ comment: "quero 923456789 peça 360" })
              })
            })
          })
        })
      );

      const perfilIncremental = {
        provider: "tiktok-live-connector",
        identidade: {
          userId: "tt-user-360",
          uniqueId: "cliente360",
          nickname: "Cliente 360 Atualizado",
          avatarUrl: "https://cdn.tiktok.test/avatar-360-novo.jpg"
        },
        perfil: {
          followingCount: "82",
          heartCount: "540"
        },
        relacaoComHost: {
          isSubscriberOfAnchor: true
        },
        badges: {
          userBadges: [{ name: "early access" }]
        },
        rawUser: {
          uniqueId: "cliente360",
          signature: "Agora também compra kits completos."
        }
      };

      const comentarioIncremental = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_cliente_360_retorno",
          provider: "tiktok-live-connector",
          username: "cliente360",
          userId: "tt-user-360",
          displayName: "Cliente 360 Atualizado",
          avatarUrl: "https://cdn.tiktok.test/avatar-360-novo.jpg",
          commentText: "quero 923456789 peça 360",
          perfilUsuario: perfilIncremental,
          eventoBruto: {
            comment: "quero 923456789 peça 360",
            user: perfilIncremental.rawUser
          }
        }
      });
      expect(comentarioIncremental.statusCode).toBe(201);

      const clientesAtualizados = await app.inject({ method: "GET", url: "/clientes", headers });
      expect(clientesAtualizados.statusCode).toBe(200);
      expect(clientesAtualizados.json().clientes.filter((item: { telefone: string | null }) => item.telefone === "923456789")).toHaveLength(1);
      const clienteAtualizado = clientesAtualizados
        .json()
        .clientes.find((item: { telefone: string | null }) => item.telefone === "923456789");

      expect(clienteAtualizado).toEqual(
        expect.objectContaining({
          nome: "Cliente 360 Atualizado",
          avatarUrl: "https://cdn.tiktok.test/avatar-360-novo.jpg",
          perfil360: expect.objectContaining({
            tiktok: expect.objectContaining({
              rawUser: expect.objectContaining({
                secUid: "sec-user-360",
                signature: "Agora também compra kits completos."
              }),
              perfil: expect.objectContaining({
                followerCount: "1200",
                followingCount: "82",
                heartCount: "540"
              }),
              badges: expect.objectContaining({
                userBadges: expect.arrayContaining([
                  expect.objectContaining({ name: "top buyer" }),
                  expect.objectContaining({ name: "early access" })
                ])
              })
            })
          }),
          identidadesDigitais: expect.objectContaining({
            tiktok: expect.objectContaining({
              secUid: "sec-user-360",
              avatarUrl: "https://cdn.tiktok.test/avatar-360-novo.jpg"
            })
          }),
          sinaisRelacionamento: expect.objectContaining({
            tiktok: expect.objectContaining({
              isFollowerOfAnchor: true,
              isGiftGiverOfAnchor: true,
              isSubscriberOfAnchor: true
            })
          })
        })
      );
    } finally {
      await app.close();
    }
  });

  it("filtra dados brutos úteis e promove foto de perfil para comentário, cliente e reserva", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "RAW360",
          nome: "Artigo com perfil bruto",
          descricao: "Produto usado para validar extração útil do perfil bruto",
          precoEmKwanza: 15000,
          quantidade: 1,
          fotos: []
        }
      });

      const perfilUsuario = {
        provider: "tiktok-live-connector",
        identidade: {
          userId: "tt-user-raw-360",
          secUid: "sec-user-raw-360",
          uniqueId: "cliente_raw360",
          nickname: "Cliente Raw 360",
          avatarThumb: {
            urlList: ["https://cdn.tiktok.test/avatar-raw-thumb.jpg"]
          }
        },
        perfil: {
          followerCount: "321",
          followingCount: "45"
        },
        rawUser: {
          userId: "tt-user-raw-360",
          uniqueId: "cliente_raw360",
          nickname: "Cliente Raw 360",
          avatarMedium: {
            urlList: ["https://cdn.tiktok.test/avatar-raw-medium.jpg"]
          }
        }
      };

      const eventoBruto = {
        comment: "quero 923456780 peça RAW360",
        user: {
          userId: "tt-user-raw-360",
          uniqueId: "cliente_raw360",
          nickname: "Cliente Raw 360",
          avatarLarger: {
            urlList: ["https://cdn.tiktok.test/avatar-raw-large.jpg"]
          }
        }
      };

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_cliente_raw_360",
          provider: "tiktok-live-connector",
          username: "fallback_raw",
          userId: null,
          displayName: "",
          avatarUrl: null,
          commentText: "quero 923456780 peça RAW360",
          perfilUsuario,
          eventoBruto
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().registro.comentario).toEqual(
        expect.objectContaining({
          userId: "tt-user-raw-360",
          displayName: "Cliente Raw 360",
          avatarUrl: "https://cdn.tiktok.test/avatar-raw-thumb.jpg",
          perfilUsuario: expect.objectContaining({
            identidade: expect.objectContaining({
              avatarUrl: "https://cdn.tiktok.test/avatar-raw-thumb.jpg"
            })
          })
        })
      );

      const clientes = await app.inject({ method: "GET", url: "/clientes", headers });
      expect(clientes.statusCode).toBe(200);
      const cliente = clientes.json().clientes.find((item: { telefone: string | null }) => item.telefone === "923456780");

      expect(cliente).toEqual(
        expect.objectContaining({
          nome: "Cliente Raw 360",
          username: "cliente_raw360",
          userId: "tt-user-raw-360",
          avatarUrl: "https://cdn.tiktok.test/avatar-raw-thumb.jpg",
          perfil360: expect.objectContaining({
            tiktok: expect.objectContaining({
              identidade: expect.objectContaining({
                secUid: "sec-user-raw-360",
                avatarUrl: "https://cdn.tiktok.test/avatar-raw-thumb.jpg"
              }),
              rawUser: expect.objectContaining({
                avatarMedium: expect.objectContaining({
                  urlList: ["https://cdn.tiktok.test/avatar-raw-medium.jpg"]
                })
              }),
              perfil: expect.objectContaining({
                followerCount: "321"
              })
            })
          }),
          identidadesDigitais: expect.objectContaining({
            tiktok: expect.objectContaining({
              userId: "tt-user-raw-360",
              uniqueId: "cliente_raw360",
              displayName: "Cliente Raw 360",
              avatarUrl: "https://cdn.tiktok.test/avatar-raw-thumb.jpg"
            })
          })
        })
      );

      const reservas = await app.inject({ method: "GET", url: "/reservas", headers });
      expect(reservas.statusCode).toBe(200);
      expect(reservas.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefoneCliente: "923456780",
            nomeCliente: "Cliente Raw 360",
            userIdCliente: "tt-user-raw-360",
            avatarUrlCliente: "https://cdn.tiktok.test/avatar-raw-thumb.jpg"
          })
        ])
      );
    } finally {
      await app.close();
    }
  });

  it("promove dados úteis do payload TikTok aninhado e usa foto_perfil como avatar", async () => {
    const app = await criarAplicacao();

    try {
      const headers = await autenticar(app);

      await app.inject({
        method: "POST",
        url: "/pecas",
        headers,
        payload: {
          codigo: "02",
          nome: "Artigo TikTok 02",
          descricao: "Produto usado para validar payload real do TikTok",
          precoEmKwanza: 9000,
          quantidade: 1,
          fotos: []
        }
      });

      const eventoBruto = {
        tiktok: {
          evento: {
            ultimo_evento: "Perfil Usuario",
            provider: "tiktok-live-connector",
            source: "tiktok"
          },
          identidade: {
            user_id: "6785978432745473029",
            sec_uid: "MS4wLjABAAAAu_YVYyErvCBIg8AKiRskrK9C7TZ_EtfTU99SAY1B-VFVfE5PAJG6BhkO06Yo_i0S",
            unique_id: "carlosromaodev"
          },
          mensagem: {
            metodo: "WebcastChatMessage",
            msg_id: "7648391076436609812",
            room_id: "7648315899937852178",
            comentario: "937624785 02",
            texto: "937624785 02"
          },
          usuario: {
            user_id: "6785978432745473029",
            nickname: "carlosromaodev",
            foto_perfil: {
              urls: [
                "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg",
                "https://p19-common-sign.tiktokcdn.com/avatar-secundario.jpeg"
              ],
              m_uri: "100x100/tos-maliva-avt-0068/97cda04e2a421acdb34615b1bc48ca9c",
              height: 0
            }
          }
        }
      };

      const comentario = await app.inject({
        method: "POST",
        url: "/comentarios/manual",
        headers,
        payload: {
          liveId: "live_payload_tiktok_real",
          provider: "tiktok-live-connector",
          username: "fallback_tiktok_real",
          userId: null,
          displayName: "",
          avatarUrl: null,
          commentText: "937624785 02",
          perfilUsuario: {},
          eventoBruto
        }
      });

      expect(comentario.statusCode).toBe(201);
      expect(comentario.json().registro.comentario).toEqual(
        expect.objectContaining({
          username: "carlosromaodev",
          userId: "6785978432745473029",
          displayName: "carlosromaodev",
          avatarUrl: "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg",
          perfilUsuario: expect.objectContaining({
            identidade: expect.objectContaining({
              userId: "6785978432745473029",
              secUid: "MS4wLjABAAAAu_YVYyErvCBIg8AKiRskrK9C7TZ_EtfTU99SAY1B-VFVfE5PAJG6BhkO06Yo_i0S",
              uniqueId: "carlosromaodev",
              avatarUrl: "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg"
            })
          })
        })
      );

      const clientes = await app.inject({ method: "GET", url: "/clientes", headers });
      expect(clientes.statusCode).toBe(200);
      const cliente = clientes.json().clientes.find((item: { telefone: string | null }) => item.telefone === "937624785");

      expect(cliente).toEqual(
        expect.objectContaining({
          nome: "carlosromaodev",
          username: "carlosromaodev",
          userId: "6785978432745473029",
          avatarUrl: "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg",
          identidadesDigitais: expect.objectContaining({
            tiktok: expect.objectContaining({
              userId: "6785978432745473029",
              secUid: "MS4wLjABAAAAu_YVYyErvCBIg8AKiRskrK9C7TZ_EtfTU99SAY1B-VFVfE5PAJG6BhkO06Yo_i0S",
              uniqueId: "carlosromaodev",
              displayName: "carlosromaodev",
              avatarUrl: "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg"
            })
          }),
          dadosCaptura: expect.objectContaining({
            tiktok: expect.objectContaining({
              ultimoEvento: expect.objectContaining({
                rawEvent: expect.objectContaining({
                  tiktok: expect.objectContaining({
                    usuario: expect.objectContaining({
                      foto_perfil: expect.objectContaining({
                        urls: expect.arrayContaining(["https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg"])
                      })
                    })
                  })
                })
              })
            })
          })
        })
      );

      const reservas = await app.inject({ method: "GET", url: "/reservas", headers });
      expect(reservas.statusCode).toBe(200);
      expect(reservas.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            telefoneCliente: "937624785",
            nomeCliente: "carlosromaodev",
            userIdCliente: "6785978432745473029",
            avatarUrlCliente: "https://p16-common-sign.tiktokcdn.com/avatar-principal.jpeg"
          })
        ])
      );
    } finally {
      await app.close();
    }
  });
});

async function autenticar(app: Awaited<ReturnType<typeof criarAplicacao>>) {
  const respostaCodigo = await app.inject({
    method: "POST",
    url: "/auth/telefone/solicitar-codigo",
    payload: { telefone: "923000360", nome: "Gestor 360" }
  });

  const respostaSessao = await app.inject({
    method: "POST",
    url: "/auth/telefone/confirmar-codigo",
    payload: { telefone: "923000360", codigo: respostaCodigo.json().codigoDev }
  });

  return { authorization: `Bearer ${respostaSessao.json().token}` };
}
