import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import {
  CheckCircle2,
  CreditCard,
  Banknote,
  Store,
  ShoppingBag,
  Trash2,
  Package,
  ShieldCheck,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  carregarCarrinho,
  removerItem,
  agruparPorLoja,
  calcularTotais,
  limparCarrinho,
  type ItemCarrinho,
} from "@/loja/carrinho";
import { criarCheckoutUnificado } from "@/api";
import { formatarKwanza } from "@/utilidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type MetodoPagamento = "transferencia" | "cash" | "personalizado";

const METODOS: Array<{
  id: MetodoPagamento;
  titulo: string;
  icon: typeof CreditCard;
}> = [
  { id: "transferencia", titulo: "Transferência bancária", icon: CreditCard },
  { id: "cash", titulo: "Dinheiro na entrega", icon: Banknote },
  { id: "personalizado", titulo: "Combinar com a loja", icon: Store },
];

export default function EcraCarrinho() {
  const insets = useSafeAreaInsets();
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [metodoPagamento, setMetodoPagamento] =
    useState<MetodoPagamento>("transferencia");
  const [finalizando, setFinalizando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    void carregarCarrinho().then(setItens);
  }, []);

  const grupos = agruparPorLoja(itens);
  const totais = calcularTotais(itens);

  async function tirarItem(id: string) {
    const novos = await removerItem(id);
    setItens(novos);
  }

  async function finalizar() {
    if (!itens.length) return;
    if (!nome.trim() || !telefone.trim()) {
      Alert.alert("Dados obrigatórios", "Nome e WhatsApp são obrigatórios.");
      return;
    }

    setFinalizando(true);
    try {
      await criarCheckoutUnificado({
        compradorTelefone: telefone,
        compradorNome: nome,
        itens: itens.map((i) => ({
          slugLoja: i.slugLoja,
          codigoPeca: i.codigoProduto,
          quantidade: i.quantidade,
        })),
        metodoPagamento,
        enderecoEntrega: endereco || undefined,
        origem: "mobile-app",
      });
      await limparCarrinho();
      setItens([]);
      setSucesso(true);
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível finalizar."
      );
    } finally {
      setFinalizando(false);
    }
  }

  if (sucesso) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-bizy-bg px-8">
        <CheckCircle2 size={64} color="#0E8C68" strokeWidth={1.5} />
        <Text className="text-bizy-xl font-bold text-bizy-ink">
          Pedido criado!
        </Text>
        <Text className="text-center text-bizy-base text-bizy-ink-3">
          A loja vai contactar-te pelo WhatsApp para confirmar.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bizy-bg-alt"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-bizy-xl font-bold text-bizy-ink">Checkout</Text>
        <Text className="mb-5 mt-0.5 text-bizy-sm text-bizy-ink-3">
          {totais.quantidadeItens}{" "}
          {totais.quantidadeItens === 1 ? "item" : "itens"} de{" "}
          {totais.totalLojas} {totais.totalLojas === 1 ? "loja" : "lojas"}
        </Text>

        {/* Grupos por loja */}
        {grupos.map((grupo) => (
          <Card key={grupo.slugLoja} className="mb-3 overflow-hidden">
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Store size={16} color="#0E8C68" strokeWidth={1.85} />
                <Text className="text-bizy-base font-semibold text-bizy-ink">
                  {grupo.nomeFornecedor}
                </Text>
              </View>
            </CardHeader>
            <CardContent className="gap-0 p-0">
              {grupo.itens.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 border-b border-bizy-line px-4 py-3"
                >
                  <View className="h-13 w-13 items-center justify-center overflow-hidden rounded-bizy-sm bg-bizy-media">
                    {item.fotoUrl ? (
                      <Image
                        source={{ uri: item.fotoUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Package size={20} color="#9AA39E" strokeWidth={1.5} />
                    )}
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text
                      className="text-bizy-sm font-medium text-bizy-ink"
                      numberOfLines={2}
                    >
                      {item.nomeProduto}
                    </Text>
                    <Text className="text-bizy-sm font-bold text-bizy-green">
                      {item.quantidade}x{" "}
                      {formatarKwanza(item.precoUnitarioEmKwanza)}
                    </Text>
                  </View>
                  <Pressable onPress={() => tirarItem(item.id)} hitSlop={8}>
                    <Trash2 size={18} color="#c9564a" strokeWidth={1.85} />
                  </Pressable>
                </View>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Formulário e Pagamento */}
        {itens.length > 0 && (
          <>
            <View className="mt-5 gap-3">
              <Text className="text-bizy-base font-semibold text-bizy-ink">
                Os teus dados
              </Text>
              <Input
                placeholder="Nome completo"
                value={nome}
                onChangeText={setNome}
              />
              <Input
                placeholder="WhatsApp (ex: 923 456 789)"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
              <Input
                placeholder="Endereço de entrega (opcional)"
                value={endereco}
                onChangeText={setEndereco}
              />
            </View>

            <View className="mt-5 gap-3">
              <Text className="text-bizy-base font-semibold text-bizy-ink">
                Pagamento
              </Text>
              {METODOS.map((m) => {
                const ativo = metodoPagamento === m.id;
                const Icon = m.icon;
                return (
                  <Pressable
                    key={m.id}
                    className={`flex-row items-center gap-3 rounded-bizy border px-4 py-3 ${
                      ativo
                        ? "border-bizy-green bg-bizy-green-tint"
                        : "border-bizy-line bg-bizy-surface"
                    }`}
                    onPress={() => setMetodoPagamento(m.id)}
                  >
                    <Icon
                      size={20}
                      color={ativo ? "#0E8C68" : "#6E7873"}
                      strokeWidth={1.85}
                    />
                    <Text
                      className={`flex-1 text-bizy-base ${
                        ativo
                          ? "font-semibold text-bizy-ink"
                          : "text-bizy-ink-3"
                      }`}
                    >
                      {m.titulo}
                    </Text>
                    {ativo && (
                      <CheckCircle2
                        size={18}
                        color="#0E8C68"
                        strokeWidth={2}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Total */}
            <View className="mt-6 flex-row items-center justify-between border-t border-bizy-line pt-4">
              <Text className="text-bizy-lg font-semibold text-bizy-ink">
                Total
              </Text>
              <Text className="text-bizy-xl font-bold text-bizy-ink">
                {formatarKwanza(totais.subtotalEmKwanza)}
              </Text>
            </View>

            {/* Botão Finalizar */}
            <Button
              variant="primary"
              size="lg"
              onPress={finalizar}
              disabled={finalizando}
              loading={finalizando}
              className="mt-4"
              icon={
                !finalizando ? (
                  <ShieldCheck size={20} color="#FFFFFF" strokeWidth={1.85} />
                ) : undefined
              }
            >
              Finalizar pedido
            </Button>
          </>
        )}

        {/* Estado vazio */}
        {itens.length === 0 && !sucesso && (
          <View className="items-center gap-2 py-20">
            <ShoppingBag size={48} color="#9AA39E" strokeWidth={1.5} />
            <Text className="text-bizy-lg font-semibold text-bizy-ink">
              Carrinho vazio
            </Text>
            <Text className="text-bizy-sm text-bizy-ink-3">
              Adiciona produtos do Market para começar.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
