import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Define the context shape
type UserProfileContextType = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  clearProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingProfile = useRef(false);

  const clearProfileCache = useCallback(async (userId: string) => {
    await AsyncStorage.multiRemove([
      `user:${userId}:profile`,
      `user:${userId}:access_token`,
    ]);
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: string, accessToken: string) => {
      if (!userId || isFetchingProfile.current) return;
      isFetchingProfile.current = true;
      setIsProfileLoading(true);
      setError(null);

      try {
        const [cachedProfileJson, cachedAccessToken] =
          await AsyncStorage.multiGet([
            `user:${userId}:profile`,
            `user:${userId}:access_token`,
          ]);

        if (cachedAccessToken[1] !== accessToken) {
          await clearProfileCache(userId);
        }

        if (cachedProfileJson[1]) {
          setProfile(JSON.parse(cachedProfileJson[1]));
          return;
        }

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw new Error(error.message);
        if (data) {
          console.log("Profile loaded at " + new Date())
          await AsyncStorage.multiSet([
            [`user:${userId}:profile`, JSON.stringify(data)],
            [`user:${userId}:access_token`, accessToken],
          ]);
          setProfile(data);
        }
      } catch (catchError) {
        setError(
          catchError instanceof Error
            ? catchError
            : new Error("Unknown error fetching profile")
        );
      } finally {
        setIsProfileLoading(false);
        isFetchingProfile.current = false;
      }
    },
    [clearProfileCache]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!session?.user.id) return null;
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .update(updates)
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (error) throw new Error(error.message);
        if (data) {
          setProfile((prev) => (prev ? { ...prev, ...data } : data));
          await AsyncStorage.setItem(
            `user:${session.user.id}:profile`,
            JSON.stringify(data)
          );
          return data;
        }
      } catch (catchError) {
        setError(
          catchError instanceof Error
            ? catchError
            : new Error("Unknown error updating profile")
        );
      }
      return null;
    },
    [session]
  );

  const clearProfile = useCallback(async () => {
    if (session?.user.id) {
      await clearProfileCache(session.user.id);
    }
    setProfile(null);
    setError(null);
  }, [session, clearProfileCache]);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchUserProfile(session.user.id, session.access_token);
    } else if (!session?.user.id) {
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [session, isSessionLoading, fetchUserProfile]);

  const contextValue = useMemo(
    () => ({
      profile,
      isLoading: isProfileLoading,
      error,
      updateProfile,
      clearProfile,
    }),
    [profile, isProfileLoading, error, updateProfile, clearProfile]
  );

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
