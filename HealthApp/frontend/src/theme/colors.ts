import type { ThemeColors } from './types';

export const lightColors: ThemeColors = {
  background: {
    default: '#FFFFFF',
    secondary: '#F8F9FA',
  },
  card: '#F5F5F5',
  text: {
    default: '#000000',
    secondary: '#666666',
  },
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
  background: {
    default: '#121212',
    secondary: '#1E1E1E',
  },
  card: '#1E1E1E',
  text: {
    default: '#FFFFFF',
    secondary: '#AAAAAA',
  },
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