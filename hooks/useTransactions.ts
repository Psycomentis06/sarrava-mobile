import { supabase } from "@/lib/supabase";
import {
  Currency,
  Transaction,
  TransactionStatus,
  UserProfile,
} from "@/utils/models";
import { NewTransactionType } from "@/utils/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { useCallback, useEffect, useState } from "react";
import { UseSupabaseSession } from "./useSupabaseSession";

export enum TransactionSearchType {
  ALL,
  SENDER,
  RECEIVER,
}

export type UseTransactionsHookReturnType = {
  isLoading: boolean;
  error: Error | null;
  arError: string | null;
  transactions: Transaction[];
  transactionsCount: number;
  searchResults: Transaction[];
  search: (val: string, type?: TransactionSearchType) => Promise<Transaction[]>;
  reload: () => Promise<Transaction[]>;
  loadMore: () => Promise<void>;
  add: (
    trx: NewTransactionType,
    profile: UserProfile | null
  ) => Promise<Transaction>;
  isLoadMoreLoading: boolean;
  hasNextPage: boolean;
  updateStatus: (
    transaction: Transaction,
    status: TransactionStatus
  ) => Promise<void>;
};

const CACHE_VERSION = 0;
const OFFLINE_TRANSACTIONS_CACHE_KEY = `offline:transactions:${CACHE_VERSION}:data`;
const PAGE_SIZE = 20;
let _transactions_session_cache: Transaction[] = [];

