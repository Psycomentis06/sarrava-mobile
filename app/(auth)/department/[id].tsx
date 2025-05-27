import Person from "@/components/svg/Person";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { CurrencySymbols } from "@/constants/CurrencySymbols";
import { useUserProfile } from "@/contexts/profile";
import { useAgents } from "@/hooks/useAgents";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useDepartmentAnalytics } from "@/hooks/useDepartmentAnalytics";
import { useThemePalette } from "@/hooks/useThemePalette";
import {
  getArabicDepartmentRole,
  getDepartmentRoleIcon,
} from "@/services/departments";
import {
  AgentDepartment,
  Currency,
  DepartmentRole,
  DepartmentTransactionsAnalytics,
  UserProfile,
} from "@/utils/models";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { TabBar, TabView } from "react-native-tab-view";

function DetailsScene({ depDetails }: { depDetails: AgentDepartment }) {
  return (
    <ThemedView style={{ flex: 1, gap: 20, padding: 10 }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
      >
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          إسم الفرع :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.name}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          البلد :{" "}
        </ThemedText>
        <ThemedText
          style={{ width: "70%" }}
          type="md"
        >{`${depDetails.country_ar} (${depDetails.country_code})`}</ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          المدينة :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.city}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          الرّمز البريدي :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.zipcode}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          العنوان :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.address}
        </ThemedText>
      </View>

      {depDetails.created_at && (
        <View
          style={{ flexDirection: "row", alignItems: "center", opacity: 0.6 }}
        >
          <ThemedText>تمّ إضافة الفرع بتاريخ : </ThemedText>
          <ThemedText>
            {new Date(depDetails.created_at).toLocaleString()}
          </ThemedText>
        </View>
      )}

      {!depDetails?.updated_at ? null : (
        <ThemedText type="sm" style={{ opacity: 0.6, marginTop: 10 }}>
          {`أخر تحديث بتاريخ ${new Date(
            depDetails.updated_at
          ).toLocaleDateString()} على السّاعة ${new Date(
            depDetails.updated_at
          ).toLocaleTimeString()}`}
          {!depDetails?.updated_by ? null : ` بواسطة ${depDetails.updated_by}`}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function AgentsScene({ depAgents }: { depAgents: UserProfile[] }) {
  const router = useRouter();
  const palette = useThemePalette();
  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={depAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const RoleIcon = getDepartmentRoleIcon(
            item.department_role ?? DepartmentRole.STAFF
          );
          // const roleColor = hexToRgba(getDepartmentRoleColor(item.department_role ?? DepartmentRole.STAFF), 0.2)
          return (
            <View style={{ borderRadius: 10, overflow: "hidden" }}>
              <Pressable
                style={{
                  backgroundColor: palette.tint,
                  // backgroundColor: roleColor,
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
                onPress={() =>
                  router.navigate({
                    pathname: "/(auth)/agent/[id]",
                    params: { id: item.id, agent: JSON.stringify(item) },
                  })
                }
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.profile_picture ? (
                    <Image
                      defaultSource={require("@/assets/images/anonymous-avatar.jpg")}
                      source={{
                        uri: item.profile_picture ?? "",
                        width: 60,
                        height: 60,
                      }}
                      style={{
                        borderRadius: 30,
                        marginRight: 10,
                        width: 60,
                        height: 60,
                      }}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/anonymous-avatar.jpg")}
                      style={{
                        borderRadius: 30,
                        marginRight: 10,
                        width: 60,
                        height: 60,
                      }}
                    />
                  )}
                  <View>
                    <ThemedText
                      type="l"
                      weight="medium"
                    >{`${item.firstname} ${item.lastname}`}</ThemedText>
                    <ThemedText type="md" style={{ opacity: 0.8 }}>
                      {item.email}
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 5,
                        opacity: 0.7,
                        alignItems: "center",
                      }}
                    >
                      {item.department || item.department_id ? (
                        <RoleIcon />
                      ) : (
                        <Person />
                      )}
                      <ThemedText weight="bold">
                        {item.department || item.department_id
                          ? getArabicDepartmentRole(
                              item.department_role ?? DepartmentRole.STAFF
                            )
                          : "مستقل"}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
      />
    </ThemedView>
  );
}

function DepartmentAnalyticsScene({
  depDetails,
}: {
  depDetails: AgentDepartment;
}) {
  const { analytics, isLoading } = useDepartmentAnalytics();
  const { profile } = useUserProfile();
  const { currencies } = useCurrencies();
  const [profileCurrency, setProfileCurrency] = useState<
    Currency | undefined
  >();
  const [depAnalytics, setDepAnalytics] =
    useState<DepartmentTransactionsAnalytics | null>(null);

  useEffect(() => {
    if (profile?.currency) {
      setProfileCurrency(currencies.find((c) => c.id === profile.currency));
    }
  }, [profile, currencies]);

  useEffect(() => {
    if (!isLoading) {
      const matched = analytics.find((d) => d.department_id === depDetails.id);
      setDepAnalytics(matched || null);
    }
  }, [isLoading, analytics, depDetails]);

  const getCurrencyLabel = (value: number, percent = false): string => {
    if (percent) return `${value}%`;
    if (profileCurrency) {
      const converted = Math.round(value / profileCurrency.to_dollar_rate);
      return `${converted} ${CurrencySymbols.get(profileCurrency.sign)}`;
    }
    return `${Math.round(value)} $`;
  };

  if (isLoading) return <LoadingOverlay />;

  const defaultDepAnalytics: DepartmentTransactionsAnalytics = {
    department_id: depDetails.id,
    total_transactions: 0,
    confirmed_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
    canceled_transactions: 0,
    confirmed_usd_amount: 0,
    pending_usd_amount: 0,
    failed_usd_amount: 0,
    canceled_usd_amount: 0,
    confirmed_earnings_usd: 0,
    confirmed_tax_fees_usd: 0,
    pending_earnings_usd: 0,
    pending_tax_fees_usd: 0,
    avg_confirmed_transaction_usd: 0,
    first_transaction_date: "-",
    last_transaction_date: "-",
    success_rate_percent: 0,
    current_month_confirmed_transactions: 0,
    current_month_confirmed_usd_amount: 0,
    current_month_earnings_usd: 0,
  };

  const data = depAnalytics || defaultDepAnalytics;

  const items = [
    { label: "عدد المعاملات", value: data.total_transactions },
    { label: "المعاملات المكتملة", value: data.confirmed_transactions },
    { label: "المعاملات المعلقة", value: data.pending_transactions },
    { label: "المعاملات الفاشلة", value: data.failed_transactions },
    { label: "المعاملات الملغاة", value: data.canceled_transactions },
    { label: "الإيرادات المكتملة", value: data.confirmed_earnings_usd },
    { label: "الرسوم المكتملة", value: data.confirmed_tax_fees_usd },
    { label: "الإيرادات المعلقة", value: data.pending_earnings_usd },
    { label: "الرسوم المعلقة", value: data.pending_tax_fees_usd },
    { label: "متوسط قيمة العملية", value: data.avg_confirmed_transaction_usd },
    { label: "معدل النجاح", value: data.success_rate_percent, percent: true },
    {
      label: "إجمالي المعاملات المكتملة بالدولار",
      value: data.confirmed_usd_amount,
    },
    {
      label: "إجمالي المعاملات المعلقة بالدولار",
      value: data.pending_usd_amount,
    },
    {
      label: "المعاملات هذا الشهر",
      value: data.current_month_confirmed_transactions,
    },
    {
      label: "قيمة معاملات هذا الشهر",
      value: data.current_month_confirmed_usd_amount,
    },
    { label: "إيرادات هذا الشهر", value: data.current_month_earnings_usd },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText style={styles.header}>إحصائيات القسم</ThemedText>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <View key={index} style={styles.card}>
            <ThemedText style={styles.label}>{item.label}</ThemedText>
            <ThemedText style={styles.value}>
              {getCurrencyLabel(item.value, item.percent)}
            </ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function DepartmentDetailsScreen() {
  const { id, dep } = useLocalSearchParams();
  const depDetails = JSON.parse(dep as string) as AgentDepartment;
  const layout = useWindowDimensions();
  const palette = useThemePalette();
  const [tabIndex, setTabIndex] = useState<number>(0);

  const { agents } = useAgents();

  const departmentAgents = useMemo(() => {
    return agents.filter((a) => {
      if (a.department_id) return a.department_id === depDetails.id;
      if (a.department?.id) return a.department.id === depDetails.id;
      return false;
    });
  }, [agents, depDetails.id]);

  const [routes, setRoutes] = useState([
    { key: "details", title: "معلومات الفرع" },
    { key: "agents", title: `الوكلاء (0)` },
    { key: "analytics", title: `الإحصائيات` },
  ]);

  useEffect(() => {
    setRoutes([
      { key: "details", title: "معلومات الفرع" },
      { key: "agents", title: `الوكلاء (${departmentAgents.length})` },
      { key: "analytics", title: `الإحصائيات` },
    ]);
  }, [departmentAgents.length]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case "details":
        return <DetailsScene depDetails={depDetails} />;
      case "agents":
        return <AgentsScene depAgents={departmentAgents} />;
      case "analytics":
        return <DepartmentAnalyticsScene depDetails={depDetails} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: depDetails.name ?? "" }} />
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        lazy={true}
        renderLazyPlaceholder={() => <LoadingOverlay />}
        renderTabBar={(props) => (
          <TabBar {...props} style={{ backgroundColor: palette.accent }} />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Tajawal",
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
    fontFamily: "Tajawal",
  },
  value: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
    fontFamily: "Tajawal",
  },
});
