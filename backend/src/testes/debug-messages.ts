import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const mensagens = await prisma.mensagemAtendimento.findMany({
    where: {
      status: 'FAILED'
    },
    orderBy: {
      atualizadoEm: 'desc'
    },
    take: 5
  });

  console.log("=== MENSAGENS FALHADAS ===");
  console.log(JSON.stringify(mensagens, null, 2));

  const ultimas = await prisma.mensagemAtendimento.findMany({
    orderBy: {
      atualizadoEm: 'desc'
    },
    take: 5
  });

  console.log("\n=== ULTIMAS MENSAGENS ===");
  console.log(JSON.stringify(ultimas, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
