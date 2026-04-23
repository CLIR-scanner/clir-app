import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SurveyParams } from '../../types';
import { useUserStore } from '../../store/user.store';

export default function SurveyLandingScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const insets      = useSafeAreaInsets();
  const setUser     = useUserStore(s => s.setUser);
  const currentUser = useUserStore(s => s.currentUser);

  const params: SurveyParams = route.params ?? {};
  // DevSurveyLanding(Profile 스택)에서 온 경우 true
  const isDevMode = route.name === 'DevSurveyLanding';

  function handleContinue() {
    navigation.navigate('Survey', params);
  }

  function handleSkip() {
    if (isDevMode) {
      navigation.goBack();
    } else {
      // Auth 스택: setUser 호출 → RootNavigator가 자동으로 Main으로 전환
      setUser(currentUser);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {'Please answer\na few quick questions\nto help us get you\nset up.'}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip this Process</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FFF3',
    paddingHorizontal: 17,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 30 * 1.35,
  },
  footer: {
    gap: 12,
    paddingBottom: 24,
  },
  skipButton: {
    height: 53,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#556C53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#556C53',
  },
  continueButton: {
    height: 53,
    borderRadius: 35,
    backgroundColor: '#1C3A19',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FFF3',
  },
});
