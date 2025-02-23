import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemePalette() {
  // const theme = useColorScheme() ?? 'light'
  return Colors["light"];
}
