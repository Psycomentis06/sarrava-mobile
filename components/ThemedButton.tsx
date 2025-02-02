import { useThemeColor } from "@/hooks/useThemeColor";
import { useThemePalette } from "@/hooks/useThemePalette";
import { useEffect } from "react";
import {
  Button,
  ButtonProps,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

export type ThemedButtonProps = PressableProps & {
  lightColor?: string;
  darkColor?: string;
  color?: "default" | "success" | "warn" | "error";
  type?: "basic" | "raised" | "stroked" | "flat";
  shape?: "default" | "pill" | "soft";
};
export function ThemedButton({
  lightColor,
  darkColor,
  children,
  style,
  type = "basic",
  color = "default",
  shape = "soft",
  ...rest
}: ThemedButtonProps) {
  // todo use useThemePalette hook to get the complete color palette
  const palette = useThemePalette();

  const styles = StyleSheet.create({
    pill: { borderRadius: "50%" },
    soft: { borderRadius: 15 },
    defaultType: {
      fontFamily: "sans",
      width: "100%",
      paddingVertical: 10,
      paddingHorizontal: 10,
      textAlign: "center",
      backgroundColor: palette["accent"],
      color: palette["text"],
    },
    raisedType: {
      shadowColor: "#000000",
      shadowOffset: { width: 1, height: 4 },
      shadowOpacity: 0.13,
      shadowRadius: 3.84,
      elevation: 5,
    },
    strokedType: {
      borderWidth: 1.2,
    },
  });

  return (
    <Pressable
      style={[
        shape === "pill" ? styles.pill : undefined,
        shape === "soft" ? styles.soft : undefined,
        styles.defaultType,
        type === "raised" ? styles.raisedType : undefined,
        style as ViewStyle,
      ]}
      android_ripple={{ color: "rgba(236, 239, 241, 0.26)", foreground: true }}
      android_disableSound={true}
      {...rest}
    >
      {children ?? "Click Me"}
    </Pressable>
  );
}
