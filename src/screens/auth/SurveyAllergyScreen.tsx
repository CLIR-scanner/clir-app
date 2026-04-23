import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';
import { Colors } from '../../constants/colors';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyAllergy'>;
type Route = RouteProp<AuthStackParamList, 'SurveyAllergy'>;

export default function SurveyAllergyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const params = route.params;

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
        <Text style={styles.title}>
          Do you have a diagnosis{'\n'}or medical confirmation{'\n'}for your allergy?
        </Text>
        <Text style={styles.subtitle}>
          If you do, we can help identify ingredients to avoid{'\n'}more accurately.
        </Text>

        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, selected === true && styles.optionSelected]}
            onPress={() => setSelected(true)}
          >
            <Text style={[styles.optionText, selected === true && styles.optionTextSelected]}>
              Yes, I have.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, selected === false && styles.optionSelected]}
            onPress={() => setSelected(false)}
          >
            <Text style={[styles.optionText, selected === false && styles.optionTextSelected]}>
              No, I don't have.
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity
        style={[styles.continueButton, selected === null && styles.continueDisabled]}
        onPress={handleContinue}
        disabled={selected === null}
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
    width: '66%',
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
    lineHeight: 34,
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
