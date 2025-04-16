import { supabase } from "@/lib/supabase";
import { Currency, UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export type UseCurrenciesHookReturnType = {
  // data loading state
  isLoading: boolean;
  // function to refresh data from database if available
  reload: () => Promise<Currency[]>;
  // list of currencies
  currencies: Currency[];
  // update currency rate for a given currency object
  updateRate: (
    currency: Currency,
    user: UserProfile,
    rate: number
  ) => Promise<Currency>;
  // error object if any error occurred during fetching
  error: Error | null;
  // error message in arabic during fetching
  arError: string | null;
};

let _currencies_session_cache: Currency[] = [];

const CACHE_VERSION = 0;
const OFFLINE_CURRENCIES_CACHE_KEY = `offline:currencies:${CACHE_VERSION}:data`;

/**
 * Hook for retrieving a full list of currencies available on the system.
 * This hook supports offline mode
 * @returns UseCurrenciesHookReturnType
 */
export function useCurrencies(): UseCurrenciesHookReturnType {
  const { isConnected } = useNetInfo();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);

  const getCurrenciesFromSupabase = async (): Promise<Currency[]> => {
    try {
      const { data, error: supErr } = await supabase
        .from("currencies")
        .select()
        .order("country_code", { ascending: true });

      if (supErr != null) {
        console.error(supErr);
        const fetchError = new Error(supErr.message);
        setError(fetchError);
        setArError("حدث خطأ أثناء جلب بيانات العملات");
        throw fetchError;
      }

      console.log(
        `${data.length} currency item fetched at ${new Date().toLocaleString()}`
      );

      setCurrencies(data);
      _currencies_session_cache = data;
      await AsyncStorage.setItem(
        OFFLINE_CURRENCIES_CACHE_KEY,
        JSON.stringify(data)
      );

      return data;
    } catch (err) {
      console.error(err);
      const errorObj = err as Error;
      setError(errorObj);
      setArError("حدث خطأ تقني أثناء جلب بيانات العملات");
      throw errorObj;
    }
  };

  const getCurrenciesFromOfflineCache = async (): Promise<Currency[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_CURRENCIES_CACHE_KEY);
      if (data) {
        const parsedCurrencies: Currency[] = JSON.parse(data);
        setCurrencies(parsedCurrencies);
        _currencies_session_cache = parsedCurrencies;
        return parsedCurrencies;
      } else {
        const offlineError = new Error("No offline data available");
        setError(offlineError);
        setArError("لا توجد بيانات متاحة في وضع عدم الاتصال");
        throw offlineError;
      }
    } catch (error) {
      console.error(error);
      const errorObj = error as Error;
      setError(errorObj);
      setArError("حدث خطأ أثناء قراءة البيانات المخزنة محلياً");
      throw errorObj;
    }
  };

  const loadData = async (): Promise<Currency[]> => {
    setIsLoading(true);
    setError(null);
    setArError(null);

    console.log("load data");

    try {
      let result: Currency[];

      if (_currencies_session_cache.length > 0) {
        setCurrencies(_currencies_session_cache);
        result = _currencies_session_cache;
      } else if (isConnected) {
        result = await getCurrenciesFromSupabase();
      } else {
        result = await getCurrenciesFromOfflineCache();
      }

      return result;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRate = async (
    currency: Currency,
    user: UserProfile,
    rate: number
  ): Promise<Currency> => {
    if (!isConnected) {
      const offlineError = new Error(
        "You can't update currency rate when you are in offline mode"
      );
      throw {
        error: offlineError,
        arError: "لا يمكن تحديث سعر العملة في وضع عدم الاتصال",
      };
    }

    try {
      const { error, status } = await supabase
        .from("currencies")
        .update({
          to_dollar_rate: rate,
          updated_at: new Date(),
          updated_by: user?.firstname || "",
        })
        .eq("id", currency?.id);

      if (error) {
        let msg = error.message;
        let arMsg = "حدث خطأ أثناء تحديث سعر العملة";

        if (status === 403) {
          msg = "You don't have permission to update currency rates";
          arMsg = "ليس لديك الصلاحيّة لتحديث سعر العملة";
        }

        throw { error: new Error(msg), arError: arMsg };
      }

      // Create updated currency object
      const updatedCurrency = {
        ...currency,
        to_dollar_rate: rate,
        updated_at: new Date().toISOString(),
        updated_by: user?.firstname ?? "",
      };

      // Update both state and session cache
      const updatedCurrencies = currencies.map((c) =>
        c.id === currency?.id ? updatedCurrency : c
      );

      setCurrencies(updatedCurrencies);
      _currencies_session_cache = updatedCurrencies;

      // Update the offline cache
      await AsyncStorage.setItem(
        OFFLINE_CURRENCIES_CACHE_KEY,
        JSON.stringify(updatedCurrencies)
      );

      return updatedCurrency;
    } catch (error: any) {
      console.error(error);
      // We're not setting hook state for errors here
      // Instead, we pass the error directly to the caller
      if ("error" in error && "arError" in error) {
        throw error;
      } else {
        throw {
          error: error as Error,
          arError:
            "خطأ تقني أثناء تحديث معدل العملة. الرّجاء محاولة لاحقا أو أتصل بالمسؤول",
        };
      }
    }
  };

  const reload = async (): Promise<Currency[]> => {
    _currencies_session_cache = []; // forces a reload instead of getting session cached data
    return loadData();
  };

  useEffect(() => {
    loadData().catch((err) => console.error("Error loading currencies:", err));
  }, [isConnected]);

  return {
    error,
    isLoading,
    currencies,
    reload,
    updateRate,
    arError,
  };
}
