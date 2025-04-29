import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAgents } from "@/hooks/useAgents";
import { useDepartments } from "@/hooks/useDepartments";
import { useThemePalette } from "@/hooks/useThemePalette";
import { getArabicDepartmentRole } from "@/services/departments";
import { DepartmentRole } from "@/utils/models";
import { newAgentSchema, NewAgentType } from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";

const NULL_DEPARTMENT_VALUE = "NULL_DEPARTMENT_SPECIAL_VALUE";

export default function AddAgentScreen() {
  const palette = useThemePalette();
  const router = useRouter();
  const { add: addAgent, isAddAgentLoading } = useAgents();
  const { departments } = useDepartments();
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
  const { formState, control, handleSubmit, watch } = useForm<NewAgentType>({
    resolver: zodResolver(newAgentSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      address: "",
      phone: "",
      password: "",
      department: "",
      department_role: null,
    },
  });
  const $agentDepartment = watch("department");
  const onSubmit = async (data: NewAgentType) => {
    try {
      const result = await addAgent(data, selectedImage);
      console.log("Agent added successfully:", result);
      router.replace('/(auth)/(tabs)/agent')
      Alert.alert("نجاح", "تمت إضافة الوكيل بنجاح");
    } catch (err) {
      console.error("Error in onSubmit:", err);

      if (typeof err === "object" && err !== null && "error_ar" in err) {
        Alert.alert("فشل العمليّة", err.error_ar as string);
      } else if (err instanceof Error) {
        Alert.alert(
          "فشل العمليّة",
          err.message || "لم تتمّ إضافة الوكيل بسبب خطأ تقني"
        );
      } else {
        Alert.alert(
          "فشل العمليّة",
          "لم تتمّ إضافة الوكيل بسبب خطأ تقني غير متوقّع"
        );
      }
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

            <Controller
              control={control}
              name="department"
              render={({ field: { value, onChange, onBlur }, fieldState }) => (
                <View>
                  <View
                    style={{
                      borderColor: fieldState.error?.message
                        ? palette.error
                        : "rgba(0,0,0,0.2)",
                      borderWidth: 1,
                      borderRadius: 15,
                    }}
                  >
                    <Picker
                      selectedValue={
                        value === null ? NULL_DEPARTMENT_VALUE : value
                      }
                      onValueChange={(e) => {
                        onChange(e === NULL_DEPARTMENT_VALUE ? null : e);
                      }}
                      onBlur={onBlur}
                    >
                      <Picker.Item
                        label="إختار فرع (إختياري)..."
                        value={NULL_DEPARTMENT_VALUE}
                        color={palette.muted}
                      />
                      {departments &&
                        departments.map((d) => (
                          <Picker.Item
                            key={d.id}
                            label={`${d.name} | ${d.country_ar} | ${d.city} | ${d.zipcode}`}
                            value={d.id}
                          />
                        ))}
                    </Picker>
                  </View>
                  {fieldState.error && (
                    <ThemedText type="sm" style={{ color: palette.error }}>
                      {fieldState.error?.message}
                    </ThemedText>
                  )}
                </View>
              )}
            />

            {$agentDepartment && (
              <Controller
                control={control}
                name="department_role"
                render={({
                  field: { value, onChange, onBlur },
                  fieldState,
                }) => (
                  <View>
                    <View
                      style={{
                        borderColor: fieldState.error?.message
                          ? palette.error
                          : "rgba(0,0,0,0.2)",
                        borderWidth: 1,
                        borderRadius: 15,
                      }}
                    >
                      <Picker
                        mode="dropdown"
                        selectedValue={value}
                        onValueChange={onChange}
                        onBlur={onBlur}
                      >
                        <Picker.Item
                          label="إختار الوظيفة..."
                          value={null}
                          enabled={false}
                          color="rgb(95, 95, 95)"
                        />
                        <Picker.Item
                          label={getArabicDepartmentRole(
                            DepartmentRole.MANAGER
                          )}
                          value={DepartmentRole.MANAGER}
                        />
                        <Picker.Item
                          label={getArabicDepartmentRole(
                            DepartmentRole.SUPERVISOR
                          )}
                          value={DepartmentRole.SUPERVISOR}
                        />
                        <Picker.Item
                          label={getArabicDepartmentRole(DepartmentRole.STAFF)}
                          value={DepartmentRole.STAFF}
                        />
                        <Picker.Item
                          label={getArabicDepartmentRole(
                            DepartmentRole.TECHNICIAN
                          )}
                          value={DepartmentRole.TECHNICIAN}
                        />
                      </Picker>
                      {fieldState.error && (
                        <ThemedText type="sm" style={{ color: palette.error }}>
                          {fieldState.error?.message}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
            <ThemedButton
              style={{ opacity: isAddAgentLoading ? 0.6 : 1 }}
              onPress={handleSubmit(onSubmit)}
              disabled={isAddAgentLoading}
            >
              {isAddAgentLoading ? (
                <ActivityIndicator color={palette.accent} size={25} />
              ) : (
                <ThemedText
                  style={{ textAlign: "center", color: palette.background }}
                >
                  أرسل
                </ThemedText>
              )}
            </ThemedButton>
          </View>
        </ThemedView>
      </ScrollView>
    </>
  );
}
