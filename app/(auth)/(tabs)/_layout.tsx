import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  const { hasPermission: hasAdminPermission, isLoading } =
    useSupabaseHasPermissions(["admin"]);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors["light"].accent,
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
        name="agent"
        options={{
          // Only show for admins
          href:
            !isLoading && hasAdminPermission ? "/(auth)/(tabs)/agent" : null,
          title: "الوكلاء",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="person.line.dotted.person.fill"
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          // don't show this link in admin session (it will be accessible from menu)
          href:
            !isLoading && hasAdminPermission ? null : "/(auth)/(tabs)/reports",
          title: "التقارير",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="archivebox.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="currency_rates"
        options={{
          // don't show this link in admin session (it will be accessible from menu)
          href:
            !isLoading && hasAdminPermission
              ? null
              : "/(auth)/(tabs)/currency_rates",
          title: "أسعار الصرف",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="coloncurrencysign.square.fill"
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
        name="department"
        options={{
          title: "الفروع",
          href: null,
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
