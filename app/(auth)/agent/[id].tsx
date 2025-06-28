import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import Separator from "@/components/ui/Separator";
import { useAgents } from "@/hooks/useAgents";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { getArabicDepartmentRole } from "@/services/departments";
import { hexToRgba } from "@/utils/colors";
import { AgentDepartment, DepartmentRole } from "@/utils/models";
import { Picker } from "@react-native-picker/picker";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TextStyle,
  View,
} from "react-native";

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
  const { id } = useLocalSearchParams();
  const palette = useThemePalette();

  const [isAddDepartmentFormShown, setIsAddDepartmentFormShown] =
    useState<boolean>(false);
  const [addDepartmentId, setAddDepartmentId] = useState<string | null>(null);
  const [addDepartmentRole, setAddDepartmentRole] =
    useState<DepartmentRole | null>(null);

  const {
    addToDepartment,
    removeFromDepartment,
    agents,
    isLoading: isAgentsLoading,
  } = useAgents();
  const { departments, isLoading: isDepsLoading } = useDepartments();

  const agent = useMemo(
    () => agents.find((a) => a.user_id === (id as string)),
    [agents, id]
  );

  const agentDepartments = useMemo((): AgentDepartment[] => {
    if (!agent?.departments || !departments) {
      return [];
    }

    return agent.departments
      .map((relation) => {
        const fullDepartment = departments.find(
          (d) => d.id === relation.department_id
        );
        if (fullDepartment) {
          return {
            ...fullDepartment,
            role: relation.role,
            agentRelationCreatedAt: relation.created_at,
            addedBy: relation.added_by,
          };
        }
        return null;
      })
      .filter(Boolean) as AgentDepartment[];
  }, [agent, departments]);

  const addToDep = async () => {
    if (!agent?.user_id || !addDepartmentId) {
      Alert.alert("مرفوض", "لم يتم إعطاء معرّف الوكيل ومعرّف الفرع");
      return;
    }
    try {
      await addToDepartment(
        agent.user_id,
        addDepartmentId,
        addDepartmentRole || DepartmentRole.STAFF
      );
      setIsAddDepartmentFormShown(false);
      setAddDepartmentId(null);
      setAddDepartmentRole(null);
    } catch (err) {
      console.error(err);
      Alert.alert("خطأ", "حدث خطأ أثناء إضافة الوكيل للفرع");
    }
  };

  const removeFromDep = async (departmentId: string) => {
    if (!agent?.user_id || !departmentId) {
      Alert.alert("مرفوض", "لم يتم إعطاء معرّف الوكيل ومعرّف الفرع");
      return;
    }
    try {
      await removeFromDepartment(agent.user_id, departmentId);
    } catch (err) {
      console.error(err);
      Alert.alert("خطأ", "حدث خطأ أثناء حذف الوكيل من الفرع");
    }
  };

  if (isAgentsLoading || isDepsLoading || !agent) {
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText>Loading Agent Details...</ThemedText>
      </View>
      </>
    );
  }

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
      <ScrollView>
        <View style={{ backgroundColor: palette.accent, height: 50 }}></View>
        <Image
          defaultSource={require("@/assets/images/anonymous-avatar.jpg")}
          source={
            agent.profile_picture
              ? { uri: agent.profile_picture }
              : require("@/assets/images/anonymous-avatar.jpg")
          }
          style={{
            alignSelf: "center",
            borderRadius: 50,
            transform: "translateY(-30px)",
            zIndex: 10,
            width: 100,
            height: 100,
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
          <TitleValueItem title="الأسم :" value={agent?.firstname ?? ""} />
          <TitleValueItem title="اللّقب :" value={agent?.lastname ?? ""} />
          <TitleValueItem
            title="البريد الألكتروني :"
            value={agent?.email ?? ""}
          />
          <TitleValueItem
            title="الهاتف :"
            value={agent?.phone ?? ""}
            type="phone"
          />
          <TitleValueItem title="العنوان :" value={agent?.address ?? ""} />
          <Separator />
          <View style={{ paddingHorizontal: 10 }}>
            <ThemedText
              style={{ textAlign: "center", marginBottom: 10 }}
              type="l"
            >
              الفروع
            </ThemedText>
          </View>
          <View style={{ maxHeight: "50%" }}>
            <FlatList
            scrollEnabled={false}
              keyExtractor={(d) => d.id}
              data={agentDepartments}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: palette.tint,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 10,
                    marginVertical: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ width: "85%" }}>
                      <TitleValueItem title="إسم الفرع: " value={item?.name} />
                      <TitleValueItem
                        title="الوظيفة: "
                        value={getArabicDepartmentRole(
                          (item as AgentDepartment & { role: DepartmentRole })
                            .role
                        )}
                      />
                    </View>
                    <View>
                      <Pressable
                        android_ripple={{
                          color: hexToRgba(palette.error, 0.2),
                        }}
                        onPress={() => {
                          Alert.alert(
                            "تأكيد",
                            "أنت بصدد القيام بحذف الوكيل من الفرع",
                            [
                              { text: "إلغاء", style: "cancel" },
                              {
                                text: "حذف",
                                style: "destructive",
                                onPress: () => removeFromDep(item.id), // Pass the department ID
                              },
                            ],
                            { cancelable: true }
                          );
                        }}
                      >
                        <IconSymbol name="trash.fill" color={palette.error} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          {/* --- Add/Cancel Buttons and Forms --- */}
          <View style={{ display: isAddDepartmentFormShown ? "flex" : "none" }}>
            <Picker
              selectedValue={addDepartmentId}
              onValueChange={(val) => setAddDepartmentId(val)}
            >
              <Picker.Item
                label="إختار الفرع..."
                value={null}
                color="rgb(126, 126, 126)"
              />
              {departments
                .filter(
                  (d) => !agentDepartments.map((ad) => ad.id).includes(d.id)
                )
                .map((d) => (
                  <Picker.Item key={d.id} label={d.name} value={d.id} />
                ))}
            </Picker>
            <Picker
              selectedValue={addDepartmentRole}
              onValueChange={(val) => setAddDepartmentRole(val)}
            >
              <Picker.Item
                label="إختار الوظيفة..."
                value={null}
                color="rgb(126, 126, 126)"
              />
              <Picker.Item
                label={getArabicDepartmentRole(DepartmentRole.MANAGER)}
                value={DepartmentRole.MANAGER}
              />
              <Picker.Item
                label={getArabicDepartmentRole(DepartmentRole.SUPERVISOR)}
                value={DepartmentRole.SUPERVISOR}
              />
              <Picker.Item
                label={getArabicDepartmentRole(DepartmentRole.STAFF)}
                value={DepartmentRole.STAFF}
              />
              <Picker.Item
                label={getArabicDepartmentRole(DepartmentRole.TECHNICIAN)}
                value={DepartmentRole.TECHNICIAN}
              />
            </Picker>
            <ThemedButton
              style={{ backgroundColor: palette.accent }}
              onPress={addToDep}
            >
              <ThemedText
                style={{ color: palette.background, textAlign: "center" }}
              >
                أضف
              </ThemedText>
            </ThemedButton>
          </View>
          <ThemedButton
            style={{
              marginTop: 20,
              backgroundColor: isAddDepartmentFormShown
                ? palette.error
                : palette.accent,
            }}
            onPress={() => {
              if (isAddDepartmentFormShown) {
                setAddDepartmentId(null);
                setAddDepartmentRole(null);
              }
              setIsAddDepartmentFormShown(!isAddDepartmentFormShown);
            }}
          >
            <ThemedText
              style={{ color: palette.background, textAlign: "center" }}
            >
              {isAddDepartmentFormShown ? "إلغاء" : "أضف إلى فرع"}
            </ThemedText>
          </ThemedButton>
        </View>
      </ScrollView>
    </>
  );
}
