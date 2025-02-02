import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Picker } from "@react-native-picker/picker";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect } from "react";
import { usePreferedColorSchemeMode } from "@/hooks/usePreferedColorSchemeMode";

export default function SettingsScreen() {
  const [themeMode, setThemeMode] = usePreferedColorSchemeMode();
  return (
    <ThemedView>
      <ThemedText>Theme Mode</ThemedText>
      <Picker
        selectedValue={themeMode}
        onValueChange={(val) => setThemeMode(val)}
      >
        <Picker.Item label="System" value={"system"} />
        <Picker.Item label="Dark" value={"dark"} />
        <Picker.Item label="Light" value={"light"} />
      </Picker>
    </ThemedView>
  );
}
