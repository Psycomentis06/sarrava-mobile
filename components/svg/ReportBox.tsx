import * as React from "react";
import Svg, { SvgProps, G, Path, Defs, ClipPath } from "react-native-svg";
const ReportBox = (props: SvgProps) => (
  <Svg
    width={props.width ?? 42}
    height={props.height ?? 42}
    fill={props.fill ?? "none"}
    {...props}
  >
    <G clipPath="url(#a)">
      <Path
        fill="#FFCE4F"
        d="M37.333 0H4.667A4.68 4.68 0 0 0 0 4.667v32.666A4.68 4.68 0 0 0 4.667 42h32.666A4.68 4.68 0 0 0 42 37.333V4.667A4.68 4.68 0 0 0 37.333 0ZM14 32.667H9.333V16.333H14v16.334Zm9.333 0h-4.666V9.333h4.666v23.334Zm9.334 0H28v-9.334h4.667v9.334Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h42v42H0z" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default ReportBox;
