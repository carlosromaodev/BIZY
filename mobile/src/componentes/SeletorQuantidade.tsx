import React from "react";
import { View, Text, Pressable } from "react-native";
import { Minus, Plus } from "lucide-react-native";

interface SeletorQuantidadeProps {
  valor: number;
  minimo?: number;
  maximo?: number;
  onChange: (valor: number) => void;
}

export function SeletorQuantidade({
  valor,
  minimo = 1,
  maximo = 99,
  onChange,
}: SeletorQuantidadeProps) {
  const desMin = valor <= minimo;
  const desMax = valor >= maximo;

  return (
    <View className="flex-row items-center overflow-hidden rounded-bizy border border-bizy-line bg-bizy-surface">
      <Pressable
        className="h-10 w-10 items-center justify-center"
        style={desMin ? { opacity: 0.35 } : undefined}
        onPress={() => onChange(Math.max(minimo, valor - 1))}
        disabled={desMin}
        hitSlop={6}
      >
        <Minus size={16} color="#151714" strokeWidth={2} />
      </Pressable>

      <Text className="min-w-[32px] text-center text-bizy-base font-bold text-bizy-ink">
        {valor}
      </Text>

      <Pressable
        className="h-10 w-10 items-center justify-center"
        style={desMax ? { opacity: 0.35 } : undefined}
        onPress={() => onChange(Math.min(maximo, valor + 1))}
        disabled={desMax}
        hitSlop={6}
      >
        <Plus size={16} color="#151714" strokeWidth={2} />
      </Pressable>
    </View>
  );
}
