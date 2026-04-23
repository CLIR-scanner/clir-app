import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSurveyProgressShared } from '../../contexts/SurveyProgressContext';

interface Props {
  step: number;
  total: number;
}

export default function SurveyHeader({ step, total }: Props) {
  const navigation = useNavigation();
  const progress = useSurveyProgressShared();

  useFocusEffect(
    useCallback(() => {
      progress.value = withTiming(step / total, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
    }, [step, total]),
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
        <Text style={styles.backText}>{'←'}</Text>
      </TouchableOpacity>
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  backText: { fontSize: 22, color: '#1C3A19' },
  bar: { flex: 1, height: 4, backgroundColor: '#D6E8D4', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#1C3A19', borderRadius: 2 },
});
