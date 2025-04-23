import * as React from "react";
import Svg, { G, Path, SvgProps } from "react-native-svg";
const Building = (props: SvgProps) => (
  <Svg
    width={props.width ?? 24}
    height={props.height ?? 24}
    {...props}
    viewBox="0 0 64 64"
  >
    <G fill="#231F20">
      <Path d="M18 10v54h9V53a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v11h9V4c0-2.211-1.789-4-4-4H22c-2.211 0-4 1.789-4 4zm16-1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM24 9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
      <Path d="M26 30h2v2h-2zm0 10h2v2h-2zm3 14h6v10h-6zM8 50h2v2H8zm18-40h2v2h-2zm0 10h2v2h-2zm10 0h2v2h-2zm0-10h2v2h-2zm0 20h2v2h-2zm0 10h2v2h-2zM8 40h2v2H8z" />
      <Path d="M16 10H4c-2.211 0-4 1.789-4 4v46c0 2.211 1.789 4 4 4h12zm-4 43a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zm0-10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zm0-10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zm-1-9H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1m43 26h2v2h-2zm0-10h2v2h-2zm0-10h2v2h-2z" />
      <Path d="M60 20H48v44h12c2.211 0 4-1.789 4-4V24c0-2.211-1.789-4-4-4m-2 33a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zm0-10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zm0-10a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1zM8 30h2v2H8zm0-10h2v2H8z" />
    </G>
  </Svg>
);
export default Building;
