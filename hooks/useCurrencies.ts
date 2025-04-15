import { supabase } from "@/lib/supabase";
import { Currency, UserProfile } from "@/utils/models";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export type UseCurrenciesHookReturnType = {
  // data loading state
  isLoading: boolean;
  // function to refresh data from database if available
  reload: () => void;
  // list of currencies
  currencies: Currency[];
  // update currency rate for a given currency object
  updateRate: (currency: Currency, user: UserProfile, rate: number) => void;
  // error object if any error occurred
  error: Error | null;
  // error message in arabic
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

  const getCurrenciesFromSupabase = async () => {
    setIsLoading(true);
    setError(null);
    setArError(null);

    try {
      const { data, error: supErr } = await supabase
        .from("currencies")
        .select()
        .order("country_code", { ascending: true });

      if (supErr != null) {
        console.error(supErr);
        setError(new Error(supErr.message));
        setArError("حدث خطأ أثناء جلب بيانات العملات");
        return;
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
    } catch (err) {
      console.error(err);
      const errorObj = err as Error;
      setError(errorObj);
      setArError("حدث خطأ تقني أثناء جلب بيانات العملات");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrenciesFromOfflineCache = async () => {
    setIsLoading(true);
    setError(null);
    setArError(null);

    try {
      const data = await AsyncStorage.getItem(OFFLINE_CURRENCIES_CACHE_KEY);
      if (data) {
        const currencies: Currency[] = JSON.parse(data);
        setCurrencies(currencies);
        _currencies_session_cache = currencies;
      } else {
        setError(new Error("No offline data available"));
        setArError("لا توجد بيانات متاحة في وضع عدم الاتصال");
      }
    } catch (error) {
      console.error(error);
      const errorObj = error as Error;
      setError(errorObj);
      setArError("حدث خطأ أثناء قراءة البيانات المخزنة محلياً");
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = () => {
    console.log("load data")
    if (_currencies_session_cache.length > 0) {
      setCurrencies(_currencies_session_cache);
      setIsLoading(false);
      return;
    }

    if (isConnected) {
      getCurrenciesFromSupabase();
    } else {
      getCurrenciesFromOfflineCache();
    }
  };

  const updateRate = async (
    currency: Currency,
    user: UserProfile,
    rate: number
  ) => {
    try {
      if (!isConnected) {
        setError(
          new Error(
            "You can't update currency rate when you are in offline mode"
          )
        );
        setArError("لا يمكن تحديث سعر العملة في وضع عدم الاتصال");
        return;
      }

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

        setError(new Error(msg));
        setArError(arMsg);
        return;
      }

      // Update local state
      const updatedCurrencies = currencies.map((c) =>
        c.id === currency?.id
          ? {
              ...c,
              to_dollar_rate: rate,
              updated_at: new Date().toISOString(),
              updated_by: user?.firstname ?? "",
            }
          : c
      );

      // Update both state and session cache
      setCurrencies(updatedCurrencies);
      _currencies_session_cache = updatedCurrencies;

      // Update the offline cache
      await AsyncStorage.setItem(
        OFFLINE_CURRENCIES_CACHE_KEY,
        JSON.stringify(updatedCurrencies)
      );
    } catch (error) {
      console.error(error);
      const errorObj = error as Error;
      setError(errorObj);
      setArError(
        "خطأ تقني أثناء تحديث معدل العملة. الرّجاء محاولة لاحقا أو أتصل بالمسؤول"
      );
    }
  };

  useEffect(() => {
    loadData();
  }, [isConnected]);

  return {
    error,
    isLoading,
    currencies,
    reload: loadData,
    updateRate,
    arError,
  };
}
