import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import VegetarianDietConfirmCircle, {
  VEGETARIAN_LABELS,
  VEGAN_LABELS,
} from '../../components/common/VegetarianDietConfirmCircle';

type Nav   = NativeStackNavigationProp<AuthStackParamList, 'SurveyDietConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyDietConfirm'>;

function getDisplayLabel(params: SurveyParams): string {
  if (params.veganStrictness) return VEGAN_LABELS[params.veganStrictness];
  if (params.vegetarianType)  return VEGETARIAN_LABELS[params.vegetarianType];
  return '';
}

export default function SurveyDietConfirmScreen() {
  const navigation   = useNavigation<Nav>();
  const route        = useRoute<Route>();
  const params       = route.params;
  const { step, total } = getSurveyProgress('SurveyDietConfirm', params.dietaryType);
  const displayLabel = getDisplayLabel(params);

  function handleContinue() {
    navigation.navigate('SurveyVegetarianIngredients', params);
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      <View style={styles.body}>
        <Text style={styles.title}>Your diet preference is ...</Text>
        <Text style={styles.subtitle}>
          Your selected diet preference will be applied{'\n'}to your recommendations.
        </Text>

        <View style={styles.circleOuter}>
          <VegetarianDietConfirmCircle label={displayLabel} />
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continue</Text>
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
