import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Search, X, ShoppingBag, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface CabecalhoMarketProps {
  busca: string;
  onBusca: (texto: string) => void;
  onSubmeterBusca: () => void;
  totalCarrinho?: number;
}

export function CabecalhoMarket({
  busca,
  onBusca,
  onSubmeterBusca,
  totalCarrinho = 0,
}: CabecalhoMarketProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      className="border-b border-bizy-line bg-bizy-surface px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Topo: marca + acções */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-[22px] font-black tracking-tight text-bizy-ink-market">
            bizy<Text className="text-bizy-green">.</Text>
          </Text>
          <View className="rounded-full bg-bizy-green-tint px-2 py-0.5">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-bizy-green">
              Market
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            className="relative h-9 w-9 items-center justify-center rounded-full"
            onPress={() => router.push("/(tabs)/carrinho")}
          >
            <ShoppingBag size={18} color="#151714" strokeWidth={1.85} />
            {totalCarrinho > 0 && (
              <View className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-bizy-green px-1">
                <Text className="text-[8px] font-extrabold text-white">
                  {totalCarrinho > 9 ? "9+" : totalCarrinho}
                </Text>
              </View>
            )}
          </Pressable>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-bizy-muted">
            <User size={15} color="#6E7873" strokeWidth={1.85} />
          </View>
        </View>
      </View>

      {/* Barra de busca */}
      <View className="h-11 flex-row items-center gap-2 rounded-bizy border border-bizy-line bg-bizy-bg px-3">
        <Search size={17} color="#9AA39E" strokeWidth={1.85} />
        <TextInput
          className="flex-1 text-bizy-base text-bizy-ink"
          placeholder="Buscar produtos, lojas e categorias..."
          placeholderTextColor="#9AA39E"
          value={busca}
          onChangeText={onBusca}
          onSubmitEditing={onSubmeterBusca}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {busca.length > 0 && (
          <Pressable onPress={() => onBusca("")} hitSlop={8}>
            <X size={16} color="#9AA39E" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
