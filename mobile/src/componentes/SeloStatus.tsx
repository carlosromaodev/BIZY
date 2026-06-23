import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { obterCorSemantica, type CorSemantica } from "../tema/cores";
import { tipografia } from "../tema/tipografia";
import { raio } from "../tema/espacamento";

interface SeloStatusProps {
  label: string;
  cor?: CorSemantica;
  comPonto?: boolean;
}

export function SeloStatus({ label, cor = "green", comPonto = false }: SeloStatusProps) {
  const { fundo, texto, ink } = obterCorSemantica(cor);

  return (
    <View style={[estilos.selo, { backgroundColor: fundo }]}>
      {comPonto && <View style={[estilos.ponto, { backgroundColor: texto }]} />}
      <Text style={[estilos.texto, { color: ink }]}>{label}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: raio.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  texto: {
    ...tipografia.micro,
    fontWeight: "600",
  },
});
