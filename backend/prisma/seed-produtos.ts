import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// ── Fotos de roupa (Unsplash Source — imagens reais de moda) ─────────────

const fotosRoupa = {
  "Moda Feminina": [
    "https://images.unsplash.com/photo-1434389677669-e08b4cda3a40?w=800&q=80",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80",
    "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=800&q=80",
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800&q=80",
    "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=80",
  ],
  "Moda Masculina": [
    "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&q=80",
    "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80",
    "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80",
    "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80",
  ],
  Calcados: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80",
  ],
  Acessorios: [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&q=80",
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80",
  ],
  "Beleza & Cosmetica": [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
  ],
};

// ── Produtos por categoria (focado em roupa/moda) ─────────────────────────

const produtos: Array<{
  categoria: string;
  nome: string;
  descricao: string;
  precoMin: number;
  precoMax: number;
}> = [
  // Moda Feminina
  { categoria: "Moda Feminina", nome: "Vestido Ankara Premium", descricao: "Vestido feito com tecido Ankara autêntico, corte moderno e elegante. Perfeito para eventos e ocasiões especiais.", precoMin: 12000, precoMax: 35000 },
  { categoria: "Moda Feminina", nome: "Blusa de Seda Luanda", descricao: "Blusa de seda leve e confortável, ideal para o clima de Luanda. Design sofisticado com detalhes únicos.", precoMin: 8000, precoMax: 18000 },
  { categoria: "Moda Feminina", nome: "Saia Midi Elegante", descricao: "Saia midi com caimento perfeito, tecido de alta qualidade. Versátil para o dia a dia e eventos.", precoMin: 7000, precoMax: 15000 },
  { categoria: "Moda Feminina", nome: "Conjunto Capulana Moderna", descricao: "Conjunto inspirado na capulana tradicional com toque contemporâneo. Peça exclusiva feita à mão.", precoMin: 18000, precoMax: 45000 },
  { categoria: "Moda Feminina", nome: "Top Cropped Verão", descricao: "Top cropped leve e estiloso, perfeito para os dias quentes. Combina com tudo no teu guarda-roupa.", precoMin: 4000, precoMax: 9000 },
  { categoria: "Moda Feminina", nome: "Vestido Longo Festa", descricao: "Vestido longo fluido para festas e cerimónias. Tecido premium com brilho discreto.", precoMin: 25000, precoMax: 65000 },
  { categoria: "Moda Feminina", nome: "Calça Palazzo Linho", descricao: "Calça palazzo em linho natural, perna larga e cintura alta. Elegância e conforto tropical.", precoMin: 9000, precoMax: 22000 },
  { categoria: "Moda Feminina", nome: "Kimono Estampado", descricao: "Kimono leve com estampa floral exclusiva. Peça versátil para usar como casaco ou saída de praia.", precoMin: 6000, precoMax: 14000 },
  { categoria: "Moda Feminina", nome: "Body Rendado", descricao: "Body em renda fina com forro, perfeito para combinar com saia ou calça de cintura alta.", precoMin: 5000, precoMax: 12000 },
  { categoria: "Moda Feminina", nome: "Blazer Oversized Feminino", descricao: "Blazer oversized moderno, corte descontraído. Ideal para looks profissionais com personalidade.", precoMin: 15000, precoMax: 35000 },

  // Moda Masculina
  { categoria: "Moda Masculina", nome: "Camisa Linho Premium", descricao: "Camisa de linho puro, respirável e elegante. Corte slim fit para um visual sofisticado.", precoMin: 10000, precoMax: 28000 },
  { categoria: "Moda Masculina", nome: "Polo Clássica Bizy", descricao: "Polo clássica em algodão pima, conforto premium para o dia a dia. Bordado discreto.", precoMin: 7000, precoMax: 15000 },
  { categoria: "Moda Masculina", nome: "Calça Chino Slim", descricao: "Calça chino com corte slim moderno, tecido stretch para máximo conforto.", precoMin: 8000, precoMax: 20000 },
  { categoria: "Moda Masculina", nome: "Blazer Casual Moderno", descricao: "Blazer casual em tecido leve, ideal para o clima angolano. Estilo europeu adaptado ao trópico.", precoMin: 18000, precoMax: 45000 },
  { categoria: "Moda Masculina", nome: "T-Shirt Estampada África", descricao: "T-shirt com estampa artística inspirada na cultura africana. 100% algodão orgânico.", precoMin: 4000, precoMax: 9000 },
  { categoria: "Moda Masculina", nome: "Bermuda Cargo Premium", descricao: "Bermuda cargo em sarja resistente com bolsos funcionais. Conforto e estilo casual.", precoMin: 6000, precoMax: 14000 },
  { categoria: "Moda Masculina", nome: "Casaco Bomber Leve", descricao: "Bomber jacket leve, ideal para noites frescas de Luanda. Design minimalista com forro macio.", precoMin: 15000, precoMax: 35000 },
  { categoria: "Moda Masculina", nome: "Camisa Estampada Tropical", descricao: "Camisa de manga curta com estampa tropical, tecido viscose fluido. Para looks descontraídos.", precoMin: 7000, precoMax: 16000 },

  // Calçados
  { categoria: "Calcados", nome: "Sneaker Urban Luanda", descricao: "Sneaker urbano com design exclusivo, sola em borracha antiderrapante. Conforto para o dia inteiro.", precoMin: 12000, precoMax: 35000 },
  { categoria: "Calcados", nome: "Sandália Artesanal", descricao: "Sandália feita à mão com materiais naturais. Acabamento artesanal de qualidade superior.", precoMin: 5000, precoMax: 15000 },
  { categoria: "Calcados", nome: "Sapato Social Premium", descricao: "Sapato social em couro genuíno, acabamento impecável. Para quem valoriza elegância.", precoMin: 20000, precoMax: 55000 },
  { categoria: "Calcados", nome: "Ténis Running Pro", descricao: "Ténis de corrida com amortecimento avançado e malha respirável. Performance e estilo.", precoMin: 18000, precoMax: 45000 },
  { categoria: "Calcados", nome: "Bota Chelsea Moderna", descricao: "Bota Chelsea em couro sintético premium, elástico lateral. Estilo europeu durável.", precoMin: 14000, precoMax: 38000 },
  { categoria: "Calcados", nome: "Mule Feminino Elegante", descricao: "Mule com salto bloco médio, bico quadrado. Tendência actual com conforto garantido.", precoMin: 8000, precoMax: 22000 },

  // Acessórios
  { categoria: "Acessorios", nome: "Bolsa Tote Capulana", descricao: "Bolsa tote espaçosa com estampa em capulana autêntica. Interior organizado com bolsos.", precoMin: 8000, precoMax: 25000 },
  { categoria: "Acessorios", nome: "Óculos de Sol Aviador", descricao: "Óculos de sol estilo aviador com lentes UV400, armação metálica resistente.", precoMin: 5000, precoMax: 18000 },
  { categoria: "Acessorios", nome: "Cinto Couro Artesanal", descricao: "Cinto em couro genuíno com fivela artesanal. Feito à mão por artesãos locais.", precoMin: 4000, precoMax: 12000 },
  { categoria: "Acessorios", nome: "Mochila Urbana Couro", descricao: "Mochila em couro sintético premium, compartimento para portátil 15 polegadas.", precoMin: 12000, precoMax: 35000 },
  { categoria: "Acessorios", nome: "Relógio Minimalista", descricao: "Relógio com mostrador limpo e pulseira em aço inox. Design escandinavo elegante.", precoMin: 15000, precoMax: 45000 },

  // Beleza & Cosmética
  { categoria: "Beleza & Cosmetica", nome: "Kit Skincare Africano", descricao: "Kit completo de cuidados para pele com ingredientes naturais africanos.", precoMin: 10000, precoMax: 28000 },
  { categoria: "Beleza & Cosmetica", nome: "Perfume Essência Luanda", descricao: "Perfume artesanal com notas de baunilha, sândalo e flor de laranjeira.", precoMin: 12000, precoMax: 45000 },
  { categoria: "Beleza & Cosmetica", nome: "Óleo Capilar Baobab", descricao: "Óleo capilar enriquecido com extracto de baobab, nutre e dá brilho. 100% natural.", precoMin: 5000, precoMax: 14000 },
  { categoria: "Beleza & Cosmetica", nome: "Batom Matte Duradouro", descricao: "Batom matte de longa duração com fórmula hidratante. Cores vibrantes para todos os tons de pele.", precoMin: 3000, precoMax: 8000 },
];

