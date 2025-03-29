import { useThemePalette } from "@/hooks/useThemePalette";
import { hexToRgba } from "@/utils/colors";
import React, { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import { ThemedText } from "./ThemedText";

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>
  errorStyle?: StyleProp<TextStyle>
};

export function ThemedTextInput({
  style,
  lightColor,
  darkColor,
  error,
  onBlur: externalOnBlur,
  onFocus: externalOnFocus,
  containerStyle,
  errorStyle,
  ...rest
}: ThemedTextInputProps) {
  const palette = useThemePalette();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[containerStyle, {justifyContent: 'center'}]} >
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
          style={[ {color: palette.error, flexShrink: 1}, errorStyle ]}
        >
          {error}
        </ThemedText>
      )}
    </View>
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
