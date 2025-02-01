import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook for user preferred color scheme mode
 * @returns [currentMode, updateMode()]
 */
export function usePreferedColorSchemeMode() {
  const PREF_COLOR_MODE_KEY = "theme:colorSchemeMode";
  const [mode, setInternalMode] = useState<"system" | "light" | "dark">(
    "system"
  );
  useEffect(() => {
    const loadMode = async () => {
      const val = await AsyncStorage.getItem(PREF_COLOR_MODE_KEY);
      if (val === null) {
        await AsyncStorage.setItem(PREF_COLOR_MODE_KEY, mode);
      } else {
        setInternalMode(val as "system" | "light" | "dark");
      }
    };
    loadMode();
  }, []);

  const setMode = (mode: "system" | "light" | "dark") => {
    setInternalMode(mode);
    AsyncStorage.setItem(PREF_COLOR_MODE_KEY, mode);
  };
  return [mode, setMode] as const;
}
