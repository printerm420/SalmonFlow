import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

export default function ForecastScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Forecast Placeholder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});

