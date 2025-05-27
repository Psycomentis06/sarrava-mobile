import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MyDepartments() {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View>
        <ThemedText weight="regular" type="l" style={{ textAlign: "center" }}>
          هذه الخاصيّة قادمة في التحديث القادم
        </ThemedText>
      </View>
    </ThemedView>
  );
}
