/**
 * IOS specific color palette taken from https://developer.apple.com/design/human-interface-guidelines/color
 */
const tintColorLight = "#EEEEEE";
const tintColorDark = "#212121";

export const Colors = {
  light: {
    text: "#1d1d1f",
    background: "#f5f5f7",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    accent: "#007AFF",
    warn: "#FF9500",
    success: "#34C759",
    error: "#FF3B30",
    muted: "#8e8e93",
  },
  dark: {
    text: "#f5f5f7",
    background: "#000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    accent: "#0A84FF",
    warn: "#FF9F0A",
    success: "#30D158",
    error: "#FF4530",
    muted: "#8e8e93",
  },
};
