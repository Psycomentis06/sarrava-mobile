import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <>
      <Stack.Screen
        name="transaction-details"
        options={{ title: "Transaction Details" }}
      />
      <ThemedView>
        <ThemedText>Transaction: {id}</ThemedText>
      </ThemedView>
    </>
  );
}
