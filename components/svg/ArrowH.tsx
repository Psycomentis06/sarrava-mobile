import * as React from "react";
import Svg, { SvgProps, Path, Mask, G, Rect } from "react-native-svg";
const ArrowH = (props: SvgProps) => (
  <Svg
    width={props.width ?? 23}
    height={props.height ?? 20}
    fill={props.fill ?? "none"}
    {...props}
  >
    <Path
      fill="#444"
      fillRule="evenodd"
      d="m3.351 10.691 4.164-4.164-.981-.981-5.84 5.839 5.84 5.84.98-.982-4.163-4.164h12.204V10.69H3.351Z"
      clipRule="evenodd"
    />
    <Mask
      id="a"
      width={16}
      height={13}
      x={0}
      y={5}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="m3.351 10.691 4.164-4.164-.981-.981-5.84 5.839 5.84 5.84.98-.982-4.163-4.164h12.204V10.69H3.351Z"
        clipRule="evenodd"
      />
    </Mask>
    <G mask="url(#a)">
      <Rect
        width={69.397}
        height={69.397}
        fill="#3629B7"
        rx={6}
        transform="matrix(1 0 0 -1 -26.371 46.37)"
      />
    </G>
    <Path
      fill="#444"
      fillRule="evenodd"
      d="m19.649 9.481-4.164 4.164.982.982 5.839-5.84-5.84-5.839-.98.982 4.163 4.163H7.445v1.388h12.204Z"
      clipRule="evenodd"
    />
    <Mask
      id="b"
      width={16}
      height={13}
      x={7}
      y={2}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: "luminance",
      }}
    >
      <Path
        fill="#fff"
        fillRule="evenodd"
        d="m19.649 9.481-4.164 4.164.982.982 5.839-5.84-5.84-5.839-.98.982 4.163 4.163H7.445v1.388h12.204Z"
        clipRule="evenodd"
      />
    </Mask>
    <G mask="url(#b)">
      <Rect
        width={69.397}
        height={69.397}
        fill="#2CAB91"
        rx={6}
        transform="matrix(-1 0 0 1 49.371 -26.198)"
      />
    </G>
  </Svg>
);
export default ArrowH;
