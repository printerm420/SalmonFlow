import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useState, useCallback } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { HardPaywall } from '@/components/HardPaywall';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Inner layout that has access to subscription context
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isPro, isInitialized } = useSubscription();
  
  // Track if user dismissed paywall (when close button is shown via RevenueCat metadata)
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Show hard paywall if:
  // - User is not Pro AND
  // - User hasn't dismissed the paywall
  const showPaywall = isInitialized && !isPro && !dismissed;

  if (showPaywall) {
    return (
      <HardPaywall 
        onDismiss={handleDismiss}
      />
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <RootLayoutContent />
    </SubscriptionProvider>
  );
}
