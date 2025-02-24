import * as React from "react";
import Svg, { SvgProps, Rect, Path } from "react-native-svg";
const ReciptTax = (props: SvgProps) => (
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
      d="m14 20.666 9-8"
    />
    <Path
      fill="#525BCE"
      stroke="#525BCE"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14.75 14c.414 0 .75-.299.75-.667 0-.368-.336-.667-.75-.667s-.75.299-.75.667c0 .368.336.667.75.667Zm7.5 6.667c.414 0 .75-.299.75-.667 0-.368-.336-.667-.75-.667s-.75.299-.75.667c0 .368.336.667.75.667Z"
    />
    <Path
      stroke="#525BCE"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 30V8.667c0-.708.316-1.386.879-1.886C9.44 6.281 10.204 6 11 6h15c.796 0 1.559.28 2.121.781.563.5.879 1.178.879 1.886V30l-4.5-2.667-3 2.667-3-2.667-3 2.667-3-2.667L8 30Z"
    />
  </Svg>
);
export default ReciptTax;
