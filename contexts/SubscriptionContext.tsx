/**
 * Subscription Context
 * Manages RevenueCat integration and subscription state
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesOffering,
    PurchasesPackage,
} from 'react-native-purchases';

// ============================================================================
// CONFIGURATION
// ============================================================================

// RevenueCat API Keys
const REVENUECAT_IOS_API_KEY = 'appl_oanrZIXGSLFVfgOfLPdTPJMcgeL';
const REVENUECAT_ANDROID_API_KEY = 'goog_PyZYFViqyaRlMIBGhhroEMGmKVT'; // Replace with your actual Android API key from RevenueCat

// Your entitlement ID from RevenueCat dashboard
const ENTITLEMENT_ID = 'Pro';

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionContextType {
  // State
  isPro: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isSandbox: boolean;
  error: string | null;
  
  // Customer info
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  
  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
}

interface PackagesContextType {
  yearly: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);
const PackagesContext = createContext<PackagesContextType | undefined>(undefined);

// ============================================================================
// SANDBOX DETECTION
// ============================================================================

/**
 * Detect if we're running in sandbox mode (for App Store reviewers)
 * This is crucial for showing/hiding the close button on the paywall
 */
const detectSandboxMode = async (customerInfo: CustomerInfo | null): Promise<boolean> => {
  // Always sandbox in development
  if (__DEV__) {
    console.log('[Sandbox] Development mode detected');
    return true;
  }

  if (!customerInfo) {
    return false;
  }

  // Check 1: Management URL contains "sandbox"
  if (customerInfo.managementURL?.toLowerCase().includes('sandbox')) {
    console.log('[Sandbox] Detected via managementURL');
    return true;
  }

  // Check 2: Any entitlement has isSandbox = true
  const allEntitlements = {
    ...customerInfo.entitlements.all,
    ...customerInfo.entitlements.active,
  };

  for (const [key, entitlement] of Object.entries(allEntitlements)) {
    if (entitlement.isSandbox) {
      console.log(`[Sandbox] Detected via entitlement: ${key}`);
      return true;
    }
  }

  console.log('[Sandbox] Production mode detected');
  return false;
};

