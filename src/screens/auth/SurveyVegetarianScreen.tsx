import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarian'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarian'>;

type VegetarianType = NonNullable<SurveyParams['vegetarianType']>;

const OPTIONS: { value: VegetarianType }[] = [
  { value: 'pescatarian' },
  { value: 'vegan' },
  { value: 'lacto_vegetarian' },
  { value: 'ovo_vegetarian' },
  { value: 'lacto_ovo_vegetarian' },
  { value: 'pesco_vegetarian' },
  { value: 'pollo_vegetarian' },
  { value: 'flexitarian' },
];

export default function SurveyVegetarianScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyVegetarian', params.dietaryType);
  const [selected, setSelected] = useState<VegetarianType | null>(null);

  function handleContinue() {
    if (!selected) return;
    const next = { ...params, vegetarianType: selected };
    if (selected === 'vegan') {
      navigation.navigate('SurveyVeganStrictness', next);
    } else {
      navigation.navigate('SurveyDietConfirm', next);
    }
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 스크롤 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('survey.dietKindTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('survey.dietKindSubtitle')}
        </Text>

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
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {t(`survey.vegetarianTypes.${opt.value}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
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

const S = { bg: '#FDFFFD', primary: '#044733', selectedFill: '#F9FFFB', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  title: { fontSize: 30, fontFamily: 'Pretendard-ExtraBold', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: S.primary, lineHeight: 13 * 1.35, marginBottom: 32 },
  options: { gap: 12 },
  option: { height: 94, borderWidth: 1, borderColor: S.primary, borderRadius: 16, paddingHorizontal: 44, justifyContent: 'center', backgroundColor: S.bg },
  optionSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  optionText: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: S.primary },
  optionTextSelected: { fontFamily: 'Pretendard-SemiBold', color: S.primary },
  continueButton: { height: 58, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontFamily: 'Pretendard-Bold', color: S.textLight },
});
