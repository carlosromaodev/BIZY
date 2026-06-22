import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

const ITENS_ONBOARDING_PADRAO = [
  { item: "EXPLORAR_PAINEL", descricao: "Visitar o painel principal" },
  { item: "PRIMEIRA_VENDA", descricao: "Registar o primeiro pedido" },
  { item: "PERFIL_COMPLETO", descricao: "Completar perfil com foto e contacto" },
  { item: "ENVIAR_MENSAGEM", descricao: "Enviar primeira mensagem a um cliente" }
];

const HORAS_EXPIRACAO_CONVITE = 72;

export class GestaoEquipaUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Invitations ────────────────────────────────────────────────────────────

  async criarConvite(
    negocioId: string,
    dados: {
      telefone?: string;
      email?: string;
      nomeConvidado?: string;
      papelSugerido?: string;
      personaId?: string;
      criadoPorId: string;
    }
  ) {
    const expiraEm = new Date(Date.now() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000);
    const token = randomUUID();

    const convite = await this.prisma.conviteEquipa.create({
      data: {
        negocioId,
        token,
        telefone: dados.telefone,
        email: dados.email,
        nomeConvidado: dados.nomeConvidado,
        papelSugerido: dados.papelSugerido ?? "VENDEDOR",
        personaId: dados.personaId,
        criadoPorId: dados.criadoPorId,
        estado: "PENDENTE",
        expiraEm
      }
    });

    await this.registrarActividade(negocioId, {
      autorId: dados.criadoPorId,
      tipo: "CONVITE_CRIADO",
      entidadeTipo: "ConviteEquipa",
      entidadeId: convite.id,
      resumo: `Convite enviado para ${dados.nomeConvidado ?? dados.email ?? dados.telefone ?? "destinatário"}`,
      detalhes: { papelSugerido: dados.papelSugerido ?? "VENDEDOR" }
    });

    return convite;
  }

  async listarConvites(negocioId: string) {
    return this.prisma.conviteEquipa.findMany({
      where: { negocioId },
      orderBy: { criadoEm: "desc" }
    });
  }

  async aceitarConvite(token: string, usuarioId: string) {
    const convite = await this.prisma.conviteEquipa.findUnique({ where: { token } });

    if (!convite) {
      throw new Error("Convite não encontrado.");
    }

    if (convite.estado === "ACEITE") {
      throw new Error("Este convite já foi aceite.");
    }

    if (convite.estado === "EXPIRADO" || convite.expiraEm < new Date()) {
      throw new Error("Este convite expirou.");
    }

    const [conviteAtualizado, membro] = await this.prisma.$transaction(async (tx) => {
      const conviteAceite = await tx.conviteEquipa.update({
        where: { id: convite.id },
        data: {
          estado: "ACEITE",
          aceitePorId: usuarioId,
          aceiteEm: new Date()
        }
      });

      const novoMembro = await tx.membroNegocio.create({
        data: {
          negocioId: convite.negocioId,
          usuarioId,
          papel: convite.papelSugerido ?? "VENDEDOR",
          status: "ATIVO",
          permissoesJson: "{}"
        }
      });

      await tx.checklistOnboarding.createMany({
        data: ITENS_ONBOARDING_PADRAO.map(({ item, descricao }) => ({
          negocioId: convite.negocioId,
          membroId: novoMembro.id,
          item,
          descricao,
          concluido: false
        }))
      });

      return [conviteAceite, novoMembro];
    });

    await this.registrarActividade(convite.negocioId, {
      autorId: usuarioId,
      tipo: "CONVITE_ACEITE",
      entidadeTipo: "MembroNegocio",
      entidadeId: membro.id,
      resumo: "Novo membro juntou-se à equipa",
      detalhes: { conviteId: convite.id }
    });

    return { convite: conviteAtualizado, membro };
  }

  async reenviarConvite(id: string, negocioId: string) {
    const expiraEm = new Date(Date.now() + HORAS_EXPIRACAO_CONVITE * 60 * 60 * 1000);
    const token = randomUUID();

    return this.prisma.conviteEquipa.update({
      where: { id, negocioId },
      data: {
        token,
        expiraEm,
        reenviadoEm: new Date(),
        estado: "REENVIO"
      }
    });
  }

  async revogarConvite(id: string, negocioId: string) {
    return this.prisma.conviteEquipa.update({
      where: { id, negocioId },
      data: { estado: "EXPIRADO" }
    });
  }

  // ── Internal Notes ─────────────────────────────────────────────────────────

  async criarNota(
    negocioId: string,
    dados: {
      autorId: string;
      entidadeTipo: string;
      entidadeId: string;
      conteudo: string;
      mencoes?: string[];
    }
  ) {
    const nota = await this.prisma.notaInterna.create({
      data: {
        negocioId,
        autorId: dados.autorId,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        conteudo: dados.conteudo,
        mencoesJson: JSON.stringify(dados.mencoes ?? [])
      }
    });

    await this.registrarActividade(negocioId, {
      autorId: dados.autorId,
      tipo: "NOTA_CRIADA",
      entidadeTipo: dados.entidadeTipo,
      entidadeId: dados.entidadeId,
      resumo: "Nova nota interna adicionada",
      detalhes: { notaId: nota.id }
    });

    return nota;
  }

  async listarNotas(negocioId: string, entidadeTipo: string, entidadeId: string) {
    return this.prisma.notaInterna.findMany({
      where: { negocioId, entidadeTipo, entidadeId },
      orderBy: { criadoEm: "desc" }
    });
  }

  // ── Activity Feed ──────────────────────────────────────────────────────────

  async listarFeed(
    negocioId: string,
    filtros?: { tipo?: string; limite?: number }
  ) {
    return this.prisma.feedActividade.findMany({
      where: {
        negocioId,
        ...(filtros?.tipo ? { tipo: filtros.tipo } : {})
      },
      orderBy: { criadoEm: "desc" },
      take: filtros?.limite ?? 50
    });
  }

  // ── Personas ───────────────────────────────────────────────────────────────

  async listarPersonas(negocioId: string) {
    return this.prisma.personaPapel.findMany({
      where: {
        ativo: true,
        OR: [{ negocioId }, { negocioId: null }]
      },
      orderBy: { nome: "asc" }
    });
  }

  async criarPersona(
    negocioId: string,
    dados: {
      nome: string;
      descricao?: string;
      papelBase: string;
      permissoes?: Record<string, unknown>;
    }
  ) {
    return this.prisma.personaPapel.create({
      data: {
        negocioId,
        nome: dados.nome,
        descricao: dados.descricao,
        papelBase: dados.papelBase,
        permissoesJson: JSON.stringify(dados.permissoes ?? {}),
        ativo: true
      }
    });
  }

  // ── Onboarding Checklist ───────────────────────────────────────────────────

  async listarChecklistOnboarding(membroId: string) {
    return this.prisma.checklistOnboarding.findMany({
      where: { membroId },
      orderBy: { criadoEm: "asc" }
    });
  }

  async marcarItemOnboarding(membroId: string, item: string) {
    return this.prisma.checklistOnboarding.updateMany({
      where: { membroId, item, concluido: false },
      data: {
        concluido: true,
        concluidoEm: new Date()
      }
    });
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async listarMembros(negocioId: string) {
    return this.prisma.membroNegocio.findMany({
      where: { negocioId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true,
            avatarUrl: true,
            papel: true
          }
        }
      },
      orderBy: { criadoEm: "asc" }
    });
  }

  async desativarMembro(membroNegocioId: string, negocioId: string) {
    const membro = await this.prisma.membroNegocio.findUnique({
      where: { id: membroNegocioId }
    });

    if (!membro || membro.negocioId !== negocioId) {
      throw new Error("Membro não encontrado neste negócio.");
    }

    if (membro.papel === "DONO") {
      const totalDonos = await this.prisma.membroNegocio.count({
        where: { negocioId, papel: "DONO", status: "ATIVO" }
      });

      if (totalDonos <= 1) {
        throw new Error(
          "RN-T010: Não é possível desativar o último dono do negócio."
        );
      }
    }

    const membroAtualizado = await this.prisma.membroNegocio.update({
      where: { id: membroNegocioId },
      data: { status: "SUSPENSO" }
    });

    await this.registrarActividade(negocioId, {
      tipo: "MEMBRO_DESATIVADO",
      entidadeTipo: "MembroNegocio",
      entidadeId: membroNegocioId,
      resumo: "Membro da equipa foi suspenso",
      detalhes: { papel: membro.papel }
    });

    return membroAtualizado;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private async registrarActividade(
    negocioId: string,
    dados: {
      autorId?: string;
      tipo: string;
      entidadeTipo?: string;
      entidadeId?: string;
      resumo: string;
      detalhes?: Record<string, unknown>;
    }
  ) {
    return this.prisma.feedActividade.create({
      data: {
        negocioId,
        autorId: dados.autorId,
        tipo: dados.tipo,
        entidadeTipo: dados.entidadeTipo,
        entidadeId: dados.entidadeId,
        resumo: dados.resumo,
        detalhesJson: JSON.stringify(dados.detalhes ?? {})
      }
    });
  }
}
