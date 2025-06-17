import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';
import type { Theme, ThemeColors } from './types';

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

// Theme type that includes all theme values
export const lightTheme: Theme = {
  colors: {
    ...lightColors,
    background: lightColors.background,
    text: lightColors.text,
  },
  spacing,
  layout,
  borderRadius,
};

export const darkTheme: Theme = {
  colors: {
    ...darkColors,
    background: darkColors.background,
    text: darkColors.text,
  },
  spacing,
  layout,
  borderRadius,
};

// Re-export specific members to avoid conflicts
export { lightColors, darkColors } from './colors';
export { typography } from './typography';
export { spacing, layout } from './spacing';
export type { ThemeColors }; 