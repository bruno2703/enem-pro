import React, {useState, useCallback, createContext, useContext} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme, MD3DarkTheme} from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen, {isOnboardingDone} from './src/screens/OnboardingScreen';
import {getThemeMode, setThemeMode, isDarkMode, ThemeMode} from './src/services/themeService';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    secondary: '#FF8F00',
    background: '#FAFAFA',
    surface: '#FFFFFF',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    secondary: '#FFB74D',
    background: '#121212',
    surface: '#1E1E1E',
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  dark: boolean;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'claro',
  dark: false,
  setMode: () => {},
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());
  const [mode, setModeState] = useState<ThemeMode>(getThemeMode());
  const dark = isDarkMode(mode);

  const setMode = useCallback((m: ThemeMode) => {
    setThemeMode(m);
    setModeState(m);
  }, []);

  const theme = dark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{mode, dark, setMode}}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle={dark ? 'light-content' : 'dark-content'}
            backgroundColor={dark ? '#121212' : '#FAFAFA'}
          />
          {showOnboarding ? (
            <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
          ) : (
            <AppNavigator />
          )}
        </PaperProvider>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}
