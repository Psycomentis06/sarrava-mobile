import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView>
        {/* stats */}
        <ThemedText style={styles.overviewTitle} type="title">
          Overview
        </ThemedText>
        <ThemedView style={styles.statsContainer}>
          <ThemedView>
            <ThemedText type="subtitle">$12,345</ThemedText>
            <ThemedText style={styles.statsValueItem}>Transactions</ThemedText>
          </ThemedView>
          <ThemedView>
            <ThemedText type="subtitle">$567</ThemedText>
            <ThemedText style={styles.statsValueItem}>Fee</ThemedText>
          </ThemedView>
          <ThemedView>
            <ThemedText type="subtitle">$11,778</ThemedText>
            <ThemedText style={styles.statsValueItem}>Revenu</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
      <ThemedView style={styles.quickActionsContainer}>
        {/* quick actions */}
        <ThemedText type="title">Quick Actions</ThemedText>
        <Button title="Add transaction" />
        <Button title="New Report" />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  overviewTitle: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    gap: 10,
  },
  statsValueItem: {
    textAlign: "center",
  },

  quickActionsContainer: {
    marginTop: 50,
  },
});
