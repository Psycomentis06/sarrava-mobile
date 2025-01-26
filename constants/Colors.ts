/**
 * Default color palette for Android and Web taken from https://materialui.co/colors
 */
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    accent: '#2196F3',
    warn: '#FF9800',
    sucess: '#00897B',
    error: '#E53935'
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    accent: '#03A9F4',
    warn: '#FFC107',
    sucess: '#009688',
    error: '#F44336'
  },
};
