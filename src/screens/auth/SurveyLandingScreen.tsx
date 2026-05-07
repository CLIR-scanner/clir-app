import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { AuthStackParamList, SurveyParams } from '../../types';
import { useUserStore } from '../../store/user.store';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import * as AuthService from '../../services/auth.service';
import { ApiError } from '../../lib/api';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyLanding'>;
type Route = RouteProp<AuthStackParamList, 'SurveyLanding'>;

export default function SurveyLandingScreen() {
  const navigation  = useNavigation<Nav>();
  const route       = useRoute<Route>();
  const { t }       = useTranslation();
  const insets      = useSafeAreaInsets();
  const setUser            = useUserStore(s => s.setUser);
  const currentUser        = useUserStore(s => s.currentUser);
  const currentLanguage    = useUserStore(s => s.currentUser.language);
  const setLanguage        = useUserStore(s => s.setLanguage);
  const multiProfileMode   = useUserStore(s => s.multiProfileMode);
  const setMultiProfileMode = useUserStore(s => s.setMultiProfileMode);
  const [loading, setLoading] = React.useState(false);

  const params: SurveyParams = route.params ?? {};
  const isDevMode = String(route.name) === 'DevSurveyLanding';

  // 베타 게이트: betaCohort null/빈 배열 → invite 입력 필요. DEV/멀티프로필 모드는 자동 통과.
  const hasCohort = (currentUser.betaCohort?.length ?? 0) > 0;
  const needsInvite = !isDevMode && !multiProfileMode && !hasCohort;
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteState, setInviteState] = React.useState<{
    submitting: boolean;
    error?: string;
    success?: string;
  }>({ submitting: false });

  async function handleRedeem() {
    const code = inviteCode.trim().toLowerCase();
    if (code.length < 6) {
      setInviteState({ submitting: false, error: 'Code must be at least 6 characters.' });
      return;
    }
    setInviteState({ submitting: true });
    try {
      const { cohort } = await AuthService.redeemInvite(code);
      setUser({ ...currentUser, betaCohort: cohort });
      setInviteState({ submitting: false, success: "Code verified! You're in." });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'INVALID_INVITE_CODE'
          ? 'Invalid invite code. Check your email and try again.'
          : 'Could not verify code. Please try again.';
      setInviteState({ submitting: false, error: msg });
    }
  }

  function handleContinue() {
    if (needsInvite) return;
    navigation.navigate('Survey', params);
  }

  async function handleSkip() {
    if (loading) return;

    if (multiProfileMode) {
      setMultiProfileMode(false);
      navigation.getParent()?.goBack();
    } else if (isDevMode) {
      navigation.goBack();
    } else {
      setLoading(true);
      try {
        await AuthService.submitSurvey({
          allergyProfile: [],
          dietaryRestrictions: [],
          sensitivityLevel: 'normal',
        });
        const { user } = await AuthService.fetchMe();
        setUser({ ...user, language: currentLanguage, hasCompletedSurvey: true });
      } catch (e) {
        Alert.alert(t('common.error'), (e as Error).message);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleSelectLanguage(code: string) {
    setLanguage(code);
    i18n.changeLanguage(code);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {t('survey.landingTitle')}
        </Text>

        {needsInvite && (
          <View style={styles.inviteBox}>
            <Text style={styles.inviteTitle}>Beta Invite Code</Text>
            <Text style={styles.inviteDesc}>
              This is a closed beta. Please enter the invite code we sent to your email.
            </Text>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter invite code"
              placeholderTextColor="#999"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
              editable={!inviteState.submitting}
            />
            <TouchableOpacity
              style={[styles.redeemButton, inviteState.submitting && styles.redeemDisabled]}
              onPress={handleRedeem}
              disabled={inviteState.submitting || inviteCode.trim().length < 6}
              activeOpacity={0.8}
            >
              {inviteState.submitting
                ? <ActivityIndicator color="#F9FFF3" />
                : <Text style={styles.redeemText}>Verify code</Text>}
            </TouchableOpacity>
            {inviteState.error && <Text style={styles.errorText}>{inviteState.error}</Text>}
            {inviteState.success && <Text style={styles.successText}>{inviteState.success}</Text>}
          </View>
        )}

        {!multiProfileMode && (
          <View style={styles.languageBlock}>
            <Text style={styles.languageLabel}>{t('survey.languageTitle')}</Text>
            <Text style={styles.languageHint}>{t('survey.languageSubtitle')}</Text>
            <View style={styles.languageOptions}>
              {SUPPORTED_LANGUAGES.map(language => {
                const isSelected = currentLanguage === language.code;
                return (
                  <TouchableOpacity
                    key={language.code}
                    style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
                    onPress={() => handleSelectLanguage(language.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
                      {language.native}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 베타 v1 안내 — 영양 미지원 + 의학적 조언 부정 */}
      <View style={styles.notices}>
        <Text style={styles.noticeBody}>
          Currently we focus on allergen and dietary preference matching only — we do not measure
          nutrition values (sodium, sugar, calories) yet. Nutrition tracking coming in a future update.
        </Text>
        <Text style={styles.noticeBody}>
          This app is for informational purposes only and is not medical advice. Always consult your
          doctor for medical decisions. Allergen labeling is based on FDA Big 9 + Sesame; verify the
          label yourself before consuming.
        </Text>
      </View>

      <View style={styles.footer}>
        {!multiProfileMode && (
          <TouchableOpacity
            style={[styles.skipButton, loading && styles.buttonDisabled]}
            onPress={handleSkip}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.skipText}>{loading ? t('survey.processing') : t('survey.skip')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.continueButton, needsInvite && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={needsInvite}
        >
          <Text style={styles.continueText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FFF3',
    paddingHorizontal: 17,
  },
  body: {
    flex: 1,
    paddingTop: 106,
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 30 * 1.35,
  },
  inviteBox: {
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#EAF1E2',
    gap: 8,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C3A19',
  },
  inviteDesc: {
    fontSize: 13,
    color: '#3A4D38',
    lineHeight: 18,
  },
  inviteInput: {
    height: 44,
    marginTop: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9FB59B',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#000000',
  },
  redeemButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C3A19',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  redeemDisabled: {
    opacity: 0.6,
  },
  redeemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F9FFF3',
  },
  errorText: {
    color: '#B0421F',
    fontSize: 13,
    marginTop: 4,
  },
  successText: {
    color: '#1C3A19',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  notices: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    gap: 8,
  },
  noticeBody: {
    fontSize: 11,
    color: '#5A6B58',
    lineHeight: 15,
  },
  languageBlock: {
    marginTop: 42,
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C3A19',
    marginBottom: 6,
  },
  languageHint: {
    fontSize: 12,
    color: '#556C53',
    lineHeight: 17,
    marginBottom: 14,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    minHeight: 38,
    minWidth: 78,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#556C53',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FFF3',
  },
  languageOptionSelected: {
    backgroundColor: '#556C53',
  },
  languageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#556C53',
  },
  languageTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    gap: 12,
    paddingBottom: 24,
  },
  skipButton: {
    height: 53,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#556C53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#556C53',
  },
  continueButton: {
    height: 53,
    borderRadius: 35,
    backgroundColor: '#1C3A19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FFF3',
  },
});
