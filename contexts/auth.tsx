import { UseSupabaseSession } from "@/hooks/useSupabaseSession";
import { Session } from "@supabase/supabase-js";
import { createContext, PropsWithChildren, useContext } from "react";

const AuthContext = createContext<{
  session: Session | null
  isLoading: boolean;
}>({
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }
  return value;
}

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [isLoading, session] = UseSupabaseSession()

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
