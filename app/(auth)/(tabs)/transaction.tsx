import ItemsNotFound from "@/components/svg/ItemsNotFound";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useUserProfile } from "@/contexts/profile";
import { useDepartments } from "@/hooks/useDepartments";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import {
  TransactionSearchScope,
  TransactionSearchScopeOptions,
  TransactionSearchType,
  TransactionSortOptions,
  useTransactions,
} from "@/hooks/useTransactions";
import { hexToRgba } from "@/utils/colors";
import {
  AgentDepartment,
  Transaction,
  TransactionStatus,
} from "@/utils/models";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { State, TapGestureHandler } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TransactionScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const router = useRouter();
  const {
    updateStatus,
    search,
    searchResults: transactions,
    isLoading: isTransactionsLoading,
    isLoadMoreLoading,
    hasNextPage,
    reload,
    loadMore,
  } = useTransactions();
  const [
    isUpdateTransactionStatusModalVisible,
    setIsUpdateTransactionStatusModalVisible,
  ] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isSearchInputFocused, setIsSearchInputFocused] =
    useState<boolean>(false);
  const [searchType, setSearchType] = useState<TransactionSearchType>(
    TransactionSearchType.ALL
  );
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const { hasPermission: isAdmin } = useSupabaseHasPermissions(["admin"]);
  const { departments } = useDepartments();
  const { profile } = useUserProfile();
  const [searchScope, setSearchScope] = useState<TransactionSearchScopeOptions>(
    { scope: TransactionSearchScope.ALL }
  );
  const [sort, setSort] = useState<TransactionSortOptions>({
    key: "created_at",
    direction: "desc",
  });

  useEffect(() => {
    search(searchValue, searchType, searchScope, sort);
  }, [searchValue, searchType, searchScope, sort]);

  useEffect(() => {
    if (isAdmin) {
      setSearchScope({
        scope: TransactionSearchScope.ALL,
      });
    } else if (profile?.departments?.length) {
      setSearchScope({
        scope: TransactionSearchScope.JOINED_DEPARTMENTS,
        departmentIds: profile.departments.map((r) => r.department_id),
      });
    }
  }, [isAdmin, profile]);

  const agentDepartments = useMemo((): AgentDepartment[] => {
    if (isAdmin) {
      return departments;
    }

    if (!profile?.departments || !departments) {
      return [];
    }

    return profile.departments
      .map((relation) => {
        const fullDepartment = departments.find(
          (d) => d.id === relation.department_id
        );
        if (fullDepartment) {
          return {
            ...fullDepartment,
            role: relation.role,
            agentRelationCreatedAt: relation.created_at,
            addedBy: relation.added_by,
          };
        }
        return null;
      })
      .filter(Boolean) as AgentDepartment[];
  }, [profile, departments, isAdmin]);

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
        return "فشلت";
      case TransactionStatus.CANCELED:
        return "ألغيت";
      case TransactionStatus.CONFIRMED:
        return "إكتملت";
      case TransactionStatus.PENDING:
        return "قيد الانتظار";
      default:
        return "غير مصنف";
    }
  };

  const getTransactionArabicStatusFromTransaction = (
    trx: Transaction
  ): string => {
    switch (trx.status) {
      case TransactionStatus.FAILED:
        return "فشلت";
      case TransactionStatus.CANCELED:
        if (trx.is_paid_full === false) {
          return "تمّ إسترداد الأموال";
        }
        return "ألغيت";
      case TransactionStatus.CONFIRMED:
        return "إكتملت";
      case TransactionStatus.PENDING:
        if (trx.is_paid_full === true) {
          return "دفعة بالكامل";
        } else if (trx.is_paid_full === false) {
          return "دفعة جزئيا";
        } else {
          return "قيد الانتظار";
        }
      default:
        return "غير مصنف";
    }
  };

  const handleUpdateTransactionState = async (status: TransactionStatus) => {
    if (selectedTransaction == null) {
      Alert.alert("خطأ", "لاتوجد معاملة محدّدة للتحديث");
      setIsUpdateTransactionStatusModalVisible(false);
      return;
    }
    // update status
    await Alert.alert(
      "تحديث حالة المعاملة",
      "أنت بصدد تحديث حالة العملة إلى " +
        getTransactionArabicStatus(status) +
        ". هل أنت متأكّد؟ (لايمكنك تغيير الحالة في المستقبل)",
      [
        {
          text: "تأكيد",
          style: "default",
          onPress: () => {
            setIsUpdateTransactionStatusModalVisible(false);
            updateTransactionStatus(selectedTransaction, status);
            setSelectedTransaction(null);
          },
        },
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {
            setIsUpdateTransactionStatusModalVisible(false);
            setSelectedTransaction(null);
          },
        },
      ]
    );

    if (Platform.OS === "web") {
      setIsUpdateTransactionStatusModalVisible(false);
      updateTransactionStatus(selectedTransaction, status);
      setSelectedTransaction(null);
    }
  };

  const updateTransactionStatus = async (
    transaction: Transaction,
    status: TransactionStatus
  ) => {
    try {
      await updateStatus(transaction, status);
      Alert.alert(
        "نجاح العملية",
        "تم تحديث حالة المعاملة إلى " +
          getTransactionArabicStatus(status) +
          " بنجاح"
      );
    } catch (e) {
      console.error(e);
    }
  };

  // modal to update transaction status
  const renderUpdateStatusModal = () => (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isUpdateTransactionStatusModalVisible}
      onRequestClose={() => setIsUpdateTransactionStatusModalVisible(false)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ThemedText type="l" weight="medium" style={styles.modalTitle}>
            تحديث حالة المعاملة
          </ThemedText>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() =>
              handleUpdateTransactionState(TransactionStatus.CONFIRMED)
            }
          >
            <ThemedText>أكتملت</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() =>
              handleUpdateTransactionState(TransactionStatus.FAILED)
            }
          >
            <ThemedText>فشلت</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() =>
              handleUpdateTransactionState(TransactionStatus.CANCELED)
            }
          >
            <ThemedText>ألغيت</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, styles.cancelOption]}
            onPress={() => setIsUpdateTransactionStatusModalVisible(false)}
          >
            <ThemedText style={styles.cancelText}>
              الرّجوع إلى الوراء
            </ThemedText>
          </TouchableOpacity>
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
      {renderUpdateStatusModal()}
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
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                width: 115,
                display: isSearchInputFocused ? "none" : "flex",
              }}
            >
              <Picker
                style={{ fontSize: 8 }}
                mode="dropdown"
                selectedValue={searchType}
                onValueChange={setSearchType}
              >
                <Picker.Item label="الكلّ" value={TransactionSearchType.ALL} />
                <Picker.Item
                  label="المرسل"
                  value={TransactionSearchType.SENDER}
                />
                <Picker.Item
                  label="المستفيد"
                  value={TransactionSearchType.RECEIVER}
                />
                <Picker.Item
                  label="الرّقم"
                  value={TransactionSearchType.CODE}
                />
              </Picker>
            </View>
            <ThemedTextInput
              placeholder="بحث"
              containerStyle={{ width: isSearchInputFocused ? "90%" : 150 }}
              value={searchInput}
              onChangeText={setSearchInput}
              onFocus={() => setIsSearchInputFocused(true)}
              onBlur={() => setIsSearchInputFocused(false)}
              returnKeyType="search"
              onEndEditing={() => setSearchValue(searchInput)}
            />
          </View>
          <ThemedButton
            style={{
              width: 45,
              borderRadius: "50%",
              display: isSearchInputFocused ? "none" : "flex",
            }}
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

        <ScrollView
          horizontal={true}
          style={{ marginTop: 5, minHeight: 50, maxHeight: 50 }}
          contentContainerStyle={{ alignItems: "center" }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {isAdmin && (
            <TapGestureHandler
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END) {
                  setSearchScope({ scope: TransactionSearchScope.ALL });
                }
              }}
            >
              <View
                style={[
                  styles.searchScopeButton,
                  {
                    backgroundColor:
                      searchScope.scope === TransactionSearchScope.ALL
                        ? palette.accent
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      searchScope.scope === TransactionSearchScope.ALL
                        ? "white"
                        : "black",
                  }}
                >
                  الكلّ
                </ThemedText>
              </View>
            </TapGestureHandler>
          )}
          {!isAdmin && (
            <TapGestureHandler
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END) {
                  setSearchScope({
                    scope: TransactionSearchScope.JOINED_DEPARTMENTS,
                    departmentIds: agentDepartments.map((d) => d.id),
                  });
                }
              }}
            >
              <View
                style={[
                  styles.searchScopeButton,
                  {
                    backgroundColor:
                      searchScope.scope ===
                      TransactionSearchScope.JOINED_DEPARTMENTS
                        ? palette.accent
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      searchScope.scope ===
                      TransactionSearchScope.JOINED_DEPARTMENTS
                        ? "white"
                        : "black",
                  }}
                >
                  الكلّ
                </ThemedText>
              </View>
            </TapGestureHandler>
          )}
          {profile && (
            <TapGestureHandler
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END) {
                  setSearchScope({
                    scope: TransactionSearchScope.OWNER,
                    userId: profile?.user_id,
                  });
                }
              }}
            >
              <View
                style={[
                  styles.searchScopeButton,
                  {
                    backgroundColor:
                      searchScope.scope === TransactionSearchScope.OWNER
                        ? palette.accent
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      searchScope.scope === TransactionSearchScope.OWNER
                        ? "white"
                        : "black",
                  }}
                >
                  معاملاتي
                </ThemedText>
              </View>
            </TapGestureHandler>
          )}

          {agentDepartments.map((dep) => (
            <TapGestureHandler
              key={dep.id}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END) {
                  setSearchScope({
                    scope: TransactionSearchScope.DEPARTMENT,
                    departmentId: dep.id,
                  });
                }
              }}
            >
              <View
                style={[
                  styles.searchScopeButton,
                  {
                    backgroundColor:
                      searchScope.scope === TransactionSearchScope.DEPARTMENT &&
                      searchScope.departmentId === dep.id
                        ? palette.accent
                        : "rgba(0,0,0,0.2)",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color:
                      searchScope.scope === TransactionSearchScope.DEPARTMENT &&
                      searchScope.departmentId === dep.id
                        ? "white"
                        : "black",
                  }}
                >
                  {dep.name}
                </ThemedText>
              </View>
            </TapGestureHandler>
          ))}
        </ScrollView>

        <View style={{ flexDirection: "row" }}>
          <Picker
            style={{ width: "70%" }}
            selectedValue={sort.key}
            onValueChange={(value) => setSort((s) => ({ ...s, key: value }))}
          >
            <Picker.Item label="حسب التاريخ" value="created_at" />
            <Picker.Item label="حسب السعر" value="original_amount" />
          </Picker>

          <Picker
            style={{ width: "30%" }}
            selectedValue={sort.direction}
            onValueChange={(value) =>
              setSort((s) => ({ ...s, direction: value }))
            }
          >
            <Picker.Item label="تنازلي" value="desc" />
            <Picker.Item label="تصاعدي" value="asc" />
          </Picker>
        </View>

        {isTransactionsLoading ? (
          <LoadingOverlay text="تحميل بيانات المعاملات" />
        ) : (
          <>
            <ThemedText style={{ opacity: 0.6 }}>
              تمّ العثور على{" "}
              <ThemedText weight="bold">{transactions.length}</ThemedText>{" "}
              معاملة
            </ThemedText>
            <FlatList
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 20,
              }}
              style={{ paddingHorizontal: 10 }}
              data={transactions}
              onRefresh={async () => {
                setIsReloading(true);
                try {
                  await reload();
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsReloading(false);
                }
              }}
              refreshing={isReloading}
              keyExtractor={(i) => i.id}
              ListEmptyComponent={
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
                    لم نتمكن من العثور على أي معاملة
                  </ThemedText>
                </View>
              }
              onEndReached={async () => {
                if (hasNextPage && !isLoadMoreLoading) {
                  await loadMore();
                }
              }}
              ListFooterComponent={
                isLoadMoreLoading ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : null
              }
              renderItem={(i) => {
                return (
                  <View key={i.item.id}>
                    <Pressable
                      style={[
                        styles.transactionsListItem,
                        {
                          backgroundColor:
                            i.item?.__internal?.syncStatus === "PENDING"
                              ? hexToRgba(palette.accent, 0.2)
                              : i.item?.__internal?.syncStatus === "ERROR"
                              ? hexToRgba(palette.error, 0.2)
                              : palette.tint,
                        },
                      ]}
                      android_ripple={{
                        color: "rgba(0,0,0,0.26)",
                        foreground: true,
                        borderless: false,
                      }}
                      onLongPress={() => {
                        const status = i.item?.status;
                        if (status == TransactionStatus.PENDING) {
                          setIsUpdateTransactionStatusModalVisible(true);
                          setSelectedTransaction(i.item);
                        }
                      }}
                      onPress={() => {
                        router.push({
                          pathname: "/transaction/[id]",
                          params: {
                            id: i.item.id,
                            transaction: JSON.stringify(i.item),
                          },
                        });
                      }}
                    >
                      <View
                        style={{
                          justifyContent: "space-between",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <ThemedText type="xs" style={{ opacity: 0.7 }}>
                          {"#" + i.item.code}
                        </ThemedText>
                        <ThemedText type="sm">
                          {new Date(i.item.created_at).toLocaleString()}
                        </ThemedText>
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
                            {i.item.original_amount +
                              " " +
                              i.item.currency.sign}
                          </ThemedText>
                        </View>
                        <ThemedText
                          style={{ textAlign: "right", opacity: 0.7 }}
                        >
                          الحالة:{" "}
                          <ThemedText
                            weight="medium"
                            style={{
                              color: getItemColorByStatus(i.item.status),
                              fontSize: 14,
                            }}
                          >
                            {getTransactionArabicStatusFromTransaction(i.item)}
                          </ThemedText>
                        </ThemedText>
                      </View>
                    </Pressable>
                  </View>
                );
              }}
            />
          </>
        )}
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
  searchScopeButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginHorizontal: 10,
    borderRadius: 7,
    overflow: "hidden",
  },
});
