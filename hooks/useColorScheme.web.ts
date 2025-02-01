import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { usePreferedColorSchemeMode } from "./usePreferedColorSchemeMode";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [mode, setMode] = usePreferedColorSchemeMode();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated && mode === "system") {
    return colorScheme;
  }
  if (mode !== "system") {
    return mode;
  }
}
