import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { store } from './store';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { StatusBar } from 'react-native';
import { useTheme } from './theme/ThemeProvider';

// Enable screens for better navigation performance
enableScreens();

const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <>
      <StatusBar
        barStyle={theme.colors.background.default === '#1C1C1E' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <RootNavigator />
    </>
  );
};

const App = () => {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
};

export default App; 