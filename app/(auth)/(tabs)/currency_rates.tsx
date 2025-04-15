import ItemsNotFound from "@/components/svg/ItemsNotFound";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useUserProfile } from "@/contexts/profile";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import { hexToRgba } from "@/utils/colors";
import { Currency } from "@/utils/models";
import {
  updateCurrencyRateSchema,
  UpdateCurrencyRateSchemaType,
} from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CurrencyItem({
  currency,
  onLongPress,
  selected,
}: {
  currency?: Currency;
  onLongPress: (currency: Currency) => void;
  selected?: boolean;
}) {
  const palette = useThemePalette();
  return (
    <View style={{ borderRadius: 10, overflow: "hidden" }}>
      <Pressable
        style={{
          backgroundColor: selected
            ? hexToRgba(palette.success, 0.2)
            : palette.tint,
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
  const palette = useThemePalette();
  const [isCurrenciesRefreshing, setIsCurrenciesRefreshing] =
    useState<boolean>(false);
  const {
    currencies,
    updateRate: updateCurrencyRate,
    isLoading: isCurrenciesLoading,
    error: currenciesError,
    arError: currenciesArError,
    reload: reloadCurrencies,
  } = useCurrencies();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [isUpdateRateModalVisible, setIsUpdateRateModalVisible] =
    useState(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const { hasPermission: hasAdminPermission } = useSupabaseHasPermissions([
    "admin",
  ]);
  const { profile: userProfile, updateProfile } = useUserProfile();
  const { control, handleSubmit, setValue, getValues } =
    useForm<UpdateCurrencyRateSchemaType>({
      resolver: zodResolver(updateCurrencyRateSchema),
    });

  const handleLongPress = (currency: Currency) => {
    setSelectedCurrency(currency);
    setValue("currencyRate", currency.to_dollar_rate);
    setIsContextMenuVisible(true);
  };

  const handleSelectDefaultCurrency = () => {
    Alert.alert(
      "أختيار عملة الحساب",
      `تمّ أختيار ${selectedCurrency?.ar_name} كعملة أساسيّة`
    );
    updateProfile({ currency: selectedCurrency?.id }).then(() => {
      setIsContextMenuVisible(false);
    });
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
    if (selectedCurrency) {
      if (userProfile) {
        updateCurrencyRate(
          selectedCurrency,
          userProfile,
          getValues().currencyRate
        );

        // reset model states
        setIsUpdateRateModalVisible(false);
        setIsContextMenuVisible(false);
        setValue("currencyRate", 0);
        // Alert.alert(
        //   "خطأ تقني",
        //   "خطأ تقني أثناء تحديث معدل العملة. الرّجاء محاولة لاحقا أو أتصل بالمسؤول"
        // );
      } else {
        Alert.alert("خطأ", "حدث مشكل في تحديد هويتك");
      }
    } else {
      Alert.alert("خطأ", "لايوجد عملة محددة");
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
                containerStyle={styles.input}
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

      <View style={{ padding: 10 }}>
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
          <ThemedTextInput
            placeholder="بحث"
            containerStyle={{ width: "75%" }}
            returnKeyType="search"
            value={searchInput}
            onChangeText={setSearchInput}
          />

          {
            /* Debugging search on the web */ Platform.OS === "web" ? (
              <ThemedButton style={{ width: 50 }}>
                <ThemedText>Search</ThemedText>
              </ThemedButton>
            ) : (
              ""
            )
          }
        </View>
      </View>

      {isCurrenciesLoading ? (
        <View
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: 0.7,
          }}
        >
          <View>
            <ThemedText type="xl" weight="medium">
              تحميل بيانات العملات...
            </ThemedText>
            <ActivityIndicator color={palette.accent} size={48} />
          </View>
        </View>
      ) : (
        <FlatList
          ListEmptyComponent={
            !isCurrenciesLoading && currencies.length === 0 ? (
              <View>
                <ItemsNotFound width="100%" height="100%" />
                <ThemedText
                  type="md"
                  weight="medium"
                  style={{
                    position: "absolute",
                    bottom: 100,
                    left: 50,
                    opacity: 0.6,
                  }}
                >
                  لم نتمكن من العثور على أي عملة
                </ThemedText>
              </View>
            ) : (
              <></>
            )
          }
          onRefresh={async () => {
            setIsCurrenciesRefreshing(true);
            try {
              await reloadCurrencies();
            } catch (err) {
              console.error(err);
            } finally {
              setIsCurrenciesRefreshing(false);
            }
          }}
          refreshing={isCurrenciesRefreshing}
          renderItem={({ item }) => (
            <View
              style={{
                // TODO: For performance reasons we can use filter by debouncing instead of updating
                // display state
                display:
                  !searchInput ||
                  (searchInput.trim().length > 0 &&
                    (item.name?.includes(
                      searchInput.trim().toLocaleLowerCase()
                    ) ||
                      item.ar_name
                        ?.toLocaleLowerCase()
                        .includes(searchInput.trim().toLocaleLowerCase()) ||
                      item.sign
                        ?.toLocaleLowerCase()
                        .includes(searchInput.trim().toLocaleLowerCase()) ||
                      item.country
                        ?.toLowerCase()
                        .includes(searchInput.trim().toLocaleLowerCase()) ||
                      item.country_code
                        ?.toLowerCase()
                        .includes(searchInput.trim().toLocaleLowerCase()) ||
                      item.flag === searchInput.trim().toLocaleLowerCase()))
                    ? "flex"
                    : "none",
              }}
            >
              <CurrencyItem
                currency={item}
                onLongPress={handleLongPress}
                selected={item.id === userProfile?.currency}
              />
            </View>
          )}
          data={currencies}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          style={{ paddingHorizontal: 10 }}
        />
      )}
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
