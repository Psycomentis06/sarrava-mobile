import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, View } from "react-native";
import DatePicker from "react-native-date-picker";

import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useUserProfile } from "@/contexts/profile";
import { useDepartments } from "@/hooks/useDepartments";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
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
const ALL_DEPS_ID = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";
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
  const {hasPermission: isAdmin} = useSupabaseHasPermissions(["admin"]);
  const { departments } = useDepartments();
  const { profile } = useUserProfile();

  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<NewReportType>({
    resolver: zodResolver(newReportSchema),
    defaultValues: {
      title: "",
      description: "",
      dateRangeType: "past30days",
      fromDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      toDate: new Date()
    },
  });
  const { isInternetReachable } = useNetInfo();

  const dateRangeType = watch("dateRangeType");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");
  const targetDepartmentId = watch("department");

  const [agentActivity, setAgentActivity] = useState<AgentActivityState>({
    firstTransactionDate: null,
    lastTransactionDate: null,
    hasTransactions: false,
  });

  const [existingReportCheck, setExistingReportCheck] =
    useState<ExistingReportCheckState>({ isChecking: false, exists: false });

  const getSessionAgentId = async (): Promise<string | null> => {
    return profile?.user_id || null;
  };

  const agentDepartments = useMemo(
    () =>
      departments.filter((d) =>
        profile?.departments?.map((ad) => ad.department_id).includes(d.id)
      ),
    [profile, departments]
  );

  useEffect(() => {
    if (isAdmin) {
      setValue('department', ALL_DEPS_ID)
    } else {
      setValue('department', agentDepartments.at(0)?.id)
    }
  }, [isAdmin])

  const fetchDepartmentActivity = async () => {
    try {
      let data: any = null;
      let error: any = null;
      if (targetDepartmentId === ALL_DEPS_ID) {
        const { data: d, error: e } = await supabase
          .rpc("get_global_transaction_activity")
          .single();
        data = d;
        error = e;
      } else if (targetDepartmentId) {
        const { data: d, error: e } = await supabase
          .from("transactions_department_stats_view")
          .select("first_transaction_date, last_transaction_date")
          .eq("department_id", targetDepartmentId)
          .single();
        data = d;
        error = e;
      }

      if (error) {
        throw error;
      }

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
      } else {
        setAgentActivity({
          firstTransactionDate: null,
          lastTransactionDate: null,
          hasTransactions: false,
        });
      }
    } catch (error) {
      console.error("Department activity fetch failed:", error);
      setAgentActivity({
        firstTransactionDate: null,
        lastTransactionDate: null,
        hasTransactions: false,
      });
    }
  };

  useEffect(() => {
    fetchDepartmentActivity();
  }, [targetDepartmentId]);

  const checkExistingReport = async (from: Date, to: Date) => {
    try {
      setExistingReportCheck({ isChecking: true, exists: false });

      if (!targetDepartmentId) return;

      const query = supabase
        .from("reports")
        .select("id")
        .eq("from_date", from.toISOString().split("T")[0])
        .eq("to_date", to.toISOString().split("T")[0])

        if (targetDepartmentId) {
          query.eq("department_id", targetDepartmentId)
        }

      const { data, error } = await query.maybeSingle();
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
    if (isInternetReachable === false) {
      return Alert.alert(
        "لاتوجد اتصال أنترنت",
        "لايمكن إضافة تقرير إلّى عند التصال بالأنترنت"
      );
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

      if (!targetDepartmentId) return;

      const { data: reportId, error } = await supabase.rpc("generate_report", {
        p_agent_id: agentId,
        p_title: data.title,
        p_description: data.description || "",
        p_from_date: data.fromDate.toISOString().split("T")[0],
        p_to_date: data.toDate.toISOString().split("T")[0],
        p_department_id:
          targetDepartmentId === ALL_DEPS_ID ? null : targetDepartmentId,
      });

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
              <ThemedText style={{ marginBottom: 8 }}>الفرع</ThemedText>
              <Controller
                name="department"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={{ color: palette.text }}
                    dropdownIconColor={palette.text}
                  >
                    {isAdmin && (
                      <Picker.Item
                        key="all"
                        label="تقرير شامل"
                        value={ALL_DEPS_ID}
                      />
                    )}
                    {isAdmin &&
                      departments &&
                      departments.map((d) => (
                        <Picker.Item
                          key={d.id}
                          label={`${d.name}|${d.country_ar}`}
                          value={d.id}
                        />
                      ))}
                    {!isAdmin &&
                      departments &&
                      agentDepartments &&
                      agentDepartments.map((d) => (
                        <Picker.Item
                          key={d.id}
                          label={`${d.name}|${d.country_ar}`}
                          value={d.id}
                        />
                      ))}
                  </Picker>
                )}
              />
            </View>

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
                    style={{
                      color: palette.text,
                      opacity: agentActivity.hasTransactions ? 1 : 0.5,
                    }}
                    dropdownIconColor={palette.text}
                    enabled={agentActivity.hasTransactions}
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
                {agentActivity.hasTransactions && (
                  <ThemedText
                    style={{ marginBottom: 8, fontSize: 12, color: "gray" }}
                  >
                    يمكنك اختيار تاريخ بين{" "}
                    {formatDate(
                      new Date(agentActivity.firstTransactionDate || 0)
                    )}{" "}
                    و {formatDate(new Date())}
                  </ThemedText>
                )}
                {!agentActivity.hasTransactions && (
                  <ThemedText
                    style={{
                      marginBottom: 8,
                      fontSize: 12,
                      color: palette.error,
                    }}
                  >
                    لا توجد معاملات لإنشاء تقرير للفرع المحدّد
                  </ThemedText>
                )}
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Pressable
                      onPress={() => setShowFromDatePicker(true)}
                      disabled={!agentActivity.hasTransactions}
                      style={{
                        backgroundColor: palette.tint,
                        borderRadius: 8,
                        padding: 15,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        opacity: agentActivity.hasTransactions ? 1 : 0.5,
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
                      disabled={!agentActivity.hasTransactions}
                      style={{
                        backgroundColor: palette.tint,
                        borderRadius: 8,
                        padding: 15,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        opacity: agentActivity.hasTransactions ? 1 : 0.5,
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
