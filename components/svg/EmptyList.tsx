import React from "react";
import Svg, { Circle, G, Rect, Text } from "react-native-svg";

const EmptyListIcon = () => {
  return (
    <Svg width="200" height="200" viewBox="0 0 200 200">
      <G fill="none" stroke="#ccc" strokeWidth="2">
        {/* Outline of the list */}
        <Rect x="20" y="20" width="160" height="160" rx="10" stroke="#e0e0e0" />
        {/* List items */}
        <Rect x="30" y="40" width="140" height="20" rx="5" />
        <Rect x="30" y="80" width="140" height="20" rx="5" />
        <Rect x="30" y="120" width="140" height="20" rx="5" />
      </G>
      {/* Circles to represent empty items */}
      <G fill="#e0e0e0">
        <Circle cx="20" cy="50" r="8" />
        <Circle cx="20" cy="90" r="8" />
        <Circle cx="20" cy="130" r="8" />
      </G>
      {/* No Transactions Text */}
      <Text
        x="100"
        y="180"
        fontSize="16"
        textAnchor="middle"
        fill="#aaa"
        fontWeight="bold"
      >
        No Transactions
      </Text>
    </Svg>
  );
};

export default EmptyListIcon;
