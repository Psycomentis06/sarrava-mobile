import BouncyCheckbox from "react-native-bouncy-checkbox";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { hexToRgba } from "@/utils/colors";
import { ThemedButton } from "@/components/ThemedButton";
import { Control, Controller, FormState, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newTransactionSchema, NewTransactionType } from "@/utils/schemas";

type Currency = {
  sign: string;
  name: string;
  country: string;
  flag: string;
  toDollarRate: number;
};

type UserFormComponentProps = {
  title: string;
  control: Control<NewTransactionType>;
  formState: FormState<NewTransactionType>;
  type: "sender" | "receiver";
};

const CURRENCIES: Currency[] = [
  {
    sign: "TND",
    name: "Tunisian Dinar",
    country: "Tunisia",
    flag: "🇹🇳",
    toDollarRate: 0.31679218,
  },
  {
    sign: "EUR",
    name: "Euro",
    country: "Europe",
    flag: "🇪🇺",
    toDollarRate: 1.0482638,
  },
  {
    sign: "USD",
    name: "Dollar",
    country: "United States",
    flag: "🇺🇸",
    toDollarRate: 1.0,
  },
  {
    sign: "MRU",
    name: "Muritanian Ouguiya",
    country: "Muritania",
    flag: "🇲🇷",
    toDollarRate: 0.024940481,
  },
  {
    sign: "SAR",
    name: "Saudi Arabian Riyal",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    toDollarRate: 0.26666667,
  },
  {
    sign: "DZD",
    name: "Algerian Dinar",
    country: "Algeria",
    flag: "🇩🇿",
    toDollarRate: 0.0074261752,
  },
];

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
function TransactionFormComponent() {
  const palette = useThemePalette();
  let defaultCurrency: Currency = CURRENCIES[0];
  const [priceInputFocused, setPriceInputFocused] = useState(false);
  const [currencies, setCurrencies] = useState(CURRENCIES);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [totalPrice, setTotalPrice] = useState(0);

  const getExchangeRate = (from: Currency, to: Currency): number => {
    const fromInUSD = 1 / from.toDollarRate;
    const toInUSD = 1 / to.toDollarRate;
    const exchangeRate = toInUSD / fromInUSD;
    return Math.round(exchangeRate * 1e6) / 1e6;
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
        <View
          style={{
            flexDirection: "row",
            borderWidth: 1,
            borderRadius: 10,
            borderColor: priceInputFocused
              ? palette.accent
              : hexToRgba(palette.text, 0.3),
          }}
        >
          <ThemedTextInput
            placeholder="المبلغ الجملي"
            keyboardType="numeric"
            style={{
              width: "60%",
              borderWidth: 0,
              borderLeftWidth: 1,
              borderRadius: 0,
            }}
            onFocus={() => setPriceInputFocused(true)}
            onBlur={() => setPriceInputFocused(false)}
            onChangeText={(v) => {
              setTotalPrice(parseFloat(v));
            }}
          />
          <View style={{ width: "40%" }}>
            <Picker
              placeholder="العملة"
              dropdownIconColor={palette.text}
              style={{
                color: palette.text,
              }}
              mode="dropdown"
              onFocus={() => setPriceInputFocused(true)}
              onBlur={() => setPriceInputFocused(false)}
              selectedValue={selectedCurrency}
              onValueChange={setSelectedCurrency}
            >
              {currencies.map((c) => (
                <Picker.Item key={c.name} label={c.sign} value={c} />
              ))}
            </Picker>
          </View>
        </View>
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
          {!isNaN(totalPrice) ? (
            <ThemedText weight="bold" style={{ color: palette.accent }}>
              {totalPrice + " " + selectedCurrency.sign} ={" "}
              {Math.round(
                totalPrice *
                  getExchangeRate(selectedCurrency, defaultCurrency) *
                  1e6
              ) /
                1e6 +
                " " +
                defaultCurrency.sign}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="subtitle" weight="bold">
          أستلام المبلغ
        </ThemedText>
        <BouncyCheckbox
          text="كامل"
          textStyle={{
            textDecorationLine: "none",
            color: palette.text,
          }}
          fillColor={palette.accent}
        />
        <View style={{ flexDirection: "row" }}>
          <BouncyCheckbox
            text="القسط الأول"
            textStyle={{ textDecorationLine: "none", color: palette.text }}
            style={{ width: "50%" }}
            fillColor={palette.accent}
          />
          <ThemedTextInput
            keyboardType="numeric"
            style={{
              width: "50%",
            }}
          />
        </View>
      </View>
    </View>
  );
}

type OverviewBeforeSubmitProps = {
  sender: {
    email: string;
    phone: string;
    name: string;
  };
  reciever: {
    email: string;
    phone: string;
    name: string;
  };
  transaction: {
    amount: number;
    currency: string;
    currencyExchange: number;
    paied: boolean;
  };
};
export function OverviewBeforeSubmit({
  sender,
  reciever,
  transaction,
}: OverviewBeforeSubmitProps) {
  const palette = useThemePalette();
  return (
    <View style={[styles.sectionContainer, { backgroundColor: palette.tint }]}>
      <ThemedText type="l" weight="bold" style={{ textAlign: "center" }}>
        تحقّق من المعطيات أدناه
      </ThemedText>
      <View
        style={{
          marginTop: 10,
          gap: 5,

          borderBottomWidth: 1,
          borderBottomColor: palette.muted,
          paddingBottom: 10,
        }}
      >
        <ThemedText weight="bold">
          أسم المرسل: <ThemedText>{sender?.name ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          البريد الألكتروني للمرسل:{" "}
          <ThemedText>{sender?.email ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          رقم هاتف المرسل:{" "}
          <ThemedText>{sender?.phone ?? "غير معلوم"}</ThemedText>
        </ThemedText>
      </View>
      <View
        style={{
          marginTop: 10,
          gap: 5,

          borderBottomWidth: 1,
          borderBottomColor: palette.muted,
          paddingBottom: 10,
        }}
      >
        <ThemedText weight="bold">
          أسم المستقبل: <ThemedText>{reciever?.name ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          البريد الألكتروني للمستقبل:{" "}
          <ThemedText>{reciever?.email ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          رقم هاتف المستقبل:{" "}
          <ThemedText>{reciever?.phone ?? "غير معلوم"}</ThemedText>
        </ThemedText>
      </View>
      <View
        style={{
          marginTop: 10,
          gap: 5,

          borderBottomWidth: 1,
          borderBottomColor: palette.muted,
          paddingBottom: 10,
        }}
      >
        <ThemedText weight="bold">
          المبلغ: <ThemedText>{transaction?.amount ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          العملة:{" "}
          <ThemedText>{transaction?.currency ?? "غير معلوم"}</ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          صرف العملات:{" "}
          <ThemedText>
            {transaction?.currencyExchange ?? "غير معلوم"}
          </ThemedText>
        </ThemedText>
        <ThemedText weight="bold">
          دفعة:{" "}
          <ThemedText>
            {transaction != null && transaction.paied == true ? "نعم" : "لا"}
          </ThemedText>
        </ThemedText>
      </View>
    </View>
  );
}

export default function AddTransactionScreen() {
  const palette = useThemePalette();
  const { control, formState, handleSubmit } = useForm<NewTransactionType>({
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
    },
  });
  const onSubmit = (data: NewTransactionType) => {
    console.log(data);
  };

  return (
    <>
      <Stack.Screen options={{ title: "إرسال أموال" }} />
      <ScrollView>
        <ThemedView>
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
          <TransactionFormComponent />,
          <View style={{ marginVertical: 30, paddingHorizontal: 20 }}>
            <ThemedButton onPress={handleSubmit(onSubmit)}>
              <ThemedText
                style={{ textAlign: "center", color: palette.background }}
              >
                أرسل
              </ThemedText>
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
