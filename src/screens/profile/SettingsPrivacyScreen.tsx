// 설정 → 개인정보·약관 화면. Privacy / Terms 외부 링크 + 데이터 export (GDPR 데이터 이동권).
// Privacy/Terms 콘텐츠는 외부 호스팅 (waitlist-landing on Vercel) — openLegal 헬퍼가 시스템 브라우저로 연다.
// Export 는 BE GET /users/me/export → JSON → 시스템 share sheet.
// 헤더 타이틀은 베타 v1 영어 inline. 행 라벨도 동일.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { openLegal, type LegalKind } from '../../lib/legal-urls';
import { apiFetch } from '../../lib/api';

export default function SettingsPrivacyScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await apiFetch<unknown>('/users/me/export');
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'CLIR data export' });
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to export data.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.backBtn}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Terms</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <LegalRow label={t('auth.termsPrivacy')} kind="privacy" />
        <LegalRow label={t('auth.termsService')} kind="terms" />
        <ExportRow loading={exporting} onPress={handleExport} />
      </ScrollView>
    </View>
  );
}

function LegalRow({ label, kind }: { label: string; kind: LegalKind }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => openLegal(kind)}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowChevron}>↗</Text>
    </TouchableOpacity>
  );
}

function ExportRow({ loading, onPress }: { loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Export my data"
    >
      <Text style={styles.rowLabel}>Export my data</Text>
      {loading
        ? <ActivityIndicator size="small" color="#9AA09A" />
        : <Text style={styles.rowChevron}>↓</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { fontSize: 22, color: Colors.black, width: 32 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.black,
  },
  scroll: { paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  rowLabel: { fontSize: 15, color: Colors.black },
  rowChevron: { fontSize: 16, color: '#9AA09A' },
});
