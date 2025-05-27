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
  // Ref to prevent multiple concurrent profile fetches
  const isFetchingProfile = useRef(false);
  // State to indicate if an offline sync operation is in progress
  const [isSyncing, setIsSyncing] = useState(false);
  // Ref to track if offline updates have been synced in the current session
  const hasSyncedOfflineUpdates = useRef(false);

  /**
   * Generates cache keys for user-specific data.
   * @param userId The ID of the user.
   * @returns An object containing cache keys for profile, access token, and update queue.
   */
  const getCacheKeys = (userId: string) => ({
    profile: `offline:user:${userId}:profile:${CACHE_VERSION}`,
    accessToken: `offline:user:${userId}:token:${CACHE_VERSION}`,
    updateQueue: `offline:user:${userId}:profile:updates:queue`,
  });

  /**
   * Clears all cached profile data for a given user.
   * @param userId The ID of the user whose cache should be cleared.
   */
  const clearProfileCache = useCallback(async (userId: string) => {
    const keys = getCacheKeys(userId);
    await AsyncStorage.multiRemove([
      keys.profile,
      keys.accessToken,
      keys.updateQueue,
    ]);
  }, []);

  /**
   * Fetches the user profile from Supabase or cache, respecting network status.
   * @param userId The ID of the user to fetch.
   * @param accessToken The access token for Supabase authentication.
   */
  const fetchUserProfile = useCallback(
    async (userId: string, accessToken: string) => {
      // Prevent concurrent fetches or fetching while a sync operation is in progress
      if (isFetchingProfile.current || isSyncing) {
        return;
      }

      isFetchingProfile.current = true;
      setIsProfileLoading(true);
      setError(null);

      const keys = getCacheKeys(userId);

      try {
        if (isInternetReachable === false) {
          // If offline, try to load from cache
          const cachedJson = await AsyncStorage.getItem(keys.profile);
          if (cachedJson) {
            setProfile(JSON.parse(cachedJson));
          }
          return;
        }

        // If online, fetch from Supabase
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw new Error(error.message);
        if (data) {
          // Cache the fetched data
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
        isFetchingProfile.current = false; // Reset ref after fetch completes
      }
    },
    [isInternetReachable, isSyncing] // Add isSyncing as a dependency
  );

  /**
   * Applies any queued offline profile updates to Supabase when online.
   * Prevents further fetching until sync is complete.
   * @param userId The ID of the user for whom to apply updates.
   */
  const applyOfflineUpdateQueue = useCallback(
    async (userId: string) => {
      // Only proceed if online and not already synced in this session
      if (isInternetReachable === false || hasSyncedOfflineUpdates.current) {
        return;
      }

      setIsSyncing(true); // Set sync lock
      const keys = getCacheKeys(userId);

      try {
        const queueJson = await AsyncStorage.getItem(keys.updateQueue);
        if (!queueJson) return; // No updates in queue

        const updates: Partial<UserProfile>[] = JSON.parse(queueJson);
        for (const update of updates) {
          // Apply each update to Supabase
          await supabase
            .from("user_profiles")
            .update(update)
            .eq("user_id", userId);
        }
        // Clear the queue after successful sync
        await AsyncStorage.removeItem(keys.updateQueue);
        hasSyncedOfflineUpdates.current = true; // Mark as synced for this session
      } catch (err) {
        console.warn("Failed to apply offline profile update queue:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Unknown error applying offline updates")
        );
      } finally {
        setIsSyncing(false); // Release sync lock
      }
    },
    [isInternetReachable]
  );

  /**
   * Updates the user profile, either online (to Supabase) or offline (to cache and queue).
   * @param updates The partial UserProfile object with changes.
   * @returns The updated UserProfile or null if an error occurred.
   */
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const userId = session?.user?.id;
      if (!userId) {
        console.warn("Attempted to update profile without a user ID.");
        return null;
      }

      const keys = getCacheKeys(userId);
      setError(null); // Clear previous errors

      try {
        if (isInternetReachable) {
          // Online: directly update Supabase
          const { data, error } = await supabase
            .from("user_profiles")
            .update(updates)
            .eq("user_id", userId)
            .select()
            .single();

          if (error) throw new Error(error.message);

          if (data) {
            // Update local state and cache
            setProfile((prev) => (prev ? { ...prev, ...data } : data));
            await AsyncStorage.setItem(keys.profile, JSON.stringify(data));
            return data;
          }
        } else if (isInternetReachable === false) {
          // Offline: update local state and queue the update for later sync
          const updatedProfile = { ...profile, ...updates } as UserProfile;
          setProfile(updatedProfile); // Optimistic update of local state
          await AsyncStorage.setItem(
            keys.profile,
            JSON.stringify(updatedProfile)
          );

          // Add update to the queue
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

  /**
   * Clears the user profile from state and cache.
   */
  const clearProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (userId) await clearProfileCache(userId);
    setProfile(null);
    setError(null);
  }, [session, clearProfileCache]);

  // Effect to trigger fetching the user profile when session changes or sync completes
  useEffect(() => {
    const userId = session?.user?.id;
    const accessToken = session?.access_token;

    // Only proceed if session is loaded, user exists, and no sync is in progress
    if (!isSessionLoading && userId && accessToken && !isSyncing) {
      // Ensure we don't trigger fetch if one is already in progress
      if (!isFetchingProfile.current) {
        fetchUserProfile(userId, accessToken);
      }
    } else if (!userId && !isSessionLoading) {
      // Clear profile if no user and session is no longer loading
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [session, isSessionLoading, fetchUserProfile, isSyncing]); // isSyncing is a crucial dependency here

  // Effect to apply offline updates when online status changes or user logs in
  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      applyOfflineUpdateQueue(userId);
    }
  }, [session?.user?.id, isInternetReachable, applyOfflineUpdateQueue]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      profile,
      // isLoading is true if profile is loading or if a sync operation is in progress
      isLoading: isProfileLoading || isSyncing,
      error,
      updateProfile,
      clearProfile,
    }),
    [profile, isProfileLoading, isSyncing, error, updateProfile, clearProfile]
  );

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
};

/**
 * Custom hook to consume the UserProfileContext.
 * Throws an error if used outside of a UserProfileProvider.
 */
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};
