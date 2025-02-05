import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { Button, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const palette = useThemePalette();
  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ThemedView style={styles.container}>
        <View>
          {/* stats */}
          <ThemedText style={styles.overviewTitle} type="title">
            ملخص
          </ThemedText>
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: palette.tint, borderRadius: 10 },
            ]}
          >
            <View style={[styles.statsItem]}>
              <ThemedText type="subtitle">$12,345</ThemedText>
              <ThemedText style={styles.statsValueItem}>المعاملات</ThemedText>
            </View>
            <View style={[styles.statsItem]}>
              <ThemedText type="subtitle">$567</ThemedText>
              <ThemedText style={styles.statsValueItem}>التكاليف</ThemedText>
            </View>
            <View style={[styles.statsItem]}>
              <ThemedText type="subtitle">$11,778</ThemedText>
              <ThemedText style={styles.statsValueItem}>الإيرادات</ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.quickActionsContainer}>
          {/* quick actions */}
          <ThemedText type="title">أختصارات</ThemedText>
          <View style={styles.quickActionsButtonsContainer}>
            <View style={styles.quickActionsButtonsContainerSection}>
              <ThemedButton
                style={{ width: 120 }}
                onPress={() => navigation.navigate("transaction/add" as never)}
              >
                <IconSymbol
                  style={{ textAlign: "center", color: palette.background }}
                  name="plus.app"
                  color={palette.text}
                  size={56}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={{ textAlign: "center", color: palette.background }}
                >
                  معاملة جديدة
                </ThemedText>
              </ThemedButton>
              <ThemedButton style={{ width: 120 }}>
                <IconSymbol
                  style={{ textAlign: "center", color: palette.background }}
                  name="chart.pie.fill"
                  color={palette.text}
                  size={56}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={{ textAlign: "center", color: palette.background }}
                >
                  تقرير جديد
                </ThemedText>
              </ThemedButton>
            </View>
            <View style={styles.quickActionsButtonsContainerSection}>
              <ThemedButton style={{ width: 120 }}>
                <IconSymbol
                  style={{ textAlign: "center", color: palette.background }}
                  name="person.badge.plus.fill"
                  color={palette.text}
                  size={56}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={{ textAlign: "center", color: palette.background }}
                >
                  وكيل جديد
                </ThemedText>
              </ThemedButton>
              <ThemedButton style={{ width: 120 }}>
                <IconSymbol
                  name="coloncurrencysign.arrow.circlepath"
                  style={{ textAlign: "center", color: palette.background }}
                  color={palette.text}
                  size={56}
                />
                <ThemedText
                  style={{ textAlign: "center", color: palette.background }}
                  type="defaultSemiBold"
                >
                  صرف العملات
                </ThemedText>
              </ThemedButton>
            </View>
          </View>
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 5, paddingBottom: 20 },
  overviewTitle: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  statsItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
  },
  statsValueItem: {
    textAlign: "center",
    opacity: 0.5,
  },

  quickActionsContainer: {
    marginTop: 50,
  },
  quickActionsButtonsContainer: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  quickActionsButtonsContainerSection: {
    gap: 20,
  },
});
