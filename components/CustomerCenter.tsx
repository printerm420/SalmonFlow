/**
 * Customer Center Component
 * 
 * Provides subscription management functionality using RevenueCat's Customer Center.
 * Allows users to view and manage their subscriptions, request refunds, etc.
 * 
 * Documentation: https://www.revenuecat.com/docs/tools/customer-center
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
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface CustomerCenterProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * RevenueCat Customer Center
 * Uses RevenueCat's pre-built Customer Center UI
 */
export function RevenueCatCustomerCenter({ visible, onClose }: CustomerCenterProps) {
  const [isPresenting, setIsPresenting] = useState(false);

  const presentCustomerCenter = useCallback(async () => {
    if (isPresenting) return;
    
    setIsPresenting(true);
    try {
      await RevenueCatUI.presentCustomerCenter();
      onClose();
    } catch (error) {
      console.error('[CustomerCenter] Error presenting customer center:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription management. Please try again or manage your subscription through the App Store/Play Store.'
      );
      onClose();
    } finally {
      setIsPresenting(false);
    }
  }, [isPresenting, onClose]);

  // Present customer center when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      presentCustomerCenter();
    }
  }, [visible, presentCustomerCenter]);

  return (
    <Modal
      visible={visible && isPresenting}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading subscription management...</Text>
      </View>
    </Modal>
  );
}

/**
 * Custom Subscription Management Component
 * A fallback/alternative to RevenueCat's Customer Center with custom UI
 */
export function CustomSubscriptionManager({ visible, onClose }: CustomerCenterProps) {
  const { 
    isPro, 
    customerInfo, 
    subscriptionType, 
    expirationDate, 
    managementURL,
    restore,
    isLoading,
  } = useSubscription();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleManageSubscription = useCallback(async () => {
    if (managementURL) {
      try {
        await Linking.openURL(managementURL);
      } catch (error) {
        Alert.alert(
          'Error',
          'Could not open subscription management. Please manage your subscription through your device settings.'
        );
      }
    } else {
      // Fallback to platform-specific subscription settings
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please go to your device settings:\n\n' +
        '• iOS: Settings → Apple ID → Subscriptions\n' +
        '• Android: Play Store → Menu → Subscriptions'
      );
    }
  }, [managementURL]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      const success = await restore();
      if (success) {
        Alert.alert('Success', 'Your purchases have been restored!');
      } else {
        Alert.alert('No Purchases Found', 'We could not find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  }, [restore]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubscriptionIcon = () => {
    switch (subscriptionType) {
      case 'monthly':
        return 'calendar-outline';
      case 'yearly':
        return 'calendar';
      case 'lifetime':
        return 'infinite';
      default:
        return 'diamond-outline';
    }
  };

  const getSubscriptionLabel = () => {
    switch (subscriptionType) {
      case 'monthly':
        return 'Monthly Subscription';
      case 'yearly':
        return 'Yearly Subscription';
      case 'lifetime':
        return 'Lifetime Access';
      default:
        return 'Free Plan';
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </Pressable>
            <Text style={styles.title}>Your Subscription</Text>
          </View>

          {/* Subscription Status Card */}
          <View style={[
            styles.statusCard,
            isPro ? styles.statusCardPro : styles.statusCardFree
          ]}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name={isPro ? 'diamond' : 'diamond-outline'} 
                size={32} 
                color={isPro ? '#10B981' : '#6B7280'} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>
                {isPro ? 'SalmonFlow Pro' : 'Free Plan'}
              </Text>
              <Text style={styles.statusPlan}>
                {getSubscriptionLabel()}
              </Text>
            </View>
            <Ionicons 
              name={getSubscriptionIcon() as any} 
              size={24} 
              color={isPro ? '#10B981' : '#6B7280'} 
            />
          </View>

          {/* Subscription Details */}
          {isPro && (
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Subscription Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>

              {subscriptionType !== 'lifetime' && expirationDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Renews On</Text>
                  <Text style={styles.detailValue}>{formatDate(expirationDate)}</Text>
                </View>
              )}

              {subscriptionType === 'lifetime' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Access</Text>
                  <Text style={styles.detailValue}>Forever</Text>
                </View>
              )}

              {customerInfo?.originalAppUserId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User ID</Text>
                  <Text style={[styles.detailValue, styles.detailValueSmall]} numberOfLines={1}>
                    {customerInfo.originalAppUserId.substring(0, 20)}...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Pro Features */}
          {isPro && (
            <View style={styles.featuresCard}>
              <Text style={styles.sectionTitle}>Your Pro Features</Text>
              
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Prime Zone Push Alerts</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Advanced Flow Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Extended 14-Day Forecast</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Fishing Condition Predictions</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Offline Access</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Priority Support</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            {isPro && subscriptionType !== 'lifetime' && (
              <Pressable style={styles.actionButton} onPress={handleManageSubscription}>
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Manage Subscription</Text>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </Pressable>
            )}

            <Pressable 
              style={styles.actionButton} 
              onPress={handleRestore}
              disabled={isRestoring || isLoading}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="refresh" size={22} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>Restore Purchases</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>

            <Pressable 
              style={styles.actionButton} 
              onPress={() => Linking.openURL('mailto:support@salmonflow.app')}
            >
              <Ionicons name="mail-outline" size={22} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Legal Links */}
          <View style={styles.legalLinks}>
            <Pressable onPress={() => Linking.openURL('https://salmonflow.app/privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.legalDivider}>•</Text>
            <Pressable onPress={() => Linking.openURL('https://salmonflow.app/terms')}>
              <Text style={styles.legalLink}>Terms of Use</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/**
 * Subscription Management Button
 * Opens either the RevenueCat Customer Center or custom manager
 */
interface SubscriptionButtonProps {
  onPress: () => void;
  showStatus?: boolean;
}

export function SubscriptionButton({ onPress, showStatus = true }: SubscriptionButtonProps) {
  const { isPro, subscriptionType } = useSubscription();

  return (
    <Pressable style={styles.subscriptionButton} onPress={onPress}>
      <View style={styles.subscriptionButtonIcon}>
        <Ionicons 
          name={isPro ? 'diamond' : 'diamond-outline'} 
          size={20} 
          color={isPro ? '#10B981' : '#6B7280'} 
        />
      </View>
      <View style={styles.subscriptionButtonInfo}>
        <Text style={styles.subscriptionButtonTitle}>
          {isPro ? 'SalmonFlow Pro' : 'Upgrade to Pro'}
        </Text>
        {showStatus && (
          <Text style={styles.subscriptionButtonSubtitle}>
            {isPro 
              ? subscriptionType === 'lifetime' 
                ? 'Lifetime Access' 
                : 'Active Subscription'
              : 'Unlock all features'
            }
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4B5563" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Loading
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

  // Container
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  statusCardPro: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98130',
  },
  statusCardFree: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2D2D2D',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusPlan: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailValueSmall: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  activeText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },

  // Features Card
  featuresCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 12,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 14,
  },

  // Legal
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  legalLink: {
    color: '#6B7280',
    fontSize: 13,
  },
  legalDivider: {
    color: '#4B5563',
    marginHorizontal: 12,
  },

  // Subscription Button
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  subscriptionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  subscriptionButtonInfo: {
    flex: 1,
  },
  subscriptionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subscriptionButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});
