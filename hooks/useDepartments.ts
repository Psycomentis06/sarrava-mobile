import { useUserProfile } from "@/contexts/profile";
import { supabase } from "@/lib/supabase";
import { AgentDepartment } from "@/utils/models";
import { NewAgentDepartmentSchemaType } from "@/utils/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";

export type UseDepartmentsHookReturnType = {
  isLoading: boolean;
  error: Error | null;
  arError: string | null;
  departments: AgentDepartment[];
  searchResults: AgentDepartment[];
  reload: () => Promise<AgentDepartment[]>;
  add: (dep: NewAgentDepartmentSchemaType) => Promise<AgentDepartment>;
  search: (val: string) => Promise<AgentDepartment[]>;
};

const CACHE_VERSION = 0;
const OFFLINE_DEPARTMENTS_CACHE_KEY = `offline:departments:${CACHE_VERSION}:data`;
let _departments_session_cache: AgentDepartment[] = [];

export function useDepartments(): UseDepartmentsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<AgentDepartment[]>([]);
  const [searchResults, setSearchResults] = useState<AgentDepartment[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);
  const { profile } = useUserProfile();

  const getDepartmentsFromSupabase = async (): Promise<AgentDepartment[]> => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select()
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return [];
      }

      const departments = data as AgentDepartment[];

      _departments_session_cache = departments;
      await AsyncStorage.setItem(
        OFFLINE_DEPARTMENTS_CACHE_KEY,
        JSON.stringify(departments)
      );

      setDepartments(departments);
      return departments;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setArError("حدث خطأ أثناء تحميل البيانات");
      throw error;
    }
  };

  const getDepartmentsFromOfflineCache = async (): Promise<
    AgentDepartment[]
  > => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem(OFFLINE_DEPARTMENTS_CACHE_KEY);
      if (data) {
        const parsed: AgentDepartment[] = JSON.parse(data);
        setDepartments(parsed);
        _departments_session_cache = parsed;
        return parsed;
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

  const loadData = async (): Promise<AgentDepartment[]> => {
    setIsLoading(true);
    setError(null);
    setArError(null);

    try {
      let result: AgentDepartment[];
      if (_departments_session_cache.length > 0) {
        console.log("loading departments from session cache");
        setDepartments(_departments_session_cache);
        result = _departments_session_cache;
      } else if (isInternetReachable === false) {
        console.log("loading departments from offline cache");
        result = await getDepartmentsFromOfflineCache();
      } else if (isInternetReachable === true) {
        console.log("loading departments from database");
        result = await getDepartmentsFromSupabase();
      } else {
        result = [];
      }
      return result;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async (): Promise<AgentDepartment[]> => {
    _departments_session_cache = [];
    return loadData();
  };

  const search = useCallback(
    async (searchValue: string): Promise<AgentDepartment[]> => {
      try {
        const trimmedSearch = searchValue.trim().toLowerCase();
        if (!trimmedSearch) {
          setSearchResults(departments);
          return departments;
        }

        const filtered = departments.filter((dep) =>
          [
            dep.name,
            dep.country,
            dep.country_ar,
            dep.country_code,
            dep.city,
            dep.zipcode,
            dep.address,
          ].some((field) => field?.toLowerCase().includes(trimmedSearch))
        );

        setSearchResults(filtered);
        return filtered;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setArError("حدث خطأ أثناء البحث");
        throw error;
      }
    },
    [departments]
  );

  const add = async (
    dep: NewAgentDepartmentSchemaType
  ): Promise<AgentDepartment> => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: dep.name,
          country: dep.country.name,
          country_ar: dep.country.name_ar,
          country_code: dep.country.code,
          city: dep.city,
          zipcode: dep.zipcode,
          address: dep.address,
          updated_at: null,
          updated_by: profile?.firstname + " " + profile?.lastname,
        })
        .select()
        .single();
      if (error) {
        console.error("Department failed: ", error);
        throw { error: error, error_ar: "فشل إضافة فرع جديد" };
      }
      console.log("Department created: ", data);

      const newDep = data as AgentDepartment;
      const newDeps = [newDep, ...departments];
      _departments_session_cache = newDeps;
      setDepartments(newDeps);
      await AsyncStorage.setItem(
        OFFLINE_DEPARTMENTS_CACHE_KEY,
        JSON.stringify(newDeps)
      );
      return newDep;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setArError("حدث خطأ أثناء إضافة القسم");
      throw error;
    }
  };

  useEffect(() => {
    loadData()
      .then((data) => {
        setSearchResults(data);
      })
      .catch((err) => console.error("Error loading departments: ", err));
  }, [isInternetReachable]);

  return {
    isLoading,
    error,
    arError,
    departments,
    searchResults,
    reload,
    add,
    search,
  };
}
