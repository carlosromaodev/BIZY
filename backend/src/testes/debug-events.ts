import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eventos = await prisma.eventoSistema.findMany({
    where: {
      tipo: {
        in: ['WHATSAPP_MESSAGE_STATUS', 'WHATSAPP_MESSAGE_FAILED']
      }
    },
    orderBy: {
      criadoEm: 'desc'
    },
    take: 5
  });

  console.log("=== EVENTOS DE STATUS/ERRO ===");
  console.log(JSON.stringify(eventos, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
