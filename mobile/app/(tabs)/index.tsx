import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { CabecalhoMarket, GradeProdutos, ListaCategorias } from "@/componentes";
import { listarCategoriasMarket, listarProdutosMarket, normalizarProduto } from "@/api";
import type { CategoriaMarket, ProdutoMarketNormalizado } from "@/api";

export default function EcraMarket() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [categorias, setCategorias] = useState<CategoriaMarket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resCat, resProd] = await Promise.all([
        listarCategoriasMarket().catch(() => ({ categorias: [], total: 0 })),
        listarProdutosMarket({
          busca: busca || undefined,
          categoria: categoriaSelecionada || undefined,
          limite: 48,
        }),
      ]);
      setCategorias(resCat.categorias ?? resProd.categorias ?? []);
      setProdutos((resProd.produtos ?? []).map(normalizarProduto));
    } catch {
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [busca, categoriaSelecionada]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirProduto(produto: ProdutoMarketNormalizado) {
    router.push(`/produto/${produto.codigo}`);
  }

  function submeterBusca() {
    void carregar();
  }

  const cabecalhoLista = (
    <View>
      <CabecalhoMarket
        busca={busca}
        onBusca={setBusca}
        onSubmeterBusca={submeterBusca}
      />
      <ListaCategorias
        categorias={categorias}
        selecionada={categoriaSelecionada}
        onSelecionar={setCategoriaSelecionada}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-bizy-bg">
      <GradeProdutos
        produtos={produtos}
        carregando={carregando}
        onPressProduto={abrirProduto}
        cabecalho={cabecalhoLista}
      />
    </View>
  );
}
