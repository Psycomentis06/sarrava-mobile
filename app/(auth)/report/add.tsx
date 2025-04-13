import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, View } from "react-native";
import DatePicker from "react-native-date-picker";
import { z } from "zod";

import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";

// Validation schema for new report
const newReportSchema = z
  .object({
    title: z.string().min(1, "العنوان مطلوب"),
    description: z.string().optional(),
    dateRangeType: z.enum([
      "custom",
      "today",
      "yesterday",
      "past7days",
      "past30days",
      "thisMonth",
      "lastMonth",
      "thisYear",
    ]),
    fromDate: z.date(),
    toDate: z.date(),
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
    path: ["fromDate"],
  });

type NewReportType = z.infer<typeof newReportSchema>;

type DateRangeOption = {
  label: string;
  value: string;
};

interface AgentActivityState {
  firstTransactionDate: Date | null;
  lastTransactionDate: Date | null;
  hasTransactions: boolean;
}

interface ExistingReportCheckState {
  isChecking: boolean;
  exists: boolean;
}

const DATE_RANGE_OPTIONS = [
  { label: "اليوم", value: "today" },
  { label: "أمس", value: "yesterday" },
  { label: "آخر 7 أيام", value: "past7days" },
  { label: "آخر 30 يوم", value: "past30days" },
  { label: "هذا الشهر", value: "thisMonth" },
  { label: "الشهر الماضي", value: "lastMonth" },
  { label: "هذه السنة", value: "thisYear" },
  { label: "تحديد مخصص", value: "custom" },
];

