import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../../types';
import { termsStorage } from '../../lib/storage';
import { TERMS_VERSION } from '../../constants/legal-version';
import ClirLogo from '../../components/common/ClirLogo';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    // 1.5s 동안 splash 노출 + storage 조회 — 둘 다 끝나면 다음 화면으로 replace.
    // 디바이스에 현재 TERMS_VERSION 동의 기록이 있으면 약관 skip 후 AuthHome 직행.
    const start = Date.now();
    termsStorage.read().then(accepted => {
      const remaining = Math.max(0, 1500 - (Date.now() - start));
      setTimeout(() => {
        if (cancelled) return;
        navigation.replace(accepted === TERMS_VERSION ? 'AuthHome' : 'TermsAgreement');
      }, remaining);
    });
    return () => { cancelled = true; };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <ClirLogo width={140} height={83} />
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>
      </View>
      <ActivityIndicator color="#1C3A19" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FFF3',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  tagline: {
    fontSize: 13,
    color: '#1C3A19',
    opacity: 0.6,
    letterSpacing: 0.3,
  },
});
