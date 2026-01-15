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
  const { isPro, isInitialized, isSandbox } = useSubscription();
  
  // Track if sandbox user dismissed paywall (for App Store review)
  const [sandboxDismissed, setSandboxDismissed] = useState(false);

  const handleSandboxDismiss = useCallback(() => {
    setSandboxDismissed(true);
  }, []);

  // Show hard paywall if:
  // - User is not Pro AND
  // - User hasn't dismissed via sandbox mode (App Store reviewer)
  const showPaywall = isInitialized && !isPro && !sandboxDismissed;

  if (showPaywall) {
    return (
      <HardPaywall 
        onSandboxDismiss={handleSandboxDismiss}
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
