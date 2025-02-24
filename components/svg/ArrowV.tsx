import * as React from "react";
import Svg, { SvgProps, Path, Mask, G, Rect } from "react-native-svg";
const ArrowV = (props: SvgProps) => (
  <Svg
    width={props.width ?? 48}
    height={props.height ?? 24}
    fill={props.fill ?? "none"}
    {...props}
  >
    <Path
      fill="#444"
      fillRule="evenodd"
      d="m13.414 19.172 6-6 1.414 1.414L12.414 23 4 14.586l1.414-1.414 6 6V1.586h2v17.586Z"
      clipRule="evenodd"
    />
    <Mask
      id="a"
      width={17}
      height={22}
      x={4}
      y={1}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="m13.414 19.172 6-6 1.414 1.414L12.414 23 4 14.586l1.414-1.414 6 6V1.586h2v17.586Z"
        clipRule="evenodd"
      />
    </Mask>
    <G mask="url(#a)">
      <Rect
        width={100}
        height={100}
        x={-38}
        y={62}
        fill="#3629B7"
        rx={6}
        transform="rotate(-90 -38 62)"
      />
    </G>
    <Path
      fill="#444"
      fillRule="evenodd"
      d="m34.586 4.828-6 6-1.414-1.414L35.586 1 44 9.414l-1.414 1.414-6-6v17.586h-2V4.828Z"
      clipRule="evenodd"
    />
    <Mask
      id="b"
      width={17}
      height={22}
      x={27}
      y={1}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="m34.586 4.828-6 6-1.414-1.414L35.586 1 44 9.414l-1.414 1.414-6-6v17.586h-2V4.828Z"
        clipRule="evenodd"
      />
    </Mask>
    <G mask="url(#b)">
      <Rect
        width={100}
        height={100}
        x={86}
        y={-38}
        fill="#FF4267"
        rx={6}
        transform="rotate(90 86 -38)"
      />
    </G>
  </Svg>
);
export default ArrowV;
