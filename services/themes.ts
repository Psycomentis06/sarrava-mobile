import AsyncStorage from "@react-native-async-storage/async-storage";

const PREF_COLOR_MODE_KEY = "theme:colorSchemeMode";
export function saveThemeMode(mode: "system" | "light" | "dark") {
  AsyncStorage.setItem(PREF_COLOR_MODE_KEY, mode);
}

export function getThemeMode(): Promise<"system" | "light" | "dark"> {
  return AsyncStorage.getItem(PREF_COLOR_MODE_KEY)
    .then((mode) => {
      if (mode === "light") {
        return "light";
      } else if (mode === "dark") {
        return "dark";
      }
      return "system";
    })
    .catch((err) => Promise.reject(err));
}
