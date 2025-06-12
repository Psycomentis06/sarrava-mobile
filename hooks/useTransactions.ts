import { supabase } from "@/lib/supabase";
import {
  Currency,
  InternalTransaction,
  TransactionStatus,
  UserProfile,
} from "@/utils/models";
import { NewTransactionType } from "@/utils/schemas";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseSupabaseSession } from "./useSupabaseSession";

export enum TransactionSearchType {
  ALL,
  SENDER,
  RECEIVER,
}
// Extend Transaction type for internal sync management

export type UseTransactionsHookReturnType = {
  isLoading: boolean;
  transactions: InternalTransaction[];
  transactionsCount: number;
  searchResults: InternalTransaction[];
  search: (
    val: string,
    type?: TransactionSearchType
  ) => Promise<InternalTransaction[]>;
  reload: () => Promise<InternalTransaction[]>;
  loadMore: () => Promise<void>;
  add: (
    trx: NewTransactionType,
    profile: UserProfile | null
  ) => Promise<InternalTransaction>;
  isLoadMoreLoading: boolean;
  hasNextPage: boolean;
  updateStatus: (
    transaction: InternalTransaction,
    status: TransactionStatus
  ) => Promise<void>;
  retryTransaction: (localId: string) => Promise<void>; // New: Manual retry
  removeTransaction: (localId: string) => Promise<void>; // New: Manual remove
};

const CACHE_VERSION = 0;
const OFFLINE_TRANSACTIONS_CACHE_KEY = `offline:transactions:${CACHE_VERSION}:data`;
const PAGE_SIZE = 20;
const OFFLINE_QUEUE_KEY = "offline:transactions:queue";

// Retention periods for queued items in milliseconds
const SYNCED_ITEM_RETENTION_MS = 10 * 60 * 1000; // 10 minutes
const ERROR_ITEM_RETENTION_MS = 60 * 60 * 1000; // 1 hour (for ERROR and FAILED_PERMANENTLY)

// Retry mechanism constants
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_DELAY_MS = 5 * 1000; // 5 seconds

/**
 * Calculates the exponential backoff delay.
 * @param {number} retryCount The current retry count.
 * @returns {number} The delay in milliseconds.
 */
const calculateBackoffDelay = (retryCount: number): number => {
  return INITIAL_BACKOFF_DELAY_MS * Math.pow(2, retryCount);
};

class AsyncMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    } else {
      this.locked = false;
    }
  }
}

let isOrchestrationRunning = false;
let isSyncRunning = false;
let isOrchestrationCompleted = false;
const queueMutex = new AsyncMutex();

