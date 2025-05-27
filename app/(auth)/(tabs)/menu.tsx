import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSupabaseHasPermissions } from "@/hooks/useSupabaseHasPermissions";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useNavigation } from "expo-router";
import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MoreOptions() {
  const navigation = useNavigation();
  const { tint, text, error } = useThemePalette();
  const insets = useSafeAreaInsets();
  const { hasPermission: hasAdminPermission, isLoading } =
    useSupabaseHasPermissions(["admin"]);
  const styles = StyleSheet.create({
    mainTitle: {
      textAlign: "center",
      paddingVertical: 30,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: tint,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginVertical: 1,
    },
  });

  const signOut = async () => {
    Alert.alert(
      "تأكيد تسجيل الخروج",
      "⚠️ عند تسجيل الخروج:\n\n" +
        "• سيتم حذف جميع بياناتك المحفوظة على هذا الجهاز\n" +
        "• ستُحذف جميع المعاملات المضافة في وضع عدم الاتصال\n\n" +
        "لحفظ المعاملات غير مسجّلة على الخادم، يرجى:\n" +
        "1. الاتصال بالإنترنت\n" +
        "2. الانتظار حتى اكتمال المزامنة\n" +
        "3. ثم تسجيل الخروج",
      [
        {
          text: "إلغاء",
          style: "cancel",
          onPress: () => {},
        },
        {
          text: "تسجيل الخروج",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut({ scope: "local" });
              if (error) {
                Alert.alert("مشكل حدث أثناء تسجيل الخروج", error.message);
                console.error(error);
                return;
              }
              // Clear all cache to prevent data leakage
              await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys());
              navigation.navigate("auth/login" as never);
            } catch (err) {
              Alert.alert("خطأ", "حدث خطأ أثناء محاولة تسجيل الخروج");
              console.error(err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View>
        <Link
          href="/(auth)/(tabs)/reports"
          asChild
          style={{
            display: !isLoading && hasAdminPermission ? "flex" : "none",
          }}
        >
          <Pressable
            style={styles.menuItem}
            android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          >
            <IconSymbol
              size={24}
              name="archivebox.fill"
              color={text}
              style={{ marginHorizontal: 5 }}
            />
            <ThemedText style={{ marginLeft: 5 }}>التقارير</ThemedText>
          </Pressable>
        </Link>

        <Link
          href="/(auth)/(tabs)/department"
          asChild
          style={{
            display: !isLoading && hasAdminPermission ? "flex" : "none",
          }}
        >
          <Pressable
            style={styles.menuItem}
            android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          >
            <IconSymbol
              size={24}
              name="building"
              color={text}
              style={{ marginHorizontal: 5 }}
            />
            <ThemedText style={{ marginLeft: 5 }}>الفروع</ThemedText>
          </Pressable>
        </Link>

        <Link
          href="/(auth)/(tabs)/currency_rates"
          asChild
          style={{
            display: !isLoading && hasAdminPermission ? "flex" : "none",
          }}
        >
          <Pressable
            style={styles.menuItem}
            android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          >
            <IconSymbol
              size={24}
              name="coloncurrencysign.square.fill"
              color={text}
              style={{ marginHorizontal: 5 }}
            />
            <ThemedText style={{ marginLeft: 5 }}>أسعار الصرف</ThemedText>
          </Pressable>
        </Link>

        <Link href="/(auth)/transaction_tariffs" asChild>
          <Pressable
            style={styles.menuItem}
            android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          >
            <IconSymbol
              size={24}
              name="yensign.circle"
              color={text}
              style={{ marginHorizontal: 5 }}
            />
            <ThemedText style={{ marginLeft: 5 }}>تعريفة المعاملات</ThemedText>
          </Pressable>
        </Link>

        <Pressable
          style={styles.menuItem}
          onPress={() => navigation.navigate("settings" as never)}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          disabled
        >
          <IconSymbol
            size={24}
            name="gear"
            color={text}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ marginLeft: 5 }}>الأعدادات</ThemedText>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
          onPress={signOut}
        >
          <IconSymbol
            size={24}
            name="rectangle.portrait.and.arrow.right"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>
            تسجيل الخروج
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          android_ripple={{ color: "rgba(0,0,0,0.26)" }}
        >
          <IconSymbol
            size={24}
            name="xmark.app"
            color={error}
            style={{ marginHorizontal: 5 }}
          />
          <ThemedText style={{ color: error, marginLeft: 5 }}>
            أغلاق التطبيق
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
