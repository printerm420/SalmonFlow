import { HardPaywall } from '@/components/HardPaywall';
import { useSubscription } from '@/contexts/SubscriptionContext';
import StatCard from '@/components/StatCard';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// USGS Site: 04250200 (Salmon River at Pulaski, NY)
const USGS_SITE = '04250200';
const USGS_IV_BASE = 'https://waterservices.usgs.gov/nwis/iv/?format=json';
const USGS_DV_BASE = 'https://waterservices.usgs.gov/nwis/dv/?format=json';

// Prime zone thresholds
const PRIME_ZONE_MIN = 350;
const PRIME_ZONE_MAX = 750;

// Chart scaling - bars scale to 800, anything above just maxes out
const CHART_SCALE = 800;
const CHART_HEIGHT = 180;

interface DailyData {
  day: string; // Day name (Mon, Tue, etc.)
  date: string; // Full date for tooltip
  cfs: number; // Daily mean CFS
}

interface TrendsData {
  dailyData: DailyData[];
  currentCFS: number;
  trend24hr: number | null; // percentage change
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

const DEFAULT_STATE: TrendsData = {
  dailyData: [],
  currentCFS: 0,
  trend24hr: null,
  isLoading: true,
  error: null,
  lastUpdated: new Date(),
};

// Format day name from date
const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

// Format date for tooltip
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function TrendsScreen() {
  const { isPro } = useSubscription();
  const [data, setData] = useState<TrendsData>(DEFAULT_STATE);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const fetchTrendsData = useCallback(async () => {
    try {
      // Fetch daily values for past 7 days (completed days only)
      // Also fetch current instantaneous value + 24hr history for trend
      const dailyUrl = `${USGS_DV_BASE}&sites=${USGS_SITE}&parameterCd=00060&period=P7D`;
      const currentUrl = `${USGS_IV_BASE}&sites=${USGS_SITE}&parameterCd=00060`;
      const historyUrl = `${USGS_IV_BASE}&sites=${USGS_SITE}&parameterCd=00060&period=P1D`;

      const [dailyRes, currentRes, historyRes] = await Promise.all([
        fetch(dailyUrl),
        fetch(currentUrl),
        fetch(historyUrl),
      ]);

      if (!dailyRes.ok || !currentRes.ok) {
        throw new Error('Failed to fetch USGS data');
      }

      const dailyJson = await dailyRes.json();
      const currentJson = await currentRes.json();
      const historyJson = historyRes.ok ? await historyRes.json() : null;

      // Parse daily values
      const dailyTimeSeries = dailyJson?.value?.timeSeries?.[0]?.values?.[0]?.value || [];
      const dailyData: DailyData[] = dailyTimeSeries.map((item: { dateTime: string; value: string }) => ({
        day: getDayName(item.dateTime),
        date: formatDate(item.dateTime),
        cfs: Math.round(parseFloat(item.value)),
      }));

      // Parse current flow
      let currentCFS = 0;
      let lastUpdated = new Date();
      const currentTimeSeries = currentJson?.value?.timeSeries || [];
      for (const series of currentTimeSeries) {
        const paramCode = series?.variable?.variableCode?.[0]?.value;
        const values = series?.values?.[0]?.value || [];
        const latestValue = values[values.length - 1];
        if (latestValue && paramCode === '00060') {
          currentCFS = Math.round(parseFloat(latestValue.value));
          lastUpdated = new Date(latestValue.dateTime);
        }
      }

      // Calculate 24hr trend percentage
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
        dailyData,
        currentCFS,
        trend24hr,
        isLoading: false,
        error: null,
        lastUpdated,
      });

    } catch (err) {
      console.error('Error fetching trends data:', err);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTrendsData();
  }, [fetchTrendsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrendsData();
    setRefreshing(false);
  }, [fetchTrendsData]);

  // Calculate stats from daily data
  const avgFlow = data.dailyData.length > 0
    ? Math.round(data.dailyData.reduce((sum, d) => sum + d.cfs, 0) / data.dailyData.length)
    : 0;
  const peakFlow = data.dailyData.length > 0
    ? Math.max(...data.dailyData.map(d => d.cfs))
    : 0;
  const lowestFlow = data.dailyData.length > 0
    ? Math.min(...data.dailyData.map(d => d.cfs))
    : 0;
  const daysInPrime = data.dailyData.filter(d => d.cfs >= PRIME_ZONE_MIN && d.cfs <= PRIME_ZONE_MAX).length;

  // Trend display
  const hasTrend = data.trend24hr !== null;
  const trendColor = hasTrend && data.trend24hr! > 0 ? '#EF4444' : hasTrend && data.trend24hr! < 0 ? '#10B981' : '#6B7280';
  const trendIcon = hasTrend && data.trend24hr! >= 0 ? 'arrow-up' : 'arrow-down';
  
