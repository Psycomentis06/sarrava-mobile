import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
const LocationPin = (props: SvgProps) => (
  <Svg
    width={props.width ?? 24}
    height={props.height ?? 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M12 21c3.5-3.6 7-6.824 7-10.8S15.866 3 12 3s-7 3.224-7 7.2 3.5 7.2 7 10.8"
      stroke="#000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
      stroke="#000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default LocationPin;
