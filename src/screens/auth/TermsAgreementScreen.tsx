import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AuthStackParamList, TermsAgreementListItem, TermsSectionKey } from '../../types';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/colors';
import { TERMS_VERSION } from '../../constants/legal-version';
import { termsStorage } from '../../lib/storage';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { useUserStore } from '../../store/user.store';
import { consumePendingAgreedSection } from './TermsDetailScreen';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'TermsAgreement'>;
type Route = RouteProp<AuthStackParamList, 'TermsAgreement'>;

const S = {
  bg: Colors.scanLightGreen,
  darkGreen: '#044733',
  line: Colors.scanMutedGreen,
  black: Colors.profileText,
  textLight: Colors.scanLightGreen,
};

const FONT = {
  regular:    'Pretendard-Regular',
  light:      'Pretendard-Light',
  bold:       'Pretendard-Bold',
  extraBold:  'Pretendard-ExtraBold',
};


function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 6L9 17L4 12"
            stroke={S.textLight}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

function ChevronIcon() {
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={S.line}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function TermsAgreementScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [checkedIds, setCheckedIds] = useState<Set<TermsSectionKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const agreements: TermsAgreementListItem[] = [
    { id: 'terms',           title: t('auth.termsAgreement.termsService'),        required: true },
    { id: 'privacy',         title: t('auth.termsAgreement.privacyPolicy'),        required: true },
    { id: 'personalInfo',    title: t('auth.termsAgreement.personalInformation'),  required: true },
    { id: 'healthDisclaimer',title: t('auth.termsAgreement.healthDisclaimer'),     required: true,  description: t('auth.termsAgreement.healthDisclaimerDescription') },
    { id: 'ageConfirm',      title: t('auth.termsAgreement.ageConfirm'),           required: true,  hasDetail: false },
    { id: 'marketing',       title: t('auth.termsAgreement.marketing'),            required: false },
    { id: 'dataAnalytics',   title: t('auth.termsAgreement.dataAnalytics'),        required: false },
  ];
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const langButtonRef = useRef<View>(null);
  const currentLanguage = useUserStore(s => s.currentUser.language);
  const setLanguage = useUserStore(s => s.setLanguage);

  const currentLangLabel = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.native ?? 'EN';

  function openLangDropdown() {
    langButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setDropdownPos({ top: pageY + height + 4, left: pageX, width });
      setLangModalVisible(true);
    });
  }

  useFocusEffect(useCallback(() => {
    const pending = consumePendingAgreedSection();
    if (!pending) return;
    setCheckedIds(current => {
      if (current.has(pending)) return current;
      const next = new Set(current);
      next.add(pending);
      return next;
    });
  }, []));

  const requiredIds = useMemo(
    () => agreements.filter(item => item.required).map(item => item.id),
    [],
  );
  const allRequiredChecked = requiredIds.every(id => checkedIds.has(id));
  const allChecked = agreements.every(item => checkedIds.has(item.id));

  function toggleAll() {
    setCheckedIds(allChecked ? new Set() : new Set(agreements.map(item => item.id)));
  }

  function toggleOne(id: TermsSectionKey) {
    setCheckedIds(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // 동의 기록은 디바이스 단위 — AsyncStorage 에 TERMS_VERSION 저장. OAuth 호출 없음.
  // BE 측 audit trail (acceptTerms) 은 AuthHomeScreen 의 OAuth 직후 별도로 기록.
  // 동의 완료 시 진입했던 로그인 버튼(pendingProvider)과 함께 AuthHome 으로 복귀 →
  // AuthHome 이 곧바로 해당 provider 로그인 창으로 연결한다.
  async function handleAgree() {
    if (!allRequiredChecked || loading) return;
    setLoading(true);
    try {
      await termsStorage.write(TERMS_VERSION);
      navigation.navigate('AuthHome', { pendingProvider: route.params?.pendingProvider });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        visible={langModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={[styles.modalCard, { position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: 135 }]}>
            {SUPPORTED_LANGUAGES.map((lang, idx) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <React.Fragment key={lang.code}>
                  {idx > 0 && <View style={styles.modalDivider} />}
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => { setLanguage(lang.code); setLangModalVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {lang.native}
                    </Text>
                    {isSelected && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17L4 12"
                          stroke={S.darkGreen}
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled
        >
          <Text style={styles.title}>{t('auth.termsAgreement.title')}</Text>

          <TouchableOpacity
            ref={langButtonRef}
            style={styles.langButton}
            onPress={openLangDropdown}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.5 2.5-4 6-4 10s1.5 7.5 4 10m0-20c2.5 2.5 4 6 4 10s-1.5 7.5-4 10M2 12h20"
                stroke={S.darkGreen}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.langButtonText}>{currentLangLabel}</Text>
          </TouchableOpacity>

          <Pressable style={styles.allRow} onPress={toggleAll} accessibilityRole="checkbox" accessibilityState={{ checked: allChecked }}>
            <CheckIcon checked={allChecked} />
            <Text style={styles.allText}>{t('auth.termsAgreement.agreeAll')}</Text>
          </Pressable>
          <Text style={styles.allDescription}>{t('auth.termsAgreement.agreeAllDescription')}</Text>

          <View style={styles.fullDivider} />

          <View style={styles.agreementList}>
            {agreements.map((item, index) => {
              const checked = checkedIds.has(item.id);
              const shouldSeparate = index === 5;
              return (
                <React.Fragment key={item.id}>
                  {shouldSeparate && <View style={styles.indentedDivider} />}
                  <View style={styles.itemRow}>
                    <Pressable
                      style={styles.itemToggleArea}
                      onPress={() => toggleOne(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                    >
                      <CheckIcon checked={checked} />
                      <View style={styles.itemTextArea}>
                        <Text style={styles.itemTitle}>
                          {item.title}
                          <Text style={styles.itemBadge}>
                            {' '}{item.required ? t('auth.termsAgreement.required') : t('auth.termsAgreement.optional')}
                          </Text>
                        </Text>
                        {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                      </View>
                    </Pressable>
                    {item.hasDetail !== false ? (
                      <TouchableOpacity
                        style={styles.chevronButton}
                        onPress={() => navigation.navigate('TermsDetail', { section: item.id, agreed: checked })}
                        accessibilityRole="link"
                      >
                        <ChevronIcon />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.chevronButton} />
                    )}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.agreeButton, (!allRequiredChecked || loading) && styles.agreeButtonDisabled]}
          onPress={handleAgree}
          disabled={!allRequiredChecked || loading}
          activeOpacity={0.82}
        >
          {loading ? (
            <ActivityIndicator color={S.textLight} />
          ) : (
            <Text style={styles.agreeButtonText}>{t('auth.termsAgreement.agreeButton')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: S.bg,
  },
  container: {
    flex: 1,
    backgroundColor: S.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 75,
    paddingHorizontal: 39,
    paddingBottom: 132,
  },
  title: {
    color: S.black,
    fontSize: 28,
    lineHeight: 35,
    fontFamily: FONT.extraBold,
  },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  allText: {
    color: S.black,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FONT.extraBold,
  },
  allDescription: {
    width: 267,
    marginLeft: 28,
    marginTop: 10,
    color: S.black,
    fontSize: 11,
    lineHeight: 13,
    fontFamily: FONT.light,
  },
  fullDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: S.line,
    marginTop: 26,
    marginBottom: 16,
  },
  agreementList: {
    gap: 13,
  },
  itemRow: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 0.5,
    borderColor: S.darkGreen,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: S.darkGreen,
  },
  itemTextArea: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 4,
  },
  itemTitle: {
    color: S.darkGreen,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FONT.regular,
  },
  itemBadge: {
    color: S.darkGreen,
    fontSize: 11,
    lineHeight: 13,
    fontFamily: FONT.light,
  },
  itemDescription: {
    width: '100%',
    maxWidth: 267,
    color: S.black,
    fontSize: 11,
    lineHeight: 13,
    marginTop: 5,
    fontFamily: FONT.light,
  },
  chevronButton: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indentedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: S.line,
    marginLeft: 26,
    marginRight: 16,
    marginTop: 9,
    marginBottom: 5,
  },
  agreeButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 58,
    borderRadius: 35,
    backgroundColor: S.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonDisabled: {
    opacity: 0.4,
  },
  agreeButtonText: {
    color: S.textLight,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FONT.bold,
  },
  langButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: S.darkGreen,
    marginTop: 24,
  },
  langButtonText: {
    color: S.darkGreen,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    backgroundColor: S.bg,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: S.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: S.line,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  modalItemText: {
    fontSize: 15,
    fontFamily: FONT.regular,
    color: S.black,
  },
  modalItemTextSelected: {
    fontFamily: FONT.bold,
    color: S.darkGreen,
  },
});
