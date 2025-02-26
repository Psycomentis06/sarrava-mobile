import ArrowsExchange from "@/components/svg/ArrowsExchange";
import ArrowV from "@/components/svg/ArrowV";
import Exchange from "@/components/svg/Exchange";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

export default function TransactionDetailsScreen() {
  const palette = useThemePalette();
  const { id } = useLocalSearchParams();
  return (
    <>
      <Stack.Screen options={{ title: "تفاصيل المعاملة" }} />
      <ScrollView>
        <ThemedView style={{ padding: 10, backgroundColor: palette.tint }}>
          <View
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText type="l" weight="bold">
                ملخص المعاملة
              </ThemedText>
              <Pressable android_ripple={{ color: "rgba(0,0,0,0.26)" }}>
                <IconSymbol
                  name="square.and.arrow.down"
                  size={24}
                  color={palette.accent}
                />
              </Pressable>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                عدد المعاملة
              </ThemedText>
              <ThemedText style={{ width: "50%" }}>#963258741</ThemedText>
              <ThemedText type="sm">2025-02-18</ThemedText>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                المستفيد
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText>أبراهيم ولد يوسف</ThemedText>
                <ThemedText>+222 45 896 321</ThemedText>
                <ThemedText>ibrahemweldyoussef@mail.com</ThemedText>
                <ThemedText>حي الوحدة,نواكشوط, موريتانيا</ThemedText>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                المرسل
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText>محمد أمين ولد الحاج</ThemedText>
                <ThemedText>+222 45 900 300</ThemedText>
                <ThemedText>mohamedamine@mail.com</ThemedText>
                <ThemedText>
                  شارع المقاومة, تفرغ زينة, نواكشوط, موريتانيا
                </ThemedText>
              </View>
            </View>

            {/*Separator*/}
            <View
              style={{
                height: 5,
                borderTopColor: "rgba(0,0,0,0.5)",
                borderTopWidth: 0.75,
                borderStyle: "dashed",
                marginVertical: 20,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: palette.accent, fontWeight: "600" }}>
                المبلغ الجملي
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText type="l" style={{ color: palette.accent }}>
                    3000 USD
                  </ThemedText>
                  <ThemedText type="md" style={{ color: palette.success }}>
                    120460 MRU
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: palette.accent, fontWeight: "600" }}>
                تم أستلام القسط الأوّل بقيمة
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText type="l" style={{ color: palette.accent }}>
                    1500 USD
                  </ThemedText>
                  <ThemedText type="md" style={{ color: palette.success }}>
                    120460 MRU
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: palette.accent, fontWeight: "600" }}>
                المبلغ المتبقي
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText type="l" style={{ color: palette.error }}>
                    1500 USD
                  </ThemedText>
                  <ThemedText type="md" style={{ color: palette.success }}>
                    120460 MRU
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                height: 5,
                borderTopColor: "rgba(0,0,0,0.5)",
                borderTopWidth: 0.75,
                borderStyle: "dashed",
                marginVertical: 20,
              }}
            />

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ThemedText style={{ color: palette.accent, width: "60%" }}>
                الرمز السرّي للمعاملة
              </ThemedText>
              <ThemedTextInput value="23796" keyboardType="numeric" />
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
