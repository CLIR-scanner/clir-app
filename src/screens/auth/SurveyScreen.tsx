import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import SurveyHeader from '../../components/common/SurveyHeader';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Survey'>;
type Route = RouteProp<AuthStackParamList, 'Survey'>;

type DietaryType = 'allergy' | 'vegetarian' | 'both';

const OPTIONS: { value: DietaryType; label: string }[] = [
  { value: 'allergy',    label: 'Allergy' },
  { value: 'vegetarian', label: 'Vegetarian (Vegan)' },
  { value: 'both',       label: 'Both' },
];

export default function SurveyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

  const [selected, setSelected] = useState<DietaryType | null>(null);

  function handleContinue() {
    if (!selected) return;

    const next: SurveyParams = { ...params, dietaryType: selected };

    if (selected === 'vegetarian') {
      navigation.navigate('SurveyVegetarian', next);
    } else {
      // allergy, both 모두 알러지 화면 먼저
      navigation.navigate('SurveyAllergy', next);
    }
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={1} total={6} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>Tell us your{'\n'}dietary preferences.</Text>
        <Text style={styles.subtitle}>
          Select an option that applies so we can{'\n'}personalise your food experience.
        </Text>

        <View style={styles.options}>
          {OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, selected === opt.value && styles.optionSelected]}
              onPress={() => setSelected(opt.value)}
            >
              <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity
        style={[styles.continueButton, !selected && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const S = {
  bg:             '#F9FFF3',
  primary:        '#1C3A19',
  selectedFill:   '#556C53',
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: S.primary,
    lineHeight: 12 * 1.35,
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    height: 94,
    borderWidth: 1,
    borderColor: S.primary,
    borderRadius: 16,
    paddingHorizontal: 44,
    justifyContent: 'center',
    backgroundColor: S.bg,
  },
  optionSelected: {
    borderColor: S.primary,
    backgroundColor: S.selectedFill,
  },
  optionText: {
    fontSize: 16,
    color: S.primary,
    fontWeight: '400',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  continueButton: {
    height: 53,
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
    fontWeight: '700',
    color: S.textLight,
  },
});
