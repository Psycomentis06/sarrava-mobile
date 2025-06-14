import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useUserProfile } from "@/contexts/profile";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import { generateTransactionHTML } from "@/services/transactions";
import { Transaction } from "@/utils/models";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as LocalAuthentication from "expo-local-authentication";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Share from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-root-toast";

const SYMBOLS = "!@#$%^&*()_+-=<>?/[]{}123456789";
const getRandomChar = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

type PinCodeDisplayProps = { pinCode?: number | null };

const PinCodeDisplay = ({ pinCode }: PinCodeDisplayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayedDigits, setDisplayedDigits] = useState<string[]>(
    Array(6).fill("*")
  );
  const animationTimers = useRef<NodeJS.Timeout[]>([]);
  const hasAnimated = useRef(false);
  const palette = useThemePalette();

  const actualPin = pinCode?.toString().padStart(6, "0") ?? "000000";

  const runStaggeredDecryptAnimation = () => {
    clearAnimationTimers();

    const digits = actualPin.split("");

    digits.forEach((finalDigit, index) => {
      let count = 0;
      const maxCount = 10;
      const timer = setInterval(() => {
        count++;
        setDisplayedDigits((prev) => {
          const updated = [...prev];
          updated[index] = count >= maxCount ? finalDigit : getRandomChar();
          return updated;
        });

        if (count >= maxCount) {
          clearInterval(timer);
        }
      }, 40 + index * 30); // stagger effect
      animationTimers.current.push(timer);
    });
  };

  const handleShowHidePress = async () => {
    if (isVisible) {
      setIsVisible(false);
      setDisplayedDigits(Array(6).fill("*"));
    } else {
      // Only require authentication if we haven't authenticated before
      if (!hasAnimated.current) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "قم بالمصادقة لعرض رقم التعريف (PIN)",
        });

        if (result.success) {
          setIsVisible(true);
          runStaggeredDecryptAnimation();
          hasAnimated.current = true;
        }
      } else {
        // Already authenticated before, just show the PIN
        setIsVisible(true);
        setDisplayedDigits(actualPin.split(""));
      }
    }
  };

  const handleLongPressCopy = () => {
    if (isVisible) {
      Clipboard.setStringAsync(actualPin);
      Toast.show("تم نسخ الرمز السرّي.", { duration: Toast.durations.SHORT });
    }
  };

  const clearAnimationTimers = () => {
    animationTimers.current.forEach(clearInterval);
    animationTimers.current = [];
  };

  useEffect(() => {
    return () => {
      clearAnimationTimers();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText style={{ color: palette.accent, width: "50%" }}>
        الرمز السرّي للمعاملة
      </ThemedText>

      <View style={styles.codeContainer}>
        <Pressable onLongPress={handleLongPressCopy}>
          <ThemedText style={styles.codeText}>
            {displayedDigits.join("")}
          </ThemedText>
        </Pressable>

        <TouchableOpacity
          onPress={handleShowHidePress}
          style={styles.toggleButton}
        >
          <ThemedText style={{ color: "#000" }}>
            {isVisible ? "إخفاء" : "إظهار"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function TransactionDetailsScreen() {
  const palette = useThemePalette();
  const { id, transaction } = useLocalSearchParams();
  const tObj = JSON.parse(transaction as string) as Transaction;
  const { currencies } = useCurrencies();
  const { profile } = useUserProfile();
  const defaultCurrency = {
    sign: "USD",
    name_ar: "الدّولار الأمريكي",
    to_dollar_rate: 1,
  };
  const displayCurrency = React.useMemo(() => {
    if (!profile?.currency || !currencies) return defaultCurrency;
    return currencies.find((c) => c.id === profile.currency) ?? defaultCurrency;
  }, [profile?.currency, currencies]);
  const [isSaveTransactionFileLoading, setIsSaveTransactionFileLoading] =
    useState(false);
  const { hasPermission } = useSupabaseHasPermissions(["admin"]);

  const shouldDisplayPin = useMemo<boolean>(() => {
    if (hasPermission) {
      return true;
    }
    if (profile && profile.user_id === tObj.created_by) {
      return true;
    }
    return false;
  }, [hasPermission, profile]);

  const handleDownload = async (html: string, fileName = "transaction.pdf") => {
    setIsSaveTransactionFileLoading(true);
    Toast.show("جاري حفظ الملفّ...", { visible: isSaveTransactionFileLoading });
    try {
      const fullFileName = fileName.endsWith(".pdf")
        ? fileName
        : `${fileName}.pdf`;

      // Step 1: Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html,
      });

      // Step 2: Move it to app cache with correct filename (optional but good UX)
      const newPath = `${FileSystem.cacheDirectory}${fullFileName}`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      // Step 3: Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setIsSaveTransactionFileLoading(false);
        Toast.show("لايمكن حفظ الملفّ. لا تمتلك الصّلاحيات اللاّزمة", {
          duration: Toast.durations.LONG,
        });
        return;
      }

      // Step 4: Save to Downloads folder
      const asset = await MediaLibrary.createAssetAsync(newPath);
      const album = await MediaLibrary.getAlbumAsync("Download");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      }
      setIsSaveTransactionFileLoading(false);
      Toast.show("تمّ حفظ الملفّ بنجاح ✔", { duration: Toast.durations.LONG });
    } catch (error) {
      console.error("Error saving PDF:", error);
      Toast.show("حدث خطأ أثناء حفظ الملف ❌", {
        duration: Toast.durations.LONG,
      });
    } finally {
      setIsSaveTransactionFileLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "تفاصيل المعاملة" }} />
      <ScrollView>
        <ThemedView style={{ padding: 10, backgroundColor: palette.tint }}>
          <View
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <ThemedText type="l" weight="bold">
                ملخص المعاملة
              </ThemedText>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <Pressable
                  android_ripple={{ color: "rgba(0,0,0,0.26)" }}
                  onPress={async () => {
                    const html = generateTransactionHTML(tObj, id.toString());
                    await handleDownload(html, `mvp-transaction-${id}.pdf`);
                  }}
                >
                  <IconSymbol
                    name="square.and.arrow.down"
                    size={24}
                    color={palette.accent}
                  />
                </Pressable>
                <Pressable
                  android_ripple={{ color: "rgba(0,0,0,0.26)" }}
                  onPress={async () => {
                    const html = generateTransactionHTML(tObj, id.toString());
                    const { uri } = await Print.printToFileAsync({ html });
                    await Share.shareAsync(uri, {
                      UTI: ".pdf",
                      mimeType: "application/pdf",
                    });
                  }}
                >
                  <IconSymbol
                    name="arrowshape.turn.up.right.fill"
                    size={24}
                    color={palette.accent}
                  />
                </Pressable>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                عدد المعاملة
              </ThemedText>
              <ThemedText style={{ width: "70%" }}>{"#" + id}</ThemedText>
            </View>
            <View style={{ flexDirection: "row" }}>
              <ThemedText weight="bold" style={{ width: "30%" }}>
                بتاريخ :
              </ThemedText>
              <ThemedText>
                {new Date(tObj.created_at).toLocaleString()}
              </ThemedText>
            </View>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                المستفيد
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText weight="medium">{`${tObj.receiver?.firstname} ${tObj.receiver?.lastname}`}</ThemedText>
                <ThemedText>{tObj.receiver?.phone}</ThemedText>
                <ThemedText>{tObj.receiver?.email}</ThemedText>
                <ThemedText>{tObj.receiver?.address}</ThemedText>
              </View>
            </View>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                المرسل
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText>{`${tObj.sender?.firstname} ${tObj.sender?.lastname}`}</ThemedText>
                <ThemedText>{tObj.sender?.phone}</ThemedText>
                <ThemedText>{tObj.sender?.email}</ThemedText>
                <ThemedText>{tObj.sender?.address}</ThemedText>
              </View>
            </View>

            {/*Separator*/}
            <View
              style={{
                height: 5,
                borderTopColor: "rgba(0,0,0,0.5)",
                borderTopWidth: 0.75,
                borderStyle: "dashed",
                marginVertical: 20,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                المبلغ الجملي
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.accent, textAlign: "center" }}
                  >
                    {`${Math.round(
                      (tObj.amount_usd ?? 0) / displayCurrency.to_dollar_rate
                    )} ${displayCurrency.sign}`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {`${Math.round(tObj.original_amount)} ${
                      tObj.currency.sign
                    }`}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                {tObj.is_paid_full
                  ? "تم أستلام المبلغ كاملا"
                  : "تم أستلام القسط الأوّل بقيمة"}
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.accent, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `${Math.round(
                          (tObj.amount_usd ?? 0) /
                            displayCurrency.to_dollar_rate
                        )} ${displayCurrency.sign}`
                      : `${Math.round(
                          ((tObj.first_installment ?? 0) * tObj.exchange_rate) /
                            displayCurrency.to_dollar_rate
                        )} ${displayCurrency.sign}`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `${Math.round(tObj.original_amount)} ${
                          tObj.currency.sign
                        }`
                      : `${Math.round(tObj.first_installment ?? 0)} ${
                          tObj.currency.sign
                        }`}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                المبلغ المتبقي
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.error, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `0 ${displayCurrency.sign}`
                      : `${Math.round(
                          (tObj.amount_usd -
                            (tObj.first_installment ?? 0) *
                              tObj.exchange_rate) /
                            displayCurrency.to_dollar_rate
                        )} ${displayCurrency.sign}`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {tObj.is_paid_full
                      ? `0 ${tObj.currency.sign}`
                      : `${Math.round(
                          tObj.original_amount - (tObj.first_installment ?? 0)
                        )} ${tObj.currency.sign}`}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                سعر المعاملة (سعر أضافي) :
              </ThemedText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View>
                  <ThemedText
                    type="l"
                    style={{ color: palette.error, textAlign: "center" }}
                  >
                    {`${Math.round(
                      Math.round((tObj.operation_cost_usd ?? 0) * 100) /
                        100 /
                        displayCurrency.to_dollar_rate
                    )} ${displayCurrency.sign}`}
                  </ThemedText>
                  <ThemedText
                    style={{ color: palette.success, textAlign: "center" }}
                  >
                    {`${
                      Math.round(
                        (tObj.operation_cost_original +
                          tObj.operation_tax_original) *
                          100
                      ) / 100
                    } ${tObj.currency.sign}`}
                  </ThemedText>
                </View>
                <IconSymbol
                  name="arrow.up.arrow.down"
                  size={20}
                  color={palette.text}
                />
              </View>
            </View>

            <View
              style={{
                height: 5,
                borderTopColor: "rgba(0,0,0,0.5)",
                borderTopWidth: 0.75,
                borderStyle: "dashed",
                marginVertical: 20,
              }}
            />
            {shouldDisplayPin && (<PinCodeDisplay pinCode={tObj.pin_code} />)}
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier",
    }),
    fontSize: 18,
    letterSpacing: 2,
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 100,
    textAlign: "center",
  },
  toggleButton: {
    backgroundColor: "#ccc",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
});
