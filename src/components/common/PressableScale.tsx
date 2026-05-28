import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** 눌렀을 때 축소될 scale 값 (기본 0.96). */
  scaleTo?: number;
}

/**
 * 누르면 살짝 축소(scale)되는 Pressable — 기본 CTA 버튼의 촉각 피드백용.
 *
 * style·transform 을 같은 노드(Animated Pressable)에 적용하므로 기존 레이아웃을
 * 그대로 보존한다 (marginTop:auto / 절대배치 등). Native driver spring 이라 매끄럽다.
 */
export default function PressableScale({
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(toValue: number) {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e: GestureResponderEvent) => { animateTo(scaleTo); onPressIn?.(e); }}
      onPressOut={(e: GestureResponderEvent) => { animateTo(1); onPressOut?.(e); }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
