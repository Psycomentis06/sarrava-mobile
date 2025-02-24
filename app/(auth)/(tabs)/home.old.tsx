/**
 * This is the previous simple scrollable home screen left as a reference in case we want to
 * revert to it.
 */
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { hexToRgba } from "@/utils/colors";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: "#3628B7", height: "100%" }}>
      <View
        style={{
          marginTop: insets.top,
          paddingHorizontal: 20,
          paddingVertical: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "white", fontFamily: "tajawal", fontSize: 18 }}>
          مرحبا, محمد أمين ولد الحاج
        </Text>
        <Pressable
          style={{
            borderRadius: "50%",
            overflow: "hidden",
          }}
          android_ripple={{
            color: "rgba(236, 239, 241, 0.26)",
            foreground: true,
          }}
          android_disableSound
        >
          android_disableSound={true}
          <IconSymbol name="bell" size={24} color={"white"} />
        </Pressable>
      </View>
      <ThemedView
        style={{
          height: "100%",
          borderTopRightRadius: 40,
          borderTopLeftRadius: 40,
          marginTop: 20,
          paddingHorizontal: 10,
          paddingBottom: 40,
        }}
      >
        {/* Overview Stats */}
        <View style={{ paddingTop: 40, paddingBottom: 20 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{
                borderWidth: 1,
                borderRadius: 10,
                borderColor: hexToRgba("#fff", 0.3),
                padding: 5,
                width: 140,
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
              }}
            >
              <IconSymbol name="xmark.app" size={24} color={"blue"} />
              <View>
                <Text style={{ opacity: 0.7, fontFamily: "Tajawal" }}>
                  أجمالي المعاملات
                </Text>
                <Text style={{ fontWeight: "semibold" }}>$30860</Text>
              </View>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderRadius: 10,
                borderColor: hexToRgba("#fff", 0.3),
                padding: 5,
                width: 140,
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
              }}
            >
              <IconSymbol name="gear" size={24} color={"blue"} />
              <View>
                <Text style={{ opacity: 0.7, fontFamily: "Tajawal" }}>
                  أجمالي الإرادات
                </Text>
                <Text style={{ fontWeight: "semibold" }}>$30000</Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <View
              style={{
                borderWidth: 1,
                borderRadius: 10,
                borderColor: hexToRgba("#fff", 0.3),
                padding: 5,
                width: 140,
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
              }}
            >
              <IconSymbol name="chart.pie.fill" size={24} color={"blue"} />
              <View>
                <Text style={{ opacity: 0.7, fontFamily: "Tajawal" }}>
                  أجمالي الرسوم
                </Text>
                <Text style={{ fontWeight: "semibold" }}>$860</Text>
              </View>
            </View>

            <View
              style={{
                borderWidth: 1,
                borderRadius: 10,
                borderColor: hexToRgba("#fff", 0.3),
                padding: 5,
                width: 140,
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
              }}
            >
              <IconSymbol
                name="person.badge.plus.fill"
                size={24}
                color={"blue"}
              />
              <View>
                <Text style={{ opacity: 0.7, fontFamily: "Tajawal" }}>
                  الأرباح
                </Text>
                <Text style={{ fontWeight: "semibold" }}>$9000</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Separator */}
        <View
          style={{
            height: 1,
            backgroundColor: hexToRgba("#fff", 0.2),
          }}
        ></View>

        {/* Quick Actions */}
        <View style={{ marginTop: 20 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Pressable
              style={styles.quickActionButton}
              android_ripple={{
                color: "rgba(0, 0, 0, 0.26)",
                foreground: true,
              }}
              android_disableSound
            >
              <IconSymbol
                name="person.badge.plus.fill"
                size={38}
                color={"blue"}
                style={{ textAlign: "center" }}
              />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontFamily: "Tajawal",
                }}
              >
                معاملة جديدة
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickActionButton}
              android_ripple={{
                color: "rgba(0, 0, 0, 0.26)",
                foreground: true,
              }}
              android_disableSound
            >
              <IconSymbol
                name="person.badge.plus.fill"
                size={38}
                color={"red"}
                style={{ textAlign: "center" }}
              />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  fontFamily: "Tajawal",
                }}
              >
                سجل المعاملات
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <Pressable
              style={styles.quickActionButton}
              android_ripple={{
                color: "rgba(0, 0, 0, 0.26)",
                foreground: true,
              }}
              android_disableSound
            >
              <IconSymbol
                name="person.badge.plus.fill"
                size={38}
                color={"orange"}
                style={{ textAlign: "center" }}
              />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontFamily: "Tajawal",
                }}
              >
                التقارير
              </Text>
            </Pressable>

            <Pressable
              android_ripple={{
                color: "rgba(0, 0, 0, 0.26)",
                foreground: true,
              }}
              android_disableSound
              style={styles.quickActionButton}
            >
              <IconSymbol
                name="person.badge.plus.fill"
                size={38}
                color={"green"}
                style={{ textAlign: "center" }}
              />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontFamily: "Tajawal",
                }}
              >
                أسعار الصرف
              </Text>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickActionButton: {
    padding: 20,
    width: 140,
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 1,
      height: 3,
    },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 4,
  },
});
