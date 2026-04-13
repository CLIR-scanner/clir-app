import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG        = '#F9FFF3';
const TITLE_CLR = '#1A2E1A';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.notchPill} />
      <View style={styles.body}>
        <Text style={styles.appName}>CLIR</Text>
        <Text style={styles.tagline}>Scan · Analyze · Stay Safe</Text>
        <Text style={styles.hint}>Tap the center button to scan a product.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
  notchPill: {
    alignSelf: 'center',
    width: 120, height: 30,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    marginBottom: 4,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  appName:  { fontSize: 48, fontWeight: '800', color: TITLE_CLR, letterSpacing: 6 },
  tagline:  { fontSize: 14, fontWeight: '500', color: '#4A7A4A', letterSpacing: 1 },
  hint:     { fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' },
});
