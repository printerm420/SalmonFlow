import StatCard from '@/components/StatCard';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================
// CONSTANTS & TYPES
// ============================================
const CHART_HEIGHT = 200;
const PRIME_ZONE_MIN = 350;
const PRIME_ZONE_MAX = 750;
const CAUTION_ZONE_MAX = 1200;

interface DayData {
  date: Date;
  dayName: string;
  dayShort: string;
  cfs: number;
  waterTemp: number;
  zone: 'low' | 'prime' | 'caution' | 'blown';
  zoneLabel: string;
}

interface WeekStats {
  avgFlow: number;
  peakFlow: number;
  peakDay: string;
  lowestFlow: number;
  lowestDay: string;
  daysInPrime: number;
  daysInLow: number;
  daysInCaution: number;
  flowRange: number;
  volatility: 'stable' | 'moderate' | 'volatile';
  weekTrend: 'rising' | 'falling' | 'stable';
  weekTrendPercent: number;
  primePercentage: number;
}

// ============================================
// DATA GENERATION
// ============================================
function generateWeekData(): DayData[] {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Realistic mock CFS values that tell a story (rain mid-week, stabilizing)
  const mockCFS = [420, 385, 520, 745, 680, 542, 510];
  const mockTemps = [46, 47, 48, 49, 48, 48, 47];
  
  const data: DayData[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const cfs = mockCFS[6 - i];
    const zone = getZone(cfs);
    
    data.push({
      date,
      dayName: dayNames[date.getDay()],
      dayShort: dayShorts[date.getDay()],
      cfs,
      waterTemp: mockTemps[6 - i],
      zone: zone.zone,
      zoneLabel: zone.label,
    });
  }
  
  return data;
}

function getZone(cfs: number): { zone: 'low' | 'prime' | 'caution' | 'blown'; label: string } {
  if (cfs < PRIME_ZONE_MIN) return { zone: 'low', label: 'Low' };
  if (cfs <= PRIME_ZONE_MAX) return { zone: 'prime', label: 'Prime' };
  if (cfs <= CAUTION_ZONE_MAX) return { zone: 'caution', label: 'Caution' };
  return { zone: 'blown', label: 'Blown Out' };
}

function getZoneColor(zone: 'low' | 'prime' | 'caution' | 'blown'): string {
  switch (zone) {
    case 'low': return '#3B82F6';
    case 'prime': return '#10B981';
    case 'caution': return '#F59E0B';
    case 'blown': return '#EF4444';
  }
}

function calculateStats(data: DayData[]): WeekStats {
  const cfsValues = data.map(d => d.cfs);
  const avgFlow = Math.round(cfsValues.reduce((a, b) => a + b, 0) / cfsValues.length);
  const peakFlow = Math.max(...cfsValues);
  const lowestFlow = Math.min(...cfsValues);
  const flowRange = peakFlow - lowestFlow;
  
  const peakDay = data.find(d => d.cfs === peakFlow)?.dayName || '';
  const lowestDay = data.find(d => d.cfs === lowestFlow)?.dayName || '';
  
  const daysInPrime = data.filter(d => d.zone === 'prime').length;
  const daysInLow = data.filter(d => d.zone === 'low').length;
  const daysInCaution = data.filter(d => d.zone === 'caution').length;
  
  // Calculate volatility
  let volatility: 'stable' | 'moderate' | 'volatile' = 'stable';
  if (flowRange > 400) volatility = 'volatile';
  else if (flowRange > 200) volatility = 'moderate';
  
  // Calculate week trend (compare first 3 days avg vs last 3 days avg)
  const firstHalfAvg = cfsValues.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const secondHalfAvg = cfsValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const trendDiff = secondHalfAvg - firstHalfAvg;
  const weekTrendPercent = Math.round((trendDiff / firstHalfAvg) * 100);
  
  let weekTrend: 'rising' | 'falling' | 'stable' = 'stable';
  if (weekTrendPercent > 10) weekTrend = 'rising';
  else if (weekTrendPercent < -10) weekTrend = 'falling';
  
  return {
    avgFlow,
    peakFlow,
    peakDay,
    lowestFlow,
    lowestDay,
    daysInPrime,
    daysInLow,
    daysInCaution,
    flowRange,
    volatility,
    weekTrend,
    weekTrendPercent: Math.abs(weekTrendPercent),
    primePercentage: Math.round((daysInPrime / 7) * 100),
  };
}

