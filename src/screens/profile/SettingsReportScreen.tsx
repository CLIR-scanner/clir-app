// 설정 → 베타 피드백 / 버그 신고 화면. F8 §8.2 옵션 A 채택 (mailto: 링크).
// 사용자 환경 (앱 버전, OS) 자동 prefill — 운영자가 빠르게 환경 추론 가능.
//
// 베타 v1 영어 inline. v1.1 에서 i18n + Slack webhook 또는 Google Form 으로 업그레이드 검토.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';

// 운영 연락처 — Privacy/Terms 와 동일 (PDF 공식).
const FEEDBACK_EMAIL = 'clir.pbl2026@gmail.com';
// app.json:expo.version 과 일치 유지. 버전 bump 시 동기 변경 의무.
const APP_VERSION = '1.0.0';

function buildMailtoUrl(): string {
  const subject = 'CLIR Beta Feedback';
  const body = [
    'Please describe the issue or feedback below.',
    '',
    '— Environment (do not edit) —',
    `App version: ${APP_VERSION}`,
    `OS: ${Platform.OS} ${Platform.Version}`,
  ].join('\n');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function SettingsReportScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  async function handleSend() {
    const url = buildMailtoUrl();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'No mail app',
          `Please send your feedback to ${FEEDBACK_EMAIL} from any mail client.`,
        );
      }
    } catch {
      Alert.alert(
        'Cannot open mail',
        `Please send your feedback to ${FEEDBACK_EMAIL} from any mail client.`,
      );
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.backBtn}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>We'd love to hear from you</Text>
        <Text style={styles.body1}>
          Found a bug, have a feature request, or just want to share your thoughts? Email us — we read every message.
        </Text>
        <Text style={styles.body2}>
          Your environment (app version + OS) is auto-included so we can reproduce the issue faster. No personal data is attached.
        </Text>

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          activeOpacity={0.8}
          accessibilityRole="link"
          accessibilityLabel="Send feedback by email"
        >
          <Text style={styles.sendBtnText}>Send via email</Text>
        </TouchableOpacity>

        <Text style={styles.contact}>
          Or reach us directly at{'\n'}
          <Text style={styles.contactEmail}>{FEEDBACK_EMAIL}</Text>
        </Text>
      </View>
    </View>
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
    flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Pretendard-Bold', color: Colors.black,
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 14 },
  title: { fontSize: 20, fontFamily: 'Pretendard-ExtraBold', color: Colors.black },
  body1: { fontSize: 14, lineHeight: 22, color: Colors.black },
  body2: { fontSize: 13, lineHeight: 20, color: '#5A6B58' },
  sendBtn: {
    marginTop: 24,
    height: 53,
    borderRadius: 35,
    backgroundColor: '#1C3A19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
  contact: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    color: '#5A6B58',
    lineHeight: 18,
  },
  contactEmail: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#1C3A19',
  },
});
