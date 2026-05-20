import React from 'react';
import Svg, { Path } from 'react-native-svg';

// 스캔 탭/촬영 버튼과 "완전히 동일"한 스캔 글리프(C + dot + arc, viewBox 0 0 83 83).
// 스캔 탭 아이콘은 변경하지 않는다는 전제 하에, 스플래시가 전환 마지막에 이 동일
// 글리프로 크로스페이드하여 실제 버튼과 픽셀 일치(끊김 없는 핸드오프)시키기 위함.
// path 는 MainNavigator.ScanIcon / ScanScreen.ScanButtonIcon 의 원본과 동일.
const SCAN_GLYPH_VB = 83;
// 글리프 안 C 의 세로 범위 (y: 8.18311 ~ 74.7512) — 스플래시 C 와 크기 매칭용.
export const SCAN_GLYPH_C_TOP = 8.18311;
export const SCAN_GLYPH_C_BOTTOM = 74.7512;
export const SCAN_GLYPH_C_H = SCAN_GLYPH_C_BOTTOM - SCAN_GLYPH_C_TOP; // ≈ 66.57
export const SCAN_GLYPH_VIEWBOX = SCAN_GLYPH_VB;

export default function ScanGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 83 83" fill="none">
      <Path
        d="M8.18311 41.4672C8.18311 59.8258 23.1086 74.7512 41.4672 74.7512V54.2489C34.6814 54.2489 29.169 48.7365 29.169 41.9507C29.169 35.165 34.6814 29.6525 41.4672 29.6525V8.18311C23.1086 8.18311 8.18311 23.1086 8.18311 41.4672Z"
        fill={color}
      />
      <Path
        d="M44.2715 33.8266V34.8743V49.0099V50.0576C48.7523 50.0576 52.3951 46.4149 52.3951 41.9341C52.3951 37.4532 48.7523 33.8105 44.2715 33.8105V33.8266Z"
        fill={color}
      />
      <Path
        d="M44.4229 53.7755C51.202 53.7755 56.6975 48.4108 56.6975 41.7931C56.6975 35.1754 51.202 29.8107 44.4229 29.8107"
        stroke={color}
        strokeWidth={2.11268}
      />
    </Svg>
  );
}
