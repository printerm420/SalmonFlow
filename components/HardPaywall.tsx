/**
 * Hard Paywall Component
 * 
 * A mandatory paywall that blocks access to the app until the user subscribes.
 * Shows on app launch and cannot be dismissed by regular users.
 * 
 * For App Store Review:
 * - Detects sandbox mode (used during App Store review)
 * - Shows a close button ONLY in sandbox mode so reviewers can access the app
 * - Regular production users cannot dismiss this paywall
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscription, usePackages } from '@/contexts/SubscriptionContext';

const { width, height } = Dimensions.get('window');

interface HardPaywallProps {
  /**
   * Called when user successfully subscribes
   */
  onSubscribed?: () => void;
  
  /**
   * Called when sandbox user (App Store reviewer) dismisses paywall
   */
  onSandboxDismiss?: () => void;
}

export function HardPaywall({ onSubscribed, onSandboxDismiss }: HardPaywallProps) {
  const { 
    purchase, 
    restore, 
    isLoading, 
    error, 
    isPro,
    isSandbox,
    isInitialized,
  } = useSubscription();
  const { monthly, yearly, lifetime } = usePackages();
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  // If user becomes Pro, call the success callback
  useEffect(() => {
    if (isPro && isInitialized) {
      onSubscribed?.();
    }
  }, [isPro, isInitialized, onSubscribed]);

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
      Alert.alert('Error', 'Selected package is not available. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        onSubscribed?.();
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPackage, monthly, yearly, lifetime, purchase, onSubscribed]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Welcome Back!', 'Your subscription has been restored.');
        onSubscribed?.();
      } else {
        Alert.alert(
          'No Subscription Found', 
          'We could not find an active subscription for your account.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [restore, onSubscribed]);

  const handleSandboxDismiss = useCallback(() => {
    Alert.alert(
      'Reviewer Access',
      'You are accessing the app in sandbox/review mode. This option is not available to regular users.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue to App', 
          onPress: () => onSandboxDismiss?.(),
        },
      ]
    );
  }, [onSandboxDismiss]);

  // Calculate savings
  const yearlySavings = React.useMemo(() => {
    if (!monthly || !yearly) return 0;
    const monthlyAnnualCost = monthly.product.price * 12;
    const yearlyCost = yearly.product.price;
    return Math.round(((monthlyAnnualCost - yearlyCost) / monthlyAnnualCost) * 100);
  }, [monthly, yearly]);

  const features = [
    { icon: 'water', text: 'Real-Time Flow Data', subtext: 'USGS gauge readings updated every 15 min' },
    { icon: 'analytics', text: 'Flow Trend Analysis', subtext: 'See how conditions are changing' },
    { icon: 'partly-sunny', text: 'Weather Integration', subtext: 'Temperature, precipitation & more' },
    { icon: 'fish', text: 'Prime Zone Indicator', subtext: 'Know when fishing is optimal' },
    { icon: 'calendar', text: 'Multi-Day Forecast', subtext: 'Plan your fishing trips ahead' },
    { icon: 'notifications', text: 'Flow Alerts', subtext: 'Get notified of prime conditions' },
  ];

  // Show loading while RevenueCat initializes
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <FontAwesome6 name="fish-fins" size={48} color="#10B981" />
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sandbox/Review Mode Close Button - Only visible for App Store reviewers */}
        {isSandbox && (
          <Pressable style={styles.sandboxCloseButton} onPress={handleSandboxDismiss}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        )}

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <FontAwesome6 name="fish-fins" size={48} color="#10B981" />
          </View>
          <Text style={styles.title}>SalmonFlow</Text>
          <Text style={styles.tagline}>Salmon River at Pulaski, NY</Text>
          <Text style={styles.subtitle}>
            Your essential companion for Salmon River fishing conditions
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Everything You Need</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color="#10B981" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureText}>{feature.text}</Text>
                <Text style={styles.featureSubtext}>{feature.subtext}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Package Options */}
        <View style={styles.packagesContainer}>
          <Text style={styles.packagesTitle}>Choose Your Plan</Text>
          
          {/* Yearly - Best Value (shown first) */}
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
                <Text style={styles.packageSubtext}>One-time purchase, forever access</Text>
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

      {/* Bottom Actions - Fixed at bottom */}
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
              Start Fishing Smarter
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isProcessing || isLoading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchase</Text>
        </Pressable>

        <Text style={styles.legalText}>
          {Platform.OS === 'ios' 
            ? 'Payment will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
            : 'Payment will be charged to your Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
          }
        </Text>

        <View style={styles.legalLinks}>
          <Pressable>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDivider}>•</Text>
          <Pressable>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 12,
    fontSize: 16,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },

  // Sandbox close button (for App Store reviewers only)
  sandboxCloseButton: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B98130',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },

  // Features
  featuresContainer: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#10B98110',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Packages
  packagesContainer: {
    marginBottom: 16,
  },
  packagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E1E1E',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B98108',
  },
  packageCardBestValue: {
    marginBottom: 16,
  },
  packageRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  packageRadioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    top: -12,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bestValueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF2420',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  lifetimeTag: {
    backgroundColor: '#3B82F620',
    padding: 10,
    borderRadius: 10,
  },

  // Error
  errorContainer: {
    backgroundColor: '#EF444420',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },

  // Bottom actions
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    backgroundColor: '#0A0A0A',
  },
  purchaseButton: {
    backgroundColor: '#10B981',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  restoreButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  legalText: {
    color: '#4B5563',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  legalLink: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  legalDivider: {
    color: '#4B5563',
    marginHorizontal: 12,
  },
});
