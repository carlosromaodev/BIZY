import { Tabs } from "expo-router";
import { Compass, Store, ShoppingBag } from "lucide-react-native";

export default function LayoutTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0E8C68",
        tabBarInactiveTintColor: "#9AA39E",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "rgba(21,23,20,0.08)",
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ color, size }) => (
            <Compass size={size} color={color} strokeWidth={1.85} />
          ),
        }}
      />
      <Tabs.Screen
        name="lojas"
        options={{
          title: "Lojas",
          tabBarIcon: ({ color, size }) => (
            <Store size={size} color={color} strokeWidth={1.85} />
          ),
        }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: "Carrinho",
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} strokeWidth={1.85} />
          ),
        }}
      />
    </Tabs>
  );
}
