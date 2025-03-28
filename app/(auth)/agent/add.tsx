import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { newAgentSchema, NewAgentType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";

export default function AddAgentScreen() {
  const palette = useThemePalette();
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: false,
      base64: true
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
    
  };
  const { formState, control, handleSubmit, getValues } = useForm<NewAgentType>(
    {
      resolver: zodResolver(newAgentSchema),
      defaultValues: {
        firstname: "",
        lastname: "",
        email: "",
        address: "",
        phone: "",
        password: "",
      },
    }
  );
  const onSubmit = async (data: NewAgentType) => {
    try {
      // 1. Signup user in supabase
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp(
        { email: getValues().email, password: getValues().password }
      );
      if (signUpErr) {
        Alert.alert("خطأ", "فشل أضافة وكيل جديد");
        console.error(signUpErr);
        return;
      }
      // 2. Save image in supabase with newly created user id as the image name
      if (!signUpData.user) {
        Alert.alert(
          "مشكل",
          "حدث خلل ما مأدى لعدم أكمال العملية. تم أضافة الوكيل مما يكنه من تسجيل الدخول لاكن لم تتم أضافة الصورة أو المعلومات الخاصة بالوكيل. يمكنك الدخول بحساب الوكيل لتحدث البيانات"
        );
        return;
      }
      let imageUrl = null;
      if (selectedImage && selectedImage.base64) {
        const { data: uploadImgData, error: uploadImgErr } =
          await supabase.storage
            .from("user-profiles")
            .upload(signUpData.user.id, selectedImage.base64, {
              upsert: true,
              contentType: selectedImage.mimeType,
            });

        if (uploadImgErr) {
          console.error("Failed to upload image", uploadImgErr);
        }

        imageUrl = uploadImgData?.fullPath;
      }

      // 3. Save user profile data
      const { data: insertProfileData, error: insertProfileErr } =
        await supabase.from("user_profiles").insert({
          user_id: signUpData.user?.id,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          phone: data.phone,
          address: data.address,
          profile_picture: imageUrl,
        });

      if (insertProfileErr) {
        Alert.alert("فشل", "حدث خطأ أثناء تسجيل المعطيات التابعة للوكيل");
        console.error(insertProfileErr);
        return;
      }

      console.log("New agent profile: ", insertProfileData);
    } catch (error) {
      console.error("Error in onSubmit:", error);
      Alert.alert(
        "خطأ",
        "حدث خطأ أثناء إضافة الوكيل الجديد. يرجى المحاولة مرة أخرى."
      );
    }
  };
  return (
    <>
      <Stack.Screen options={{ title: "إضافة وكيل جديد" }} />
      <ScrollView>
        <ThemedView
          style={{
            width: "100%",
            minHeight: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View style={{ width: "100%", padding: 10, gap: 20 }}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: palette.accent,
                alignSelf: "center",
                overflow: "hidden",
              }}
            >
              <Pressable
                style={{
                  alignSelf: "center",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                }}
                android_ripple={{ color: "white" }}
                onPress={pickImage}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage.uri, width: 160, height: 160 }}
                  />
                ) : (
                  <>
                    <IconSymbol
                      name="photo.fill"
                      size={56}
                      color={palette.background}
                    />
                    <ThemedText style={{ color: palette.background }}>
                      تحميل صورة
                    </ThemedText>
                  </>
                )}
              </Pressable>
            </View>
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
              name="password"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <ThemedTextInput
                  placeholder="كلمة السرّ"
                  keyboardType="default"
                  secureTextEntry={true}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.password?.message}
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