export function useTransactions(): UseTransactionsHookReturnType {
  const { isInternetReachable } = useNetInfo();
  const [isSessionLoading, session] = UseSupabaseSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [transactions, setTransactions] = useState<InternalTransaction[]>([]);
  const [searchResults, setSearchResults] = useState<InternalTransaction[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);

  /**
   * Retrieves transactions from the offline queue in AsyncStorage.
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to an array of queued transactions.
   */
  const getQueuedTransactions = useCallback(async (): Promise<
    InternalTransaction[]
  > => {
    await queueMutex.acquire();
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const result = raw ? JSON.parse(raw) : [];
      console.log("Retrieved queue:", result.length, "items");
      return result;
    } catch (error) {
      console.error("Error retrieving queued transactions:", error);
      return [];
    } finally {
      queueMutex.release();
    }
  }, []);

  const writeQueueToStorage = useCallback(
    async (queue: InternalTransaction[]) => {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    },
    []
  );

  /**
   * Adds a transaction to the offline queue in AsyncStorage.
   * @param {InternalTransaction} tx The transaction to add.
   */
  const addTransactionToQueue = useCallback(
    async (tx: InternalTransaction) => {
      await queueMutex.acquire();
      try {
        const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const currentQueue = queue ? JSON.parse(queue) : [];

        console.log(
          "Adding transaction to queue, current queue size:",
          currentQueue.length
        );

        const newQueue = [tx, ...currentQueue];
        await writeQueueToStorage(newQueue);

        console.log(
          "Transaction added to queue, new queue size:",
          newQueue.length
        );
      } catch (error) {
        console.error("Error adding transaction to queue:", error);
      } finally {
        queueMutex.release();
      }
    },
    [writeQueueToStorage]
  );

  /**
   * Updates an existing transaction in the offline queue.
   * @param {string} localId The local ID of the transaction to update.
   * @param {Partial<InternalTransaction>} update The partial transaction object with updates.
   */
  const updateTransactionInQueue = useCallback(
    async (localId: string, update: Partial<InternalTransaction>) => {
      await queueMutex.acquire();
      try {
        const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const currentQueue = queue ? JSON.parse(queue) : [];

        const updated = currentQueue.map((tx: InternalTransaction) =>
          tx.__internal?.localId === localId ? { ...tx, ...update } : tx
        );

        await writeQueueToStorage(updated);
        console.log("Updated transaction in queue:", localId);
      } catch (error) {
        console.error("Error updating transaction in queue:", error);
      } finally {
        queueMutex.release();
      }
    },
    [writeQueueToStorage]
  );

  /**
   * Removes a transaction from the offline queue based on its localId.
   * @param {string} localId The local ID of the transaction to remove.
   */
  const removeTransactionFromQueue = useCallback(
    async (localId: string) => {
      await queueMutex.acquire();
      try {
        const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const currentQueue = queue ? JSON.parse(queue) : [];

        const updated = currentQueue.filter(
          (tx: InternalTransaction) => tx.__internal?.localId !== localId
        );

        await writeQueueToStorage(updated);
        console.log(
          "Removed transaction from queue, new queue size:",
          updated.length
        );
      } catch (error) {
        console.error("Error removing transaction from queue:", error);
      } finally {
        queueMutex.release();
      }
    },
    [writeQueueToStorage]
  );

  /**
   * Cleans up the offline queue based on retention policies.
   * Removes SYNCED items older than SYNCED_ITEM_RETENTION_MS.
   * Removes ERROR items older than ERROR_ITEM_RETENTION_MS.
   * PENDING items are never removed by this function.
   */
  const cleanupQueuedTransactions = useCallback(async () => {
    try {
      const queue = await getQueuedTransactions();
      const now = Date.now();

      const filteredQueue = queue.filter((tx) => {
        if (tx.__internal?.syncStatus === "PENDING") {
          return true; // Always keep pending items
        }
        if (tx.__internal?.syncStatus === "SYNCED" && tx.__internal?.syncedAt) {
          const syncedTime = new Date(tx.__internal.syncedAt).getTime();
          return now - syncedTime < SYNCED_ITEM_RETENTION_MS;
        }
        if (
          (tx.__internal?.syncStatus === "ERROR" ||
            tx.__internal?.syncStatus === "FAILED_PERMANENTLY") &&
          tx.__internal?.lastAttemptTimestamp
        ) {
          const errorTime = new Date(
            tx.__internal.lastAttemptTimestamp
          ).getTime();
          return now - errorTime < ERROR_ITEM_RETENTION_MS;
        }
        // Remove any items with unknown or invalid syncStatus, or old SYNCED/ERROR/FAILED_PERMANENTLY items
        return false;
      });

      if (filteredQueue.length !== queue.length) {
        console.log(
          `Cleaning up queue: Removed ${
            queue.length - filteredQueue.length
          } expired items.`
        );
        await AsyncStorage.setItem(
          OFFLINE_QUEUE_KEY,
          JSON.stringify(filteredQueue)
        );
      }
    } catch (error) {
      console.error("Error during queue cleanup:", error);
    }
  }, [getQueuedTransactions]);

  /**
   * Fetches transactions from Supabase.
   * @param {number} currentPage The page number to fetch.
   * @param {string} searchTerm The search term.
   * @param {TransactionSearchType} searchType The type of search (ALL, SENDER, RECEIVER).
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to an array of fetched transactions.
   */
  const getTransactionsFromSupabase = useCallback(
    async (
      currentPage: number = 0,
      searchTerm: string = "",
      searchType: TransactionSearchType = TransactionSearchType.ALL
    ): Promise<InternalTransaction[]> => {
      if (!session?.user?.id) {
        console.warn(
          "Supabase session not available for fetching transactions."
        );
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
        query = query.eq("created_by", session.user.id);

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
        if (error) {
          throw {
            error: new Error(error.message),
            error_ar: "حدث خطأ أثناء تحميل البيانات",
          };
        }

        const fetched = (data as InternalTransaction[]) || [];
        if (typeof count === "number") {
          setTransactionsCount(count);
          setHasNextPage(fetched.length === PAGE_SIZE);
        }
        return fetched;
      } catch (err) {
        const error = err as Error;
        if ((err as any).error && (err as any).error_ar) {
          throw err;
        }
        throw { error: error, error_ar: "حدث خطأ أثناء تحميل البيانات" };
      }
    },
    [session]
  );

  /**
   * Retrieves transactions from the local AsyncStorage cache.
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to an array of cached transactions.
   */
  const getTransactionsFromOfflineCache = useCallback(async (): Promise<
    InternalTransaction[]
  > => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_TRANSACTIONS_CACHE_KEY);
      if (!data) {
        console.log("No offline transaction data available in cache");
        return [];
      }

      const parsed = JSON.parse(data) as InternalTransaction[];
      return parsed;
    } catch (err) {
      const errorObj = err as Error;
      throw {
        error: errorObj,
        error_ar: "حدث خطأ أثناء قراءة بيانات المعاملات المخزنة محلياً",
      };
    }
  }, []);

  /**
   * Attempts to sync a single transaction (add or update) to Supabase.
   * Updates local state and queue status accordingly.
   * @param {InternalTransaction} tx The transaction to sync.
   * @returns {Promise<InternalTransaction>} The synced transaction with updated ID and status.
   */
  const trySyncTransaction = useCallback(
    async (tx: InternalTransaction): Promise<InternalTransaction> => {
      console.log(
        "Attempting to sync transaction:",
        tx.__internal?.localId || tx.id,
        "operationType:",
        tx.__internal?.operationType
      );

      let syncedTx: InternalTransaction;
      let errorOccurred = false;
      let errorMessage = "";

      try {
        // Your existing sync logic here...
        if (
          tx.__internal?.operationType === "UPDATE_STATUS" &&
          tx.__internal?.originalId
        ) {
          console.log(
            `Syncing status update for originalId: ${tx.__internal.originalId} to status: ${tx.status}`
          );

          const { error } = await supabase
            .from("transactions")
            .update({ status: tx.status })
            .eq("id", tx.__internal.originalId);

          if (error) {
            errorOccurred = true;
            errorMessage = error.message;
            throw {
              error: new Error(error.message),
              error_ar: "حدث خطأ أثناء تحديث حالة المعاملة على الخادم",
            };
          }

          syncedTx = {
            ...tx,
            __internal: {
              ...tx.__internal,
              syncStatus: "SYNCED",
              errorMessage: undefined,
              syncedAt: new Date().toISOString(),
              retryCount: 0,
              lastAttemptTimestamp: undefined,
            },
          };
          console.log(
            "Successfully synced status update for:",
            tx.__internal.originalId
          );
        } else if (
          !tx.__internal?.operationType ||
          tx.__internal?.operationType === "ADD"
        ) {
          console.log(
            "Syncing new transaction creation for localId:",
            tx.__internal?.localId
          );

          const payload = {
            currency_id: tx.currency_id,
            original_amount: tx.original_amount,
            amount_usd: tx.amount_usd,
            exchange_rate: tx.exchange_rate,
            is_paid_full: tx.is_paid_full,
            first_installment: tx.first_installment,
            created_by: tx.created_by,
            sender: tx.sender,
            receiver: tx.receiver,
            created_at: tx.created_at,
            operation_cost_usd: tx.operation_cost_usd,
            operation_cost_original: tx.operation_cost_original,
            price_percent_rate: tx.price_percent_rate,
            price_fixed_rate: tx.price_fixed_rate,
            operation_tax_usd: 0,
            operation_tax_original: 0,
            status: tx.status,
            pin_code: tx.pin_code,
          };

          const { data: trxData, error: trxErr } = await supabase
            .from("transactions")
            .insert(payload)
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
            errorOccurred = true;
            errorMessage = trxErr.message;
            throw {
              error: trxErr,
              error_ar:
                "لم تكتمل عملية أرسال الأموال لخطئ ما. يرجى المحاولة لاحقا وإذا فشلت فرجاء الأتصال بالمسؤول",
            };
          }

          syncedTx = {
            ...trxData,
            __internal: {
              localId: tx.__internal?.localId,
              syncStatus: "SYNCED",
              errorMessage: undefined,
              syncedAt: new Date().toISOString(),
              retryCount: 0,
              lastAttemptTimestamp: undefined,
            },
          };

          console.log(
            "Successfully synced new transaction, Supabase ID:",
            syncedTx.id
          );
        } else {
          console.warn(
            "Unknown operationType for transaction in queue:",
            tx.__internal?.operationType
          );
          return tx;
        }

        // Update the queue with synced transaction
        await updateTransactionInQueue(tx.__internal?.localId!, {
          ...syncedTx,
          id: syncedTx.id,
          __internal: syncedTx.__internal,
        });

        return syncedTx;
      } catch (err) {
        errorOccurred = true;
        errorMessage = (err as any)?.error?.message || JSON.stringify(err);
        console.error(
          `trySyncTransaction failed for ${tx.__internal?.localId || tx.id}:`,
          err
        );

        const currentRetryCount = (tx.__internal?.retryCount || 0) + 1;
        let newSyncStatus:
          | "PENDING"
          | "SYNCED"
          | "ERROR"
          | "FAILED_PERMANENTLY" = "ERROR";

        if (currentRetryCount >= MAX_RETRIES) {
          newSyncStatus = "FAILED_PERMANENTLY";
          console.warn(
            `Transaction ${
              tx.__internal?.localId || tx.id
            } failed permanently after ${currentRetryCount} retries.`
          );
        }

        const updatedTx: InternalTransaction = {
          ...tx,
          __internal: {
            ...tx.__internal,
            syncStatus: newSyncStatus,
            errorMessage: errorMessage,
            lastAttemptTimestamp: new Date().toISOString(),
            retryCount: currentRetryCount,
          },
        };

        await updateTransactionInQueue(tx.__internal?.localId!, updatedTx);
        throw err;
      }
    },
    [updateTransactionInQueue] // Dependencies for trySyncTransaction
  );

  /**
   * Loads initial transaction data from cache, Supabase, and merges with queued transactions.
   * This function is now the single source of truth for setting the `transactions` state.
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to the initial list of transactions.
   */
  const loadInitialData = useCallback(async (): Promise<
    InternalTransaction[]
  > => {
    setIsLoading(true);
    setPage(0);
    setHasNextPage(true);

    if (isSessionLoading) {
      console.log("Session still loading, deferring initial data load.");
      return [];
    }

    try {
      // First, run a cleanup to remove expired items from the queue
      await cleanupQueuedTransactions();

      const queued = await getQueuedTransactions();
      console.log(
        `Found ${queued.length} queued transactions during initial load.`
      );

      let initialSupabaseOrCached: InternalTransaction[] = [];
      if (isInternetReachable === true) {
        console.log("Internet reachable: Loading from Supabase and caching.");
        const supabaseData = await getTransactionsFromSupabase(0);
        initialSupabaseOrCached = supabaseData;
        await AsyncStorage.setItem(
          OFFLINE_TRANSACTIONS_CACHE_KEY,
          JSON.stringify(initialSupabaseOrCached)
        );
      } else {
        console.log("Internet not reachable: Loading from offline cache.");
        initialSupabaseOrCached = await getTransactionsFromOfflineCache();
      }

      // --- NEW MERGE LOGIC ---
      const transactionsMap = new Map<string, InternalTransaction>();

      // 1. Add all initial (Supabase/cached) transactions to the map using their Supabase ID.
      // These are considered the authoritative source if they exist.
      initialSupabaseOrCached.forEach((tx) => {
        if (tx.id) {
          transactionsMap.set(tx.id, tx);
        }
      });

      // 2. Overlay queued transactions.
      // Priority: PENDING/ERROR (by localId) > SYNCED (by localId, if not yet in Supabase) > Supabase ID
      queued.forEach((qTx) => {
        const isQueuedAdd = qTx.__internal?.operationType === "ADD";
        const isQueuedUpdate =
          qTx.__internal?.operationType === "UPDATE_STATUS";
        const isPendingOrError =
          qTx.__internal?.syncStatus === "PENDING" ||
          qTx.__internal?.syncStatus === "ERROR" ||
          qTx.__internal?.syncStatus === "FAILED_PERMANENTLY"; // Include permanently failed for display

        if (isQueuedAdd && qTx.__internal?.localId) {
          // For new transactions created offline, if they are PENDING/ERROR/FAILED_PERMANENTLY,
          // they should override any potential older version (though unlikely for new adds).
          // Use localId as the primary key for these until they get a Supabase ID.
          transactionsMap.set(qTx.__internal.localId, qTx);
        } else if (isQueuedUpdate && qTx.__internal?.originalId) {
          // For status updates, if the original transaction exists in the map (by Supabase ID),
          // apply the update. If not, and it's pending/error, add it by its localId.
          const existingTx = transactionsMap.get(qTx.__internal.originalId);
          if (existingTx) {
            // Merge the status update, ensuring __internal is preserved
            transactionsMap.set(qTx.__internal.originalId, {
              ...existingTx,
              status: qTx.status,
              __internal: qTx.__internal,
            });
          } else if (isPendingOrError && qTx.__internal.localId) {
            // If original not found but it's a pending/error update, keep it by localId
            transactionsMap.set(qTx.__internal.localId, qTx);
          }
        } else if (qTx.__internal?.syncStatus === "SYNCED" && qTx.id) {
          // For synced items that are still in the queue (within retention period),
          // ensure they are in the map, but let Supabase version take precedence if available.
          // If the Supabase ID exists in map, it means it was fetched from Supabase, so no override.
          // If not, it means it's a recently synced offline item not yet in the main fetch, so add it.
          if (!transactionsMap.has(qTx.id)) {
            transactionsMap.set(qTx.id, qTx);
          }
        }
      });

      // Convert map values back to array and sort
      const merged = Array.from(transactionsMap.values());

      merged.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(merged);
      setSearchResults(merged);
      return merged;
    } catch (error) {
      console.error("Error loading initial data:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isSessionLoading,
    isInternetReachable,
    cleanupQueuedTransactions,
    getQueuedTransactions,
    getTransactionsFromSupabase,
    getTransactionsFromOfflineCache,
  ]);

  /**
   * Syncs queued transactions when internet becomes available.
   * Processes transactions one by one, re-fetching the queue after each item to ensure atomicity.
   * @returns {Promise<boolean>} True if any transactions were synced, false otherwise.
   */
  const syncQueuedTransactions = useCallback(async (): Promise<boolean> => {
    if (isSyncRunning || !isInternetReachable) {
      console.log("Sync skipped: already running or offline.");
      return false;
    }
    isSyncRunning = true;
    console.log("Starting queue sync process...");

    let anyTransactionSynced = false;
    try {
      // Create a snapshot of the queue to process
      const queue = await getQueuedTransactions();
      const itemsToProcess = queue.filter(
        (tx) =>
          tx.__internal?.syncStatus === "PENDING" ||
          (tx.__internal?.syncStatus === "ERROR" &&
            (tx.__internal.retryCount || 0) < MAX_RETRIES)
      );

      if (itemsToProcess.length === 0) {
        console.log("No pending items in queue to sync.");
        return false;
      }

      console.log(`Found ${itemsToProcess.length} items to process.`);

      // Process all pending items sequentially
      for (const tx of itemsToProcess) {
        try {
          await trySyncTransaction(tx);
          anyTransactionSynced = true;
        } catch (e) {
          console.warn(
            `Failed to sync item ${tx.__internal?.localId}, will retry later.`,
            e
          );
        }
      }

      return anyTransactionSynced;
    } catch (err) {
      console.error(
        "A critical error occurred in syncQueuedTransactions:",
        err
      );
      return anyTransactionSynced; // Return whether anything succeeded before the error
    } finally {
      console.log("Queue sync process finished.");
      isSyncRunning = false; // Release the lock
    }
  }, [getQueuedTransactions, trySyncTransaction, isInternetReachable]);

  // Refs for the latest stable functions to be used in useEffect dependencies
  const loadInitialDataRef = useRef(loadInitialData);
  useEffect(() => {
    loadInitialDataRef.current = loadInitialData;
  }, [loadInitialData]);

  const syncQueuedTransactionsRef = useRef(syncQueuedTransactions);
  useEffect(() => {
    syncQueuedTransactionsRef.current = syncQueuedTransactions;
  }, [syncQueuedTransactions]);

  /**
   * Orchestrates initial data loading and sync.
   * This useEffect runs only when the component mounts and the session is ready,
   * or when internet connectivity changes from offline to online.
   */
  useEffect(() => {
    const orchestrateDataFlow = async () => {
      if (isOrchestrationRunning) {
        console.log(
          "Orchestration skipped: another instance is already running."
        );
        return;
      }
      if (isSessionLoading || !session?.user?.id) {
        console.log("Orchestration deferred: session not ready.");
        return;
      }

      isOrchestrationRunning = true;
      setIsLoading(true);
      console.log("Orchestration: Starting data flow...");

      try {
        // Step 1: Always load initial data from cache/server first.
        await loadInitialData();

        // Step 2: If online, attempt to sync the queue.
        if (isInternetReachable) {
          const syncedSomething = await syncQueuedTransactions();

          // Step 3: If any transaction was successfully synced, reload data to get the final state.
          if (syncedSomething) {
            console.log(
              "Orchestration: Sync successful, reloading data for consistency."
            );
            await loadInitialData();
          }
        }
      } catch (err) {
        console.error("Orchestration error:", err);
      } finally {
        console.log("Orchestration: Finished.");
        setIsLoading(false);
        isOrchestrationRunning = false; // Release the lock
      }
    };

    orchestrateDataFlow();
  }, [isSessionLoading, session?.user?.id, isInternetReachable]);

  // Effect to run periodic queue cleanup
  useEffect(() => {
    // Run cleanup immediately on mount (after initial orchestration)
    cleanupQueuedTransactions();
    // Set up interval for periodic cleanup (e.g., every 5 minutes)
    const intervalId = setInterval(cleanupQueuedTransactions, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(intervalId); // Clear interval on unmount
  }, [cleanupQueuedTransactions]); // Added cleanupQueuedTransactions to dependencies

  /**
   * Reloads all transaction data.
   * This function is now stable and uses the ref for loadInitialData.
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to the reloaded list of transactions.
   */
  const reload = useCallback(() => {
    console.log("Reloading all transactions (triggered externally).");
    return loadInitialDataRef.current();
  }, []);

  /**
   * Searches for transactions based on a search term and type.
   * @param {string} searchValue The value to search for.
   * @param {TransactionSearchType} searchType The type of search.
   * @returns {Promise<InternalTransaction[]>} A promise that resolves to the search results.
   */
  const search = useCallback(
    async (
      searchValue: string,
      searchType: TransactionSearchType = TransactionSearchType.ALL
    ): Promise<InternalTransaction[]> => {
      const term = searchValue.trim().toLowerCase();
      console.debug("Searching for:", term);
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
          console.debug("Online search results count:", results.length);
          setSearchResults(results);
          return results;
        }
      } catch (err) {
        const error = err as Error;
        if ((err as any).error && (err as any).error_ar) {
          throw err;
        }
        throw { error: error, error_ar: "حدث خطأ أثناء البحث عن المعاملات" };
      }
    },
    [transactions, isInternetReachable, getTransactionsFromSupabase]
  );

  /**
   * Loads more transactions from Supabase.
   */
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadMoreLoading || !isInternetReachable) {
      console.log("Load more conditions not met:", {
        hasNextPage,
        isLoadMoreLoading,
        isInternetReachable,
      });
      return;
    }

    setIsLoadMoreLoading(true);
    try {
      const nextPage = page + 1;
      const newTransactions = await getTransactionsFromSupabase(nextPage);

      setTransactions((prev) => {
        const updated = [...prev, ...newTransactions];
        AsyncStorage.setItem(
          OFFLINE_TRANSACTIONS_CACHE_KEY,
          JSON.stringify(updated)
        );
        return updated;
      });

      setSearchResults((prev) => [...prev, ...newTransactions]);
      setPage(nextPage);
    } catch (err) {
      throw {
        error: err as Error,
        error_ar: "حدث خطأ أثناء تحميل المزيد من المعاملات",
      };
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

  /**
   * Updates the status of a transaction. Handles both local and online updates.
   * @param {InternalTransaction} transaction The transaction to update.
   * @param {TransactionStatus} status The new status.
   */
  const updateStatus = useCallback(
    async (
      transaction: InternalTransaction,
      status: TransactionStatus
    ): Promise<void> => {
      try {
        // Optimistically update local state
        setTransactions((prev) => {
          const updated = prev.map((t) =>
            (t.__internal?.localId &&
              t.__internal.localId === transaction.__internal?.localId) ||
            t.id === transaction.id
              ? { ...t, status }
              : t
          );
          setSearchResults(updated);
          // Update offline cache for immediate persistence
          AsyncStorage.setItem(
            OFFLINE_TRANSACTIONS_CACHE_KEY,
            JSON.stringify(updated)
          );
          return updated;
        });

        // If it's a local (unsynced) transaction, just update in queue
        if (
          transaction.__internal?.localId &&
          !transaction.__internal?.syncStatus
        ) {
          console.log(
            "Updating status of local (unsynced) transaction in queue:",
            transaction.__internal.localId
          );
          await updateTransactionInQueue(transaction.__internal.localId, {
            status,
          });
          return;
        }

        // If offline, queue the status update operation
        if (isInternetReachable === false) {
          console.log(
            "Offline: Queuing status update for transaction:",
            transaction.id
          );
          const statusUpdateOperation: InternalTransaction = {
            ...transaction,
            status, // New status
            __internal: {
              ...(transaction.__internal || {}),
              localId: Crypto.randomUUID(), // Assign a new localId for the operation
              operationType: "UPDATE_STATUS",
              originalId: transaction.id, // Reference the original Supabase ID
              syncStatus: "PENDING",
              createdOffline: true, // Mark this operation as created offline
            },
          };
          await addTransactionToQueue(statusUpdateOperation);
          return;
        }

        // Online update to Supabase
        console.log(
          "Online: Updating status for transaction on Supabase:",
          transaction.id
        );
        const { error } = await supabase
          .from("transactions")
          .update({ status })
          .eq("id", transaction.id);

        if (error) {
          throw {
            error: new Error(error.message),
            error_ar: "حدث خطأ أثناء تحديث حالة المعاملة",
          };
        }

        console.log("Successfully updated status online for:", transaction.id);
      } catch (err) {
        const error = err as Error;
        if ((err as any).error && (err as any).error_ar) {
          throw err;
        }
        throw { error: error, error_ar: "حدث خطأ أثناء تحديث حالة المعاملة" };
      }
    },
    [isInternetReachable, updateTransactionInQueue, addTransactionToQueue]
  );

  /**
   * Adds a new transaction. Handles both local creation and online syncing.
   * It no longer directly updates the `transactions` state.
   * @param {NewTransactionType} data The new transaction data.
   * @param {UserProfile | null} profile The user profile.
   * @returns {Promise<InternalTransaction>} The newly added transaction.
   */
  const add = useCallback(
    async (
      data: NewTransactionType,
      profile: UserProfile | null
    ): Promise<InternalTransaction> => {
      const selectedCurrency = data.price.selectedCurrency as Currency;
      if (!selectedCurrency) {
        throw {
          error: "No currency selected to create transaction",
          error_ar: "لايمكن مواصلة العملية لأنه لاتوجد عملة محددة",
        };
      }

      const usdAmount = data.price.totalPrice * selectedCurrency.to_dollar_rate;
      const opFixedCost = data.price.operationCostFixed;
      const opPercentCost = data.price.operationCostPercent / 100;
      const opCost = data.price.totalPrice * opPercentCost + opFixedCost;

      const localId = Crypto.randomUUID();
      const createdAt = new Date().toISOString(); // Capture creation time immediately
      console.log("Creating transaction with localId:", localId);

      const localTransaction: InternalTransaction = {
        id: localId, // Temporary ID for local tracking
        currency: selectedCurrency,
        currency_id: selectedCurrency.id,
        original_amount: data.price.totalPrice,
        amount_usd: usdAmount,
        exchange_rate: selectedCurrency.to_dollar_rate,
        is_paid_full: data.price.isPaidFull,
        first_installment: data.price.firstInstallment,
        created_by: profile?.user_id ?? "offline",
        sender: data.sender,
        receiver: data.receiver,
        created_at: createdAt, // Use captured creation time
        operation_cost_usd: opCost * selectedCurrency.to_dollar_rate,
        operation_cost_original: opCost,
        price_percent_rate: opPercentCost,
        price_fixed_rate: opFixedCost,
        operation_tax_usd: 0,
        operation_tax_original: 0,
        pin_code: Math.floor(100000 + Math.random() * 900000),
        status: "PENDING" as TransactionStatus,
        __internal: {
          localId,
          syncStatus: "PENDING",
          operationType: "ADD",
          createdOffline: isInternetReachable === false,
          retryCount: 0, // Initialize retry count
          lastAttemptTimestamp: createdAt, // Initial attempt timestamp
        },
      };

      // ONLY add to queue immediately. DO NOT update local state directly here.
      await addTransactionToQueue(localTransaction);

      if (isInternetReachable === false) {
        console.log(
          "Offline: Added transaction to queue. Triggering reload to update UI."
        );
        // Trigger a reload to display the newly queued transaction
        await reload(); // This will call loadInitialData, which merges queued items
        return localTransaction;
      }

      // If online, try to sync immediately
      try {
        console.log("Online: Attempting to sync new transaction immediately");
        const synced = await trySyncTransaction(localTransaction);
        // After successful sync, reload data to get the actual Supabase ID and ensure consistency
        await reload();
        return synced;
      } catch (e) {
        console.error("Error syncing new transaction immediately:", e);
        // The trySyncTransaction already updated the queue with ERROR/FAILED_PERMANENTLY status
        // Just trigger reload to reflect the updated status in UI
        await reload();
        throw e; // Re-throw the error for the consumer
      }
    },
    [isInternetReachable, reload, trySyncTransaction, addTransactionToQueue]
  );

  /**
   * Allows manual retry of a failed transaction.
   * @param {string} localId The local ID of the transaction to retry.
   */
  const retryTransaction = useCallback(
    async (localId: string) => {
      console.log(
        `Attempting to manually retry transaction with localId: ${localId}`
      );
      // Update the transaction in the queue to reset its sync status and retry info
      await updateTransactionInQueue(localId, {
        __internal: {
          syncStatus: "PENDING",
          errorMessage: undefined,
          retryCount: 0,
          lastAttemptTimestamp: new Date().toISOString(),
        },
      });
      // Trigger a reload to refresh the UI and allow automatic sync to pick it up
      await reload();
    },
    [reload, updateTransactionInQueue]
  );

  /**
   * Removes a transaction from the queue and local state.
   * @param {string} localId The local ID of the transaction to remove.
   */
  const removeTransaction = useCallback(
    async (localId: string) => {
      console.log(`Manually removing transaction with localId: ${localId}`);
      await removeTransactionFromQueue(localId); // Remove from AsyncStorage queue
      await reload(); // Reload to update the UI
    },
    [reload, removeTransactionFromQueue]
  );

  return {
    isLoading,
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
    retryTransaction, // Expose new function
    removeTransaction, // Expose new function
  };
}
