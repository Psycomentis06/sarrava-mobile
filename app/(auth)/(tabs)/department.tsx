import Building from "@/components/svg/Building";
import Destination from "@/components/svg/Destiniation";
import LocationPin from "@/components/svg/LocationPin";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { AgentDepartment } from "@/utils/models";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DepartmentScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const [searchInput, setSearchInput] = useState<string>("");
  const [departments, setDepartments] = useState<AgentDepartment[]>([]);

  const getDeps = async () => {
    const query = supabase
      .from("departments")
      .select()
      .order("created_at", { ascending: false });

    var searchValue = searchInput.trim().toLowerCase();
    if (searchValue && searchValue.length > 0) {
      query.or(
        `name.ilike.%${searchValue}%,` +
          `country.ilike.%${searchValue}%,` +
          `country_ar.ilike.%${searchValue}%,` +
          `country_code.ilike.%${searchValue}%,` +
          `city.ilike.%${searchValue}%,` +
          `zipcode.ilike.%${searchValue}%,` +
          `address.ilike.%${searchValue}%`
      );
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      Alert.alert("error");
      return;
    }

    if (data) {
      setDepartments(data);
    }
  };

  useEffect(() => {
    getDeps();
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
            onEndEditing={() => console.log("search")}
          />

          {Platform.OS === "web" ? (
            <ThemedButton
              style={{ width: 50 }}
              onPress={() => console.log("Search")}
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

      <FlatList
        data={departments}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        style={{ paddingHorizontal: 10 }}
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
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Building opacity={0.6} />
                <ThemedText type="l" weight="medium">
                  {item.name}
                </ThemedText>
              </View>
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <LocationPin opacity={0.6} />
                <ThemedText>
                  {item.country_ar} | {item.city} | {item.zipcode}
                </ThemedText>
              </View>
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <Destination opacity={0.6} />
                <ThemedText style={{ opacity: 0.6 }}>{item.address}</ThemedText>
              </View>
            </Pressable>
          </View>
        )}
      />
    </ThemedView>
  );
}
