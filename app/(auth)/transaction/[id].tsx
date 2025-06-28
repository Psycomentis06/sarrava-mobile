import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { DefaultCurrency } from "@/constants/Currency";
import { useUserProfile } from "@/contexts/profile";
import { useAgents } from "@/hooks/useAgents";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDepartments } from "@/hooks/useDepartments";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useTransactions } from "@/hooks/useTransactions";
import {
  generateTransactionHTML,
  getConvertedAmount,
  getItemColorByStatus,
  getTransactionArabicStatusFromTransaction,
  getTransactionHistoryDetailTemplate,
} from "@/services/transactions";
import { hexToRgba } from "@/utils/colors";
import {
  Currency,
  Transaction,
  TransactionStatus,
  TransactionStatusHistory,
} from "@/utils/models";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as LocalAuthentication from "expo-local-authentication";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import * as Share from "expo-sharing";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native";
import Toast from "react-native-root-toast";

type StatusDisplayConfig = {
  showConfirmedSection?: boolean;
  showCanceledSection?: boolean;
  showRefundedSection?: boolean;
  showPayoutSection?: boolean;
  showBlockedSection?: boolean;
  showCompletedSection?: boolean;
};

const statusDisplayMap: Partial<
  Record<TransactionStatus, StatusDisplayConfig>
> = {
  PENDING: {},
  CONFIRMED: {
    showConfirmedSection: true,
  },
  CANCELED: {
    showCanceledSection: true,
  },
  REFUNDED: {
    showRefundedSection: true,
    showCanceledSection: true,
  },
  PAID_OUT: {
    showConfirmedSection: true,
    showPayoutSection: true,
  },
  COMPLETED: {
    showConfirmedSection: true,
    showPayoutSection: true,
    showCompletedSection: true,
  },
  BLOCKED: {
    showConfirmedSection: true,
    showBlockedSection: true,
  },
};

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

type AmountDisplayProps = {
  label: string;
  valueUsd?: number;
  valueOriginal?: number;
  displayCurrency?:
    | Currency
    | {
        sign: string;
        name_ar: string;
        to_dollar_rate: number;
      };
  originalCurrencySign?: string;
  textColorUsd?: string;
  textColorOriginal?: string;
  showIcon?: boolean;
  onPress?: () => void;
};

const AmountDisplay = ({
  label,
  valueUsd,
  valueOriginal,
  displayCurrency,
  originalCurrencySign,
  textColorUsd = "#3628B7",
  textColorOriginal = "#00897B",
  showIcon = true,
  onPress,
}: AmountDisplayProps) => {
  const palette = useThemePalette();
  const content = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <ThemedText weight="medium" style={{ color: palette.accent }}>
        {label}
      </ThemedText>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View>
          <ThemedText
            type="l"
            style={{ color: textColorUsd, textAlign: "center" }}
          >
            {`${Math.round(valueUsd || 0)} ${displayCurrency?.sign || "$"}`}
          </ThemedText>
          <ThemedText style={{ color: textColorOriginal, textAlign: "center" }}>
            {`${Math.round(valueOriginal || 0)} ${originalCurrencySign}`}
          </ThemedText>
        </View>
        {showIcon && (
          <IconSymbol
            name="arrow.up.arrow.down"
            size={20}
            color={palette.text}
          />
        )}
      </View>
    </View>
  );

  return onPress ? (
    <Pressable
      android_ripple={{
        color: "rgba(0,0,0,0.2)",
      }}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
};

