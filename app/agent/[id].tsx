import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams } from "expo-router";

export default function AgentDetailsScreen() {
  const { id } = useLocalSearchParams();
  return (
    <ThemedView>
      <ThemedText>{id}</ThemedText>
    </ThemedView>
  );
}
