import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

// Aptabase Analytics
import { init as initAptabase } from '@aptabase/react-native';

import { HardPaywall } from '@/components/HardPaywall';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Initialize Aptabase analytics on app start
const APTABASE_KEY = 'A-US-3185191607';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Main App Content
 * FREEMIUM MODE: All users can access all tabs immediately
 * Paywall code is commented out but preserved for future use
 */
function AppContent() {
  const colorScheme = useColorScheme();
  const { isPro, isInitialized, isSandbox } = useSubscription();
  
  // Initialize Aptabase on mount
  useEffect(() => {
    try {
      initAptabase(APTABASE_KEY);
      console.log('[Aptabase] Initialized with key:', APTABASE_KEY);
    } catch (error) {
      console.log('[Aptabase] Initialization error (non-fatal):', error);
    }
  }, []);
  
  // Track if user has dismissed paywall (only possible in sandbox/review mode)
  const [paywallDismissed, setPaywallDismissed] = useState(false);

  // =========================================================================
  // FREEMIUM MODE - PAYWALL DISABLED
  // =========================================================================
  // Uncomment the block below to re-enable hard paywall
  // =========================================================================
  
  /*
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
  */

  // FREEMIUM: Show app immediately to all users
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
 * RevenueCat still initializes to track downloads
 */
export default function RootLayout() {
  return (
    <SubscriptionProvider>
      <AppContent />
    </SubscriptionProvider>
  );
}
