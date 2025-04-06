import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

export default function ReportDetailsScreen() {
  const palette = useThemePalette();
  const { report } = useLocalSearchParams();
  const rObj = JSON.parse(report as string);

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
            <ThemedText type="sm">الفترة: {rObj.from_date} إلى {rObj.to_date}</ThemedText>
          </View>

          <View style={{ marginVertical: 10 }}>
            <ThemedText type="md" weight="medium">تفاصيل المعاملات:</ThemedText>
            <ThemedText >إجمالي: {rObj.total_transactions}</ThemedText>
            <ThemedText >مؤكدة: {rObj.confirmed_transactions}</ThemedText>
            <ThemedText >قيد الانتظار: {rObj.pending_transactions}</ThemedText>
            <ThemedText >فشلت: {rObj.failed_transactions}</ThemedText>
            <ThemedText >أُلغيت: {rObj.canceled_transactions}</ThemedText>
          </View>

          <View style={{ marginTop: 10 }}>
            <ThemedText type="md" weight="medium">الإجماليات:</ThemedText>
            <ThemedText >المبلغ المؤكد (USD): ${rObj.confirmed_usd_amount}</ThemedText>
            <ThemedText >الأرباح المؤكدة (USD): ${rObj.confirmed_earnings_usd}</ThemedText>
          </View>

          <View style={{ marginTop: 20 }}>
            <ThemedText type="sm" style={{ opacity: 0.6 }}>
              تم الإنشاء في: {new Date(rObj.created_at).toLocaleString()}
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
