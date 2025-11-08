import { SplashScreen, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // use SecureStore instead of AsyncStorage
import { onAuthStateChanged } from 'firebase/auth'; // ✅ added
import React, { useEffect, useState } from 'react';
import Animation from '../components/Animation'; // Restoring the Animation component import
import OnboardingScreen from '../components/OnboardingScreen';
import { auth } from '../firebaseConfig'; // ✅ added
// notifications removed per user request

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [userUID, setUserUID] = useState<string | null>(null); // ✅ added

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading time

  const onboardedStatus = await SecureStore.getItemAsync('hasOnboarded');
  setHasOnboarded(onboardedStatus === 'true');

        // ✅ Check stored UID (SecureStore)
        const storedUID = await SecureStore.getItemAsync('userUID');
        setUserUID(storedUID);

        // ✅ Also listen to Firebase auth state changes
        onAuthStateChanged(auth, (user) => {
          if (user) setUserUID(user.uid);
          else setUserUID(null);
        });
      
        // notifications integration removed for now
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleAnimationFinish = () => {
    setAnimationFinished(true);
  };

  const handleFinishOnboarding = async () => {
    await SecureStore.setItemAsync('hasOnboarded', 'true');
    setHasOnboarded(true);
  };

  // notifications removed — no listeners registered here

  if (!appIsReady || hasOnboarded === null) {
    return null; // Keep splash screen visible while we check onboarding status
  }

  if (!animationFinished) {
    return <Animation onAnimationFinish={handleAnimationFinish} />;
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onFinish={handleFinishOnboarding} />;
  }

  // ✅ If user not logged in → go to sign-in screen
  if (!userUID) {
    return (
      <Stack>
        <Stack.Screen name="(auth)/LoginScreen" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // ✅ If logged in → go to main tabs
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
    </Stack>
  );
}