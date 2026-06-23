import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Search, Store } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartaoFornecedor } from "@/componentes";
import { listarLojasMarket } from "@/api";
import type { LojaMarket } from "@/api";

export default function EcraLojas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [lojas, setLojas] = useState<LojaMarket[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await listarLojasMarket({
        busca: busca || undefined,
        limite: 30,
      });
      setLojas(res.lojas ?? []);
    } catch {
      setLojas([]);
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirLoja(slug: string) {
    router.push(`/loja/${slug}`);
  }

  return (
    <View className="flex-1 bg-bizy-bg">
      {/* Cabeçalho */}
      <View
        className="border-b border-bizy-line bg-bizy-surface px-4 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="mb-3">
          <Text className="text-bizy-xl font-bold text-bizy-ink">Lojas</Text>
          <Text className="mt-0.5 text-bizy-sm text-bizy-ink-3">
            {carregando ? "A carregar..." : `${lojas.length} lojas no Market`}
          </Text>
        </View>

        <View className="h-10.5 flex-row items-center gap-2 rounded-bizy-lg border border-bizy-line bg-bizy-bg px-3">
          <Search size={18} color="#9AA39E" strokeWidth={1.85} />
          <TextInput
            className="flex-1 text-bizy-base text-bizy-ink"
            placeholder="Buscar lojas..."
            placeholderTextColor="#9AA39E"
            value={busca}
            onChangeText={setBusca}
            onSubmitEditing={() => carregar()}
            returnKeyType="search"
            autoCapitalize="none"
          />
        </View>
      </View>

      {carregando && lojas.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0E8C68" />
        </View>
      ) : (
        <FlatList
          data={lojas}
          keyExtractor={(item) => item.slug ?? item.nomeComercial}
          renderItem={({ item }) => (
            <CartaoFornecedor loja={item} onPress={abrirLoja} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center py-16 gap-2">
              <Store size={36} color="#9AA39E" strokeWidth={1.5} />
              <Text className="text-bizy-sm text-bizy-ink-3">
                Nenhuma loja encontrada
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
