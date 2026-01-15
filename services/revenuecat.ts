/**
 * RevenueCat Service Configuration
 * 
 * This module handles the initialization and configuration of RevenueCat SDK
 * for managing in-app subscriptions and purchases.
 * 
 * Products:
 * - monthly: Monthly subscription
 * - yearly: Yearly subscription
 * - lifetime: Lifetime (one-time) purchase
 * 
 * Entitlement: "Viral Apps Pro"
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';

// RevenueCat API Keys
const REVENUECAT_API_KEY = 'test_OJGhrufFPhpTYqIsEgGfJftKcJD';

// Entitlement identifier - matches your RevenueCat dashboard
export const ENTITLEMENT_ID = 'Viral Apps Pro';

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

/**
 * Initialize RevenueCat SDK
 * Call this early in your app lifecycle (e.g., in the root layout)
 */
export async function initializeRevenueCat(): Promise<void> {
  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with API key
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    console.log('[RevenueCat] SDK initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    throw error;
  }
}

/**
 * Get current customer info
 * Contains subscription status, entitlements, and purchase history
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error fetching customer info:', error);
    throw error;
  }
}

/**
 * Check if user has active "Viral Apps Pro" entitlement
 */
export async function checkProEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    return entitlement !== undefined && entitlement.isActive;
  } catch (error) {
    console.error('[RevenueCat] Error checking entitlement:', error);
    return false;
  }
}

/**
 * Get entitlement details for "Viral Apps Pro"
 */
export async function getProEntitlementInfo(): Promise<PurchasesEntitlementInfo | null> {
  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] ?? null;
  } catch (error) {
    console.error('[RevenueCat] Error getting entitlement info:', error);
    return null;
  }
}

/**
 * Get available offerings (product packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current !== null) {
      console.log('[RevenueCat] Current offering:', offerings.current.identifier);
      return offerings.current;
    }
    
    console.warn('[RevenueCat] No current offering available');
    return null;
  } catch (error) {
    console.error('[RevenueCat] Error fetching offerings:', error);
    throw error;
  }
}

/**
 * Purchase a specific package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log('[RevenueCat] Purchase successful');
    return customerInfo;
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      throw new Error('PURCHASE_CANCELLED');
    }
    
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
}

/**
 * Restore previous purchases
 * Useful for users who reinstalled the app or switched devices
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored successfully');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    throw error;
  }
}

/**
 * Identify a user (for syncing across devices)
 * Call this after user login
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User identified:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error identifying user:', error);
    throw error;
  }
}

/**
 * Log out user (reset to anonymous)
 * Call this after user logout
 */
export async function logOutUser(): Promise<CustomerInfo> {
  try {
    const customerInfo = await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error logging out user:', error);
    throw error;
  }
}

/**
 * Get subscription management URL (platform-specific)
 */
export function getManagementURL(customerInfo: CustomerInfo): string | null {
  return customerInfo.managementURL;
}

/**
 * Check if a specific product type is active
 */
export function isProductActive(customerInfo: CustomerInfo, productId: ProductId): boolean {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return false;
  
  return entitlement.productIdentifier === productId;
}

/**
 * Get subscription expiration date
 */
export function getExpirationDate(customerInfo: CustomerInfo): Date | null {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement || !entitlement.expirationDate) return null;
  
  return new Date(entitlement.expirationDate);
}

/**
 * Format price for display
 */
export function formatPackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get package by type from offering
 */
export function getPackageByType(
  offering: PurchasesOffering,
  type: 'monthly' | 'annual' | 'lifetime'
): PurchasesPackage | undefined {
  switch (type) {
    case 'monthly':
      return offering.monthly ?? undefined;
    case 'annual':
      return offering.annual ?? undefined;
    case 'lifetime':
      return offering.lifetime ?? undefined;
    default:
      return undefined;
  }
}

/**
 * Calculate savings percentage for yearly vs monthly
 */
export function calculateYearlySavings(
  monthlyPackage: PurchasesPackage,
  yearlyPackage: PurchasesPackage
): number {
  const monthlyAnnualCost = monthlyPackage.product.price * 12;
  const yearlyCost = yearlyPackage.product.price;
  const savings = ((monthlyAnnualCost - yearlyCost) / monthlyAnnualCost) * 100;
  return Math.round(savings);
}
