import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, View } from "react-native";
import DatePicker from "react-native-date-picker";

import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { newReportSchema, NewReportType } from "@/utils/schemas";
import { useNetInfo } from "@react-native-community/netinfo";


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

  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<NewReportType>({
    resolver: zodResolver(newReportSchema),
    defaultValues: {
      title: "",
      description: "",
      dateRangeType: "past30days",
      fromDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      toDate: new Date(),
    },
  });
  const {isInternetReachable} = useNetInfo()

  const dateRangeType = watch("dateRangeType");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  const [agentActivity, setAgentActivity] = useState<AgentActivityState>({
    firstTransactionDate: null,
    lastTransactionDate: null,
    hasTransactions: false,
  });

  const [existingReportCheck, setExistingReportCheck] =
    useState<ExistingReportCheckState>({ isChecking: false, exists: false });

  const getSessionAgentId = async (): Promise<string | null> => {
    const { data: session } = await supabase.auth.getSession();
    return session?.session?.user?.id ?? null;
  };

  useEffect(() => {
    const fetchAgentActivity = async () => {
      try {
        const agentId = await getSessionAgentId();
        if (!agentId) return Alert.alert("خطأ", "لا يمكن جلب المستخدم");

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
        console.error("Agent activity fetch failed:", error);
      }
    };

    fetchAgentActivity();
  }, []);

  const checkExistingReport = async (from: Date, to: Date) => {
    try {
      setExistingReportCheck({ isChecking: true, exists: false });

      const agentId = await getSessionAgentId();
      if (!agentId) return;

      const { data, error } = await supabase
        .from("reports")
        .select("id")
        .eq("agent_id", agentId)
        .eq("from_date", from.toISOString().split("T")[0])
        .eq("to_date", to.toISOString().split("T")[0])
        .maybeSingle();

      if (error) throw error;

      setExistingReportCheck({ isChecking: false, exists: !!data });
    } catch (error) {
      console.error("Report existence check failed:", error);
      setExistingReportCheck({ isChecking: false, exists: false });
    }
  };

  const updateDatesForRange = (type: string) => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (type) {
      case "today":
        from = new Date(today.setHours(0, 0, 0, 0));
        break;
      case "yesterday":
        from = new Date(today.setDate(today.getDate() - 1));
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case "past7days":
        from = new Date(today.setDate(today.getDate() - 7));
        break;
      case "past30days":
        from = new Date(today.setDate(today.getDate() - 30));
        break;
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        from = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setValue("fromDate", from);
    setValue("toDate", to);
    checkExistingReport(from, to);
  };

  useEffect(() => {
    if (dateRangeType !== "custom") {
      updateDatesForRange(dateRangeType);
    }
  }, [dateRangeType]);

  // useEffect(() => {
  //   if (dateRangeType === "custom") {
  //     checkExistingReport(fromDate, toDate);
  //   }
  // }, [fromDate, toDate]);

  const isDateRangeValid = (): boolean => {
    const { firstTransactionDate, lastTransactionDate } = agentActivity;
    if (!firstTransactionDate || !lastTransactionDate) return false;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    return !(to < firstTransactionDate || from > lastTransactionDate);
  };

  const onSubmit = async (data: NewReportType) => {
    if(isInternetReachable === false) {
      return Alert.alert("لايوجد إتصال أنترنات", "لايمكنك إضافة تقرير إلّى عند الأتصال بالأنترنات")
    }
    if (!isDateRangeValid()) {
      return Alert.alert("خطأ", "فترة التقرير لا تتطابق مع نشاط الوكيل");
    }
    if (existingReportCheck.exists) {
      return Alert.alert("خطأ", "يوجد تقرير مسبق لنفس الفترة");
    }

    try {
      const agentId = await getSessionAgentId();
      if (!agentId) return;

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
      console.error("Create report failed:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء إنشاء التقرير.");
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("ar-TN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const truncateToStartOfDay = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <ThemedTextInput
                  placeholder="عنوان التقرير"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={fieldState?.error?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <ThemedTextInput
                  placeholder="وصف التقرير (اختياري)"
                  multiline
                  numberOfLines={3}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={fieldState?.error?.message}
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
                <ThemedText
                  style={{ marginBottom: 8, fontSize: 12, color: "gray" }}
                >
                  يمكنك اختيار تاريخ بين{" "}
                  {formatDate(
                    new Date(agentActivity.firstTransactionDate || 0)
                  )}{" "}
                  و {formatDate(new Date())}
                </ThemedText>
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
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
                          setValue("dateRangeType", "custom");
                          onChange(truncateToStartOfDay(date));
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
