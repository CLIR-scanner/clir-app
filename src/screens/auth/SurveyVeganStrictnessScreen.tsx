import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVeganStrictness'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVeganStrictness'>;

type VeganStrictness = NonNullable<SurveyParams['veganStrictness']>;

const OPTIONS: { value: VeganStrictness; labelKey: string; descriptionKey: string }[] = [
  {
    value: 'strict',
    labelKey: 'survey.strictVegan',
    descriptionKey: 'survey.strictVeganDesc',
  },
  {
    value: 'flexible',
    labelKey: 'survey.flexibleVegan',
    descriptionKey: 'survey.flexibleVeganDesc',
  },
];

export default function SurveyVeganStrictnessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyVeganStrictness', params.dietaryType);
  const [selected, setSelected] = useState<VeganStrictness | null>(null);

  function handleContinue() {
    if (!selected) return;
    navigation.navigate('SurveyDietConfirm', { ...params, veganStrictness: selected });
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 본문 */}
      <View style={styles.body}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{t('survey.veganStrictTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('survey.veganStrictSubtitle')}
          </Text>
        </View>

        <View style={styles.optionsBlock}>
        <View style={styles.options}>
          {OPTIONS.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {t(opt.labelKey)}
                </Text>
                <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                  {t(opt.descriptionKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity
        style={[styles.continueButton, !selected && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  body: { flex: 1 },
  textBlock: {},
  optionsBlock: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35 },
  options: { gap: 12 },
  option: { borderWidth: 1, borderColor: S.primary, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 44, backgroundColor: S.bg },
  optionSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  optionLabel: { fontSize: 16, fontWeight: '600', color: S.primary, marginBottom: 6 },
  optionLabelSelected: { color: '#FFFFFF' },
  optionDesc: { fontSize: 12, color: S.primary, lineHeight: 18, opacity: 0.7 },
  optionDescSelected: { color: '#FFFFFF', opacity: 0.8 },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
