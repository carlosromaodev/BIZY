import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { MapPin, CheckCircle2, ChevronRight } from "lucide-react-native";
import { obterIniciais } from "@/utilidades";
import type { LojaMarket } from "@/api/tipos";

interface CartaoFornecedorProps {
  loja: LojaMarket;
  onPress: (slug: string) => void;
}

export function CartaoFornecedor({ loja, onPress }: CartaoFornecedorProps) {
  const slug = loja.slug?.trim() ?? "";
  const localizacao = [loja.municipio, loja.provincia].filter(Boolean).join(", ");

  return (
    <Pressable
      className="flex-row items-center gap-3 rounded-bizy border border-bizy-line-soft bg-bizy-surface p-3.5 active:opacity-90"
      onPress={() => onPress(slug)}
    >
      {/* Avatar */}
      <View
        className="h-[2.6rem] w-[2.6rem] items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: loja.corPrimaria || "#EEF8F1" }}
      >
        {loja.logoUrl ? (
          <Image
            source={{ uri: loja.logoUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-bizy-sm font-bold text-white">
            {obterIniciais(loja.nomeComercial)}
          </Text>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1">
          <Text className="text-bizy-base font-semibold text-bizy-ink" numberOfLines={1}>
            {loja.nomeComercial}
          </Text>
          <CheckCircle2 size={13} color="#0E8C68" strokeWidth={2.5} />
        </View>

        {localizacao ? (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color="#9AA39E" strokeWidth={1.85} />
            <Text className="text-bizy-xs text-bizy-ink-4" numberOfLines={1}>
              {localizacao}
            </Text>
          </View>
        ) : null}

        <Text className="text-bizy-xs text-bizy-ink-3">
          {loja.totalProdutos} {loja.totalProdutos === 1 ? "produto" : "produtos"}
        </Text>
      </View>

      <ChevronRight size={18} color="#9AA39E" strokeWidth={1.85} />
    </Pressable>
  );
}
