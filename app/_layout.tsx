import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import 'react-native-reanimated';

import { HardPaywall } from '@/components/HardPaywall';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Main App Content
 * Only shown after user subscribes (or in sandbox mode)
 */
function AppContent() {
  const colorScheme = useColorScheme();
  const { isPro, isInitialized, isSandbox } = useSubscription();
  
  // Track if user has dismissed paywall (only possible in sandbox/review mode)
  const [paywallDismissed, setPaywallDismissed] = useState(false);

  // Show paywall if:
  // 1. Not initialized yet (paywall shows loading)
  // 2. Not Pro AND not dismissed (or can't be dismissed in production)
  const shouldShowPaywall = !isInitialized || (!isPro && !paywallDismissed);

  // Handle successful subscription
  const handleSubscribed = () => {
    // User subscribed - paywall will hide automatically via isPro
    console.log('[App] User subscribed successfully');
  };

  // Handle paywall dismiss (only available in sandbox mode)
  const handlePaywallDismiss = () => {
    // This can only be triggered in sandbox/review mode
    console.log('[App] Paywall dismissed (sandbox mode)');
    setPaywallDismissed(true);
  };

  // If should show paywall, render it
  if (shouldShowPaywall) {
    return (
      <HardPaywall
        onSubscribed={handleSubscribed}
        onDismiss={handlePaywallDismiss}
      />
    );
  }

  // User is subscribed (or dismissed in sandbox mode) - show app
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

/**
 * Root Layout
 * Wraps the entire app with SubscriptionProvider
 */
export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <AppContent />
    </SubscriptionProvider>
  );
}
