/**
 * Paywall Component
 * 
 * Displays subscription options using RevenueCat's paywall UI
 * with a custom fallback paywall for full control over the design.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSubscription, usePackages } from '@/contexts/SubscriptionContext';

const { width } = Dimensions.get('window');

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * RevenueCat Native Paywall
 * Uses RevenueCat's pre-built paywall UI configured in the dashboard
 */
export function RevenueCatPaywall({ visible, onClose, onSuccess }: PaywallProps) {
  const [isPresenting, setIsPresenting] = useState(false);

  const presentPaywall = useCallback(async () => {
    if (isPresenting) return;
    
    setIsPresenting(true);
    try {
      const result = await RevenueCatUI.presentPaywall();
      
      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          onSuccess?.();
          onClose();
          break;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
        default:
          onClose();
          break;
      }
    } catch (error) {
      console.error('[Paywall] Error presenting paywall:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
      onClose();
    } finally {
      setIsPresenting(false);
    }
  }, [isPresenting, onClose, onSuccess]);

  // Present paywall when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      presentPaywall();
    }
  }, [visible, presentPaywall]);

  // This modal is just a loading indicator while RevenueCat's paywall loads
  return (
    <Modal
      visible={visible && isPresenting}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </Modal>
  );
}

/**
 * Custom Paywall Component
 * A fully custom paywall with SalmonFlow branding for more control
 */
