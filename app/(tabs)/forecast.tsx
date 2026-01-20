import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
// import { WebView } from 'react-native-webview'; // COMMENTED OUT FOR V1 - Will add back in v1.1

// Pulaski, NY coordinates
const PULASKI_LAT = 43.57;
const PULASKI_LON = -76.13;

// Weather code to icon mapping (WMO codes)
const getWeatherIcon = (code: number): { name: string; color: string } => {
  // Clear
  if (code === 0) return { name: 'sun', color: '#FBBF24' };
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) return { name: 'cloud-sun', color: '#9CA3AF' };
  // Overcast
  if (code === 3) return { name: 'cloud', color: '#6B7280' };
  // Fog
  if (code >= 45 && code <= 48) return { name: 'smog', color: '#6B7280' };
  // Drizzle
  if (code >= 51 && code <= 57) return { name: 'cloud-rain', color: '#60A5FA' };
  // Rain
  if (code >= 61 && code <= 67) return { name: 'cloud-showers-heavy', color: '#3B82F6' };
  // Snow
  if (code >= 71 && code <= 77) return { name: 'snowflake', color: '#A5B4FC' };
  // Rain showers
  if (code >= 80 && code <= 82) return { name: 'cloud-rain', color: '#3B82F6' };
  // Snow showers
  if (code >= 85 && code <= 86) return { name: 'snowflake', color: '#A5B4FC' };
  // Thunderstorm
  if (code >= 95 && code <= 99) return { name: 'cloud-bolt', color: '#F59E0B' };
  
  return { name: 'sun', color: '#FBBF24' };
};

// Weather code to description
const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code === 77) return 'Snow Grains';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96 && code <= 99) return 'Thunderstorm w/ Hail';
  return 'Unknown';
};

// Format wind direction from degrees
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

