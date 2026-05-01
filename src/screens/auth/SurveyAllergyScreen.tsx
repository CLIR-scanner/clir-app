import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergy'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergy'>;

export default function SurveyAllergyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyAllergy', params.dietaryType);

  const [selected, setSelected] = useState<boolean | null>(null);

  function handleContinue() {
    if (selected === null) return;

    const next: SurveyParams = { ...params, hasAllergyDoc: selected };

    if (selected) {
      navigation.navigate('SurveyAllergyDoc', next);
    } else {
      navigation.navigate('SurveyAllergySelect', next);
    }
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 본문 */}
      <View style={styles.body}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {t('survey.allergyDocTitle')}
          </Text>
          <Text style={styles.subtitle}>
            {t('survey.allergyDocSubtitle')}
          </Text>
        </View>

        <View style={styles.optionsBlock}>
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, selected === true && styles.optionSelected]}
            onPress={() => setSelected(true)}
          >
            <Text style={[styles.optionText, selected === true && styles.optionTextSelected]}>
              {t('survey.yesDiagnosis')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selected === false && styles.optionSelected]}
            onPress={() => setSelected(false)}
          >
            <Text style={[styles.optionText, selected === false && styles.optionTextSelected]}>
              {t('survey.noDiagnosis')}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity
        style={[styles.continueButton, selected === null && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={selected === null}
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
  option: { height: 94, borderWidth: 1, borderColor: S.primary, borderRadius: 16, paddingHorizontal: 44, justifyContent: 'center', backgroundColor: S.bg },
  optionSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  optionText: { fontSize: 16, color: S.primary, fontWeight: '400' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
