import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import type { CategoriaMarket } from "@/api/tipos";

const ICONES_DEPARTAMENTO: Record<string, string> = {
  Moda: "👗",
  Beleza: "✨",
  Comida: "🍲",
  Tecnologia: "📱",
  Casa: "🛋️",
  Serviços: "🛠️",
};

interface ListaCategoriasProps {
  categorias: CategoriaMarket[];
  selecionada: string;
  onSelecionar: (categoria: string) => void;
}

export function ListaCategorias({
  categorias,
  selecionada,
  onSelecionar,
}: ListaCategoriasProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
    >
      {/* Chip "Tudo" */}
      <Pressable
        className={`flex-row items-center gap-1 rounded-full border px-4 py-2 ${
          !selecionada
            ? "border-bizy-ink-market bg-bizy-ink-market"
            : "border-bizy-line bg-bizy-surface"
        }`}
        onPress={() => onSelecionar("")}
      >
        <Text className="text-sm">🔥</Text>
        <Text
          className={`text-bizy-sm font-bold ${
            !selecionada ? "text-white" : "text-bizy-ink"
          }`}
        >
          Tudo
        </Text>
      </Pressable>

      {categorias.map((cat) => {
        const ativo = selecionada === cat.categoria;
        const icone = ICONES_DEPARTAMENTO[cat.categoria] ?? "📦";

        return (
          <Pressable
            key={cat.categoria}
            className={`flex-row items-center gap-1 rounded-full border px-4 py-2 ${
              ativo
                ? "border-bizy-ink-market bg-bizy-ink-market"
                : "border-bizy-line bg-bizy-surface"
            }`}
            onPress={() => onSelecionar(cat.categoria)}
          >
            <Text className="text-sm">{icone}</Text>
            <Text
              className={`text-bizy-sm font-bold ${
                ativo ? "text-white" : "text-bizy-ink"
              }`}
            >
              {cat.categoria}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
