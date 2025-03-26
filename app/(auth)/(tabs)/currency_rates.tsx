import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { Currency } from "@/utils/models";
import {
  updateCurrencyRateSchema,
  UpdateCurrencyRateSchemaType,
} from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CurrencyItem({
  currency,
  onLongPress,
}: {
  currency?: Currency;
  onLongPress: (currency: Currency) => void;
}) {
  const palette = useThemePalette();
  return (
    <View style={{ borderRadius: 10, overflow: "hidden" }}>
      <Pressable
        style={{
          backgroundColor: palette.tint,
          marginVertical: 5,
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderRadius: 10,
          overflow: "hidden",
        }}
        android_ripple={{
          color: "rgba(0,0,0,0.26)",
          foreground: true,
          borderless: false,
        }}
        onLongPress={() => currency && onLongPress(currency)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: currency?.flag_url, width: 60, height: 60 }}
            style={{
              borderRadius: 30,
              marginRight: 10,
            }}
          />
          <View style={{ flexDirection: "column", flexShrink: 1 }}>
            <ThemedText type="l" weight="medium">
              {currency?.ar_name}
            </ThemedText>
            <ThemedText type="md" weight="bold" style={{ opacity: 0.8 }}>
              {currency?.sign}
            </ThemedText>
            <ThemedText>
              1 USD = {`${currency?.to_dollar_rate} ${currency?.sign}`}
            </ThemedText>
            {!currency?.updated_at ? null : (
              <ThemedText type="sm" style={{ opacity: 0.6 }}>
                {`أخر تحديث بتاريخ ${new Date(
                  currency.updated_at
                ).toLocaleDateString()} على السّاعة ${new Date(
                  currency.updated_at
                ).toLocaleTimeString()}`}
                {!currency?.updated_by
                  ? null
                  : ` بواسطة ${currency.updated_by}`}
              </ThemedText>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function CurrencyRatesScreen() {
  const insets = useSafeAreaInsets();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isUpdateRateModalVisible, setIsUpdateRateModalVisible] =
    useState(false);
  const { hasPermission: hasAdminPermission } = useSupabaseHasPermissions([
    "admin",
  ]);
  const { control, handleSubmit, setValue, getValues } =
    useForm<UpdateCurrencyRateSchemaType>({
      resolver: zodResolver(updateCurrencyRateSchema),
    });

  useEffect(() => {
    const fetchCurrencies = async () => {
      const { data, error } = await supabase
        .from("currencies")
        .select()
        .order("country_code", { ascending: true });
      if (error != null) {
        Alert.alert("حدث خطأ", error.message);
        return;
      }
      console.log(
        `${data.length} currency item fetched at ${new Date().toLocaleString()}`
      );

      setCurrencies(data as Currency[]);
      setIsLoading(false);
    };

    fetchCurrencies();
  }, []);

  const handleLongPress = (currency: Currency) => {
    setSelectedCurrency(currency);
    setValue("currencyRate", currency.to_dollar_rate);
    setIsContextMenuVisible(true);
  };

  const handleSelectDefaultCurrency = () => {
    // TODO: Implement setting default currency for logged-in user
    Alert.alert(
      "أختيار عملة الحساب",
      `تمّ أختيار ${selectedCurrency?.ar_name} كعملة أساسيّة`
    );
    setIsContextMenuVisible(false);
  };

  const handleUpdateRate = async (rate: UpdateCurrencyRateSchemaType) => {
    if (!hasAdminPermission) {
      Alert.alert(
        "غير مسموح",
        "ليس لديك الصلاحيّة! يجب أن تكون المسؤول كي تغير القيمة"
      );
      return;
    }
    // dollar can't be updated
    if (selectedCurrency?.sign === "USD") {
      Alert.alert(
        "غير مسموح",
        "لا يُمكن تحديث سعر صرف الدولار، لأنه العملة الأساسية، وأسعار العملات الأخرى نسبية (الدولار يساوي دائمًا ١)."
      );
      setIsContextMenuVisible(false);
      setIsUpdateRateModalVisible(false);
      return;
    }
    try {
      const { error,status, statusText } = await supabase
        .from("currencies")
        .update({
          to_dollar_rate: getValues().currencyRate,
          updated_at: new Date(),
          // TODO: After implementing user profile
          // updated_by: ""
        })
        .eq("id", selectedCurrency?.id);
      if (error) {
        let msg = error.message
        if (status === 403) {
          msg = "ليس لديك الصلاحيّة لتحديث سعر العملة"
        }
        Alert.alert("فشل العملية", msg);
      }

      // update local state
      setCurrencies((prev) =>
        prev.map((c) =>
          c.id === selectedCurrency?.id
            ? { ...c, to_dollar_rate: getValues().currencyRate }
            : c
        )
      );

      // reset model states
      setIsUpdateRateModalVisible(false);
      setIsContextMenuVisible(false);
      setValue("currencyRate", 0);
    } catch (error) {
      Alert.alert(
        "خطأ تقني",
        "خطأ تقني أثناء تحديث معدل العملة. الرّجاء محاولة لاحقا أو أتصل بالمسؤول"
      );
    }
    setIsContextMenuVisible(false);
    setIsUpdateRateModalVisible(false);
  };

  const renderContextMenu = () => (
    <Modal
      transparent={true}
      visible={isContextMenuVisible}
      animationType="fade"
      onRequestClose={() => setIsContextMenuVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ThemedText type="l" weight="medium" style={styles.modalTitle}>
            {selectedCurrency?.ar_name}
          </ThemedText>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={handleSelectDefaultCurrency}
          >
            <ThemedText>أختار كعملة أساسيّة</ThemedText>
          </TouchableOpacity>

          {hasAdminPermission && (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setIsContextMenuVisible(false);
                setIsUpdateRateModalVisible(true);
              }}
            >
              <ThemedText>تغير سعر الصرف</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.modalOption, styles.cancelOption]}
            onPress={() => setIsContextMenuVisible(false)}
          >
            <ThemedText style={styles.cancelText}>إلغاء</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderUpdateRateModal = () => (
    <Modal
      transparent={true}
      visible={isUpdateRateModalVisible}
      animationType="fade"
      onRequestClose={() => setIsUpdateRateModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ThemedText type="l" weight="medium" style={styles.modalTitle}>
            تغيير سعر {selectedCurrency?.ar_name}
          </ThemedText>

          <Controller
            control={control}
            name="currencyRate"
            render={({
              field: { value, onBlur, onChange },
              fieldState: { error },
            }) => (
              <ThemedTextInput
                style={styles.input}
                placeholder="أدخل السعر الجديد (1 دولار أمريكي = عملة X)"
                keyboardType="numeric"
                value={value ? value.toString() : ""}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error?.message}
              />
            )}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.modalOption, styles.cancelOption]}
              onPress={() => setIsUpdateRateModalVisible(false)}
            >
              <ThemedText style={styles.cancelText}>إلغاء</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleSubmit(handleUpdateRate)}
            >
              <ThemedText>أرسل</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!isLoading && currencies.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <ThemedText>No element found</ThemedText>
      </View>
    );
  }
  return (
    <ThemedView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {renderContextMenu()}
      {renderUpdateRateModal()}

      <FlatList
        renderItem={({ item }) => (
          <CurrencyItem currency={item} onLongPress={handleLongPress} />
        )}
        data={currencies}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        style={{ paddingHorizontal: 10 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
  },
  modalOption: {
    width: "100%",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  cancelText: {
    color: "red",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-around",
  },
});
