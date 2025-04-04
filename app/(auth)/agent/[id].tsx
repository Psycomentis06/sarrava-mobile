import { ThemedText } from "@/components/ThemedText";
import Separator from "@/components/ui/Separator";
import { useThemePalette } from "@/hooks/useThemePalette";
import { UserProfile } from "@/utils/models";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Image, TextStyle, View } from "react-native";

type TitleValueItemComponentProps = {
  title: string;
  titleStyle?: TextStyle;
  value: string;
  valueStyle?: TextStyle;
  type?: "phone" | undefined;
};

function TitleValueItem({
  title,
  titleStyle,
  value,
  valueStyle,
  type = undefined,
}: TitleValueItemComponentProps) {
  const palette = useThemePalette();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      <ThemedText
        weight="bold"
        type="md"
        style={[{ opacity: 0.5, width: "30%" }, titleStyle]}
      >
        {title}
      </ThemedText>
      <ThemedText
        type="l"
        weight="medium"
        style={[
          valueStyle,
          type === "phone"
            ? {
                textDecorationLine: "underline",
                textDecorationColor: palette.accent,
              }
            : null,
        ]}
      >
        {type === "phone" ? <Link href={`tel:${value}`}>{value}</Link> : value}
      </ThemedText>
    </View>
  );
}

export default function AgentDetailsScreen() {
  const { id, agent } = useLocalSearchParams();
  const agentDetails = JSON.parse(agent as string) as UserProfile;
  const palette = useThemePalette();
  return (
    <>
      <Stack.Screen
        options={{
          title: "تفاصيل الوكيل",
          headerStyle: { backgroundColor: palette.accent },
          headerTintColor: palette.background,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.tint },
        }}
      />
      <View>
        <View style={{ backgroundColor: palette.accent, height: 50 }}></View>
        {agentDetails.profile_picture ? (
          <Image
            defaultSource={require("@/assets/images/anonymous-avatar.jpg")}
            source={{
              uri: agentDetails.profile_picture,
              width: 100,
              height: 100,
            }}
            style={{
              alignSelf: "center",
              borderRadius: 50,
              transform: "translateY(-30px)",
              zIndex: 10,
              width: 100,
              height: 100,
            }}
          />
        ) : (
          <Image
            source={require("@/assets/images/anonymous-avatar.jpg")}
            style={{
              alignSelf: "center",
              borderRadius: 50,
              transform: "translateY(-30px)",
              zIndex: 10,
              width: 100,
              height: 100,
            }}
          />
        )}
        <View
          style={{
            padding: 20,
            paddingTop: 30,
            backgroundColor: palette.background,
            borderTopEndRadius: 20,
            borderTopStartRadius: 20,
            transform: "translateY(-50px)",
          }}
        >
          <TitleValueItem
            title="الأسم :"
            value={agentDetails?.firstname ?? ""}
          />
          <TitleValueItem
            title="اللّقب :"
            value={agentDetails?.lastname ?? ""}
          />
          <TitleValueItem
            title="البريد الألكتروني :"
            value={agentDetails?.email ?? ""}
          />
          <TitleValueItem
            title="الهاتف :"
            value={agentDetails?.phone ?? ""}
            type="phone"
          />
          <TitleValueItem
            title="العنوان :"
            value={agentDetails?.address ?? ""}
          />
          <Separator />
          <TitleValueItem
            title="تسجيل الدّخول :"
            value={agentDetails?.email ?? ""}
            valueStyle={{ color: palette.error }}
          />
          <TitleValueItem
            title="كلمة المرور"
            value="********"
            valueStyle={{ color: palette.error }}
          />
        </View>
      </View>
    </>
  );
}