export function CustomPaywall({ visible, onClose, onSuccess }: PaywallProps) {
  const { purchase, restore, isLoading, error } = useSubscription();
  const { monthly, yearly, lifetime } = usePackages();
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = useCallback(async () => {
    let pkg: PurchasesPackage | null = null;
    
    switch (selectedPackage) {
      case 'monthly':
        pkg = monthly;
        break;
      case 'yearly':
        pkg = yearly;
        break;
      case 'lifetime':
        pkg = lifetime;
        break;
    }

    if (!pkg) {
      Alert.alert('Error', 'Selected package is not available');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPackage, monthly, yearly, lifetime, purchase, onSuccess, onClose]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Success', 'Your purchases have been restored!');
        onSuccess?.();
        onClose();
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [restore, onSuccess, onClose]);

  // Calculate savings
  const yearlySavings = React.useMemo(() => {
    if (!monthly || !yearly) return 0;
    const monthlyAnnualCost = monthly.product.price * 12;
    const yearlyCost = yearly.product.price;
    return Math.round(((monthlyAnnualCost - yearlyCost) / monthlyAnnualCost) * 100);
  }, [monthly, yearly]);

  const features = [
    { icon: 'notifications', text: 'Prime Zone Push Alerts' },
    { icon: 'analytics', text: 'Advanced Flow Analytics' },
    { icon: 'calendar', text: 'Extended 14-Day Forecast' },
    { icon: 'fish', text: 'Fishing Condition Predictions' },
    { icon: 'cloud-download', text: 'Offline Access' },
    { icon: 'shield-checkmark', text: 'Priority Support' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#9CA3AF" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <FontAwesome6 name="fish-fins" size={40} color="#10B981" />
            </View>
            <Text style={styles.title}>SalmonFlow Pro</Text>
            <Text style={styles.subtitle}>Unlock the full fishing experience</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={18} color="#10B981" />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Package Options */}
          <View style={styles.packagesContainer}>
            {/* Monthly */}
            {monthly && (
              <Pressable
                style={[
                  styles.packageCard,
                  selectedPackage === 'monthly' && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage('monthly')}
              >
                <View style={styles.packageRadio}>
                  {selectedPackage === 'monthly' && (
                    <View style={styles.packageRadioInner} />
                  )}
                </View>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>Monthly</Text>
                  <Text style={styles.packagePrice}>
                    {monthly.product.priceString}/month
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Yearly - Best Value */}
            {yearly && (
              <Pressable
                style={[
                  styles.packageCard,
                  selectedPackage === 'yearly' && styles.packageCardSelected,
                  styles.packageCardBestValue,
                ]}
                onPress={() => setSelectedPackage('yearly')}
              >
                {yearlySavings > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>Save {yearlySavings}%</Text>
                  </View>
                )}
                <View style={styles.packageRadio}>
                  {selectedPackage === 'yearly' && (
                    <View style={styles.packageRadioInner} />
                  )}
                </View>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>Yearly</Text>
                  <Text style={styles.packagePrice}>
                    {yearly.product.priceString}/year
                  </Text>
                  <Text style={styles.packageSubtext}>
                    Just {(yearly.product.price / 12).toFixed(2)}/month
                  </Text>
                </View>
                <View style={styles.bestValueTag}>
                  <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.bestValueText}>Best Value</Text>
                </View>
              </Pressable>
            )}

            {/* Lifetime */}
            {lifetime && (
              <Pressable
                style={[
                  styles.packageCard,
                  selectedPackage === 'lifetime' && styles.packageCardSelected,
                ]}
                onPress={() => setSelectedPackage('lifetime')}
              >
                <View style={styles.packageRadio}>
                  {selectedPackage === 'lifetime' && (
                    <View style={styles.packageRadioInner} />
                  )}
                </View>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageTitle}>Lifetime</Text>
                  <Text style={styles.packagePrice}>
                    {lifetime.product.priceString}
                  </Text>
                  <Text style={styles.packageSubtext}>One-time purchase</Text>
                </View>
                <View style={styles.lifetimeTag}>
                  <Ionicons name="infinite" size={16} color="#3B82F6" />
                </View>
              </Pressable>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable
            style={[styles.purchaseButton, isProcessing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing || isLoading}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Continue
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isProcessing || isLoading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </Pressable>

          <Text style={styles.legalText}>
            Cancel anytime. Subscription auto-renews unless cancelled 24 hours before the end of the current period.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Paywall Trigger Button
 * A pre-styled button to open the paywall
 */
interface PaywallButtonProps {
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'minimal';
  label?: string;
}

export function PaywallButton({ 
  onPress, 
  variant = 'primary',
  label = 'Upgrade to Pro'
}: PaywallButtonProps) {
  const variantStyles = {
    primary: styles.triggerButtonPrimary,
    secondary: styles.triggerButtonSecondary,
    minimal: styles.triggerButtonMinimal,
  };

  const textStyles = {
    primary: styles.triggerButtonTextPrimary,
    secondary: styles.triggerButtonTextSecondary,
    minimal: styles.triggerButtonTextMinimal,
  };

  return (
    <Pressable 
      style={[styles.triggerButton, variantStyles[variant]]} 
      onPress={onPress}
    >
      <Ionicons 
        name="diamond" 
        size={18} 
        color={variant === 'primary' ? '#FFFFFF' : '#10B981'} 
        style={{ marginRight: 8 }}
      />
      <Text style={textStyles[variant]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Loading overlay
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },

  // Main container
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Close button
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Features
  featuresContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },

  // Packages
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2D2D2D',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B98110',
  },
  packageCardBestValue: {
    marginVertical: 4,
  },
  packageRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  packageRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  packageSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bestValueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF2420',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bestValueText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  lifetimeTag: {
    backgroundColor: '#3B82F620',
    padding: 8,
    borderRadius: 8,
  },

  // Error
  errorContainer: {
    backgroundColor: '#EF444420',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Bottom actions
  bottomActions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    backgroundColor: '#121212',
  },
  purchaseButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  legalText: {
    color: '#4B5563',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Trigger button variants
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  triggerButtonPrimary: {
    backgroundColor: '#10B981',
  },
  triggerButtonSecondary: {
    backgroundColor: '#10B98120',
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  triggerButtonMinimal: {
    backgroundColor: 'transparent',
  },
  triggerButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  triggerButtonTextSecondary: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  triggerButtonTextMinimal: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
});
