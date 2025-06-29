import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase";
import { AgentTransactionsAnalytics } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseHasPermissions } from "./useSupabaseHasPermissions";

const CACHE_VERSION = 0;

export function useAgentAnalytics() {
  const [isSessionLoading, session] = UseSupabaseSession();
  const { isInternetReachable } = useNetInfo();
  const { hasPermission: isAdmin, isLoading: isPermissionLoading } =
    useSupabaseHasPermissions(["admin"]);
  const [analytics, setAnalytics] = useState<AgentTransactionsAnalytics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getCacheKey = (userId: string) =>
    `offline:analytics:${CACHE_VERSION}:user:${userId}:data`;

  const fetchAnalytics = useCallback(async () => {
    if (!session?.user.id) return;
    if (isPermissionLoading) return;
    const cacheKey = getCacheKey(session.user.id);

    setIsLoading(true);

    try {
      if (isInternetReachable) {
        let data: any;
        let error: any;

        if (isAdmin) {
          const { data: d, error: e } = await supabase.rpc(
            "get_global_transactions_stats"
          )
          .single();
          data = d;
          error = e;
        } else {
          const { data: d, error: e } = await supabase
            .from("transactions_agent_stats_view")
            .select()
            .eq("agent_id", session.user.id)
            .single();
          data = d;
          error = e;
        }

        if (error) {
          console.error("Error fetching analytics:", error);
        } else if (data) {
          setAnalytics(data);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } else {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          setAnalytics(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error("Failed to fetch or load cached analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id, isInternetReachable, isPermissionLoading]);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchAnalytics();
    }
  }, [isSessionLoading, session?.user.id, fetchAnalytics, isPermissionLoading]);

  return {
    analytics,
    isLoading,
    refetch: fetchAnalytics,
  };
}
