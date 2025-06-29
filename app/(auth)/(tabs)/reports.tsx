import ItemsNotFound from "@/components/svg/ItemsNotFound";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useDepartments } from "@/hooks/useDepartments";
import { useReports } from "@/hooks/useReports";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReportsScreen() {
  const { isInternetReachable } = useNetInfo();
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const router = useRouter();
  // const [reports, setReports] = useState<Report[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;
  const {
    reports,
    reload,
    isLoading: isReportsLoading,
    isSearchLoading,
    hasMoreSearchResults,
    search,
  } = useReports();
  const { departments } = useDepartments();
  const [isReloading, setIsReloading] = useState<boolean>(false);

  useEffect(() => {
    search(searchValue, currentPage, pageSize);
  }, [searchValue, currentPage]);

  const handleLoadMore = () => {
    if (hasMoreSearchResults && !isSearchLoading) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchValue(text);
    setCurrentPage(0);
  };

  const getDepartment = (id: string) => departments.find((d) => d.id === id);
  const getDepName = (id: string) => {
    const d = getDepartment(id);
    return `${d?.name || ""}|${d?.country_ar || ""}`;
  };

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
            onEndEditing={() => handleSearchChange(searchInput)}
          />

          {Platform.OS === "web" ? (
            <ThemedButton
              style={{ width: 50 }}
              onPress={() => handleSearchChange(searchInput)}
            >
              <ThemedText>بحث</ThemedText>
            </ThemedButton>
          ) : null}

          <ThemedButton
            disabled={!isInternetReachable}
            style={{
              width: 45,
              borderRadius: "50%",
              opacity: isInternetReachable ? 1 : 0.5,
            }}
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

      {(isReloading || isReportsLoading) && <LoadingOverlay />}
      {!isReloading && !isReportsLoading && (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          style={{ paddingHorizontal: 10 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onRefresh={async () => {
            setIsReloading(true);
            try {
              await reload();
            } catch (err) {
              console.error(err);
              Alert.alert("خطأ");
            } finally {
              setIsReloading(false);
            }
          }}
          refreshing={isReloading}
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
                <ThemedText type="md" weight="medium">
                  الفرع:
                  {item.department_id
                    ? getDepName(item.department_id)
                    : "تقرير شامل"}
                </ThemedText>
              </Pressable>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}
