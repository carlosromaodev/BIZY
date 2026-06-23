import React from "react";
import { FlatList, View, Text, ActivityIndicator } from "react-native";
import { Package } from "lucide-react-native";
import { CartaoProduto } from "./CartaoProduto";
import type { ProdutoMarketNormalizado } from "@/api/tipos";

interface GradeProdutosProps {
  produtos: ProdutoMarketNormalizado[];
  carregando?: boolean;
  onPressProduto: (produto: ProdutoMarketNormalizado) => void;
  cabecalho?: React.ReactElement;
  onFimLista?: () => void;
}

function EstadoVazio() {
  return (
    <View className="items-center justify-center py-16 gap-2">
      <Package size={36} color="#9AA39E" strokeWidth={1.5} />
      <Text className="text-bizy-lg font-semibold text-bizy-ink">
        Sem produtos
      </Text>
      <Text className="text-bizy-sm text-bizy-ink-3">
        Nenhum produto encontrado nesta secção.
      </Text>
    </View>
  );
}

export function GradeProdutos({
  produtos,
  carregando,
  onPressProduto,
  cabecalho,
  onFimLista,
}: GradeProdutosProps) {
  if (carregando && produtos.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 pt-16">
        {cabecalho}
        <ActivityIndicator size="large" color="#0E8C68" />
        <Text className="text-bizy-sm text-bizy-ink-3">
          A carregar produtos...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={produtos}
      numColumns={2}
      keyExtractor={(item) => `${item.slugLoja}-${item.codigo}`}
      renderItem={({ item }) => (
        <CartaoProduto produto={item} onPress={onPressProduto} />
      )}
      columnWrapperStyle={{ gap: 10, paddingHorizontal: 16, marginBottom: 10 }}
      contentContainerStyle={{ paddingBottom: 120 }}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={<EstadoVazio />}
      ListFooterComponent={
        carregando ? (
          <ActivityIndicator
            size="small"
            color="#0E8C68"
            style={{ paddingVertical: 24 }}
          />
        ) : null
      }
      onEndReached={onFimLista}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}
