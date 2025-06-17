import { spacing, layout } from './spacing';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  layout: typeof layout;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
} 