import ItemsNotFound from "@/components/svg/ItemsNotFound";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { Report } from "@/utils/models";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

  const getReports = async () => {
    const searchValue = searchInput.trim();

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    let query = supabase
      .from("reports")
      .select("*")
      .eq("agent_id", user.id)
      .order("from_date", { ascending: false });

    if (searchValue) {
      query = query.or(
        `title.ilike.%${searchValue}%,description.ilike.%${searchValue}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء تحميل التقارير");
      return;
    }

    setReports(data || []);
  };

  useEffect(() => {
    getReports();
  }, []);

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
            placeholder="بحث عن تقرير"
            containerStyle={{ width: "75%" }}
            returnKeyType="search"
            value={searchInput}
            onChangeText={setSearchInput}
            onEndEditing={getReports}
          />

          {Platform.OS === "web" ? (
            <ThemedButton style={{ width: 50 }} onPress={getReports}>
              <ThemedText>بحث</ThemedText>
            </ThemedButton>
          ) : null}

          <ThemedButton
            style={{ width: 45, borderRadius: "50%" }}
            onPress={() => router.navigate("/(auth)/report/add")}
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
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        style={{ paddingHorizontal: 10 }}
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
              لم نتمكن من العثور على أي تقرير
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ borderRadius: 10, overflow: "hidden" }}>
            <Pressable
              style={{
                backgroundColor: palette.tint,
                marginVertical: 5,
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderRadius: 10,
              }}
              android_ripple={{
                color: "rgba(0,0,0,0.26)",
                foreground: true,
              }}
              onPress={() =>
                router.navigate({
                  pathname: "/(auth)/report/[id]",
                  params: { id: item.id, report: JSON.stringify(item) },
                })
              }
            >
              <ThemedText type="l" weight="medium">
                {item.title}
              </ThemedText>
              <ThemedText type="sm" style={{ opacity: 0.8 }}>
                {item.description?.length ?? 0 > 80
                  ? `${(item.description ?? "").slice(0, 80)}...`
                  : item.description}
              </ThemedText>
              <ThemedText type="sm" style={{ marginTop: 5 }}>
                من: {item.from_date} إلى: {item.to_date}
              </ThemedText>
              <ThemedText type="sm" weight="medium">
                إجمالي المعاملات: {item.total_transactions} | المؤكدة:{" "}
                {item.confirmed_transactions}
              </ThemedText>
              <ThemedText type="sm" weight="medium">
                الأرباح: ${item.confirmed_earnings_usd}
              </ThemedText>
            </Pressable>
          </View>
        )}
      />
    </ThemedView>
  );
}
