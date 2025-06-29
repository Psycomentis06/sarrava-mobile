import { useUserProfile } from "@/contexts/profile";
import { supabase } from "@/lib/supabase";
import {
  DepartmentAgentRelation,
  DepartmentRole,
  UserProfile,
} from "@/utils/models";
import { NewAgentType } from "@/utils/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import * as Filesystem from "expo-file-system";
import { ImagePickerAsset } from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import * as z from "zod";

export type UseAgentsHookReturnType = {
  isLoading: boolean;
  isAddAgentLoading: boolean;
  error: Error | null;
  arError: string | null;
  agents: UserProfile[];
  searchResults: UserProfile[];
  reload: () => Promise<UserProfile[]>;
  add: (
    profile: NewAgentType,
    image: ImagePickerAsset | null
  ) => Promise<UserProfile>;
  search: (val: string) => Promise<UserProfile[]>;
  addToDepartment: (
    agentId: string,
    departmentId: string,
    role: DepartmentRole
  ) => Promise<DepartmentAgentRelation>;
  removeFromDepartment: (
    agentId: string,
    departmentId: string
  ) => Promise<void>;
};

const CACHE_VERSION = 0;
const OFFLINE_AGENTS_CACHE_KEY = `offline:agents:${CACHE_VERSION}:data`;
let _agents_session_cache: UserProfile[] = [];

