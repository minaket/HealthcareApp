import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME, STORAGE_KEYS } from '../config/constants';
import { lightTheme, darkTheme, Theme } from './index';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  toggleTheme: () => void;
  getThemeStyles: (isDark: boolean) => Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<ThemeContextType>;
}> = ({ children, value }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(value?.isDarkMode ?? false);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const isDark = isDarkMode;

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme) {
          setIsDarkMode(savedTheme === THEME.DARK);
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsDarkMode(systemColorScheme === 'dark');
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
    getThemeStyles: (isDark) => isDark ? darkTheme : lightTheme,
    ...value,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; 