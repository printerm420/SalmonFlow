import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FlowGauge from '@/components/FlowGauge';

// Mock Data
const MOCK_FLOW = 550;
const MOCK_TEMP = 48;
const LAST_UPDATED = "Just now";

// Helper to get status details
const getStatus = (cfs: number) => {
  if (cfs < 350) return { label: 'LOW', color: 'text-blue-500', hex: '#3B82F6' };
  if (cfs < 750) return { label: 'PRIME', color: 'text-emerald-500', hex: '#10B981' };
  if (cfs < 1200) return { label: 'CAUTION', color: 'text-amber-500', hex: '#F59E0B' };
  return { label: 'BLOWN OUT', color: 'text-red-500', hex: '#EF4444' };
};

export default function StatusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const status = getStatus(MOCK_FLOW);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={status.hex} />
        }
      >
        <View style={styles.mainContent}>
          
          {/* Header */}
          <Text style={styles.header}>
            Salmon River
          </Text>

          {/* Hero Gauge */}
          <View style={styles.gaugeContainer}>
            <FlowGauge currentCFS={MOCK_FLOW} />
          </View>

          {/* Status Label */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusSubtext}>Current Conditions</Text>
            <Text style={[styles.statusText, { color: status.hex }]}>
              {status.label}
            </Text>
          </View>

          {/* Secondary Info Cards */}
          <View style={styles.cardsContainer}>
            
            {/* Temperature Card */}
            <View style={styles.card}>
              <Ionicons name="thermometer" size={24} color="#9CA3AF" />
              <Text style={styles.cardValue}>{MOCK_TEMP}°F</Text>
              <Text style={styles.cardLabel}>Water Temp</Text>
            </View>

             {/* Update Info Card */}
             <View style={styles.card}>
              <Ionicons name="refresh" size={24} color="#9CA3AF" />
              <Text style={styles.cardValueSmall}>{LAST_UPDATED}</Text>
              <Text style={styles.cardLabel}>Last Checked</Text>
            </View>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  header: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 48,
    letterSpacing: -0.5,
  },
  gaugeContainer: {
    marginBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  statusSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
  },
  cardsContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 320,
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardValueSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  cardLabel: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },
});