// ── Nomes e dados de perfil angolanos ────────────────────────────────────

const nomesNegocios = [
  { nome: "Afrikana Fashion", segmento: "moda", slug: "afrikana-fashion", descricao: "Moda autêntica angolana com toque contemporâneo. Peças exclusivas feitas com tecidos africanos premium." },
  { nome: "Luanda Style", segmento: "moda", slug: "luanda-style", descricao: "A tua loja de moda em Luanda. Vestidos, blusas, calçados e acessórios para todos os estilos." },
  { nome: "Kizomba Wear", segmento: "moda", slug: "kizomba-wear", descricao: "Moda urbana inspirada na cultura angolana. Streetwear com identidade africana." },
];

const nomesPessoas = [
  { nome: "Ana Marta Silva", telefone: "244923100001", email: "ana.silva@demo.ao" },
  { nome: "Pedro Domingos", telefone: "244923100002", email: "pedro.domingos@demo.ao" },
  { nome: "Maria Teresa João", telefone: "244923100003", email: "maria.joao@demo.ao" },
  { nome: "João Carlos Mendes", telefone: "244923100004", email: "joao.mendes@demo.ao" },
  { nome: "Francisca Tomás", telefone: "244923100005", email: "francisca.tomas@demo.ao" },
  { nome: "António Manuel", telefone: "244923100006", email: "antonio.manuel@demo.ao" },
  { nome: "Luísa Fernandes", telefone: "244923100007", email: "luisa.fernandes@demo.ao" },
  { nome: "Carlos Eduardo", telefone: "244923100008", email: "carlos.eduardo@demo.ao" },
  { nome: "Teresa Baptista", telefone: "244923100009", email: "teresa.baptista@demo.ao" },
];

