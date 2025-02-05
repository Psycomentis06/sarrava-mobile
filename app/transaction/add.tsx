import BouncyCheckbox from "react-native-bouncy-checkbox";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Stepper from "@/components/ui/Stepper";

type UserFormComponentProps = {
  title: string;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
};

function UserFormComponent({
  title,
  email,
  setEmail,
  name,
  setName,
  phone,
  setPhone,
}: UserFormComponentProps) {
  const palette = useThemePalette();
  return (
    <View style={[styles.sectionContainer, { backgroundColor: palette.tint }]}>
      <ThemedText type="l" weight="bold" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>
      <View style={{ paddingTop: 10, gap: 15 }}>
        <ThemedTextInput
          placeholder="الأسم الكامل"
          autoComplete="name"
          value={name}
          onChangeText={setName}
        />
        <ThemedTextInput
          placeholder="بريد الألكتروني"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <ThemedTextInput
          placeholder="رقم الهاتف"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
    </View>
  );
}
function TransactionFormComponent() {
  const palette = useThemePalette();
  return (
    <View style={[styles.sectionContainer, { backgroundColor: palette.tint }]}>
      <ThemedText type="l" weight="bold" style={{ textAlign: "center" }}>
        المعاملة
      </ThemedText>
      <View style={{ paddingTop: 10, gap: 15 }}>
        <ThemedTextInput placeholder="المبلغ" keyboardType="numeric" />
        <View
          style={{
            borderWidth: 1.5,
            borderRadius: 30,
            borderColor: palette.text,
          }}
        >
          <Picker
            placeholder="العملة"
            dropdownIconColor={palette.text}
            style={{
              color: palette.text,
              fontSize: 10,
            }}
          >
            <Picker.Item label="🇺🇸 الدولار الأمريكي" value="usd" />
            <Picker.Item label="🇪🇺 اليورو الأروبي" value="eur" />
            <Picker.Item label="🇹🇳 الدينار التونسي" value="tnd" />
          </Picker>
        </View>
        <ThemedTextInput placeholder="سعر الصرف" keyboardType="numeric" />
        <BouncyCheckbox
          text="معاملة مدفوعة"
          textStyle={{ textDecorationLine: "none", color: palette.text }}
          fillColor={palette.accent}
        />
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
  const [active, setActive] = useState(0);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");

  const [receiverName, setRecieverName] = useState("");
  const [receiverEmail, setRecieverEmail] = useState("");
  const [receiverPhone, setRecieverPhone] = useState("");

  const content = [
    <UserFormComponent
      title="المرسل"
      name={senderName}
      setName={setSenderName}
      email={senderEmail}
      setEmail={setSenderEmail}
      phone={senderPhone}
      setPhone={setSenderPhone}
    />,
    <UserFormComponent
      title="المستقبل"
      name={receiverName}
      setName={setRecieverName}
      email={receiverEmail}
      setEmail={setRecieverEmail}
      phone={receiverPhone}
      setPhone={setRecieverPhone}
    />,
    <TransactionFormComponent />,
    <OverviewBeforeSubmit
      reciever={{
        email: receiverEmail,
        name: receiverName,
        phone: receiverPhone,
      }}
      sender={{
        name: senderName,
        email: senderEmail,
        phone: senderPhone,
      }}
      transaction={{
        amount: 332,
        currency: "$",
        currencyExchange: 0.02,
        paied: false,
      }}
    />,
  ];
  return (
    <>
      <Stack.Screen
        name="new-transaction"
        options={{ title: "معاملة جديدة" }}
      />
      <ThemedView>
        <Stepper
          active={active}
          content={content}
          onBack={() => setActive((p) => p - 1)}
          onFinish={() => Alert.alert("تمّ التأكيد", "هذه نسخة تجريبيّة")}
          onNext={() => setActive((p) => p + 1)}
          wrapperStyle={{ padding: 10 }}
          stepStyle={{ backgroundColor: palette.accent }}
          stepTextStyle={{ color: palette.background }}
          buttonBackStyle={{ backgroundColor: palette.muted }}
          buttonNextStyle={{ backgroundColor: palette.accent }}
          buttonFinishStyle={{ backgroundColor: palette.accent }}
          backButtonLabel="الرجوع"
          nextButtonLabel="التالي"
          finishButtonLabel="تأكيد"
        />
      </ThemedView>
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
