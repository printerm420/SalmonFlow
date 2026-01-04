import FlowGauge from '@/components/FlowGauge';
import StatCard from '@/components/StatCard';
import { FontAwesome6 } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

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
        {/* Header - minimal, top */}
        <View style={styles.header}>
          <FontAwesome6 name="fish-fins" size={24} color="#10B981" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>Pulaski Salmon Flow</Text>
        </View>

        {/* Hero Gauge - the main event, positioned high */}
        <View style={styles.gaugeSection}>
          <FlowGauge currentCFS={MOCK_DATA.currentCFS} />
        </View>

        {/* Info Cards Row - directly below gauge */}
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

        {/* Update Indicator - bottom */}
        <View style={styles.updateIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.updateText}>
            Updated just now • USGS 04250200
          </Text>
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
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 24,
    marginLeft: 4, // Adding a bit of left margin as requested (visual alignment)
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22, // Made slightly bigger to match "Pulaski Salmon Flow" length nicely
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  updateText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
