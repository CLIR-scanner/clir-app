import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyVegetarian'>;
type Route = RouteProp<AuthStackParamList, 'SurveyVegetarian'>;

type VegetarianType = NonNullable<SurveyParams['vegetarianType']>;

const OPTIONS: { value: VegetarianType; label: string }[] = [
  { value: 'pescatarian',          label: 'Pescatarian' },
  { value: 'vegan',                label: 'Vegan' },
  { value: 'lacto_vegetarian',     label: 'Lacto-vegetarian' },
  { value: 'ovo_vegetarian',       label: 'Ovo-vegetarian' },
  { value: 'lacto_ovo_vegetarian', label: 'Lacto-ovo-vegetarian' },
  { value: 'pesco_vegetarian',     label: 'Pesco-vegetarian' },
  { value: 'pollo_vegetarian',     label: 'Pollo-vegetarian' },
  { value: 'flexitarian',          label: 'Flextarian' },
];

export default function SurveyVegetarianScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      {/* 스크롤 영역 */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What kind of diet{'\n'}do you follow?</Text>
        <Text style={styles.subtitle}>
          Choose the option that best matches your eating preferences.
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
                  {opt.label}
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
    width: '30%',
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 22,
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
