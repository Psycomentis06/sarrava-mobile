import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";

export type UseAgentsHookReturnType = {
  isLoading: boolean;
  error: Error | null;
  arError: string | null;
  agents: UserProfile[];
  searchResults: UserProfile[];
  reload: () => Promise<UserProfile[]>;
  add: (profile: UserProfile) => Promise<UserProfile>;
  search: (val: string) => Promise<UserProfile[]>;
};

const CACHE_VERSION = 0;
const OFFLINE_AGENTS_CACHE_KEY = `offline:agents:${CACHE_VERSION}:data`;
let _agents_session_cache: UserProfile[] = [];

export function useAgents(): UseAgentsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);

  const getAgentProfilePicture = async (agentId: string) => {
    const { data: imgUrl } = await supabase.storage
      .from("user-profiles")
      .getPublicUrl(agentId);
    return imgUrl;
  };

  const getAgentsFromSupabase = async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase.from("user_profiles").select();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        return [];
      }

      const userProfiles = data as UserProfile[];

      // Map profile images
      const agentsWithUrls = await Promise.all(
        userProfiles.map(async (profile) => ({
          ...profile,
          profile_picture: (
            await getAgentProfilePicture(profile.user_id)
          ).publicUrl,
        }))
      );

      // Cache the data
      _agents_session_cache = agentsWithUrls;
      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(agentsWithUrls)
      );

      setAgents(agentsWithUrls);
      return agentsWithUrls;
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
    async (searchValue: string): Promise<UserProfile[]> => {
      try {
        if (!searchValue.trim()) {
          setSearchResults(agents);
          return agents;
        }

        // For offline search, filter locally
        if (isInternetReachable === false) {
          const trimmedSearch = searchValue.trim().toLowerCase();
          const filteredAgents = agents.filter((agent) => {
            return (
              agent.firstname?.toLowerCase().includes(trimmedSearch) ||
              agent.lastname?.toLowerCase().includes(trimmedSearch) ||
              agent.email?.toLowerCase().includes(trimmedSearch) ||
              agent.address?.toLowerCase().includes(trimmedSearch) ||
              agent.phone?.toLowerCase().includes(trimmedSearch)
            );
          });
          setSearchResults(filteredAgents);
          return filteredAgents;
        }
        // For online search, query Supabase directly
        else {
          const query = supabase.from("user_profiles").select();
          query.or(
            `firstname.ilike.%${searchValue}%,` +
              `lastname.ilike.%${searchValue}%,` +
              `email.ilike.%${searchValue}%,` +
              `address.ilike.%${searchValue}%,` +
              `phone.ilike.%${searchValue}%`
          );

          const { data, error } = await query;

          if (error) {
            throw new Error(error.message);
          }

          const userProfiles = data as UserProfile[];

          // Map profile images
          const searchResultsWithUrls = await Promise.all(
            userProfiles.map(async (profile) => ({
              ...profile,
              profile_picture: (
                await getAgentProfilePicture(profile.user_id)
              ).publicUrl,
            }))
          );

          setSearchResults(searchResultsWithUrls);
          return searchResultsWithUrls;
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setArError("حدث خطأ أثناء البحث");
        throw error;
      }
    },
    [agents, isInternetReachable]
  );

  const add = async (profile: UserProfile): Promise<UserProfile> => {
    try {
      // TODO: use supabase edge function instead of this. this is not a working function
      const newAgents = [...agents, profile];
      _agents_session_cache = newAgents;
      setAgents(newAgents);
      await AsyncStorage.setItem(
        OFFLINE_AGENTS_CACHE_KEY,
        JSON.stringify(newAgents)
      );
      return profile;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setArError("حدث خطأ أثناء إضافة الوكيل");
      throw error;
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
    error,
    arError,
    agents,
    searchResults,
    reload,
    add,
    search,
  };
}
