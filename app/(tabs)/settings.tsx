import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const [primeAlertEnabled, setPrimeAlertEnabled] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handlePrimeAlertToggle = (value: boolean) => {
    if (value) {
      setShowPremiumModal(true);
    } else {
      setPrimeAlertEnabled(false);
    }
  };

  const closePremiumModal = () => {
    setShowPremiumModal(false);
    setPrimeAlertEnabled(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings-sharp" size={22} color="#9CA3AF" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Prime Zone Alerts</Text>
                <Text style={styles.settingDescription}>
                  Get notified when flow enters the prime fishing zone (350-750 CFS)
                </Text>
              </View>
              <Switch
                value={primeAlertEnabled}
                onValueChange={handlePrimeAlertToggle}
                trackColor={{ false: '#2D2D2D', true: '#10B98150' }}
                thumbColor={primeAlertEnabled ? '#10B981' : '#6B7280'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Daily Summary</Text>
                <Text style={styles.settingDescription}>
                  Morning briefing with flow conditions
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.card}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Temperature Unit</Text>
                <Text style={styles.settingDescription}>Fahrenheit (°F)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4B5563" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Flow Unit</Text>
                <Text style={styles.settingDescription}>Cubic Feet per Second (CFS)</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4B5563" />
            </Pressable>
          </View>
        </View>

        {/* Data Sources Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Data Sources</Text>
          </View>

          <View style={styles.card}>
            <Pressable 
              style={styles.sourceRow}
              onPress={() => Linking.openURL('https://waterservices.usgs.gov')}
            >
              <View style={styles.sourceIcon}>
                <FontAwesome6 name="water" size={16} color="#3B82F6" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>USGS Water Services</Text>
                <Text style={styles.sourceDescription}>Real-time flow data • Site 04250200</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#4B5563" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable 
              style={styles.sourceRow}
              onPress={() => Linking.openURL('https://openweathermap.org')}
            >
              <View style={styles.sourceIcon}>
                <FontAwesome6 name="cloud-sun" size={16} color="#FBBF24" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>OpenWeatherMap</Text>
                <Text style={styles.sourceDescription}>Weather forecasts & conditions</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#4B5563" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable 
              style={styles.sourceRow}
              onPress={() => Linking.openURL('https://safewaters.com')}
            >
              <View style={styles.sourceIcon}>
                <FontAwesome6 name="dam" size={16} color="#10B981" />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>SafeWaters</Text>
                <Text style={styles.sourceDescription}>Dam release schedules</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#4B5563" />
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={18} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>{APP_VERSION}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Build</Text>
              <Text style={styles.aboutValue}>2026.01.05</Text>
            </View>
          </View>
        </View>

        {/* App Branding Footer */}
        <View style={styles.footer}>
          <FontAwesome6 name="fish-fins" size={32} color="#10B981" style={{ opacity: 0.5 }} />
          <Text style={styles.footerTitle}>SalmonFlow</Text>
          <Text style={styles.footerSubtitle}>Salmon River at Pulaski, NY</Text>
          <Text style={styles.footerCopyright}>Made with 🎣 for anglers</Text>
        </View>

      </ScrollView>

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closePremiumModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="diamond" size={40} color="#10B981" />
            </View>
            
            <Text style={styles.modalTitle}>Premium Feature</Text>
            <Text style={styles.modalDescription}>
              Push notifications for prime fishing conditions require a premium subscription.
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.modalFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.modalFeatureText}>Real-time flow alerts</Text>
              </View>
              <View style={styles.modalFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.modalFeatureText}>Prime zone notifications</Text>
              </View>
              <View style={styles.modalFeatureRow}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.modalFeatureText}>Daily condition summaries</Text>
              </View>
            </View>

            <Pressable style={styles.modalButton} onPress={closePremiumModal}>
              <Text style={styles.modalButtonText}>Maybe Later</Text>
            </Pressable>

            <Text style={styles.modalNote}>Premium coming soon!</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 32,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  comingSoonBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2D2D2D',
    marginHorizontal: 16,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  sourceDescription: {
    color: '#6B7280',
    fontSize: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutLabel: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  aboutValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 16,
  },
  footerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  footerSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  footerCopyright: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  modalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDescription: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalFeatures: {
    width: '100%',
    marginBottom: 24,
  },
  modalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalFeatureText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
  },
  modalButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalNote: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 16,
  },
});
