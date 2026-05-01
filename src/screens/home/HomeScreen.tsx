import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const BG        = '#F9FFF3';
const TITLE_CLR = '#1A2E1A';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.body}>
        <Text style={styles.appName}>CLIR</Text>
        <Text style={styles.tagline}>{t('home.tagline')}</Text>
        <Text style={styles.hint}>{t('home.hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
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
