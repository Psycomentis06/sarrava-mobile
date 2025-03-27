import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseSupabaseSession } from "./useSupabaseSession";

export function useSupabaseUserProfile(): { 
  isLoading: boolean; 
  profile: UserProfile | null; 
  error: Error | null 
} {
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const lastAccessTokenRef = useRef<string | null>(null);

  const clearProfileCache = useCallback(async (userId: string) => {
    const CACHE_KEY_PROFILE = `user:${userId}:profile`;
    const CACHE_KEY_PROFILE_TS = `${CACHE_KEY_PROFILE}:timestamp`;
    const CACHE_KEY_ACCESS_TOKEN = `user:${userId}:access_token`;

    await AsyncStorage.multiRemove([
      CACHE_KEY_PROFILE, 
      CACHE_KEY_PROFILE_TS, 
      CACHE_KEY_ACCESS_TOKEN
    ]);
  }, []);

  const getUserProfile = useCallback(
    async (userId: string, access_token: string) => {
      setIsProfileLoading(true);
      setError(null);

      const CACHE_KEY_PROFILE = `user:${userId}:profile`;
      const CACHE_KEY_ACCESS_TOKEN = `user:${userId}:access_token`;

      try {
        let cachedProfileJson = await AsyncStorage.getItem(CACHE_KEY_PROFILE);
        const cachedAccessToken = await AsyncStorage.getItem(
          CACHE_KEY_ACCESS_TOKEN
        );

        // Clear cache if access token has changed
        if (cachedAccessToken !== access_token) {
          await clearProfileCache(userId);
          cachedProfileJson = null;
        }

        // Use cached profile if available
        if (cachedProfileJson) {
          const cachedProfile = JSON.parse(cachedProfileJson) as UserProfile;
          setProfile(cachedProfile);
          setIsProfileLoading(false);
          return;
        }

        // Fetch profile from Supabase
        const { data, error } = await supabase
          .from("user_profiles")
          .select()
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching user profile: ", error);
          setError(new Error(error.message));
          setProfile(null);
          setIsProfileLoading(false);
          return;
        }

        if (data) {
          // Cache the profile and access token
          await AsyncStorage.multiSet([
            [CACHE_KEY_PROFILE, JSON.stringify(data)],
            [CACHE_KEY_ACCESS_TOKEN, access_token],
          ]);

          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (catchError) {
        console.error("Error in getUserProfile: ", catchError);
        setError(catchError instanceof Error ? catchError : new Error('Unknown error'));
        setProfile(null);
      } finally {
        setIsProfileLoading(false);
      }
    },
    [clearProfileCache]
  );

  useEffect(() => {
    console.log("useSupabaseUserProfile render");

    if (!isSessionLoading) {
      if (session?.user.id) {
        if (lastAccessTokenRef.current !== session.access_token) {
          getUserProfile(session.user.id, session.access_token);
          lastAccessTokenRef.current = session.access_token;
        }
      } else {
        if (session && session.user) {
          clearProfileCache(session.user.id);
        }
        setProfile(null);
        setIsProfileLoading(false);
        lastAccessTokenRef.current = null;
      }
    }
  }, [session, isSessionLoading, getUserProfile, clearProfileCache]);

  return { 
    isLoading: isProfileLoading, 
    profile, 
    error 
  };
}