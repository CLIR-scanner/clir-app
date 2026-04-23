import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { AuthStackParamList } from '../../types';
import * as AuthService from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';

function ClirLogo({ width = 105, height = 62, color = '#1C3A19' }: { width?: number; height?: number; color?: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 105 62" fill="none">
      <Defs>
        <ClipPath id="clip0">
          <Rect width="105" height="62" fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip0)">
        <Path d="M0 31.0075C0 47.8494 13.7079 61.5417 30.5689 61.5417V42.7332C24.3367 42.7332 19.2739 37.6762 19.2739 31.4511C19.2739 25.226 24.3367 20.169 30.5689 20.169V0.458496C13.7079 0.458496 0 14.1656 0 31.0075Z" fill={color} />
        <Path d="M33.1447 23.9987V24.9598V37.9276V38.8887C37.26 38.8887 40.6055 35.547 40.6055 31.4363C40.6055 27.3256 37.26 23.9839 33.1447 23.9839V23.9987Z" fill={color} />
        <Path d="M55.1486 0V62H48.6055V0H55.1486Z" fill={color} />
        <Path d="M65.9846 10.1141C66.858 9.22691 67.9239 8.7981 69.1822 8.7981C70.4404 8.7981 71.5063 9.24169 72.3797 10.1141C73.2531 11.0013 73.6824 12.0511 73.6824 13.2932C73.6824 14.5353 73.2531 15.5112 72.3797 16.3688C71.5063 17.2264 70.4404 17.6552 69.1822 17.6552C67.9239 17.6552 66.858 17.2264 65.9846 16.3688C65.1112 15.5112 64.6819 14.4909 64.6819 13.2932C64.6819 12.0955 65.1112 11.0013 65.9846 10.1141ZM72.4685 28.5677V62.0001H65.9254V28.5677H72.4685Z" fill={color} />
        <Path d="M89.9364 28.5675V33.9942H90.1585C90.9874 31.998 92.2013 30.4158 93.8297 29.2773C95.4581 28.1387 97.3381 27.562 99.4698 27.562C101.32 27.562 103.111 28.1091 104.858 29.2033L101.868 35.0588C100.802 34.1568 99.4698 33.6984 97.871 33.6984C96.1686 33.6984 94.7623 34.0385 93.652 34.7335C92.5418 35.4285 91.7276 36.4044 91.2095 37.6612C90.7062 38.9181 90.3657 40.1602 90.1881 41.3726C90.0104 42.5851 89.9364 43.9751 89.9364 45.5572V61.9851H83.3933V28.5527H89.9364V28.5675Z" fill={color} />
      </G>
    </Svg>
  );
}

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AuthHome'>;

const S = { bg: '#F9FFF3', primary: '#1C3A19', textLight: '#F9FFF3', muted: '#495551' };

export default function AuthHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const setUser = useUserStore(s => s.setUser);
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    if (loading) return;
    setLoading(true);
    try {
      const { user, isFirstLogin } = await AuthService.signInWithGoogle();
      if (isFirstLogin) {
        navigation.reset({ index: 0, routes: [{ name: 'SurveyLanding', params: {} }] });
      } else {
        setUser(user);
      }
    } catch (e) {
      const msg = (e as Error).message;
      console.log('[oauth] caught:', msg);
      Alert.alert(t('auth.loginFailed'), msg);
    } finally {
      setLoading(false);
    }
  }

  function handleApple() {
    Alert.alert(t('auth.appleComingSoon'));
  }

  return (
    <View style={styles.container}>
      {/* 로고 — 화면 중앙 */}
      <View style={styles.logoArea}>
        <ClirLogo width={140} height={83} color={S.primary} />
        <Text style={styles.slogan}>Scan clir, Eat clear.</Text>
      </View>

      {/* 하단 버튼 + 약관 */}
      <View style={styles.bottom}>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogle}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={S.primary} />
            ) : (
              <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appleButton, styles.buttonDisabled]}
            onPress={handleApple}
            disabled
          >
            <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          {'By pressing "Continue with..." you agree to our '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' and '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: S.bg,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  slogan: {
    fontSize: 13,
    color: S.primary,
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  bottom: {
    gap: 16,
  },
  buttons: {
    gap: 12,
  },
  googleButton: {
    height: 53,
    backgroundColor: S.primary,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: S.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  appleButton: {
    height: 53,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: S.primary,
  },
  appleButtonText: {
    color: S.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  terms: {
    fontSize: 11,
    color: S.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    fontSize: 11,
    color: S.muted,
    textDecorationLine: 'underline',
  },
});
