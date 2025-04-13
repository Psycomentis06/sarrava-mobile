import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useThemePalette } from "@/hooks/useThemePalette";
import { newAgentSchema, NewAgentType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Image, Pressable, ScrollView, View } from "react-native";

export default function AddAgentScreen() {
  const palette = useThemePalette();
  const router = useRouter();
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: false,
      base64: false, // We lazy-load the base64 using Filesystem to save memory
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
    Alert.alert(
      "مستحيل",
      "لايمكن أضافة وكيل جديد في الوقت الرّاهن. لم تكتمل هذه الخاصيّة بعد"
    );
    return;
    // try {
    // 1. Check if mail exists
    /*
      const { data: checkMailData, error: checkMailErr } = await supabase
        .from("user_profiles")
        .select()
        .eq("email", getValues().email);
      if (!checkMailErr) {
        Alert.alert("خطأ", "فشل التحقق من البريد الألكتروني");
        console.error(checkMailErr)
        return;
      }
      console.log(checkMailData);
      if (true) {
        return;
      }*/
    //   // 2. Signup user in supabase
    //   const { data: signUpData, error: signUpErr } = await supabase.auth.signUp(
    //     { email: getValues().email, password: getValues().password }
    //   );
    //   if (signUpErr) {
    //     Alert.alert("خطأ", "فشل أضافة وكيل جديد");
    //     console.error(signUpErr);
    //     return;
    //   }
    //   // 3. Save image in supabase with newly created user id as the image name
    //   if (!signUpData.user) {
    //     Alert.alert(
    //       "مشكل",
    //       "حدث خلل ما مأدى لعدم أكمال العملية. تم أضافة الوكيل مما يكنه من تسجيل الدخول لاكن لم تتم أضافة الصورة أو المعلومات الخاصة بالوكيل. يمكنك الدخول بحساب الوكيل لتحدث البيانات"
    //     );
    //     return;
    //   }
    //   let imageUrl = null;
    //   if (selectedImage) {
    //     const imgBase64 = await Filesystem.readAsStringAsync(
    //       selectedImage.uri,
    //       { encoding: "base64" }
    //     );
    //     const { data: uploadImgData, error: uploadImgErr } =
    //       await supabase.storage
    //         .from("user-profiles")
    //         .upload(signUpData.user.id, decode(imgBase64), {
    //           upsert: true,
    //           contentType: selectedImage.mimeType,
    //         });

    //     if (uploadImgErr) {
    //       console.error("Failed to upload image", uploadImgErr);
    //     }

    //     imageUrl = uploadImgData?.fullPath;
    //   }

    //   // 4. Save user profile data
    //   const { data: insertProfileData, error: insertProfileErr } =
    //     await supabase
    //       .from("user_profiles")
    //       .insert({
    //         user_id: signUpData.user?.id,
    //         firstname: data.firstname,
    //         lastname: data.lastname,
    //         email: data.email,
    //         phone: data.phone,
    //         address: data.address,
    //         profile_picture: imageUrl,
    //       })
    //       .select("id")
    //       .single();

    //   if (insertProfileErr) {
    //     Alert.alert("فشل", "حدث خطأ أثناء تسجيل المعطيات التابعة للوكيل");
    //     console.error(insertProfileErr);
    //     return;
    //   }

    //   console.log("New agent profile: ", insertProfileData);
    //   const newAgentProfile = insertProfileData as UserProfile;
    //   router.replace({
    //     pathname: "/(auth)/(tabs)/agent",
    //     params: { id: newAgentProfile.id },
    //   });
    // } catch (error) {
    //   console.error("Error in onSubmit:", error);
    //   Alert.alert(
    //     "خطأ",
    //     "حدث خطأ أثناء إضافة الوكيل الجديد. يرجى المحاولة مرة أخرى."
    //   );
    // }
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
