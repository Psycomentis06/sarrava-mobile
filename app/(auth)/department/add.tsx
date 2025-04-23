import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { Countries } from "@/constants/Countries";
import { useUserProfile } from "@/contexts/profile";
import { useThemePalette } from "@/hooks/useThemePalette";
import { supabase } from "@/lib/supabase";
import { AgentDepartment } from "@/utils/models";
import {
  newAgentDepartmentSchema,
  NewAgentDepartmentSchemaType,
} from "@/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, View } from "react-native";

export default function AddDepartmentScreen() {
  const { profile } = useUserProfile();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(newAgentDepartmentSchema),
    defaultValues: {
      name: "",
      country: { name: "", name_ar: "", dialCode: "", code: "" },
      city: "",
      address: "",
      zipcode: "",
    },
  });
  const palette = useThemePalette();
  const router = useRouter();
  const addDepartment = async (formData: NewAgentDepartmentSchemaType) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: formData.name,
          country: formData.country.name,
          country_ar: formData.country.name_ar,
          country_code: formData.country.code,
          city: formData.city,
          zipcode: formData.zipcode,
          address: formData.address,
          updated_at: null,
          updated_by: profile?.firstname + " " + profile?.lastname,
        })
        .select()
        .single();
      if (error) {
        console.error("Department failed: ", error);
        return;
      }
      Alert.alert("نجاح العمليّة", "تمّ إضافة فرع جديد بنجاح");
      console.log("Department created: ", data);
      const newDepartment: AgentDepartment = data;
      router.replace({
        pathname: "/(auth)/(tabs)/department",
        params: { id: newDepartment.id },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Stack.Screen options={{ title: "إضافة فرع جديد" }} />
      <ThemedView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <View style={{ flex: 1, gap: 20, padding: 10 }}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <ThemedTextInput
                placeholder="الإسم"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="country"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <>
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
                      selectedValue={value}
                      onValueChange={onChange}
                      onBlur={onBlur}
                    >
                      <Picker.Item
                        label="إختار البلد..."
                        value={{}}
                        enabled={false}
                        color="#aaa"
                      />
                      {Countries.map((c) => (
                        <Picker.Item
                          key={c.code}
                          label={`${c.name_ar} (${c.code})`}
                          value={c}
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
              </>
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <ThemedTextInput
                placeholder="المدينة"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="zipcode"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <ThemedTextInput
                placeholder="الرّمز البريدي"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { value, onChange, onBlur }, fieldState }) => (
              <ThemedTextInput
                placeholder="العنوان"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={fieldState.error?.message}
              />
            )}
          />

          <ThemedButton
            onPress={handleSubmit(addDepartment)}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color={palette.background} size={24} />
            ) : (
              <ThemedText
                style={{ color: palette.background, textAlign: "center" }}
              >
                أرسل
              </ThemedText>
            )}
          </ThemedButton>
        </View>
      </ThemedView>
    </>
  );
}
