import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';

// Colors
const ACTIVE_COLOR = '#10B981'; // Emerald-500
const INACTIVE_COLOR = '#808080';
const BG_COLOR = '#121212';
const BORDER_COLOR = '#2D2D2D';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
            backgroundColor: BG_COLOR,
            borderTopColor: BORDER_COLOR,
            borderTopWidth: 1,
            elevation: 0,
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
        },
        tabBarLabelStyle: {
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
            fontSize: 10,
            fontWeight: '600',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Ionicons name="pulse" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color }) => <Ionicons name="trending-up" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Forecast',
          tabBarIcon: ({ color }) => <Ionicons name="partly-sunny" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
            href: null, // Hide this from the tab bar
        }} 
       />
    </Tabs>
  );
}
