import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase";
import { AgentTransactionsAnalytics } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";

const CACHE_VERSION = 0;

export function useAgentAnalytics() {
  const [isSessionLoading, session] = UseSupabaseSession();
  const { isInternetReachable } = useNetInfo();
  const [analytics, setAnalytics] = useState<AgentTransactionsAnalytics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getCacheKey = (userId: string) =>
    `offline:analytics:${CACHE_VERSION}:user:${userId}:data`;

  const fetchAnalytics = useCallback(async () => {
    if (!session?.user.id) return;
    const cacheKey = getCacheKey(session.user.id);

    setIsLoading(true);

    try {
      if (isInternetReachable) {
        const { data, error } = await supabase
          .from("transactions_agent_stats_view")
          .select()
          .eq("agent_id", session.user.id)
          .single();

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
  }, [session?.user.id, isInternetReachable]);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchAnalytics();
    }
  }, [isSessionLoading, session?.user.id, fetchAnalytics]);

  return {
    analytics,
    isLoading,
    refetch: fetchAnalytics,
  };
}