function generateInsight(stats: WeekStats): string {
  const parts: string[] = [];
  
  // Prime zone insight
  if (stats.daysInPrime >= 5) {
    parts.push(`Excellent week with ${stats.daysInPrime} days in the prime zone.`);
  } else if (stats.daysInPrime >= 3) {
    parts.push(`Good week with ${stats.daysInPrime} days in prime fishing conditions.`);
  } else if (stats.daysInPrime > 0) {
    parts.push(`Challenging week with only ${stats.daysInPrime} day${stats.daysInPrime > 1 ? 's' : ''} in prime.`);
  } else {
    parts.push('Tough week—no days in the prime zone.');
  }
  
  // Trend insight
  if (stats.weekTrend === 'rising') {
    parts.push(`Flow rising ${stats.weekTrendPercent}% toward end of week.`);
  } else if (stats.weekTrend === 'falling') {
    parts.push(`Flow dropping ${stats.weekTrendPercent}% into the weekend.`);
  }
  
  // Peak insight
  parts.push(`Peak of ${stats.peakFlow} CFS on ${stats.peakDay}.`);
  
  return parts.join(' ');
}

// ============================================
// ANIMATED BAR COMPONENT
// ============================================
interface AnimatedBarProps {
  item: DayData;
  index: number;
  maxCFS: number;
  isSelected: boolean;
  onPress: () => void;
}

