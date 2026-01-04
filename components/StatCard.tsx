import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  valueColor?: string;
}

export default function StatCard({ icon, value, label, valueColor = '#FFFFFF' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={24} color="#9CA3AF" style={styles.icon} />
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // Ensures cards take equal width
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  icon: {
    marginBottom: 10,
    opacity: 0.7,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

