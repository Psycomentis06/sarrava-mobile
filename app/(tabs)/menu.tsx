import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Link, useNavigation } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export default function MoreOptions() {
  const navigation = useNavigation();
  const { accent, tint, text, error } = useThemePalette();
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
    <ThemedView>
      <ThemedText type="title" style={styles.mainTitle}>
        More Options
      </ThemedText>
      <View>
        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("settings")}
        >
          <IconSymbol
            size={24}
            name="gear"
            color={text}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ marginLeft: 5 }}>Settings</ThemedText>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <IconSymbol
            size={24}
            name="rectangle.portrait.and.arrow.right"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>
            Sign out
          </ThemedText>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <IconSymbol
            size={24}
            name="xmark.app"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>Exit</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
