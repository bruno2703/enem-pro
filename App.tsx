import React, {useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider, MD3LightTheme} from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen, {isOnboardingDone} from './src/screens/OnboardingScreen';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    secondary: '#FF8F00',
    background: '#FAFAFA',
  },
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        {showOnboarding ? (
          <OnboardingScreen onFinish={() => setShowOnboarding(false)} />
        ) : (
          <AppNavigator />
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
