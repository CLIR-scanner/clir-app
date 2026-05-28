import React, { useRef } from 'react';
import { Animated, ImageProps, NativeSyntheticEvent, ImageLoadEventData } from 'react-native';

/**
 * 로드 완료 시 opacity 0 → 1 로 부드럽게 페이드되는 이미지.
 * 컨테이너의 placeholder 배경(회색) 위에서 흰 깜빡임 없이 매끄럽게 나타난다.
 *
 * RN 기본 Image 대체용 — props 동일. Native driver opacity 라 JS thread 와 무관.
 * (expo-image 미도입 — 추가 의존성 없이 동일한 체감 효과.)
 */
export default function FadeInImage({ style, onLoad, ...props }: ImageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  function handleLoad(e: NativeSyntheticEvent<ImageLoadEventData>) {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    onLoad?.(e);
  }

  return <Animated.Image {...props} onLoad={handleLoad} style={[style, { opacity }]} />;
}
