import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useUserProfile } from "@/contexts/profile";
import { useAgents } from "@/hooks/useAgents";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { getConvertedAmount } from "@/services/transactions";
import { Report } from "@/utils/models";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, View } from "react-native";

export default function ReportDetailsScreen() {
  const palette = useThemePalette();
  const { report } = useLocalSearchParams();
  const rObj: Report = JSON.parse(report as string);
  const { departments, isLoading: isDepLoading } = useDepartments();
  const { agents, isLoading: isAgentLoading } = useAgents();
  const { profile } = useUserProfile();
  const { currencies } = useCurrencies();

  const usd = currencies.find((c) => c.sign.toUpperCase() === "USD");
  const profileCurrency = currencies.find((c) => c.id === profile?.currency);

  const creator = useMemo(
    () => agents?.find((a) => a.user_id === rObj.agent_id),
    [agents]
  );
  const department = useMemo(
    () => departments?.find((d) => d.id === rObj?.department_id),
    [departments]
  );

  return (
    <>
      <Stack.Screen options={{ title: "تفاصيل التقرير" }} />
      <ScrollView>
        <ThemedView style={{ padding: 15, backgroundColor: palette.tint }}>
          <ThemedText type="xl" weight="bold" style={{ marginBottom: 10 }}>
            {rObj.title}
          </ThemedText>

          <ThemedText type="md" style={{ marginBottom: 10, opacity: 0.8 }}>
            {rObj.description}
          </ThemedText>

          <View style={{ marginBottom: 10 }}>
            <ThemedText type="sm">
              الفترة: {rObj.from_date} إلى {rObj.to_date}
            </ThemedText>
          </View>

          <View style={{ marginVertical: 10 }}>
            <ThemedText type="md" weight="medium">
              تفاصيل المعاملات:
            </ThemedText>
            <ThemedText>إجمالي: {rObj.total_transactions}</ThemedText>
            <ThemedText>قيد الانتظار: {rObj.pending_transactions}</ThemedText>
            <ThemedText>مجمّدة: {rObj.blocked_transactions}</ThemedText>
            <ThemedText>
              دفعة للحريف (جزئيا أو كليا): {rObj.blocked_transactions}
            </ThemedText>
            <ThemedText>مؤكدة: {rObj.confirmed_transactions}</ThemedText>
            <ThemedText>
              مكتملة (دفعة كاملا): {rObj.completed_transactions}
            </ThemedText>
            <ThemedText>فشلت: {rObj.failed_transactions}</ThemedText>
            <ThemedText>أُلغيت: {rObj.canceled_transactions}</ThemedText>
          </View>

          <View style={{ marginTop: 10 }}>
            <ThemedText type="md" weight="medium">
              الإجماليات:
            </ThemedText>
            <ThemedText>
              القيمة الإجماليات للمعاملات المكتملة :{" "}
              {usd && profileCurrency
                ? `${
                    Math.round(
                      getConvertedAmount(
                        rObj.completed_usd_amount,
                        usd,
                        profileCurrency
                      ) * 100
                    ) / 100
                  } ${profileCurrency.sign}`
                : `${Math.round(rObj.confirmed_usd_amount * 100) / 100} $`}
            </ThemedText>
            <ThemedText>
              الأرباح للمعاملات المكتملة :{" "}
              {usd && profileCurrency
                ? `${
                    Math.round(
                      getConvertedAmount(
                        rObj.completed_earnings_usd,
                        usd,
                        profileCurrency
                      ) * 100
                    ) / 100
                  } ${profileCurrency.sign}`
                : `${Math.round(rObj.completed_earnings_usd * 100) / 100} $`}
            </ThemedText>
          </View>

          {rObj.department_id === null && (
            <ThemedText
              type="md"
              weight="medium"
              style={{ color: palette.accent, marginTop: 10 }}
            >
              تقرير شامل
            </ThemedText>
          )}
          {rObj.department_id !== null && (
            <View style={{ marginTop: 10 }}>
              <ThemedText type="md" weight="medium">
                الفرع:
              </ThemedText>
              {department && (
                <>
                  <ThemedText>الاسم : {department?.name}</ThemedText>
                  <ThemedText>
                    العنوان :{" "}
                    {`${department?.country_ar} | ${department?.city} | ${department?.address} | ${department?.zipcode}`}
                  </ThemedText>
                </>
              )}
              {!department && (
                <ThemedText style={{ color: palette.error }}>
                  لم يتمّ التعرّف على الفرع
                </ThemedText>
              )}
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <ThemedText type="sm" style={{ opacity: 0.6 }}>
              تم إنشاء التقرير من قبل{" "}
              {creator && (
                <ThemedText style={{ color: palette.accent }} weight="bold">
                  {`${creator?.firstname} ${creator?.lastname}`}
                </ThemedText>
              )}
              {!creator && (
                <ThemedText style={{ color: palette.error }} weight="bold">
                  لم تم التعرّف على الوكيل
                </ThemedText>
              )}{" "}
              بتاريخ{" "}
              <ThemedText style={{ color: palette.accent }} weight="bold">
                {new Date(rObj.created_at).toLocaleString()}
              </ThemedText>
              تم :
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
