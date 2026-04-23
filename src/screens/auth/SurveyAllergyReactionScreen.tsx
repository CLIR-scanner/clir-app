import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import SurveyHeader from '../../components/common/SurveyHeader';
import { getSurveyProgress } from '../../constants/surveySteps';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergyReaction'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergyReaction'>;

type ReactionType = 'immediate' | 'delayed' | 'not_sure';

const OPTIONS: { value: ReactionType; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'delayed',   label: 'Delayed' },
  { value: 'not_sure',  label: 'Not sure' },
];

export default function SurveyAllergyReactionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;
  const { step, total } = getSurveyProgress('SurveyAllergyReaction', params.dietaryType);

  const [selected, setSelected] = useState<ReactionType | null>(null);

  function handleContinue() {
    if (!selected) return;
    const next: SurveyParams = { ...params, allergyReactionType: selected };
    navigation.navigate('SurveyAllergyIngredients', next);
  }

  return (
    <View style={styles.container}>
      <SurveyHeader step={step} total={total} />

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.title}>When does your reaction usually happen?</Text>
        <Text style={styles.subtitle}>
          Understanding your allergy type helps us recommend safer ingredient filters.
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

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  body: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 32 },
  options: { gap: 12 },
  option: { height: 94, borderWidth: 1, borderColor: S.primary, borderRadius: 16, paddingHorizontal: 44, justifyContent: 'center', backgroundColor: S.bg },
  optionSelected: { borderColor: S.primary, backgroundColor: S.selectedFill },
  optionText: { fontSize: 16, color: S.primary, fontWeight: '400' },
  optionTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { opacity: 0.4 },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
