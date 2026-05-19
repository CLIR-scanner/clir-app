import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { getScanButtonAnchor } from '../../lib/scanButtonAnchor';
import { splashHandoff } from '../../lib/splashHandoff';
import ScanGlyph, { SCAN_GLYPH_C_H, SCAN_GLYPH_VIEWBOX } from './ScanGlyph';

// 런치 스플래시 → 앱으로의 유기적 전환 오버레이.
// 1) 인트로(Focus→Lock→Resolve, 약 2.9s) → 2) 로딩 미완이면 hold →
// 3) 워드마크가 C 로 collapse 하며 "탭과 동일한 ScanGlyph"로 크로스페이드 →
// 4) 그 ScanGlyph 가 실측한 스캔 탭 버튼 위치/크기로 정확히 tuck + 배경 페이드아웃 →
// 5) 종료. 마지막 글리프가 실제 탭 버튼과 동일 path/viewBox/크기/위치 → 끊김 없음.
// (스캔 탭 아이콘 자체는 변경하지 않음 — 스플래시가 탭의 글리프에 맞춰 들어간다)
const DARK = '#1C3A19';
const BG   = '#F9FFF3';
// 스캔 탭/촬영 글리프 색(= MainNavigator SCAN_COLOR = profileDarkGreen). 핸드오프 색 일치.
const SCAN_COLOR = '#1C3A19';

const C_PATH   = 'M0 31.0075C0 47.8494 13.7079 61.5417 30.5689 61.5417V42.7332C24.3367 42.7332 19.2739 37.6762 19.2739 31.4511C19.2739 25.226 24.3367 20.169 30.5689 20.169V0.458496C13.7079 0.458496 0 14.1656 0 31.0075Z';
const DOT_PATH = 'M33.1447 23.9987V24.9598V37.9276V38.8887C37.26 38.8887 40.6055 35.547 40.6055 31.4363C40.6055 27.3256 37.26 23.9839 33.1447 23.9839V23.9987Z';
const L_PATH   = 'M55.1486 0V62H48.6055V0H55.1486Z';
const I_PATH   = 'M65.9846 10.1141C66.858 9.22691 67.9239 8.7981 69.1822 8.7981C70.4404 8.7981 71.5063 9.24169 72.3797 10.1141C73.2531 11.0013 73.6824 12.0511 73.6824 13.2932C73.6824 14.5353 73.2531 15.5112 72.3797 16.3688C71.5063 17.2264 70.4404 17.6552 69.1822 17.6552C67.9239 17.6552 66.858 17.2264 65.9846 16.3688C65.1112 15.5112 64.6819 14.4909 64.6819 13.2932C64.6819 12.0955 65.1112 11.0013 65.9846 10.1141ZM72.4685 28.5677V62.0001H65.9254V28.5677H72.4685Z';
const R_PATH   = 'M89.9364 28.5675V33.9942H90.1585C90.9874 31.998 92.2013 30.4158 93.8297 29.2773C95.4581 28.1387 97.3381 27.562 99.4698 27.562C101.32 27.562 103.111 28.1091 104.858 29.2033L101.868 35.0588C100.802 34.1568 99.4698 33.6984 97.871 33.6984C96.1686 33.6984 94.7623 34.0385 93.652 34.7335C92.5418 35.4285 91.7276 36.4044 91.2095 37.6612C90.7062 38.9181 90.3657 40.1602 90.1881 41.3726C90.0104 42.5851 89.9364 43.9751 89.9364 45.5572V61.9851H83.3933V28.5527H89.9364V28.5675Z';

// ── 튜닝 상수 (Fast Refresh 로 미세 조정) ───────────────────────────────────────
const LOGO_W = 150 * 0.35; // 전체 로고 크기 0.35배 (파생 상수·tuck 수학 자동 스케일)
const LOGO_H = (LOGO_W * 62) / 105;
const K = LOGO_W / 105;                              // px per viewBox unit
// 워드마크 viewBox(105x62) 안 C+dot 의 실제 bbox
const C_BBOX_CX_U = 40.6055 / 2;                     // C+dot 중심 x (units)
const C_BBOX_CY_U = (0.458496 + 61.5417) / 2;        // 중심 y ≈ 31 (= 박스 세로중심)
const C_BBOX_H_U  = 61.5417 - 0.458496;              // C 높이 (units)
const SPLASH_C_H  = C_BBOX_H_U * K;                  // 스플래시 C 화면 높이(px)
// 컨테이너(LOGO_W×LOGO_H) 내부 — 브랜드 C 중심 좌표(px). 변환원점=컨테이너중심.
const C_CENTER_X  = C_BBOX_CX_U * K;
const C_CENTER_Y  = C_BBOX_CY_U * K;
const C_OFFSET_X  = C_CENTER_X - LOGO_W / 2;         // 컨테이너중심 대비 x오프셋(음수)
// ScanGlyph 레이어 크기 — 그 안의 C 가 스플래시 C 높이와 같아 보이도록.
const SG_SIZE = (SPLASH_C_H * SCAN_GLYPH_VIEWBOX) / SCAN_GLYPH_C_H;
// ScanGlyph 박스를 브랜드 C 중심에 정렬 (제자리 크로스페이드)
const SG_LEFT = C_CENTER_X - SG_SIZE / 2;
const SG_TOP  = C_CENTER_Y - SG_SIZE / 2;

