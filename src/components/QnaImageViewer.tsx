/**
 * Q&A 첨부 이미지 풀스크린 viewer.
 *
 * - 가로 스와이프(paging) — 여러 장 사이 이동
 * - pinch 줌 (1x~4x) + 줌 상태에서 pan 으로 이동
 * - 인덱서 dot + N/M 카운터
 * - 우상단 ✕ 또는 backdrop 외부 탭으로 닫기
 *
 * gesture-handler/reanimated 가 이미 App.tsx 의 GestureHandlerRootView 안에서 동작.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MAX_SCALE = 4;
const MIN_SCALE = 1;

function ZoomableImage({ uri }: { uri: string }) {
  const scale            = useSharedValue(1);
  const savedScale       = useSharedValue(1);
  const translateX       = useSharedValue(0);
  const translateY       = useSharedValue(0);
  const savedTranslateX  = useSharedValue(0);
  const savedTranslateY  = useSharedValue(0);

  const resetTransform = () => {
    'worklet';
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = Math.max(MIN_SCALE, Math.min(savedScale.value * e.scale, MAX_SCALE));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) resetTransform();
    });

  // 줌 상태에서만 pan 활성. minPointers(1) 단일 손가락.
  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (scale.value > MIN_SCALE) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

interface Props {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function QnaImageViewer({ visible, images, initialIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<string>>(null);

  // visible 또는 initialIndex 변경 시 초기 위치로 점프 (애니메이션 없이 즉시).
  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    // FlatList ref 는 첫 렌더 직후 set — setTimeout 으로 다음 tick.
    const handle = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * SCREEN_W,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(handle);
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={uri => uri}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            if (idx !== currentIndex) setCurrentIndex(idx);
          }}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: i * SCREEN_W, index: i })}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <ZoomableImage uri={item} />
            </View>
          )}
          // pinch/pan 과 FlatList 가로 스크롤이 경쟁 — 줌 중엔 가로 스크롤 비활성화
          // 까지는 안 했지만 1x 미만으로 떨어지면 resetTransform 으로 가로 스와이프 회복.
        />

        {images.length > 1 && (
          <>
            <View style={styles.indexerWrap} pointerEvents="none">
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.indexerDot, i === currentIndex && styles.indexerDotActive]}
                />
              ))}
            </View>
            <View style={styles.counterWrap} pointerEvents="none">
              <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeText: { color: '#FFFFFF', fontSize: 18, lineHeight: 20 },
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: { width: SCREEN_W, height: SCREEN_H },
  fullImage: { width: '100%', height: '100%' },
  indexerWrap: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indexerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  indexerDotActive: { backgroundColor: '#FFFFFF', width: 16 },
  counterWrap: {
    position: 'absolute',
    top: 50,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  counterText: { color: '#FFFFFF', fontSize: 12 },
});
