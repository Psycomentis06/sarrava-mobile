import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import Separator from "@/components/ui/Separator";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { getArabicDepartmentRole } from "@/services/departments";
import { AgentDepartment, DepartmentRole, UserProfile } from "@/utils/models";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, TextStyle, View } from "react-native";

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
        style={[{ opacity: 0.5, width: "30%" }, titleStyle]}
      >
        {title}
      </ThemedText>
      <ThemedText
        type="md"
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
  const { departments, isLoading: isDepsLoading } = useDepartments();
  const [department, setDepartment] = useState<AgentDepartment | null>(null);
  useEffect(() => {
    if (isDepsLoading || !agentDetails?.department_id) {
      return;
    }
    setDepartment(
      departments.find((d) => agentDetails.department_id === d.id) || null
    );
  }, [departments, isDepsLoading]);

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
          {department && (
            <>
              <Separator />
              <View style={{ paddingHorizontal: 10 }}>
                <ThemedText
                  style={{ textAlign: "center", marginBottom: 10 }}
                  type="l"
                >
                  الفروع
                </ThemedText>
                <View
                  style={{
                    backgroundColor: palette.tint,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                  }}
                >
                  <TitleValueItem title="إسم الفرع: " value={department.name} />
                  <TitleValueItem title="الوظيفة: " value={getArabicDepartmentRole(agentDetails.department_role as DepartmentRole)} />
                </View>
              </View>
            </>
          )}
          <ThemedButton style={{marginTop: 20}} onPress={() => {
            Alert.alert("غير متوفّرة", "هذه الخاصيّة قادمة في التحديث القادم")
          }}>
            <ThemedText style={{color: palette.background, textAlign: 'center'}}>
            أضف إلى فرع
            </ThemedText>
          </ThemedButton>
        </View>
      </View>
    </>
  );
}
