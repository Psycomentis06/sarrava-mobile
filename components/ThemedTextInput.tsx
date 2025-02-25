import { TextInputProps, TextInput, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState } from "react";
import { hexToRgba } from "@/utils/colors";

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedTextInputProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const accent = useThemeColor(
    { light: lightColor, dark: darkColor },
    "accent"
  );
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor={color}
      style={[
        { borderColor: hexToRgba(color, 0.3), color: color },
        styles.default,
        focused ? [styles.focused, { borderColor: accent }] : null,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
  focused: {},
});
