import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useNavigation } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hexToRgba } from "@/utils/colors";
import { IconSymbol } from "@/components/ui/IconSymbol";

const DATA = [
  {
    id: "123456-123456-123456",
    date: "2024-09-23",
    amount: 208,
    currency: {
      name: "dollar",
      icon: "$",
    },
    fee: 0.2,
    status: "VALIDATED",
    reciever: {
      name: "علي الحسن",
      address: "5 شارع النخيل",
    },
    sender: {
      name: "فاطمة الزهراء",
      address: "شارع الورد",
    },
  },
  {
    id: "123456-789012-345678",
    date: "2024-09-22",
    amount: 145,
    currency: {
      name: "euro",
      icon: "€",
    },
    fee: 0.15,
    status: "VALIDATED",
    reciever: {
      name: "ليلى العلي",
      address: "42 شارع البلوط",
    },
    sender: {
      name: "يوسف محمد",
      address: "123 شارع القيقب",
    },
  },
  {
    id: "987654-321098-765432",
    date: "2024-09-21",
    amount: 375,
    currency: {
      name: "pound",
      icon: "£",
    },
    fee: 0.25,
    status: "CANCELED",
    reciever: {
      name: "إيهاب السعيد",
      address: "89 شارع الحديقة",
    },
    sender: {
      name: "سارة أحمد",
      address: "456 شارع برودواي",
    },
  },
  {
    id: "456789-234567-890123",
    date: "2024-09-20",
    amount: 92,
    currency: {
      name: "yen",
      icon: "¥",
    },
    fee: 0.1,
    status: "VALIDATED",
    reciever: {
      name: "أحمد سعيد",
      address: "67 شارع الأرز",
    },
    sender: {
      name: "صوفيا علي",
      address: "901 شارع الصنوبر",
    },
  },
  {
    id: "789012-345678-901234",
    date: "2024-09-19",
    amount: 278,
    currency: {
      name: "franc",
      icon: "₣",
    },
    fee: 0.22,
    status: "CANCELED",
    reciever: {
      name: "وليد الطيب",
      address: "34 شارع البلوط",
    },
    sender: {
      name: "شارلوت حسن",
      address: "678 شارع الكرز",
    },
  },
  {
    id: "234567-890123-456789",
    date: "2024-09-18",
    amount: 167,
    currency: {
      name: "rupee",
      icon: "₹",
    },
    fee: 0.18,
    status: "FAILED",
    reciever: {
      name: "جمال الدين",
      address: "56 شارع الجوز",
    },
    sender: {
      name: "أبيغيل عادل",
      address: "234 شارع التنوب",
    },
  },
];

export default function TransactionScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const navigation = useNavigation();

  const getItemColorByStatus = (status: string) => {
    switch (status) {
      case "FAILED":
        return hexToRgba(palette.error, 0.26);
      case "CANCELED":
        return hexToRgba(palette.warn, 0.26);
      default:
        return palette.tint;
    }
  };

  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={{ padding: 10, height: "100%" }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            paddingBottom: 20,
            borderBottomWidth: 2,
            borderColor: palette.tint,
          }}
        >
          <ThemedTextInput placeholder="بحث" style={{ width: "75%" }} />
          <ThemedButton
            style={{ width: 45, borderRadius: "50%" }}
            onPress={() => navigation.navigate("transaction/add" as never)}
          >
            <ThemedText>
              <IconSymbol
                style={{ textAlign: "center" }}
                size={24}
                name="plus.app"
                color={palette.background}
              />
            </ThemedText>
          </ThemedButton>
        </View>

        <FlatList
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 20,
          }}
          data={DATA}
          keyExtractor={(i) => i.id}
          renderItem={(i) => {
            return (
              <View>
                <Pressable
                  style={[
                    styles.transactionsListItem,
                    { backgroundColor: getItemColorByStatus(i.item.status) },
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.26)" }}
                  onPress={() => {
                    navigation.navigate("transaction/[id]", { id: i.item.id });
                  }}
                >
                  <ThemedText type="sm" style={{ opacity: 0.7 }}>
                    {i.item.id}
                  </ThemedText>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <ThemedText style={{ opacity: 0.7 }}>من:</ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {i.item.sender.name}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <ThemedText style={{ opacity: 0.7 }}>إلى:</ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {i.item.reciever.name}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 5 }}>
                      <ThemedText style={{ opacity: 0.7 }}>المبلغ:</ThemedText>
                      <ThemedText type="subtitle">
                        {i.item.currency.icon + "" + i.item.amount}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ textAlign: "right", opacity: 0.7 }}>
                      {i.item.date}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  transactionsListItem: {
    marginVertical: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  shadow_1: {
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.0,
    elevation: 1,
  },
});
