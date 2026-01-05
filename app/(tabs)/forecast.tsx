import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

// Mock Weather Data per PRD
const MOCK_WEATHER = {
  current: { temp: 74, condition: 'Partly Cloudy', feelsLike: 78 },
  today: { high: 82, low: 68, precip: 15, wind: '8 mph SE', daylight: '14h 22m' },
  forecast: [
    { day: 'Today', high: 82, low: 68, precip: 15, icon: 'sun' },
    { day: 'Mon', high: 76, low: 62, precip: 80, icon: 'cloud-rain' },
    { day: 'Tue', high: 72, low: 58, precip: 40, icon: 'cloud-sun' },
    { day: 'Wed', high: 78, low: 64, precip: 10, icon: 'sun' },
    { day: 'Thu', high: 80, low: 66, precip: 5, icon: 'sun' },
    { day: 'Fri', high: 75, low: 60, precip: 60, icon: 'cloud-rain' },
    { day: 'Sat', high: 70, low: 55, precip: 25, icon: 'cloud' },
  ],
};

// Weather icon mapping
const getWeatherIcon = (icon: string) => {
  switch (icon) {
    case 'sun':
      return { name: 'sun', color: '#FBBF24' };
    case 'cloud-sun':
      return { name: 'cloud-sun', color: '#9CA3AF' };
    case 'cloud':
      return { name: 'cloud', color: '#6B7280' };
    case 'cloud-rain':
      return { name: 'cloud-rain', color: '#3B82F6' };
    default:
      return { name: 'sun', color: '#FBBF24' };
  }
};

export default function ForecastScreen() {
  const [webViewLoading, setWebViewLoading] = useState(true);
  const currentIcon = getWeatherIcon('cloud-sun'); // Partly cloudy

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
          <FontAwesome6 name="cloud-sun" size={22} color="#FBBF24" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>Forecast</Text>
          <Text style={styles.headerLocation}>Pulaski, NY 13142</Text>
        </View>

        {/* Current Weather Hero Card */}
        <View style={styles.currentWeatherCard}>
          {/* Main temp and condition */}
          <View style={styles.weatherMain}>
            <View style={styles.tempContainer}>
              <Text style={styles.currentTemp}>{MOCK_WEATHER.current.temp}°</Text>
              <FontAwesome6 
                name={currentIcon.name} 
                size={48} 
                color={currentIcon.color} 
                style={styles.weatherIcon}
              />
            </View>
            <Text style={styles.condition}>{MOCK_WEATHER.current.condition}</Text>
            <Text style={styles.feelsLike}>Feels like {MOCK_WEATHER.current.feelsLike}°F</Text>
          </View>

          {/* Weather Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="thermometer-outline" size={18} color="#9CA3AF" />
              <Text style={styles.detailValue}>
                {MOCK_WEATHER.today.high}° / {MOCK_WEATHER.today.low}°
              </Text>
              <Text style={styles.detailLabel}>High / Low</Text>
            </View>
            
            <View style={styles.detailDivider} />
            
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={18} color="#3B82F6" />
              <Text style={styles.detailValue}>{MOCK_WEATHER.today.precip}%</Text>
              <Text style={styles.detailLabel}>Precip</Text>
            </View>
            
            <View style={styles.detailDivider} />
            
            <View style={styles.detailItem}>
              <FontAwesome6 name="wind" size={16} color="#9CA3AF" />
              <Text style={styles.detailValue}>{MOCK_WEATHER.today.wind}</Text>
              <Text style={styles.detailLabel}>Wind</Text>
            </View>
            
            <View style={styles.detailDivider} />
            
            <View style={styles.detailItem}>
              <Ionicons name="sunny-outline" size={18} color="#FBBF24" />
              <Text style={styles.detailValue}>{MOCK_WEATHER.today.daylight}</Text>
              <Text style={styles.detailLabel}>Daylight</Text>
            </View>
          </View>
        </View>

        {/* 7-Day Forecast Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastScroll}
        >
          {MOCK_WEATHER.forecast.map((day, index) => {
            const iconData = getWeatherIcon(day.icon);
            const isToday = day.day === 'Today';
            
            return (
              <View 
                key={day.day} 
                style={[
                  styles.forecastCard,
                  isToday && styles.forecastCardToday
                ]}
              >
                <Text style={[styles.forecastDay, isToday && styles.forecastDayToday]}>
                  {day.day}
                </Text>
                <FontAwesome6 
                  name={iconData.name} 
                  size={28} 
                  color={iconData.color} 
                  style={styles.forecastIcon}
                />
                <View style={styles.forecastTemps}>
                  <Text style={styles.forecastHigh}>{day.high}°</Text>
                  <Text style={styles.forecastLow}>{day.low}°</Text>
                </View>
                {day.precip > 0 && (
                  <View style={styles.precipBadge}>
                    <Ionicons name="water" size={10} color="#3B82F6" />
                    <Text style={styles.precipText}>{day.precip}%</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Dam Release Schedule Section */}
        <View style={styles.damSection}>
          <View style={styles.damHeader}>
            <View style={styles.damTitleRow}>
              <FontAwesome6 name="water" size={18} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={styles.damTitle}>Dam Release Schedule</Text>
            </View>
            <Pressable 
              onPress={() => Linking.openURL('https://safewaters.com/facility/lighthouse-hill')}
              style={styles.safewatersBadge}
            >
              <Text style={styles.safewatersBadgeText}>SafeWaters.com</Text>
              <Ionicons name="open-outline" size={12} color="#10B981" />
            </Pressable>
          </View>
          
          <View style={styles.webViewContainer}>
            {webViewLoading && (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading schedule...</Text>
              </View>
            )}
            <WebView
              source={{ uri: 'https://safewaters.com/facility/lighthouse-hill' }}
              style={styles.webView}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
          </View>
        </View>

        {/* Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.updateText}>
            Weather data • OpenWeatherMap
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
    paddingTop: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerLocation: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 'auto',
  },
  currentWeatherCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    marginBottom: 24,
  },
  weatherMain: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentTemp: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '200',
    letterSpacing: -4,
  },
  weatherIcon: {
    marginLeft: 16,
  },
  condition: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  feelsLike: {
    color: '#6B7280',
    fontSize: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2D2D2D',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forecastScroll: {
    paddingRight: 16,
    gap: 12,
  },
  forecastCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    minWidth: 80,
  },
  forecastCardToday: {
    backgroundColor: '#10B98115',
    borderColor: '#10B98140',
  },
  forecastDay: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forecastDayToday: {
    color: '#10B981',
  },
  forecastIcon: {
    marginBottom: 12,
  },
  forecastTemps: {
    alignItems: 'center',
  },
  forecastHigh: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forecastLow: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F610',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 10,
    gap: 4,
  },
  precipText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  damSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  damHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  damTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  damTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  safewatersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  safewatersBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  webViewContainer: {
    height: 350,
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    zIndex: 1,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: '#1E1E1E',
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
