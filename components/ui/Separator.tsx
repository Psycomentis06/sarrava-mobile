import { View } from "react-native";

export default function Separator() {
  return (
    <View
      style={{
        height: 5,
        borderTopColor: "rgba(0,0,0,0.5)",
        borderTopWidth: 0.75,
        borderStyle: "dashed",
        marginVertical: 20,
      }}
    />
  );
}
