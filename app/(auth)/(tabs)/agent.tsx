import ItemsNotFound from "@/components/svg/ItemsNotFound";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAgents } from "@/hooks/useAgents";
import { useThemePalette } from "@/hooks/useThemePalette";
import { UserProfile } from "@/utils/models";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const router = useRouter();
  const [agentss, setAgents] = useState<UserProfile[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const {
    searchResults: agents,
    search,
    reload,
    isLoading: isAgentsLoading,
  } = useAgents();

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
            placeholder="بحث"
            containerStyle={{ width: "75%" }}
            returnKeyType="search"
            value={searchInput}
            onChangeText={setSearchInput}
            onEndEditing={() => search(searchInput)}
          />

          {
            /* Debugging search on the web */ Platform.OS === "web" ? (
              <ThemedButton
                style={{ width: 50 }}
                onPress={() => search(searchInput)}
              >
                <ThemedText>Search</ThemedText>
              </ThemedButton>
            ) : (
              ""
            )
          }

          <ThemedButton
            style={{ width: 45, borderRadius: "50%" }}
            onPress={() => router.navigate("/(auth)/agent/add")}
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

      {isAgentsLoading ? (
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
              تحميل بيانات الوكلاء...
            </ThemedText>
            <ActivityIndicator color={palette.accent} size={48} />
          </View>
        </View>
      ) : (
        <FlatList
          data={agents}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          style={{ paddingHorizontal: 10 }}
          refreshing={isReloading}
          onRefresh={async () => {
            setIsReloading(true);
            try {
              await reload();
            } catch (err) {
              Alert.alert("خطأ", "حدث خطأ أثناء محاولة تحديث البيانات");
            } finally {
              setIsReloading(false);
            }
          }}
          ListEmptyComponent={
            !isAgentsLoading && agents.length === 0 ? (
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
                  لم نتمكن من العثور على أي وكيل
                </ThemedText>
              </View>
            ) : (
              <></>
            )
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
                    params: { id: item.user_id, agent: JSON.stringify(item) },
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
                    <ThemedText type="md">{item.address}</ThemedText>
                  </View>
                </View>
              </Pressable>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}
