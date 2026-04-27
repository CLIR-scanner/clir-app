import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { SurveyParams } from '../../types';

const SIZE    = 305;
const RADIUS  = (SIZE - 3) / 2;
const CIRCUMF = 2 * Math.PI * RADIUS;
const CX      = SIZE / 2;   // 152.5
const CY      = SIZE / 2;   // 152.5
const PRIMARY = '#1C3A19';

// Animated SVG primitives
const AnimatedCircle          = Animated.createAnimatedComponent(Circle);
const AnimatedRadialGradient  = Animated.createAnimatedComponent(RadialGradient);

// ── Exported label maps ───────────────────────────────────────────────────────

export const VEGETARIAN_LABELS: Record<NonNullable<SurveyParams['vegetarianType']>, string> = {
  pescatarian:          'Pescatarian',
  vegan:                'Vegan',
  lacto_vegetarian:     'Lacto - Vegetarian',
  ovo_vegetarian:       'Ovo - Vegetarian',
  lacto_ovo_vegetarian: 'Lacto-ovo\nVegetarian',
  pesco_vegetarian:     'Pesco - Vegetarian',
  pollo_vegetarian:     'Pollo - Vegetarian',
  flexitarian:          'Flexitarian',
};

export const VEGAN_LABELS: Record<NonNullable<SurveyParams['veganStrictness']>, string> = {
  strict:   'Strict Vegan',
  flexible: 'Flexible Vegan',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function VegetarianDietConfirmCircle({ label }: { label: string }) {
  const drawProgress = useSharedValue(0);
  const liquidPhase  = useSharedValue(0);

  useEffect(() => {
    // stroke draw-in (one-shot, 1.4s)
    drawProgress.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    // gradient hot-spot drift (sawtooth 0→1, sin ensures seamless loop)
    liquidPhase.value = withRepeat(
      withTiming(1, { duration: 6500, easing: Easing.linear }),
      -1,
      false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Orb hot-spot positions — each cx/cy drifts on a lissajous-like orbit ──
  // Orb 1 (#7EC850 lime): horizontal-biased orbit
  const orb1AP = useAnimatedProps(() => {
    const t = liquidPhase.value;
    return {
      cx: CX + Math.sin(t * Math.PI * 2) * 55,
      cy: CY + Math.cos(t * Math.PI * 2 * 0.87) * 38,
    };
  });

  // Orb 2 (#D4ED7A yellow-green): tighter, faster-Y orbit
  const orb2AP = useAnimatedProps(() => {
    const t = liquidPhase.value + 0.33;
    return {
      cx: CX + Math.sin(t * Math.PI * 2) * 48,
      cy: CY + Math.cos(t * Math.PI * 2 * 1.15) * 52,
    };
  });

  // Orb 3 (#4EC8A0 teal): wider, slower-Y orbit
  const orb3AP = useAnimatedProps(() => {
    const t = liquidPhase.value + 0.67;
    return {
      cx: CX + Math.sin(t * Math.PI * 2) * 65,
      cy: CY + Math.cos(t * Math.PI * 2 * 0.93) * 44,
    };
  });

  // Stroke draw-in
  const strokeAP = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMF * (1 - drawProgress.value),
  }));

  return (
    <View style={styles.wrapper}>

      {/* ── Layer 0: animated radial gradient orbs + wave ripples ──────── */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Clip everything to the circle boundary */}
          <ClipPath id="circClip">
            <Circle cx={CX} cy={CY} r={RADIUS} />
          </ClipPath>

          {/* Orb 1 — lime green */}
          <AnimatedRadialGradient
            id="og1"
            animatedProps={orb1AP}
            r={135}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor="#7EC850" stopOpacity="0.78" />
            <Stop offset="38%"  stopColor="#7EC850" stopOpacity="0.48" />
            <Stop offset="68%"  stopColor="#7EC850" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#7EC850" stopOpacity="0"    />
          </AnimatedRadialGradient>

          {/* Orb 2 — yellow-green */}
          <AnimatedRadialGradient
            id="og2"
            animatedProps={orb2AP}
            r={128}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor="#D4ED7A" stopOpacity="0.72" />
            <Stop offset="36%"  stopColor="#D4ED7A" stopOpacity="0.44" />
            <Stop offset="66%"  stopColor="#D4ED7A" stopOpacity="0.13" />
            <Stop offset="100%" stopColor="#D4ED7A" stopOpacity="0"    />
          </AnimatedRadialGradient>

          {/* Orb 3 — teal */}
          <AnimatedRadialGradient
            id="og3"
            animatedProps={orb3AP}
            r={145}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%"   stopColor="#4EC8A0" stopOpacity="0.74" />
            <Stop offset="40%"  stopColor="#4EC8A0" stopOpacity="0.45" />
            <Stop offset="70%"  stopColor="#4EC8A0" stopOpacity="0.14" />
            <Stop offset="100%" stopColor="#4EC8A0" stopOpacity="0"    />
          </AnimatedRadialGradient>
        </Defs>

        <G clipPath="url(#circClip)">
          {/* Full-area rects — gradient hot-spot fills the entire circle */}
          <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#og1)" />
          <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#og2)" />
          <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#og3)" />

        </G>
      </Svg>

      {/* ── Layer 1: line stroke circle (original, untouched) ────────────── */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={CX} cy={CY} r={RADIUS}
          stroke={PRIMARY} strokeWidth={1} fill="none" opacity={0.15}
        />
        <AnimatedCircle
          cx={CX} cy={CY} r={RADIUS}
          stroke={PRIMARY} strokeWidth={1.5} fill="none"
          strokeDasharray={CIRCUMF}
          animatedProps={strokeAP}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CX}, ${CY}`}
        />
      </Svg>

      {/* ── Layer 2: selected option text (original, untouched) ──────────── */}
      <Text style={styles.circleText}>
        <Text style={styles.quoteChar}>{'"'}</Text>
        {label}
        <Text style={styles.quoteChar}>{'"'}</Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleText: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: 32,
    zIndex: 1,
  },
  quoteChar: { fontSize: 26, fontWeight: '700', color: PRIMARY },
});
