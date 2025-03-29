import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { Transaction, TransactionStatus } from "@/utils/models";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TransactionScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const navigation = useNavigation();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSessionLoading, session] = UseSupabaseSession();

  const getItemColorByStatus = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.FAILED:
        return palette.error;
      case TransactionStatus.CANCELED:
        return palette.warn;
      case TransactionStatus.CONFIRMED:
        return palette.success;
      case TransactionStatus.PENDING:
        return palette.accent;
      default:
        return palette.accent;
    }
  };

  const getTransactionArabicStatus = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.FAILED:
        return "فشلة";
      case TransactionStatus.CANCELED:
        return "ألغيت";
      case TransactionStatus.CONFIRMED:
        return "مكتملة";
      case TransactionStatus.PENDING:
        return "قيد الانتظار";
      default:
        return "غير مصنف";
    }
  };

  const getTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
           *,
          currency:currency_id (
            id,
            name,
            sign,
            to_dollar_rate,
            country,
            flag,
            created_at,
            updated_at,
            updated_by,
            ar_name,
            country_code,
            flag_url
          )
          `
        )
        .eq("created_by", session?.user.id)
        .order("created_at", { ascending: true });

      if (error) {
        Alert.alert("خطأ", "حدث خطأ ما أثناء تحميل المعلومات");
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        setTransactions(data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("خطأ", "حدث خطأ ما أثناء تحميل المعلومات");
      return;
    }
  };

  useEffect(() => {
    if (session !== null) {
      getTransactions();
    }
  }, [session]);

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
            onPress={() => router.navigate("/(auth)/transaction/add")}
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
          data={transactions}
          keyExtractor={(i) => i.id}
          renderItem={(i) => {
            return (
              <View key={i.item.id}>
                <Pressable
                  style={[
                    styles.transactionsListItem,
                    { backgroundColor: palette.tint },
                  ]}
                  android_ripple={{
                    color: "rgba(0,0,0,0.26)",
                    foreground: true,
                    borderless: false,
                  }}
                  onPress={() => {
                    router.push({pathname: '/transaction/[id]', params: {id: i.item.id, transaction: JSON.stringify(i.item)}})
                    // navigation.navigate("transaction/[id]", { id: i.item.id });
                  }}
                >
                  <View
                    style={{
                      justifyContent: "space-between",
                      flexDirection: "row",
                      alignItems: 'center'
                    }}
                  >
                    <ThemedText type="xs" style={{ opacity: 0.7 }}>
                      {"#" + i.item.id}
                    </ThemedText>
                    <ThemedText type="sm">{new Date(i.item.created_at).toLocaleString()}</ThemedText>
                  </View>
                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <ThemedText type="l" weight="medium">
                      {i.item.receiver?.firstname +
                        " " +
                        i.item.receiver?.lastname}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginVertical: 5,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 5,
                        alignItems: "flex-end",
                      }}
                    >
                      <ThemedText style={{ opacity: 0.7 }}>
                        المبلغ:{"    "}
                      </ThemedText>
                      <ThemedText
                        weight="medium"
                        type="l"
                        style={{ color: palette.accent }}
                      >
                        {i.item.original_amount + " " + i.item.currency.sign}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ textAlign: "right", opacity: 0.7 }}>
                      الحالة:{" "}
                      <ThemedText
                        weight="medium"
                        style={{
                          color: getItemColorByStatus(i.item.status),
                          fontSize: 14,
                        }}
                      >
                        {getTransactionArabicStatus(i.item.status)}
                      </ThemedText>
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: "hidden",
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
