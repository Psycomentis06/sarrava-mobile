import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import NetworkModeStatus from "@/components/ui/NetworkModeStatus";
import { AuthSessionProvider } from "@/contexts/auth";
import { getThemeMode } from "@/services/themes";
import { Appearance } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Tajawal: require("../assets/fonts/tajawal/Tajawal-Regular.ttf"),
    "Tajawal-ExtraLight": require("../assets/fonts/tajawal/Tajawal-ExtraLight.ttf"),
    "Tajawal-Light": require("../assets/fonts/tajawal/Tajawal-Light.ttf"),
    "Tajawal-Medium": require("../assets/fonts/tajawal/Tajawal-Medium.ttf"),
    "Tajawal-Regular": require("../assets/fonts/tajawal/Tajawal-Regular.ttf"),
    "Tajawal-Bold": require("../assets/fonts/tajawal/Tajawal-Bold.ttf"),
    "Tajawal-Black": require("../assets/fonts/tajawal/Tajawal-Black.ttf"),
    "Tajawal-ExtraBold": require("../assets/fonts/tajawal/Tajawal-ExtraBold.ttf"),
  });
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }

    getThemeMode().then((mode) => {
      if (mode === "system") Appearance.setColorScheme(null);
      else Appearance.setColorScheme(mode);
    });
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthSessionProvider>
        <Stack>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <NetworkModeStatus />
        <StatusBar style="auto" />
      </AuthSessionProvider>
    </ThemeProvider>
  );
}
