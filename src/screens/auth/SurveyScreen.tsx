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
import { Colors } from '../../constants/colors';

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
      // 진단서 업로드 화면 건너뛰고 바로 알러지 선택으로
      navigation.navigate('SurveyAllergySelect', { ...next, hasAllergyDoc: false });
    }
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
    width: '33%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  optionSelected: {
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
  optionText: {
    fontSize: 15,
    color: Colors.black,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueDisabled: {
    opacity: 0.4,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.black,
  },
});
