import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Separator from "@/components/ui/Separator";
import { useThemePalette } from "@/hooks/useThemePalette";
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
  const { id } = useLocalSearchParams();
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
        <Image
          source={{
            uri: "https://unsplash.com/photos/n4KewLKFOZw/download?ixid=M3wxMjA3fDB8MXxhbGx8fHx8fHx8fHwxNzQxNDY2ODA1fA&force=true&w=640",
            width: 100,
            height: 100,
          }}
          style={{
            alignSelf: "center",
            borderRadius: 50,
            transform: "translateY(-30px)",
            zIndex: 10,
          }}
        />
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
          <TitleValueItem title="الأسم :" value="ياسر" />
          <TitleValueItem title="اللّقب :" value="منير" />
          <TitleValueItem
            title="البريد الألكتروني :"
            value="yasser.mounir@example.com"
          />
          <TitleValueItem title="الهاتف :" value="+21698765432" type="phone" />
          <TitleValueItem title="العنوان :" value="بناية الأمانة" />
          <Separator />
          <TitleValueItem
            title="تسجيل الدّخول :"
            value="yasser_m"
            valueStyle={{ color: palette.error }}
          />
          <TitleValueItem
            title="كلمة المرور"
            value="A***8**i"
            valueStyle={{ color: palette.error }}
          />
        </View>
      </View>
    </>
  );
}
