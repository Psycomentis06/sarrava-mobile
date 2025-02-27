import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "sm"
    | "xs"
    | "md"
    | "l"
    | "xl"
    | "xl2";
  weight?:
    | "regular"
    | "extra-bold"
    | "bold"
    | "light"
    | "extra-light"
    | "medium"
    | "black";
  family?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  weight = "regular",
  family,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color, fontFamily: family ?? "Tajawal" },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "sm" ? styles.sm : undefined,
        type === "xs" ? styles.xs : undefined,
        type === "md" ? styles.md : undefined,
        type === "l" ? styles.l : undefined,
        type === "xl" ? styles.xl : undefined,
        type === "xl2" ? styles.xl2 : undefined,

        weight === "regular" ? styles.weightRegular : undefined,
        weight === "light" ? styles.weightLight : undefined,
        weight === "extra-light" ? styles.weightExtraLight : undefined,
        weight === "bold" ? styles.weightBold : undefined,
        weight === "extra-bold" ? styles.weightExtraBold : undefined,
        weight === "medium" ? styles.weightMedium : undefined,
        weight === "black" ? styles.weightBlack : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 14,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 14,
    lineHeight: 24,
    fontFamily: "Tajawal-Medium",
  },
  title: {
    fontSize: 32,
    fontFamily: "Tajawal-Bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    color: "#0a7ea4",
  },
  sm: {
    fontSize: 10,
    lineHeight: 20,
  },
  xs: {
    fontSize: 8,
    lineHeight: 18,
  },
  md: {
    fontSize: 13,
  },
  l: { fontSize: 16 },
  xl: { fontSize: 20 },
  xl2: { fontSize: 24 },
  weightRegular: {
    // fontWeight: "regular",
    fontFamily: "Tajawal-Regular",
  },
  weightMedium: {
    fontFamily: "Tajawal-Medium",
  },
  weightLight: {
    // fontWeight: "thin",
    fontFamily: "Tajawal-Thin",
  },
  weightExtraLight: {
    // fontWeight: "ultralight",
    fontFamily: "Tajawal-ExtraLight",
  },
  weightBold: {
    // fontWeight: "semibold",
    fontFamily: "Tajawal-Bold",
  },
  weightExtraBold: {
    // fontWeight: "bold",
    fontFamily: "Tajawal-ExtraBold",
  },
  weightBlack: {
    fontFamily: "Tajawal-Black",
  },
});
