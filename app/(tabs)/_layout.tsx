import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].accent,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الصفحة الرّئسية",
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
        name="notification"
        options={{
          title: "الأشعارات",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell" color={color} />
          ),
          tabBarBadge: 3,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "الأعدادات",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
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
    </Tabs>
  );
}
