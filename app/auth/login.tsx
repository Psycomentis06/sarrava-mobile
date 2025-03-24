import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { loginSchema, LoginSchemaType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet } from "react-native";

export default function Login() {
  const navigation = useNavigation();

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const palette = useThemePalette();
  const login = async ({ email, password }: LoginSchemaType) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      let msg = "";
      switch (error.code) {
        case "invalid_credentials":
          msg = "المعطيات (بريد الألكتروني/كلمة السرّ) غير صحيحة";
          break;
        case "user_banned":
          msg = "تمّ حظر حسابك. الرجاء الأتصال مع المسؤول";
          break;
        default:
          msg = error.message;
      }
      Alert.alert("فشل تسجيل الدخول", msg);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    navigation.navigate("(auth)" as never);
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.loginContainer}>
        <ThemedText type="title" style={styles.loginTitle}>
          تسجيل الدخول
        </ThemedText>
        <ThemedView style={styles.inputsContainer}>
          <Controller
            name="email"
            control={control}
            render={({ field: { value, onBlur, onChange }, fieldState }) => (
              <ThemedTextInput
                onChangeText={onChange}
                value={value}
                onBlur={onBlur}
                placeholder="البريد الألكتروني"
                textAlign="right"
                inputMode="email"
                autoComplete="email"
                maxLength={32}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field: { value, onBlur, onChange }, fieldState }) => (
              <ThemedTextInput
                onChangeText={onChange}
                value={value}
                onBlur={onBlur}
                textAlign="right"
                placeholder="كلمة الدخول"
                secureTextEntry={true}
                maxLength={32}
                error={fieldState.error?.message}
              />
            )}
          />
        </ThemedView>
        <ThemedButton
          onPress={handleSubmit(login)}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.6 : 1 }}
        >
          <ThemedText
            style={{ color: palette.background, textAlign: "center" }}
          >
            أرسل
          </ThemedText>
        </ThemedButton>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    gap: 30,
    width: "100%",
    padding: 10,
  },
  inputsContainer: {
    gap: 20,
  },
  loginTitle: {
    textAlign: "center",
  },
});
