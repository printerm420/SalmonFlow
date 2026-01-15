/**
 * Pro Feature Hook
 * 
 * A convenient hook for gating Pro features throughout the app.
 * Provides easy access to subscription status and paywall triggering.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSubscription, useIsPro } from '@/contexts/SubscriptionContext';

interface UseProFeatureOptions {
  /**
   * Feature name for display in alerts
   */
  featureName?: string;
  
  /**
   * Custom message when user tries to access Pro feature
   */
  upgradeMessage?: string;
  
  /**
   * Callback when user successfully upgrades
   */
  onUpgrade?: () => void;
}

interface UseProFeatureReturn {
  /**
   * Whether user has Pro access
   */
  isPro: boolean;
  
  /**
   * Whether subscription is still loading
   */
  isLoading: boolean;
  
  /**
   * Whether paywall is currently visible
   */
  showPaywall: boolean;
  
  /**
   * Open the paywall modal
   */
  openPaywall: () => void;
  
  /**
   * Close the paywall modal
   */
  closePaywall: () => void;
  
  /**
   * Handle paywall success
   */
  handleSuccess: () => void;
  
  /**
   * Guard function - runs action if Pro, shows paywall otherwise
   * Returns true if action was executed, false if paywall was shown
   */
  guardAction: (action: () => void) => boolean;
  
  /**
   * Async guard function for async actions
   */
  guardActionAsync: (action: () => Promise<void>) => Promise<boolean>;
}

/**
 * Hook for easily gating Pro features
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isPro, guardAction, showPaywall, closePaywall, handleSuccess } = useProFeature({
 *     featureName: 'Extended Forecast',
 *   });
 * 
 *   const handlePress = () => {
 *     guardAction(() => {
 *       // This only runs if user is Pro
 *       navigation.navigate('ExtendedForecast');
 *     });
 *   };
 * 
 *   return (
 *     <>
 *       <Button onPress={handlePress}>View Extended Forecast</Button>
 *       <CustomPaywall 
 *         visible={showPaywall} 
 *         onClose={closePaywall} 
 *         onSuccess={handleSuccess} 
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useProFeature(options: UseProFeatureOptions = {}): UseProFeatureReturn {
  const { 
    featureName = 'This feature', 
    upgradeMessage,
    onUpgrade,
  } = options;
  
  const isPro = useIsPro();
  const { isLoading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const openPaywall = useCallback(() => {
    setShowPaywall(true);
  }, []);

  const closePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  const handleSuccess = useCallback(() => {
    setShowPaywall(false);
    onUpgrade?.();
    Alert.alert(
      'Welcome to Pro!',
      `You now have access to ${featureName} and all other premium features.`
    );
  }, [featureName, onUpgrade]);

  const guardAction = useCallback((action: () => void): boolean => {
    if (isPro) {
      action();
      return true;
    }
    
    // Show upgrade prompt or paywall
    Alert.alert(
      'Pro Feature',
      upgradeMessage || `${featureName} requires SalmonFlow Pro. Upgrade now to unlock this feature!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: openPaywall },
      ]
    );
    return false;
  }, [isPro, featureName, upgradeMessage, openPaywall]);

  const guardActionAsync = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    if (isPro) {
      await action();
      return true;
    }
    
    Alert.alert(
      'Pro Feature',
      upgradeMessage || `${featureName} requires SalmonFlow Pro. Upgrade now to unlock this feature!`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: openPaywall },
      ]
    );
    return false;
  }, [isPro, featureName, upgradeMessage, openPaywall]);

  return {
    isPro,
    isLoading,
    showPaywall,
    openPaywall,
    closePaywall,
    handleSuccess,
    guardAction,
    guardActionAsync,
  };
}

/**
 * Simple hook to check Pro status
 * Re-exported for convenience
 */
export { useIsPro } from '@/contexts/SubscriptionContext';
