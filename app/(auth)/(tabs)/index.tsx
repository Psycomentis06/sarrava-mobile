import ArrowsExchange from "@/components/svg/ArrowsExchange";
import BitcoinExchange from "@/components/svg/BitcoinExchange";
import Exchange from "@/components/svg/Exchange";
import ListSvg from "@/components/svg/List";
import Money from "@/components/svg/Money";
import Money2 from "@/components/svg/Money2";
import ReciptTax from "@/components/svg/ReciptTax";
import ReportBox from "@/components/svg/ReportBox";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useUserProfile } from "@/contexts/profile";
import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { hexToRgba } from "@/utils/colors";
import { AgentTransactionsAnalytics } from "@/utils/models";
import { Link, useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnalyticsCardsComponentProps = {
  transactionsAnalytics: AgentTransactionsAnalytics | null;
  initialVisibleCards: number;
};

type AnalyticsCardComponentProps = {
  icon: React.ReactNode;
  label: string | number;
  value: string | number;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [transactionsAnalytics, setTransactionsAnalytics] =
    useState<AgentTransactionsAnalytics | null>(null);
  const [isSessionLoading, session] = UseSupabaseSession();
  const { profile } = useUserProfile();

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [120, 60],
    extrapolate: "clamp",
  });

  const textOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const getAnalytics = async () => {
    const { data, error } = await supabase
      .from("transactions_agent_stats_view")
      .select()
      .eq("agent_id", session?.user.id)
      .single();

    if (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء تحميل بيانات الأحصائيات");
    }

    if (data) {
      console.log(data);
      setTransactionsAnalytics(data);
    }
  };

  useEffect(() => {
    if (session) {
      getAnalytics();
    }
  }, [isSessionLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: "#3628B7" }}>
      {/* Parallax Header */}
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight, paddingTop: insets.top },
        ]}
      >
        <Animated.Text style={[styles.headerText, { opacity: textOpacity }]}>
          مرحبا, {`${profile?.firstname} ${profile?.lastname}`}
        </Animated.Text>
        <Pressable>
          <IconSymbol name="bell" size={24} color="white" />
        </Pressable>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: 130 }} // Prevent overlap
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.container}>
          {/* Overview Stats */}
          <View style={{ paddingTop: 40, paddingBottom: 20 }}>
            <AnalyticsCards
              transactionsAnalytics={transactionsAnalytics}
              initialVisibleCards={4}
            />
          </View>

          {/* Separator */}
          <View
            style={{
              height: 1,
              backgroundColor: hexToRgba("#fff", 0.2),
            }}
          ></View>

          {/* Quick Actions */}
          <View style={{ marginTop: 20 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <Pressable
                style={styles.quickActionButton}
                android_ripple={{
                  color: "rgba(0, 0, 0, 0.26)",
                  foreground: true,
                }}
                android_disableSound
                onPress={() => navigation.navigate("transaction/add" as never)}
              >
                <Exchange />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "Tajawal",
                  }}
                >
                  معاملة جديدة
                </Text>
              </Pressable>

              <Link href="/(auth)/(tabs)/transaction" asChild>
                <Pressable
                  style={styles.quickActionButton}
                  android_ripple={{
                    color: "rgba(0, 0, 0, 0.26)",
                    foreground: true,
                  }}
                  android_disableSound
                >
                  <ListSvg />
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontFamily: "Tajawal",
                    }}
                  >
                    سجل المعاملات
                  </Text>
                </Pressable>
              </Link>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginTop: 10,
              }}
            >
              <Pressable
                style={styles.quickActionButton}
                android_ripple={{
                  color: "rgba(0, 0, 0, 0.26)",
                  foreground: true,
                }}
                android_disableSound
              >
                <ReportBox />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontFamily: "Tajawal",
                  }}
                >
                  التقارير
                </Text>
              </Pressable>

              <Link href="/(auth)/(tabs)/currency_rates" asChild>
                <Pressable
                  android_ripple={{
                    color: "rgba(0, 0, 0, 0.26)",
                    foreground: true,
                  }}
                  android_disableSound
                  style={styles.quickActionButton}
                >
                  <BitcoinExchange />
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 18,
                      fontFamily: "Tajawal",
                    }}
                  >
                    أسعار الصرف
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ThemedView>
      </Animated.ScrollView>
    </View>
  );
}