const nomesClientes = [
  { nome: "Valentina Costa", telefone: "244912200001" },
  { nome: "Miguel Andrade", telefone: "244912200002" },
  { nome: "Beatriz Neto", telefone: "244912200003" },
  { nome: "Rafael Pereira", telefone: "244912200004" },
  { nome: "Sofia Lourenço", telefone: "244912200005" },
  { nome: "David Tchissola", telefone: "244912200006" },
  { nome: "Isabel Mucuta", telefone: "244912200007" },
  { nome: "Fernando Gaspar", telefone: "244912200008" },
  { nome: "Catarina Vunge", telefone: "244912200009" },
  { nome: "Ricardo Mavinga", telefone: "244912200010" },
  { nome: "Marta Chipenda", telefone: "244912200011" },
  { nome: "Tiago Sampaio", telefone: "244912200012" },
  { nome: "Clara Sebastião", telefone: "244912200013" },
  { nome: "Nelson Afonso", telefone: "244912200014" },
  { nome: "Joana Mateus", telefone: "244912200015" },
];

const provincias = ["Luanda", "Benguela", "Huambo", "Huíla", "Cabinda"];
const municipios: Record<string, string[]> = {
  Luanda: ["Luanda (Ingombota)", "Viana", "Cacuaco", "Cazenga", "Talatona"],
  Benguela: ["Benguela", "Lobito", "Catumbela"],
  Huambo: ["Huambo", "Caála"],
  Huíla: ["Lubango"],
  Cabinda: ["Cabinda"],
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const copia = [...arr];
  const resultado: T[] = [];
  for (let i = 0; i < Math.min(n, copia.length); i++) {
    const idx = rand(0, copia.length - 1);
    resultado.push(copia.splice(idx, 1)[0]);
  }
  return resultado;
}

