import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categorias = [
  'Moda Feminina',
  'Moda Masculina',
  'Calçados',
  'Acessórios',
  'Electrónica',
  'Beleza & Cosmética',
  'Casa & Decoração',
  'Desporto',
  'Infantil',
  'Jóias & Bijuteria',
];

const produtosPorCategoria: Record<string, { nomes: string[]; descricoes: string[] }> = {
  'Moda Feminina': {
    nomes: [
      'Vestido Ankara Premium',
      'Blusa de Seda Luanda',
      'Saia Midi Elegante',
      'Conjunto Capulana Moderna',
      'Top Cropped Verão',
    ],
    descricoes: [
      'Vestido feito com tecido Ankara autêntico, corte moderno e elegante. Perfeito para eventos e ocasiões especiais.',
      'Blusa de seda leve e confortável, ideal para o clima de Luanda. Design sofisticado com detalhes únicos.',
      'Saia midi com caimento perfeito, tecido de alta qualidade. Versátil para o dia a dia e eventos.',
      'Conjunto inspirado na capulana tradicional com toque contemporâneo. Peça exclusiva feita à mão.',
      'Top cropped leve e estiloso, perfeito para os dias quentes. Combina com tudo no teu guarda-roupa.',
    ],
  },
  'Moda Masculina': {
    nomes: [
      'Camisa Linho Premium',
      'Polo Clássica Bizy',
      'Calça Chino Slim',
      'Blazer Casual Moderno',
      'T-Shirt Estampada África',
    ],
    descricoes: [
      'Camisa de linho puro, respirável e elegante. Corte slim fit para um visual sofisticado.',
      'Polo clássica em algodão pima, conforto premium para o dia a dia. Bordado discreto.',
      'Calça chino com corte slim moderno, tecido stretch para máximo conforto. Versatilidade total.',
      'Blazer casual em tecido leve, ideal para o clima angolano. Estilo europeu adaptado ao trópico.',
      'T-shirt com estampa artística inspirada na cultura africana. 100% algodão orgânico.',
    ],
  },
  'Calçados': {
    nomes: [
      'Sneaker Urban Luanda',
      'Sandália Artesanal',
      'Sapato Social Premium',
      'Chinelo Conforto Plus',
      'Bota Chelsea Moderna',
    ],
    descricoes: [
      'Sneaker urbano com design exclusivo, sola em borracha antiderrapante. Conforto para o dia inteiro.',
      'Sandália feita à mão com materiais naturais. Acabamento artesanal de qualidade superior.',
      'Sapato social em couro genuíno, acabamento impecável. Para quem valoriza elegância.',
      'Chinelo ergonómico com palmilha anatómica, máximo conforto para relaxar em casa.',
      'Bota Chelsea em couro sintético premium, estilo europeu com durabilidade tropical.',
    ],
  },
  'Acessórios': {
    nomes: [
      'Bolsa Tote Capulana',
      'Óculos de Sol Aviador',
      'Cinto Couro Artesanal',
      'Carteira Minimalista',
      'Lenço Estampado Premium',
    ],
    descricoes: [
      'Bolsa tote espaçosa com estampa em capulana autêntica. Interior organizado com bolsos.',
      'Óculos de sol estilo aviador com lentes UV400, armação metálica resistente e leve.',
      'Cinto em couro genuíno com fivela artesanal. Feito à mão por artesãos locais.',
      'Carteira slim em couro, design minimalista com proteção RFID. Cabe no bolso da frente.',
      'Lenço premium em tecido sedoso, estampa exclusiva. Múltiplas formas de usar.',
    ],
  },
  'Electrónica': {
    nomes: [
      'Auriculares Bluetooth Pro',
      'Powerbank Solar 20000mAh',
      'Smartwatch Fitness Plus',
      'Colunas Bluetooth Portátil',
      'Cabo USB-C Reforçado',
    ],
    descricoes: [
      'Auriculares sem fio com cancelamento de ruído activo, 30h de bateria. Som cristalino.',
      'Powerbank com painel solar integrado, 20000mAh. Ideal para quem está sempre em movimento.',
      'Smartwatch com monitor cardíaco, GPS e resistência à água. Acompanha a tua rotina fitness.',
      'Coluna Bluetooth portátil com som 360°, à prova de água IPX7. Bateria de 12 horas.',
      'Cabo USB-C trançado em nylon, 2 metros, carregamento rápido 100W. Resistente e durável.',
    ],
  },
  'Beleza & Cosmética': {
    nomes: [
      'Kit Skincare Africano',
      'Óleo de Coco Virgem',
      'Batom Matte Longa Duração',
      'Creme Hidratante Karité',
      'Perfume Essência Luanda',
    ],
    descricoes: [
      'Kit completo de cuidados para pele com ingredientes naturais africanos. Limpeza, tonificação e hidratação.',
      'Óleo de coco virgem prensado a frio, 100% natural. Multiuso para pele, cabelo e culinária.',
      'Batom matte de longa duração, fórmula hidratante. Cores vibrantes que valorizam todos os tons de pele.',
      'Creme hidratante enriquecido com manteiga de karité pura. Hidratação profunda por 24 horas.',
      'Perfume artesanal com notas de baunilha, sândalo e flor de laranjeira. Fragrância marcante.',
    ],
  },
  'Casa & Decoração': {
    nomes: [
      'Almofada Étnica Decorativa',
      'Vela Aromática Artesanal',
      'Quadro Arte Africana',
      'Cesto Organizador Natural',
      'Toalha de Mesa Capulana',
    ],
    descricoes: [
      'Almofada decorativa com padrão étnico tecido à mão. Enchimento antialérgico, capa removível.',
      'Vela aromática feita com cera de soja e óleos essenciais naturais. Queima limpa por 40 horas.',
      'Quadro com arte africana contemporânea, impressão em canvas premium. Moldura em madeira natural.',
      'Cesto organizador feito com fibras naturais, trançado à mão. Decorativo e funcional.',
      'Toalha de mesa em tecido capulana, cores vibrantes. Lavável e resistente, para ocasiões especiais.',
    ],
  },
  'Desporto': {
    nomes: [
      'Legging Fitness Premium',
      'Garrafa Térmica Desportiva',
      'Tapete de Yoga Antiderrapante',
      'Mochila Desportiva 40L',
      'Banda Elástica Resistência',
    ],
    descricoes: [
      'Legging de compressão com tecido respirável e secagem rápida. Cintura alta para suporte máximo.',
      'Garrafa térmica de 750ml em aço inox, mantém temperatura por 24h. Design ergonómico.',
      'Tapete de yoga em TPE ecológico, 6mm de espessura. Antiderrapante dos dois lados.',
      'Mochila desportiva 40L com compartimento para calçado, bolso para garrafa. Resistente à água.',
      'Kit com 5 bandas elásticas de resistência variada. Inclui bolsa de transporte e guia de exercícios.',
    ],
  },
  'Infantil': {
    nomes: [
      'Vestido Infantil Festa',
      'Mochila Escolar Colorida',
      'Kit Brinquedos Educativos',
      'Pijama Algodão Orgânico',
      'Sapatilha Infantil Conforto',
    ],
    descricoes: [
      'Vestido infantil para festas e ocasiões especiais, tecido macio e confortável. Várias cores disponíveis.',
      'Mochila escolar ergonómica com estampa colorida, alças acolchoadas. Impermeável e resistente.',
      'Kit com 12 brinquedos educativos em madeira natural. Estimula a criatividade e coordenação motora.',
      'Pijama em algodão orgânico certificado, hipoalergénico. Conforto e segurança para os pequenos.',
      'Sapatilha infantil com sola flexível e palmilha anatómica. Fácil de calçar com velcro.',
    ],
  },
  'Jóias & Bijuteria': {
    nomes: [
      'Colar Pérolas Naturais',
      'Brincos Dourados Étnicos',
      'Pulseira Missangas Artesanal',
      'Anel Prata Minimalista',
      'Conjunto Bijuteria Festa',
    ],
    descricoes: [
      'Colar com pérolas naturais de água doce, fecho em prata 925. Elegância atemporal.',
      'Brincos dourados com design étnico africano, leves e confortáveis. Banho de ouro 18k.',
      'Pulseira de missangas feita à mão, cada peça é única. Tradição artesanal angolana.',
      'Anel em prata 925 com design minimalista, acabamento polido. Ajustável e hipoalergénico.',
      'Conjunto com colar, brincos e pulseira, design coordenado para festas. Embalagem para presente.',
    ],
  },
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarFotos(): string {
  const numFotos = randomInt(1, 4);
  const fotos: string[] = [];
  for (let i = 0; i < numFotos; i++) {
    const id = randomInt(1, 1000);
    fotos.push(`https://picsum.photos/id/${id}/800/800`);
  }
  return JSON.stringify(fotos);
}

async function main() {
  const negocios = await prisma.negocio.findMany({
    select: { id: true, nomeComercial: true },
  });

  if (negocios.length === 0) {
    console.log('Nenhum negócio encontrado. Nada a fazer.');
    return;
  }

  console.log(`Encontrados ${negocios.length} negócios. A criar 30 produtos para cada...`);

  for (const negocio of negocios) {
    console.log(`\n→ ${negocio.nomeComercial} (${negocio.id})`);

    // Verificar produtos existentes para gerar códigos únicos
    const existentes = await prisma.peca.count({ where: { negocioId: negocio.id } });
    let codigoBase = existentes + 1;

    let criados = 0;
    const cats = [...categorias];

    for (let i = 0; i < 30; i++) {
      const cat = cats[i % cats.length];
      const dados = produtosPorCategoria[cat];
      const idx = Math.floor(i / cats.length) % dados.nomes.length;

      const sufixo = i >= cats.length ? ` ${Math.floor(i / cats.length) + 1}` : '';
      const nome = dados.nomes[idx] + sufixo;
      const descricao = dados.descricoes[idx];
      const codigo = `SEED-${String(codigoBase + i).padStart(4, '0')}`;

      try {
        await prisma.peca.create({
          data: {
            codigo,
            negocioId: negocio.id,
            nome,
            descricao,
            categoria: cat,
            precoEmKwanza: randomInt(1500, 85000),
            quantidade: randomInt(1, 50),
            fotosJson: gerarFotos(),
            estado: 'DISPONIVEL',
          },
        });
        criados++;
      } catch (e: any) {
        console.log(`  ⚠ Erro ao criar "${nome}": ${e.message?.slice(0, 80)}`);
      }
    }

    console.log(`  ✓ ${criados} produtos criados`);
  }

  console.log('\n✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
