function _hexToRgb(hex: string): number[] {
  if (!hex.startsWith("#")) {
    throw new Error(`Invalid hex value '${hex}'`);
  }
  let r: number, g: number, b: number;
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    r = parseInt(hex[0], 16);
    g = parseInt(hex[1], 16);
    b = parseInt(hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex[0] + hex[1], 16);
    g = parseInt(hex[2] + hex[3], 16);
    b = parseInt(hex[4] + hex[5], 16);
  } else {
    throw new Error(`Invalid hex value length ${hex}`);
  }
  return [r, g, b];
}
export function hexToRgb(hex: string): string {
  const [r, g, b] = _hexToRgb(hex);
  return `rgb(${r},${g},${b})`;
}

export function hexToRgba(hex: string, alpha: number) {
  const [r, g, b] = _hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
