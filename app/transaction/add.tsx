import BouncyCheckbox from "react-native-bouncy-checkbox";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { panHandlerName } from "react-native-gesture-handler/lib/typescript/handlers/PanGestureHandler";

export default function addTransaction() {
  const palette = useThemePalette();
  return (
    <>
      <Stack.Screen
        name="new-transaction"
        options={{ title: "New transaction" }}
      />
      <ScrollView style={{ maxHeight: "100%" }}>
        <ThemedView style={styles.container}>
          <View
            style={[styles.sectionContainer, { backgroundColor: palette.tint }]}
          >
            <ThemedText type="l">Sender</ThemedText>
            <View style={{ paddingTop: 10, gap: 15 }}>
              <ThemedTextInput placeholder="Name" autoComplete="name" />
              <ThemedTextInput
                placeholder="Email"
                autoComplete="email"
                keyboardType="email-address"
              />
              <ThemedTextInput
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View
            style={[styles.sectionContainer, { backgroundColor: palette.tint }]}
          >
            <ThemedText type="l">Reciever</ThemedText>
            <View style={{ paddingTop: 10, gap: 15 }}>
              <ThemedTextInput placeholder="Name" autoComplete="name" />
              <ThemedTextInput
                placeholder="Email"
                autoComplete="email"
                keyboardType="email-address"
              />
              <ThemedTextInput
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View
            style={[styles.sectionContainer, { backgroundColor: palette.tint }]}
          >
            <ThemedText type="l">Transaction</ThemedText>
            <View style={{ paddingTop: 10, gap: 15 }}>
              <ThemedTextInput placeholder="Amount" keyboardType="numeric" />
              <View
                style={{
                  borderWidth: 1.5,
                  borderRadius: 30,
                  borderColor: palette.text,
                }}
              >
                <Picker
                  placeholder="Currency"
                  dropdownIconColor={palette.text}
                  style={{
                    color: palette.text,
                    fontSize: 10,
                  }}
                >
                  <Picker.Item label="USD-United States Dollar" value="usd" />
                  <Picker.Item label="EUR-European Euro" value="eur" />
                  <Picker.Item label="TND-Tunisian Dinar" value="tnd" />
                </Picker>
              </View>
              <ThemedTextInput
                placeholder="Exchange rate"
                keyboardType="numeric"
              />
              <BouncyCheckbox
                text="Transaction payed"
                textStyle={{ textDecorationLine: "none", color: palette.text }}
                fillColor={palette.accent}
              />
            </View>
          </View>

          <ThemedButton>
            <ThemedText style={{ textAlign: "center" }}>Submit</ThemedText>
          </ThemedButton>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 20,
  },
  sectionContainer: {
    padding: 15,
    borderRadius: 15,
  },
});
