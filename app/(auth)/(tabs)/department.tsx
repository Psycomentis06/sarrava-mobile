import Building from "@/components/svg/Building";
import Destination from "@/components/svg/Destiniation";
import LocationPin from "@/components/svg/LocationPin";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import EmptyState from "@/components/ui/EmptyState";
import { IconSymbol } from "@/components/ui/IconSymbol";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DepartmentScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const [searchInput, setSearchInput] = useState<string>("");
  const [isReloading, setIsReloading] = useState<boolean>(false);

  const {
    searchResults: departments,
    search,
    reload,
    isLoading: isDepartmentsLoading,
  } = useDepartments();

  useEffect(() => {
    search("");
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
            placeholder="بحث عن قسم"
            containerStyle={{ width: "75%" }}
            returnKeyType="search"
            value={searchInput}
            onChangeText={setSearchInput}
            onEndEditing={() => search(searchInput)}
          />

          {Platform.OS === "web" ? (
            <ThemedButton
              style={{ width: 50 }}
              onPress={() => search(searchInput)}
            >
              <ThemedText>بحث</ThemedText>
            </ThemedButton>
          ) : null}

          <ThemedButton
            style={{ width: 45, borderRadius: "50%" }}
            onPress={() => router.navigate("/(auth)/department/add")}
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

      {isDepartmentsLoading ? (
        <LoadingOverlay text="تحميل بيانات الأقسام..." />
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          style={{ paddingHorizontal: 10 }}
          ListEmptyComponent={() => (
            <EmptyState
              title="لا توجد فروع"
              description="لم يتم العثور على أي فروع، حاول إضافة فرع جديد أو تعديل البحث."
              iconName="building"
            />
          )}
          refreshing={isReloading}
          onRefresh={async () => {
            setIsReloading(true);
            try {
              await reload();
            } catch (error) {
              console.error(error);
            } finally {
              setIsReloading(false);
            }
          }}
          renderItem={({ item }) => (
            <View style={{ borderRadius: 10, overflow: "hidden" }}>
              <Pressable
                style={{
                  backgroundColor: palette.tint,
                  marginVertical: 5,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderRadius: 10,
                  overflow: "hidden",
                  gap: 10,
                }}
                android_ripple={{
                  color: "rgba(0,0,0,0.26)",
                  foreground: true,
                  borderless: false,
                }}
                onPress={() =>
                  router.navigate({
                    pathname: "/(auth)/department/[id]",
                    params: { id: item.id, dep: JSON.stringify(item) },
                  })
                }
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Building opacity={0.6} />
                  <ThemedText type="l" weight="medium">
                    {item.name}
                  </ThemedText>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <LocationPin opacity={0.6} />
                  <ThemedText>
                    {item.country_ar} | {item.city} | {item.zipcode}
                  </ThemedText>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <Destination opacity={0.6} />
                  <ThemedText style={{ opacity: 0.6 }}>
                    {item.address}
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}