const SCAN_BTN_FROM_BOTTOM = 46;   // 폴백용 탭바 근사 위치
const FALLBACK_TAB_SVG = 60;       // 폴백 시 가정하는 탭 글리프 Svg 크기
const TUCK_X_NUDGE = 0;            // 실기기 미세 보정
const TUCK_Y_NUDGE = 0;

// 인트로 (calm Focus→Lock→Resolve, 총 ≈ 1.37s — 단축된 현재 기준 유지)
const MARK_IN = 520;
const SETTLE_UP = 180;
const SETTLE_DN = 200;
const WORD_IN = 710;
const HOLD_BEAT = 140;
// 아웃트로
const COLLAPSE = 280;       // lir 만 접힘 (브랜드 C 는 유지)
const TUCK = 820;           // C 가 스캔버튼으로 축소·이동
const CROSSFADE_DELAY = 70; // tuck 시작 후 잠깐 뒤부터
const CROSSFADE = 520;      // 이동 중 브랜드 C → ScanGlyph (움직임이 모양차를 가림)
const BG_FADE = 500;
const BG_FADE_DELAY = 280;
const LOGO_FADE = 150;
const REDUCED_HOLD = 1200;

export default function SplashOverlay({
  ready,
  onFinished,
}: {
  ready: boolean;
  onFinished: () => void;
}) {
  const { width: SW, height: SH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale   = useRef(new Animated.Value(0.92)).current;
  const settle      = useRef(new Animated.Value(1)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordTX      = useRef(new Animated.Value(-8)).current;
  const scanOpacity = useRef(new Animated.Value(0)).current;
  const groupScale  = useRef(new Animated.Value(1)).current;
  const groupTX     = useRef(new Animated.Value(0)).current;
  const groupTY     = useRef(new Animated.Value(0)).current;
  const bgOpacity   = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  const [introDone, setIntroDone] = useState(false);
  const reducedRef = useRef(false);
  const outroStarted = useRef(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    splashHandoff.markDone(); // 어떤 종료 경로든 탭 아이콘은 반드시 채워지도록(방어)
    onFinished();
  };

  // 인트로
  useEffect(() => {
    let active = true;
    splashHandoff.reset(); // 스플래시 (재)시작 → 핸드오프 전까지 탭 아이콘 숨김
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduced => {
        if (!active) return;
        reducedRef.current = reduced;
        if (reduced) {
          markOpacity.setValue(1);
          markScale.setValue(1);
          wordOpacity.setValue(1);
          wordTX.setValue(0);
          setTimeout(() => active && setIntroDone(true), REDUCED_HOLD);
          return;
        }
        Animated.sequence([
          Animated.parallel([
            Animated.timing(markOpacity, { toValue: 1, duration: MARK_IN, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(markScale,   { toValue: 1, duration: MARK_IN, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(settle, { toValue: 1.03, duration: SETTLE_UP, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
              Animated.timing(settle, { toValue: 1,    duration: SETTLE_DN, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ]),
            Animated.timing(wordOpacity, { toValue: 1, duration: WORD_IN, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(wordTX,      { toValue: 0, duration: WORD_IN, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.delay(HOLD_BEAT),
        ]).start(({ finished }) => {
          if (finished && active) setIntroDone(true);
        });
      })
      .catch(() => {
        if (!active) return;
        markOpacity.setValue(1); markScale.setValue(1);
        wordOpacity.setValue(1); wordTX.setValue(0);
        setTimeout(() => active && setIntroDone(true), REDUCED_HOLD);
      });
    return () => { active = false; };
  }, [markOpacity, markScale, settle, wordOpacity, wordTX]);

  // 인트로 끝 + 앱 준비 완료 → 아웃트로(collapse+crossfade → tuck → reveal)
  useEffect(() => {
    if (!introDone || !ready || outroStarted.current) return;
    outroStarted.current = true;

    const anchor = getScanButtonAnchor();
    let scaleTarget: number;
    let tuckTX: number;
    let tuckTY: number;
    if (anchor) {
      // 실측: 오버레이 ScanGlyph 박스를 탭 ScanIcon Svg 박스(=glyphSvg, 원중심)와
      // 동일 크기/중심으로 매핑 → 동일 path/viewBox 라 픽셀 일치.
      scaleTarget = anchor.glyphSvg / SG_SIZE;
      tuckTX = (anchor.cx - SW / 2) - C_OFFSET_X * scaleTarget + TUCK_X_NUDGE;
      tuckTY = (anchor.cy - SH / 2) + TUCK_Y_NUDGE;
    } else {
      // 폴백: 탭바 위치 근사 (앵커 측정 전 / 스캔버튼 없는 경로)
      scaleTarget = FALLBACK_TAB_SVG / SG_SIZE;
      const targetY = SH - (insets.bottom + SCAN_BTN_FROM_BOTTOM);
      tuckTX = -C_OFFSET_X * scaleTarget + TUCK_X_NUDGE;
      tuckTY = (targetY - SH / 2) + TUCK_Y_NUDGE;
    }

    if (reducedRef.current) {
      Animated.timing(bgOpacity, { toValue: 0, duration: BG_FADE, easing: Easing.out(Easing.quad), useNativeDriver: true })
        .start(() => finish());
      return;
    }

    Animated.sequence([
      // 3) lir 만 접힘 (브랜드 C 는 그대로 — 아직 변형 안 함)
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 0, duration: COLLAPSE, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(wordTX,      { toValue: -8, duration: COLLAPSE, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      // 4) C 가 스캔버튼으로 축소·이동 + "이동 중에" 브랜드 C → ScanGlyph 크로스페이드
      //    (정지가 아닌 움직임·축소 중 변형 → 미세 모양차가 자연스럽게 묻힘) + 배경 페이드
      Animated.parallel([
        Animated.timing(groupScale, { toValue: scaleTarget, duration: TUCK, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(groupTX,    { toValue: tuckTX,     duration: TUCK, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(groupTY,    { toValue: tuckTY,     duration: TUCK, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(CROSSFADE_DELAY),
          Animated.parallel([
            Animated.timing(markOpacity, { toValue: 0, duration: CROSSFADE, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
            Animated.timing(scanOpacity, { toValue: 1, duration: CROSSFADE, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(BG_FADE_DELAY),
          Animated.timing(bgOpacity, { toValue: 0, duration: BG_FADE, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      // 이동 완료 시점에서야 실제 탭 아이콘을 채운다(그 전까지 빈 원).
      // 오버레이 ScanGlyph 가 그 자리에 픽셀 일치로 있으므로 한 개의 C 만 보임.
      splashHandoff.markDone();
      // 동일 글리프 위에서 오버레이를 짧게 페이드 → 끊김 없는 핸드오프 후 종료.
      Animated.timing(logoOpacity, { toValue: 0, duration: LOGO_FADE, easing: Easing.linear, useNativeDriver: true })
        .start(() => finish());
    });
  }, [introDone, ready, SW, SH, insets.bottom, bgOpacity, groupScale, groupTX, groupTY, logoOpacity, markOpacity, scanOpacity, wordOpacity, wordTX]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.bg, { opacity: bgOpacity }]} />
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [
              { translateX: groupTX },
              { translateY: groupTY },
              { scale: groupScale },
              { scale: settle },
            ],
          }}
        >
          <View style={{ width: LOGO_W, height: LOGO_H }}>
            {/* 브랜드 마크(C+dot) — 인트로/holding */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: markOpacity, transform: [{ scale: markScale }] }]}
            >
              <Svg width={LOGO_W} height={LOGO_H} viewBox="0 0 105 62" fill="none">
                <Path d={C_PATH} fill={DARK} />
                <Path d={DOT_PATH} fill={DARK} />
              </Svg>
            </Animated.View>
            {/* 워드마크 lir */}
            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: wordOpacity, transform: [{ translateX: wordTX }] }]}
            >
              <Svg width={LOGO_W} height={LOGO_H} viewBox="0 0 105 62" fill="none">
                <Path d={L_PATH} fill={DARK} />
                <Path d={I_PATH} fill={DARK} />
                <Path d={R_PATH} fill={DARK} />
              </Svg>
            </Animated.View>
            {/* 탭과 동일한 ScanGlyph — collapse 때 제자리 크로스페이드 후 tuck */}
            <Animated.View
              style={{
                position: 'absolute',
                left: SG_LEFT,
                top: SG_TOP,
                width: SG_SIZE,
                height: SG_SIZE,
                opacity: scanOpacity,
              }}
            >
              <ScanGlyph size={SG_SIZE} color={SCAN_COLOR} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: BG },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
