import * as React from "react";
import Svg, { SvgProps, Rect, Path } from "react-native-svg";
const Money = (props: SvgProps) => (
  <Svg
    width={props.width ?? 36}
    height={props.height ?? 36}
    fill={props.fill ?? "none"}
    {...props}
  >
    <Rect width={36} height={36} fill="#EDF0FA" rx={6} />
    <Path
      stroke="#525BCE"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.778 14H6v14h25V14h-2.083m-5.556-1.4c.544.317 1.01.753 1.362 1.277a4.22 4.22 0 0 1 .528 3.616 4.209 4.209 0 0 1-.939 1.619c-.43.46-.957.818-1.544 1.045a4.136 4.136 0 0 1-3.613-.306 4.18 4.18 0 0 1-1.35-1.29M19.89 11.2a4.217 4.217 0 0 1-1.22 2.97 4.15 4.15 0 0 1-2.947 1.23 4.15 4.15 0 0 1-2.946-1.23 4.217 4.217 0 0 1-1.22-2.97 4.22 4.22 0 0 1 1.22-2.97A4.15 4.15 0 0 1 15.722 7a4.15 4.15 0 0 1 2.947 1.23 4.217 4.217 0 0 1 1.22 2.97Z"
    />
  </Svg>
);
export default Money;
