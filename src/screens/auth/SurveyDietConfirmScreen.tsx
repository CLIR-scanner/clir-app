import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AuthStackParamList, SurveyParams } from '../../types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SurveyDietConfirm'>;
type Route = RouteProp<AuthStackParamList, 'SurveyDietConfirm'>;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CIRCLE_SIZE = 305;
const RADIUS = (CIRCLE_SIZE - 3) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const VEGETARIAN_LABELS: Record<NonNullable<SurveyParams['vegetarianType']>, string> = {
  pescatarian:          'Pescatarian',
  vegan:                'Vegan',
  lacto_vegetarian:     'Lacto - Vegetarian',
  ovo_vegetarian:       'Ovo - Vegetarian',
  lacto_ovo_vegetarian: 'Lacto-ovo\nVegetarian',
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

  const drawProgress = useSharedValue(0);

  useEffect(() => {
    drawProgress.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, []);

  const circleAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - drawProgress.value),
  }));

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

        <View style={styles.circleOuter}>
          <View style={styles.circleWrapper}>


            {/* SVG 원형 테두리 — 그리기 모션 */}
            <Svg
              width={CIRCLE_SIZE}
              height={CIRCLE_SIZE}
              style={StyleSheet.absoluteFill}
            >
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="#1C3A19"
                strokeWidth={1}
                fill="none"
                opacity={0.15}
              />
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="#1C3A19"
                strokeWidth={1.5}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={circleAnimProps}
                strokeLinecap="round"
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>

            {/* 중앙 텍스트 */}
            <Text style={styles.circleText}>
              <Text style={styles.quoteChar}>{'"'}</Text>
              {displayLabel}
              <Text style={styles.quoteChar}>{'"'}</Text>
            </Text>
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

const S = { bg: '#F9FFF3', primary: '#1C3A19', selectedFill: '#556C53', textLight: '#F9FFF3' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: S.bg, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  backText: { fontSize: 22, color: S.primary },
  progressBar: { flex: 1, height: 4, backgroundColor: '#D6E8D4', borderRadius: 2 },
  progressFill: { width: '50%', height: '100%', backgroundColor: S.primary, borderRadius: 2 },
  body: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#000000', lineHeight: 32, marginBottom: 12 },
  subtitle: { fontSize: 12, color: S.primary, lineHeight: 12 * 1.35, marginBottom: 12 },
  circleOuter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleText: {
    fontSize: 22,
    fontWeight: '800',
    color: S.primary,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: 32,
    zIndex: 1,
  },
  quoteChar: {
    fontSize: 26,
    fontWeight: '700',
    color: S.primary,
  },
  continueButton: { height: 53, backgroundColor: S.primary, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  continueText: { fontSize: 16, fontWeight: '700', color: S.textLight },
});
