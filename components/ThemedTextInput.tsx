import {
  TextInputProps,
  TextInput,
  StyleSheet,
  Platform,
  View,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useState } from "react";
import { hexToRgba } from "@/utils/colors";
import { useThemePalette } from "@/hooks/useThemePalette";
import { ThemedText } from "./ThemedText";
import React from "react";

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  error?: string;
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  error,
  onBlur: externalOnBlur,
  onFocus: externalOnFocus,
  ...rest
}: ThemedTextInputProps) {
  const palette = useThemePalette();
  const [focused, setFocused] = useState(false);

  return (
    <>
      <TextInput
        onFocus={(e) => {
          setFocused(true);
          if (externalOnFocus) {
            externalOnFocus(e);
          }
        }}
        onBlur={(e) => {
          setFocused(false);
          if (externalOnBlur) {
            externalOnBlur(e);
          }
        }}
        placeholderTextColor={palette.text}
        style={[
          {
            borderColor: error ? palette.error : hexToRgba(palette.text, 0.3),
            color: palette.text,
          },
          styles.default,
          focused && !error
            ? [styles.focused, { borderColor: palette.accent }]
            : null,
          style,
        ]}
        {...rest}
      />
      {error && (
        <ThemedText
          type="sm"
          style={{ color: palette.error, transform: "translateY(-15px)" }}
        >
          {error}
        </ThemedText>
      )}
    </>
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