// Analytics Cards Component
const AnalyticsCards = ({
  transactionsAnalytics,
  initialVisibleCards,
}: AnalyticsCardsComponentProps) => {
  const [showAllCards, setShowAllCards] = useState(false);

  // Define all analytics cards with their properties
  const analyticsCards = [
    {
      id: "total_transactions_amount",
      icon: <ArrowsExchange />,
      label: "أجمالي المعاملات",
      value: `${Math.round(transactionsAnalytics?.confirmed_usd_amount ?? 0)}$`,
    },
    {
      id: "expected_transactions",
      icon: <Money2 />,
      label: "أجمالي المعاملات المتوقّعة",
      value: `${Math.round(
        (transactionsAnalytics?.pending_usd_amount ?? 0) +
          (transactionsAnalytics?.confirmed_usd_amount ?? 0)
      )}$`,
    },
    {
      id: "total_earnings",
      icon: <Money />,
      label: "أجمالي الإرادات",
      value: `${Math.round(
        transactionsAnalytics?.confirmed_earnings_usd ?? 0
      )}$`,
    },
    {
      id: "total_fees",
      icon: <ReciptTax />,
      label: "أجمالي الرسوم",
      value: `${Math.round(
        transactionsAnalytics?.confirmed_tax_fees_usd ?? 0
      )}$`,
    },
    {
      id: "expected_earnings",
      icon: <Money />,
      label: "أجمالي الإرادات المتوقّعة",
      value: `${Math.round(
        (transactionsAnalytics?.pending_earnings_usd ?? 0) +
          (transactionsAnalytics?.confirmed_earnings_usd ?? 0)
      )}`,
    },
    {
      id: "expected_fees",
      icon: <Money />,
      label: "أجمالي الرسوم المتوقعة",
      value: `${Math.round(
        (transactionsAnalytics?.pending_tax_fees_usd ?? 0) +
          (transactionsAnalytics?.confirmed_tax_fees_usd ?? 0)
      )}`,
    },
    {
      id: "transactions_count",
      icon: <Money2 />,
      label: "عدد المعاملات",
      value: transactionsAnalytics?.total_transactions ?? 0,
    },
    {
      id: "confirmed_transactions",
      icon: <ReciptTax />,
      label: "المعاملات المكتملة",
      value: `${Math.round(
        transactionsAnalytics?.confirmed_transactions ?? 0
      )}`,
    },
    {
      id: "pending_transactions",
      icon: <Money2 />,
      label: "المعاملات المعلقة",
      value: `${transactionsAnalytics?.pending_transactions ?? 0}`,
    },
    {
      id: "success_rate",
      icon: <Money2 />,
      label: "معدل النجاح",
      value: `${Math.round(transactionsAnalytics?.success_rate_percent ?? 0)}%`,
    },
  ];

  // Calculate how many cards to show
  const visibleCards = showAllCards
    ? analyticsCards
    : analyticsCards.slice(0, initialVisibleCards);

  // Determine if we need a "Show More" button
  const hasMoreCards = analyticsCards.length > initialVisibleCards;
  const palette = useThemePalette();

  return (
    <>
      <View style={styles.cardsContainer}>
        {visibleCards.map((card, index) => (
          <AnalyticsCard
            key={card.id}
            icon={card.icon}
            label={card.label}
            value={card.value}
          />
        ))}
      </View>

      {hasMoreCards && (
        <Pressable
          style={[styles.showMoreButton]}
          onPress={() => setShowAllCards(!showAllCards)}
          android_ripple={{ color: "rgba(0,0,0,0.25)" }}
        >
          <IconSymbol
            name="chevron.up"
            size={24}
            color={palette.accent}
            style={{ display: showAllCards ? "flex" : "none" }}
          />
          <Text style={[styles.showMoreButtonText, { color: palette.accent }]}>
            {showAllCards ? "عرض أقل" : "عرض المزيد"}
          </Text>
          <IconSymbol
            name="chevron.down"
            size={24}
            color={palette.accent}
            style={{ display: showAllCards ? "none" : "flex" }}
          />
        </Pressable>
      )}
    </>
  );
};

// Individual Analytics Card Component
const AnalyticsCard = ({ icon, label, value }: AnalyticsCardComponentProps) => {
  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "rgba(0,0,0,0.3)",
        padding: 8,
        width: "45%",
        flexDirection: "row",
        marginBottom: 20,
        minHeight: 70,
      }}
    >
      <View style={{ marginRight: 5, alignSelf: "center" }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            opacity: 0.7,
            fontFamily: "Tajawal",
            flexWrap: "wrap",
            fontSize: 13,
          }}
          numberOfLines={2}
        >
          {label}
        </Text>
        <Text style={{ fontWeight: "semibold" }}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#3628B7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    // set it to 10 if you want header to be in top.
    // currently we prefer the header being behind the content
    zIndex: 0,
  },
  headerText: {
    color: "white",
    fontFamily: "Tajawal",
    fontSize: 18,
  },
  container: {
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    backgroundColor: "white",
    padding: 10,
    minHeight: "100%",
  },
  quickActionButton: {
    padding: 20,
    width: "45%",
    height: 150,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 1,
      height: 3,
    },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 4,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  showMoreButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  showMoreButtonText: {
    fontFamily: "Tajawal",
    fontWeight: "500",
  },
});
