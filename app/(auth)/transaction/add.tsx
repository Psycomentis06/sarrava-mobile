import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useUserProfile } from "@/contexts/profile";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useTransactions } from "@/hooks/useTransactions";
import { getExchangeRate } from "@/services/transactions";
import { hexToRgba } from "@/utils/colors";
import { Currency } from "@/utils/models";
import { newTransactionSchema, NewTransactionType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FormState,
  useForm,
  UseFormWatch,
} from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

type UserFormComponentProps = {
  title: string;
  control: Control<NewTransactionType>;
  formState: FormState<NewTransactionType>;
  type: "sender" | "receiver";
};

type TransactionFormComponentProps = {
  control: Control<NewTransactionType>;
  formState: FormState<NewTransactionType>;
  watch: UseFormWatch<NewTransactionType>;
  currencies: Currency[];
  defaultCurrency?: Currency;
};

function UserFormComponent({
  title,
  control,
  formState,
  type,
}: UserFormComponentProps) {
  const palette = useThemePalette();
  return (
    <View style={[styles.sectionContainer, { backgroundColor: palette.tint }]}>
      <LinearGradient
        colors={[palette.accent, "transparent"]}
        style={{
          padding: 5,
          borderRadius: 5,
        }}
        start={{ x: 1, y: 0 }}
      >
        <ThemedText
          type="l"
          weight="bold"
          style={{
            color: palette.background,
          }}
        >
          {title}
        </ThemedText>
      </LinearGradient>
      <View style={{ paddingTop: 10, gap: 15 }}>
        <Controller
          name={`${type}.firstname`}
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <ThemedTextInput
              placeholder="الأسم"
              autoComplete="name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                formState.isSubmitted
                  ? formState.errors[type]?.firstname?.message
                  : undefined
              }
            />
          )}
        />

        <Controller
          name={`${type}.lastname`}
          control={control}
          render={({ field: { onBlur, onChange, value } }) => (
            <ThemedTextInput
              placeholder="اللّقب"
              autoComplete="name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                formState.isSubmitted
                  ? formState.errors[type]?.lastname?.message
                  : undefined
              }
            />
          )}
        />

        <Controller
          name={`${type}.email`}
          control={control}
          render={({ field: { value, onChange, onBlur } }) => (
            <ThemedTextInput
              placeholder="بريد الألكتروني"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                formState.isSubmitted
                  ? formState.errors[type]?.email?.message
                  : undefined
              }
            />
          )}
        />

        <Controller
          name={`${type}.phone`}
          control={control}
          render={({ field: { value, onBlur, onChange } }) => (
            <ThemedTextInput
              placeholder="رقم الهاتف"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                formState.isSubmitted
                  ? formState.errors[type]?.phone?.message
                  : undefined
              }
            />
          )}
        />

        <Controller
          name={`${type}.address`}
          control={control}
          render={({ field: { onBlur, onChange, value } }) => (
            <ThemedTextInput
              placeholder="العنوان"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={
                formState.isSubmitted
                  ? formState.errors[type]?.address?.message
                  : undefined
              }
            />
          )}
        />
      </View>
    </View>
  );
}
function TransactionFormComponent({
  control,
  formState,
  watch,
  currencies,
  defaultCurrency,
}: TransactionFormComponentProps) {
  const palette = useThemePalette();
  const [priceInputFocused, setPriceInputFocused] = useState(false);
  const selectedCurrency = watch("price.selectedCurrency") as Currency;
  const totalPrice = watch("price.totalPrice");
  const isPaidFull = watch("price.isPaidFull");
  const operationCostPercent = watch("price.operationCostPercent");
  const operationCostFixed = watch("price.operationCostFixed");

  const getConvertedAmount = (
    amount: number,
    from: Currency,
    to: Currency
  ): number => {
    if (!amount || isNaN(amount)) return 0;
    const exchangeRate = getExchangeRate(from, to);
    return Math.round(amount * exchangeRate * 1e6) / 1e6;
  };

  // Calculate fees with detailed breakdown in selected currency
  const getFeeBreakdown = () => {
    const percent = Number(operationCostPercent) || 0;
    const fixed = Number(operationCostFixed) || 0;

    if (!selectedCurrency || !totalPrice || isNaN(totalPrice)) {
      return null;
    }

    try {
      const percentRate = percent / 100;

      const percentAmount = Math.round(totalPrice * percentRate * 100) / 100;
      const fixedAmount = Math.round(fixed * 100) / 100;

      const totalFee = Math.round((percentAmount + fixedAmount) * 100) / 100;

      return {
        percentAmount,
        fixedAmount,
        totalFee,
        formattedPercent: `${percent.toFixed(1)}%`,
        formattedFixed: `${selectedCurrency.sign}${fixedAmount}`,
      };
    } catch (error) {
      console.error("Fee breakdown calculation error:", error);
      return null;
    }
  };

  // Calculate fees breakdown
  const feeBreakdown = useMemo(
    () => getFeeBreakdown(),
    [selectedCurrency, totalPrice, operationCostFixed, operationCostPercent]
  );

  const renderFeeBreakdown = () => {
    if (!feeBreakdown || !selectedCurrency) return null;

    return (
      <View
        style={{
          backgroundColor: hexToRgba(palette.accent, 0.1),
          borderRadius: 8,
          padding: 10,
          marginTop: 5,
        }}
      >
        <ThemedText
          type="md"
          weight="bold"
          style={{ color: palette.accent, marginBottom: 5 }}
        >
          تفاصيل الرسوم :
        </ThemedText>

        <View style={{ marginLeft: 10 }}>
          <ThemedText type="sm">
            {`• النسبة (${feeBreakdown.formattedPercent}) : ${selectedCurrency.sign} ${feeBreakdown.percentAmount}`}
          </ThemedText>

          <ThemedText type="sm">
            {`• القيمة الثابتة : ${feeBreakdown.formattedFixed}`}
          </ThemedText>

          <ThemedText
            type="md"
            weight="bold"
            style={{ marginTop: 5, color: palette.accent }}
          >
            {`سعر المعاملة : ${selectedCurrency.sign} ${feeBreakdown.totalFee}`}
          </ThemedText>
        </View>
      </View>
    );
  };

  const getBorderColor = () => {
    if (formState.errors.price?.totalPrice) return palette.error;
    if (priceInputFocused) return palette.accent;
    return hexToRgba(palette.text, 0.3);
  };
  return (
    <View style={[styles.sectionContainer, { backgroundColor: palette.tint }]}>
      <LinearGradient
        colors={[palette.accent, "transparent"]}
        style={{
          padding: 5,
          borderRadius: 5,
        }}
        start={{ x: 1, y: 0 }}
      >
        <ThemedText
          type="l"
          weight="bold"
          style={{
            color: palette.background,
          }}
        >
          المبلغ
        </ThemedText>
      </LinearGradient>
      <View style={{ paddingTop: 10, gap: 15 }}>
        {/* Price input and currency selector */}
        <View
          style={{
            flexDirection: "row",
            borderWidth: 1,
            borderRadius: 10,
            borderColor: getBorderColor(),
          }}
        >
          <Controller
            name="price.totalPrice"
            control={control}
            render={({ field: { onBlur, onChange, value } }) => (
              <ThemedTextInput
                value={value ? value.toString() : undefined}
                placeholder="المبلغ الجملي"
                keyboardType="numeric"
                containerStyle={{
                  borderLeftWidth: 1,
                  width: "60%",
                }}
                style={{
                  borderWidth: 0,
                  borderRadius: 0,
                }}
                onFocus={() => setPriceInputFocused(true)}
                onBlur={() => {
                  setPriceInputFocused(false);
                  onBlur();
                }}
                onChangeText={onChange}
              />
            )}
          />
          <View style={{ width: "40%" }}>
            <Controller
              name="price.selectedCurrency"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <Picker
                  placeholder="العملة"
                  dropdownIconColor={palette.text}
                  style={{
                    color: palette.text,
                  }}
                  mode="dropdown"
                  onFocus={() => setPriceInputFocused(true)}
                  onBlur={() => {
                    setPriceInputFocused(false);
                    onBlur();
                  }}
                  selectedValue={value}
                  onValueChange={onChange}
                >
                  {currencies.map((c) => (
                    <Picker.Item key={c.name} label={c.sign} value={c} />
                  ))}
                </Picker>
              )}
            />
          </View>
        </View>
        {/* Exchange rate and converted amount display */}
        {defaultCurrency && selectedCurrency && (
          <View>
            <ThemedText
              type="sm"
              style={{
                textAlign: "right",
                paddingHorizontal: 10,
                transform: "translateY(-10px)",
              }}
            >
              {"1 " + selectedCurrency.sign} ={" "}
              {getExchangeRate(selectedCurrency, defaultCurrency) +
                " " +
                defaultCurrency.sign}
            </ThemedText>

            {!isNaN(totalPrice) &&
              !formState.errors.price?.totalPrice?.message && (
                <ThemedText weight="bold" style={{ color: palette.accent }}>
                  {totalPrice + " " + selectedCurrency.sign} ={" "}
                  {getConvertedAmount(
                    totalPrice,
                    selectedCurrency,
                    defaultCurrency
                  ) +
                    " " +
                    defaultCurrency.sign}
                </ThemedText>
              )}

            {formState.errors.price?.totalPrice?.message && (
              <ThemedText type="sm" style={{ color: palette.error }}>
                {formState.errors.price.totalPrice.message}
              </ThemedText>
            )}
          </View>
        )}

        {/* Transaction pricing */}
        <ThemedText type="subtitle" weight="bold">
          تسعيرة المعاملة
        </ThemedText>
        <View
          style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}
        >
          <Controller
            name="price.operationCostPercent"
            control={control}
            render={({
              field: { value, onChange, onBlur },
              fieldState: { error },
            }) => (
              <View
                style={{
                  width: "50%",
                  backgroundColor: hexToRgba(palette.accent, 0.1),
                  padding: 10,
                  borderRadius: 15,
                  borderColor: palette.accent,
                  borderWidth: value > 0 ? 1.5 : 0,
                }}
              >
                <ThemedText
                  weight="medium"
                  style={{
                    textAlign: "center",
                    marginVertical: 10,
                    color: palette.accent,
                  }}
                >
                  نسبة مائويّة
                </ThemedText>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  <ThemedText
                    type="xl"
                    weight="bold"
                    style={{
                      verticalAlign: "middle",
                      color: palette.accent,
                    }}
                  >
                    %
                  </ThemedText>
                  <ThemedTextInput
                    value={value?.toString() || undefined}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={error?.message}
                    containerStyle={{ width: "85%" }}
                  />
                </View>
              </View>
            )}
          />
          <Controller
            name="price.operationCostFixed"
            control={control}
            render={({
              field: { value, onChange, onBlur },
              fieldState: { error },
            }) => (
              <View
                style={{
                  width: "50%",
                  backgroundColor: hexToRgba(palette.accent, 0.1),
                  padding: 10,
                  borderRadius: 15,
                  borderColor: palette.accent,
                  borderWidth: value > 0 ? 1.5 : 0,
                }}
              >
                <ThemedText
                  weight="medium"
                  style={{
                    textAlign: "center",
                    marginVertical: 10,
                    color: palette.accent,
                  }}
                >
                  قيمة ثابتة
                </ThemedText>

                <View style={{ flexDirection: "row", gap: 5 }}>
                  <ThemedText
                    weight="medium"
                    style={{
                      verticalAlign: "middle",
                      color: palette.accent,
                    }}
                  >
                    {selectedCurrency?.sign || "USD"}
                  </ThemedText>
                  <ThemedTextInput
                    value={value?.toString() || undefined}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    error={error?.message}
                    containerStyle={{ width: "75%" }}
                  />
                </View>
              </View>
            )}
          />
        </View>

        {/* Transaction fee display */}
        {selectedCurrency && defaultCurrency && renderFeeBreakdown()}

        {/* Payment options section */}
        <ThemedText type="subtitle" weight="bold">
          أستلام المبلغ
        </ThemedText>
        <Controller
          name="price.isPaidFull"
          control={control}
          render={({ field: { value, onChange, onBlur } }) => (
            <BouncyCheckbox
              text="كامل"
              textStyle={{
                textDecorationLine: "none",
                color: palette.text,
                opacity: isPaidFull ? 1 : 0.5,
              }}
              fillColor={palette.accent}
              isChecked={value}
              onBlur={onBlur}
              onPress={onChange}
            />
          )}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            opacity: !isPaidFull ? 1 : 0.5,
          }}
        >
          <Controller
            name="price.isPaidFull"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <BouncyCheckbox
                text="القسط الأول"
                textStyle={{ textDecorationLine: "none", color: palette.text }}
                style={{ width: "50%" }}
                fillColor={palette.accent}
                isChecked={!value}
                onBlur={onBlur}
                onPress={(isChecked) => onChange(!isChecked)}
              />
            )}
          />
          <Controller
            control={control}
            name="price.firstInstallment"
            render={({ field: { value, onChange, onBlur } }) => (
              <ThemedTextInput
                containerStyle={{ width: "50%" }}
                keyboardType="numeric"
                value={value?.toString()}
                onChangeText={onChange}
                onBlur={onBlur}
                error={formState.errors.price?.firstInstallment?.message}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
}

export default function AddTransactionScreen() {
  const palette = useThemePalette();
  const { profile } = useUserProfile();
  const router = useRouter();
  const { currencies, isLoading: isCurrenciesLoading } = useCurrencies();
  const [isAddLoading, setIsAddLoading] = useState(false);
  const { add } = useTransactions();
  const { departments } = useDepartments();
  const { control, formState, handleSubmit, watch, setValue } =
    useForm<NewTransactionType>({
      resolver: zodResolver(newTransactionSchema),
      defaultValues: {
        receiver: {
          firstname: "",
          lastname: "",
          phone: "",
          address: "",
          email: "",
        },
        sender: {
          firstname: "",
          lastname: "",
          email: "",
          address: "",
          phone: "",
        },
        price: {
          totalPrice: undefined,
          selectedCurrency: undefined,
          isPaidFull: true,
          firstInstallment: undefined,
          operationCostFixed: 0,
          operationCostPercent: 0,
        },
      },
    });

  useEffect(() => {
    if (!isCurrenciesLoading) {
      setValue(
        "price.selectedCurrency",
        currencies.filter((c) => c.sign === "USD")[0]
        // set dollar as default
      );
    }
  }, [isCurrenciesLoading]);

  const onSubmit = async (data: NewTransactionType) => {
    setIsAddLoading(true);
    try {
      const trx = await add(data, profile);
      Alert.alert("نجاح العمليّة", "تمّ إضافة العمليّة بنجاح");
      router.replace({
        pathname: "/(auth)/(tabs)/transaction",
        params: { id: trx.id }, // Sending the ID to reload the data from the database
      });
    } catch (err) {
      console.error(err);
      if (err && typeof err === "object" && "error_ar" in err) {
        Alert.alert("فشل العمليّة", (err as { error_ar: string }).error_ar);
      } else {
        Alert.alert(
          "فشل العمليّة",
          "خطأ غير متوقّع حدث أثناء محاولة إضافة معاملة جديدة"
        );
      }
    } finally {
      setIsAddLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "إرسال أموال" }} />
      <ScrollView>
        <ThemedView>
          {profile && !profile.currency ? (
            <ThemedText
              type="md"
              style={{
                textAlign: "center",
                color: palette.error,
                backgroundColor: hexToRgba(palette.error, 0.1),
                paddingVertical: 20,
                paddingHorizontal: 10,
                marginTop: 10,
              }}
            >
              عذرًا، لا يمكنك إرسال الأموال لأنك لم تقم بتحديد عملة لحسابك بعد.
              يُرجى الانتقال إلى صفحة{" "}
              <Link
                href="/(auth)/(tabs)/currency_rates"
                style={{
                  textDecorationStyle: "solid",
                  textDecorationLine: "underline",
                }}
              >
                أسعار العملات
              </Link>{" "}
              لاختيار العملة المناسبة لحسابك
            </ThemedText>
          ) : null}
          <UserFormComponent
            type="receiver"
            control={control}
            formState={formState}
            title="المستفيد"
          />
          <UserFormComponent
            type="sender"
            control={control}
            formState={formState}
            title="المرسل"
          />
          <View
            style={[styles.sectionContainer, { backgroundColor: palette.tint }]}
          >
            <LinearGradient
              colors={[palette.accent, "transparent"]}
              style={{
                padding: 5,
                borderRadius: 5,
              }}
              start={{ x: 1, y: 0 }}
            >
              <ThemedText
                type="l"
                weight="bold"
                style={{
                  color: palette.background,
                }}
              >
                الفرع
              </ThemedText>
            </LinearGradient>
            <View>
              <Controller
                control={control}
                name="department"
                render={({
                  field: { value, onBlur, onChange },
                  fieldState,
                }) => (
                  <>
                    <View
                      style={{
                        borderColor: "rgba(0,0,0,0.3)",
                        borderRadius: 10,
                        borderWidth: 1,
                        marginVertical: 10,
                      }}
                    >
                      <Picker
                        onBlur={onBlur}
                        onValueChange={onChange}
                        selectedValue={value}
                      >
                        {departments &&
                          departments.map((dep) => (
                            <Picker.Item
                              key={dep.id}
                              label={`${dep.name}|${dep.country_ar}`}
                              value={dep.id}
                            />
                          ))}
                      </Picker>
                    </View>
                    {fieldState?.error?.message && (
                      <ThemedText style={{ color: palette.error }}></ThemedText>
                    )}
                  </>
                )}
              />
            </View>
          </View>
          <TransactionFormComponent
            control={control}
            formState={formState}
            watch={watch}
            currencies={currencies}
            defaultCurrency={
              profile && profile.currency
                ? currencies.filter((c) => c.id === profile.currency)[0]
                : undefined
            }
          />
          <View style={{ marginVertical: 30, paddingHorizontal: 20 }}>
            <ThemedButton
              onPress={handleSubmit(onSubmit)}
              disabled={!profile?.currency || isAddLoading}
              style={{ opacity: !profile?.currency || isAddLoading ? 0.6 : 1 }}
            >
              {!profile?.currency || isAddLoading ? (
                <ActivityIndicator color={palette.accent} size={25} />
              ) : (
                <ThemedText
                  style={{ textAlign: "center", color: palette.background }}
                >
                  أرسل
                </ThemedText>
              )}
            </ThemedButton>
          </View>
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
    margin: 10,
    padding: 15,
    borderRadius: 15,
  },
});