export default function CreateReportScreen() {
  const palette = useThemePalette();
  const router = useRouter();
  const [agentActivity, setAgentActivity] = useState<AgentActivityState>({
    firstTransactionDate: null,
    lastTransactionDate: null,
    hasTransactions: false,
  });
  const [showFromDatePicker, setShowFromDatePicker] = useState<boolean>(false);
  const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);
  const [existingReportCheck, setExistingReportCheck] =
    useState<ExistingReportCheckState>({
      isChecking: false,
      exists: false,
    });

  const { control, handleSubmit, watch, setValue, formState } =
    useForm<NewReportType>({
      resolver: zodResolver(newReportSchema),
      defaultValues: {
        title: "",
        description: "",
        dateRangeType: "past30days",
        fromDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        toDate: new Date(),
      },
    });

  const dateRangeType = watch("dateRangeType");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  // Fetch agent's activity range on mount
  useEffect(() => {
    fetchAgentActivityRange();
  }, []);

  const fetchAgentActivityRange = async () => {
    try {
      // Assuming you have the current agent's ID stored somewhere
      const { data: session } = await supabase.auth.getSession();
      const agentId = session?.session?.user?.id;

      if (!agentId) {
        Alert.alert("خطأ", "لم يتم العثور على بيانات المستخدم");
        return;
      }

      const { data, error } = await supabase
        .from("transactions_agent_stats_view")
        .select("first_transaction_date, last_transaction_date")
        .eq("agent_id", agentId)
        .single();

      if (error) throw error;

      if (data) {
        setAgentActivity({
          firstTransactionDate: data.first_transaction_date
            ? new Date(data.first_transaction_date)
            : null,
          lastTransactionDate: data.last_transaction_date
            ? new Date(data.last_transaction_date)
            : null,
          hasTransactions: !!data.first_transaction_date,
        });
      }
    } catch (error) {
      console.error("Error fetching agent activity range:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء جلب بيانات النشاط");
    }
  };

  const checkExistingReport = async (fromDate: Date, toDate: Date) => {
    try {
      setExistingReportCheck({ isChecking: true, exists: false });

      const { data: session } = await supabase.auth.getSession();
      const agentId = session?.session?.user?.id;

      const fromDateCopy = new Date(fromDate);
      const toDateCopy = new Date(toDate);

      const { data, error } = await supabase
        .from("reports")
        .select("id")
        .eq("agent_id", agentId)
        .eq("from_date", fromDateCopy.toISOString().split("T")[0])
        .eq("to_date", toDateCopy.toISOString().split("T")[0])
        .maybeSingle();

      if (error) throw error;

      setExistingReportCheck({
        isChecking: false,
        exists: !!data,
      });
    } catch (error) {
      console.error("Error checking existing report:", error);
      setExistingReportCheck({ isChecking: false, exists: false });
    }
  };

  // When date range type changes, update the dates
  useEffect(() => {
    const today = new Date();
    let newFromDate = fromDate;
    let newToDate = today;

    if (dateRangeType === "custom") {
      return;
    }
    switch (dateRangeType) {
      case "today":
        newFromDate = new Date(today.setHours(0, 0, 0, 0));
        newToDate = new Date();
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        newFromDate = new Date(yesterday.setHours(0, 0, 0, 0));
        newToDate = new Date(yesterday.setHours(23, 59, 59, 999));
        break;
      case "past7days":
        newFromDate = new Date(new Date().setDate(today.getDate() - 7));
        break;
      case "past30days":
        newFromDate = new Date(new Date().setDate(today.getDate() - 30));
        break;
      case "thisMonth":
        newFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        newFromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newToDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        newFromDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        // Custom - don't change dates
        break;
    }
    setValue("fromDate", newFromDate);
    setValue("toDate", newToDate);
    checkExistingReport(newFromDate, newToDate);
  }, [dateRangeType]);

  useEffect(() => {
    if (dateRangeType === "custom") {
      checkExistingReport(fromDate, toDate);
    }
  }, [
    dateRangeType === "custom" && fromDate,
    dateRangeType === "custom" && toDate,
  ]);

  const isDateRangeValid = (): boolean => {
    if (!agentActivity.hasTransactions) return false;

    // Check if selected date range is within agent's activity period
    const selectedFromDate = new Date(fromDate);
    selectedFromDate.setHours(0, 0, 0, 0);

    const selectedToDate = new Date(toDate);
    selectedToDate.setHours(23, 59, 59, 999);

    // Only proceed if we have valid dates
    if (
      !agentActivity.firstTransactionDate ||
      !agentActivity.lastTransactionDate
    ) {
      return false;
    }

    const firstDate = new Date(agentActivity.firstTransactionDate);
    const lastDate = new Date(agentActivity.lastTransactionDate);

    // Check for overlap with activity range
    return !(selectedToDate < firstDate || selectedFromDate > lastDate);
  };

  const onSubmit = async (data: NewReportType) => {
    try {
      if (!isDateRangeValid()) {
        Alert.alert("خطأ", "فترة التقرير لا تتطابق مع فترة نشاط الوكيل");
        return;
      }

      if (existingReportCheck.exists) {
        Alert.alert("خطأ", "يوجد تقرير مسبق لنفس الفترة الزمنية");
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      const agentId = session?.session?.user?.id;

      // Call the generate_agent_report function
      const { data: reportId, error } = await supabase.rpc(
        "generate_agent_report",
        {
          p_agent_id: agentId,
          p_title: data.title,
          p_description: data.description || "",
          p_from_date: data.fromDate.toISOString().split("T")[0],
          p_to_date: data.toDate.toISOString().split("T")[0],
        }
      );

      if (error) throw error;

      Alert.alert("نجاح", "تم إنشاء التقرير بنجاح");
      router.replace({
        pathname: "/(auth)/(tabs)/reports",
        params: { id: reportId },
      });
    } catch (error) {
      console.error("Error creating report:", error);
      Alert.alert(
        "خطأ",
        "حدث خطأ أثناء إنشاء التقرير. يرجى المحاولة مرة أخرى."
      );
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "إنشاء تقرير جديد" }} />
      <ScrollView>
        <ThemedView
          style={{
            width: "100%",
            minHeight: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ width: "100%", padding: 10, gap: 20 }}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: palette.accent,
                alignSelf: "center",
                overflow: "hidden",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconSymbol
                name="chart.bar.fill"
                size={56}
                color={palette.background}
              />
              <ThemedText
                style={{ color: palette.background, textAlign: "center" }}
              >
                تقرير جديد
              </ThemedText>
            </View>

            <Controller
              name="title"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ThemedTextInput
                  placeholder="عنوان التقرير"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ThemedTextInput
                  placeholder="وصف التقرير (اختياري)"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.description?.message}
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />
              )}
            />

            <View
              style={{
                backgroundColor: palette.tint,
                borderRadius: 8,
                padding: 10,
              }}
            >
              <ThemedText style={{ marginBottom: 8 }}>
                نوع الفترة الزمنية
              </ThemedText>
              <Controller
                name="dateRangeType"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={{ color: palette.text }}
                    dropdownIconColor={palette.text}
                  >
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                )}
              />
            </View>

            {dateRangeType === "custom" && (
              <View style={{ gap: 15 }}>
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field: { value } }) => (
                    <Pressable
                      onPress={() => setShowFromDatePicker(true)}
                      style={{
                        backgroundColor: palette.tint,
                        borderRadius: 8,
                        padding: 15,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText>من تاريخ</ThemedText>
                      <ThemedText>{formatDate(value)}</ThemedText>
                      <DatePicker
                        modal
                        open={showFromDatePicker}
                        date={value}
                        mode="date"
                        minimumDate={
                          agentActivity.firstTransactionDate || undefined
                        }
                        maximumDate={new Date()}
                        onConfirm={(date) => {
                          setShowFromDatePicker(false);
                          setValue("fromDate", date);
                        }}
                        onCancel={() => {
                          setShowFromDatePicker(false);
                        }}
                      />
                    </Pressable>
                  )}
                />

                <Controller
                  name="toDate"
                  control={control}
                  render={({ field: { value } }) => (
                    <Pressable
                      onPress={() => setShowToDatePicker(true)}
                      style={{
                        backgroundColor: palette.tint,
                        borderRadius: 8,
                        padding: 15,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText>إلى تاريخ</ThemedText>
                      <ThemedText>{formatDate(value)}</ThemedText>
                      <DatePicker
                        modal
                        open={showToDatePicker}
                        date={value}
                        mode="date"
                        minimumDate={fromDate || undefined}
                        maximumDate={new Date()}
                        onConfirm={(date) => {
                          setShowToDatePicker(false);
                          setValue("toDate", date);
                        }}
                        onCancel={() => {
                          setShowToDatePicker(false);
                        }}
                      />
                    </Pressable>
                  )}
                />
              </View>
            )}

            {!agentActivity.hasTransactions && (
              <ThemedText style={{ color: "red", textAlign: "center" }}>
                لا توجد معاملات لإنشاء تقرير
              </ThemedText>
            )}

            {existingReportCheck.exists && (
              <ThemedText style={{ color: "orange", textAlign: "center" }}>
                يوجد تقرير مسبق لنفس الفترة الزمنية
              </ThemedText>
            )}

            <ThemedButton
              onPress={handleSubmit(onSubmit)}
              disabled={
                !agentActivity.hasTransactions || existingReportCheck.exists
              }
              style={{
                opacity:
                  !agentActivity.hasTransactions || existingReportCheck.exists
                    ? 0.5
                    : 1,
              }}
            >
              <ThemedText
                style={{ textAlign: "center", color: palette.background }}
              >
                إنشاء التقرير
              </ThemedText>
            </ThemedButton>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
