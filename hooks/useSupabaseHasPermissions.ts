import { supabase } from "@/lib/supabase";
import { UserRolesView } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseSupabaseSession } from "./useSupabaseSession";

const CACHE_VERSION = 0;

export function useSupabaseHasPermissions(permissions: string[]): {
  isLoading: boolean;
  hasPermission: boolean;
} {
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const { isInternetReachable } = useNetInfo();

  const lastAccessTokenRef = useRef<string | null>(null);

  const checkPermissions = useCallback(
    (userRoles: UserRolesView[]) => {
      const hasRequiredPermission = userRoles
        .flatMap((u) => u.roles)
        .some((role) => permissions.includes(role));
      setHasPermission(hasRequiredPermission);
    },
    [permissions]
  );

  const clearAllRoleCaches = useCallback(async (userId: string) => {
    const keys = [
      `user:${userId}:roles`,
      `user:${userId}:access_token`,
      `offline:permissions:${CACHE_VERSION}:user:${userId}:data`,
    ];
    await AsyncStorage.multiRemove(keys);
  }, []);

  const getUserRoles = useCallback(
    async (userId: string, access_token: string, isOffline: boolean) => {
      setIsRolesLoading(true);

      const ONLINE_CACHE_KEY_ROLES = `user:${userId}:roles`;
      const ONLINE_CACHE_KEY_ACCESS_TOKEN = `user:${userId}:access_token`;
      const OFFLINE_CACHE_KEY = `offline:permissions:${CACHE_VERSION}:user:${userId}:data`;

      try {
        if (isOffline) {
          // Offline: use offline cache only
          const cachedOffline = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
          if (cachedOffline) {
            const parsed = JSON.parse(cachedOffline) as UserRolesView[];
            checkPermissions(parsed);
          } else {
            console.warn("No offline permission cache found.");
            setHasPermission(false);
          }
          return;
        }

        // Online: validate access token and use/fetch roles
        const cachedAccessToken = await AsyncStorage.getItem(
          ONLINE_CACHE_KEY_ACCESS_TOKEN
        );
        let cachedRolesJson = await AsyncStorage.getItem(
          ONLINE_CACHE_KEY_ROLES
        );

        if (cachedAccessToken !== access_token) {
          // Invalidate online role cache if token changed
          await AsyncStorage.multiRemove([
            ONLINE_CACHE_KEY_ROLES,
            ONLINE_CACHE_KEY_ACCESS_TOKEN,
          ]);
          cachedRolesJson = null;
        }

        if (cachedRolesJson) {
          const cachedRoles = JSON.parse(cachedRolesJson) as UserRolesView[];
          checkPermissions(cachedRoles);
          return;
        }

        // Fetch from Supabase
        const { data, error } = await supabase
          .from("user_roles_view")
          .select()
          .eq("user_id", userId);

        if (error || !data) {
          console.error("Failed to fetch roles from Supabase:", error);
          setHasPermission(false);
          return;
        }

        // Update online and offline caches
        await AsyncStorage.multiSet([
          [ONLINE_CACHE_KEY_ROLES, JSON.stringify(data)],
          [ONLINE_CACHE_KEY_ACCESS_TOKEN, access_token],
          [OFFLINE_CACHE_KEY, JSON.stringify(data)],
        ]);

        checkPermissions(data);
      } catch (error) {
        console.error("Unexpected error in getUserRoles:", error);
        setHasPermission(false);
      } finally {
        setIsRolesLoading(false);
      }
    },
    [checkPermissions]
  );

  useEffect(() => {
    if (isSessionLoading) return;

    console.log("permissions hook render")

    const userId = session?.user?.id;
    const token = session?.access_token;

    if (!userId || !token) {
      if (userId) {
        clearAllRoleCaches(userId);
      }
      setHasPermission(false);
      setIsRolesLoading(false);
      lastAccessTokenRef.current = null;
      return;
    }

    const tokenChanged = lastAccessTokenRef.current !== token;
    const isOffline = isInternetReachable === false;

    if (tokenChanged || isOffline) {
      getUserRoles(userId, token, isOffline);
      lastAccessTokenRef.current = token;
    }
  }, [
    isSessionLoading,
    session?.user?.id,
    session?.access_token,
    isInternetReachable,
  ]);

  return { isLoading: isRolesLoading, hasPermission };
}
