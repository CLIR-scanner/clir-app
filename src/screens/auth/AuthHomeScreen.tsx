import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { AuthStackParamList } from '../../types';
import * as AuthService from '../../services/auth.service';
import { useUserStore } from '../../store/user.store';
import { TERMS_VERSION } from '../../constants/legal-version';
import { openLegal } from '../../lib/legal-urls';

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

function AppleIcon() {
  return (
    <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.39.07 2.36.74 3.17.76 1.21-.24 2.37-.93 3.67-.84 1.57.12 2.75.7 3.52 1.86-3.23 1.94-2.67 5.88.56 7.27-.65 1.39-1.52 2.78-2.92 3.81zM12.03 7.25c-.14-2.22 1.65-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill="white"
      />
    </Svg>
  );
}

function GoogleIcon({ iconOpacity = 1 }: { iconOpacity?: number }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" style={{ opacity: iconOpacity }}>
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

type Nav = NativeStackNavigationProp<AuthStackParamList, 'AuthHome'>;

const S = { bg: '#FDFFFD', primary: '#044733', textLight: '#F9FFF3', muted: '#9E9E9E' };

export default function AuthHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const setUser = useUserStore(s => s.setUser);
  const [loading, setLoading] = useState(false);

  async function runSocialSignIn(provider: 'google' | 'apple') {
    if (loading) return;
    setLoading(true);
    try {
      const { user, isFirstLogin } =
        provider === 'google'
          ? await AuthService.signInWithGoogle()
          : await AuthService.signInWithApple();
      if (isFirstLogin) {
        setUser({ ...user, hasCompletedSurvey: false });
        navigation.reset({ index: 0, routes: [{ name: 'SurveyLanding', params: {} }] });
      } else {
        setUser(user);
      }
      // 약관 동의 audit trail — BE 의 terms_version 이 현재 TERMS_VERSION 과 다르면
      // 가입 직후 또는 약관 변경 후 첫 로그인 직후 자동 갱신. fire-and-forget —
      // 실패해도 사용자 흐름 막지 않음 (durable 계층은 BE DB, 다음 로그인 재시도).
      if (user.termsVersion !== TERMS_VERSION) {
        AuthService.acceptTerms(TERMS_VERSION).catch(() => { /* swallow */ });
      }
    } catch (e) {
      const msg = (e as Error).message ?? '';
      console.log(`[oauth:${provider}] caught:`, msg);
      // Apple 시트 사용자 취소 (ERR_REQUEST_CANCELED) 는 알럿 노출 안 함.
      const isCancel = typeof (e as { code?: string }).code === 'string'
        && (e as { code?: string }).code === 'ERR_REQUEST_CANCELED';
      if (!isCancel) Alert.alert(t('auth.loginFailed'), msg);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() { void runSocialSignIn('google'); }
  function handleApple() { void runSocialSignIn('apple'); }

  return (
    <View style={styles.container}>
      {/* 로고 — 화면 중앙 */}
      <View style={styles.logoArea}>
        <ClirLogo width={80} height={47} color={S.primary} />
      </View>

      {/* 하단 버튼 + 약관 */}
      <View style={styles.bottom}>
        <View style={styles.buttons}>
          {/* Google GSI Material Button */}
          <Pressable
            style={[styles.googleButton, loading && styles.googleButtonDisabled]}
            onPress={handleGoogle}
            disabled={loading}
          >
            {({ pressed }) => (
              <>
                {pressed && !loading && <View style={styles.googleButtonState} />}
                <View style={styles.googleButtonContent}>
                  <GoogleIcon iconOpacity={loading ? 0.38 : 1} />
                  {loading ? (
                    <ActivityIndicator color="#1f1f1f" style={{ flex: 1 }} />
                  ) : (
                    <Text style={styles.googleButtonText}>
                      {t('auth.continueWithGoogle')}
                    </Text>
                  )}
                  <View style={{ width: 20 }} />
                </View>
              </>
            )}
          </Pressable>

          {/* Apple Sign-In: iOS 에서만 노출 (App Store Guideline 4.8 충족).
              Android 는 Google 만 제공 — Apple Sign-In 은 native iOS SDK 한정. */}
          {Platform.OS === 'ios' && (
            <Pressable
              style={[styles.appleButton, loading && styles.appleButtonDisabled]}
              onPress={handleApple}
              disabled={loading}
            >
              {({ pressed }) => (
                <>
                  {pressed && !loading && <View style={styles.appleButtonState} />}
                  <View style={styles.appleButtonContent}>
                    <AppleIcon />
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" style={{ flex: 1 }} />
                    ) : (
                      <Text style={styles.appleButtonText}>
                        {t('auth.continueWithApple')}
                      </Text>
                    )}
                    <View style={{ width: 20 }} />
                  </View>
                </>
              )}
            </Pressable>
          )}
        </View>

        <Text style={styles.terms}>
          {t('auth.termsPrefix')}{'\n'}
          <Text style={styles.termsLink} onPress={() => openLegal('terms')}>
            {t('auth.termsService')}
          </Text>
          {t('auth.termsAnd')}
          <Text style={styles.termsLink} onPress={() => openLegal('privacy')}>
            {t('auth.termsPrivacy')}
          </Text>
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
    paddingBottom: 40,
    justifyContent: 'flex-end',
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
  bottom: {
    gap: 16,
  },
  buttons: {
    gap: 6,
    marginBottom: 8,
  },

  // ── Google GSI Material Button ─────────────────────────────────────────────
  googleButton: {
    height: 53,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#747775',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  googleButtonDisabled: {
    backgroundColor: '#ffffff61',
    borderColor: '#1f1f1f1f',
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  googleButtonText: {
    flex: 1,
    color: '#1f1f1f',
    fontSize: 16,
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'Pretendard-Regular',
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  googleButtonState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#303030',
    opacity: 0.12,
  },

  // ── Apple Button (data-color=black, data-border=false, data-border-radius=50) ──
  appleButton: {
    height: 53,
    borderRadius: 50,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  appleButtonDisabled: {
    opacity: 0.4,
  },
  appleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appleButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  appleButtonState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  // ── Logo text ──────────────────────────────────────────────────────────────
  logoText: {
    fontSize: 48,
    color: S.primary,
    fontFamily: 'Pretendard-ExtraBold',
  },

  // ── Terms ──────────────────────────────────────────────────────────────────
  terms: {
    fontSize: 11,
    color: S.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  termsLink: {
    fontSize: 11,
    color: S.muted,
    textDecorationLine: 'underline',
  },
});