export function useAgents(): UseAgentsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddAgentLoading, setIsAddAgentLoading] = useState<boolean>(false);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);
  const { profile } = useUserProfile();

  const getAgentProfilePicture = async (agentId: string) => {
    const { data: imgUrl } = await supabase.storage
      .from("user-profiles")
      .getPublicUrl(agentId);
    return imgUrl;
  };

  const getAllAgentDepartmentRelations = async (): Promise<
    DepartmentAgentRelation[]
  > => {
    const { data, error } = await supabase.from("agents_departments").select();
    if (error)
      throw new Error(`Error loading agents_departments: ${error.message}`);
    return data as DepartmentAgentRelation[];
  };

  const getAgentsFromSupabase = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select()
        .order("created_at", { ascending: false });

      if (error) {
        throw { error };
      }

      if (!data) {
        return [];
      }

      const userProfiles = data as UserProfile[];

      const relations = await getAllAgentDepartmentRelations();
      const mergedAgents = await Promise.all(
        userProfiles.map(async (agent) => ({
          ...agent,
          departments: relations.filter(
            (rel) => rel.agent_id === agent.user_id
          ),
          profile_picture: (
            await getAgentProfilePicture(agent.user_id)
          ).publicUrl,
        }))
      );

      // Cache the data
      _agents_session_cache = mergedAgents;
      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(mergedAgents)
      );

      setAgents(mergedAgents);
      return mergedAgents;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setArError("حدث خطأ أثناء تحميل البيانات");
      throw error;
    }
  };

  const getAgentsFromOfflineCache = async (): Promise<UserProfile[]> => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem(OFFLINE_AGENTS_CACHE_KEY);
      if (data) {
        const parsedAgents: UserProfile[] = JSON.parse(data);
        setAgents(parsedAgents);
        _agents_session_cache = parsedAgents;
        return parsedAgents;
      } else {
        const offlineError = new Error("No offline data available");
        setError(offlineError);
        setArError("لا توجد بيانات متاحة في وضع عدم الاتصال");
        throw offlineError;
      }
    } catch (error) {
      console.error(error);
      const errorObj = error as Error;
      setError(errorObj);
      setArError("حدث خطأ أثناء قراءة البيانات المخزنة محلياً");
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async (): Promise<UserProfile[]> => {
    setIsLoading(true);
    setError(null);
    setArError(null);

    try {
      let result: UserProfile[];
      if (_agents_session_cache.length > 0) {
        console.log("loading agents from session cache");
        setAgents(_agents_session_cache);
        result = _agents_session_cache;
      } else if (isInternetReachable === false) {
        console.log("loading agents from offline cache");
        result = await getAgentsFromOfflineCache();
      } else if (isInternetReachable === true) {
        console.log("loading agents from database");
        result = await getAgentsFromSupabase();
      } else {
        // isInternetReachable = null at component render thus we should not take an action
        result = [];
      }
      return result;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async (): Promise<UserProfile[]> => {
    _agents_session_cache = [];
    return loadData();
  };

  const search = useCallback(
    async (val: string) => {
      const trimmed = val.trim().toLowerCase();
      if (!trimmed) {
        setSearchResults(agents);
        return agents;
      }
      const filtered = agents.filter(
        (a) =>
          a.firstname?.toLowerCase().includes(trimmed) ||
          a.lastname?.toLowerCase().includes(trimmed) ||
          a.email?.toLowerCase().includes(trimmed) ||
          a.address?.toLowerCase().includes(trimmed) ||
          a.phone?.toLowerCase().includes(trimmed)
      );
      setSearchResults(filtered);
      return filtered;
    },
    [agents]
  );

  const add = async (
    profile: NewAgentType,
    image: ImagePickerAsset | null
  ): Promise<UserProfile> => {
    setIsAddAgentLoading(true);
    try {
      // 1. Call the edge function to create the agent user
      const { data: agentData, error: agentError } =
        await supabase.functions.invoke("create-agent", {
          body: {
            email: profile.email,
            password: profile.password,
            profileData: {
              firstname: profile.firstname,
              lastname: profile.lastname,
              email: profile.email,
              phone: profile.phone,
              address: profile.address,
              department_id: profile.department,
              department_role: profile.department_role,
            },
          },
        });

      if (agentError) {
        if (agentError instanceof FunctionsHttpError) {
          const errorMessage = await agentError.context.json();
          console.log(
            "Error adding agent: Function returned an error",
            errorMessage
          );

          // Check if the error is an AuthApiError
          if (errorMessage && errorMessage.code) {
            let msg = "خطأ في معطيات الحساب";
            switch (errorMessage.code) {
              case "email_exists":
                msg = "البريد الإلكتروني موجود";
                break;
              case "email_address_invalid":
                msg = "عنوان البريد الإلكتروني غير صالح";
                break;
              case "email_address_not_authorized":
                msg = "البريد الإلكتروني غير مسموح له بتنفيذ العمليّة";
                break;
            }
            throw { error: errorMessage, error_ar: msg };
          }

          throw {
            error: errorMessage,
            error_ar:
              "لم تتم إضافة الوكيل لخطأ في البيانات تأكد من صحة البريد الإلكتروني, تأكّد أنّ البريد الإلكتروني ليس موجود مسبقا",
          };
        } else if (agentError instanceof FunctionsRelayError) {
          console.log("Error adding agent: Relay error:", agentError.message);
          throw {
            error: agentError,
            error_ar:
              "فشل إضافة وكيل جديد نظرا لفشل الإتصال بالخادم, الرّجاء إعادة المحاولة لاحقا",
          };
        } else if (agentError instanceof FunctionsFetchError) {
          console.log("Error adding agent: Fetch error:", agentError.message);
          throw {
            error: agentError,
            error_ar:
              "فشل إضافة وكيل جديد نظرا لعدم القدرة للوصول إلى البيانات اللّازمة. الرّجاء المحاولة لاحقا أو الإتصال بالمسؤول",
          };
        } else {
          console.log("Unknown error type:", agentError);
          throw {
            error: agentError,
            error_ar: "خطأ غير متوقّع أثناء إضافة وكيل",
          };
        }
      }

      // Make sure agentData is not null before proceeding
      if (!agentData) {
        throw {
          error: new Error("No data returned from create-agent function"),
          error_ar: "لم يتم إرجاع البيانات من الخادم عند إنشاء الوكيل",
        };
      }

      const createdProfile: UserProfile = agentData;

      let imageUrl = null;

      // 2. Upload image if exists
      if (image) {
        try {
          const imgBase64 = await Filesystem.readAsStringAsync(image.uri, {
            encoding: "base64",
          });

          if (!imgBase64) {
            console.error("Failed to read image as base64");
            throw new Error("Failed to read image data");
          }

          const { data: uploadImgData, error: uploadImgErr } =
            await supabase.storage
              .from("user-profiles")
              .upload(createdProfile.user_id, decode(imgBase64), {
                upsert: true,
                contentType: image.mimeType || "image/jpeg", // Provide default MIME type
              });

          if (uploadImgErr) {
            console.error("Failed to upload image", uploadImgErr);
            // We don't throw here to allow agent creation to succeed even if image upload fails
            // Just log the error and continue
          } else if (uploadImgData) {
            imageUrl = uploadImgData?.fullPath ?? null;
            console.log("Image uploaded successfully:", imageUrl);
          }
        } catch (imgError) {
          console.error("Error processing image:", imgError);
          // Continue with agent creation despite image error
        }
      }

      // 3. Update profile picture if uploaded
      if (imageUrl) {
        const { error: updateProfileError } = await supabase
          .from("user_profiles")
          .update({ profile_picture: imageUrl })
          .eq("user_id", createdProfile.user_id);

        if (updateProfileError) {
          console.error(
            "Failed to update profile with image URL:",
            updateProfileError
          );
        } else {
          createdProfile.profile_picture = (
            await getAgentProfilePicture(createdProfile.user_id)
          ).publicUrl;
          console.log("Profile picture URL updated in database");
        }
      }
      // 4. add to department
      if (profile.department) {
        try {
          addToDepartment(
            createdProfile.id,
            profile.department,
            (profile?.department_role as DepartmentRole) || DepartmentRole.STAFF
          );
        } catch (err) {
          console.error(err);
        }
      }

      // 5. Update local state
      const newAgents = [createdProfile, ...agents];
      _agents_session_cache = newAgents;
      setAgents(newAgents);

      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(newAgents)
      );

      return createdProfile;
    } catch (err) {
      console.error("Error in add agent function:", err);
      // Re-throw the error to be caught by the caller
      throw err;
    } finally {
      setIsAddAgentLoading(false);
    }
  };

  const addToDepartment = async (
    agentId: string,
    departmentId: string,
    role: DepartmentRole
  ): Promise<DepartmentAgentRelation> => {
    setIsAddAgentLoading(true);
    try {
      const { data: newRelation, error } = await supabase
        .from("agents_departments")
        .insert({
          agent_id: agentId,
          department_id: departmentId,
          role,
          added_by: profile?.user_id,
        })
        .select()
        .single();
      if (error || !newRelation) {
        throw { error, error_ar: "فشل إضافة الوكيل للفرع" };
      }
      const newAgents = agents.map((agent) => {
        if (agent.user_id === agentId) {
          return {
            ...agent,
            departments: [...(agent.departments || []), newRelation],
          };
        }
        return agent;
      });
      setAgents(newAgents);
      _agents_session_cache = newAgents;
      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(newAgents)
      );
      return newRelation;
    } catch (error) {
      throw { error, error_ar: "حدث خطأ أثناء تسجيل بيانات الفرع للوكيل" };
    } finally {
      setIsAddAgentLoading(false);
    }
  };

  const removeFromDepartment = async (
    agentId: string,
    departmentId: string
  ): Promise<void> => {
    if (!z.string().uuid().safeParse(agentId).success) {
      throw {
        error: new Error("Agent id is not a valid UUID"),
        error_ar: "خلل تقني: معرف الوكيل المعطى ليس UUID صالحًا",
      };
    }
    if (!z.string().uuid().safeParse(departmentId).success) {
      throw {
        error: new Error("Department id is not a valid UUID"),
        error_ar: "خلل تقني: معرف الفرع المعطى ليس UUID صالحًا",
      };
    }
    try {
      const { error } = await supabase
        .from("agents_departments")
        .delete()
        .eq("agent_id", agentId)
        .eq("department_id", departmentId);

      if (error) {
        throw {
          error: new Error(`Database deletion failed: ${error.message}`),
          error_ar: `فشل الحذف من قاعدة البيانات: ${error.message}`,
        };
      }
      const newAgents = agents.map((agent) => {
        if (agent.user_id === agentId) {
          const updatedDepartments =
            agent.departments?.filter(
              (dept) => dept.department_id !== departmentId
            ) || [];
          return {
            ...agent,
            departments: updatedDepartments,
          };
        }
        return agent;
      });

      setAgents(newAgents);
      _agents_session_cache = newAgents;
      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(newAgents)
      );
    } catch (err) {
      if (err instanceof Error) {
        throw {
          error: err,
          error_ar: "حدث خطأ غير متوقع أثناء محاولة إزالة الوكيل من الفرع",
        };
      }
      throw err;
    }
  };

  // Initial data load
  useEffect(() => {
    loadData()
      .then((data) => {
        setSearchResults(data); // set initial data
      })
      .catch((err) => console.error("Error loading agents: ", err));
  }, [isInternetReachable]);

  return {
    isLoading,
    isAddAgentLoading,
    error,
    arError,
    agents,
    searchResults,
    reload,
    add,
    search,
    addToDepartment,
    removeFromDepartment,
  };
}
