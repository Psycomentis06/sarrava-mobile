import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const Exchange = (props: SvgProps) => (
  <Svg
    width={props.width ?? 40}
    height={props.height ?? 41}
    fill={props.fill ?? "none"}
    {...props}
  >
    <Path
      fill="#0172D0"
      fillRule="evenodd"
      d="m22.03 25.858-2.228 4.752a.8.8 0 0 0 1.192.988l9.6-6.938a1 1 0 0 0-.584-1.81h-6.57l-.004.008H10v3h12.03Zm-3.61-10.216 2.228-4.752a.8.8 0 0 0-1.194-.988l-9.6 6.938a1 1 0 0 0 .586 1.81h6.57l.002-.008H30.44v-3H18.42ZM20 40.75c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20Z"
      clipRule="evenodd"
    />
  </Svg>
);
export default Exchange;
