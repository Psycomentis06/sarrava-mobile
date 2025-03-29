import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useNavigation } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AGENTS = [
  {
    id: "789012-345678-901234",
    firstname: "ليلى",
    lastname: "علي",
    email: "laila.ali@example.com",
    address: "شارع جديد",
    phone: "+21655123456",
    username: "laila_ali",
    password: "securepass1",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "567890-123456-789012",
    firstname: "يوسف",
    lastname: "خالد",
    email: "yousef.khaled@example.com",
    address: "حي النور",
    phone: "+213551234567",
    username: "yousef_k",
    password: "securepass2",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "345678-901234-567890",
    firstname: "فاطمة",
    lastname: "سالم",
    email: "fatima.salem@example.com",
    address: "منزل رقم 5",
    phone: "+22236123456",
    username: "fatima_s",
    password: "securepass3",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "901234-567890-123456",
    firstname: "عمر",
    lastname: "حسن",
    email: "omar.hassan@example.com",
    address: "بناية الزهور",
    phone: "+966501234567",
    username: "omar_h",
    password: "securepass4",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "234567-890123-456789",
    firstname: "مريم",
    lastname: "طارق",
    email: "maryam.tarek@example.com",
    address: "شارع الأمل",
    phone: "+21622987654",
    username: "maryam_t",
    password: "securepass5",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "678901-234567-890123",
    firstname: "خالد",
    lastname: "رشيد",
    email: "khaled.rashid@example.com",
    address: "مجمع النخيل",
    phone: "+213661234567",
    username: "khaled_r",
    password: "securepass6",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "890123-456789-012345",
    firstname: "نور",
    lastname: "جمال",
    email: "nour.jamal@example.com",
    address: "حي الوفاء",
    phone: "+22245123456",
    username: "nour_j",
    password: "securepass7",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "456789-012345-678901",
    firstname: "سارة",
    lastname: "عادل",
    email: "sara.adel@example.com",
    address: "شارع الحرية",
    phone: "+966551234567",
    username: "sara_a",
    password: "securepass8",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "012345-678901-234567",
    firstname: "ياسر",
    lastname: "منير",
    email: "yasser.mounir@example.com",
    address: "بناية الأمانة",
    phone: "+21698765432",
    username: "yasser_m",
    password: "securepass9",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
  {
    id: "135791-246802-357913",
    firstname: "امينة",
    lastname: "رضا",
    email: "amina.reda@example.com",
    address: "شارع النصر",
    phone: "+213771234567",
    username: "amina_r",
    password: "securepass10",
    avatar:
      "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
  },
];

export default function AgentScreen() {
  const insets = useSafeAreaInsets();
  const palette = useThemePalette();
  const navigation = useNavigation();
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
          <ThemedTextInput placeholder="بحث" containerStyle={{ width: "75%" }} />
          <ThemedButton
            style={{ width: 45, borderRadius: "50%" }}
            onPress={() => navigation.navigate("agent/add" as never)}
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
        data={AGENTS}
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
              }}
              android_ripple={{
                color: "rgba(0,0,0,0.26)",
                foreground: true,
                borderless: false,
              }}
              onPress={() => navigation.navigate("agent/[id]", { id: item.id })}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={{ uri: item.avatar, width: 60, height: 60 }}
                  style={{
                    borderRadius: 30,
                    marginRight: 10,
                  }}
                />
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
    </ThemedView>
  );
}