export function useTransactions(): UseTransactionsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [arError, setArError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  const getTransactionsFromSupabase = useCallback(
    async (
      currentPage: number = 0,
      searchTerm: string = "",
      searchType: TransactionSearchType = TransactionSearchType.ALL
    ): Promise<Transaction[]> => {
      if (session === null) {
        return [];
      }
      try {
        const startIndex = currentPage * PAGE_SIZE;

        let query = supabase.from("transactions").select(
          `
              *,
              currency:currency_id (
                id, name, sign, to_dollar_rate, country,
                flag, created_at, updated_at, updated_by,
                ar_name, country_code, flag_url
              )
            `,
          { count: "exact" }
        );
        query = query.eq("created_by", session?.user.id);

        if (searchTerm) {
          const term = `%${searchTerm}%`;

          const senderQuery = [
            `sender->>firstname.ilike.${term}`,
            `sender->>lastname.ilike.${term}`,
            `sender->>email.ilike.${term}`,
            `sender->>address.ilike.${term}`,
            `sender->>phone.ilike.${term}`,
          ];

          const receiverQuery = [
            `receiver->>firstname.ilike.${term}`,
            `receiver->>lastname.ilike.${term}`,
            `receiver->>email.ilike.${term}`,
            `receiver->>address.ilike.${term}`,
            `receiver->>phone.ilike.${term}`,
          ];

          let orClause = "";
          if (searchType === TransactionSearchType.SENDER) {
            orClause = senderQuery.join(",");
          } else if (searchType === TransactionSearchType.RECEIVER) {
            orClause = receiverQuery.join(",");
          } else {
            orClause = [...senderQuery, ...receiverQuery].join(",");
          }

          query = query.or(orClause);
        }
        query = query.order("created_at", { ascending: false });
        query = query.range(startIndex, startIndex + PAGE_SIZE - 1);
        const { data, error, count } = await query;
        if (error) throw new Error(error.message);

        const fetched = (data as Transaction[]) || [];
        if (typeof count === "number") {
          setTransactionsCount(count);
          setHasNextPage(fetched.length === PAGE_SIZE);
        }
        return fetched;
      } catch (err) {
        const error = err as Error;
        setError(error);
        setArError("حدث خطأ أثناء تحميل البيانات");
        throw error;
      }
    },
    [session]
  );

  const getTransactionsFromOfflineCache = useCallback(async (): Promise<
    Transaction[]
  > => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_CACHE_KEY);
      if (!data) throw new Error("No offline transaction data available");

      const parsed = JSON.parse(data) as Transaction[];
      setTransactions(parsed);
      _transactions_session_cache = parsed;
      return parsed;
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      setArError("حدث خطأ أثناء قراءة بيانات المعاملات المخزنة محلياً");
      throw errorObj;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async (): Promise<Transaction[]> => {
    setIsLoading(true);
    setError(null);
    setArError(null);
    setPage(0);
    setHasNextPage(true);

    try {
      let initial: Transaction[] = [];

      if (_transactions_session_cache.length > 0) {
        console.log("Loaded from session cache");
        initial = _transactions_session_cache;
        setTransactions(initial);
      } else if (isInternetReachable === false) {
        console.log("Loaded from offline cache");
        initial = await getTransactionsFromOfflineCache();
      } else if (isInternetReachable === true) {
        console.log("Loaded from Supabase");
        initial = await getTransactionsFromSupabase(0);
        setTransactions(initial);
        _transactions_session_cache = initial;
        AsyncStorage.setItem(
          OFFLINE_TRANSACTIONS_CACHE_KEY,
          JSON.stringify(initial)
        );
      }

      setSearchResults(initial);
      return initial;
    } finally {
      setIsLoading(false);
    }
  }, [
    getTransactionsFromOfflineCache,
    getTransactionsFromSupabase,
    isInternetReachable,
  ]);

  const reload = useCallback(() => {
    _transactions_session_cache = [];
    return loadInitialData();
  }, [loadInitialData]);

  const search = useCallback(
    async (
      searchValue: string,
      searchType: TransactionSearchType = TransactionSearchType.ALL
    ): Promise<Transaction[]> => {
      const term = searchValue.trim().toLowerCase();
      console.debug("searching for : ", term);
      if (!term) {
        setSearchResults(transactions);
        return transactions;
      }

      try {
        if (isInternetReachable === false) {
          const filtered = transactions.filter((t) => {
            const safe = (val?: string) => (val || "").toLowerCase();
            const senderMatch =
              safe(t.sender?.firstname).includes(term) ||
              safe(t.sender?.lastname).includes(term) ||
              safe(t.sender?.email).includes(term) ||
              safe(t.sender?.address).includes(term) ||
              safe(t.sender?.phone).includes(term);

            const receiverMatch =
              safe(t.receiver?.firstname).includes(term) ||
              safe(t.receiver?.lastname).includes(term) ||
              safe(t.receiver?.email).includes(term) ||
              safe(t.receiver?.address).includes(term) ||
              safe(t.receiver?.phone).includes(term);

            if (searchType === TransactionSearchType.SENDER) return senderMatch;
            if (searchType === TransactionSearchType.RECEIVER)
              return receiverMatch;
            return senderMatch || receiverMatch;
          });

          setSearchResults(filtered);
          return filtered;
        } else {
          const results = await getTransactionsFromSupabase(
            0,
            term,
            searchType
          );
          console.debug("transactions: ", results.length);

          setSearchResults(results);
          return results;
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        setArError("حدث خطأ أثناء البحث عن المعاملات");
        throw error;
      }
    },
    [transactions, isInternetReachable, getTransactionsFromSupabase]
  );

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadMoreLoading || !isInternetReachable) return;

    setIsLoadMoreLoading(true);
    try {
      const nextPage = page + 1;
      const newTransactions = await getTransactionsFromSupabase(nextPage);

      setTransactions((prev) => {
        const updated = [...prev, ...newTransactions];
        _transactions_session_cache = updated;
        AsyncStorage.setItem(
          OFFLINE_TRANSACTIONS_CACHE_KEY,
          JSON.stringify(updated)
        );
        return updated;
      });

      setSearchResults((prev) => [...prev, ...newTransactions]);
      setPage(nextPage);
    } catch (err) {
      setError(err as Error);
      setArError("حدث خطأ أثناء تحميل المزيد من المعاملات");
    } finally {
      setIsLoadMoreLoading(false);
    }
  }, [
    hasNextPage,
    isLoadMoreLoading,
    isInternetReachable,
    getTransactionsFromSupabase,
    page,
  ]);

  const updateStatus = useCallback(
    async (
      transaction: Transaction,
      status: TransactionStatus
    ): Promise<void> => {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ status })
          .eq("id", transaction.id);

        if (error) throw new Error(error.message);

        setTransactions((prev) => {
          const updated = prev.map((t) =>
            t.id === transaction.id ? { ...t, status } : t
          );
          setSearchResults(updated);
          _transactions_session_cache = updated;
          AsyncStorage.setItem(
            OFFLINE_TRANSACTIONS_CACHE_KEY,
            JSON.stringify(updated)
          );
          return updated;
        });
      } catch (err) {
        const error = err as Error;
        setError(error);
        setArError("حدث خطأ أثناء تحديث حالة المعاملة");
        throw error;
      }
    },
    []
  );

  const add = async (
    data: NewTransactionType,
    profile: UserProfile | null
  ): Promise<Transaction> => {
    const selectedCurrency = data.price.selectedCurrency as Currency;
    if (!selectedCurrency) {
      throw {
        error: "No currency selected to create transaction",
        error_ar: "لايمكن مواصلة العملية لأنه لاتوجد عملة محددة",
      };
    }
    const usdAmount = data.price.totalPrice * selectedCurrency.to_dollar_rate; // calculated based on chosen currency
    // const { governmentTax, operationCost } =
    //   calculateTransactionFees(usdAmount);
    const opFixedCost = data.price.operationCostFixed
    const opPercentCost = data.price.operationCostPercent / 100
    const opCost = (data.price.totalPrice * opPercentCost) + opFixedCost // in selected currency
    const { data: trxData, error: trxErr } = await supabase
      .from("transactions")
      .insert({
        currency_id: selectedCurrency.id,
        original_amount: data.price.totalPrice,
        amount_usd: usdAmount,
        exchange_rate: selectedCurrency.to_dollar_rate,
        is_paid_full: data.price.isPaidFull,
        first_installment: data.price.firstInstallment,
        created_by: profile?.user_id,
        sender: data.sender,
        receiver: data.receiver,
        // calculate fees
        // these calculations should happen at a server level to be secure and can't be modified. or at database trigger level
        // due to time constraints we implemented it here but will be moved in the future
        operation_cost_usd: opCost * selectedCurrency.to_dollar_rate,
        operation_cost_original: opCost,
price_percent_rate: opPercentCost,
price_fixed_rate: opFixedCost,
        operation_tax_usd: 0,
        operation_tax_original: 0
      })
      .select(
        `
              *,
              currency:currency_id (
                id, name, sign, to_dollar_rate, country,
                flag, created_at, updated_at, updated_by,
                ar_name, country_code, flag_url
              )
            `
      )
      .single();

    if (trxErr) {
      console.error(trxErr);
      throw {
        error: trxErr,
        error_ar:
          "لم تكتمل عملية أرسال الأموال لخطئ ما. يرجى المحاولة لاحقا وإذا فشلت فرجاء الأتصال بالمسؤول",
      };
    }
    const transactionData = trxData as Transaction;
    const newTrans = [transactionData, ...transactions];
    _transactions_session_cache = newTrans;
    setTransactions(newTrans);
    await AsyncStorage.setItem(
      OFFLINE_TRANSACTIONS_CACHE_KEY,
      JSON.stringify(newTrans)
    );
    return transactionData;
  };

  useEffect(() => {
    loadInitialData().catch((err) => console.error("Initial load error:", err));
  }, [loadInitialData]);

  return {
    isLoading,
    error,
    arError,
    transactions,
    transactionsCount,
    searchResults,
    search,
    add,
    reload,
    loadMore,
    isLoadMoreLoading,
    hasNextPage,
    updateStatus,
  };
}
