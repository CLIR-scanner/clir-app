import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyDietConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyDietConfirm'>;

const VEGETARIAN_LABELS: Record<NonNullable<SurveyParams['vegetarianType']>, string> = {
  pescatarian:          'Pescatarian',
  vegan:                'Vegan',
  lacto_vegetarian:     'Lacto - Vegetarian',
  ovo_vegetarian:       'Ovo - Vegetarian',
  lacto_ovo_vegetarian: 'Lacto-ovo - Vegetarian',
  pesco_vegetarian:     'Pesco - Vegetarian',
  pollo_vegetarian:     'Pollo - Vegetarian',
  flexitarian:          'Flexitarian',
};

const VEGAN_LABELS: Record<NonNullable<SurveyParams['veganStrictness']>, string> = {
  strict:   'Strict Vegan',
  flexible: 'Flexible Vegan',
};

function getDisplayLabel(params: SurveyParams): string {
  if (params.veganStrictness) return VEGAN_LABELS[params.veganStrictness];
  if (params.vegetarianType)  return VEGETARIAN_LABELS[params.vegetarianType];
  return '';
}

export default function SurveyDietConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

  const displayLabel = getDisplayLabel(params);

  function handleContinue() {
    navigation.navigate('SurveyVegetarianIngredients', params);
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>Your diet preference is ...</Text>
        <Text style={styles.subtitle}>
          Your selected diet preference will be applied{'\n'}to your recommendations.
        </Text>

        {/* 원형 뱃지 */}
        <View style={styles.circleWrapper}>
          <View style={styles.circle}>
            <Text style={styles.circleText}>{`\u201C${displayLabel}\u201D`}</Text>
          </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  backText: {
    fontSize: 22,
    color: Colors.black,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
  },
  progressFill: {
    width: '50%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 48,
  },
  circleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: Colors.black,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circleText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    lineHeight: 28,
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
