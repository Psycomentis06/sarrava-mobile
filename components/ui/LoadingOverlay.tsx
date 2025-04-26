import { ThemedText } from "@/components/ThemedText";
import { useThemePalette } from "@/hooks/useThemePalette";
import { ActivityIndicator, View } from "react-native";

interface LoadingOverlayProps {
  text?: string;
}

export default function LoadingOverlay({ text = "جاري التحميل..." }: LoadingOverlayProps) {
  const palette = useThemePalette();

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        backgroundColor: palette.background,
        justifyContent: "center",
        alignItems: "center",
        opacity: 0.9,
        zIndex: 999,
      }}
    >
      <ThemedText type="xl" weight="medium" style={{ marginBottom: 20 }}>
        {text}
      </ThemedText>
      <ActivityIndicator size="large" color={palette.accent} />
    </View>
  );
}
