import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DATA = [
  {
    id: "1",
    title: "New Message",
    body: "You have a new message from John.",
    read: false,
  },
  {
    id: "2",
    title: "Reminder",
    body: "Don't forget your meeting at 3 PM.",
    read: false,
  },
  {
    id: "3",
    title: "Update",
    body: "Your order has been shipped.",
    read: true,
  },
  {
    id: "4",
    title: "Alert",
    body: "Low battery. Please charge your device.",
    read: false,
  },
];

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View>
        <FlatList
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <ThemedText style={styles.notificationTitle}>
                {item.title}
              </ThemedText>
              <ThemedText style={styles.notificationBody}>
                {item.body}
              </ThemedText>
            </View>
          )}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: "#666",
  },
});