// Calculate daylight hours from sunrise/sunset
const calculateDaylight = (sunrise: string, sunset: string): string => {
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  const diffMs = sunsetDate.getTime() - sunriseDate.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Get day name from date string
const getDayName = (dateStr: string, index: number): string => {
  if (index === 0) return 'Today';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

interface CurrentWeather {
  temp: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
}

interface DailyForecast {
  day: string;
  date: string;
  high: number;
  low: number;
  precip: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
}

interface WeatherData {
  current: CurrentWeather | null;
  daily: DailyForecast[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

const DEFAULT_STATE: WeatherData = {
  current: null,
  daily: [],
  isLoading: true,
  error: null,
  lastUpdated: new Date(),
};

export default function ForecastScreen() {
  const [data, setData] = useState<WeatherData>(DEFAULT_STATE);
  // const [webViewLoading, setWebViewLoading] = useState(true); // COMMENTED OUT FOR V1
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeatherData = useCallback(async () => {
    try {
      // Open-Meteo API - free, no key needed
      const url = `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${PULASKI_LAT}&longitude=${PULASKI_LON}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
        `&temperature_unit=fahrenheit` +
        `&wind_speed_unit=mph` +
        `&timezone=America%2FNew_York` +
        `&forecast_days=7`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch weather data');

      const json = await res.json();

      // Parse current weather
      const current: CurrentWeather = {
        temp: Math.round(json.current.temperature_2m),
        feelsLike: Math.round(json.current.apparent_temperature),
        weatherCode: json.current.weather_code,
        windSpeed: Math.round(json.current.wind_speed_10m),
        windDirection: json.current.wind_direction_10m,
      };

      // Parse daily forecast
      const daily: DailyForecast[] = json.daily.time.map((date: string, index: number) => ({
        day: getDayName(date, index),
        date: date,
        high: Math.round(json.daily.temperature_2m_max[index]),
        low: Math.round(json.daily.temperature_2m_min[index]),
        precip: json.daily.precipitation_probability_max[index] || 0,
        weatherCode: json.daily.weather_code[index],
        sunrise: json.daily.sunrise[index],
        sunset: json.daily.sunset[index],
      }));

      setData({
        current,
        daily,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeatherData();
    setRefreshing(false);
  }, [fetchWeatherData]);

  // Get current weather display data
  const currentIcon = data.current ? getWeatherIcon(data.current.weatherCode) : { name: 'sun', color: '#FBBF24' };
  const currentCondition = data.current ? getWeatherDescription(data.current.weatherCode) : '--';
  const windDisplay = data.current ? `${data.current.windSpeed} mph ${getWindDirection(data.current.windDirection)}` : '--';
  
  // Today's data for details row
  const today = data.daily[0];
  const daylightDisplay = today ? calculateDaylight(today.sunrise, today.sunset) : '--';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#FBBF24"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome6 name="cloud-sun" size={22} color="#FBBF24" style={{ marginRight: 12 }} />
          <Text style={styles.headerTitle}>Forecast</Text>
          <Text style={styles.headerLocation}>Pulaski, NY</Text>
        </View>

        {/* Current Weather Hero Card */}
        <View style={styles.currentWeatherCard}>
          {data.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FBBF24" />
              <Text style={styles.loadingText}>Loading weather...</Text>
            </View>
          ) : data.error ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="cloud-offline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load weather</Text>
              <Text style={styles.errorSubtext}>Pull down to retry</Text>
            </View>
          ) : (
            <>
              {/* Main temp and condition */}
              <View style={styles.weatherMain}>
                <View style={styles.tempContainer}>
                  <Text style={styles.currentTemp}>{data.current?.temp ?? '--'}°</Text>
                  <FontAwesome6 
                    name={currentIcon.name} 
                    size={48} 
                    color={currentIcon.color} 
                    style={styles.weatherIcon}
                  />
                </View>
                <Text style={styles.condition}>{currentCondition}</Text>
                <Text style={styles.feelsLike}>Feels like {data.current?.feelsLike ?? '--'}°F</Text>
              </View>

              {/* Weather Details Row */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="thermometer-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.detailValue}>
                    {today ? `${today.high}° / ${today.low}°` : '--'}
                  </Text>
                  <Text style={styles.detailLabel}>High / Low</Text>
                </View>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={18} color="#3B82F6" />
                  <Text style={styles.detailValue}>{today?.precip ?? 0}%</Text>
                  <Text style={styles.detailLabel}>Precip</Text>
                </View>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailItem}>
                  <FontAwesome6 name="wind" size={16} color="#9CA3AF" />
                  <Text style={styles.detailValue}>{windDisplay}</Text>
                  <Text style={styles.detailLabel}>Wind</Text>
                </View>
                
                <View style={styles.detailDivider} />
                
                <View style={styles.detailItem}>
                  <Ionicons name="sunny-outline" size={18} color="#FBBF24" />
                  <Text style={styles.detailValue}>{daylightDisplay}</Text>
                  <Text style={styles.detailLabel}>Daylight</Text>
                </View>
              </View>
            </>
          )}
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
          {data.isLoading ? (
            <View style={styles.forecastLoadingContainer}>
              <ActivityIndicator size="small" color="#FBBF24" />
            </View>
          ) : (
            data.daily.map((day, index) => {
              const iconData = getWeatherIcon(day.weatherCode);
              const isToday = index === 0;
              
              return (
                <View 
                  key={day.date} 
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
            })
          )}
        </ScrollView>

        {/* Dam Release Schedule Section - COMMENTED OUT FOR V1, will add in v1.1
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
        */}

        {/* Update Indicator */}
        <View style={styles.updateIndicator}>
          <View style={[styles.statusDot, { backgroundColor: data.error ? '#EF4444' : '#10B981' }]} />
          <Text style={styles.updateText}>
            {data.error 
              ? 'Weather connection error'
              : 'Weather data • Open-Meteo'}
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
    minHeight: 220,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
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
  forecastLoadingContainer: {
    width: 300,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 8,
  },
  updateText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
