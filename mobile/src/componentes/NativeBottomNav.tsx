import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type LucideIcon } from "lucide-react-native";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  variant?: "cta";
  badge?: number;
  onPress: () => void;
}

interface NativeBottomNavProps {
  items: NavItem[];
}

export function NativeBottomNav({ items }: NativeBottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[estilos.contentor, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={estilos.navPill}>
        {/* Pill fundo com blur */}
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
          <View style={estilos.blurOverlay} />
        </BlurView>

        {/* Itens */}
        <View style={estilos.itens}>
          {items.map((item) => {
            const Icon = item.icon;
            const isCta = item.variant === "cta";

            if (isCta) {
              return (
                <Pressable
                  key={item.id}
                  style={estilos.ctaBotao}
                  onPress={item.onPress}
                >
                  <Icon size={20} color="#FFFFFF" strokeWidth={1.85} />
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item.id}
                style={[
                  estilos.item,
                  item.active && estilos.itemAtivo,
                ]}
                onPress={item.onPress}
              >
                {item.active && <View style={estilos.pillAtivo} />}
                <View style={{ position: "relative" }}>
                  <Icon
                    size={20}
                    color={item.active ? "#111312" : "#8F908B"}
                    strokeWidth={1.85}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <View style={estilos.badge}>
                      <Text style={estilos.badgeTexto}>
                        {item.badge > 9 ? "9+" : item.badge}
                      </Text>
                    </View>
                  )}
                </View>
                {item.active && (
                  <Text style={estilos.label}>{item.label}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contentor: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  navPill: {
    width: "100%",
    maxWidth: 368,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    shadowColor: "#141412",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.74)",
  },
  itens: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  item: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    position: "relative",
    overflow: "hidden",
  },
  itemAtivo: {
    flex: 1.68,
  },
  pillAtivo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    shadowColor: "#111312",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 13,
    elevation: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111312",
    zIndex: 1,
  },
  ctaBotao: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E8C68",
    marginLeft: 6,
    shadowColor: "#0E8C68",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: "#0E8C68",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeTexto: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
