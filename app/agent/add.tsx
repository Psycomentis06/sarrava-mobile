import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { newAgentSchema, NewAgentType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stack } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, ScrollView, View } from "react-native";

export default function AddAgentScreen() {
  const palette = useThemePalette();
  const { formState, control, handleSubmit } = useForm<NewAgentType>({
    resolver: zodResolver(newAgentSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      address: "",
      phone: "",
    },
  });
  const onSubmit = (data: NewAgentType) => {
    Alert.alert(
      "نجاح",
      "تمّ أضافة الوكيل الجديد. سيتم أرسال تسجيل الدخول و كلمة السرّ عبر البريد " +
        data.email
    );
  };
  return (
    <>
      <Stack.Screen options={{ title: "إضافة وكيل جديد" }} />
      <ScrollView>
        <ThemedView style={{ justifyContent: "center", flex: 1 }}>
          <View style={{ padding: 10, gap: 20 }}>
            <Controller
              name="firstname"
              control={control}
              render={({ field: { onBlur, onChange, value } }) => (
                <ThemedTextInput
                  placeholder="الأسم"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.firstname?.message}
                />
              )}
            />
            <Controller
              name="lastname"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <ThemedTextInput
                  placeholder="اللّقب"
                  autoComplete="name-family"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.lastname?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <ThemedTextInput
                  placeholder="البريد الألكتروني"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={formState.errors.email?.message}
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ThemedTextInput
                  placeholder="رقم الهاتف"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.phone?.message}
                />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ThemedTextInput
                  placeholder="العنوان"
                  autoComplete="address-line1"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={formState.errors.address?.message}
                />
              )}
            />

            <ThemedButton onPress={handleSubmit(onSubmit)}>
              <ThemedText
                style={{ textAlign: "center", color: palette.background }}
              >
                أرسل
              </ThemedText>
            </ThemedButton>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
