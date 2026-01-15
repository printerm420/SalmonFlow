/**
 * Subscription Context Provider
 * 
 * Provides subscription state management throughout the app using RevenueCat.
 * Handles entitlement checking, customer info, and purchase state.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import {
  initializeRevenueCat,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  ENTITLEMENT_ID,
  getExpirationDate,
  getManagementURL,
} from '@/services/revenuecat';

interface SubscriptionState {
  // Initialization state
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Subscription state
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  
  // Subscription details
  expirationDate: Date | null;
  managementURL: string | null;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime' | null;
  
  // Sandbox detection (for App Store review)
  isSandbox: boolean;
  
  // Actions
  refreshCustomerInfo: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const defaultState: SubscriptionState = {
  isInitialized: false,
  isLoading: true,
  error: null,
  isPro: false,
  customerInfo: null,
  currentOffering: null,
  expirationDate: null,
  managementURL: null,
  subscriptionType: null,
  isSandbox: false,
  refreshCustomerInfo: async () => {},
  purchase: async () => false,
  restore: async () => false,
};

const SubscriptionContext = createContext<SubscriptionState>(defaultState);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

  // Derive subscription state from customer info
  const isPro = useMemo(() => {
    if (!customerInfo) return false;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement !== undefined && entitlement.isActive;
  }, [customerInfo]);

  const expirationDate = useMemo(() => {
    if (!customerInfo) return null;
    return getExpirationDate(customerInfo);
  }, [customerInfo]);

  const managementURL = useMemo(() => {
    if (!customerInfo) return null;
    return getManagementURL(customerInfo);
  }, [customerInfo]);

  const subscriptionType = useMemo((): 'monthly' | 'yearly' | 'lifetime' | null => {
    if (!customerInfo) return null;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return null;
    
    const productId = entitlement.productIdentifier;
    if (productId.includes('monthly')) return 'monthly';
    if (productId.includes('yearly') || productId.includes('annual')) return 'yearly';
    if (productId.includes('lifetime')) return 'lifetime';
    
    return null;
  }, [customerInfo]);

  // Detect sandbox mode (App Store review uses sandbox)
  // This allows showing a close button ONLY during App Store review
  const isSandbox = useMemo(() => {
    if (!customerInfo) return false;
    // Check if any active entitlement is from sandbox
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    return activeEntitlements.some(ent => ent.isSandbox);
  }, [customerInfo]);

  // Initialize RevenueCat on mount
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize SDK
        await initializeRevenueCat();

        // Fetch initial customer info and offerings in parallel
        const [info, offering] = await Promise.all([
          getCustomerInfo(),
          getOfferings(),
        ]);

        if (isMounted) {
          setCustomerInfo(info);
          setCurrentOffering(offering);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('[SubscriptionContext] Initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize subscriptions');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    // Set up customer info listener for real-time updates
    const customerInfoListener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log('[SubscriptionContext] Customer info updated');
      if (isMounted) {
        setCustomerInfo(info);
      }
    });

    return () => {
      isMounted = false;
      customerInfoListener.remove();
    };
  }, []);

  // Refresh customer info manually
  const refreshCustomerInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error('[SubscriptionContext] Refresh error:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription info');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await purchasePackage(pkg);
      setCustomerInfo(info);
      
      // Check if purchase granted the entitlement
      const entitlement = info.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (err: any) {
      if (err.message === 'PURCHASE_CANCELLED') {
        // User cancelled - not an error
        return false;
      }
      console.error('[SubscriptionContext] Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Purchase failed');
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
      const info = await restorePurchases();
      setCustomerInfo(info);
      
      // Check if restore found the entitlement
      const entitlement = info.entitlements.active[ENTITLEMENT_ID];
      return entitlement !== undefined && entitlement.isActive;
    } catch (err) {
      console.error('[SubscriptionContext] Restore error:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<SubscriptionState>(() => ({
    isInitialized,
    isLoading,
    error,
    isPro,
    customerInfo,
    currentOffering,
    expirationDate,
    managementURL,
    subscriptionType,
    isSandbox,
    refreshCustomerInfo,
    purchase,
    restore,
  }), [
    isInitialized,
    isLoading,
    error,
    isPro,
    customerInfo,
    currentOffering,
    expirationDate,
    managementURL,
    subscriptionType,
    isSandbox,
    refreshCustomerInfo,
    purchase,
    restore,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription state and actions
 */
export function useSubscription(): SubscriptionState {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
}

/**
 * Hook to check if user has Pro access
 * Returns a simple boolean for quick checks
 */
export function useIsPro(): boolean {
  const { isPro } = useSubscription();
  return isPro;
}

/**
 * Hook to get available packages for purchase
 */
export function usePackages() {
  const { currentOffering, isLoading } = useSubscription();
  
  return useMemo(() => ({
    isLoading,
    monthly: currentOffering?.monthly ?? null,
    yearly: currentOffering?.annual ?? null,
    lifetime: currentOffering?.lifetime ?? null,
    allPackages: currentOffering?.availablePackages ?? [],
  }), [currentOffering, isLoading]);
}
