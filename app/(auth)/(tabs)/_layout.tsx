import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import { Stack, Tabs } from "expo-router";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Platform } from "react-native";
import React from "react";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors["light"].accent,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelPosition: "beside-icon",
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
        animation: "shift",
        tabBarLabelStyle: {
          fontFamily: "Tajawal",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الصفحة الرّئيسية",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: "المعاملات",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="arrow.left.arrow.right.circle"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "المزيد",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="ellipsis.circle" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="home.old"
        options={{
          title: "Home old screen",
          href: null,
        }}
      />
    </Tabs>
  );
}
