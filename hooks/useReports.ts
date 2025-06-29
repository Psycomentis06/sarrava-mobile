import { supabase } from "@/lib/supabase";
import { Report } from "@/utils/models";
import { NewReportType } from "@/utils/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { useSupabaseHasPermissions } from "./useSupabaseHasPermissions";
import { useSupabaseUserProfile } from "./useSupabaseUserProfile";

const CACHE_VERSION = 0;
const OFFLINE_REPORTS_CACHE_KEY = `offline:reports:${CACHE_VERSION}:data`;

let _reports_session_cache: Report[] = [];

export type UseReportsHookReturnType = {
  reports: Report[];
  isLoading: boolean;
  error: Error | null;
  arError: string | null;
  reload: () => Promise<Report[]>;
  createReport: (data: NewReportType) => Promise<Report>;
  search: (
    searchTerm: string,
    page: number,
    pageSize: number
  ) => Promise<Report[]>;
  isSearchLoading: boolean;
  hasMoreSearchResults: boolean;
};

export function useReports(): UseReportsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [reports, setReports] = useState<Report[]>([]);
  const { profile, isLoading: isUserProfileLoading } = useSupabaseUserProfile();
  const { hasPermission: isAdmin, isLoading: isPermissionLoading } =
    useSupabaseHasPermissions(["admin"]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);

  const getReportsFromSupabase = async (): Promise<Report[]> => {
    if (isPermissionLoading || isUserProfileLoading) return [];
    try {
      const query = supabase.from("reports").select("*");

      if (!isAdmin && profile?.departments) {
        query
          .in("department_id", profile.departments)
          .neq("department_id", null);
      }

      const { data, error } = await query.order("from_date", {
        ascending: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      _reports_session_cache = data;
      setReports(data);
      await AsyncStorage.setItem(
        OFFLINE_REPORTS_CACHE_KEY,
        JSON.stringify(data)
      );

      return data;
    } catch (err) {
      console.error(err);
      setError(err as Error);
      setArError("حدث خطأ أثناء تحميل التقارير");
      throw err;
    }
  };

  const getReportsFromCache = async (): Promise<Report[]> => {
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_REPORTS_CACHE_KEY);
      if (!cached) throw new Error("لا توجد بيانات محفوظة للتقارير");
      const parsed: Report[] = JSON.parse(cached);
      _reports_session_cache = parsed;
      setReports(parsed);
      return parsed;
    } catch (err) {
      console.error(err);
      setError(err as Error);
      setArError("حدث خطأ أثناء تحميل البيانات من التخزين المؤقت");
      throw err;
    }
  };

  const loadReports = async (): Promise<Report[]> => {
    setIsLoading(true);
    setError(null);
    setArError(null);
    try {
      if (_reports_session_cache.length > 0) {
        setReports(_reports_session_cache);
        return _reports_session_cache;
      } else if (isInternetReachable) {
        return await getReportsFromSupabase();
      } else {
        return await getReportsFromCache();
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async (): Promise<Report[]> => {
    _reports_session_cache = [];
    return loadReports();
  };

  const createReport = async (data: NewReportType): Promise<Report> => {
    if (!isInternetReachable) {
      const offlineErr = new Error("لا يمكن إنشاء تقرير في وضع عدم الاتصال");
      throw {
        error: offlineErr,
        error_ar: offlineErr.message,
      };
    }

    if (!profile) {
      throw {
        error: new Error("profile is missing"),
        error_ar: "فشل الحصول على معطيات الوكيل",
      };
    }

    try {
      const { data: reportId, error } = await supabase.rpc(
        "generate_agent_report",
        {
          p_agent_id: profile.id,
          p_title: data.title,
          p_description: data.description || "",
          p_from_date: data.fromDate.toISOString().split("T")[0],
          p_to_date: data.toDate.toISOString().split("T")[0],
        }
      );

      if (error || !data) {
        throw new Error(error?.message || "فشل إنشاء التقرير");
      }

      const { data: newReportDt, error: newReportErr } = await supabase
        .from("agent_reports")
        .select()
        .eq("id", reportId)
        .single();

      if (newReportErr) {
        throw {
          error: newReportErr,
          error_ar:
            "تمّ إنشاء التقرير بنجاح لاكن فشلة محاولة تحميل البيانات المتعلّقة بالتقرير. الرّجاء عمل تحديث للبيانات (Refresh)",
        };
      }

      const newReport = newReportDt as Report;

      const updated = [newReport, ...reports];
      setReports(updated);
      _reports_session_cache = updated;
      await AsyncStorage.setItem(
        OFFLINE_REPORTS_CACHE_KEY,
        JSON.stringify(updated)
      );
      return newReport;
    } catch (err: any) {
      console.error(err);
      throw {
        error: err,
        arError: "حدث خطأ أثناء إنشاء التقرير",
      };
    }
  };

  const search = async (
    searchTerm: string,
    page: number,
    pageSize: number
  ): Promise<Report[]> => {
    setIsSearchLoading(true);
    setError(null);
    setArError(null);
    try {
      const offset = page * pageSize;
      let results: Report[] = [];

      if (isInternetReachable) {
        // Online search via Supabase
        let query = supabase.from("reports").select("*");

        if (!isAdmin && profile?.departments) {
          query
            .in("department_id", profile.departments)
            .neq("department_id", null);
        }

        if (searchTerm) {
          query = query.or(
            `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const {
          data,
          error: searchError,
          count,
        } = await query
          .order("from_date", { ascending: false })
          .range(offset, offset + pageSize - 1)
          .limit(pageSize); // Add limit for explicit pagination

        if (searchError) {
          throw new Error(searchError.message);
        }
        results = data || [];
        setHasMoreSearchResults(
          count !== null ? offset + pageSize < count : false
        ); // Check if more results exist
      } else {
        // Offline search from cache
        const cached = await AsyncStorage.getItem(OFFLINE_REPORTS_CACHE_KEY);
        if (cached) {
          const allCachedReports: Report[] = JSON.parse(cached);
          const filteredReports = allCachedReports.filter(
            (report) =>
              report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (report.description &&
                report.description
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()))
          );
          // Apply pagination to offline results
          results = filteredReports.slice(offset, offset + pageSize);
          setHasMoreSearchResults(offset + pageSize < filteredReports.length);
        } else {
          setHasMoreSearchResults(false);
        }
      }
      setReports(results);
      return results;
    } catch (err) {
      console.error(err);
      setError(err as Error);
      setArError("حدث خطأ أثناء البحث عن التقارير");
      throw err;
    } finally {
      setIsSearchLoading(false);
    }
  };

  useEffect(() => {
    console.log("loading reports");
    if (profile) {
      loadReports().catch((err) =>
        console.error("Error loading reports:", err)
      );
    }
  }, [profile, isInternetReachable, isPermissionLoading, isUserProfileLoading]);

  return {
    reports,
    isLoading,
    error,
    arError,
    reload,
    createReport,
    search,
    hasMoreSearchResults,
    isSearchLoading,
  };
}