  // If not Pro, show locked state
  if (!isPro) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.lockedContainer}>
          <View style={styles.lockedContent}>
            <View style={styles.lockedIconContainer}>
              <Ionicons name="lock-closed" size={64} color="#10B981" />
            </View>
            <Text style={styles.lockedTitle}>Trends Analysis</Text>
            <Text style={styles.lockedSubtitle}>
              Unlock detailed flow trends, historical data, and advanced analytics
            </Text>
            <Pressable 
              style={styles.unlockButton}
              onPress={() => setShowPaywall(true)}
            >
              <Ionicons name="diamond" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.unlockButtonText}>Unlock Trends with Pro</Text>
            </Pressable>
            <Text style={styles.lockedFeatures}>
              Includes: 7-day trends • Flow analytics • Prime zone history
            </Text>
          </View>
        </View>

        {/* Paywall Modal */}
        <Modal
          visible={showPaywall}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPaywall(false)}
        >
          <HardPaywall
            onSubscribed={() => {
              setShowPaywall(false);
            }}
            onDismiss={() => setShowPaywall(false)}
          />
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#10B981"
          />
        }
      >
        {/* Header with current flow badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome6 name="chart-line" size={22} color="#10B981" style={{ marginRight: 12 }} />
            <Text style={styles.headerTitle}>7-Day Trend</Text>
          </View>
          
          {/* Current Flow Badge */}
          <View style={styles.flowBadge}>
            {data.isLoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Text style={styles.flowBadgeValue}>{data.currentCFS}</Text>
                <Text style={styles.flowBadgeUnit}>CFS</Text>
                {hasTrend && (
                  <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
                    <Ionicons name={trendIcon} size={12} color={trendColor} />
                    <Text style={[styles.trendBadgeText, { color: trendColor }]}>
                      {Math.abs(data.trend24hr!)}%
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          {data.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading trend data...</Text>
            </View>
          ) : data.error ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="cloud-offline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load data</Text>
              <Text style={styles.errorSubtext}>Pull down to retry</Text>
            </View>
          ) : data.dailyData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No data available</Text>
            </View>
          ) : (
            <>
              {/* Prime Zone Indicator */}
              <View style={styles.primeZoneContainer}>
                <View style={styles.primeZoneLine} />
                <View style={styles.primeZoneLabelBg}>
                  <Text style={styles.primeZoneLabel}>PRIME ZONE</Text>
                </View>
              </View>
              
              {/* Chart Area with Bars */}
              <View style={styles.chartArea}>
                {data.dailyData.map((item, index) => {
                  // Bar scales to 800, caps at top if higher (blowout days just max out)
                  const rawHeight = (item.cfs / CHART_SCALE) * CHART_HEIGHT;
                  const barHeight = Math.min(rawHeight, CHART_HEIGHT); // Cap at chart height
                  const isPrime = item.cfs >= PRIME_ZONE_MIN && item.cfs <= PRIME_ZONE_MAX;
                  const barColor = isPrime ? '#10B981' : (item.cfs > PRIME_ZONE_MAX ? '#F59E0B' : '#3B82F6');
                  
                  return (
                    <View key={`${item.day}-${index}`} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        {/* Value tooltip */}
                        <View style={[styles.valueTooltip, { bottom: barHeight + 8 }]}>
                          <Text style={styles.valueTooltipText}>{item.cfs}</Text>
                        </View>
                        
                        {/* Bar */}
                        <View 
                          style={[
                            styles.bar, 
                            { 
                              height: barHeight, 
                              backgroundColor: barColor,
                              shadowColor: barColor,
                            }
                          ]} 
                        />
                        
                        {/* Glow effect */}
                        <View 
                          style={[
                            styles.barGlow, 
                            { 
                              height: barHeight * 0.6, 
                              backgroundColor: barColor,
                            }
                          ]} 
                        />
                      </View>
                      
                      {/* Day label */}
                      <Text style={styles.dayLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Y-Axis labels */}
              <View style={styles.yAxisLabels}>
                <Text style={styles.axisLabel}>800+</Text>
                <Text style={styles.axisLabel}>600</Text>
                <Text style={styles.axisLabel}>400</Text>
                <Text style={styles.axisLabel}>0</Text>
              </View>
            </>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Low (&lt;350)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Prime (350-750)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>High (&gt;750)</Text>
          </View>
        </View>

        {/* Stats Grid - 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="analytics"
              value={data.isLoading ? '--' : `${avgFlow}`}
              label="Avg Flow (CFS)"
            />
            <StatCard
              icon="arrow-up-circle"
              value={data.isLoading ? '--' : `${peakFlow}`}
              label="Peak Flow (CFS)"
              valueColor="#F59E0B"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="arrow-down-circle"
              value={data.isLoading ? '--' : `${lowestFlow}`}
              label="Lowest (CFS)"
              valueColor="#3B82F6"
            />
            <StatCard
              icon="fish"
              value={data.isLoading ? '--' : `${daysInPrime}`}
              label="Days in Prime"
              valueColor="#10B981"
            />
          </View>
        </View>

        {/* Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={[styles.statusDot, { backgroundColor: data.error ? '#EF4444' : '#10B981' }]} />
          <Text style={styles.updateText}>
            {data.error 
              ? 'Connection error' 
              : `Last ${data.dailyData.length} days • USGS ${USGS_SITE}`}
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
    justifyContent: 'space-between',
    paddingTop: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  flowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    minWidth: 80,
    justifyContent: 'center',
  },
  flowBadgeValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flowBadgeUnit: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  chartCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 20,
    paddingTop: 40,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 16,
    position: 'relative',
    minHeight: 280,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 12,
  },
  primeZoneContainer: {
    position: 'absolute',
    top: 80,
    left: 40,
    right: 20,
    height: 1,
    zIndex: 1,
  },
  primeZoneLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#10B981',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  primeZoneLabelBg: {
    position: 'absolute',
    right: 0,
    top: -10,
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 8,
  },
  primeZoneLabel: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 40,
    paddingLeft: 30,
    paddingTop: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT,
    width: '100%',
  },
  valueTooltip: {
    position: 'absolute',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  valueTooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  bar: {
    width: 24,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  barGlow: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    borderRadius: 8,
    opacity: 0.3,
  },
  dayLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 10,
    fontWeight: '500',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 12,
    top: 40,
    bottom: 40,
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#6B7280',
    fontSize: 12,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
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
  // Locked state styles
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lockedContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  lockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#10B98115',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#10B98130',
  },
  lockedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  lockedFeatures: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
