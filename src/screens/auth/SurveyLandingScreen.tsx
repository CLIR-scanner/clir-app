import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import i18n from '../../i18n';
import { AuthStackParamList, SurveyParams } from '../../types';
import { useUserStore } from '../../store/user.store';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import * as AuthService from '../../services/auth.service';
import { ApiError } from '../../lib/api';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyLanding'>;
type Route = RouteProp<AuthStackParamList, 'SurveyLanding'>;

// ── Design tokens (auth/survey 팔레트) ─────────────────────────────────────
const C = {
  bg:           '#FDFFFD',
  primary:      '#044733',
  primaryText:  '#F9FFF3',
  cardBg:       '#EAF1E2',
  cardBorder:   '#D8E0D5',
  textBody:     '#3A4D38',
  textMuted:    '#556C53',
  textHint:     '#5A6B58',
  inputBorder:  '#9FB59B',
  inputBg:      '#FFFFFF',
  error:        '#B0421F',
  placeholder:  '#999999',
};

/** Right-facing chevron — 펼침 상태에서 90deg 회전. PersonalizationAllergy 패턴 따름. */
function Chevron({ open }: { open: boolean }) {
  return (
    <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
      <Svg width={9} height={14} viewBox="0 0 7 12" fill="none">
        <Path
          d="M1 1L6 6L1 11"
          stroke={C.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

/**
 * 단일 화면용 inline Expandable 섹션. 별도 컴포넌트 분리 미가치 (재사용 X).
 * header tap → toggle. content 는 open=true 일 때만 mount.
 */
function ExpandableSection({
  title,
  subtitle,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <View style={styles.expandable}>
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <View style={styles.expandableHeaderText}>
          <View style={styles.expandableTitleRow}>
            <Text style={styles.expandableTitle}>{title}</Text>
            {badge}
          </View>
          {subtitle ? <Text style={styles.expandableSubtitle}>{subtitle}</Text> : null}
        </View>
        <Chevron open={open} />
      </TouchableOpacity>
      {open && <View style={styles.expandableContent}>{children}</View>}
    </View>
  );
}

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

  // Expandable open state — needsInvite 일 때 invite 자동 펼침 (사용자 액션 필요).
  // 언어는 기본 collapsed — 명시적으로 변경하고 싶을 때만 열림.
  const [inviteOpen,   setInviteOpen]   = React.useState(needsInvite);
  const [languageOpen, setLanguageOpen] = React.useState(false);

  // needsInvite 변화 시 invite 섹션 자동 동기화 (redeem 성공 후 닫기 자연스럽게).
  React.useEffect(() => {
    if (!needsInvite) setInviteOpen(false);
  }, [needsInvite]);

  async function handleRedeem() {
    const code = inviteCode.trim().toLowerCase();
    if (code.length < 6) {
      setInviteState({ submitting: false, error: t('survey.inviteErrorTooShort') });
      return;
    }
    setInviteState({ submitting: true });
    try {
      const { cohort } = await AuthService.redeemInvite(code);
      setUser({ ...currentUser, betaCohort: cohort });
      setInviteState({ submitting: false, success: t('survey.inviteSuccess') });
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === 'INVALID_INVITE_CODE'
          ? t('survey.inviteErrorInvalid')
          : t('survey.inviteErrorGeneric');
      setInviteState({ submitting: false, error: msg });
    }
  }

  function handleContinue() {
    if (needsInvite) return;
    navigation.navigate('Survey', params);
  }

  async function handleSkip() {
    if (loading) return;
    if (needsInvite) return;

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

  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.native ?? 'English';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('survey.landingTitle')}</Text>

          {needsInvite && (
            <ExpandableSection
              title={t('survey.inviteTitle')}
              subtitle={t('survey.inviteDesc')}
              open={inviteOpen}
              onToggle={() => setInviteOpen(o => !o)}
              badge={<View style={styles.requiredBadge} />}
            >
              <TextInput
                style={styles.inviteInput}
                placeholder={t('survey.invitePlaceholder')}
                placeholderTextColor={C.placeholder}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={64}
                editable={!inviteState.submitting}
              />
              <TouchableOpacity
                style={[styles.redeemButton, inviteState.submitting && styles.opacity60]}
                onPress={handleRedeem}
                disabled={inviteState.submitting || inviteCode.trim().length < 6}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('survey.inviteVerify')}
              >
                {inviteState.submitting
                  ? <ActivityIndicator color={C.primaryText} />
                  : <Text style={styles.redeemText}>{t('survey.inviteVerify')}</Text>}
              </TouchableOpacity>
              {inviteState.error && <Text style={styles.errorText}>{inviteState.error}</Text>}
              {inviteState.success && <Text style={styles.successText}>{inviteState.success}</Text>}
            </ExpandableSection>
          )}

          {!multiProfileMode && (
            <ExpandableSection
              title={t('survey.languageTitle')}
              subtitle={t('survey.languageSubtitle')}
              open={languageOpen}
              onToggle={() => setLanguageOpen(o => !o)}
              badge={
                <Text style={styles.languageCurrentBadge}>{currentLanguageLabel}</Text>
              }
            >
              <View style={styles.languageOptions}>
                {SUPPORTED_LANGUAGES.map(language => {
                  const isSelected = currentLanguage === language.code;
                  return (
                    <TouchableOpacity
                      key={language.code}
                      style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
                      onPress={() => handleSelectLanguage(language.code)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={language.native}
                    >
                      <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
                        {language.native}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ExpandableSection>
          )}

          <View style={styles.notices}>
            <Text style={styles.noticeBody}>{t('survey.noticeNutrition')}</Text>
            <Text style={styles.noticeBody}>{t('survey.noticeMedical')}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {!multiProfileMode && !needsInvite && (
            <TouchableOpacity
              style={[styles.skipButton, loading && styles.opacity40]}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('survey.skip')}
            >
              <Text style={styles.skipText}>{loading ? t('survey.processing') : t('survey.skip')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.continueButton, needsInvite && styles.opacity40]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={needsInvite}
            accessibilityRole="button"
            accessibilityLabel={t('common.continue')}
          >
            <Text style={styles.continueText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner:     { flex: 1 },

  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },

  title: {
    fontSize: 30,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#000000',
    lineHeight: 30 * 1.35,
    marginBottom: 24,
  },

  // ── Expandable ─────────────────────────────────────────────────────────────
  expandable: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: C.cardBg,
    overflow: 'hidden',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  expandableHeaderText: { flex: 1, gap: 4 },
  expandableTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandableTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: C.primary,
  },
  expandableSubtitle: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    lineHeight: 16,
    color: C.textBody,
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
  },

  // ── Invite required badge (붉은 점) ─────────────────────────────────────────
  requiredBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.error,
  },

  // ── Invite UI ──────────────────────────────────────────────────────────────
  inviteInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.inputBorder,
    backgroundColor: C.inputBg,
    fontSize: 15,
    color: '#000000',
  },
  redeemButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  redeemText: {
    fontSize: 15,
    fontFamily: 'Pretendard-Bold',
    color: C.primaryText,
  },
  errorText:   { color: C.error,   fontSize: 13, fontFamily: 'Pretendard-Regular', marginTop: 4 },
  successText: { color: C.primary, fontSize: 13, fontFamily: 'Pretendard-Bold', marginTop: 4 },

  // ── Language ───────────────────────────────────────────────────────────────
  languageCurrentBadge: {
    fontSize: 13,
    fontFamily: 'Pretendard-SemiBold',
    color: C.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.bg,
    overflow: 'hidden',
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
    borderColor: C.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  languageOptionSelected: { backgroundColor: '#044733', borderColor: '#044733' },
  languageText: {
    fontSize: 13,
    fontFamily: 'Pretendard-Bold',
    color: C.textMuted,
  },
  languageTextSelected: { color: '#FFFFFF' },

  // ── Notices ────────────────────────────────────────────────────────────────
  notices: {
    marginTop: 24,
    paddingHorizontal: 4,
    gap: 8,
  },
  noticeBody: {
    fontSize: 11,
    fontFamily: 'Pretendard-Regular',
    color: C.textHint,
    lineHeight: 15,
  },

  // ── Footer (sticky 하단) ───────────────────────────────────────────────────
  footer: {
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: C.bg,
  },
  skipButton: {
    height: 58,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: C.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: C.textMuted,
  },
  continueButton: {
    height: 58,
    borderRadius: 35,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: C.primaryText,
  },

  // ── Shared opacity ─────────────────────────────────────────────────────────
  opacity40: { opacity: 0.4 },
  opacity60: { opacity: 0.6 },
});
