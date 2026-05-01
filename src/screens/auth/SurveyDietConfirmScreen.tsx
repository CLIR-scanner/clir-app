import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import VegetarianDietConfirmCircle from '../../components/common/VegetarianDietConfirmCircle';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'SurveyDietConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyDietConfirm'>;

export default function SurveyDietConfirmScreen() {
  const navigation   = useNavigation<Nav>();
  const route        = useRoute<Route>();
  const { t }        = useTranslation();
  const params       = route.params;
  const { step, total } = getSurveyProgress('SurveyDietConfirm', params.dietaryType);
  const displayLabel = params.veganStrictness
    ? t(`survey.dietTitles.${params.veganStrictness}`)
    : params.vegetarianType
      ? t(`survey.dietTitles.${params.vegetarianType}`)
      : '';

  function handleContinue() {
    navigation.navigate('SurveyVegetarianIngredients', params);
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      <View style={styles.body}>
        <Text style={styles.title}>{t('survey.dietConfirmTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('survey.dietConfirmSubtitle')}
        </Text>

        <View style={styles.circleOuter}>
          <VegetarianDietConfirmCircle label={displayLabel} />
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const S = { bg: '#F9FFF3', primary: '#1C3A19', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  body:           { flex: 1 },
  title:          { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle:       { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 12 },
  circleOuter:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueText:   { fontSize: 16, fontWeight: '700', color: S.textLight },
});
