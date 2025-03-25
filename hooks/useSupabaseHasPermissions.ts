import { supabase } from "@/lib/supabase";
import { UserRolesView } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseSupabaseSession } from "./useSupabaseSession";

export function useSupabaseHasPermissions(permissions: string[]): {isLoading: boolean, hasPermission: boolean} {
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isRolesLoading, setIsRolesLoading] = useState<boolean>(true);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

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

  const clearRolesCache = useCallback(async (userId: string) => {
    const CACHE_KEY_ROLES = `user:${userId}:roles`;
    const CACHE_KEY_ROLES_TS = `${CACHE_KEY_ROLES}:timestamp`;

    await AsyncStorage.multiRemove([CACHE_KEY_ROLES, CACHE_KEY_ROLES_TS]);
  }, []);

  const getUserRoles = useCallback(
    async (userId: string, access_token: string) => {
      setIsRolesLoading(true);
      const CACHE_KEY_ROLES = `user:${userId}:roles`;
      const CACHE_KEY_ACCESS_TOKEN = `user:${userId}:access_token`;

      try {
        let cachedRolesJson = await AsyncStorage.getItem(CACHE_KEY_ROLES);
        const cachedAccessToken = await AsyncStorage.getItem(
          CACHE_KEY_ACCESS_TOKEN
        );
        if (cachedAccessToken != access_token) {
          await clearRolesCache(userId);
          cachedRolesJson = null;
        }
        if (cachedRolesJson) {
          const cachedRoles = JSON.parse(cachedRolesJson) as UserRolesView[];
          checkPermissions(cachedRoles);
          setIsRolesLoading(false);
          return;
        }
        // fetch roles from supabase
        const { data, error } = await supabase
          .from("user_roles_view")
          .select()
          .eq("user_id", userId);
        if (error) {
          console.error("Error fetching user roles: ", error);
          setHasPermission(false);
          setIsRolesLoading(false);
          return;
        }
        if (data && data.length > 0) {
          await AsyncStorage.multiSet([
            [CACHE_KEY_ROLES, JSON.stringify(data)],
            [CACHE_KEY_ACCESS_TOKEN, access_token],
          ]);
          console.log(data)
          checkPermissions(data);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error("Error in getUserRoles: ", error);
        setHasPermission(false);
      } finally {
        setIsRolesLoading(false);
      }
    },
    [checkPermissions, clearRolesCache]
  );

  useEffect(() => {
    console.log("useSupabaseHasPermissions render");
    
    if (!isSessionLoading) {
      if (session?.user.id) {
        if (lastAccessTokenRef.current !== session.access_token) {
          getUserRoles(session.user.id, session.access_token);
          lastAccessTokenRef.current = session.access_token;
        }
      } else {
        if (session && session.user) {
          clearRolesCache(session.user.id);
        }
        setHasPermission(false);
        setIsRolesLoading(false);
        lastAccessTokenRef.current = null;
      }
    }
  }, [session, isSessionLoading, getUserRoles, clearRolesCache]);

  return {isLoading: isRolesLoading, hasPermission};
}
