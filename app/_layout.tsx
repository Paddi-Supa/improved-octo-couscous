import { SplashScreen, Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // use SecureStore instead of AsyncStorage
import * as Updates from 'expo-updates';
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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate loading time

  const onboardedStatus = await SecureStore.getItemAsync('hasOnboarded');
  setHasOnboarded(onboardedStatus === 'true');

        // ✅ Check stored UID (SecureStore) — keep as a convenience but DO NOT rely on it
        // for routing decisions. We'll still listen to Firebase auth state for a reliable result.
        const _storedUID = await SecureStore.getItemAsync('userUID');
        // don't setUserUID here as it may be stale; let the auth listener provide the truth

        // ✅ Listen to Firebase auth state changes and mark when we've received the initial value
        onAuthStateChanged(auth, (user) => {
          if (user) setUserUID(user.uid);
          else setUserUID(null);
          setAuthChecked(true);
        });
        
        // --- OTA update check: optionally fetch and apply updates immediately on cold start
        // This forces the app to download and reload if a new update is available.
        // Be aware: this will delay first render until fetch completes (or reload happens).
        try {
          if (Updates.checkForUpdateAsync) {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
              console.log('OTA update available — fetching now');

              // helper to add a timeout to a promise (non-generic to avoid TSX parsing issues)
              const withTimeout = (p: Promise<any>, ms: number): Promise<{ timedOut: true } | { timedOut: false; res: any }> => {
                return new Promise((resolve, reject) => {
                  let done = false;
                  const t = setTimeout(() => { if (!done) { done = true; resolve({ timedOut: true }); } }, ms);
                  p.then((res: any) => { if (!done) { done = true; clearTimeout(t); resolve({ timedOut: false, res }); } }).catch((err: any) => { if (!done) { done = true; clearTimeout(t); reject(err); } });
                });
              };

              // Try to fetch the update but give up after 30s and proceed with the cached bundle
              const FETCH_TIMEOUT_MS = 30 * 1000;
              try {
                const fetchResult = await withTimeout(Updates.fetchUpdateAsync(), FETCH_TIMEOUT_MS);
                if (fetchResult && fetchResult.timedOut) {
                  console.warn('Update fetch timed out — proceeding with cached bundle and scheduling background fetch');
                  // schedule a background fetch that won't block the UI
                  (async () => {
                    try {
                      await Updates.fetchUpdateAsync();
                      console.log('Background update fetched successfully');
                    } catch (bgErr) {
                      console.warn('Background fetch failed:', bgErr);
                    }
                  })();
                } else {
                  // fetched successfully — apply immediately
                  await Updates.reloadAsync();
                }
              } catch (fetchErr) {
                console.warn('Update fetch failed:', fetchErr, '— proceeding with cached bundle');
              }
            }
          }
        } catch (e) {
          console.warn('Update check failed:', e);
        }
      
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

  // Wait for app readiness, onboarding check and auth resolution before rendering
  // Debug logs to ensure routing decisions are correct during testing
  console.log('[RootLayout] render states:', { appIsReady, hasOnboarded, authChecked, userUID });

  if (!appIsReady || hasOnboarded === null || !authChecked) {
    return null; // Keep splash screen visible until we know the auth state
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/LoginScreen" />
      </Stack>
    );
  }

  // ✅ If logged in → go to main tabs
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}