import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList, SurveyParams } from '../../types';
import SurveyHeader from '../../components/common/SurveyHeader';
import PressableScale from '../../components/common/PressableScale';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Survey'>;
type Route = RouteProp<AuthStackParamList, 'Survey'>;

type DietaryType = 'allergy' | 'vegetarian' | 'both';

const OPTIONS: { value: DietaryType; labelKey: string }[] = [
  { value: 'allergy',    labelKey: 'survey.dietAllergy' },
  { value: 'vegetarian', labelKey: 'survey.dietVegetarian' },
  { value: 'both',       labelKey: 'survey.dietBoth' },
];

export default function SurveyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;

  const [selected, setSelected] = useState<DietaryType | null>(null);

  function handleContinue() {
    if (!selected) return;

    const next: SurveyParams = { ...params, dietaryType: selected };

    if (selected === 'vegetarian') {
      navigation.navigate('SurveyVegetarian', next);
    } else {
      navigation.navigate('SurveyAllergySelect', next);
    }
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={1} total={6} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>{t('survey.dietaryTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('survey.dietarySubtitle')}
        </Text>

        <View style={styles.optionsBlock}>
          <View style={styles.options}>
            {OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, selected === opt.value && styles.optionSelected]}
                onPress={() => setSelected(opt.value)}
              >
                <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <PressableScale
        style={[styles.continueButton, !selected && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </PressableScale>
    </View>
  );
}

const S = {
  bg:             '#FDFFFD',
  primary:        '#044733',
  selectedFill:   '#044733',
  textLight:      '#F9FFF3',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: S.bg,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  body: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Pretendard-ExtraBold',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: S.primary,
    lineHeight: 13 * 1.35,
  },
  optionsBlock: { flex: 1, justifyContent: 'flex-start', paddingTop: 32 },
  options: {
    gap: 12,
  },
  option: {
    height: 100,
    borderWidth: 1,
    borderColor: '#B8DDD4',
    borderRadius: 16,
    paddingHorizontal: 44,
    justifyContent: 'center',
    backgroundColor: '#F9FFFB',
  },
  optionSelected: {
    borderColor: S.primary,
    backgroundColor: S.selectedFill,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: S.primary,
  },
  optionTextSelected: {
    fontFamily: 'Pretendard-SemiBold',
    color: S.textLight,
  },
  continueButton: {
    height: 58,
    backgroundColor: S.primary,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: S.textLight,
  },
});
