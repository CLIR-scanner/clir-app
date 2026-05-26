import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import ClirLogo from '../../components/common/ClirLogo';
import { termsStorage } from '../../lib/storage';
import { TERMS_VERSION } from '../../constants/legal-version';
type Nav = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();

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
        <ClirLogo width={80} height={47} />
      </View>
      <ActivityIndicator color="#1C3A19" style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFFFD',
    paddingBottom: 40,
  },
  logoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  indicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
});
