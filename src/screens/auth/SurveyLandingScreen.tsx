import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { AuthStackParamList, SurveyParams } from '../../types';
import { useUserStore } from '../../store/user.store';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

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

  const params: SurveyParams = route.params ?? {};
  const isDevMode = String(route.name) === 'DevSurveyLanding';

  function handleContinue() {
    navigation.navigate('Survey', params);
  }

  function handleSkip() {
    if (multiProfileMode) {
      setMultiProfileMode(false);
      navigation.getParent()?.goBack();
    } else if (isDevMode) {
      navigation.goBack();
    } else {
      setUser(currentUser);
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>{t('survey.skip')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
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
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FFF3',
  },
});
