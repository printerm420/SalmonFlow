import FlowGauge from '@/components/FlowGauge';
import StatCard from '@/components/StatCard';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// USGS Site: 04250200 (Salmon River at Pulaski, NY)
// Parameter 00060 = Discharge (CFS)
// Parameter 00065 = Gage Height (ft)
const USGS_SITE = '04250200';
const USGS_API_BASE = 'https://waterservices.usgs.gov/nwis/iv/?format=json';

// Open-Meteo for barometer (Pulaski, NY coordinates)
const PULASKI_LAT = 43.57;
const PULASKI_LON = -76.13;

interface FlowData {
  currentCFS: number;
  gageHeightFt: number | null;
  cfsDelta: number | null; // actual CFS change over 24hr
  trendPercent: number | null; // percentage change
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

interface BarometerData {
  pressureInHg: number | null;
  trend: 'Rising' | 'Falling' | 'Steady' | null;
  deltaInHg: number | null; // change over 3 hours
  isLoading: boolean;
}

const DEFAULT_FLOW_STATE: FlowData = {
  currentCFS: 0,
  gageHeightFt: null,
  cfsDelta: null,
  trendPercent: null,
  lastUpdated: new Date(),
  isLoading: true,
  error: null,
};

const DEFAULT_BAROMETER_STATE: BarometerData = {
  pressureInHg: null,
  trend: null,
  deltaInHg: null,
  isLoading: true,
};

// Convert hPa to inHg
const hpaToInHg = (hpa: number): number => parseFloat((hpa * 0.02953).toFixed(2));

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

// Get trend direction from delta
const getTrendDirection = (delta: number, threshold: number = 0.02): 'Rising' | 'Falling' | 'Steady' => {
  if (delta > threshold) return 'Rising';
  if (delta < -threshold) return 'Falling';
  return 'Steady';
};

// Get CFS trend word (for fishing: falling = good, rising = bad)
const getCfsTrendWord = (delta: number): 'Rising' | 'Falling' | 'Steady' => {
  if (delta > 10) return 'Rising';
  if (delta < -10) return 'Falling';
  return 'Steady';
};

export default function StatusScreen() {
  const [data, setData] = useState<FlowData>(DEFAULT_FLOW_STATE);
  const [barometer, setBarometer] = useState<BarometerData>(DEFAULT_BAROMETER_STATE);
  const [refreshing, setRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState('just now');

  // Pulsing animation for status dot
  const pulseOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

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
            currentCFS = Math.round(parseFloat(latestValue.value));
            lastUpdated = new Date(latestValue.dateTime);
          } else if (paramCode === '00065') {
            gageHeightFt = parseFloat(parseFloat(latestValue.value).toFixed(2));
          }
        }
      }

      // Calculate 24hr trend from history
      let cfsDelta: number | null = null;
      let trendPercent: number | null = null;
      if (historyJson?.value?.timeSeries?.[0]?.values?.[0]?.value) {
        const historyValues = historyJson.value.timeSeries[0].values[0].value;
        if (historyValues.length >= 2) {
          const oldestValue = parseFloat(historyValues[0].value);
          const newestValue = parseFloat(historyValues[historyValues.length - 1].value);
          cfsDelta = Math.round(newestValue - oldestValue);
          if (oldestValue > 0) {
            trendPercent = Math.round(((newestValue - oldestValue) / oldestValue) * 100);
          }
        }
      }

      setData({
        currentCFS,
        gageHeightFt,
        cfsDelta,
        trendPercent,
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

  const fetchBarometer = useCallback(async () => {
    try {
      // Open-Meteo: get current + past 6 hours of pressure
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${PULASKI_LAT}&longitude=${PULASKI_LON}&current=surface_pressure&hourly=surface_pressure&past_hours=6&forecast_hours=0&timezone=America%2FNew_York`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather data');
      
      const json = await res.json();
      
      const currentPressureHpa = json?.current?.surface_pressure;
      const hourlyPressures = json?.hourly?.surface_pressure || [];
      
      if (currentPressureHpa && hourlyPressures.length >= 3) {
        const currentInHg = hpaToInHg(currentPressureHpa);
        // Compare to 3 hours ago (index 3 from the end, since we have 6 hours of history)
        const threeHoursAgoHpa = hourlyPressures[Math.max(0, hourlyPressures.length - 4)];
        const threeHoursAgoInHg = hpaToInHg(threeHoursAgoHpa);
        const deltaInHg = parseFloat((currentInHg - threeHoursAgoInHg).toFixed(2));
        
        setBarometer({
          pressureInHg: currentInHg,
          trend: getTrendDirection(deltaInHg),
          deltaInHg,
          isLoading: false,
        });
      } else {
        setBarometer(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Error fetching barometer:', err);
      setBarometer(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFlowData();
    fetchBarometer();
  }, [fetchFlowData, fetchBarometer]);

  // Update "time ago" every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(data.lastUpdated));
    }, 60000);
    return () => clearInterval(interval);
  }, [data.lastUpdated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFlowData(), fetchBarometer()]);
    setRefreshing(false);
  }, [fetchFlowData, fetchBarometer]);

  // CFS Trend display logic
  // For fishing: Falling water = Green (good), Rising = Red (blowing out)
  const hasCfsTrend = data.cfsDelta !== null;
  const cfsTrendWord = hasCfsTrend ? getCfsTrendWord(data.cfsDelta!) : null;
  const cfsTrendColor = cfsTrendWord === 'Falling' ? '#10B981' : cfsTrendWord === 'Rising' ? '#EF4444' : '#6B7280';
  const cfsDeltaDisplay = hasCfsTrend 
    ? `${data.cfsDelta! >= 0 ? '+' : ''}${data.cfsDelta} CFS`
    : '--';
  const cfsTrendSubLabel = hasCfsTrend && data.trendPercent !== null
    ? `${cfsTrendWord} [${data.trendPercent >= 0 ? '+' : ''}${data.trendPercent}%]`
    : undefined;

  // Barometer display logic
  // For fishing: Falling = Green (feeding frenzy), Rising = Amber (lockjaw), Steady = Gray
  const baroTrendColor = barometer.trend === 'Falling' ? '#10B981' 
    : barometer.trend === 'Rising' ? '#F59E0B' 
    : '#6B7280';
  const baroTrendIcon = barometer.trend === 'Falling' ? 'trending-down' 
    : barometer.trend === 'Rising' ? 'trending-up' 
    : 'remove';

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

        {/* Hero Gauge - the main event */}
        <View style={styles.gaugeSection}>
          {data.isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlowGauge currentCFS={data.currentCFS} />
          )}
        </View>

        {/* Hydro Cards Row - Gage Height + Flow Trend */}
        <View style={styles.cardsRow}>
          <StatCard
            icon="water"
            value={data.gageHeightFt !== null ? `${data.gageHeightFt} ft` : '--'}
            label="Gage Height"
          />
          <StatCard
            icon={data.cfsDelta !== null && data.cfsDelta >= 0 ? 'trending-up' : 'trending-down'}
            value={cfsDeltaDisplay}
            valueColor={cfsTrendColor}
            subLabel={cfsTrendSubLabel}
            subLabelColor={cfsTrendColor}
            label="Flow Trend (24 HR)"
          />
        </View>

        {/* Barometer Card - Full Width */}
        <View style={styles.barometerCard}>
          <View style={styles.baroHeader}>
            <Ionicons name="speedometer-outline" size={22} color="#9CA3AF" style={{ opacity: 0.7 }} />
            <Text style={styles.baroTitle}>Barometer</Text>
          </View>
          
          <View style={styles.baroContent}>
            <Text style={styles.baroValue}>
              {barometer.pressureInHg !== null ? `${barometer.pressureInHg} inHg` : '--'}
            </Text>
            
            {barometer.trend && (
              <View style={styles.baroTrendContainer}>
                <Ionicons 
                  name={baroTrendIcon as keyof typeof Ionicons.glyphMap} 
                  size={18} 
                  color={baroTrendColor} 
                />
                <Text style={[styles.baroTrendText, { color: baroTrendColor }]}>
                  {barometer.trend}
                </Text>
                {barometer.deltaInHg !== null && (
                  <Text style={styles.baroRateText}>
                    ({barometer.deltaInHg >= 0 ? '+' : ''}{barometer.deltaInHg} /3hr)
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {barometer.trend === 'Falling' && (
            <Text style={styles.baroHint}>High fish activity expected</Text>
          )}
        </View>

        {/* Update Indicator - bottom */}
        <View style={styles.updateIndicator}>
          <Animated.View style={[styles.statusDot, { backgroundColor: statusDotColor }, pulseStyle]} />
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginBottom: 16,
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
    marginBottom: 16,
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
    gap: 12,
    marginBottom: 12,
    width: '100%',
  },
  // Barometer Card Styles
  barometerCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 16,
  },
  baroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  baroTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
  },
  baroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  baroValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  baroTrendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  baroTrendText: {
    fontSize: 16,
    fontWeight: '700',
  },
  baroRateText: {
    color: '#6B7280',
    fontSize: 12,
  },
  baroHint: {
    color: '#10B981',
    fontSize: 11,
    marginTop: 10,
    opacity: 0.8,
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
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
