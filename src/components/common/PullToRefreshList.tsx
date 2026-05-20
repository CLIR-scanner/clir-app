import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  RefreshControl,
  FlatListProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/colors';

// 당김 거리 비례 원형 진행바 + 임계점 햅틱 + onRefresh.
// iOS: 상단 바운스 오버스크롤(-contentOffset.y)로 당김거리 산출 → 진행바가
//      늘었다 줄었다, 임계점 도달 시 Heavy 햅틱, 손 떼면 새로고침.
//      로딩 동안엔 손 놓은 그 지점에 리스트를 멈춰 유지 → 완료 시 복귀.
// Android: 바운스가 없어 표준 RefreshControl 로 폴백(기능 동일, 링은 iOS 전용).
// 스크롤만 관찰하므로 FlatList 제스처와 충돌 없음.
// 색상은 앱 디자인 시스템(Colors) 토큰 사용 — 하드코딩 금지 규칙 준수.

const THRESHOLD = 92;            // 이 거리 이상 당기면 새로고침 arm (= 홀드 하한)
const RING = 34;
const STROKE = 3;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const SPINNER_ARC = 0.22;        // 로딩 중 회전 호 비율
// 브랜드 딥그린 / 뉴트럴-그린 트랙 (search·profile·list 화면 공통 팔레트)
const RING_COLOR = Colors.searchDarkGreen;
const TRACK_COLOR = Colors.searchBorder;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props<T> = FlatListProps<T> & {
  /** 임계점 초과 후 손 뗐을 때 호출. 완료(resolve)까지 진행바·홀드 유지. */
  onRefresh: () => Promise<unknown>;
  ringColor?: string;
  trackColor?: string;
};

export default function PullToRefreshList<T>({
  onRefresh,
  ringColor = RING_COLOR,
  trackColor = TRACK_COLOR,
  contentContainerStyle,
  ...listProps
}: Props<T>) {
  const progress = useSharedValue(0); // 0..1 (당김 비례)
  const pull     = useSharedValue(0); // px
  const hold     = useSharedValue(0); // 로딩 중 리스트를 눌러 유지하는 높이(px)
  const armed    = useSharedValue(0); // 1 = 임계점 초과(놓으면 새로고침)
  const busy     = useSharedValue(0); // 1 = 새로고침 진행 중
  const spin     = useSharedValue(0); // 진행 중 회전

  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  // 커스텀 링/홀드는 iOS 바운스 전제 — Android 는 네이티브 RefreshControl 만
  // 사용(이중 인디케이터·리스트 밀림 방지).
  const isIOS = Platform.OS === 'ios';

  const haptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // hold(앵커)·busy 즉시 세팅은 onEndDrag worklet 이 담당(runOnJS 지연 없이).
  // 여기선 JS 측 상태/스피너/onRefresh 만 처리.
  const beginRefresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    busy.value = 1;                       // Android RefreshControl 경로 대비(중복 무해)
    setRefreshing(true);
    progress.value = withTiming(1, { duration: 160 });
    spin.value = 0;
    spin.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.linear }), -1, false);
    Promise.resolve(onRefresh())
      .catch(() => { /* 화면별 onRefresh 가 자체 에러 처리 — 여기선 무시 */ })
      .finally(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        busy.value = 0;
        armed.value = 0;
        progress.value = withTiming(0, { duration: 220 });
        // 기본 스크롤 상태로 복귀
        hold.value = withTiming(0, { duration: 320, easing: Easing.inOut(Easing.cubic) });
      });
  }, [onRefresh, progress, spin, busy, armed, hold]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      const y = e.contentOffset.y;
      const p = y < 0 ? -y : 0;          // iOS 상단 바운스만 양수
      pull.value = p;
      if (busy.value === 1) return;       // 새로고침 중엔 진행바 고정(1)
      progress.value = Math.min(1, p / THRESHOLD);
      if (progress.value >= 1 && armed.value === 0) {
        armed.value = 1;
        runOnJS(haptic)();                // 임계점 "닿으면" 햅틱
      } else if (progress.value < 0.5 && armed.value === 1) {
        armed.value = 0;                  // 다시 당기면 재-arm 가능
      }
    },
    onEndDrag: () => {
      if (armed.value === 1 && busy.value === 0) {
        busy.value = 1;                              // 즉시 — 추가 arm/progress 차단
        hold.value = Math.max(THRESHOLD, pull.value); // 손 놓은 그 지점을 앵커로 고정
        runOnJS(beginRefresh)();                      // JS 측 상태·onRefresh
      }
    },
  });

  // 손 놓은 지점(hold=앵커)에 시각 고정: 네이티브 바운스(pull)가 0으로
  // 복귀하는 만큼 translate 를 키워 상쇄 → 변위 = pull + (hold-pull) = hold 상수.
  // 점프·오버슈트 없음. 완료 시 hold 가 0 으로 withTiming → 부드럽게 원위치.
  // (Android 는 RefreshControl 자체 inset 사용 — 밀지 않음)
  const listWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: isIOS ? Math.max(0, hold.value - pull.value) : 0 }],
  }));

  // 링은 "보이는 갭(당김 또는 홀드)" 정중앙에 위치 — 드래그↔로딩 전환이 연속적
  const ringWrapStyle = useAnimatedStyle(() => {
    const gap = Math.max(Math.min(pull.value, THRESHOLD), hold.value);
    const shown = busy.value === 1 ? 1 : progress.value;
    return {
      opacity: interpolate(shown, [0, 0.12, 1], [0, 0.5, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: Math.max(0, gap) / 2 - RING / 2 },
        { scale: interpolate(shown, [0, 1], [0.7, 1], Extrapolation.CLAMP) },
        { rotate: `${spin.value * 360}deg` },
      ],
    };
  });

  // 당기는 중: 당김 비례로 채워짐. 로딩 중: 얇은 호가 회전(스피너).
  const circleProps = useAnimatedProps(() => {
    const ratio = busy.value === 1 ? SPINNER_ARC : progress.value;
    return { strokeDashoffset: CIRC * (1 - ratio) };
  });

  // reanimated FlatList 의 제네릭 타입 마찰 회피 — 항목 타입은 listProps 가 보장.
  const AnimatedFlatList = Animated.FlatList as unknown as React.ComponentType<
    FlatListProps<T> & { onScroll?: unknown }
  >;

  return (
    <View style={styles.root}>
      {isIOS && (
        <Animated.View style={[styles.ringWrap, ringWrapStyle]} pointerEvents="none">
          <Svg width={RING} height={RING}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={trackColor} strokeWidth={STROKE} fill="none" />
            <AnimatedCircle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              stroke={ringColor}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              animatedProps={circleProps}
              // 12시 방향에서 시작하도록 -90deg 회전
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            />
          </Svg>
        </Animated.View>
      )}

      <Animated.View style={[styles.listWrap, listWrapStyle]}>
        <AnimatedFlatList
          {...listProps}
          contentContainerStyle={contentContainerStyle}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            Platform.OS === 'android' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={beginRefresh}
                tintColor={ringColor}
                colors={[ringColor]}
              />
            ) : undefined
          }
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listWrap: { flex: 1 },
  ringWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
});
