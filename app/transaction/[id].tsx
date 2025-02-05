import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemePalette } from "@/hooks/useThemePalette";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

function TransactionTabView() {
  const palette = useThemePalette();
  const { id } = useLocalSearchParams();
  return (
    <ThemedView style={{ padding: 5 }}>
      <View>
        <View style={{ padding: 10, gap: 10 }}>
          <ThemedText
            type="sm"
            style={{
              opacity: 0.7,
              marginHorizontal: 5,
            }}
          >
            الرمز التعريفي : {id}
          </ThemedText>

          <ThemedText>
            المبلغ:{" "}
            <ThemedText type="xl" weight="semi-bold">
              $320
            </ThemedText>
          </ThemedText>
          <ThemedText>
            التكلفة: <ThemedText>3.4%</ThemedText>
          </ThemedText>
          <ThemedText>
            الحالة:{" "}
            <ThemedText type="l" style={{ color: palette.error }}>
              فشل
            </ThemedText>
          </ThemedText>
          <ThemedText>
            تاريخ: <ThemedText>2024-05-22</ThemedText>
          </ThemedText>
        </View>
      </View>
      <ThemedButton style={{ marginTop: 10 }}>
        <ThemedText style={{ color: palette.background, textAlign: "center" }}>
          أستخراج ملف PDF
        </ThemedText>
      </ThemedButton>
    </ThemedView>
  );
}
function TransactionSenderTabView() {
  const palette = useThemePalette();
  return (
    <ThemedView style={{ padding: 5 }}>
      <View>
        <View style={{ padding: 10, gap: 10 }}>
          <ThemedText type="sm" style={{ opacity: 0.7 }}>
            المعرف: af33748a-3938-49f3
          </ThemedText>
          <ThemedText>نبيل ناصر</ThemedText>
          <ThemedText>naser.nabil23@mail.co</ThemedText>
          <ThemedText>21696150252+</ThemedText>
          <ThemedText>
            شارع الحبيب بورقيبة، حي الطيب المهيري، تونس العاصمة، تونس
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}
function TransactionRecieverTabView() {
  const palette = useThemePalette();
  return (
    <ThemedView style={{ padding: 5 }}>
      <View>
        <View style={{ padding: 10, gap: 10 }}>
          <ThemedText type="sm" style={{ opacity: 0.7 }}>
            المعرف: af33748a-3938-49f3
          </ThemedText>
          <ThemedText>نوري يعقوب</ThemedText>
          <ThemedText>jacob.yakoub@giml.ru</ThemedText>
          <ThemedText>213790920127+</ThemedText>
          <ThemedText>
            شارع محمد الخامس، حي بلوزداد، الجزائر العاصمة، الجزائر
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}
const renderTabBar = (props: any) => {
  const palette = useThemePalette();
  return (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: palette.tint }}
      style={{ backgroundColor: palette.accent }}
    />
  );
};

const renderScene = SceneMap({
  transaction: TransactionTabView,
  sender: TransactionSenderTabView,
  reciever: TransactionRecieverTabView,
});
const routes = [
  { key: "transaction", title: "المعاملة" },
  { key: "sender", title: "المرسل" },
  { key: "reciever", title: "المستقبل" },
];

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [index, setIndex] = useState(0);
  const layout = useWindowDimensions();
  const palette = useThemePalette();
  return (
    <>
      <Stack.Screen
        name="transaction-details"
        options={{ title: "تفاصيل المعاملة" }}
      />
      {/*
       */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width, height: layout.height }}
        renderTabBar={renderTabBar}
      />
    </>
  );
}
