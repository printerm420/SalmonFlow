/**
 * Hard Paywall Component
 * 
 * Shows X button ONLY in sandbox mode (for App Store reviewers)
 * Production users see a hard paywall with no escape
 */
import { usePackages, useSubscription } from '@/contexts/SubscriptionContext';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

interface HardPaywallProps {
  onSubscribed?: () => void;
  onDismiss?: () => void;
}

export function HardPaywall({ onSubscribed, onDismiss }: HardPaywallProps) {
  const {
    purchase,
    restore,
    isLoading,
    error,
    isPro,
    isInitialized,
    isSandbox,
    currentOffering,
  } = useSubscription();
  
  const { monthly, yearly, lifetime } = usePackages();

  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Secret tap counter for reviewer escape hatch (tap logo 5 times)
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showReviewerEscape, setShowReviewerEscape] = useState(false);
  
  // Legal modals
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  // const [showTermsOfUse, setShowTermsOfUse] = useState(false); // COMMENTED OUT - Now using Apple Standard EULA link

  // =========================================================================
  // X BUTTON VISIBILITY
  // =========================================================================
  // 
  // The X button is shown ONLY when:
  // 1. App is in development mode (__DEV__)
  // 2. App is running in sandbox mode (detected via RevenueCat)
  // 3. Reviewer escape hatch is triggered (tap logo 5 times)
  //
  // This ensures:
  // - App Store reviewers can access the app to review it
  // - Production users get a hard paywall (no way to dismiss)
  // =========================================================================
  
  const showCloseButton = useMemo(() => {
    // Development mode - always show
    if (__DEV__) return true;
    
    // Sandbox mode detected - show for reviewers
    if (isSandbox) return true;
    
    // Reviewer escape hatch triggered
    if (showReviewerEscape) return true;
    
    // Production - hide close button (hard paywall)
    return false;
  }, [isSandbox, showReviewerEscape]);

  // Handle logo tap (reviewer escape hatch)
  const handleLogoTap = useCallback(() => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    
    if (newCount >= 5 && !showReviewerEscape) {
      setShowReviewerEscape(true);
      
      // Show a message for reviewers
      Alert.alert(
        'Review Mode',
        'App Store review mode detected. You can now close this paywall to test the app.',
        [{ text: 'OK' }]
      );
    }
    
    // Reset tap count after 2 seconds
    setTimeout(() => setLogoTapCount(0), 2000);
  }, [logoTapCount, showReviewerEscape]);

  // Auto-dismiss if user becomes pro
  useEffect(() => {
    if (isPro && isInitialized) {
      onSubscribed?.();
    }
  }, [isPro, isInitialized, onSubscribed]);

  // Handle purchase
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
      Alert.alert('Error', 'Selected package is not available. Please try another option.');
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

  // Handle restore
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
          'We could not find an active subscription for your account. If you believe this is an error, please contact support.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [restore, onSubscribed]);

  // Handle dismiss (only available in sandbox/review mode)
  const handleDismiss = useCallback(() => {
    if (showCloseButton) {
      onDismiss?.();
    }
  }, [showCloseButton, onDismiss]);

  // Calculate yearly savings
  const yearlySavings = useMemo(() => {
    if (!monthly || !yearly) return 0;
    const monthlyAnnualCost = monthly.product.price * 12;
    const yearlyCost = yearly.product.price;
    return Math.round(((monthlyAnnualCost - yearlyCost) / monthlyAnnualCost) * 100);
  }, [monthly, yearly]);

  // Features list - ordered for max conversion
  const features = [
    { icon: 'water', text: 'Real-Time Flow Data', subtext: 'USGS gauge readings updated every 15 min' },
    { icon: 'fish', text: 'Prime Zone Indicator', subtext: 'Know when fishing is optimal' },
    { icon: 'analytics', text: 'Flow Trend Analysis', subtext: 'See how conditions are changing' },
    { icon: 'partly-sunny', text: 'Weather Integration', subtext: 'Temperature, precipitation & more' },
    { icon: 'calendar', text: 'Multi-Day Forecast', subtext: 'Plan your fishing trips ahead' },
  ];

  // Loading state
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

      {/* Close button - ONLY shown in sandbox/review mode */}
      {showCloseButton && (
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#9CA3AF" />
        </Pressable>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Pressable onPress={handleLogoTap} style={styles.iconContainer}>
            <FontAwesome6 name="fish-fins" size={48} color="#10B981" />
          </Pressable>
          <Text style={styles.title}>Pulaski Salmon</Text>
          <Text style={styles.tagline}>Salmon River at Pulaski, NY</Text>
          <Text style={styles.subtitle}>
            Your essential companion for Salmon River fishing conditions
          </Text>
        </View>

        {/* Features Section */}
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

        {/* Packages Section */}
        <View style={styles.packagesContainer}>
          <Text style={styles.packagesTitle}>Choose Your Plan</Text>

          {/* Yearly Package */}
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
                {selectedPackage === 'yearly' && <View style={styles.packageRadioInner} />}
              </View>
              <View style={styles.packageInfo}>
                <View style={styles.packageTitleRow}>
                  <Text style={styles.packageTitle}>Yearly</Text>
                  <View style={styles.bestValueTag}>
                    <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.bestValueText}>Best Value</Text>
                  </View>
                </View>
                <Text style={styles.packageSubtextGreen}>
                  Just ${(yearly.product.price / 12).toFixed(2)}/month
                </Text>
              </View>
              <View style={styles.packagePriceContainer}>
                <Text style={styles.packagePriceLarge}>{yearly.product.priceString}</Text>
                <Text style={styles.packagePricePeriod}>/year</Text>
              </View>
            </Pressable>
          )}

          {/* Monthly Package */}
          {monthly && (
            <Pressable
              style={[
                styles.packageCard,
                selectedPackage === 'monthly' && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage('monthly')}
            >
              <View style={styles.packageRadio}>
                {selectedPackage === 'monthly' && <View style={styles.packageRadioInner} />}
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>Monthly</Text>
                <Text style={styles.packagePrice}>{monthly.product.priceString}/month</Text>
              </View>
            </Pressable>
          )}

          {/* Lifetime Package */}
          {lifetime && (
            <Pressable
              style={[
                styles.packageCard,
                selectedPackage === 'lifetime' && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage('lifetime')}
            >
              <View style={styles.packageRadio}>
                {selectedPackage === 'lifetime' && <View style={styles.packageRadioInner} />}
              </View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>Lifetime</Text>
                <Text style={styles.packagePrice}>{lifetime.product.priceString}</Text>
                <Text style={styles.packageSubtext}>One-time purchase, forever access</Text>
              </View>
              <View style={styles.lifetimeTag}>
                <Ionicons name="infinite" size={16} color="#3B82F6" />
              </View>
            </Pressable>
          )}

          {/* No packages available message */}
          {!yearly && !monthly && !lifetime && (
            <View style={styles.noPackagesContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
              <Text style={styles.noPackagesText}>
                No subscription plans available at the moment.
              </Text>
              <Text style={styles.noPackagesSubtext}>
                Please try again later or contact support.
              </Text>
            </View>
          )}
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Debug info (only in development) - TEMPORARILY COMMENTED OUT
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Sandbox: {isSandbox ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Offering: {currentOffering?.identifier || 'None'}</Text>
            <Text style={styles.debugText}>Yearly: {yearly?.product.identifier || 'None'}</Text>
            <Text style={styles.debugText}>Monthly: {monthly?.product.identifier || 'None'}</Text>
            <Text style={styles.debugText}>Lifetime: {lifetime?.product.identifier || 'None'}</Text>
          </View>
        )}
        */}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable
          style={[styles.purchaseButton, (isProcessing || (!yearly && !monthly && !lifetime)) && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isProcessing || isLoading || (!yearly && !monthly && !lifetime)}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.purchaseButtonText}>Start Fishing Smarter</Text>
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
            ? 'Payment of $29.99 will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'
            : 'Payment of $29.99will be charged to your Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.'}
        </Text>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => setShowPrivacyPolicy(true)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.legalDivider}>•</Text>
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </View>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacyPolicy(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLastUpdated}>Last Updated: January 17, 2026</Text>
            
            <Text style={styles.modalSectionTitle}>1. Introduction</Text>
            <Text style={styles.modalText}>
              Welcome to SalmonFlow ("we," "our," or "us"). This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
            </Text>

            <Text style={styles.modalSectionTitle}>2. Information We Collect</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBold}>Usage Data:</Text> We collect anonymous usage statistics to improve the app experience, including features used and session duration.
              {'\n\n'}
              <Text style={styles.modalBold}>Purchase Information:</Text> When you subscribe, Apple processes your payment. We receive confirmation of your subscription status but do not have access to your payment details.
              {'\n\n'}
              <Text style={styles.modalBold}>Device Information:</Text> We may collect device type and operating system version for compatibility purposes.
            </Text>

            <Text style={styles.modalSectionTitle}>3. How We Use Your Information</Text>
            <Text style={styles.modalText}>
              • To provide and maintain our service{'\n'}
              • To manage your subscription{'\n'}
              • To improve app functionality{'\n'}
              • To communicate important updates
            </Text>

            <Text style={styles.modalSectionTitle}>4. Data Sharing</Text>
            <Text style={styles.modalText}>
              We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytics purposes.
            </Text>

            <Text style={styles.modalSectionTitle}>5. Data Sources</Text>
            <Text style={styles.modalText}>
              SalmonFlow displays publicly available data from:{'\n'}
              • U.S. Geological Survey (USGS) - River flow data{'\n'}
              • Open-Meteo - Weather information{'\n'}
              • SafeWaters - Dam release schedules
            </Text>

            <Text style={styles.modalSectionTitle}>6. Data Security</Text>
            <Text style={styles.modalText}>
              We implement appropriate security measures to protect your information. However, no method of electronic transmission is 100% secure.
            </Text>

            <Text style={styles.modalSectionTitle}>7. Children's Privacy</Text>
            <Text style={styles.modalText}>
              Our app is not intended for children under 13. We do not knowingly collect information from children under 13.
            </Text>

            <Text style={styles.modalSectionTitle}>8. Changes to This Policy</Text>
            <Text style={styles.modalText}>
              We may update this Privacy Policy periodically. We will notify you of any changes by updating the "Last Updated" date.
            </Text>

            <Text style={styles.modalSectionTitle}>9. Contact Us</Text>
            <Text style={styles.modalText}>
              If you have questions about this Privacy Policy, please contact us at:{'\n'}
              support@salmonflow.app
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Terms of Use Modal - COMMENTED OUT - Now using Apple Standard EULA
      <Modal
        visible={showTermsOfUse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsOfUse(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms of Use</Text>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowTermsOfUse(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLastUpdated}>Last Updated: January 17, 2026</Text>
            
            <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.modalText}>
              By downloading, installing, or using SalmonFlow, you agree to be bound by these Terms of Use. If you do not agree, please do not use the app.
            </Text>

            <Text style={styles.modalSectionTitle}>2. Description of Service</Text>
            <Text style={styles.modalText}>
              SalmonFlow provides real-time fishing conditions data for the Salmon River at Pulaski, NY, including flow rates, weather information, and related fishing analytics.
            </Text>

            <Text style={styles.modalSectionTitle}>3. Subscription Terms</Text>
            <Text style={styles.modalText}>
              <Text style={styles.modalBold}>Auto-Renewal:</Text> Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
              {'\n\n'}
              <Text style={styles.modalBold}>Payment:</Text> Payment will be charged to your Apple ID account at confirmation of purchase.
              {'\n\n'}
              <Text style={styles.modalBold}>Cancellation:</Text> You can manage and cancel your subscription in your Apple ID Account Settings.
              {'\n\n'}
              <Text style={styles.modalBold}>Refunds:</Text> Refunds are handled by Apple according to their refund policies.
            </Text>

            <Text style={styles.modalSectionTitle}>4. Disclaimer of Warranties</Text>
            <Text style={styles.modalText}>
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. We do not guarantee the accuracy, completeness, or timeliness of any data displayed.
              {'\n\n'}
              Flow data is sourced from USGS and may be delayed or unavailable. Weather data is provided by third-party services.
            </Text>

            <Text style={styles.modalSectionTitle}>5. Limitation of Liability</Text>
            <Text style={styles.modalText}>
              SalmonFlow shall not be liable for any decisions made based on information provided by the app. Always exercise caution and check official sources before fishing.
              {'\n\n'}
              We are not responsible for:{'\n'}
              • Accuracy of river flow data{'\n'}
              • Weather forecast accuracy{'\n'}
              • Dam release schedule changes{'\n'}
              • Any injuries or damages
            </Text>

            <Text style={styles.modalSectionTitle}>6. Acceptable Use</Text>
            <Text style={styles.modalText}>
              You agree not to:{'\n'}
              • Reverse engineer or modify the app{'\n'}
              • Use the app for any unlawful purpose{'\n'}
              • Attempt to gain unauthorized access{'\n'}
              • Redistribute app content without permission
            </Text>

            <Text style={styles.modalSectionTitle}>7. Intellectual Property</Text>
            <Text style={styles.modalText}>
              All content, features, and functionality of SalmonFlow are owned by us and protected by intellectual property laws.
            </Text>

            <Text style={styles.modalSectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.modalText}>
              We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.
            </Text>

            <Text style={styles.modalSectionTitle}>9. Governing Law</Text>
            <Text style={styles.modalText}>
              These terms shall be governed by the laws of the State of New York, United States.
            </Text>

            <Text style={styles.modalSectionTitle}>10. Contact</Text>
            <Text style={styles.modalText}>
              For questions about these Terms of Use, contact us at:{'\n'}
              support@salmonflow.app
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
      */}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
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
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
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
  packageSubtextGreen: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '600',
  },
  packagePriceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  packagePriceLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  packagePricePeriod: {
    fontSize: 12,
    color: '#9CA3AF',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bestValueText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  lifetimeTag: {
    backgroundColor: '#3B82F620',
    padding: 10,
    borderRadius: 10,
  },
  noPackagesContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#141414',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  noPackagesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  noPackagesSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
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
  debugContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  debugTitle: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  debugText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalLastUpdated: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
    marginTop: 16,
  },
  modalText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  modalBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