interface ActionButtonProps extends TouchableOpacityProps {
  label: string;
  color?: string;
  labelStyle?: TextStyle;
  buttonStyle?: ViewStyle;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  label,
  color = "#00897B",
  labelStyle,
  buttonStyle,
  children,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: hexToRgba(color, 0.2),
          borderRadius: 5,
          overflow: "hidden",
          width: "70%",
          alignSelf: "center",
          marginVertical: 10,
        },
        buttonStyle,
      ]}
      onPress={onPress}
      {...rest}
    >
      {children ? (
        children
      ) : (
        <ThemedText
          style={[
            {
              textAlign: "center",
              color: color,
              paddingVertical: 5,
              paddingHorizontal: 10,
            },
            labelStyle,
          ]}
        >
          {label}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};

export default function TransactionDetailsScreen() {
  const palette = useThemePalette();
  const { id, transaction } = useLocalSearchParams();
  // const tObj = JSON.parse(transaction as string) as Transaction;
  const [tObj, setTObj] = useState<Transaction>();
  const { transactions, updateStatusV2, recordPinAttempt } = useTransactions();
  const { currencies } = useCurrencies();
  const { profile } = useUserProfile();
  const defaultCurrency = DefaultCurrency;
  const { departments } = useDepartments();
  const { agents } = useAgents();
  const [pinCodeValidationInput, setPinCodeValidationInput] = useState("");
  const [payPartialInput, setPayPartialInput] = useState("");
  const [
    isStatusHistoryDetailModalVisible,
    setIsStatusHistoryDetailModalVisible,
  ] = useState<boolean>(false);
  const [selectedStatusHistory, setSelectedStatusHistory] =
    useState<TransactionStatusHistory>();
  useEffect(() => {
    if (transactions) {
      setTObj(transactions.find((t) => t.id === id));
    }
  }, [transactions]);
  const displayCurrency = React.useMemo(() => {
    if (!profile?.currency || !currencies) return defaultCurrency;
    return currencies.find((c) => c.id === profile.currency) ?? defaultCurrency;
  }, [profile?.currency, currencies]);
  const [isSaveTransactionFileLoading, setIsSaveTransactionFileLoading] =
    useState(false);
  const { hasPermission } = useSupabaseHasPermissions(["admin"]);

  const getAgentFn = useCallback(
    (id: string) => {
      const a = agents && agents.find((a) => a.user_id === id);
      if (a) {
        return a.firstname + " " + a.lastname;
      }
      return "الوكيل";
    },
    [agents]
  );

  const shouldDisplayPin = useMemo<boolean>(() => {
    if (hasPermission) {
      return true;
    }
    if (profile && profile.user_id === tObj?.created_by) {
      return true;
    }
    return false;
  }, [hasPermission, profile, tObj]);

  const trxDep = useMemo(
    () => departments && departments.find((d) => d.id === tObj?.department_id),
    [departments, tObj]
  );

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

  const getStatusMetadata = (status: TransactionStatus) =>
    tObj?.status_history
      ?.slice()
      .sort(
        (a, b) =>
          new Date(b.created_at || Date.now()).getTime() -
          new Date(a.created_at || Date.now()).getTime()
      )
      .find((h) => h.curr_status === status) ?? null;

  const handleConfirm = () => {
    if (tObj?.status !== TransactionStatus.PENDING) {
      Alert.alert("", "لايمكن تأكيد المعاملة");
      return;
    }
    Alert.alert(
      "",
      "ستقوم بتأكيد المعاملة",
      [
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.CONFIRMED);
          },
        },
      ],
      { cancelable: true }
    );
  };
  const handleCancel = () => {
    if (tObj?.status !== TransactionStatus.PENDING) {
      Alert.alert("", "لايمكن إلغاء المعاملة");
      return;
    }
    Alert.alert(
      "",
      "ستقوم بإلغاء المعاملة",
      [
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.CANCELED);
          },
        },
      ],
      { cancelable: true }
    );
  };
  const handleRefund = () => {
    if (!hasPermission) {
      Alert.alert("", "ليس لديك الصلاحية");
      return;
    }
    if (tObj?.status !== TransactionStatus.CANCELED) {
      Alert.alert("لايمكن استرداد الأموال");
      return;
    }
    Alert.alert(
      "",
      "ستقوم باسترداد الأموال",
      [
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.REFUNDED);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handlePayout = async () => {
    if (tObj?.status !== TransactionStatus.CONFIRMED) {
      Alert.alert("", "لايمكن الدفع");
      return;
    }

    const isFull = tObj.is_paid_full;

    if (!hasPermission) {
      // NON-ADMIN USER
      if (!isFull) {
        // Partial payment
        if (!payPartialInput) {
          Alert.alert("", "الرّجاء إدخال السعر");
          return;
        }

        const amount = Number(payPartialInput);
        if (isNaN(amount)) {
          Alert.alert("الرجاء إدخال مبلغ صحيح");
          return;
        }

        if (amount > tObj.original_amount) {
          Alert.alert("", "المبلغ أكبر من مبلغ المعاملة");
          return;
        }

        if (!pinCodeValidationInput) {
          Alert.alert("", "الرّجاء إدخال رمز التحقق");
          return;
        }

        if (
          pinCodeValidationInput.trim() !== tObj.pin_code?.toString().trim()
        ) {
          Alert.alert("", "رمز التحقّق غير صحيح");
          recordPinAttempt(tObj, pinCodeValidationInput);

          // 🚨 Block after 3 attempts
          if ((tObj.confirmation_attempts?.length ?? 0) % 3 === 2) {
            await updateStatusV2(tObj, TransactionStatus.BLOCKED);
          }
          return;
        }

        const isFullyPaid = amount === tObj.original_amount;

        Alert.alert("", "تأكيد الدفع", [
          {
            text: "إلغاء",
            style: "cancel",
          },
          {
            text: "متابعة",
            style: "destructive",
            onPress: async () => {
              await updateStatusV2(tObj, TransactionStatus.PAID_OUT, {
                amount,
              });

              if (isFullyPaid) {
                await updateStatusV2(tObj, TransactionStatus.COMPLETED, {
                  amount,
                });
              }
            },
          },
        ]);
      } else {
        // Full payment (non-admin)
        if (!pinCodeValidationInput) {
          Alert.alert("", "الرّجاء إدخال رمز التحقق");
          return;
        }

        if (
          pinCodeValidationInput.trim() !== tObj.pin_code?.toString().trim()
        ) {
          Alert.alert("", "رمز التحقّق غير صحيح");
          recordPinAttempt(tObj, pinCodeValidationInput);

          if ((tObj.confirmation_attempts?.length ?? 0) % 3 === 2) {
            await updateStatusV2(tObj, TransactionStatus.BLOCKED);
          }
          return;
        }

        Alert.alert("", "تأكيد الدفع الكامل", [
          {
            text: "إلغاء",
            style: "cancel",
          },
          {
            text: "متابعة",
            style: "destructive",
            onPress: async () => {
              await updateStatusV2(tObj, TransactionStatus.PAID_OUT, {
                amount: tObj.original_amount,
              });
              await updateStatusV2(tObj, TransactionStatus.COMPLETED, {
                amount: tObj.original_amount,
              });
            },
          },
        ]);
      }

      return;
    }

    // ✅ ADMIN FLOW
    if (!isFull && payPartialInput) {
      const amount = Number(payPartialInput);
      if (isNaN(amount)) {
        Alert.alert("الرجاء إدخال مبلغ صحيح");
        return;
      }

      const isFullyPaid = amount === tObj.original_amount;

      Alert.alert("", "تأكيد الدفع", [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.PAID_OUT, { amount });

            if (isFullyPaid) {
              await updateStatusV2(tObj, TransactionStatus.COMPLETED, {
                amount,
              });
            }
          },
        },
      ]);
      return;
    }

    // Admin full payout (no amount input)
    Alert.alert("", "تأكيد الدفع الكامل", [
      {
        text: "إلغاء",
        style: "cancel",
      },
      {
        text: "متابعة",
        style: "destructive",
        onPress: async () => {
          await updateStatusV2(tObj, TransactionStatus.PAID_OUT, {
            amount: tObj.original_amount,
          });
          await updateStatusV2(tObj, TransactionStatus.COMPLETED, {
            amount: tObj.original_amount,
          });
        },
      },
    ]);
  };

  const handlePayRemaining = () => {
    if (tObj?.status !== TransactionStatus.PAID_OUT) {
      Alert.alert("", "لايمكن دفع المبلغ المتبقي");
      return;
    }

    const payoutStatusMeta = getStatusMetadata(TransactionStatus.PAID_OUT);
    const paidAmount = payoutStatusMeta?.metadata?.amount ?? 0;
    const remainingAmount = tObj.original_amount - paidAmount;

    if (remainingAmount <= 0) {
      Alert.alert("", "لاتوجد مبلغ متبقّي للدفع");
      return;
    }

    Alert.alert(
      "",
      `ستقوم بدفع المبلغ المتبقي وقدره ${remainingAmount} ${tObj.currency.sign}`,
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.COMPLETED, {
              amount: remainingAmount,
            });
          },
        },
      ]
    );
  };
  const handleUnblock = () => {
    if (!hasPermission) {
      Alert.alert("", "ليس لديك الصلاحية");
      return;
    }
    if (tObj?.status !== TransactionStatus.BLOCKED) {
      Alert.alert("", "لايمكن رفع التجميد");
      return;
    }
    Alert.alert(
      "",
      "ستقوم برفع التجميد على المعاملة",
      [
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "متابعة",
          style: "destructive",
          onPress: async () => {
            await updateStatusV2(tObj, TransactionStatus.CONFIRMED);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!transactions || !tObj) {
    return (
      <>
        <Stack.Screen options={{ title: "تفاصيل المعاملة" }} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ThemedText>تحميل البيانات...</ThemedText>
        </View>
      </>
    );
  }

  const currentStatusConfig = statusDisplayMap[tObj.status] ?? {};

  const displayConfirmedSection = !!currentStatusConfig.showConfirmedSection;
  const displayCanceledSection = !!currentStatusConfig.showCanceledSection;
  const displayRefundedSection = !!currentStatusConfig.showRefundedSection;
  const displayPayoutSection = !!currentStatusConfig.showPayoutSection;
  const displayCompletedSection = !!currentStatusConfig.showCompletedSection;
  const displayBlockedSection = !!currentStatusConfig.showBlockedSection;

  const totalAmountUsd =
    (tObj.amount_usd ?? 0) / displayCurrency.to_dollar_rate;
  const totalOriginalAmount = tObj.original_amount;

  const firstInstallmentUsd =
    ((tObj.first_installment ?? 0) * tObj.exchange_rate) /
    displayCurrency.to_dollar_rate;
  const firstInstallmentOriginal = tObj.first_installment ?? 0;

  const remainingAmountUsd =
    (tObj.amount_usd - (tObj.first_installment ?? 0) * tObj.exchange_rate) /
    displayCurrency.to_dollar_rate;
  const remainingOriginalAmount =
    tObj.original_amount - (tObj.first_installment ?? 0);

  const operationCostUsd =
    Math.round((tObj.operation_cost_usd ?? 0) * 100) /
    100 /
    displayCurrency.to_dollar_rate;
  const operationCostOriginal =
    Math.round(
      (tObj.operation_cost_original + tObj.operation_tax_original) * 100
    ) / 100;

  const data = getStatusMetadata(TransactionStatus.PAID_OUT);
  const paidAmountOriginal =
    Math.round((data?.metadata?.amount ?? 0) * 100) / 100;

  const remainingData = getStatusMetadata(TransactionStatus.COMPLETED);
  const remainingPaidOriginal = remainingData?.metadata?.amount || 0;

  const renderFormattedTransactionHistoryDetail = (
    trx: Transaction,
    self: boolean = false,
    isAdmin: boolean = false,
    onLinkPress: () => void
  ) => {
    const template = getTransactionHistoryDetailTemplate(
      selectedStatusHistory?.curr_status,
      self
    );
    const parts = template.split(/(@date|@user)/);
    return parts.map((part, index) => {
      if (part === "@date") {
        return (
          <ThemedText key={index} weight="bold">
            {new Date(selectedStatusHistory?.created_at ?? 0).toLocaleString()}
          </ThemedText>
        );
      } else if (part === "@user") {
        const userId = selectedStatusHistory?.created_by;
        const userDisplay = userId ? getAgentFn(userId) : "الوكيل";

        if (isAdmin && userId) {
          return (
            <Link
              href={{ pathname: "/(auth)/agent/[id]", params: { id: userId } }}
              key={index}
              style={{ textDecorationLine: "underline" }}
              onPress={onLinkPress}
            >
              <ThemedText weight="bold">{userDisplay}</ThemedText>
            </Link>
          );
        } else {
          return (
            <ThemedText key={index} weight="bold">
              {userDisplay}
            </ThemedText>
          );
        }
      } else {
        return <ThemedText key={index}>{part}</ThemedText>;
      }
    });
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
              <ThemedText style={{ width: "70%" }}>
                {"#" + tObj?.code}
              </ThemedText>
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

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <ThemedText
                weight="bold"
                style={{
                  color: palette.accent,
                  width: "30%",
                }}
              >
                الفرع
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText weight="medium">{trxDep?.name}</ThemedText>
                <ThemedText>{`${trxDep?.country_ar} (${trxDep?.country_code})`}</ThemedText>
                <ThemedText>{trxDep?.city}</ThemedText>
                <ThemedText>{trxDep?.address}</ThemedText>
                <ThemedText>{trxDep?.zipcode}</ThemedText>
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
                الحالة
              </ThemedText>
              <View style={{ width: "70%" }}>
                <ThemedText
                  weight="medium"
                  style={{ color: getItemColorByStatus(tObj?.status) }}
                >
                  {`${
                    getTransactionArabicStatusFromTransaction(tObj) ??
                    "غير معروفة"
                  } (${tObj?.status ?? ""})`}
                </ThemedText>
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

            <AmountDisplay
              label="المبلغ الجملي"
              valueUsd={totalAmountUsd}
              valueOriginal={totalOriginalAmount}
              displayCurrency={displayCurrency}
              originalCurrencySign={tObj.currency.sign}
              onPress={() => {
                setIsStatusHistoryDetailModalVisible(true);
                setSelectedStatusHistory(
                  getStatusMetadata(TransactionStatus.PENDING) || undefined
                );
              }}
            />

            <AmountDisplay
              label={
                tObj.is_paid_full
                  ? "تم أستلام المبلغ كاملا"
                  : "تم أستلام القسط الأوّل بقيمة"
              }
              valueUsd={
                tObj.is_paid_full ? totalAmountUsd : firstInstallmentUsd
              }
              valueOriginal={
                tObj.is_paid_full
                  ? totalOriginalAmount
                  : firstInstallmentOriginal
              }
              displayCurrency={displayCurrency}
              originalCurrencySign={tObj.currency.sign}
              onPress={() => {
                setIsStatusHistoryDetailModalVisible(true);
                setSelectedStatusHistory(
                  getStatusMetadata(TransactionStatus.PENDING) || undefined
                );
              }}
            />

            {!tObj.is_paid_full && (
              <AmountDisplay
                label="المبلغ المتبقي"
                valueUsd={tObj.is_paid_full ? 0 : remainingAmountUsd}
                valueOriginal={tObj.is_paid_full ? 0 : remainingOriginalAmount}
                displayCurrency={displayCurrency}
                originalCurrencySign={tObj.currency.sign}
                textColorUsd={palette.error}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.PENDING) || undefined
                  );
                }}
              />
            )}

            {/* CONFIRM, CANCEL */}
            {/* Label */}
            {displayConfirmedSection && !tObj.is_paid_full && (
              <AmountDisplay
                label="تم استلام المبلغ المتبقي"
                valueUsd={remainingAmountUsd}
                valueOriginal={remainingOriginalAmount}
                displayCurrency={displayCurrency}
                originalCurrencySign={tObj.currency.sign}
                textColorUsd={palette.error}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.CONFIRMED) || undefined
                  );
                }}
              />
            )}

            {displayConfirmedSection && tObj.is_paid_full && (
              <Pressable
                android_ripple={{ color: "rgba(0,0,0,0.2)" }}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.CONFIRMED) || undefined
                  );
                }}
              >
                <ThemedText weight="medium" style={{ color: palette.accent }}>
                  تمّ تأكيد المعاملة
                </ThemedText>
              </Pressable>
            )}

            {displayCanceledSection && (
              <ThemedText weight="medium" style={{ color: palette.error }}>
                تم إلغاء المعاملة
              </ThemedText>
            )}

            {/* Action */}
            {tObj?.status === TransactionStatus.PENDING && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 20,
                  justifyContent: "center",
                  marginVertical: 10,
                }}
              >
                <ActionButton
                  onPress={handleConfirm}
                  label="تأكيد المعاملة"
                  buttonStyle={{
                    backgroundColor: hexToRgba(palette.success, 0.2),
                    borderRadius: 5,
                    overflow: "hidden",
                    width: "50%",
                  }}
                  labelStyle={{
                    color: palette.success,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                  }}
                />
                <ActionButton
                  onPress={handleCancel}
                  label="إلغاء المعاملة"
                  buttonStyle={{
                    backgroundColor: hexToRgba(palette.error, 0.2),
                    borderRadius: 5,
                    overflow: "hidden",
                    width: "50%",
                  }}
                  labelStyle={{
                    color: palette.error,
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                  }}
                />
              </View>
            )}

            {/* REFUNDED */}
            {/* Label */}
            {displayRefundedSection && (
              <ThemedText weight="medium" style={{ color: palette.success }}>
                تمّ استرداد الأموال للحريف
              </ThemedText>
            )}

            {/* Action */}
            {tObj?.status === TransactionStatus.CANCELED && (
              <ActionButton label="استرداد الأموال" onPress={handleRefund} />
            )}

            {/* PAYOUT */}
            {/* Label */}
            {displayPayoutSection && tObj.is_paid_full && (
              <AmountDisplay
                label="تمّ دفع المبلغ للحريف كاملا"
                valueUsd={totalAmountUsd}
                valueOriginal={totalOriginalAmount}
                displayCurrency={displayCurrency}
                originalCurrencySign={tObj.currency.sign}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.PAID_OUT) || undefined
                  );
                }}
              />
            )}

            {displayPayoutSection && !tObj.is_paid_full && (
              <AmountDisplay
                label="تمّ دفع الجزء الأولي للحريف"
                valueUsd={getConvertedAmount(
                  paidAmountOriginal,
                  tObj.currency,
                  displayCurrency
                )}
                valueOriginal={paidAmountOriginal}
                displayCurrency={displayCurrency}
                originalCurrencySign={tObj.currency.sign}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.PAID_OUT) || undefined
                  );
                }}
              />
            )}

            {/* Action */}
            {tObj?.status === TransactionStatus?.CONFIRMED && (
              <View style={{ marginVertical: 10, gap: 10 }}>
                {!hasPermission && (
                  <ThemedTextInput
                    keyboardType="numeric"
                    placeholder="الرّمز السرّي (PIN)"
                    value={pinCodeValidationInput}
                    onChangeText={setPinCodeValidationInput}
                  />
                )}
                {!tObj.is_paid_full && (
                  <ThemedTextInput
                    keyboardType="numeric"
                    placeholder="المبلغ المدفوع"
                    value={payPartialInput}
                    onChangeText={setPayPartialInput}
                  />
                )}
                <ActionButton label="دفع المبلغ" onPress={handlePayout} />
              </View>
            )}

            {/* UNBLOCK */}
            {/* Label */}
            {displayBlockedSection && (
              <ThemedText weight="medium" style={{ color: palette.error }}>
                تمّ تحجير المعاملة نظرا لفشل التحقق من الرّمز لثلاثة محاولات
                متتالية
              </ThemedText>
            )}
            {/* Action */}
            {tObj?.status === TransactionStatus.BLOCKED && (
              <View>
                <ActionButton label="رفع التجميد" onPress={handleUnblock} />
              </View>
            )}

            {/* PAID_OUT to COMPLETED for partial transaction */}
            {/* Label */}
            {displayCompletedSection && !tObj.is_paid_full && (
              <AmountDisplay
                label="تمّ دفع المبلغ المتبقي"
                valueUsd={getConvertedAmount(
                  remainingPaidOriginal,
                  tObj.currency,
                  displayCurrency
                )}
                valueOriginal={remainingPaidOriginal}
                displayCurrency={displayCurrency}
                originalCurrencySign={tObj.currency.sign}
                onPress={() => {
                  setIsStatusHistoryDetailModalVisible(true);
                  setSelectedStatusHistory(
                    getStatusMetadata(TransactionStatus.COMPLETED) || undefined
                  );
                }}
              />
            )}
            {displayCompletedSection && (
              <ThemedText weight="medium" style={{ color: palette.accent }}>
                اكتملت المعاملة
              </ThemedText>
            )}
            {/* Action */}
            {tObj?.status === TransactionStatus.PAID_OUT &&
              !tObj?.is_paid_full && (
                <View>
                  <ActionButton
                    label="دفع المبلغ المتبقّي"
                    onPress={handlePayRemaining}
                  />
                </View>
              )}

            <AmountDisplay
              label="سعر المعاملة (سعر أضافي) :"
              valueUsd={operationCostUsd}
              valueOriginal={operationCostOriginal}
              displayCurrency={displayCurrency}
              originalCurrencySign={tObj.currency.sign}
              textColorUsd={palette.error}
              showIcon={true}
            />

            <View
              style={{
                height: 5,
                borderTopColor: "rgba(0,0,0,0.5)",
                borderTopWidth: 0.75,
                borderStyle: "dashed",
                marginVertical: 20,
              }}
            />
            {shouldDisplayPin && <PinCodeDisplay pinCode={tObj.pin_code} />}
          </View>
        </ThemedView>
      </ScrollView>

      <Modal
        visible={isStatusHistoryDetailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsStatusHistoryDetailModalVisible(false)}
        onDismiss={() => setIsStatusHistoryDetailModalVisible(false)}
      >
        <View style={styles.shmModalBackground}>
          <View style={styles.shmModalContainer}>
            <ThemedText style={styles.shmModalText}>
              {!selectedStatusHistory ? (
                <ThemedText>لا توجد تفاصيل</ThemedText>
              ) : (
                renderFormattedTransactionHistoryDetail(
                  tObj,
                  profile?.user_id === selectedStatusHistory.created_by,
                  hasPermission,
                  () => {
                    setIsStatusHistoryDetailModalVisible(false);
                  }
                )
              )}
            </ThemedText>
            <TouchableOpacity
              onPress={() =>
                setIsStatusHistoryDetailModalVisible((prev) => !prev)
              }
              style={styles.shmCloseButton}
            >
              <ThemedText>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  shmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shmButton: {
    padding: 10,
    backgroundColor: "#DDD",
    borderRadius: 5,
  },
  shmModalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shmModalContainer: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  shmModalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  shmCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#DDD",
    borderRadius: 5,
  },
});
