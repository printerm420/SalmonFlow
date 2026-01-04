import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import FlowGauge from '@/components/FlowGauge';
import StatCard from '@/components/StatCard';

// Mock Data following PRD spec
const MOCK_DATA = {
  currentCFS: 542,
  waterTempF: 48,
  trend24hr: 12, // percentage, positive = up
  lastUpdated: new Date(),
  status: 'PRIME'
};

export default function StatusScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Calculate trend color
  const trendColor = MOCK_DATA.trend24hr > 0 ? '#10B981' : '#EF4444';
  const trendIcon = MOCK_DATA.trend24hr > 0 ? 'trending-up' : 'trending-down';
  const trendValue = `${MOCK_DATA.trend24hr > 0 ? '+' : ''}${MOCK_DATA.trend24hr}%`;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#10B981"
          />
        }
      >
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Salmon River</Text>
          </View>

          {/* Hero Gauge - takes 50% of screen */}
          <View style={styles.gaugeSection}>
            <FlowGauge currentCFS={MOCK_DATA.currentCFS} />
          </View>

          {/* Info Cards Row */}
          <View style={styles.cardsRow}>
            <StatCard
              icon="thermometer"
              value={`${MOCK_DATA.waterTempF}°F`}
              label="Water Temp"
            />
            <StatCard
              icon={trendIcon}
              value={trendValue}
              label="24hr Trend"
              valueColor={trendColor}
            />
          </View>

          {/* Update Indicator */}
          <View style={styles.updateIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.updateText}>
              Updated just now • USGS 04250200
            </Text>
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
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 320, // Ensure enough space for the gauge
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Green for fresh data
    marginRight: 8,
  },
  updateText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
