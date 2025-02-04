import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Stack } from "expo-router";
import React from "react";

export default function addTransaction() {
  return (
    <>
      <Stack.Screen
        name="new-transaction"
        options={{ title: "New transaction" }}
      />
      <ThemedView>
        <ThemedText>New Transaction</ThemedText>
      </ThemedView>
    </>
  );
}
