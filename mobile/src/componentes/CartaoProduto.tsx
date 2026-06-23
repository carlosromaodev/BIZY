import React from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Package, Store, Star } from "lucide-react-native";
import { formatarKwanza, obterResumoComercial } from "@/utilidades";
import type { ProdutoMarketNormalizado } from "@/api/tipos";

const { width: LARGURA_TELA } = Dimensions.get("window");
const LARGURA_CARTAO = (LARGURA_TELA - 16 * 2 - 10) / 2;

interface CartaoProdutoProps {
  produto: ProdutoMarketNormalizado;
  onPress: (produto: ProdutoMarketNormalizado) => void;
  largura?: number;
}

export function CartaoProduto({ produto, onPress, largura }: CartaoProdutoProps) {
  const resumo = obterResumoComercial(produto.codigo, produto.slugLoja);
  const w = largura ?? LARGURA_CARTAO;

  return (
    <Pressable
      className="overflow-hidden rounded-bizy border border-bizy-line-soft bg-bizy-surface active:scale-[0.97] active:opacity-90"
      style={{ width: w }}
      onPress={() => onPress(produto)}
    >
      {/* Media */}
      <View className="relative bg-bizy-media" style={{ width: w, aspectRatio: 1 / 1.12 }}>
        {produto.fotoPrincipal ? (
          <Image
            source={{ uri: produto.fotoPrincipal }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
            recyclingKey={produto.codigo}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Package size={34} color="#9AA39E" strokeWidth={1.5} />
          </View>
        )}

        {/* Selo desconto */}
        {produto.emPromocao && produto.descontoPercentual && (
          <View className="absolute left-2 top-2 rounded-md bg-bizy-green px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">
              -{produto.descontoPercentual}%
            </Text>
          </View>
        )}

        {/* Selo baixo stock */}
        {produto.estadoStock === "BAIXO_STOCK" && (
          <View className="absolute right-2 top-2 rounded-md bg-bizy-amber-tint px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-bizy-amber-ink">
              Últimas un.
            </Text>
          </View>
        )}
      </View>

      {/* Corpo */}
      <View className="gap-1 p-3">
        <Text className="text-bizy-sm font-medium text-bizy-ink" numberOfLines={2}>
          {produto.nome}
        </Text>

        {/* Rating */}
        <View className="flex-row items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={10} color="#B8860B" fill="#B8860B" strokeWidth={0} />
          ))}
          <Text className="ml-1 text-[9px] text-bizy-ink-4">
            {resumo.rating}
          </Text>
        </View>

        {/* Preço */}
        <View className="flex-row items-baseline gap-1.5">
          <Text className="text-[15px] font-bold text-bizy-ink-market">
            {formatarKwanza(produto.precoFinalEmKwanza)}
          </Text>
          {produto.precoAntigoEmKwanza && (
            <Text className="text-[11px] text-bizy-ink-4 line-through">
              {formatarKwanza(produto.precoAntigoEmKwanza)}
            </Text>
          )}
        </View>

        {/* Fornecedor */}
        <View className="mt-0.5 flex-row items-center gap-1">
          <Store size={11} color="#9AA39E" strokeWidth={1.85} />
          <Text className="flex-1 text-[10px] text-bizy-ink-4" numberOfLines={1}>
            {produto.nomeFornecedor}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
