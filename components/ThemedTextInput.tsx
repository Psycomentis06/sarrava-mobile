import { TextInputProps, TextInput, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState } from "react";

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
        { borderColor: color, color: color },
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
    borderWidth: 1.5,
    padding: 10,
    borderRadius: 30,
  },
  focused: {},
});
