import { useUserProfile } from "@/contexts/profile";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { supabase } from "@/lib/supabase";
import {
    GOVERNMENT_TAX_RATE,
    PRICING_TIERS,
    TransactionPricingTierFeeType,
} from "@/services/transactions";
import { Currency } from "@/utils/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeesExplanationScreen() {
  const palette = useThemePalette();
  const { profile } = useUserProfile();
  const [userCurrency, setUserCurrency] = useState<Currency | null>(null);
  const [useLocalCurrency, setUseLocalCurrency] = useState(false);
  const insets = useSafeAreaInsets();

  const getCurrency = async () => {
    if (!profile?.currency) {
      return;
    }
    const { data, error } = await supabase
      .from("currencies")
      .select()
      .eq("id", profile.currency)
      .single();

    if (error) {
      console.error(error);
      return;
    }
    if (data) {
      const currency: Currency = data;
      setUserCurrency(currency);
    }
  };

  const convert = (amount: number) => {
    if (useLocalCurrency && userCurrency?.to_dollar_rate) {
      return amount / userCurrency.to_dollar_rate;
    }
    return amount;
  };

  const formatAmount = (amount: number) => {
    const symbol = useLocalCurrency && userCurrency ? userCurrency.sign : "USD";
    return `${symbol} ${convert(amount).toFixed(2)}`;
  };

  useEffect(() => {
    getCurrency();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "شرح الرسوم" }} />
      <ScrollView
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <ThemedView style={{ padding: 15, backgroundColor: palette.tint }}>
          <View style={{ marginBottom: 15 }}>
            <BouncyCheckbox
              size={25}
              fillColor={palette.accent}
              unFillColor="#FFFFFF"
              text={
                userCurrency
                  ? `عرض بالعملة الحساب (${userCurrency.sign})`
                  : "لا توجد عملة محددة"
              }
              iconStyle={{ borderColor: palette.accent }}
              textStyle={{ textDecorationLine: "none" }}
              isChecked={useLocalCurrency}
              disabled={userCurrency == null}
              onPress={() => {
                if (userCurrency) setUseLocalCurrency(!useLocalCurrency);
              }}
            />
          </View>

          <ThemedText type="xl" weight="bold" style={{ marginBottom: 10 }}>
            تسعيرة المعاملات
          </ThemedText>

          {PRICING_TIERS.map((tier, index) => {
            const min =
              index === 0 ? 0 : PRICING_TIERS[index - 1].maxAmount + 0.01;
            const max = tier.maxAmount;
            const rangeText =
              max === Infinity
                ? `أكثر من ${formatAmount(min)}`
                : `${formatAmount(min)} – ${formatAmount(max)}`;
            const feeText =
              tier.feeType === TransactionPricingTierFeeType.FIXED
                ? `رسوم ثابتة: ${formatAmount(tier.fee)}`
                : `نسبة: ${(tier.fee * 100).toFixed(2)}%`;

            return (
              <View
                key={index}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.accent,
                }}
              >
                <ThemedText type="md" weight="medium">
                  {rangeText}
                </ThemedText>
                <ThemedText>{feeText}</ThemedText>
              </View>
            );
          })}

          <View style={{ marginTop: 20 }}>
            <ThemedText type="xl" weight="bold" style={{ marginBottom: 10 }}>
              الضريبة الحكومية
            </ThemedText>
            <ThemedText>
              يتم تطبيق نسبة ضريبة حكومية قدرها{" "}
              {(GOVERNMENT_TAX_RATE * 100).toFixed(2)}٪ على كل معاملة.
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
