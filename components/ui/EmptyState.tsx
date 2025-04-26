import { ThemedText } from "@/components/ThemedText";
import { useThemePalette } from "@/hooks/useThemePalette";
import { View } from "react-native";
import { IconSymbol, IconSymbolName } from "./IconSymbol";

interface EmptyStateProps {
  title?: string;
  description?: string;
  iconName?: IconSymbolName; // Optional nice icon
}

export default function EmptyState({
  title = "لا توجد بيانات",
  description = "لا توجد عناصر للعرض هنا.",
  iconName = "tray",
}: EmptyStateProps) {
  const palette = useThemePalette();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      {iconName && (
        <IconSymbol
          name={iconName}
          size={64}
          color={palette.tint}
          style={{ marginBottom: 20 }}
        />
      )}
      <ThemedText type="xl" weight="bold" style={{ marginBottom: 10 }}>
        {title}
      </ThemedText>
      <ThemedText
        type="default"
        style={{ textAlign: "center", color: palette.tint }}
      >
        {description}
      </ThemedText>
    </View>
  );
}