function AnimatedBar({ item, index, maxCFS, isSelected, onPress }: AnimatedBarProps) {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const targetHeight = (item.cfs / (maxCFS + 100)) * CHART_HEIGHT;
  const barColor = getZoneColor(item.zone);
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.parallel([
        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          friction: 6,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.1 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);
  
  return (
    <Pressable style={styles.barContainer} onPress={onPress}>
      <Animated.View 
        style={[
          styles.barWrapper,
          { opacity: animatedOpacity, transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Value tooltip - only show when selected */}
        {isSelected && (
          <View style={[styles.valueTooltip, { bottom: targetHeight + 8 }]}>
            <Text style={styles.valueTooltipText}>{item.cfs}</Text>
          </View>
        )}
        
        {/* Bar */}
        <Animated.View 
          style={[
            styles.bar, 
            { 
              height: animatedHeight, 
              backgroundColor: barColor,
              shadowColor: barColor,
              borderWidth: isSelected ? 2 : 0,
              borderColor: '#FFFFFF',
            }
          ]} 
        />
        
        {/* Glow effect */}
        <Animated.View 
          style={[
            styles.barGlow, 
            { 
              height: Animated.multiply(animatedHeight, 0.5),
              backgroundColor: barColor,
              opacity: isSelected ? 0.5 : 0.25,
            }
          ]} 
        />
      </Animated.View>
      
      {/* Day label */}
      <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
        {item.dayShort}
      </Text>
    </Pressable>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function TrendsScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Generate data and calculate stats
  const weekData = useMemo(() => generateWeekData(), []);
  const stats = useMemo(() => calculateStats(weekData), [weekData]);
  const insight = useMemo(() => generateInsight(stats), [stats]);
  const maxCFS = useMemo(() => Math.max(...weekData.map(d => d.cfs)), [weekData]);
  
  // Current flow (latest data point)
  const currentFlow = weekData[weekData.length - 1];
  const prevDayFlow = weekData[weekData.length - 2];
  const dayChange = currentFlow.cfs - prevDayFlow.cfs;
  const dayChangePercent = Math.round((dayChange / prevDayFlow.cfs) * 100);
  
  const trendColor = dayChangePercent >= 0 ? '#10B981' : '#EF4444';
  const trendIcon = dayChangePercent >= 0 ? 'arrow-up' : 'arrow-down';
  
  // Selected day info
  const selectedDay = selectedIndex !== null ? weekData[selectedIndex] : null;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const handleBarPress = useCallback((index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  }, []);
  
  // Calculate prime zone line positions
  const primeMinY = ((maxCFS + 100 - PRIME_ZONE_MAX) / (maxCFS + 100)) * CHART_HEIGHT;
  const primeMaxY = ((maxCFS + 100 - PRIME_ZONE_MIN) / (maxCFS + 100)) * CHART_HEIGHT;
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerLeft}>
            <FontAwesome6 name="chart-line" size={22} color="#10B981" style={{ marginRight: 12 }} />
            <Text style={styles.headerTitle}>7-Day Trend</Text>
          </View>
          
          {/* Current Flow Badge */}
          <View style={styles.flowBadge}>
            <Text style={styles.flowBadgeValue}>{currentFlow.cfs}</Text>
            <Text style={styles.flowBadgeUnit}>CFS</Text>
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '20' }]}>
              <Ionicons name={trendIcon as any} size={12} color={trendColor} />
              <Text style={[styles.trendBadgeText, { color: trendColor }]}>
                {Math.abs(dayChangePercent)}%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          {/* Prime Zone Background Band */}
          <View style={[styles.primeZoneBand, { top: primeMinY + 60, height: primeMaxY - primeMinY }]} />
          
          {/* Prime Zone Top Line (750 CFS) */}
          <View style={[styles.zoneLine, { top: primeMinY + 60 }]}>
            <View style={styles.zoneLineDashed} />
            <View style={styles.zoneLabelBg}>
              <Text style={[styles.zoneLineLabel, { color: '#10B981' }]}>750</Text>
            </View>
          </View>
          
          {/* Prime Zone Bottom Line (350 CFS) */}
          <View style={[styles.zoneLine, { top: primeMaxY + 60 }]}>
            <View style={styles.zoneLineDashed} />
            <View style={styles.zoneLabelBg}>
              <Text style={[styles.zoneLineLabel, { color: '#10B981' }]}>350</Text>
            </View>
          </View>
          
          {/* Chart Area with Bars */}
          <View style={styles.chartArea}>
            {weekData.map((item, index) => (
              <AnimatedBar
                key={item.dayShort}
                item={item}
                index={index}
                maxCFS={maxCFS}
                isSelected={selectedIndex === index}
                onPress={() => handleBarPress(index)}
              />
            ))}
          </View>
          
          {/* Y-Axis labels */}
          <View style={styles.yAxisLabels}>
            <Text style={styles.axisLabel}>{maxCFS + 100}</Text>
            <Text style={[styles.axisLabel, { color: '#10B981' }]}>750</Text>
            <Text style={[styles.axisLabel, { color: '#10B981' }]}>350</Text>
            <Text style={styles.axisLabel}>0</Text>
          </View>
        </View>

        {/* Selected Day Detail Card */}
        {selectedDay && (
          <Animated.View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selectedDay.dayName}</Text>
              <View style={[styles.zoneBadge, { backgroundColor: getZoneColor(selectedDay.zone) + '20' }]}>
                <Text style={[styles.zoneBadgeText, { color: getZoneColor(selectedDay.zone) }]}>
                  {selectedDay.zoneLabel}
                </Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="water" size={18} color="#3B82F6" />
                <Text style={styles.detailValue}>{selectedDay.cfs} CFS</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="thermometer" size={18} color="#F59E0B" />
                <Text style={styles.detailValue}>{selectedDay.waterTemp}°F</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={18} color="#9CA3AF" />
                <Text style={styles.detailValue}>
                  {selectedDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

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
            <Text style={styles.legendText}>Caution (&gt;750)</Text>
          </View>
        </View>

        {/* Weekly Insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color="#F59E0B" />
            <Text style={styles.insightTitle}>Weekly Insight</Text>
          </View>
          <Text style={styles.insightText}>{insight}</Text>
        </View>

        {/* Stats Grid - 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="analytics"
              value={`${stats.avgFlow}`}
              label="Avg Flow (CFS)"
              subLabel={`Range: ${stats.flowRange}`}
              subLabelColor="#6B7280"
            />
            <StatCard
              icon="arrow-up-circle"
              value={`${stats.peakFlow}`}
              label="Peak Flow"
              valueColor="#F59E0B"
              subLabel={stats.peakDay}
              subLabelColor="#F59E0B"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="arrow-down-circle"
              value={`${stats.lowestFlow}`}
              label="Lowest Flow"
              valueColor="#3B82F6"
              subLabel={stats.lowestDay}
              subLabelColor="#3B82F6"
            />
            <StatCard
              icon="fish"
              value={`${stats.daysInPrime}`}
              label="Days in Prime"
              valueColor="#10B981"
              subLabel={`${stats.primePercentage}% of week`}
              subLabelColor="#10B981"
            />
          </View>
        </View>

        {/* Weekly Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Zone Breakdown</Text>
          <View style={styles.breakdownBar}>
            {stats.daysInLow > 0 && (
              <View style={[styles.breakdownSegment, { 
                flex: stats.daysInLow, 
                backgroundColor: '#3B82F6',
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              }]} />
            )}
            {stats.daysInPrime > 0 && (
              <View style={[styles.breakdownSegment, { 
                flex: stats.daysInPrime, 
                backgroundColor: '#10B981',
                borderTopLeftRadius: stats.daysInLow === 0 ? 8 : 0,
                borderBottomLeftRadius: stats.daysInLow === 0 ? 8 : 0,
                borderTopRightRadius: stats.daysInCaution === 0 ? 8 : 0,
                borderBottomRightRadius: stats.daysInCaution === 0 ? 8 : 0,
              }]} />
            )}
            {stats.daysInCaution > 0 && (
              <View style={[styles.breakdownSegment, { 
                flex: stats.daysInCaution, 
                backgroundColor: '#F59E0B',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              }]} />
            )}
          </View>
          <View style={styles.breakdownLabels}>
            {stats.daysInLow > 0 && (
              <Text style={[styles.breakdownLabel, { color: '#3B82F6' }]}>
                {stats.daysInLow} Low
              </Text>
            )}
            {stats.daysInPrime > 0 && (
              <Text style={[styles.breakdownLabel, { color: '#10B981' }]}>
                {stats.daysInPrime} Prime
              </Text>
            )}
            {stats.daysInCaution > 0 && (
              <Text style={[styles.breakdownLabel, { color: '#F59E0B' }]}>
                {stats.daysInCaution} Caution
              </Text>
            )}
          </View>
        </View>

        {/* Week Trend Card */}
        <View style={styles.weekTrendCard}>
          <View style={styles.weekTrendHeader}>
            <Ionicons 
              name={stats.weekTrend === 'rising' ? 'trending-up' : stats.weekTrend === 'falling' ? 'trending-down' : 'remove'} 
              size={24} 
              color={stats.weekTrend === 'rising' ? '#10B981' : stats.weekTrend === 'falling' ? '#EF4444' : '#6B7280'} 
            />
            <Text style={styles.weekTrendTitle}>Week Trend</Text>
          </View>
          <View style={styles.weekTrendContent}>
            <Text style={[styles.weekTrendValue, { 
              color: stats.weekTrend === 'rising' ? '#10B981' : stats.weekTrend === 'falling' ? '#EF4444' : '#6B7280' 
            }]}>
              {stats.weekTrend === 'stable' ? 'Stable' : `${stats.weekTrendPercent}% ${stats.weekTrend}`}
            </Text>
            <View style={styles.volatilityBadge}>
              <Text style={styles.volatilityLabel}>Volatility:</Text>
              <Text style={[styles.volatilityValue, {
                color: stats.volatility === 'volatile' ? '#F59E0B' : stats.volatility === 'moderate' ? '#3B82F6' : '#10B981'
              }]}>
                {stats.volatility.charAt(0).toUpperCase() + stats.volatility.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.updateText}>
            {weekData[0].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekData[6].date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • USGS 04250200
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
    marginBottom: 20,
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
    overflow: 'hidden',
  },
  primeZoneBand: {
    position: 'absolute',
    left: 40,
    right: 20,
    backgroundColor: '#10B98108',
    zIndex: 0,
  },
  zoneLine: {
    position: 'absolute',
    left: 40,
    right: 20,
    height: 1,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneLineDashed: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#10B981',
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  zoneLabelBg: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  zoneLineLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT + 40,
    paddingLeft: 30,
    paddingTop: 20,
    zIndex: 2,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  valueTooltipText: {
    color: '#121212',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bar: {
    width: 28,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  barGlow: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    borderRadius: 10,
  },
  dayLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 10,
    fontWeight: '500',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 8,
    top: 40,
    bottom: 40,
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
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
    fontSize: 11,
  },
  insightCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 22,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  breakdownTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekTrendCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  weekTrendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  weekTrendTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  weekTrendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekTrendValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  volatilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volatilityLabel: {
    color: '#6B7280',
    fontSize: 12,
  },
  volatilityValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
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
