import StatCard from '@/components/StatCard';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock Data per PRD
const MOCK_CURRENT = {
  currentCFS: 542,
  trend24hr: 12,
};

const MOCK_TREND = [
  { day: 'Mon', cfs: 420 },
  { day: 'Tue', cfs: 380 },
  { day: 'Wed', cfs: 520 },
  { day: 'Thu', cfs: 680 },
  { day: 'Fri', cfs: 590 },
  { day: 'Sat', cfs: 542 },
  { day: 'Sun', cfs: 510 },
];

// Calculate stats from mock data
const avgFlow = Math.round(MOCK_TREND.reduce((sum, d) => sum + d.cfs, 0) / MOCK_TREND.length);
const peakFlow = Math.max(...MOCK_TREND.map(d => d.cfs));
const lowestFlow = Math.min(...MOCK_TREND.map(d => d.cfs));
const daysInPrime = MOCK_TREND.filter(d => d.cfs >= 350 && d.cfs <= 750).length;

// Find max for chart scaling
const maxCFS = Math.max(...MOCK_TREND.map(d => d.cfs));
const CHART_HEIGHT = 180;
const PRIME_ZONE_MIN = 350;
const PRIME_ZONE_MAX = 750;

export default function TrendsScreen() {
  const trendColor = MOCK_CURRENT.trend24hr > 0 ? '#10B981' : '#EF4444';
  const trendIcon = MOCK_CURRENT.trend24hr > 0 ? 'arrow-up' : 'arrow-down';
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with current flow badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FontAwesome6 name="chart-line" size={22} color="#10B981" style={{ marginRight: 12 }} />
            <Text style={styles.headerTitle}>7-Day Trend</Text>
          </View>
          
          {/* Current Flow Badge */}
          <View style={styles.flowBadge}>
            <Text style={styles.flowBadgeValue}>{MOCK_CURRENT.currentCFS}</Text>
            <Text style={styles.flowBadgeUnit}>CFS</Text>
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
              <Ionicons name={trendIcon} size={12} color={trendColor} />
              <Text style={[styles.trendBadgeText, { color: trendColor }]}>
                {MOCK_CURRENT.trend24hr}%
              </Text>
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          {/* Prime Zone Indicator */}
          <View style={styles.primeZoneContainer}>
            <View style={styles.primeZoneLine} />
            <View style={styles.primeZoneLabelBg}>
              <Text style={styles.primeZoneLabel}>PRIME ZONE</Text>
            </View>
          </View>
          
          {/* Chart Area with Bars */}
          <View style={styles.chartArea}>
            {MOCK_TREND.map((item, index) => {
              const barHeight = (item.cfs / (maxCFS + 100)) * CHART_HEIGHT;
              const isPrime = item.cfs >= PRIME_ZONE_MIN && item.cfs <= PRIME_ZONE_MAX;
              const barColor = isPrime ? '#10B981' : (item.cfs > PRIME_ZONE_MAX ? '#F59E0B' : '#3B82F6');
              
              return (
                <View key={item.day} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    {/* Value on hover area */}
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
            <Text style={styles.axisLabel}>{maxCFS + 100}</Text>
            <Text style={styles.axisLabel}>750</Text>
            <Text style={styles.axisLabel}>350</Text>
            <Text style={styles.axisLabel}>0</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Low (&gt;350)</Text>
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
              value={`${avgFlow}`}
              label="Avg Flow (CFS)"
            />
            <StatCard
              icon="arrow-up-circle"
              value={`${peakFlow}`}
              label="Peak Flow (CFS)"
              valueColor="#F59E0B"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="arrow-down-circle"
              value={`${lowestFlow}`}
              label="Lowest (CFS)"
              valueColor="#3B82F6"
            />
            <StatCard
              icon="fish"
              value={`${daysInPrime}`}
              label="Days in Prime"
              valueColor="#10B981"
            />
          </View>
        </View>

        {/* Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.updateText}>
            Last 7 days • USGS 04250200
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
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  updateText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});