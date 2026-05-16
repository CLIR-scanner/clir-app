import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AuthStackParamList, TermsAgreementListItem, TermsSectionKey } from '../../types';
import { Colors } from '../../constants/colors';
import { Strings } from '../../constants/strings';
import { TERMS_VERSION } from '../../constants/legal-version';
import { termsStorage } from '../../lib/storage';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'TermsAgreement'>;
type Route = RouteProp<AuthStackParamList, 'TermsAgreement'>;

const S = {
  bg: Colors.scanLightGreen,
  darkGreen: Colors.searchDarkGreen,
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

const AGREEMENTS: TermsAgreementListItem[] = [
  { id: 'terms', title: Strings.termsAgreement.termsService, required: true },
  { id: 'privacy', title: Strings.termsAgreement.privacyPolicy, required: true },
  {
    id: 'personalInfo',
    title: Strings.termsAgreement.personalInformation,
    required: true,
  },
  {
    id: 'healthDisclaimer',
    title: Strings.termsAgreement.healthDisclaimer,
    required: true,
    description: Strings.termsAgreement.healthDisclaimerDescription,
  },
  { id: 'ageConfirm', title: Strings.termsAgreement.ageConfirm, required: true, hasDetail: false },
  { id: 'marketing', title: Strings.termsAgreement.marketing, required: false },
  { id: 'dataAnalytics', title: Strings.termsAgreement.dataAnalytics, required: false },
];

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

  React.useEffect(() => {
    const agreedSection = route.params?.agreedSection;
    if (!agreedSection) return;

    setCheckedIds(current => {
      if (current.has(agreedSection)) return current;
      const next = new Set(current);
      next.add(agreedSection);
      return next;
    });
    navigation.setParams({ agreedSection: undefined });
  }, [navigation, route.params?.agreedSection]);

  const requiredIds = useMemo(
    () => AGREEMENTS.filter(item => item.required).map(item => item.id),
    [],
  );
  const allRequiredChecked = requiredIds.every(id => checkedIds.has(id));
  const allChecked = AGREEMENTS.every(item => checkedIds.has(item.id));

  function toggleAll() {
    setCheckedIds(allChecked ? new Set() : new Set(AGREEMENTS.map(item => item.id)));
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
  // BE 측 audit trail (acceptTerms) 은 AuthHomeScreen.handleGoogle 의 OAuth 직후 별도로 기록.
  async function handleAgree() {
    if (!allRequiredChecked || loading) return;
    setLoading(true);
    try {
      await termsStorage.write(TERMS_VERSION);
      navigation.replace('AuthHome');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <Text style={styles.title}>{Strings.termsAgreement.title}</Text>

          <Pressable style={styles.allRow} onPress={toggleAll} accessibilityRole="checkbox" accessibilityState={{ checked: allChecked }}>
            <CheckIcon checked={allChecked} />
            <Text style={styles.allText}>{Strings.termsAgreement.agreeAll}</Text>
          </Pressable>
          <Text style={styles.allDescription}>{Strings.termsAgreement.agreeAllDescription}</Text>

          <View style={styles.fullDivider} />

          <View style={styles.agreementList}>
            {AGREEMENTS.map((item, index) => {
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
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemBadge}>
                          {item.required ? Strings.termsAgreement.required : Strings.termsAgreement.optional}
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
            <Text style={styles.agreeButtonText}>{Strings.termsAgreement.agreeButton}</Text>
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
    marginTop: 31,
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
    left: 17,
    right: 17,
    bottom: 36,
    height: 53,
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
});
