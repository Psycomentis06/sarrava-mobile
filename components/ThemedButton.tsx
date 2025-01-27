import { useThemeColor } from "@/hooks/useThemeColor";
import { Button, ButtonProps } from "react-native";

export type ThemedButtonProps = ButtonProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "success" | "warn" | "error";
  title: string;
};
export function ThemedButton({
  lightColor,
  darkColor,
  title,
  type = "default",
  ...rest
}: ThemedButtonProps) {
  const accent = useThemeColor(
    { light: lightColor, dark: darkColor },
    "accent"
  );
  return <Button title={title} color={accent} {...rest} />;
}
