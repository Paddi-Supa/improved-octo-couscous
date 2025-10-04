import AsyncStorage from '@react-native-async-storage/async-storage'; // Or import * as SecureStore from 'expo-secure-store';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import OnboardingScreen from '../components/OnboardingScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts, make any API calls you need to do here
        // For example, simulate a font load
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading time

        const onboardedStatus = await AsyncStorage.getItem('hasOnboarded');
        // If using SecureStore:
        // const onboardedStatus = await SecureStore.getItemAsync('hasOnboarded');
        setHasOnboarded(onboardedStatus === 'true');
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleFinishOnboarding = () => {
    setHasOnboarded(true);
  };

  if (!appIsReady || hasOnboarded === null) {
    return null; // Keep splash screen visible
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* You can define other routes here as well */}
    </Stack>
  );
}
