// Supabase auth integration hook

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type UseSupabaseSessionHook = [boolean, Session | null];

const CACHE_VERSION = 0;
const OFFLINE_USER_SESSION_CACHE_KEY = `offline:user:session:${CACHE_VERSION}:data`;

export function UseSupabaseSession(): UseSupabaseSessionHook {
  const { isInternetReachable } = useNetInfo();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const cacheSession = async (session: Session | null) => {
    if (session) {
      try {
        await AsyncStorage.setItem(
          OFFLINE_USER_SESSION_CACHE_KEY,
          JSON.stringify(session)
        );
      } catch (e) {
        console.warn("Failed to cache session: ", e);
      }
    } else {
      await AsyncStorage.removeItem(OFFLINE_USER_SESSION_CACHE_KEY);
    }
  };

  const restoreSessionFromCache = async () => {
    setIsLoading(true);
    try {
      const cached = await AsyncStorage.getItem(OFFLINE_USER_SESSION_CACHE_KEY);
      if (cached) {
        const parsed: Session = JSON.parse(cached);
        setSession(parsed);
      }
    } catch (e) {
      console.warn("Failed to restore cached session: ", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // load session from cache if in offline mode
      if (isInternetReachable === false) {
        await restoreSessionFromCache();
        return;
      }

      // load session from supabase
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();
      setSession(initialSession);
      await cacheSession(initialSession);
      setIsLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        setSession(currentSession);
        await cacheSession(currentSession);
        setIsLoading(false);
      });

      return () => {
        subscription?.unsubscribe();
      };
    };
    init();
  }, [isInternetReachable]);
  return [isLoading, session];
}
