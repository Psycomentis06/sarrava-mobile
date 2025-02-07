import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useNavigation } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MoreOptions() {
  const navigation = useNavigation();
  const { tint, text, error } = useThemePalette();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    mainTitle: {
      textAlign: "center",
      paddingVertical: 30,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: tint,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginVertical: 1,
    },
  });

  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View>
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("agent" as never)}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
        >
          <IconSymbol
            size={24}
            name="gear"
            color={text}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ marginLeft: 5 }}>الوكلاء</ThemedText>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("settings" as never)}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
        >
          <IconSymbol
            size={24}
            name="gear"
            color={text}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ marginLeft: 5 }}>الأعدادات</ThemedText>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
        >
          <IconSymbol
            size={24}
            name="rectangle.portrait.and.arrow.right"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>
            تسجيل الخروج
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
        >
          <IconSymbol
            size={24}
            name="xmark.app"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>
            أغلاق التطبيق
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
