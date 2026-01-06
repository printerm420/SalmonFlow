import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  valueColor?: string;
  subLabel?: string;
  subLabelColor?: string;
}

export default function StatCard({ 
  icon, 
  value, 
  label, 
  valueColor = '#FFFFFF',
  subLabel,
  subLabelColor = '#6B7280',
}: StatCardProps) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={24} color="#9CA3AF" style={styles.icon} />
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subLabel ? (
        <Text style={[styles.subLabel, { color: subLabelColor }]}>{subLabel}</Text>
      ) : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
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
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
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
