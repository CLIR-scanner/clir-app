// 설정 → 계정 삭제 화면. GDPR/CCPA 준수 — "내 계정 삭제" 권리.
// BE DELETE /users/me 가 auth.users 삭제 → FK CASCADE 로 profiles/scan_history/favorites/corrections 연쇄 삭제.
//
// 베타 v1 영어 inline (closed-beta/README.md 공통 규칙 #2). i18n 6 locale 은 v1.1.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../lib/api';
import { useUserStore } from '../../store/user.store';

export default function SettingsDeleteScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const logout = useUserStore(s => s.logout);
  const isGuest = useUserStore(s => s.currentUser.isAnonymous);
  const [submitting, setSubmitting] = useState(false);

  function handleConfirm() {
    if (submitting) return;
    Alert.alert(
      'Delete account',
      'This will permanently delete your account, scan history, and saved items. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiFetch<void>('/users/me', { method: 'DELETE' });
              // 성공 시 logout() 가 RootNavigator 의 isLoggedIn 분기 → Auth 로 자동 전환.
              logout();
            } catch (e) {
              Alert.alert('Error', (e as Error).message || 'Failed to delete account.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

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
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.warningTitle}>Permanently delete your account</Text>
        <Text style={styles.warningBody}>
          Deleting your account will permanently remove:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Your profile, including allergens and dietary preferences</Text>
          <Text style={styles.bullet}>• All scan history and saved items</Text>
          <Text style={styles.bullet}>• Any member profiles you have created</Text>
        </View>
        <Text style={styles.warningBody}>
          {isGuest
            ? 'This action cannot be undone. You are using a guest account, so this data lives only on this device — there is no email or password to recover it.'
            : 'This action cannot be undone. If you only want to take a break, you can sign out instead.'}
        </Text>

        <TouchableOpacity
          style={[styles.deleteBtn, submitting && styles.deleteBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.deleteBtnText}>Delete my account</Text>}
        </TouchableOpacity>
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
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 16 },
  warningTitle: {
    fontSize: 18, fontFamily: 'Pretendard-Bold', color: '#B0421F',
  },
  warningBody: {
    fontSize: 14, lineHeight: 22, color: Colors.black,
  },
  bulletList: { gap: 6 },
  bullet: { fontSize: 14, lineHeight: 20, color: Colors.black },
  deleteBtn: {
    marginTop: 24,
    height: 53,
    borderRadius: 35,
    backgroundColor: '#B0421F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
});
