import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const CACHE_VERSION = 0;

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { isInternetReachable } = useNetInfo();
  const isFetchingProfile = useRef(false);
  const hasSyncedOfflineUpdates = useRef(false);

  const getCacheKeys = (userId: string) => ({
    profile: `offline:user:${userId}:profile:${CACHE_VERSION}`,
    accessToken: `offline:user:${userId}:token:${CACHE_VERSION}`,
    updateQueue: `offline:user:${userId}:profile:updates:queue`,
  });

  const clearProfileCache = useCallback(async (userId: string) => {
    const keys = getCacheKeys(userId);
    await AsyncStorage.multiRemove([
      keys.profile,
      keys.accessToken,
      keys.updateQueue,
    ]);
  }, []);

  const fetchUserProfile = useCallback(
    async (userId: string, accessToken: string) => {
      const keys = getCacheKeys(userId);
      setIsProfileLoading(true);
      setError(null);

      try {
        if (isInternetReachable === false) {
          const cachedJson = await AsyncStorage.getItem(keys.profile);
          if (cachedJson) {
            setProfile(JSON.parse(cachedJson));
          }
          return;
        }

        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw new Error(error.message);
        if (data) {
          await AsyncStorage.multiSet([
            [keys.profile, JSON.stringify(data)],
            [keys.accessToken, accessToken],
          ]);
          setProfile(data);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Unknown error fetching profile")
        );
      } finally {
        setIsProfileLoading(false);
      }
    },
    [isInternetReachable]
  );

  const applyOfflineUpdateQueue = useCallback(
    async (userId: string) => {
      const keys = getCacheKeys(userId);
      if (isInternetReachable === false || hasSyncedOfflineUpdates.current)
        return;

      try {
        const queueJson = await AsyncStorage.getItem(keys.updateQueue);
        if (!queueJson) return;

        const updates: Partial<UserProfile>[] = JSON.parse(queueJson);
        for (const update of updates) {
          await supabase
            .from("user_profiles")
            .update(update)
            .eq("user_id", userId);
        }
        await AsyncStorage.removeItem(keys.updateQueue);
        hasSyncedOfflineUpdates.current = true;
      } catch (err) {
        console.warn("Failed to apply offline profile update queue:", err);
      }
    },
    [isInternetReachable]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const userId = session?.user?.id;
      if (!userId) return null;

      const keys = getCacheKeys(userId);

      try {
        if (isInternetReachable) {
          const { data, error } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw new Error(error.message);

          if (data) {
            setProfile((prev) => (prev ? { ...prev, ...data } : data));
            await AsyncStorage.setItem(keys.profile, JSON.stringify(data));
            return data;
          }
        } else if (isInternetReachable === false) {
          // Offline: update local state and queue the update
          const updatedProfile = { ...profile, ...updates } as UserProfile;
          setProfile(updatedProfile);
          await AsyncStorage.setItem(
            keys.profile,
            JSON.stringify(updatedProfile)
          );

          const existingQueueJson = await AsyncStorage.getItem(
            keys.updateQueue
          );
          const updateQueue: Partial<UserProfile>[] = existingQueueJson
            ? JSON.parse(existingQueueJson)
            : [];
          updateQueue.push(updates);
          await AsyncStorage.setItem(
            keys.updateQueue,
            JSON.stringify(updateQueue)
          );
          return updatedProfile;
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Unknown error updating profile")
        );
      }

      return null;
    },
    [session, profile, isInternetReachable]
  );

  const clearProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) await clearProfileCache(userId);
    setProfile(null);
    setError(null);
  }, [session, clearProfileCache]);

  useEffect(() => {
    const userId = session?.user?.id;
    const accessToken = session?.access_token;

    if (!isSessionLoading && userId && accessToken) {
      fetchUserProfile(userId, accessToken);
    } else if (!userId) {
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [session, isSessionLoading, fetchUserProfile]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      applyOfflineUpdateQueue(userId);
    }
  }, [session?.user?.id, isInternetReachable]);

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
