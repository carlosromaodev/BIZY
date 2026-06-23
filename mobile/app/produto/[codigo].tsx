import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Star,
  Truck,
  Store,
  ShieldCheck,
  Package,
  MapPin,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  obterProdutoMarket,
  listarSimilaresMarket,
  normalizarProduto,
} from "@/api";
import type { ProdutoMarketNormalizado } from "@/api";
import { adicionarItem, criarItemDeProduto } from "@/loja/carrinho";
import { SeletorQuantidade, CartaoProduto } from "@/componentes";
import { formatarKwanza, obterIniciais, obterResumoComercial, normalizarTextoCor } from "@/utilidades";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CORES_VARIANTES } from "@/tema";

const { width: LARGURA_TELA } = Dimensions.get("window");

function variantePareceCor(nome: string) {
  return /cor|color|tom/i.test(normalizarTextoCor(nome));
}

function resolverCorVisual(opcao: string, fallback: string) {
  const texto = normalizarTextoCor(opcao);
  const hex = opcao.match(/#(?:[0-9a-fA-F]{3}){1,2}/)?.[0];
  if (hex) return hex;
  return (
    Object.entries(CORES_VARIANTES).find(([nome]) =>
      texto.includes(nome)
    )?.[1] ?? fallback
  );
}

export default function EcraProduto() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [produto, setProduto] = useState<ProdutoMarketNormalizado | null>(null);
  const [similares, setSimilares] = useState<ProdutoMarketNormalizado[]>([]);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!codigo) return;
    let ativo = true;

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const res = await obterProdutoMarket(codigo);
        const resSim = await listarSimilaresMarket(codigo, 8).catch(
          () => null
        );
        if (!ativo) return;
        if (!res?.produto) throw new Error("Produto indisponível.");
        setProduto(normalizarProduto(res.produto));
        setSimilares(
          (resSim?.produtos ?? res.similares ?? []).map(normalizarProduto)
        );
        setFotoAtiva(0);
        setQuantidade(1);
      } catch (e) {
        if (!ativo) return;
        setErro(e instanceof Error ? e.message : "Produto indisponível.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [codigo]);

  const fotos = useMemo(() => produto?.fotos.slice(0, 6) ?? [], [produto]);
  const fotoPrincipal = fotos[fotoAtiva] || produto?.fotoPrincipal || "";

  async function adicionarAoCarrinho() {
    if (!produto) return;
    await adicionarItem(criarItemDeProduto(produto, quantidade, "market-pdp"));
    Alert.alert(
      "Adicionado",
      `${produto.nome} foi adicionado ao carrinho.`,
      [
        { text: "Continuar", style: "cancel" },
        {
          text: "Ver carrinho",
          onPress: () => router.push("/(tabs)/carrinho"),
        },
      ]
    );
  }

  // ── Estado de carregamento ──
  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bizy-bg px-8">
        <ActivityIndicator size="large" color="#0E8C68" />
        <Text className="text-bizy-sm text-bizy-ink-3">
          A carregar produto...
        </Text>
      </View>
    );
  }

  // ── Estado de erro ──
  if (erro || !produto) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-bizy-bg px-8">
        <Package size={48} color="#9AA39E" strokeWidth={1.5} />
        <Text className="text-bizy-lg font-semibold text-bizy-ink">
          Produto indisponível
        </Text>
        <Text className="text-center text-bizy-sm text-bizy-ink-3">
          {erro}
        </Text>
        <Button variant="primary" onPress={() => router.back()}>
          Voltar ao Market
        </Button>
      </View>
    );
  }

  const resumo = obterResumoComercial(produto.codigo, produto.slugLoja);
  const variantesVisiveis = Object.entries(produto.variantes ?? {})
    .filter(([, opcoes]) => opcoes.length > 0)
    .slice(0, 2);

  return (
    <View className="flex-1 bg-bizy-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header flutuante */}
        <View
          className="absolute left-0 right-0 z-10 flex-row justify-between px-4"
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
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
            style={{
              shadowColor: "#141412",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
            onPress={() => router.push("/(tabs)/carrinho")}
          >
            <ShoppingBag size={20} color="#17211C" strokeWidth={1.85} />
          </Pressable>
        </View>

        {/* Galeria */}
        <View className="bg-bizy-media">
          <View
            className="relative items-center justify-center"
            style={{ width: LARGURA_TELA, aspectRatio: 1 }}
          >
            {produto.emPromocao && produto.descontoPercentual && (
              <View
                className="absolute left-4 z-5 rounded-md bg-bizy-green px-2 py-1"
                style={{ top: insets.top + 56 }}
              >
                <Text className="text-[10px] font-bold text-white">
                  -{produto.descontoPercentual}%
                </Text>
              </View>
            )}
            {fotoPrincipal ? (
              <Image
                source={{ uri: fotoPrincipal }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Package size={64} color="#9AA39E" strokeWidth={1.5} />
            )}
          </View>

          {fotos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 8,
              }}
            >
              {fotos.map((foto, i) => (
                <Pressable
                  key={`${foto}-${i}`}
                  className={`h-14 w-14 overflow-hidden rounded-bizy-sm border-2 ${
                    fotoAtiva === i
                      ? "border-bizy-green"
                      : "border-transparent"
                  }`}
                  onPress={() => setFotoAtiva(i)}
                >
                  <Image
                    source={{ uri: foto }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Fornecedor */}
        <View className="flex-row items-center gap-3 border-b border-bizy-line bg-bizy-surface px-4 py-3">
          <View
            className="h-10 w-10 items-center justify-center overflow-hidden rounded-bizy-sm"
            style={{
              backgroundColor: produto.fornecedor.corPrimaria,
            }}
          >
            {produto.fornecedor.logoUrl ? (
              <Image
                source={{ uri: produto.fornecedor.logoUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <Text className="text-bizy-sm font-bold text-white">
                {obterIniciais(produto.nomeFornecedor)}
              </Text>
            )}
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1">
              <Text className="text-bizy-sm text-bizy-ink">
                Vendido por{" "}
                <Text className="font-bold">{produto.nomeFornecedor}</Text>
              </Text>
              <CheckCircle2 size={12} color="#0E8C68" strokeWidth={2.5} />
            </View>
            <Text className="text-bizy-xs text-bizy-ink-4">
              {produto.fornecedor.localizacao || "Loja Bizy verificada"}
            </Text>
          </View>
        </View>

        {/* Detalhes */}
        <View className="gap-2 px-4 pt-5">
          <Badge variant="green">{produto.categoria}</Badge>
          <Text className="text-bizy-xl font-bold text-bizy-ink">
            {produto.nome}
          </Text>

          {/* Rating */}
          <View className="mt-1 flex-row items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={14}
                color="#B8860B"
                fill="#B8860B"
                strokeWidth={0}
              />
            ))}
            <Text className="ml-1 text-bizy-xs text-bizy-ink-3">
              {resumo.rating} · {resumo.avaliacoes} avaliações ·{" "}
              {resumo.vendidos} vendidos
            </Text>
          </View>

          {/* Preço */}
          <View className="mt-2 flex-row items-baseline gap-2">
            <Text className="text-2xl font-bold text-bizy-ink">
              {formatarKwanza(produto.precoFinalEmKwanza)}
            </Text>
            {produto.precoAntigoEmKwanza && (
              <Text className="text-[15px] text-bizy-ink-4 line-through">
                {formatarKwanza(produto.precoAntigoEmKwanza)}
              </Text>
            )}
          </View>

          {/* Variantes */}
          {variantesVisiveis.map(([nome, opcoes]) => (
            <View key={nome} className="mt-3 gap-2">
              <Text className="text-bizy-sm font-semibold text-bizy-ink">
                {nome}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {opcoes.slice(0, 5).map((opcao, i) => (
                  <Pressable
                    key={opcao}
                    className={`rounded-bizy-sm border px-3 py-2 ${
                      i === 0
                        ? "border-bizy-ink bg-bizy-ink"
                        : "border-bizy-line bg-bizy-surface"
                    }`}
                  >
                    {variantePareceCor(nome) ? (
                      <View
                        className="h-6 w-6 rounded-full border border-bizy-line"
                        style={{
                          backgroundColor: resolverCorVisual(
                            opcao,
                            produto.fornecedor.corPrimaria
                          ),
                        }}
                      />
                    ) : (
                      <Text
                        className={`text-bizy-sm ${
                          i === 0 ? "text-white" : "text-bizy-ink"
                        }`}
                      >
                        {opcao}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Quantidade */}
          <View className="mt-4 gap-2">
            <Text className="text-bizy-sm font-semibold text-bizy-ink">
              Quantidade
            </Text>
            <SeletorQuantidade
              valor={quantidade}
              maximo={Math.max(1, produto.quantidade)}
              onChange={setQuantidade}
            />
          </View>

          {/* Descrição */}
          {produto.descricao ? (
            <Text className="mt-4 text-bizy-base leading-6 text-bizy-ink-3">
              {produto.descricao}
            </Text>
          ) : null}

          {/* Info Entrega */}
          <View className="mt-6 gap-3 border-t border-bizy-line pt-4">
            <View className="flex-row items-center gap-3">
              <Truck size={18} color="#6E7873" strokeWidth={1.85} />
              <Text className="flex-1 text-bizy-sm text-bizy-ink-3">
                Entrega em <Text className="font-bold">24-48h</Text> em Luanda
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Store size={18} color="#6E7873" strokeWidth={1.85} />
              <Text className="flex-1 text-bizy-sm text-bizy-ink-3">
                Retirada <Text className="font-bold">grátis</Text> na loja
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <ShieldCheck size={18} color="#6E7873" strokeWidth={1.85} />
              <Text className="flex-1 text-bizy-sm text-bizy-ink-3">
                Troca em <Text className="font-bold">7 dias</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Similares */}
        {similares.length > 0 && (
          <View className="mt-6 border-t border-bizy-line pt-5">
            <Text className="mb-3 px-4 text-bizy-lg font-semibold text-bizy-ink">
              Produtos similares
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {similares.map((s) => (
                <View
                  key={`${s.slugLoja}-${s.codigo}`}
                  style={{ width: 160 }}
                >
                  <CartaoProduto
                    produto={s}
                    onPress={(p) => router.push(`/produto/${p.codigo}`)}
                    largura={160}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Barra fixa de compra */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-bizy-line bg-bizy-surface px-4 pt-3"
        style={{
          paddingBottom: insets.bottom + 8,
          shadowColor: "#141412",
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="gap-0.5">
          <Text className="text-lg font-bold text-bizy-ink">
            {formatarKwanza(produto.precoFinalEmKwanza)}
          </Text>
          <Text className="text-bizy-xs text-bizy-ink-4">
            {quantidade > 1 ? `${quantidade}x` : "un."}
          </Text>
        </View>
        <Button
          variant="primary"
          className="flex-1"
          onPress={adicionarAoCarrinho}
          icon={
            <ShoppingBag size={20} color="#FFFFFF" strokeWidth={1.85} />
          }
        >
          Adicionar ao checkout
        </Button>
      </View>
    </View>
  );
}
