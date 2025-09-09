import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function TabBarBackground() {
  return <View style={styles.background} />;
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
});

export function useBottomTabOverflow() {
  return 65; // Return standard tab bar height
}