function gerarFotosCategoria(categoria: string): string {
  const chave = Object.keys(fotosRoupa).find((k) => categoria.includes(k) || k.includes(categoria.replace(/[^a-zA-Z]/g, "")));
  const fotos = chave ? fotosRoupa[chave as keyof typeof fotosRoupa] : fotosRoupa["Moda Feminina"];
  const n = rand(2, 4);
  return JSON.stringify(pickN(fotos, n));
}

function dataNosUltimosMeses(meses: number): Date {
  const agora = Date.now();
  const inicio = agora - meses * 30 * 24 * 60 * 60 * 1000;
  return new Date(inicio + Math.random() * (agora - inicio));
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("A iniciar seed completo com dados de moda...\n");

  for (const dadosNegocio of nomesNegocios) {
    // Verificar se negócio já existe pelo slug
    const existente = await prisma.negocio.findFirst({
      where: { slugPublico: dadosNegocio.slug },
    });
    if (existente) {
      console.log(`  Negócio "${dadosNegocio.nome}" já existe (${existente.id}). A saltar.\n`);
      continue;
    }

    const provincia = pick(provincias);
    const municipio = pick(municipios[provincia]);

    // ── Criar negócio ───────────────────────────────────────────
    const negocio = await prisma.negocio.create({
      data: {
        nomeComercial: dadosNegocio.nome,
        segmento: dadosNegocio.segmento,
        tipo: "EMPRESA",
        telefone: `244923${rand(100000, 999999)}`,
        whatsapp: `244923${rand(100000, 999999)}`,
        email: `${dadosNegocio.slug}@demo.ao`,
        instagram: `@${dadosNegocio.slug.replace(/-/g, "")}`,
        provincia,
        municipio,
        moeda: "AOA",
        slugPublico: dadosNegocio.slug,
        descricaoPublica: dadosNegocio.descricao,
        lojaPublicadaEm: new Date(),
        canaisVendaJson: JSON.stringify(["whatsapp", "instagram", "loja-publica"]),
        metodosPagamentoJson: JSON.stringify(["transferencia", "multicaixa-express", "numerario"]),
      },
    });

    console.log(`Negócio criado: ${negocio.nomeComercial} (${negocio.id})`);

    // ── Criar dono + membros ────────────────────────────────────
    const pessoasSelecionadas = pickN(nomesPessoas, 3);
    const membrosIds: string[] = [];

    for (let i = 0; i < pessoasSelecionadas.length; i++) {
      const pessoa = pessoasSelecionadas[i];
      const sufixoUnico = `${negocio.id.slice(0, 4)}${i}`;

      let usuario = await prisma.usuarioSistema.findFirst({
        where: { telefone: pessoa.telefone },
      });

      if (!usuario) {
        usuario = await prisma.usuarioSistema.create({
          data: {
            nome: pessoa.nome,
            telefone: pessoa.telefone,
            email: pessoa.email,
            papel: i === 0 ? "DONO" : "VENDEDOR",
            origemCadastro: "TELEFONE",
          },
        });
      }

      const existeMembro = await prisma.membroNegocio.findUnique({
        where: { negocioId_usuarioId: { negocioId: negocio.id, usuarioId: usuario.id } },
      });

      if (!existeMembro) {
        const membro = await prisma.membroNegocio.create({
          data: {
            negocioId: negocio.id,
            usuarioId: usuario.id,
            papel: i === 0 ? "DONO" : i === 1 ? "GESTOR" : "VENDEDOR",
            status: "ATIVO",
            permissoesJson: i === 0
              ? JSON.stringify({ "negocio:gerir": true, "equipa:ler": true, "equipa:gestao": true, "pagamentos:gerir": true, "catalogo:gerir": true })
              : i === 1
                ? JSON.stringify({ "equipa:ler": true, "equipa:gestao": true, "catalogo:gerir": true })
                : JSON.stringify({ "equipa:ler": true, "catalogo:gerir": true }),
          },
        });
        membrosIds.push(membro.id);
        console.log(`  Membro: ${pessoa.nome} (${i === 0 ? "DONO" : i === 1 ? "GESTOR" : "VENDEDOR"})`);
      }
    }

    // ── Criar módulos obrigatórios ──────────────────────────────
    for (const modulo of ["team-core", "equipa", "financas", "catalogo"]) {
      const existeModulo = await prisma.moduloNegocio.findUnique({
        where: { negocioId_modulo: { negocioId: negocio.id, modulo } },
      });
      if (!existeModulo) {
        await prisma.moduloNegocio.create({
          data: { negocioId: negocio.id, modulo, ativo: true, configuracaoJson: "{}" },
        });
      }
    }

    // ── Criar produtos com fotos de roupa ────────────────────────
    const produtosParaCriar = pickN(produtos, 25);
    const pecasCriadas: Array<{ id: string; codigo: string; nome: string; precoEmKwanza: number }> = [];

    for (let i = 0; i < produtosParaCriar.length; i++) {
      const p = produtosParaCriar[i];
      const codigo = `${dadosNegocio.slug.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
      const preco = rand(p.precoMin, p.precoMax);

      try {
        const peca = await prisma.peca.create({
          data: {
            codigo,
            negocioId: negocio.id,
            sku: `SKU-${codigo}`,
            nome: p.nome,
            descricao: p.descricao,
            categoria: p.categoria,
            precoEmKwanza: preco,
            custoEmKwanza: Math.round(preco * 0.4),
            quantidade: rand(5, 80),
            stockMinimo: rand(2, 10),
            fotosJson: gerarFotosCategoria(p.categoria),
            estado: "DISPONIVEL",
          },
        });
        pecasCriadas.push({ id: peca.id, codigo: peca.codigo, nome: peca.nome, precoEmKwanza: peca.precoEmKwanza });
      } catch {
        // ignorar duplicados
      }
    }

    console.log(`  ${pecasCriadas.length} produtos criados com fotos de roupa`);

    // ── Criar clientes ──────────────────────────────────────────
    const clientesSelecionados = pickN(nomesClientes, rand(8, 15));
    const clientesCriados: Array<{ id: string; nome: string }> = [];

    for (const cl of clientesSelecionados) {
      try {
        let clienteGlobal = await prisma.clienteGlobal.findFirst({
          where: { telefoneCanonico: cl.telefone },
        });

        if (!clienteGlobal) {
          clienteGlobal = await prisma.clienteGlobal.create({
            data: {
              telefoneCanonico: cl.telefone,
              nomePreferido: cl.nome,
              origemPrimeira: "seed",
            },
          });
        }

        const existeCliente = await prisma.clienteNegocio.findFirst({
          where: { negocioId: negocio.id, clienteGlobalId: clienteGlobal.id },
        });

        if (!existeCliente) {
          const clienteNeg = await prisma.clienteNegocio.create({
            data: {
              negocioId: negocio.id,
              clienteGlobalId: clienteGlobal.id,
              telefone: cl.telefone,
              nome: cl.nome,
              origem: "whatsapp",
              tagsJson: JSON.stringify([pick(["VIP", "Regular", "Novo"])]),
            },
          });
          clientesCriados.push({ id: clienteNeg.id, nome: cl.nome });
        }
      } catch {
        // ignorar duplicados
      }
    }

    console.log(`  ${clientesCriados.length} clientes criados`);

    // ── Criar pedidos com itens ──────────────────────────────────
    if (pecasCriadas.length > 0 && clientesCriados.length > 0) {
      const numPedidos = rand(15, 40);
      let pedidosCriados = 0;

      // Obter último número de pedido
      const ultimoPedido = await prisma.pedido.findFirst({
        where: { negocioId: negocio.id },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      let numPedido = (ultimoPedido?.numero ?? 0) + 1;

      for (let i = 0; i < numPedidos; i++) {
        const cliente = pick(clientesCriados);
        const numItens = rand(1, 4);
        const itensEscolhidos = pickN(pecasCriadas, numItens);

        let subtotal = 0;
        const itensData = itensEscolhidos.map((item) => {
          const qty = rand(1, 3);
          const sub = item.precoEmKwanza * qty;
          subtotal += sub;
          return {
            pecaId: item.id,
            codigoPeca: item.codigo,
            nomeProduto: item.nome,
            quantidade: qty,
            precoUnitarioEmKwanza: item.precoEmKwanza,
            subtotalEmKwanza: sub,
          };
        });

        const ivaPerc = 14;
        const iva = Math.round(subtotal * (ivaPerc / 100));
        const total = subtotal + iva;
        const dataCriacao = dataNosUltimosMeses(6);

        // Estados variados
        const estados = ["PAGO", "PENDENTE", "PAGO", "PAGO", "PENDENTE", "CANCELADO"];
        const estadoPag = pick(estados);
        const pago = estadoPag === "PAGO";
        const cancelado = estadoPag === "CANCELADO";

        try {
          await prisma.pedido.create({
            data: {
              negocioId: negocio.id,
              clienteNegocioId: cliente.id,
              numero: numPedido++,
              estado: cancelado ? "CANCELADO" : pago ? "ENTREGUE" : "AGUARDANDO_PAGAMENTO",
              estadoPagamento: estadoPag,
              estadoEntrega: pago ? "ENTREGUE" : "PENDENTE",
              origem: pick(["whatsapp", "loja-publica", "instagram"]),
              canal: pick(["whatsapp", "instagram"]),
              subtotalEmKwanza: subtotal,
              totalEmKwanza: total,
              ivaPercentual: ivaPerc,
              ivaEmKwanza: iva,
              responsavelId: membrosIds.length > 0 ? pick(membrosIds) : undefined,
              pagoEm: pago ? new Date(dataCriacao.getTime() + rand(1, 48) * 3600000) : undefined,
              entregueEm: pago ? new Date(dataCriacao.getTime() + rand(24, 120) * 3600000) : undefined,
              canceladoEm: cancelado ? new Date(dataCriacao.getTime() + rand(1, 24) * 3600000) : undefined,
              criadoEm: dataCriacao,
              itens: { create: itensData },
            },
          });
          pedidosCriados++;
        } catch {
          // ignorar erros de duplicados
        }
      }

      console.log(`  ${pedidosCriados} pedidos criados`);
    }

    // ── Criar movimentos financeiros (entradas das vendas) ──────
    const pedidosPagos = await prisma.pedido.findMany({
      where: { negocioId: negocio.id, estadoPagamento: "PAGO" },
      select: { id: true, numero: true, totalEmKwanza: true, pagoEm: true, criadoEm: true },
    });

    let movCriados = 0;
    for (const ped of pedidosPagos) {
      const existe = await prisma.movimentoFinanceiro.findFirst({
        where: { negocioId: negocio.id, origemId: ped.id, origemTipo: "PEDIDO" },
      });
      if (!existe) {
        await prisma.movimentoFinanceiro.create({
          data: {
            negocioId: negocio.id,
            tipo: "ENTRADA",
            descricao: `Pedido #${ped.numero}`,
            valor: ped.totalEmKwanza,
            origemTipo: "PEDIDO",
            origemId: ped.id,
            dataMovimento: ped.pagoEm ?? ped.criadoEm,
          },
        });
        movCriados++;
      }
    }

    // Criar algumas despesas fictícias
    const tiposDespesa = [
      { desc: "Renda do escritório", valor: rand(80000, 200000) },
      { desc: "Internet e telecomunicações", valor: rand(15000, 40000) },
      { desc: "Material de embalagem", valor: rand(10000, 30000) },
      { desc: "Transporte e entregas", valor: rand(20000, 60000) },
      { desc: "Marketing digital", valor: rand(25000, 75000) },
    ];

    for (const desp of tiposDespesa) {
      await prisma.movimentoFinanceiro.create({
        data: {
          negocioId: negocio.id,
          tipo: "SAIDA",
          descricao: desp.desc,
          valor: desp.valor,
          origemTipo: "DESPESA",
          dataMovimento: dataNosUltimosMeses(3),
        },
      });
      movCriados++;
    }

    console.log(`  ${movCriados} movimentos financeiros criados`);
    console.log("");
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
