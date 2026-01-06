import FlowGauge from '@/components/FlowGauge';
import StatCard from '@/components/StatCard';
import { FontAwesome6 } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

// USGS Site: 04250200 (Salmon River at Pulaski, NY)
// Parameter 00060 = Discharge (CFS)
// Parameter 00065 = Gage Height (ft)
const USGS_SITE = '04250200';
const USGS_API_BASE = 'https://waterservices.usgs.gov/nwis/iv/?format=json';

interface FlowData {
  currentCFS: number;
  gageHeightFt: number | null;
  trend24hr: number | null; // percentage change
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_STATE: FlowData = {
  currentCFS: 0,
  gageHeightFt: null,
  trend24hr: null,
  lastUpdated: new Date(),
  isLoading: true,
  error: null,
};

// Format "Updated X ago" text
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 min ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

export default function StatusScreen() {
  const [data, setData] = useState<FlowData>(DEFAULT_STATE);
  const [refreshing, setRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState('just now');

  const fetchFlowData = useCallback(async () => {
    try {
      // Fetch current values + 24hr period for trend calculation
      const currentUrl = `${USGS_API_BASE}&sites=${USGS_SITE}&parameterCd=00060,00065`;
      const historyUrl = `${USGS_API_BASE}&sites=${USGS_SITE}&parameterCd=00060&period=P1D`;

      const [currentRes, historyRes] = await Promise.all([
        fetch(currentUrl),
        fetch(historyUrl),
      ]);

      if (!currentRes.ok) throw new Error('Failed to fetch USGS data');
      
      const currentJson = await currentRes.json();
      const historyJson = historyRes.ok ? await historyRes.json() : null;

      // Parse current data
      const timeSeries = currentJson?.value?.timeSeries || [];
      
      let currentCFS = 0;
      let gageHeightFt: number | null = null;
      let lastUpdated = new Date();

      for (const series of timeSeries) {
        const paramCode = series?.variable?.variableCode?.[0]?.value;
        const values = series?.values?.[0]?.value || [];
        const latestValue = values[values.length - 1];

        if (latestValue) {
          if (paramCode === '00060') {
            // Discharge (CFS)
            currentCFS = Math.round(parseFloat(latestValue.value));
            lastUpdated = new Date(latestValue.dateTime);
          } else if (paramCode === '00065') {
            // Gage Height (ft)
            gageHeightFt = parseFloat(parseFloat(latestValue.value).toFixed(2));
          }
        }
      }

      // Calculate 24hr trend from history
      let trend24hr: number | null = null;
      if (historyJson?.value?.timeSeries?.[0]?.values?.[0]?.value) {
        const historyValues = historyJson.value.timeSeries[0].values[0].value;
        if (historyValues.length >= 2) {
          const oldestValue = parseFloat(historyValues[0].value);
          const newestValue = parseFloat(historyValues[historyValues.length - 1].value);
          if (oldestValue > 0) {
            trend24hr = Math.round(((newestValue - oldestValue) / oldestValue) * 100);
          }
        }
      }

      setData({
        currentCFS,
        gageHeightFt,
        trend24hr,
        lastUpdated,
        isLoading: false,
        error: null,
      });
      setTimeAgo(getTimeAgo(lastUpdated));

    } catch (err) {
      console.error('Error fetching flow data:', err);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFlowData();
  }, [fetchFlowData]);

  // Update "time ago" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(data.lastUpdated));
    }, 60000);
    return () => clearInterval(interval);
  }, [data.lastUpdated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFlowData();
    setRefreshing(false);
  }, [fetchFlowData]);

  // Calculate trend display
  const hasTrend = data.trend24hr !== null;
  const trendColor = hasTrend && data.trend24hr! > 0 ? '#10B981' : '#EF4444';
  const trendIcon = hasTrend && data.trend24hr! >= 0 ? 'trending-up' : 'trending-down';
  const trendValue = hasTrend 
    ? `${data.trend24hr! > 0 ? '+' : ''}${data.trend24hr}%` 
    : '--';

  // Status dot color (green if updated within 30 mins, yellow if stale)
  const isStale = (new Date().getTime() - data.lastUpdated.getTime()) > 30 * 60 * 1000;
  const statusDotColor = data.error ? '#EF4444' : isStale ? '#F59E0B' : '#10B981';

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
          {data.isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlowGauge currentCFS={data.currentCFS} />
          )}
        </View>

        {/* Info Cards Row - directly below gauge */}
        <View style={styles.cardsRow}>
          <StatCard
            icon="water"
            value={data.gageHeightFt !== null ? `${data.gageHeightFt} ft` : '--'}
            label="Gage Height"
          />
          <StatCard
            icon={trendIcon}
            value={trendValue}
            label="24hr Trend"
            valueColor={hasTrend ? trendColor : '#6B7280'}
          />
        </View>

        {/* Update Indicator - bottom */}
        <View style={styles.updateIndicator}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <Text style={styles.updateText}>
            {data.error 
              ? `Error: ${data.error}` 
              : `Updated ${timeAgo} • USGS ${USGS_SITE}`}
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
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gaugeSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  loadingContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    marginTop: 20,
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
    marginRight: 8,
  },
  updateText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
