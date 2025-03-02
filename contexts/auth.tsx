import { useStorageState } from "@/hooks/useStorageState";
import { useNavigation } from "expo-router";
import { createContext, PropsWithChildren, useContext } from "react";

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => {
    console.log("Default Sign in");
  },
  signOut: () => {
    console.log("Default Sign out");
  },
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
  const [[isLoading, session], setSession] = useStorageState("session");
  const navigation = useNavigation();

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          console.log("loging in");
          setSession("random-key");
          console.log(navigation.getState());
          navigation.navigate("(auth)" as never);
        },
        signOut: () => {
          console.log("Logged out");
          setSession(null);
          navigation.navigate("auth/login" as never);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
