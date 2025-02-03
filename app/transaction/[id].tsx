import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const palette = useThemePalette();
  return (
    <>
      <Stack.Screen
        name="transaction-details"
        options={{ title: "Transaction Details" }}
      />
      <ThemedView style={{ padding: 5 }}>
        <ThemedText
          type="sm"
          style={{ textAlign: "right", opacity: 0.7, marginHorizontal: 5 }}
        >
          REF: {id}
        </ThemedText>
        <View>
          <ThemedText
            type="l"
            weight="semi-bold"
            style={{
              opacity: 0.7,
              borderBottomWidth: 1.5,
              borderBottomColor: palette.tint,
            }}
          >
            Transaction
          </ThemedText>
          <View style={{ padding: 10, gap: 10 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText>
                Amount:{" "}
                <ThemedText type="xl" weight="semi-bold">
                  $320
                </ThemedText>
              </ThemedText>
              <ThemedText style={{ opacity: 0.7 }}>2024-05-22</ThemedText>
            </View>
            <ThemedText>
              Fee: <ThemedText>3.4%</ThemedText>
            </ThemedText>
            <ThemedText>
              Status:{" "}
              <ThemedText type="l" style={{ color: palette.error }}>
                FAILED
              </ThemedText>
            </ThemedText>
          </View>
        </View>
        <View>
          <ThemedText
            type="l"
            weight="semi-bold"
            style={{
              opacity: 0.7,
              borderBottomWidth: 1.5,
              borderBottomColor: palette.tint,
            }}
          >
            Sender
          </ThemedText>
          <View style={{ padding: 10 }}>
            <ThemedText type="sm" style={{ opacity: 0.7 }}>
              ID: af33748a-3938-49f3
            </ThemedText>
            <ThemedText>John Doe</ThemedText>
            <ThemedText>42 Oakwood Avenue</ThemedText>
          </View>
        </View>
        <View>
          <ThemedText
            type="l"
            weight="semi-bold"
            style={{
              opacity: 0.7,
              borderBottomWidth: 1.5,
              borderBottomColor: palette.tint,
            }}
          >
            Reciever
          </ThemedText>
          <View style={{ padding: 10 }}>
            <ThemedText type="sm" style={{ opacity: 0.7 }}>
              ID: af33748a-3938-49f3
            </ThemedText>
            <ThemedText>Michael Brown</ThemedText>
            <ThemedText>89 Park Lane</ThemedText>
          </View>
        </View>
        <ThemedButton style={{ marginTop: 10 }}>
          <ThemedText
            style={{ color: palette.background, textAlign: "center" }}
          >
            Export PDF
          </ThemedText>
        </ThemedButton>
      </ThemedView>
    </>
  );
}
