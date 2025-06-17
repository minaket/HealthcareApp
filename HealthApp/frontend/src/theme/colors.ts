import type { ThemeColors } from './types';

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#000000',
  border: '#E0E0E0',
  primary: '#1976D2',
  secondary: '#DC004E',
  accent: '#FFC107',
  error: '#D32F2F',
  warning: '#FFA000',
  success: '#388E3C',
  info: '#1976D2',
};

export const darkColors: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  border: '#333333',
  primary: '#90CAF9',
  secondary: '#F48FB1',
  accent: '#FFE082',
  error: '#EF5350',
  warning: '#FFB74D',
  success: '#81C784',
  info: '#64B5F6',
};

export const colors = lightColors;

export type ColorKeys = keyof typeof colors;
export type ColorValue = typeof colors[ColorKeys]; 