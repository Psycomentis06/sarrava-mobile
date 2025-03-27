import { ThemedText } from "@/components/ThemedText";
import { useSession } from "@/contexts/auth";
import { UserProfileProvider } from "@/contexts/profile";
import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppLayout() {
  const { session, isLoading } = useSession();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <UserProfileProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        ></Stack.Screen>
      </Stack>
    </UserProfileProvider>
  );
}
