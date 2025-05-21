import { supabase } from "@/lib/supabase";
import { DepartmentTransactionsAnalytics } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";

const CACHE_VERSION = 0;
const OFFLINE_CACHE_KEY = `offline:analytics:departments:${CACHE_VERSION}:data`;
export function useDepartmentAnalytics() {
  const [analytics, setAnalytics] = useState<DepartmentTransactionsAnalytics[]>(
    []
  );
  const { isInternetReachable } = useNetInfo();
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isInternetReachable) {
        const { data, error } = await supabase
          .from("transactions_department_stats_view")
          .select();
        if (error) {
          console.error("error fetching analytics", error);
          throw { error, error_ar: "فشل تحميل أحصائيات الفروع" };
        } else if (data) {
          setAnalytics(data);
          await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(data));
        }
      } else {
        const cached = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
        if (cached) {
          setAnalytics(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error("Failed to fetch or load cached analytics");
    } finally {
      setIsLoading(false);
    }
  }, [isInternetReachable]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    isLoading,
    refetch: fetchAnalytics,
  };
}
