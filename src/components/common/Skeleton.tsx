import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

type SizeValue = number | `${number}%`;

type SkeletonProps = {
  width?: SizeValue;
  height?: SizeValue;
  borderRadius?: number;
  /** base color before opacity is applied — defaults to neutral gray (#D9D9D9). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Loading placeholder that pulses opacity while data is fetching.
 *
 * 사이즈는 실제 표시될 UI 와 일치시켜 layout shift 를 방지한다.
 * Native driver 기반 opacity 애니메이션이라 JS thread 와 무관하게 매끄럽다.
 */
export default function Skeleton({
  width,
  height,
  borderRadius = 4,
  color = '#D9D9D9',
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.95, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}