// ============================================================================
// PROVIDER
// ============================================================================

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSandbox, setIsSandbox] = useState(__DEV__); // Default to dev mode
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  // Package states
  const [yearly, setYearly] = useState<PurchasesPackage | null>(null);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [lifetime, setLifetime] = useState<PurchasesPackage | null>(null);

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log('[RevenueCat] Initializing...');
        
        // Set log level for debugging
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

        // Configure RevenueCat for iOS and Android
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
          console.log('[RevenueCat] Configured with iOS API key');
        } else if (Platform.OS === 'android') {
          await Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
          console.log('[RevenueCat] Configured with Android API key');
        } else {
          console.log('[RevenueCat] Platform not supported');
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Sync purchases (helps detect sandbox mode)
        try {
          await Purchases.syncPurchases();
          console.log('[RevenueCat] Purchases synced');
        } catch (syncError) {
          console.log('[RevenueCat] Sync error (non-fatal):', syncError);
        }

        // Get customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        console.log('[RevenueCat] Customer info retrieved');

        // Check sandbox mode
        const sandbox = await detectSandboxMode(info);
        setIsSandbox(sandbox);
        console.log(`[RevenueCat] Sandbox mode: ${sandbox}`);

        // Check if user has active entitlement
        const hasEntitlement = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsPro(hasEntitlement);
        console.log(`[RevenueCat] Has entitlement "${ENTITLEMENT_ID}": ${hasEntitlement}`);

        // Get offerings
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings retrieved:', Object.keys(offerings.all));

        if (offerings.current) {
          setCurrentOffering(offerings.current);
          console.log('[RevenueCat] Current offering:', offerings.current.identifier);
          console.log('[RevenueCat] Available packages:', offerings.current.availablePackages.map(p => p.identifier));

          // Map packages
          for (const pkg of offerings.current.availablePackages) {
            console.log(`[RevenueCat] Package: ${pkg.identifier}, Product: ${pkg.product.identifier}, Price: ${pkg.product.priceString}`);
            
            switch (pkg.packageType) {
              case 'ANNUAL':
                setYearly(pkg);
                break;
              case 'MONTHLY':
                setMonthly(pkg);
                break;
              case 'LIFETIME':
                setLifetime(pkg);
                break;
              default:
                // Also check by identifier for custom packages
                if (pkg.identifier === '$rc_annual' || pkg.identifier.toLowerCase().includes('year')) {
                  setYearly(pkg);
                } else if (pkg.identifier === '$rc_monthly' || pkg.identifier.toLowerCase().includes('month')) {
                  setMonthly(pkg);
                } else if (pkg.identifier === '$rc_lifetime' || pkg.identifier.toLowerCase().includes('lifetime')) {
                  setLifetime(pkg);
                }
            }
          }
        } else {
          // FREEMIUM MODE: No error if products unavailable - app works without purchases
          console.log('[RevenueCat] No current offering available (freemium mode - this is OK)');
          // Don't set error in freemium mode - app should still work
          // setError('No subscription plans available. Please try again later.');
        }

        setIsInitialized(true);
        setError(null);
      } catch (err) {
        // FREEMIUM MODE: Don't crash if RevenueCat fails - app works without it
        console.log('[RevenueCat] Initialization error (non-fatal in freemium mode):', err);
        // Don't set error in freemium mode - app should still work
        // setError(err instanceof Error ? err.message : 'Failed to initialize subscriptions');
        setIsInitialized(true); // Still mark as initialized so app can load
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();

    // Listen for customer info updates
    const customerInfoListener = (info: CustomerInfo) => {
      console.log('[RevenueCat] Customer info updated');
      setCustomerInfo(info);
      const hasEntitlement = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPro(hasEntitlement);
      
      // Re-check sandbox mode
      detectSandboxMode(info).then(setIsSandbox);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`[RevenueCat] Purchasing package: ${pkg.identifier}`);

      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);

      // Check sandbox mode after purchase
      const sandbox = await detectSandboxMode(newInfo);
      setIsSandbox(sandbox);

      const hasEntitlement = typeof newInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPro(hasEntitlement);

      if (hasEntitlement) {
        console.log('[RevenueCat] Purchase successful!');
        return true;
      } else {
        console.log('[RevenueCat] Purchase completed but no entitlement found');
        setError('Purchase completed but subscription not activated. Please contact support.');
        return false;
      }
    } catch (err: any) {
      // Check if user cancelled
      if (err.userCancelled) {
        console.log('[RevenueCat] User cancelled purchase');
        return false;
      }
      console.error('[RevenueCat] Purchase error:', err);
      setError(err.message || 'Purchase failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[RevenueCat] Restoring purchases...');

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      // Check sandbox mode after restore
      const sandbox = await detectSandboxMode(info);
      setIsSandbox(sandbox);

      const hasEntitlement = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPro(hasEntitlement);

      console.log(`[RevenueCat] Restore complete. Has entitlement: ${hasEntitlement}`);
      return hasEntitlement;
    } catch (err: any) {
      console.error('[RevenueCat] Restore error:', err);
      setError(err.message || 'Failed to restore purchases.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual subscription check
  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      const sandbox = await detectSandboxMode(info);
      setIsSandbox(sandbox);
      
      const hasEntitlement = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPro(hasEntitlement);
    } catch (err) {
      console.error('[RevenueCat] Check subscription error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const subscriptionValue: SubscriptionContextType = {
    isPro,
    isLoading,
    isInitialized,
    isSandbox,
    error,
    customerInfo,
    currentOffering,
    purchase,
    restore,
    checkSubscription,
  };

  const packagesValue: PackagesContextType = {
    yearly,
    monthly,
    lifetime,
  };

  return (
    <SubscriptionContext.Provider value={subscriptionValue}>
      <PackagesContext.Provider value={packagesValue}>
        {children}
      </PackagesContext.Provider>
    </SubscriptionContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function usePackages(): PackagesContextType {
  const context = useContext(PackagesContext);
  if (context === undefined) {
    throw new Error('usePackages must be used within a SubscriptionProvider');
  }
  return context;
}
