import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Transaction } from "@/utils/models";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function TransactionDetailsScreen() {
  const palette = useThemePalette();
  const { id, transaction } = useLocalSearchParams();
  const tObj = JSON.parse(transaction as string) as Transaction;
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
              <ThemedText style={{ width: "70%" }}>{"#" + id}</ThemedText>
            </View>
            <View style={{ flexDirection: "row" }}>
              <ThemedText weight="bold" style={{ width: "30%" }}>
                بتاريخ :
              </ThemedText>
              <ThemedText>
                {new Date(tObj.created_at).toLocaleString()}
              </ThemedText>
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
                <ThemedText weight="medium">{`${tObj.receiver?.firstname} ${tObj.receiver?.lastname}`}</ThemedText>
                <ThemedText>{tObj.receiver?.phone}</ThemedText>
                <ThemedText>{tObj.receiver?.email}</ThemedText>
                <ThemedText>{tObj.receiver?.address}</ThemedText>
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
                <ThemedText>{`${tObj.sender?.firstname} ${tObj.sender?.lastname}`}</ThemedText>
                <ThemedText>{tObj.sender?.phone}</ThemedText>
                <ThemedText>{tObj.sender?.email}</ThemedText>
                <ThemedText>{tObj.sender?.address}</ThemedText>
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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                المبلغ الجملي
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.accent, textAlign: "center" }}
                  >
                    {`${Math.round(tObj.amount_usd)} USD`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {`${Math.round(tObj.original_amount)} ${
                      tObj.currency.sign
                    }`}
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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                {tObj.is_paid_full
                  ? "تم أستلام المبلغ كاملا"
                  : "تم أستلام القسط الأوّل بقيمة"}
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.accent, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `${Math.round(tObj.amount_usd)} USD`
                      : `${Math.round(
                          tObj.first_installment ?? 0 * tObj.exchange_rate
                        )} USD`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `${Math.round(tObj.original_amount)} ${
                          tObj.currency.sign
                        }`
                      : `${Math.round(tObj.first_installment ?? 0)} ${
                          tObj.currency.sign
                        }`}
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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                المبلغ المتبقي
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.error, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? "0"
                      : `${Math.round(
                          tObj.amount_usd -
                            (tObj.first_installment ?? 0 * tObj.exchange_rate)
                        )} USD`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `0 ${tObj.currency.sign}`
                      : `${Math.round(
                          tObj.original_amount - (tObj.first_installment ?? 0)
                        )} ${tObj.currency.sign}`}
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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
              سعر المعاملة (سعر أضافي) :
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.error, textAlign: "center" }}
                  >
                    {`${Math.round((tObj.operation_cost_usd + tObj.operation_tax_usd) * 100) / 100} USD`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {`${Math.round((tObj.operation_cost_original + tObj.operation_tax_original) * 100) / 100} ${tObj.currency.sign}`}
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
              <ThemedTextInput value={tObj.pin_code?.toString()} keyboardType="numeric" />
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
