import Person from "@/components/svg/Person";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useAgents } from "@/hooks/useAgents";
import { useThemePalette } from "@/hooks/useThemePalette";
import {
  getArabicDepartmentRole,
  getDepartmentRoleIcon,
} from "@/services/departments";
import { AgentDepartment, DepartmentRole, UserProfile } from "@/utils/models";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

const renderScene = SceneMap({
  details: DetailsScene,
  agents: AgentsScene,
});

function DetailsScene() {
  const { id, dep } = useLocalSearchParams();
  const depDetails = JSON.parse(dep as string) as AgentDepartment;
  return (
    <ThemedView style={{ flex: 1, gap: 20, padding: 10 }}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
      >
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          إسم الفرع :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.name}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          البلد :{" "}
        </ThemedText>
        <ThemedText
          style={{ width: "70%" }}
          type="md"
        >{`${depDetails.country_ar} (${depDetails.country_code})`}</ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          المدينة :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.city}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          الرّمز البريدي :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.zipcode}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ThemedText style={{ width: "30%", opacity: 0.6 }} weight="bold">
          العنوان :{" "}
        </ThemedText>
        <ThemedText style={{ width: "70%" }} type="md">
          {depDetails.address}
        </ThemedText>
      </View>

      {depDetails.created_at && (
        <View
          style={{ flexDirection: "row", alignItems: "center", opacity: 0.6 }}
        >
          <ThemedText>تمّ إضافة الفرع بتاريخ : </ThemedText>
          <ThemedText>
            {new Date(depDetails.created_at).toLocaleString()}
          </ThemedText>
        </View>
      )}

      {!depDetails?.updated_at ? null : (
        <ThemedText type="sm" style={{ opacity: 0.6, marginTop: 10 }}>
          {`أخر تحديث بتاريخ ${new Date(
            depDetails.updated_at
          ).toLocaleDateString()} على السّاعة ${new Date(
            depDetails.updated_at
          ).toLocaleTimeString()}`}
          {!depDetails?.updated_by ? null : ` بواسطة ${depDetails.updated_by}`}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function AgentsScene() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const palette = useThemePalette();
  const { agents } = useAgents();
  const [depAgents, setDepAgents] = useState<UserProfile[]>([]);
  const getDepAgents = useMemo(() => {
    return agents.filter((a) => {
      if (a.department_id) {
        return a.department_id === id;
      }
      if (a.department && a.department.id) {
        return a.department.id === id;
      }
      return false;
    });
  }, [id, agents]);

  useEffect(() => {
    setDepAgents(getDepAgents);
  }, [id, agents]);
  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <FlatList
        data={depAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const RoleIcon = getDepartmentRoleIcon(
            item.department_role ?? DepartmentRole.STAFF
          );
          // const roleColor = hexToRgba(getDepartmentRoleColor(item.department_role ?? DepartmentRole.STAFF), 0.2)
          return (
            <View style={{ borderRadius: 10, overflow: "hidden" }}>
              <Pressable
                style={{
                  backgroundColor: palette.tint,
                  // backgroundColor: roleColor,
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
                    params: { id: item.id, agent: JSON.stringify(item) },
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
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 5,
                        opacity: 0.7,
                        alignItems: "center",
                      }}
                    >
                      {item.department || item.department_id ? (
                        <RoleIcon />
                      ) : (
                        <Person />
                      )}
                      <ThemedText weight="bold">
                        {item.department || item.department_id
                          ? getArabicDepartmentRole(
                              item.department_role ?? DepartmentRole.STAFF
                            )
                          : "مستقل"}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        }}
      />
    </ThemedView>
  );
}

export default function DepartmentDetailsScreen() {
  const { id, dep } = useLocalSearchParams();
  const depDetails = JSON.parse(dep as string) as AgentDepartment;
  const layout = useWindowDimensions();
  const [tabIndex, setTabIndex] = useState<number>(0);
  const palette = useThemePalette();
  const { agents } = useAgents();
  const [routes, setRoutes] = useState([
    { key: "details", title: "معلومات الفرع" },
    { key: "agents", title: `الوكلاء (0)` },
  ]);

  const departmentAgents = useMemo(() => {
    return agents.filter((a) => {
      if (a.department_id) {
        return a.department_id === depDetails.id;
      }
      if (a.department && a.department.id) {
        return a.department.id === depDetails.id;
      }
      return false;
    });
  }, [agents, depDetails.id]);

  useEffect(() => {
    setRoutes([
      { key: "details", title: "معلومات الفرع" },
      { key: "agents", title: `الوكلاء (${departmentAgents.length})` },
    ]);
  }, [departmentAgents.length]);

  return (
    <>
      <Stack.Screen options={{ title: depDetails.name ?? "" }} />
      <TabView
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar {...props} style={{ backgroundColor: palette.accent }} />
        )}
      />
    </>
  );
}
