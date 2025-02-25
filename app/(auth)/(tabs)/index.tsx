import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { hexToRgba } from "@/utils/colors";
import { Pressable, Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef } from "react";
import ArrowsExchange from "@/components/svg/ArrowsExchange";
import Money from "@/components/svg/Money";
import ReciptTax from "@/components/svg/ReciptTax";
import Money2 from "@/components/svg/Money2";
import ListSvg from "@/components/svg/List";
import Exchange from "@/components/svg/Exchange";
import ReportBox from "@/components/svg/ReportBox";
import BitcoinExchange from "@/components/svg/BitcoinExchange";
import { useNavigation } from "expo-router";

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [120, 60],
    extrapolate: "clamp",
  });

  const textOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#3628B7" }}>
      {/* Parallax Header */}
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight, paddingTop: insets.top },
        ]}
      >
        <Animated.Text style={[styles.headerText, { opacity: textOpacity }]}>
          مرحبا, محمد أمين ولد الحاج
        </Animated.Text>
        <Pressable>
          <IconSymbol name="bell" size={24} color="white" />
        </Pressable>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: 130 }} // Prevent overlap
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <ThemedView style={styles.container}>
          {/* Overview Stats */}
          <View style={{ paddingTop: 40, paddingBottom: 20 }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  borderColor: hexToRgba("#fff", 0.3),
                  padding: 5,
                  width: "45%",
                  flexDirection: "row",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <ArrowsExchange />
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
                  width: "45%",
                  flexDirection: "row",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <Money />
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
                justifyContent: "space-evenly",
                marginTop: 20,
              }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  borderColor: hexToRgba("#fff", 0.3),
                  padding: 5,
                  width: "45%",
                  flexDirection: "row",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <ReciptTax />
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
                  width: "45%",
                  flexDirection: "row",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <Money2 />
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
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <Pressable
                style={styles.quickActionButton}
                android_ripple={{
                  color: "rgba(0, 0, 0, 0.26)",
                  foreground: true,
                }}
                android_disableSound
                onPress={() => navigation.navigate("transaction/add" as never)}
              >
                <Exchange />
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
                <ListSvg />
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 18,
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
                justifyContent: "space-evenly",
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
                <ReportBox />
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
                <BitcoinExchange />
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
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#3628B7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    // set it to 10 if you want header to be in top.
    // currently we prefer the header being behind the content
    zIndex: 0,
  },
  headerText: {
    color: "white",
    fontFamily: "Tajawal",
    fontSize: 18,
  },
  container: {
    borderTopRightRadius: 40,
    borderTopLeftRadius: 40,
    backgroundColor: "white",
    padding: 10,
    minHeight: "100%",
  },
  quickActionButton: {
    padding: 20,
    width: "45%",
    height: 150,
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
