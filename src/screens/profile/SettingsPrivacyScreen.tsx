// 설정 → 개인정보 처리방침 / 이용약관 화면. F8 §5.1 + §5.2.
// 본문은 외부 호스팅 (waitlist-landing repo, src/lib/legal-urls.ts) — 시스템 브라우저로 열기.
// 외부 호스팅 이유: 약관 갱신 시 앱 재배포 없이 즉시 반영. App Store / Play Store 리뷰에서
// 인앱 Privacy Policy 접근 의무 충족 + Custom EULA 운영 가능.
//
// 베타 v1 영어 inline. v1.1 에서 i18n 검토.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { openLegal } from '../../lib/legal-urls';
import { TERMS_VERSION } from '../../constants/legal-version';

// 운영 연락처 — 약관/개인정보 PDF 의 공식 문의처와 동일 유지.
const CONTACT_EMAIL = 'clir.pbl2026@gmail.com';

export default function SettingsPrivacyScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.back')}
        >
          <Text style={styles.backBtn}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Terms</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Legal documents</Text>
        <Text style={styles.intro}>
          Tap below to view our latest policies. Documents open in your default browser.
        </Text>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegal('privacy')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Open Privacy Policy in browser"
        >
          <View style={styles.linkText}>
            <Text style={styles.linkTitle}>Privacy Policy</Text>
            <Text style={styles.linkSub}>How we collect, use, and protect your data</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegal('terms')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Open Terms of Service in browser"
        >
          <View style={styles.linkText}>
            <Text style={styles.linkTitle}>Terms of Service</Text>
            <Text style={styles.linkSub}>Rules for using the app and disclaimers</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => openLegal('cookies')}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="Open Cookie Policy in browser"
        >
          <View style={styles.linkText}>
            <Text style={styles.linkTitle}>Cookie Policy</Text>
            <Text style={styles.linkSub}>How we use cookies and tracking technologies</Text>
          </View>
          <Text style={styles.chevron}>{'›'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerLine}>Last updated: {TERMS_VERSION}</Text>
          <Text style={styles.footerLine}>
            Questions? <Text style={styles.contactEmail}>{CONTACT_EMAIL}</Text>
          </Text>
          <Text style={styles.footerLine}>
            Product data powered by Open Food Facts (ODbL).
          </Text>
        </View>
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
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 8 },
  title: { fontSize: 20, fontFamily: 'Pretendard-ExtraBold', color: Colors.black, marginBottom: 4 },
  intro: { fontSize: 13, lineHeight: 20, color: '#5A6B58', marginBottom: 20 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  linkText: { flex: 1, gap: 4 },
  linkTitle: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: Colors.black },
  linkSub: { fontSize: 12, color: '#5A6B58' },
  chevron: { fontSize: 22, color: '#1C3A19', marginLeft: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D8E0D5' },
  footer: { marginTop: 36, gap: 6 },
  footerLine: { fontSize: 11, color: '#5A6B58', textAlign: 'center' },
  contactEmail: { fontFamily: 'Pretendard-SemiBold', color: '#1C3A19' },
});
