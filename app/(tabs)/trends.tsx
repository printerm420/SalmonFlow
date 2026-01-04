import React from 'react';
import { View, Text, SafeAreaView, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TrendsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Trends</Text>
            <Text style={styles.headerSubtitle}>7-Day Flow History</Text>
          </View>

          {/* Chart Placeholder Card */}
          <View style={styles.chartCard}>
             
             {/* Mock Chart Lines (Visual placeholder) */}
             <View style={styles.chartBg1} />
             <View style={styles.chartBg2} />
             
             <View style={styles.chartPlaceholder}>
                <Ionicons name="trending-up" size={48} color="#2D2D2D" />
                <Text style={styles.chartPlaceholderText}>
                    Chart Component Area{'\n'}
                    (react-native-gifted-charts)
                </Text>
             </View>

             {/* Axis Labels Placeholder */}
             <View style={styles.yAxis}>
                <Text style={styles.axisLabel}>800</Text>
                <Text style={styles.axisLabel}>600</Text>
                <Text style={styles.axisLabel}>400</Text>
                <Text style={styles.axisLabel}>200</Text>
             </View>
             
             <View style={styles.xAxis}>
                <Text style={styles.axisLabel}>Mon</Text>
                <Text style={styles.axisLabel}>Tue</Text>
                <Text style={styles.axisLabel}>Wed</Text>
                <Text style={styles.axisLabel}>Thu</Text>
                <Text style={styles.axisLabel}>Fri</Text>
                <Text style={styles.axisLabel}>Sat</Text>
                <Text style={styles.axisLabel}>Sun</Text>
             </View>
          </View>

          {/* Statistics Grid */}
          <View style={styles.statsGrid}>
            {/* Stat 1 */}
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg Flow</Text>
                <Text style={styles.statValue}>542 <Text style={styles.statUnit}>CFS</Text></Text>
            </View>
            
            {/* Stat 2 */}
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Peak</Text>
                <Text style={styles.statValue}>780 <Text style={styles.statUnit}>CFS</Text></Text>
            </View>

            {/* Stat 3 */}
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Trend</Text>
                <View style={styles.statRow}>
                    <Ionicons name="trending-up" size={16} color="#10B981" style={styles.statIcon} />
                    <Text style={styles.statValueGreen}>-12%</Text>
                </View>
            </View>

            {/* Stat 4 */}
            <View style={styles.statCard}>
                <Text style={styles.statLabel}>Days Prime</Text>
                <View style={styles.statRow}>
                    <Ionicons name="calendar" size={16} color="#3B82F6" style={styles.statIcon} />
                    <Text style={styles.statValueBlue}>4/7</Text>
                </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    marginBottom: 32,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 24,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  chartBg1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    opacity: 0.2,
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  chartBg2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 128,
    opacity: 0.2,
    backgroundColor: '#10B981',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  chartPlaceholderText: {
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  yAxis: {
    position: 'absolute',
    left: 16,
    top: 16,
    bottom: 16,
    width: 24,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    paddingRight: 8,
  },
  xAxis: {
    position: 'absolute',
    left: 40,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  axisLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 4,
  },
  statValueGreen: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statValueBlue: {
    color: '#3B82F6',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

