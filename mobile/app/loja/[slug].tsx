import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listarLojasMarket, listarProdutosMarket, normalizarProduto } from "@/api";
import type { LojaMarket, ProdutoMarketNormalizado } from "@/api";
import { GradeProdutos } from "@/componentes";
import { obterIniciais } from "@/utilidades";

const { width: LARGURA_TELA } = Dimensions.get("window");

export default function EcraLoja() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loja, setLoja] = useState<LojaMarket | null>(null);
  const [produtos, setProdutos] = useState<ProdutoMarketNormalizado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      try {
        const [resLojas, resProd] = await Promise.all([
          listarLojasMarket({ busca: slug, limite: 1 }),
          listarProdutosMarket({ loja: slug, limite: 48 }),
        ]);
        if (!ativo) return;
        setLoja(resLojas.lojas?.[0] ?? null);
        setProdutos((resProd.produtos ?? []).map(normalizarProduto));
      } catch {
        if (!ativo) return;
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [slug]);

  const localizacao = loja
    ? [loja.municipio, loja.provincia].filter(Boolean).join(", ")
    : "";

  const cabecalho = (
    <View>
      {/* Header com voltar */}
      <View
        className="absolute left-0 right-0 z-10 px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
          style={{
            shadowColor: "#141412",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#17211C" strokeWidth={1.85} />
        </Pressable>
      </View>

      {/* Capa e perfil */}
      <View className="border-b border-bizy-line bg-bizy-surface">
        <View
          style={{
            width: LARGURA_TELA,
            height: 140,
            backgroundColor: loja?.corPrimaria || "#0E8C68",
          }}
        >
          {loja?.capaUrl ? (
            <Image
              source={{ uri: loja.capaUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
        </View>

        <View className="flex-row gap-3 px-4 pb-4 pt-0" style={{ marginTop: -28 }}>
          {/* Avatar */}
          <View
            className="h-16 w-16 items-center justify-center overflow-hidden rounded-bizy-lg border-[3px] border-bizy-surface"
            style={{
              backgroundColor: loja?.corPrimaria || "#0E8C68",
              shadowColor: "#141412",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {loja?.logoUrl ? (
              <Image
                source={{ uri: loja.logoUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-bizy-lg font-bold text-white">
                {obterIniciais(loja?.nomeComercial ?? "Loja")}
              </Text>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 gap-1 pt-7">
            <View className="flex-row items-center gap-1">
              <Text className="text-bizy-lg font-semibold text-bizy-ink">
                {loja?.nomeComercial ?? slug}
              </Text>
              <CheckCircle2 size={16} color="#0E8C68" strokeWidth={2.5} />
            </View>

            {localizacao ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#9AA39E" strokeWidth={1.85} />
                <Text className="text-bizy-xs text-bizy-ink-4">
                  {localizacao}
                </Text>
              </View>
            ) : null}

            {loja?.descricaoPublica ? (
              <Text
                className="mt-1 text-bizy-sm text-bizy-ink-3"
                numberOfLines={3}
              >
                {loja.descricaoPublica}
              </Text>
            ) : null}

            <View className="mt-2 flex-row items-center gap-2">
              <Text className="text-bizy-xs text-bizy-ink-3">
                <Text className="font-bold text-bizy-ink">
                  {loja?.totalProdutos ?? 0}
                </Text>{" "}
                produtos
              </Text>
              <View className="h-0.75 w-0.75 rounded-full bg-bizy-ink-4" />
              <Text className="text-bizy-xs text-bizy-ink-3">
                <Text className="font-bold text-bizy-ink">
                  {loja?.categorias?.length ?? 0}
                </Text>{" "}
                categorias
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Separador */}
      <View className="border-t border-bizy-line px-4 py-3">
        <Text className="text-bizy-base font-semibold text-bizy-ink">
          Produtos da loja
        </Text>
      </View>
    </View>
  );

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-bizy-bg">
        <ActivityIndicator size="large" color="#0E8C68" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bizy-bg">
      <GradeProdutos
        produtos={produtos}
        carregando={carregando}
        onPressProduto={(p) => router.push(`/produto/${p.codigo}`)}
        cabecalho={cabecalho}
      />
    </View>
  );
}
