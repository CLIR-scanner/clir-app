import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVeganStrictness'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVeganStrictness'>;

type VeganStrictness = NonNullable<SurveyParams['veganStrictness']>;

const OPTIONS: { value: VeganStrictness; label: string; description: string }[] = [
  {
    value: 'strict',
    label: 'Strict Vegan',
    description: 'No lecithin / milk sugar / honey / vitamin D3 / Omega-3',
  },
  {
    value: 'flexible',
    label: 'Flexible Vegan',
    description: 'Try to avoid lecithin / milk sugar / honey / vitamin D3 / Omega-3',
  },
];

export default function SurveyVeganStrictnessScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;
  const [selected, setSelected] = useState<VeganStrictness | null>(null);

  function handleContinue() {
    if (!selected) return;
    navigation.navigate('SurveyDietConfirm', { ...params, veganStrictness: selected });
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
        <Text style={styles.title}>How strict is your{'\n'}vegan diet?</Text>
        <Text style={styles.subtitle}>
          Choose the option that best matches what you avoid.
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
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
                  {opt.description}
                </Text>
              </TouchableOpacity>
            );
          })}
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
    width: '40%',
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
    lineHeight: 30,
    marginBottom: 12,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  optionSelected: {
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 6,
  },
  optionLabelSelected: {
    color: Colors.white,
  },
  optionDesc: {
    fontSize: 13,
    color: Colors.gray500,
    lineHeight: 18,
  },
  optionDescSelected: {
    color: Colors.gray300,
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
