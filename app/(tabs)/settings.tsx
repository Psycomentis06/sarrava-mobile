import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { Appearance, Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemePalette } from "@/hooks/useThemePalette";
import { getThemeMode, saveThemeMode } from "@/services/themes";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const palette = useThemePalette();
  const insets = useSafeAreaInsets();
  const [themeMode, setThemeMode] = useState("system");
  useEffect(() => {
    getThemeMode().then((mode) => setThemeMode(mode));
  }, []);

  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={{ margin: 5 }}>
        <ThemedText>مظهر التطبيق</ThemedText>
        <Picker
          style={{ color: palette.text }}
          dropdownIconColor={palette.text}
          selectedValue={themeMode}
          onValueChange={(val) => {
            if (Platform.OS === "web") {
              alert("Updating color scheme is not supported in WEB version");
            }
            if (val === "dark") {
              Appearance.setColorScheme("dark");
              setThemeMode("dark");
              saveThemeMode("dark");
            } else if (val === "light") {
              Appearance.setColorScheme("light");
              setThemeMode("light");
              saveThemeMode("light");
            } else {
              Appearance.setColorScheme(null);
              setThemeMode("system");
              saveThemeMode("system");
            }
          }}
        >
          <Picker.Item label="تلقائي" value={"system"} />
          <Picker.Item label="داكن" value={"dark"} />
          <Picker.Item label="فاتح" value={"light"} />
        </Picker>
        <ThemedText style={{ opacity: 0.6 }}>اللغة</ThemedText>
        <ThemedText style={{ opacity: 0.6 }}>العملة</ThemedText>
      </View>
    </ThemedView>
  );
}
